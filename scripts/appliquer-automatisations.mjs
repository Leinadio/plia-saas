// node --env-file=.env.local scripts/appliquer-automatisations.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";
const schema = readFileSync(
  new URL("../src/db/schema.pg.sql", import.meta.url),
  "utf8",
);
const marker = "-- AUTOMATION_SCHEMA_START";
if (!schema.includes(marker))
  throw new Error("Schéma des automatisations introuvable.");
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Adresse de base absente.");
const client = new Client({ connectionString });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(schema.slice(schema.indexOf(marker)));
  await client.query("COMMIT");
  console.log(
    "Règles et notifications installées. Aucune transaction modifiée.",
  );
} catch {
  await client.query("ROLLBACK").catch(() => {});
  console.error(
    "Installation impossible. Vérifiez la connexion et les droits de la base.",
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
