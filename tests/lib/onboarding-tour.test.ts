import { describe, expect, test } from "vitest";
import { DEMO_IDS } from "../../src/lib/demo-finances";
import {
  TOUR_SESSION_KEY,
  TOUR_STEPS,
  canAdvance,
  reduceTour,
  restoreTourVisit,
  serializeTourVisit,
  type TourVisit,
} from "../../src/lib/onboarding-tour";

const freshVisit = () => restoreTourVisit(null);

function advance(visit: TourVisit, times: number): TourVisit {
  let tour = visit.tour;
  for (let index = 0; index < times; index += 1) tour = reduceTour(tour, { type: "NEXT" });
  return { ...visit, tour };
}

describe("le parcours guidé", () => {
  test("déclare les sept étapes et leurs écrans dans l'ordre", () => {
    expect(TOUR_STEPS.map((step) => [step.id, step.route])).toEqual([
      ["horizon", "/app"],
      ["month-projection", "/app"],
      ["envelopes", "/app"],
      ["categorize-monoprix", "/app/transactions"],
      ["adjust-transport", "/app/historique"],
      ["month-continuity", "/app/historique"],
      ["refresh", "/app"],
    ]);
    expect(TOUR_STEPS.every((step) => step.target && step.title && step.text && step.placement)).toBe(true);
    expect(TOUR_STEPS[3].requiredAction).toBe("monoprix-categorized");
    expect(TOUR_STEPS[4].requiredAction).toBe("transport-adjusted");
  });

  test("avance puis revient sans perdre les gestes déjà faits", () => {
    const visit = advance(freshVisit(), 2);
    const forward = reduceTour(visit.tour, { type: "NEXT" });
    const backward = reduceTour(forward, { type: "BACK" });

    expect(forward.step).toBe("categorize-monoprix");
    expect(backward).toEqual(visit.tour);
  });

  test("bloque Suivant tant que MONOPRIX n'est pas classé", () => {
    const visit = advance(freshVisit(), 3);
    const blocked = reduceTour(visit.tour, { type: "NEXT" });
    const categorized = reduceTour(visit.tour, { type: "MONOPRIX_CATEGORIZED" });

    expect(canAdvance(visit.tour)).toBe(false);
    expect(blocked).toEqual(visit.tour);
    expect(canAdvance(categorized)).toBe(true);
    expect(reduceTour(categorized, { type: "NEXT" }).step).toBe("adjust-transport");
  });

  test("bloque Suivant tant que Transport n'est pas passé à 150 €", () => {
    let tour = advance(freshVisit(), 3).tour;
    tour = reduceTour(tour, { type: "MONOPRIX_CATEGORIZED" });
    tour = reduceTour(tour, { type: "NEXT" });
    const blocked = reduceTour(tour, { type: "NEXT" });
    const adjusted = reduceTour(tour, { type: "TRANSPORT_BUDGET_CHANGED", amount: 150 });

    expect(tour.step).toBe("adjust-transport");
    expect(canAdvance(tour)).toBe(false);
    expect(blocked).toEqual(tour);
    expect(canAdvance(adjusted)).toBe(true);
    expect(reduceTour(adjusted, { type: "NEXT" }).step).toBe("month-continuity");
  });

  test("met les infobulles en pause puis les reprend à la même étape", () => {
    const atProjection = advance(freshVisit(), 1).tour;
    const paused = reduceTour(atProjection, { type: "PAUSE" });

    expect(paused).toMatchObject({ step: "month-projection", paused: true });
    expect(canAdvance(paused)).toBe(false);
    expect(reduceTour(paused, { type: "NEXT" })).toEqual(paused);
    expect(reduceTour(paused, { type: "RESUME" })).toEqual(atProjection);
  });

  test("reste sur la dernière étape quand le guide est prêt à se terminer", () => {
    let tour = freshVisit().tour;
    for (const event of [
      { type: "NEXT" } as const,
      { type: "NEXT" } as const,
      { type: "NEXT" } as const,
      { type: "MONOPRIX_CATEGORIZED" } as const,
      { type: "NEXT" } as const,
      { type: "TRANSPORT_BUDGET_CHANGED", amount: 150 } as const,
      { type: "NEXT" } as const,
      { type: "NEXT" } as const,
    ]) {
      tour = reduceTour(tour, event);
    }

    expect(tour.step).toBe("refresh");
    expect(canAdvance(tour)).toBe(true);
    expect(reduceTour(tour, { type: "NEXT" })).toEqual(tour);
  });
});

describe("la visite de démonstration", () => {
  test("garde l'étape et les deux gestes locaux au rechargement", () => {
    const visit: TourVisit = {
      tour: {
        step: "month-continuity",
        paused: false,
        monoprixCategorized: true,
        transportAdjusted: true,
      },
      edits: { monoprixGroupId: DEMO_IDS.courses, transportBudget: 150 },
    };

    expect(TOUR_SESSION_KEY).toBe("plia:onboarding-tour:v1");
    expect(restoreTourVisit(serializeTourVisit(visit))).toEqual(visit);
  });

  test.each([
    ["un JSON illisible", "{"],
    ["une autre version", JSON.stringify({ version: 2 })],
    ["une étape inconnue", JSON.stringify({ version: 1, tour: { step: "ailleurs", paused: false, monoprixCategorized: false, transportAdjusted: false }, edits: { monoprixGroupId: null, transportBudget: 120 } })],
    ["une édition inconnue", JSON.stringify({ version: 1, tour: { step: "horizon", paused: false, monoprixCategorized: false, transportAdjusted: false }, edits: { monoprixGroupId: 42, transportBudget: 120 } })],
    ["un budget hors guide", JSON.stringify({ version: 1, tour: { step: "horizon", paused: false, monoprixCategorized: false, transportAdjusted: false }, edits: { monoprixGroupId: null, transportBudget: 125 } })],
  ])("reprend une visite neuve après %s", (_reason, raw) => {
    expect(restoreTourVisit(raw)).toEqual(freshVisit());
  });
});
