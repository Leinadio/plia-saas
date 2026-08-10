// Le classement d'une dépense — prévue ou non prévue — se pose à sa création et vit
// en base. Une base d'avant ce découpage doit rouvrir sans qu'aucune enveloppe ne
// change de bloc : le défaut range tout du côté prévu.
import { TEST_USER } from "../helpers/test-user";
import { expect, test } from "vitest";
import Database from "better-sqlite3";
import { getDb } from "../../src/db/index";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { listGroups, insertGroup, setGroupPlanned } from "../../src/db/repositories/groups";
import { migrateGroupPlanned } from "../../src/db/migrations";

function base(): Database.Database {
  const db = getDb(":memory:");
  upsertAccount(db, { id: "acc1", name: "CIC", iban_masked: "***1", balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  return db;
}
const groupe = (db: Database.Database, nom: string) =>
  listGroups(db, TEST_USER).find((g) => g.name === nom)!;

test("une dépense créée sans rien préciser est prévue", () => {
  const db = base();

  insertGroup(db, "acc1", "Courses", "out", 300, "2026-07", null);

  expect(groupe(db, "Courses").planned).toBe(true);
});

test("une dépense créée dans le bloc des non prévues y reste", () => {
  const db = base();

  insertGroup(db, "acc1", "Dentiste", "out", 80, "2026-07", null, false);

  expect(groupe(db, "Dentiste").planned).toBe(false);
});

// Le vrai risque de la migration : déplacer des enveloppes existantes.
test("les dépenses d'une base d'avant le découpage restent prévues", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      direction TEXT NOT NULL,
      monthly_amount REAL,
      start_month TEXT,
      end_month TEXT
    );
    INSERT INTO groups (account_id, name, direction, monthly_amount) VALUES ('acc1', 'Loyer', 'out', 700);
  `);

  migrateGroupPlanned(db);

  const row = db.prepare(`SELECT planned FROM groups WHERE name = 'Loyer'`).get() as { planned: number };
  expect(row.planned).toBe(1);
});

// Le classement se décide à la création, mais il se regrette : une dépense qu'on
// croyait exceptionnelle devient régulière, et l'inverse arrive aussi.
test("une dépense change de bloc sans rien perdre d'autre", () => {
  const db = base();
  const id = insertGroup(db, "acc1", "Dentiste", "out", 80, "2026-07", "2026-12", false);

  setGroupPlanned(db, id, true);

  const g = groupe(db, "Dentiste");
  expect(g.planned).toBe(true);
  // Le déplacement ne touche qu'au bloc : le nom, le montant et les bornes restent.
  expect(g.monthlyAmount).toBe(80);
  expect(g.startMonth).toBe("2026-07");
  expect(g.endMonth).toBe("2026-12");
});

test("la migration repassée ne touche à rien", () => {
  const db = base();
  insertGroup(db, "acc1", "Dentiste", "out", 80, "2026-07", null, false);

  migrateGroupPlanned(db);

  expect(groupe(db, "Dentiste").planned).toBe(false);
});
