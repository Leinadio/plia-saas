import { beforeEach, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "@/db/pg";
import { parseReservation, OFFERS } from "@/lib/prelaunch/offers";
import { reserve, confirmReservation, consumeRequestQuota } from "@/lib/prelaunch/reservations";

let db: Db;
const time = new Date("2026-09-16T14:00:00Z");
const token = "a".repeat(64);
const send = vi.fn<(message: { email: string; offer: string; token: string }) => Promise<void>>().mockResolvedValue(undefined);
const input = { email: "hello@example.com", offer: "connected" as const, need: "Préparer les prochains mois" };
beforeEach(async () => {
  const pg = await createTestDb();
  await pg.exec(readFileSync("src/db/schema-prelaunch.sql", "utf8"));
  db = dbFrom(pg);
  send.mockClear();
});

test("les deux prix et la durée de lancement sont explicites", () => {
  expect(OFFERS.manual.price).toBe("9,90");
  expect(OFFERS.connected.price).toBe("19,90");
  expect(OFFERS.connected.terms).toContain("29 €");
  expect(OFFERS.connected.terms).toContain("12 premiers mois d’abonnement");
});
test("valide et normalise, refuse offres, e-mails et besoins invalides", () => {
  expect(parseReservation({ ...input, email: " HELLO@Example.com " }).email).toBe(input.email);
  for (const bad of [null, {}, { ...input, offer: "free" }, { ...input, email: "bad" }, { ...input, need: "x".repeat(501) }]) {
    expect(() => parseReservation(bad)).toThrow();
  }
});
test("enregistre en attente, envoie le choix, stocke uniquement le hash du jeton", async () => {
  await reserve(db, input, send, { now: time, token });
  expect(send).toHaveBeenCalledWith({ email: input.email, offer: input.offer, token });
  const row = await db.one<Record<string, unknown>>("SELECT * FROM prelaunch_reservations");
  expect(row?.confirmed_at).toBeNull();
  expect(row?.offer).toBeNull();
  expect(row?.token_hash).toBe(createHash("sha256").update(token).digest("hex"));
  expect(JSON.stringify(row)).not.toContain(token);
});
test("confirmation répétable, sans doublon ni abonnement", async () => {
  await reserve(db, input, send, { now: time, token });
  expect(await confirmReservation(db, token, time)).toBe("connected");
  expect(await confirmReservation(db, token, time)).toBe("connected");
  expect(await db.all("SELECT * FROM prelaunch_reservations")).toHaveLength(1);
});
test("refuse les liens invalides ou expirés", async () => {
  await reserve(db, input, send, { now: time, token });
  expect(await confirmReservation(db, "x", time)).toBeNull();
  expect(await confirmReservation(db, "b".repeat(64), time)).toBeNull();
  expect(await confirmReservation(db, token, new Date(+time + 86400_001))).toBeNull();
});
test("un doublon récent ne renvoie pas d’e-mail et ne change pas le choix", async () => {
  await reserve(db, input, send, { now: time, token });
  await reserve(db, { ...input, offer: "manual" }, send, { now: time, token: "b".repeat(64) });
  expect(send).toHaveBeenCalledTimes(1);
  expect(await confirmReservation(db, token, time)).toBe("connected");
});
test("un changement d’offre exige une nouvelle confirmation", async () => {
  await reserve(db, input, send, { now: time, token });
  await confirmReservation(db, token, time);
  const later = new Date(+time + 61_000);
  const nextToken = "b".repeat(64);
  await reserve(db, { ...input, offer: "manual" }, send, { now: later, token: nextToken });
  expect((await db.one<{ offer: string }>("SELECT offer FROM prelaunch_reservations"))?.offer).toBe("connected");
  expect(await confirmReservation(db, token, later)).toBeNull();
  expect(await confirmReservation(db, nextToken, later)).toBe("manual");
});
test("un échec d’envoi annule l’inscription et permet de réessayer", async () => {
  await expect(reserve(db, input, async () => { throw new Error("provider down"); }, { now: time, token })).rejects.toThrow("provider down");
  expect(await db.all("SELECT * FROM prelaunch_reservations")).toHaveLength(0);
  await reserve(db, input, send, { now: time, token });
  expect(send).toHaveBeenCalledTimes(1);
});
test("limite persistante par source, réinitialisée à l’heure suivante", async () => {
  for (let i = 0; i < 10; i++) expect(await consumeRequestQuota(db, "source-a", time)).toBe(true);
  expect(await consumeRequestQuota(db, "source-a", time)).toBe(false);
  expect(await consumeRequestQuota(db, "source-b", time)).toBe(true);
  expect(await consumeRequestQuota(db, "source-a", new Date(+time + 3600_000))).toBe(true);
});
test("les réservations ne sont pas lisibles par le rôle budget", async () => {
  await reserve(db, input, send, { now: time, token });
  await db.run("SET ROLE budget_app");
  await expect(db.all("SELECT * FROM prelaunch_reservations")).rejects.toThrow();
});
