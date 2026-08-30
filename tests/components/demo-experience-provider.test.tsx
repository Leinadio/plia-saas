// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { freshTourVisit, type TourVisit } from "@/lib/onboarding-tour";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));

const { DemoExperienceProvider, useDemoExperience } = await import("@/components/demo-experience-provider");

function Commands() {
  const experience = useDemoExperience();
  return createElement("div", null,
    createElement("output", null, JSON.stringify({
      step: experience.tour.step,
      finished: experience.tour.finished,
      budget: experience.edits.transportBudget,
    })),
    createElement("button", {
      onClick: () => experience.dispatch({ type: "TRANSPORT_BUDGET_CHANGED", amount: 150 }),
    }, "modifier"),
    createElement("button", { onClick: () => void experience.finish() }, "terminer"),
    createElement("button", { onClick: () => void experience.restart() }, "recommencer"),
  );
}

async function renderExperience(options: {
  initialVisit?: TourVisit;
  onPersist?: (visit: TourVisit) => Promise<void>;
  onFinish?: (visit: TourVisit) => Promise<{ destination: "/app/historique" }>;
  onRestart?: () => Promise<{ destination: "/app/historique"; visit: TourVisit }>;
} = {}) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(
      DemoExperienceProvider,
      { mode: "automatic-demo", ...options },
      createElement(Commands),
    ));
  });
  mocks.push.mockClear();
  mocks.refresh.mockClear();
  return {
    container,
    click: async (label: string) => {
      const button = Array.from(container.querySelectorAll("button")).find((item) => item.textContent === label);
      await act(async () => button?.click());
    },
    state: () => JSON.parse(container.querySelector("output")?.textContent ?? "{}"),
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => vi.clearAllMocks());

describe("la démonstration sauvegardée", () => {
  it("restaure les modifications reçues de la base", async () => {
    const initialVisit = freshTourVisit();
    initialVisit.edits.transportBudget = 150;
    initialVisit.tour.transportAdjusted = true;
    const rendered = await renderExperience({ initialVisit });
    try {
      expect(rendered.state()).toMatchObject({ budget: 150, step: "demo-account", finished: false });
    } finally {
      await rendered.unmount();
    }
  });

  it("sauvegarde le document complet après une modification fictive", async () => {
    const onPersist = vi.fn(async () => undefined);
    const rendered = await renderExperience({ onPersist });
    try {
      await rendered.click("modifier");
      expect(rendered.state().budget).toBe(150);
      expect(onPersist).toHaveBeenCalledWith(expect.objectContaining({
        tour: expect.objectContaining({ transportAdjusted: true }),
        edits: expect.objectContaining({ transportBudget: 150 }),
      }));
    } finally {
      await rendered.unmount();
    }
  });

  it("Compris ferme le guide mais reste sur la démonstration", async () => {
    const initialVisit = freshTourVisit();
    initialVisit.tour.step = "ending-balance";
    const onFinish = vi.fn(async () => ({ destination: "/app/historique" as const }));
    const rendered = await renderExperience({ initialVisit, onFinish });
    try {
      await rendered.click("terminer");
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({
        tour: expect.objectContaining({ finished: true }),
      }));
      expect(rendered.state().finished).toBe(true);
      expect(mocks.push).toHaveBeenCalledWith("/app/historique");
    } finally {
      await rendered.unmount();
    }
  });

  it("Guide remplace volontairement la visite par un état neuf", async () => {
    const changed = freshTourVisit();
    changed.edits.transportBudget = 150;
    changed.tour.transportAdjusted = true;
    const onRestart = vi.fn(async () => ({ destination: "/app/historique" as const, visit: freshTourVisit() }));
    const rendered = await renderExperience({ initialVisit: changed, onRestart });
    try {
      await rendered.click("recommencer");
      expect(onRestart).toHaveBeenCalledOnce();
      expect(rendered.state()).toMatchObject({ budget: 120, step: "demo-account", finished: false });
    } finally {
      await rendered.unmount();
    }
  });

  it("attend la dernière sauvegarde avant Compris ou Guide", async () => {
    let releaseSave = () => undefined;
    const onPersist = vi.fn(() => new Promise<void>((resolve) => { releaseSave = resolve; }));
    const onFinish = vi.fn(async () => ({ destination: "/app/historique" as const }));
    const onRestart = vi.fn(async () => ({ destination: "/app/historique" as const, visit: freshTourVisit() }));
    const initialVisit = freshTourVisit();
    initialVisit.tour.step = "ending-balance";
    const rendered = await renderExperience({ initialVisit, onPersist, onFinish, onRestart });
    try {
      await rendered.click("modifier");
      await rendered.click("terminer");
      await rendered.click("recommencer");

      expect(onPersist).toHaveBeenCalledOnce();
      expect(onFinish).not.toHaveBeenCalled();
      expect(onRestart).not.toHaveBeenCalled();

      await act(async () => {
        releaseSave();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(onFinish).toHaveBeenCalledOnce();
      expect(onRestart).toHaveBeenCalledOnce();
    } finally {
      await rendered.unmount();
    }
  });
});
