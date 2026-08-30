import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/bank-picker", () => ({
  BankPicker: ({ label }: { label: string }) => createElement("button", null, label),
}));

import { FirstAccountOnboarding } from "@/components/first-account-onboarding";

describe("la première prise en main", () => {
  it("propose la banque seulement après avoir montré le produit", () => {
    const html = renderToStaticMarkup(createElement(FirstAccountOnboarding));
    const texte = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    expect(texte).toContain("Vous avez vu comment Plia fonctionne");
    expect(texte).toContain("Connecter ma banque");
    expect(texte).toContain("quand vous êtes prêt");
    expect(texte).toContain("Vous choisissez les comptes à partager");
  });
});
