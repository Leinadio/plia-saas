import type { Db } from "../pg";

// Notifications que l'utilisateur a fermées d'une croix. L'identité est celle que
// construit overspendNotifications : « compte::cible::mois ». Une table plutôt qu'un
// stockage navigateur — tout l'état de l'application vit en base, et c'est le seul
// endroit qui survit à un changement de navigateur ou à un vidage de cache.
//
// Le propriétaire est obligatoire partout, sans valeur par défaut. La table était
// commune à tout le monde : lire la liste, c'était lire celle de tous les inscrits.
// Rien ne se voyait à l'écran, puisque l'identité commence par un compte bancaire que
// personne d'autre ne possède — mais la lecture ramenait bel et bien leurs lignes.
export async function listDismissedNotifications(db: Db, userId: string): Promise<string[]> {
  const lignes = await db.all<{ id: string }>(
    `SELECT id FROM dismissed_notifications WHERE user_id = $1`,
    [userId],
  );
  return lignes.map((r) => r.id);
}

// Idempotent : le même clic peut partir deux fois (double-clic, réseau lent), la
// seconde ne doit ni échouer ni doubler la ligne.
export async function dismissNotification(db: Db, userId: string, id: string): Promise<void> {
  await dismissNotifications(db, userId, [id]);
}

// « Tout marquer comme vu » : la liste entière d'un geste, dans une seule transaction.
// À moitié faite, elle laisserait des bandeaux en couleur alors que l'utilisateur vient
// de dire qu'il avait tout vu. Idempotente comme sa sœur, et sans objet sur une liste
// vide (le bouton est alors éteint, mais l'action ne doit pas en dépendre).
export async function dismissNotifications(db: Db, userId: string, ids: string[]): Promise<void> {
  const retenus = ids.filter((id) => id);
  if (retenus.length === 0) return;
  const at = new Date().toISOString();
  await db.tx(async (t) => {
    for (const id of retenus) {
      await t.run(
        `INSERT INTO dismissed_notifications (user_id, id, dismissed_at) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, id) DO NOTHING`,
        [userId, id, at],
      );
    }
  });
}

// Le geste inverse : la marque part, le dépassement redevient à voir. Cliquer « Vu »
// n'est pas une porte qui claque — rien n'avait été détruit, seulement marqué.
// Silencieuse sur une identité jamais acquittée : il n'y a rien à défaire.
export async function restoreNotifications(db: Db, userId: string, ids: string[]): Promise<void> {
  const retenus = ids.filter((id) => id);
  if (retenus.length === 0) return;
  await db.run(`DELETE FROM dismissed_notifications WHERE user_id = $1 AND id = ANY($2)`, [
    userId,
    retenus,
  ]);
}
