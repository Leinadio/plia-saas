import type Database from "better-sqlite3";

// --- À qui appartient ce que l'on s'apprête à modifier ------------------------
//
// Les actions serveur reçoivent des numéros venus du navigateur. Un numéro de groupe,
// de sous-poste, de transaction, de compte. Rien n'oblige celui qui appelle à s'en
// tenir aux siens : il suffit de changer le chiffre dans la requête pour viser ceux
// d'un inconnu. C'est la faille la plus banale du web et elle passe toutes les
// authentifications du monde, puisque l'appelant est bel et bien connecté.
//
// Ces fonctions répondent à une seule question, et les actions refusent quand la
// réponse est non. Elles passent toutes par accounts.user_id : tout le budget pend au
// compte bancaire, donc c'est le seul endroit où le propriétaire est écrit.
//
// Un objet qui n'existe pas rend false, au même titre qu'un objet qui appartient à
// quelqu'un d'autre. L'appelant ne doit pas pouvoir distinguer les deux : savoir qu'un
// numéro existe est déjà un renseignement.

export function ownsAccount(db: Database.Database, userId: string, accountId: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM accounts WHERE id = ? AND user_id = ?`)
    .get(accountId, userId);
  return row !== undefined;
}

export function ownsGroup(db: Database.Database, userId: string, groupId: number): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM groups g JOIN accounts a ON a.id = g.account_id
       WHERE g.id = ? AND a.user_id = ?`,
    )
    .get(groupId, userId);
  return row !== undefined;
}

export function ownsLine(db: Database.Database, userId: string, lineId: number): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM group_lines l
       JOIN groups g ON g.id = l.group_id
       JOIN accounts a ON a.id = g.account_id
       WHERE l.id = ? AND a.user_id = ?`,
    )
    .get(lineId, userId);
  return row !== undefined;
}

export function ownsTransaction(db: Database.Database, userId: string, txnId: string): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM transactions t JOIN accounts a ON a.id = t.account_id
       WHERE t.id = ? AND a.user_id = ?`,
    )
    .get(txnId, userId);
  return row !== undefined;
}

// Le groupe 0 n'existe pas dans `groups` : il désigne les non catégorisés d'un compte
// (leur provision). C'est donc le compte qu'on vérifie, et l'appelant doit dire lequel.
export function ownsGroupOrUncategorized(
  db: Database.Database,
  userId: string,
  groupId: number,
  accountId: string | null,
): boolean {
  if (groupId === 0) return accountId !== null && ownsAccount(db, userId, accountId);
  return ownsGroup(db, userId, groupId);
}
