// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LandingUseCases } from "@/components/landing-use-cases";

vi.mock("next/image", () => ({ default: () => null }));
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let node: HTMLDivElement;
let root: Root;
let track: HTMLElement;
let scrollTo: ReturnType<typeof vi.fn>;
let resize: () => void;
beforeEach(async () => {
  resize = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
  node = document.createElement("div");
  document.body.append(node);
  root = createRoot(node);
  await act(async () => root.render(createElement(LandingUseCases)));
  track = node.querySelector<HTMLElement>("#use-cases-track")!;
  Object.defineProperty(track, "clientWidth", {
    value: 600,
    configurable: true,
  });
  scrollTo = vi.fn(({ left }: ScrollToOptions) => {
    track.scrollLeft = left ?? 0;
    track.dispatchEvent(new Event("scroll"));
  });
  Object.defineProperty(track, "scrollTo", { value: scrollTo, configurable: true });
  await act(async () => resize());
});
afterEach(async () => {
  await act(async () => root.unmount());
  node.remove();
  vi.unstubAllGlobals();
});
function button(label: string) {
  return node.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  )!;
}
function activeSlide() {
  return node.querySelector<HTMLElement>(
    '[aria-roledescription="diapositive"]:not([inert])',
  )!;
}
it("parcourt les usages sans exposer les liens des diapositives masquées", async () => {
  expect(button("Situation précédente").disabled).toBe(true);
  expect(activeSlide().textContent).toContain("Partir à deux");
  await act(async () => button("Situation suivante").click());
  expect(activeSlide().textContent).toContain("Faire les courses");
  expect(
    node.querySelectorAll('[aria-roledescription="diapositive"][inert]'),
  ).toHaveLength(6);
  expect(activeSlide().querySelector("a")?.getAttribute("href")).toBe("#offre");
});
it("permet le clavier, respecte la réduction des animations et les limites", async () => {
  await act(async () =>
    track.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    ),
  );
  expect(button("Situation suivante").disabled).toBe(true);
  expect(activeSlide().textContent).toContain("imprévus");
  expect(scrollTo).toHaveBeenLastCalledWith({
    left: 3600,
    behavior: "instant",
  });
  await act(async () =>
    track.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    ),
  );
  expect(activeSlide().textContent).toContain("chez-vous");
});
it("actualise la sélection après un défilement tactile", async () => {
  await act(async () => {
    track.scrollLeft = 1200;
    track.dispatchEvent(new Event("scroll"));
  });
  expect(activeSlide().textContent).toContain("passions");
  expect(
    node.querySelector('button[aria-pressed="true"]')?.textContent,
  ).toContain("Les activités");
});

it("conserve la situation choisie après un changement de largeur", async () => {
  await act(async () =>
    track.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    ),
  );
  Object.defineProperty(track, "clientWidth", { value: 900 });
  await act(async () => resize());
  expect(scrollTo).toHaveBeenLastCalledWith({
    left: 5400,
    behavior: "instant",
  });
  expect(activeSlide().textContent).toContain("imprévus");
});
