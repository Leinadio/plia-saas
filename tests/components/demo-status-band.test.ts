import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const experience = vi.hoisted(() => ({
  mode: "automatic-demo" as "automatic-demo" | "replay-demo" | "real",
  tour: { paused: false },
  resume: vi.fn(),
}));

vi.mock("@/components/demo-experience-provider", () => ({
  useDemoExperience: () => experience,
}));

const { DemoStatusBand } = await import("@/components/demo-status-band");

describe("le bandeau de démonstration", () => {
  it("dit clairement qu'aucune donnée réelle n'est affichée", () => {
    const html = renderToStaticMarkup(createElement(DemoStatusBand));

    expect(html).toContain("Démonstration");
    expect(html).toContain("Aucune donnée réelle");
  });

  it("permet de reprendre un guide mis en pause", () => {
    experience.tour.paused = true;
    const html = renderToStaticMarkup(createElement(DemoStatusBand));

    expect(html).toContain("Reprendre le guide");
    experience.tour.paused = false;
  });

  it("disparaît sur les vraies données", () => {
    experience.mode = "real";
    expect(renderToStaticMarkup(createElement(DemoStatusBand))).toBe("");
    experience.mode = "automatic-demo";
  });
});
