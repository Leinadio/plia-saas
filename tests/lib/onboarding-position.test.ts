import { describe, expect, test } from "vitest";
import { placeTourCard, type TourRect } from "../../src/lib/onboarding-position";

const viewport = { width: 1024, height: 768 };
const card = { width: 280, height: 180 };

describe("placement de l'infobulle", () => {
  test("place la carte sous sa cible quand le placement préféré est disponible", () => {
    const target: TourRect = { top: 120, right: 500, bottom: 180, left: 300, width: 200, height: 60 };

    expect(placeTourCard({ target, preferred: "bottom", viewport, card })).toEqual({
      mode: "anchored",
      side: "bottom",
      x: 260,
      y: 196,
    });
  });

  test("retourne au bord avec une gouttière de 16 px", () => {
    const nearRightEdge: TourRect = { top: 120, right: 1000, bottom: 180, left: 900, width: 100, height: 60 };

    expect(placeTourCard({ target: nearRightEdge, preferred: "right", viewport, card }).x)
      .toBeLessThanOrEqual(viewport.width - card.width - 16);
    expect(placeTourCard({ target: nearRightEdge, preferred: "right", viewport, card })).toMatchObject({
      mode: "anchored",
      side: "left",
    });
  });

  test("retourne une carte centrée quand la cible manque", () => {
    expect(placeTourCard({ target: null, viewport, card })).toEqual({
      mode: "center",
      side: null,
      x: 372,
      y: 294,
    });
  });
});
