"use client";

import { useContext, useId, useState, type ReactNode } from "react";
import { Check, Filter } from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { MobileHistoryContext, EXPENSE_RECEIPTS_LABEL } from "@/components/history-mobile-columns";
import { HistoryMobileSheetContent } from "@/components/history-mobile-sheet";
import type { ColKey } from "@/lib/history-columns";

const OPTIONS = {
  income: [
    { value: "budgetRem", label: "Attendu", description: "Les revenus prévus pour chaque mois." },
    { value: "recu", label: "Reçu", description: "Les revenus effectivement reçus." },
  ],
  expense: [
    { value: "budgetDep", label: "Budget", description: "Les montants prévus pour vos dépenses." },
    { value: "dep", label: "Dépensé", description: "Les dépenses, après déduction des remboursements." },
    { value: "reste", label: "Reste", description: "Le budget encore disponible, ou le dépassement." },
    { value: "recu", label: "Remboursements", description: "Les remboursements et apports reçus dans vos postes de dépenses.", accessibleLabel: EXPENSE_RECEIPTS_LABEL },
  ],
  balance: [
    { value: "soldeReel", label: "Réel", description: "Le solde réel ; pour les mois à venir, l’estimation actuelle." },
    { value: "soldePrevu", label: "Prévu", description: "Le solde si vos revenus et vos budgets suivent le plan." },
    { value: "soldeDepass", label: "Si dépassement", description: "Le solde prévu, diminué des dépassements constatés dans le mois." },
  ],
} as const;

export type ComparisonSection = keyof typeof OPTIONS;
export type ComparisonMetrics = { [K in ComparisonSection]: typeof OPTIONS[K][number]["value"] };
export type HistoryComparison = {
  metrics: ComparisonMetrics;
  onChange: (section: ComparisonSection, metric: ColKey) => void;
};

export function validComparisonMetric<K extends ComparisonSection>(section: K, value: string | null | undefined, fallback: ComparisonMetrics[K]): ComparisonMetrics[K] {
  return OPTIONS[section].some(option => option.value === value) ? value as ComparisonMetrics[K] : fallback;
}

const LABELS = { income: "Comparer les revenus", expense: "Comparer les dépenses", balance: "Comparer les soldes" };

export function HistoryComparisonLabel({ section }: { section: ComparisonSection }) {
  const mobile = useContext(MobileHistoryContext);
  if (!mobile?.metric || !mobile.comparison) return null;
  const option = OPTIONS[section].find(option => option.value === mobile.comparison!.metrics[section]);
  return <span className="history-comparison-label"> · {option?.label}</span>;
}

export function HistoryComparisonControl({ section }: { section: ComparisonSection }) {
  const mobile = useContext(MobileHistoryContext);
  const [open, setOpen] = useState(false);
  const currentDescriptionId = useId();
  if (!mobile?.metric || !mobile.comparison) return null;
  const { metrics, onChange } = mobile.comparison;
  const currentLabel = OPTIONS[section].find(option => option.value === metrics[section])?.label;
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild>
      <button type="button" aria-label={LABELS[section]} aria-describedby={currentDescriptionId} data-selected-metric={metrics[section]} className="history-comparison-modify history-mobile-icon"><Filter aria-hidden="true" className="size-[18px]" /></button>
    </SheetTrigger>
    <span id={currentDescriptionId} className="sr-only">Indicateur actuel : {currentLabel}</span>
    <HistoryMobileSheetContent title={LABELS[section]} description="Choisissez ce que vous souhaitez comparer entre les mois." section={section}>
      <div role="group" aria-label={LABELS[section]} className="history-comparison-options">
        {OPTIONS[section].map(option => <button key={option.value} type="button" value={option.value}
          aria-pressed={metrics[section] === option.value}
          aria-label={"accessibleLabel" in option ? option.accessibleLabel : undefined}
          onClick={() => { onChange(section, option.value); setOpen(false); }}>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{option.label}</span>
            <span data-comparison-description="" className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
          </span>
          {metrics[section] === option.value && <Check aria-hidden="true" className="size-5 shrink-0" />}
        </button>)}
      </div>
    </HistoryMobileSheetContent>
  </Sheet>;
}

// Le filtre ne concerne que les chiffres de ce bloc ; les références de calcul
// et la période sont communes à tout le relevé.
export function HistoryMetricScope({ metric, children }: { metric: ColKey | undefined; children: ReactNode }) {
  const mobile = useContext(MobileHistoryContext);
  if (!mobile?.metric || !mobile.comparison || !metric) return <>{children}</>;
  return <MobileHistoryContext.Provider value={{ ...mobile, metric }}>{children}</MobileHistoryContext.Provider>;
}
