"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutomationRuleForm, type RuleAccount } from "./automation-rule-form";
import { AutomationRuleRow } from "./automation-rule-row";
import { AutomationPreview } from "./automation-preview";
import type { AutomationRule, RuleInput } from "@/lib/automation";
import type { RulePreview } from "@/lib/automation-service";
import type { GroupRow } from "@/db/repositories/groups";
import {
  saveAutomationRule,
  previewAutomationRule,
  applyAutomationPreview,
  toggleAutomationRule,
  removeAutomationRule,
} from "@/app/app/automatisations/actions";
import styles from "./automation.module.css";
const defaultActions = {
  save: saveAutomationRule,
  preview: previewAutomationRule,
  apply: applyAutomationPreview,
  toggle: toggleAutomationRule,
  remove: removeAutomationRule,
};
export type AutomationActions = typeof defaultActions;
export function AutomationPanel({
  accounts,
  groups,
  initialRules,
  demo = false,
  actions = defaultActions,
}: {
  accounts: RuleAccount[];
  groups: GroupRow[];
  initialRules: AutomationRule[];
  demo?: boolean;
  actions?: AutomationActions;
}) {
  const [rules, setRules] = useState(initialRules),
    [editing, setEditing] = useState<AutomationRule | "new" | null>(null);
  const [preview, setPreview] = useState<{
      rule: AutomationRule;
      data: RulePreview;
    } | null>(null),
    [deleting, setDeleting] = useState<number | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const guard = useRef(false),
    alert = useRef<HTMLParagraphElement>(null),
    createButton = useRef<HTMLButtonElement>(null);
  function reportError(text: string) {
    setError(text);
    requestAnimationFrame(() => alert.current?.focus());
  }
  async function run(work: () => Promise<void>) {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch {
      reportError(
        "Impossible de terminer cette action. Réessayez dans un instant.",
      );
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  const focusPreviewButton = (id: number) =>
    requestAnimationFrame(() =>
      document.getElementById(`preview-rule-${id}`)?.focus(),
    );
  const target = (r: AutomationRule) => {
    const g = groups.find((g) => g.id === r.groupId);
    const l = g?.lines.find((l) => l.id === r.lineId);
    return g ? (l ? `${g.name} · ${l.name}` : g.name) : "Budget indisponible";
  };
  function showPreview(rule: AutomationRule) {
    void run(async () => {
      const result = await actions.preview(rule.id);
      if (!result.ok) return reportError(result.error);
      setPreview({ rule, data: result.data });
      setEditing(null);
    });
  }
  function save(input: RuleInput) {
    void run(async () => {
      const previous = editing === "new" ? undefined : (editing ?? undefined);
      const result = await actions.save(
        input,
        previous?.id,
        previous?.revision,
      );
      if (!result.ok) return reportError(result.error);
      setRules((cur) =>
        previous
          ? cur.map((r) => (r.id === previous.id ? result.data : r))
          : [...cur, result.data],
      );
      setEditing(null);
      setPreview(null);
      setMessage(
        "Règle enregistrée. Les prochaines opérations seront traitées automatiquement. Vous pouvez maintenant voir les correspondances déjà présentes.",
      );
      focusPreviewButton(result.data.id);
    });
  }
  function toggle(r: AutomationRule) {
    void run(async () => {
      const result = await actions.toggle(r.id, !r.enabled);
      if (!result.ok) return reportError(result.error);
      setRules((cur) =>
        cur.map((it) =>
          it.id === r.id
            ? { ...it, enabled: !r.enabled, revision: it.revision + 1 }
            : it,
        ),
      );
      setPreview(null);
      setEditing(null);
      setMessage(
        r.enabled
          ? "Règle en pause. Les opérations déjà rattachées restent dans leur budget."
          : "Règle réactivée pour les prochaines opérations.",
      );
    });
  }
  function remove(r: AutomationRule) {
    void run(async () => {
      const result = await actions.remove(r.id);
      if (!result.ok) return reportError(result.error);
      setRules((cur) => cur.filter((it) => it.id !== r.id));
      setDeleting(null);
      setPreview(null);
      if (editing !== "new" && editing?.id === r.id) setEditing(null);
      setMessage("Règle supprimée.");
      requestAnimationFrame(() => createButton.current?.focus());
    });
  }
  function apply() {
    if (!preview) return;
    void run(async () => {
      const result = await actions.apply(
        preview.rule.id,
        preview.data.revision,
        preview.data.transactions.map((t) => t.id),
      );
      if (!result.ok) return reportError(result.error);
      setPreview(null);
      setMessage(
        result.data === 0
          ? "Aucune transaction rattachée : les correspondances ont changé. Relancez l’aperçu."
          : `${result.data} transaction${result.data > 1 ? "s" : ""} rattachée${result.data > 1 ? "s" : ""}. Retrouvez ${result.data > 1 ? "leurs notifications" : "sa notification"} dans la cloche.`,
      );
      focusPreviewButton(preview.rule.id);
    });
  }
  return (
    <div className={styles.page} aria-busy={busy}>
      <div className={styles.toolbar}>
        <p>
          Un libellé, un montant, le bon budget.
          <br />
          Définissez une règle et Planora s’occupe des prochaines opérations.
        </p>
        {!demo && accounts.length > 0 && (
          <Button
            ref={createButton}
            disabled={busy || editing !== null}
            onClick={() => {
              setEditing("new");
              setPreview(null);
              setError("");
              setMessage("");
            }}
          >
            <Plus aria-hidden="true" />
            Nouvelle règle
          </Button>
        )}
      </div>
      <p role="status" className={message ? styles.success : styles.silent}>
        {message}
      </p>
      {error && (
        <p ref={alert} tabIndex={-1} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {demo ? (
        <div className={styles.empty}>
          <h2>Des règles pour vos vrais comptes</h2>
          <p>
            Quittez la démonstration avec le bouton Démo pour créer vos règles.
            Vos opérations de démonstration restent inchangées.
          </p>
          <div className={styles.example}>
            <span>Libellé contenant « Carrefour »</span>
            <ArrowRight aria-hidden="true" />
            <strong>Budget Courses</strong>
          </div>
          <p className={styles.hint}>Exemple de règle.</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className={styles.empty}>
          <h2>Ajoutez d’abord un compte</h2>
          <p>Vos règles relient les opérations d’un compte à ses budgets.</p>
          <Button asChild>
            <Link href="/app/settings">Gérer mes comptes</Link>
          </Button>
        </div>
      ) : (
        <>
          {editing && (
            <AutomationRuleForm
              key={editing === "new" ? "new" : editing.id}
              accounts={accounts}
              groups={groups}
              rule={editing === "new" ? undefined : editing}
              busy={busy}
              onSave={save}
              onError={reportError}
              onCancel={() => {
                setEditing(null);
                setError("");
                requestAnimationFrame(() => createButton.current?.focus());
              }}
            />
          )}
          {rules.length === 0 && !editing ? (
            <div className={styles.empty}>
              <h2>Vos opérations répétitives ont leur place.</h2>
              <p>
                Créez votre première règle pour ne plus choisir le même budget à
                chaque fois.
              </p>
              <div className={styles.example}>
                <span>Libellé contenant « Carrefour »</span>
                <ArrowRight aria-hidden="true" />
                <strong>Budget Courses</strong>
              </div>
              <p className={styles.hint}>
                Exemple. Vous choisirez vos propres critères et votre budget.
              </p>
            </div>
          ) : (
            rules.length > 0 && (
              <section className={styles.rules} aria-label="Vos règles">
                <div className={styles.listHeading}>
                  <h2>
                    Vos règles <span>{rules.length}</span>
                  </h2>
                  <p>
                    En cas de correspondances multiples, la première règle de
                    cette liste est prioritaire.
                  </p>
                </div>
                <ol className={styles.ruleList}>
                  {rules.map((r) => (
                    <AutomationRuleRow
                      key={r.id}
                      rule={r}
                      accountName={
                        accounts.find((a) => a.id === r.accountId)?.name ?? ""
                      }
                      target={target(r)}
                      busy={busy}
                      deleting={deleting === r.id}
                      onPreview={() => showPreview(r)}
                      onEdit={() => {
                        setEditing(r);
                        setPreview(null);
                        setError("");
                        setMessage("");
                      }}
                      onToggle={() => toggle(r)}
                      onDelete={() => setDeleting(r.id)}
                      onConfirmDelete={() => remove(r)}
                      onCancelDelete={() => setDeleting(null)}
                    />
                  ))}
                </ol>
              </section>
            )
          )}
          {preview && (
            <AutomationPreview
              key={preview.rule.id}
              data={preview.data}
              target={target(preview.rule)}
              busy={busy}
              onClose={() => {
                setPreview(null);
                focusPreviewButton(preview.rule.id);
              }}
              onApply={apply}
            />
          )}
        </>
      )}
      <p className={styles.footnote}>
        <Bell aria-hidden="true" />
        Les règles s’appliquent aux nouvelles opérations comptabilisées et aux
        nouvelles saisies sans budget. Chaque rattachement est signalé dans vos
        notifications.
      </p>
    </div>
  );
}
