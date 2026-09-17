import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  House,
  Plane,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { LandingBrand, LandingHeader } from "@/components/landing-header";
import landing from "@/components/landing.module.css";
import layout from "@/components/landing-layout.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "En solo ou à deux, un budget à votre rythme — Planora",
  description:
    "Vos dépenses du quotidien, vos loisirs, vos projets : définissez un budget pour chaque priorité. Découvrez Planora en solo ou pour organiser les dépenses de votre foyer.",
};

const exampleBudgets = [
  {
    name: "Vie quotidienne",
    detail: "Les dépenses à prévoir",
    amount: "850 €",
    Icon: House,
  },
  {
    name: "Sorties et loisirs",
    detail: "Une place pour en profiter",
    amount: "120 €",
    Icon: Wallet,
  },
  {
    name: "Projet vacances",
    detail: "Un départ qui se prépare",
    amount: "250 €",
    Icon: Plane,
  },
];

const coupleBenefits = [
  {
    Icon: House,
    title: "Un quotidien mieux prévu.",
    description:
      "Logement, transport, dépenses du foyer : définissez les budgets que vous souhaitez suivre, avec un montant pour chacun.",
  },
  {
    Icon: Plane,
    title: "Des projets qui prennent forme.",
    description:
      "Un voyage ou un emménagement se prépare dans votre budget. Détaillez les dépenses en sous-budgets et prévoyez les mois concernés.",
  },
  {
    Icon: CalendarDays,
    title: "Des choix plus faciles à partager.",
    description:
      "Appuyez-vous sur le prévu, le dépensé et le restant pour discuter de la suite. Vous voyez ce qui est possible avant de vous lancer.",
  },
];

