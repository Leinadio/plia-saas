"use client";

import { TransactionsBrowser } from "@/components/transactions-browser";
import { useDemoExperience } from "@/components/demo-experience-provider";
import { DEMO_IDS } from "@/lib/demo-finances";

export function DemoTransactions() {
  const { projection, dispatch } = useDemoExperience();

  return (
    <TransactionsBrowser
      transactions={projection.transactions}
      groups={projection.history.groups.map((group) => ({
        ...group,
        accountId: projection.account.id,
      }))}
      accounts={[{ id: projection.account.id, label: projection.account.name }]}
      demo={{
        targetTransactionId: DEMO_IDS.monoprix,
        onCategorize: (transactionId, groupId) => {
          if (transactionId === DEMO_IDS.monoprix && groupId === DEMO_IDS.courses) {
            dispatch({ type: "MONOPRIX_CATEGORIZED" });
          }
        },
      }}
    />
  );
}
