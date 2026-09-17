import Link from "next/link";
import { ArrowUpRight, Check, Landmark, PencilLine } from "lucide-react";
import { OFFERS } from "@/lib/prelaunch/offers";
import landing from "./landing.module.css";
import styles from "./prelaunch.module.css";

export function LandingOffers() {
  return (
    <section
      id="offre"
      className={styles.offers}
      aria-labelledby="offer-heading"
      data-full-bleed
    >
      <svg
        className={styles.curve}
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 65C310-50 585 110 915 38S1250 35 1440 0V100H0Z" />
      </svg>
      <div data-landing-container>
        <div className={styles.offerIntro}>
          <h2 id="offer-heading">
            Votre budget,
            <br />
            <span>à votre façon.</span>
          </h2>
          <div>
            <p>
              Planora prépare son ouverture. Choisissez votre formule et
              réservez votre accès gratuitement.
            </p>
            <p className={styles.reassurance}>
              Sans carte bancaire. Sans paiement aujourd’hui.
            </p>
          </div>
        </div>
        <div className={styles.offerChoices}>
          {(["manual", "connected"] as const).map((id) => {
            const offer = OFFERS[id];
            const Icon = id === "manual" ? PencilLine : Landmark;
            return (
              <article className={styles.offerChoice} key={id}>
                <h3>
                  <Icon aria-hidden />
                  {offer.name}
                </h3>
                <p className={styles.offerDescription}>{offer.description}</p>
                <p className={styles.amount}>
                  {offer.price}
                  <span>€ / mois</span>
                </p>
                <p className={styles.terms}>
                  {id === "connected" ? (
                    <>
                      Pendant les 12 premiers mois d’abonnement,
                      <br />
                      <strong>puis 29 € / mois.</strong>
                    </>
                  ) : (
                    <>
                      Le suivi de votre budget,
                      <br />
                      <strong>avec saisie manuelle des opérations.</strong>
                    </>
                  )}
                </p>
                <Link
                  href={`/reservation?offre=${id}`}
                  className={landing.primary}
                  aria-label={`Réserver mon accès ${offer.name.toLowerCase()}`}
                >
                  Réserver mon accès <ArrowUpRight aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
        <div className={styles.included}>
          <h3>Dans les deux formules</h3>
          <ul>
            <li>
              <Check aria-hidden />
              Budgets et sous-budgets
            </li>
            <li>
              <Check aria-hidden />
              Comparaison des mois
            </li>
            <li>
              <Check aria-hidden />
              Prévisions de solde
            </li>
          </ul>
        </div>
        <p className={styles.offerFootnote}>
          La réservation ne déclenche aucun abonnement. Le tarif de lancement
          commence à l’activation de l’abonnement. Nous vous préviendrons de
          l’ouverture par e-mail.
        </p>
      </div>
    </section>
  );
}
