"use server";
import { db } from "../../../db/index";
import { setAccountAlias, deleteAccount } from "../../../db/repositories/accounts";
import { revalidatePath } from "next/cache";
import { requireUserId } from "../../../lib/current-user";
import { ownsAccount } from "../../../db/repositories/ownership";
import { deleteConnection, ownedConnection } from "../../../db/repositories/bank-connections";

export async function renameAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const aliasRaw = String(formData.get("alias") ?? "").trim();
  if (!id) return;
  if (!ownsAccount(db(), await requireUserId(), id)) return;
  setAccountAlias(db(), id, aliasRaw === "" ? null : aliasRaw);
  revalidatePath("/app/settings");
  revalidatePath("/app");
  revalidatePath("/app/transactions");
}

// Supprimer un compte bancaire et tout son budget. Sans retour : c'est dit à l'écran
// avant, dans une fenêtre de confirmation, parce qu'ici il est trop tard.
export async function deleteAccountAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!ownsAccount(db(), await requireUserId(), id)) return;
  deleteAccount(db(), id);
  toutRevalider();
}

// Débrancher une banque : l'autorisation part, et avec elle tous les comptes qu'elle a
// rapportés. Le propriétaire se vérifie sur la connexion elle-même — un numéro suffit
// sinon à effacer le budget d'un inconnu.
export async function deleteConnectionAction(formData: FormData) {
  const id = Number(formData.get("id") ?? 0);
  if (!Number.isInteger(id) || id <= 0) return;
  const database = db();
  if (!ownedConnection(database, await requireUserId(), id)) return;
  deleteConnection(database, id);
  toutRevalider();
}

// Une suppression touche toutes les pages : les comptes disparaissent du tableau de
// bord, des opérations et de l'historique en même temps que des réglages.
function toutRevalider() {
  revalidatePath("/app/settings");
  revalidatePath("/app");
  revalidatePath("/app/transactions");
  revalidatePath("/app/historique");
}
