// node --env-file=.env.local scripts/appliquer-contact.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL ou DATABASE_URL absent.");
const client = new Client({ connectionString });
try {
  await client.connect();
  await client.query(readFileSync(new URL("../src/db/schema-contact.sql", import.meta.url), "utf8"));
  console.log("Compteurs du formulaire de contact prêts.");
} catch {
  console.error("Installation impossible. Vérifiez la connexion et les droits sur la base.");
  process.exitCode = 1;
} finally {
  await client.end();
}
