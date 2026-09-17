import { expect, it } from "vitest";
import { captureHistory } from "../../artifacts/landing-parcours/capture-history";

it("montre le montant saisi du budget créé dans la démonstration et recalcule le total", () => {
  const before = captureHistory("2026-09", []);
  const after = captureHistory("2026-09", [
    {
      accountId: "demo-account",
      name: "Vacances",
      amount: 250,
      startMonth: "2026-09",
      period: "from",
      direction: "out",
    },
  ]);
  const row = after.sections
    .flatMap((section) => section.rows)
    .find((row) => row.name === "Vacances")!;
  expect(row.cells[0].budgeted).toBe(250);
  expect(row.cells[0].balance).toBe(250);
  expect(after.grand[0].budgeted - before.grand[0].budgeted).toBe(250);
});
