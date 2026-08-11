import type { Db } from "../pg";

// Notifications que l'utilisateur a fermées d'une croix. L'identité est celle que
// construit overspendNotifications : « compte::cible::mois ». Une table plutôt qu'un
// stockage navigateur — tout l'état de l'application vit en base, et c'est le seul
// endroit qui survit à un changement de navigateur ou à un vidage de cache.
export async function listDismissedNotifications(db: Db): Promise<string[]> {
  const lignes = await db.all<{ id: string }>(`SELECT id FROM dismissed_notifications`);
  return lignes.map((r) => r.id);
}

// Idempotent : le même clic peut partir deux fois (double-clic, réseau lent), la
// seconde ne doit ni échouer ni doubler la ligne.
export async function dismissNotification(db: Db, id: string): Promise<void> {
  await dismissNotifications(db, [id]);
}

// « Tout marquer comme vu » : la liste entière d'un geste, dans une seule transaction.
// À moitié faite, elle laisserait des bandeaux en couleur alors que l'utilisateur vient
// de dire qu'il avait tout vu. Idempotente comme sa sœur, et sans objet sur une liste
// vide (le bouton est alors éteint, mais l'action ne doit pas en dépendre).
export async function dismissNotifications(db: Db, ids: string[]): Promise<void> {
  const retenus = ids.filter((id) => id);
  if (retenus.length === 0) return;
  const at = new Date().toISOString();
  await db.tx(async (t) => {
    for (const id of retenus) {
      await t.run(
        `INSERT INTO dismissed_notifications (id, dismissed_at) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [id, at],
      );
    }
  });
}

// Le geste inverse : la marque part, le dépassement redevient à voir. Cliquer « Vu »
// n'est pas une porte qui claque — rien n'avait été détruit, seulement marqué.
// Silencieuse sur une identité jamais acquittée : il n'y a rien à défaire.
export async function restoreNotifications(db: Db, ids: string[]): Promise<void> {
  const retenus = ids.filter((id) => id);
  if (retenus.length === 0) return;
  await db.run(`DELETE FROM dismissed_notifications WHERE id = ANY($1)`, [retenus]);
}
