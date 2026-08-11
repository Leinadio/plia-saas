import { TEST_USER } from "../helpers/test-user";
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { listTransactions, setTransactionIgnored, setTransactionGroup, sumIgnoredByAccount, upsertTransaction } from "../../src/db/repositories/transactions";
import { insertGroup } from "../../src/db/repositories/groups";

async function seed() {
  const db = dbFrom(await createTestDb());
  await upsertAccount(db, { id: "a1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  await upsertTransaction(db, { id: "t1", account_id: "a1", date: "2026-07-01", amount: -30, label: "COURSES" });
  await upsertTransaction(db, { id: "t2", account_id: "a1", date: "2026-07-02", amount: -70, label: "REMBOURSEMENT PRET AMI" });
  return db;
}

test("listTransactions masque les transactions non comptabilisées par défaut", async () => {
  const db = await seed();
  await setTransactionIgnored(db, "t2", true);
  expect((await listTransactions(db, TEST_USER)).map((t) => t.id)).toEqual(["t1"]);
});

test("listTransactions les rend avec includeIgnored, marquées ignored", async () => {
  const db = await seed();
  await setTransactionIgnored(db, "t2", true);
  const rows = await listTransactions(db, TEST_USER, { includeIgnored: true });
  expect(rows).toHaveLength(2);
  expect(rows.find((t) => t.id === "t2")!.ignored).toBe(true);
  expect(rows.find((t) => t.id === "t1")!.ignored).toBe(false);
});

test("setTransactionIgnored est réversible", async () => {
  const db = await seed();
  await setTransactionIgnored(db, "t2", true);
  await setTransactionIgnored(db, "t2", false);
  expect((await listTransactions(db, TEST_USER)).map((t) => t.id)).toEqual(["t2", "t1"]);
});

test("une transaction non comptabilisée ne pèse plus sur le total du mois", async () => {
  const db = await seed();
  const total = async () => (await listTransactions(db, TEST_USER, { month: "2026-07" })).reduce((s, t) => s + t.amount, 0);
  expect(await total()).toBe(-100);
  await setTransactionIgnored(db, "t2", true);
  expect(await total()).toBe(-30);
});

test("une transaction non comptabilisée garde son rattachement de groupe", async () => {
  const db = await seed();
  const gid = await insertGroup(db, "a1", "Courses", "out", 200, "2000-01", null);
  await setTransactionGroup(db, "t2", gid);
  await setTransactionIgnored(db, "t2", true);
  await setTransactionIgnored(db, "t2", false);
  expect((await listTransactions(db, TEST_USER)).find((t) => t.id === "t2")!.groupId).toBe(gid);
});

test("sumIgnoredByAccount totalise les montants hors calcul par compte, et rien d'autre", async () => {
  const db = await seed();
  await upsertAccount(db, { id: "a2", name: "CIC 2", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  await upsertTransaction(db, { id: "t3", account_id: "a2", date: "2026-07-03", amount: 3800, label: "VIR DGFIP" });
  await upsertTransaction(db, { id: "t4", account_id: "a2", date: "2026-07-04", amount: -25, label: "PEAGE" });

  // Aucune transaction hors calcul : aucun compte n'apparaît.
  expect(await sumIgnoredByAccount(db)).toEqual({});

  // Un encaissement et une sortie hors calcul, sur deux comptes différents.
  await setTransactionIgnored(db, "t3", true);
  await setTransactionIgnored(db, "t1", true);
  expect(await sumIgnoredByAccount(db)).toEqual({ a1: -30, a2: 3800 });

  // Remise dans les calculs : le compte disparaît du total.
  await setTransactionIgnored(db, "t1", false);
  expect(await sumIgnoredByAccount(db)).toEqual({ a2: 3800 });
});
