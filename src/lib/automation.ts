export type RuleInput = {
  accountId: string;
  label: string;
  direction: "in" | "out";
  minAmount: number | null;
  maxAmount: number | null;
  groupId: number;
  lineId: number | null;
};
export type AutomationRule = RuleInput & {
  id: number;
  enabled: boolean;
  revision: number;
};
export class RuleError extends Error {}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim()
    .replace(/\s+/g, " ");
export function validateRule(input: RuleInput): RuleInput {
  if (
    !input ||
    typeof input.accountId !== "string" ||
    !input.accountId ||
    typeof input.label !== "string" ||
    normalize(input.label).length < 2 ||
    input.label.trim().length > 100
  )
    throw new RuleError(
      "Indiquez un libellé entre 2 et 100 caractères et choisissez un compte.",
    );
  if (
    !["in", "out"].includes(input.direction) ||
    !Number.isSafeInteger(input.groupId) ||
    input.groupId <= 0 ||
    (input.lineId !== null &&
      (!Number.isSafeInteger(input.lineId) || input.lineId <= 0))
  )
    throw new RuleError("Choisissez un budget et un sens pour les opérations.");
  for (const n of [input.minAmount, input.maxAmount]) {
    if (
      n !== null &&
      (typeof n !== "number" ||
        !Number.isFinite(n) ||
        n < 0 ||
        n > 999999999999.99 ||
        Math.abs(n * 100 - Math.round(n * 100)) > 0.001)
    )
      throw new RuleError(
        "Saisissez un montant positif, avec deux décimales au maximum.",
      );
  }
  if (
    input.minAmount !== null &&
    input.maxAmount !== null &&
    input.minAmount > input.maxAmount
  )
    throw new RuleError("Le minimum doit être inférieur ou égal au maximum.");
  return { ...input, label: input.label.trim() };
}
export function matchesRule(
  rule: RuleInput,
  txn: { accountId: string; label: string; amount: number },
): boolean {
  const cents = Math.round(Math.abs(txn.amount) * 100);
  return (
    txn.accountId === rule.accountId &&
    normalize(txn.label).includes(normalize(rule.label)) &&
    (rule.direction === "out" ? txn.amount < 0 : txn.amount >= 0) &&
    (rule.minAmount === null || cents >= Math.round(rule.minAmount * 100)) &&
    (rule.maxAmount === null || cents <= Math.round(rule.maxAmount * 100))
  );
}
