import type { Db } from "../pg";

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

export async function ownsAccount(db: Db, userId: string, accountId: string): Promise<boolean> {
  const row = await db.one(`SELECT 1 FROM accounts WHERE id = $1 AND user_id = $2`, [accountId, userId]);
  return row !== undefined;
}

export async function ownsGroup(db: Db, userId: string, groupId: number): Promise<boolean> {
  const row = await db.one(
    `SELECT 1 FROM groups g JOIN accounts a ON a.id = g.account_id
     WHERE g.id = $1 AND a.user_id = $2`,
    [groupId, userId],
  );
  return row !== undefined;
}

export async function ownsLine(db: Db, userId: string, lineId: number): Promise<boolean> {
  const row = await db.one(
    `SELECT 1 FROM group_lines l
     JOIN groups g ON g.id = l.group_id
     JOIN accounts a ON a.id = g.account_id
     WHERE l.id = $1 AND a.user_id = $2`,
    [lineId, userId],
  );
  return row !== undefined;
}

export async function ownsTransaction(db: Db, userId: string, txnId: string): Promise<boolean> {
  const row = await db.one(
    `SELECT 1 FROM transactions t JOIN accounts a ON a.id = t.account_id
     WHERE t.id = $1 AND a.user_id = $2`,
    [txnId, userId],
  );
  return row !== undefined;
}

// Le groupe 0 n'existe pas dans `groups` : il désigne les non catégorisés d'un compte
// (leur provision). C'est donc le compte qu'on vérifie, et l'appelant doit dire lequel.
export function ownsGroupOrUncategorized(
  db: Db,
  userId: string,
  groupId: number,
  accountId: string | null,
): Promise<boolean> {
  if (groupId === 0) return accountId !== null ? ownsAccount(db, userId, accountId) : Promise.resolve(false);
  return ownsGroup(db, userId, groupId);
}
