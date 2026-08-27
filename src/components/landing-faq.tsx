import { Plus } from "lucide-react";

const questions = [
  {
    question: "À qui s’adresse Plia ?",
    answer:
      "Aux personnes et aux foyers qui veulent comprendre leurs dépenses, tenir leurs budgets et voir l’effet de leurs choix sur les prochains mois.",
  },
  {
    question: "Plia montre-t-il seulement des prévisions ?",
    answer:
      "Non. Plia réunit vos opérations passées, vos budgets actuels et une projection de votre solde pour vous donner une vue complète.",
  },
  {
    question: "Dois-je saisir toutes mes dépenses à la main ?",
    answer:
      "Non. Vos opérations arrivent depuis votre banque via Enable Banking. Vous intervenez seulement pour ajuster une catégorie ou préciser un budget.",
  },
  {
    question: "Les données sont-elles mises à jour en temps réel ?",
    answer:
      "Non. Plia affiche les données de votre dernière synchronisation bancaire. Une nouvelle autorisation peut être demandée environ tous les 90 jours.",
  },
  {
    question: "Quelle banque puis-je connecter ?",
    answer:
      "Plia permet de connecter vos comptes auprès de plus de 150 banques compatibles via l’agrégateur Open Banking Enable Banking.",
  },
  {
    question: "Plia peut-il déplacer mon argent ?",
    answer:
      "Non. Plia récupère votre solde et vos opérations pour vous aider à les lire. Il ne réalise aucun virement depuis votre compte.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="border-y border-filet bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.14em] text-ardoise-claire uppercase">
            FAQ
          </p>
          <h2 className="mx-auto mt-5 max-w-[15ch] text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            Avant de relier votre compte.
          </h2>
          <p className="mx-auto mt-5 max-w-[42ch] text-base leading-7 text-ardoise">
            Ce que Plia fait, ce qu&apos;il ne fait pas, puis ce qu&apos;il faut
            savoir avant de commencer.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl border-t border-filet">
          {questions.map((item) => (
            <details key={item.question} className="group border-b border-filet">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-semibold outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-surface [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-filet text-ardoise transition-[background-color,color,transform] group-open:rotate-45 group-open:bg-foreground group-open:text-background">
                  <Plus className="size-4" aria-hidden />
                </span>
              </summary>
              <p className="max-w-[66ch] pb-6 pr-14 text-sm leading-6 text-ardoise">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
