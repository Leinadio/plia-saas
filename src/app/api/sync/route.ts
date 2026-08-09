import { NextResponse } from "next/server";
import { db } from "../../../db/index";
import { ebGet } from "../../../enablebanking/client";
import { syncAll } from "../../../enablebanking/sync";
import { requireUserId } from "../../../lib/current-user";
import { listConnections } from "../../../db/repositories/bank-connections";
import { listAccounts } from "../../../db/repositories/accounts";

// Rafraîchit toutes les banques de l'utilisateur, une connexion après l'autre. Il n'y a
// plus une liste unique de comptes quelque part dans les réglages : chaque connexion
// porte les siens, et les comptes déjà en base font foi dès la deuxième synchro.
export async function POST() {
  const userId = await requireUserId();
  const database = db();
  const connexions = listConnections(database, userId).filter((c) => c.sessionId);
  if (connexions.length === 0) return NextResponse.json({ error: "not_connected" }, { status: 400 });

  const comptes = listAccounts(database, userId);
  let imported = 0;
  try {
    for (const cx of connexions) {
      const connus = comptes.filter((a) => a.connection_id === cx.id).map((a) => a.id);
      const uids = connus.length > 0 ? connus : (JSON.parse(cx.accountUids ?? "[]") as string[]);
      if (uids.length === 0) continue;
      const res = await syncAll(database, {
        ebGet,
        accountUids: uids,
        accountName: cx.aspspName,
        userId,
        connectionId: cx.id,
      });
      imported += res.imported;
    }
    return NextResponse.json({ imported });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
