// LA CALCULATRICE DE BROUILLON.
//
// Une bande de caisse, pas une expression algébrique : on empile des montants
// attrapés dans le tableau et on les enchaîne de haut en bas, chacun avec son
// signe. Personne ne cherche ici la priorité de la multiplication — on cherche
// « le loyer, plus les courses, fois douze, ça fait combien ».
import { describe, expect, it } from "vitest";
import {
  totalCalcul, encoderMontant, decoderMontant, lireBrouillon, ecrireBrouillon,
  positionDansEcran, type LigneCalcul,
} from "../../src/lib/calculatrice";

const l = (p: Partial<LigneCalcul>): LigneCalcul => ({
  id: "1", libelle: "Poste", montant: 100, operateur: "+", ...p,
});

describe("Le total d'un brouillon", () => {
  it("ne vaut rien tant qu'il n'y a rien", () => {
    expect(totalCalcul([])).toBe(0);
  });

  it("enchaîne les lignes de haut en bas, sans priorité", () => {
    // 100 + 50 = 150, puis × 2 = 300. Avec la priorité des opérations, ça ferait
    // 200 : ce n'est pas ce qu'on lit quand on empile des lignes.
    const lignes = [
      l({ id: "a", montant: 100 }),
      l({ id: "b", montant: 50, operateur: "+" }),
      l({ id: "c", montant: 2, operateur: "×" }),
    ];
    expect(totalCalcul(lignes)).toBe(300);
  });

  it("retranche et multiplie", () => {
    expect(totalCalcul([l({ montant: 1000 }), l({ id: "b", montant: 240, operateur: "-" })])).toBe(760);
    expect(totalCalcul([l({ montant: 45 }), l({ id: "b", montant: 12, operateur: "×" })])).toBe(540);
  });

  it("prend la première ligne pour ce qu'elle est, signe compris", () => {
    // Rien au-dessus d'elle : « moins 100 » démarre le calcul à -100, et une
    // première ligne en « fois » n'a rien à multiplier — elle vaut son montant.
    expect(totalCalcul([l({ montant: 100, operateur: "-" })])).toBe(-100);
    expect(totalCalcul([l({ montant: 100, operateur: "×" })])).toBe(100);
  });

  it("arrondit au centime, pour qu'un total ne traîne pas de décimales fantômes", () => {
    expect(totalCalcul([l({ montant: 0.1 }), l({ id: "b", montant: 0.2, operateur: "+" })])).toBe(0.3);
  });
});

describe("Le montant qu'on attrape dans le tableau", () => {
  it("voyage avec son libellé et se retrouve intact", () => {
    const brut = encoderMontant({ libelle: "Courses, dépensé, juillet", montant: -142.5 });
    expect(decoderMontant(brut)).toEqual({ libelle: "Courses, dépensé, juillet", montant: -142.5 });
  });

  it("ne rend rien plutôt que n'importe quoi", () => {
    // On lâche autre chose sur la calculatrice — du texte, un fichier, une case
    // vide : elle ne doit ni ajouter une ligne fantôme ni casser.
    expect(decoderMontant("")).toBeNull();
    expect(decoderMontant("bonjour")).toBeNull();
    expect(decoderMontant(JSON.stringify({ libelle: "Sans montant" }))).toBeNull();
    expect(decoderMontant(JSON.stringify({ libelle: "x", montant: "cent" }))).toBeNull();
  });
});

describe("Le brouillon gardé d'une visite à l'autre", () => {
  it("se relit tel qu'il a été écrit", () => {
    const lignes = [l({ id: "a" }), l({ id: "b", libelle: "Loyer", montant: 720, operateur: "-" })];
    expect(lireBrouillon(ecrireBrouillon(lignes))).toEqual(lignes);
  });

  it("repart à vide sur un stockage vide ou abîmé, sans jamais casser l'écran", () => {
    expect(lireBrouillon(null)).toEqual([]);
    expect(lireBrouillon("{{{")).toEqual([]);
    expect(lireBrouillon(JSON.stringify({ pas: "une liste" }))).toEqual([]);
  });

  it("écarte les lignes abîmées et garde les bonnes", () => {
    const brut = JSON.stringify([
      { id: "a", libelle: "Bonne", montant: 10, operateur: "+" },
      { id: "b", libelle: "Sans montant", operateur: "+" },
      { id: "c", libelle: "Opérateur inconnu", montant: 5, operateur: "÷" },
    ]);
    expect(lireBrouillon(brut).map((x) => x.libelle)).toEqual(["Bonne"]);
  });
});

describe("La fenêtre flottante", () => {
  const ecran = { largeur: 1000, hauteur: 800 };
  const taille = { largeur: 320, hauteur: 400 };

  it("se pose où on la lâche", () => {
    expect(positionDansEcran({ x: 200, y: 100 }, taille, ecran)).toEqual({ x: 200, y: 100 });
  });

  it("ne se laisse pas emmener hors de l'écran, où on ne pourrait plus la reprendre", () => {
    expect(positionDansEcran({ x: 5000, y: 5000 }, taille, ecran)).toEqual({ x: 680, y: 400 });
    expect(positionDansEcran({ x: -300, y: -50 }, taille, ecran)).toEqual({ x: 0, y: 0 });
  });

  it("reste attrapable sur un écran plus petit qu'elle", () => {
    // Rien de négatif : la fenêtre déborde par la droite plutôt que de sortir par
    // la gauche, où sa barre de titre serait hors d'atteinte.
    expect(positionDansEcran({ x: 100, y: 100 }, taille, { largeur: 300, hauteur: 300 })).toEqual({ x: 0, y: 0 });
  });
});
