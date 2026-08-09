import { db } from "../../../db/index";
import { listAccounts } from "../../../db/repositories/accounts";
import { accountDisplayName } from "../../../lib/account";
import { renameAccount } from "./actions";
import { BankPicker } from "@/components/bank-picker";
import { SyncNowButton } from "@/components/sync-now-button";
import { listActiveConnections } from "../../../db/repositories/bank-connections";
import { etatConnexion } from "@/lib/connexion-etat";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { requireUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  // Ce que le retour de la banque a rapporté. Sans cet affichage, une autorisation qui
  // échoue laisse l'écran exactement dans l'état d'avant : on croit avoir mal cliqué.
  const params = await searchParams;
  const userId = await requireUserId();
  const database = db();
  const accounts = listAccounts(database, userId);
  // Seulement celles qui ont abouti : une demande abandonnée en route n'apprend
  // rien à personne et n'a rien à faire dans cette liste.
  const connexions = listActiveConnections(database, userId);

  return (
    <div className="flex flex-col gap-4">
      {params.error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40">
          L&apos;autorisation n&apos;a pas abouti : {params.error}
        </div>
      )}
      {params.connected && (
        <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/40">
          Banque connectée. Lancez une synchronisation pour importer vos opérations.
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Banques connectées</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Une carte par banque, avec son compte à rebours. Une autorisation vaut
              90 jours et la banque referme l'accès sans prévenir : sans cette mention,
              la synchronisation cesserait un matin sans qu'on sache pourquoi, ni
              laquelle des banques est en cause. */}
          {connexions.length === 0 && (
            <p className="text-muted-foreground text-sm">Aucune banque connectée pour l&apos;instant.</p>
          )}
          {connexions.map((cx) => {
            const etat = etatConnexion(cx.validUntil, new Date());
            const comptes = accounts.filter((a) => a.connection_id === cx.id);
            return (
              <div key={cx.id} className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{cx.aspspName}</span>
                  {etat.etat === "valide" && (
                    <Badge variant="secondary">Valide encore {etat.jours} jour(s)</Badge>
                  )}
                  {etat.etat === "bientot" && (
                    <Badge variant="destructive">À reconnecter dans {etat.jours} jour(s)</Badge>
                  )}
                  {etat.etat === "expiree" && <Badge variant="destructive">Autorisation expirée</Badge>}
                </div>
                {/* Autorisée mais sans aucun compte : la banque a bien donné son accord
                    et n'a rien partagé. Cela arrive quand aucun compte n'est coché
                    pendant le parcours chez elle. Sans ce mot, la carte annonce une
                    banque connectée dont on ne verra jamais la moindre opération. */}
                {comptes.length === 0 && (cx.accountUids === null || cx.accountUids === "[]") && (
                  <p className="text-sm text-amber-700 dark:text-amber-500">
                    Aucun compte partagé par cette banque. Refaites la connexion en
                    veillant à cocher les comptes à autoriser.
                  </p>
                )}
                {comptes.length > 0 && (
                  <ul className="text-muted-foreground list-inside list-disc text-sm">
                    {comptes.map((a) => (
                      <li key={a.id}>
                        {accountDisplayName(a)} — dernière synchro : {a.last_synced ?? "jamais"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-2">
            <BankPicker />
            <SyncNowButton />
          </div>
        </CardContent>
      </Card>


      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Noms des comptes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <form action={renameAccount} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <Input
                    name="alias"
                    defaultValue={a.custom_name ?? ""}
                    placeholder={a.name}
                    className="max-w-60"
                  />
                  <Button type="submit" size="sm">
                    Enregistrer
                  </Button>
                </form>
                <DeleteAccountButton accountId={a.id} />
              </div>
            ))}
            <p className="text-muted-foreground text-xs">
              Videz le champ pour revenir au nom de la banque.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
