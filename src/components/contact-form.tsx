"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, ChevronDown, Mail } from "lucide-react";
import { CONTACT_SUBJECTS } from "@/lib/contact/input";
import styles from "./contact.module.css";

type Props = {
  initialEmail?: string;
  source: "landing" | "application";
  available?: boolean;
};
export function ContactForm({
  initialEmail = "",
  source,
  available = false,
}: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const statusHeading = useRef<HTMLHeadingElement>(null);
  const errorText = useRef<HTMLParagraphElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (sentTo !== null) statusHeading.current?.focus();
  }, [sentTo]);
  useEffect(() => {
    if (error) errorText.current?.focus();
  }, [error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || sending.current) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          subject: data.get("subject"),
          message: data.get("message"),
          website: data.get("website"),
          source,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true)
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : "L’envoi n’a pas abouti. Réessayez dans un instant.",
        );
      setSentTo(email);
    } catch (cause) {
      setError(
        cause instanceof Error &&
          !["TimeoutError", "TypeError"].includes(cause.name)
          ? cause.message
          : "La connexion a été interrompue. Votre message reste ici : vous pouvez réessayer.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (sentTo !== null)
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>
          <Check aria-hidden="true" />
        </span>
        <h3 tabIndex={-1} ref={statusHeading}>
          Votre message a bien été envoyé.
        </h3>
        <p>
          Merci de nous avoir écrit. Nous pourrons vous répondre à{" "}
          <strong>{sentTo}</strong>.
        </p>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            setSentTo(null);
            requestAnimationFrame(() => emailInput.current?.focus());
          }}
        >
          Écrire un autre message <ArrowUpRight aria-hidden="true" />
        </button>
      </div>
    );

  return (
    <form
      className={styles.form}
      onSubmit={submit}
      aria-label="Contacter Planora"
      aria-busy={busy}
    >
      {!available && (
        <p className={styles.availability} id={id + "-availability"}>
          <Mail aria-hidden="true" />
          <span>
            Le contact par e-mail est en cours d’activation. Vous pourrez
            bientôt nous écrire ici.
          </span>
        </p>
      )}
      <fieldset
        disabled={busy || !available}
        aria-describedby={!available ? id + "-availability" : undefined}
      >
        <legend className={styles.srOnly}>Votre message à Planora</legend>
        <div className={styles.field}>
          <label htmlFor={id + "-email"}>Votre adresse e-mail</label>
          <input
            id={id + "-email"}
            ref={emailInput}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            defaultValue={initialEmail}
            placeholder="vous@exemple.fr"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={id + "-subject"}>
            De quoi souhaitez-vous parler ?
          </label>
          <div className={styles.selectWrap}>
            <select
              id={id + "-subject"}
              name="subject"
              defaultValue="question"
              required
            >
              {Object.entries(CONTACT_SUBJECTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor={id + "-message"}>Votre message</label>
          <textarea
            id={id + "-message"}
            name="message"
            required
            maxLength={2000}
            rows={5}
            placeholder="Dites-nous ce qui vous amène…"
            aria-describedby={id + "-limit"}
          />
          <small id={id + "-limit"}>2 000 caractères maximum.</small>
        </div>
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={id + "-website"}>Votre site internet</label>
          <input
            id={id + "-website"}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <p className={styles.privacy}>
          Votre adresse sert uniquement à vous répondre. Ne partagez pas de mot
          de passe ni de données bancaires.
        </p>
        <button
          type="submit"
          className={styles.submit}
          disabled={busy || !available}
        >
          {busy
            ? "Envoi en cours…"
            : !available
              ? "Envoi bientôt disponible"
              : "Envoyer mon message"}
          <ArrowUpRight aria-hidden="true" />
        </button>
      </fieldset>
      {error && (
        <p className={styles.error} role="alert" tabIndex={-1} ref={errorText}>
          {error}
        </p>
      )}
    </form>
  );
}
