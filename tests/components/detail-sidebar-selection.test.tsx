// @vitest-environment jsdom

import { createElement, useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { DetailSidebarProvider, useDetailSidebar } from "../../src/components/detail-sidebar";
import type { CellDetail } from "../../src/lib/history-explain";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  usePathname: () => "/app/historique",
}));

// LE PANNEAU DÉSIGNE, LE TABLEAU ÉCOUTE. Cliquer la ligne d'une transaction dans le
// calcul doit publier sa case : c'est cette case que le grand tableau déplie et
// allume. Le tableau n'est pas monté ici — on vérifie ce qui lui est transmis.

// jsdom n'a pas de requête de média : la sidebar en demande une pour savoir si
// elle s'ouvre en colonne ou par-dessus.
window.matchMedia = ((query: string) => ({
  matches: false, media: query, onchange: null,
  addEventListener: () => {}, removeEventListener: () => {},
  addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

const CASE_TXN = "txn:t-recu::recu::0";

const DETAIL: CellDetail = {
  title: "Reçu",
  subtitle: "Août 2026",
  result: 4.5,
  cellRef: "section:income::recu::0",
  nodes: [
    {
      label: "Revenus",
      amount: 4.5,
      ref: "section:income::recu::0",
      children: [
        {
          label: "Rémunération supplémentaire",
          amount: 4.5,
          ref: "group:7::recu::0",
          children: [{ label: "2026-08-21 · REEQUILIBRAGE", amount: 4.5, ref: CASE_TXN }],
        },
      ],
    },
  ],
};

function Sonde() {
  const { setDetail, selected } = useDetailSidebar();
  const [ouvert, setOuvert] = useState(false);
  if (!ouvert) {
    return createElement("button", {
      id: "ouvrir",
      onClick: () => {
        setOuvert(true);
        setDetail(DETAIL);
      },
    }, "ouvrir");
  }
  return createElement("p", { id: "sonde" }, JSON.stringify(selected));
}

async function monter() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(createElement(DetailSidebarProvider, undefined, createElement(Sonde))));
  return {
    container,
    sonde: () => document.querySelector("#sonde")?.textContent ?? "",
    deplier: async (texte: string) => {
      const ligne = Array.from(document.querySelectorAll<HTMLElement>("tr")).find((r) => r.textContent?.includes(texte));
      const chevron = ligne?.querySelector<HTMLButtonElement>('button[aria-label="Déplier"]');
      if (!chevron) throw new Error(`« ${texte} » n'a pas de chevron à déplier`);
      await act(async () => chevron.click());
    },
    cliquer: async (texte: string) => {
      const ligne = Array.from(document.querySelectorAll<HTMLElement>("tr")).find((r) => r.textContent?.includes(texte));
      if (!ligne) throw new Error(`ligne « ${texte} » absente du panneau`);
      await act(async () => ligne.click());
    },
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("ce que le panneau transmet au tableau", () => {
  it("publie la case de la transaction cliquée, et pas celle du total", async () => {
    const vue = await monter();
    try {
      await act(async () => document.querySelector<HTMLButtonElement>("#ouvrir")?.click());
      // Le panneau s'ouvre sur son premier niveau : il faut déplier jusqu'à la
      // transaction, comme le fait la main.
      await vue.cliquer("Revenus");
      expect(vue.sonde()).toBe(JSON.stringify(["section:income::recu::0"]));

      await vue.deplier("Revenus");
      await vue.deplier("Rémunération supplémentaire");
      await vue.cliquer("REEQUILIBRAGE");
      expect(vue.sonde()).toBe(JSON.stringify([CASE_TXN]));
    } finally {
      await vue.unmount();
    }
  });
});
