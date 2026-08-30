// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  pathname: "/app/historique",
  push: vi.fn(),
  refresh: vi.fn(),
  restart: vi.fn(async () => undefined),
  flush: vi.fn(async () => undefined),
  experience: null as null | {
    mode: "automatic-demo" | "replay-demo" | "real";
    restart: () => Promise<void>;
    flush: () => Promise<void>;
    saving: boolean;
  },
  restartServer: vi.fn(async () => ({ destination: "/app/historique" as const })),
  toggle: vi.fn(async () => ({ destination: "/app/historique" as const })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => createElement("a", { href, ...props }, children),
}));
vi.mock("@/components/demo-experience-provider", () => ({ useDemoExperienceOptional: () => mocks.experience }));
vi.mock("@/lib/onboarding-mode", () => ({ isDemoMode: (mode: string) => mode !== "real" }));
vi.mock("@/app/app/onboarding-actions", () => ({
  restartDemoGuide: mocks.restartServer,
  toggleDemo: mocks.toggle,
}));
vi.mock("@/lib/auth-client", () => ({ signOut: vi.fn() }));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  DropdownMenuTrigger: ({ children, ...props }: { children: ReactNode }) => createElement("button", props, children),
  DropdownMenuContent: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  DropdownMenuItem: ({ children, asChild, ...props }: { children: ReactNode; asChild?: boolean }) => asChild ? children : createElement("button", props, children),
  DropdownMenuSeparator: () => createElement("hr"),
}));

const { AppTopbar } = await import("@/components/app-topbar");

function topbar() {
  return createElement(
    AppTopbar,
    { user: { name: "Daniel", email: "d@example.com" }, localTools: createElement("button", null, "Calculatrice") },
    createElement("button", null, "Rafraîchir"),
  );
}

async function renderTopbar() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(topbar()));
  return {
    container,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  mocks.pathname = "/app/historique";
  mocks.experience = null;
  vi.clearAllMocks();
});

describe("la barre de l'application", () => {
  it("garde le switch Démo visible avec les deux destinations utiles", () => {
    const html = renderToStaticMarkup(topbar());

    expect(html.indexOf("Vue d’ensemble")).toBeLessThan(html.indexOf("Transactions"));
    expect(html).not.toContain("Tableau de bord");
    expect(html).toContain('aria-label="Activer la démonstration"');
    expect(html).toContain("Démo");
    expect(html).toContain("Guide");
    expect(html).toContain("Actions");
  });

  it("affiche Rafraîchir parmi les actions desktop sans l'enfermer dans le menu mobile", async () => {
    const rendered = await renderTopbar();
    try {
      const desktopActions = rendered.container.querySelector<HTMLElement>("[data-header-actions-desktop]");
      expect(desktopActions?.textContent).toContain("Rafraîchir");
      expect(desktopActions?.closest("details")).toBeNull();
    } finally {
      await rendered.unmount();
    }
  });

  it("affiche le switch activé en démonstration", () => {
    mocks.experience = { mode: "automatic-demo", restart: mocks.restart, flush: mocks.flush, saving: false };
    const html = renderToStaticMarkup(topbar());
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
  });

  it("bascule vers les vraies données sans effacer la visite", async () => {
    mocks.experience = { mode: "automatic-demo", restart: mocks.restart, flush: mocks.flush, saving: false };
    const rendered = await renderTopbar();
    try {
      await act(async () => rendered.container.querySelector<HTMLButtonElement>('[role="switch"]')?.click());
      expect(mocks.flush).toHaveBeenCalledOnce();
      expect(mocks.toggle).toHaveBeenCalledWith(false);
      expect(mocks.restart).not.toHaveBeenCalled();
      expect(mocks.refresh).toHaveBeenCalledOnce();
    } finally {
      await rendered.unmount();
    }
  });

  it("reste en démo quand la dernière sauvegarde échoue", async () => {
    mocks.experience = { mode: "automatic-demo", restart: mocks.restart, flush: mocks.flush, saving: false };
    mocks.flush.mockRejectedValueOnce(new Error("base indisponible"));
    const rendered = await renderTopbar();
    try {
      await act(async () => rendered.container.querySelector<HTMLButtonElement>('[role="switch"]')?.click());
      expect(mocks.toggle).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
    } finally {
      await rendered.unmount();
    }
  });

  it("Guide réinitialise la visite depuis la démo comme depuis le réel", async () => {
    mocks.experience = { mode: "real", restart: mocks.restart, flush: mocks.flush, saving: false };
    const rendered = await renderTopbar();
    try {
      const guide = Array.from(rendered.container.querySelectorAll("button")).find((button) => button.textContent === "Guide");
      await act(async () => guide?.click());
      expect(mocks.restart).toHaveBeenCalledOnce();
      expect(mocks.restartServer).not.toHaveBeenCalled();
    } finally {
      await rendered.unmount();
    }
  });
});
