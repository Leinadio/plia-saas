// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { LandingHeader } from "@/components/landing-header";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
it("groupe les pages, compacte au défilement et restaure le header en haut", async () => {
  const node = document.createElement("div");
  document.body.append(node);
  const root = createRoot(node);
  vi.stubGlobal("scrollY", 0);
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect = disconnect;
    },
  );
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
    const shell = node.querySelector("[data-compact]")!;
    expect(shell.getAttribute("data-compact")).toBe("false");
    await act(async () => {
      vi.stubGlobal("scrollY", 200);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(shell.getAttribute("data-compact")).toBe("true");
    await act(async () => {
      vi.stubGlobal("scrollY", 50);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(shell.getAttribute("data-compact")).toBe("true");
    await act(async () => {
      vi.stubGlobal("scrollY", 0);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(shell.getAttribute("data-compact")).toBe("false");
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
    expect(disconnect).toHaveBeenCalledOnce();
    expect(
      document.documentElement.style.getPropertyValue("--public-header-offset"),
    ).toBe("");
    node.remove();
    vi.unstubAllGlobals();
  }
});
