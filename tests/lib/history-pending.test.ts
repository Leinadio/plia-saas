import { describe, expect, it } from "vitest";
import { computeHistory, computeSolde, computePlannedSoldes, sliceSoldeColumn } from "../../src/lib/history";
import { soldeActuelDetail } from "../../src/lib/history-detail";
import { computePrevDisplayed } from "../../src/lib/history-nav";
import { pendingAsTransactions } from "../../src/lib/bank-pending";

const months = ["2026-08", "2026-09", "2026-10"];
const sections = computeHistory([], [
  { id: "income", accountId: "a", date: "2026-09-01", amount: 790, label: "Revenu", groupId: null },
  { id: "expense", accountId: "a", date: "2026-09-03", amount: -331.57, label: "Dépense", groupId: null },
], months, "2026-09");

describe("les opérations bancaires en attente ne réécrivent pas le passé", () => {
  it("range le retrait dans les dépenses non catégorisées sans doubler l'attente", () => {
    const txns = pendingAsTransactions("a", [{ id: "pending-withdrawal", amount: -350, date: null, label: "RETRAIT CASH SERVICES" }], "2026-09");
    const withPending = computeHistory([], [
      { id: "income", accountId: "a", date: "2026-09-01", amount: 458.43, label: "Revenu", groupId: null },
      ...txns,
    ], months, "2026-09");
    const expense = withPending.find(section => section.uncatDirection === "out")!;
    expect(expense.totals[1].depense).toBe(350);
    expect(expense.txns?.[0]).toMatchObject({ pending: true, label: "RETRAIT CASH SERVICES", month: "2026-09" });
    const result = computeSolde(withPending, months, "2026-09", 108.43, 108.43, 438.44 - 788.44);
    expect(result.openings[1]).toBeCloseTo(0, 2);
    expect(result.closings[1]).toBeCloseTo(108.43, 2);
    expect(result.pending).toEqual([0, 0, 0]);
    expect(result.bookedBalance).toBeCloseTo(458.43, 2);
    const detail = soldeActuelDetail(withPending, result, 1, "2026-09", { title: "Solde", result: 108.43 });
    expect(detail.nodes.reduce((sum, node) => sum + node.amount, 0)).toBeCloseTo(108.43, 2);
  });

  it("garde une ouverture à zéro et retire l'attente uniquement dans le mois courant", () => {
    const result = computeSolde(sections, months, "2026-09", 108.43, 108.43, -350);
    expect(result.openings[0]).toBeCloseTo(0, 2);
    expect(result.openings[1]).toBeCloseTo(0, 2);
    expect(result.closings[0]).toBeCloseTo(0, 2);
    expect(result.closings[1]).toBeCloseTo(108.43, 2);
    expect(result.openings[2]).toBeCloseTo(108.43, 2);
    expect(result.pending).toEqual([0, -350, 0]);
    expect(sliceSoldeColumn(result, 1, 1).pending).toEqual([-350]);
    const detail = soldeActuelDetail(sections, result, 1, "2026-09", { title: "Solde", result: 108.43 });
    expect(detail.nodes.reduce((sum, node) => sum + node.amount, 0)).toBeCloseTo(detail.result, 2);
    expect(detail.nodes.find(node => node.label === "Opérations bancaires en attente")?.amount).toBe(-350);
  });

  it("conserve le prévu disponible et relie la première opération à l'attente", () => {
    const real = computeSolde(sections, months, "2026-09", 108.43, 108.43, -350);
    const plan = computePlannedSoldes(sections, months, "2026-09", real.openings, 108.43, undefined, real.pending);
    const before = computeSolde(sections, months, "2026-09", 108.43, 108.43);
    const previousPlan = computePlannedSoldes(sections, months, "2026-09", before.openings, 108.43);
    expect(plan.prevuClosings[1]).toBeCloseTo(previousPlan.prevuClosings[1]!, 2);
    expect(plan.depassClosings[1]).toBeCloseTo(previousPlan.depassClosings[1]!, 2);
    expect(computePrevDisplayed(sections, months, "2026-09", real, plan).solde.get("section:uncat-in")?.[1]).toBe("bank-pending");
  });

  it("ne compte pas deux fois une opération lorsqu'elle est comptabilisée", () => {
    const bookedSections = computeHistory([], [
      { id: "income", accountId: "a", date: "2026-09-01", amount: 458.43, label: "Revenu", groupId: null },
      { id: "withdrawal", accountId: "a", date: "2026-09-09", amount: -350, label: "Retrait", groupId: null },
    ], months, "2026-09");
    const result = computeSolde(bookedSections, months, "2026-09", 108.43, 108.43, 0);
    expect(result.openings[1]).toBeCloseTo(0, 2);
    expect(result.closings[1]).toBeCloseTo(108.43, 2);
  });
});

it.each(["2026-08", "2026-09"])("ne recompte pas l'attente rangée dans une enveloppe en %s", month => {
  const group = { id: 7, accountId: "a", name: "Voyage", direction: "out" as const, monthlyAmount: 0, lines: [{ id: 9, name: "Espèces", amount: 0 }] };
  const txns = [{ id: "p", accountId: "a", date: "", amount: -350, label: "Retrait", groupId: 7, lineId: 9, budgetMonth: month, pending: true }];
  const sections = computeHistory([group], txns, months, "2026-09");
  const result = computeSolde(sections, months, "2026-09", 150, 150, -350);
  expect(result.pending).toEqual([0, 0, 0]);
  expect(result.openings[0]).toBe(500);
  expect(result.openings[1]).toBe(month === "2026-08" ? 150 : 500);
  expect(result.closings[1]).toBe(150);
});
