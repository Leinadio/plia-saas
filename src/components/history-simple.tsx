"use client";
import type { AccountForecast } from "@/lib/forecast";
import type { MonthCell, HistorySection, SoldeColumn, PlannedSoldes, Overspend, IgnoredBlock } from "@/lib/history";
import { soldesDuMois } from "@/lib/history-summary";
import { monthType } from "@/lib/history-columns";
import { COL_LABEL, COL_INFO, type ColKey } from "@/lib/history-columns";
import { makeInfo } from "@/lib/history-explain";
import { useDetailSidebar } from "@/components/detail-sidebar";
import type { SelectGroup } from "@/components/history-grid";
import { cn } from "@/lib/utils";

// Recopiés de history-grid.tsx, qui n'est pas modifié par ce travail : les deux
// vues doivent écrire les montants de la même façon, au centime et à l'espace
// près, sinon comparer l'une à l'autre devient impossible.
const NUM = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n: number) => NUM.format(Math.abs(n) < 0.005 ? 0 : n).replace(/[  ]/g, " ");
function soldeColor(v: number | null | undefined): string | undefined {
  if (v == null) return undefined;
  return v < -0.005 ? "text-red-600" : undefined;
}

// Les quatre phrases du bloc de tête, selon la position du mois. C'est tout le
// pari de cette vue : un intitulé de colonne demande d'être appris, une phrase
// se lit. Le tableau garde les siens, ils y ont leur place.
const PHRASES: Record<"past" | "current" | "future", Record<"depart" | "reel" | "prevu" | "siDepassement", string>> = {
  past: {
    depart: "Tu as commencé le mois avec",
    reel: "Tu as fini le mois avec",
    prevu: "Si tu avais tenu ton plan, tu aurais fini à",
    siDepassement: "Tes dépassements t'ont laissé à",
  },
  current: {
    depart: "Tu as commencé le mois avec",
    reel: "Sur ton compte aujourd'hui",
    prevu: "Si tu t'en tiens au plan, tu finiras le mois à",
    siDepassement: "Et si tu débordes comme avant, plutôt à",
  },
  future: {
    depart: "Tu commenceras le mois avec",
    reel: "En prolongeant l'estimé, tu aurais",
    prevu: "Si tu t'en tiens au plan, tu finiras le mois à",
    siDepassement: "",
  },
};

// À quelle colonne du tableau correspond chaque phrase : c'est elle qui porte
// l'explication déjà écrite (COL_INFO), qu'on ne réécrit pas ici.
const COLONNE: Record<"depart" | "reel" | "prevu" | "siDepassement", ColKey> = {
  depart: "soldeReel",
  reel: "soldeReel",
  prevu: "soldePrevu",
  siDepassement: "soldeDepass",
};

// La vue simple de l'Historique : un mois, de haut en bas, sans défilement
// latéral. Elle reçoit exactement les mêmes props que HistoryWithDetail — la
// page ne prépare pas deux jeux de données, elle choisit un composant.
export function HistorySimple(props: {
  months: string[];
  currentMonth: string;
  stripMin: string;
  stripMax: string;
  forecast: AccountForecast;
  sections: HistorySection[];
  ignoredBlocks?: IgnoredBlock[];
  overspend: number[];
  grand: MonthCell[];
  groups: SelectGroup[];
  solde: SoldeColumn;
  planned: PlannedSoldes;
  accountId: string;
  overspendsByMonth?: Record<string, Overspend[]>;
}) {
  const { setDetail } = useDetailSidebar();
  // Un seul mois à l'écran : l'index est toujours 0, et le dire une fois évite
  // de le redemander partout.
  const mois = props.months[0];
  const type = monthType(mois, props.currentMonth);
  const soldes = soldesDuMois(props.solde, props.planned, props.months, props.currentMonth, 0);

  const ligne = (cle: "depart" | "reel" | "prevu" | "siDepassement", valeur: number | null) => {
    // Une valeur absente fait disparaître sa ligne : afficher zéro se lirait
    // comme un solde nul, ce qui est faux.
    if (valeur == null) return null;
    const col = COLONNE[cle];
    return (
      <button
        key={cle}
        type="button"
        onClick={() => setDetail(makeInfo(COL_LABEL[col], COL_INFO[col]))}
        className="hover:bg-muted/60 flex w-full items-baseline justify-between gap-4 rounded-md px-3 py-2 text-left transition-colors"
      >
        <span className="text-muted-foreground text-sm">{PHRASES[type][cle]}</span>
        <span className={cn("font-mono text-base tabular-nums", soldeColor(valeur))}>
          {fmt(valeur)}&nbsp;€
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="bg-muted/30 flex flex-col rounded-lg p-1">
        {ligne("depart", soldes.depart)}
        {ligne("reel", soldes.reel)}
        {ligne("prevu", soldes.prevu)}
        {ligne("siDepassement", soldes.siDepassement)}
      </section>
      {/* Les sections, les postes et les totaux arrivent à la tâche 4 ; le
          dépliage et les actions aux tâches 6 et 7. */}
    </div>
  );
}
