import { expect, describe, it } from "vitest";
import {
  computeHistory, computeOverspends, type HistorySection,
} from "../../src/lib/history";
import { txnChildren, contreSensNodes } from "../../src/lib/history-detail";
import { computeForecast, type Group, type Txn } from "../../src/lib/forecast";
import { postesPourSaisie } from "../../src/lib/group-options";
import { seedDated, mergeDated } from "./dated-fixtures";

// --- Le remboursement posé dans un poste de dépense --------------------------
// Une transaction ENTRANTE peut se ranger dans un poste de dépense : quelqu'un
// rembourse sa part des vacances, l'argent revient, et il revient DANS le poste
// qui l'a payé. Le poste s'équilibre d'autant, et le remboursement quitte « Ce
// qui rentre » — il n'est pas un revenu, il est une dépense qu'on récupère.
//
// La règle tient en une phrase : ce qu'une transaction pèse dans son poste se
// compte dans le SENS de ce poste. Pour une dépense, une sortie ajoute et une
// entrée retire ; pour un revenu, l'inverse.

const vacances: Group = {
  id: 1, accountId: "a1", name: "Vacances Amsterdam", direction: "out",
  monthlyAmount: 1200, lines: [],
};
const abos: Group = {
  id: 2, accountId: "a1", name: "Abonnements", direction: "out",
  monthlyAmount: 30,
  lines: [{ id: 21, name: "Spotify", amount: 30 }],
};
const salaire: Group = {
  id: 9, accountId: "a1", name: "Salaire", direction: "in",
  monthlyAmount: 2000, lines: [],
};

function tx(p: Partial<Txn>): Txn {
  return { id: "t", date: "2026-07-05", amount: -10, label: "", accountId: "a1", groupId: null, ...p };
}

const MOIS = ["2026-07", "2026-08"];
const hist = (groups: Group[], txns: Txn[]) => {
  const { dated, datedLines } = seedDated(groups);
  return computeHistory(groups, txns, MOIS, "2026-07", mergeDated(dated), datedLines);
};
const ligne = (secs: HistorySection[], kind: HistorySection["kind"], nom: string) =>
  secs.find((s) => s.kind === kind)!.rows.find((r) => r.name === nom)!;
const recusNonCategorises = (secs: HistorySection[]) =>
  secs.find((s) => s.kind === "uncategorized" && s.uncatDirection === "in");

