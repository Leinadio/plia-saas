// --- Supprimer un compte, supprimer une banque : côté action serveur ----------
//
// La suppression est le geste le plus irréversible de l'application. C'est donc celui
// où une garde manquante coûte le plus cher : un intrus authentifié qui poste le
// numéro d'un autre effacerait des mois de budget sans qu'aucune trace ne subsiste
// pour dire ce qui est parti.
import { ctx, freshDb, asUser } from "./setup";
import { TEST_USER } from "../../helpers/test-user";
import { beforeEach, expect, test } from "vitest";
import type Database from "better-sqlite3";
import { deleteAccountAction, deleteConnectionAction } from "../../../src/app/app/settings/actions";
import { upsertAccount, listAccounts } from "../../../src/db/repositories/accounts";
import {
  createConnection, setConnectionSession, attachAccountToConnection, listConnections,
} from "../../../src/db/repositories/bank-connections";
import { insertGroup } from "../../../src/db/repositories/groups";
import { upsertTransaction, listTransactions } from "../../../src/db/repositories/transactions";

const INTRUS = "u-intrus";

let db: Database.Database;
let cx: number;

// La victime possède la banque "CIC" et son compte "a1", garni d'une dépense et d'une
// opération. L'intrus a son propre compte, vide, et connaît les numéros de l'autre.
beforeEach(() => {
  db = freshDb();
  cx = createConnection(db, TEST_USER, "CIC", "FR");
  setConnectionSession(db, cx, "sess", "2026-11-01T00:00:00Z");
  attachAccountToConnection(db, "a1", cx);
  insertGroup(db, "a1", "Courses", "out", 400, "2025-01", null);
  upsertTransaction(db, { id: "t1", account_id: "a1", date: "2025-01-05", amount: -20, label: "CARREFOUR" });
  upsertAccount(db, { id: "a-intrus", name: "SG", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, INTRUS);
  asUser(INTRUS);
});

test("ne supprime pas le compte bancaire d'un autre", async () => {
  const form = new FormData();
  form.set("id", "a1");
  await deleteAccountAction(form);

  expect(listAccounts(db, TEST_USER).map((a) => a.id)).toEqual(["a1"]);
  expect(listTransactions(db, TEST_USER)).toHaveLength(1);
});

test("ne débranche pas la banque d'un autre", async () => {
  const form = new FormData();
  form.set("id", String(cx));
  await deleteConnectionAction(form);

  expect(listConnections(db, TEST_USER)).toHaveLength(1);
  expect(listAccounts(db, TEST_USER).map((a) => a.id)).toEqual(["a1"]);
});

// Le pendant : le propriétaire, lui, supprime bel et bien. Une garde qui bloquerait
// aussi le légitime serait une garde inutile.
test("le propriétaire débranche sa banque et perd ses comptes avec", async () => {
  asUser(TEST_USER);
  const form = new FormData();
  form.set("id", String(cx));
  await deleteConnectionAction(form);

  expect(listConnections(db, TEST_USER)).toEqual([]);
  expect(listAccounts(db, TEST_USER)).toEqual([]);
  expect(listTransactions(db, TEST_USER)).toEqual([]);
});

test("le propriétaire supprime son compte bancaire", async () => {
  asUser(TEST_USER);
  const form = new FormData();
  form.set("id", "a1");
  await deleteAccountAction(form);

  expect(listAccounts(db, TEST_USER)).toEqual([]);
  // La banque, elle, reste : on a retiré un compte, pas révoqué une autorisation.
  expect(listConnections(db, TEST_USER)).toHaveLength(1);
  expect(ctx.db).toBe(db);
});
