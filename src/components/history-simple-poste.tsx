"use client";
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";
import type { HistoryRow, HistorySubRow, HistoryTxn } from "@/lib/history";
import { groupPeriodLabel } from "@/lib/group-period-label";
import { budgetEditOfGroup, budgetEditOfLine } from "@/lib/history-detail";
import type { GroupManageInfo } from "@/lib/history-explain";
import { groupsForMonth } from "@/lib/group-options";
import type { SelectGroup } from "@/components/history-grid";
import { Montant } from "@/components/history-simple-montant";
import { BudgetEditBlock } from "@/components/history-blocks/budget-edit-block";
import { GroupManageBlock } from "@/components/history-blocks/group-manage-block";
import { GroupSelectField } from "@/components/group-select-field";
import { TxnCommentField } from "@/components/txn-comment-field";
import { IgnoreTxnToggle } from "@/components/ignore-txn-toggle";
import { TruncatedText } from "@/components/truncated-text";
import { cn } from "@/lib/utils";

// Une transaction dans le dépliage d'un poste. Mêmes actions que dans le tableau,
// et dans le même ordre : ranger ailleurs, commenter, sortir du calcul. La date
// reste en chasse fixe — c'est une donnée, elle s'aligne d'une ligne à l'autre.
function LigneTxn({ txn, groupes }: { txn: HistoryTxn; groupes: SelectGroup[] }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted-foreground/80 shrink-0 font-mono text-xs">{txn.date}</span>
        <span className={cn("shrink-0 font-mono text-sm tabular-nums", txn.amount < 0 && "text-tension-ink")}>
          {txn.amount.toFixed(2).replace(".", ",")}&nbsp;€
        </span>
      </div>
      <TruncatedText text={txn.label} className="text-sm leading-5" lines={2} />
      <TxnCommentField txnId={txn.id} comment={txn.comment} />
      <div className="flex min-w-0 items-center gap-1">
        {/* Seuls les groupes qui vivent le mois de CETTE transaction. */}
        <GroupSelectField
          txnId={txn.id}
          groups={groupsForMonth(groupes, txn.month, txn.groupId)}
          defaultGroupId={txn.groupId}
          defaultLineId={txn.lineId}
          className="min-w-0 flex-1"
        />
        <IgnoreTxnToggle txnId={txn.id} ignored={false} size="icon-sm" />
      </div>
    </div>
  );
}

// Un sous-poste dans le dépliage : son nom, sa durée, ses montants, son propre
// budget modifiable, puis ses transactions. Un sous-poste porte son montant daté
// exactement comme une enveloppe, d'où le même bloc d'édition.
function SousPoste({ sub, groupes, groupe, mois, currentMonth }: {
  sub: HistorySubRow;
  groupes: SelectGroup[];
  groupe?: SelectGroup;
  mois: string;
  currentMonth: string;
}) {
  const c = sub.cells[0];
  const sl = groupe?.lines.find((l) => l.id === sub.id);
  const edit = budgetEditOfLine(sl, mois, currentMonth);
  return (
    <div className="border-border/60 border-t pt-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 break-words text-sm">{sub.name}</span>
          <span className="text-muted-foreground/60 shrink-0 text-[10px] tracking-[0.1em] uppercase">
            {groupPeriodLabel(sl?.startMonth, sl?.endMonth)}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1">
          <Montant mot="budget" valeur={c.budgeted} col="budgetDep" discret />
          <Montant mot="dépensé" valeur={c.depense} col="dep" />
          <Montant
            mot={c.balance < -0.005 ? "il manque" : "il reste"}
            valeur={c.balance}
            col="reste"
            teinte={c.balance < -0.005 ? "text-tension-ink" : "text-foreground"}
          />
        </div>
      </div>
      {edit && <BudgetEditBlock info={edit} />}
      {sub.txns.length > 0 && (
        <div className="divide-border/60 mt-2 divide-y">
          {sub.txns.map((t) => (
            <LigneTxn key={t.id} txn={t} groupes={groupes} />
          ))}
        </div>
      )}
    </div>
  );
}

