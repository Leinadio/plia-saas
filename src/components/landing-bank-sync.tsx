import {
  ArrowUpRight,
  Check,
  Clapperboard,
  Landmark,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  TrainFront,
  Wallet,
} from "lucide-react";
import { PlanoraMark } from "./planora-mark";
import Link from "next/link";
import landing from "./landing.module.css";
import styles from "./landing-bank-sync.module.css";

export function LandingBankSync() {
  return (
    <section
      id="fonctionnement"
      className={styles.section}
      aria-labelledby="sync-heading"
    >
      <div className={styles.content}>
        <h2 id="sync-heading">
          La synchronisation bancaire <span>simplifie votre quotidien.</span>
        </h2>
        <p className={styles.intro}>
          Vos revenus et vos dépenses rejoignent Planora grâce à la
          synchronisation bancaire. Vous passez moins de temps à les saisir,
          plus de temps à faire vos choix.
        </p>
        <div className={styles.benefits}>
          <div>
            <ListChecks aria-hidden />
            <p>
              <strong>Vos opérations, au même endroit.</strong>
              <span>
                Retrouvez les mouvements de votre compte dans votre relevé
                Planora.
              </span>
            </p>
          </div>
          <div>
            <ShieldCheck aria-hidden />
            <p>
              <strong>Vos données sont protégées.</strong>
              <span>
                L’accès à vos opérations est réservé à votre compte. Les données
                de chaque utilisateur sont séparées.
              </span>
            </p>
          </div>
        </div>
        <a href="#offre" className={`${landing.primary} ${styles.cta}`}>
          Découvrir la formule connectée <ArrowUpRight aria-hidden />
        </a>
      </div>
      <figure
        className={styles.visual}
        aria-label="Exemple de synchronisation : un salaire, une sortie au cinéma et un trajet apparaissent dans Planora."
      >
        <div className={styles.connection} aria-hidden="true">
          <div className={styles.endpoint}>
            <span className={styles.bankIcon}>
              <Landmark />
            </span>
            <span>Votre banque</span>
          </div>
          <div className={styles.bridge}>
            <span />
            <LockKeyhole />
            <span />
          </div>
          <div className={styles.endpoint}>
            <span className={styles.brandIcon}>
              <PlanoraMark />
            </span>
            <span>Planora</span>
          </div>
        </div>
        <p className={styles.securityNote}>
          <ShieldCheck aria-hidden /> Accès bancaire en lecture seule
        </p>
        <div className={styles.statement}>
          <div className={styles.statementHeader}>
            <span>Votre relevé Planora</span>
            <span className={styles.status}>
              <Check aria-hidden /> Synchronisé
            </span>
          </div>
          <p className={styles.statementTitle}>
            Votre quotidien,
            <br />
            <span>sans tout recopier.</span>
          </p>
          <ul className={styles.transactions}>
            <li>
              <span className={styles.rowIcon}>
                <Wallet aria-hidden />
              </span>
              <span>
                <strong>Salaire</strong>
                <small>Virement reçu</small>
              </span>
              <span className={styles.income}>+2 450,00 €</span>
            </li>
            <li>
              <span className={styles.rowIcon}>
                <Clapperboard aria-hidden />
              </span>
              <span>
                <strong>Cinéma</strong>
                <small>Paiement par carte</small>
              </span>
              <span>−24,00 €</span>
            </li>
            <li>
              <span className={styles.rowIcon}>
                <TrainFront aria-hidden />
              </span>
              <span>
                <strong>Transport</strong>
                <small>Paiement par carte</small>
              </span>
              <span>−48,60 €</span>
            </li>
          </ul>
          <div className={styles.statementFooter}>
            <Check aria-hidden />
            <span>3 opérations retrouvées dans Planora</span>
          </div>
        </div>
        <figcaption>Illustration · Données fictives</figcaption>
      </figure>
      <div className={styles.reassurance}>
        <ShieldCheck aria-hidden />
        <div>
          <h3>Votre autorisation. Vos données. Votre contrôle.</h3>
          <p>
            Vous autorisez la connexion auprès de votre banque. Planora consulte
            vos comptes et vos opérations.
          </p>
        </div>
        <div className={styles.provider}>
          <p>
            Planora n’effectue aucun virement. Votre argent reste chez votre
            banque.
          </p>
          <Link href="/securite" className={styles.securityLink}>
            Comment vos données sont protégées <ArrowUpRight aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
