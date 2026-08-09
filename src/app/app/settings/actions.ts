"use server";
import { db } from "../../../db/index";
import { setAccountAlias, deleteAccount } from "../../../db/repositories/accounts";
import { revalidatePath } from "next/cache";
import { requireUserId } from "../../../lib/current-user";
import { ownsAccount } from "../../../db/repositories/ownership";

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

export async function deleteAccountAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!ownsAccount(db(), await requireUserId(), id)) return;
  deleteAccount(db(), id);
  revalidatePath("/app/settings");
  revalidatePath("/app");
  revalidatePath("/app/transactions");
}
