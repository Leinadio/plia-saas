"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEMO_IDS } from "../lib/demo-finances";
import { buildDemoProjection, type DemoEdits } from "../lib/demo-projection";
import { isDemoMode, type OnboardingMode } from "../lib/onboarding-mode";
import {
  TOUR_SESSION_KEY,
  TOUR_STEPS,
  canAdvance,
  freshTourVisit,
  reduceTour,
  restoreTourVisit,
  serializeTourVisit,
  type TourEvent,
  type TourState,
  type TourStep,
  type TourVisit,
} from "../lib/onboarding-tour";

export type DemoExperience = {
  mode: OnboardingMode;
  tour: TourState;
  step: TourStep;
  edits: DemoEdits;
  projection: ReturnType<typeof buildDemoProjection>;
  canAdvance: boolean;
  dispatch: (event: TourEvent) => void;
  next: () => Promise<void>;
  back: () => void;
  pause: () => Promise<void>;
  resume: () => void;
  finish: () => Promise<void>;
};

const DemoExperienceContext = createContext<DemoExperience | null>(null);

const currentMonth = () => new Date().toISOString().slice(0, 7);
const EMPTY_VISIT = freshTourVisit();
const subscribers = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedVisit = EMPTY_VISIT;

function subscribe(listener: () => void): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function readVisit(): TourVisit {
  const raw = window.sessionStorage.getItem(TOUR_SESSION_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedVisit = restoreTourVisit(raw);
  }
  return cachedVisit;
}

function writeVisit(visit: TourVisit): void {
  const raw = serializeTourVisit(visit);
  try {
    window.sessionStorage.setItem(TOUR_SESSION_KEY, raw);
  } catch {
    // The tour remains usable when browser storage is unavailable.
  }
  cachedRaw = raw;
  cachedVisit = visit;
  for (const listener of subscribers) listener();
}

export function DemoExperienceProvider(props: {
  mode: OnboardingMode;
  onFinish?: () => Promise<{ destination: "/app" }>;
  onExitReplay?: () => Promise<void>;
  children: ReactNode;
}): ReactNode {
  const { children, mode, onFinish, onExitReplay } = props;
  const router = useRouter();
  const demo = isDemoMode(mode);
  const getSnapshot = useCallback(() => (demo ? readVisit() : EMPTY_VISIT), [demo]);
  const visit = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_VISIT);

  const step = TOUR_STEPS.find((candidate) => candidate.id === visit.tour.step) ?? TOUR_STEPS[0];

  useEffect(() => {
    if (demo) router.push(step.route);
  }, [demo, router, step.route]);

  const dispatch = useCallback((event: TourEvent) => {
    const tour = reduceTour(visit.tour, event);
    if (event.type === "MONOPRIX_CATEGORIZED") {
      writeVisit({ tour, edits: { ...visit.edits, monoprixGroupId: DEMO_IDS.courses } });
      return;
    }
    if (event.type === "TRANSPORT_BUDGET_CHANGED") {
      writeVisit({ tour, edits: { ...visit.edits, transportBudget: event.amount } });
      return;
    }
    writeVisit({ ...visit, tour });
  }, [visit]);

  const finish = useCallback(async () => {
    const result = await onFinish?.();
    router.push(result?.destination ?? "/app");
    router.refresh();
  }, [onFinish, router]);

  const next = useCallback(async () => {
    if (visit.tour.step === "refresh" && canAdvance(visit.tour)) {
      await finish();
      return;
    }
    dispatch({ type: "NEXT" });
  }, [dispatch, finish, visit.tour]);

  const back = useCallback(() => dispatch({ type: "BACK" }), [dispatch]);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), [dispatch]);
  const pause = useCallback(async () => {
    if (mode === "replay-demo") {
      await onExitReplay?.();
      router.push("/app");
      router.refresh();
      return;
    }
    dispatch({ type: "PAUSE" });
  }, [dispatch, mode, onExitReplay, router]);

  const value = useMemo<DemoExperience>(() => ({
    mode,
    tour: visit.tour,
    step,
    edits: visit.edits,
    projection: buildDemoProjection(currentMonth(), visit.edits),
    canAdvance: canAdvance(visit.tour),
    dispatch,
    next,
    back,
    pause,
    resume,
    finish,
  }), [back, dispatch, finish, mode, next, pause, resume, step, visit]);

  return <DemoExperienceContext.Provider value={value}>{children}</DemoExperienceContext.Provider>;
}

export function useDemoExperience(): DemoExperience {
  const experience = useContext(DemoExperienceContext);
  if (!experience) throw new Error("useDemoExperience must be used inside DemoExperienceProvider");
  return experience;
}

export function useDemoExperienceOptional(): DemoExperience | null {
  return useContext(DemoExperienceContext);
}
