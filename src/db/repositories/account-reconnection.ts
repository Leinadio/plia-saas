import type { Db } from "../pg";
import type { Account } from "./accounts";
import { assertCompatibleTransactions, mergePendingAccounts } from "../../lib/bank-reconnection";
import type { PendingBankTransaction } from "../../lib/bank-pending";

type StoredTransaction = {
  id: string; date: string; amount: number; group_id: number | null;
  line_id: number | null; excluded: boolean; budget_month: string | null; manual: boolean;
};

// Appelée dans la transaction de synchronisation, après tous les appels bancaires.
// Verrouiller les connexions dans un ordre stable sérialise deux rafraîchissements
// du même utilisateur, y compris quand ils visent deux sessions du même compte.
export async function accountForReconnection(
  db: Db, userId: string, uid: string, connectionId: number | undefined,
  identity: string | null, currency: string,
): Promise<{ id: string; previous: PendingBankTransaction[]; oldConnections: number[] } | null> {
  if (connectionId == null) return { id: uid, previous: (await db.one<Account>("SELECT * FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE", [uid, userId]))?.pending_transactions ?? [], oldConnections: [] };
  await db.all("SELECT id FROM bank_connections WHERE user_id = $1 ORDER BY id FOR UPDATE", [userId]);
  const cx = await db.one<{ aspsp_name: string; aspsp_country: string }>(
    "SELECT aspsp_name, aspsp_country FROM bank_connections WHERE id = $1 AND user_id = $2", [connectionId, userId],
  );
  if (!cx) return null; // une reconnexion concurrente a déjà remplacé cette session
  const candidates = await db.all<Account>(
    `SELECT a.* FROM accounts a JOIN bank_connections c ON a.connection_id = c.id
     WHERE a.user_id = $1 AND c.user_id = $1 AND c.aspsp_name = $2 AND c.aspsp_country = $3
     ORDER BY c.id, a.id FOR UPDATE OF a`, [userId, cx.aspsp_name, cx.aspsp_country],
  );
  const direct = candidates.find(a => (a.bank_uid ?? a.id) === uid);
  // Un appel lancé sur l'ancienne session ne doit pas rétablir son ancien solde.
  if (!direct && candidates.some(a => a.id === uid && a.bank_uid && a.bank_uid !== uid)) return null;
  const matches = identity ? candidates.filter(a => a.identification_hash === identity) : [];
  // Même après plusieurs renouvellements, un appel ancien déjà parti vers la
  // banque ne peut reprendre la main sur une connexion autorisée plus récemment.
  if (matches.some(a => a.connection_id != null && a.connection_id > connectionId)) return null;
  if (matches.some(a => a.currency !== currency)) throw new Error("Rattachement impossible : les devises des comptes diffèrent.");
  if (matches.length === 0 && !direct && candidates.some(a => !identity || !a.identification_hash)) {
    throw new Error("Impossible d'identifier l'ancien compte bancaire. Vos données sont conservées ; réessayez la reconnexion depuis Réglages.");
  }
  const kept = matches[0] ?? direct;
  if (!kept) return { id: uid, previous: [], oldConnections: [] };
  const oldConnections = [...new Set(matches.concat(kept).flatMap(a => a.connection_id == null ? [] : [a.connection_id]))];
  for (const duplicate of matches.slice(1)) {
    const current = await db.one<Account>("SELECT * FROM accounts WHERE id = $1", [kept.id]);
    await mergeAccount(db, userId, current!, duplicate);
  }
  const updated = await db.one<Account>("SELECT * FROM accounts WHERE id = $1", [kept.id]);
  return { id: kept.id, previous: updated?.pending_transactions ?? [], oldConnections };
}

