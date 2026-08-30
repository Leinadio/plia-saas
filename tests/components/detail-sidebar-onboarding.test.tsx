// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const demo = vi.hoisted(() => ({
  experience: null as { mode: "automatic-demo" | "replay-demo" | "real"; step: { requiredAction?: string }; tour: { paused: boolean } } | null,
}));

vi.mock("@/components/demo-experience-provider", () => ({
  useDemoExperienceOptional: () => demo.experience,
}));
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => true,
}));

const { DetailSidebarProvider, useDetailSidebar } = await import("@/components/detail-sidebar");

function OpenDetail() {
  const { setDetail } = useDetailSidebar();
  return createElement("button", {
    type: "button",
    onClick: () => setDetail({ title: "Dépensé", nodes: [], result: 42 }),
  }, "Ouvrir le détail");
}

function setPhoneViewport() {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
  });
}

async function renderDetail() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(DetailSidebarProvider, undefined, createElement(OpenDetail)));
  });
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    container.querySelector("button")?.click();
  });
  return {
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  demo.experience = null;
  vi.clearAllMocks();
  document.body.replaceChildren();
});

describe("panneau de détail pendant le guide", () => {
  it("reste non modal et sans voile pendant une étape interactive sur téléphone", async () => {
    setPhoneViewport();
    demo.experience = { mode: "automatic-demo", step: { requiredAction: "detail-opened" }, tour: { paused: false } };
    const detail = await renderDetail();
    try {
      const panel = document.body.querySelector('[data-mobile="true"]');
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute("aria-modal")).not.toBe("true");
      expect(document.body.querySelector('[data-slot="sheet-overlay"]')).toBeNull();
      expect(document.body.querySelector('[data-slot="sidebar-wrapper"]')?.getAttribute("aria-hidden")).not.toBe("true");
    } finally {
      await detail.unmount();
    }
  });

  it("garde le voile et le comportement modal hors guide interactif", async () => {
    setPhoneViewport();
    demo.experience = { mode: "real", step: {}, tour: { paused: false } };
    const detail = await renderDetail();
    try {
      const panel = document.body.querySelector('[data-mobile="true"]');
      expect(panel).not.toBeNull();
      expect(document.body.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
    } finally {
      await detail.unmount();
    }
  });
});
