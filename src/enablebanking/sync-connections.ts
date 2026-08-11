import type { Db } from "../db/pg";
import { syncAll } from "./sync";
import { listConnections } from "../db/repositories/bank-connections";
import { listAccounts } from "../db/repositories/accounts";

type EbGet = <T>(path: string) => Promise<T>;

// Rafraîchit les banques d'un utilisateur, une connexion après l'autre. Il n'y a pas
// une liste unique de comptes quelque part dans les réglages : chaque connexion porte
// les siens.
//
// `connectionId` restreint à une seule banque. C'est le cas du retour d'autorisation :
// on vient d'en connecter une, les autres n'ont pas bougé, et les resynchroniser au
// passage ferait attendre pour rien.
//
// Les comptes déjà en base font foi. La liste d'uid rapportée à l'autorisation ne sert
// qu'à la toute première synchronisation, quand aucun compte n'existe encore : ensuite
// elle vieillit, et s'y fier ferait revenir tout seul un compte qu'on a supprimé.
export async function syncConnections(
  db: Db,
  deps: { ebGet: EbGet; userId: string; connectionId?: number },
): Promise<{ imported: number; banques: number }> {
  const toutes = await listConnections(db, deps.userId);
  const connexions = toutes
    .filter((c) => c.sessionId)
    .filter((c) => deps.connectionId == null || c.id === deps.connectionId);
  const comptes = await listAccounts(db, deps.userId);

  let imported = 0;
  let banques = 0;
  for (const cx of connexions) {
    const connus = comptes.filter((a) => a.connection_id === cx.id).map((a) => a.id);
    const uids = connus.length > 0 ? connus : (JSON.parse(cx.accountUids ?? "[]") as string[]);
    // Une banque qui n'a partagé aucun compte : rien à demander. Cela arrive en mode
    // restreint chez Enable Banking, et ce n'est pas une panne.
    if (uids.length === 0) continue;
    const res = await syncAll(db, {
      ebGet: deps.ebGet,
      accountUids: uids,
      accountName: cx.aspspName,
      userId: deps.userId,
      connectionId: cx.id,
    });
    imported += res.imported;
    banques += 1;
  }
  return { imported, banques };
}
