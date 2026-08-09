import type Database from "better-sqlite3";

// --- Le trousseau ------------------------------------------------------------
// Une connexion, c'est l'autorisation qu'une banque accorde de lire ses comptes : sa
// session, sa date d'expiration à 90 jours, et la banque concernée. Il y en a une par
// banque et par utilisateur.
//
// Elle vivait dans trois réglages uniques (session_id, account_uids,
// consent_valid_until), c'est-à-dire sur un crochet qui n'en tient qu'une : connecter
// une deuxième banque écrasait la première.
export type BankConnection = {
  id: number;
  userId: string;
  aspspName: string;
  aspspCountry: string;
  // Nulls tant que l'autorisation n'est pas revenue de la banque : la connexion est
  // créée AVANT la redirection, pour que le retour sache à quoi se rattacher.
  sessionId: string | null;
  validUntil: string | null;
  // Les uid rapportés par la banque, en JSON. Servent à la première synchronisation,
  // avant qu'aucun compte n'existe en base.
  accountUids: string | null;
};

export function createConnection(
  db: Database.Database, userId: string, aspspName: string, aspspCountry: string,
): number {
  const info = db
    .prepare(
      `INSERT INTO bank_connections (user_id, aspsp_name, aspsp_country) VALUES (?, ?, ?)`,
    )
    .run(userId, aspspName, aspspCountry);
  return Number(info.lastInsertRowid);
}

export function listConnections(db: Database.Database, userId: string): BankConnection[] {
  return db
    .prepare(
      `SELECT id, user_id AS userId, aspsp_name AS aspspName, aspsp_country AS aspspCountry,
              session_id AS sessionId, valid_until AS validUntil, account_uids AS accountUids
       FROM bank_connections WHERE user_id = ? ORDER BY id`,
    )
    .all(userId) as BankConnection[];
}

// Écrit ce que la banque a rendu au retour de l'autorisation.
export function setConnectionSession(
  db: Database.Database, id: number, sessionId: string, validUntil: string, accountUids: string[] = [],
): void {
  db.prepare(`UPDATE bank_connections SET session_id = ?, valid_until = ?, account_uids = ? WHERE id = ?`)
    .run(sessionId, validUntil, JSON.stringify(accountUids), id);
}

export function attachAccountToConnection(db: Database.Database, accountId: string, connectionId: number): void {
  db.prepare(`UPDATE accounts SET connection_id = ? WHERE id = ?`).run(connectionId, accountId);
}

// Sert à savoir quelle session présenter pour rafraîchir ce compte, et quelle banque
// redemander quand l'autorisation tombe.
export function connectionOfAccount(db: Database.Database, accountId: string): number | null {
  const row = db
    .prepare(`SELECT connection_id AS c FROM accounts WHERE id = ?`)
    .get(accountId) as { c: number | null } | undefined;
  return row?.c ?? null;
}

// Une connexion par son identifiant, à condition qu'elle soit à l'appelant. Le
// propriétaire fait partie de la question : sans lui, un numéro suffirait à emprunter
// l'autorisation bancaire d'un autre.
export function ownedConnection(db: Database.Database, userId: string, id: number): BankConnection | null {
  const row = db
    .prepare(
      `SELECT id, user_id AS userId, aspsp_name AS aspspName, aspsp_country AS aspspCountry,
              session_id AS sessionId, valid_until AS validUntil, account_uids AS accountUids
       FROM bank_connections WHERE id = ? AND user_id = ?`,
    )
    .get(id, userId) as BankConnection | undefined;
  return row ?? null;
}
