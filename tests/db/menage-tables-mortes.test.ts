// --- Le ménage des tables mortes ----------------------------------------------
//
// Six tables de la première version ne sont plus lues ni écrites par une seule ligne
// de code. categories et rules et budgets viennent du temps où les dépenses se
// classaient par catégorie avec des règles de mots-clés. group_keywords et
// recurring_payments du temps où un poste attrapait ses opérations par mot-clé.
// overspend_decisions rangeait les décisions de dépassement avant qu'elles ne
// deviennent des notifications acquittables.
//
// Une table morte n'est pas inoffensive. Elle porte des clés étrangères qui bloquent
// des suppressions, elle se recopie dans chaque sauvegarde, et surtout elle laisse
// croire à qui ouvre la base que ces données comptent encore.
//
// Ces tests tournent sur disque et rouvrent la base. Une base « :memory: » ne
// montrerait jamais qu'une migration antérieure recrée ce que celle-ci vient de
// supprimer : c'est précisément le piège que migrateGroupsV2 et migrateBudgets
// tendent, l'une avec group_keywords, l'autre avec budgets.
import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { getDb } from "../../src/db/index";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { insertGroup, insertLine, listGroups } from "../../src/db/repositories/groups";
import { upsertTransaction, listTransactions } from "../../src/db/repositories/transactions";
import { setBudgetAmount } from "../../src/db/repositories/budget-amounts";
import { TEST_USER } from "../helpers/test-user";

const MORTES = ["categories", "rules", "budgets", "recurring_payments", "group_keywords", "overspend_decisions"];

const chemins: string[] = [];
function chemin(): string {
  const dossier = mkdtempSync(join(tmpdir(), "budget-menage-"));
  chemins.push(dossier);
  return join(dossier, "test.db");
}
afterEach(() => {
  while (chemins.length > 0) rmSync(chemins.pop()!, { recursive: true, force: true });
});

const tables = (db: Database.Database) =>
  (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as { name: string }[]).map((t) => t.name);
const colonnes = (db: Database.Database, table: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);

// Une base d'avant le ménage, garnie comme celle d'un vrai utilisateur : les six
// tables portent des restes, et le budget vivant tient debout à côté.
function baseGarnie(path: string) {
  const db = getDb(path);
  upsertAccount(db, { id: "a1", name: "CIC", iban_masked: null, balance: 100, currency: "EUR", last_synced: null }, TEST_USER);
  const gid = insertGroup(db, "a1", "Courses", "out", 400, "2026-01", null);
  const lid = insertLine(db, gid, "Boulangerie", 50);
  setBudgetAmount(db, gid, "2026-07", 400);
  upsertTransaction(db, { id: "t1", account_id: "a1", date: "2026-07-05", amount: -20, label: "CARREFOUR" });

  // Les six tables telles qu'une base d'avant le ménage les porte. Le schéma de
  // référence ne les crée plus : c'est au test de reconstituer l'ancien état, sinon
  // il ne prouverait rien d'autre que l'absence de ce qui n'a jamais existé.
  db.exec(`
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
    CREATE TABLE rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT, keyword TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id));
    CREATE TABLE budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      monthly_limit REAL NOT NULL, UNIQUE(category_id));
    CREATE TABLE recurring_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, keyword TEXT NOT NULL,
      expected_amount REAL NOT NULL);
    CREATE TABLE group_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      keyword TEXT NOT NULL);
    CREATE TABLE overspend_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      group_id INTEGER NOT NULL, line_id INTEGER NOT NULL DEFAULT 0,
      month TEXT NOT NULL, decision TEXT NOT NULL, decided_at TEXT NOT NULL, writes TEXT,
      UNIQUE(account_id, group_id, line_id, month));
    ALTER TABLE transactions ADD COLUMN category_id INTEGER REFERENCES categories(id);
  `);
  db.prepare(`INSERT INTO categories (id, name) VALUES (1, 'Alimentation')`).run();
  db.prepare(`INSERT INTO rules (keyword, category_id) VALUES ('carrefour', 1)`).run();
  db.prepare(`INSERT INTO budgets (category_id, monthly_limit) VALUES (1, 300)`).run();
  db.prepare(`INSERT INTO recurring_payments (name, keyword, expected_amount) VALUES ('Netflix', 'netflix', 15)`).run();
  db.prepare(`INSERT INTO group_keywords (group_id, keyword) VALUES (?, 'carrefour')`).run(gid);
  db.prepare(
    `INSERT INTO overspend_decisions (account_id, group_id, line_id, month, decision, decided_at)
     VALUES ('a1', ?, 0, '2026-07', 'exceptional', '2026-07-31T00:00:00Z')`,
  ).run(gid);
  // Une opération classée à l'ancienne : la colonne category_id part avec sa table.
  db.prepare(`UPDATE transactions SET category_id = 1 WHERE id = 't1'`).run();
  db.close();
  return { gid, lid };
}

