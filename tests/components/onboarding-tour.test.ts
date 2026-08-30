// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { activeTourTarget, TOUR_STEPS, type TourState } from "../../src/lib/onboarding-tour";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const experience = vi.hoisted(() => ({
  mode: "automatic-demo" as "automatic-demo" | "replay-demo" | "real",
  step: null as unknown as (typeof TOUR_STEPS)[number],
  tour: {
    step: "demo-account",
    paused: false,
    monoprixCategorized: false,
    transportAdjusted: false,
    detailOpened: false,
  } as TourState,
  canAdvance: true,
  dispatch: vi.fn(),
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

async function renderClientTour(props: Record<string, unknown> = {}) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(OnboardingTour, props));
  });
  return {
    container,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("infobulle du guide", () => {
  test("ne s'affiche jamais sur les vraies données", () => {
    experience.mode = "real";
    experience.step = TOUR_STEPS[0];

    expect(renderTour({ target: availableTarget })).toBe("");

    experience.mode = "automatic-demo";
  });

  test("ne s'affiche plus après Compris tout en restant en démonstration", () => {
    experience.mode = "replay-demo";
    experience.tour = { ...experience.tour, finished: true };

    expect(renderTour({ target: availableTarget })).toBe("");

    experience.mode = "automatic-demo";
    experience.tour = { ...experience.tour, finished: false };
  });

  test("nomme le dialogue par le titre de l'étape et annonce sa progression", () => {
    experience.step = TOUR_STEPS[0];
    experience.tour = { ...experience.tour, step: "demo-account" };
    const html = renderTour({ target: availableTarget });

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="onboarding-tour-title"');
    expect(html).toContain('id="onboarding-tour-title"');
    expect(html).toContain("Vous êtes dans une démonstration");
    expect(html).toContain("Étape 1 sur 8");

    experience.step = TOUR_STEPS[6];
    experience.tour = { ...experience.tour, step: "amount-detail", detailOpened: true };
    expect(activeTourTarget(experience.step, experience.tour)).toBe("amount-detail-panel");
  });

  test("attend d'avoir mesuré sa cible au lieu de clignoter au centre", () => {
    experience.step = TOUR_STEPS[0];
    experience.tour = { ...experience.tour, step: "demo-account" };

    expect(renderTour()).toBe("");
  });

  test("attend 1,5 seconde avant de proposer de réessayer une cible absente", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
    experience.step = TOUR_STEPS[5];
    experience.tour = { ...experience.tour, step: "adjust-transport" };
    experience.dispatch.mockClear();

    const tour = await renderClientTour();
    try {
      expect(tour.container.innerHTML).toBe("");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_500);
      });

      expect(tour.container.innerHTML).toContain("onboarding-tour-card-missing");
      expect(tour.container.innerHTML).toContain(">Réessayer<");
      expect(tour.container.innerHTML).toContain(">Passer cette étape<");
      expect(tour.container.innerHTML).not.toContain("onboarding-tour-card-center");
      expect(tour.container.innerHTML).not.toContain("onboarding-tour-veil");
      expect(tour.container.innerHTML).not.toContain('aria-modal="true"');

      const retryButton = Array.from(tour.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Réessayer");
      await act(async () => retryButton?.click());
      expect(tour.container.innerHTML).toBe("");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_500);
      });
      const skipButton = Array.from(tour.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Passer cette étape");
      await act(async () => skipButton?.click());
      expect(experience.dispatch).toHaveBeenCalledWith({ type: "SKIP" });
    } finally {
      await tour.unmount();
      vi.useRealTimers();
    }
  });

  test("suit le panneau de détail après l'ouverture du montant", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
    const detailPanel = document.createElement("aside");
    detailPanel.dataset.onboardingTarget = "amount-detail-panel";
    Object.defineProperty(detailPanel, "getBoundingClientRect", {
      value: () => ({ top: 100, right: 340, bottom: 180, left: 140, width: 200, height: 80 }),
    });
    document.body.append(detailPanel);
    expect(document.querySelector('[data-onboarding-target="amount-detail-panel"]')).toBe(detailPanel);
    experience.step = TOUR_STEPS[6];
    experience.tour = { ...experience.tour, step: "amount-detail", detailOpened: true };

    const tour = await renderClientTour();
    try {
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(tour.container.innerHTML).toContain("onboarding-tour-focus-ring");
      expect(tour.container.innerHTML).toContain("Comprenez chaque montant");
    } finally {
      await tour.unmount();
      detailPanel.remove();
      vi.useRealTimers();
    }
  });

  test("repart en recherche puis signale l'absence quand une cible trouvée disparaît", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
    const target = document.createElement("button");
    target.dataset.onboardingTarget = "demo-account";
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({ top: 100, right: 340, bottom: 180, left: 140, width: 200, height: 80 }),
    });
    document.body.append(target);
    experience.step = TOUR_STEPS[0];
    experience.tour = { ...experience.tour, step: "demo-account" };

    const tour = await renderClientTour();
    try {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(tour.container.innerHTML).toContain("onboarding-tour-focus-ring");

      await act(async () => {
        target.remove();
        await Promise.resolve();
      });
      expect(tour.container.innerHTML).toBe("");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_500);
      });
      expect(tour.container.innerHTML).toContain("onboarding-tour-card-missing");
    } finally {
      await tour.unmount();
      target.remove();
      vi.useRealTimers();
    }
  });

  test("ne retient pas Tab dans une étape interactive", async () => {
    experience.step = TOUR_STEPS[5];
    experience.tour = { ...experience.tour, step: "adjust-transport" };
    const tour = await renderClientTour({ target: availableTarget });
    try {
      const buttons = tour.container.querySelectorAll("button");
      const lastButton = buttons[buttons.length - 1];
      lastButton.focus();
      const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      lastButton.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(lastButton);
    } finally {
      await tour.unmount();
    }
  });

  test("ne ramène pas Tab dans le fallback non modal", async () => {
    experience.step = TOUR_STEPS[0];
    experience.tour = { ...experience.tour, step: "demo-account" };
    const outside = document.createElement("button");
    document.body.append(outside);
    const tour = await renderClientTour({ target: null });
    try {
      outside.focus();
      const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      document.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(outside);
    } finally {
      await tour.unmount();
      outside.remove();
    }
  });

  test("autorise le retour à la ligne des quatre actions du fallback", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toMatch(/\.onboarding-tour-actions\s*\{[\s\S]*?flex-wrap:\s*wrap;/);
  });

  test("rend les commandes françaises attendues", () => {
    const html = renderTour({ target: availableTarget });

    expect(html).toContain(">Retour<");
    expect(html).toContain(">Plus tard<");
    expect(html).toContain(">Suivant<");
  });

  test("désactive Suivant lorsque le geste de l'étape est bloqué", () => {
    experience.step = TOUR_STEPS[5];
    experience.tour = { ...experience.tour, step: "adjust-transport" };
    experience.canAdvance = false;

    const html = renderTour({ target: availableTarget });

    expect(html).toContain('disabled=""');
    expect(html).toContain(">Suivant<");
  });

  test("signale une zone indisponible en bas sans bloquer la continuation", () => {
    experience.step = TOUR_STEPS[5];
    experience.tour = { ...experience.tour, step: "adjust-transport" };
    experience.canAdvance = true;

    const html = renderTour({ target: null });

    expect(html).toContain("onboarding-tour-card-missing");
    expect(html).toContain(">Réessayer<");
    expect(html).toContain(">Passer cette étape<");
    expect(html).not.toContain("onboarding-tour-card-center");
    expect(html).not.toContain('disabled=""');
  });

  test("bloque les clics hors cible pour une étape informative", () => {
    experience.step = TOUR_STEPS[0];
    experience.tour = { ...experience.tour, step: "demo-account" };
    const html = renderTour({ target: availableTarget });

    expect(html).toContain("onboarding-tour-veil-blocking");
    expect(html).not.toContain("onboarding-tour-veil-cutout");
    expect(html).toContain("onboarding-tour-card-mobile-panel");
    expect(html).toContain('data-onboarding-scroll-clearance="target-and-scroll-root"');
  });

  test("laisse toute l'application utilisable pendant une étape interactive", () => {
    experience.step = TOUR_STEPS[5];
    experience.tour = { ...experience.tour, step: "adjust-transport" };
    const html = renderTour({ target: availableTarget });

    expect(html).not.toContain("onboarding-tour-veil");
    expect(html).not.toContain('aria-modal="true"');
  });
});
