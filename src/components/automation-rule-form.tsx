"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  validateRule,
  type AutomationRule,
  type RuleInput,
} from "@/lib/automation";
import type { GroupRow } from "@/db/repositories/groups";
import styles from "./automation.module.css";
export type RuleAccount = { id: string; name: string };
export function AutomationRuleForm({
  accounts,
  groups,
  rule,
  busy,
  onSave,
  onCancel,
  onError,
}: {
  accounts: RuleAccount[];
  groups: GroupRow[];
  rule?: AutomationRule;
  busy: boolean;
  onSave: (value: RuleInput) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const [accountId, setAccountId] = useState(
    rule?.accountId ?? accounts[0]?.id ?? "",
  );
  const [direction, setDirection] = useState<"out" | "in">(
    rule?.direction ?? "out",
  );
  const [target, setTarget] = useState(
    rule ? `${rule.groupId}:${rule.lineId ?? ""}` : "",
  );
  const destinations = groups.filter(
    (g) =>
      g.accountId === accountId &&
      (direction === "in" || g.direction === "out"),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = (key: string) => {
      const raw = String(data.get(key) ?? "").trim();
      return raw === ""
        ? null
        : /^\d+(?:[.,]\d{1,2})?$/.test(raw)
          ? Number(raw.replace(",", "."))
          : NaN;
    };
    const [groupId, lineId] = target.split(":");
    try {
      onSave(
        validateRule({
          accountId,
          label: String(data.get("label") ?? ""),
          direction,
          minAmount: amount("min"),
          maxAmount: amount("max"),
          groupId: Number(groupId),
          lineId: lineId ? Number(lineId) : null,
        }),
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Vérifiez les champs de la règle.",
      );
    }
  }
  return (
    <form
      onSubmit={submit}
      className={styles.editor}
      aria-label={rule ? "Modifier la règle" : "Nouvelle règle"}
    >
      <h2>{rule ? "Modifier la règle" : "Nouvelle règle"}</h2>
      <p>Choisissez ce que Planora doit reconnaître et le budget à utiliser.</p>
      <fieldset disabled={busy}>
        <div className={styles.flow}>
          <div className={styles.condition}>
            <h3>Quand une opération correspond</h3>
            <label className={styles.field}>
              Sur le compte
              <select
                value={accountId}
                disabled={!!rule}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setTarget("");
                }}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.pair}>
              <label className={styles.field}>
                Type d’opération
                <select
                  value={direction}
                  onChange={(e) => {
                    setDirection(e.target.value as "in" | "out");
                    setTarget("");
                  }}
                >
                  <option value="out">Dépense</option>
                  <option value="in">Entrée d’argent</option>
                </select>
              </label>
              <label className={styles.field}>
                Le libellé contient
                <input
                  name="label"
                  defaultValue={rule?.label}
                  placeholder="Ex. Carrefour"
                  required
                  minLength={2}
                  maxLength={100}
                  autoFocus
                  aria-describedby="rule-label-help"
                />
              </label>
            </div>
            <p id="rule-label-help" className={styles.hint}>
              Majuscules et accents n’ont pas d’importance.
            </p>
            <div className={styles.pair}>
              <label className={styles.field}>
                Montant minimum (€)
                <input
                  name="min"
                  inputMode="decimal"
                  placeholder="Sans minimum"
                  defaultValue={rule?.minAmount ?? ""}
                />
              </label>
              <label className={styles.field}>
                Montant maximum (€)
                <input
                  name="max"
                  inputMode="decimal"
                  placeholder="Sans maximum"
                  defaultValue={rule?.maxAmount ?? ""}
                />
              </label>
            </div>
            <p className={styles.hint}>
              Facultatif. Saisissez des montants positifs. Pour un montant
              exact, indiquez le même minimum et maximum.
            </p>
          </div>
          <ArrowRight className={styles.flowArrow} aria-hidden="true" />
          <div className={styles.destination}>
            <h3>La rattacher à ce budget</h3>
            <label className={styles.field}>
              Budget ou sous-poste
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              >
                <option value="">Choisir un budget</option>
                {destinations.flatMap((g) =>
                  g.lines.length
                    ? g.lines.map((l) => (
                        <option
                          key={`${g.id}:${l.id}`}
                          value={`${g.id}:${l.id}`}
                        >
                          {g.name} · {l.name}
                        </option>
                      ))
                    : [
                        <option key={g.id} value={`${g.id}:`}>
                          {g.name}
                        </option>,
                      ],
                )}
              </select>
            </label>
            <p className={styles.hint}>
              {destinations.length
                ? "Seuls les budgets du compte choisi sont proposés. Leurs dates de début et de fin sont respectées."
                : "Créez d’abord un budget pour ce compte dans la Vue d’ensemble."}
            </p>
            <p className={styles.notificationHint}>
              Chaque rattachement apparaîtra dans vos notifications.
            </p>
          </div>
        </div>
        <div className={styles.formFooter}>
          <p>
            Les prochaines opérations seront traitées automatiquement. Pour les
            anciennes, vous verrez un aperçu avant d’agir.
          </p>
          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={!destinations.length}>
              {busy ? "Enregistrement…" : "Enregistrer la règle"}
            </Button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
