import { expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { TEST_USER } from "../helpers/test-user";
import { upsertAccount } from "../../src/db/repositories/accounts";

const context = vi.hoisted(() => ({ db: null as Db | null }));
vi.mock("../../src/lib/current-user", () => ({ pourMoi: (fn: (db: Db, userId: string) => unknown) => fn(context.db!, TEST_USER) }));
vi.mock("../../src/lib/current-month", () => ({ currentMonthKey: () => "2026-09" }));
import { appNotifications } from "../../src/lib/app-notifications";

it("annonce le même dépassement que l'enveloppe, attente comprise", async () => {
  const db = dbFrom(await createTestDb());
  context.db = db;
  const account = { id: "a", name: "CIC", iban_masked: null, balance: 100, currency: "EUR", last_synced: null };
  await upsertAccount(db, { ...account, pending_transactions: [{ id: "pending", date: null, amount: -350, label: "RETRAIT" }] }, TEST_USER);
  await db.run("INSERT INTO transactions (id, account_id, date, amount, label) VALUES ('booked', 'a', '2026-09-01', -30, 'Dépense')");
  expect((await appNotifications()).map(notice => notice.amount)).toEqual([380]);
  await upsertAccount(db, { ...account, pending_transactions: [] }, TEST_USER);
  await db.run("INSERT INTO transactions (id, account_id, date, amount, label) VALUES ('withdrawal', 'a', '2026-09-09', -350, 'RETRAIT')");
  expect((await appNotifications()).map(notice => notice.amount)).toEqual([380]);
});
