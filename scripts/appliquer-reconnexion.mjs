// node --env-file=.env.local scripts/appliquer-reconnexion.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const schema = readFileSync(new URL("../src/db/schema.pg.sql", import.meta.url), "utf8");
const migration = schema.split("-- BANK_RECONNECTION_START")[1]?.split("-- BANK_RECONNECTION_END")[0];
if (!migration) throw new Error("Migration de reconnexion introuvable.");
const client = new Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(migration);
  await client.query("COMMIT");
  console.log("Reconnexion installée. Aucun compte ni budget modifié.");
} catch {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Installation impossible. Vérifiez la connexion et les droits de la base.");
  process.exitCode = 1;
} finally {
  await client.end();
}
