import { createHash, randomBytes } from "node:crypto";
import type { Db } from "@/db/pg";
import type { OfferId, ReservationInput } from "./offers";

type ConfirmationMessage = { email: string; offer: OfferId; token: string };
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function reserve(
  db: Db,
  input: ReservationInput,
  send: (message: ConfirmationMessage) => Promise<void>,
  options: { now?: Date; token?: string } = {},
): Promise<void> {
  const now = options.now ?? new Date();
  const token = options.token ?? randomBytes(32).toString("hex");
  const expires = new Date(+now + 86_400_000);
  await db.tx(async (tx) => {
    // L'insertion arbitre aussi deux demandes simultanées sur la même adresse.
    const created = await tx.one<{ email: string }>(
      `INSERT INTO prelaunch_reservations
       (email, pending_offer, pending_need, token_hash, expires_at, last_requested_at)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING RETURNING email`,
      [input.email, input.offer, input.need, hash(token), expires, now],
    );
    if (!created) {
      const existing = await tx.one<{ last_requested_at: Date }>(
        `SELECT last_requested_at FROM prelaunch_reservations WHERE email = $1 FOR UPDATE`, [input.email],
      );
      if (existing && +now - +new Date(existing.last_requested_at) < 60_000) return;
      await tx.run(
        `UPDATE prelaunch_reservations SET pending_offer = $2, pending_need = $3,
         token_hash = $4, expires_at = $5, last_requested_at = $6 WHERE email = $1`,
        [input.email, input.offer, input.need, hash(token), expires, now],
      );
    }
    // Envoi borné à 10 s par l'adaptateur. Un échec restaure l'ancien état.
    await send({ email: input.email, offer: input.offer, token });
  });
}

export async function confirmReservation(db: Db, token: string, now = new Date()): Promise<OfferId | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await db.one<{ offer: OfferId }>(
    `UPDATE prelaunch_reservations SET offer = pending_offer, need = pending_need,
     confirmed_at = COALESCE(confirmed_at, $2)
     WHERE token_hash = $1 AND expires_at > $2 RETURNING offer`, [hash(token), now],
  );
  return row?.offer ?? null;
}

export async function consumeRequestQuota(db: Db, sourceHash: string, now = new Date()): Promise<boolean> {
  const bucket = new Date(Math.floor(+now / 3_600_000) * 3_600_000);
  await db.run("DELETE FROM prelaunch_request_limits WHERE bucket < $1", [new Date(+bucket - 86_400_000)]);
  const row = await db.one<{ requests: number }>(
    `INSERT INTO prelaunch_request_limits (source_hash, bucket, requests) VALUES ($1, $2, 1)
     ON CONFLICT (source_hash, bucket) DO UPDATE SET requests = prelaunch_request_limits.requests + 1
     RETURNING requests`, [sourceHash, bucket],
  );
  return !!row && row.requests <= 10;
}
