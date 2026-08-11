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
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
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

let db: Db;

beforeEach(async () => {
  db = dbFrom(await createTestDb());
});

// Pose un compte et tout ce qui peut s'y accrocher, pour qu'aucune table n'échappe au
// compte des restes.
async function compteGarni(id: string, userId = TEST_USER) {
  await upsertAccount(db, { id, name: `Banque ${id}`, iban_masked: null, balance: 12, currency: "EUR", last_synced: null }, userId);
  const gid = await insertGroup(db, id, "Courses", "out", 400, "2026-01", null);
  const lid = await insertLine(db, gid, "Boulangerie", 50);
  await setBudgetAmount(db, gid, "2026-07", 400);
  await setLineAmount(db, lid, "2026-07", 50);
  // La provision des non catégorisés : groupe 0, donc portée par le compte lui-même.
  await setBudgetAmount(db, 0, "2026-07", 120, "ongoing", id);
  await upsertTransaction(db, { id: `${id}-t1`, account_id: id, date: "2026-07-05", amount: -20, label: "CARREFOUR" });
  await upsertTransaction(db, { id: `manual:${id}`, account_id: id, date: "2026-07-05", amount: -20, label: "Courses" });
  await ignoreMatch(db, `manual:${id}`, `${id}-t1`);
  // Un dépassement acquitté. L'identité commence par le compte : « compte::cible::mois ».
  await dismissNotification(db, `${id}::g${gid}::2026-07`);
  return { gid, lid };
}

// Ce qui reste accroché à un compte, table par table.
async function restes(id: string) {
  const n = async (sql: string, ...p: unknown[]) => (await db.one<{ n: number }>(sql, p))!.n;
  return {
    comptes: await n(`SELECT COUNT(*) AS n FROM accounts WHERE id = $1`, id),
    transactions: await n(`SELECT COUNT(*) AS n FROM transactions WHERE account_id = $1`, id),
    groupes: await n(`SELECT COUNT(*) AS n FROM groups WHERE account_id = $1`, id),
    lignes: await n(
      `SELECT COUNT(*) AS n FROM group_lines l LEFT JOIN groups g ON g.id = l.group_id WHERE g.id IS NULL`,
    ),
    budgets: await n(
      `SELECT COUNT(*) AS n FROM budget_amounts b
       WHERE b.account_id = $1
          OR (b.group_id <> 0 AND NOT EXISTS (SELECT 1 FROM groups g WHERE g.id = b.group_id))`,
      id,
    ),
    budgetsLignes: await n(
      `SELECT COUNT(*) AS n FROM line_amounts a LEFT JOIN group_lines l ON l.id = a.line_id WHERE l.id IS NULL`,
    ),
    rapprochements: await n(
      `SELECT COUNT(*) AS n FROM reconcile_ignored r
       WHERE NOT EXISTS (SELECT 1 FROM transactions t WHERE t.id = r.manual_id)
          OR NOT EXISTS (SELECT 1 FROM transactions t WHERE t.id = r.synced_id)`,
    ),
    acquittements: await n(`SELECT COUNT(*) AS n FROM dismissed_notifications WHERE id LIKE $1`, `${id}::%`),
  };
}

const RIEN = {
  comptes: 0, transactions: 0, groupes: 0, lignes: 0, budgets: 0,
  budgetsLignes: 0, rapprochements: 0, acquittements: 0,
};

test("supprimer un compte n'en laisse rien dans aucune table", async () => {
  await compteGarni("a1");
  await deleteAccount(db, "a1");
  expect(await restes("a1")).toEqual(RIEN);
});

// La suppression vise un compte, pas la base : le voisin ne doit pas bouger d'une ligne.
test("supprimer un compte ne touche pas au compte voisin", async () => {
  await compteGarni("a1");
  const voisin = await compteGarni("a2");
  await deleteAccount(db, "a1");

  expect((await listAccounts(db, TEST_USER)).map((a) => a.id)).toEqual(["a2"]);
  expect(await restes("a2")).toEqual({ ...RIEN, comptes: 1, transactions: 2, groupes: 1, budgets: 1, acquittements: 1 });
  expect(voisin.gid).toBeGreaterThan(0);
});

// --- Supprimer une banque -----------------------------------------------------
// Débrancher une banque, c'est renoncer à tout ce qu'elle a rapporté. Ses comptes
// partent avec elle : les garder sans autorisation les figerait pour toujours, sans
// jamais pouvoir se resynchroniser ni s'expliquer.
test("supprimer une banque emporte ses comptes et tout ce qui y pend", async () => {
  const cx = await createConnection(db, TEST_USER, "CIC", "FR");
  await setConnectionSession(db, cx, "sess", "2026-11-01T00:00:00Z");
  await compteGarni("a1");
  await compteGarni("a2");
  await attachAccountToConnection(db, "a1", cx);
  await attachAccountToConnection(db, "a2", cx);

  await deleteConnection(db, cx);

  expect(await listConnections(db, TEST_USER)).toEqual([]);
  expect(await restes("a1")).toEqual(RIEN);
  expect(await restes("a2")).toEqual(RIEN);
});

test("supprimer une banque ne touche pas à une autre banque", async () => {
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  const bourso = await createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  await compteGarni("a1");
  await compteGarni("a2");
  await attachAccountToConnection(db, "a1", cic);
  await attachAccountToConnection(db, "a2", bourso);

  await deleteConnection(db, cic);

  expect((await listConnections(db, TEST_USER)).map((c) => c.aspspName)).toEqual(["Boursorama Banque"]);
  expect((await listAccounts(db, TEST_USER)).map((a) => a.id)).toEqual(["a2"]);
  expect(await restes("a1")).toEqual(RIEN);
});

// Une demande abandonnée en route n'a pas de compte à emporter. Elle doit tout de même
// pouvoir se retirer de la liste.
test("supprimer une banque sans aucun compte fonctionne", async () => {
  const cx = await createConnection(db, TEST_USER, "CIC", "FR");
  await deleteConnection(db, cx);
  expect(await listConnections(db, TEST_USER)).toEqual([]);
});
