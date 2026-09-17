import { expect, it } from "vitest";
import { renderedPointer } from "../../src/components/landing-video-focus";

it("garde le curseur proche du bord inférieur dans le recadrage d’une carte large", () => {
  const pointer = renderedPointer({
    zoom: 2,
    cx: 0.5,
    cy: 0.9,
    px: 0.5,
    py: 0.9,
  });
  expect(pointer.x).toBeCloseTo(50);
  expect(pointer.y).toBeCloseTo(80);
  // 1280×720 film in a 756×240 card: a centered crop hides this pointer.
  const scale = 756 / 1280;
  const overflow = 720 * scale - 240;
  expect(0.8 * 720 * scale - overflow / 2).toBeGreaterThan(240);
  expect(0.8 * 720 * scale - (overflow * pointer.y) / 100).toBeCloseTo(192);
});
it("borne le point de suivi aux bords et conserve le centre en cadrage symétrique", () => {
  expect(
    renderedPointer({ zoom: 2, cx: 0.5, cy: 0.5, px: 0.5, py: 0.5 }),
  ).toEqual({ x: 50, y: 50 });
  expect(renderedPointer({ zoom: 2, cx: 0, cy: 0, px: 0, py: 0 })).toEqual({
    x: 0,
    y: 0,
  });
});
