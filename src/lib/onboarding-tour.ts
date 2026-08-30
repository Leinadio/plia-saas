import { DEMO_IDS } from "./demo-finances";
import type { DemoEdits } from "./demo-projection";

export type TourStepId =
  | "demo-account"
  | "period-range"
  | "time-context"
  | "income"
  | "expenses"
  | "adjust-transport"
  | "amount-detail"
  | "ending-balance";

export type TourState = {
  step: TourStepId;
  paused: boolean;
  finished: boolean;
  monoprixCategorized: boolean;
  transportAdjusted: boolean;
  detailOpened: boolean;
};

export type TourStep = {
  id: TourStepId;
  route: "/app/historique";
  target: string;
  completionTarget?: string;
  title: string;
  text: string;
  placement: "top" | "right" | "bottom" | "left";
  requiredAction?: "transport-adjusted" | "detail-opened";
};

export type TourEvent =
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SKIP" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "FINISH" }
  | { type: "MONOPRIX_CATEGORIZED" }
  | { type: "TRANSPORT_BUDGET_CHANGED"; amount: number }
  | { type: "DETAIL_OPENED" };

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "demo-account",
    route: "/app/historique",
    target: "demo-account",
    title: "Vous êtes dans une démonstration",
    text: "Tous les montants sont fictifs. Aucune donnée bancaire réelle n’est utilisée.",
    placement: "bottom",
  },
  {
    id: "period-range",
    route: "/app/historique",
    target: "overview-period",
    title: "Choisissez votre période",
    text: "Affichez davantage de passé ou prolongez la vue vers les mois à venir.",
    placement: "bottom",
  },
  {
    id: "time-context",
    route: "/app/historique",
    target: "overview-time",
    title: "Situez-vous dans le temps",
    text: "Le passé repose sur les opérations connues, le mois courant relie le réel au prévu, puis viennent les projections.",
    placement: "bottom",
  },
  {
    id: "income",
    route: "/app/historique",
    target: "overview-income",
    title: "Voyez ce qui rentre",
    text: "Comparez ce qui était attendu avec ce qui a réellement été reçu.",
    placement: "bottom",
  },
  {
    id: "expenses",
    route: "/app/historique",
    target: "overview-expenses",
    title: "Voyez ce qui sort",
    text: "Toutes vos dépenses sont réunies pour comparer le budget, le montant dépensé et ce qu’il reste.",
    placement: "bottom",
  },
  {
    id: "adjust-transport",
    route: "/app/historique",
    target: "adjust-transport",
    title: "Ajustez votre budget",
    text: "Passez le budget Transport de 120 € à 150 €. Les mois suivants se recalculent sans modifier de vraies données.",
    placement: "top",
    requiredAction: "transport-adjusted",
  },
  {
    id: "amount-detail",
    route: "/app/historique",
    target: "open-amount-detail",
    completionTarget: "amount-detail-panel",
    title: "Comprenez chaque montant",
    text: "Cliquez sur ce montant pour voir les opérations qui le composent.",
    placement: "top",
    requiredAction: "detail-opened",
  },
  {
    id: "ending-balance",
    route: "/app/historique",
    target: "overview-ending-balance",
    title: "Regardez où vous allez",
    text: "Les revenus, les dépenses et vos ajustements construisent le solde de fin de chaque mois.",
    placement: "bottom",
  },
] as const;

export const TOUR_SESSION_KEY = "plia:onboarding-tour:v1";

export type TourVisit = { tour: TourState; edits: DemoEdits };

export function freshTourVisit(): TourVisit {
  return {
    tour: {
      step: "demo-account",
      paused: false,
      finished: false,
      monoprixCategorized: false,
      transportAdjusted: false,
      detailOpened: false,
    },
    edits: { monoprixGroupId: null, transportBudget: 120 },
  };
}

export function activeTourTarget(step: TourStep, state: TourState): string {
  return step.completionTarget && state.detailOpened ? step.completionTarget : step.target;
}

function stepIndex(step: TourStepId): number {
  return TOUR_STEPS.findIndex((candidate) => candidate.id === step);
}

function advance(state: TourState): TourState {
  const next = TOUR_STEPS[stepIndex(state.step) + 1];
  return next ? { ...state, step: next.id } : state;
}

export function canAdvance(state: TourState): boolean {
  if (state.paused || state.finished) return false;
  if (state.step === "adjust-transport") return state.transportAdjusted;
  if (state.step === "amount-detail") return state.detailOpened;
  return true;
}

export function reduceTour(state: TourState, event: TourEvent): TourState {
  if (event.type === "FINISH") return { ...state, paused: false, finished: true };
  if (state.finished) return state;
  if (event.type === "PAUSE") return { ...state, paused: true };
  if (event.type === "RESUME") return { ...state, paused: false };

  if (event.type === "MONOPRIX_CATEGORIZED") return { ...state, monoprixCategorized: true };
  if (event.type === "TRANSPORT_BUDGET_CHANGED") {
    return { ...state, transportAdjusted: event.amount === 150 };
  }
  if (event.type === "DETAIL_OPENED") return { ...state, detailOpened: true };

  if (state.paused) return state;

  if (event.type === "BACK") {
    const previous = TOUR_STEPS[stepIndex(state.step) - 1];
    return previous ? { ...state, step: previous.id } : state;
  }

  if (event.type === "SKIP" || (event.type === "NEXT" && canAdvance(state))) return advance(state);

  return state;
}

export function serializeTourVisit(visit: TourVisit): string {
  return JSON.stringify({ version: 3, ...visit });
}

function isTourStepId(value: unknown): value is TourStepId {
  return typeof value === "string" && TOUR_STEPS.some((step) => step.id === value);
}

function isTourVisit(value: unknown): value is { version: 2 | 3; tour: TourState; edits: DemoEdits } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if ((record.version !== 2 && record.version !== 3) || !record.tour || !record.edits) return false;

  const tour = record.tour as Record<string, unknown>;
  const edits = record.edits as Record<string, unknown>;
  const validTour = isTourStepId(tour.step)
    && typeof tour.paused === "boolean"
    && (record.version === 2 || typeof tour.finished === "boolean")
    && typeof tour.monoprixCategorized === "boolean"
    && typeof tour.transportAdjusted === "boolean"
    && typeof tour.detailOpened === "boolean";
  const validEdits = (edits.monoprixGroupId === null || edits.monoprixGroupId === DEMO_IDS.courses)
    && (edits.transportBudget === 120 || edits.transportBudget === 150);
  const matchingGestures = tour.monoprixCategorized === (edits.monoprixGroupId === DEMO_IDS.courses)
    && tour.transportAdjusted === (edits.transportBudget === 150);

  return validTour && validEdits && matchingGestures;
}

export function restoreTourVisit(raw: string | null): TourVisit {
  if (!raw) return freshTourVisit();

  try {
    let parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      if (record.tour && typeof record.tour === "object") {
        const tour = record.tour as Record<string, unknown>;
        if (tour.step === "planned-expenses" || tour.step === "unplanned-expenses") {
          parsed = { ...record, tour: { ...tour, step: "expenses" } };
        }
      }
    }
    if (!isTourVisit(parsed)) return freshTourVisit();
    return {
      tour: { ...parsed.tour, finished: parsed.version === 3 ? parsed.tour.finished : false },
      edits: { ...parsed.edits },
    };
  } catch {
    return freshTourVisit();
  }
}
