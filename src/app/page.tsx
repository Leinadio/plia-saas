import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingContent } from "@/components/landing-page";

// La page publique présente les fonctionnalités réelles et des données de démo.
// Le pré-lancement propose une réservation gratuite, indépendante de tout abonnement.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Planora — Votre budget, une vue d’avance",
  description:
    "Définissez un budget pour chaque projet, activité ou dépense du quotidien. Avec ou sans connexion bancaire, Planora vous aide à suivre vos dépenses et ce qu’il reste.",
};

export default async function LandingPage() {
  // Déjà connecté : la page d'accueil n'a rien à lui apprendre.
  const session = await auth()
    .api.getSession({ headers: await headers() })
    .catch(() => null);
  if (session) redirect("/app");

  return <LandingContent />;
}
