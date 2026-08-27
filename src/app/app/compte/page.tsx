import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pourMoi } from "@/lib/current-user";
import { listAccounts } from "../../../db/repositories/accounts";
import { listActiveConnections } from "../../../db/repositories/bank-connections";
import { AccountNameForm } from "@/components/account-name-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Le compte de l'utilisateur, distinct des réglages : ici c'est de LUI qu'on parle, là
// c'est de ses banques. Le layout garde déjà la porte de session ; on relit la session
// pour son contenu, pas pour le droit d'entrer.
export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const session = await auth().api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  const { comptes, connexions } = await pourMoi(async (database, userId) => ({
    comptes: await listAccounts(database, userId),
    connexions: await listActiveConnections(database, userId),
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AccountNameForm nom={session.user.name || ""} />
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm">Adresse de connexion</p>
            <p>{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ce que ce compte contient, dit en une ligne. Utile le jour où quelqu'un se
          demande ce qu'il perdrait en le supprimant. */}
      <Card>
        <CardHeader>
          <CardTitle>Mes données</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {connexions.length} banque(s) connectée(s) et {comptes.length} compte(s) bancaire(s).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
