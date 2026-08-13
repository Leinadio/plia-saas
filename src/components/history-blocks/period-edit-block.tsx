"use client";
import { useState } from "react";
import { monthLabel } from "@/lib/transactions-view";
import { amountAtMonth, type BudgetChange } from "@/lib/budget-history";
import { type PeriodImpact } from "@/app/app/historique/actions";
import { draftOfPeriod, draftStart, type PeriodDraft } from "@/lib/group-period";
import { PeriodFields } from "@/components/period-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toastSucces } from "@/components/history-blocks/toast";

// Modifier la durée de vie d'un groupe ou d'une ligne qui existe déjà. Le même bloc
// pour les deux : la question est la même, seule l'action d'écriture change.
//
// Créer, c'est facile — rien n'existe encore. Modifier, c'est autre chose : des mois
// sont déjà remplis. D'où la seule règle qui compte ici : rallonger passe sans rien
// demander, raccourcir annonce d'abord ce qui va bouger de place.
//
// Ce qui bouge, ce sont les transactions des mois retirés : elles retournent en non
// catégorisés, et elles y restent — rallonger la durée ensuite ne les ramène pas
// (cf. setGroupPeriod). C'est la seule chose que le geste défait pour de bon, donc la
// seule sur laquelle on demande son avis à l'utilisateur. Le budget des mois retirés,
// lui, reste en base et revient tel quel : rien à annoncer de ce côté.
export function PeriodEditBlock({ current, month, stripMin, stripMax, changes, askAmount, impactOf, onSave }: {
  current: { startMonth?: string | null; endMonth?: string | null };
  month: string;
  stripMin: string;
  stripMax: string;
  changes: BudgetChange[];
  // Un récurrent n'a pas de montant à lui (il le tire de ses lignes) : il n'y a rien
  // à demander quand on lui rallonge la durée vers le passé.
  askAmount: boolean;
  impactOf: (startMonth: string, endMonth: string | null) => Promise<PeriodImpact>;
  onSave: (startMonth: string, endMonth: string | null, amount?: number) => Promise<void>;
}) {
  const debutActuel = current.startMonth ?? month;
  const finActuelle = current.endMonth ?? null;
  const [draft, setDraft] = useState<PeriodDraft>(() => draftOfPeriod(current.startMonth, current.endMonth, month));
  const [amount, setAmount] = useState(() => String(amountAtMonth(changes, debutActuel) || ""));
  const [pending, setPending] = useState(false);
  // Non nul = l'avertissement est à l'écran, en attente d'un « oui ». Porte le détail
  // par mois de ce qui va retourner en non catégorisés.
  const [impact, setImpact] = useState<PeriodImpact["months"] | null>(null);

  const start = draftStart(draft);
  const end = draft.choice === "dates" ? draft.end ?? draft.start : null;
  const change = start !== debutActuel || end !== finActuelle;
  // Rallonger vers le passé ouvre des mois où le groupe n'a jamais eu de montant :
  // sans en poser un, ils s'afficheraient à zéro.
  const rallongeAvant = askAmount && start < debutActuel;

  const ecrire = async () => {
    setPending(true);
    await onSave(start, end, rallongeAvant ? parseFloat(amount) || 0 : undefined);
    setPending(false);
    setImpact(null);
    toastSucces("Durée enregistrée");
  };

  const enregistrer = async () => {
    setPending(true);
    const coute = await impactOf(start, end);
    setPending(false);
    if (coute.months.length > 0) setImpact(coute.months);
    else await ecrire();
  };

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <Label className="font-normal">Durée</Label>
      <PeriodFields draft={draft} onChange={setDraft} stripMin={stripMin} stripMax={stripMax} compact />
      {rallongeAvant && (
        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs font-normal">
            Montant pour les mois gagnés
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 w-40 text-right tabular-nums"
            placeholder="0.00"
          />
          <p className="text-muted-foreground text-xs">
            Ces mois n&apos;ont encore aucun montant. Celui-ci y prend effet, sans toucher aux suivants.
          </p>
        </div>
      )}
      <Button type="button" size="sm" variant="secondary" className="self-start" disabled={pending || !change} onClick={enregistrer}>
        Enregistrer la durée
      </Button>

      <AlertDialog open={impact !== null} onOpenChange={(o) => !o && setImpact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Raccourcir cette durée ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {/* Le détail par mois, et pas un total : c'est là qu'il faudra aller
                  recatégoriser à la main. Et le mot compte — « retourneront »,
                  au futur : rallonger la durée ensuite ne les ramènera pas. */}
              <div>
                <p>Les transactions des mois suivants retourneront dans « Non catégorisés »</p>
                <ul className="mt-2 list-disc pl-5">
                  {(impact ?? []).map((m) => (
                    <li key={m.month}>
                      {monthLabel(m.month)} : {m.txns} transaction{m.txns > 1 ? "s" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={ecrire}>Raccourcir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
