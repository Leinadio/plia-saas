import { describe, expect, it } from "vitest";
import { messageConnexionInitiale } from "@/lib/onboarding";

describe("le message après la première connexion bancaire", () => {
  it("distingue une synchronisation manquée, vide ou réussie", () => {
    expect(messageConnexionInitiale()).toContain("Synchroniser pour réessayer");
    expect(messageConnexionInitiale("0")).toContain("Aucune nouvelle opération");
    expect(messageConnexionInitiale("1")).toContain("1 opération importée");
    expect(messageConnexionInitiale("7")).toContain("7 opérations importées");
  });

  it("ne reprend pas une valeur d'adresse invalide", () => {
    expect(messageConnexionInitiale("inconnu")).toContain("Synchroniser pour réessayer");
    expect(messageConnexionInitiale("-2")).toContain("Synchroniser pour réessayer");
  });
});
