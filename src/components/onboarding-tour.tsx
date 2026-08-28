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
import { placeTourCard, type TourRect } from "../lib/onboarding-position";

const CARD_FALLBACK_SIZE = { width: 360, height: 250 };
const FOCUS_RING_GAP = 4;

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

function Veil({ target }: { target: TourRect | null }): ReactNode {
  if (!target) return <div aria-hidden className="onboarding-tour-veil" />;

  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const horizontal = Math.max(0, target.left - FOCUS_RING_GAP);
  const vertical = Math.max(0, target.top - FOCUS_RING_GAP);
  const right = Math.max(0, target.right + FOCUS_RING_GAP);
  const bottom = Math.max(0, target.bottom + FOCUS_RING_GAP);
  const panel = (style: CSSProperties) => <span aria-hidden className="onboarding-tour-veil-part" style={style} />;

  return (
    <div aria-hidden className="onboarding-tour-veil">
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
    if (controlled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    const selector = `[data-onboarding-target=${JSON.stringify(step.target)}]`;

    const findTarget = () => {
      if (cancelled || typeof document === "undefined") return;
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        element.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center", inline: "nearest" });
        const measure = () => {
          if (!cancelled) setDiscoveredTarget({ stepId: step.id, rect: rectFromElement(element) });
        };
        if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(measure);
        else measure();
        return;
      }
      if (Date.now() - startedAt < 1500) timer = setTimeout(findTarget, 50);
    };

    findTarget();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [controlled, controlledTarget, step.id, step.target]);

  useEffect(() => {
    if (controlled || !target || typeof window === "undefined") return;
    const element = document.querySelector<HTMLElement>(`[data-onboarding-target=${JSON.stringify(step.target)}]`);
    if (!element) return;
    const update = () => setDiscoveredTarget({ stepId: step.id, rect: rectFromElement(element) });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [controlled, step.id, step.target, target]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step.id]);

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
  const stepNumber = experience.step ? ["horizon", "month-projection", "envelopes", "categorize-monoprix", "adjust-transport", "month-continuity", "refresh"].indexOf(step.id) + 1 : 1;
  const isLast = step.id === "refresh";
  const titleId = "onboarding-tour-title";
  const targetMissing = !target;

  return (
    <>
      <Veil target={target} />
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
        className={`onboarding-tour-card ${placement.mode === "center" ? "onboarding-tour-card-center" : ""}`}
        style={{ left: placement.x, top: placement.y }}
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
