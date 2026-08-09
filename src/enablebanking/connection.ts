import { ebPost } from "./client";
import { db } from "../db/index";
import { createConnection, setConnectionSession, ownedConnection } from "../db/repositories/bank-connections";

const REDIRECT_URL = process.env.ENABLEBANKING_REDIRECT_URL ?? "http://localhost:3000/api/callback";

// The bank ("ASPSP") name must match Enable Banking's catalog for your environment
// EXACTLY. In Sandbox the real CIC is absent — use a test bank like "Mock ASPSP"
// (run `node scripts/list-aspsps.mjs` to see the valid names for your app). In
// Production, set ENABLEBANKING_ASPSP_NAME to the real bank (e.g. "CIC").
const ASPSP_NAME = process.env.ENABLEBANKING_ASPSP_NAME ?? "CIC";
const ASPSP_COUNTRY = process.env.ENABLEBANKING_ASPSP_COUNTRY ?? "FR";

// NOTE: The exact request/response field names for /auth and /sessions may still
// need confirming against the live API. The sync logic (tested) is independent of them.

// La demande d'autorisation. La connexion est créée AVANT la redirection, avec la
// banque visée, et son identifiant voyage dans le `state` : c'est lui que la banque
// nous rend au retour, et sans lui on ne saurait pas quelle ligne compléter.
//
// La banque n'est plus lue dans l'environnement mais choisie par l'appelant : c'est ce
// qui permet d'en connecter plusieurs. Les valeurs de .env.local ne servent plus que
// de repli, pour l'écran de réglages qui ne propose pas encore de liste.
export async function startAuth(
  userId: string,
  aspspName: string = ASPSP_NAME,
  aspspCountry: string = ASPSP_COUNTRY,
): Promise<{ url: string; connectionId: number }> {
  const connectionId = createConnection(db(), userId, aspspName, aspspCountry);
  // valid_until : fenêtre de consentement de 90 jours (maximum permis par la DSP2).
  const validUntil = new Date(Date.now() + 89 * 24 * 3600 * 1000).toISOString();
  const res = await ebPost<{ url: string; authorization_id: string }>("/auth", {
    access: { valid_until: validUntil },
    aspsp: { name: aspspName, country: aspspCountry },
    state: String(connectionId),
    redirect_url: REDIRECT_URL,
    psu_type: "personal",
  });
  return { url: res.url, connectionId };
}

// Le retour de la banque. `state` rapporte l'identifiant de la connexion, et on vérifie
// qu'elle appartient bien à celui qui revient : un `state` se falsifie, et sans cette
// vérification une autorisation bancaire pourrait être rattachée au compte d'un autre.
export async function finishAuth(code: string, state: string, userId: string): Promise<number> {
  const connectionId = Number(state);
  if (!Number.isInteger(connectionId)) throw new Error("Retour d'autorisation sans connexion identifiable");
  const connexion = ownedConnection(db(), userId, connectionId);
  if (!connexion) throw new Error("Cette autorisation ne correspond à aucune connexion en attente");

  const res = await ebPost<{ session_id: string; accounts: { uid: string }[] }>("/sessions", { code });
  if (!res.session_id || !res.accounts) throw new Error("Enable Banking /sessions returned an unexpected response");
  const uids = res.accounts.map((a) => a.uid);
  const validUntil = new Date(Date.now() + 89 * 24 * 3600 * 1000).toISOString();
  setConnectionSession(db(), connectionId, res.session_id, validUntil, uids);
  return connectionId;
}
