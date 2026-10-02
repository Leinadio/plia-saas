import type { Db } from "../db/pg";
import type { Account } from "../db/repositories/accounts";
import type { BankConnection } from "../db/repositories/bank-connections";

type EbGet = <T>(path: string) => Promise<T>;
type SessionData = { accounts_data?: { uid: string; identification_hash?: string }[] };

// Les anciennes installations ne conservaient que l'uid temporaire. Même une
// session fermée rend encore les empreintes de ses comptes. On ne conserve jamais
// l'IBAN complet et on ne rapproche jamais sur un nom ou quatre chiffres.
export async function hydrateAccountIdentities(
  db: Db, userId: string, connections: BankConnection[], accounts: Account[], ebGet: EbGet,
): Promise<Record<string, string>> {
  const identities: Record<string, string> = {};
  for (const account of accounts) {
    if (account.identification_hash) identities[account.bank_uid ?? account.id] = account.identification_hash;
  }
  for (const cx of connections) {
    if (!cx.sessionId) continue;
    const known = accounts.filter(a => a.connection_id === cx.id);
    if (known.length > 0 && known.every(a => a.identification_hash)) continue;
    let session: SessionData;
    try {
      session = await ebGet<SessionData>(`/sessions/${cx.sessionId}`);
    } catch {
      // Le compte connu peut encore être rafraîchi par son uid. En revanche un
      // nouveau compte ne sera pas fusionné/créé si son identité reste ambiguë.
      continue;
    }
    for (const item of session.accounts_data ?? []) {
      if (!item.uid || !item.identification_hash) continue;
      identities[item.uid] = item.identification_hash;
      await db.pourUtilisateur(userId, t => t.run(
        `UPDATE accounts SET identification_hash = $1
         WHERE user_id = $2 AND connection_id = $3 AND COALESCE(bank_uid, id) = $4
           AND identification_hash IS NULL`,
        [item.identification_hash, userId, cx.id, item.uid],
      ));
    }
  }
  return identities;
}
