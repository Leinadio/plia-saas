import type { PendingBankTransaction } from "./bank-pending";

type TransactionChoices = {
  amount: number;
  date: string;
  group_id: number | null;
  line_id: number | null;
  excluded: boolean;
  budget_month: string | null;
};

// Une référence stable prouve le doublon, mais ne permet pas de choisir entre deux
// décisions contradictoires. La fusion s'arrête avant de perdre l'une des deux.
export function assertCompatibleTransactions(kept: TransactionChoices, incoming: TransactionChoices): void {
  if (kept.amount !== incoming.amount || kept.date !== incoming.date) {
    throw new Error("Rattachement impossible : une référence désigne deux opérations différentes.");
  }
  const chosen = (t: TransactionChoices) => t.group_id !== null || t.excluded;
  if (chosen(kept) && chosen(incoming) &&
      (kept.group_id !== incoming.group_id || kept.line_id !== incoming.line_id || kept.excluded !== incoming.excluded)) {
    throw new Error("Rattachement impossible : une opération a deux classements différents. Harmonisez-les dans Transactions puis réessayez.");
  }
  if (kept.budget_month && incoming.budget_month && kept.budget_month !== incoming.budget_month) {
    throw new Error("Rattachement impossible : une opération est rattachée à deux mois différents.");
  }
}

export function mergePendingAccounts(
  kept: PendingBankTransaction[], source: PendingBankTransaction[], keptId: string, sourceId: string,
): PendingBankTransaction[] {
  const result = new Map(kept.map(txn => [txn.id, { ...txn }]));
  for (const txn of source) {
    const prefix = `pending:${sourceId}:`;
    if (!txn.id.startsWith(prefix)) throw new Error("Rattachement impossible : une opération en attente n'est pas identifiable.");
    const id = `pending:${keptId}:${txn.id.slice(prefix.length)}`;
    const existing = result.get(id);
    if (!existing) { result.set(id, { ...txn, id }); continue; }
    for (const key of ["groupId", "lineId", "budgetMonth"] as const) {
      if (existing[key] !== undefined && txn[key] !== undefined && existing[key] !== txn[key]) {
        throw new Error("Rattachement impossible : une opération en attente a deux classements différents.");
      }
    }
    result.set(id, {
      ...txn, ...existing,
      groupId: existing.groupId !== undefined ? existing.groupId : txn.groupId,
      lineId: existing.lineId !== undefined ? existing.lineId : txn.lineId,
      budgetMonth: existing.budgetMonth !== undefined ? existing.budgetMonth : txn.budgetMonth,
    });
  }
  return [...result.values()];
}
