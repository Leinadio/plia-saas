import { TEST_USER } from "../helpers/test-user";
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { insertManualTransaction, listTransactions, updateManualTransaction, deleteManualTransaction, upsertTransaction, findReconcileSuggestions, mergeTransactions, ignoreMatch } from "../../src/db/repositories/transactions";
import { insertGroup } from "../../src/db/repositories/groups";

async function seed() {
  const db = dbFrom(await createTestDb());
  await upsertAccount(db, { id: "a1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  return db;
}

test("insertManualTransaction stores a manual row and lists it back", async () => {
  const db = await seed();
  const id = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 652.09, label: "Rémunération juillet",
    groupId: null, lineId: null, });
  expect(id.startsWith("manual:")).toBe(true);
  const rows = await listTransactions(db, TEST_USER);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    id, amount: 652.09, label: "Rémunération juillet",
    manual: true, note: null,
  });
});

test("updateManualTransaction edits a manual row, ignores synced rows", async () => {
  const db = await seed();
  const id = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 100, label: "brouillon",
    groupId: null, lineId: null, });
  await updateManualTransaction(db, id, {
    date: "2026-07-02", amount: 200, label: "corrigé", groupId: null, lineId: null, });
  const t = (await listTransactions(db, TEST_USER)).find((x) => x.id === id)!;
  expect(t).toMatchObject({ date: "2026-07-02", amount: 200, label: "corrigé" });

  // une ligne synchronisée n'est pas modifiée
  await upsertTransaction(db, { id: "bank1", account_id: "a1", date: "2026-07-01", amount: -50, label: "BANK" });
  await updateManualTransaction(db, "bank1", { date: "2000-01-01", amount: 999, label: "hack", groupId: null, lineId: null });
  expect((await listTransactions(db, TEST_USER)).find((x) => x.id === "bank1")).toMatchObject({ date: "2026-07-01", amount: -50, label: "BANK" });
});

test("deleteManualTransaction removes only manual rows", async () => {
  const db = await seed();
  const id = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 10, label: "x", groupId: null, lineId: null, });
  await upsertTransaction(db, { id: "bank1", account_id: "a1", date: "2026-07-01", amount: -50, label: "BANK" });
  await deleteManualTransaction(db, "bank1"); // refusé (non manuel)
  expect(await listTransactions(db, TEST_USER)).toHaveLength(2);
  await deleteManualTransaction(db, id);
  expect((await listTransactions(db, TEST_USER)).map((t) => t.id)).toEqual(["bank1"]);
});

test("findReconcileSuggestions matches by account, amount and date window", async () => {
  const db = await seed();
  await upsertAccount(db, { id: "a2", name: "Livret", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  const m = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 652.09, label: "Rémunération", groupId: null, lineId: null, });
  // candidat valide : même compte, même montant, 3 jours plus tard
  await upsertTransaction(db, { id: "bank_ok", account_id: "a1", date: "2026-07-04", amount: 652.09, label: "VIR SEPA" });
  // hors fenêtre (10 jours)
  await upsertTransaction(db, { id: "bank_far", account_id: "a1", date: "2026-07-11", amount: 652.09, label: "VIR" });
  // autre montant
  await upsertTransaction(db, { id: "bank_amt", account_id: "a1", date: "2026-07-02", amount: 100, label: "VIR" });
  // autre compte
  await upsertTransaction(db, { id: "bank_acc", account_id: "a2", date: "2026-07-02", amount: 652.09, label: "VIR" });

  const sugg = await findReconcileSuggestions(db, TEST_USER);
  expect(sugg).toHaveLength(1);
  expect(sugg[0].manual.id).toBe(m);
  expect(sugg[0].synced.id).toBe("bank_ok");
});

test("findReconcileSuggestions skips ignored pairs", async () => {
  const db = await seed();
  const m = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 50, label: "top-up", groupId: null, lineId: null, });
  await upsertTransaction(db, { id: "bank_ok", account_id: "a1", date: "2026-07-02", amount: 50, label: "VIR" });
  expect(await findReconcileSuggestions(db, TEST_USER)).toHaveLength(1);
  await db.run("INSERT INTO reconcile_ignored (user_id, manual_id, synced_id) VALUES ($1, $2, $3)", [TEST_USER, m, "bank_ok"]);
  expect(await findReconcileSuggestions(db, TEST_USER)).toHaveLength(0);
});

