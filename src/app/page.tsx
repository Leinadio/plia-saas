import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingContent } from "@/components/landing-page";

// La page publique présente les fonctionnalités réelles et des données de démo.
// Le tarif proposé reste identifié comme provisoire, sans promesse de paiement.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plia — Votre budget, une vue d’avance",
  description:
    "Reliez votre banque, organisez vos enveloppes et comparez les mois à venir. Plia vous aide à voir ce qu’il restera pour vos projets.",
};

export default async function LandingPage() {
  // Déjà connecté : la page d'accueil n'a rien à lui apprendre.
  const session = await auth()
    .api.getSession({ headers: await headers() })
    .catch(() => null);
  if (session) redirect("/app");

  return <LandingContent />;
}