export default function AudiencePage() {
  return (
    <main className={`${landing.landing} ${layout.page} ${styles.page}`}>
      <LandingHeader audience />
      <section className={styles.hero} aria-labelledby="audience-heading">
        <div className={styles.heroCopy}>
          <h1 id="audience-heading">
            Votre vie change.
            <br />
            <span>Votre budget suit.</span>
          </h1>
          <p>
            En solo ou à deux, donnez une place à vos dépenses et à vos envies.
            Avec Planora, vous définissez un budget pour chaque priorité et
            gardez une vue sur la suite.
          </p>
          <div className={styles.actions}>
            <Link href="/reservation" className={landing.primary}>
              Réserver mon accès <ArrowUpRight aria-hidden />
            </Link>
            <a href="#vos-priorites" className={landing.textLink}>
              Trouver mon rythme <ArrowDown aria-hidden />
            </a>
          </div>
        </div>
        <figure className={styles.heroScene}>
          <div className={styles.heroPhoto}>
            <Image
              src="/landing/projets-foyer-v1.png"
              alt="Un couple prépare un départ en week-end dans son appartement lumineux."
              fill
              sizes="(max-width: 1440px) 100vw, 1312px"
              preload
            />
          </div>
          <figcaption>
            <span>De la place pour le quotidien.</span>
            <span>Et pour ce qui vous attend.</span>
          </figcaption>
        </figure>
        <nav
          id="vos-priorites"
          className={styles.profileNav}
          aria-label="Votre façon d’utiliser Planora"
        >
          <a href="#en-solo">
            <UserRound aria-hidden />
            <span>
              <strong>En solo</strong>
              <span>Mes envies. Mes choix.</span>
            </span>
            <ArrowDown aria-hidden />
          </a>
          <a href="#a-deux">
            <UsersRound aria-hidden />
            <span>
              <strong>À deux</strong>
              <span>Les dépenses du foyer. Nos projets.</span>
            </span>
            <ArrowDown aria-hidden />
          </a>
        </nav>
      </section>

      <section
        id="en-solo"
        className={styles.solo}
        aria-labelledby="solo-heading"
      >
        <div className={styles.intro}>
          <h2 id="solo-heading">
            En solo, vos priorités
            <br />
            <span>passent au premier plan.</span>
          </h2>
          <p>
            Le loyer, une sortie, les prochaines vacances : tout ne sert pas au
            même objectif. Choisissez combien consacrer à chaque budget, puis
            suivez vos dépenses sans tout recalculer de tête.
          </p>
        </div>
        <div className={styles.soloScene}>
          <div className={styles.soloPhoto}>
            <Image
              src="/landing/audience-solo-v1.png"
              alt="Une femme lit sur son balcon, dans un moment de calme."
              fill
              sizes="(max-width: 800px) 100vw, (max-width: 1440px) 40vw, 520px"
            />
          </div>
          <div className={styles.budgetExample}>
            <h3>
              Un mois.
              <br />
              <span>Vos priorités à vous.</span>
            </h3>
            <p className={styles.exampleNote}>
              Exemple fictif de budgets mensuels
            </p>
            <table className={styles.budgets}>
              <caption className={styles.srOnly}>
                Exemple de montants prévus pour trois budgets
              </caption>
              <thead>
                <tr>
                  <th scope="col">Mes budgets</th>
                  <th scope="col">Montant prévu</th>
                </tr>
              </thead>
              <tbody>
                {exampleBudgets.map(({ name, detail, amount, Icon }) => (
                  <tr key={name}>
                    <th scope="row">
                      <span className={styles.budgetName}>
                        <Icon aria-hidden />
                        <span>
                          {name}
                          <small>{detail}</small>
                        </span>
                      </span>
                    </th>
                    <td>{amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.exampleSummary}>
              Les opérations se rattachent à vos budgets. Vous retrouvez ce qui
              est prévu, ce qui est dépensé et ce qu’il reste.
            </p>
            <Link href="/#demonstration" className={styles.bandLink}>
              Voir les budgets en action <ArrowUpRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="a-deux"
        className={styles.couple}
        data-full-bleed
        aria-labelledby="couple-heading"
      >
        <svg
          className={styles.curveTop}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 55C320 110 520 0 840 28S1190 85 1440 20V80H0Z" />
        </svg>
        <div data-landing-container className={styles.coupleInner}>
          <div className={styles.intro}>
            <h2 id="couple-heading">
              À deux, préparez la suite
              <br />
              <span>sur des bases claires.</span>
            </h2>
            <p>
              Un chez-vous à aménager, des dépenses à anticiper, une envie de
              partir. Organisez les budgets du foyer que vous suivez pour
              aborder vos projets avec des chiffres concrets.
            </p>
          </div>
          <div className={styles.couplePhoto}>
            <Image
              src="/landing/audience-couple-v1.png"
              alt="Un couple choisit ensemble la peinture pour aménager son appartement."
              fill
              sizes="(max-width: 1440px) 100vw, 1312px"
            />
          </div>
          <div className={styles.benefits}>
            {coupleBenefits.map(({ Icon, title, description }) => (
              <article key={title}>
                <Icon aria-hidden />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p className={styles.personalNote}>
            <UserRound aria-hidden />
            <span>
              <strong>
                Un compte personnel pour organiser les dépenses du foyer.
              </strong>{" "}
              L’accès partagé entre conjoints n’est pas proposé aujourd’hui.
            </span>
          </p>
        </div>
        <svg
          className={styles.curveBottom}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 0H1440V30C1120 90 920 0 620 30S220 90 0 35Z" />
        </svg>
      </section>

      <section className={styles.closing} aria-labelledby="start-heading">
        <h2 id="start-heading">
          Votre façon de vivre.
          <br />
          <span>Votre façon de budgétiser.</span>
        </h2>
        <p>
          Commencez par ce qui compte pour vous. Un budget pour le quotidien, un
          autre pour un projet : c’est vous qui choisissez.
        </p>
        <div className={styles.actions}>
          <Link href="/reservation" className={landing.primary}>
            Réserver mon accès <ArrowUpRight aria-hidden />
          </Link>
          <Link href="/#offre" className={landing.textLink}>
            Découvrir les formules <ArrowUpRight aria-hidden />
          </Link>
        </div>
        <p className={styles.reservationNote}>
          Pré-lancement · Réservation gratuite, sans carte bancaire.
        </p>
        <Link href="/securite" className={styles.securityLink}>
          <ShieldCheck aria-hidden />
          Comment vos données sont protégées <ArrowUpRight aria-hidden />
        </Link>
      </section>
      <footer className={landing.footer}>
        <LandingBrand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <Link href="/#faq">
          Questions fréquentes <ArrowUpRight aria-hidden />
        </Link>
        <Link href="/contact">
          Nous contacter <ArrowUpRight aria-hidden />
        </Link>
      </footer>
    </main>
  );
}
