import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { TOUR_STEPS, type TourState } from "../../src/lib/onboarding-tour";

const experience = vi.hoisted(() => ({
  step: null as unknown as (typeof TOUR_STEPS)[number],
  tour: {
    step: "horizon",
    paused: false,
    monoprixCategorized: false,
    transportAdjusted: false,
  } as TourState,
  canAdvance: true,
  next: vi.fn(async () => {}),
  back: vi.fn(),
  pause: vi.fn(async () => {}),
}));

vi.mock("@/components/demo-experience-provider", () => ({
  useDemoExperience: () => experience,
}));

const { OnboardingTour } = await import("../../src/components/onboarding-tour");

const availableTarget = { top: 100, right: 340, bottom: 180, left: 140, width: 200, height: 80 };

function renderTour(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(createElement(OnboardingTour, props));
}

describe("infobulle du guide", () => {
  test("nomme le dialogue par le titre de l'étape et annonce sa progression", () => {
    experience.step = TOUR_STEPS[0];
    experience.tour = { ...experience.tour, step: "horizon" };
    const html = renderTour({ target: availableTarget });

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="onboarding-tour-title"');
    expect(html).toContain('id="onboarding-tour-title"');
    expect(html).toContain("Les prochains mois");
    expect(html).toContain("Étape 1 sur 7");
  });

  test("rend les commandes françaises attendues", () => {
    const html = renderTour({ target: availableTarget });

    expect(html).toContain(">Retour<");
    expect(html).toContain(">Plus tard<");
    expect(html).toContain(">Suivant<");
  });

  test("désactive Suivant lorsque le geste de l'étape est bloqué", () => {
    experience.step = TOUR_STEPS[3];
    experience.tour = { ...experience.tour, step: "categorize-monoprix" };
    experience.canAdvance = false;

    const html = renderTour({ target: availableTarget });

    expect(html).toContain('disabled=""');
    expect(html).toContain(">Suivant<");
  });

  test("signale une zone indisponible sans bloquer la continuation", () => {
    experience.step = TOUR_STEPS[6];
    experience.tour = { ...experience.tour, step: "refresh" };
    experience.canAdvance = true;

    const html = renderTour({ target: null });

    expect(html).toContain("zone indisponible");
    expect(html).toContain(">Compris<");
    expect(html).not.toContain('disabled=""');
  });
});
