import type Database from "better-sqlite3";
import { parseAmount } from "../lib/money";
import { upsertAccount } from "../db/repositories/accounts";
import { attachAccountToConnection } from "../db/repositories/bank-connections";
import { upsertTransaction } from "../db/repositories/transactions";

type EbGet = <T>(path: string) => Promise<T>;

type BalancesResponse = { balances: { balance_amount: { amount: string; currency: string } }[] };
type AccountDetails = {
  account_id?: { iban?: string };
  name?: string;
  product?: string;
};
type TxnResponse = {
  transactions: {
    entry_reference?: string;
    transaction_id?: string;
    booking_date: string;
    transaction_amount: { amount: string; currency: string };
    credit_debit_indicator: "CRDT" | "DBIT";
    remittance_information?: string[];
  }[];
};

export async function syncAll(
  db: Database.Database,
  // userId : le compte bancaire rapporté par la banque appartient à celui qui a
  // autorisé la connexion. Sans lui il serait orphelin et n'apparaîtrait chez personne.
  // connectionId : la banque d'où vient ce compte. C'est ce lien qui dira plus tard
  // quelle autorisation renouveler quand celle-ci expirera.
  deps: { ebGet: EbGet; accountUids: string[]; accountName: string; userId: string; connectionId?: number },
): Promise<{ imported: number }> {
  let imported = 0;
  const nowIso = new Date().toISOString();

  for (const uid of deps.accountUids) {
    const balances = await deps.ebGet<BalancesResponse>(`/accounts/${uid}/balances`);
    const balance = Number.parseFloat((balances.balances ?? [])[0]?.balance_amount.amount ?? "0");

    // Account details (IBAN, name) are optional — never let them break a sync.
    let ibanMasked: string | null = null;
    let name = deps.accountName;
    try {
      const details = await deps.ebGet<AccountDetails>(`/accounts/${uid}/details`);
      const iban = details.account_id?.iban;
      if (iban) ibanMasked = "…" + iban.slice(-4);
      name = details.name || details.product || deps.accountName;
    } catch {
      // keep defaults
    }

    upsertAccount(db, {
      id: uid,
      name,
      iban_masked: ibanMasked,
      balance,
      currency: (balances.balances ?? [])[0]?.balance_amount.currency ?? "EUR",
      last_synced: nowIso,
    }, deps.userId);
    if (deps.connectionId != null) attachAccountToConnection(db, uid, deps.connectionId);

    const txns = await deps.ebGet<TxnResponse>(`/accounts/${uid}/transactions`);
    for (const t of (txns.transactions ?? [])) {
      const id = t.entry_reference ?? t.transaction_id;
      if (!id) continue;
      const label = (t.remittance_information ?? []).join(" ").trim() || "(sans libellé)";
      imported += upsertTransaction(db, {
        id,
        account_id: uid,
        date: t.booking_date,
        amount: parseAmount(t.transaction_amount.amount, t.credit_debit_indicator),
        label,
        category_id: null,
      });
    }
  }

  return { imported };
}
