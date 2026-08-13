"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetEditInfo } from "@/lib/history-explain";
import { monthLabel } from "@/lib/transactions-view";
import { formatEur } from "@/lib/money";
import { amountAtMonth, type BudgetChange } from "@/lib/budget-history";
import {
  setGroupAmount,
  setGroupLineAmount,
  spreadGroupAmount,
  spreadGroupLineAmount,
} from "@/app/app/historique/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastSucces } from "@/components/history-blocks/toast";

// Bloc d'édition d'un budget, affiché sous la décomposition de sa case « Budget dép. ».
// C'est le seul endroit d'où un montant se modifie : la case dit le mois, et un montant
// n'a de sens qu'attaché à un mois.
//
// On ne demande plus la portée AVANT de saisir. « Appliquer » vaut pour le seul mois
// cliqué, puis la question tombe : les mois suivants doivent-ils prendre ce montant ?
// Répondre après plutôt qu'avant, c'est répondre en voyant le montant qu'on vient de
// poser, et non un choix abstrait à faire de tête au moment de la saisie.
//
// S'affiche sur n'importe quel mois, écoulé compris : un budget se corrige après coup,
// une fois le relevé sous les yeux. Le seul cas sans bloc du tout est la case d'un
// groupe récurrent, où budgetEditOfGroup rend null — son budget est la somme de ses
// lignes, il n'y a rien à écrire à son niveau.
export function BudgetEditBlock({ info }: { info: BudgetEditInfo }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // Montant en vigueur au mois cliqué, resynchronisé sur ce que le serveur vient
  // réellement de poser : recalculer la sémantique des portées côté client
  // dupliquerait la règle de lecture, avec le risque de diverger.
  const [changes, setChanges] = useState(info.changes);
  const enForce = amountAtMonth(changes, info.month);
  const [amount, setAmount] = useState(String(enForce));
  // Montant tout juste appliqué : tant qu'il est là, on pose la question de la
  // propagation. null = rien à demander (rien appliqué, ou déjà répondu).
  const [applique, setApplique] = useState<number | null>(null);
  // Resynchronisation pendant le rendu, pas un useEffect (react.dev/learn/
  // you-might-not-need-an-effect) : le champ doit suivre le montant en vigueur après
  // un « Appliquer », sans que ce composant soit remonté.
  const [prevEnForce, setPrevEnForce] = useState(enForce);
  if (prevEnForce !== enForce) {
    setPrevEnForce(enForce);
    setAmount(String(enForce));
  }
  const run = async (fn: () => Promise<BudgetChange[]>) => {
    setBusy(true);
    const next = await fn();
    setBusy(false);
    setChanges(next);
    router.refresh();
  };
  const saisi = parseFloat(amount);
  const apply = async () => {
    await run(() =>
      info.target === "group"
        ? setGroupAmount(info.id, info.month, saisi, "once")
        : setGroupLineAmount(info.id, info.month, saisi, "once"),
    );
    setApplique(saisi);
  };
  const propager = async () => {
    await run(() =>
      info.target === "group"
        ? spreadGroupAmount(info.id, info.month, applique!)
        : spreadGroupLineAmount(info.id, info.month, applique!),
    );
    setApplique(null);
    toastSucces("Montant appliqué aux mois suivants");
  };
  return (
    <div className="mt-4 flex flex-col gap-4 border-t pt-4">
      <div className="flex flex-col gap-2">
        <Label className="font-normal">Montant pour {monthLabel(info.month)}</Label>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              // Modifier le champ rouvre la saisie : la question porterait sinon sur un
              // montant qui n'est plus celui affiché.
              setApplique(null);
            }}
            className="h-9 w-28 text-right tabular-nums"
          />
          <Button type="button" size="sm" variant="secondary" disabled={busy || !(saisi >= 0)} onClick={apply}>
            Appliquer
          </Button>
        </div>
      </div>
      {applique !== null && (
        <div className="plate flex flex-col gap-2 p-3 text-sm">
          <p>
            {formatEur(applique)} appliqué à {monthLabel(info.month)}. Les mois suivants
            doivent-ils prendre ce montant ?
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Le libellé dit la conséquence : répondre oui remplace les montants déjà
                prévus après ce mois, il ne se contente pas de combler les vides. */}
            <Button type="button" size="sm" disabled={busy} onClick={propager}>
              Oui, remplacer tous les mois suivants
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setApplique(null)}>
              Non, {monthLabel(info.month).toLowerCase()} seulement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
