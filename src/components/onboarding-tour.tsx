"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useDemoExperience } from "./demo-experience-provider";
import { mobileScrollDelta, nextTourRetryDelay, placeTourCard, type TourRect } from "../lib/onboarding-position";

const CARD_FALLBACK_SIZE = { width: 360, height: 250 };
const FOCUS_RING_GAP = 4;
const MOBILE_PANEL_CLEARANCE = 280;

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

function Veil({ target, interactive }: { target: TourRect | null; interactive: boolean }): ReactNode {
  if (!target || !interactive) return <div aria-hidden data-onboarding-scroll-clearance="target-and-scroll-root" className="onboarding-tour-veil onboarding-tour-veil-blocking onboarding-tour-scroll-clearance" />;

  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const horizontal = Math.max(0, target.left - FOCUS_RING_GAP);
  const vertical = Math.max(0, target.top - FOCUS_RING_GAP);
  const right = Math.max(0, target.right + FOCUS_RING_GAP);
  const bottom = Math.max(0, target.bottom + FOCUS_RING_GAP);
  const panel = (style: CSSProperties) => <span aria-hidden className="onboarding-tour-veil-part" style={style} />;

  return (
    <div aria-hidden data-onboarding-scroll-clearance="target-and-scroll-root" className="onboarding-tour-veil onboarding-tour-veil-cutout onboarding-tour-scroll-clearance">
      {panel({ top: 0, right: 0, left: 0, height: vertical })}
      {panel({ top: vertical, bottom: Math.max(0, viewportHeight - bottom), left: 0, width: horizontal })}
      {panel({ top: vertical, right: 0, bottom: Math.max(0, viewportHeight - bottom), left: right })}
      {panel({ right: 0, bottom: 0, left: 0, height: Math.max(0, viewportHeight - bottom) })}
    </div>
  );
}

export type OnboardingTourProps = {
  /** Used by static renderers and visual harnesses; omitted in the real app. */
  target?: TourRect | null;
};

export function OnboardingTour({ target: controlledTarget }: OnboardingTourProps = {}): ReactNode {
  const experience = useDemoExperience();
  const { step, tour, canAdvance, next, back, pause } = experience;
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlled = controlledTarget !== undefined;
  const [discoveredTarget, setDiscoveredTarget] = useState<{ stepId: string; rect: TourRect } | null>(null);
  const [cardSize, setCardSize] = useState(CARD_FALLBACK_SIZE);
  const target = controlled
    ? controlledTarget ?? null
    : discoveredTarget?.stepId === step.id ? discoveredTarget.rect : null;

  useEffect(() => {
    if (controlled || tour.paused) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let frame: number | undefined;
    let clearanceCleanup: (() => void) | undefined;
    const deadline = Date.now() + 1500;
    const selector = `[data-onboarding-target=${JSON.stringify(step.target)}]`;

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
            if (settledElement) setDiscoveredTarget({ stepId: step.id, rect: rectFromElement(settledElement) });
          }
        });
      } else {
        setDiscoveredTarget({ stepId: step.id, rect: rectFromElement(freshElement) });
      }
    };

    const findTarget = () => {
      if (cancelled || typeof document === "undefined" || Date.now() >= deadline) return;
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
  }, [controlled, controlledTarget, step.id, step.target, tour.paused]);

  useEffect(() => {
    if (controlled || tour.paused || !target || typeof window === "undefined") return;
    const element = document.querySelector<HTMLElement>(`[data-onboarding-target=${JSON.stringify(step.target)}]`);
    if (!element) return;
    const update = () => {
      const currentElement = document.querySelector<HTMLElement>(`[data-onboarding-target=${JSON.stringify(step.target)}]`);
      if (currentElement) setDiscoveredTarget({ stepId: step.id, rect: rectFromElement(currentElement) });
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { capture: true, passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer?.disconnect();
    };
  }, [controlled, step.id, step.target, target, tour.paused]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step.id]);

  useEffect(() => {
    if (tour.paused || typeof document === "undefined") return;
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        void pause();
        return;
      }
      if (event.key !== "Tab" || dialog.contains(document.activeElement)) return;
      const controls = focusableControls(dialog);
      if (controls.length === 0) return;
      event.preventDefault();
      (event.shiftKey ? controls[controls.length - 1] : controls[0]).focus();
    };
    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [pause, tour.paused]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const update = () => {
      const rect = card.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setCardSize({ width: rect.width, height: rect.height });
    };
    update();
  }, [step.id, target]);

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
    if (event.key === "ArrowRight" && (canAdvance || !target)) {
      event.preventDefault();
      void next();
      return;
    }
    if (event.key !== "Tab") return;
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
  }, [back, canAdvance, next, pause, target]);

  if (tour.paused) return null;

  const placement = placeTourCard({
    target,
    preferred: step.placement,
    viewport: { width: typeof window === "undefined" ? 1280 : window.innerWidth, height: typeof window === "undefined" ? 800 : window.innerHeight },
    card: cardSize,
  });
  const cardPosition = placement.mode === "needs-scroll"
    ? { x: 16, y: 16 }
    : placement;
  const stepNumber = experience.step ? ["horizon", "month-projection", "envelopes", "categorize-monoprix", "adjust-transport", "month-continuity", "refresh"].indexOf(step.id) + 1 : 1;
  const isLast = step.id === "refresh";
  const titleId = "onboarding-tour-title";
  const targetMissing = !target;
  const interactiveTarget = step.id === "categorize-monoprix" || step.id === "adjust-transport";

  return (
    <>
      <Veil target={target} interactive={interactiveTarget} />
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
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`onboarding-tour-card onboarding-tour-card-mobile-panel ${placement.mode === "center" ? "onboarding-tour-card-center" : ""} ${placement.mode === "needs-scroll" ? "onboarding-tour-card-needs-scroll" : ""}`}
        style={{ left: cardPosition.x, top: cardPosition.y }}
      >
        <div ref={cardRef} className="onboarding-tour-card-inner">
          <p className="onboarding-tour-progress" aria-label={`Étape ${stepNumber} sur 7`}>Étape {stepNumber} sur 7</p>
          <h2 ref={headingRef} id={titleId} tabIndex={-1} className="onboarding-tour-title">{step.title}</h2>
          <p className="onboarding-tour-copy">{step.text}</p>
          {targetMissing && <p className="onboarding-tour-fallback">Cette zone indisponible pour le moment. Vous pouvez continuer.</p>}
          <div className="onboarding-tour-actions">
            <button type="button" className="onboarding-tour-button onboarding-tour-back" onClick={back} disabled={stepNumber === 1}>Retour</button>
            <button type="button" className="onboarding-tour-button onboarding-tour-later" onClick={() => void pause()}>Plus tard</button>
            <button type="button" className="onboarding-tour-button onboarding-tour-next" onClick={() => void next()} disabled={!canAdvance && !targetMissing}>{isLast ? "Compris" : "Suivant"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
