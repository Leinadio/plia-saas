// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  mobile: false,
  push: vi.fn(),
  pathname: "/app/historique",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mocks.mobile }));

const { MonthRangePicker } = await import("@/components/month-range-picker");

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => { vi.clearAllMocks(); mocks.mobile = false; });

async function renderPicker(max = "2026-12") {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(MonthRangePicker, {
      min: "2026-06",
      max,
      from: "2026-08",
      to: "2026-10",
      current: "2026-08",
    }));
  });
  const month = (label: string) => Array.from(document.querySelectorAll("button"))
    .find((button) => button.textContent?.trim() === label) as HTMLButtonElement;
  return {
    container,
    month,
    open: async () => { await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Choisir la période"]')!.click()); },
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("le sélecteur de période", () => {
  it("ouvre un panneau du bas sur mobile et conserve les raccourcis", async () => {
    mocks.mobile = true;
    const rendered = await renderPicker();
    try {
      await rendered.open();
      const panel = document.querySelector('[role="dialog"]');
      expect(panel?.getAttribute("data-slot")).toBe("sheet-content");
      expect(panel?.className).toContain("slide-in-from-bottom");
      await act(async () => rendered.month("3 mois à venir").click());
      expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-08&to=2026-10");
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    } finally { await rendered.unmount(); }
  });
  it("ferme le panneau mobile sans appliquer un choix incomplet et rend le focus", async () => {
    mocks.mobile = true;
    const rendered = await renderPicker();
    try {
      await rendered.open();
      await act(async () => rendered.month("sept.").click());
      await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Fermer le calendrier"]')!.click());
      expect(mocks.push).not.toHaveBeenCalled();
      expect(rendered.container.textContent).toContain("août 2026");
      await act(async () => { await vi.waitFor(() => expect(document.activeElement).toBe(rendered.container.querySelector('button[aria-label="Choisir la période"]'))); });
    } finally { await rendered.unmount(); }
  });

  it("applique les trois prochains mois en un clic", async () => {
    const rendered = await renderPicker();
    try {
      await rendered.open();
      await act(async () => rendered.month("3 mois à venir").click());
      expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-08&to=2026-10");
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    } finally { await rendered.unmount(); }
  });
  it("permet de changer seulement la fin de la période", async () => {
    const rendered = await renderPicker();
    try {
      await rendered.open();
      await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Modifier le mois de fin"]')!.click());
      await act(async () => rendered.month("déc.").click());
      expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-08&to=2026-12");
    } finally { await rendered.unmount(); }
  });

  it("choisit une période à cheval sur deux années en respectant les bornes", async () => {
    const rendered = await renderPicker("2027-03");
    try {
      await rendered.open();
      expect(rendered.month("mai").disabled).toBe(true);
      await act(async () => rendered.month("nov.").click());
      await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Année suivante"]')!.click());
      expect(rendered.month("avr.").disabled).toBe(true);
      await act(async () => rendered.month("févr.").click());
      expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-11&to=2027-02");
    } finally { await rendered.unmount(); }
  });

  it("garde les bornes visibles et ouvre les mois uniquement à la demande", async () => {
    const rendered = await renderPicker();
    try {
      expect(rendered.container.textContent).toContain("août 2026");
      expect(rendered.container.textContent).toContain("oct. 2026");
      expect(rendered.month("sept.")).toBeUndefined();
      await rendered.open();
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
      expect(rendered.month("sept.")).toBeDefined();
      await act(async () => rendered.month("sept.").click());
      await act(async () => rendered.month("nov.").click());
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    } finally { await rendered.unmount(); }
  });

  it("annule le premier choix à la fermeture sans changer la période", async () => {
    const rendered = await renderPicker();
    try {
      await rendered.open();
      await act(async () => rendered.month("sept.").click());
      await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(mocks.push).not.toHaveBeenCalled();
      expect(rendered.container.textContent).toContain("août 2026");
      await rendered.open();
      await act(async () => rendered.month("nov.").click());
      expect(mocks.push).not.toHaveBeenCalled();
    } finally { await rendered.unmount(); }
  });

  it("attend le second mois avant de modifier le tableau", async () => {
    const rendered = await renderPicker();
    try {
      await rendered.open();
      await act(async () => rendered.month("sept.").click());

      expect(mocks.push).not.toHaveBeenCalled();
      expect(rendered.container.textContent).toContain("Mois de départ");
      expect(rendered.container.textContent).toContain("sept. 2026");
      expect(document.body.textContent).toContain("Choisissez le mois de fin");
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
      await rendered.open();
      await act(async () => rendered.month("nov.").click());
      await act(async () => rendered.month("nov.").click());

      expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-11&to=2026-11");
    } finally {
      await rendered.unmount();
    }
  });
});
