import type { Db } from "@/db/pg";
// Les clés reçues sont des HMAC : aucune adresse ni IP en clair dans la base.
export async function consumeContactQuota(
  db: Db,
  sourceHash: string,
  emailHash: string,
  now = new Date(),
): Promise<boolean> {
  const bucket = new Date(Math.floor(+now / 3_600_000) * 3_600_000);
  await db.run("DELETE FROM contact_request_limits WHERE bucket < $1", [
    new Date(+bucket - 86_400_000),
  ]);
  const rows = await db.all<{ key: string; requests: number }>(
    `INSERT INTO contact_request_limits (key, bucket, requests) VALUES ($1, $3, 1), ($2, $3, 1)
     ON CONFLICT (key, bucket) DO UPDATE SET requests = contact_request_limits.requests + 1
     RETURNING key, requests`,
    ["email:" + emailHash, "source:" + sourceHash, bucket],
  );
  return (
    rows.length === 2 &&
    rows.every((row) => row.requests <= (row.key.startsWith("email:") ? 3 : 20))
  );
}
