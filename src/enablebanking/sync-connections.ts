import type { Db } from "../db/pg";
import { syncAll } from "./sync";
import { listConnections } from "../db/repositories/bank-connections";
import { listAccounts } from "../db/repositories/accounts";
import { hydrateAccountIdentities } from "./account-identities";
import { etatConnexion } from "../lib/connexion-etat";

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
): Promise<{ imported: number; banques: number; expired?: string[] }> {
  const { toutes, comptes } = await db.pourUtilisateur(deps.userId, async t => ({
    toutes: await listConnections(t, deps.userId), comptes: await listAccounts(t, deps.userId),
  }));
  const connexions = toutes.filter(c => c.sessionId)
    .filter(c => deps.connectionId == null || c.id === deps.connectionId)
    .sort((a, b) => b.id - a.id);
  const related = toutes.filter(c => connexions.some(cx => cx.aspspName === c.aspspName && cx.aspspCountry === c.aspspCountry));
  const identities = await hydrateAccountIdentities(db, deps.userId, related, comptes, deps.ebGet);
  let imported = 0;
  let banques = 0;
  for (const cx of connexions) {
    // Relire après chaque banque : la précédente peut avoir remplacé cette session.
    const state = await db.pourUtilisateur(deps.userId, async t => ({
      connections: await listConnections(t, deps.userId), accounts: await listAccounts(t, deps.userId),
    }));
    const current = state.connections.find(c => c.id === cx.id);
    if (!current) continue;
    if (etatConnexion(cx.validUntil, new Date()).etat === "expiree") continue;
    const connus = state.accounts.filter(a => a.connection_id === cx.id).map(a => a.bank_uid ?? a.id);
    if (connus.length === 0 && comptes.some(a => a.connection_id === cx.id)) continue;
    const pending = JSON.parse(current.syncPendingUids ?? "[]") as string[];
    const uids = [...new Set([...connus, ...pending,
      ...(connus.length === 0 ? JSON.parse(current.accountUids ?? "[]") as string[] : []),
    ])];
    if (uids.length === 0) continue;
    try {
      const res = await syncAll(db, {
        ebGet: deps.ebGet, accountUids: uids, accountName: cx.aspspName,
        userId: deps.userId, connectionId: cx.id, accountIdentities: identities,
      });
      imported += res.imported;
      banques += 1;
    } catch (error) {
      if (!(error instanceof Error) || !/\b(EXPIRED_SESSION|INVALID_SESSION)\b/.test(error.message)) throw error;
      await db.pourUtilisateur(deps.userId, t => t.run(
        "UPDATE bank_connections SET valid_until = $1 WHERE id = $2 AND user_id = $3",
        [new Date().toISOString(), cx.id, deps.userId],
      ));
    }
  }
  const remaining = await db.pourUtilisateur(deps.userId, t => listConnections(t, deps.userId));
  const expired = [...new Set(remaining.filter(c => c.sessionId && etatConnexion(c.validUntil, new Date()).etat === "expiree").map(c => c.aspspName))];
  return { imported, banques, ...(expired.length ? { expired } : {}) };
}
