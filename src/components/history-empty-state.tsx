"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  House,
  Plane,
  Plus,
  Ticket,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewGroupInline } from "@/components/new-group-inline";
import styles from "./history-empty-state.module.css";

const ideas = [
  {
    label: "Mon logement",
    name: "Logement",
    description: "Les dépenses essentielles",
    Icon: House,
  },
  {
    label: "Mes loisirs",
    name: "Sorties et loisirs",
    description: "Une place pour en profiter",
    Icon: Ticket,
  },
  {
    label: "Un voyage",
    name: "Vacances",
    description: "Un projet à préparer",
    Icon: Plane,
  },
];

export function HistoryEmptyState({
  accountId,
  balance,
  stripMin,
  stripMax,
  month,
}: {
  accountId: string;
  balance: number;
  stripMin: string;
  stripMax: string;
  month: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState<{
    direction: "in" | "out";
    name: string;
  } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (draft)
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="name"]')
        ?.focus();
  }, [draft]);
  const start = (
    trigger: HTMLButtonElement,
    direction: "in" | "out",
    name = "",
  ) => {
    triggerRef.current = trigger;
    setDraft({ direction, name });
  };
  const close = () => {
    setDraft(null);
    triggerRef.current?.focus();
  };

  return (
    <section className={styles.empty} aria-labelledby={`${id}-heading`}>
      <div className={styles.intro}>
        <Wallet className={styles.symbol} aria-hidden />
        <h2 id={`${id}-heading`}>
          Faites une place
          <br />
          <span>à ce qui compte.</span>
        </h2>
        <p>
          Votre compte est prêt. Choisissez une dépense ou un projet, donnez-lui
          un budget. Vous pourrez ensuite suivre le prévu, le dépensé et ce
          qu’il reste.
        </p>
        <div className={styles.actions}>
          <Button
            aria-expanded={draft?.direction === "out"}
            aria-controls={`${id}-form`}
            onClick={(event) => start(event.currentTarget, "out")}
          >
            <Plus aria-hidden /> Créer mon premier budget
          </Button>
          <Button
            variant="outline"
            aria-expanded={draft?.direction === "in"}
            aria-controls={`${id}-form`}
            onClick={(event) => start(event.currentTarget, "in")}
          >
            <ArrowDownLeft aria-hidden /> Commencer par un revenu
          </Button>
        </div>
      </div>

      <div
        className={styles.ideas}
        aria-label="Des idées pour votre premier budget"
      >
        <p>Un point de départ, selon vos envies.</p>
        <div className={styles.suggestions}>
          {ideas.map(({ label, name, description, Icon }) => (
            <button
              type="button"
              key={name}
              aria-controls={`${id}-form`}
              aria-expanded={draft?.direction === "out" && draft.name === name}
              onClick={(event) => start(event.currentTarget, "out", name)}
            >
              <Icon aria-hidden />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <Plus aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div
        id={`${id}-form`}
        ref={formRef}
        hidden={!draft}
        className={styles.creation}
      >
        {draft && (
          <>
            <h3>
              {draft.direction === "in"
                ? "Votre premier revenu"
                : "Votre premier budget"}
            </h3>
            <p>
              Un nom, un montant, une période. Vous pourrez les ajuster ensuite.
            </p>
            <NewGroupInline
              key={`${draft.direction}:${draft.name}`}
              accountId={accountId}
              direction={draft.direction}
              defaultName={draft.name}
              stripMin={stripMin}
              stripMax={stripMax}
              defaultMonth={month}
              onDone={close}
            />
          </>
        )}
      </div>

      <div className={styles.balance}>
        <div>
          <span>Trésorerie actuelle</span>
          <strong>
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(balance)}
          </strong>
        </div>
        <Link href="/app/transactions">
          Voir mes transactions <ArrowUpRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
