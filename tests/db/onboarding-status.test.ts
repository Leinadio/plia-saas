import { expect, test } from "vitest";
import { dbFrom } from "../../src/db/pg";
import { completeOnboarding, isOnboardingComplete } from "../../src/db/repositories/onboarding-status";
import { createTestDb } from "../helpers/pg";

const freshDb = async () => dbFrom(await createTestDb());

test("une personne qui n'a pas terminé l'onboarding ne l'est pas", async () => {
  const db = await freshDb();

  expect(await isOnboardingComplete(db, "u1")).toBe(false);
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
