import { CalendarRange, Check, Landmark, RefreshCw } from "lucide-react";
import { BankPicker } from "@/components/bank-picker";

const ETAPES = [
  {
    icon: Landmark,
    titre: "Autorisez la lecture",
    texte: "Vous validez la connexion directement auprès de votre banque.",
  },
  {
    icon: RefreshCw,
    titre: "Laissez Plia rassembler",
    texte: "La première synchronisation récupère vos opérations.",
  },
  {
    icon: CalendarRange,
    titre: "Regardez devant",
    texte: "Votre solde se projette sur les six prochains mois.",
  },
] as const;

export function FirstAccountOnboarding({ connexionTerminee = false }: { connexionTerminee?: boolean }) {
  return (
    <section aria-labelledby="premiers-pas-titre" className="carte mx-auto w-full max-w-5xl overflow-hidden">
      {connexionTerminee && (
        <div className="bandeau bandeau-attente m-4 sm:m-5" role="status">
          La banque est reliée, mais aucun compte n&apos;est encore disponible. Rouvrez la
          sélection et vérifiez que vous partagez au moins un compte.
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <h1
            id="premiers-pas-titre"
            className="max-w-xl text-3xl leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-4xl"
          >
            Vous avez vu comment Plia fonctionne.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-[60ch] text-sm leading-6 sm:text-base">
            Reliez une banque quand vous êtes prêt à retrouver cette vue avec vos chiffres.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <BankPicker label="Connecter ma banque" />
          </div>

          <p className="text-muted-foreground mt-5 flex max-w-lg items-start gap-2 text-xs leading-5">
            <Check className="text-portant mt-0.5 size-4 shrink-0" aria-hidden />
            Vous choisissez les comptes à partager depuis l&apos;espace sécurisé de votre banque.
          </p>
        </div>

        <div className="bg-creuse border-filet border-t px-6 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:border-l lg:px-10 lg:py-12">
          <ol aria-label="De la connexion à la projection" className="flex h-full flex-col justify-center">
            {ETAPES.map(({ icon: Icon, titre, texte }, index) => (
              <li
                key={titre}
                className="border-filet grid grid-cols-[2rem_1fr] gap-x-3 border-b py-5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="bg-encre text-[var(--surface)] flex size-8 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    <span className="sr-only">Étape {index + 1}. </span>
                    {titre}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-5">{texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
