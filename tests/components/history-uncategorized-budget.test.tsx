// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { HistoryGrid } from "@/components/history-grid";
import { TooltipProvider } from "@/components/ui/tooltip";
import { computeForecast, type Txn } from "@/lib/forecast";
import { computeHistory, computePlannedSoldes, computeSolde, grandTotals, monthlyOverspend } from "@/lib/history";
import type { CellDetail } from "@/lib/history-explain";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/app/historique", useSearchParams: () => new URLSearchParams() }));

it("explique les reçus et les dépenses à leur propre étape, sans financer le reste avec les revenus", async () => {
  const months = ["2026-09"];
  const transactions: Txn[] = [
    { id: "income", accountId: "a1", groupId: null, date: "2026-09-05", label: "Virement reçu", amount: 142.29 },
    { id: "expense", accountId: "a1", groupId: null, date: "2026-09-06", label: "Dépense", amount: -12.98 },
  ];
  const sections = computeHistory([], transactions, months, "2026-09");
  const solde = computeSolde(sections, months, "2026-09", 1129.31);
  const planned = computePlannedSoldes(sections, months, "2026-09", solde.openings);
  const onSelect = vi.fn<(detail: CellDetail) => void>();
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<TooltipProvider><HistoryGrid months={months} currentMonth="2026-09" stripMin="2026-01" stripMax="2026-12" forecast={computeForecast("a1", 1129.31, [], transactions, "2026-09")} sections={sections} solde={solde} planned={planned} grand={grandTotals(sections, 1)} overspend={monthlyOverspend(sections, 1)} groups={[]} onSelect={onSelect} selected={[]} anchor={null} accountId="a1" /></TooltipProvider>));
    for (const [key, amounts, result] of [
      ["section:uncategorized::reste::0", [0, -12.98], -12.98],
      ["section:uncat-in::soldePrevu::0", [1000, 142.29], 1142.29],
      ["section:uncat-in::soldeDepass::0", [1000, 142.29], 1142.29],
      ["section:uncategorized::soldeDepass::0", [1142.29, -12.98], 1129.31],
    ] as const) {
      onSelect.mockClear();
      const cell = container.querySelector('[data-cellkey="' + key + '"]')!;
      await act(async () => cell.querySelector("button")!.click());
      const detail = onSelect.mock.calls.at(-1)![0];
      expect(detail.nodes.map(n => n.amount)).toEqual(expect.arrayContaining([...amounts]));
      expect(detail.nodes.reduce((sum, n) => sum + n.amount, 0)).toBeCloseTo(result, 2);
      expect(detail.result).toBeCloseTo(result, 2);
    }
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
