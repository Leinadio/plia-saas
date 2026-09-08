// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
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

function elementGrille(selected: string[], sections: HistorySection[] = [revenus, depenses], overrides: Partial<React.ComponentProps<typeof HistoryGrid>> = {}) {
  return (
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
      ...overrides,
    }))
  );
}

function grille(...args: Parameters<typeof elementGrille>) {
  return renderToStaticMarkup(elementGrille(...args));
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

describe("le relevé mobile conserve les montants et leurs références", () => {
  const months = ["2026-08", "2026-09"];
  const expense: HistorySection = {
    ...depenses,
    rows: [row({ id: 8, name: "Courses", cells: [cell({ depense: 12.5 }), cell({ depense: 22.5 })], aliveMonths: [true, true], txns: [sortie] })],
    totals: [cell({ depense: 12.5 }), cell({ depense: 22.5 })],
  };
  const multiMonth = {
    months,
    grand: expense.totals,
    solde: { openings: [100, 87.5], closings: [87.5, 65], rowRunning: { 8: [87.5, 65] }, uncategorizedRunning: null },
    planned: { ...planned, prevuClosings: [100, 100], depassClosings: [87.5, 65] },
    overspend: [0, 0],
  };

  function documentMobile(metric: "dep" | null, selected: string[] = []) {
    const el = document.createElement("div");
    el.innerHTML = grille(selected, [expense], {
      ...multiMonth,
      mobile: { month: "2026-09", metric, onMonthChange: () => {} },
    });
    return el;
  }

  it("affiche septembre sans transformer ses références en celles d’août", () => {
    const el = documentMobile(null);
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("22,50");
    expect(el.querySelector('[data-cellkey="group:8::depense::0"]')).toBeNull();
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("Dépensé");
    expect(el.querySelector('[data-cellkey="grand::solde::1"]')).not.toBeNull();
  });

  it("compare les dépenses de chaque mois avec leurs propres références", () => {
    const el = documentMobile("dep");
    expect(el.querySelector('[data-cellkey="group:8::depense::0"]')?.textContent).toContain("12,50");
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("22,50");
    expect(el.querySelector('[data-cellkey="group:8::depense::0"]')?.textContent).toContain("Août 2026");
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("Septembre 2026");
    expect(el.querySelector('[data-cellkey="group:8::recu::1"]')).toBeNull();
  });

  it("ne montre pas les opérations d’août dans le relevé de septembre", () => {
    const el = documentMobile(null, [`txn:${sortie.id}::depense::0`]);
    expect(el.querySelector('[data-cellkey="txn:cpt-1::2026081200998877::depense::0"]')).toBeNull();
  });

  it("garde un poste terminé portant une opération dans le mois affiché", () => {
    const lateTxn = { ...sortie, id: "late", month: "2026-09", date: "2026-09-01" };
    const ended = { ...expense, rows: [{ ...expense.rows[0], aliveMonths: [true, false], txns: [lateTxn] }] };
    const html = grille(["txn:late::depense::1"], [ended], {
      ...multiMonth, mobile: { month: "2026-09", metric: null, onMonthChange: () => {} },
    });
    expect(html).toContain('data-cellkey="txn:late::depense::1"');
  });

  it("garde le mois futur dans la comparaison quand son indicateur est indisponible", () => {
    const html = grille([], [expense], {
      ...multiMonth, mobile: { month: "2026-09", metric: "soldeDepass", onMonthChange: () => {} },
    });
    expect(html).toContain('data-mobile-month="2026-09"');
    expect(html).toContain("Non applicable");
  });

  it("révèle une opération hors calcul désignée depuis son détail", () => {
    const html = grille([`txn:${sortie.id}::depense::0`], [], {
      ignoredBlocks: [{ direction: "out", txns: [sortie], totals: [cell({ depense: 12.5 })] }],
      mobile: { month: "2026-08", metric: null, onMonthChange: () => {} },
    });
    expect(html).toContain(`data-cellkey="txn:${sortie.id}::depense::0"`);
  });

  it.each(["grand::revenus::0", "grand::budget::0", "estime::solde::0"])("révèle %s même hors indicateur comparé", (reference) => {
    const el = document.createElement("div");
    el.innerHTML = grille([reference], [expense], {
      ...multiMonth, mobile: { month: "2026-08", metric: "soldePrevu", onMonthChange: () => {} },
    });
    expect(el.querySelector(`[data-cellkey="${reference}"]`)).not.toBeNull();
  });

  it("retire un poste terminé sans opération même s’il était déplié le mois précédent", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const ended = { ...expense, rows: [{ ...expense.rows[0], aliveMonths: [true, false], cells: [cell({ depense: 12.5 }), cell()] }] };
    try {
      await act(async () => root.render(elementGrille([], [ended], { ...multiMonth, mobile: { month: "2026-08", metric: null, onMonthChange: () => {} } })));
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Déplier le poste"]')!.click());
      await act(async () => root.render(elementGrille([], [ended], { ...multiMonth, mobile: { month: "2026-09", metric: null, onMonthChange: () => {} } })));
      expect(container.textContent).not.toContain("Courses");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("rouvre les dépenses repliées pour montrer l’opération désignée", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const mobile = { month: "2026-08", metric: null, onMonthChange: () => {} };
    try {
      await act(async () => root.render(elementGrille([], [depenses], { mobile })));
      const fold = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Ce qui sort")!;
      await act(async () => fold.click());
      await act(async () => root.render(elementGrille([`txn:${sortie.id}::depense::0`], [depenses], { mobile })));
      expect(container.querySelector(`[data-cellkey="txn:${sortie.id}::depense::0"]`)).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
