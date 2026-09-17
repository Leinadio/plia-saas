"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  TriangleAlert,
  ChartNoAxesCombined,
  ListFilter,
  Pause,
  Play,
  Wallet,
  Workflow,
  Maximize2,
  X,
} from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { JourneyVideo } from "./landing-demo-video";
import { FeatureIllustration } from "./landing-feature-illustration";
import landing from "./landing.module.css";
import styles from "./landing-demo.module.css";

const steps = [
  {
    id: "budgets",
    icon: Wallet,
    title: "Budgets et sous-budgets",
    description:
      "Définissez un montant par poste, détaillez vos charges en sous-budgets et ajustez vos prévisions mois par mois.",
    example:
      "Création d’un budget Vacances de 250 €, puis consultation du nouveau budget dans la liste de démonstration.",
  },
  {
    id: "transactions",
    icon: ListFilter,
    title: "Suivi des transactions",
    description:
      "Recherchez une opération par libellé, montant ou date, puis rattachez-la au bon budget.",
    example:
      "Illustration : recherche d’une dépense Cinéma de 24,00 €, puis rattachement au budget Sorties et loisirs.",
  },
  {
    id: "previsions",
    icon: ChartNoAxesCombined,
    title: "Prévisions de trésorerie",
    description:
      "Suivez votre trésorerie après chaque poste : opérations réelles, budgets prévus et dépassements inclus.",
    example:
      "Lecture des colonnes de trésorerie : opérations réelles, selon vos budgets et dépassements inclus.",
  },
  {
    id: "depassements",
    icon: TriangleAlert,
    title: "Dépassements de budget",
    description:
      "Repérez les budgets dépassés, comparez le prévu au dépensé et consultez le détail de l’écart.",
    example:
      "Budget Transport : 120 € prévus, 147,60 € dépensés et un dépassement de 27,60 € à consulter.",
  },
  {
    id: "automatisation",
    icon: Workflow,
    title: "Règles d’automatisation",
    description:
      "Définissez une règle par libellé et montant. Vérifiez les correspondances avant de traiter les opérations déjà présentes.",
    example:
      "Illustration : une règle Cinéma, entre 10 et 50 €, reconnaît deux opérations à rattacher au budget Sorties et loisirs après vérification.",
  },
] as const;

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
const getReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getVisible = () => document.visibilityState === "visible";
const serverReducedMotion = () => true;
const serverVisible = () => true;

function JourneyCard({
  step,
  running,
  onExpand,
}: {
  step: (typeof steps)[number];
  running: boolean;
  onExpand: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  const active = running && visible;
  return (
    <div ref={cardRef} className={styles.item}>
      <BentoCard
        className={styles.card}
        name={step.title}
        Icon={step.icon}
        description={step.description}
        background={
          <div className={styles.media}>
            {step.id === "transactions" || step.id === "automatisation" ? (
              <FeatureIllustration scene={step.id} active={active} />
            ) : (
              <JourneyVideo
                scene={step.id}
                description={`Démonstration : ${step.example}`}
                active={active}
                seen={seen}
              />
            )}
          </div>
        }
      >
        <button
          type="button"
          className={styles.expand}
          onClick={onExpand}
          aria-label={`Voir en grand : ${step.title}`}
        >
          Voir en grand <Maximize2 aria-hidden />
        </button>
      </BentoCard>
    </div>
  );
}

function FeaturePreview({
  step,
  reducedMotion,
  onClose,
}: {
  step: (typeof steps)[number];
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [illustrationPlaying, setIllustrationPlaying] =
    useState(!reducedMotion);
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    getVisible,
    serverVisible,
  );
  // This viewer mounts after an explicit click, so the viewport is available.
  const [compact] = useState(
    () => window.matchMedia("(max-width: 700px)").matches,
  );
  const asset = `/videos/fonctionnalites/${step.id}${compact ? "-mobile" : ""}`;
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="feature-preview-title"
      onCancel={onClose}
      onClose={() => {
        // Ignore a queued close event if React has already reopened the dialog.
        if (!ref.current?.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.dialogHeader}>
        <h3 id="feature-preview-title">{step.title}</h3>
        <button type="button" onClick={onClose}>
          <X aria-hidden />
          <span className="sr-only">Fermer l’aperçu</span>
        </button>
      </div>
      {step.id === "transactions" || step.id === "automatisation" ? (
        <>
          <div className={styles.illustrationPreview}>
            <FeatureIllustration
              scene={step.id}
              active={illustrationPlaying && pageVisible}
            />
          </div>
          <div className={styles.illustrationControls}>
            <button
              type="button"
              className={styles.expand}
              onClick={() => setIllustrationPlaying(!illustrationPlaying)}
            >
              {illustrationPlaying ? (
                <Pause aria-hidden />
              ) : (
                <Play aria-hidden />
              )}
              {illustrationPlaying
                ? "Mettre l’illustration en pause"
                : "Animer l’illustration"}
            </button>
          </div>
        </>
      ) : (
        <video
          src={`${asset}.mp4`}
          poster={`${asset}.png`}
          controls
          autoPlay={!reducedMotion}
          muted
          playsInline
          preload="metadata"
          aria-label={step.example}
        />
      )}
      <p>{step.example}</p>
    </dialog>
  );
}

export function LandingDemo() {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getReducedMotion,
    serverReducedMotion,
  );
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    getVisible,
    serverVisible,
  );
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<(typeof steps)[number] | null>(null);
  const running = motionOverride ?? !reducedMotion;
  return (
    <section
      id="demonstration"
      data-full-bleed
      className={`${landing.demo} ${landing.greenSection}`}
      aria-labelledby="demo-heading"
      data-animations={running ? "playing" : "paused"}
    >
      <svg
        className={landing.sectionCurve}
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 0H1440V36C1110 105 870 4 590 36S175 75 0 35Z" />
      </svg>
      <div className={landing.sectionInner} data-landing-container>
        <div className={landing.demoHeading}>
          <h2 id="demo-heading">
            Une vue d’avance.
            <br />
            <span>Des décisions plus claires.</span>
          </h2>
          <p>
            Des budgets personnalisables, des opérations bien classées et une
            trésorerie prévisionnelle. Découvrez les outils de Planora en
            action.
          </p>
        </div>
        <div className={styles.toolbar}>
          <span>Les fonctionnalités en action · Données de démonstration.</span>
          <button
            type="button"
            onClick={() => setMotionOverride(!running)}
            aria-controls="budget-journey"
          >
            {running ? <Pause aria-hidden /> : <Play aria-hidden />}
            {running ? "Mettre les animations en pause" : "Lire les animations"}
          </button>
        </div>
        <BentoGrid id="budget-journey" className={styles.bento}>
          {steps.map((step) => (
            <JourneyCard
              key={step.id}
              step={step}
              running={running && pageVisible && !preview}
              onExpand={() => setPreview(step)}
            />
          ))}
        </BentoGrid>
        {preview && (
          <FeaturePreview
            step={preview}
            reducedMotion={reducedMotion}
            onClose={() => setPreview(null)}
          />
        )}
      </div>
    </section>
  );
}
