// Installe (ou remet à jour) le schéma du budget dans la base Supabase.
//
//   node --env-file=.env.local scripts/appliquer-schema.mjs
//
// Passe par DIRECT_URL et non par le répartiteur : créer des tables, un rôle et des
// règles, ce n'est pas une requête de tous les jours, et le répartiteur n'est pas fait
// pour ça. L'application, elle, continue de passer par DATABASE_URL.
//
// Le fichier de schéma se repasse sans dommage sur une base déjà installée : les tables
// ne sont créées que si elles manquent, et les règles sont retirées avant d'être
// reposées. Il ne détruit aucune donnée.
import { readFileSync } from "node:fs";
import { Client } from "pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL (ou DATABASE_URL) absent. Lancer avec --env-file=.env.local.");
  process.exit(1);
}

const schema = readFileSync(new URL("../src/db/schema.pg.sql", import.meta.url), "utf8");
const client = new Client({ connectionString: url });

try {
  await client.connect();
  await client.query(schema);
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`,
  );
  console.log(`Schéma posé. Tables présentes : ${rows.map((r) => r.table_name).join(", ")}`);
} catch (e) {
  console.error("Échec :", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