test("les six tables mortes disparaissent en rouvrant la base", () => {
  const path = chemin();
  baseGarnie(path);

  const db = getDb(path);
  const restantes = tables(db);
  db.close();

  for (const morte of MORTES) expect(restantes).not.toContain(morte);
});

// La colonne category_id des opérations part avec categories : sans elle, la clé
// étrangère pointerait dans le vide et le schéma mentirait sur ce qui est classé.
test("la colonne category_id des opérations disparaît aussi", () => {
  const path = chemin();
  baseGarnie(path);

  const db = getDb(path);
  const cols = colonnes(db, "transactions");
  db.close();

  expect(cols).not.toContain("category_id");
  // Le reste de la colonne est intact : le ménage ne recrée pas la table à la va-vite.
  expect(cols).toEqual(expect.arrayContaining(["id", "account_id", "date", "amount", "label", "group_id", "line_id", "excluded", "ignored", "manual", "note", "comment"]));
});

// Le vrai risque du ménage : emporter le budget avec les vestiges.
test("le budget vivant survit au ménage", () => {
  const path = chemin();
  baseGarnie(path);

  const db = getDb(path);
  const groupes = listGroups(db, TEST_USER);
  const txns = listTransactions(db, TEST_USER);
  const restantes = tables(db);
  db.close();

  expect(groupes.map((g) => g.name)).toEqual(["Courses"]);
  expect(groupes[0].lines.map((l) => l.name)).toEqual(["Boulangerie"]);
  expect(txns).toHaveLength(1);
  // L'opération garde tout ce qui la rattache à son budget.
  expect(txns[0].label).toBe("CARREFOUR");
  expect(txns[0].amount).toBe(-20);
  for (const vivante of ["accounts", "transactions", "groups", "group_lines", "budget_amounts", "line_amounts", "bank_connections", "settings", "dismissed_notifications", "reconcile_ignored"]) {
    expect(restantes).toContain(vivante);
  }
});

// Le piège que seule une base sur disque révèle : une migration antérieure recrée ce
// que celle-ci vient de supprimer, et le ménage se défait à chaque démarrage.
test("les tables mortes ne repoussent pas au démarrage suivant", () => {
  const path = chemin();
  baseGarnie(path);

  getDb(path).close();
  getDb(path).close();
  const db = getDb(path);
  const restantes = tables(db);
  const cols = colonnes(db, "transactions");
  db.close();

  for (const morte of MORTES) expect(restantes).not.toContain(morte);
  expect(cols).not.toContain("category_id");
});

// Une base neuve ne doit pas les créer pour les supprimer aussitôt.
test("une base neuve ne les crée jamais", () => {
  const db = getDb(":memory:");
  const restantes = tables(db);
  for (const morte of MORTES) expect(restantes).not.toContain(morte);
  expect(colonnes(db, "transactions")).not.toContain("category_id");
});
