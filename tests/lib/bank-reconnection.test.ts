import { expect, test } from "vitest";
import { assertCompatibleTransactions, mergePendingAccounts } from "../../src/lib/bank-reconnection";

const original = { amount: -20, date: "2026-10-01", group_id: 1, line_id: null, excluded: false, budget_month: null };
test("refuse deux classements explicites différents pour une même opération", () => {
  expect(() => assertCompatibleTransactions(original, { ...original, group_id: 2 })).toThrow(/classement/);
});
test("refuse une référence bancaire réutilisée pour une autre opération", () => {
  expect(() => assertCompatibleTransactions(original, { ...original, amount: -30 })).toThrow(/opération/);
});
test("accepte une copie non classée sans effacer le choix existant", () => {
  expect(() => assertCompatibleTransactions(original, { ...original, group_id: null })).not.toThrow();
});

test("refuse deux choix explicites différents pour une opération en attente", () => {
  const op = { id: "pending:old:reference:0", amount: 20, label: "Achat", date: null, groupId: 1 };
  expect(() => mergePendingAccounts([op], [{ ...op, id: "pending:new:reference:0", groupId: 2 }], "old", "new")).toThrow(/classement/);
});
