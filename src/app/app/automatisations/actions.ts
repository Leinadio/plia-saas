"use server";
import { revalidatePath } from "next/cache";
import { pourMoi } from "@/lib/current-user";
import { readDemoStatus } from "@/db/repositories/onboarding-status";
import type { Db } from "@/db/pg";
import { RuleError, type RuleInput } from "@/lib/automation";
import {
  saveRule,
  previewRule,
  applyRulePreview,
  setRuleEnabled,
  deleteRule,
} from "@/lib/automation-service";
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
async function execute<T>(
  fn: (db: Db, userId: string) => Promise<T>,
  mutates = true,
): Promise<Result<T>> {
  try {
    const data = await pourMoi(async (db, userId) => {
      if ((await readDemoStatus(db, userId)).demoActive)
        throw new RuleError("Quittez la démonstration pour gérer vos règles.");
      return fn(db, userId);
    });
    if (mutates) revalidatePath("/app", "layout");
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof RuleError
          ? error.message
          : "Impossible de terminer cette action. Réessayez dans un instant.",
    };
  }
}
export async function saveAutomationRule(
  input: RuleInput,
  id?: number,
  revision?: number,
) {
  return execute((db, userId) => saveRule(db, userId, input, id, revision));
}
export async function previewAutomationRule(id: number) {
  return execute((db, userId) => previewRule(db, userId, id), false);
}
export async function applyAutomationPreview(
  id: number,
  revision: number,
  ids: string[],
) {
  return execute((db, userId) =>
    applyRulePreview(db, userId, id, revision, ids),
  );
}
export async function toggleAutomationRule(id: number, enabled: boolean) {
  return execute((db, userId) => setRuleEnabled(db, userId, id, enabled));
}
export async function removeAutomationRule(id: number) {
  return execute((db, userId) => deleteRule(db, userId, id));
}
