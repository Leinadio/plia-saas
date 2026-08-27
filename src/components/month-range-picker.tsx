"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthRange } from "@/lib/history";
import { cn } from "@/lib/utils";

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const shortLabel = (m: string) => MONTHS_FR[Number(m.slice(5, 7)) - 1];
const yearOf = (m: string) => m.slice(0, 4);

// Une borne de la plage, dite en toutes lettres à côté de la frise. Déclarée au
// module et non dans le composant : une fonction de composant recréée à chaque
// rendu remonte son sous-arbre au lieu de le mettre à jour.
function Borne({ label, mois }: { label: string; mois: string }) {
  return (
    <div className="hidden shrink-0 flex-col gap-0.5 sm:flex">
      <span className="legende">{label}</span>
      <span className="text-sm font-semibold whitespace-nowrap capitalize">
        {shortLabel(mois)} {yearOf(mois)}
      </span>
    </div>
  );
}

// LA FRISE DES MOIS. Clic sur le premier mois, clic sur le dernier : c'est la
// plage que la pile affiche. Elle est écrite dans l'URL (?from&to), donc elle se
// partage et se retrouve au retour.
//
// Elle vit dans sa propre carte, à part de la pile qu'elle commande : c'est un
// réglage, pas une donnée. La plage est dite en toutes lettres au-dessus de la
// frise sur téléphone, et de part et d'autre dès qu'il y a la place.
export function MonthRangePicker({ min, max, from, to, current }: {
  min: string;
  max: string;
  from: string;
  to: string;
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const scroller = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<string | null>(null);

  const months = monthRange(min, max);
  // Milieu de la plage sélectionnée, centré à l'ouverture.
  const selected = monthRange(from, to);
  const mid = selected[Math.floor((selected.length - 1) / 2)];

  // Centre la sélection à l'ouverture.
  useEffect(() => {
    midRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [mid]);

  const onPick = (m: string) => {
    if (anchor === null) {
      setAnchor(m);
      return;
    }
    const lo = anchor <= m ? anchor : m;
    const hi = anchor <= m ? m : anchor;
    setAnchor(null);
    router.push(`${pathname}?from=${lo}&to=${hi}`);
  };

  const scrollBy = (dir: -1 | 1) => scroller.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <div className="carte flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
      {/* Sur téléphone, deux bornes en colonnes prendraient 250 des 390 pixels et il
          ne resterait qu'UN mois cliquable entre les flèches. La plage passe donc
          au-dessus, dite en une ligne, et la frise prend toute la largeur. */}
      <div className="flex items-baseline gap-1.5 sm:hidden">
        <span className="legende">de</span>
        <span className="text-sm font-semibold whitespace-nowrap capitalize">
          {shortLabel(from)} {yearOf(from)}
        </span>
        <span className="legende">à</span>
        <span className="text-sm font-semibold whitespace-nowrap capitalize">
          {shortLabel(to)} {yearOf(to)}
        </span>
        {anchor && <span className="pastille pastille-sarcelle ml-1">choisis le dernier mois</span>}
      </div>

      <Borne label="depuis" mois={from} />

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button
          type="button"
          aria-label="Défiler vers la gauche"
          onClick={() => scrollBy(-1)}
          className="text-ardoise hover:bg-survol hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Un fondu aux deux bords : sans lui, un mois coupé en plein milieu par le
            bord du défileur se lit comme un mot cassé (« in » pour « juin ») et non
            comme une frise qui continue. */}
        <div
          ref={scroller}
          className="min-w-0 flex-1 overflow-x-auto scroll-px-2 [mask-image:linear-gradient(to_right,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)]"
        >
          {/* mx-auto : centre la frise quand elle tient, défile sans rognage quand
              elle déborde. */}
          <div className="mx-auto flex w-fit gap-0.5 px-1 py-0.5">
            {months.map((m) => {
              const dedans = m >= from && m <= to;
              const debut = m === from;
              const fin = m === to;
              return (
                <button
                  key={m}
                  ref={m === mid ? midRef : undefined}
                  type="button"
                  onClick={() => onPick(m)}
                  className={cn(
                    // py-2.5 sur téléphone : un mois est une cible qu'on vise au
                    // doigt, pas au curseur.
                    "relative w-11 shrink-0 cursor-pointer rounded-md py-2.5 text-center text-xs font-semibold capitalize transition-colors sm:py-1.5",
                    dedans
                      ? "bg-sarcelle-voile text-sarcelle-encre"
                      : "text-ardoise hover:bg-survol hover:text-foreground",
                    // Les deux bouts de la plage se marquent plus fort : c'est eux
                    // qu'on déplace.
                    (debut || fin) && "bg-sarcelle text-white",
                    m === anchor && "ring-sarcelle ring-2",
                  )}
                >
                  {shortLabel(m)}
                  {/* Le mois courant se signale par un point sous son nom : un
                      repère, pas une sélection — il reste visible même hors de la
                      plage choisie. */}
                  {m === current && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                        debut || fin ? "bg-white" : "bg-sarcelle",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label="Défiler vers la droite"
          onClick={() => scrollBy(1)}
          className="text-ardoise hover:bg-survol hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <Borne label="jusqu'à" mois={to} />
    </div>
  );
}
