"use client";
import Link from "next/link";
import { Link2, Undo2 } from "lucide-react";
import type { AutomationNotification } from "@/lib/notifications";
import {
  dismissNotification,
  restoreNotifications,
} from "@/app/app/notifications-actions";
import { useMiseAJour } from "./mise-a-jour";
import { Button } from "./ui/button";
import { ruleMoney } from "./automation-rule-row";
import styles from "./automation.module.css";
export function AutomationNotice({
  notice: n,
  onDone,
  onRestore,
  onNavigate,
}: {
  notice: AutomationNotification;
  onDone: () => void;
  onRestore: () => void;
  onNavigate: () => void;
}) {
  const { pendant, enCours } = useMiseAJour();
  return (
    <div className={`${styles.notice} ${n.seen ? styles.noticeSeen : ""}`}>
      <p className={styles.noticeTitle}>
        <Link2 aria-hidden="true" />
        Rattachement automatique
      </p>
      <p>
        {n.label} · {ruleMoney.format(n.amount)}
      </p>
      <p>
        Budget : <strong>{n.name}</strong>
      </p>
      <p className={styles.noticeMeta}>
        {n.accountName} ·{" "}
        {new Date(`${n.date}T12:00:00`).toLocaleDateString("fr-FR")}
        <br />
        Règle « {n.ruleLabel} »
      </p>
      <div className={styles.noticeActions}>
        <Link href="/app/transactions" onClick={onNavigate}>
          Voir les transactions
        </Link>
        <Button
          size="sm"
          variant="ghost"
          disabled={enCours}
          onClick={() => {
            if (n.seen) {
              onRestore();
              pendant(() => restoreNotifications([n.id]));
            } else {
              onDone();
              pendant(() => dismissNotification(n.id));
            }
          }}
        >
          {n.seen ? (
            <>
              <Undo2 aria-hidden="true" />
              Non vu
            </>
          ) : (
            "Vu"
          )}
        </Button>
      </div>
    </div>
  );
}