async function mergeAccount(db: Db, userId: string, kept: Account, source: Account): Promise<void> {
  const pending = mergePendingAccounts(kept.pending_transactions ?? [], source.pending_transactions ?? [], kept.id, source.id);
  const transactions = await db.all<StoredTransaction>("SELECT * FROM transactions WHERE account_id = $1 ORDER BY id", [source.id]);
  for (const txn of transactions) {
    if (txn.manual) continue;
    if (!txn.id.startsWith(source.id + "::")) throw new Error("Rattachement impossible : une ancienne opération doit d'abord être identifiée.");
    const targetId = kept.id + txn.id.slice(source.id.length);
    const target = await db.one<StoredTransaction>("SELECT * FROM transactions WHERE id = $1 AND account_id = $2", [targetId, kept.id]);
    if (target) assertCompatibleTransactions(target, txn);
  }
  const budgetConflict = await db.one(
    `SELECT 1 FROM budget_amounts s JOIN budget_amounts k ON k.group_id = s.group_id
     AND k.effective_month = s.effective_month AND k.scope = s.scope
     WHERE s.account_id = $1 AND k.account_id = $2 AND s.amount <> k.amount`, [source.id, kept.id],
  );
  if (budgetConflict) throw new Error("Rattachement impossible : les provisions des deux comptes sont différentes.");

  await db.run("UPDATE groups SET account_id = $1 WHERE account_id = $2", [kept.id, source.id]);
  await db.run("UPDATE automation_rules SET account_id = $1 WHERE account_id = $2", [kept.id, source.id]);
  // Le module Voyage peut être installé indépendamment du socle du budget.
  if ((await db.one<{ present: string | null }>("SELECT to_regclass('public.module_trips')::text AS present"))?.present) {
    await db.run("UPDATE module_trips SET account_id = $1 WHERE account_id = $2 AND user_id = $3", [kept.id, source.id, userId]);
  }

  for (const txn of transactions) {
    const targetId = txn.manual ? txn.id : kept.id + txn.id.slice(source.id.length);
    if (txn.manual) {
      await db.run("UPDATE transactions SET account_id = $1 WHERE id = $2", [kept.id, txn.id]);
    } else {
      await db.run(
        `INSERT INTO transactions (id, account_id, date, amount, label, group_id, line_id, excluded, ignored, manual, note, comment, budget_month)
         SELECT $1, $2, date, amount, label, group_id, line_id, excluded, ignored, manual, note, comment, budget_month
         FROM transactions WHERE id = $3
         ON CONFLICT (id) DO UPDATE SET
           group_id = COALESCE(transactions.group_id, EXCLUDED.group_id),
           line_id = COALESCE(transactions.line_id, EXCLUDED.line_id),
           excluded = transactions.excluded OR EXCLUDED.excluded,
           ignored = transactions.ignored OR EXCLUDED.ignored,
           budget_month = COALESCE(transactions.budget_month, EXCLUDED.budget_month),
           note = CASE WHEN transactions.note = EXCLUDED.note THEN transactions.note ELSE NULLIF(concat_ws(E'\n', transactions.note, EXCLUDED.note), '') END,
           comment = CASE WHEN transactions.comment = EXCLUDED.comment THEN transactions.comment ELSE NULLIF(concat_ws(E'\n', transactions.comment, EXCLUDED.comment), '') END`,
        [targetId, kept.id, txn.id],
      );
      await db.run(
        `INSERT INTO reconcile_ignored (user_id, manual_id, synced_id)
         SELECT user_id, manual_id, $1 FROM reconcile_ignored WHERE synced_id = $2 AND user_id = $3
         ON CONFLICT DO NOTHING`, [targetId, txn.id, userId],
      );
      await db.run("DELETE FROM reconcile_ignored WHERE synced_id = $1 AND user_id = $2", [txn.id, userId]);
    }
    await db.run(
      `UPDATE automation_events SET account_id = $1, transaction_id = $2 WHERE transaction_id = $3
       AND NOT EXISTS (SELECT 1 FROM automation_events e WHERE e.transaction_id = $2 AND e.id <> automation_events.id)`,
      [kept.id, targetId, txn.id],
    );
    if (!txn.manual) await db.run("DELETE FROM transactions WHERE id = $1", [txn.id]);
  }
  await db.run(
    `INSERT INTO budget_amounts (group_id, account_id, effective_month, amount, scope)
     SELECT group_id, $1, effective_month, amount, scope FROM budget_amounts WHERE account_id = $2
     ON CONFLICT DO NOTHING`, [kept.id, source.id],
  );
  await db.run("DELETE FROM budget_amounts WHERE account_id = $1", [source.id]);
  await db.run(
    `INSERT INTO dismissed_notifications (user_id, id, dismissed_at)
     SELECT user_id, $1 || substr(id, length($2) + 1), dismissed_at FROM dismissed_notifications
     WHERE user_id = $3 AND starts_with(id, $2 || '::') ON CONFLICT DO NOTHING`, [kept.id, source.id, userId],
  );
  await db.run("DELETE FROM dismissed_notifications WHERE user_id = $1 AND starts_with(id, $2 || '::')", [userId, source.id]);
  await db.run("UPDATE accounts SET pending_transactions = $1::jsonb, custom_name = COALESCE(custom_name, $2) WHERE id = $3",
    [JSON.stringify(pending), source.custom_name, kept.id]);
  await db.run("DELETE FROM accounts WHERE id = $1 AND user_id = $2", [source.id, userId]);
}
