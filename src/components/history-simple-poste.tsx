"use client";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { HistoryRow } from "@/lib/history";
import { groupPeriodLabel } from "@/lib/group-period-label";
import type { SelectGroup } from "@/components/history-grid";
import { Montant } from "@/components/history-simple-montant";

// Une ligne de poste dans la vue simple. Toute la différence avec le tableau
// tient ici : chaque montant porte son mot devant lui au lieu de dépendre d'un
// intitulé de colonne, qu'il faudrait avoir lu en haut de l'écran et retenu.
//
// Un seul mois est à l'écran, donc l'index de cellule est toujours 0.
export function PosteSimple({ row, groupes, signaleDepassement }: {
  row: HistoryRow;
  groupes: SelectGroup[];
  // Un groupe dont une ligne déborde porte l'étiquette même replié : sinon rien
  // ne le dirait (même règle que dans le tableau).
  signaleDepassement: boolean;
}) {
  const c = row.cells[0];
  const sg = groupes.find((g) => g.id === row.id);
  const duree = groupPeriodLabel(sg?.startMonth, sg?.endMonth);
  const entrant = row.direction === "in";

  return (
    <div className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-baseline gap-2">
        {entrant ? (
          <ArrowUpRight className="size-4 shrink-0 translate-y-0.5 text-sky-600" />
        ) : (
          <ArrowDownRight className="text-muted-foreground size-4 shrink-0 translate-y-0.5" />
        )}
        <span className="min-w-0 break-words">{row.name}</span>
        {/* La durée de vie, dite en clair. Sans elle, une dépense de vacances et
            une dépense de courses se ressemblent trait pour trait, et rien ne dit
            pourquoi l'une disparaît le mois suivant. */}
        <span className="text-muted-foreground/60 shrink-0 text-[10px] tracking-[0.1em] uppercase">
          {duree}
        </span>
      </div>
      <div className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1 pl-6 sm:pl-0">
        {entrant ? (
          <>
            <Montant mot="attendu" valeur={c.budgeted} col="budgetRem" />
            <Montant mot="reçu" valeur={c.recu} col="recu" />
          </>
        ) : (
          <>
            <Montant mot="budget" valeur={c.budgeted} col="budgetDep" discret />
            <Montant mot="dépensé" valeur={c.depense} col="dep" />
            <Montant
              mot={c.balance < -0.005 ? "il manque" : "il reste"}
              valeur={c.balance}
              col="reste"
              teinte={c.balance < -0.005 ? "text-red-600" : "text-green-600"}
              etiquette={signaleDepassement ? "dépassement" : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
