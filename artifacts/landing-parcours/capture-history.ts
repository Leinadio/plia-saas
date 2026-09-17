import { buildDemoFinances } from "@/lib/demo-finances";
import { budgetChanges } from "@/lib/budget-history";
import { computeForecast } from "@/lib/forecast";
import {
  computeHistory,
  computeSolde,
  computeTableEstimate,
  computePlannedSoldes,
  computeOverspends,
  monthlyOverspend,
  grandTotals,
  toDatedBudgets,
  toDatedLineAmounts,
  addMonthsKey,
} from "@/lib/history";
import type { CaptureBudgetInput } from "./capture-budget-action";

// Real calculations over local fixtures, including a newly created demo budget.
export function captureHistory(month: string, added: CaptureBudgetInput[]) {
  const base = buildDemoFinances(month);
  const groups = [
    ...base.groups,
    ...added.map((input, index) => ({
      id: -90000 - index,
      accountId: base.account.id,
      name: input.name,
      direction: input.direction ?? "out",
      monthlyAmount: input.amount,
      startMonth: input.startMonth,
      endMonth: null,
      planned: true,
      lines: [],
    })),
  ];
  const budgets = toDatedBudgets([
    ...base.budgetAmounts,
    ...added.map((input, index) => ({
      groupId: -90000 - index,
      accountId: base.account.id,
      effectiveMonth: input.startMonth,
      amount: input.amount ?? 0,
      scope: "ongoing" as const,
    })),
  ]);
  const lines = toDatedLineAmounts(base.lineAmounts);
  const months = [month];
  const sections = computeHistory(
    groups,
    base.transactions,
    months,
    month,
    budgets,
    lines,
  );
  const forecast = computeForecast(
    base.account.id,
    base.account.balance,
    groups,
    base.transactions,
    month,
    budgets,
    lines,
  );
  const estimate =
    computeTableEstimate(sections, months, month, base.account.balance)
      ?.value ?? forecast.currentEstimate;
  const solde = computeSolde(
    sections,
    months,
    month,
    base.account.balance,
    estimate,
  );
  return {
    months,
    currentMonth: month,
    stripMin: addMonthsKey(month, -1),
    stripMax: addMonthsKey(month, 12),
    accountId: base.account.id,
    forecast,
    sections,
    solde,
    planned: computePlannedSoldes(
      sections,
      months,
      month,
      solde.openings,
      estimate,
      budgets,
    ),
    overspend: monthlyOverspend(sections, months.length),
    grand: grandTotals(sections, months.length),
    overspendsByMonth: computeOverspends(
      groups,
      base.transactions,
      month,
      budgets,
      lines,
    ).byMonth,
    groups: groups.map((group) => ({
      ...group,
      changes: budgetChanges(budgets[group.id] ?? []),
      lines: group.lines.map((line) => ({
        ...line,
        changes: budgetChanges(lines[line.id] ?? []),
      })),
    })),
  };
}
