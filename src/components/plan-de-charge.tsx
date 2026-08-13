import { planDeCharge } from "@/lib/plan-de-charge";
import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";

export type MoisDeCharge = { key: string; label: string; solde: number };

// LE PLAN DE CHARGE. La pièce maîtresse de l'app, et la seule image qu'elle
// s'autorise. Un mât par mois, planté sur la ligne du zéro, dont la hauteur est
// le solde projeté à la fin de ce mois-là ; un câble pend d'un sommet à l'autre.
// Un mois qui passe sous zéro traverse le sol, en rouge : la structure a rompu
// là, et c'est l'information la plus importante de l'écran.
//
// Ce n'est pas une jauge et ce n'est pas une courbe de tendance : chaque montant
// projeté est écrit en toutes lettres au-dessus de son mât, et le dessin ne fait
// que donner à la colonne de chiffres sa forme. Retirez le dessin, les chiffres
// suffisent encore — c'est la condition pour qu'il ait le droit d'être là.
//
// Le câble pend d'une flèche proportionnelle à la portée (cf. lib) : c'est ce qui
// le distingue d'une polyligne. Un câble droit ne serait pas un câble, ce serait
// un graphique de tendance, et ce produit n'en veut pas.
export function PlanDeCharge({ mois }: { mois: MoisDeCharge[] }) {
  const plan = planDeCharge(mois.map((m) => m.solde));
  if (plan.mats.length === 0) return null;

  // Ordonnée d'un sommet, en pourcentage depuis le haut de la zone de dessin.
  const sommet = (i: number) => {
    const m = plan.mats[i];
    return m.brise
      ? plan.zero + (m.hauteur / 100) * (100 - plan.zero)
      : plan.zero - (m.hauteur / 100) * plan.zero;
  };

  // La chaînette. Le point de contrôle d'une quadratique se pose à DEUX fois la
  // flèche voulue : au milieu, la courbe ne descend qu'à la moitié de son point
  // de contrôle. C'est l'erreur qui rendait le câble presque droit.
  const cable = plan.mats
    .map((m, i) => {
      const y = sommet(i);
      if (i === 0) return `M ${m.x} ${y}`;
      const p = plan.mats[i - 1];
      const py = sommet(i - 1);
      return `Q ${(p.x + m.x) / 2} ${(py + y) / 2 + plan.fleche * 2} ${m.x} ${y}`;
    })
    .join(" ");

  return (
    <section aria-label="Plan de charge des prochains mois" className="plate px-3 py-4 sm:px-5 sm:py-5">
      {/* Sur un écran étroit, six mâts ne tiennent pas : la structure garde sa
          largeur minimale et se fait défiler, plutôt que d'écraser les montants
          en colonnes de deux lettres. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="min-w-[620px]">
          {/* Les annotations en tête, alignées sur leur mât, chacune terminée par
              la pastille ouverte du monde d'où tombe son fil de rappel. */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${plan.mats.length}, minmax(0, 1fr))` }}
          >
            {mois.map((m, i) => (
              <div key={m.key} className="flex flex-col items-center gap-1 text-center">
                <span className="caption">{m.label}</span>
                <span
                  className={cn(
                    "font-mono text-sm font-medium whitespace-nowrap",
                    plan.mats[i].brise && "text-tension-ink",
                  )}
                >
                  {formatEur(m.solde)}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "bg-card mt-0.5 size-[7px] rounded-full border",
                    plan.mats[i].brise ? "border-tension" : "border-rule-strong",
                  )}
                />
              </div>
            ))}
          </div>

          <div className="relative mt-2 h-44 sm:h-56">
            {/* LE SOL. Un trait plein d'un bout à l'autre : c'est la ligne du zéro,
                et tout le reste est posé dessus. */}
            <div
              className="bg-rule-strong absolute inset-x-0 h-px"
              style={{ top: `${plan.zero}%` }}
              aria-hidden
            />
            {/* Le sol est mesuré : il porte son nom aux deux bouts, comme une cote
                sur un plan. */}
            {["left-0", "right-0"].map((cote) => (
              <span
                key={cote}
                className={cn("chip absolute -translate-y-1/2", cote)}
                style={{ top: `${plan.zero}%` }}
                aria-hidden
              >
                zéro
              </span>
            ))}

            {/* Le câble, dessiné en coordonnées relatives : il s'étire avec la
                plaque, et son épaisseur ne bouge pas (vector-effect). */}
            <svg
              className="cable-tendu absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d={cable}
                fill="none"
                stroke="var(--tension)"
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {plan.mats.map((m, i) => {
              const y = sommet(i);
              return (
                <div key={mois[i].key} aria-hidden>
                  {/* Le fil de rappel : il tombe de l'annotation jusqu'au sommet
                      du mât, pour qu'aucun montant ne flotte au-dessus de rien. */}
                  <div
                    className="bg-border absolute w-px"
                    style={{ left: `${m.x}%`, top: 0, height: `${y}%` }}
                  />
                  {/* Le mât. Debout, il monte du sol à son sommet. Rompu, il
                      TRAVERSE le sol : il dépasse au-dessus autant qu'il plonge
                      en dessous, comme un poteau qui a percé sa semelle. */}
                  <div
                    className={cn(
                      "mat absolute w-[3px] -translate-x-1/2",
                      m.brise ? "bg-tension origin-top" : "bg-carbon origin-bottom dark:bg-[#d8d5d0]",
                    )}
                    style={{
                      left: `${m.x}%`,
                      top: m.brise ? `calc(${plan.zero}% - 10px)` : `${y}%`,
                      height: m.brise
                        ? `calc(${Math.abs(y - plan.zero)}% + 10px)`
                        : `${Math.abs(y - plan.zero)}%`,
                      animationDelay: `${i * 70}ms`,
                    }}
                  />
                  {/* LA MARQUE DE RUPTURE. Le sol est interrompu là où le mât l'a
                      percé, et deux traits obliques disent la cassure. C'est la
                      seule chose de cet écran qu'on doit voir avant tout le
                      reste. */}
                  {m.brise && (
                    <span
                      className="rupture absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${m.x}%`, top: `${plan.zero}%` }}
                    />
                  )}
                  {/* Le nœud : là où le câble prend appui. */}
                  <div
                    className={cn(
                      "noeud absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      m.brise
                        ? "bg-tension ring-2 ring-[var(--tension)]/30"
                        : "bg-carbon dark:bg-[#d8d5d0]",
                    )}
                    style={{ left: `${m.x}%`, top: `${y}%`, animationDelay: `${i * 70 + 120}ms` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
