"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import styles from "./public-accordion.module.css";

export function PublicAccordion({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={styles.item} data-open={open}>
      <h3 className={styles.heading}>
        <button
          type="button"
          id={`${id}-question`}
          aria-expanded={open}
          aria-controls={`${id}-answer`}
          onClick={() => setOpen(!open)}
        >
          {question}
          <Plus aria-hidden />
        </button>
      </h3>
      <div
        id={`${id}-answer`}
        role="region"
        aria-labelledby={`${id}-question`}
        aria-hidden={!open}
        inert={!open}
        className={styles.answer}
      >
        <div className={styles.clip}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}
