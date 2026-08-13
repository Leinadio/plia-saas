"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthRange } from "@/lib/history";
import { cn } from "@/lib/utils";

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const shortLabel = (m: string) => MONTHS_FR[Number(m.slice(5, 7)) - 1];
const yearOf = (m: string) => m.slice(0, 4);

// Bande de mois façon Actual Budget : clic début puis clic fin pour choisir la
// plage affichée. La plage est écrite dans l'URL (?from&to), lue par la page.
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
    // Les deux bornes encadrent la frise : la plage est dite en toutes lettres à
    // gauche et à droite, la frise n'est plus l'information mais l'outil qui la
    // règle. Les bornes sont des plaques à deux angles coupés, comme toute
    // commande du produit.
    <div className="flex items-center gap-3">
      <div className="plate plate-cut shrink-0 px-3 py-1.5">
        <span className="caption text-muted-foreground block">depuis</span>
        <span className="block font-mono text-[13px] whitespace-nowrap capitalize">
          {shortLabel(from)} {yearOf(from)}
        </span>
      </div>

      <button
        type="button"
        aria-label="Défiler vers la gauche"
        onClick={() => scrollBy(-1)}
        className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 cursor-pointer items-center justify-center"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div ref={scroller} className="min-w-0 flex-1 overflow-x-auto scroll-px-2">
        {/* mx-auto : centre la frise quand elle tient, défile sans rognage quand elle déborde. */}
        <div className="mx-auto flex w-fit gap-px px-1">
          {months.map((m) => {
            const selected = m >= from && m <= to;
            return (
              <button
                key={m}
                ref={m === mid ? midRef : undefined}
                type="button"
                onClick={() => onPick(m)}
                className={cn(
                  "w-10 cursor-pointer py-1.5 text-center text-[11px] capitalize transition-colors",
                  selected
                    ? "text-foreground bg-[color-mix(in_oklab,var(--foreground)_14%,var(--background))]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  // Le mois courant se signale par un filet de tension sous son
                  // nom : un repère, pas une sélection — il reste lisible même
                  // quand il est hors de la plage choisie.
                  m === current && "shadow-[inset_0_-2px_0_0_var(--tension)]",
                  m === anchor && "ring-primary ring-2",
                )}
              >
                {shortLabel(m)}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-label="Défiler vers la droite"
        onClick={() => scrollBy(1)}
        className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 cursor-pointer items-center justify-center"
      >
        <ChevronRight className="size-4" />
      </button>

      <div className="plate plate-cut shrink-0 px-3 py-1.5">
        <span className="caption text-muted-foreground block">jusqu&apos;à</span>
        <span className="block font-mono text-[13px] whitespace-nowrap capitalize">
          {shortLabel(to)} {yearOf(to)}
        </span>
      </div>
    </div>
  );
}
