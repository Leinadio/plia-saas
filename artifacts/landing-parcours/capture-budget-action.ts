// Imported ONLY in the disposable recording snapshot in place of the server action.
// The public app keeps its original server action and never imports this adapter.
import type { createGroup as persistGroup } from "@/app/app/historique/actions";
export type CaptureBudgetInput = Parameters<typeof persistGroup>[0];
export async function createGroup(input: CaptureBudgetInput) {
  window.dispatchEvent(
    new CustomEvent("capture-budget-created", { detail: input }),
  );
}
