import { describe, expect, it } from "vitest";
import { soldeDuMois } from "@/lib/solde-du-mois";

// LE SOLDE ANNONCÉ EN TÊTE D'UN MOIS. Un seul chiffre par colonne de mois, et il ne
// dit pas la même chose selon où l'on est dans le temps : ce qu'il restait, ce qu'il
// reste, ce qu'il restera.

const closings = [1000, 1200, 900];
const prevus = [null, 1150, 800];

describe("le solde qu'annonce l'en-tête d'un mois", () => {
  it("donne le solde d'aujourd'hui sur le mois en cours", () => {
    expect(soldeDuMois("2026-09", "2026-09", 1, closings, prevus)).toEqual({
      valeur: 1200, nature: "actuel",
    });
  });

  it("donne le solde de fin sur un mois passé", () => {
    expect(soldeDuMois("2026-08", "2026-09", 0, closings, prevus)).toEqual({
      valeur: 1000, nature: "passe",
    });
  });

  it("donne le solde prévu sur un mois à venir", () => {
    // Et le prévu, pas le réel prolongé : sur un mois qui n'a pas eu lieu, ce qui
    // compte est ce qui est engagé, pas la projection du solde d'aujourd'hui.
    expect(soldeDuMois("2026-10", "2026-09", 2, closings, prevus)).toEqual({
      valeur: 800, nature: "prevu",
    });
  });

  it("retombe sur le réel quand aucun prévu n'a pu être calculé", () => {
    expect(soldeDuMois("2026-10", "2026-09", 2, closings, [null, null, null])).toEqual({
      valeur: 900, nature: "prevu",
    });
  });

  it("ne rend rien quand la colonne n'existe pas", () => {
    // Une fenêtre de mois plus courte que ce qu'on lui demande ne doit pas afficher
    // un zéro qui passerait pour un solde vide.
    expect(soldeDuMois("2026-11", "2026-09", 7, closings, prevus)).toEqual({
      valeur: null, nature: "prevu",
    });
  });
});
