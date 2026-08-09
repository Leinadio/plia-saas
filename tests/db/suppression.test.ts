// --- Supprimer un compte, supprimer une banque --------------------------------
//
// Un compte bancaire n'est pas une ligne isolée : tout le budget pend à lui. Ses
// opérations, ses dépenses et leurs sous-postes, les montants datés de chacun, la
// provision des non catégorisés, les dépassements acquittés, les rapprochements
// écartés. Supprimer le compte sans les emporter laisse des orphelins que plus rien
// ne rattache à quoi que ce soit : ils ne s'affichent nulle part, ils ne se
// suppriment plus jamais, et le jour où un identifiant est réattribué ils ressortent
// sur le compte de quelqu'un d'autre.
//
// D'où ce fichier, qui vérifie table par table qu'il ne reste rien. Il est écrit en
// négatif exprès : la seule assertion qui vaille est « zéro ligne partout ».
import { beforeEach, expect, test } from "vitest";
import type Database from "better-sqlite3";
import { getDb } from "../../src/db/index";
import { upsertAccount, deleteAccount, listAccounts } from "../../src/db/repositories/accounts";
import {
  createConnection, attachAccountToConnection, listConnections, setConnectionSession,
  deleteConnection,
} from "../../src/db/repositories/bank-connections";
import { insertGroup, insertLine } from "../../src/db/repositories/groups";
import { upsertTransaction, ignoreMatch } from "../../src/db/repositories/transactions";
import { setBudgetAmount } from "../../src/db/repositories/budget-amounts";
import { setLineAmount } from "../../src/db/repositories/line-amounts";
import { dismissNotification } from "../../src/db/repositories/dismissed-notifications";
import { TEST_USER } from "../helpers/test-user";

let db: Database.Database;

beforeEach(() => {
  db = getDb(":memory:");
});

// Pose un compte et tout ce qui peut s'y accrocher, pour qu'aucune table n'échappe au
// compte des restes.
function compteGarni(id: string, userId = TEST_USER) {
  upsertAccount(db, { id, name: `Banque ${id}`, iban_masked: null, balance: 12, currency: "EUR", last_synced: null }, userId);
  const gid = insertGroup(db, id, "Courses", "out", 400, "2026-01", null);
  const lid = insertLine(db, gid, "Boulangerie", 50);
  setBudgetAmount(db, gid, "2026-07", 400);
  setLineAmount(db, lid, "2026-07", 50);
  // La provision des non catégorisés : groupe 0, donc portée par le compte lui-même.
  setBudgetAmount(db, 0, "2026-07", 120, "ongoing", id);
  upsertTransaction(db, { id: `${id}-t1`, account_id: id, date: "2026-07-05", amount: -20, label: "CARREFOUR" });
  upsertTransaction(db, { id: `manual:${id}`, account_id: id, date: "2026-07-05", amount: -20, label: "Courses" });
  ignoreMatch(db, `manual:${id}`, `${id}-t1`);
  // Un dépassement acquitté. L'identité commence par le compte : « compte::cible::mois ».
  dismissNotification(db, `${id}::g${gid}::2026-07`);
  return { gid, lid };
}

