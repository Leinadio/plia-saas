import { expect, test } from "vitest";
import { dbFrom } from "../../src/db/pg";
import {
  completeOnboarding,
  finishDemoGuide,
  isOnboardingComplete,
  readDemoStatus,
  saveDemoVisit,
  setDemoActive,
} from "../../src/db/repositories/onboarding-status";
import { freshTourVisit, reduceTour } from "../../src/lib/onboarding-tour";
import { createTestDb } from "../helpers/pg";

const freshDb = async () => dbFrom(await createTestDb());

test("une personne qui n'a pas terminé l'onboarding ne l'est pas", async () => {
  const db = await freshDb();

  expect(await isOnboardingComplete(db, "u1")).toBe(false);
  expect(await readDemoStatus(db, "u1")).toEqual({
    demoActive: true,
    completedAt: null,
    visit: freshTourVisit(),
  });
});

test("le premier Compris est conservé", async () => {
  const db = await freshDb();

  await completeOnboarding(db, "u1", "2026-08-28T10:00:00.000Z");

  expect(await isOnboardingComplete(db, "u1")).toBe(true);

  await completeOnboarding(db, "u1", "2026-08-28T11:00:00.000Z");

  expect(await db.all("SELECT * FROM onboarding_status")).toHaveLength(1);
  expect(await db.one<{ completed_at: string }>("SELECT completed_at FROM onboarding_status WHERE user_id = 'u1'"))
    .toEqual({ completed_at: "2026-08-28T10:00:00.000Z" });
});

test("sauvegarde les modifications fictives et le choix du switch", async () => {
  const db = await freshDb();
  const fresh = freshTourVisit();
  const adjusted = {
    tour: reduceTour(fresh.tour, { type: "TRANSPORT_BUDGET_CHANGED", amount: 150 }),
    edits: { ...fresh.edits, transportBudget: 150 },
  };

  await saveDemoVisit(db, "u1", adjusted);
  await setDemoActive(db, "u1", false);
  expect(await readDemoStatus(db, "u1")).toEqual({
    demoActive: false,
    completedAt: null,
    visit: adjusted,
  });

  await setDemoActive(db, "u1", true);
  expect((await readDemoStatus(db, "u1")).visit).toEqual(adjusted);
});

test("Compris ferme le guide sans désactiver la démonstration", async () => {
  const db = await freshDb();
  const fresh = freshTourVisit();
  const finished = { ...fresh, tour: reduceTour({ ...fresh.tour, step: "ending-balance" }, { type: "FINISH" }) };

  await finishDemoGuide(db, "u1", finished, "2026-08-30T10:00:00.000Z");

  expect(await readDemoStatus(db, "u1")).toEqual({
    demoActive: true,
    completedAt: "2026-08-30T10:00:00.000Z",
    visit: finished,
  });
});
