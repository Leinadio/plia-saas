"use client";
import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { ruleMoney } from "./automation-rule-row";
import type { RulePreview } from "@/lib/automation-service";
import styles from "./automation.module.css";
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
export function AutomationPreview({
  data,
  target,
  busy,
  onClose,
  onApply,
}: {
  data: RulePreview;
  target: string;
  busy: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const count = data.transactions.length;
  return (
    <section className={styles.preview} aria-label="Aperçu des correspondances">
      <h2 ref={heading} tabIndex={-1}>
        Avant d’appliquer
      </h2>
      <p>
        {count === 0
          ? "Aucune opération sans budget ne correspond actuellement à cette règle."
          : `${count} opération${count > 1 ? "s" : ""} sans budget vers « ${target} ».`}
      </p>
      <p className={styles.hint}>
        Les opérations déjà rattachées, exclues ou ignorées restent inchangées.
      </p>
      {data.hasMore && (
        <p className={styles.hint}>
          Aperçu limité aux 200 premières correspondances. Après application,
          relancez l’aperçu pour traiter les suivantes.
        </p>
      )}
      <ul className={styles.previewList}>
        {data.transactions.map((t) => (
          <li key={t.id}>
            <div>
              <strong>{t.label}</strong>
              <span>
                {DATE.format(new Date(`${t.date}T12:00:00`))}
                {t.budgetMonth ? ` · Budget ${t.budgetMonth}` : ""}
              </span>
            </div>
            <span>{ruleMoney.format(t.amount)}</span>
          </li>
        ))}
      </ul>
      <div className={styles.previewFooter}>
        <p>
          <Bell aria-hidden="true" />
          Une notification pour chaque rattachement.
        </p>
        <div className={styles.actions}>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Fermer l’aperçu
          </Button>
          {count > 0 && (
            <Button disabled={busy} onClick={onApply}>
              {busy
                ? "Rattachement…"
                : `Rattacher ${count} transaction${count > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
