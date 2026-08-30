import { listTransactions, findReconcileSuggestions } from "../../../db/repositories/transactions";
import { listGroups } from "../../../db/repositories/groups";
import { listAccounts } from "../../../db/repositories/accounts";
import { accountLabel } from "../../../lib/account";
import { TransactionsBrowser } from "@/components/transactions-browser";
import { ReconcileBanner } from "@/components/reconcile-banner";

import { pourMoi } from "@/lib/current-user";
import { currentOnboardingMode } from "@/lib/current-onboarding";
import { isDemoMode } from "@/lib/onboarding-mode";
import { DemoTransactions } from "@/components/demo-transactions";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const onboardingMode = await currentOnboardingMode();
  if (isDemoMode(onboardingMode)) return <DemoTransactions />;

  const { transactions, accounts, groups, suggestions } = await pourMoi(async (database, userId) => ({
    // Seul écran à voir les non comptabilisées : c'est ici qu'on les réactive.
    transactions: await listTransactions(database, userId, { includeIgnored: true }),
    accounts: (await listAccounts(database, userId)).map((a) => ({ id: a.id, label: accountLabel(a) })),
    groups: (await listGroups(database, userId)).map((g) => ({
      id: g.id,
      accountId: g.accountId,
      name: g.name,
      direction: g.direction,
      startMonth: g.startMonth,
      endMonth: g.endMonth,
      lines: g.lines.map((l) => ({ id: l.id, name: l.name })),
    })),
    suggestions: (await findReconcileSuggestions(database, userId)).map((s) => ({
      manual: { id: s.manual.id, date: s.manual.date, amount: s.manual.amount, label: s.manual.label },
      synced: { id: s.synced.id, date: s.synced.date, amount: s.synced.amount, label: s.synced.label },
    })),
  }));

  return (
    <div className="flex flex-col gap-4">
      <ReconcileBanner suggestions={suggestions} />
      <TransactionsBrowser transactions={transactions} groups={groups} accounts={accounts} />
    </div>
  );
}
