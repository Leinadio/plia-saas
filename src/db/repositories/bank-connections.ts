import type { Db } from "../pg";
import { supprimerCompte } from "./accounts";

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

const COLONNES = `id, user_id AS "userId", aspsp_name AS "aspspName", aspsp_country AS "aspspCountry",
                  session_id AS "sessionId", valid_until AS "validUntil", account_uids AS "accountUids"`;

// Une demande d'autorisation. Elle efface d'abord celle qui serait restée en attente
// sur la MÊME banque : la connexion se crée avant la redirection, donc refermer
// l'onglet de sa banque en laisse une derrière soi, et réessayer trois fois en
// laisserait trois. Une connexion déjà autorisée n'est pas touchée — reconnecter une
// banque tous les 90 jours est le geste normal, pas une reprise d'essai.
export async function createConnection(
  db: Db, userId: string, aspspName: string, aspspCountry: string,
): Promise<number> {
  await db.run(
    `DELETE FROM bank_connections WHERE user_id = $1 AND aspsp_name = $2 AND session_id IS NULL`,
    [userId, aspspName],
  );
  const ligne = await db.one<{ id: number }>(
    `INSERT INTO bank_connections (user_id, aspsp_name, aspsp_country) VALUES ($1, $2, $3) RETURNING id`,
    [userId, aspspName, aspspCountry],
  );
  return ligne!.id;
}

export function listConnections(db: Db, userId: string): Promise<BankConnection[]> {
  return db.all<BankConnection>(
    `SELECT ${COLONNES} FROM bank_connections WHERE user_id = $1 ORDER BY id`,
    [userId],
  );
}

// Les connexions qui ont abouti, c'est-à-dire celles dont la banque a rendu une
// session. Une demande abandonnée en route n'apprend rien à personne : l'afficher
// reviendrait à annoncer une banque « jamais autorisée » que l'utilisateur a lui-même
// renoncé à connecter.
export async function listActiveConnections(db: Db, userId: string): Promise<BankConnection[]> {
  const toutes = await listConnections(db, userId);
  return toutes.filter((c) => c.sessionId !== null);
}

// Écrit ce que la banque a rendu au retour de l'autorisation.
export async function setConnectionSession(
  db: Db, id: number, sessionId: string, validUntil: string, accountUids: string[] = [],
): Promise<void> {
  await db.run(
    `UPDATE bank_connections SET session_id = $1, valid_until = $2, account_uids = $3 WHERE id = $4`,
    [sessionId, validUntil, JSON.stringify(accountUids), id],
  );
}

export async function attachAccountToConnection(db: Db, accountId: string, connectionId: number): Promise<void> {
  await db.run(`UPDATE accounts SET connection_id = $1 WHERE id = $2`, [connectionId, accountId]);
}

// Sert à savoir quelle session présenter pour rafraîchir ce compte, et quelle banque
// redemander quand l'autorisation tombe.
export async function connectionOfAccount(db: Db, accountId: string): Promise<number | null> {
  const row = await db.one<{ c: number | null }>(`SELECT connection_id AS c FROM accounts WHERE id = $1`, [accountId]);
  return row?.c ?? null;
}

// Débrancher une banque. Ses comptes partent avec elle, et tout ce qui y pend :
// garder des comptes sans autorisation les figerait pour toujours, sans jamais
// pouvoir se resynchroniser ni s'expliquer à l'écran.
//
// Sans retour, comme deleteAccount. Le tout dans une seule transaction : à moitié
// faite, elle laisserait une banque disparue avec ses comptes encore là.
export async function deleteConnection(db: Db, id: number): Promise<void> {
  await db.tx(async (t) => {
    const comptes = await t.all<{ id: string }>(`SELECT id FROM accounts WHERE connection_id = $1`, [id]);
    for (const c of comptes) await supprimerCompte(t, c.id);
    await t.run(`DELETE FROM bank_connections WHERE id = $1`, [id]);
  });
}

// Une connexion par son identifiant, à condition qu'elle soit à l'appelant. Le
// propriétaire fait partie de la question : sans lui, un numéro suffirait à emprunter
// l'autorisation bancaire d'un autre.
export async function ownedConnection(db: Db, userId: string, id: number): Promise<BankConnection | null> {
  const row = await db.one<BankConnection>(
    `SELECT ${COLONNES} FROM bank_connections WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return row ?? null;
}
