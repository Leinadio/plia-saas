import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Link2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { LandingHero } from "@/components/landing-hero";
import { LandingDemo } from "@/components/landing-demo";
import { LandingFaq } from "@/components/landing-faq";
import styles from "./landing.module.css";
function Brand() {
  return (
    <Link href="/" aria-label="Plia, accueil" className={styles.brand}>
      <span className={styles.brandMark} aria-hidden>
        P
      </span>
      Plia
    </Link>
  );
}
export function LandingContent() {
  return (
    <main className={styles.landing}>
      <header className={styles.header}>
        <Brand />
        <nav aria-label="Navigation principale" className={styles.nav}>
          <a href="#demonstration">L’expérience Plia</a>
          <a href="#fonctionnement">Comment ça marche</a>
          <a href="#offre">L’offre</a>
        </nav>
        <Link href="/connexion" className={styles.headerLogin}>
          Se connecter <ArrowUpRight aria-hidden />
        </Link>
      </header>
      <LandingHero />
      <section
        className={styles.promise}
        aria-label="Votre budget en trois repères"
      >
        <p>
          Moins de calculs dans un coin de votre tête.
          <br />
          <strong>Plus de place pour ce qui compte.</strong>
        </p>
        <div className={styles.moneyFlow}>
          <span>
            Ce qui rentre <ArrowDown aria-hidden />
          </span>
          <span>
            Ce qui sort <ArrowUpRight aria-hidden />
          </span>
          <span>
            Ce qu’il restera <ArrowUpRight aria-hidden />
          </span>
        </div>
      </section>
      <LandingDemo />
      <section className={styles.life} aria-labelledby="life-heading">
        <div className={styles.lifeImage}>
          <Image
            src="/landing/projets-foyer-v1.png"
            alt="Un couple se prépare à partir en week-end dans un intérieur baigné de lumière."
            fill
            sizes="(max-width: 700px) 100vw, 54vw"
          />
        </div>
        <div className={styles.lifeCopy}>
          <h2 id="life-heading">
            Votre argent a des choses à faire.
            <br />
            <span>Vous aussi.</span>
          </h2>
          <p>
            Un week-end. Des travaux. La rentrée. Les projets n’attendent pas
            toujours le début du mois.
          </p>
          <p>
            Gardez vos charges et vos envies dans la même vue. Vous savez ce qui
            est prévu, ce qui a été dépensé et où porter votre attention.
          </p>
          <a href="#fonctionnement" className={styles.textLink}>
            Un budget à votre image <ArrowDown aria-hidden />
          </a>
        </div>
      </section>
      <section
        id="fonctionnement"
        className={styles.how}
        aria-labelledby="how-heading"
      >
        <div className={styles.howIntro}>
          <h2 id="how-heading">Votre vie est déjà assez remplie.</h2>
          <p>Votre budget peut être plus simple à suivre.</p>
        </div>
        <div className={styles.steps}>
          <article>
            <Link2 aria-hidden />
            <h3>Reliez votre banque.</h3>
            <p>
              Retrouvez votre solde et vos opérations grâce à Enable Banking.
              Votre budget part de vos comptes.
            </p>
          </article>
          <article>
            <SlidersHorizontal aria-hidden />
            <h3>Donnez une place à chaque dépense.</h3>
            <p>
              Créez vos enveloppes, précisez vos budgets et affinez avec des
              sous-enveloppes quand vous en avez besoin.
            </p>
          </article>
          <article>
            <Sparkles aria-hidden />
            <h3>Regardez les mois à venir.</h3>
            <p>
              Comparez les budgets et les soldes. Repérez un mois plus serré
              avant qu’il arrive et ajustez vos choix.
            </p>
          </article>
        </div>
        <div className={styles.bankNote}>
          <span>Vos comptes restent chez votre banque.</span>
          <p>Plia consulte vos opérations. Il ne déplace pas votre argent.</p>
          <Link2 aria-hidden />
        </div>
      </section>
      <section
        id="offre"
        className={styles.offer}
        aria-labelledby="offer-heading"
      >
        <svg
          className={styles.offerCurve}
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 65C310-50 585 110 915 38S1250 35 1440 0V100H0Z" />
        </svg>
        <div className={styles.offerInner}>
          <div className={styles.offerCopy}>
            <h2 id="offer-heading">
              Une vue complète.
              <br />
              <span>Une seule offre.</span>
            </h2>
            <p>
              Pour celles et ceux qui veulent donner à leur budget autant
              d’attention qu’à leurs projets.
            </p>
            <ul>
              {[
                "Connexion bancaire et suivi des opérations",
                "Enveloppes et sous-enveloppes personnalisées",
                "Comparaison des mois et prévisions de solde",
                "Détail des montants et suivi des dépassements",
              ].map((text) => (
                <li key={text}>
                  <Check aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.price}>
            <h3>Plia</h3>
            <p className={styles.priceAmount}>
              29 <span>€ / mois</span>
            </p>
            <p className={styles.priceDescription}>
              Votre budget, avec une vue d’avance.
            </p>
            <Link href="/connexion" className={styles.primary}>
              Découvrir Plia <ArrowUpRight aria-hidden />
            </Link>
            <p className={styles.priceNote}>
              Tarif envisagé. L’offre commerciale est en cours de finalisation.
            </p>
          </div>
        </div>
      </section>
      <LandingFaq />
      <section className={styles.close} aria-labelledby="close-heading">
        <div>
          <h2 id="close-heading">
            La suite mérite
            <br />
            d’être plus claire.
          </h2>
          <p>Commencez par voir ce que vos prochains mois vous réservent.</p>
          <Link href="/connexion" className={styles.primary}>
            Commencer avec Plia <ArrowUpRight aria-hidden />
          </Link>
        </div>
        <div className={styles.closeImage}>
          <Image
            src="/landing/lumiere-hero-v1.png"
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, 42vw"
          />
        </div>
      </section>
      <footer className={styles.footer}>
        <Brand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <a href="#faq">
          Questions fréquentes <ArrowUpRight aria-hidden />
        </a>
      </footer>
    </main>
  );
}
