import { createHash } from "node:crypto";
import { parseAmount } from "./money";
import type { Txn } from "./forecast";

export type PendingChoices = { groupId?: number | null; lineId?: number | null; budgetMonth?: string | null };
export type PendingBankTransaction = { id: string; date: string | null; amount: number; label: string } & PendingChoices;
type BankOperation = {
  status?: string;
  entry_reference?: string;
  transaction_id?: string;
  booking_date: string | null;
  transaction_amount: { amount: string; currency: string };
  credit_debit_indicator: "CRDT" | "DBIT";
  remittance_information?: string[];
};

// Un instantané remplace le précédent à chaque synchro. Les références d'attente
// peuvent manquer ou changer lors de la comptabilisation : on ne les fusionne pas
// avec les opérations définitives et on ne leur invente pas une date bancaire.
export function pendingTransactions(accountId: string, operations: BankOperation[]): PendingBankTransaction[] {
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  return operations.filter(operation => operation.status === "PDNG").flatMap(operation => {
    const reference = operation.entry_reference ?? operation.transaction_id;
    if (reference && seen.has(reference)) return [];
    if (reference) seen.add(reference);
    const label = operation.remittance_information?.join(" ").trim() || "Opération bancaire en attente";
    const amount = parseAmount(operation.transaction_amount.amount, operation.credit_debit_indicator);
    const fingerprint = createHash("sha256").update(JSON.stringify(reference ?? [operation.booking_date, amount, operation.transaction_amount.currency, label])).digest("hex").slice(0, 24);
    const occurrence = counts.get(fingerprint) ?? 0;
    counts.set(fingerprint, occurrence + 1);
    return [{ id: `pending:${accountId}:${fingerprint}:${occurrence}`, date: operation.booking_date, amount, label }];
  });
}

export function pendingAsTransactions(accountId: string, pending: PendingBankTransaction[], currentMonth: string): Txn[] {
  return pending.map(transaction => ({
    ...transaction,
    date: transaction.date ?? "",
    accountId,
    groupId: transaction.groupId ?? null,
    budgetMonth: transaction.budgetMonth ?? currentMonth,
    pending: true,
  }));
}

// Une référence inchangée est prioritaire. Si elle change à la comptabilisation,
// le montant et le libellé doivent désigner une seule opération de chaque côté.
// Une ambiguïté ne doit jamais affecter les choix à une autre dépense.
export function reconcilePendingChoices(
  previous: PendingBankTransaction[], current: PendingBankTransaction[],
  booked: { id: string; pendingId: string; amount: number; label: string }[],
): { pending: PendingBankTransaction[]; assignments: { id: string; choices: PendingChoices }[] } {
  const remaining = new Map(previous.map(transaction => [transaction.id, transaction]));
  const targets = [
    ...current.map(transaction => ({ ...transaction, pendingId: transaction.id, booked: false })),
    ...booked.map(transaction => ({ ...transaction, booked: true })),
  ];
  const matches = new Map<string, PendingBankTransaction>();
  for (const target of targets) {
    const exact = remaining.get(target.pendingId);
    if (exact) { matches.set(target.id, exact); remaining.delete(exact.id); }
  }
  const same = (a: { amount: number; label: string }, b: { amount: number; label: string }) =>
    a.amount === b.amount && a.label.trim().toUpperCase() === b.label.trim().toUpperCase();
  for (const target of targets.filter(target => !matches.has(target.id))) {
    const candidates = [...remaining.values()].filter(previous => same(previous, target));
    const destinations = targets.filter(other => !matches.has(other.id) && same(other, target));
    if (candidates.length === 1 && destinations.length === 1) {
      matches.set(target.id, candidates[0]);
      remaining.delete(candidates[0].id);
    }
  }
  const choices = ({ groupId, lineId, budgetMonth }: PendingBankTransaction): PendingChoices => ({ groupId, lineId, budgetMonth });
  return {
    pending: current.map(transaction => ({ ...transaction, ...(matches.has(transaction.id) ? choices(matches.get(transaction.id)!) : {}) })),
    assignments: booked.filter(transaction => matches.has(transaction.id))
      .map(transaction => ({ id: transaction.id, choices: choices(matches.get(transaction.id)!) })),
  };
}
