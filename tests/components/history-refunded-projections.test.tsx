// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { computeForecast, type Group, type Txn } from "../../src/lib/forecast";
import { computeHistory, computePlannedSoldes, computeSolde, computeTableEstimate, grandTotals } from "../../src/lib/history";
import { seedDated } from "../lib/dated-fixtures";
import type { CellDetail, DetailNode } from "../../src/lib/history-explain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  usePathname: () => "/app/historique",
  useSearchParams: () => new URLSearchParams(),
}));
import { HistoryGrid } from "../../src/components/history-grid";
import { TooltipProvider } from "../../src/components/ui/tooltip";

function grid(onSelect: (detail: CellDetail) => void = () => {}, budget = 1622, spent = 1622, refunded = 1622) {
  const months = ["2026-09"];
  const groups: Group[] = [{ id: 2, accountId: "a1", name: "Taxe foncière", direction: "out", monthlyAmount: budget, lines: [] }];
  const txns: Txn[] = [
    { id: "tax", accountId: "a1", groupId: 2, date: "2026-09-03", label: "Taxe foncière", amount: -spent },
    ...(refunded > 0 ? [{ id: "refund", accountId: "a1", groupId: 2, date: "2026-09-04", label: "Remboursement", amount: refunded }] : []),
  ];
  const { dated, datedLines } = seedDated(groups);
  const sections = computeHistory(groups, txns, months, "2026-09", dated, datedLines);
  const estimate = computeTableEstimate(sections, months, "2026-09", 458.74)!;
  const solde = computeSolde(sections, months, "2026-09", 458.74, estimate.value);
  const planned = computePlannedSoldes(sections, months, "2026-09", solde.openings, estimate.value);
  const forecast = computeForecast("a1", 458.74, groups, txns, "2026-09", dated, datedLines);
  return createElement(TooltipProvider, undefined, createElement(HistoryGrid, {
    months, currentMonth: "2026-09", stripMin: "2026-01", stripMax: "2026-12",
    forecast, sections, solde, planned, grand: grandTotals(sections, 1),
    overspend: [0], groups: [], onSelect, selected: [], anchor: null, accountId: "a1",
  }));
}

it("garde les montants bruts visibles mais vide les trois cases de solde d'une dépense remboursée", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(grid());
  for (const col of ["budget", "depense", "recu"]) {
    expect(container.querySelector(`[data-cellkey="group:2::${col}::0"]`)?.textContent?.replace(/\s/g, "")).toBe("1622,00");
  }
  for (const col of ["solde", "soldePrevu", "soldeDepass"]) {
    expect(container.querySelector(`[data-cellkey="group:2::${col}::0"]`)?.textContent).toBe("");
    expect(container.querySelector(`[data-cellkey="grand::${col}::0"] [data-treasury-value]`)?.textContent?.replace(/\s/g, "")).toBe("458,74€");
  }
});

it.each([
  [100, 150, 80, "30,00", "encore disponibles"],
  [100, 100, 100, "0,00", "entièrement remboursé"],
  [100, 120, 0, "-20,00", "de dépassement"],
  [100, 100, 0, "0,00", "budget utilisé"],
  [100, 100, 130, "30,00", "d’excédent reçu"],
] as const)("explique le reste sans confondre marge et remboursement : %s / %s / %s", (budget, spent, refunded, amount, caption) => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(grid(undefined, budget, spent, refunded));
  const cell = container.querySelector('[data-cellkey="group:2::reste::0"]')!;
  expect(cell.querySelector('[data-budget-remaining]')?.textContent?.replace(/\s/g, "")).toBe(amount);
  expect(cell.textContent).toContain(caption);
  expect(cell.querySelector("button")).not.toBeNull();
});

it("additionne les dépenses et remboursements bruts dans leurs propres colonnes", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(grid());
  for (const col of ["depense", "recu"]) {
    expect(container.querySelector(`[data-cellkey="section:expense::${col}::0"]`)?.textContent?.replace(/\s/g, "")).toBe("1622,00");
  }
});

it("explique le reste et les soldes de fin de mois avec des montants qui s'additionnent", async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const details: CellDetail[] = [];
  const checkChildren = (nodes: DetailNode[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        expect(node.children.reduce((sum, child) => sum + child.amount, 0)).toBeCloseTo(node.amount, 2);
        checkChildren(node.children);
      }
    }
  };
  try {
    await act(async () => root.render(grid(detail => details.push(detail))));
    for (const key of ["group:2::reste::0", "section:expense::reste::0", "section:expense::depense::0", "section:expense::recu::0", "grand::soldePrevu::0", "grand::soldeDepass::0"]) {
      const cell = container.querySelector<HTMLElement>(`[data-cellkey="${key}"]`)!;
      expect(cell).not.toBeNull();
      await act(async () => cell.querySelector<HTMLButtonElement>("button")!.click());
      const detail = details.at(-1)!;
      expect(detail.nodes.length).toBeGreaterThan(0);
      expect(detail.nodes.reduce((sum, node) => sum + node.amount, 0)).toBeCloseTo(detail.result, 2);
      checkChildren(detail.nodes);
    }
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