describe("Le remboursement rangé dans un poste de dépense", () => {
  const depense = tx({ id: "a", date: "2026-07-03", amount: -1200, label: "Hôtel", groupId: 1 });
  const remboursement = tx({ id: "b", date: "2026-07-10", amount: 200, label: "Virement Léa", groupId: 1 });

  it("devrait retrancher le remboursement du dépensé du poste", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    expect(r.cells[0].depense).toBe(1000);
  });

  it("devrait rendre au poste ce que le remboursement lui a redonné", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    // Budget 1200, dépensé net 1000 : il reste 200 à dépenser.
    expect(r.cells[0].balance).toBe(200);
  });

  it("devrait afficher à part ce que le poste s'est fait rembourser", () => {
    // Le montant se lit dans la colonne Reçu de la ligne du poste, à son montant
    // entier. Il est DÉJÀ retranché du dépensé : il ne se rajoute à rien, il dit
    // seulement d'où vient l'écart entre les transactions et le dépensé affiché.
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    expect(r.cells[0].rembourse).toBe(200);
    expect(r.cells[0].depense).toBe(1000);
    expect(r.cells[0].balance).toBe(200);
  });

  it("ne devrait jamais faire entrer le remboursement dans le reçu qui nourrit les soldes", () => {
    // `recu` est ce que lisent le mouvement du mois et la chaîne de soldes. Y verser
    // le remboursement le compterait deux fois : une fois en moins du dépensé, une
    // fois en plus des rentrées.
    const secs = hist([vacances], [depense, remboursement]);
    const r = ligne(secs, "expense", "Vacances Amsterdam");
    expect(r.cells[0].recu).toBe(0);
    expect(secs.find((s) => s.kind === "expense")!.totals[0].recu).toBe(0);
  });

  it("devrait garder le remboursement visible sous le poste", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    expect(r.txns.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });

  it("devrait retirer le remboursement de ce qui rentre", () => {
    const secs = hist([vacances, salaire], [depense, remboursement]);
    expect(recusNonCategorises(secs)).toBeUndefined();
    expect(ligne(secs, "income", "Salaire").cells[0].recu).toBe(0);
  });

  it("devrait laisser dans ce qui rentre un remboursement qu'on n'a rangé nulle part", () => {
    const secs = hist([vacances, salaire], [depense, { ...remboursement, groupId: null }]);
    expect(recusNonCategorises(secs)!.totals[0].recu).toBe(200);
  });

  it("devrait éteindre le dépassement que le remboursement vient de combler", () => {
    const trop = tx({ id: "c", date: "2026-07-04", amount: -300, label: "Musée", groupId: 1 });
    const { dated, datedLines } = seedDated([vacances]);
    const avant = computeOverspends([vacances], [depense, trop], "2026-07", mergeDated(dated), datedLines);
    expect(avant.byMonth["2026-07"]?.[0].amount).toBe(300);
    const apres = computeOverspends(
      [vacances], [depense, trop, { ...remboursement, amount: 300 }], "2026-07", mergeDated(dated), datedLines,
    );
    expect(apres.byMonth["2026-07"]).toBeUndefined();
  });

  it("devrait descendre le remboursement en négatif dans le calcul du dépensé", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    const enfants = txnChildren(r, "2026-07", 1, 0)!;
    expect(enfants.find((n) => n.label.includes("Virement Léa"))!.amount).toBe(-200);
    expect(enfants.reduce((s, n) => s + n.amount, 0)).toBe(1000);
  });

  it("devrait décomposer la case Remboursé sur les seuls encaissements du poste", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    const noeuds = contreSensNodes(r, "2026-07", "in", 0)!;
    expect(noeuds.map((n) => n.amount)).toEqual([200]);
    expect(noeuds[0].label).toContain("Virement Léa");
    expect(noeuds[0].ref).toBe("txn:b::recu::0");
  });

  it("ne devrait rien décomposer là où rien n'est venu à contre-sens", () => {
    const r = ligne(hist([vacances], [depense]), "expense", "Vacances Amsterdam");
    expect(contreSensNodes(r, "2026-07", "in", 0)).toBeUndefined();
  });

  it("devrait renvoyer le remboursement vers sa case de la colonne Reçu", () => {
    // Le montant compte en moins, mais il s'affiche dans Reçu, à son montant entier :
    // c'est de l'argent qui est rentré. Le renvoi doit désigner CETTE case, sinon
    // cliquer la ligne du calcul surlignerait une case vide.
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    const enfants = txnChildren(r, "2026-07", 1, 0)!;
    expect(enfants.find((n) => n.label.includes("Virement Léa"))!.ref).toBe("txn:b::recu::0");
    expect(enfants.find((n) => n.label.includes("Hôtel"))!.ref).toBe("txn:a::depense::0");
  });

  it("devrait rendre au poste, dans la prévision, ce qui lui reste vraiment à dépenser", () => {
    const { dated, datedLines } = seedDated([vacances]);
    const f = computeForecast(
      "a1", 5000, [vacances], [depense, remboursement], "2026-07", mergeDated(dated), datedLines,
    );
    expect(f.groups.find((g) => g.name === "Vacances Amsterdam")!.spent).toBe(1000);
  });
});

