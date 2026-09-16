import { Plus } from "lucide-react";
import styles from "./landing.module.css";
const questions = [
  {
    question: "Est-ce que je paie en réservant ?",
    answer: "Non. La réservation est gratuite, sans carte bancaire et sans abonnement. Confirmez simplement votre adresse e-mail. Nous vous préviendrons de l’ouverture ; vous déciderez alors de vous abonner.",
  },
  {
    question: "Quelle différence entre les deux formules ?",
    answer: "À 9,90 € par mois, vous saisissez vos opérations manuellement. Avec la connexion bancaire, elles sont synchronisées via Enable Banking : 19,90 € par mois pendant les 12 premiers mois d’abonnement, puis 29 € par mois. Les deux formules prévoient les enveloppes, la comparaison des mois et les prévisions de solde.",
  },
  {
    question: "Quand commence le tarif de lancement ?",
    answer: "Les 12 mois à 19,90 € commencent à l’activation de votre abonnement avec connexion bancaire, pas au moment de la réservation. Au-delà, le tarif est de 29 € par mois. La date d’ouverture n’est pas encore annoncée.",
  },
  {
    question: "Est-ce fait pour mon budget ?",
    answer:
      "Planora s’adresse aux personnes qui pilotent le budget du foyer et veulent anticiper leurs dépenses : charges fixes, achats du quotidien ou projets à venir. Vous organisez les enveloppes selon votre vie.",
  },
  {
    question: "Quelle banque puis-je connecter ?",
    answer:
      "Vous choisissez votre établissement parmi les banques proposées par Enable Banking au moment de la connexion. Les établissements disponibles dépendent du pays et de la compatibilité bancaire.",
  },
  {
    question: "Planora peut-il déplacer mon argent ?",
    answer:
      "Non. Planora lit le solde et les opérations de vos comptes pour construire votre budget. Il ne réalise pas de virements. Créer une enveloppe organise votre budget ; cela ne déplace pas votre argent.",
  },
  {
    question: "D’où viennent les prévisions ?",
    answer:
      "Elles s’appuient sur les revenus et les budgets prévus, ainsi que sur les opérations déjà connues. Une prévision reste une estimation : elle évolue avec vos réglages et les nouvelles opérations.",
  },
  {
    question: "Les opérations arrivent-elles en temps réel ?",
    answer:
      "Les montants reflètent la dernière synchronisation bancaire. Une nouvelle autorisation auprès de votre banque peut être nécessaire pour continuer à récupérer les opérations.",
  },
  {
    question: "Dois-je tout classer à la main ?",
    answer:
      "Avec la formule connectée, vos opérations sont importées depuis votre banque. Avec la formule sans connexion, vous les saisissez manuellement. Vous pouvez corriger leur classement, les rattacher à une enveloppe ou à une sous-enveloppe, et ajouter un commentaire pour garder le contexte.",
  },
];
export function LandingFaq() {
  return (
    <section id="faq" className={styles.faq} aria-labelledby="faq-heading">
      <div className={styles.faqIntro}>
        <h2 id="faq-heading">
          Tout voir venir.
          <br />
          Même vos questions.
        </h2>
        <p>
          Quelques réponses avant de faire entrer Planora dans votre quotidien.
        </p>
      </div>
      <div className={styles.faqItems}>
        {questions.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <Plus aria-hidden />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
