// --- Le trousseau de connexions bancaires -------------------------------------
//
// Une connexion, c'est l'autorisation qu'une banque accorde pour lire ses comptes :
// une session, une date d'expiration à 90 jours, et la banque concernée. Elle vivait
// dans trois réglages uniques, `session_id`, `account_uids` et `consent_valid_until`,
// c'est-à-dire sur un crochet qui n'en tient qu'une. Connecter une deuxième banque
// écrasait la première, et un second inscrit héritait de la connexion du premier.
//
// D'où cette table : une ligne par banque et par utilisateur, et chaque compte
// bancaire pointe vers celle qui l'a rapporté. Sans ce lien, la synchronisation ne
// saurait pas quelle session présenter pour rafraîchir un compte donné, ni quelle
// banque redemander quand une autorisation expire.
import { afterEach, beforeEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { getDb } from "../../src/db/index";
import { setSetting } from "../../src/db/repositories/settings";
import { upsertAccount } from "../../src/db/repositories/accounts";
import {
  createConnection, attachAccountToConnection, listConnections, setConnectionSession,
  connectionOfAccount,
} from "../../src/db/repositories/bank-connections";
import { TEST_USER } from "../helpers/test-user";

const AUTRE = "u-autre";
let db: Database.Database;

beforeEach(() => {
  db = getDb(":memory:");
});

test("une connexion appartient à un utilisateur et à une banque", () => {
  const cic = createConnection(db, TEST_USER, "CIC", "FR");
  createConnection(db, AUTRE, "BNP Paribas", "FR");

  const miennes = listConnections(db, TEST_USER);
  expect(miennes.map((c) => c.aspspName)).toEqual(["CIC"]);
  expect(miennes[0].id).toBe(cic);
});

// Le cœur de l'affaire : deux banques cohabitent au lieu de s'écraser.
test("plusieurs banques cohabitent chez un même utilisateur", () => {
  createConnection(db, TEST_USER, "CIC", "FR");
  createConnection(db, TEST_USER, "Boursorama Banque", "FR");

  expect(listConnections(db, TEST_USER).map((c) => c.aspspName).sort()).toEqual([
    "Boursorama Banque", "CIC",
  ]);
});

test("chaque connexion garde sa session et sa date d'expiration", () => {
  const cic = createConnection(db, TEST_USER, "CIC", "FR");
  const bourso = createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  setConnectionSession(db, cic, "sess-cic", "2026-11-01T00:00:00Z");
  setConnectionSession(db, bourso, "sess-bourso", "2026-12-01T00:00:00Z");

  const par = Object.fromEntries(listConnections(db, TEST_USER).map((c) => [c.aspspName, c]));
  expect(par["CIC"].sessionId).toBe("sess-cic");
  expect(par["Boursorama Banque"].validUntil).toBe("2026-12-01T00:00:00Z");
});

// Sans ce lien, une synchronisation ne saurait pas quelle session présenter pour tel
// compte, ni quelle banque redemander quand l'autorisation tombe.
test("un compte sait de quelle connexion il vient", () => {
  const cic = createConnection(db, TEST_USER, "CIC", "FR");
  upsertAccount(db, { id: "b1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  attachAccountToConnection(db, "b1", cic);

  expect(connectionOfAccount(db, "b1")).toBe(cic);
  expect(connectionOfAccount(db, "jamais-vu")).toBeNull();
});

test("les connexions d'un autre restent invisibles", () => {
  createConnection(db, AUTRE, "BNP Paribas", "FR");
  expect(listConnections(db, TEST_USER)).toEqual([]);
});

// --- La reprise d'une base d'avant le trousseau -------------------------------
describe_reprise();

function describe_reprise() {
  let dossier: string | null = null;
  const chemin = () => {
    dossier = mkdtempSync(join(tmpdir(), "budget-trousseau-"));
    return join(dossier, "test.db");
  };
  afterEach(() => {
    if (dossier) rmSync(dossier, { recursive: true, force: true });
    dossier = null;
  });

  // Une base où la connexion vit encore dans les trois réglages, avec un seul inscrit :
  // il n'y a rien à deviner, la connexion est la sienne.
  test("reprend la connexion des anciens réglages", () => {
    const path = chemin();
    const avant = getDb(path);
    avant.exec(`CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL, createdAt DATE NOT NULL, updatedAt DATE NOT NULL
    )`);
    avant.prepare(
      `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
       VALUES ('u1', 'Daniel', 'daniel@example.com', 0, '2026-08-09', '2026-08-09')`,
    ).run();
    upsertAccount(avant, { id: "b1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, "u1");
    setSetting(avant, "session_id", "vieille-session");
    setSetting(avant, "account_uids", JSON.stringify(["b1"]));
    setSetting(avant, "consent_valid_until", "2026-11-01T00:00:00Z");
    avant.close();

    const apres = getDb(path);
    const cx = listConnections(apres, "u1");
    const rattache = connectionOfAccount(apres, "b1");
    apres.close();

    expect(cx).toHaveLength(1);
    expect(cx[0].sessionId).toBe("vieille-session");
    expect(cx[0].validUntil).toBe("2026-11-01T00:00:00Z");
    expect(rattache).toBe(cx[0].id);
  });

  // Deux inscrits : on ne devine pas à qui revient la connexion, comme pour les comptes.
  test("ne reprend rien quand plusieurs utilisateurs existent", () => {
    const path = chemin();
    const avant = getDb(path);
    avant.exec(`CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL, createdAt DATE NOT NULL, updatedAt DATE NOT NULL
    )`);
    for (const [id, mail] of [["u1", "a@x.fr"], ["u2", "b@x.fr"]]) {
      avant.prepare(
        `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, '2026-08-09', '2026-08-09')`,
      ).run(id, id, mail);
    }
    setSetting(avant, "session_id", "vieille-session");
    avant.close();

    const apres = getDb(path);
    const total = (apres.prepare(`SELECT COUNT(*) AS n FROM bank_connections`).get() as { n: number }).n;
    apres.close();
    expect(total).toBe(0);
  });
}
