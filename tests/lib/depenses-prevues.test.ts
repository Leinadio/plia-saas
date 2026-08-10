import { expect, describe, it } from "vitest";
import { computeHistory, computeSolde, splitExpenseSection, type HistorySection } from "../../src/lib/history";
import { sectionRowKey, sectionLabel } from "../../src/lib/history-detail";
import { type Group, type Txn } from "../../src/lib/forecast";
import { seedDated, mergeDated } from "./dated-fixtures";

// Les dépenses se rangent en deux blocs à l'écran : celles qu'on avait prévues, et
// celles qui tombent sans prévenir. Le classement se fixe à la création de l'enveloppe
// (groups.planned) et ne bouge plus. Le moteur, lui, garde UNE seule section de
// dépenses : le découpage est un marqueur porté par chaque ligne, lu à l'affichage.
// C'est ce qui garantit que « Total Dépenses », la Balance et le solde continuent de
// compter l'ensemble sans rien savoir de la coupure.

const courses: Group = {
  id: 1, accountId: "a1", name: "Courses", direction: "out",
  monthlyAmount: 300, lines: [],
};
// Sans `planned`, une enveloppe est prévue : c'est le cas de toutes celles qui
// existaient avant que le découpage n'apparaisse.
const dentiste: Group = {
  id: 2, accountId: "a1", name: "Dentiste", direction: "out",
  monthlyAmount: 80, lines: [], planned: false,
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
const depenses = (secs: HistorySection[]) => secs.find((s) => s.kind === "expense")!;

describe("Dépenses prévues et non prévues", () => {
  it("devrait reporter sur chaque ligne du tableau le classement de son enveloppe", () => {
    const secs = hist([courses, dentiste, salaire], []);
    const rows = depenses(secs).rows;
    expect(rows.find((r) => r.name === "Courses")!.planned).toBe(true);
    expect(rows.find((r) => r.name === "Dentiste")!.planned).toBe(false);
  });

  it("devrait ranger chaque dépense dans son bloc, en gardant l'ordre du tableau", () => {
    const secs = hist([courses, dentiste, salaire], []);
    const { prevues, nonPrevues } = splitExpenseSection(depenses(secs), MOIS.length);
    expect(prevues.rows.map((r) => r.name)).toEqual(["Courses"]);
    expect(nonPrevues.rows.map((r) => r.name)).toEqual(["Dentiste"]);
  });

  it("devrait faire que les deux sous-totaux redonnent exactement le total des dépenses", () => {
    const txns = [
      tx({ id: "a", date: "2026-07-03", amount: -120, groupId: 1 }),
      tx({ id: "b", date: "2026-07-19", amount: -50, groupId: 2 }),
      tx({ id: "c", date: "2026-08-02", amount: -200, groupId: 1 }),
    ];
    const sec = depenses(hist([courses, dentiste, salaire], txns));
    const { prevues, nonPrevues } = splitExpenseSection(sec, MOIS.length);
    for (let i = 0; i < MOIS.length; i++) {
      expect(prevues.totals[i].depense + nonPrevues.totals[i].depense).toBeCloseTo(sec.totals[i].depense, 6);
      expect(prevues.totals[i].budgeted + nonPrevues.totals[i].budgeted).toBeCloseTo(sec.totals[i].budgeted, 6);
      expect(prevues.totals[i].balance + nonPrevues.totals[i].balance).toBeCloseTo(sec.totals[i].balance, 6);
    }
  });

  it("devrait rendre un bloc vide, et non des cases absentes, quand rien n'y est rangé", () => {
    const sec = depenses(hist([courses, salaire], []));
    const { prevues, nonPrevues } = splitExpenseSection(sec, MOIS.length);
    expect(prevues.rows).toHaveLength(1);
    expect(nonPrevues.rows).toEqual([]);
    // Un bloc vide garde une case par mois, à zéro : la grille l'affiche quand même,
    // sans quoi on ne pourrait jamais y créer sa première enveloppe.
    expect(nonPrevues.totals).toHaveLength(MOIS.length);
    expect(nonPrevues.totals.every((c) => c.depense === 0 && c.budgeted === 0)).toBe(true);
  });

  // Deux blocs affichés côte à côte, tous deux de kind « expense » : sans clés
  // distinctes, cliquer le sous-total de l'un surlignerait aussi l'autre et le
  // « Total Dépenses ».
  it("devrait donner à chaque bloc sa propre identité de ligne et son propre nom", () => {
    const secs = hist([courses, dentiste, salaire], []);
    const { prevues, nonPrevues } = splitExpenseSection(depenses(secs), MOIS.length);
    expect(sectionRowKey(prevues)).not.toBe(sectionRowKey(nonPrevues));
    expect(sectionRowKey(prevues)).not.toBe(sectionRowKey(depenses(secs)));
    expect(sectionLabel(prevues)).toBe("Dépenses prévues");
    expect(sectionLabel(nonPrevues)).toBe("Dépenses non prévues");
    // La section entière garde son nom : c'est elle qui porte « Total Dépenses ».
    expect(sectionLabel(depenses(secs))).toBe("Dépenses");
  });

  // Le solde réel est un compteur qui descend le tableau : chaque ligne dit où en est
  // le compte une fois cette dépense retirée. Il s'accumule dans l'ordre des lignes de
  // la section, et la grille les affiche par blocs : si les deux ordres divergent, la
  // colonne Solde affiche sur chaque ligne le solde d'une autre.
  it("devrait ranger les dépenses prévues avant les non prévues, l'ordre où le solde les compte", () => {
    const loyer: Group = {
      id: 4, accountId: "a1", name: "Loyer", direction: "out", monthlyAmount: 700, lines: [],
    };
    // Par nom, Dentiste vient entre Courses et Loyer : c'est l'ordre que listGroups donne.
    const secs = hist([courses, dentiste, loyer, salaire], []);
    expect(depenses(secs).rows.map((r) => r.name)).toEqual(["Courses", "Loyer", "Dentiste"]);
  });

  it("devrait faire descendre le solde dans l'ordre affiché, sans mêler les deux blocs", () => {
    const loyer: Group = {
      id: 4, accountId: "a1", name: "Loyer", direction: "out", monthlyAmount: 700, lines: [],
    };
    const txns = [
      tx({ id: "a", date: "2026-07-03", amount: -100, groupId: 1 }), // Courses, prévue
      tx({ id: "b", date: "2026-07-10", amount: -50, groupId: 2 }), // Dentiste, non prévue
      tx({ id: "c", date: "2026-07-15", amount: -700, groupId: 4 }), // Loyer, prévue
    ];
    const secs = hist([courses, dentiste, loyer, salaire], txns);
    const { openings, rowRunning } = computeSolde(secs, MOIS, "2026-07", 0);
    // Loyer est la dernière ligne des prévues : Dentiste, affiché plus bas, ne doit pas
    // encore avoir été retiré de son solde.
    expect(rowRunning[4][0]).toBeCloseTo(openings[0] - 100 - 700, 6);
    // Dentiste ferme la marche : son solde porte les trois dépenses.
    expect(rowRunning[2][0]).toBeCloseTo(openings[0] - 100 - 700 - 50, 6);
  });

  it("devrait laisser les sous-postes attachés à leur enveloppe quand elle change de bloc", () => {
    const abo: Group = {
      id: 3, accountId: "a1", name: "Abonnements", direction: "out",
      monthlyAmount: null, planned: false,
      lines: [{ id: 11, name: "Spotify", amount: 10 }, { id: 12, name: "Netflix", amount: 15 }],
    };
    const sec = depenses(hist([courses, abo], []));
    const { nonPrevues } = splitExpenseSection(sec, MOIS.length);
    expect(nonPrevues.rows[0].subRows.map((s) => s.name)).toEqual(["Spotify", "Netflix"]);
  });
});
