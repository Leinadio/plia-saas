import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { LandingBankSync } from "./landing-bank-sync";
import { LandingOffers } from "@/components/landing-offers";
import { LandingHero } from "@/components/landing-hero";
import { LandingDemo } from "@/components/landing-demo";
import { LandingFaq } from "@/components/landing-faq";
import { LandingVideo } from "@/components/landing-video";
import { LandingUseCases } from "@/components/landing-use-cases";
import { LandingBudgetClarity } from "@/components/landing-budget-clarity";
import { LandingBrand, LandingHeader } from "@/components/landing-header";
import styles from "./landing.module.css";
import layout from "./landing-layout.module.css";
export function LandingContent() {
  return (
    <main
      className={`${styles.landing} ${layout.page} ${layout.sectionHeadings}`}
    >
      <LandingHeader />
      <LandingHero />
      <LandingVideo />
      <LandingBudgetClarity />
      <LandingUseCases />
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
            Moins de saisie au quotidien <ArrowDown aria-hidden />
          </a>
        </div>
      </section>
      <LandingBankSync />
      <LandingOffers />
      <LandingFaq />
      <section
        className={styles.close}
        aria-labelledby="close-heading"
        data-full-bleed
      >
        <div className={styles.closeContent} data-landing-container>
          <div className={styles.closeCopy}>
            <h2 id="close-heading">
              La suite mérite
              <br />
              d’être plus claire.
            </h2>
            <p>
              Choisissez votre formule. Nous vous préviendrons dès l’ouverture.
            </p>
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
        </div>
      </section>
      <footer className={styles.footer}>
        <LandingBrand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <Link href="/contact">
          Nous contacter <ArrowUpRight aria-hidden />
        </Link>
        <Link href="/securite">
          Sécurité des données <ArrowUpRight aria-hidden />
        </Link>
        <a href="#faq">
          Questions fréquentes <ArrowUpRight aria-hidden />
        </a>
      </footer>
    </main>
  );
}
