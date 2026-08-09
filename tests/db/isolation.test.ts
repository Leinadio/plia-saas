// --- Personne ne voit les données de personne d'autre -------------------------
//
// L'authentification dit qui entre. Elle ne dit pas ce que chacun voit. Une colonne
// user_id sur les comptes ne protège rien tant qu'aucune requête ne la lit : un
// utilisateur parfaitement connecté qui atterrit sur une page dont la requête ne
// filtre pas voit tout le monde.
//
// Ce fichier tient la règle par le seul bout qui vaille : deux utilisateurs, chacun
// sa banque, et rien qui traverse. Chaque fonction de lecture ajoutée au projet doit
// venir se déclarer ici.
import { expect, test } from "vitest";
import type Database from "better-sqlite3";
import { getDb } from "../../src/db/index";
import { listAccounts, totalBalance, upsertAccount } from "../../src/db/repositories/accounts";
import { listGroups, insertGroup, insertLine } from "../../src/db/repositories/groups";
import { listTransactions, upsertTransaction } from "../../src/db/repositories/transactions";

// Deux mondes séparés dans une même base. Daniel a son CIC, Maeva sa Société Générale,
// et chacun ses transactions et ses dépenses.
function deuxMondes(): Database.Database {
  const db = getDb(":memory:");
  db.exec(`CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL, createdAt DATE NOT NULL, updatedAt DATE NOT NULL
  )`);
  for (const [id, email] of [["u-daniel", "daniel@x.fr"], ["u-maeva", "maeva@x.fr"]]) {
    db.prepare(
      `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, 0, '2026-08-09', '2026-08-09')`,
    ).run(id, id, email);
  }

  const compte = (id: string, nom: string, solde: number, user: string) => {
    upsertAccount(db, { id, name: nom, iban_masked: null, balance: solde, currency: "EUR", last_synced: null }, user);
  };
  compte("cic", "CIC", 1000, "u-daniel");
  compte("sg", "Société Générale", 500, "u-maeva");

  const gd = insertGroup(db, "cic", "Courses", "out", 400, "2026-01", null);
  insertLine(db, gd, "Boulangerie", 50);
  insertGroup(db, "sg", "Loyer", "out", 900, "2026-01", null);

  upsertTransaction(db, { id: "t-daniel", account_id: "cic", date: "2026-08-01", amount: -20, label: "CARREFOUR" });
  upsertTransaction(db, { id: "t-maeva", account_id: "sg", date: "2026-08-02", amount: -30, label: "MONOPRIX" });
  return db;
}

test("chacun ne voit que ses comptes bancaires", () => {
  const db = deuxMondes();
  expect(listAccounts(db, "u-daniel").map((a) => a.id)).toEqual(["cic"]);
  expect(listAccounts(db, "u-maeva").map((a) => a.id)).toEqual(["sg"]);
});

// Le solde total est ce que l'écran d'accueil annonce en gros. Il additionnait toute
// la table.
test("le solde total ne cumule que ses comptes", () => {
  const db = deuxMondes();
  expect(totalBalance(db, "u-daniel")).toBe(1000);
  expect(totalBalance(db, "u-maeva")).toBe(500);
});

test("chacun ne voit que ses transactions", () => {
  const db = deuxMondes();
  expect(listTransactions(db, "u-daniel").map((t) => t.id)).toEqual(["t-daniel"]);
  expect(listTransactions(db, "u-maeva").map((t) => t.id)).toEqual(["t-maeva"]);
});

test("chacun ne voit que ses dépenses et leurs sous-postes", () => {
  const db = deuxMondes();
  const daniel = listGroups(db, "u-daniel");
  expect(daniel.map((g) => g.name)).toEqual(["Courses"]);
  expect(daniel[0].lines.map((l) => l.name)).toEqual(["Boulangerie"]);
  expect(listGroups(db, "u-maeva").map((g) => g.name)).toEqual(["Loyer"]);
});

// Un compte sans propriétaire n'appartient à personne, et surtout pas au premier qui
// se connecte. C'est le cas des bases reprises où l'attribution n'a pas pu se décider.
test("un compte orphelin n'apparaît chez personne", () => {
  const db = deuxMondes();
  db.prepare(
    `INSERT INTO accounts (id, name, iban_masked, balance, currency, last_synced)
     VALUES ('perdu', 'Vieux', NULL, 99, 'EUR', NULL)`,
  ).run();
  upsertTransaction(db, { id: "t-perdue", account_id: "perdu", date: "2026-08-03", amount: -5, label: "X" });

  expect(listAccounts(db, "u-daniel").map((a) => a.id)).toEqual(["cic"]);
  expect(listTransactions(db, "u-daniel").map((t) => t.id)).toEqual(["t-daniel"]);
  expect(totalBalance(db, "u-daniel")).toBe(1000);
});

// Un identifiant qui ne correspond à personne ne doit pas ouvrir la base. C'est le cas
// d'une session périmée dont le compte a été supprimé.
test("un utilisateur inconnu ne voit rien", () => {
  const db = deuxMondes();
  expect(listAccounts(db, "u-fantome")).toEqual([]);
  expect(listTransactions(db, "u-fantome")).toEqual([]);
  expect(listGroups(db, "u-fantome")).toEqual([]);
  expect(totalBalance(db, "u-fantome")).toBe(0);
});
