"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthRange } from "@/lib/history";
import { cn } from "@/lib/utils";

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const shortLabel = (m: string) => MONTHS_FR[Number(m.slice(5, 7)) - 1];
const yearOf = (m: string) => m.slice(0, 4);

// Les deux champs reprennent le langage d'un choix de voyage : le départ se remplit
// au premier clic, la fin au second. Ils restent visibles sur toutes les largeurs.
function Borne({ label, mois, active = false }: { label: string; mois: string | null; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border px-3 py-2",
        active ? "border-sarcelle ring-sarcelle/20 ring-2" : "border-border bg-background",
      )}
    >
      <span className="legende">{label}</span>
      <span className={cn("truncate text-sm font-semibold whitespace-nowrap capitalize", !mois && "text-muted-foreground font-normal")}>
        {mois ? `${shortLabel(mois)} ${yearOf(mois)}` : "Choisir le mois de fin"}
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
export function MonthRangePicker({ min, max, from, to, current, pendingRange, onCommit, disabled = false }: {
  min: string;
  max: string;
  from: string;
  to: string;
  current: string;
  pendingRange?: { from: string; to: string } | null;
  onCommit?: (from: string, to: string) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const scroller = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [localPendingRange, setLocalPendingRange] = useState<{ from: string; to: string } | null>(null);

  const months = monthRange(min, max);
  const waitingRange = pendingRange ?? localPendingRange;
  const displayFrom = anchor ?? waitingRange?.from ?? from;
  const displayTo = anchor ? null : waitingRange?.to ?? to;
  // Milieu de la plage sélectionnée, centré à l'ouverture. Pendant le choix, le
  // nouveau départ prend sa place sans modifier la période réellement affichée.
  const selected = displayTo ? monthRange(displayFrom, displayTo) : [displayFrom];
  const mid = anchor ?? selected[Math.floor((selected.length - 1) / 2)];

  // Centre la sélection à l'ouverture.
  useEffect(() => {
    midRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [mid]);

  const onPick = (m: string) => {
    if (disabled) return;
    if (anchor === null) {
      setLocalPendingRange(null);
      setAnchor(m);
      return;
    }
    if (m < anchor) return;
    const nextRange = { from: anchor, to: m };
    setAnchor(null);
    if (onCommit) onCommit(nextRange.from, nextRange.to);
    else {
      setLocalPendingRange(nextRange);
      router.push(`${pathname}?from=${nextRange.from}&to=${nextRange.to}`);
    }
  };

  const scrollBy = (dir: -1 | 1) => scroller.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <div aria-busy={disabled || undefined} className={cn("carte flex flex-col gap-3 px-3 py-3 sm:px-4", disabled && "opacity-70")}>
      <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-2">
        <Borne label="Mois de départ" mois={displayFrom} active={anchor !== null} />
        <Borne label="Mois de fin" mois={displayTo} active={anchor !== null} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button
          type="button"
          aria-label="Défiler vers la gauche"
          onClick={() => scrollBy(-1)}
          disabled={disabled}
          className="text-ardoise hover:bg-survol hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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
              const indisponible = disabled || (anchor !== null && m < anchor);
              const dedans = displayTo ? m >= displayFrom && m <= displayTo : m === displayFrom;
              const debut = m === displayFrom;
              const fin = displayTo !== null && m === displayTo;
              return (
                <button
                  key={m}
                  ref={m === mid ? midRef : undefined}
                  type="button"
                  onClick={() => onPick(m)}
                  disabled={indisponible}
                  aria-pressed={dedans}
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
                    indisponible && "cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ardoise",
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
          disabled={disabled}
          className="text-ardoise hover:bg-survol hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
