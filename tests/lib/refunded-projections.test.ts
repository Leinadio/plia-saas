import { describe, expect, it } from "vitest";
import { computeForecast, type Group, type Txn } from "../../src/lib/forecast";
import { computeHistory, computePlannedSoldes, computeSolde, computeTableEstimate } from "../../src/lib/history";
import { soldeCell } from "../../src/lib/solde-cell";
import { resteParts } from "../../src/lib/history-detail";
import { seedDated } from "./dated-fixtures";

const months = ["2026-09", "2026-10"];

function refundedTax(withSubRow = false) {
  const groups: Group[] = [
    { id: 1, accountId: "a1", name: "Reste à payer", direction: "out", monthlyAmount: 5, lines: [], startMonth: "2026-09", endMonth: "2026-09" },
    { id: 2, accountId: "a1", name: "Taxe foncière", direction: "out", monthlyAmount: 1622, lines: withSubRow ? [{ id: 21, name: "Taxe", amount: 1622 }] : [], startMonth: "2026-09", endMonth: "2026-09" },
  ];
  const txns: Txn[] = [
    { id: "tax", accountId: "a1", groupId: 2, lineId: withSubRow ? 21 : null, date: "2026-09-03", label: "Taxe foncière", amount: -1622 },
    { id: "refund", accountId: "a1", groupId: 2, lineId: withSubRow ? 21 : null, date: "2026-09-04", label: "Remboursement", amount: 1622 },
  ];
  const { dated, datedLines } = seedDated(groups);
  const sections = computeHistory(groups, txns, months, "2026-09", dated, datedLines);
  const row = sections.flatMap(s => s.rows).find(r => r.id === 2)!;
  return { groups, txns, dated, datedLines, sections, row };
}

describe("Une dépense entièrement remboursée est terminée", () => {
  it.each([false, true])("ne recrée aucun reste de budget, avec sous-enveloppe : %s", withSubRow => {
    const { row } = refundedTax(withSubRow);
    expect(row.cells[0]).toMatchObject({ budgeted: 1622, depenseBrute: 1622, recuBrut: 1622, depense: 0, balance: 0 });
    if (withSubRow) expect(row.subRows[0].cells[0].balance).toBe(0);
  });

  it("laisse les trois soldes au montant de la ligne précédente et masque ses mouvements neutres", () => {
    const { sections } = refundedTax();
    const real = computeSolde(sections, months, "2026-09", 458.74);
    const planned = computePlannedSoldes(sections, months, "2026-09", real.openings);
    expect(real.rowRunning[2][0]).toBeCloseTo(458.74, 2);
    expect(planned.prevuRowRunning[2][0]).toBeCloseTo(453.74, 2);
    expect(planned.depassRowRunning[2][0]).toBeCloseTo(453.74, 2);
    for (const running of [real.rowRunning, planned.prevuRowRunning, planned.depassRowRunning]) {
      expect(soldeCell(running[2][0]!, running[2][0]! - running[1][0]!, false)).toEqual({ kind: "empty" });
    }
    expect(planned.prevuClosings[0]).toBeCloseTo(453.74, 2);
    expect(planned.depassClosings[0]).toBeCloseTo(453.74, 2);
  });

  it("ne prévoit pas de dépenser à nouveau le remboursement dans l'estimé et le mois suivant", () => {
    const { sections } = refundedTax();
    const estimate = computeTableEstimate(sections, months, "2026-09", 458.74)!;
    expect(estimate.value).toBeCloseTo(453.74, 2);
    expect(estimate.spendSteps.map(step => step.id)).toEqual([1]);
    const real = computeSolde(sections, months, "2026-09", 458.74, estimate.value);
    const planned = computePlannedSoldes(sections, months, "2026-09", real.openings, estimate.value);
    expect(real.openings[1]).toBeCloseTo(453.74, 2);
    expect(planned.prevuClosings[1]).toBeCloseTo(453.74, 2);
    expect(planned.depassClosings[1]).toBeCloseTo(453.74, 2);
  });

  it("applique la même règle dans la prévision du compte", () => {
    const { groups, txns, dated, datedLines } = refundedTax();
    const forecast = computeForecast("a1", 458.74, groups, txns, "2026-09", dated, datedLines);
    expect(forecast.currentEstimate).toBeCloseTo(453.74, 2);
    expect(forecast.nextEstimate).toBeCloseTo(453.74, 2);
  });

  it("explique pourquoi le budget n'est plus à dépenser une fois remboursé", () => {
    const { row } = refundedTax();
    expect(resteParts(row.cells[0])).toEqual({ budget: 1622, sorti: 1622, rentre: 1622, released: 1622 });
  });

  it.each([
    { spent: 150, refund: 0, remaining: -50 },
    { spent: 150, refund: 20, remaining: -30 },
    { spent: 150, refund: 50, remaining: 0 },
    { spent: 150, refund: 80, remaining: 30 },
    { spent: 100, refund: 100, remaining: 0 },
    { spent: 100, refund: 120, remaining: 20 },
    { spent: 0, refund: 0, remaining: 100 },
  ])("budget de 100 €, dépensé $spent €, remboursé $refund € : reste $remaining €", ({ spent, refund, remaining }) => {
    const group: Group = { id: 1, accountId: "a1", name: "Sortie", direction: "out", monthlyAmount: 100, lines: [] };
    const txns: Txn[] = [
      { id: "spent", accountId: "a1", groupId: 1, date: "2026-09-03", label: "Dépense", amount: -spent },
      { id: "refund", accountId: "a1", groupId: 1, date: "2026-09-04", label: "Remboursement", amount: refund },
    ];
    const { dated } = seedDated([group]);
    const sections = computeHistory([group], txns, months, "2026-09", dated);
    const row = sections.flatMap(s => s.rows)[0];
    expect(row.cells[0].balance).toBe(remaining);
    // La clôture d'une dépense ne ferme pas son budget des mois suivants.
    expect(row.cells[1].balance).toBe(100);
  });

  it("termine une sous-enveloppe remboursée en gardant le budget des autres", () => {
    const { groups, txns } = refundedTax(true);
    groups[1].lines.push({ id: 22, name: "Autre taxe à payer", amount: 100 });
    const { dated, datedLines } = seedDated(groups);
    const sections = computeHistory(groups, txns, months, "2026-09", dated, datedLines);
    const row = sections.flatMap(s => s.rows).find(r => r.id === 2)!;
    expect(row.cells[0].balance).toBe(100);
    const planned = computePlannedSoldes(sections, months, "2026-09", [458.74, 0]);
    expect(planned.prevuClosings[0]).toBeCloseTo(353.74, 2);
    expect(planned.depassClosings[0]).toBeCloseTo(353.74, 2);
    expect(computeTableEstimate(sections, months, "2026-09", 458.74)!.value).toBeCloseTo(353.74, 2);
  });

  it("un remboursement dans une sous-enveloppe sans budget ne termine pas les autres", () => {
    const { groups, txns } = refundedTax(true);
    groups[1].lines[0].amount = 0;
    groups[1].lines.push({ id: 22, name: "Autre taxe", amount: 100 });
    const { dated, datedLines } = seedDated(groups);
    const sections = computeHistory(groups, txns, months, "2026-09", dated, datedLines);
    const row = sections.flatMap(s => s.rows).find(r => r.id === 2)!;
    expect(row.cells[0].balance).toBe(100);
    const planned = computePlannedSoldes(sections, months, "2026-09", [458.74, 0]);
    expect(planned.prevuClosings[0]).toBeCloseTo(353.74, 2);
  });
});
