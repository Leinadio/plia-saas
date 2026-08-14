"use client";
import { Trash2 } from "lucide-react";
import type { TxnView } from "@/db/repositories/transactions";
import { removeTransaction } from "@/app/app/transactions/actions";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { Button } from "@/components/ui/button";
import { useMiseAJour } from "@/components/mise-a-jour";

type AccountOpt = { id: string; label: string };
type GroupOpt = { id: number; name: string; accountId: string; direction: "in" | "out" };

export function ManualTxnActions({ txn, accounts, groups }: { txn: TxnView; accounts: AccountOpt[]; groups: GroupOpt[] }) {
  const { pendant, enCours: isPending } = useMiseAJour();
  return (
    <span className="inline-flex items-center gap-1">
      <AddTransactionSheet
        accounts={accounts}
        groups={groups}
        edit={{
          id: txn.id, accountId: txn.accountId, date: txn.date,
          direction: txn.amount >= 0 ? "in" : "out", amount: txn.amount,
          label: txn.label, groupId: txn.groupId,
        }}
      />
      <Button variant="ghost" size="sm" disabled={isPending}
        onClick={() => pendant(() => removeTransaction(txn.id))}>
        <Trash2 className="size-4" />
      </Button>
    </span>
  );
}
