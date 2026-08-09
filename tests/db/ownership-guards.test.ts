// Les gardes qui répondent « est-ce à lui ». Tout le reste de la protection en
// écriture s'y adosse, donc elles doivent être justes sur les cas tordus autant que
// sur les cas simples : l'objet d'un autre, l'objet qui n'existe pas, l'objet dont le
// compte n'a pas de propriétaire.
import { expect, test } from "vitest";
import type Database from "better-sqlite3";
import { getDb } from "../../src/db/index";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { insertGroup, insertLine } from "../../src/db/repositories/groups";
import { upsertTransaction } from "../../src/db/repositories/transactions";
import {
  ownsAccount, ownsGroup, ownsLine, ownsTransaction, ownsGroupOrUncategorized,
} from "../../src/db/repositories/ownership";

const MOI = "u-moi";
const AUTRE = "u-autre";

function base(): { db: Database.Database; gMoi: number; gAutre: number; lMoi: number } {
  const db = getDb(":memory:");
  upsertAccount(db, { id: "moi", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, MOI);
  upsertAccount(db, { id: "autre", name: "SG", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, AUTRE);
  // Un compte hérité, sans propriétaire : il n'est à personne.
  db.prepare(
    `INSERT INTO accounts (id, name, iban_masked, balance, currency, last_synced)
     VALUES ('orphelin', 'Vieux', NULL, 0, 'EUR', NULL)`,
  ).run();

  const gMoi = insertGroup(db, "moi", "Courses", "out", 400, "2026-01", null);
  const gAutre = insertGroup(db, "autre", "Loyer", "out", 900, "2026-01", null);
  const lMoi = insertLine(db, gMoi, "Boulangerie", 50);
  insertGroup(db, "orphelin", "Perdu", "out", 10, "2026-01", null);

  upsertTransaction(db, { id: "t-moi", account_id: "moi", date: "2026-08-01", amount: -20, label: "X", category_id: null });
  upsertTransaction(db, { id: "t-autre", account_id: "autre", date: "2026-08-01", amount: -20, label: "Y", category_id: null });
  return { db, gMoi, gAutre, lMoi };
}

test("un compte est à son propriétaire et à personne d'autre", () => {
  const { db } = base();
  expect(ownsAccount(db, MOI, "moi")).toBe(true);
  expect(ownsAccount(db, MOI, "autre")).toBe(false);
  expect(ownsAccount(db, MOI, "orphelin")).toBe(false);
});

test("une dépense suit son compte", () => {
  const { db, gMoi, gAutre } = base();
  expect(ownsGroup(db, MOI, gMoi)).toBe(true);
  expect(ownsGroup(db, MOI, gAutre)).toBe(false);
  expect(ownsGroup(db, AUTRE, gMoi)).toBe(false);
});

test("un sous-poste suit sa dépense, qui suit son compte", () => {
  const { db, lMoi } = base();
  expect(ownsLine(db, MOI, lMoi)).toBe(true);
  expect(ownsLine(db, AUTRE, lMoi)).toBe(false);
});

test("une transaction suit son compte", () => {
  const { db } = base();
  expect(ownsTransaction(db, MOI, "t-moi")).toBe(true);
  expect(ownsTransaction(db, MOI, "t-autre")).toBe(false);
});

// Un objet qui n'existe pas répond comme un objet qui n'est pas à soi. Distinguer les
// deux dirait à l'appelant quels numéros existent, ce qui est déjà un renseignement.
test("ce qui n'existe pas n'appartient à personne", () => {
  const { db } = base();
  expect(ownsGroup(db, MOI, 99999)).toBe(false);
  expect(ownsLine(db, MOI, 99999)).toBe(false);
  expect(ownsTransaction(db, MOI, "jamais-vue")).toBe(false);
  expect(ownsAccount(db, MOI, "jamais-vu")).toBe(false);
});

// Le groupe 0 n'est pas un groupe : il désigne les non catégorisés d'un compte, dont
// la provision se règle comme un budget. C'est donc le compte qui décide.
test("le groupe zéro se juge sur son compte", () => {
  const { db, gMoi } = base();
  expect(ownsGroupOrUncategorized(db, MOI, 0, "moi")).toBe(true);
  expect(ownsGroupOrUncategorized(db, MOI, 0, "autre")).toBe(false);
  expect(ownsGroupOrUncategorized(db, MOI, 0, null)).toBe(false);
  expect(ownsGroupOrUncategorized(db, MOI, gMoi, null)).toBe(true);
});
