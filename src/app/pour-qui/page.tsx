import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { LandingBrand, LandingHeader } from "@/components/landing-header";
import landing from "@/components/landing.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "En solo ou à deux, un budget à votre image — Plia",
  description:
    "Un budget pensé pour les personnes seules et les couples. Organisez vos dépenses, voyez les mois à venir et faites de la place à vos projets avec Plia.",
};

export default function AudiencePage() {
  return (
    <main className={landing.landing}>
      <LandingHeader audience />
      <section className={styles.cover} aria-labelledby="audience-heading">
        <div className={styles.coverCopy}>
          <h1 id="audience-heading">
            La vie,
            <br />
            <span>à votre façon.</span>
          </h1>
          <p>
            Un budget pour les personnes seules et les couples. <br />
            Et de la place pour tout ce qui compte.
          </p>
          <Link href="/#demonstration" className={landing.primary}>
            Découvrir Plia <ArrowUpRight aria-hidden />
          </Link>
        </div>
        <div className={styles.portraits}>
          <a
            href="#en-solo"
            className={`${styles.portrait} ${styles.soloPortrait}`}
          >
            <Image
              src="/landing/audience-solo-v1.png"
              alt="Une femme profite d’un moment de lecture sur son balcon ensoleillé."
              fill
              sizes="(max-width: 700px) 50vw, 48vw"
              preload
            />
            <span className={styles.portraitLink}>
              <span>
                En solo<span>Vos envies, vos choix.</span>
              </span>
              <ArrowDown aria-hidden />
            </span>
          </a>
          <a
            href="#a-deux"
            className={`${styles.portrait} ${styles.couplePortrait}`}
          >
            <Image
              src="/landing/audience-couple-v1.png"
              alt="Un couple choisit une couleur pour aménager son nouvel appartement."
              fill
              sizes="(max-width: 700px) 50vw, 48vw"
              preload
            />
            <span className={styles.portraitLink}>
              <span>
                À deux<span>Une vie à construire.</span>
              </span>
              <ArrowDown aria-hidden />
            </span>
          </a>
        </div>
        <p className={styles.coverFoot}>
          Les envies changent. Le besoin d’y voir clair reste.
        </p>
      </section>

      <section
        id="en-solo"
        className={styles.solo}
        aria-labelledby="solo-heading"
      >
        <div className={styles.story}>
          <h2 id="solo-heading">
            En solo.
            <br />
            <span>Faites-vous une place.</span>
          </h2>
          <p>
            Les charges d’abord. Vos envies aussi. <br />
            Voyez ce qu’il reste avant de décider de la suite.
          </p>
          <ul className={styles.benefits}>
            <li>
              <Check aria-hidden />
              <span>
                <strong>Chaque dépense trouve sa place.</strong> Des enveloppes
                pour le quotidien et les projets.
              </span>
            </li>
            <li>
              <Check aria-hidden />
              <span>
                <strong>Les écarts s’expliquent.</strong> Retrouvez les
                opérations derrière chaque montant.
              </span>
            </li>
            <li>
              <Check aria-hidden />
              <span>
                <strong>Vous regardez devant.</strong> Vos prochains mois se
                lisent dans la même vue.
              </span>
            </li>
          </ul>
          <Link href="/connexion" className={landing.textLink}>
            Préparer mon budget <ArrowUpRight aria-hidden />
          </Link>
        </div>
        <figure className={styles.soloProof}>
          <p>
            Un chiffre.
            <br />
            <span>Tout s’éclaire.</span>
          </p>
          <div className={styles.detailImage}>
            <Image
              src="/landing/plia-detail-mobile.png"
              alt="Dans Plia, l’enveloppe Courses détaille un budget de 350 euros, 216,30 euros dépensés et 133,70 euros restants."
              width={430}
              height={480}
              sizes="(max-width: 700px) 80vw, 330px"
            />
          </div>
          <figcaption>Écran Plia · données de démonstration</figcaption>
        </figure>
      </section>

      <section
        id="a-deux"
        className={styles.couple}
        aria-labelledby="couple-heading"
      >
        <svg
          className={styles.curve}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 55C320 110 520 0 840 28S1190 85 1440 20V80H0Z" />
        </svg>
        <div className={styles.coupleInner}>
          <div className={styles.story}>
            <h2 id="couple-heading">
              À deux.
              <br />
              <span>Voyez la suite ensemble.</span>
            </h2>
            <p>
              Un chez-vous. Un voyage. Un nouveau départ. <br />
              Des chiffres clairs pour parler de vos projets.
            </p>
            <ul className={styles.benefits}>
              <li>
                <Check aria-hidden />
                <span>
                  <strong>Le quotidien est prévu.</strong> Organisez les
                  dépenses du foyer que vous suivez.
                </span>
              </li>
              <li>
                <Check aria-hidden />
                <span>
                  <strong>Les projets deviennent concrets.</strong> Anticipez
                  leur place dans les prochains mois.
                </span>
              </li>
              <li>
                <Check aria-hidden />
                <span>
                  <strong>Les choix se discutent.</strong> Appuyez-vous sur le
                  prévu, le dépensé et le restant.
                </span>
              </li>
            </ul>
            <Link href="/connexion" className={landing.textLink}>
              Préparer nos projets <ArrowUpRight aria-hidden />
            </Link>
            <p className={styles.note}>
              Un espace personnel pour piloter le budget. L’accès partagé entre
              conjoints n’est pas proposé aujourd’hui.
            </p>
          </div>
          <figure className={styles.coupleProof}>
            <p>
              Aujourd’hui.
              <br />
              Et <span>après ?</span>
            </p>
            <Image
              src="/landing/plia-soldes-mobile.png"
              alt="La vue Comparer de Plia présente les soldes de plusieurs mois et une estimation de fin de mois."
              width={398}
              height={294}
              sizes="(max-width: 700px) 88vw, 398px"
            />
            <figcaption>
              Écran Plia · données de démonstration
              <br />
              Les prévisions dépendent des informations de votre budget.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="start-heading">
        <h2 id="start-heading">
          Faites de la place
          <br />
          <span>à votre prochaine envie.</span>
        </h2>
        <p>Pour un petit plaisir. Pour un grand départ.</p>
        <div className={styles.actions}>
          <Link href="/connexion" className={landing.primary}>
            Commencer avec Plia <ArrowUpRight aria-hidden />
          </Link>
          <Link href="/#offre" className={landing.textLink}>
            Découvrir l’offre <ArrowUpRight aria-hidden />
          </Link>
        </div>
      </section>
      <footer className={landing.footer}>
        <LandingBrand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <Link href="/#faq">
          Questions fréquentes <ArrowUpRight aria-hidden />
        </Link>
      </footer>
    </main>
  );
}
