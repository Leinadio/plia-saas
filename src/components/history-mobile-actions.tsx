"use client";

import type { RefObject } from "react";
import type { GroupManageInfo, LineManageInfo } from "@/lib/history-explain";
import { groupPeriodLabel } from "@/lib/group-period-label";
import { Sheet } from "@/components/ui/sheet";
import { HistoryMobileSheetContent } from "@/components/history-mobile-sheet";
import { NewGroupInline } from "@/components/new-group-inline";
import { NewLineInline } from "@/components/new-line-inline";
import { GroupManageBlock } from "@/components/history-blocks/group-manage-block";
import { LineManageBlock } from "@/components/history-blocks/line-manage-block";

export type HistoryMobileAction = { direction: "in" | "out" } & (
  | { kind: "new-group"; month: string }
  | { kind: "new-line"; month: string; groupId: number; name: string }
  | { kind: "manage-group"; info: GroupManageInfo }
  | { kind: "manage-line"; info: LineManageInfo }
);

export function HistoryMobileActions({ action, open, onClose, trigger, accountId, stripMin, stripMax }: {
  action: HistoryMobileAction | null;
  open: boolean;
  onClose: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
  accountId: string;
  stripMin: string;
  stripMax: string;
}) {
  if (!action) return null;
  const creating = action.kind === "new-group" || action.kind === "new-line";
  const title = action.kind === "new-group" ? (action.direction === "in" ? "Ajouter un revenu" : "Ajouter une enveloppe")
    : action.kind === "new-line" ? "Ajouter une sous-enveloppe" : action.info.name;
  const description = action.kind === "new-group" ? "Indiquez son nom, son montant et sa durée."
    : action.kind === "new-line" ? `Dans ${action.name}` : groupPeriodLabel(action.info.startMonth, action.info.endMonth);
  return <Sheet open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <HistoryMobileSheetContent title={title} description={description} section={action.direction === "in" ? "income" : "expense"}
      onCloseAutoFocus={event => { event.preventDefault(); if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); }}>
      <div className={creating ? "history-mobile-form" : "history-mobile-management"}>
        {action.kind === "new-group" && <NewGroupInline accountId={accountId} direction={action.direction} planned
          stripMin={stripMin} stripMax={stripMax} defaultMonth={action.month} onDone={onClose} />}
        {action.kind === "new-line" && <NewLineInline groupId={action.groupId}
          stripMin={stripMin} stripMax={stripMax} defaultMonth={action.month} onDone={onClose} />}
        {action.kind === "manage-group" && <GroupManageBlock info={action.info} onClose={onClose} inline />}
        {action.kind === "manage-line" && <LineManageBlock info={action.info} onClose={onClose} inline />}
      </div>
    </HistoryMobileSheetContent>
  </Sheet>;
}
