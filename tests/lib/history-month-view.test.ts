// Les emplacements de section du grand tableau, ce qu'un mois laisse hors des
// calculs, et la règle qui dit si une ligne vit un mois donné.
import { describe, expect, it } from "vitest";
import type { HistoryRow, HistorySection, HistoryTxn, IgnoredBlock, MonthCell } from "../../src/lib/history";
import { sectionSlots, ignoredBlocksAtMonth, countIgnoredAtMonth, ligneVivante, sansLignesAbsentes } from "../../src/lib/history-month-view";

const MOIS = ["2026-06", "2026-07"];

function cell(p: Partial<MonthCell> = {}): MonthCell {
  return { budgeted: 0, depense: 0, recu: 0, balance: 0, ...p };
}

function txn(id: string, date: string, amount: number): HistoryTxn {
  return { id, date, label: "ACHAT", amount, month: date.slice(0, 7), groupId: null, lineId: null };
}

function row(p: Partial<HistoryRow> & { id: number; name: string }): HistoryRow {
  return { direction: "out", cells: [cell(), cell()], aliveMonths: [true, true], subRows: [], txns: [],
    ...p,
  };
}

// Courses vit les deux mois, Stage seulement en juillet : c'est exactement le cas
// qui justifie un tableau par mois plutôt qu'un tableau à colonnes.
const courses = row({ id: 1, name: "Courses", txns: [txn("t1", "2026-06-10", -80), txn("t2", "2026-07-12", -90)] });
const stage = row({ id: 2, name: "Stage", aliveMonths: [false, true] });
const depenses: HistorySection = {
  kind: "expense",
  rows: [courses, stage],
  totals: [cell({ budgeted: 300 }), cell({ budgeted: 420 })],
};


// Les emplacements du tableau, sections présentes ou non. Un compte sans aucun groupe
// n'avait ni section de rémunération ni section de dépenses — donc aucun en-tête, donc
// aucun bouton pour en créer un : le compte restait inutilisable, et il fallait un
// groupe pour obtenir le bouton qui crée un groupe.
const uncatIn: HistorySection = { kind: "uncategorized", uncatDirection: "in", rows: [], totals: [cell(), cell()] };
const uncatOut: HistorySection = { kind: "uncategorized", uncatDirection: "out", rows: [], totals: [cell(), cell()] };

const nature = (s: ReturnType<typeof sectionSlots>[number]) =>
  s.kind === "empty" ? `vide:${s.sectionKind}` : `${s.section.kind}${s.section.uncatDirection ? `-${s.section.uncatDirection}` : ""}`;

describe("sectionSlots", () => {
  it("ouvre un emplacement pour chaque section structurelle absente", () => {
    expect(sectionSlots([uncatOut]).map(nature)).toEqual([
      "vide:income", "vide:expense", "uncategorized-out",
    ]);
  });

  it("n'ouvre rien quand toutes les sections sont là", () => {
    const toutes = [
      { kind: "income", rows: [], totals: [cell(), cell()] } as HistorySection,
      uncatIn,
      depenses,
      uncatOut,
    ];
    expect(sectionSlots(toutes).every((s) => s.kind === "section")).toBe(true);
    expect(sectionSlots(toutes)).toHaveLength(4);
  });

  // L'emplacement vide se glisse à la place qu'aurait occupée la section : les
  // dépenses restent après les rémunérations, quoi qu'il manque.
  it("garde l'ordre du tableau", () => {
    expect(sectionSlots([depenses]).map(nature)).toEqual(["vide:income", "expense"]);
  });

  it("ne perd aucune section, même vide de lignes", () => {
    const slots = sectionSlots([depenses]);
    expect(slots.find((s) => s.kind === "section" && s.section.kind === "expense")).toBeDefined();
  });
});

// Les blocs « Non comptabilisées » sont rendus dans chaque tableau de mois, mais ils
// portent les transactions de TOUS les mois affichés : dépliés en juillet, on y lisait
// aussi celles de juin. Comme les autres sections, ils doivent être ramenés à leur mois.
describe("Les non comptabilisées d'un mois", () => {
  const bloc: IgnoredBlock = {
    direction: "out",
    totals: [{ depense: 80, recu: 0 }, { depense: 90, recu: 0 }],
    txns: [txn("i2", "2026-07-12", -90), txn("i1", "2026-06-10", -80)],
  };

  it("ne devrait garder que les transactions du mois déplié", () => {
    expect(ignoredBlocksAtMonth([bloc], "2026-07")[0].txns.map((t) => t.id)).toEqual(["i2"]);
    expect(ignoredBlocksAtMonth([bloc], "2026-06")[0].txns.map((t) => t.id)).toEqual(["i1"]);
  });

  // Les totaux restent alignés sur tous les mois : ce sont eux que lisent les cases,
  // colonne par colonne. Seule la liste dépliable est ramenée au mois.
  it("devrait laisser les totaux intacts", () => {
    expect(ignoredBlocksAtMonth([bloc], "2026-07")[0].totals).toEqual(bloc.totals);
  });

  // Un bloc dont aucune transaction n'est de ce mois-là garde sa place : sa ligne
  // affiche 0 pour ce mois, et la faire disparaître décalerait les autres.
  it("devrait garder un bloc vide pour ce mois-là", () => {
    expect(ignoredBlocksAtMonth([bloc], "2026-05")[0].txns).toEqual([]);
  });

  // L'en-tête du mois annonce combien d'opérations il laisse hors des calculs : sans
  // ce chiffre, un mois dont le total paraît faux n'a aucun indice à donner.
  it("devrait compter les non comptabilisées du mois, les deux sens confondus", () => {
    const recus: IgnoredBlock = {
      direction: "in",
      totals: [{ depense: 0, recu: 0 }, { depense: 0, recu: 500 }],
      txns: [txn("r1", "2026-07-02", 500)],
    };
    expect(countIgnoredAtMonth([bloc, recus], "2026-07")).toBe(2);
    expect(countIgnoredAtMonth([bloc, recus], "2026-06")).toBe(1);
    expect(countIgnoredAtMonth([bloc, recus], "2026-05")).toBe(0);
    expect(countIgnoredAtMonth(undefined, "2026-07")).toBe(0);
  });
});

