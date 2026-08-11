import { db } from "../../../db/index";
import { listTransactions, findReconcileSuggestions } from "../../../db/repositories/transactions";
import { listGroups } from "../../../db/repositories/groups";
import { listAccounts } from "../../../db/repositories/accounts";
import { accountLabel } from "../../../lib/account";
import { TransactionsBrowser } from "@/components/transactions-browser";
import { ReconcileBanner } from "@/components/reconcile-banner";

import { requireUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const userId = await requireUserId();
  const database = db();
  // Seul écran à voir les non comptabilisées : c'est ici qu'on les réactive.
  const transactions = await listTransactions(database, userId, { includeIgnored: true });
  const accounts = (await listAccounts(database, userId)).map((a) => ({ id: a.id, label: accountLabel(a) }));
  const groups = (await listGroups(database, userId)).map((g) => ({
    id: g.id,
    accountId: g.accountId,
    name: g.name,
    direction: g.direction,
    startMonth: g.startMonth,
    endMonth: g.endMonth,
    lines: g.lines.map((l) => ({ id: l.id, name: l.name })),
  }));

  const suggestions = (await findReconcileSuggestions(database, userId)).map((s) => ({
    manual: { id: s.manual.id, date: s.manual.date, amount: s.manual.amount, label: s.manual.label },
    synced: { id: s.synced.id, date: s.synced.date, amount: s.synced.amount, label: s.synced.label },
  }));

  return (
    <div className="flex flex-col gap-4">
      <ReconcileBanner suggestions={suggestions} />
      <TransactionsBrowser transactions={transactions} groups={groups} accounts={accounts} />
    </div>
  );
}
