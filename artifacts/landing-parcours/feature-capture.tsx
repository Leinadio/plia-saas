"use client";

import { useEffect, useState } from "react";
import { HistoryWithDetail } from "@/components/history-with-detail";
import { captureHistory } from "./capture-history";
import type { CaptureBudgetInput } from "./capture-budget-action";
import {
  DemoExperienceProvider,
  useDemoExperience,
} from "@/components/demo-experience-provider";
import { DetailSidebarProvider } from "@/components/detail-sidebar";
import { CalculatriceProvider } from "@/components/calculatrice";
import { MiseAJourProvider } from "@/components/mise-a-jour";
import { TransactionsBrowser } from "@/components/transactions-browser";
import {
  AutomationPanel,
  type AutomationActions,
} from "@/components/automation-panel";
import { freshTourVisit } from "@/lib/onboarding-tour";
import type { AutomationRule } from "@/lib/automation";

const rule: AutomationRule = {
  id: 1,
  revision: 1,
  enabled: true,
  accountId: "capture-account",
  label: "Carrefour",
  direction: "out",
  minAmount: 10,
  maxAmount: 150,
  groupId: 1,
  lineId: null,
};
const transactions = [
  {
    id: "capture-1",
    label: "CARREFOUR CITY",
    amount: -42.5,
    date: "2026-09-12",
    budgetMonth: null,
    accountId: "capture-account",
  },
  {
    id: "capture-2",
    label: "CARREFOUR MARKET",
    amount: -86.2,
    date: "2026-09-16",
    budgetMonth: null,
    accountId: "capture-account",
  },
];
// Production UI with fixture-only responses. Never calls a banking or persistence service.
const actions: AutomationActions = {
  save: async (input) => ({ ok: true, data: { ...rule, ...input } }),
  preview: async () => ({
    ok: true,
    data: { revision: 1, hasMore: false, transactions },
  }),
  apply: async () => ({ ok: true, data: 2 }),
  toggle: async () => ({ ok: true, data: undefined }),
  remove: async () => ({ ok: true, data: undefined }),
};
function BudgetScene() {
  const { projection } = useDemoExperience();
  const [added, setAdded] = useState<CaptureBudgetInput[]>([]);
  useEffect(() => {
    const create = (event: Event) =>
      setAdded((items) => [
        ...items,
        (event as CustomEvent<CaptureBudgetInput>).detail,
      ]);
    window.addEventListener("capture-budget-created", create);
    return () => window.removeEventListener("capture-budget-created", create);
  }, []);
  return (
    <HistoryWithDetail
      {...captureHistory(projection.history.currentMonth, added)}
    />
  );
}
function TransactionScene() {
  const { projection } = useDemoExperience();
  return (
    <TransactionsBrowser
      transactions={projection.transactions}
      groups={projection.history.groups.map((g) => ({
        ...g,
        accountId: projection.account.id,
      }))}
      accounts={[{ id: projection.account.id, label: "Compte Démo" }]}
    />
  );
}
export function FeatureCapture({ scene }: { scene: string }) {
  const visit = freshTourVisit();
  visit.tour.finished = true;
  visit.tour.paused = true;
  return (
    <DemoExperienceProvider mode="replay-demo" initialVisit={visit}>
      <CalculatriceProvider>
        <DetailSidebarProvider>
          <MiseAJourProvider>
            <main
              className="h-svh overflow-auto bg-background p-4"
              data-capture-scene={scene}
            >
              {["budgets", "previsions", "depassements"].includes(scene) ? (
                <BudgetScene />
              ) : scene === "transactions" ? (
                <TransactionScene />
              ) : scene === "automatisation" ? (
                <AutomationPanel
                  accounts={[{ id: "capture-account", name: "Compte Démo" }]}
                  groups={[
                    {
                      id: 1,
                      accountId: "capture-account",
                      name: "Courses",
                      direction: "out",
                      monthlyAmount: 350,
                      startMonth: null,
                      endMonth: null,
                      planned: true,
                      lines: [],
                    },
                  ]}
                  initialRules={[rule]}
                  actions={actions}
                />
              ) : null}
            </main>
          </MiseAJourProvider>
        </DetailSidebarProvider>
      </CalculatriceProvider>
    </DemoExperienceProvider>
  );
}
