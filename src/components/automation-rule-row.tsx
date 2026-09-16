"use client";
import { ArrowRight, Check, Pause, Play, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import type { AutomationRule } from "@/lib/automation";
import styles from "./automation.module.css";
export const ruleMoney = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
function amountLabel(r: AutomationRule) {
  if (r.minAmount !== null && r.minAmount === r.maxAmount)
    return ruleMoney.format(r.minAmount);
  if (r.minAmount !== null && r.maxAmount !== null)
    return `de ${ruleMoney.format(r.minAmount)} à ${ruleMoney.format(r.maxAmount)}`;
  if (r.minAmount !== null)
    return `à partir de ${ruleMoney.format(r.minAmount)}`;
  if (r.maxAmount !== null) return `jusqu’à ${ruleMoney.format(r.maxAmount)}`;
  return "Tout montant";
}
export function AutomationRuleRow({
  rule: r,
  accountName,
  target,
  busy,
  deleting,
  onPreview,
  onEdit,
  onToggle,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  rule: AutomationRule;
  accountName: string;
  target: string;
  busy: boolean;
  deleting: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <li className={styles.rule}>
      <div className={styles.ruleMain}>
        <div className={styles.ruleCriteria}>
          <p className={styles.ruleTitle}>Le libellé contient « {r.label} »</p>
          <p>
            {accountName} ·{" "}
            {r.direction === "out" ? "Dépense" : "Entrée d’argent"} ·{" "}
            {amountLabel(r)}
          </p>
        </div>
        <ArrowRight className={styles.ruleArrow} aria-hidden="true" />
        <div className={styles.ruleTarget}>
          <strong>{target}</strong>
          <span className={r.enabled ? styles.active : styles.paused}>
            {r.enabled ? (
              <Check aria-hidden="true" />
            ) : (
              <Pause aria-hidden="true" />
            )}
            {r.enabled ? "Active" : "En pause"}
          </span>
        </div>
      </div>
      <div className={styles.ruleFooter}>
        <button
          type="button"
          id={`preview-rule-${r.id}`}
          className={styles.textButton}
          disabled={busy || !r.enabled}
          onClick={onPreview}
        >
          Voir les correspondances
        </button>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.smallButton}
            disabled={busy}
            onClick={onEdit}
          >
            <Pencil aria-hidden="true" />
            Modifier
          </button>
          <button
            type="button"
            className={styles.smallButton}
            disabled={busy}
            onClick={onToggle}
          >
            {r.enabled ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            {r.enabled ? "Mettre en pause" : "Réactiver"}
          </button>
          <button
            type="button"
            className={styles.smallButton}
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" />
            Supprimer
          </button>
        </div>
      </div>
      {deleting && (
        <div className={styles.deleteConfirm}>
          <p>
            Supprimer cette règle ? Les opérations déjà rattachées resteront
            dans leur budget.
          </p>
          <div className={styles.actions}>
            <Button variant="ghost" disabled={busy} onClick={onCancelDelete}>
              Garder la règle
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={onConfirmDelete}
            >
              Confirmer la suppression
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