// Ce qui reste accroché à un compte, table par table.
function restes(id: string) {
  const n = (sql: string, ...p: unknown[]) =>
    (db.prepare(sql).get(...p) as { n: number }).n;
  return {
    comptes: n(`SELECT COUNT(*) AS n FROM accounts WHERE id = ?`, id),
    transactions: n(`SELECT COUNT(*) AS n FROM transactions WHERE account_id = ?`, id),
    groupes: n(`SELECT COUNT(*) AS n FROM groups WHERE account_id = ?`, id),
    lignes: n(
      `SELECT COUNT(*) AS n FROM group_lines l LEFT JOIN groups g ON g.id = l.group_id WHERE g.id IS NULL`,
    ),
    budgets: n(
      `SELECT COUNT(*) AS n FROM budget_amounts b
       WHERE b.account_id = ?
          OR (b.group_id <> 0 AND NOT EXISTS (SELECT 1 FROM groups g WHERE g.id = b.group_id))`,
      id,
    ),
    budgetsLignes: n(
      `SELECT COUNT(*) AS n FROM line_amounts a LEFT JOIN group_lines l ON l.id = a.line_id WHERE l.id IS NULL`,
    ),
    rapprochements: n(
      `SELECT COUNT(*) AS n FROM reconcile_ignored r
       WHERE NOT EXISTS (SELECT 1 FROM transactions t WHERE t.id = r.manual_id)
          OR NOT EXISTS (SELECT 1 FROM transactions t WHERE t.id = r.synced_id)`,
    ),
    acquittements: n(`SELECT COUNT(*) AS n FROM dismissed_notifications WHERE id LIKE ?`, `${id}::%`),
  };
}

const RIEN = {
  comptes: 0, transactions: 0, groupes: 0, lignes: 0, budgets: 0,
  budgetsLignes: 0, rapprochements: 0, acquittements: 0,
};

test("supprimer un compte n'en laisse rien dans aucune table", () => {
  compteGarni("a1");
  deleteAccount(db, "a1");
  expect(restes("a1")).toEqual(RIEN);
});

// La suppression vise un compte, pas la base : le voisin ne doit pas bouger d'une ligne.
test("supprimer un compte ne touche pas au compte voisin", () => {
  compteGarni("a1");
  const voisin = compteGarni("a2");
  deleteAccount(db, "a1");

  expect(listAccounts(db, TEST_USER).map((a) => a.id)).toEqual(["a2"]);
  expect(restes("a2")).toEqual({ ...RIEN, comptes: 1, transactions: 2, groupes: 1, budgets: 1, acquittements: 1 });
  expect(voisin.gid).toBeGreaterThan(0);
});

// --- Supprimer une banque -----------------------------------------------------
// Débrancher une banque, c'est renoncer à tout ce qu'elle a rapporté. Ses comptes
// partent avec elle : les garder sans autorisation les figerait pour toujours, sans
// jamais pouvoir se resynchroniser ni s'expliquer.
test("supprimer une banque emporte ses comptes et tout ce qui y pend", () => {
  const cx = createConnection(db, TEST_USER, "CIC", "FR");
  setConnectionSession(db, cx, "sess", "2026-11-01T00:00:00Z");
  compteGarni("a1");
  compteGarni("a2");
  attachAccountToConnection(db, "a1", cx);
  attachAccountToConnection(db, "a2", cx);

  deleteConnection(db, cx);

  expect(listConnections(db, TEST_USER)).toEqual([]);
  expect(restes("a1")).toEqual(RIEN);
  expect(restes("a2")).toEqual(RIEN);
});

test("supprimer une banque ne touche pas à une autre banque", () => {
  const cic = createConnection(db, TEST_USER, "CIC", "FR");
  const bourso = createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  compteGarni("a1");
  compteGarni("a2");
  attachAccountToConnection(db, "a1", cic);
  attachAccountToConnection(db, "a2", bourso);

  deleteConnection(db, cic);

  expect(listConnections(db, TEST_USER).map((c) => c.aspspName)).toEqual(["Boursorama Banque"]);
  expect(listAccounts(db, TEST_USER).map((a) => a.id)).toEqual(["a2"]);
  expect(restes("a1")).toEqual(RIEN);
});

// Une demande abandonnée en route n'a pas de compte à emporter. Elle doit tout de même
// pouvoir se retirer de la liste.
test("supprimer une banque sans aucun compte fonctionne", () => {
  const cx = createConnection(db, TEST_USER, "CIC", "FR");
  deleteConnection(db, cx);
  expect(listConnections(db, TEST_USER)).toEqual([]);
});
