"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, MailCheck } from "lucide-react";
import { OFFERS, isOffer, type OfferId } from "@/lib/prelaunch/offers";
import landing from "./landing.module.css";
import styles from "./prelaunch.module.css";

export function ReservationConfirmation({ token }: { token: string }) {
  const [offer, setOffer] = useState<OfferId | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(!/^[a-f0-9]{64}$/.test(token));
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (offer) resultHeading.current?.focus(); }, [offer]);
  async function confirm() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/reservations/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }), signal: AbortSignal.timeout(20_000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setExpired(response.status === 410); throw new Error(result?.error || "La confirmation est indisponible. Réessayez."); }
      if (!isOffer(result?.offer)) throw new Error("La confirmation est indisponible. Réessayez.");
      setOffer(result.offer);
      window.history.replaceState(null, "", "/reservation/confirmer");
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TypeError" && cause.name !== "TimeoutError" ? cause.message : "Vérifiez votre connexion puis réessayez.");
    } finally { setBusy(false); }
  }
  return (
    <section className={styles.confirmation}>
      {offer ? <>
        <Check className={styles.stateIcon} aria-hidden />
        <h1 ref={resultHeading} tabIndex={-1}>Votre réservation est confirmée.</h1>
        <p>Merci de faire partie des débuts de Planora. Nous vous préviendrons de l’ouverture par e-mail.</p>
        <div className={styles.confirmedOffer}><h2>{OFFERS[offer].name}</h2><p>{OFFERS[offer].terms}</p><p>Aucun abonnement n’a été activé.</p></div>
        <Link className={landing.primary} href="/#visite-guidee">Découvrir la démonstration <ArrowUpRight aria-hidden /></Link>
        <p className={styles.help}>Un aperçu avec des données fictives, pour vous projeter.</p>
      </> : <>
        <MailCheck className={styles.stateIcon} aria-hidden />
        <h1>{expired ? "Demandons un nouveau lien." : "Confirmez votre réservation."}</h1>
        <p>{expired ? "Ce lien est incomplet, expiré ou remplacé. Retrouvez votre formule et recevez un nouveau lien de confirmation." : "Un clic pour confirmer votre adresse et votre choix. C’est gratuit et cela ne déclenche aucun abonnement."}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {expired ? <Link className={landing.primary} href="/reservation">Recevoir un nouveau lien <ArrowUpRight aria-hidden /></Link> : <button className={landing.primary} onClick={() => void confirm()} disabled={busy}>{busy ? "Confirmation en cours…" : "Confirmer ma réservation"}<ArrowUpRight aria-hidden /></button>}
      </>}
      <Link className={styles.textButton} href="/">Revenir à l’accueil</Link>
    </section>
  );
}
