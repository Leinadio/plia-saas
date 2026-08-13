// Choisir la vue et le mois : la seule partie de la vue simple où une erreur
// afficherait le mauvais mois, ou renverrait l'utilisateur sur une vue qu'il
// n'a pas demandée. Donc la seule qui se teste unitairement.
import { describe, expect, it } from "vitest";
import { lireVue, moisAffiche, moisPrecedent, moisSuivant } from "../../src/lib/history-view";

describe("lireVue", () => {
  it("ouvre sur la vue simple quand rien n'a jamais été choisi", () => {
    expect(lireVue(undefined)).toBe("simple");
  });

  it("rend le tableau à qui l'a choisi", () => {
    expect(lireVue("tableau")).toBe("tableau");
  });

  it("retombe sur la vue simple si le cookie dit n'importe quoi", () => {
    // Un cookie trafiqué ou laissé par une version précédente ne doit pas
    // casser la page : il vaut « pas de choix ».
    expect(lireVue("grille-3d")).toBe("simple");
    expect(lireVue("")).toBe("simple");
  });
});

describe("moisAffiche", () => {
  const MIN = "2025-01";
  const MAX = "2027-08";
  const COURANT = "2026-08";

  it("ouvre sur le mois courant quand l'adresse ne dit rien", () => {
    expect(moisAffiche(undefined, MIN, MAX, COURANT)).toBe("2026-08");
  });

  it("respecte le mois demandé dans l'adresse", () => {
    expect(moisAffiche("2026-03", MIN, MAX, COURANT)).toBe("2026-03");
  });

  it("ramène dans les bornes un mois qui les dépasse", () => {
    // Une adresse bricolée à la main ne doit pas afficher un mois vide.
    expect(moisAffiche("2019-05", MIN, MAX, COURANT)).toBe("2025-01");
    expect(moisAffiche("2030-01", MIN, MAX, COURANT)).toBe("2027-08");
  });

  it("ignore une valeur qui n'est pas un mois", () => {
    expect(moisAffiche("bonjour", MIN, MAX, COURANT)).toBe("2026-08");
    expect(moisAffiche("2026-13", MIN, MAX, COURANT)).toBe("2026-08");
    expect(moisAffiche(["2026-03"], MIN, MAX, COURANT)).toBe("2026-08");
  });

  it("borne aussi le mois courant, si le compte est plus jeune que lui", () => {
    expect(moisAffiche(undefined, "2025-01", "2025-06", COURANT)).toBe("2025-06");
  });
});

describe("moisPrecedent et moisSuivant", () => {
  it("avancent et reculent d'un mois", () => {
    expect(moisPrecedent("2026-03", "2025-01")).toBe("2026-02");
    expect(moisSuivant("2026-03", "2027-08")).toBe("2026-04");
  });

  it("passent l'année", () => {
    expect(moisPrecedent("2026-01", "2025-01")).toBe("2025-12");
    expect(moisSuivant("2026-12", "2027-08")).toBe("2027-01");
  });

  it("rendent null sur les bornes, ce qui éteint la flèche", () => {
    expect(moisPrecedent("2025-01", "2025-01")).toBeNull();
    expect(moisSuivant("2027-08", "2027-08")).toBeNull();
  });
});
