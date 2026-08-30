// --- Le socle Postgres des tests ---------------------------------------------
//
// Première pierre de la migration vers Supabase. Jusqu'ici les tests ouvraient une
// base SQLite en mémoire, qui répond tout de suite et accepte du SQL que Postgres
// refuse. Ils validaient donc du SQL que la production ne verra jamais.
//
// Ici la base de test est un VRAI Postgres, compilé en WebAssembly et tenu en mémoire
// (PGlite). Pas de serveur à lancer, pas de Docker, et le même SQL qu'en production.
//
// Ce fichier ne teste pas du code métier : il teste le socle sur lequel tous les
// autres vont s'appuyer. Si ces vérifications passent, la traduction du schéma tient
// et le reste de la migration peut commencer.
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";

test("le schéma pose les dix tables du budget", async () => {
  const db = await createTestDb();
  const { rows } = await db.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`,
  );
  expect(rows.map((r) => r.table_name)).toEqual([
    "accounts",
    "bank_connections",
    "budget_amounts",
    "dismissed_notifications",
    "group_lines",
    "groups",
    "line_amounts",
    "onboarding_status",
    "reconcile_ignored",
    "transactions",
  ]);
});

// Le piège que SQLite ne montrait pas : les euros étaient stockés en flottant, et
// 0.1 + 0.2 y vaut 0.30000000000000004. Postgres sait faire du décimal exact, et la
// traduction du schéma en profite. Ce test verrouille ce choix : quelqu'un qui
// remettrait un `double precision` sur les montants le casserait ici.
test("les montants sont exacts au centime", async () => {
  const db = await createTestDb();
  await db.query(`INSERT INTO accounts (id, name, user_id) VALUES ('c1', 'Courant', 'u1')`);
  await db.query(
    `INSERT INTO transactions (id, account_id, date, amount, label)
     VALUES ('t1', 'c1', '2026-01-15', 0.1, 'a'), ('t2', 'c1', '2026-01-15', 0.2, 'b')`,
  );
  const { rows } = await db.query<{ total: string }>(
    `SELECT SUM(amount)::text AS total FROM transactions`,
  );
  expect(rows[0].total).toBe("0.30");
});

// Deux bases ouvertes en même temps ne doivent rien partager. Certains tests
// comparent deux états côte à côte ; si les deux tapaient dans la même base, ils
// passeraient au vert pour de mauvaises raisons.
test("deux bases ouvertes ensemble s'ignorent", async () => {
  const a = await createTestDb();
  await a.query(`INSERT INTO accounts (id, name, user_id) VALUES ('c1', 'Courant', 'u1')`);
  const b = await createTestDb();
  const { rows } = await b.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM accounts`);
  expect(rows[0].n).toBe(0);
});

// Les moteurs sont recyclés d'un test à l'autre pour ne pas payer 600 ms à chaque
// fois. Le recyclage ne doit rien laisser passer : ni les lignes du test précédent
// — celui juste au-dessus en a écrit une — ni les compteurs d'identifiants, dont
// beaucoup de tests attendent qu'ils repartent à 1.
test("une base recyclée repart de zéro, compteurs compris", async () => {
  const db = await createTestDb();
  const vide = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM accounts`);
  expect(vide.rows[0].n).toBe(0);

  await db.query(`INSERT INTO accounts (id, name, user_id) VALUES ('c1', 'Courant', 'u1')`);
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO groups (account_id, name, direction) VALUES ('c1', 'Courses', 'out') RETURNING id`,
  );
  expect(rows[0].id).toBe(1);
});

// --- La forme exacte des tables ------------------------------------------------
//
// La liste ci-dessous est la forme réelle de la base de production, relevée sur le
// fichier SQLite après toutes ses migrations — et non celle que déclarait l'ancien
// schéma, qui avait pris du retard : il annonçait encore une colonne `day` sur les
// sous-postes, qu'une migration retirait aussitôt. Une traduction faite d'après le
// schéma seul aurait ressuscité une colonne morte, et personne ne l'aurait vu.
//
// Ce test est cher à lire mais c'est le seul qui attrape ce genre de dérive. Il est
// aussi la définition de référence de la base : ce qui n'est pas ici n'existe pas.
const FORME: Record<string, string[]> = {
  accounts: [
    "balance:numeric", "connection_id:integer", "currency:text", "custom_name:text",
    "iban_masked:text", "id:text", "last_synced:text", "name:text", "user_id:text",
  ],
  bank_connections: [
    "account_uids:text", "aspsp_country:text", "aspsp_name:text", "id:integer",
    "session_id:text", "user_id:text", "valid_until:text",
  ],
  budget_amounts: [
    "account_id:text", "amount:numeric", "effective_month:text", "group_id:integer",
    "id:integer", "scope:text",
  ],
  dismissed_notifications: ["dismissed_at:text", "id:text", "user_id:text"],
  group_lines: [
    "amount:numeric", "end_month:text", "group_id:integer", "id:integer",
    "keyword:text", "name:text", "start_month:text",
  ],
  groups: [
    "account_id:text", "direction:text", "end_month:text", "id:integer",
    "monthly_amount:numeric", "name:text", "planned:boolean", "start_month:text",
  ],
  line_amounts: [
    "amount:numeric", "effective_month:text", "id:integer", "line_id:integer",
    "scope:text",
  ],
  onboarding_status: ["completed_at:text", "demo_active:boolean", "demo_visit:jsonb", "user_id:text"],
  reconcile_ignored: ["manual_id:text", "synced_id:text", "user_id:text"],
  transactions: [
    "account_id:text", "amount:numeric", "comment:text", "date:text",
    "excluded:boolean", "group_id:integer", "id:text", "ignored:boolean",
    "label:text", "line_id:integer", "manual:boolean", "note:text",
  ],
};

test.each(Object.entries(FORME))("la table %s a exactement ses colonnes", async (table, attendues) => {
  const db = await createTestDb();
  const { rows } = await db.query<{ c: string }>(
    `SELECT column_name || ':' || data_type AS c FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 ORDER BY column_name`,
    [table],
  );
  expect(rows.map((r) => r.c)).toEqual(attendues);
});

// --- Les index -----------------------------------------------------------------
//
// La base locale n'en avait aucun : sur un seul utilisateur et quelques milliers
// d'opérations, tout balayage est instantané. Partagée entre des centaines de
// personnes, la même table se parcourt en entier à chaque affichage de mois.
//
// Ceux-ci couvrent les seuls chemins qu'emprunte l'application : lister les comptes
// d'une personne, lire les opérations d'un compte sur une période, retrouver ce qui
// est rattaché à une enveloppe ou à un sous-poste. Les budgets datés, eux, sont déjà
// servis par leur contrainte d'unicité.
test("les chemins de lecture ont leur index", async () => {
  const db = await createTestDb();
  const { rows } = await db.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname`,
  );
  const noms = rows.map((r) => r.indexname);
  expect(noms).toContain("accounts_user_id_idx");
  expect(noms).toContain("bank_connections_user_id_idx");
  expect(noms).toContain("transactions_account_date_idx");
  expect(noms).toContain("transactions_group_id_idx");
  expect(noms).toContain("transactions_line_id_idx");
  expect(noms).toContain("groups_account_id_idx");
  expect(noms).toContain("group_lines_group_id_idx");
});
