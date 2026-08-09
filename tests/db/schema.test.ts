import { expect, test } from "vitest";
import { getDb } from "../../src/db/index";

// Les tables qu'une base neuve doit porter. La liste est volontairement exhaustive :
// une table qui apparaît sans être ici est une table que personne n'a décidée, et une
// table qui disparaît d'ici sans raison est un pan de l'application qui s'en va.
// Six tables de la première version en sont sorties, cf. migrateDropDeadTables.
const ATTENDUES = [
  "accounts", "transactions", "settings", "groups", "group_lines", "reconcile_ignored",
  "budget_amounts", "line_amounts", "dismissed_notifications", "bank_connections",
];

test("le schéma crée les tables attendues et rien de plus", () => {
  const db = getDb(":memory:");
  const tables = (db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[])
    .map((r) => r.name)
    // sqlite_sequence est créée par SQLite lui-même dès qu'une table AUTOINCREMENT existe.
    .filter((n) => !n.startsWith("sqlite_"));

  expect(tables.sort()).toEqual([...ATTENDUES].sort());
});
