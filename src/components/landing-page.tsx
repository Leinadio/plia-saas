import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Link2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { LandingOffers } from "@/components/landing-offers";
import { LandingHero } from "@/components/landing-hero";
import { LandingDemo } from "@/components/landing-demo";
import { LandingFaq } from "@/components/landing-faq";
import { LandingContact } from "@/components/landing-contact";
import { LandingVideo } from "@/components/landing-video";
import { LandingBudgetExamples } from "@/components/landing-budget-examples";
import { LandingBrand, LandingHeader } from "@/components/landing-header";
import styles from "./landing.module.css";
export function LandingContent() {
  return (
    <main className={styles.landing}>
      <LandingHeader />
      <LandingHero />
      <LandingVideo />
      <LandingBudgetExamples />
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
            <h3>Choisissez votre façon de suivre.</h3>
            <p>
              Saisissez vos opérations ou choisissez la connexion bancaire avec
              Enable Banking. Deux façons de construire votre budget.
            </p>
          </article>
          <article>
            <SlidersHorizontal aria-hidden />
            <h3>Donnez une place à chaque dépense.</h3>
            <p>
              Choisissez un montant pour chaque projet, activité ou dépense du
              quotidien. Ajoutez des sous-budgets si vous souhaitez affiner.
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
          <p>Planora consulte vos opérations. Il ne déplace pas votre argent.</p>
          <Link2 aria-hidden />
        </div>
      </section>
      <LandingOffers />
      <LandingFaq />
      <LandingContact />
      <section className={styles.close} aria-labelledby="close-heading">
        <div>
          <h2 id="close-heading">
            La suite mérite
            <br />
            d’être plus claire.
          </h2>
          <p>Choisissez votre formule. Nous vous préviendrons dès l’ouverture.</p>
          <Link href="#offre" className={styles.primary}>
            Réserver mon accès <ArrowUpRight aria-hidden />
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
        <LandingBrand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <a href="#contact">Nous contacter <ArrowUpRight aria-hidden /></a>
        <a href="#faq">
          Questions fréquentes <ArrowUpRight aria-hidden />
        </a>
      </footer>
    </main>
  );
}
