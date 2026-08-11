import type { Db } from "../pg";
import { randomUUID } from "node:crypto";

export type TxnRow = {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  label: string;
};

export type TxnView = {
  date: string;
  amount: number;
  label: string;
  id: string;
  accountId: string;
  accountLabel: string;
  groupId: number | null;
  lineId: number | null;
  excluded: boolean;
  ignored: boolean;
  manual: boolean;
  note: string | null;
  // Commentaire libre de l'utilisateur, affiché sous le libellé (cf. src/lib/txn-comment.ts).
  comment: string | null;
};

export type ReconcileSuggestion = { manual: TxnView; synced: TxnView };

// Rend le nombre de lignes réellement insérées (0 si elle existait déjà). Le RETURNING
// est là pour ça : Postgres ne rend pas de compteur de lignes touchées, mais il rend
// les lignes elles-mêmes, et il suffit de les compter.
export async function upsertTransaction(db: Db, t: TxnRow): Promise<number> {
  const inserees = await db.all<{ id: string }>(
    `INSERT INTO transactions (id, account_id, date, amount, label)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING RETURNING id`,
    [t.id, t.account_id, t.date, t.amount, t.label],
  );
  return inserees.length;
}

// Somme des montants non comptabilisés, par compte. Le solde renvoyé par la banque
// les contient forcément : ce sont de vraies opérations, elles ont bien été encaissées.
// Il faut donc les retrancher AVANT d'ancrer le moindre calcul, sinon les soldes
// reconstruits sont décalés d'autant — la chaîne rembobine des mouvements dont ces
// opérations sont absentes, à partir d'un solde qui, lui, les contient.
export async function sumIgnoredByAccount(db: Db): Promise<Record<string, number>> {
  const rows = await db.all<{ accountId: string; total: number }>(
    `SELECT account_id AS "accountId", COALESCE(SUM(amount), 0) AS total
     FROM transactions WHERE ignored GROUP BY account_id`,
  );
  return Object.fromEntries(rows.map((r) => [r.accountId, r.total]));
}

// Les transactions non comptabilisées sont masquées par défaut : tous les écrans
// de calcul (tableau de bord, prévisionnel, historique) les ignorent ainsi sans
// rien avoir à filtrer. Seul l'écran Transactions passe includeIgnored pour
// pouvoir les afficher et les réactiver.
// Les transactions de l'utilisateur, c'est-à-dire celles de ses comptes. Le filtre
// passe par la jointure sur accounts, déjà présente pour l'étiquette du compte.
export function listTransactions(
  db: Db,
  userId: string,
  filter?: { month?: string; includeIgnored?: boolean },
): Promise<TxnView[]> {
  // Le propriétaire d'abord : c'est la seule clause qui n'est jamais optionnelle.
  const clauses: string[] = ["a.user_id = $1"];
  const params: (string | number)[] = [userId];
  if (filter?.month) {
    params.push(filter.month);
    clauses.push(`substr(t.date, 1, 7) = $${params.length}`);
  }
  if (!filter?.includeIgnored) clauses.push("NOT t.ignored");

  return db.all<TxnView>(
    `SELECT t.id, t.date, t.amount, t.label, t.group_id AS "groupId", t.line_id AS "lineId",
            t.excluded, t.ignored, t.manual, t.note, t.comment,
            t.account_id AS "accountId",
            COALESCE(COALESCE(a.custom_name, a.name) || ' ' || a.iban_masked, COALESCE(a.custom_name, a.name)) AS "accountLabel"
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY t.date DESC`,
    params,
  );
}

// groupId non nul => rattachement manuel ; lineId => ligne récurrente précise
// (implique son groupe parent) ; excluded => forcé « non catégorisé ».
// Les cas sont mutuellement exclusifs : un groupe explicite lève l'exclusion,
// et choisir un groupe sans ligne remet line_id à NULL.
export async function setTransactionGroup(
  db: Db,
  id: string,
  groupId: number | null,
  excluded = false,
  lineId: number | null = null,
): Promise<void> {
  await db.run("UPDATE transactions SET group_id = $1, line_id = $2, excluded = $3 WHERE id = $4", [
    groupId,
    lineId,
    excluded,
    id,
  ]);
}

// Rend aux « non catégorisés » les transactions d'un groupe (ou d'une de ses lignes)
// tombant dans les mois donnés, et rend leur nombre. Appelée quand on raccourcit une
// durée de vie : les mois retirés ne peuvent plus rien porter.
//
// Le rattachement est défait POUR DE BON, en base — c'est tout le sens du geste. Une
// durée rallongée ensuite ne les ramène pas : rien ne saurait dire lesquelles avaient
// été détachées par ce raccourcissement-là plutôt que décatégorisées à la main, et
// deviner ferait rentrer dans un groupe des dépenses que personne n'y a remises. Elles
// se recatégorisent à la main, une par une, depuis Transactions.
//
// Le groupe parent part aussi quand on vise une ligne : sans ça, la transaction
// retomberait sous le récurrent au lieu des non catégorisés.
export async function detachTransactionsInMonths(
  db: Db,
  cible: { groupId: number } | { lineId: number },
  months: string[],
): Promise<number> {
  if (months.length === 0) return 0;
  const colonne = "lineId" in cible ? "line_id" : "group_id";
  const id = "lineId" in cible ? cible.lineId : cible.groupId;
  const touchees = await db.all<{ id: string }>(
    `UPDATE transactions SET group_id = NULL, line_id = NULL
     WHERE ${colonne} = $1 AND substr(date, 1, 7) = ANY($2) RETURNING id`,
    [id, months],
  );
  return touchees.length;
}

