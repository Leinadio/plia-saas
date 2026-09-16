"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Mail, ArrowLeft } from "lucide-react";
import { OFFERS, type OfferId } from "@/lib/prelaunch/offers";
import landing from "./landing.module.css";
import styles from "./prelaunch.module.css";

export function ReservationForm({ initialOffer }: { initialOffer: OfferId }) {
  const [offer, setOffer] = useState(initialOffer);
  const [email, setEmail] = useState("");
  const [need, setNeed] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [resent, setResent] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const errorText = useRef<HTMLParagraphElement>(null);

  useEffect(() => { if (sent) heading.current?.focus(); }, [sent]);
  useEffect(() => { if (error) errorText.current?.focus(); }, [error]);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer, email, need }), signal: AbortSignal.timeout(20_000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error(result?.error || "L’envoi est indisponible. Réessayez dans un instant.");
      setResent(sent);
      setSent(true);
      setSeconds(60);
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" && cause.name !== "TypeError" ? cause.message : "La connexion a été interrompue. Vérifiez votre réseau puis réessayez.");
    } finally { setBusy(false); }
  }

  if (sent) return (
    <div className={styles.formPanel}>
      <Mail className={styles.stateIcon} aria-hidden />
      <h2 ref={heading} tabIndex={-1}>Un dernier clic dans votre boîte mail.</h2>
      <p>Ouvrez le lien envoyé à <strong className={styles.email}>{email.trim()}</strong> pour confirmer votre réservation.</p>
      <p className={styles.help}>Si vous venez de faire une demande, utilisez le dernier e-mail reçu. Il récapitule la formule à confirmer. Pensez aussi aux courriers indésirables.</p>
      {resent && <p role="status">Un nouveau lien a été demandé.</p>}
      {error && <p className={styles.error} role="alert" ref={errorText} tabIndex={-1}>{error}</p>}
      <button className={styles.secondaryButton} onClick={() => void submit()} disabled={busy || seconds > 0}>
        {busy ? "Envoi en cours…" : seconds > 0 ? `Renvoyer un lien dans ${seconds} s` : "Renvoyer le lien"}
      </button>
      <button className={styles.textButton} onClick={() => { setSent(false); setError(""); requestAnimationFrame(() => emailInput.current?.focus()); }}>
        <ArrowLeft aria-hidden /> Corriger mon adresse ou ma formule
      </button>
      <div className={styles.nextStep}>
        <p>En attendant, faites le tour du produit.</p>
        <Link href="/#visite-guidee" className={landing.textLink}>Voir la démonstration <ArrowUpRight aria-hidden /></Link>
        <small>Un aperçu avec des données fictives.</small>
      </div>
    </div>
  );

  return (
    <form className={styles.formPanel} onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy} className={styles.fields}>
        <legend>Votre formule</legend>
        <div className={styles.radioGroup}>
          {(["manual", "connected"] as const).map((id) => (
            <label className={styles.radioChoice} key={id}>
              <input type="radio" name="offer" value={id} checked={offer === id} onChange={() => setOffer(id)} />
              <span><strong>{OFFERS[id].name}</strong><small>{id === "manual" ? "Saisie manuelle des opérations" : "Synchronisation de vos opérations"}</small></span>
              <span className={styles.radioPrice}>{OFFERS[id].price} €<small>/ mois</small></span>
            </label>
          ))}
        </div>
        <p className={styles.chosenTerms}>{OFFERS[offer].terms}{offer === "connected" && " Les 12 mois commencent à l’activation de l’abonnement."}</p>
        <div className={styles.field}>
          <label htmlFor="reservation-email">Votre adresse e-mail</label>
          <input id="reservation-email" type="email" name="email" ref={emailInput} autoComplete="email" maxLength={254} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" />
        </div>
        <div className={styles.field}>
          <label htmlFor="reservation-need">Qu’aimeriez-vous simplifier ? <span>Facultatif</span></label>
          <textarea id="reservation-need" name="need" maxLength={500} rows={3} value={need} onChange={(e) => setNeed(e.target.value)} placeholder="Anticiper un mois serré, préparer un projet…" />
        </div>
        <p className={styles.privacy}>Votre adresse servira à confirmer votre réservation et à vous prévenir de l’ouverture de Planora. Ne partagez aucune donnée bancaire dans votre réponse.</p>
        <button type="submit" className={landing.primary} disabled={busy}>{busy ? "Envoi en cours…" : "Réserver gratuitement"}<ArrowUpRight aria-hidden /></button>
        <p className={styles.formNote}><Check aria-hidden /> Sans carte bancaire, sans abonnement aujourd’hui.</p>
      </fieldset>
      {error && <p className={styles.error} role="alert" ref={errorText} tabIndex={-1}>{error}</p>}
    </form>
  );
}
