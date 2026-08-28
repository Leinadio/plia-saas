import { DEMO_IDS } from "./demo-finances";
import type { DemoEdits } from "./demo-projection";

export type TourStepId =
  | "horizon"
  | "month-projection"
  | "envelopes"
  | "categorize-monoprix"
  | "adjust-transport"
  | "month-continuity"
  | "refresh";

export type TourState = {
  step: TourStepId;
  paused: boolean;
  monoprixCategorized: boolean;
  transportAdjusted: boolean;
};

export type TourStep = {
  id: TourStepId;
  route: "/app" | "/app/transactions" | "/app/historique";
  target: string;
  title: string;
  text: string;
  placement: "top" | "right" | "bottom" | "left";
  requiredAction?: "monoprix-categorized" | "transport-adjusted";
};

export type TourEvent =
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "MONOPRIX_CATEGORIZED" }
  | { type: "TRANSPORT_BUDGET_CHANGED"; amount: number };

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "horizon",
    route: "/app",
    target: "horizon",
    title: "Les prochains mois",
    text: "Chaque colonne montre le solde attendu à la fin du mois. Les mois à venir restent des prévisions.",
    placement: "bottom",
  },
  {
    id: "month-projection",
    route: "/app",
    target: "month-projection",
    title: "La projection de fin de mois",
    text: "Ce montant répond à une question simple : que restera-t-il à la fin du mois si le prévu se réalise ?",
    placement: "bottom",
  },
  {
    id: "envelopes",
    route: "/app",
    target: "envelopes",
    title: "Les enveloppes",
    text: "Le budget, le dépensé et le reste rendent visible ce qui est déjà engagé. Le rouge montre un dépassement.",
    placement: "bottom",
  },
  {
    id: "categorize-monoprix",
    route: "/app/transactions",
    target: "categorize-monoprix",
    title: "Classez une opération",
    text: "Rangez MONOPRIX dans Courses pour voir l'enveloppe se mettre à jour.",
    placement: "top",
    requiredAction: "monoprix-categorized",
  },
  {
    id: "adjust-transport",
    route: "/app/historique",
    target: "adjust-transport",
    title: "Ajustez une enveloppe",
    text: "Passez le budget Transport de 120 € à 150 €. Cette modification reste dans la démonstration.",
    placement: "top",
    requiredAction: "transport-adjusted",
  },
  {
    id: "month-continuity",
    route: "/app/historique",
    target: "month-continuity",
    title: "Les mois se suivent",
    text: "Un reste ou un dépassement ne disparaît pas au changement de mois : il continue dans la projection.",
    placement: "bottom",
  },
  {
    id: "refresh",
    route: "/app",
    target: "refresh",
    title: "Rafraîchir et revenir au réel",
    text: "Les données bancaires datent de la dernière synchronisation. Elles ne sont jamais en temps réel.",
    placement: "bottom",
  },
] as const;

export const TOUR_SESSION_KEY = "plia:onboarding-tour:v1";

export type TourVisit = { tour: TourState; edits: DemoEdits };

export function freshTourVisit(): TourVisit {
  return {
    tour: {
      step: "horizon",
      paused: false,
      monoprixCategorized: false,
      transportAdjusted: false,
    },
    edits: { monoprixGroupId: null, transportBudget: 120 },
  };
}

function stepIndex(step: TourStepId): number {
  return TOUR_STEPS.findIndex((candidate) => candidate.id === step);
}

export function canAdvance(state: TourState): boolean {
  if (state.paused) return false;
  if (state.step === "categorize-monoprix") return state.monoprixCategorized;
  if (state.step === "adjust-transport") return state.transportAdjusted;
  return true;
}

export function reduceTour(state: TourState, event: TourEvent): TourState {
  if (event.type === "PAUSE") return { ...state, paused: true };
  if (event.type === "RESUME") return { ...state, paused: false };

  if (event.type === "MONOPRIX_CATEGORIZED") return { ...state, monoprixCategorized: true };
  if (event.type === "TRANSPORT_BUDGET_CHANGED") {
    return { ...state, transportAdjusted: event.amount === 150 };
  }

  if (state.paused) return state;

  if (event.type === "BACK") {
    const previous = TOUR_STEPS[stepIndex(state.step) - 1];
    return previous ? { ...state, step: previous.id } : state;
  }

  if (event.type === "NEXT" && canAdvance(state)) {
    const next = TOUR_STEPS[stepIndex(state.step) + 1];
    return next ? { ...state, step: next.id } : state;
  }

  return state;
}

export function serializeTourVisit(visit: TourVisit): string {
  return JSON.stringify({ version: 1, ...visit });
}

function isTourStepId(value: unknown): value is TourStepId {
  return typeof value === "string" && TOUR_STEPS.some((step) => step.id === value);
}

function isTourVisit(value: unknown): value is { version: 1; tour: TourState; edits: DemoEdits } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || !record.tour || !record.edits) return false;

  const tour = record.tour as Record<string, unknown>;
  const edits = record.edits as Record<string, unknown>;
  const validTour = isTourStepId(tour.step)
    && typeof tour.paused === "boolean"
    && typeof tour.monoprixCategorized === "boolean"
    && typeof tour.transportAdjusted === "boolean";
  const validEdits = (edits.monoprixGroupId === null || edits.monoprixGroupId === DEMO_IDS.courses)
    && (edits.transportBudget === 120 || edits.transportBudget === 150);
  const matchingGestures = tour.monoprixCategorized === (edits.monoprixGroupId === DEMO_IDS.courses)
    && tour.transportAdjusted === (edits.transportBudget === 150);

  return validTour && validEdits && matchingGestures;
}

export function restoreTourVisit(raw: string | null): TourVisit {
  if (!raw) return freshTourVisit();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isTourVisit(parsed)) return freshTourVisit();
    return {
      tour: { ...parsed.tour },
      edits: { ...parsed.edits },
    };
  } catch {
    return freshTourVisit();
  }
}
