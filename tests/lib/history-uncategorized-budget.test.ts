import { describe, expect, it } from "vitest";
import { computeHistory, computeOverspends, computePlannedSoldes, computeSolde } from "@/lib/history";
import type { Txn } from "@/lib/forecast";

const months = ["2026-09", "2026-10"];
const transactions: Txn[] = [
  { id: "income", accountId: "a1", groupId: null, date: "2026-09-05", label: "Virement reçu", amount: 142.29 },
  { id: "expense", accountId: "a1", groupId: null, date: "2026-09-06", label: "Dépense", amount: -12.98 },
];

describe("Dépenses sans budget et revenus non catégorisés distincts", () => {
  it.each([
    { budget: 0, remaining: -12.98, overspend: 12.98 },
    { budget: 5, remaining: -7.98, overspend: 7.98 },
    { budget: 20, remaining: 7.02, overspend: 0 },
  ])("calcule le reste à partir du seul budget de $budget euros", ({ budget, remaining, overspend }) => {
    const dated = { 0: [{ effectiveMonth: "2026-09", amount: budget }] };
    const sections = computeHistory([], transactions, months, "2026-09", dated);
    const expense = sections.find(s => s.uncatDirection === "out")!;
    expect(expense.totals[0].balance).toBeCloseTo(remaining, 2);
    const notices = computeOverspends([], transactions, "2026-09", dated).byMonth["2026-09"] ?? [];
    expect(notices.reduce((sum, notice) => sum + notice.amount, 0)).toBeCloseTo(overspend, 2);
  });

  it("ajoute le reçu à son étape et retire la dépense une seule fois de la trésorerie", () => {
    const sections = computeHistory([], transactions, months, "2026-09");
    const real = computeSolde(sections, months, "2026-09", 1129.31);
    expect(real.openings[0]).toBeCloseTo(1000, 2);
    expect(real.closings[0]).toBeCloseTo(1129.31, 2);
    const planned = computePlannedSoldes(sections, months, "2026-09", real.openings, 1129.31);
    expect(planned.uncatPrevuRunning.in?.[0]).toBeCloseTo(1142.29, 2);
    expect(planned.uncatDepassRunning.in?.[0]).toBeCloseTo(1142.29, 2);
    expect(planned.uncatPrevuRunning.out?.[0]).toBeCloseTo(1142.29, 2);
    expect(planned.uncatDepassRunning.out?.[0]).toBeCloseTo(1129.31, 2);
    expect(planned.depassClosings[0]).toBeCloseTo(real.closings[0], 2);
    expect(planned.depassClosings[1]).toBeCloseTo(1129.31, 2);
  });
});
