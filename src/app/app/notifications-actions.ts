"use server";
import { db } from "../../db/index";
import {
  dismissNotification as dismiss,
  dismissNotifications as dismissAll,
  restoreNotifications as restore,
} from "../../db/repositories/dismissed-notifications";
import { revalidatePath } from "next/cache";
import { requireUserId } from "../../lib/current-user";
import { ownsAccount } from "../../db/repositories/ownership";

// L'identité d'une notification commence par le compte qu'elle concerne
// (« compte::cible::mois », cf. overspendNotifications). On ne garde donc que celles
// dont le compte est à l'appelant : sans ce tri, acquitter chez un autre suffirait à
// lui faire disparaître ses alertes de dépassement.
async function siennes(ids: string[]): Promise<{ userId: string; ids: string[] }> {
  const userId = await requireUserId();
  const database = db();
  const vus = new Map<string, boolean>();
  const gardees: string[] = [];
  for (const id of ids) {
    const compte = id.split("::")[0];
    if (!compte) continue;
    if (!vus.has(compte)) vus.set(compte, await ownsAccount(database, userId, compte));
    if (vus.get(compte)) gardees.push(id);
  }
  return { userId, ids: gardees };
}

// Ferme une notification : elle ne reviendra pas. L'identité vient de
// overspendNotifications (« compte::cible::mois ») et n'est jamais fabriquée ici : la
// composer une seconde fois, c'est prendre le risque qu'elle diverge de celle affichée,
// et fermer une notification en laisser une autre à l'écran.
//
// Toutes les pages sont revalidées : le bouton vit dans l'en-tête, il est donc présent
// partout, et son compteur doit tomber juste où qu'on soit.
export async function dismissNotification(id: string): Promise<void> {
  if (!id) return;
  const { userId, ids } = await siennes([id]);
  if (ids.length === 0) return;
  await dismiss(db(), userId, id);
  revalidatePath("/app", "layout");
}

// « Tout marquer comme vu ». Les identités viennent du panneau (celles qui restaient à
// voir, cf. unseenIds) et ne sont pas refabriquées ici, pour la même raison que
// ci-dessus : recomposer une identité, c'est risquer d'en acquitter une autre que celle
// qu'on a sous les yeux.
export async function dismissAllNotifications(ids: string[]): Promise<void> {
  const { userId, ids: miennes } = await siennes(ids);
  if (miennes.length === 0) return;
  await dismissAll(db(), userId, miennes);
  revalidatePath("/app", "layout");
}

// Le geste inverse, pour un dépassement ou pour le lot qu'on vient d'acquitter d'un
// coup. Acquitter n'est pas une décision définitive : rien n'a été détruit, seulement
// marqué, et la marque se retire.
export async function restoreNotifications(ids: string[]): Promise<void> {
  const { userId, ids: miennes } = await siennes(ids);
  if (miennes.length === 0) return;
  await restore(db(), userId, miennes);
  revalidatePath("/app", "layout");
}
