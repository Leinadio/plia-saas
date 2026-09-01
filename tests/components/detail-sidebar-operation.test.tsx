import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HistoryDetailSidebar } from "../../src/components/history-detail-sidebar";
import { SidebarProvider } from "../../src/components/ui/sidebar";
import type { CellDetail } from "../../src/lib/history-explain";

// L'OPÉRATION POSÉE. Ses termes portent leur symbole dans une colonne à part ; sa
// somme, elle, porte son signe collé au nombre — c'est un résultat, pas un terme
// qu'on ajoute.

function panneau(detail: CellDetail): string {
  return renderToStaticMarkup(
    createElement(SidebarProvider, undefined, createElement(HistoryDetailSidebar, { detail, onClose: () => {} })),
  );
}

const calcul = (result: number): CellDetail => ({
  title: "Balance dépenses",
  subtitle: "Août 2026",
  result,
  nodes: [
    { label: "Budget", amount: 1154.23 },
    { label: "Dépensé", amount: -1173.41 },
  ],
});

describe("le total de l'opération posée", () => {
  it("porte son moins quand le calcul retombe dans le rouge", () => {
    // Sans lui, le panneau annonçait « 19,18 » sous un titre à −19,18 : deux
    // nombres différents pour la même chose, à trois centimètres l'un de l'autre.
    expect(panneau(calcul(-19.18))).toContain("−19,18");
  });

  it("ne met pas de signe devant un total positif", () => {
    const html = panneau(calcul(19.18));
    expect(html).toContain("19,18");
    expect(html).not.toContain("−19,18");
    expect(html).not.toContain("+19,18");
  });
});
