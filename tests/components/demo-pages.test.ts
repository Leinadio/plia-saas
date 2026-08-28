import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}));

const { DemoExperienceProvider } = await import("../../src/components/demo-experience-provider");
const { DemoDashboard } = await import("../../src/components/demo-dashboard");
const { DemoTransactions } = await import("../../src/components/demo-transactions");

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
  });
});