// Une ligne de poste dans la vue simple. Toute la différence avec le tableau
// tient ici : chaque montant porte son mot devant lui au lieu de dépendre d'un
// intitulé de colonne, qu'il faudrait avoir lu en haut de l'écran et retenu.
//
// Un seul mois est à l'écran, donc l'index de cellule est toujours 0.
//
// Le dépliage se fait SUR PLACE, et non dans le panneau de droite comme dans le
// tableau : c'est le reproche auquel cette vue répond — dans le tableau, rien
// n'annonce qu'un clic sur une case ouvre de quoi agir.
export function PosteSimple({ row, groupes, signaleDepassement, mois, currentMonth, stripMin, stripMax, ouvert, onToggle }: {
  row: HistoryRow;
  groupes: SelectGroup[];
  // Un groupe dont une ligne déborde porte l'étiquette même replié : sinon rien
  // ne le dirait (même règle que dans le tableau).
  signaleDepassement: boolean;
  mois: string;
  currentMonth: string;
  // Bornes de la frise du compte : ce qu'un calendrier de durée peut proposer.
  stripMin: string;
  stripMax: string;
  ouvert: boolean;
  onToggle: () => void;
}) {
  const c = row.cells[0];
  const sg = groupes.find((g) => g.id === row.id);
  const duree = groupPeriodLabel(sg?.startMonth, sg?.endMonth);
  const entrant = row.direction === "in";
  // Rend null pour un récurrent : son budget est la somme de ses sous-postes, il
  // n'y a rien à écrire à son niveau (cf. budgetEditOfGroup).
  const budgetEdit = budgetEditOfGroup(sg, mois, currentMonth);
  const manage: GroupManageInfo = {
    groupId: row.id,
    name: row.name,
    month: mois,
    stripMin,
    stripMax,
    startMonth: sg?.startMonth,
    endMonth: sg?.endMonth,
    changes: sg?.changes ?? [],
    lines: (sg?.lines ?? []).map((l) => ({ id: l.id, name: l.name })),
    // Seules les dépenses ont un bloc : un revenu n'a rien à déplacer.
    planned: row.direction === "out" ? row.planned !== false : undefined,
  };

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={ouvert}
        className="hover:bg-muted/40 flex w-full flex-col gap-1 px-3 py-2 text-left transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
      >
        <div className="flex min-w-0 items-baseline gap-2">
          {ouvert ? (
            <ChevronDown className="text-muted-foreground size-3 shrink-0 translate-y-0.5" />
          ) : (
            <ChevronRight className="text-muted-foreground size-3 shrink-0 translate-y-0.5" />
          )}
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
                teinte={c.balance < -0.005 ? "text-tension-ink" : "text-foreground"}
                etiquette={signaleDepassement ? "dépassement" : undefined}
              />
            </>
          )}
        </div>
      </button>

      {ouvert && (
        // Le retrait à gauche rattache visuellement le dépliage à sa ligne, et la
        // teinte le détache du flux des postes sans avoir à l'encadrer.
        <div className="bg-muted/20 flex flex-col gap-6 border-t px-3 py-4 sm:pl-9">
          {budgetEdit && <BudgetEditBlock info={budgetEdit} />}

          {row.subRows.length > 0 && (
            <div className="flex flex-col gap-3">
              {row.subRows.map((sub) => (
                <SousPoste
                  key={sub.id}
                  sub={sub}
                  groupes={groupes}
                  groupe={sg}
                  mois={mois}
                  currentMonth={currentMonth}
                />
              ))}
            </div>
          )}

          {row.txns.length > 0 && (
            <div className="divide-border/60 divide-y border-t pt-2">
              {row.txns.map((t) => (
                <LigneTxn key={t.id} txn={t} groupes={groupes} />
              ))}
            </div>
          )}

          {/* Renommer, changer la durée, déplacer entre les deux blocs, supprimer.
              Rendu en ligne : on referme en repliant le poste. */}
          <GroupManageBlock info={manage} onClose={onToggle} inline />
        </div>
      )}
    </div>
  );
}
