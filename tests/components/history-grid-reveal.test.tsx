// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le tableau monte des champs qui parlent au routeur (commentaire, rattachement) :
// ils ne sont pas le sujet ici.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  usePathname: () => "/app/historique",
  useSearchParams: () => new URLSearchParams(),
}));
import { HistoryGrid } from "../../src/components/history-grid";
import { TooltipProvider } from "../../src/components/ui/tooltip";
import type { HistorySection, HistoryRow, HistoryTxn, MonthCell, SoldeColumn, PlannedSoldes } from "../../src/lib/history";
import type { AccountForecast } from "../../src/lib/forecast";
import { sectionNode } from "../../src/lib/history-detail";
import { flattenNodes, cellsForNode } from "../../src/lib/history-nav";
import type { DetailNode } from "../../src/lib/history-explain";

// LE PANNEAU DÉSIGNE, LE TABLEAU DÉPLIE. Cliquer une transaction dans le calcul
// doit la faire apparaître dans le grand tableau : elle vit sous un groupe replié,
// et le tableau ouvre ce qu'il faut pour la montrer.

const MOIS = ["2026-08"];

function cell(p: Partial<MonthCell> = {}): MonthCell {
  return { budgeted: 0, depense: 0, recu: 0, balance: 0, ...p };
}

// L'identifiant d'une transaction synchronisée porte son compte et sa référence,
// séparés par « :: » (TXN_ID_SEP). C'est la forme réelle, et c'est elle qui avait
// cassé la lecture des clés de case : les fixtures en démonstration n'ont pas de
// séparateur, donc rien ne le montrait.
const recette: HistoryTxn = {
  id: "cpt-1::2026082100112233", date: "2026-08-21", label: "REEQUILIBRAGE", amount: 4.5,
  month: "2026-08", groupId: 7, lineId: null,
};
const sortie: HistoryTxn = {
  id: "cpt-1::2026081200998877", date: "2026-08-12", label: "COURSES", amount: -12.5,
  month: "2026-08", groupId: 8, lineId: null,
};

function row(p: Partial<HistoryRow> & { id: number }): HistoryRow {
  return { name: `G${p.id}`, direction: "out", cells: [cell()], aliveMonths: [true], subRows: [], txns: [], ...p };
}

// Une rémunération découpée en postes : la transaction est masquée DEUX fois dans
// le tableau (sous le groupe, puis sous le poste) alors que le panneau la montre
// directement sous le groupe.
const recetteDePoste: HistoryTxn = {
  id: "cpt-1::2026080700334455", date: "2026-08-07", label: "VIREMENT INSTANTANE", amount: 33.76,
  month: "2026-08", groupId: 9, lineId: 91,
};

const revenus: HistorySection = {
  kind: "income",
  rows: [row({ id: 7, name: "Rémunération supplémentaire", direction: "in", cells: [cell({ recu: 4.5 })], txns: [recette] })],
  totals: [cell({ recu: 4.5 })],
};
const revenusAPostes: HistorySection = {
  kind: "income",
  rows: [row({
    id: 9, name: "Rémunération Principale", direction: "in", cells: [cell({ recu: 33.76 })],
    subRows: [{ id: 91, name: "Virements", cells: [cell({ recu: 33.76 })], aliveMonths: [true], txns: [recetteDePoste] }],
  })],
  totals: [cell({ recu: 33.76 })],
};
const depenses: HistorySection = {
  kind: "expense",
  rows: [row({ id: 8, name: "Courses", cells: [cell({ depense: 12.5 })], txns: [sortie] })],
  totals: [cell({ depense: 12.5 })],
};

const solde: SoldeColumn = { openings: [0], closings: [0], rowRunning: { 7: [4.5], 8: [-12.5] }, uncategorizedRunning: null };
const planned: PlannedSoldes = {
  prevuClosings: [null], depassClosings: [null], prevuRowRunning: {}, depassRowRunning: {},
  uncatPrevuRunning: {}, uncatDepassRunning: {},
};
const forecast = {
  accountId: "a1", balance: 0, currentEstimate: 0, nextEstimate: 0, overspendTotal: 0,
  nextEstimateWithOverspend: 0, groups: [], currentSteps: [], nextSteps: [], overspendSteps: [],
} as unknown as AccountForecast;

// Tous les chemins de l'arbre, pour ouvrir le panneau en grand.
function tousLesChemins(noeuds: DetailNode[], prefixe = ""): Set<string> {
  const out = new Set<string>();
  noeuds.forEach((n, i) => {
    const chemin = prefixe ? `${prefixe}.${i}` : `${i}`;
    out.add(chemin);
    for (const c of tousLesChemins(n.children ?? [], chemin)) out.add(c);
  });
  return out;
}

// Ce que le panneau désigne quand on clique la ligne d'une transaction : on repasse
// par les vrais constructeurs, pour que le test tienne si les clés changent.
function caseDeLaTransaction(sec: HistorySection, label: string): string[] {
  const racine = sectionNode(sec, 0, "2026-08", "recu");
  const ligne = flattenNodes([racine], tousLesChemins([racine])).find((r) => r.node.label.includes(label));
  if (!ligne) throw new Error(`transaction « ${label} » absente du panneau`);
  const cells = cellsForNode(ligne.node, undefined);
  if (!cells) throw new Error(`transaction « ${label} » sans case visée`);
  return cells;
}

function grille(selected: string[], sections: HistorySection[] = [revenus, depenses]) {
  return renderToStaticMarkup(
    createElement(TooltipProvider, undefined, createElement(HistoryGrid, {
      months: MOIS,
      currentMonth: "2026-08",
      stripMin: "2026-01",
      stripMax: "2026-12",
      forecast,
      sections,
      overspend: [0],
      grand: [cell({ recu: 4.5, depense: 12.5 })],
      groups: [],
      solde,
      planned,
      onSelect: () => {},
      selected,
      anchor: null,
      accountId: "a1",
    })),
  );
}

describe("désigner une transaction depuis le panneau", () => {
  it("déplie le poste de dépense et montre sa transaction", () => {
    expect(grille([`txn:${sortie.id}::depense::0`])).toContain("COURSES");
  });

  it("déplie le poste de revenu et montre sa transaction", () => {
    expect(grille([`txn:${recette.id}::recu::0`])).toContain("REEQUILIBRAGE");
  });

  it("déplie le groupe ET le poste d'une rémunération découpée", () => {
    const cases = caseDeLaTransaction(revenusAPostes, "VIREMENT INSTANTANE");
    expect(grille(cases, [revenusAPostes])).toContain("VIREMENT INSTANTANE");
  });

  it("désigne bien la case de la transaction, pas celle du total", () => {
    expect(caseDeLaTransaction(revenus, "REEQUILIBRAGE")).toEqual([`txn:${recette.id}::recu::0`]);
    expect(caseDeLaTransaction(revenusAPostes, "VIREMENT INSTANTANE")).toEqual([`txn:${recetteDePoste.id}::recu::0`]);
  });
});
