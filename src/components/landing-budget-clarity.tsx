import { ArrowDown, ArrowRight } from "lucide-react";
import styles from "./landing-budget-clarity.module.css";
import landing from "./landing.module.css";

const everydayDoubts = [
  {
    title: "Budgétisez votre argent.",
    problem:
      "Choisissez combien consacrer à vos dépenses du quotidien, vos activités et vos projets. À chaque priorité, son budget.",
    relief: "Vous décidez comment répartir votre argent.",
  },
  {
    title: "Les petits montants s’accumulent.",
    problem:
      "Un achat ici, une sortie là. Et il faut encore refaire les comptes pour savoir où vous en êtes.",
    relief: "Retrouvez ce qu’il reste dans chaque budget.",
  },
  {
    title: "Tout n’arrive pas ce mois-ci.",
    problem:
      "Une dépense annuelle, un paiement prévu plus tard… Ce mois paraît tranquille, le suivant un peu moins.",
    relief: "Visualisez les mois à venir et ajustez à temps.",
  },
];

export function LandingBudgetClarity() {
  return (
    <section
      id="esprit-libre"
      className={`${styles.section} ${landing.greenSection}`}
      aria-labelledby="clarity-heading"
      data-full-bleed
    >
      <div data-landing-container>
        <div className={styles.intro}>
          <h2 id="clarity-heading" className={styles.heading}>
            Votre budget au clair.
            <span>Le doute en moins.</span>
          </h2>
          <p className={styles.description}>
            Entre ce qui est déjà dépensé et ce qu’il faut garder pour la suite,
            difficile de savoir ce qu’on peut se permettre. Planora remet tout à
            plat, pour décider l’esprit plus libre.
          </p>
        </div>

        <div className={styles.grid}>
          {everydayDoubts.map(({ title, problem, relief }) => (
            <article className={styles.card} key={title}>
              <h3>{title}</h3>
              <p className={styles.problem}>{problem}</p>
              <p className={styles.relief}>
                <ArrowRight aria-hidden="true" />
                <span>{relief}</span>
              </p>
            </article>
          ))}
        </div>

        <div className={styles.footer}>
          <a href="#demonstration" className={styles.link}>
            Voir mon budget en clair
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
