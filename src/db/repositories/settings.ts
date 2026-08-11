import type { Db } from "../pg";

export async function getSetting(db: Db, key: string): Promise<string | null> {
  const row = await db.one<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
  return row ? row.value : null;
}

export async function setSetting(db: Db, key: string, value: string): Promise<void> {
  await db.run(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [key, value],
  );
}
