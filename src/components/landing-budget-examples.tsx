import { ArrowDown } from "lucide-react";
import styles from "./landing-budget-examples.module.css";

// Montants illustratifs, sans accès aux comptes ni simulation d’une saisie.
const examples = [
  {
    name: "Week-end à deux",
    context: "Un projet à préparer",
    planned: "300",
    spent: "120",
    remaining: "180",
  },
  {
    name: "Sport",
    context: "Une activité qui vous plaît",
    planned: "60",
    spent: "40",
    remaining: "20",
  },
  {
    name: "Courses",
    context: "Les dépenses du quotidien",
    planned: "350",
    spent: "216,30",
    remaining: "133,70",
  },
];

export function LandingBudgetExamples() {
  return (
    <section
      className={styles.section}
      aria-labelledby="budget-examples-heading"
    >
      <div className={styles.intro}>
        <h2 id="budget-examples-heading">
          Un budget pour chaque chose qui compte.
        </h2>
        <p>
          Un week-end à organiser, votre activité du mercredi, les courses du
          mois : vous choisissez combien y consacrer.
        </p>
        <p>
          Une fois vos dépenses ajoutées ou synchronisées puis rattachées au bon
          budget, Planora calcule ce qu’il vous reste pour chacun.
        </p>
        <a href="#demonstration">
          Voir le suivi dans Planora <ArrowDown aria-hidden="true" />
        </a>
      </div>
      <figure className={styles.example}>
        <figcaption>
          Trois budgets, trois choix à vous.
          <span>Exemple illustratif pour un mois</span>
        </figcaption>
        <ul className={styles.budgets}>
          {examples.map((budget) => (
            <li key={budget.name}>
              <div className={styles.budgetName}>
                <h3>{budget.name}</h3>
                <p>{budget.context}</p>
              </div>
              <dl>
                <div className={styles.planned}>
                  <dt>Vous prévoyez</dt>
                  <dd>
                    {budget.planned}
                    <span> €</span>
                  </dd>
                </div>
                <div>
                  <dt>Dépensé</dt>
                  <dd>
                    {budget.spent}
                    <span> €</span>
                  </dd>
                </div>
                <div className={styles.remaining}>
                  <dt>Il vous reste</dt>
                  <dd>
                    {budget.remaining}
                    <span> €</span>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Ces montants sont vos repères de dépenses. Créer un budget ne déplace
          pas votre argent.
        </p>
      </figure>
    </section>
  );
}
