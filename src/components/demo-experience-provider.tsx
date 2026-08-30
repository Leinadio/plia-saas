"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEMO_IDS } from "../lib/demo-finances";
import { buildDemoProjection, type DemoEdits } from "../lib/demo-projection";
import { isDemoMode, type OnboardingMode } from "../lib/onboarding-mode";
import {
  TOUR_STEPS,
  canAdvance,
  freshTourVisit,
  reduceTour,
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
  saving: boolean;
  dispatch: (event: TourEvent) => void;
  next: () => Promise<void>;
  back: () => void;
  pause: () => Promise<void>;
  resume: () => void;
  finish: () => Promise<void>;
  restart: () => Promise<void>;
  flush: () => Promise<void>;
};

const DemoExperienceContext = createContext<DemoExperience | null>(null);
const currentMonth = () => new Date().toISOString().slice(0, 7);

export function DemoExperienceProvider(props: {
  mode: OnboardingMode;
  initialVisit?: TourVisit;
  onPersist?: (visit: TourVisit) => Promise<void>;
  onFinish?: (visit: TourVisit) => Promise<{ destination: "/app/historique" }>;
  onRestart?: () => Promise<{ destination: "/app/historique"; visit: TourVisit }>;
  onExitReplay?: () => Promise<void>;
  children: ReactNode;
}): ReactNode {
  const {
    children,
    mode,
    initialVisit = freshTourVisit(),
    onPersist,
    onFinish,
    onRestart,
  } = props;
  const router = useRouter();
  const demo = isDemoMode(mode);
  const [visit, setVisit] = useState<TourVisit>(initialVisit);
  const [saving, setSaving] = useState(false);
  const visitRef = useRef(visit);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const saveError = useRef<unknown>(null);

  const step = TOUR_STEPS.find((candidate) => candidate.id === visit.tour.step) ?? TOUR_STEPS[0];

  useEffect(() => {
    if (demo && !visit.tour.finished && !visit.tour.paused) router.push(step.route);
  }, [demo, router, step.route, visit.tour.finished, visit.tour.paused]);

  const replaceVisit = useCallback((next: TourVisit) => {
    visitRef.current = next;
    setVisit(next);
  }, []);

  const persist = useCallback((next: TourVisit): Promise<void> => {
    replaceVisit(next);
    if (!onPersist) return Promise.resolve();

    setSaving(true);
    const request = saveChain.current.then(async () => {
      await onPersist(next);
      saveError.current = null;
    });
    const tracked = request.catch((error) => {
      saveError.current = error;
    });
    saveChain.current = tracked;
    void tracked.finally(() => {
      if (saveChain.current === tracked) setSaving(false);
    });
    return request;
  }, [onPersist, replaceVisit]);

  const flush = useCallback(async () => {
    await saveChain.current;
    if (saveError.current) throw saveError.current;
  }, []);

  const dispatch = useCallback((event: TourEvent) => {
    const current = visitRef.current;
    const tour = reduceTour(current.tour, event);
    let next: TourVisit = { ...current, tour };
    if (event.type === "MONOPRIX_CATEGORIZED") {
      next = { tour, edits: { ...current.edits, monoprixGroupId: DEMO_IDS.courses } };
    }
    if (event.type === "TRANSPORT_BUDGET_CHANGED") {
      next = { tour, edits: { ...current.edits, transportBudget: event.amount } };
    }
    void persist(next).catch(() => undefined);
  }, [persist]);

  const finish = useCallback(async () => {
    const current = visitRef.current;
    const next = { ...current, tour: reduceTour(current.tour, { type: "FINISH" }) };
    replaceVisit(next);
    await flush();
    const result = await onFinish?.(next);
    router.push(result?.destination ?? "/app/historique");
    router.refresh();
  }, [flush, onFinish, replaceVisit, router]);

  const next = useCallback(async () => {
    const current = visitRef.current;
    if (current.tour.step === "ending-balance" && canAdvance(current.tour)) {
      await finish();
      return;
    }
    dispatch({ type: "NEXT" });
  }, [dispatch, finish]);

  const back = useCallback(() => dispatch({ type: "BACK" }), [dispatch]);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), [dispatch]);
  const pause = useCallback(async () => dispatch({ type: "PAUSE" }), [dispatch]);
  const restart = useCallback(async () => {
    await flush();
    const result = await onRestart?.();
    const next = result?.visit ?? freshTourVisit();
    if (!onRestart) await persist(next);
    else replaceVisit(next);
    router.push(result?.destination ?? TOUR_STEPS[0].route);
    router.refresh();
  }, [flush, onRestart, persist, replaceVisit, router]);

  const value = useMemo<DemoExperience>(() => ({
    mode,
    tour: visit.tour,
    step,
    edits: visit.edits,
    projection: buildDemoProjection(currentMonth(), visit.edits),
    canAdvance: canAdvance(visit.tour),
    saving,
    dispatch,
    next,
    back,
    pause,
    resume,
    finish,
    restart,
    flush,
  }), [back, dispatch, finish, flush, mode, next, pause, restart, resume, saving, step, visit]);

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
