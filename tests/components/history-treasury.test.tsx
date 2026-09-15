// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { HistoryGrid } from "@/components/history-grid";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { MobileHistoryView } from "@/components/history-mobile-columns";
import { computeForecast, type Group, type Txn } from "@/lib/forecast";
import { computeHistory, computePlannedSoldes, computeSolde, computeTableEstimate, grandTotals, monthlyOverspend } from "@/lib/history";
import { seedDated } from "../lib/dated-fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/app/historique", useSearchParams: () => new URLSearchParams() }));

function renderGrid(balance = 880, mobile?: MobileHistoryView, withUncategorized = false) {
  const months = ["2026-09", "2026-10"];
  const groups: Group[] = [
    { id: 1, accountId: "a1", name: "Salaire", direction: "in", monthlyAmount: 2200, lines: [] },
    { id: 2, accountId: "a1", name: "Transport", direction: "out", monthlyAmount: 120, lines: [] },
    { id: 3, accountId: "a1", name: "Taxe remboursée", direction: "out", monthlyAmount: 1622, lines: [] },
    { id: 4, accountId: "a1", name: "Sorties", direction: "out", monthlyAmount: 20, lines: [] },
  ];
  const txns: Txn[] = [
    { id: "salary", accountId: "a1", groupId: 1, date: "2026-09-01", label: "Salaire", amount: 2200 },
    { id: "transport", accountId: "a1", groupId: 2, date: "2026-09-02", label: "Transport", amount: -120 },
    { id: "tax", accountId: "a1", groupId: 3, date: "2026-09-03", label: "Taxe", amount: -1622 },
    { id: "refund", accountId: "a1", groupId: 3, date: "2026-09-04", label: "Remboursement", amount: 1622 },
    { id: "dinner", accountId: "a1", groupId: 4, date: "2026-09-05", label: "Restaurant", amount: -30 },
  ];
  const { dated, datedLines } = seedDated(groups);
  if (withUncategorized) {
    dated[0] = [{ effectiveMonth: "2026-09", amount: 85 }];
    txns.push({ id: "uncat", accountId: "a1", groupId: null, date: "2026-09-06", label: "À classer", amount: -100 });
  }
  const sections = computeHistory(groups, txns, months, "2026-09", dated, datedLines);
  const estimate = computeTableEstimate(sections, months, "2026-09", balance)!;
  const solde = computeSolde(sections, months, "2026-09", balance, estimate.value);
  const planned = computePlannedSoldes(sections, months, "2026-09", solde.openings, estimate.value, dated);
  const forecast = computeForecast("a1", balance, groups, txns, "2026-09", dated, datedLines);
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<TooltipProvider><HistoryGrid months={months} currentMonth="2026-09" stripMin="2026-01" stripMax="2026-12" forecast={forecast} sections={sections} solde={solde} planned={planned} grand={grandTotals(sections, months.length)} overspend={monthlyOverspend(sections, months.length)} groups={[]} onSelect={() => {}} selected={[]} anchor={null} accountId="a1" mobile={mobile} /></TooltipProvider>);
  return container;
}
const text = (element: Element | null) => element?.textContent?.replace(/\s/g, "");

it("sépare une dépense du solde positif restant au lieu de mettre moins devant ce solde", () => {
  const page = renderGrid();
  const cell = page.querySelector('[data-cellkey="group:2::solde::0"]')!;
  expect(text(cell.querySelector('[data-treasury-movement]'))).toContain("−120,00");
  expect(text(cell.querySelector('[data-treasury-remaining]'))).toContain("910,00");
  expect(text(cell.querySelector('[data-treasury-remaining]'))).not.toContain("−910");
  expect(cell.querySelector("button")).not.toBeNull();
});

it("conserve le signe d’un découvert et affiche un résultat zéro atteint par une dépense", () => {
  const negative = renderGrid(-50).querySelector('[data-cellkey="group:4::solde::0"]')!;
  expect(text(negative.querySelector('[data-treasury-remaining]'))).toContain("-50,00");
  expect(negative.textContent).toContain("à découvert");
  const zero = renderGrid(0).querySelector('[data-cellkey="group:4::solde::0"]')!;
  expect(text(zero.querySelector('[data-treasury-remaining]'))).toContain("0,00");
});

it("distingue la trésorerie synchronisée des prévisions, y compris sur un mois futur", () => {
  const page = renderGrid();
  expect(page.textContent?.match(/Votre trésorerie, étape par étape/g)).toHaveLength(1);
  expect(page.querySelector('[data-cellkey="grand::solde::0"]')?.textContent).toContain("Dernière synchronisation");
  const future = page.querySelector('[data-cellkey="grand::solde::1"]')!;
  expect(future.textContent).toContain("Estimation prolongée");
  expect(future.textContent).not.toContain("Trésorerie actuelle");
});

it("nomme le découvert final et distingue un découvert prévu de la trésorerie synchronisée", () => {
  const page = renderGrid(-50);
  const current = page.querySelector('[data-cellkey="grand::solde::0"]')!;
  expect(current.textContent).toContain("À découvert");
  expect(current.textContent).toContain("Dernière synchronisation");
  const planned = page.querySelector('[data-cellkey="grand::soldePrevu::0"]')!;
  expect(planned.textContent).toContain("Découvert prévu");
  expect(planned.textContent).toContain("Prévision de fin de mois");
});

it("montre le parcours réel sous les enveloppes mobiles et garde une dépense neutre vide", () => {
  const page = renderGrid(880, { month: "2026-09", metric: null, onMonthChange: () => {} });
  expect(page.querySelector('[data-cellkey="group:2::solde::0"] [data-treasury-remaining]')).not.toBeNull();
  expect(page.querySelector('[data-cellkey="group:2::soldePrevu::0"]')).toBeNull();
  for (const column of ["solde", "soldePrevu", "soldeDepass"]) {
    expect(page.querySelector(`[data-cellkey="group:3::${column}::0"]`)).toBeNull();
  }
});

it("suit le filtre de trésorerie sans remplacer le budget comparé dans les dépenses", () => {
  const page = renderGrid(880, { month: "2026-09", metric: "soldePrevu", onMonthChange: () => {}, comparison: { metrics: { income: "recu", expense: "budgetDep", balance: "soldePrevu" }, onChange: () => {} } });
  expect(page.querySelector('[data-cellkey="group:2::budget::0"]')).not.toBeNull();
  expect(page.querySelector('[data-cellkey="group:2::soldePrevu::0"] [data-treasury-remaining]')).not.toBeNull();
  expect(page.querySelector('[data-cellkey="group:2::solde::0"]')).toBeNull();
});

it("utilise les budgets pour le parcours du mois futur sur mobile", () => {
  const page = renderGrid(880, { month: "2026-10", metric: null, onMonthChange: () => {} });
  expect(page.querySelector('[data-cellkey="group:2::soldePrevu::1"] [data-treasury-remaining]')).not.toBeNull();
  expect(page.querySelector('[data-cellkey="group:2::solde::1"]')).toBeNull();
});

it("montre toute la sortie non catégorisée : provision plus dépassement, sans changer le résultat", () => {
  const page = renderGrid(880, undefined, true);
  const cell = page.querySelector('[data-cellkey="section:uncategorized::soldeDepass::0"]')!;
  expect(text(cell.querySelector('[data-treasury-movement]'))).toContain("−100,00");
  expect(text(cell.querySelector('[data-treasury-remaining]'))).toContain("880,00");
});
