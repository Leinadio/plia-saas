"use client";
import type { AccountForecast } from "@/lib/forecast";
import {
  type MonthCell, type HistorySection, type SoldeColumn, type PlannedSoldes,
  type Overspend, type IgnoredBlock,
  splitExpenseSection, computeTableEstimate, uncatOverspend, groupsWithPending,
} from "@/lib/history";
import { sectionsAtMonth, sectionSlots } from "@/lib/history-month-view";
import { soldesDuMois } from "@/lib/history-summary";
import { COL_INFO, COL_LABEL, monthType, type ColKey } from "@/lib/history-columns";
import { makeInfo } from "@/lib/history-explain";
import { useDetailSidebar } from "@/components/detail-sidebar";
import type { SelectGroup } from "@/components/history-grid";
import { PosteSimple } from "@/components/history-simple-poste";
import { Montant, fmt, soldeColor } from "@/components/history-simple-montant";
import { cn } from "@/lib/utils";

// Les quatre phrases du bloc de tête, selon la position du mois. C'est tout le
// pari de cette vue : un intitulé de colonne demande d'être appris, une phrase
// se lit. Le tableau garde les siens, ils y ont leur place.
const PHRASES: Record<"past" | "current" | "future", Record<CleSolde, string>> = {
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

type CleSolde = "depart" | "reel" | "prevu" | "siDepassement";

// À quelle colonne du tableau correspond chaque phrase : c'est elle qui porte
// l'explication déjà écrite (COL_INFO), qu'on ne réécrit pas ici.
const COLONNE: Record<CleSolde, ColKey> = {
  depart: "soldeReel",
  reel: "soldeReel",
  prevu: "soldePrevu",
  siDepassement: "soldeDepass",
};

// Les deux blocs de dépenses, mêmes titres que dans le tableau : c'est la même
// chose qu'on nomme, elle doit se reconnaître d'une vue à l'autre.
const TITRE_BLOC = { planned: "Dépenses prévues", unplanned: "Dépenses non prévues" } as const;

// Un titre de section, avec ses deux totaux à droite.
function TitreSection({ titre, children }: { titre: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 pt-1 pb-2">
      <h2 className="font-display text-lg">{titre}</h2>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">{children}</div>
    </div>
  );
}

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
  // Les lignes ramenées à ce mois : un poste qui ne vit pas ce mois-là n'a rien
  // à faire à l'écran (même découpe que le tableau).
  const secs = sectionsAtMonth(props.sections, 0, mois);
  // Les groupes dont un dépassement attend encore une décision : ils portent
  // l'étiquette même repliés.
  // La clé est « groupe::mois », comme dans le tableau : la même fonction sert
  // les deux vues, donc la même forme de clé.
  const enDepassement = groupsWithPending(props.overspendsByMonth ?? {});

  const ligneSolde = (cle: CleSolde, valeur: number | null) => {
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

  // Une section de rentrées : ses postes, puis son total.
  const rendreRentrees = (sec: HistorySection) => {
    const t = sec.totals[0];
    return (
      <section key="income" className="rounded-lg border">
        <TitreSection titre="Ce qui rentre">
          <Montant mot="attendu" valeur={t.budgeted} col="budgetRem" />
          <Montant mot="reçu" valeur={t.recu} col="recu" />
        </TitreSection>
        <div className="divide-y">
          {sec.rows.map((r) => (
            <PosteSimple key={r.id} row={r} groupes={props.groups} signaleDepassement={false} />
          ))}
        </div>
      </section>
    );
  };

  // La section des dépenses : deux blocs, chacun avec son sous-total, puis le
  // total de la section — c'est elle qui totalise, les blocs ne sont qu'une
  // façon de la lire (même règle que dans le tableau).
  const rendreDepenses = (sec: HistorySection) => {
    const blocs = splitExpenseSection(sec, props.months.length);
    const t = sec.totals[0];
    return (
      <section key="expense" className="rounded-lg border">
        <TitreSection titre="Ce qui sort">
          <Montant mot="prévu" valeur={t.budgeted} col="budgetDep" discret />
          <Montant mot="sorti" valeur={t.depense} col="dep" />
          <Montant
            mot={t.balance < -0.005 ? "il manque" : "il reste"}
            valeur={t.balance}
            col="reste"
            teinte={t.balance < -0.005 ? "text-red-600" : "text-green-600"}
          />
        </TitreSection>
        {(["planned", "unplanned"] as const).map((cle) => {
          const bloc = cle === "planned" ? blocs.prevues : blocs.nonPrevues;
          const bt = bloc.totals[0];
          return (
            <div key={cle} className="border-t">
              <div className="text-muted-foreground flex items-baseline justify-between gap-4 px-3 py-1.5 text-xs">
                <span>{TITRE_BLOC[cle]}</span>
                <span className="font-mono tabular-nums">{fmt(bt.budgeted)}&nbsp;€</span>
              </div>
              <div className="divide-y border-t">
                {bloc.rows.map((r) => (
                  <PosteSimple
                    key={r.id}
                    row={r}
                    groupes={props.groups}
                    signaleDepassement={enDepassement.has(`${r.id}::${mois}`)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  // Les non catégorisés : ce qui n'a pas encore été rangé, dans le sens qui lui
  // revient — ce qui entre avec les rentrées, ce qui sort avec les dépenses.
  const rendreNonCategorises = (sec: HistorySection) => {
    const entrant = (sec.uncatDirection ?? "out") === "in";
    const t = sec.totals[0];
    return (
      <section key={`uncat-${sec.uncatDirection ?? "out"}`} className="rounded-lg border">
        <TitreSection titre="Pas encore rangé">
          {entrant ? (
            <Montant mot="reçu" valeur={t.recu} col="recu" />
          ) : (
            <>
              <Montant mot="provision" valeur={t.budgeted} col="budgetDep" discret />
              <Montant mot="dépensé" valeur={t.depense} col="dep" />
              <Montant
                mot={t.balance < -0.005 ? "il manque" : "il reste"}
                valeur={t.balance}
                col="reste"
                teinte={t.balance < -0.005 ? "text-red-600" : "text-green-600"}
              />
            </>
          )}
        </TitreSection>
      </section>
    );
  };

  // Estimé de fin de mois, aligné sur le tableau : le Total, plus les
  // rémunérations restant à recevoir, moins les budgets encore ouverts (supposés
  // dépensés d'ici la fin du mois).
  const estime =
    computeTableEstimate(props.sections, props.months, props.currentMonth, props.forecast.balance)?.value
    ?? props.forecast.currentEstimate;
  const g = props.grand[0];
  const depassementTotal = props.overspend[0] + uncatOverspend(secs, 0);

  const ligneTotal = (mot: string, valeur: number, col: ColKey, teinte?: string) => (
    <button
      type="button"
      onClick={() => setDetail(makeInfo(COL_LABEL[col], COL_INFO[col]))}
      className="hover:bg-muted/60 flex w-full items-baseline justify-between gap-4 rounded-md px-3 py-1.5 text-left transition-colors"
    >
      <span className="text-muted-foreground text-sm">{mot}</span>
      <span className={cn("font-mono text-sm tabular-nums", teinte)}>{fmt(valeur)}&nbsp;€</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="bg-muted/30 flex flex-col rounded-lg p-1">
        {ligneSolde("depart", soldes.depart)}
        {ligneSolde("reel", soldes.reel)}
        {ligneSolde("prevu", soldes.prevu)}
        {ligneSolde("siDepassement", soldes.siDepassement)}
      </section>

      {sectionSlots(secs).map((slot) => {
        // Un emplacement vide n'a que son bouton de création, qui arrive à la
        // tâche 7 : ni total ni balance, il n'y a rien à totaliser.
        if (slot.kind === "empty") return null;
        const sec = slot.section;
        if (sec.kind === "income") return rendreRentrees(sec);
        if (sec.kind === "expense") return rendreDepenses(sec);
        return rendreNonCategorises(sec);
      })}

      <section className="bg-muted/30 flex flex-col rounded-lg p-1">
        {ligneTotal("Le mois, au total", g.balance, "reste", soldeColor(g.balance))}
        {ligneTotal("Estimé de fin de mois", estime, "soldeReel", soldeColor(estime))}
        {depassementTotal > 0.005 &&
          ligneTotal("Dépassé hors budget", depassementTotal, "reste", "text-red-600")}
      </section>

      {/* Le dépliage d'un poste et ses actions arrivent à la tâche 6, les
          créations à la tâche 7, les non comptabilisées à la tâche 8. */}
    </div>
  );
}