// --- La ligne qui ne vit pas ce mois-là -------------------------------------
// Le tableau ne se découpe plus en un tableau par mois : il n'y en a qu'un, et la
// même ligne traverse tous les mois affichés. Une enveloppe qui commence en
// septembre ne peut donc plus disparaître du mois d'août — elle y est, mais ses
// cases doivent rester VIDES. Écrire 0,00 € y ferait lire un budget épuisé là où
// il n'y a simplement rien encore.
describe("ligneVivante", () => {
  it("dit vrai sur un mois où la ligne vit", () => {
    expect(ligneVivante([true, true], 0)).toBe(true);
    expect(ligneVivante([false, true], 1)).toBe(true);
  });

  it("dit faux sur un mois où la ligne ne vit pas", () => {
    expect(ligneVivante([false, true], 0)).toBe(false);
  });

  // Mieux vaut une ligne de trop qu'un budget qui s'efface sans qu'on sache
  // pourquoi : sans information, on affiche.
  it("dit vrai quand on ne sait rien de ce mois-là", () => {
    expect(ligneVivante(undefined, 0)).toBe(true);
    expect(ligneVivante([true], 5)).toBe(true);
  });
});


// --- La ligne qui n'existe à aucun des mois affichés -------------------------
// Elle, on ne la montre pas du tout. Une enveloppe « Sucreries » qui commence en
// juillet n'a rien à faire dans un tableau qui n'affiche que juin : elle y tenait
// une ligne entière de cases vides, et il fallait la lire pour comprendre qu'elle
// ne disait rien. Dès que la fenêtre touche juillet, elle revient.
//
// La seule exception est le cas où elle porte de l'argent quand même : une
// transaction peut être rattachée à un poste hors de sa période de vie, et un
// montant ne disparaît jamais de l'écran sans qu'on l'ait demandé.
describe("sansLignesAbsentes", () => {
  const noms = (secs: HistorySection[]) => secs.flatMap((s) => s.rows.map((r) => r.name));

  it("retire une ligne qui ne vit aucun des mois affichés", () => {
    const sucreries = row({ id: 3, name: "Sucreries", aliveMonths: [false, false] });
    const secs = sansLignesAbsentes([{ ...depenses, rows: [courses, sucreries] }]);
    expect(noms(secs)).toEqual(["Courses"]);
  });

  it("garde une ligne dès qu'elle vit UN des mois affichés", () => {
    // Stage ne vit pas en juin mais vit en juillet : la fenêtre le contient.
    expect(noms(sansLignesAbsentes([depenses]))).toEqual(["Courses", "Stage"]);
  });

  it("garde une ligne éteinte qui porte tout de même un montant", () => {
    // Rattachement d'une transaction à un poste hors de sa période : le montant
    // compte dans les totaux, il doit rester lisible quelque part.
    const avance = row({
      id: 4, name: "Avance", aliveMonths: [false, false],
      cells: [cell({ depense: 42 }), cell()],
    });
    expect(noms(sansLignesAbsentes([{ ...depenses, rows: [avance] }]))).toEqual(["Avance"]);
  });

  it("garde une ligne éteinte qui porte une transaction", () => {
    const avance = row({
      id: 5, name: "Avance", aliveMonths: [false, false],
      txns: [txn("t9", "2026-06-03", -12)],
    });
    expect(noms(sansLignesAbsentes([{ ...depenses, rows: [avance] }]))).toEqual(["Avance"]);
  });

  it("applique la même règle aux sous-postes", () => {
    const abonnements = row({
      id: 6, name: "Abonnements",
      subRows: [
        { id: 61, name: "Internet", cells: [cell(), cell()], aliveMonths: [true, true], txns: [] },
        { id: 62, name: "Streaming", cells: [cell(), cell()], aliveMonths: [false, false], txns: [] },
      ],
    });
    const secs = sansLignesAbsentes([{ ...depenses, rows: [abonnements] }]);
    expect(secs[0].rows[0].subRows.map((s) => s.name)).toEqual(["Internet"]);
  });

  // On ne retire que du vide : les totaux de la section n'ont aucune raison de bouger.
  it("ne touche pas aux totaux", () => {
    const sucreries = row({ id: 7, name: "Sucreries", aliveMonths: [false, false] });
    const secs = sansLignesAbsentes([{ ...depenses, rows: [courses, sucreries] }]);
    expect(secs[0].totals).toEqual(depenses.totals);
  });

  // Sans information sur la vie de la ligne (fixtures, lignes fabriquées ailleurs),
  // on affiche : mieux vaut une ligne de trop qu'un poste évaporé.
  it("garde une ligne dont on ne sait rien", () => {
    const inconnue = { ...row({ id: 8, name: "Inconnue" }), aliveMonths: [] as boolean[] };
    expect(noms(sansLignesAbsentes([{ ...depenses, rows: [inconnue] }]))).toEqual(["Inconnue"]);
  });
});
