"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useDemoExperience } from "./demo-experience-provider";
import { isDemoMode } from "../lib/onboarding-mode";
import { activeTourTarget, TOUR_STEPS } from "../lib/onboarding-tour";
import { mobileScrollDelta, nextTourRetryDelay, placeTourCard, type TourRect } from "../lib/onboarding-position";

const CARD_FALLBACK_SIZE = { width: 360, height: 250 };
const FOCUS_RING_GAP = 4;
const MOBILE_PANEL_CLEARANCE = 280;

type TargetDiscovery = {
  status: "seeking" | "found" | "missing";
  stepId: string;
  targetName: string;
  retry: number;
  rect?: TourRect;
};

function rectFromElement(element: Element): TourRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function focusableControls(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(
    "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
  ));
}

function nearestVerticalScrollAncestor(element: HTMLElement): HTMLElement | null {
  if (typeof window === "undefined") return null;
  let ancestor = element.parentElement;
  while (ancestor) {
    const style = window.getComputedStyle(ancestor);
    if (/(auto|scroll|overlay)/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight) return ancestor;
    ancestor = ancestor.parentElement;
  }
  return null;
}

function scrollRootBy(root: HTMLElement | null, delta: number, behavior: ScrollBehavior): void {
  if (delta === 0) return;
  if (root) {
    if (typeof root.scrollBy === "function") root.scrollBy({ top: delta, behavior });
    else root.scrollTop += delta;
  } else if (typeof window !== "undefined" && typeof window.scrollBy === "function") {
    window.scrollBy({ top: delta, behavior });
  }
}

function Veil({ interactive }: { target: TourRect | null; interactive: boolean }): ReactNode {
  if (interactive) return null;
  return <div aria-hidden data-onboarding-scroll-clearance="target-and-scroll-root" className="onboarding-tour-veil onboarding-tour-veil-blocking onboarding-tour-scroll-clearance" />;
}

export type OnboardingTourProps = {
  /** Used by static renderers and visual harnesses; omitted in the real app. */
  target?: TourRect | null;
};

