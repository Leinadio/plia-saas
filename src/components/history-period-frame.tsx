"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MonthRangePicker } from "@/components/month-range-picker";
import { SqueletteGrilleHistorique } from "@/components/squelettes";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { HistoryMobileControls, HistoryMobileNavigationContext, useHistoryMobileState } from "@/components/history-mobile-navigation";

type Range = { from: string; to: string };

// Garde la nouvelle période à l'écran pendant que le serveur recalcule le tableau.
// La page donne une nouvelle clé à ce composant quand les données arrivent : son
// état d'attente disparaît alors avec l'ancien tableau, sans image intermédiaire.
export function HistoryPeriodFrame({ min, max, from, to, current, children }: {
  min: string;
  max: string;
  from: string;
  to: string;
  current: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(640);
  const [pendingRange, setPendingRange] = useState<Range | null>(null);
  const mobile = useHistoryMobileState({ from, to, current,
    initialMonth: searchParams.get("mobileMonth"), initialMetric: searchParams.get("mobileMetric"),
    initialIncomeMetric: searchParams.get("mobileIncomeMetric"), initialExpenseMetric: searchParams.get("mobileExpenseMetric"),
    initialBalanceMetric: searchParams.get("mobileBalanceMetric") });

  const changeRange = (nextFrom: string, nextTo: string, nextMonth = mobile.month) => {
    if (nextFrom === from && nextTo === to) return;
    setPendingRange({ from: nextFrom, to: nextTo });
    const query = new URLSearchParams(searchParams.toString());
    query.set("from", nextFrom);
    query.set("to", nextTo);
    if (isMobile) {
      query.set("mobileMonth", nextMonth);
      query.set("mobileIncomeMetric", mobile.comparison.metrics.income);
      query.set("mobileExpenseMetric", mobile.comparison.metrics.expense);
      query.set("mobileBalanceMetric", mobile.comparison.metrics.balance);
      if (mobile.metric) query.set("mobileMetric", mobile.metric);
      else query.delete("mobileMetric");
    }
    router.push(`${pathname}?${query.toString()}`);
  };
  const navigation = { ...mobile, onMonthChange: (month: string) => {
    if (pendingRange || month < min || month > max) return;
    mobile.onMonthChange(month);
    if (month < from || month > to) changeRange(month < from ? month : from, month > to ? month : to, month);
  } };

  return (
    <HistoryMobileNavigationContext.Provider value={navigation}>
      {isMobile && <HistoryMobileControls navigation={navigation} min={min} max={max} disabled={pendingRange !== null} />}
      {(!isMobile || mobile.metric !== null) && <MonthRangePicker
        min={min}
        max={max}
        from={from}
        to={to}
        current={current}
        pendingRange={pendingRange}
        onCommit={changeRange}
        disabled={pendingRange !== null}
      />}
      {pendingRange ? (
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          <span className="sr-only">Chargement du relevé</span>
          <Skeleton className="h-3.5 w-56" />
          {isMobile ? <div className="carte flex flex-col gap-4 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div> : <SqueletteGrilleHistorique />}
        </div>
      ) : children}
    </HistoryMobileNavigationContext.Provider>
  );
}
