import { expect, describe, it } from "vitest";
import {
  computeHistory, computeOverspends, computePlannedSoldes, computeSolde, grandTotals, type HistorySection,
} from "../../src/lib/history";
import { effectiveBalance } from "../../src/lib/account";
import { txnChildren, txnsDuSens, resteParts } from "../../src/lib/history-detail";
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
    const noeuds = txnsDuSens(r, "2026-07", "in", 0)!;
    expect(noeuds.map((n) => n.amount)).toEqual([200]);
    expect(noeuds[0].label).toContain("Virement Léa");
    expect(noeuds[0].ref).toBe("txn:b::recu::0");
  });

  it("ne devrait rien décomposer là où rien n'est venu à contre-sens", () => {
    const r = ligne(hist([vacances], [depense]), "expense", "Vacances Amsterdam");
    expect(txnsDuSens(r, "2026-07", "in", 0)).toBeUndefined();
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

  it("devrait appliquer une dépense manuelle au solde bancaire qui ne la contient pas", () => {
    const voyageSansBudget = { ...vacances, monthlyAmount: 0 };
    const versement = tx({ id: "bank:versement", amount: 745, label: "Virement reçu", groupId: 1 });
    const sortieManuelle = tx({ id: "manual:voyage", amount: -745, label: "Voyage", groupId: 1 });
    const sections = hist([voyageSansBudget], [versement, sortieManuelle]);
    const balance = effectiveBalance(751.4, undefined, -745);
    const solde = computeSolde(sections, MOIS, "2026-07", balance);
    const planned = computePlannedSoldes(sections, MOIS, "2026-07", solde.openings);

    expect(solde.closings[0]).toBeCloseTo(6.4, 2);
    expect(planned.prevuClosings[0]).toBeCloseTo(6.4, 2);
    expect(planned.depassClosings[0]).toBeCloseTo(6.4, 2);
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

// --- Ce qui est vraiment sorti, et ce qui est vraiment rentré ----------------
// La colonne Dép. affichait le dépensé NET du remboursement. Sur un poste
// entièrement remboursé, elle disait 0,00 — alors que la transaction juste en
// dessous montrait bien la somme partie. La colonne ne se totalisait plus sur ses
// propres lignes, et l'argent qui avait quitté le compte n'était nulle part.
//
// Elle montre maintenant le BRUT : tout ce qui est sorti du poste. Le
// remboursement se lit en face, dans Reçu, entier lui aussi, et c'est la Balance
// qui fait la synthèse — elle seule dit ce qu'il reste, et elle ne bouge pas.
describe("La dépense brute et le reçu brut d'un poste", () => {
  const depense = tx({ id: "a", date: "2026-07-03", amount: -1200, label: "Hôtel", groupId: 1 });
  const remboursement = tx({ id: "b", date: "2026-07-10", amount: 200, label: "Virement Léa", groupId: 1 });

  it("montre la dépense entière du poste, remboursement non déduit", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    expect(r.cells[0].depenseBrute).toBe(1200);
    expect(r.cells[0].recuBrut).toBe(200);
  });

  it("laisse le net et la balance intacts : eux seuls comptent", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    expect(r.cells[0].depense).toBe(1000);
    expect(r.cells[0].balance).toBe(200);
  });

  it("vaut le réalisé tel quel quand rien n'est venu à contre-sens", () => {
    const r = ligne(hist([vacances], [depense]), "expense", "Vacances Amsterdam");
    expect(r.cells[0].depenseBrute).toBe(1200);
    expect(r.cells[0].recuBrut).toBe(0);
  });

  it("descend jusqu'au sous-poste", () => {
    const preleve = tx({ id: "a", date: "2026-07-03", amount: -30, label: "Spotify", groupId: 2, lineId: 21 });
    const rendu = tx({ id: "b", date: "2026-07-20", amount: 12, label: "Geste", groupId: 2, lineId: 21 });
    const r = ligne(hist([abos], [preleve, rendu]), "expense", "Abonnements");
    expect(r.subRows[0].cells[0].depenseBrute).toBe(30);
    expect(r.subRows[0].cells[0].recuBrut).toBe(12);
  });

  it("se totalise sur ses propres lignes, au sous-total comme au grand total", () => {
    // C'est la raison d'être de ces deux montants : une colonne dont les lignes
    // disent le brut et dont le pied dirait le net ne s'additionne plus.
    const secs = hist([vacances, salaire], [depense, remboursement]);
    const sortie = secs.find((s) => s.kind === "expense")!;
    expect(sortie.totals[0].depenseBrute).toBe(1200);
    expect(sortie.totals[0].recuBrut).toBe(200);
    const grand = grandTotals(secs, MOIS.length);
    expect(grand[0].depenseBrute).toBe(1200);
    expect(grand[0].recuBrut).toBe(200);
  });

  it("joue en miroir sur un revenu dont on a rendu une part", () => {
    const paye = tx({ id: "a", date: "2026-07-28", amount: 2000, label: "Salaire", groupId: 9 });
    const rendu = tx({ id: "b", date: "2026-07-30", amount: -150, label: "Trop-perçu", groupId: 9 });
    const r = ligne(hist([salaire], [paye, rendu]), "income", "Salaire");
    expect(r.cells[0].recuBrut).toBe(2000);
    expect(r.cells[0].depenseBrute).toBe(150);
    expect(r.cells[0].recu).toBe(1850);
  });

  it("ne fabrique rien sur un mois de projection, où rien n'est réalisé", () => {
    const r = ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");
    expect(r.cells[1].depenseBrute).toBe(0);
    expect(r.cells[1].recuBrut).toBe(0);
  });
});

// --- Ce que raconte une case qu'on clique ------------------------------------
// Chaque case chiffrée du tableau ouvre son calcul. Si la case montre le brut,
// son calcul doit montrer le brut : une décomposition qui ne totalise pas sur le
// montant qu'elle explique est pire que pas de décomposition du tout.
describe("Le calcul derrière les cases d'un poste remboursé", () => {
  const depense = tx({ id: "a", date: "2026-07-03", amount: -1200, label: "Hôtel", groupId: 1 });
  const remboursement = tx({ id: "b", date: "2026-07-10", amount: 200, label: "Virement Léa", groupId: 1 });
  const poste = () => ligne(hist([vacances], [depense, remboursement]), "expense", "Vacances Amsterdam");

  it("décompose la case Dép. sur les seules sorties, et totalise dessus", () => {
    const noeuds = txnsDuSens(poste(), "2026-07", "out", 0)!;
    expect(noeuds.map((n) => n.label.includes("Hôtel"))).toEqual([true]);
    expect(noeuds.reduce((s, n) => s + n.amount, 0)).toBe(1200);
  });

  it("décompose la case Reçu sur les seules entrées, et totalise dessus", () => {
    const noeuds = txnsDuSens(poste(), "2026-07", "in", 0)!;
    expect(noeuds.reduce((s, n) => s + n.amount, 0)).toBe(200);
  });

  it("explique le Reste par budget moins ce qui est sorti, plus ce qui est revenu", () => {
    const parts = resteParts(poste().cells[0]);
    expect(parts).toEqual({ budget: 1200, sorti: 1200, rentre: 200 });
    // Et ça retombe sur la Balance, sinon la décomposition ment.
    expect(parts.budget - parts.sorti + parts.rentre).toBe(poste().cells[0].balance);
  });

  it("n'invente pas de retour quand rien n'est revenu", () => {
    const seul = ligne(hist([vacances], [depense]), "expense", "Vacances Amsterdam");
    expect(resteParts(seul.cells[0])).toEqual({ budget: 1200, sorti: 1200, rentre: 0 });
  });
});
