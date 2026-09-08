// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DetailSidebarProvider, useDetailSidebar } from "@/components/detail-sidebar";
import { CalculatriceProvider, useCalculatrice } from "@/components/calculatrice";
import type { CellDetail } from "@/lib/history-explain";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/app/apercu",
}));
vi.mock("@/components/calculatrice-fenetre", () => ({ CalculatriceFenetre: () => null }));

const destination = "group:7::solde::1";
const detail: CellDetail = {
  title: "Solde prévu", subtitle: "Septembre 2026", result: -42,
  cellRef: "group:8::solde::2",
  nodes: [{ label: "Solde précédent", amount: -42, ref: destination }],
};

function Probe({ amount = detail }: { amount?: CellDetail }) {
  const { setDetail, detail: active, anchor, selected } = useDetailSidebar();
  return createElement("div", { id: "overview" },
    createElement("button", { id: "open", onClick: () => setDetail(amount) }, "Ouvrir"),
    createElement("output", { id: "selection" }, JSON.stringify({ active: !!active, anchor, selected })),
  );
}

function CalculatorProbe() {
  const { ouverte, lignes } = useCalculatrice();
  return createElement("output", { id: "calculator" }, JSON.stringify({ ouverte, lignes }));
}

async function render(width: number, calculator = false, amount = detail) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const panel = createElement(DetailSidebarProvider, undefined, createElement(Probe, { amount }));
  await act(async () => root.render(calculator
    ? createElement(CalculatriceProvider, undefined, panel, createElement(CalculatorProbe))
    : panel));
  const overview = container.querySelector<HTMLElement>("#overview")!;
  overview.scrollTop = 260;
  await act(async () => container.querySelector<HTMLButtonElement>("#open")!.click());
  return {
    overview,
    selection: () => JSON.parse(container.querySelector("#selection")!.textContent!),
    close: async () => { await act(async () => root.unmount()); container.remove(); },
  };
}

async function clickText(text: string, selector = "button") {
  const element = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((el) => el.textContent?.includes(text));
  expect(element, `« ${text} » doit être accessible`).toBeDefined();
  await act(async () => element!.click());
}

afterEach(() => { window.localStorage.clear(); });

describe("le détail sur téléphone", () => {
  it("ferme le panneau et conserve la destination choisie pour la révéler dans le relevé", async () => {
    const view = await render(390);
    try {
      await clickText("Solde précédent", "tr");
      expect(view.selection()).toEqual({ active: false, anchor: null, selected: [destination] });
      expect(document.querySelector('[data-mobile="true"]')).toBeNull();
    } finally { await view.close(); }
  });

  it("retourne au même relevé sans sélection avec le bouton Retour", async () => {
    const view = await render(320);
    try {
      await clickText("Retour au relevé");
      expect(view.selection()).toEqual({ active: false, anchor: null, selected: null });
      expect(document.querySelector("#overview")).toBe(view.overview);
      expect(view.overview.scrollTop).toBe(260);
    } finally { await view.close(); }
  });

  it("garde le panneau ouvert sur tablette quand on sélectionne une référence", async () => {
    const view = await render(800);
    try {
      await clickText("Solde précédent", "tr");
      expect(view.selection()).toEqual({ active: true, anchor: detail.cellRef, selected: [destination] });
    } finally { await view.close(); }
  });

  it("garde ouvert un calcul sans destination dans le relevé", async () => {
    const view = await render(390, false, { ...detail, cellRef: undefined, nodes: [{ label: "Sans référence", amount: 42 }] });
    try {
      await clickText("Sans référence", "tr");
      expect(view.selection().active).toBe(true);
    } finally { await view.close(); }
  });

  it("ajoute le montant signé à la calculatrice et ferme le détail", async () => {
    const view = await render(390, true);
    try {
      await clickText("Ajouter à la calculatrice");
      expect(view.selection()).toEqual({ active: false, anchor: null, selected: null });
      const calculator = JSON.parse(document.querySelector("#calculator")!.textContent!);
      expect(calculator.ouverte).toBe(true);
      expect(calculator.lignes).toHaveLength(1);
      expect(calculator.lignes[0]).toMatchObject({ montant: -42, libelle: "Solde prévu · Septembre 2026" });
      expect(document.querySelector('[data-mobile="true"]')).toBeNull();
    } finally { await view.close(); }
  });

  it("n’affiche pas l’ajout lorsqu’aucune calculatrice n’est disponible", async () => {
    const view = await render(390);
    try { expect(document.body.textContent).not.toContain("Ajouter à la calculatrice"); }
    finally { await view.close(); }
  });
});
