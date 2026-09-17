import {
  ArrowRight,
  Check,
  Search,
  Clapperboard,
  SlidersHorizontal,
} from "lucide-react";
import styles from "./landing-feature-illustration.module.css";

export type IllustratedFeature = "transactions" | "automatisation";

export function FeatureIllustration({
  scene,
  active,
}: {
  scene: IllustratedFeature;
  active: boolean;
}) {
  return (
    <div
      className={styles.scene}
      data-feature-illustration={scene}
      data-active={active}
      role="img"
      aria-label={
        scene === "transactions"
          ? "Recherche d’une dépense Cinéma de 24,00 €, puis rattachement au budget Sorties et loisirs."
          : "Une règle reconnaît Cinéma entre 10 et 50 € et rattache deux opérations au budget Sorties et loisirs après vérification."
      }
    >
      {scene === "transactions" ? <Transactions /> : <Automation />}
    </div>
  );
}

function Transactions() {
  return (
    <div className={styles.ledger} aria-hidden="true">
      <div className={styles.search}>
        <Search />
        <span>Cinéma</span>
        <SlidersHorizontal />
      </div>
      <div className={styles.transaction}>
        <span className={styles.merchant}>
          <Clapperboard />
        </span>
        <div className={styles.transactionName}>
          <strong>CINÉMA</strong>
          <span>19 septembre</span>
        </div>
        <strong className={styles.amount}>−24,00 €</strong>
      </div>
      <div className={styles.assignment}>
        <span>Budget associé</span>
        <span className={styles.budgetTag}>
          <Check /> Sorties et loisirs
        </span>
      </div>
      <div className={styles.otherTransaction}>
        <span>Librairie</span>
        <span>−18,50 €</span>
      </div>
    </div>
  );
}

function Automation() {
  return (
    <div className={styles.automation} aria-hidden="true">
      <div className={styles.rule}>
        <SlidersHorizontal />
        <strong>Cinéma</strong>
        <span>10 à 50 €</span>
      </div>
      <div className={styles.flow}>
        <div className={styles.operations}>
          <div className={styles.operation}>
            <span>Cinéma Lumière</span>
            <strong>24,00 €</strong>
          </div>
          <div className={styles.operation}>
            <span>Cinéma Palace</span>
            <strong>36,00 €</strong>
          </div>
        </div>
        <div className={styles.connection}>
          <span />
          <ArrowRight />
        </div>
        <div className={styles.destination}>
          <Clapperboard />
          <strong>Sorties et loisirs</strong>
          <span>
            <Check /> 2 opérations
          </span>
        </div>
      </div>
      <div className={styles.confirmation}>
        <Check />
        <span>Correspondances vérifiées</span>
      </div>
    </div>
  );
}
