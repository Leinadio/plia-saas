import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}));

const { DemoExperienceProvider } = await import("../../src/components/demo-experience-provider");
const { DemoDashboard } = await import("../../src/components/demo-dashboard");

function renderDemoDashboard(): string {
  return renderToStaticMarkup(
    createElement(
      DemoExperienceProvider,
      { mode: "automatic-demo" } as Parameters<typeof DemoExperienceProvider>[0],
      createElement(DemoDashboard),
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