// Date d'une transaction (YYYY-MM-DD), null si elle n'existe pas. Sert à savoir de
// quel mois elle relève avant de la rattacher à un groupe.
export async function getTransactionDate(db: Db, id: string): Promise<string | null> {
  const row = await db.one<{ date: string }>(`SELECT date FROM transactions WHERE id = $1`, [id]);
  return row ? row.date : null;
}

// Pose (ou retire, avec null) le commentaire d'une transaction. Rien d'autre n'est
// touché : le commentaire s'ajoute au libellé de la banque, il ne le remplace pas.
export async function setTransactionComment(db: Db, id: string, comment: string | null): Promise<void> {
  await db.run("UPDATE transactions SET comment = $1 WHERE id = $2", [comment, id]);
}

// Marque une transaction comme non comptabilisée (ou la remet dans les calculs).
// Son rattachement de groupe est conservé : la réactiver la remet où elle était.
export async function setTransactionIgnored(db: Db, id: string, ignored: boolean): Promise<void> {
  await db.run("UPDATE transactions SET ignored = $1 WHERE id = $2", [ignored, id]);
}

export type ManualTxnInput = {
  accountId: string;
  date: string; // YYYY-MM-DD
  amount: number; // signé
  label: string;
  groupId: number | null;
  lineId: number | null;
};

// Insère une transaction saisie à la main. Identifiant préfixé « manual: ».
export async function insertManualTransaction(db: Db, input: ManualTxnInput): Promise<string> {
  const id = `manual:${randomUUID()}`;
  await db.run(
    `INSERT INTO transactions (id, account_id, date, amount, label, group_id, line_id, excluded, manual, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, TRUE, NULL)`,
    [id, input.accountId, input.date, input.amount, input.label, input.groupId, input.lineId],
  );
  return id;
}

// Édite une transaction manuelle (garde-fou : n'agit que sur une saisie manuelle).
export async function updateManualTransaction(
  db: Db,
  id: string,
  input: Omit<ManualTxnInput, "accountId">,
): Promise<void> {
  await db.run(
    `UPDATE transactions SET date = $1, amount = $2, label = $3, group_id = $4, line_id = $5
     WHERE id = $6 AND manual`,
    [input.date, input.amount, input.label, input.groupId, input.lineId, id],
  );
}

// Supprime une transaction manuelle (garde-fou : n'agit que sur une saisie manuelle).
export async function deleteManualTransaction(db: Db, id: string): Promise<void> {
  await db.run("DELETE FROM transactions WHERE id = $1 AND manual", [id]);
}

// Écart en jours entre deux dates "YYYY-MM-DD" (UTC, pur calendaire).
function dayDiff(a: string, b: string): number {
  const da = Date.parse(a + "T00:00:00Z");
  const db2 = Date.parse(b + "T00:00:00Z");
  return Math.round((da - db2) / 86_400_000);
}

// Paires (manuelle, synchronisée) probablement identiques : même compte, même
// montant, dates à windowDays près, non déjà écartées.
export async function findReconcileSuggestions(
  db: Db,
  userId: string,
  windowDays = 5,
): Promise<ReconcileSuggestion[]> {
  const all = await listTransactions(db, userId);
  const manuals = all.filter((t) => t.manual);
  const synced = all.filter((t) => !t.manual);
  const paires = await db.all<{ manual_id: string; synced_id: string }>(
    "SELECT manual_id, synced_id FROM reconcile_ignored",
  );
  const ignored = new Set(paires.map((r) => `${r.manual_id}|${r.synced_id}`));
  const out: ReconcileSuggestion[] = [];
  for (const m of manuals) {
    for (const s of synced) {
      if (s.accountId !== m.accountId) continue;
      if (s.amount !== m.amount) continue;
      if (Math.abs(dayDiff(m.date, s.date)) > windowDays) continue;
      if (ignored.has(`${m.id}|${s.id}`)) continue;
      out.push({ manual: m, synced: s });
    }
  }
  return out;
}

// Fusionne une saisie manuelle dans sa vraie ligne bancaire : on garde la ligne
// bancaire, on lui reporte groupe/ligne/étiquette de la manuelle, son libellé va
// dans note, puis la manuelle est supprimée. Atomique.
export async function mergeTransactions(
  db: Db,
  { syncedId, manualId }: { syncedId: string; manualId: string },
): Promise<void> {
  await db.tx(async (t) => {
    const m = await t.one<{ label: string; groupId: number | null; lineId: number | null }>(
      `SELECT label, group_id AS "groupId", line_id AS "lineId" FROM transactions WHERE id = $1 AND manual`,
      [manualId],
    );
    if (!m) return;
    const touchees = await t.all<{ id: string }>(
      `UPDATE transactions SET group_id = $1, line_id = $2, note = $3
       WHERE id = $4 AND NOT manual RETURNING id`,
      [m.groupId, m.lineId, m.label, syncedId],
    );
    // Cible synchronisée introuvable : on ne supprime pas la saisie manuelle.
    if (touchees.length === 0) return;
    await t.run("DELETE FROM transactions WHERE id = $1 AND manual", [manualId]);
  });
}

// Mémorise une paire écartée (« ce n'est pas la même »).
export async function ignoreMatch(db: Db, manualId: string, syncedId: string): Promise<void> {
  await db.run(
    "INSERT INTO reconcile_ignored (manual_id, synced_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [manualId, syncedId],
  );
}