describe("Le remboursement rangé dans un sous-poste", () => {
  const preleve = tx({ id: "a", date: "2026-07-03", amount: -30, label: "Spotify", groupId: 2, lineId: 21 });
  const rendu = tx({ id: "b", date: "2026-07-20", amount: 12, label: "Geste commercial", groupId: 2, lineId: 21 });

  it("devrait retrancher le remboursement du dépensé du sous-poste et de sa dépense", () => {
    const r = ligne(hist([abos], [preleve, rendu]), "expense", "Abonnements");
    expect(r.subRows[0].cells[0].depense).toBe(18);
    expect(r.cells[0].depense).toBe(18);
  });

  it("devrait afficher le remboursement sur la ligne du sous-poste comme sur celle du groupe", () => {
    const r = ligne(hist([abos], [preleve, rendu]), "expense", "Abonnements");
    expect(r.subRows[0].cells[0].rembourse).toBe(12);
    expect(r.cells[0].rembourse).toBe(12);
  });

  it("devrait éteindre le dépassement d'un sous-poste que le remboursement comble", () => {
    const trop = tx({ id: "c", date: "2026-07-05", amount: -20, label: "Option", groupId: 2, lineId: 21 });
    const { dated, datedLines } = seedDated([abos]);
    const avant = computeOverspends([abos], [preleve, trop], "2026-07", mergeDated(dated), datedLines);
    expect(avant.byMonth["2026-07"]?.[0].amount).toBe(20);
    const apres = computeOverspends(
      [abos], [preleve, trop, { ...rendu, amount: 20 }], "2026-07", mergeDated(dated), datedLines,
    );
    expect(apres.byMonth["2026-07"]).toBeUndefined();
  });
});

describe("La retenue rangée dans un poste de revenu", () => {
  // Le même principe, dans l'autre sens : une sortie posée sur un revenu le
  // diminue. Un salaire trop versé qu'on rend n'est pas une dépense du mois.
  const paye = tx({ id: "a", date: "2026-07-28", amount: 2000, label: "Salaire", groupId: 9 });
  const rendu = tx({ id: "b", date: "2026-07-30", amount: -150, label: "Trop-perçu", groupId: 9 });

  it("devrait retrancher la retenue du reçu du revenu", () => {
    const r = ligne(hist([salaire], [paye, rendu]), "income", "Salaire");
    expect(r.cells[0].recu).toBe(1850);
    expect(r.cells[0].depense).toBe(0);
  });

  it("devrait afficher la retenue à part, dans la colonne Dép. du revenu", () => {
    const r = ligne(hist([salaire], [paye, rendu]), "income", "Salaire");
    expect(r.cells[0].rembourse).toBe(150);
  });
});

describe("Le remboursement saisi à la main", () => {
  // La saisie manuelle proposait les postes du sens saisi, et rien d'autre : une
  // entrée n'avait aucune dépense où aller. Un remboursement qu'on note soi-même
  // doit pouvoir rejoindre le poste qu'il rembourse, comme celui qui vient de la
  // banque.
  const postes = [
    { id: 1, accountId: "a1", name: "Vacances Amsterdam", direction: "out" as const },
    { id: 2, accountId: "a1", name: "Courses", direction: "out" as const, endMonth: "2026-06" },
    { id: 9, accountId: "a1", name: "Salaire", direction: "in" as const },
    { id: 5, accountId: "a2", name: "Loyer", direction: "out" as const },
  ];

  it("devrait proposer les dépenses du compte à une entrée, rangées par sens", () => {
    const sections = postesPourSaisie(postes, "a1", "2026-07");
    expect(sections.map((s) => s.label)).toEqual(["Revenus", "Dépenses"]);
    expect(sections[0].groups.map((g) => g.name)).toEqual(["Salaire"]);
    expect(sections[1].groups.map((g) => g.name)).toEqual(["Vacances Amsterdam"]);
  });

  it("ne devrait proposer que les postes du compte choisi", () => {
    const sections = postesPourSaisie(postes, "a2", "2026-07");
    expect(sections.flatMap((s) => s.groups.map((g) => g.name))).toEqual(["Loyer"]);
  });

  it("ne devrait rien écarter tant qu'aucune date n'est saisie", () => {
    const noms = postesPourSaisie(postes, "a1", null).flatMap((s) => s.groups.map((g) => g.name));
    expect(noms).toEqual(["Salaire", "Vacances Amsterdam", "Courses"]);
  });

  it("devrait garder le poste déjà choisi même s'il ne vit plus ce mois-là", () => {
    const noms = postesPourSaisie(postes, "a1", "2026-07", 2).flatMap((s) => s.groups.map((g) => g.name));
    expect(noms).toContain("Courses");
  });
});
