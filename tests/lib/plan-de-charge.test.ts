// Le plan de charge : où se pose la ligne du zéro, et à quelle hauteur monte
// chaque mât. Rien de bancaire ici — c'est de la géométrie, et c'est justement
// pour ça qu'elle se teste : posée à l'œil dans un composant, elle dérive au
// premier mois négatif.
import { describe, expect, it } from "vitest";
import { planDeCharge } from "../../src/lib/plan-de-charge";

describe("planDeCharge", () => {
  it("pose la ligne du zéro tout en bas quand aucun mois ne passe dessous", () => {
    const plan = planDeCharge([1000, 2000, 1500]);
    expect(plan.zero).toBe(100);
    // Le plus haut occupe toute la hauteur, les autres au prorata.
    expect(plan.mats.map((m) => m.hauteur)).toEqual([50, 100, 75]);
    expect(plan.mats.every((m) => !m.brise)).toBe(true);
  });

  it("partage la hauteur quand des mois passent sous zéro", () => {
    // 600 au-dessus, 400 en dessous : le prorata (60 %) tombe entre les deux
    // bornes, il s'applique tel quel.
    const plan = planDeCharge([600, -400]);
    expect(plan.zero).toBe(60);
    expect(plan.mats[0].hauteur).toBe(100);
    expect(plan.mats[1].hauteur).toBe(100);
    expect(plan.mats[1].brise).toBe(true);
  });

  it("garde une rupture visible même minuscule face au reste", () => {
    // 1830 au-dessus, 320 en dessous : au prorata strict, la rupture n'aurait
    // que 15 % de la hauteur, soit une vingtaine de pixels. Le sol remonte pour
    // qu'elle se voie — c'est l'information la plus importante de l'écran.
    const plan = planDeCharge([1830, -320]);
    expect(plan.zero).toBe(78);
  });

  it("ne laisse pas non plus la rupture écraser ce qui porte", () => {
    const plan = planDeCharge([100, -4000]);
    expect(plan.zero).toBe(55);
  });

  it("répartit les mâts régulièrement sur la largeur, au centre de leur colonne", () => {
    const plan = planDeCharge([1, 1, 1, 1]);
    expect(plan.mats.map((m) => m.x)).toEqual([12.5, 37.5, 62.5, 87.5]);
  });

  it("ne divise pas par zéro quand tout est à zéro", () => {
    const plan = planDeCharge([0, 0]);
    expect(plan.zero).toBe(100);
    expect(plan.mats.map((m) => m.hauteur)).toEqual([0, 0]);
  });

  it("donne au câble une flèche proportionnelle à la portée", () => {
    // Un câble tendu entre deux points éloignés pend plus bas qu'entre deux
    // points rapprochés : la flèche suit la portée, sinon le câble se lit comme
    // une courbe de tendance et ne dit plus rien de physique.
    const large = planDeCharge([100, 100]);
    const serre = planDeCharge([100, 100, 100, 100, 100, 100]);
    expect(large.fleche).toBeGreaterThan(serre.fleche);
    // Deux mois : une portée de 50 % de la largeur.
    expect(large.fleche).toBeCloseTo(50 * 0.42, 5);
  });

  it("ne rend aucun mât sans mois", () => {
    const plan = planDeCharge([]);
    expect(plan.mats).toEqual([]);
  });

  it("marque brisé un solde exactement à zéro ? non : zéro n'est pas sous zéro", () => {
    const plan = planDeCharge([100, 0]);
    expect(plan.mats[1].brise).toBe(false);
  });
});
