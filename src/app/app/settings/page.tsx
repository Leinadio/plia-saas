import { listAccounts } from "../../../db/repositories/accounts";
import { accountDisplayName } from "../../../lib/account";
import { renameAccount } from "./actions";
import { BankPicker } from "@/components/bank-picker";
import { SyncNowButton } from "@/components/sync-now-button";
import { listActiveConnections } from "../../../db/repositories/bank-connections";
import { etatConnexion } from "@/lib/connexion-etat";
import { DeleteAccountButton, DeleteConnectionButton } from "./DeleteAccountButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { currentOnboardingMode } from "@/lib/current-onboarding";
import { isDemoMode } from "@/lib/onboarding-mode";

import { pourMoi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string; imported?: string }>;
}) {
  if (isDemoMode(await currentOnboardingMode())) redirect("/app");

  // Ce que le retour de la banque a rapporté. Sans cet affichage, une autorisation qui
  // échoue laisse l'écran exactement dans l'état d'avant : on croit avoir mal cliqué.
  const params = await searchParams;
  // Seulement les connexions qui ont abouti : une demande abandonnée en route
  // n'apprend rien à personne et n'a rien à faire dans cette liste.
  const { accounts, connexions } = await pourMoi(async (database, userId) => ({
    accounts: await listAccounts(database, userId),
    connexions: await listActiveConnections(database, userId),
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      {params.error && (
        <div className="bandeau bandeau-tension">
          L&apos;autorisation n&apos;a pas abouti : {params.error}
        </div>
      )}
      {params.connected && (
        <div className="creux p-3 text-sm">
          {/* L'import se lance tout seul au retour de la banque. Trois issues, et
              chacune se dit : sans le nombre, un écran vide laisse croire à une panne
              alors que la banque n'avait peut-être rien à donner. */}
          {params.imported === undefined
            ? "Banque connectée. L'import n'a pas abouti, lancez une synchronisation."
            : params.imported === "0"
              ? "Banque connectée. Aucune opération à importer pour l'instant."
              : `Banque connectée. ${params.imported} opération(s) importée(s).`}
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
              <div key={cx.id} className="creux flex flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{cx.aspspName}</span>
                  {etat.etat === "valide" && (
                    <Badge variant="secondary">Valide encore {etat.jours} jour(s)</Badge>
                  )}
                  {etat.etat === "bientot" && (
                    <Badge variant="destructive">À reconnecter dans {etat.jours} jour(s)</Badge>
                  )}
                  {etat.etat === "expiree" && <Badge variant="destructive">Autorisation expirée</Badge>}
                  {/* Débrancher la banque emporte ses comptes : le geste appartient donc
                      à la carte de la banque, pas à la liste des comptes plus bas. */}
                  <div className="ml-auto">
                    <DeleteConnectionButton
                      connectionId={cx.id}
                      banque={cx.aspspName}
                      nbComptes={comptes.length}
                    />
                  </div>
                </div>
                {/* Autorisée mais sans aucun compte : la banque a bien donné son accord
                    et n'a rien partagé. Cela arrive quand aucun compte n'est coché
                    pendant le parcours chez elle. Sans ce mot, la carte annonce une
                    banque connectée dont on ne verra jamais la moindre opération. */}
                {comptes.length === 0 && (cx.accountUids === null || cx.accountUids === "[]") && (
                  <p className="text-tension-encre text-sm">
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
            <CardTitle>Comptes bancaires</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {/* Tous les comptes, y compris ceux qu'aucune banque connectée ne
                revendique : sans cette liste ils n'auraient nulle part où se
                supprimer. */}
            {accounts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2">
                <form action={renameAccount} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <Input
                    name="alias"
                    defaultValue={a.custom_name ?? ""}
                    placeholder={a.name}
                    className="max-w-60"
                  />
                  <Button type="submit" size="sm" className="cursor-pointer">
                    Enregistrer
                  </Button>
                </form>
                <DeleteAccountButton accountId={a.id} nom={accountDisplayName(a)} />
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
