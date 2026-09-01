"use client";
import { useState } from "react";
import { setBudgetMonth } from "@/app/app/transactions/actions";
import { moisBudget, moisProposables } from "@/lib/txn-mois";
import { monthLabel } from "@/lib/transactions-view";
import { cn } from "@/lib/utils";
import { champClass } from "@/components/ui/input";
import { useMiseAJour } from "@/components/mise-a-jour";

// LE MOIS OÙ L'OPÉRATION COMPTE.
//
// La banque écrit une date, et cette date ne bouge jamais. Mais le budget se tient
// par mois, et le calendrier de la banque ne tombe pas toujours sur celui des
// enveloppes : les courses du 31 août faites pour septembre, un prélèvement parti en
// avance, une facture qui couvre le mois suivant. Ce menu range l'opération dans le
// mois qu'on veut, et elle y compte partout — enveloppe, total, solde, dépassement.
//
// Un menu et non un calendrier : on décale d'un cran ou deux, on ne cherche pas une
// date. Les mois proposés entourent la date, et celui de la date porte sa mention —
// c'est la position de repos, celle où il n'y a rien de décidé.
export function TxnMonthField({
  txnId, date, budgetMonth, disabled = false, className,
}: {
  txnId: string;
  date: string;
  budgetMonth: string | null;
  disabled?: boolean;
  className?: string;
}) {
  const { pendant, enCours } = useMiseAJour();
  const moisDeLaDate = date.slice(0, 7);

  // Le choix s'affiche tout de suite, puis suit la vérité serveur : quand celle-ci
  // change après le rafraîchissement, on se resynchronise. Même mécanique que le
  // menu de rattachement de poste, juste à côté.
  const serveur = moisBudget({ date, budgetMonth });
  const [valeur, setValeur] = useState(serveur);
  const [precedent, setPrecedent] = useState(serveur);
  if (serveur !== precedent) {
    setPrecedent(serveur);
    setValeur(serveur);
  }

  const options = moisProposables(date, budgetMonth);
  const deplacee = valeur !== moisDeLaDate;

  return (
    <select
      aria-label="Mois où cette opération compte"
      title="Mois où cette opération compte"
      value={valeur}
      disabled={disabled || enCours}
      className={cn(
        champClass,
        "min-w-0 py-1",
        // Déplacée, elle se signale : c'est une décision prise à la main, et rien
        // d'autre sur la ligne ne dit que la date affichée n'est plus le mois du
        // calcul.
        deplacee && "border-sarcelle text-sarcelle-encre font-semibold",
        className,
      )}
      onChange={(e) => {
        const m = e.currentTarget.value;
        setValeur(m);
        pendant(() => setBudgetMonth(txnId, m === moisDeLaDate ? null : m));
      }}
    >
      {options.map((m) => (
        <option key={m} value={m}>
          {m === moisDeLaDate ? `${monthLabel(m)} (sa date)` : monthLabel(m)}
        </option>
      ))}
    </select>
  );
}
