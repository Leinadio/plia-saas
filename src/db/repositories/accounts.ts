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

export function deleteAccount(db: Database.Database, id: string): void {
  db.transaction(() => {
    db.prepare("DELETE FROM transactions WHERE account_id = ?").run(id);
    db.prepare("DELETE FROM groups WHERE account_id = ?").run(id);
    db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
    // Rien à retirer ailleurs : la liste des comptes à synchroniser se lit désormais
    // dans `accounts` et sur la connexion, plus dans un réglage à tenir à jour.
  })();
}
