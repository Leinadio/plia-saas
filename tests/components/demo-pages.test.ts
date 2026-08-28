import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DEMO_IDS } from "../../src/lib/demo-finances";
import { buildDemoProjection } from "../../src/lib/demo-projection";
import { freshTourVisit, reduceTour } from "../../src/lib/onboarding-tour";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  usePathname: () => "/app/historique",
}));

const { DemoExperienceProvider } = await import("../../src/components/demo-experience-provider");
const { DetailSidebarProvider } = await import("../../src/components/detail-sidebar");
const { DemoDashboard } = await import("../../src/components/demo-dashboard");
const { DemoHistory } = await import("../../src/components/demo-history");
const { DemoTransactions, eventForDemoCategorization } = await import("../../src/components/demo-transactions");
const { applyBudgetEdit } = await import("../../src/components/history-blocks/budget-edit-block");

function renderDemoDashboard(): string {
  return renderToStaticMarkup(
    createElement(
      DemoExperienceProvider,
      { mode: "automatic-demo" } as Parameters<typeof DemoExperienceProvider>[0],
      createElement(DemoDashboard),
    ),
  );
}

function renderDemoTransactions(): string {
  return renderToStaticMarkup(
    createElement(
      DemoExperienceProvider,
      { mode: "automatic-demo" } as Parameters<typeof DemoExperienceProvider>[0],
      createElement(DemoTransactions),
    ),
  );
}

function renderDemoHistory(): string {
  return renderToStaticMarkup(
    createElement(
      DemoExperienceProvider,
      { mode: "automatic-demo" } as Parameters<typeof DemoExperienceProvider>[0],
      createElement(DetailSidebarProvider, undefined, createElement(DemoHistory)),
    ),
  );
}

function targetCount(html: string, target: string): number {
  return html.split(`data-onboarding-target="${target}"`).length - 1;
}

describe("DemoDashboard", () => {
  // Retirer une cible, remplacer le récapitulatif par une carte factice ou ne plus
  // transmettre les données de démo rendrait cette visite guidée inutilisable.
  it("rend le vrai récapitulatif démo avec ses trois cibles de visite", () => {
    const html = renderDemoDashboard();

    expect(targetCount(html, "horizon")).toBe(1);
    expect(targetCount(html, "month-projection")).toBe(1);
    expect(targetCount(html, "envelopes")).toBe(1);
    expect(html).toContain("Horizon");
    expect(html).toContain("Enveloppes du mois");
    expect(html).toContain("2 840,60 €");
    expect(html).toContain("133,70 €");
    expect(html).toContain("-27,60 €");
    expect(html).toContain("Courses");
    expect(html).toContain("Transport");
  });
});

describe("DemoTransactions", () => {
  it("laisse ranger MONOPRIX sans afficher les commandes qui écrivent", () => {
    const html = renderDemoTransactions();

    expect(html).toContain("MONOPRIX");
    expect(html).toContain("Courses");
    expect(targetCount(html, "categorize-monoprix")).toBe(1);
    expect(html).not.toContain("Ajouter une transaction");
    expect(html).not.toContain("Commenter");
    expect(html).not.toContain("Ne pas comptabiliser");
    expect(html).not.toContain("Rechercher un libellé");
    expect(html).not.toContain("Tous les groupes");
    expect(html).not.toContain("aria-expanded");
  });

  it("range Courses dans la visite et recalcule sa projection", () => {
    const event = eventForDemoCategorization(DEMO_IDS.monoprix, DEMO_IDS.courses);
    if (!event) throw new Error("Courses must create a demo categorization event");
    const visit = freshTourVisit();
    const tour = reduceTour(visit.tour, event);
    const projection = buildDemoProjection("2026-08", {
      ...visit.edits,
      monoprixGroupId: tour.monoprixCategorized ? DEMO_IDS.courses : null,
    });

    expect(event).toEqual({ type: "MONOPRIX_CATEGORIZED" });
    expect(tour.monoprixCategorized).toBe(true);
    expect(projection.transactions.find((transaction) => transaction.id === DEMO_IDS.monoprix)?.groupId).toBe(DEMO_IDS.courses);
    expect(projection.dashboard.sorties.find((row) => row.id === DEMO_IDS.courses)?.montants[2]).toBeCloseTo(65.3);
  });
});

describe("DemoHistory", () => {
  it("rend le vrai tableau avec le budget Transport et la continuité des mois ciblés", () => {
    const html = renderDemoHistory();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const transportBudgetCell = html.match(new RegExp(
      `<td(?=[^>]*data-onboarding-target="adjust-transport")(?=[^>]*data-onboarding-group-id="${DEMO_IDS.transport}")(?=[^>]*data-onboarding-month="${currentMonth}")[^>]*>.*?<\\/td>`,
    ))?.[0] ?? "";
    const currentMonthHeader = html.match(new RegExp(
      `<th(?=[^>]*data-onboarding-target="month-continuity")(?=[^>]*data-current-month="")(?=[^>]*data-onboarding-month="${currentMonth}")[^>]*>.*?<\\/th>`,
    ))?.[0] ?? "";

    expect(targetCount(html, "adjust-transport")).toBe(1);
    expect(targetCount(html, "month-continuity")).toBe(1);
    expect(transportBudgetCell).toContain(">120,00<");
    expect(currentMonthHeader).toContain("Août");
    expect(currentMonthHeader).toContain("2026");
    expect(html).not.toContain("Ajouter une transaction");
  });

  it("transmet Transport à 150 au vrai reducer et à la projection, sans écriture serveur", async () => {
    const serverContinuation = vi.fn();
    const dispatch = vi.fn();
    const path = await applyBudgetEdit(
      { id: DEMO_IDS.transport },
      "automatic-demo",
      150,
      dispatch,
      serverContinuation,
    );

    expect(path).toBe("demo");
    expect(dispatch).toHaveBeenCalledOnce();
    const event = dispatch.mock.calls[0][0];
    expect(event).toEqual({ type: "TRANSPORT_BUDGET_CHANGED", amount: 150 });
    if (!event) throw new Error("Transport must create a demo event");
    const visit = freshTourVisit();
    const tour = reduceTour(visit.tour, event);
    const initialProjection = buildDemoProjection("2026-08", visit.edits);
    const projection = buildDemoProjection("2026-08", { ...visit.edits, transportBudget: event.amount });
    const transport = projection.history.sections.flatMap((section) => section.rows)
      .find((row) => row.id === DEMO_IDS.transport);

    expect(serverContinuation).not.toHaveBeenCalled();
    expect(tour.transportAdjusted).toBe(true);
    expect(transport?.cells[1].budgeted).toBe(150);
    expect(projection.history.planned.prevuClosings[2]).not.toBe(initialProjection.history.planned.prevuClosings[2]);
  });
});
