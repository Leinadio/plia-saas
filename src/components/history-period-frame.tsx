"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MonthRangePicker } from "@/components/month-range-picker";
import { SqueletteGrilleHistorique } from "@/components/squelettes";
import { Skeleton } from "@/components/ui/skeleton";

import styles from "./history-period.module.css";

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
  const [pendingRange, setPendingRange] = useState<Range | null>(null);

  const changeRange = (nextFrom: string, nextTo: string) => {
    if (nextFrom === from && nextTo === to) return;
    setPendingRange({ from: nextFrom, to: nextTo });
    const query = new URLSearchParams(searchParams.toString());
    query.set("from", nextFrom);
    query.set("to", nextTo);
    // Les anciens liens mobiles ouvrent aussi le tableau commun.
    for (const key of ["mobileMonth", "mobileMetric", "mobileIncomeMetric", "mobileExpenseMetric", "mobileBalanceMetric"]) {
      query.delete(key);
    }
    router.push(`${pathname}?${query.toString()}`);
  };

  return (
    <>
      <MonthRangePicker
        min={min}
        max={max}
        from={from}
        to={to}
        current={current}
        pendingRange={pendingRange}
        onCommit={changeRange}
        disabled={pendingRange !== null}
      />
      <div className={styles.body}>
      {pendingRange ? (
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          <span className="sr-only">Chargement du relevé</span>
          <Skeleton className="h-3.5 w-56" />
          <SqueletteGrilleHistorique />
        </div>
      ) : children}
      </div>
    </>
  );
}
