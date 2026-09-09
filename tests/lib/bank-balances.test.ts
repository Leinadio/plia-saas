import { expect, it } from "vitest";
import { bankBalances } from "../../src/lib/bank-balances";

const balances = [
  { balance_type: "XPCD", balance_amount: { amount: "108.43", currency: "EUR" } },
  { balance_type: "CLBD", balance_amount: { amount: "458.43", currency: "EUR" } },
];
it("distingue disponible et comptabilisé quel que soit l'ordre de la banque", () => {
  expect(bankBalances(balances)).toEqual({ balance: 108.43, bookedBalance: 458.43, currency: "EUR" });
  expect(bankBalances([...balances].reverse())).toEqual(bankBalances(balances));
});
it("préfère le comptabilisé du jour à la clôture précédente", () => {
  expect(bankBalances([...balances, { balance_type: "ITBD", balance_amount: { amount: "460", currency: "EUR" } }]).bookedBalance).toBe(460);
});
it("n'invente pas un montant en attente quand le solde comptabilisé manque", () => {
  expect(bankBalances([balances[0]]).bookedBalance).toBeNull();
  expect(bankBalances([{ balance_amount: { amount: "108.43", currency: "EUR" } }]).balance).toBe(108.43);
});
it("accepte un solde comptabilisé nul", () => {
  expect(bankBalances([{ ...balances[1], balance_amount: { amount: "0", currency: "EUR" } }])).toEqual({ balance: 0, bookedBalance: 0, currency: "EUR" });
});
