import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { freshDb, at } from "./setup";
import { setGroup } from "../../../src/app/app/transactions/actions";
import { insertGroup, insertLine } from "../../../src/db/repositories/groups";
import { insertManualTransaction } from "../../../src/db/repositories/transactions";
import type { Db } from "../../../src/db/pg";

let db: Db;
beforeEach(async () => { db = await freshDb(); at("2026-07"); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

test.each([
  { pending: false, withLine: false },
  { pending: false, withLine: true },
  { pending: true, withLine: false },
  { pending: true, withLine: true },
])("borne les échanges pour une attribution (attente=$pending, sous-poste=$withLine)", async ({ pending, withLine }) => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-07", null);
  const lid = withLine ? await insertLine(db, gid, "Marché", 100) : null;
  const id = pending ? "pending:a1:achat" : await insertManualTransaction(db, {
    accountId: "a1", date: "2026-07-23", amount: -20, label: "ACHAT",
    groupId: null, lineId: null,
  });
  if (pending) {
    await db.run("UPDATE accounts SET pending_transactions = $1::jsonb WHERE id = 'a1'", [
      JSON.stringify([{ id, date: null, amount: -20, label: "ACHAT" }]),
    ]);
  }

  const one = vi.spyOn(db, "one");
  const all = vi.spyOn(db, "all");
  const run = vi.spyOn(db, "run");
  await setGroup(id, gid, lid);
  // Quatre échanges cadrent la transaction et l'utilisateur. Il reste au plus
  // trois échanges pour lire l'opération, vérifier la destination et enregistrer.
  const exchanges = one.mock.calls.length + all.mock.calls.length + run.mock.calls.length;
  vi.restoreAllMocks();

  const assignment = pending
    ? (await db.one<{ pending_transactions: unknown[] }>("SELECT pending_transactions FROM accounts WHERE id = 'a1'"))!.pending_transactions[0]
    : await db.one('SELECT group_id AS "groupId", line_id AS "lineId" FROM transactions WHERE id = $1', [id]);
  expect(assignment).toMatchObject({ groupId: gid, lineId: lid });
  expect(exchanges).toBeLessThanOrEqual(7);
});
