import { test, expect } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { listBudgetAmounts, setBudgetAmount } from "../../src/db/repositories/budget-amounts";

async function freshDb(): Promise<Db> {
  const db = dbFrom(await createTestDb());
  await db.run(`INSERT INTO accounts (id, name) VALUES ('a1', 'CIC')`);
  await db.run(
    `INSERT INTO groups (id, account_id, name, direction, monthly_amount) VALUES (1, 'a1', 'Courses', 'out', 300)`,
  );
  return db;
}

test("budget_amounts : upsert et lecture triée", async () => {
  const db = await freshDb();
  await setBudgetAmount(db, 1, "2026-08", 400);
  await setBudgetAmount(db, 1, "2026-10", 450);
  await setBudgetAmount(db, 1, "2026-08", 410); // upsert : remplace le montant d'août
  expect(await listBudgetAmounts(db)).toEqual([
    { groupId: 1, accountId: "", effectiveMonth: "2026-08", amount: 410, scope: "ongoing" },
    { groupId: 1, accountId: "", effectiveMonth: "2026-10", amount: 450, scope: "ongoing" },
  ]);
});

test("budget_amounts : provision groupe 0 (non catégorisés) sans FK", async () => {
  const db = await freshDb();
  await setBudgetAmount(db, 0, "2026-08", 400);
  expect(await listBudgetAmounts(db)).toEqual([{ groupId: 0, accountId: "", effectiveMonth: "2026-08", amount: 400, scope: "ongoing" }]);
});

// La colonne `writes` est une colonne libre (TEXT), pas contrainte par le schéma :
// une valeur corrompue (écriture concurrente, migration future ratée…) ne doit
// jamais faire planter la lecture. listOverspendDecisions est appelé au
// chargement de /historique : une seule ligne corrompue ne doit pas casser toute
// la page.