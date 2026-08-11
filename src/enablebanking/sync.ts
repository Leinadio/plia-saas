import type { Db } from "../db/pg";
import { parseAmount } from "../lib/money";
import { upsertAccount } from "../db/repositories/accounts";
import { attachAccountToConnection } from "../db/repositories/bank-connections";
import { upsertTransaction } from "../db/repositories/transactions";

type EbGet = <T>(path: string) => Promise<T>;

// L'identité d'une opération synchronisée : ce compte, cette référence. Le séparateur
// est partagé avec la reprise des données existantes.
export const TXN_ID_SEP = "::";
export const txnId = (accountUid: string, reference: string) => `${accountUid}${TXN_ID_SEP}${reference}`;

type BalancesResponse = { balances: { balance_amount: { amount: string; currency: string } }[] };
type AccountDetails = {
  account_id?: { iban?: string };
  name?: string;
  product?: string;
};
type EbTxn = {
  entry_reference?: string;
  transaction_id?: string;
  booking_date: string;
  transaction_amount: { amount: string; currency: string };
  credit_debit_indicator: "CRDT" | "DBIT";
  remittance_information?: string[];
};
type TxnResponse = {
  transactions: EbTxn[];
  // La clé de la page suivante. Absente sur la dernière.
  continuation_key?: string;
};

// Combien de temps on demande en arrière. Les banques bornent elles-mêmes ce qu'elles
// acceptent de rendre, souvent aux quatre-vingt-dix derniers jours : demander deux ans
// ne les force à rien, cela évite seulement de s'arrêter avant elles.
const HISTORIQUE_JOURS = 730;
// Garde-fou. Une banque qui rendrait toujours la même clé ferait tourner la
// synchronisation sans fin, sans jamais rien rapporter de plus.
const PAGES_MAX = 50;

// Toutes les opérations d'un compte, page après page.
//
// La banque n'en rend qu'une page à la fois, avec une clé pour demander la suivante.
// S'arrêter à la première, c'est ce qui plafonnait des comptes à cinquante opérations
// et donnait un historique de deux mois là où la banque en offrait davantage.
async function fetchTransactions(ebGet: EbGet, uid: string): Promise<EbTxn[]> {
  const depuis = new Date(Date.now() - HISTORIQUE_JOURS * 86_400_000).toISOString().slice(0, 10);
  const toutes: EbTxn[] = [];
  const clesVues = new Set<string>();
  let cle: string | undefined;
  // Toutes les banques n'acceptent pas une fenêtre aussi large. Un refus la fait
  // retomber, une fois, sur la demande sans fenêtre : mieux vaut les trois derniers
  // mois que rien du tout.
  let fenetre = true;

  for (let page = 0; page < PAGES_MAX; page++) {
    const params = new URLSearchParams();
    if (fenetre) params.set("date_from", depuis);
    if (cle) params.set("continuation_key", cle);
    const q = params.toString();

    let res: TxnResponse;
    try {
      res = await ebGet<TxnResponse>(`/accounts/${uid}/transactions${q ? `?${q}` : ""}`);
    } catch (e) {
      if (!fenetre) throw e;
      console.warn(`[sync] fenêtre de dates refusée pour ${uid}, nouvel essai sans :`, e);
      fenetre = false;
      page -= 1; // cette page n'a rien rapporté : elle est à refaire, pas à passer
      continue;
    }

    toutes.push(...(res.transactions ?? []));
    cle = res.continuation_key;
    // Pas de clé, ou une clé déjà vue : la banque n'a plus rien à donner.
    if (!cle || clesVues.has(cle)) break;
    clesVues.add(cle);
  }
  return toutes;
}

export async function syncAll(
  db: Db,
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

    // Tout ce que la banque a à dire est demandé AVANT d'écrire. Les écritures se
    // font ensuite d'un bloc, court : elles tiennent une connexion et la parole d'une
    // banque peut se faire attendre plusieurs secondes par compte.
    const operations = await fetchTransactions(deps.ebGet, uid);

    imported += await db.pourUtilisateur(deps.userId, async (t) => {
      await upsertAccount(t, {
        id: uid,
        name,
        iban_masked: ibanMasked,
        balance,
        currency: (balances.balances ?? [])[0]?.balance_amount.currency ?? "EUR",
        last_synced: nowIso,
      }, deps.userId);
      if (deps.connectionId != null) await attachAccountToConnection(t, uid, deps.connectionId);

      let nouvelles = 0;
      for (const op of operations) {
        const ref = op.entry_reference ?? op.transaction_id;
        if (!ref) continue;
        // Préfixé par le compte. La banque rend le même identifiant pour la même
        // opération à qui la lui demande, et l'insertion ignore les doublons : sans ce
        // préfixe, deux personnes branchées sur le même compte bancaire réel se
        // disputent les mêmes clés, et la seconde ne voit jamais rien arriver.
        const label = (op.remittance_information ?? []).join(" ").trim() || "(sans libellé)";
        nouvelles += await upsertTransaction(t, {
          id: txnId(uid, ref),
          account_id: uid,
          date: op.booking_date,
          amount: parseAmount(op.transaction_amount.amount, op.credit_debit_indicator),
          label,
        });
      }
      return nouvelles;
    });
  }

  return { imported };
}
