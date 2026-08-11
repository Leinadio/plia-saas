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
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { listAccounts, totalBalance, upsertAccount } from "../../src/db/repositories/accounts";
import { listGroups, insertGroup, insertLine } from "../../src/db/repositories/groups";
import { listTransactions, upsertTransaction } from "../../src/db/repositories/transactions";

// Deux mondes séparés dans une même base. Daniel a son CIC, Maeva sa Société Générale,
// et chacun ses transactions et ses dépenses.
async function deuxMondes(): Promise<Db> {
  const db = dbFrom(await createTestDb());
  await db.run(`CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL, "updatedAt" TIMESTAMPTZ NOT NULL
  )`);
  for (const [id, email] of [["u-daniel", "daniel@x.fr"], ["u-maeva", "maeva@x.fr"]]) {
    await db.run(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, FALSE, '2026-08-09', '2026-08-09')`, [id, id, email]);
  }

  const compte = async (id: string, nom: string, solde: number, user: string) => {
    await upsertAccount(db, { id, name: nom, iban_masked: null, balance: solde, currency: "EUR", last_synced: null }, user);
  };
  await compte("cic", "CIC", 1000, "u-daniel");
  await compte("sg", "Société Générale", 500, "u-maeva");

  const gd = await insertGroup(db, "cic", "Courses", "out", 400, "2026-01", null);
  await insertLine(db, gd, "Boulangerie", 50);
  await insertGroup(db, "sg", "Loyer", "out", 900, "2026-01", null);

  await upsertTransaction(db, { id: "t-daniel", account_id: "cic", date: "2026-08-01", amount: -20, label: "CARREFOUR" });
  await upsertTransaction(db, { id: "t-maeva", account_id: "sg", date: "2026-08-02", amount: -30, label: "MONOPRIX" });
  return db;
}

test("chacun ne voit que ses comptes bancaires", async () => {
  const db = await deuxMondes();
  expect((await listAccounts(db, "u-daniel")).map((a) => a.id)).toEqual(["cic"]);
  expect((await listAccounts(db, "u-maeva")).map((a) => a.id)).toEqual(["sg"]);
});

// Le solde total est ce que l'écran d'accueil annonce en gros. Il additionnait toute
// la table.
test("le solde total ne cumule que ses comptes", async () => {
  const db = await deuxMondes();
  expect(await totalBalance(db, "u-daniel")).toBe(1000);
  expect(await totalBalance(db, "u-maeva")).toBe(500);
});

test("chacun ne voit que ses transactions", async () => {
  const db = await deuxMondes();
  expect((await listTransactions(db, "u-daniel")).map((t) => t.id)).toEqual(["t-daniel"]);
  expect((await listTransactions(db, "u-maeva")).map((t) => t.id)).toEqual(["t-maeva"]);
});

test("chacun ne voit que ses dépenses et leurs sous-postes", async () => {
  const db = await deuxMondes();
  const daniel = await listGroups(db, "u-daniel");
  expect(daniel.map((g) => g.name)).toEqual(["Courses"]);
  expect(daniel[0].lines.map((l) => l.name)).toEqual(["Boulangerie"]);
  expect((await listGroups(db, "u-maeva")).map((g) => g.name)).toEqual(["Loyer"]);
});


// Un identifiant qui ne correspond à personne ne doit pas ouvrir la base. C'est le cas
// d'une session périmée dont le compte a été supprimé.
test("un utilisateur inconnu ne voit rien", async () => {
  const db = await deuxMondes();
  expect(await listAccounts(db, "u-fantome")).toEqual([]);
  expect(await listTransactions(db, "u-fantome")).toEqual([]);
  expect(await listGroups(db, "u-fantome")).toEqual([]);
  expect(await totalBalance(db, "u-fantome")).toBe(0);
});
