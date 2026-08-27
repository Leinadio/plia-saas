import { describe, it, expect } from "vitest";
import { partsJauge } from "../../src/lib/jauge";

// LA JAUGE D'ENVELOPPE. Une piste large du budget, ce qui est parti dedans, et —
// quand la dépense passe le budget — un débord posé À DROITE de la piste plutôt
// qu'un remplissage écrasé dedans. C'est ce débord qui doit se voir : il dit de
// COMBIEN un poste a rompu, pas seulement qu'il a rompu.
describe("partsJauge", () => {
  it("laisse la piste entière et vide quand rien n'est parti", () => {
    expect(partsJauge(200, 0)).toEqual({ piste: 100, part: 0, debord: 0 });
  });

  it("remplit la piste au prorata tant qu'on est dans le budget", () => {
    expect(partsJauge(200, 50)).toEqual({ piste: 100, part: 25, debord: 0 });
  });

  it("remplit la piste entièrement quand la dépense égale le budget", () => {
    expect(partsJauge(200, 200)).toEqual({ piste: 100, part: 100, debord: 0 });
  });

  // Le cœur du dessin : la barre entière vaut la dépense, la piste n'en occupe
  // plus que la part budgétée, et le reste est le débord.
  it("rétrécit la piste et sort le débord à sa droite au-delà du budget", () => {
    expect(partsJauge(200, 250)).toEqual({ piste: 80, part: 100, debord: 20 });
  });

  it("réduit la piste à un cinquième quand la dépense vaut cinq fois le budget", () => {
    expect(partsJauge(100, 500)).toEqual({ piste: 20, part: 100, debord: 80 });
  });

  // Une dépense non prévue n'a pas d'enveloppe : tout ce qui sort est du débord,
  // il n'y a pas de piste du tout.
  it("ne dessine que du débord pour un poste sans budget", () => {
    expect(partsJauge(0, 40)).toEqual({ piste: 0, part: 0, debord: 100 });
  });

  it("ne dessine rien pour un poste sans budget et sans dépense", () => {
    expect(partsJauge(0, 0)).toEqual({ piste: 100, part: 0, debord: 0 });
  });

  // Un remboursement peut rendre la dépense nette négative : la jauge ne se
  // dessine pas à l'envers, elle se lit comme vide.
  it("traite une dépense négative comme une enveloppe intacte", () => {
    expect(partsJauge(200, -30)).toEqual({ piste: 100, part: 0, debord: 0 });
  });

  it("traite un budget négatif comme une absence de budget", () => {
    expect(partsJauge(-50, 20)).toEqual({ piste: 0, part: 0, debord: 100 });
  });

  // Les largeurs partent en CSS : une décimale suffit, et la piste plus le débord
  // doivent toujours faire exactement cent, sinon la barre change de longueur
  // d'une ligne à l'autre.
  it("arrondit à la décimale sans jamais perdre le compte des cent pour cent", () => {
    const p = partsJauge(100, 300.7);
    expect(p.piste + p.debord).toBe(100);
    expect(p.piste).toBeCloseTo(33.3, 1);
  });
});