test("findReconcileSuggestions enforces boundary at exactly 5-day window", async () => {
  const db = await seed();
  const m = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 100, label: "test boundary", groupId: null, lineId: null, });
  // +5 days: should be included
  await upsertTransaction(db, { id: "bank_5days", account_id: "a1", date: "2026-07-06", amount: 100, label: "VIR" });
  // +6 days: should be excluded
  await upsertTransaction(db, { id: "bank_6days", account_id: "a1", date: "2026-07-07", amount: 100, label: "VIR" });

  const sugg = await findReconcileSuggestions(db, TEST_USER);
  const syncedIds = sugg.map((s) => s.synced.id);
  expect(syncedIds).toContain("bank_5days");
  expect(syncedIds).not.toContain("bank_6days");
});

test("mergeTransactions keeps the bank row, carries tagging, notes the manual label", async () => {
  const db = await seed();
  const gid = await insertGroup(db, "a1", "Rémunération", "in", 652.09, "2000-01", null);
  const m = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 652.09, label: "Rémunération juillet",
    groupId: gid, lineId: null, });
  await upsertTransaction(db, { id: "bank1", account_id: "a1", date: "2026-07-03", amount: 652.09, label: "VIR SEPA RECU" });

  await mergeTransactions(db, { syncedId: "bank1", manualId: m });

  const rows = await listTransactions(db, TEST_USER);
  expect(rows.map((t) => t.id)).toEqual(["bank1"]); // la manuelle a disparu
  expect(rows[0]).toMatchObject({
    id: "bank1", label: "VIR SEPA RECU", groupId: gid, note: "Rémunération juillet", manual: false,
  });
});

test("mergeTransactions does not delete the manual row when synced target does not exist", async () => {
  const db = await seed();
  const gid = await insertGroup(db, "a1", "Rémunération", "in", 652.09, "2000-01", null);
  const m = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 652.09, label: "Rémunération juillet",
    groupId: gid, lineId: null, });

  // Attempt to merge with a non-existent synced id
  await mergeTransactions(db, { syncedId: "does-not-exist", manualId: m });

  // Manual row should still exist unchanged
  const rows = await listTransactions(db, TEST_USER);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    id: m, manual: true, groupId: gid, label: "Rémunération juillet",
  });
});

test("ignoreMatch records a dismissed pair so it is no longer suggested", async () => {
  const db = await seed();
  const m = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 50, label: "top-up", groupId: null, lineId: null, });
  await upsertTransaction(db, { id: "bank1", account_id: "a1", date: "2026-07-02", amount: 50, label: "VIR" });
  await ignoreMatch(db, TEST_USER, m, "bank1");
  expect(await findReconcileSuggestions(db, TEST_USER)).toHaveLength(0);
  // idempotent : deuxième écartement sans erreur
  await ignoreMatch(db, TEST_USER, m, "bank1");
  expect(await db.one("SELECT COUNT(*) AS n FROM reconcile_ignored")).toEqual({ n: 1 });
});

// Les paires écartées non plus n'avaient pas de propriétaire. Écarter un rapprochement
// chez soi versait une ligne dans une table commune, que la lecture de tous parcourait.
test("les paires écartées d'un autre ne sont pas les miennes", async () => {
  const db = await seed();
  const m = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-01", amount: 50, label: "top-up", groupId: null, lineId: null });
  await upsertTransaction(db, { id: "bank1", account_id: "a1", date: "2026-07-02", amount: 50, label: "VIR" });

  // Quelqu'un d'autre écarte exactement la même paire de son côté.
  await ignoreMatch(db, "u-autre", m, "bank1");

  // La mienne tient toujours : son écartement ne vaut pas pour moi.
  expect(await findReconcileSuggestions(db, TEST_USER)).toHaveLength(1);

  await ignoreMatch(db, TEST_USER, m, "bank1");
  expect(await findReconcileSuggestions(db, TEST_USER)).toHaveLength(0);
});
