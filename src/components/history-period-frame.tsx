"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MonthRangePicker } from "@/components/month-range-picker";
import { SqueletteGrilleHistorique } from "@/components/squelettes";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [pendingRange, setPendingRange] = useState<Range | null>(null);

  const changeRange = (nextFrom: string, nextTo: string) => {
    setPendingRange({ from: nextFrom, to: nextTo });
    router.push(`${pathname}?from=${nextFrom}&to=${nextTo}`);
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
      {pendingRange ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3.5 w-56" />
          <SqueletteGrilleHistorique />
        </div>
      ) : children}
    </>
  );
}
