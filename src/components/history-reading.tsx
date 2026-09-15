import type { MonthCell } from "@/lib/history";
import { COL_LABEL, type ColKey } from "@/lib/history-columns";
import { treasuryColumnLabel } from "@/components/history-treasury";

export const EXPENSE_RECEIPTS_LABEL = "Remboursements / apports";
export const EXPENSE_RECEIPTS_INFO = [
  "L’argent reçu pour couvrir ces dépenses : remboursement, participation d’un proche ou apport. Dépensé garde la somme entière sortie du compte ; le reste tient compte de l’argent revenu.",
  "Un remboursement partiel peut redonner de la marge. Une dépense entièrement remboursée est terminée : elle ne recrée pas de budget à dépenser. Si vous recevez davantage que la dépense, l’excédent reste visible.",
];

type Reading = { label: string; note: string; operator?: string };
export function historyColumnReading(column: ColKey, kind?: "income" | "expense", month?: string, currentMonth?: string): Reading {
  if (column.startsWith("solde")) return {
    label: treasuryColumnLabel(column, month, currentMonth),
    note: column === "soldeReel"
      ? month && currentMonth && month > currentMonth ? "Sans opérations futures" : "Après les mouvements connus"
      : column === "soldePrevu" ? "Si les budgets sont utilisés" : "Avec les dépassements constatés",
  };
  switch (column) {
    case "budgetRem": return { label: "Attendu", note: "Ce que vous comptez recevoir" };
    case "budgetDep": return { label: "Budget", note: "Ce que vous prévoyez de dépenser" };
    case "dep": return { label: "Dépensé", note: "Ce qui est sorti du compte", operator: "−" };
    case "recu": return kind === "expense"
      ? { label: EXPENSE_RECEIPTS_LABEL, note: "Ce qui revient dans l’enveloppe", operator: "+" }
      : { label: "Reçu", note: "Ce qui est arrivé sur le compte" };
    case "reste": return { label: "Reste / manque", note: "La marge de cette enveloppe", operator: "=" };
    default: return { label: COL_LABEL[column], note: "" };
  }
}

export function HistoryColumnHeading({ reading }: { reading: Reading }) {
  return <>
    <span className="history-reading-column-title">
      {reading.operator && <span aria-hidden="true" className="history-reading-operator">{reading.operator}</span>}
      <span>{reading.label}</span>
    </span>
    <span className="history-reading-column-note">{reading.note}</span>
  </>;
}

export function HistoryReadingIntro() {
  return <div className="history-reading-intro" data-history-reading-intro="">
    <h2>Votre trésorerie, étape par étape</h2>
    <p>Lisez chaque enveloppe de gauche à droite, puis suivez l’argent restant dans les colonnes de trésorerie.</p>
  </div>;
}

const money = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Le montant vient du modèle. La mention l’explique sans refaire son calcul.
export function EnvelopeRemainder({ cell, future = false, total = false, uncategorized = false }: {
  cell: MonthCell; future?: boolean; total?: boolean; uncategorized?: boolean;
}) {
  const value = Math.abs(cell.balance) < 0.005 ? 0 : cell.balance;
  const spent = cell.depenseBrute ?? cell.depense;
  const received = cell.recuBrut ?? cell.recu;
  const paidBack = spent > 0.005 && received >= spent - 0.005;
  const excessOnly = paidBack && value > 0 && Math.abs(value - (received - spent)) < 0.005;
  const released = cell.budgeted - cell.depense - cell.balance > 0.005;
  const caption = future ? "budget à venir"
    : value < 0 ? "de dépassement"
    : excessOnly ? "d’excédent reçu"
    : value > 0 ? "encore disponibles"
    : paidBack ? total ? "dépenses remboursées" : "entièrement remboursé"
    : spent > 0.005 || cell.budgeted > 0.005 ? "budget utilisé"
    : "aucun budget disponible";
  return <span className="history-envelope-result" data-budget-result="">
    <span className="history-envelope-result-value" data-budget-remaining="">{money.format(value)}</span>
    <span className="history-envelope-result-caption">{caption}</span>
    {released && <span className="history-envelope-result-note">{total ? "Budgets clôturés après remboursement" : "Budget clôturé après remboursement"}</span>}
    {uncategorized && <span className="history-envelope-result-note">Provision et reçus inclus</span>}
  </span>;
}
