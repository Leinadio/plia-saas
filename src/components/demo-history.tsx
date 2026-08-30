"use client";

import { HistoryWithDetail } from "@/components/history-with-detail";
import { MonthRangePicker } from "@/components/month-range-picker";
import { useDemoExperience } from "@/components/demo-experience-provider";
import { DEMO_IDS } from "@/lib/demo-finances";

export function DemoHistory() {
  const { dispatch, projection } = useDemoExperience();
  const { history } = projection;

  return (
    <div className="flex flex-col gap-4">
      <div data-onboarding-target="demo-account" className="w-fit rounded-lg border px-3 py-2 text-sm font-semibold">
        Compte Démo
      </div>
      <div data-onboarding-target="overview-period">
        <MonthRangePicker
          min={history.stripMin}
          max={history.stripMax}
          from={history.months[0]}
          to={history.months[history.months.length - 1]}
          current={history.currentMonth}
        />
      </div>
      <HistoryWithDetail
        {...history}
        onboarding={{
          budgetGroupId: DEMO_IDS.transport,
          detailGroupId: DEMO_IDS.courses,
          month: history.currentMonth,
          timeTarget: "overview-time",
          incomeTarget: "overview-income",
          expensesTarget: "overview-expenses",
          budgetTarget: "adjust-transport",
          detailTarget: "open-amount-detail",
          endingBalanceTarget: "overview-ending-balance",
          onDetailOpened: () => dispatch({ type: "DETAIL_OPENED" }),
        }}
      />
    </div>
  );
}
