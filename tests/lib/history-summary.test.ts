// Le bloc de tête de la vue simple : l'argent de départ du mois et ses trois
// soldes de clôture. Rien n'est calculé ici — tout vient des colonnes déjà
// produites par computeSolde et computePlannedSoldes. Ce qui se teste, c'est
// le CHOIX : lequel prendre, et lequel taire.
import { describe, expect, it } from "vitest";
import type { PlannedSoldes, SoldeColumn } from "../../src/lib/history";
import { soldesDuMois } from "../../src/lib/history-summary";

const MOIS = ["2026-07", "2026-08", "2026-09"];
const COURANT = "2026-08";

const solde: SoldeColumn = {
  openings: [100, 200, 300],
  closings: [200, 300, 400],
  rowRunning: {},
  uncategorizedRunning: null,
};

const planned: PlannedSoldes = {
  prevuClosings: [210, 310, 410],
  depassClosings: [190, 290, 390],
  prevuRowRunning: {},
  depassRowRunning: {},
  uncatPrevuRunning: {},
  uncatDepassRunning: {},
};

describe("soldesDuMois", () => {
  it("donne les quatre valeurs d'un mois passé", () => {
    expect(soldesDuMois(solde, planned, MOIS, COURANT, 0)).toEqual({
      depart: 100,
      reel: 200,
      prevu: 210,
      siDepassement: 190,
    });
  });

  it("donne les quatre valeurs du mois courant", () => {
    expect(soldesDuMois(solde, planned, MOIS, COURANT, 1)).toEqual({
      depart: 200,
      reel: 300,
      prevu: 310,
      siDepassement: 290,
    });
  });

  it("tait « si dépassement » sur un mois de projection", () => {
    // Sur un mois futur, cette colonne répéterait « solde prévu » : un
    // dépassement n'est jamais reconduit tout seul (cf. monthColumns). Une
    // ligne qui répète la précédente est une ligne de trop.
    expect(soldesDuMois(solde, planned, MOIS, COURANT, 2)).toEqual({
      depart: 300,
      reel: 400,
      prevu: 410,
      siDepassement: null,
    });
  });

  it("laisse passer une chaîne de plan sans valeur", () => {
    // computePlannedSoldes rend null quand il n'y a rien à prévoir : on ne
    // transforme pas ce vide en zéro, qui se lirait comme un solde nul.
    const vide: PlannedSoldes = {
      ...planned,
      prevuClosings: [null, null, null],
      depassClosings: [null, null, null],
    };
    const r = soldesDuMois(solde, vide, MOIS, COURANT, 0);
    expect(r.prevu).toBeNull();
    expect(r.siDepassement).toBeNull();
  });
});
