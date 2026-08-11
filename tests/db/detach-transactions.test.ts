import { TEST_USER } from "../helpers/test-user";
// Raccourcir la durée d'un groupe rend ses transactions des mois retirés aux « non
// catégorisés » — vraiment, en base, et pas seulement à l'affichage. C'est ce qui fait
// qu'elles y RESTENT si on rallonge ensuite : le rattachement a été défait, il se
// refait à la main.
import { beforeEach, expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { insertGroup, insertLine } from "../../src/db/repositories/groups";
import { insertManualTransaction, detachTransactionsInMonths } from "../../src/db/repositories/transactions";

let db: Db;
beforeEach(async () => {
  db = dbFrom(await createTestDb());
  await upsertAccount(db, { id: "a1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
});

const depense = async (mois: string, groupId: number | null, lineId: number | null = null) =>
  await insertManualTransaction(db, {
    accountId: "a1", date: `${mois}-12`, amount: -30, label: "PRLV", groupId, lineId, });

const rattachement = async (id: string) =>
  await db.one(`SELECT group_id AS "groupId", line_id AS "lineId" FROM transactions WHERE id = $1`, [id]);

test("détache les transactions du groupe sur les mois donnés, et elles seules", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  const mai = await depense("2026-05", gid);
  const juin = await depense("2026-06", gid);

  const n = await detachTransactionsInMonths(db, { groupId: gid }, ["2026-06"]);

  expect(n).toBe(1);
  expect(await rattachement(mai)).toEqual({ groupId: gid, lineId: null });
  expect(await rattachement(juin)).toEqual({ groupId: null, lineId: null });
});

// Une ligne de récurrent perd les deux rattachements : le groupe parent aussi. Sans
// ça, la transaction retomberait sous le récurrent au lieu des non catégorisés, et
// l'avertissement affiché aurait menti.
test("détacher une ligne rend la transaction aux non catégorisés, groupe parent compris", async () => {
  const gid = await insertGroup(db, "a1", "Abonnements", "out", 0, "2026-01", null);
  const lid = await insertLine(db, gid, "Spotify", 10);
  const t = await depense("2026-06", gid, lid);

  await detachTransactionsInMonths(db, { lineId: lid }, ["2026-06"]);

  expect(await rattachement(t)).toEqual({ groupId: null, lineId: null });
});

test("ne touche pas aux transactions d'un autre groupe", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  const autre = await insertGroup(db, "a1", "Essence", "out", 100, "2026-01", null);
  const t = await depense("2026-06", autre);

  await detachTransactionsInMonths(db, { groupId: gid }, ["2026-06"]);

  expect(await rattachement(t)).toEqual({ groupId: autre, lineId: null });
});

test("ne fait rien sur une liste de mois vide", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  const t = await depense("2026-06", gid);

  expect(await detachTransactionsInMonths(db, { groupId: gid }, [])).toBe(0);
  expect(await rattachement(t)).toEqual({ groupId: gid, lineId: null });
});
