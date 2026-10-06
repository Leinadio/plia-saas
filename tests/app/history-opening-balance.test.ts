import { freshDb, at } from "../db/actions/setup";
import { afterEach, expect, test, vi } from "vitest";
import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import HistoriquePage from "@/app/app/historique/page";
import { HistoryWithDetail } from "@/components/history-with-detail";
import { upsertAccount } from "@/db/repositories/accounts";
import { upsertTransaction } from "@/db/repositories/transactions";
import { TEST_USER } from "../helpers/test-user";

vi.mock("@/lib/current-onboarding", () => ({ currentOnboardingMode: async () => "real" }));
afterEach(() => vi.useRealTimers());

// La page effectue les vraies lectures et les vrais calculs. On vérifie les
// montants qu'elle transmet au tableau, sans remplacer le moteur par un mock.
function historyProps(node: ReactNode): ComponentProps<typeof HistoryWithDetail> | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) continue;
    if (child.type === HistoryWithDetail) return child.props as ComponentProps<typeof HistoryWithDetail>;
    const found = historyProps(child.props.children);
    if (found) return found;
  }
}

test.each([null, 186.77])("la vue d'ensemble retrouve 2,09 € de départ (solde comptabilisé : %s)", async (bookedBalance) => {
  const db = await freshDb();
  at("2026-10");
  await upsertAccount(db, {
    id: "a1", name: "Compte de test", iban_masked: null, balance: 94.79,
    booked_balance: bookedBalance, currency: "EUR", last_synced: "2026-10-06T12:00:00Z",
    pending_transactions: [-4.98, -5.67, -51.54, -0.91, -0.76, -0.73, -27.39]
      .map((amount, i) => ({ id: `pending:${i}`, amount, date: "2026-10-06", label: "Paiement en attente" })),
  }, TEST_USER);
  await upsertTransaction(db, { id: "credits", account_id: "a1", date: "2026-10-01", amount: 242.54, label: "Entrées" });
  await upsertTransaction(db, { id: "debits", account_id: "a1", date: "2026-10-02", amount: -57.86, label: "Sorties" });

  const page = await HistoriquePage({ searchParams: Promise.resolve({ from: "2026-10", to: "2026-10" }) });
  const history = historyProps(page);

  expect(history).toBeDefined();
  expect(history!.solde.openings[0]).toBeCloseTo(2.09, 2);
  expect(history!.solde.closings[0]).toBeCloseTo(94.79, 2);
  expect(history!.solde.pending).toEqual([0]);
});
