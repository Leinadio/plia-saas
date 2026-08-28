import type { Account } from "../db/repositories/accounts";
import type { TxnView } from "../db/repositories/transactions";
import { budgetChanges, type BudgetChange } from "./budget-history";
import { buildDemoFinances, DEMO_IDS } from "./demo-finances";
import { computeForecast, type AccountForecast } from "./forecast";
import {
  addMonthsKey,
  computeHistory,
  computeOverspends,
  computePlannedSoldes,
  computeSolde,
  computeTableEstimate,
  grandTotals,
  monthRange,
  monthlyOverspend,
  toDatedBudgets,
  toDatedLineAmounts,
  type HistorySection,
  type IgnoredBlock,
  type MonthCell,
  type Overspend,
  type PlannedSoldes,
  type SoldeColumn,
} from "./history";
import { recapCompte } from "./recap-compte";

export type DemoEdits = {
  monoprixGroupId: number | null;
  transportBudget: number;
};

export type DemoHistoryGroup = {
  id: number;
  name: string;
  direction: "in" | "out";
  startMonth?: string | null;
  endMonth?: string | null;
  changes: BudgetChange[];
  lines: {
    id: number;
    name: string;
    amount: number;
    startMonth?: string | null;
    endMonth?: string | null;
    changes: BudgetChange[];
  }[];
};

export type DemoHistoryProps = {
  months: string[];
  currentMonth: string;
  stripMin: string;
  stripMax: string;
  forecast: AccountForecast;
  sections: HistorySection[];
  ignoredBlocks: IgnoredBlock[];
  overspend: number[];
  grand: MonthCell[];
  groups: DemoHistoryGroup[];
  solde: SoldeColumn;
  planned: PlannedSoldes;
  accountId: string;
  overspendsByMonth: Record<string, Overspend[]>;
};

export function buildDemoProjection(month: string, edits: DemoEdits): {
  account: Account;
  dashboard: ReturnType<typeof recapCompte>;
  transactions: TxnView[];
  history: DemoHistoryProps;
} {
  const base = buildDemoFinances(month);
  const transactions = base.transactions.map((transaction) =>
    transaction.id === DEMO_IDS.monoprix
      ? { ...transaction, groupId: edits.monoprixGroupId, lineId: null }
      : { ...transaction },
  );
  const budgetAmounts = base.budgetAmounts.map((amount) =>
    amount.groupId === DEMO_IDS.transport && amount.effectiveMonth === month && amount.scope === "ongoing"
      ? { ...amount, amount: edits.transportBudget }
      : { ...amount },
  );
  const groups = base.groups.map((group) => ({
    ...group,
    lines: group.lines.map((line) => ({ ...line })),
  }));
  const datedBudgets = toDatedBudgets(budgetAmounts);
  const datedLines = toDatedLineAmounts(base.lineAmounts.map((amount) => ({ ...amount })));
  const txns = transactions.map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    amount: transaction.amount,
    label: transaction.label,
    accountId: transaction.accountId,
    groupId: transaction.groupId,
    lineId: transaction.lineId,
    excluded: transaction.excluded,
    comment: transaction.comment,
  }));

  const dashboardMonths = monthRange(month, addMonthsKey(month, 5));
  const historyMonths = monthRange(addMonthsKey(month, -1), addMonthsKey(month, 2));
  const forecast = computeForecast(base.account.id, base.account.balance, groups, txns, month, datedBudgets, datedLines);
  const sections = computeHistory(groups, txns, historyMonths, month, datedBudgets, datedLines);
  const estimate = computeTableEstimate(sections, historyMonths, month, base.account.balance)?.value
    ?? forecast.currentEstimate;
  const solde = computeSolde(sections, historyMonths, month, base.account.balance, estimate);
  const planned = computePlannedSoldes(sections, historyMonths, month, solde.openings, estimate, datedBudgets);
  const groupsForHistory: DemoHistoryGroup[] = groups.map((group) => ({
    id: group.id,
    name: group.name,
    direction: group.direction,
    startMonth: group.startMonth,
    endMonth: group.endMonth,
    changes: budgetChanges(datedBudgets[group.id] ?? []),
    lines: group.lines.map((line) => ({
      id: line.id,
      name: line.name,
      amount: line.amount,
      startMonth: line.startMonth,
      endMonth: line.endMonth,
      changes: budgetChanges(datedLines[line.id] ?? []),
    })),
  }));

  return {
    account: { ...base.account },
    dashboard: recapCompte(
      base.account.id,
      base.account.balance,
      groups,
      txns,
      dashboardMonths,
      month,
      datedBudgets,
      datedLines,
    ),
    transactions,
    history: {
      months: historyMonths,
      currentMonth: month,
      stripMin: historyMonths[0],
      stripMax: addMonthsKey(month, 12),
      forecast,
      sections,
      ignoredBlocks: [],
      overspend: monthlyOverspend(sections, historyMonths.length),
      grand: grandTotals(sections, historyMonths.length),
      groups: groupsForHistory,
      solde,
      planned,
      accountId: base.account.id,
      overspendsByMonth: computeOverspends(groups, txns, month, datedBudgets, datedLines).byMonth,
    },
  };
}
