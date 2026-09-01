// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  ouvrir: vi.fn(),
  fermer: vi.fn(),
  ouverte: false,
  lignes: [] as unknown[],
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
  ouvrirAlertes: vi.fn(),
  alertes: null as null | { restants: number; ouvrir: () => void },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/components/calculatrice", () => ({
  useCalculatrice: () => ({
    ouverte: mocks.ouverte,
    ouvrir: mocks.ouvrir,
    fermer: mocks.fermer,
    lignes: mocks.lignes,
  }),
}));
vi.mock("@/components/notifications-button", () => ({ useNotificationsOptional: () => mocks.alertes }));
vi.mock("@/components/demo-experience-provider", () => ({ useDemoExperienceOptional: () => mocks.experience }));
vi.mock("@/lib/onboarding-mode", () => ({ isDemoMode: (mode: string) => mode !== "real" }));
vi.mock("@/app/app/onboarding-actions", () => ({
  restartDemoGuide: mocks.restartServer,
  toggleDemo: mocks.toggle,
}));

const { OutilsFlottants } = await import("@/components/outils-flottants");

async function rendre() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(createElement(OutilsFlottants)));
  const boutons = () => Array.from(container.querySelectorAll("button"));
  return {
    container,
    boutons,
    trouver: (texte: string) => boutons().find((b) => b.textContent?.includes(texte)),
    ouvrirLaRoue: async () => {
      const rond = container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
      await act(async () => rond?.click());
    },
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  mocks.experience = null;
  mocks.ouverte = false;
  mocks.lignes = [];
  mocks.alertes = null;
  vi.clearAllMocks();
});

describe("la roue des outils du coin bas droit", () => {
  it("ouvre le panneau des dépassements et porte leur compte en tête", async () => {
    mocks.alertes = { restants: 3, ouvrir: mocks.ouvrirAlertes };
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      const bouton = vue.trouver("Dépassements");
      expect(bouton?.textContent).toContain("3");
      // La première de la liste, donc la plus proche du pouce.
      const commandes = vue.boutons().filter((b) => b.getAttribute("role")?.startsWith("menuitem"));
      expect(commandes[0]?.textContent).toContain("Dépassements");
      await act(async () => bouton?.click());
      expect(mocks.ouvrirAlertes).toHaveBeenCalledOnce();
    } finally {
      await vue.unmount();
    }
  });

  it("n'offre pas les dépassements quand il n'y en a pas — la démonstration", async () => {
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      expect(vue.trouver("Dépassements")).toBeUndefined();
      expect(vue.boutons().filter((b) => b.getAttribute("role")?.startsWith("menuitem"))).toHaveLength(3);
    } finally {
      await vue.unmount();
    }
  });

  it("reste fermée au départ et ne montre aucune commande", async () => {
    const vue = await rendre();
    try {
      expect(vue.boutons()).toHaveLength(1);
      expect(vue.container.textContent).not.toContain("Calculatrice");
    } finally {
      await vue.unmount();
    }
  });

  it("ouvre les trois outils sortis de la barre : calculatrice, guide et démo", async () => {
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      expect(vue.trouver("Calculatrice")).toBeTruthy();
      expect(vue.trouver("Guide")).toBeTruthy();
      expect(vue.trouver("Démo")).toBeTruthy();
    } finally {
      await vue.unmount();
    }
  });

  it("porte le compte des lignes du brouillon sur la calculatrice", async () => {
    mocks.lignes = [{}, {}];
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      expect(vue.trouver("Calculatrice")?.textContent).toContain("2");
    } finally {
      await vue.unmount();
    }
  });

  it("ouvre la calculatrice puis referme la roue", async () => {
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      await act(async () => vue.trouver("Calculatrice")?.click());
      expect(mocks.ouvrir).toHaveBeenCalledOnce();
      expect(mocks.fermer).not.toHaveBeenCalled();
      expect(vue.boutons()).toHaveLength(1);
    } finally {
      await vue.unmount();
    }
  });

  it("referme une calculatrice déjà ouverte", async () => {
    mocks.ouverte = true;
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      await act(async () => vue.trouver("Calculatrice")?.click());
      expect(mocks.fermer).toHaveBeenCalledOnce();
      expect(mocks.ouvrir).not.toHaveBeenCalled();
    } finally {
      await vue.unmount();
    }
  });

  it("relance la visite guidée sans passer par le serveur quand la démo est en cours", async () => {
    mocks.experience = { mode: "automatic-demo", restart: mocks.restart, flush: mocks.flush, saving: false };
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      await act(async () => vue.trouver("Guide")?.click());
      expect(mocks.restart).toHaveBeenCalledOnce();
      expect(mocks.restartServer).not.toHaveBeenCalled();
    } finally {
      await vue.unmount();
    }
  });

  it("quitte la démo en enregistrant la visite d'abord", async () => {
    mocks.experience = { mode: "automatic-demo", restart: mocks.restart, flush: mocks.flush, saving: false };
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      await act(async () => vue.trouver("Quitter la démo")?.click());
      expect(mocks.flush).toHaveBeenCalledOnce();
      expect(mocks.toggle).toHaveBeenCalledWith(false);
      expect(mocks.refresh).toHaveBeenCalledOnce();
    } finally {
      await vue.unmount();
    }
  });

  it("reste en démo quand la dernière sauvegarde échoue", async () => {
    mocks.experience = { mode: "automatic-demo", restart: mocks.restart, flush: mocks.flush, saving: false };
    mocks.flush.mockRejectedValueOnce(new Error("base indisponible"));
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      await act(async () => vue.trouver("Quitter la démo")?.click());
      expect(mocks.toggle).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
    } finally {
      await vue.unmount();
    }
  });

  it("allume la démo depuis le mode réel", async () => {
    mocks.experience = { mode: "real", restart: mocks.restart, flush: mocks.flush, saving: false };
    const vue = await rendre();
    try {
      await vue.ouvrirLaRoue();
      await act(async () => vue.trouver("Démo")?.click());
      expect(mocks.toggle).toHaveBeenCalledWith(true);
    } finally {
      await vue.unmount();
    }
  });
});
