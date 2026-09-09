"use client";

import { cloneElement, createContext, useContext, type ReactElement, type ReactNode } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { COL_INFO, COL_LABEL, type ColKey } from "@/lib/history-columns";
import { makeInfo, type CellDetail } from "@/lib/history-explain";
import { monthLabel } from "@/lib/transactions-view";
import { cn } from "@/lib/utils";

export const EXPENSE_RECEIPTS_LABEL = "Remboursements / apports";
export const EXPENSE_RECEIPTS_INFO = ["L’argent reçu pour couvrir ces dépenses : remboursements, participation d’un proche ou apport depuis un autre compte. Il augmente le reste disponible sans réduire le montant affiché dans Dépensé."];
export const HistorySectionColumnsContext = createContext<{
  kind: "income" | "expense";
  table: boolean;
  colSpan?: number;
} | null>(null);

export function sectionColumns(kind: "income" | "expense", columns: ColKey[]) {
  return columns.filter(column => kind === "income"
    ? !["budgetDep", "dep", "reste"].includes(column)
    : column !== "budgetRem");
}

export type MobileHistoryView = {
  month: string;
  metric: ColKey | null;
  onMonthChange: (month: string) => void;
};

export const MobileHistoryContext = createContext<(MobileHistoryView & {
  showDeltas: boolean;
  selected: ReadonlySet<string>;
  onSelect: (detail: CellDetail) => void;
}) | null>(null);

type Column = { column: ColKey; month: string };
export const MobileColumnContext = createContext<Column | null>(null);

// À l'ouverture sur mobile : nom, détail, puis montants de l'enveloppe.
// Sur ordinateur, le nom et les montants restent sur la même ligne.
export function HistoryExpandableRows({ heading, amounts, expanded, className, children }: {
  heading: ReactNode;
  amounts: ReactNode;
  expanded: boolean;
  className?: string;
  children: ReactNode;
}) {
  const mobile = useContext(MobileHistoryContext);
  const amountsAfterDetails = !!mobile && expanded;
  return <>
    <TableRow className={className}>
      {heading}
      {!amountsAfterDetails && amounts}
    </TableRow>
    {children}
    {amountsAfterDetails && <TableRow className={className}>{amounts}</TableRow>}
  </>;
}

export const MOBILE_COLUMN_LABELS: Record<ColKey, string> = {
  budgetRem: "Attendu", budgetDep: "Budget", dep: "Dépensé", recu: "Reçu",
  reste: "Reste / manque", soldeReel: "Solde réel", soldePrevu: "Solde prévu",
  soldeDepass: "Si dépassement",
};

export type HistoryColumnElement = ReactElement<{
  className?: string;
  children?: ReactNode;
  cellKey?: string;
  "data-mobile-column"?: string;
  "data-mobile-month"?: string;
}>;

// Les mêmes cellules, actions et clés que sur ordinateur. Seule leur disposition
// change : on ne coupe jamais les tableaux de données ni leurs index de mois.
export function HistoryMobileColumns({ month, cells, keepBalances = false, transaction = false }: {
  month: string;
  cells: { column: ColKey; element: HistoryColumnElement }[];
  keepBalances?: boolean;
  transaction?: boolean;
}) {
  const mobile = useContext(MobileHistoryContext);
  const section = useContext(HistorySectionColumnsContext);
  if (section?.table) {
    const allowed = sectionColumns(section.kind, cells.map(cell => cell.column));
    cells = cells.filter(cell => allowed.includes(cell.column)).map((cell, index) => ({
      ...cell,
      element: cloneElement(cell.element, {
        className: cn(cell.element.props.className, index === 0 && "border-l border-l-filet-fort pl-4"),
      }),
    }));
  }
  if (!mobile) return <>{cells.flatMap(({ column, element }) => [
    element,
    ...(section?.table && section.kind === "income" && column === "recu"
      ? [<TableCell key="receipt-space" aria-hidden="true" className={cn(element.props.className, "p-0")} />]
      : []),
  ])}</>;
  if (!mobile.metric && mobile.month !== month) return null;

  const unavailable = mobile.metric && !transaction && !cells.some(({ column }) => column === mobile.metric);
  return <>
    {unavailable && <MobileColumnContext.Provider value={{ column: mobile.metric!, month }}>
      <TableCell data-mobile-column={mobile.metric!} data-mobile-month={month}>
        <MobileCellContents><span className="text-xs font-normal">Non applicable</span></MobileCellContents>
      </TableCell>
    </MobileColumnContext.Provider>}
    {cells.map(({ column, element }) => {
    const selected = !!element.props.cellKey && mobile.selected.has(element.props.cellKey);
    if (mobile.metric && column !== mobile.metric && !selected && !transaction) return null;
    if (!mobile.metric && column.startsWith("solde") && !keepBalances && !mobile.showDeltas && !selected) return null;
    const empty = element.props.children == null || element.props.children === "";
    if ((!mobile.metric || transaction) && empty) return null;
    const value = empty ? <span aria-label="Sans montant">—</span> : element.props.children;
    const isPlainCell = element.type === TableCell;
    return (
      <MobileColumnContext.Provider key={column} value={{ column, month }}>
        {isPlainCell
          ? cloneElement(element, { "data-mobile-column": column, "data-mobile-month": month },
              <MobileCellContents>{value}</MobileCellContents>)
          : cloneElement(element, undefined, value)}
      </MobileColumnContext.Provider>
    );
  })}</>;
}

// Le libellé ouvre l'explication de la colonne ; le chiffre ouvre son calcul.
// Les deux boutons sont voisins, jamais imbriqués.
export function MobileCellContents({ children, label: override }: { children: ReactNode; label?: string }) {
  const mobile = useContext(MobileHistoryContext);
  const cell = useContext(MobileColumnContext);
  const section = useContext(HistorySectionColumnsContext);
  if (!mobile || !cell) return <>{children}</>;
  const expenseReceipt = section?.kind === "expense" && cell.column === "recu";
  const columnLabel = expenseReceipt ? EXPENSE_RECEIPTS_LABEL : MOBILE_COLUMN_LABELS[cell.column];
  const label = mobile.metric
    ? `${monthLabel(cell.month)}${cell.column !== mobile.metric ? ` · ${columnLabel}` : ""}`
    : override ?? columnLabel;
  return <div className="history-mobile-value">
    <button
      type="button"
      className="history-mobile-label"
      aria-label={`Comprendre : ${columnLabel}`}
      onClick={() => mobile.onSelect(makeInfo(expenseReceipt ? EXPENSE_RECEIPTS_LABEL : COL_LABEL[cell.column], expenseReceipt ? EXPENSE_RECEIPTS_INFO : COL_INFO[cell.column]))}
    >{label}</button>
    <div className="history-mobile-number">{children}</div>
  </div>;
}
