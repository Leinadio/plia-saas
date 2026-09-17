// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LandingDemo } from "@/components/landing-demo";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const imageProps = { ...props };
    delete imageProps.unoptimized;
    return createElement("img", imageProps);
  },
}));
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let node: HTMLDivElement;
let reduced = false;
let observers: Array<(entries: Partial<IntersectionObserverEntry>[]) => void>;
beforeEach(() => {
  reduced = false;
  observers = [];
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", () => ({
    matches: reduced,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        callback: (entries: Partial<IntersectionObserverEntry>[]) => void,
      ) {
        observers.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  node = document.createElement("div");
  document.body.append(node);
  root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount());
  node.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});
async function mount() {
  await act(async () => root.render(createElement(LandingDemo)));
}
async function visibility(value: boolean) {
  await act(async () =>
    observers.forEach((callback) => callback([{ isIntersecting: value }])),
  );
}
function videos() {
  return [...node.querySelectorAll("video")];
}
function button(text: string) {
  return [...node.querySelectorAll("button")].find((e) =>
    e.textContent?.includes(text),
  )!;
}

it("présente cinq fonctionnalités avec trois vidéos et deux illustrations, sans charger les vidéos hors écran", async () => {
  await mount();
  expect([...node.querySelectorAll("h3")].map((n) => n.textContent)).toEqual([
    "Budgets et sous-budgets",
    "Suivi des transactions",
    "Prévisions de trésorerie",
    "Dépassements de budget",
    "Règles d’automatisation",
  ]);
  expect(videos()).toHaveLength(3);
  expect(videos().every((video) => !video.getAttribute("src"))).toBe(true);
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  await visibility(true);
  expect(videos().map((video) => video.getAttribute("src"))).toEqual([
    "/videos/fonctionnalites/budgets.mp4",
    "/videos/fonctionnalites/previsions.mp4",
    "/videos/fonctionnalites/depassements.mp4",
  ]);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(3);
  vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
  await visibility(false);
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(3);
});

it("suspend et relance les vidéos et illustrations ensemble", async () => {
  await mount();
  await visibility(true);
  vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
  await act(async () => button("Mettre les animations en pause").click());
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(3);
  vi.mocked(HTMLMediaElement.prototype.play).mockClear();
  await act(async () => button("Lire les animations").click());
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(3);
});

it("respecte le mouvement réduit avec une lecture volontaire possible", async () => {
  reduced = true;
  await mount();
  await visibility(true);
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  await act(async () => button("Lire les animations").click());
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(3);
});

it("suspend les médias quand l’onglet est masqué", async () => {
  await mount();
  await visibility(true);
  vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
  const hidden = vi
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("hidden");
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(3);
  vi.mocked(HTMLMediaElement.prototype.play).mockClear();
  hidden.mockReturnValue("visible");
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(3);
});

it("garde une image fixe et permet de réessayer après une erreur vidéo", async () => {
  await mount();
  await visibility(true);
  await act(async () => videos()[0].dispatchEvent(new Event("error")));
  expect(node.querySelector("img")?.getAttribute("src")).toBe(
    "/videos/fonctionnalites/budgets.png",
  );
  expect(videos()).toHaveLength(2);
  await act(async () => button("Réessayer l’aperçu").click());
  expect(videos()).toHaveLength(3);
  expect(node.querySelector("img")).toBeNull();
});

it("propose de relancer la vidéo lorsque le navigateur refuse sa lecture", async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
    new DOMException("Blocked", "NotAllowedError"),
  );
  await mount();
  await visibility(true);
  expect(node.querySelectorAll("img")).toHaveLength(3);
  expect(button("Réessayer l’aperçu")).toBeDefined();
});

it("ignore un refus de lecture tardif après une mise en pause", async () => {
  const rejectors: Array<(error: Error) => void> = [];
  vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(
    () => new Promise((_, reject) => rejectors.push(reject)),
  );
  await mount();
  await visibility(true);
  await act(async () => button("Mettre les animations en pause").click());
  await act(async () =>
    rejectors.forEach((reject) =>
      reject(new DOMException("Interrupted", "AbortError")),
    ),
  );
  expect(videos()).toHaveLength(3);
  expect(button("Réessayer l’aperçu")).toBeUndefined();
});

it("agrandit la fonctionnalité choisie et suspend les aperçus derrière", async () => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.open = false;
    },
  });
  await mount();
  await visibility(true);
  vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
  await act(async () =>
    node
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Voir en grand : Budgets et sous-budgets"]',
      )!
      .click(),
  );
  const dialog = node.querySelector("dialog")!;
  expect(dialog.open).toBe(true);
  expect(dialog.querySelector("video")?.getAttribute("src")).toBe("/videos/fonctionnalites/budgets.mp4");
  expect(dialog.querySelector("video")?.controls).toBe(true);
  // A delayed native close event must not dismiss a reopened dialog.
  await act(async () => dialog.dispatchEvent(new Event("close")));
  expect(node.querySelector("dialog")?.open).toBe(true);
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(3);
  await act(async () => button("Fermer l’aperçu").click());
  expect(node.querySelector("dialog")).toBeNull();
  expect(videos()).toHaveLength(3);
});

it("ouvre la capture verticale sur téléphone pour garder les textes lisibles", async () => {
  for (const [method, open] of [
    ["showModal", true],
    ["close", false],
  ] as const) {
    Object.defineProperty(HTMLDialogElement.prototype, method, {
      configurable: true,
      value() {
        this.open = open;
      },
    });
  }
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width"),
    addEventListener() {},
    removeEventListener() {},
  }));
  await mount();
  await visibility(true);
  await act(async () =>
    node
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Voir en grand : Budgets et sous-budgets"]',
      )!
      .click(),
  );
  expect(node.querySelector("dialog video")?.getAttribute("src")).toBe(
    "/videos/fonctionnalites/budgets-mobile.mp4",
  );
});

it("suspend les deux illustrations hors écran, en pause et sous mouvement réduit", async () => {
  reduced = true;
  await mount();
  await visibility(true);
  const illustrations = () => [
    ...node.querySelectorAll("[data-feature-illustration]"),
  ];
  expect(
    illustrations().map((item) =>
      item.getAttribute("data-feature-illustration"),
    ),
  ).toEqual(["transactions", "automatisation"]);
  expect(
    illustrations().every(
      (item) => item.getAttribute("data-active") === "false",
    ),
  ).toBe(true);
  await act(async () => button("Lire les animations").click());
  expect(
    illustrations().every(
      (item) => item.getAttribute("data-active") === "true",
    ),
  ).toBe(true);
  await visibility(false);
  expect(
    illustrations().every(
      (item) => item.getAttribute("data-active") === "false",
    ),
  ).toBe(true);
});

it("agrandit une illustration sans charger son ancienne vidéo", async () => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.open = false;
    },
  });
  await mount();
  await visibility(true);
  await act(async () =>
    node
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Voir en grand : Règles d’automatisation"]',
      )!
      .click(),
  );
  const dialog = node.querySelector("dialog")!;
  expect(dialog.querySelector("video")).toBeNull();
  expect(
    dialog.querySelector('[data-feature-illustration="automatisation"]'),
  ).not.toBeNull();
  await act(async () => button("Mettre l’illustration en pause").click());
  expect(
    dialog
      .querySelector("[data-feature-illustration]")
      ?.getAttribute("data-active"),
  ).toBe("false");
});
