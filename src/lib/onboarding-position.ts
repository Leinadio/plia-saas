export type TourSide = "top" | "right" | "bottom" | "left";

export type TourRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export type TourViewport = { width: number; height: number };
export type TourCardSize = { width: number; height: number };

export type TourPlacement = {
  mode: "anchored" | "center";
  side: TourSide | null;
  x: number;
  y: number;
};

export type PlaceTourCardOptions = {
  target: TourRect | null;
  viewport: TourViewport;
  card: TourCardSize;
  preferred?: TourSide;
};

export const TOUR_VIEWPORT_GUTTER = 16;
const TOUR_TARGET_GAP = 16;

/** Returns the next retry delay without ever crossing an absolute deadline. */
export function nextTourRetryDelay(now: number, deadline: number, interval = 50): number | null {
  const remaining = deadline - now;
  if (remaining <= 0) return null;
  return Math.min(interval, remaining);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function centerPlacement(viewport: TourViewport, card: TourCardSize): TourPlacement {
  return {
    mode: "center",
    side: null,
    x: clamp((viewport.width - card.width) / 2, TOUR_VIEWPORT_GUTTER, viewport.width - card.width - TOUR_VIEWPORT_GUTTER),
    y: clamp((viewport.height - card.height) / 2, TOUR_VIEWPORT_GUTTER, viewport.height - card.height - TOUR_VIEWPORT_GUTTER),
  };
}

function fits(side: TourSide, target: TourRect, viewport: TourViewport, card: TourCardSize): boolean {
  const availableWidth = viewport.width - TOUR_VIEWPORT_GUTTER;
  const availableHeight = viewport.height - TOUR_VIEWPORT_GUTTER;
  if (side === "top") return target.top - TOUR_TARGET_GAP - card.height >= TOUR_VIEWPORT_GUTTER;
  if (side === "bottom") return target.bottom + TOUR_TARGET_GAP + card.height <= availableHeight;
  if (side === "left") return target.left - TOUR_TARGET_GAP - card.width >= TOUR_VIEWPORT_GUTTER;
  return target.right + TOUR_TARGET_GAP + card.width <= availableWidth;
}

function coordinates(side: TourSide, target: TourRect, viewport: TourViewport, card: TourCardSize): { x: number; y: number } {
  const minimumX = TOUR_VIEWPORT_GUTTER;
  const maximumX = viewport.width - card.width - TOUR_VIEWPORT_GUTTER;
  const minimumY = TOUR_VIEWPORT_GUTTER;
  const maximumY = viewport.height - card.height - TOUR_VIEWPORT_GUTTER;
  const centeredX = target.left + (target.width - card.width) / 2;
  const centeredY = target.top + (target.height - card.height) / 2;

  if (side === "top") return { x: clamp(centeredX, minimumX, maximumX), y: target.top - TOUR_TARGET_GAP - card.height };
  if (side === "bottom") return { x: clamp(centeredX, minimumX, maximumX), y: target.bottom + TOUR_TARGET_GAP };
  if (side === "left") return { x: target.left - TOUR_TARGET_GAP - card.width, y: clamp(centeredY, minimumY, maximumY) };
  return { x: target.right + TOUR_TARGET_GAP, y: clamp(centeredY, minimumY, maximumY) };
}

function opposite(side: TourSide): TourSide {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  return "left";
}

/** Places a tour card without allowing its anchored edge to cover its target. */
export function placeTourCard({ target, viewport, card, preferred = "bottom" }: PlaceTourCardOptions): TourPlacement {
  if (!target) return centerPlacement(viewport, card);

  const sides = [preferred, opposite(preferred), "bottom", "top", "right", "left"]
    .filter((side, index, all): side is TourSide => all.indexOf(side) === index);
  const side = sides.find((candidate) => fits(candidate, target, viewport, card));

  // A viewport smaller than both the target and the card has no fully clear side.
  // Keep the preferred edge, while clamping the card to the same safe gutter.
  if (!side) {
    const fallback = coordinates(preferred, target, viewport, card);
    return {
      mode: "anchored",
      side: preferred,
      // The preferred edge is deliberately allowed outside the viewport when no
      // side can fit. Keeping that edge beyond the target is safer than clamping
      // the card back over the content being explained.
      x: fallback.x,
      y: fallback.y,
    };
  }

  return { mode: "anchored", side, ...coordinates(side, target, viewport, card) };
}
