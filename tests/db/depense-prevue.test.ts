// Le classement d'une dépense — prévue ou non prévue — se pose à sa création et vit
// en base. Une base d'avant ce découpage doit rouvrir sans qu'aucune enveloppe ne
// change de bloc : le défaut range tout du côté prévu.
import { TEST_USER } from "../helpers/test-user";
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { listGroups, insertGroup, setGroupPlanned } from "../../src/db/repositories/groups";

async function base(): Promise<Db> {
  const db = dbFrom(await createTestDb());
  await upsertAccount(db, { id: "acc1", name: "CIC", iban_masked: "***1", balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  return db;
}
const groupe = async (db: Db, nom: string) =>
  (await listGroups(db, TEST_USER)).find((g) => g.name === nom)!;

test("une dépense créée sans rien préciser est prévue", async () => {
  const db = await base();

  await insertGroup(db, "acc1", "Courses", "out", 300, "2026-07", null);

  expect((await groupe(db, "Courses")).planned).toBe(true);
});

test("une dépense créée dans le bloc des non prévues y reste", async () => {
  const db = await base();

  await insertGroup(db, "acc1", "Dentiste", "out", 80, "2026-07", null, false);

  expect((await groupe(db, "Dentiste")).planned).toBe(false);
});

// Le classement se décide à la création, mais il se regrette : une dépense qu'on
// croyait exceptionnelle devient régulière, et l'inverse arrive aussi.
test("une dépense change de bloc sans rien perdre d'autre", async () => {
  const db = await base();
  const id = await insertGroup(db, "acc1", "Dentiste", "out", 80, "2026-07", "2026-12", false);

  await setGroupPlanned(db, id, true);

  const g = await groupe(db, "Dentiste");
  expect(g.planned).toBe(true);
  // Le déplacement ne touche qu'au bloc : le nom, le montant et les bornes restent.
  expect(g.monthlyAmount).toBe(80);
  expect(g.startMonth).toBe("2026-07");
  expect(g.endMonth).toBe("2026-12");
});
