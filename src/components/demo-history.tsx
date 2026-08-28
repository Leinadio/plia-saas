"use client";

import { HistoryWithDetail } from "@/components/history-with-detail";
import { MonthRangePicker } from "@/components/month-range-picker";
import { useDemoExperience } from "@/components/demo-experience-provider";
import { DEMO_IDS } from "@/lib/demo-finances";

export function DemoHistory() {
  const { projection } = useDemoExperience();
  const { history } = projection;

  return (
    <div className="flex flex-col gap-4">
      <MonthRangePicker
        min={history.stripMin}
        max={history.stripMax}
        from={history.months[0]}
        to={history.months[history.months.length - 1]}
        current={history.currentMonth}
      />
      <HistoryWithDetail
        {...history}
        onboarding={{
          budgetGroupId: DEMO_IDS.transport,
          budgetMonth: history.currentMonth,
          budgetTarget: "adjust-transport",
          monthsTarget: "month-continuity",
        }}
      />
    </div>
  );
}