export function OnboardingTour({ target: controlledTarget }: OnboardingTourProps = {}): ReactNode {
  const experience = useDemoExperience();
  const { step, tour, canAdvance, next, back, pause, dispatch } = experience;
  const demo = isDemoMode(experience.mode);
  const interactiveTarget = step.requiredAction !== undefined;
  const targetName = activeTourTarget(step, tour);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlled = controlledTarget !== undefined;
  const [discoveredTarget, setDiscoveredTarget] = useState<TargetDiscovery | null>(null);
  const [targetRetry, setTargetRetry] = useState(0);
  const [cardSize, setCardSize] = useState(CARD_FALLBACK_SIZE);
  const discoveryMatches = discoveredTarget?.stepId === step.id
    && discoveredTarget.targetName === targetName
    && discoveredTarget.retry === targetRetry;
  const targetStatus = controlled
    ? (controlledTarget ? "found" : "missing")
    : discoveryMatches ? discoveredTarget.status : "seeking";
  const target = targetStatus === "found"
    ? controlled ? controlledTarget ?? null : discoveredTarget?.rect ?? null
    : null;
  const targetAvailable = targetStatus === "found" && target !== null;
  const targetMissing = targetStatus === "missing";

  useEffect(() => {
    if (!demo || controlled || tour.paused) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let frame: number | undefined;
    let clearanceCleanup: (() => void) | undefined;
    const deadline = Date.now() + 1500;
    const selector = `[data-onboarding-target=${JSON.stringify(targetName)}]`;

    const queryTarget = () => document.querySelector<HTMLElement>(selector);
    const mobileClearTarget = (element: HTMLElement) => {
      if (typeof window === "undefined" || window.innerWidth >= 768) return;
      const rect = element.getBoundingClientRect();
      const panelClearance = Math.min(
        Math.max(MOBILE_PANEL_CLEARANCE, Math.round(window.innerHeight * 0.6)),
        464,
      );
      const root = nearestVerticalScrollAncestor(element);
      const previousMargin = element.style.scrollMarginBottom;
      const previousPadding = root?.style.scrollPaddingBottom;
      element.style.scrollMarginBottom = `${panelClearance}px`;
      if (root) root.style.scrollPaddingBottom = `${panelClearance}px`;
      clearanceCleanup ??= () => {
        element.style.scrollMarginBottom = previousMargin;
        if (root) root.style.scrollPaddingBottom = previousPadding ?? "";
      };
      scrollRootBy(root, mobileScrollDelta({
        targetTop: rect.top,
        targetBottom: rect.bottom,
        viewportHeight: window.innerHeight,
        panelClearance,
      }), prefersReducedMotion() ? "auto" : "smooth");
    };

    const measureFreshTarget = () => {
      if (cancelled) return;
      const freshElement = queryTarget();
      if (!freshElement) return;
      mobileClearTarget(freshElement);
      if (typeof window !== "undefined" && !prefersReducedMotion() && typeof window.requestAnimationFrame === "function") {
        frame = window.requestAnimationFrame(() => {
          if (!cancelled) {
            const settledElement = queryTarget();
            if (settledElement) setDiscoveredTarget({ status: "found", stepId: step.id, targetName, retry: targetRetry, rect: rectFromElement(settledElement) });
          }
        });
      } else {
        setDiscoveredTarget({ status: "found", stepId: step.id, targetName, retry: targetRetry, rect: rectFromElement(freshElement) });
      }
    };

    const findTarget = () => {
      if (cancelled || typeof document === "undefined") return;
      if (Date.now() >= deadline) {
        setDiscoveredTarget({ status: "missing", stepId: step.id, targetName, retry: targetRetry });
        return;
      }
      const element = queryTarget();
      if (element) {
        if (typeof element.scrollIntoView === "function") {
          element.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center", inline: "nearest" });
        }
        if (prefersReducedMotion()) {
          measureFreshTarget();
        } else if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          frame = window.requestAnimationFrame(() => {
            settleTimer = setTimeout(measureFreshTarget, 180);
          });
        } else {
          settleTimer = setTimeout(measureFreshTarget, 180);
        }
        return;
      }
      const delay = nextTourRetryDelay(Date.now(), deadline);
      if (delay !== null) timer = setTimeout(findTarget, delay);
    };

    findTarget();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (settleTimer) clearTimeout(settleTimer);
      if (frame !== undefined && typeof window !== "undefined") window.cancelAnimationFrame(frame);
      clearanceCleanup?.();
    };
  }, [controlled, controlledTarget, demo, step.id, targetName, targetRetry, tour.paused]);

  useEffect(() => {
    if (!demo || controlled || tour.paused || !target || typeof window === "undefined") return;
    const element = document.querySelector<HTMLElement>(`[data-onboarding-target=${JSON.stringify(targetName)}]`);
    if (!element) return;
    const update = () => {
      const currentElement = document.querySelector<HTMLElement>(`[data-onboarding-target=${JSON.stringify(targetName)}]`);
      if (currentElement) setDiscoveredTarget({ status: "found", stepId: step.id, targetName, retry: targetRetry, rect: rectFromElement(currentElement) });
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { capture: true, passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    const mutationObserver = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
      if (!document.querySelector(`[data-onboarding-target=${JSON.stringify(targetName)}]`)) {
        setTargetRetry((retry) => retry + 1);
      }
    });
    mutationObserver?.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [controlled, demo, step.id, targetName, targetRetry, target, tour.paused]);

  useEffect(() => {
    if (demo && targetAvailable && !interactiveTarget) headingRef.current?.focus();
  }, [demo, interactiveTarget, step.id, targetAvailable]);

  useEffect(() => {
    if (!demo || tour.paused || typeof document === "undefined") return;
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        void pause();
        return;
      }
      if (interactiveTarget || targetMissing) return;
      if (event.key !== "Tab" || dialog.contains(document.activeElement)) return;
      const controls = focusableControls(dialog);
      if (controls.length === 0) return;
      event.preventDefault();
      (event.shiftKey ? controls[controls.length - 1] : controls[0]).focus();
    };
    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [demo, interactiveTarget, pause, targetMissing, tour.paused]);

  useEffect(() => {
    if (!demo) return;
    const card = cardRef.current;
    if (!card) return;
    const update = () => {
      const rect = card.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setCardSize({ width: rect.width, height: rect.height });
    };
    update();
  }, [demo, step.id, target]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      void pause();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      back();
      return;
    }
    if (event.key === "ArrowRight" && targetMissing) {
      event.preventDefault();
      dispatch({ type: "SKIP" });
      return;
    }
    if (event.key === "ArrowRight" && canAdvance) {
      event.preventDefault();
      void next();
      return;
    }
    if (event.key !== "Tab" || interactiveTarget || targetMissing) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const controls = focusableControls(dialog);
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [back, canAdvance, dispatch, interactiveTarget, next, pause, targetMissing]);

  if (!demo || tour.paused || tour.finished) return null;
  if (targetStatus === "seeking") return null;

  const placement = target ? placeTourCard({
    target,
    preferred: step.placement,
    viewport: { width: typeof window === "undefined" ? 1280 : window.innerWidth, height: typeof window === "undefined" ? 800 : window.innerHeight },
    card: cardSize,
  }) : null;
  const cardPosition = placement?.mode === "needs-scroll"
    ? { x: 16, y: 16 }
    : placement ? placement : null;
  const stepNumber = TOUR_STEPS.findIndex(({ id }) => id === step.id) + 1;
  const isLast = stepNumber === TOUR_STEPS.length;
  const titleId = "onboarding-tour-title";

  return (
    <>
      <Veil target={target} interactive={interactiveTarget || targetMissing} />
      {target && (
        <div
          aria-hidden
          className="onboarding-tour-focus-ring"
          style={{ top: target.top - FOCUS_RING_GAP, left: target.left - FOCUS_RING_GAP, width: target.width + FOCUS_RING_GAP * 2, height: target.height + FOCUS_RING_GAP * 2 }}
        />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={interactiveTarget || targetMissing ? undefined : true}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`onboarding-tour-card onboarding-tour-card-mobile-panel ${targetMissing ? "onboarding-tour-card-missing" : ""} ${placement?.mode === "center" ? "onboarding-tour-card-center" : ""} ${placement?.mode === "needs-scroll" ? "onboarding-tour-card-needs-scroll" : ""}`}
        style={cardPosition ? { left: cardPosition.x, top: cardPosition.y } : undefined}
      >
        <div ref={cardRef} className="onboarding-tour-card-inner">
          <p className="onboarding-tour-progress" aria-label={`Étape ${stepNumber} sur ${TOUR_STEPS.length}`}>Étape {stepNumber} sur {TOUR_STEPS.length}</p>
          <h2 ref={headingRef} id={titleId} tabIndex={-1} className="onboarding-tour-title">{step.title}</h2>
          <p className="onboarding-tour-copy">{step.text}</p>
          {targetMissing && <p className="onboarding-tour-fallback">Cette zone indisponible pour le moment. Vous pouvez continuer.</p>}
          <div className="onboarding-tour-actions">
            <button type="button" className="onboarding-tour-button onboarding-tour-back" onClick={back} disabled={stepNumber === 1}>Retour</button>
            <button type="button" className="onboarding-tour-button onboarding-tour-later" onClick={() => void pause()}>Plus tard</button>
            {targetMissing ? (
              <>
                <button type="button" className="onboarding-tour-button" onClick={() => setTargetRetry((retry) => retry + 1)}>Réessayer</button>
                <button type="button" className="onboarding-tour-button onboarding-tour-next" onClick={() => dispatch({ type: "SKIP" })}>Passer cette étape</button>
              </>
            ) : (
              <button type="button" className="onboarding-tour-button onboarding-tour-next" onClick={() => void next()} disabled={!canAdvance}>{isLast ? "Compris" : "Suivant"}</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
