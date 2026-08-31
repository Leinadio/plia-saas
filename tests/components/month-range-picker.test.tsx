// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  pathname: "/app/historique",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

const { MonthRangePicker } = await import("@/components/month-range-picker");

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => vi.clearAllMocks());

async function renderPicker() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(MonthRangePicker, {
      min: "2026-06",
      max: "2026-12",
      from: "2026-08",
      to: "2026-10",
      current: "2026-08",
    }));
  });
  const month = (label: string) => Array.from(container.querySelectorAll("button"))
    .find((button) => button.textContent?.trim() === label) as HTMLButtonElement;
  return {
    container,
    month,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("le sélecteur de période", () => {
  it("attend le second mois avant de modifier le tableau", async () => {
    const rendered = await renderPicker();
    try {
      await act(async () => rendered.month("sept.").click());

      expect(mocks.push).not.toHaveBeenCalled();
      expect(rendered.container.textContent).toContain("Mois de départ");
      expect(rendered.container.textContent).toContain("sept. 2026");
      expect(rendered.container.textContent).toContain("Choisir le mois de fin");
      expect(rendered.month("août").disabled).toBe(true);

      await act(async () => rendered.month("nov.").click());

      expect(mocks.push).toHaveBeenCalledOnce();
      expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-09&to=2026-11");
      expect(rendered.container.textContent).toContain("sept. 2026");
      expect(rendered.container.textContent).toContain("nov. 2026");
    } finally {
      await rendered.unmount();
    }
  });

  it("accepte le même mois comme début et fin", async () => {
    const rendered = await renderPicker();
    try {
      await act(async () => rendered.month("nov.").click());
      await act(async () => rendered.month("nov.").click());

      expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-11&to=2026-11");
    } finally {
      await rendered.unmount();
    }
  });
});
