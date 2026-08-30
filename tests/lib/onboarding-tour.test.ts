import { describe, expect, test } from "vitest";
import { DEMO_IDS } from "../../src/lib/demo-finances";
import {
  TOUR_SESSION_KEY,
  TOUR_STEPS,
  activeTourTarget,
  canAdvance,
  freshTourVisit,
  reduceTour,
  restoreTourVisit,
  serializeTourVisit,
  type TourVisit,
} from "../../src/lib/onboarding-tour";

const freshVisit = () => freshTourVisit();

function advance(visit: TourVisit, times: number): TourVisit {
  let tour = visit.tour;
  for (let index = 0; index < times; index += 1) tour = reduceTour(tour, { type: "NEXT" });
  return { ...visit, tour };
}

describe("le parcours guidé", () => {
  test("déclare les huit étapes de la vue d’ensemble dans l’ordre", () => {
    expect(TOUR_STEPS.map(({ id, route, target }) => [id, route, target])).toEqual([
      ["demo-account", "/app/historique", "demo-account"],
      ["period-range", "/app/historique", "overview-period"],
      ["time-context", "/app/historique", "overview-time"],
      ["income", "/app/historique", "overview-income"],
      ["expenses", "/app/historique", "overview-expenses"],
      ["adjust-transport", "/app/historique", "adjust-transport"],
      ["amount-detail", "/app/historique", "open-amount-detail"],
      ["ending-balance", "/app/historique", "overview-ending-balance"],
    ]);
    expect(TOUR_STEPS.every((step) => step.target && step.title && step.text && step.placement)).toBe(true);
    expect(TOUR_STEPS[5].requiredAction).toBe("transport-adjusted");
    expect(TOUR_STEPS[6].requiredAction).toBe("detail-opened");
  });

  test("avance puis revient sans perdre les gestes déjà faits", () => {
    const visit = advance(freshVisit(), 2);
    const forward = reduceTour(visit.tour, { type: "NEXT" });
    const backward = reduceTour(forward, { type: "BACK" });

    expect(forward.step).toBe("income");
    expect(backward).toEqual(visit.tour);
  });

  test("bloque Suivant tant que Transport n'est pas passé à 150 €", () => {
    const tour = { ...freshVisit().tour, step: "adjust-transport" as const };
    const blocked = reduceTour(tour, { type: "NEXT" });
    const adjusted = reduceTour(tour, { type: "TRANSPORT_BUDGET_CHANGED", amount: 150 });

    expect(canAdvance(tour)).toBe(false);
    expect(blocked).toEqual(tour);
    expect(canAdvance(adjusted)).toBe(true);
    expect(reduceTour(adjusted, { type: "NEXT" }).step).toBe("amount-detail");
  });

  test("bloque Suivant puis révèle le détail après le clic sur le montant", () => {
    let state = freshTourVisit().tour;
    state = { ...state, step: "amount-detail" };

    expect(canAdvance(state)).toBe(false);
    expect(activeTourTarget(TOUR_STEPS[6], state)).toBe("open-amount-detail");
    state = reduceTour(state, { type: "DETAIL_OPENED" });
    expect(canAdvance(state)).toBe(true);
    expect(activeTourTarget(TOUR_STEPS[6], state)).toBe("amount-detail-panel");
  });

  test("saute un geste indisponible pour continuer le guide", () => {
    const unavailableGesture = { ...freshTourVisit().tour, step: "adjust-transport" as const };

    expect(reduceTour(unavailableGesture, { type: "SKIP" }).step).toBe("amount-detail");
  });

  test("met les infobulles en pause puis les reprend à la même étape", () => {
    const atTimeContext = advance(freshVisit(), 2).tour;
    const paused = reduceTour(atTimeContext, { type: "PAUSE" });

    expect(paused).toMatchObject({ step: "time-context", paused: true });
    expect(canAdvance(paused)).toBe(false);
    expect(reduceTour(paused, { type: "NEXT" })).toEqual(paused);
    expect(reduceTour(paused, { type: "RESUME" })).toEqual(atTimeContext);
  });

  test("reste sur la dernière étape quand le guide est prêt à se terminer", () => {
    const tour = { ...freshVisit().tour, step: "ending-balance" as const };

    expect(canAdvance(tour)).toBe(true);
    expect(reduceTour(tour, { type: "NEXT" })).toEqual(tour);
    expect(reduceTour(tour, { type: "FINISH" })).toMatchObject({
      step: "ending-balance",
      paused: false,
      finished: true,
    });
  });
});

describe("la visite de démonstration", () => {
  test("sérialise la visite à la version 3 avec sa fin durable", () => {
    const visit: TourVisit = {
      tour: {
        step: "amount-detail",
        paused: false,
        finished: false,
        monoprixCategorized: true,
        transportAdjusted: true,
        detailOpened: true,
      },
      edits: { monoprixGroupId: DEMO_IDS.courses, transportBudget: 150 },
    };

    expect(TOUR_SESSION_KEY).toBe("plia:onboarding-tour:v1");
    expect(JSON.parse(serializeTourVisit(visit))).toMatchObject({ version: 3 });
    expect(restoreTourVisit(serializeTourVisit(visit))).toEqual(visit);
  });

  test("reprend une visite neuve avec les valeurs initiales du guide", () => {
    expect(freshTourVisit()).toMatchObject({
      tour: { step: "demo-account", detailOpened: false, finished: false },
      edits: { transportBudget: 120 },
    });
  });

  test.each(["planned-expenses", "unplanned-expenses"])(
    "reprend l’ancienne étape %s sur la nouvelle zone Ce qui sort",
    (step) => {
      const raw = JSON.stringify({
        version: 3,
        tour: {
          step,
          paused: false,
          finished: false,
          monoprixCategorized: false,
          transportAdjusted: false,
          detailOpened: false,
        },
        edits: { monoprixGroupId: null, transportBudget: 120 },
      });

      expect(restoreTourVisit(raw).tour.step).toBe("expenses");
    },
  );

  test.each([
    ["un JSON illisible", "{"],
    ["une autre version", JSON.stringify({ version: 1 })],
    ["une étape inconnue", JSON.stringify({ version: 2, tour: { step: "ailleurs", paused: false, monoprixCategorized: false, transportAdjusted: false, detailOpened: false }, edits: { monoprixGroupId: null, transportBudget: 120 } })],
    ["une édition inconnue", JSON.stringify({ version: 2, tour: { step: "demo-account", paused: false, monoprixCategorized: false, transportAdjusted: false, detailOpened: false }, edits: { monoprixGroupId: 42, transportBudget: 120 } })],
    ["un budget hors guide", JSON.stringify({ version: 2, tour: { step: "demo-account", paused: false, monoprixCategorized: false, transportAdjusted: false, detailOpened: false }, edits: { monoprixGroupId: null, transportBudget: 125 } })],
  ])("reprend une visite neuve après %s", (_reason, raw) => {
    expect(restoreTourVisit(raw)).toEqual(freshVisit());
  });
});
