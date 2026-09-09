import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { freshDb, at, asUser } from "./setup";
import { setGroup, setBudgetMonth } from "../../../src/app/app/transactions/actions";
import { insertGroup, insertLine } from "../../../src/db/repositories/groups";
import { listAccounts } from "../../../src/db/repositories/accounts";
import { listTransactions } from "../../../src/db/repositories/transactions";
import { syncAll } from "../../../src/enablebanking/sync";
import { TEST_USER } from "../../helpers/test-user";
import type { Db } from "../../../src/db/pg";

let db: Db;
let booked: boolean;
const ebGet = async <T>(path: string): Promise<T> => {
  if (path.includes("/balances")) return { balances: [{ balance_type: "CLBD", balance_amount: { amount: booked ? "150" : "500", currency: "EUR" } }] } as T;
  if (path.includes("/transactions")) return { transactions: [{ entry_reference: booked ? "final" : "temporary", status: booked ? "BOOK" : "PDNG", booking_date: booked ? `${new Date().toISOString().slice(0, 7)}-09` : null, transaction_amount: { amount: "350", currency: "EUR" }, credit_debit_indicator: "DBIT", remittance_information: ["RETRAIT CASH SERVICES"] }] } as T;
  return {} as T;
};
const sync = () => syncAll(db, { ebGet, accountUids: ["a1"], accountName: "CIC", userId: TEST_USER });
const snapshot = async () => (await listAccounts(db, TEST_USER))[0].pending_transactions!;
beforeEach(async () => { db = await freshDb(); at("2026-09"); booked = false; await sync(); });
afterEach(() => vi.useRealTimers());

test("catégorise et déplace l'attente, puis garde les choix après synchro et comptabilisation", async () => {
  const id = (await snapshot())[0].id;
  const gid = await insertGroup(db, "a1", "Voyage", "out", 500, "2026-08", null);
  const lid = await insertLine(db, gid, "Espèces", 400);
  await setBudgetMonth(id, "2026-08");
  await setGroup(id, gid, lid);
  expect((await snapshot())[0]).toMatchObject({ budgetMonth: "2026-08", groupId: gid, lineId: lid });
  await sync();
  expect((await snapshot())[0]).toMatchObject({ budgetMonth: "2026-08", groupId: gid, lineId: lid });
  booked = true;
  await sync();
  await sync();
  expect(await snapshot()).toEqual([]);
  expect(await listTransactions(db, TEST_USER)).toEqual([expect.objectContaining({ id: "a1::final", groupId: gid, lineId: lid, budgetMonth: "2026-08" })]);
});

test("applique les règles d'enveloppe et autorise le retour aux non catégorisés", async () => {
  const id = (await snapshot())[0].id;
  const gid = await insertGroup(db, "a1", "Voyage", "out", 500, "2026-08", "2026-08");
  const revenue = await insertGroup(db, "a1", "Salaire", "in", 0, "2026-01", null);
  await setGroup(id, gid);
  expect((await snapshot())[0].groupId ?? null).toBeNull();
  await setBudgetMonth(id, "2026-08");
  await setGroup(id, gid);
  expect((await snapshot())[0].groupId).toBe(gid);
  await setGroup(id, revenue);
  expect((await snapshot())[0].groupId).toBe(gid);
  await setGroup(id, null);
  expect((await snapshot())[0]).toMatchObject({ groupId: null, lineId: null, budgetMonth: "2026-08" });
});

test("un autre utilisateur ne peut ni catégoriser ni déplacer l'attente", async () => {
  const before = await snapshot();
  const gid = await insertGroup(db, "a1", "Voyage", "out", 500, "2026-01", null);
  asUser("intrus");
  await setBudgetMonth(before[0].id, "2026-08");
  await setGroup(before[0].id, gid);
  expect(await snapshot()).toEqual(before);
});

test("la suppression d'une enveloppe pendant l'attente ne bloque pas la comptabilisation", async () => {
  const id = (await snapshot())[0].id;
  const gid = await insertGroup(db, "a1", "Voyage", "out", 500, "2026-01", null);
  await setGroup(id, gid);
  await setBudgetMonth(id, "2026-08");
  await db.run("DELETE FROM groups WHERE id = $1", [gid]);
  booked = true;
  await sync();
  expect(await listTransactions(db, TEST_USER)).toEqual([expect.objectContaining({ groupId: null, budgetMonth: "2026-08" })]);
});

test("le mois explicitement choisi reste fixé si la banque comptabilise le mois suivant", async () => {
  const id = (await snapshot())[0].id;
  await setBudgetMonth(id, "2026-09");
  await sync();
  at("2026-10");
  expect((await snapshot())[0].budgetMonth).toBe("2026-09");
  booked = true;
  await sync();
  expect((await listTransactions(db, TEST_USER))[0]).toMatchObject({ date: "2026-10-09", budgetMonth: "2026-09" });
});

test("la catégorie suit le mois affiché même si la banque fournit une ancienne date provisoire", async () => {
  const [pending] = await snapshot();
  await db.run("UPDATE accounts SET pending_transactions = $1::jsonb WHERE id = 'a1'", [JSON.stringify([{ ...pending, date: "2026-08-31" }])]);
  const gid = await insertGroup(db, "a1", "Septembre", "out", 500, "2026-09", "2026-09");
  await setGroup(pending.id, gid);
  expect((await snapshot())[0].groupId).toBe(gid);
});
