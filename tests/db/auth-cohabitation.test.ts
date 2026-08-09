// Better Auth range ses comptes dans LA MÊME base que le budget. Nos migrations
// tournent à chaque ouverture et certaines détruisent des tables quand un marqueur de
// version leur manque (migrateGroupsV2 efface groups, group_lines et group_keywords).
// Deux fois déjà ce mécanisme a failli emporter des données réelles.
//
// Ce test ouvre une VRAIE base sur disque et la rouvre plusieurs fois avec les tables
// d'authentification en place. Il ne reproduit aucun bug connu : c'est un garde-fou,
// posé pour que la prochaine migration un peu large se fasse voir ici et pas chez un
// utilisateur qui perdrait son compte.
//
// Attention aussi au voisinage des noms. Better Auth crée `account` au singulier,
// qui n'a rien à voir avec `accounts`, les comptes bancaires. Une migration qui
// viserait l'un en croyant toucher l'autre passerait la relecture sans bruit.
import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb } from "../../src/db/index";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { insertGroup } from "../../src/db/repositories/groups";

let dossier: string | null = null;

function chemin(): string {
  dossier = mkdtempSync(join(tmpdir(), "budget-auth-"));
  return join(dossier, "test.db");
}

afterEach(() => {
  if (dossier) rmSync(dossier, { recursive: true, force: true });
  dossier = null;
});

// Les tables telles que le CLI de Better Auth les pose, réduites à ce qui nous
// intéresse ici : leur existence et leur contenu.
const TABLES_AUTH = `
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL, image TEXT, createdAt DATE NOT NULL, updatedAt DATE NOT NULL
  );
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY, expiresAt DATE NOT NULL, token TEXT NOT NULL UNIQUE,
    createdAt DATE NOT NULL, updatedAt DATE NOT NULL, ipAddress TEXT, userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id)
  );
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY, accountId TEXT NOT NULL, providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id), password TEXT,
    createdAt DATE NOT NULL, updatedAt DATE NOT NULL
  );
`;

// Une base garnie comme la vraie : un utilisateur avec son mot de passe et sa session,
// plus un compte bancaire et une dépense.
function baseGarnie(path: string) {
  const db = getDb(path);
  db.exec(TABLES_AUTH);
  db.prepare(
    `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
     VALUES ('u1', 'Daniel', 'daniel@example.com', 0, '2026-08-08', '2026-08-08')`,
  ).run();
  db.prepare(
    `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
     VALUES ('a1', 'daniel@example.com', 'credential', 'u1', 'hash', '2026-08-08', '2026-08-08')`,
  ).run();
  upsertAccount(db, { id: "b1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null });
  insertGroup(db, "b1", "Courses", "out", 400, "2026-01", null);
  db.close();
}

test("les migrations du budget laissent les comptes utilisateurs en place", () => {
  const path = chemin();
  baseGarnie(path);

  const db = getDb(path); // deuxième passage complet des migrations
  const users = db.prepare("SELECT email FROM user").all() as { email: string }[];
  const comptes = db.prepare("SELECT COUNT(*) AS n FROM account").get() as { n: number };
  db.close();

  expect(users.map((u) => u.email)).toEqual(["daniel@example.com"]);
  expect(comptes.n).toBe(1);
});

// `account` et `accounts` sont deux tables différentes. La première porte les moyens
// de connexion, la seconde les comptes bancaires. Aucune migration ne doit confondre.
test("le compte bancaire et le moyen de connexion ne se marchent pas dessus", () => {
  const path = chemin();
  baseGarnie(path);

  const db = getDb(path);
  const bancaires = db.prepare("SELECT id FROM accounts").all() as { id: string }[];
  const connexions = db.prepare("SELECT userId FROM account").all() as { userId: string }[];
  db.close();

  expect(bancaires.map((a) => a.id)).toEqual(["b1"]);
  expect(connexions.map((a) => a.userId)).toEqual(["u1"]);
});

test("supporte d'être rouverte encore et encore", () => {
  const path = chemin();
  baseGarnie(path);

  getDb(path).close();
  getDb(path).close();
  const db = getDb(path);
  const n = (db.prepare("SELECT COUNT(*) AS n FROM user").get() as { n: number }).n;
  const groupes = (db.prepare("SELECT COUNT(*) AS n FROM groups").get() as { n: number }).n;
  db.close();

  expect([n, groupes]).toEqual([1, 1]);
});
