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
import { beforeEach, expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import {
  createConnection, attachAccountToConnection, listConnections, listActiveConnections,
  setConnectionSession, connectionOfAccount,
} from "../../src/db/repositories/bank-connections";
import { TEST_USER } from "../helpers/test-user";

const AUTRE = "u-autre";
let db: Db;

beforeEach(async () => {
  db = dbFrom(await createTestDb());
});

test("une connexion appartient à un utilisateur et à une banque", async () => {
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  await createConnection(db, AUTRE, "BNP Paribas", "FR");

  const miennes = await listConnections(db, TEST_USER);
  expect(miennes.map((c) => c.aspspName)).toEqual(["CIC"]);
  expect(miennes[0].id).toBe(cic);
});

// Le cœur de l'affaire : deux banques cohabitent au lieu de s'écraser.
test("plusieurs banques cohabitent chez un même utilisateur", async () => {
  await createConnection(db, TEST_USER, "CIC", "FR");
  await createConnection(db, TEST_USER, "Boursorama Banque", "FR");

  expect((await listConnections(db, TEST_USER)).map((c) => c.aspspName).sort()).toEqual([
    "Boursorama Banque", "CIC",
  ]);
});

test("chaque connexion garde sa session et sa date d'expiration", async () => {
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  const bourso = await createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  await setConnectionSession(db, cic, "sess-cic", "2026-11-01T00:00:00Z");
  await setConnectionSession(db, bourso, "sess-bourso", "2026-12-01T00:00:00Z");

  const par = Object.fromEntries((await listConnections(db, TEST_USER)).map((c) => [c.aspspName, c]));
  expect(par["CIC"].sessionId).toBe("sess-cic");
  expect(par["Boursorama Banque"].validUntil).toBe("2026-12-01T00:00:00Z");
});

// Sans ce lien, une synchronisation ne saurait pas quelle session présenter pour tel
// compte, ni quelle banque redemander quand l'autorisation tombe.
test("un compte sait de quelle connexion il vient", async () => {
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  await upsertAccount(db, { id: "b1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  await attachAccountToConnection(db, "b1", cic);

  expect(await connectionOfAccount(db, "b1")).toBe(cic);
  expect(await connectionOfAccount(db, "jamais-vu")).toBeNull();
});

test("les connexions d'un autre restent invisibles", async () => {
  await createConnection(db, AUTRE, "BNP Paribas", "FR");
  expect(await listConnections(db, TEST_USER)).toEqual([]);
});

// --- Les demandes abandonnées -------------------------------------------------
// La connexion est créée AVANT la redirection vers la banque, pour que le retour sache
// à quoi se rattacher. Si l'utilisateur referme l'onglet de sa banque, elle reste là
// sans session : une banque « jamais autorisée » dans les réglages, qui n'apprend rien
// à personne et qui s'accumule à chaque essai.
test("une demande sans autorisation ne compte pas parmi les connexions actives", async () => {
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  await setConnectionSession(db, cic, "sess", "2026-11-01T00:00:00Z");
  await createConnection(db, TEST_USER, "Boursorama Banque", "FR"); // abandonnée en route

  expect((await listActiveConnections(db, TEST_USER)).map((c) => c.aspspName)).toEqual(["CIC"]);
  // Elle existe toujours : c'est l'affichage qui l'ignore, pas la base qui l'oublie.
  expect(await listConnections(db, TEST_USER)).toHaveLength(2);
});

// Sans quoi réessayer trois fois laisserait trois lignes mortes derrière soi.
test("une nouvelle demande efface la précédente restée en attente sur la même banque", async () => {
  await createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  await createConnection(db, TEST_USER, "Boursorama Banque", "FR");

  const restantes = (await listConnections(db, TEST_USER)).filter((c) => c.aspspName === "Boursorama Banque");
  expect(restantes).toHaveLength(1);
});

// Mais une connexion qui a bel et bien abouti ne se fait pas balayer par un nouvel
// essai : reconnecter une banque déjà connectée est le geste normal tous les 90 jours.
test("une nouvelle demande ne touche pas à une connexion déjà autorisée", async () => {
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  await setConnectionSession(db, cic, "sess", "2026-11-01T00:00:00Z");
  await createConnection(db, TEST_USER, "CIC", "FR");

  expect(await listConnections(db, TEST_USER)).toHaveLength(2);
});

// --- La reprise d'une base d'avant le trousseau -------------------------------
