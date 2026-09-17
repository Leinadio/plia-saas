"use client";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, CalendarDays, Columns3, ScanLine } from "lucide-react";
import styles from "./landing.module.css";
import budgetDesktop from "../../public/landing/plia-budget-desktop.png";
import budgetMobile from "../../public/landing/plia-enveloppes-mobile.png";
import balancesMobile from "../../public/landing/plia-soldes-mobile.png";
import detailMobile from "../../public/landing/plia-detail-mobile.png";
const views = [
  {
    label: "Votre mois",
    Icon: CalendarDays,
    title: "Tout votre mois. Au même endroit.",
    description:
      "Vos revenus, vos dépenses et le montant disponible pour chaque budget : tout se lit d’un seul regard.",
    image: budgetDesktop,
    mobile: budgetMobile.src,
    alt: "Le tableau Planora en septembre 2026 : revenus, budgets et solde. Données de démonstration.",
    note: "Vue du budget · Septembre 2026",
    width: budgetDesktop.width,
    height: budgetDesktop.height,
  },
  {
    label: "Comparer",
    Icon: Columns3,
    title: "Demain fait déjà partie du tableau.",
    description:
      "Comparez les mois et choisissez l’indicateur qui vous intéresse : budget, dépenses ou solde. Chaque section garde son propre repère.",
    image: balancesMobile,
    alt: "La vue Comparer de Planora présente les soldes d’août à novembre 2026. Données de démonstration.",
    note: "Vue Comparer · Soldes réels et estimation",
    width: balancesMobile.width,
    height: balancesMobile.height,
  },
  {
    label: "Le détail",
    Icon: ScanLine,
    title: "Un chiffre vous interpelle ? Ouvrez-le.",
    description:
      "Retrouvez les montants qui l’expliquent. Vous comprenez d’où vient l’écart et quel budget mérite votre attention.",
    image: detailMobile,
    alt: "Le panneau de détail de Planora explique le montant restant du budget Courses à partir du montant prévu et des dépenses.",
    note: "Détail d’un montant · Budget Courses",
    width: detailMobile.width,
    height: detailMobile.height,
  },
];
export function LandingDemo() {
  const [active, setActive] = useState(0);
  const view = views[active];
  return (
    <section
      id="demonstration"
      className={styles.demo}
      aria-labelledby="demo-heading"
      data-active={active}
    >
      <svg
        className={styles.sectionCurve}
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 0H1440V36C1110 105 870 4 590 36S175 75 0 35Z" />
      </svg>
      <div className={styles.sectionInner}>
        <div className={styles.demoHeading}>
          <h2 id="demo-heading">
            Une vue d’avance.
            <br />
            <span>Des décisions plus claires.</span>
          </h2>
          <p>
            Un compte bien rempli aujourd’hui peut déjà avoir beaucoup à faire
            demain. Planora met les prochains mois en perspective.
          </p>
        </div>
        <div
          className={styles.demoChoices}
          role="group"
          aria-label="Explorer les vues de Planora"
        >
          {views.map(({ label, Icon }, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={active === i}
              aria-controls="landing-demo-view"
              onClick={() => setActive(i)}
            >
              <Icon aria-hidden />
              {label}
              <ArrowRight className={styles.choiceArrow} aria-hidden />
            </button>
          ))}
        </div>
        <div id="landing-demo-view" className={styles.demoPanel}>
          <div
            className={styles.demoText}
            aria-live="polite"
            aria-atomic="true"
          >
            <h3>{view.title}</h3>
            <p>{view.description}</p>
            <span className={styles.demoHint}>{view.note}</span>
          </div>
          <figure
            className={[
              styles.demoFigure,
              active === 0 ? styles.demoDesktop : styles.demoPhone,
            ].join(" ")}
          >
            <svg
              className={styles.lightCurve}
              viewBox="0 0 650 500"
              aria-hidden
            >
              <path
                d="M-300 720C700 780 -60 -300 1100 -150"
                fill="none"
                stroke="currentColor"
                strokeWidth="100"
              />
            </svg>
            <div className={styles.demoImageWrap} key={active}>
              <picture>
                {view.mobile && (
                  <source media="(max-width: 700px)" srcSet={view.mobile} />
                )}
                <Image
                  src={view.image}
                  alt={view.alt}
                  width={view.width}
                  height={view.height}
                  sizes="(max-width: 700px) 90vw, 60vw"
                  unoptimized
                />
              </picture>
            </div>
            <figcaption>
              Écrans de l’application · données de démonstration
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
