import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingContent } from "@/components/landing-page";

// La page publique. Elle occupe la racine depuis que l'application est passée sous
// /app. Elle dit ce que le produit fait, et rien de plus : aucun chiffre d'usage,
// aucun témoignage, aucun prix — rien de tout cela n'existe, et une landing ne
// s'invente pas des preuves.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Déjà connecté : la page d'accueil n'a rien à lui apprendre.
  const session = await auth()
    .api.getSession({ headers: await headers() })
    .catch(() => null);
  if (session) redirect("/app");

  return <LandingContent />;
}
