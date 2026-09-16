import { LandingHeader } from "@/components/landing-header";
import { ReservationConfirmation } from "@/components/reservation-confirmation";
import landing from "@/components/landing.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirmer ma réservation — Planora", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className={landing.landing}><LandingHeader homeLinks /><ReservationConfirmation token={token ?? ""} /></main>;
}
