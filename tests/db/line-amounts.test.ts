import { TEST_USER } from "../helpers/test-user";
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { insertGroup, insertLine, deleteLine } from "../../src/db/repositories/groups";
import { listLineAmounts, setLineAmount, deleteLineAmount } from "../../src/db/repositories/line-amounts";

async function seed() {
  const db = dbFrom(await createTestDb());
  await upsertAccount(db, { id: "a1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  const gid = await insertGroup(db, "a1", "Abonnements", "out", 0, "2026-01", null);
  const lid = await insertLine(db, gid, "Spotify", 12.14);
  return { db, gid, lid };
}

test("setLineAmount pose un montant daté, puis l'écrase au même mois", async () => {
  const { db, lid } = await seed();
  await setLineAmount(db, lid, "2026-08", 13.5);
  expect(await listLineAmounts(db)).toEqual([{ lineId: lid, effectiveMonth: "2026-08", amount: 13.5, scope: "ongoing" }]);
  await setLineAmount(db, lid, "2026-08", 14);
  expect(await listLineAmounts(db)).toEqual([{ lineId: lid, effectiveMonth: "2026-08", amount: 14, scope: "ongoing" }]);
});

test("listLineAmounts trie par ligne puis par mois croissant", async () => {
  const { db, lid } = await seed();
  await setLineAmount(db, lid, "2026-09", 15);
  await setLineAmount(db, lid, "2026-07", 12.14);
  expect((await listLineAmounts(db)).map((r) => r.effectiveMonth)).toEqual(["2026-07", "2026-09"]);
});

test("deleteLineAmount retire une seule entrée", async () => {
  const { db, lid } = await seed();
  await setLineAmount(db, lid, "2026-07", 12.14);
  await setLineAmount(db, lid, "2026-09", 15);
  await deleteLineAmount(db, lid, "2026-09");
  expect((await listLineAmounts(db)).map((r) => r.effectiveMonth)).toEqual(["2026-07"]);
});

test("supprimer une ligne emporte son historique de montants", async () => {
  const { db, lid } = await seed();
  await setLineAmount(db, lid, "2026-07", 12.14);
  await deleteLine(db, lid);
  expect(await listLineAmounts(db)).toEqual([]);
});
