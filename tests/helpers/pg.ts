// --- La base de test, en Postgres ---------------------------------------------
//
// Un vrai Postgres, compilé en WebAssembly et tenu en mémoire (PGlite). Rien à
// installer, rien à lancer, et le même moteur qu'en production — donc le même SQL,
// les mêmes types, les mêmes refus.
//
// C'est ce qui remplace `getDb(":memory:")`. SQLite acceptait sans broncher des
// requêtes que Supabase rejettera, et arrondissait les euros à sa façon : les tests
// validaient un SQL que la production ne verra jamais.
//
// Chaque appel rend une base vide et indépendante des autres bases vivantes au même
// instant. En revanche les moteurs sont recyclés d'un test à l'autre : allumer un
// Postgres coûte 600 ms, vider ses tables en coûte 5. Sur les quelque cent bases
// qu'ouvre la suite, c'est la différence entre une minute d'attente et une seconde.
// Le recyclage se fait tout seul à la fin de chaque test — rien à fermer à la main,
// et une base gardée dans une variable après la fin d'un test ne vaut plus rien.
import { afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA = readFileSync(join(process.cwd(), "src/db/schema.pg.sql"), "utf8");

// Les moteurs allumés : ceux qu'on peut redonner, et ceux qu'un test tient encore.
const libres: PGlite[] = [];
const occupes: PGlite[] = [];

// Les tables à vider sont relues dans la base à chaque recyclage, jamais écrites ici
// ni retenues d'une fois sur l'autre. Deux raisons : une table ajoutée au schéma serait
// sinon oubliée au vidage, et certains tests posent leurs propres tables — celle des
// inscrits, par exemple, que Better Auth crée en production et que le schéma du budget
// ne connaît pas. Une liste figée les laisserait pleines, et le test suivant buterait
// sur des lignes qu'il n'a pas écrites.
//
// RESTART IDENTITY remet les compteurs d'identifiants à zéro : beaucoup de tests
// attendent que le premier groupe créé porte le numéro 1.
async function vider(db: PGlite): Promise<void> {
  const { rows } = await db.query<{ nom: string }>(
    `SELECT table_name AS nom FROM information_schema.tables WHERE table_schema = 'public'`,
  );
  if (rows.length === 0) return;
  await db.exec(`TRUNCATE ${rows.map((r) => `"${r.nom}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

export async function createTestDb(): Promise<PGlite> {
  const recycle = libres.pop();
  if (recycle) {
    await vider(recycle);
    occupes.push(recycle);
    return recycle;
  }
  const db = new PGlite();
  await db.exec(SCHEMA);
  occupes.push(db);
  return db;
}

afterEach(() => {
  libres.push(...occupes.splice(0));
});
