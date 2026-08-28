import { describe, expect, test } from "vitest";
import { mobileScrollDelta, nextTourRetryDelay, placeTourCard, type TourRect } from "../../src/lib/onboarding-position";

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

  test("ne programme jamais une nouvelle recherche après l'échéance absolue", () => {
    expect(nextTourRetryDelay(1_490, 1_500)).toBe(10);
    expect(nextTourRetryDelay(1_500, 1_500)).toBeNull();
    expect(nextTourRetryDelay(1_501, 1_500)).toBeNull();
  });

  test("garde une carte non chevauchante même quand aucun côté ne tient dans la fenêtre", () => {
    const target: TourRect = { top: 80, right: 300, bottom: 160, left: 20, width: 280, height: 80 };
    const placement = placeTourCard({ target, preferred: "bottom", viewport: { width: 320, height: 190 }, card: { width: 280, height: 180 } });

    expect(placement).toEqual({ mode: "needs-scroll", side: null, x: null, y: null });
  });

  test("calcule la distance pour dégager une cible au-dessus du panneau mobile", () => {
    expect(mobileScrollDelta({ targetTop: 560, targetBottom: 640, viewportHeight: 667, panelClearance: 280 })).toBe(253);
    expect(mobileScrollDelta({ targetTop: 180, targetBottom: 260, viewportHeight: 667, panelClearance: 280 })).toBe(0);
  });
});
