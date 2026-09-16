import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "@/db/pg";
import { consumeContactQuota } from "@/lib/contact/rate-limit";
async function setup() {
  const pg = await createTestDb();
  await pg.exec(readFileSync("src/db/schema-contact.sql", "utf8"));
  return { pg, db: dbFrom(pg) };
}
it("limite une adresse à trois messages par heure, même en changeant de source", async () => {
  const { db } = await setup();
  const now = new Date("2026-09-16T10:05:00Z");
  for (let i = 0; i < 3; i++)
    expect(await consumeContactQuota(db, "source" + i, "email", now)).toBe(
      true,
    );
  expect(await consumeContactQuota(db, "autre", "email", now)).toBe(false);
  expect(
    await consumeContactQuota(
      db,
      "autre",
      "email",
      new Date("2026-09-16T11:05:00Z"),
    ),
  ).toBe(true);
});
it("limite une même source à vingt messages et supprime les anciens compteurs", async () => {
  const { db } = await setup();
  const now = new Date("2026-09-16T10:05:00Z");
  for (let i = 0; i < 20; i++)
    expect(await consumeContactQuota(db, "source", "email" + i, now)).toBe(
      true,
    );
  expect(await consumeContactQuota(db, "source", "email21", now)).toBe(false);
  await consumeContactQuota(
    db,
    "source",
    "email",
    new Date("2026-09-18T10:05:00Z"),
  );
  expect(
    (
      await db.one<{ count: number }>(
        "SELECT count(*) AS count FROM contact_request_limits",
      )
    )?.count,
  ).toBe(2);
});
it("interdit les compteurs aux clients Supabase et au rôle du budget", async () => {
  const { pg } = await setup();
  await pg.exec("SET ROLE budget_app");
  await expect(
    pg.query("SELECT * FROM contact_request_limits"),
  ).rejects.toThrow(/permission denied/);
});
