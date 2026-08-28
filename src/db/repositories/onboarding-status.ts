import type { Db } from "../pg";

export async function isOnboardingComplete(db: Db, userId: string): Promise<boolean> {
  return Boolean(await db.one(`SELECT user_id FROM onboarding_status WHERE user_id = $1`, [userId]));
}

export async function completeOnboarding(db: Db, userId: string, completedAt: string): Promise<void> {
  await db.run(
    `INSERT INTO onboarding_status (user_id, completed_at) VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, completedAt],
  );
}
