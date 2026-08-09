import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

// La page publique. Elle occupe la racine depuis que l'application est passée sous
// /app, et c'est ici que viendra la présentation du produit. Pour l'instant elle ne
// fait qu'une chose utile : envoyer chacun là où il doit aller.
//
// Volontairement nue. Une landing se conçoit, elle ne s'improvise pas au détour d'un
// déménagement de routes.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Déjà connecté : la page d'accueil n'a rien à lui apprendre.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/app");

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-4xl">Budget</h1>
      <p className="text-muted-foreground text-lg">
        Vos comptes bancaires réunis au même endroit. Des enveloppes mensuelles, des
        dépenses suivies au jour le jour, et ce qu&apos;il vous restera à la fin du mois.
      </p>
      <div className="flex gap-3">
        <Button asChild className="cursor-pointer">
          <Link href="/connexion">Commencer</Link>
        </Button>
      </div>
    </main>
  );
}
