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
    "Avec ou sans connexion bancaire, organisez vos enveloppes et comparez les mois à venir. Planora vous aide à voir ce qu’il restera pour vos projets.",
};

export default async function LandingPage() {
  // Déjà connecté : la page d'accueil n'a rien à lui apprendre.
  const session = await auth()
    .api.getSession({ headers: await headers() })
    .catch(() => null);
  if (session) redirect("/app");

  return <LandingContent />;
}
