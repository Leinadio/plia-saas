import { describe, expect, it } from "vitest";
import {
  matchesRule,
  validateRule,
  type RuleInput,
} from "../../src/lib/automation";
const rule: RuleInput = {
  accountId: "a",
  label: "café",
  direction: "out",
  minAmount: 10,
  maxAmount: 20,
  groupId: 1,
  lineId: null,
};
describe("règles automatiques — critères explicites", () => {
  it("ignore la casse et les accents, respecte les bornes inclusives", () => {
    expect(
      matchesRule(rule, {
        accountId: "a",
        label: "CB CAFE PARIS",
        amount: -10,
      }),
    ).toBe(true);
    expect(
      matchesRule(rule, { accountId: "a", label: "Café", amount: -20 }),
    ).toBe(true);
  });
  it.each([
    ["autre compte", { accountId: "b" }],
    ["autre libellé", { label: "CARREFOUR" }],
    ["remboursement", { amount: 15 }],
    ["trop petit", { amount: -9.99 }],
    ["trop grand", { amount: -20.01 }],
  ])("écarte %s", (_, patch) => {
    expect(
      matchesRule(rule, {
        accountId: "a",
        label: "Café",
        amount: -15,
        ...patch,
      }),
    ).toBe(false);
  });
  it("compare les centimes et permet un montant exact", () => {
    expect(
      matchesRule(
        { ...rule, minAmount: 19.9, maxAmount: 19.9 },
        { accountId: "a", label: "café", amount: -19.9 },
      ),
    ).toBe(true);
  });
  it("accepte les montants facultatifs et les entrées", () => {
    expect(
      matchesRule(
        { ...rule, direction: "in", minAmount: null, maxAmount: null },
        { accountId: "a", label: "café", amount: 25 },
      ),
    ).toBe(true);
  });
  it.each([
    { label: "" },
    { label: "a" },
    { label: " ".repeat(4) },
    { minAmount: -1 },
    { minAmount: NaN },
    { maxAmount: Infinity },
    { minAmount: 21 },
    { maxAmount: 0.001 },
    { direction: "both" },
    { groupId: 0 },
    { lineId: -2 },
  ])("refuse une règle invalide %j", (patch) => {
    expect(() => validateRule({ ...rule, ...patch } as RuleInput)).toThrow();
  });
});
