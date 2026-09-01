import type { Account } from "../db/repositories/accounts";
import type { BudgetAmount } from "../db/repositories/budget-amounts";
import type { LineAmount } from "../db/repositories/line-amounts";
import type { TxnView } from "../db/repositories/transactions";
import type { Group } from "./forecast";
import { addMonthsKey } from "./history";

export const DEMO_IDS = {
  account: "demo-account",
  missions: -10_001,
  delayedIncome: -10_002,
  rent: -20_001,
  courses: -20_002,
  transport: -20_003,
  software: -20_004,
  designSoftware: -30_001,
  notesSoftware: -30_002,
  cloudSoftware: -30_003,
  monoprix: "demo-txn-monoprix",
} as const;

export type DemoFinances = {
  account: Account;
  groups: Group[];
  transactions: TxnView[];
  budgetAmounts: BudgetAmount[];
  lineAmounts: LineAmount[];
};

const date = (month: string, day: number) => `${month}-${String(day).padStart(2, "0")}`;

export function buildDemoFinances(currentMonth: string): DemoFinances {
  const previousMonth = addMonthsKey(currentMonth, -1);
  const nextMonth = addMonthsKey(currentMonth, 1);
  const laterMonth = addMonthsKey(currentMonth, 2);

  const account: Account = {
    id: DEMO_IDS.account,
    name: "Compte Démo",
    iban_masked: null,
    balance: 2840.6,
    currency: "EUR",
    last_synced: `${currentMonth}-20T08:30:00.000Z`,
    custom_name: null,
    user_id: null,
    connection_id: null,
  };

  const groups: Group[] = [
    {
      id: DEMO_IDS.missions,
      accountId: account.id,
      name: "Missions",
      direction: "in",
      monthlyAmount: 3200,
      startMonth: previousMonth,
      endMonth: null,
      planned: true,
      lines: [],
    },
    {
      id: DEMO_IDS.delayedIncome,
      accountId: account.id,
      name: "Facture client décalée",
      direction: "in",
      monthlyAmount: 1800,
      startMonth: nextMonth,
      endMonth: nextMonth,
      planned: true,
      lines: [],
    },
    {
      id: DEMO_IDS.rent,
      accountId: account.id,
      name: "Loyer",
      direction: "out",
      monthlyAmount: 950,
      startMonth: previousMonth,
      endMonth: null,
      planned: true,
      lines: [],
    },
    {
      id: DEMO_IDS.courses,
      accountId: account.id,
      name: "Courses",
      direction: "out",
      monthlyAmount: 350,
      startMonth: previousMonth,
      endMonth: null,
      planned: true,
      lines: [],
    },
    {
      id: DEMO_IDS.transport,
      accountId: account.id,
      name: "Transport",
      direction: "out",
      monthlyAmount: 120,
      startMonth: previousMonth,
      endMonth: null,
      planned: true,
      lines: [],
    },
    {
      id: DEMO_IDS.software,
      accountId: account.id,
      name: "Logiciels",
      direction: "out",
      monthlyAmount: null,
      startMonth: previousMonth,
      endMonth: null,
      planned: true,
      lines: [
        { id: DEMO_IDS.designSoftware, name: "Création", amount: 15, startMonth: previousMonth, endMonth: null },
        { id: DEMO_IDS.notesSoftware, name: "Notes", amount: 10, startMonth: previousMonth, endMonth: null },
        { id: DEMO_IDS.cloudSoftware, name: "Cloud", amount: 24.99, startMonth: previousMonth, endMonth: null },
      ],
    },
  ];

  const transaction = (
    id: string,
    month: string,
    day: number,
    amount: number,
    label: string,
    groupId: number | null,
    lineId: number | null = null,
  ): TxnView => ({
    id,
    date: date(month, day),
    amount,
    label,
    accountId: account.id,
    accountLabel: account.name,
    groupId,
    lineId,
    excluded: false,
    ignored: false,
    // La démonstration ne rattache rien : chaque opération compte au mois de sa date.
    budgetMonth: null,
    manual: false,
    note: null,
    comment: null,
  });

  const transactions: TxnView[] = [
    transaction("demo-txn-mission-past", previousMonth, 8, 2600, "MISSION ATELIER", DEMO_IDS.missions),
    transaction("demo-txn-rent-past", previousMonth, 3, -950, "LOYER", DEMO_IDS.rent),
    transaction("demo-txn-courses-past", previousMonth, 12, -280, "ALIMENTATION", DEMO_IDS.courses),
    transaction("demo-txn-transport-past", previousMonth, 16, -90, "TRANSPORT", DEMO_IDS.transport),
    transaction("demo-txn-mission-current", currentMonth, 7, 2400, "MISSION STUDIO", DEMO_IDS.missions),
    transaction("demo-txn-rent-current", currentMonth, 3, -950, "LOYER", DEMO_IDS.rent),
    transaction("demo-txn-market-current", currentMonth, 11, -142.3, "MARCHÉ", DEMO_IDS.courses),
    transaction("demo-txn-groceries-current", currentMonth, 15, -74, "ÉPICERIE", DEMO_IDS.courses),
    transaction("demo-txn-transport-current", currentMonth, 18, -147.6, "MOBILITÉ", DEMO_IDS.transport),
    transaction("demo-txn-design-current", currentMonth, 6, -15, "OUTIL CRÉATION", DEMO_IDS.software, DEMO_IDS.designSoftware),
    transaction("demo-txn-notes-current", currentMonth, 9, -10, "OUTIL NOTES", DEMO_IDS.software, DEMO_IDS.notesSoftware),
    transaction("demo-txn-cloud-current", currentMonth, 14, -24.99, "STOCKAGE CLOUD", DEMO_IDS.software, DEMO_IDS.cloudSoftware),
    transaction(DEMO_IDS.monoprix, currentMonth, 19, -68.4, "MONOPRIX", null),
  ];

  const budgetAmounts: BudgetAmount[] = [
    { groupId: DEMO_IDS.missions, accountId: "", effectiveMonth: previousMonth, amount: 2600, scope: "ongoing" },
    { groupId: DEMO_IDS.missions, accountId: "", effectiveMonth: currentMonth, amount: 3200, scope: "ongoing" },
    { groupId: DEMO_IDS.delayedIncome, accountId: "", effectiveMonth: nextMonth, amount: 1800, scope: "once" },
    { groupId: DEMO_IDS.rent, accountId: "", effectiveMonth: previousMonth, amount: 950, scope: "ongoing" },
    { groupId: DEMO_IDS.courses, accountId: "", effectiveMonth: previousMonth, amount: 300, scope: "ongoing" },
    { groupId: DEMO_IDS.courses, accountId: "", effectiveMonth: currentMonth, amount: 350, scope: "ongoing" },
    { groupId: DEMO_IDS.transport, accountId: "", effectiveMonth: previousMonth, amount: 100, scope: "ongoing" },
    { groupId: DEMO_IDS.transport, accountId: "", effectiveMonth: currentMonth, amount: 120, scope: "ongoing" },
    { groupId: 0, accountId: account.id, effectiveMonth: currentMonth, amount: 100, scope: "ongoing" },
  ];

  const lineAmounts: LineAmount[] = [
    { lineId: DEMO_IDS.designSoftware, effectiveMonth: previousMonth, amount: 15, scope: "ongoing" },
    { lineId: DEMO_IDS.notesSoftware, effectiveMonth: previousMonth, amount: 10, scope: "ongoing" },
    { lineId: DEMO_IDS.cloudSoftware, effectiveMonth: previousMonth, amount: 24.99, scope: "ongoing" },
    { lineId: DEMO_IDS.cloudSoftware, effectiveMonth: laterMonth, amount: 29.99, scope: "ongoing" },
  ];

  return { account, groups, transactions, budgetAmounts, lineAmounts };
}
