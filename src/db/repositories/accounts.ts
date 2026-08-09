import type Database from "better-sqlite3";

export type Account = {
  id: string;
  name: string;
  iban_masked: string | null;
  balance: number;
  currency: string;
  last_synced: string | null;
  custom_name: string | null;
  // Propriétaire. NULL sur les comptes hérités d'avant les comptes utilisateurs.
  user_id: string | null;
  // Connexion bancaire qui a rapporté ce compte. NULL avant le trousseau.
  connection_id: number | null;
};

// Le propriétaire est posé À LA CRÉATION et n'est jamais réécrit ensuite. Une
// resynchronisation ne doit pas pouvoir faire changer un compte de mains : le
// user_id de l'ON CONFLICT est volontairement absent.
export function upsertAccount(
  db: Database.Database,
  a: Omit<Account, "custom_name" | "user_id" | "connection_id">,
  userId: string,
): void {
  db.prepare(
    `INSERT INTO accounts (id, name, iban_masked, balance, currency, last_synced, user_id)
     VALUES (@id, @name, @iban_masked, @balance, @currency, @last_synced, @user_id)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, iban_masked = excluded.iban_masked,
       balance = excluded.balance, currency = excluded.currency,
       last_synced = excluded.last_synced`,
  ).run({ ...a, user_id: userId });
}

// --- userId obligatoire ------------------------------------------------------
// Il n'y a pas de valeur par défaut et il n'y en aura pas. Une fonction qui sait
// répondre sans propriétaire est une fonction qui fuit le jour où quelqu'un oublie de
// le passer, et l'oubli ne se voit nulle part : la page s'affiche, simplement elle
// montre les comptes de tout le monde. Le compilateur doit refuser l'appel.
//
// Un compte sans user_id n'appartient à personne. Il n'apparaît donc chez personne,
// même pas chez le premier connecté. C'est le cas des bases reprises où l'attribution
// n'a pas pu se décider (cf. migrateAccountOwner).
export function listAccounts(db: Database.Database, userId: string): Account[] {
  return db.prepare("SELECT * FROM accounts WHERE user_id = ?").all(userId) as Account[];
}

export function totalBalance(db: Database.Database, userId: string): number {
  const row = db
    .prepare("SELECT COALESCE(SUM(balance), 0) AS total FROM accounts WHERE user_id = ?")
    .get(userId) as { total: number };
  return row.total;
}

export function setAccountAlias(db: Database.Database, id: string, alias: string | null): void {
  db.prepare("UPDATE accounts SET custom_name = ? WHERE id = ?").run(alias, id);
}

// Supprime un compte et TOUT ce qui pend à lui. Le geste est sans retour et c'est
// voulu : un compte qu'on retire est un compte dont on ne veut plus les données.
//
// L'ordre compte. Les clés étrangères sont actives (foreign_keys = ON), donc les
// enfants partent avant leurs parents, et une table qui pointe vers `accounts` sans
// ON DELETE ferait échouer la suppression au lieu de la laisser passer.
//
// Les tables sans clé étrangère (budget_amounts, dismissed_notifications,
// reconcile_ignored) ne préviennent de rien : oubliées ici, elles laissent des lignes
// que plus aucun écran ne montre et que plus rien ne peut retirer.
export function deleteAccount(db: Database.Database, id: string): void {
  db.transaction(() => {
    // Les paires de rapprochement écartées désignent des transactions par leur
    // identifiant ; elles doivent partir avant que celles-ci disparaissent.
    db.prepare(
      `DELETE FROM reconcile_ignored
       WHERE manual_id IN (SELECT id FROM transactions WHERE account_id = ?)
          OR synced_id IN (SELECT id FROM transactions WHERE account_id = ?)`,
    ).run(id, id);
    db.prepare("DELETE FROM transactions WHERE account_id = ?").run(id);
    // Les dépassements acquittés. L'identité vaut « compte::cible::mois » : on compare
    // le préfixe caractère par caractère plutôt qu'avec LIKE, dont les jokers % et _
    // prendraient un sens dans un identifiant de compte qui en contiendrait.
    db.prepare(
      `DELETE FROM dismissed_notifications WHERE substr(id, 1, length(?) + 2) = ? || '::'`,
    ).run(id, id);
    // Les montants datés : ceux des dépenses du compte, et la provision des non
    // catégorisés, qui n'a pas de groupe et se range sous le compte lui-même.
    db.prepare(
      `DELETE FROM line_amounts WHERE line_id IN (
         SELECT l.id FROM group_lines l JOIN groups g ON g.id = l.group_id WHERE g.account_id = ?)`,
    ).run(id);
    db.prepare(
      `DELETE FROM budget_amounts
       WHERE account_id = ?
          OR group_id IN (SELECT id FROM groups WHERE account_id = ?)`,
    ).run(id, id);
    // group_lines et group_keywords partent en cascade avec leurs groupes.
    db.prepare("DELETE FROM groups WHERE account_id = ?").run(id);
    db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
    // Rien à retirer ailleurs : la liste des comptes à synchroniser se lit désormais
    // dans `accounts` et sur la connexion, plus dans un réglage à tenir à jour.
  })();
}
