import budgets from "../../public/videos/fonctionnalites/budgets.camera.json";
import transactions from "../../public/videos/fonctionnalites/transactions.camera.json";
import previsions from "../../public/videos/fonctionnalites/previsions.camera.json";
import depassements from "../../public/videos/fonctionnalites/depassements.camera.json";
import automatisation from "../../public/videos/fonctionnalites/automatisation.camera.json";

const cameras = {
  budgets,
  transactions,
  previsions,
  depassements,
  automatisation,
};
type Camera = { zoom: number; cx: number; cy: number; px: number; py: number };
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// Position of the cursor in the already-rendered film, including clamped camera edges.
// Using this point for object-position keeps it visible even when cover crops the film.
export function renderedPointer(camera: Camera) {
  const left = clamp(camera.cx - 0.5 / camera.zoom, 0, 1 - 1 / camera.zoom);
  const top = clamp(camera.cy - 0.5 / camera.zoom, 0, 1 - 1 / camera.zoom);
  return {
    x: clamp((camera.px - left) * camera.zoom * 100, 0, 100),
    y: clamp((camera.py - top) * camera.zoom * 100, 0, 100),
  };
}

export function videoFocus(scene: keyof typeof cameras, time: number) {
  const { initial, timeline } = cameras[scene];
  const state: Camera = { ...initial };
  let previous: Camera = initial;
  for (const event of timeline) {
    const p = clamp((time - event.time) / event.duration, 0, 1);
    const ease = p ** 3 * (10 - 15 * p + 6 * p ** 2);
    for (const key of ["zoom", "cx", "cy", "px", "py"] as const)
      state[key] += (event[key] - previous[key]) * ease;
    previous = event;
  }
  const point = renderedPointer(state);
  return `${point.x.toFixed(3)}% ${point.y.toFixed(3)}%`;
}
