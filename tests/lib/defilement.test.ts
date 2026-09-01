import { describe, expect, it } from "vitest";
import { adoucir, deplacement, positionA } from "@/lib/defilement";

// Le glissement du grand tableau vers un montant choisi dans le panneau. Trois
// choses séparables du navigateur : de combien bouger, à quelle vitesse, et où
// l'on en est à un instant donné.

describe("de combien faire glisser le tableau", () => {
  const fenetre = { debut: 100, fin: 500 };

  it("ne bouge pas quand le montant est déjà dans la vue", () => {
    expect(deplacement(fenetre, { debut: 200, fin: 260 }, 12)).toBe(0);
    // Collé aux deux bords : visible, donc immobile.
    expect(deplacement(fenetre, { debut: 100, fin: 500 }, 12)).toBe(0);
  });

  it("remonte vers le montant caché avant le bord d'entrée, marge comprise", () => {
    // 40 avant la fenêtre qui commence à 100 : il faut reculer de 60, plus 12 de marge.
    expect(deplacement(fenetre, { debut: 40, fin: 90 }, 12)).toBe(-72);
  });

  it("avance vers le montant caché après le bord de sortie, marge comprise", () => {
    // Il finit à 560 pour une fenêtre qui s'arrête à 500 : avancer de 60, plus 12.
    expect(deplacement(fenetre, { debut: 520, fin: 560 }, 12)).toBe(72);
  });

  it("cale sur le début quand le montant est plus large que la fenêtre", () => {
    // On ne peut pas tout montrer : on montre le début, c'est là qu'est le libellé.
    expect(deplacement(fenetre, { debut: 50, fin: 900 }, 12)).toBe(-62);
  });

  it("accepte une marge nulle", () => {
    expect(deplacement(fenetre, { debut: 40, fin: 90 }, 0)).toBe(-60);
  });
});

describe("l'adoucissement du glissement", () => {
  it("part de zéro et arrive à un", () => {
    expect(adoucir(0)).toBe(0);
    expect(adoucir(1)).toBe(1);
  });

  it("passe par le milieu à mi-parcours", () => {
    expect(adoucir(0.5)).toBeCloseTo(0.5, 6);
  });

  it("démarre et finit au ralenti : le milieu va plus vite que les bords", () => {
    const debut = adoucir(0.1) - adoucir(0);
    const milieu = adoucir(0.55) - adoucir(0.45);
    const fin = adoucir(1) - adoucir(0.9);
    expect(milieu).toBeGreaterThan(debut);
    expect(milieu).toBeGreaterThan(fin);
  });

  it("ne sort jamais de l'intervalle, même pour un temps aberrant", () => {
    expect(adoucir(-3)).toBe(0);
    expect(adoucir(12)).toBe(1);
  });

  it("avance toujours dans le même sens", () => {
    let precedent = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = adoucir(t);
      expect(v).toBeGreaterThanOrEqual(precedent);
      precedent = v;
    }
  });
});

describe("où en est le tableau à un instant donné", () => {
  it("part de sa position et arrive à destination", () => {
    expect(positionA(300, -180, 0, 400)).toBe(300);
    expect(positionA(300, -180, 400, 400)).toBe(120);
  });

  it("ne dépasse jamais la destination si l'instant déborde", () => {
    expect(positionA(300, -180, 900, 400)).toBe(120);
  });

  it("saute directement à destination quand on ne veut pas d'animation", () => {
    expect(positionA(300, -180, 0, 0)).toBe(120);
  });
});
