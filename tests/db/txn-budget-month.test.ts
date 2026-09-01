import { TEST_USER } from "../helpers/test-user";
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import {
  insertManualTransaction, listTransactions, setTransactionBudgetMonth,
  getTransactionMonthInfo, sumManualByAccount, upsertTransaction,
} from "../../src/db/repositories/transactions";

// LE MOIS DE RATTACHEMENT, EN BASE. La date de la banque reste ce qu'elle est ; à
// côté d'elle, une colonne dit dans quel mois l'opération compte quand ce n'est pas
// celui de sa date.

async function seed() {
  const db = dbFrom(await createTestDb());
  await upsertAccount(db, { id: "a1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  return db;
}

test("une opération synchronisée arrive sans rattachement", async () => {
  const db = await seed();
  await upsertTransaction(db, { id: "t1", account_id: "a1", date: "2026-08-31", amount: -40, label: "MONOPRIX" });
  const rows = await listTransactions(db, TEST_USER);
  expect(rows[0]).toMatchObject({ id: "t1", date: "2026-08-31", budgetMonth: null });
});

test("on la range dans un autre mois sans toucher à sa date", async () => {
  const db = await seed();
  await upsertTransaction(db, { id: "t1", account_id: "a1", date: "2026-08-31", amount: -40, label: "MONOPRIX" });

  await setTransactionBudgetMonth(db, "t1", "2026-09");
  expect(await getTransactionMonthInfo(db, "t1")).toEqual({ date: "2026-08-31", budgetMonth: "2026-09" });
  expect((await listTransactions(db, TEST_USER))[0]).toMatchObject({ date: "2026-08-31", budgetMonth: "2026-09" });

  // Une synchronisation qui repasse ne défait rien : l'insertion ne touche pas une
  // ligne déjà là, donc la décision de l'utilisateur survit.
  await upsertTransaction(db, { id: "t1", account_id: "a1", date: "2026-08-31", amount: -40, label: "MONOPRIX" });
  expect(await getTransactionMonthInfo(db, "t1")).toEqual({ date: "2026-08-31", budgetMonth: "2026-09" });

  await setTransactionBudgetMonth(db, "t1", null);
  expect(await getTransactionMonthInfo(db, "t1")).toEqual({ date: "2026-08-31", budgetMonth: null });
});

test("une saisie manuelle rattachée corrige le solde du mois où on la range", async () => {
  const db = await seed();
  const id = await insertManualTransaction(db, {
    accountId: "a1", date: "2026-08-29", amount: -745, label: "Voyage", groupId: null, lineId: null,
  });
  expect(await sumManualByAccount(db, "2026-08")).toEqual({ a1: -745 });

  // Rangée en septembre, elle ne pèse plus sur la fin d'août.
  await setTransactionBudgetMonth(db, id, "2026-09");
  expect(await sumManualByAccount(db, "2026-08")).toEqual({});
  expect(await sumManualByAccount(db, "2026-09")).toEqual({ a1: -745 });
});
