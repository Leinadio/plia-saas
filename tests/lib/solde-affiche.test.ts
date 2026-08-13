// Quel solde afficher pour un mois donné, quand on n'en montre qu'un seul.
//
// Le piège que ce module existe pour éviter : la chaîne « réelle » est PLATE sur
// les mois à venir. C'est voulu — rien n'y est encore réalisé, donc rien ne la
// fait bouger. Prise telle quelle, elle affiche le solde d'aujourd'hui sur tous
// les mois de la frise, et la promesse du produit (« où j'atterris dans trois
// mois ») devient une ligne droite qui ne dit rien.
import { describe, expect, it } from "vitest";
import { soldeAffiche } from "../../src/lib/solde-affiche";

const reels = [1830.2, 1830.2, 1830.2];
const prevus = [2813, 3853, 4893];

describe("soldeAffiche", () => {
  it("prend le réel sur un mois déjà vécu ou en cours", () => {
    expect(soldeAffiche(reels, prevus, 0, false)).toBe(1830.2);
  });

  it("prend le prévu sur un mois à venir, où le réel ne bouge plus", () => {
    expect(soldeAffiche(reels, prevus, 1, true)).toBe(3853);
    expect(soldeAffiche(reels, prevus, 2, true)).toBe(4893);
  });

  it("retombe sur le réel quand le prévu manque à ce mois-là", () => {
    expect(soldeAffiche(reels, [2813, null, null], 1, true)).toBe(1830.2);
  });

  it("rend zéro hors frise plutôt que de rendre indéfini", () => {
    expect(soldeAffiche(reels, prevus, 9, false)).toBe(0);
  });
});
