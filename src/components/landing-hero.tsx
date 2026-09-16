import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Link2 } from "lucide-react";
import { LandingHeroBackdrop } from "./landing-hero-backdrop";
import styles from "./landing.module.css";

export function LandingHero() {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <LandingHeroBackdrop />
      <div className={styles.heroCopy}>
        <h1 id="landing-title">
          L’outil pour gérer vos{" "}
          <span className={styles.heroAccent}>
            finances
            <svg
              viewBox="0 0 300 24"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M3 15C68 2 174 1 292 9C295 9 297 11 294 12C187 7 86 9 8 20C2 21 0 18 3 15Z" />
              <path
                d="M71 21C132 12 221 13 279 17C218 15 143 17 75 23Z"
                opacity=".4"
              />
            </svg>
          </span>{" "}
          sans vous compliquer{" "}
          <span className={styles.heroAccent}>
            la vie.
            <svg
              viewBox="0 0 300 24"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M3 7C83 18 191 18 294 3C299 2 301 5 296 7C196 25 88 24 6 12C1 11 0 8 3 7Z" />
            </svg>
          </span>
        </h1>
        <p>
          Vos revenus, vos dépenses, vos mois à venir. Planora réunit votre budget
          pour voir ce qu’il restera, avant de décider.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primary} href="#offre">
            Réserver mon accès <ArrowUpRight aria-hidden />
          </Link>
          <a className={styles.textLink} href="#demonstration">
            Voir Planora en action <ArrowDown aria-hidden />
          </a>
        </div>
        <p className={styles.connectionNote}>
          <Link2 aria-hidden /> Pré-lancement · Réservation gratuite, sans carte bancaire.
        </p>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.heroArt}>
          <Image
            src="/landing/lumiere-hero-v1.png"
            alt="La lumière traverse deux parois de verre courbe, vert et corail, dans un intérieur lumineux."
            fill
            sizes="(max-width: 700px) 100vw, 54vw"
            preload
            className={styles.artImage}
          />
        </div>
        <div className={styles.heroBalance}>
          <div className={styles.balanceTop}>
            <span>Voir plus loin.</span>
            <ArrowUpRight aria-hidden />
          </div>
          <p>Solde prévu en fin de mois</p>
          <dl>
            <div>
              <dt>Septembre</dt>
              <dd>
                3 502,90 <span>€</span>
              </dd>
            </div>
            <div>
              <dt>Octobre</dt>
              <dd>
                7 032,91 <span>€</span>
              </dd>
            </div>
            <div>
              <dt>Novembre</dt>
              <dd>
                8 762,92 <span>€</span>
              </dd>
            </div>
          </dl>
          <small>Exemple illustratif de budget</small>
        </div>
      </div>
    </section>
  );
}
