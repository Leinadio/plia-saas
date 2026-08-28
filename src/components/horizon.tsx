import { planDeCharge } from "@/lib/plan-de-charge";
import { formatEur, formatEurCourt } from "@/lib/money";
import { cn } from "@/lib/utils";

export type MoisDHorizon = { key: string; label: string; solde: number };

// L'HORIZON. Où le solde atterrit à la fin de chacun des prochains mois.
//
// C'est la raison d'être du produit : regarder devant. Une colonne par mois,
// plantée sur la ligne du zéro ; un mois qui passe dessous plonge en rouge sous
// cette ligne, et on le voit avant d'avoir lu quoi que ce soit.
//
// Le mois en cours est en encre pleine, les mois à venir en encre claire : ce
// sont des projections, et rien ne doit laisser croire qu'ils sont acquis. La
// distinction se lit sans légende, ce qui est la condition pour s'en passer.
//
// Ce n'est pas une courbe de tendance et il n'y a rien à extrapoler : chaque
// montant est écrit en toutes lettres au-dessus de sa colonne. Retirez le dessin,
// les chiffres suffisent encore — c'est ce qui lui donne le droit d'être là.
//
// La géométrie (ligne du zéro, hauteurs relatives, mois rompus) vient d'une
// bibliothèque testée : le dessin ne calcule rien, il place.
export function Horizon({ mois, onboardingTarget }: { mois: MoisDHorizon[]; onboardingTarget?: string }) {
  const plan = planDeCharge(mois.map((m) => m.solde));
  if (plan.mats.length === 0) return null;

  return (
    <section
      aria-label="Horizon des prochains mois"
      className="carte overflow-hidden"
      data-onboarding-target={onboardingTarget}
    >
      <div className="border-filet flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b px-4 py-2.5 sm:px-5">
        <h2 className="titre-carte">Horizon</h2>
        <p className="text-muted-foreground text-[0.8125rem]">
          Le solde à la fin de chaque mois. Le mois en cours en plein, les projections en clair.
        </p>
      </div>

      <div className="px-3 pt-3 pb-2.5 sm:px-5">
        {/* LA ZONE DE DESSIN. Chaque montant est écrit JUSTE AU-DESSUS de sa
            colonne — au-dessus du bloc, aligné sur une seule ligne, il flottait à
            distance de ce qu'il mesurait et la carte se vidait par le milieu. */}
        {/* La gouttière du haut appartient au MONTANT, pas au dessin : la plus
            haute colonne touche le plafond de la zone, et son montant, écrit
            au-dessus d'elle, sortirait de la carte sans cette réserve. */}
        {/* La gouttière du haut appartient au MONTANT, pas au dessin : la plus
            haute colonne touche le plafond de la zone, et son montant, écrit
            au-dessus d'elle, sortirait de la carte sans cette réserve. La ligne du
            zéro, les colonnes et les montants vivent donc tous dans la MÊME boîte,
            posée sous la gouttière — un pourcentage n'a de sens que rapporté au
            même repère. */}
        <div className="pt-6 sm:pt-7">
          {/* CE DESSIN N'EST PAS LA SIGNATURE DE L'ÉCRAN. Il a mesuré 176 puis
              224 pixels de haut : avec son en-tête, la bande de relevés et les
              onglets, il ne restait plus rien du premier écran pour les
              enveloppes — or c'est le débord d'une enveloppe qu'on doit voir
              avant tout le reste. Il dit une trajectoire sur six mois, et une
              trajectoire se lit aussi bien en cent pixels. */}
          <div className="relative h-24 sm:h-32">
            {/* LA LIGNE DU ZÉRO. Tout est posé dessus, et ce qui passe dessous a
                rompu. */}
            <div
              className="bg-filet-fort absolute inset-x-0 h-px"
              style={{ top: `${plan.zero}%` }}
              aria-hidden
            />
            <span
              className="legende bg-card absolute left-0 -translate-y-1/2 pr-1.5 leading-none"
              style={{ top: `${plan.zero}%` }}
              aria-hidden
            >
              0
            </span>

            <div
              className="absolute inset-0 grid gap-1 sm:gap-3"
              style={{ gridTemplateColumns: `repeat(${plan.mats.length}, minmax(0, 1fr))` }}
            >
              {plan.mats.map((m, i) => {
                // La hauteur est un pourcentage de la moitié qui lui revient :
                // au-dessus du zéro pour ce qui porte, en dessous pour ce qui rompt.
                const haut = m.brise
                  ? (m.hauteur / 100) * (100 - plan.zero)
                  : (m.hauteur / 100) * plan.zero;
                const sommet = m.brise ? plan.zero + haut : plan.zero - haut;
                const courant = i === 0;
                return (
                  <div key={mois[i].key} className="relative h-full">
                    <div
                      aria-hidden
                      className={cn(
                        "absolute left-1/2 w-[min(2.5rem,72%)] -translate-x-1/2",
                        m.brise
                          ? "bg-tension rounded-b-md"
                          : courant
                            ? "bg-encre rounded-t-md"
                            : // Les projections : la même encre, diluée dans la
                              // carte. Pas une deuxième couleur — le même corps, vu
                              // à travers un voile.
                              "rounded-t-md bg-[color-mix(in_oklab,var(--encre)_32%,var(--card))]",
                      )}
                      style={{
                        top: m.brise ? `${plan.zero}%` : `${sommet}%`,
                        height: `${Math.max(haut, 0.6)}%`,
                      }}
                    />
                    {/* Le montant, collé au bout de sa colonne : au-dessus quand
                        elle monte, en dessous quand elle plonge. */}
                    <span
                      className={cn(
                        "montant absolute left-1/2 -translate-x-1/2 text-center text-[0.6875rem] whitespace-nowrap sm:text-[0.8125rem]",
                        m.brise ? "text-tension-encre" : "text-foreground",
                      )}
                      style={
                        m.brise
                          ? { top: `calc(${sommet}% + 6px)` }
                          : { bottom: `calc(${100 - sommet}% + 6px)` }
                      }
                    >
                      <span className="sm:hidden">{formatEurCourt(mois[i].solde)}</span>
                      <span className="hidden sm:inline">{formatEur(mois[i].solde)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Les noms de mois, sous la ligne du zéro et non collés aux colonnes : une
            colonne qui plonge passerait par-dessus son propre nom. */}
        <div
          className="border-filet mt-2 grid gap-1 border-t pt-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${plan.mats.length}, minmax(0, 1fr))` }}
        >
          {mois.map((m, i) => (
            <span
              key={m.key}
              className={cn(
                "truncate text-center text-[0.6875rem] font-semibold sm:text-xs",
                i === 0 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
