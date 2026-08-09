// Chercher sa banque dans un catalogue de 128 lignes, et savoir quand une autorisation
// arrive à son terme. Deux règles courtes mais qui décident de ce qu'on voit à l'écran,
// donc elles vivent dans lib et se testent ici.
import { describe, expect, it } from "vitest";
import { chercheBanques } from "../../src/lib/banques";
import { etatConnexion } from "../../src/lib/connexion-etat";

const CATALOGUE = [
  { name: "BNP Paribas", country: "FR" },
  { name: "Crédit Agricole du Languedoc", country: "FR" },
  { name: "Crédit Agricole d'Aquitaine", country: "FR" },
  { name: "Société Générale", country: "FR" },
  { name: "Boursorama Banque", country: "FR" },
  { name: "CIC", country: "FR" },
];

describe("chercher sa banque", () => {
  it("rend tout le catalogue quand on n'a rien tapé", () => {
    expect(chercheBanques(CATALOGUE, "")).toHaveLength(6);
    expect(chercheBanques(CATALOGUE, "   ")).toHaveLength(6);
  });

  // La moitié du catalogue français est faite de caisses régionales qui se ressemblent.
  // Taper le nom de l'enseigne doit les rassembler, taper la région doit trancher.
  it("rassemble les caisses d'une même enseigne", () => {
    expect(chercheBanques(CATALOGUE, "crédit agricole").map((b) => b.name)).toEqual([
      "Crédit Agricole d'Aquitaine",
      "Crédit Agricole du Languedoc",
    ]);
    expect(chercheBanques(CATALOGUE, "languedoc").map((b) => b.name)).toEqual([
      "Crédit Agricole du Languedoc",
    ]);
  });

  // Personne ne tape les accents dans un champ de recherche, et surtout pas au bon
  // endroit. « societe generale » doit trouver « Société Générale ».
  it("ignore les accents et la casse", () => {
    expect(chercheBanques(CATALOGUE, "societe generale").map((b) => b.name)).toEqual(["Société Générale"]);
    expect(chercheBanques(CATALOGUE, "BOURSO").map((b) => b.name)).toEqual(["Boursorama Banque"]);
  });

  it("ne rend rien quand rien ne correspond", () => {
    expect(chercheBanques(CATALOGUE, "banque de mars")).toEqual([]);
  });

  // Le tri par nom vaut mieux que l'ordre du catalogue, qui n'en a aucun.
  it("rend les résultats dans l'ordre alphabétique", () => {
    expect(chercheBanques(CATALOGUE, "b").map((b) => b.name)).toEqual([
      "BNP Paribas", "Boursorama Banque",
    ]);
  });
});

// La DSP2 borne une autorisation à 90 jours. Passé ce terme la banque referme l'accès
// et la synchronisation cesse sans prévenir, d'où ce compte à rebours affiché.
describe("l'état d'une connexion", () => {
  const LE_JOUR = new Date("2026-08-09T12:00:00Z");

  it("dit combien de jours il reste", () => {
    expect(etatConnexion("2026-09-08T12:00:00Z", LE_JOUR)).toEqual({ etat: "valide", jours: 30 });
  });

  // Une semaine avant, il est temps de s'en occuper : reconnecter demande de repasser
  // par la banque, ce qui ne se fait pas entre deux portes.
  it("alerte dans la dernière semaine", () => {
    expect(etatConnexion("2026-08-14T12:00:00Z", LE_JOUR)).toEqual({ etat: "bientot", jours: 5 });
    expect(etatConnexion("2026-08-10T12:00:00Z", LE_JOUR)).toEqual({ etat: "bientot", jours: 1 });
  });

  it("dit qu'elle est finie une fois le terme passé", () => {
    expect(etatConnexion("2026-08-08T12:00:00Z", LE_JOUR)).toEqual({ etat: "expiree", jours: 0 });
  });

  // Une connexion créée mais dont la banque n'a jamais rendu d'autorisation.
  it("distingue une connexion jamais aboutie", () => {
    expect(etatConnexion(null, LE_JOUR)).toEqual({ etat: "inconnue", jours: 0 });
  });
});
