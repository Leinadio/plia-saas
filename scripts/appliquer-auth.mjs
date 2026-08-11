// Installe les tables de connexion (user, session, account, verification).
//
//   node --env-file=.env.local scripts/appliquer-auth.mjs
//
// Le contenu vient de src/db/schema-auth.sql, produit par l'outil de Better Auth et
// non écrit à la main : des tables qui divergeraient de ce que la bibliothèque attend
// se verraient à la première inscription, et pas avant.
import { readFileSync } from "node:fs";
import { Client } from "pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL (ou DATABASE_URL) absent. Lancer avec --env-file=.env.local.");
  process.exit(1);
}

const schema = readFileSync(new URL("../src/db/schema-auth.sql", import.meta.url), "utf8");
const client = new Client({ connectionString: url });

try {
  await client.connect();
  await client.query(schema);
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN ('user','session','account','verification')
     ORDER BY table_name`,
  );
  console.log(`Tables de connexion en place : ${rows.map((r) => r.table_name).join(", ")}`);
} catch (e) {
  console.error("Échec :", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
