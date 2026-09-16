import Image from "next/image";
import { LandingHeader } from "@/components/landing-header";
import { ReservationForm } from "@/components/reservation-form";
import { isOffer } from "@/lib/prelaunch/offers";
import landing from "@/components/landing.module.css";
import styles from "@/components/prelaunch.module.css";

export const metadata = {
  title: "Réserver mon accès — Planora",
  description: "Choisissez votre formule Planora et réservez gratuitement votre accès. Sans carte bancaire, sans abonnement aujourd’hui.",
};

export default async function ReservationPage({ searchParams }: { searchParams: Promise<{ offre?: string }> }) {
  const { offre } = await searchParams;
  return (
    <main className={landing.landing}>
      <LandingHeader homeLinks />
      <section className={styles.reservation} aria-labelledby="reservation-heading">
        <div className={styles.reservationIntro}>
          <h1 id="reservation-heading">Réservez votre accès.<br /><span>La suite se prépare avec vous.</span></h1>
          <p>Planora est en pré-lancement. Dites-nous comment vous aimeriez suivre votre budget : nous vous préviendrons dès l’ouverture.</p>
          <p>Votre réservation est gratuite. Vous déciderez de vous abonner au lancement.</p>
          <div className={styles.reservationArt}>
            <Image src="/landing/lumiere-hero-v1.png" alt="" fill sizes="(max-width: 760px) 100vw, 40vw" />
          </div>
        </div>
        <ReservationForm initialOffer={isOffer(offre) ? offre : "connected"} />
      </section>
    </main>
  );
}
