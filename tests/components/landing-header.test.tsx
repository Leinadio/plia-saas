// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { LandingHeader } from "@/components/landing-header";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
it("groupe les nouvelles pages et ne change pas de mode au défilement", async () => {
  const node = document.createElement("div");
  document.body.append(node);
  const root = createRoot(node);
  vi.stubGlobal("scrollY", 0);
  try {
    await act(async () => root.render(<LandingHeader homeLinks />));
    const sections = node.querySelector(
      'nav[aria-label="Sections de l’accueil"]',
    )!;
    const pages = node.querySelector('nav[aria-label="Pages de Planora"]')!;
    expect(pages?.textContent).toContain("Pour qui ?");
    expect(pages?.textContent).toContain("Contact");
    expect(sections.textContent).not.toContain("Contact");
    expect(
      [...node.querySelectorAll("a")]
        .find((a) => a.textContent?.includes("Réserver mon accès"))
        ?.getAttribute("href"),
    ).toBe("/reservation");
    const initialHeader = node.innerHTML;
    await act(async () => {
      vi.stubGlobal("scrollY", 200);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(node.innerHTML).toBe(initialHeader);
    const menu = node.querySelector<HTMLButtonElement>(
      'button[aria-controls="public-sections"]',
    )!;
    await act(async () => menu.click());
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    await act(async () =>
      node
        .querySelector("header")!
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        ),
    );
    expect(menu.getAttribute("aria-expanded")).toBe("false");
  } finally {
    await act(async () => root.unmount());
    node.remove();
    vi.unstubAllGlobals();
  }
});
