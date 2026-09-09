import { TEST_USER } from "../helpers/test-user";
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { syncAll } from "../../src/enablebanking/sync";
import { listTransactions } from "../../src/db/repositories/transactions";
import { totalBalance, listAccounts } from "../../src/db/repositories/accounts";

const mockEbGet = (respond: (path: string) => unknown) => async <T>(path: string): Promise<T> => respond(path) as T;

const fakeEbGet = mockEbGet((path) => {
  if (path.includes("/balances")) {
    return { balances: [{ balance_amount: { amount: "500.00", currency: "EUR" } }] };
  }
  if (path.includes("/details")) {
    return { account_id: { iban: "FR7630001007941234567890185" }, name: "Compte Courant" };
  }
  if (path.includes("/transactions")) {
    return {
      transactions: [
        {
          entry_reference: "tx1",
          booking_date: "2026-07-01",
          transaction_amount: { amount: "30.00", currency: "EUR" },
          credit_debit_indicator: "DBIT",
          remittance_information: ["CARREFOUR MARKET"],
        },
      ],
    };
  }
  return {};
});

test("sync imports balance + transactions", async () => {
  const db = dbFrom(await createTestDb());
  const result = await syncAll(db, {
    ebGet: fakeEbGet,
    accountUids: ["acc1"],
    accountName: "CIC", userId: TEST_USER,
  });
  expect(result.imported).toBe(1);
  expect(await totalBalance(db, TEST_USER)).toBe(500);
  const txns = await listTransactions(db, TEST_USER);
  expect(txns[0].amount).toBe(-30);
});

test("conserve le solde comptabilisé et écarte les opérations en attente sans date", async () => {
  const db = dbFrom(await createTestDb());
  const ebGet = mockEbGet((path) => {
    if (path.includes("/balances")) return { balances: [
      { balance_type: "XPCD", balance_amount: { amount: "108.43", currency: "EUR" } },
      { balance_type: "CLBD", balance_amount: { amount: "458.43", currency: "EUR" } },
    ] };
    if (path.includes("/transactions")) return { transactions: [
      { entry_reference: "pending", status: "PDNG", booking_date: null, transaction_amount: { amount: "350", currency: "EUR" }, credit_debit_indicator: "DBIT" },
      { entry_reference: "booked", status: "BOOK", booking_date: "2026-09-01", transaction_amount: { amount: "458.43", currency: "EUR" }, credit_debit_indicator: "CRDT" },
    ] };
    return {};
  });
  await syncAll(db, { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER });
  const [account] = await listAccounts(db, TEST_USER);
  expect(account.balance).toBe(108.43);
  expect(account.booked_balance).toBe(458.43);
  expect(account.pending_transactions).toEqual([expect.objectContaining({ amount: -350, date: null })]);
  expect((await listTransactions(db, TEST_USER)).map(t => t.id)).toEqual(["acc1::booked"]);
});

test("remplace l'attente par la vraie opération sans conserver de doublon", async () => {
  const db = dbFrom(await createTestDb());
  let booked = false;
  const ebGet = mockEbGet(path => {
    if (path.includes("/balances")) return { balances: [{ balance_type: "CLBD", balance_amount: { amount: booked ? "108.43" : "458.43", currency: "EUR" } }] };
    if (path.includes("/transactions")) return { transactions: [{ entry_reference: booked ? "final" : "temporary", status: booked ? "BOOK" : "PDNG", booking_date: booked ? "2026-09-09" : null, transaction_amount: { amount: "350", currency: "EUR" }, credit_debit_indicator: "DBIT", remittance_information: ["RETRAIT"] }] };
    return {};
  });
  const deps = { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER };
  await syncAll(db, deps);
  expect((await listAccounts(db, TEST_USER))[0].pending_transactions).toHaveLength(1);
  booked = true;
  await syncAll(db, deps);
  await syncAll(db, deps);
  expect((await listAccounts(db, TEST_USER))[0].pending_transactions).toEqual([]);
  expect((await listTransactions(db, TEST_USER)).map(txn => txn.id)).toEqual(["acc1::final"]);
});

test("keeps two accounts separate with their own balance, label and transactions", async () => {
  const perAccount = mockEbGet((path) => {
    const isB = path.includes("accB");
    if (path.includes("/balances"))
      return { balances: [{ balance_amount: { amount: isB ? "471.12" : "90.13", currency: "EUR" } }] };
    if (path.includes("/details"))
      return { account_id: { iban: isB ? "FR76....0140" : "FR76....4730" }, name: "CIC" };
    if (path.includes("/transactions"))
      return {
        transactions: [
          {
            entry_reference: isB ? "b1" : "a1",
            booking_date: "2026-07-02",
            transaction_amount: { amount: "10.00", currency: "EUR" },
            credit_debit_indicator: "DBIT",
            remittance_information: [isB ? "RESTO B" : "COURSES A"],
          },
        ],
      };
    return {};
  });

  const db = dbFrom(await createTestDb());
  await syncAll(db, { ebGet: perAccount, accountUids: ["accA", "accB"], accountName: "CIC", userId: TEST_USER });

  const accounts = await listAccounts(db, TEST_USER);
  expect(accounts).toHaveLength(2);
  expect(accounts.find((a) => a.id === "accA")?.balance).toBe(90.13);
  expect(accounts.find((a) => a.id === "accB")?.balance).toBe(471.12);
  expect(await totalBalance(db, TEST_USER)).toBeCloseTo(561.25);

  const txns = await listTransactions(db, TEST_USER);
  // L'identifiant porte son compte : la banque rend la même référence à qui la lui
  // demande, et deux personnes branchées sur le même compte réel se disputeraient
  // sinon les mêmes clés (voir tests/db/id-transaction-par-compte.test.ts).
  const a1 = txns.find((t) => t.id === "accA::a1")!;
  const b1 = txns.find((t) => t.id === "accB::b1")!;
  expect(a1.accountId).toBe("accA");
  expect(b1.accountId).toBe("accB");
  expect(a1.accountLabel).toBe("CIC …4730");
  expect(b1.accountLabel).toBe("CIC …0140");
});

test("sync deduplicates on re-run (imported === 0 on second call)", async () => {
  const db = dbFrom(await createTestDb());
  await syncAll(db, { ebGet: fakeEbGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER });
  const second = await syncAll(db, { ebGet: fakeEbGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER });
  expect(second.imported).toBe(0);
  expect(await listTransactions(db, TEST_USER)).toHaveLength(1);
});
