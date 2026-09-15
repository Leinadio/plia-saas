import { COL_LABEL, type ColKey } from "@/lib/history-columns";
import { soldeCell } from "@/lib/solde-cell";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const format = (value: number) => money.format(Math.abs(value) < 0.005 ? 0 : value);

export function treasuryColumnLabel(column: ColKey, month?: string, currentMonth?: string) {
  return column === "soldeReel" && month && currentMonth && month > currentMonth
    ? "Estimation prolongée"
    : COL_LABEL[column];
}

/** Le signe du mouvement ne remplace jamais celui du montant restant. */
export function TreasuryAmount({ v, delta }: { v: number; delta?: number | null }) {
  const cell = soldeCell(v, delta, true);
  if (cell.kind === "empty") return null;
  if (cell.kind !== "detailed") return <span data-treasury-value="">{format(v)}</span>;
  const negative = v < -0.005;
  return <span className="history-treasury-step">
    <span data-treasury-movement="" className={cn("history-treasury-movement", cell.delta < 0 ? "history-treasury-out" : "history-treasury-in")}>
      {cell.delta > 0 ? "+" : "−"}{format(Math.abs(cell.delta))} € <span>{cell.delta > 0 ? "ajoutés" : "retirés"}</span>
    </span>
    <span data-treasury-remaining="" className={cn("history-treasury-remaining", negative && "history-treasury-negative")}>
      <span className="history-treasury-equals" aria-hidden="true">=</span>
      <span data-treasury-value="">{format(v)} €</span>
    </span>
    <span className={cn("history-treasury-caption", negative && "history-treasury-negative")}>
      {negative ? "à découvert" : "restants à cette étape"}
    </span>
  </span>;
}

export function TreasuryOutcome({ column, month, currentMonth, value }: {
  column: ColKey; month: string; currentMonth: string; value: number | null | undefined;
}) {
  if (value == null) return null;
  const label = column === "soldeReel"
    ? month === currentMonth ? "Trésorerie actuelle" : month < currentMonth ? "Trésorerie en fin de mois" : "Estimation prolongée"
    : COL_LABEL[column];
  const note = column === "soldeReel"
    ? month === currentMonth ? "Dernière synchronisation" : month < currentMonth ? "Opérations connues" : "Sans opérations futures"
    : column === "soldePrevu" ? "Prévision de fin de mois" : "Prévision ajustée";
  return <span className="history-treasury-outcome">
    <span className="history-treasury-outcome-label">{label}</span>
    <span data-treasury-value="" className={cn("history-treasury-outcome-value", value < -0.005 && "history-treasury-negative")}>{format(value)} €</span>
    {value < -0.005 && <span className="history-treasury-caption history-treasury-negative">
      {column === "soldeReel" && month <= currentMonth ? "À découvert" : "Découvert prévu"}
    </span>}
    <span className="history-treasury-caption">{note}</span>
  </span>;
}
