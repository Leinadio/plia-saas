import { applyNewTransactions } from "../lib/automation-service";
import type { Db } from "../db/pg";
import { parseAmount } from "../lib/money";
import { upsertAccount } from "../db/repositories/accounts";
import { attachAccountToConnection } from "../db/repositories/bank-connections";
import { accountForReconnection } from "../db/repositories/account-reconnection";
import { upsertTransaction, setTransactionGroup, setTransactionBudgetMonth } from "../db/repositories/transactions";
import { fenetreAcceptee } from "./periode";
import { bankBalances, type BankBalance } from "../lib/bank-balances";
import { pendingTransactions, reconcilePendingChoices } from "../lib/bank-pending";

type EbGet = <T>(path: string) => Promise<T>;

// L'identité d'une opération synchronisée : ce compte, cette référence. Le séparateur
// est partagé avec la reprise des données existantes.
export const TXN_ID_SEP = "::";
export const txnId = (accountUid: string, reference: string) => `${accountUid}${TXN_ID_SEP}${reference}`;

type BalancesResponse = { balances: BankBalance[] };
type AccountDetails = {
  account_id?: { iban?: string };
  identification_hash?: string;
  name?: string;
  product?: string;
};
type EbTxn = {
  entry_reference?: string;
  transaction_id?: string;
  booking_date: string | null;
  status?: string;
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
  const toutes: EbTxn[] = [];
  const clesVues = new Set<string>();
  let cle: string | undefined;
  // La fenêtre demandée. Elle se RESSERRE au fil des refus, en deux temps :
  //
  //   1. deux ans, ce que la plupart des banques bornent d'elles-mêmes ;
  //   2. ce que la banque annonce dans son refus — le CIC dit « pas plus de 90
  //      jours » et on lui redemande exactement ça (cf. fenetreAcceptee) ;
  //   3. plus de fenêtre du tout, et son défaut à elle.
  //
  // On ne redescend jamais deux fois par le même palier : une banque qui refuserait
  // encore la fenêtre qu'elle vient d'annoncer ferait tourner la boucle en rond.
  let depuis: string | null = new Date(Date.now() - HISTORIQUE_JOURS * 86_400_000).toISOString().slice(0, 10);
  let renegociee = false;

  for (let page = 0; page < PAGES_MAX; page++) {
    const params = new URLSearchParams();
    if (depuis) params.set("date_from", depuis);
    if (cle) params.set("continuation_key", cle);
    const q = params.toString();

    let res: TxnResponse;
    try {
      res = await ebGet<TxnResponse>(`/accounts/${uid}/transactions${q ? `?${q}` : ""}`);
    } catch (e) {
      // Plus de fenêtre à retirer : ce n'en était pas une, c'est une vraie panne.
      if (!depuis) throw e;
      const annoncee = renegociee ? null : fenetreAcceptee(e, new Date());
      if (annoncee) {
        // Une négociation attendue, pas un incident : une ligne, sans la pile.
        console.info(`[sync] ${uid} : la banque limite l'historique, redemande depuis ${annoncee}`);
        renegociee = true;
        depuis = annoncee;
      } else {
        console.warn(`[sync] fenêtre de dates refusée pour ${uid}, nouvel essai sans :`, e);
        depuis = null;
      }
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
  deps: { ebGet: EbGet; accountUids: string[]; accountName: string; userId: string; connectionId?: number; accountIdentities?: Record<string, string> },
): Promise<{ imported: number }> {
  let imported = 0;
  const nowIso = new Date().toISOString();

  for (const uid of deps.accountUids) {
    const balances = await deps.ebGet<BalancesResponse>(`/accounts/${uid}/balances`);
    const { balance, bookedBalance, currency } = bankBalances(balances.balances ?? []);

    // Account details (IBAN, name) are optional — never let them break a sync.
    let ibanMasked: string | null = null;
    let name = deps.accountName;
    let identity = deps.accountIdentities?.[uid] ?? null;
    try {
      const details = await deps.ebGet<AccountDetails>(`/accounts/${uid}/details`);
      const iban = details.account_id?.iban;
      if (iban) ibanMasked = "…" + iban.slice(-4);
      name = details.name || details.product || deps.accountName;
      identity ??= details.identification_hash ?? null;
    } catch {
      // keep defaults
    }

    // Tout ce que la banque a à dire est demandé AVANT d'écrire. Les écritures se
    // font ensuite d'un bloc, court : elles tiennent une connexion et la parole d'une
    // banque peut se faire attendre plusieurs secondes par compte.
    const operations = await fetchTransactions(deps.ebGet, uid);

    imported += await db.pourUtilisateur(deps.userId, async (t) => {
      const account = await accountForReconnection(t, deps.userId, uid, deps.connectionId, identity, currency);
      if (!account) return 0;
      const { id: accountId, previous } = account;
      await upsertAccount(t, {
        id: accountId,
        bank_uid: uid,
        identification_hash: identity,
        name,
        iban_masked: ibanMasked,
        balance,
        booked_balance: bookedBalance,
        pending_transactions: previous,
        currency,
        last_synced: nowIso,
      }, deps.userId);
      if (deps.connectionId != null) await attachAccountToConnection(t, accountId, deps.connectionId);

      let nouvelles = 0;
      const booked: { id: string; pendingId: string; amount: number; label: string }[] = [];
      for (const op of operations) {
        // L'attente est déjà dans l'écart entre les deux soldes. Elle n'est pas
        // une opération comptabilisée et peut n'avoir ni date ni référence stable.
        if (op.status === "PDNG" || !op.booking_date) continue;
        const ref = op.entry_reference ?? op.transaction_id;
        if (!ref) continue;
        // Préfixé par le compte. La banque rend le même identifiant pour la même
        // opération à qui la lui demande, et l'insertion ignore les doublons : sans ce
        // préfixe, deux personnes branchées sur le même compte bancaire réel se
        // disputent les mêmes clés, et la seconde ne voit jamais rien arriver.
        const label = (op.remittance_information ?? []).join(" ").trim() || "(sans libellé)";
        const transaction = {
          id: txnId(accountId, ref),
          account_id: accountId,
          date: op.booking_date,
          amount: parseAmount(op.transaction_amount.amount, op.credit_debit_indicator),
          label,
        };
        const inserted = await upsertTransaction(t, transaction);
        nouvelles += inserted;
        if (inserted) booked.push({
          id: transaction.id, amount: transaction.amount, label: transaction.label,
          pendingId: pendingTransactions(accountId, [{ ...op, status: "PDNG" }])[0].id,
        });
      }
      const reconciled = reconcilePendingChoices(previous, pendingTransactions(accountId, operations), booked);
      for (const { id, choices } of reconciled.assignments) {
        // Une enveloppe supprimée entre-temps ne doit pas bloquer toute la synchro.
        const destination = choices.groupId == null ? null : await t.one<{ groupId: number; lineId: number | null }>(
          `SELECT g.id AS "groupId", l.id AS "lineId" FROM groups g
           LEFT JOIN group_lines l ON l.group_id = g.id AND l.id = $2
           WHERE g.id = $1 AND g.account_id = $3 AND ($2::integer IS NULL OR l.id IS NOT NULL)`,
          [choices.groupId, choices.lineId ?? null, accountId],
        );
        await setTransactionGroup(t, id, destination?.groupId ?? null, false, destination?.lineId ?? null);
        await setTransactionBudgetMonth(t, id, choices.budgetMonth ?? null);
      }
      await t.run("UPDATE accounts SET pending_transactions = $1::jsonb WHERE id = $2", [JSON.stringify(reconciled.pending), accountId]);
      await applyNewTransactions(t, deps.userId, booked.map(op => op.id));
      if (deps.connectionId != null) await t.run(
        `UPDATE bank_connections SET sync_pending_uids = (
           SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)::text
           FROM jsonb_array_elements_text(COALESCE(sync_pending_uids, '[]')::jsonb) WHERE value <> $1)
         WHERE id = $2 AND user_id = $3`, [uid, deps.connectionId, deps.userId],
      );
      // Une connexion partiellement renouvelée conserve les comptes non partagés.
      for (const oldId of account.oldConnections) {
        if (oldId === deps.connectionId) continue;
        await t.run(`DELETE FROM bank_connections WHERE id = $1 AND user_id = $2
          AND NOT EXISTS (SELECT 1 FROM accounts WHERE connection_id = $1)`, [oldId, deps.userId]);
      }
      return nouvelles;
    });
  }

  return { imported };
}
