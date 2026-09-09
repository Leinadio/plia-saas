import { expect, it } from "vitest";
import { pendingTransactions, pendingAsTransactions } from "../../src/lib/bank-pending";

const withdrawal = { status: "PDNG", booking_date: null, transaction_amount: { amount: "350", currency: "EUR" }, credit_debit_indicator: "DBIT" as const, remittance_information: ["RETRAIT CASH SERVICES"] };

it("conserve le libellé sans inventer une date de comptabilisation", () => {
  const pending = pendingTransactions("account", [withdrawal]);
  expect(pending).toHaveLength(1);
  expect(pending[0]).toMatchObject({ amount: -350, date: null, label: "RETRAIT CASH SERVICES" });
  expect(pendingAsTransactions("account", pending, "2026-09")[0]).toMatchObject({ date: "", budgetMonth: "2026-09", groupId: null, pending: true, amount: -350 });
});

it("distingue deux retraits identiques et stabilise leurs identifiants", () => {
  const pending = pendingTransactions("account", [withdrawal, withdrawal]);
  expect(pending).toHaveLength(2);
  expect(new Set(pending.map(txn => txn.id)).size).toBe(2);
  expect(pendingTransactions("account", [withdrawal, withdrawal])).toEqual(pending);
});

it("ne conserve pas une opération devenue comptabilisée et déduplique les références", () => {
  const referenced = { ...withdrawal, entry_reference: "reference" };
  expect(pendingTransactions("account", [referenced, referenced])).toHaveLength(1);
  expect(pendingTransactions("account", [{ ...referenced, status: "BOOK", booking_date: "2026-09-09" }])).toEqual([]);
});


it("respecte l'enveloppe, le sous-poste et le mois choisis pour l'attente", () => {
  const pending = [{ ...pendingTransactions("account", [withdrawal])[0], groupId: 7, lineId: 9, budgetMonth: "2026-08" }];
  expect(pendingAsTransactions("account", pending, "2026-09")[0]).toMatchObject({ groupId: 7, lineId: 9, budgetMonth: "2026-08", pending: true });
});

it("ne transfère pas les choix vers une opération ambiguë de même montant", async () => {
  const { reconcilePendingChoices } = await import("../../src/lib/bank-pending");
  const previous = [{ id: "p", date: null, amount: -350, label: "Retrait", groupId: 7, budgetMonth: "2026-08" }];
  const booked = [
    { id: "b1", pendingId: "b1", amount: -350, label: "Retrait" },
    { id: "b2", pendingId: "b2", amount: -350, label: "Retrait" },
  ];
  expect(reconcilePendingChoices(previous, [], booked).assignments).toEqual([]);
});
