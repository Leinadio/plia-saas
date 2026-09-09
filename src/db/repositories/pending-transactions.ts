import type { Db } from "../pg";
import type { PendingBankTransaction, PendingChoices } from "../../lib/bank-pending";

// Appelé dans la transaction de pourMoi : la synchro et un changement de menu
// verrouillent le même compte, pour qu'aucun choix ne soit écrasé entre les deux.
export async function getPendingTransaction(db: Db, userId: string, id: string) {
  if (!id.startsWith("pending:")) return null;
  const account = await db.one<{ id: string; pending_transactions: PendingBankTransaction[] }>(
    `SELECT id, pending_transactions FROM accounts
     WHERE user_id = $1 AND pending_transactions @> $2::jsonb FOR UPDATE`,
    [userId, JSON.stringify([{ id }])],
  );
  const transaction = account?.pending_transactions.find(transaction => transaction.id === id);
  return account && transaction ? { ...transaction, accountId: account.id } : null;
}

export async function setPendingChoices(db: Db, userId: string, id: string, choices: PendingChoices): Promise<void> {
  await db.run(
    `UPDATE accounts SET pending_transactions = (
       SELECT jsonb_agg(CASE WHEN item->>'id' = $2 THEN item || $3::jsonb ELSE item END ORDER BY ordinal)
       FROM jsonb_array_elements(pending_transactions) WITH ORDINALITY AS entries(item, ordinal)
     ) WHERE user_id = $1 AND pending_transactions @> $4::jsonb`,
    [userId, id, JSON.stringify(choices), JSON.stringify([{ id }])],
  );
}
