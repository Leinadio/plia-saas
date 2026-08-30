import type { Db } from "../pg";
import { freshTourVisit, restoreTourVisit, serializeTourVisit, type TourVisit } from "../../lib/onboarding-tour";

export type DemoStatus = {
  demoActive: boolean;
  completedAt: string | null;
  visit: TourVisit;
};

type DemoStatusRow = {
  demo_active: boolean;
  completed_at: string | null;
  demo_visit: unknown;
};

function visitFromDatabase(value: unknown): TourVisit {
  if (typeof value === "string") return restoreTourVisit(value);
  return restoreTourVisit(JSON.stringify(value));
}

export async function readDemoStatus(db: Db, userId: string): Promise<DemoStatus> {
  const row = await db.one<DemoStatusRow>(
    `SELECT demo_active, completed_at, demo_visit FROM onboarding_status WHERE user_id = $1`,
    [userId],
  );
  if (!row) return { demoActive: true, completedAt: null, visit: freshTourVisit() };
  return {
    demoActive: row.demo_active,
    completedAt: row.completed_at,
    visit: visitFromDatabase(row.demo_visit),
  };
}

export async function saveDemoVisit(db: Db, userId: string, visit: TourVisit): Promise<void> {
  await db.run(
    `INSERT INTO onboarding_status (user_id, demo_visit) VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET demo_visit = EXCLUDED.demo_visit`,
    [userId, serializeTourVisit(visit)],
  );
}

export async function setDemoActive(db: Db, userId: string, active: boolean): Promise<void> {
  await db.run(
    `INSERT INTO onboarding_status (user_id, demo_active) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET demo_active = EXCLUDED.demo_active`,
    [userId, active],
  );
}

export async function finishDemoGuide(
  db: Db,
  userId: string,
  visit: TourVisit,
  completedAt: string,
): Promise<void> {
  await db.run(
    `INSERT INTO onboarding_status (user_id, completed_at, demo_active, demo_visit)
     VALUES ($1, $2, TRUE, $3::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET
       completed_at = COALESCE(onboarding_status.completed_at, EXCLUDED.completed_at),
       demo_active = TRUE,
       demo_visit = EXCLUDED.demo_visit`,
    [userId, completedAt, serializeTourVisit(visit)],
  );
}

export async function isOnboardingComplete(db: Db, userId: string): Promise<boolean> {
  return Boolean(await db.one(
    `SELECT user_id FROM onboarding_status WHERE user_id = $1 AND completed_at IS NOT NULL`,
    [userId],
  ));
}

export async function completeOnboarding(db: Db, userId: string, completedAt: string): Promise<void> {
  await db.run(
    `INSERT INTO onboarding_status (user_id, completed_at) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       completed_at = COALESCE(onboarding_status.completed_at, EXCLUDED.completed_at)`,
    [userId, completedAt],
  );
}
