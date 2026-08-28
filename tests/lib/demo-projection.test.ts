import { describe, expect, test } from "vitest";
import { buildDemoFinances, DEMO_IDS } from "../../src/lib/demo-finances";
import { buildDemoProjection } from "../../src/lib/demo-projection";

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringValues);
  return [];
}

describe("demo finances", () => {
  test("builds stable demo-only data around the supplied month", () => {
    const finances = buildDemoFinances("2026-08");
    const monoprix = finances.transactions.find((transaction) => transaction.id === DEMO_IDS.monoprix);
    const courses = finances.groups.find((group) => group.id === DEMO_IDS.courses);
    const transport = finances.groups.find((group) => group.id === DEMO_IDS.transport);
    const transportBudget = finances.budgetAmounts.find(
      (amount) => amount.groupId === DEMO_IDS.transport && amount.effectiveMonth === "2026-08",
    );
    const representedMonths = new Set([
      ...finances.transactions.map((transaction) => transaction.date.slice(0, 7)),
      ...finances.budgetAmounts.map((amount) => amount.effectiveMonth),
      ...finances.lineAmounts.map((amount) => amount.effectiveMonth),
    ]);

    expect(finances.account.id).toBe("demo-account");
    expect(finances.account.id).toMatch(/^demo-/);
    expect(monoprix).toMatchObject({ amount: -68.4, groupId: null });
    expect(courses?.name).toBe("Courses");
    expect(transport?.name).toBe("Transport");
    expect(transportBudget?.amount).toBe(120);
    expect(representedMonths).toEqual(new Set(["2026-07", "2026-08", "2026-09", "2026-10"]));

    expect(finances.account.user_id).toBeNull();
    expect(finances.account.connection_id).toBeNull();
    expect(stringValues(finances).join(" ")).not.toMatch(
      /\b(?:CIC|Enable Banking|BNP|Crédit Mutuel|Société Générale|Banque Populaire|session|user)\b/i,
    );
  });
});

describe("demo projection", () => {
  test("categorizing MONOPRIX updates Courses without mutating another visit", () => {
    const initial = buildDemoProjection("2026-08", { monoprixGroupId: null, transportBudget: 120 });
    const categorized = buildDemoProjection("2026-08", {
      monoprixGroupId: DEMO_IDS.courses,
      transportBudget: 120,
    });
    const fresh = buildDemoProjection("2026-08", { monoprixGroupId: null, transportBudget: 120 });

    const initialCourses = initial.dashboard.sorties.find((row) => row.id === DEMO_IDS.courses)?.montants;
    const categorizedCourses = categorized.dashboard.sorties.find((row) => row.id === DEMO_IDS.courses)?.montants;
    expect(initialCourses?.[0]).toBe(350);
    expect(initialCourses?.[1]).toBeCloseTo(-216.3);
    expect(initialCourses?.[2]).toBeCloseTo(133.7);
    expect(categorizedCourses?.[0]).toBe(350);
    expect(categorizedCourses?.[1]).toBeCloseTo(-284.7);
    expect(categorizedCourses?.[2]).toBeCloseTo(65.3);
    expect(categorized.transactions.find((transaction) => transaction.id === DEMO_IDS.monoprix)?.groupId).toBe(
      DEMO_IDS.courses,
    );
    expect(fresh.transactions.find((transaction) => transaction.id === DEMO_IDS.monoprix)?.groupId).toBeNull();
  });

  test("raising Transport to 150 recalculates the declared history values", () => {
    const categorized = buildDemoProjection("2026-08", {
      monoprixGroupId: DEMO_IDS.courses,
      transportBudget: 120,
    });
    const adjusted = buildDemoProjection("2026-08", {
      monoprixGroupId: DEMO_IDS.courses,
      transportBudget: 150,
    });

    const initialTransport = categorized.history.sections
      .flatMap((section) => section.rows)
      .find((row) => row.id === DEMO_IDS.transport);
    const adjustedTransport = adjusted.history.sections
      .flatMap((section) => section.rows)
      .find((row) => row.id === DEMO_IDS.transport);

    expect(initialTransport?.cells[1].budgeted).toBe(120);
    expect(initialTransport?.cells[1].depense).toBe(147.6);
    expect(initialTransport?.cells[1].balance).toBeCloseTo(-27.6);
    expect(adjustedTransport?.cells[1].budgeted).toBe(150);
    expect(adjustedTransport?.cells[1].depense).toBe(147.6);
    expect(adjustedTransport?.cells[1].balance).toBeCloseTo(2.4);
    expect(categorized.history.planned.prevuClosings[2]).toBeCloseTo(7105.31);
    expect(categorized.history.planned.prevuClosings[3]).toBeCloseTo(8830.32);
    expect(adjusted.history.planned.prevuClosings[2]).toBeCloseTo(7072.91);
    expect(adjusted.history.planned.prevuClosings[3]).toBeCloseTo(8767.92);
    expect(adjusted.dashboard.mois.map((item) => item.solde)).not.toEqual(
      categorized.dashboard.mois.map((item) => item.solde),
    );
  });
});
