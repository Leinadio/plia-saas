// --- À qui appartient un compte bancaire -------------------------------------
//
// Tout le budget pend au compte bancaire. Une transaction a son account_id, un groupe
// aussi, et un sous-poste appartient à son groupe. Poser le propriétaire sur `accounts`
// suffit donc à donner un propriétaire à tout le reste, sans toucher aux 208 lignes de
// transactions une par une.
//
// La migration attribue l'existant, et c'est là qu'il faut être prudent. Elle ne doit
// deviner que dans le seul cas où il n'y a rien à deviner : un utilisateur et un seul.
// À plusieurs elle se tait, parce qu'un compte donné au mauvais propriétaire est une
// fuite silencieuse et qu'un rattrapage à la main vaut mieux qu'un mauvais choix
// automatique.
import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { getDb } from "../../src/db/index";

// Les comptes d'une base héritée : écrits en SQL direct, SANS propriétaire, puisque
// c'est précisément l'état que la migration doit rattraper. upsertAccount, lui, en
// exige un.
function compteOrphelin(db: Database.Database, id: string, nom: string) {
  db.prepare(
    `INSERT INTO accounts (id, name, iban_masked, balance, currency, last_synced)
     VALUES (?, ?, NULL, 0, 'EUR', NULL)`,
  ).run(id, nom);
}

let dossier: string | null = null;

function chemin(): string {
  dossier = mkdtempSync(join(tmpdir(), "budget-owner-"));
  return join(dossier, "test.db");
}

afterEach(() => {
  if (dossier) rmSync(dossier, { recursive: true, force: true });
  dossier = null;
});

// La table que pose le CLI de Better Auth, réduite à ce qui compte ici.
const TABLE_USER = `CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL, image TEXT, createdAt DATE NOT NULL, updatedAt DATE NOT NULL
)`;

function ajouteUser(db: Database.Database, id: string, email: string) {
  db.prepare(
    `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, 0, '2026-08-09', '2026-08-09')`,
  ).run(id, id, email);
}

const proprietaires = (path: string): (string | null)[] => {
  const db = getDb(path);
  const rows = db.prepare(`SELECT user_id AS u FROM accounts ORDER BY id`).all() as { u: string | null }[];
  db.close();
  return rows.map((r) => r.u);
};

test("ajoute la colonne de propriétaire aux comptes", () => {
  const path = chemin();
  const db = getDb(path);
  const cols = (db.prepare(`PRAGMA table_info(accounts)`).all() as { name: string }[]).map((c) => c.name);
  db.close();
  expect(cols).toContain("user_id");
});

// Le cas de la reprise : une base qui existait avant les comptes utilisateurs, et son
// propriétaire qui vient de s'inscrire. Tout lui revient.
test("attribue les comptes existants à l'unique utilisateur inscrit", () => {
  const path = chemin();
  const db = getDb(path);
  db.exec(TABLE_USER);
  compteOrphelin(db, "b1", "CIC");
  compteOrphelin(db, "b2", "Joint");
  ajouteUser(db, "u1", "daniel@example.com");
  db.close();

  expect(proprietaires(path)).toEqual(["u1", "u1"]);
});

// Deux inscrits : la migration n'a aucun moyen de savoir à qui va quoi. Elle laisse
// les comptes sans propriétaire plutôt que d'en désigner un au hasard.
test("ne devine rien quand plusieurs utilisateurs existent", () => {
  const path = chemin();
  const db = getDb(path);
  db.exec(TABLE_USER);
  compteOrphelin(db, "b1", "CIC");
  ajouteUser(db, "u1", "daniel@example.com");
  ajouteUser(db, "u2", "maeva@example.com");
  db.close();

  expect(proprietaires(path)).toEqual([null]);
});

// Un compte déjà attribué ne change pas de mains, même si un second utilisateur
// s'inscrit ensuite ou si le premier disparaît.
test("ne réattribue jamais un compte déjà attribué", () => {
  const path = chemin();
  const db = getDb(path);
  db.exec(TABLE_USER);
  compteOrphelin(db, "b1", "CIC");
  ajouteUser(db, "u1", "daniel@example.com");
  db.close();
  expect(proprietaires(path)).toEqual(["u1"]);

  const db2 = getDb(path);
  ajouteUser(db2, "u2", "maeva@example.com");
  db2.close();

  expect(proprietaires(path)).toEqual(["u1"]);
});

// Une base de test n'a pas les tables de Better Auth. La migration doit passer son
// chemin sans lever, sinon getDb casse partout.
test("tourne sans la table des utilisateurs", () => {
  const path = chemin();
  const db = getDb(path);
  compteOrphelin(db, "b1", "CIC");
  db.close();

  expect(() => proprietaires(path)).not.toThrow();
  expect(proprietaires(path)).toEqual([null]);
});
