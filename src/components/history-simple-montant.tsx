"use client";
import { COL_INFO, COL_LABEL, type ColKey } from "@/lib/history-columns";
import { makeInfo } from "@/lib/history-explain";
import { useDetailSidebar } from "@/components/detail-sidebar";
import { cn } from "@/lib/utils";

// Recopiés de history-grid.tsx, qui n'est pas modifié par ce travail : les deux
// vues doivent écrire les montants de la même façon, au centime et à l'espace
// près, sinon les comparer devient impossible.
const NUM = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmt = (n: number) => NUM.format(Math.abs(n) < 0.005 ? 0 : n).replace(/[  ]/g, " ");

export function soldeColor(v: number | null | undefined): string | undefined {
  if (v == null) return undefined;
  return v < -0.005 ? "text-red-600" : undefined;
}

// Un montant de la vue simple : son mot, puis le chiffre. Le mot remplace
// l'intitulé de colonne du tableau — c'est le fond de cette vue, où l'on ne peut
// plus s'appuyer sur une en-tête restée en haut de l'écran.
//
// Cliquer ouvre l'explication de la colonne dans le panneau de droite. Le détail
// chiffré de la case viendra le remplacer plus tard ; l'explication est déjà
// écrite (COL_INFO) et vaut mieux que rien en attendant.
export function Montant({ mot, valeur, col, discret, teinte, etiquette }: {
  mot: string;
  valeur: number;
  col: ColKey;
  // Le budget est un repère, pas un résultat : il s'efface derrière les deux
  // chiffres qu'on vient lire.
  discret?: boolean;
  teinte?: string;
  etiquette?: string;
}) {
  const { setDetail } = useDetailSidebar();
  return (
    <button
      type="button"
      onClick={() => setDetail(makeInfo(COL_LABEL[col], COL_INFO[col]))}
      className="hover:bg-muted/60 -mx-1 flex flex-col items-end rounded px-1 transition-colors"
    >
      <span className="flex items-baseline gap-1.5">
        <span className={cn("text-[11px]", discret ? "text-muted-foreground/60" : "text-muted-foreground")}>
          {mot}
        </span>
        <span className={cn("font-mono text-sm tabular-nums", discret && "text-muted-foreground", teinte)}>
          {fmt(valeur)}&nbsp;€
        </span>
      </span>
      {/* Un simple constat : la dépense a dépassé le budget de ce mois-là. En
          bloc sous le montant plutôt qu'à côté, pour ne pas élargir la ligne. */}
      {etiquette && (
        <span className="text-[9px] tracking-[0.1em] text-amber-700 uppercase dark:text-amber-500">
          {etiquette}
        </span>
      )}
    </button>
  );
}
