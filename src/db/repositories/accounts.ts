import type { Db } from "../pg";

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
export async function upsertAccount(
  db: Db,
  a: Omit<Account, "custom_name" | "user_id" | "connection_id">,
  userId: string,
): Promise<void> {
  await db.run(
    `INSERT INTO accounts (id, name, iban_masked, balance, currency, last_synced, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, iban_masked = EXCLUDED.iban_masked,
       balance = EXCLUDED.balance, currency = EXCLUDED.currency,
       last_synced = EXCLUDED.last_synced`,
    [a.id, a.name, a.iban_masked, a.balance, a.currency, a.last_synced, userId],
  );
}

// --- userId obligatoire ------------------------------------------------------
// Il n'y a pas de valeur par défaut et il n'y en aura pas. Une fonction qui sait
// répondre sans propriétaire est une fonction qui fuit le jour où quelqu'un oublie de
// le passer, et l'oubli ne se voit nulle part : la page s'affiche, simplement elle
// montre les comptes de tout le monde. Le compilateur doit refuser l'appel.
//
// Un compte sans user_id n'appartient à personne. Il n'apparaît donc chez personne,
// même pas chez le premier connecté. C'est le cas des bases reprises où l'attribution
// n'a pas pu se décider.
export function listAccounts(db: Db, userId: string): Promise<Account[]> {
  return db.all<Account>("SELECT * FROM accounts WHERE user_id = $1", [userId]);
}

export async function totalBalance(db: Db, userId: string): Promise<number> {
  const row = await db.one<{ total: number }>(
    "SELECT COALESCE(SUM(balance), 0) AS total FROM accounts WHERE user_id = $1",
    [userId],
  );
  return row!.total;
}

export async function setAccountAlias(db: Db, id: string, alias: string | null): Promise<void> {
  await db.run("UPDATE accounts SET custom_name = $1 WHERE id = $2", [alias, id]);
}

// Supprime un compte et TOUT ce qui pend à lui. Le geste est sans retour et c'est
// voulu : un compte qu'on retire est un compte dont on ne veut plus les données.
//
// L'ordre compte. Les clés étrangères sont actives, donc les enfants partent avant
// leurs parents, et une table qui pointe vers `accounts` sans ON DELETE ferait échouer
// la suppression au lieu de la laisser passer.
//
// Les tables sans clé étrangère (budget_amounts, dismissed_notifications,
// reconcile_ignored) ne préviennent de rien : oubliées ici, elles laissent des lignes
// que plus aucun écran ne montre et que plus rien ne peut retirer.
export async function deleteAccount(db: Db, id: string): Promise<void> {
  await db.tx((t) => supprimerCompte(t, id));
}

// Le même travail, mais sans ouvrir de transaction : débrancher une banque supprime
// plusieurs comptes d'un coup et tient déjà la sienne. Une transaction dans une
// transaction n'existe pas — la deuxième validerait la première au passage, et un
// échec à mi-parcours laisserait une banque disparue avec la moitié de ses comptes.
export async function supprimerCompte(db: Db, id: string): Promise<void> {
  // Les paires de rapprochement écartées désignent des transactions par leur
  // identifiant ; elles doivent partir avant que celles-ci disparaissent.
  await db.run(
    `DELETE FROM reconcile_ignored
     WHERE manual_id IN (SELECT id FROM transactions WHERE account_id = $1)
        OR synced_id IN (SELECT id FROM transactions WHERE account_id = $1)`,
    [id],
  );
  await db.run("DELETE FROM transactions WHERE account_id = $1", [id]);
  // Les dépassements acquittés. L'identité vaut « compte::cible::mois » : on compare
  // le préfixe tel quel plutôt qu'avec LIKE, dont les jokers % et _ prendraient un
  // sens dans un identifiant de compte qui en contiendrait.
  await db.run(`DELETE FROM dismissed_notifications WHERE starts_with(id, $1::text || '::')`, [id]);
  // Les montants datés : ceux des dépenses du compte, et la provision des non
  // catégorisés, qui n'a pas de groupe et se range sous le compte lui-même.
  await db.run(
    `DELETE FROM line_amounts WHERE line_id IN (
       SELECT l.id FROM group_lines l JOIN groups g ON g.id = l.group_id WHERE g.account_id = $1)`,
    [id],
  );
  await db.run(
    `DELETE FROM budget_amounts
     WHERE account_id = $1
        OR group_id IN (SELECT id FROM groups WHERE account_id = $1)`,
    [id],
  );
  // group_lines part en cascade avec ses groupes.
  await db.run("DELETE FROM groups WHERE account_id = $1", [id]);
  await db.run("DELETE FROM accounts WHERE id = $1", [id]);
  // Rien à retirer ailleurs : la liste des comptes à synchroniser se lit désormais
  // dans `accounts` et sur la connexion, plus dans un réglage à tenir à jour.
}
