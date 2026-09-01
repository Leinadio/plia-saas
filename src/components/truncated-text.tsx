"use client";
import { useEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Affiche un texte tronqué avec « … ». Si (et seulement si) le texte est
// réellement coupé, un tooltip shadcn montre le texte entier après un court
// délai de survol. La largeur max se passe via className (ex: "max-w-[460px]").
//
// `lines` fixe le nombre de lignes avant l'ellipse. Deux lignes valent mieux pour un
// libellé bancaire, où l'essentiel arrive tard : « PAIEMENT PSC 0408 ISSOIRE… » ne dit
// rien, le marchand est plus loin. Les colonnes étroites gardent une seule ligne.
//
// `depliable` peut être coupé là où le clic appartient déjà à autre chose : dans le
// panneau de détail, cliquer une ligne désigne son montant dans le grand tableau, et
// un libellé qui avalerait ce clic pour se déplier volerait le seul geste de l'écran.
// Le survol y suffit — le texte entier est dans le tooltip.
//
// `cote` dit de quel côté la bulle sort. Au-dessus par défaut ; à gauche dans le
// panneau de détail, qui est collé au bord droit de l'écran : une bulle sortant
// vers le haut y couvrait la ligne du dessus, c'est-à-dire un autre montant du
// même calcul.
export function TruncatedText({ text, className, lines = 1, depliable = true, cote = "top" }: {
  text: string;
  className?: string;
  lines?: 1 | 2;
  depliable?: boolean;
  cote?: "top" | "right" | "bottom" | "left";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  // Déplié par un clic. Le survol ne veut rien dire sur un écran tactile : sans ce
  // repli, un libellé coupé sur téléphone était définitivement illisible.
  const [deplie, setDeplie] = useState(false);

  // Les deux sens sont testés : sur une ligne le texte déborde en largeur, sur deux
  // il déborde en hauteur (line-clamp coupe verticalement). Mesuré replié seulement :
  // déplié, il ne déborde plus, et la mesure effacerait le moyen de le replier.
  useEffect(() => {
    const el = ref.current;
    if (el && !deplie) setTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
  }, [text, lines, deplie]);

  // `whitespace-normal` est indispensable sur deux lignes : les cellules du tableau
  // portent whitespace-nowrap (ui/table.tsx), hérité jusqu'ici. Sans lui le texte
  // reste sur une seule ligne, line-clamp n'a rien à couper, et la ligne déborde en
  // se faisant rogner par l'overflow — sans même l'ellipse. `break-words` rattrape le
  // cas d'un libellé d'un seul tenant, plus large que la colonne.
  const span = (
    <span
      ref={ref}
      // stopPropagation : ces libellés vivent dans des lignes de tableau cliquables
      // (replier un mois, ouvrir le détail d'une case). Lire un texte coupé ne doit
      // pas déclencher ce qui l'entoure.
      onClick={
        depliable && (truncated || deplie)
          ? (e) => {
              e.stopPropagation();
              setDeplie((v) => !v);
            }
          : undefined
      }
      className={cn(
        deplie
          ? "block break-words whitespace-normal"
          : lines === 2
            ? "line-clamp-2 break-words whitespace-normal"
            : "block truncate",
        depliable && (truncated || deplie) && "cursor-pointer",
        className,
      )}
    >
      {text}
    </span>
  );

  if (!truncated || deplie) return span;

  return (
    <Tooltip delayDuration={700}>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent side={cote} className="max-w-sm break-words">{text}</TooltipContent>
    </Tooltip>
  );
}
