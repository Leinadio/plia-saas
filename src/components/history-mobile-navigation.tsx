"use client";

import { createContext, useContext, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthRange } from "@/lib/history";
import { type ColKey, COL_LABEL } from "@/lib/history-columns";
import { MOBILE_COLUMN_LABELS } from "@/components/history-mobile-columns";
import { cn } from "@/lib/utils";

export type HistoryMobileNavigation = {
  month: string;
  metric: ColKey | null;
  onMonthChange: (month: string) => void;
  onMetricChange: (metric: ColKey) => void;
  onCompareChange: (compare: boolean) => void;
};

export const HistoryMobileNavigationContext = createContext<HistoryMobileNavigation | null>(null);
export const useHistoryMobileNavigation = () => useContext(HistoryMobileNavigationContext);

export function useHistoryMobileState({ from, to, current, initialMonth, initialMetric }: {
  from: string;
  to: string;
  current: string;
  initialMonth?: string | null;
  initialMetric?: string | null;
}): HistoryMobileNavigation {
  const validMetric = initialMetric && Object.hasOwn(COL_LABEL, initialMetric) ? initialMetric as ColKey : null;
  const [month, setMonth] = useState(initialMonth && monthRange(from, to).includes(initialMonth)
    ? initialMonth : current >= from && current <= to ? current : from);
  const [compare, setCompare] = useState(validMetric !== null);
  const [metric, setMetric] = useState<ColKey>(validMetric ?? "dep");
  return { month, metric: compare ? metric : null, onMonthChange: setMonth, onMetricChange: setMetric, onCompareChange: setCompare };
}

const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
const selectClass = "h-11 min-w-0 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium";
const buttonClass = "flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-35";

export function HistoryMobileControls({ navigation, min, max, disabled = false }: {
  navigation: HistoryMobileNavigation;
  min: string;
  max: string;
  disabled?: boolean;
}) {
  const { month, metric, onMonthChange, onMetricChange, onCompareChange } = navigation;
  const months = monthRange(min, max);
  const index = months.indexOf(month);
  return (
    <div className="carte flex min-w-0 flex-col gap-3 p-3" aria-label="Navigation du relevé" aria-busy={disabled || undefined}>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Présentation du relevé">
        {[{ label: "Par mois", compare: false }, { label: "Comparer", compare: true }].map((mode) => (
          <button key={mode.label} type="button" disabled={disabled} aria-pressed={(metric !== null) === mode.compare}
            onClick={() => onCompareChange(mode.compare)}
            className={cn("min-h-10 rounded-md px-3 text-sm font-medium", (metric !== null) === mode.compare ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
            {mode.label}
          </button>
        ))}
      </div>
      {metric === null ? (
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" aria-label="Mois précédent" disabled={disabled || index <= 0} className={buttonClass}
            onClick={() => onMonthChange(months[index - 1])}><ChevronLeft className="size-4" /></button>
          <select aria-label="Mois affiché" value={month} disabled={disabled} className={cn(selectClass, "flex-1 capitalize")}
            onChange={(event) => onMonthChange(event.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button type="button" aria-label="Mois suivant" disabled={disabled || index < 0 || index >= months.length - 1} className={buttonClass}
            onClick={() => onMonthChange(months[index + 1])}><ChevronRight className="size-4" /></button>
        </div>
      ) : (
        <label className="flex min-w-0 flex-col gap-1.5 text-xs text-muted-foreground">
          Indicateur à comparer
          <select aria-label="Indicateur à comparer" value={metric} disabled={disabled} className={cn(selectClass, "text-foreground")}
            onChange={(event) => onMetricChange(event.target.value as ColKey)}>
            {(Object.keys(COL_LABEL) as ColKey[]).map((key) => <option key={key} value={key}>{MOBILE_COLUMN_LABELS[key]}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
