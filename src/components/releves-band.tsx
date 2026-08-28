import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";

export type Releve = { label: string; valeur: number };

// LES RELEVÉS DU MOIS, en cartes.
//
// Cinq mesures, mais pas cinq boîtes égales : elles ne pèsent pas le même poids.
// La dernière — la projection — est la seule qui réponde à la question pour
// laquelle on ouvre l'app : « est-ce que je peux dépenser ? ». Elle prend donc sa
// propre carte, plus grande, et les quatre autres se rangent à côté d'elle en
// mesures d'appui. Cinq cases identiques auraient laissé au lecteur le soin de
// trouver laquelle compte ; c'est le travail du dessin, pas le sien.
//
// La couleur ne juge rien : elle dit le sens. Ce qui est négatif prend l'encre de
// tension, le reste reste en encre. Aucun montant n'est sarcelle — la sarcelle
// commande, elle ne mesure pas.
export function RelevesBand({ releves, onboardingTarget }: { releves: Releve[]; onboardingTarget?: string }) {
  if (releves.length === 0) return null;
  // La projection est la dernière du relevé (cf. lib/recap-compte). On la sort de
  // la liste plutôt que de la chercher par son nom : l'ordre est la seule chose
  // que ce composant a le droit de savoir de son contenu.
  const appuis = releves.slice(0, -1);
  const tete = releves[releves.length - 1];

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      {/* LA MESURE DE TÊTE. Le montant y monte à une taille qu'on lit de loin, et
          il porte sa phrase d'explication : c'est le seul chiffre de l'écran qui
          répond directement à une question. */}
      <section
        className={cn(
          "carte flex flex-col justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5",
          tete.valeur < 0 && "border-[color-mix(in_oklab,var(--tension)_35%,var(--filet))]",
        )}
        data-onboarding-target={onboardingTarget}
      >
        <div className="flex items-center gap-2">
          <span className="legende">{tete.label}</span>
          <span className={cn("pastille", tete.valeur < 0 ? "pastille-tension" : "pastille-portant")}>
            {tete.valeur < 0 ? "sous zéro" : "tient"}
          </span>
        </div>
        <p
          className={cn(
            "montant text-[1.75rem] leading-none sm:text-[2.25rem]",
            tete.valeur < 0 && "text-tension-encre",
          )}
        >
          {formatEur(tete.valeur)}
        </p>
        <p className="text-muted-foreground text-[0.8125rem] leading-snug">
          Ce qu&apos;il restera à la fin du mois si tout se passe comme prévu, dépassements
          déjà déduits.
        </p>
      </section>

      {/* Les mesures d'appui : deux par deux sur téléphone, quatre de front dès
          640 px. Elles se lisent en balayant, pas en s'arrêtant. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {appuis.map((r) => (
          <section key={r.label} className="carte flex min-w-0 flex-col justify-center gap-2 px-3 py-3 sm:px-4">
            <span className="legende truncate" title={r.label}>
              {r.label}
            </span>
            <span
              className={cn(
                "montant truncate text-base sm:text-lg",
                r.valeur < 0 && "text-tension-encre",
                r.valeur === 0 && "text-ardoise-claire",
              )}
            >
              {formatEur(r.valeur)}
            </span>
          </section>
        ))}
      </div>
    </div>
  );
}
