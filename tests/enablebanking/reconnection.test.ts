import { beforeEach, expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { TEST_USER } from "../helpers/test-user";
import { upsertAccount, listAccounts } from "../../src/db/repositories/accounts";
import { createConnection, setConnectionSession, attachAccountToConnection } from "../../src/db/repositories/bank-connections";
import { syncConnections } from "../../src/enablebanking/sync-connections";
import { deleteAccount } from "../../src/db/repositories/accounts";
import { pendingTransactions } from "../../src/lib/bank-pending";
import { syncAll } from "../../src/enablebanking/sync";

let db: Db;
let oldConnection: number;
let newConnection: number;
const visited: string[] = [];
const operation = { entry_reference: "salary", booking_date: "2026-10-01", transaction_amount: { amount: "1719.90", currency: "EUR" }, credit_debit_indicator: "CRDT", remittance_information: ["Salaire"] };

async function bank<T>(path: string): Promise<T> {
  visited.push(path);
  if (path === "/sessions/old-session") return { status: "CLOSED", accounts_data: [{ uid: "old", identification_hash: "identity" }] } as T;
  if (path === "/sessions/new-session") return { status: "AUTHORIZED", accounts_data: [{ uid: "new", identification_hash: "identity" }] } as T;
  if (path.startsWith("/accounts/old/")) throw new Error("EXPIRED_SESSION");
  if (path.endsWith("/balances")) return { balances: [{ balance_type: "ITBD", balance_amount: { amount: "1535", currency: "EUR" } }] } as T;
  if (path.endsWith("/details")) return { name: "Nom bancaire", account_id: { iban: "FR000140" }, identification_hash: "identity" } as T;
  if (path.includes("/transactions")) return { transactions: [operation] } as T;
  throw new Error(`Unexpected path: ${path}`);
}

beforeEach(async () => {
  db = dbFrom(await createTestDb());
  visited.length = 0;
  oldConnection = await createConnection(db, TEST_USER, "CIC", "FR");
  await setConnectionSession(db, oldConnection, "old-session", "2020-01-01T00:00:00Z", ["old"]);
  await upsertAccount(db, { id: "old", name: "Courant", iban_masked: "…0140", balance: 745, booked_balance: 745, currency: "EUR", last_synced: null }, TEST_USER);
  await attachAccountToConnection(db, "old", oldConnection);
  await db.run("UPDATE accounts SET custom_name = 'CIC courant' WHERE id = 'old'");
  await db.run("INSERT INTO groups (id, account_id, name, direction) VALUES (10, 'old', 'Salaire', 'in')");
  await db.run("INSERT INTO budget_amounts (group_id, effective_month, amount) VALUES (10, '2026-10', 1719.90)");
  await db.run("INSERT INTO transactions (id, account_id, date, amount, label, group_id, comment) VALUES ('old::salary', 'old', '2026-10-01', 1719.90, 'Salaire', 10, 'À garder')");
  newConnection = await createConnection(db, TEST_USER, "CIC", "FR");
  await setConnectionSession(db, newConnection, "new-session", "2099-01-01T00:00:00Z", ["new"]);
});

test("retrouve le même compte après expiration, son budget et l'argent de départ", async () => {
  const result = await syncConnections(db, { ebGet: bank, userId: TEST_USER, connectionId: newConnection });
  expect(result.imported).toBe(0);
  const accounts = await listAccounts(db, TEST_USER);
  expect(accounts).toHaveLength(1);
  expect(accounts[0]).toMatchObject({ id: "old", custom_name: "CIC courant", balance: 1535, connection_id: newConnection });
  const txns = await db.all<{ amount: number; group_id: number; comment: string }>("SELECT amount, group_id, comment FROM transactions");
  expect(txns).toEqual([{ amount: 1719.9, group_id: 10, comment: "À garder" }]);
  expect(accounts[0].balance - txns[0].amount).toBeCloseTo(-184.9);
  expect(await db.one("SELECT amount FROM budget_amounts WHERE group_id = 10")).toEqual({ amount: 1719.9 });
  await syncConnections(db, { ebGet: bank, userId: TEST_USER });
  expect(await db.all("SELECT id FROM transactions")).toEqual([{ id: "old::salary" }]);
  expect(visited.some(path => path.startsWith("/accounts/old/"))).toBe(false);
});

async function addDuplicate() {
  await upsertAccount(db, { id: "new", name: "Doublon", iban_masked: "…0140", balance: 1535, currency: "EUR", last_synced: null }, TEST_USER);
  await attachAccountToConnection(db, "new", newConnection);
  await db.run("INSERT INTO groups (id, account_id, name, direction) VALUES (20, 'new', 'Nouvelle enveloppe', 'out')");
  await db.run("INSERT INTO transactions (id, account_id, date, amount, label) VALUES ('new::salary', 'new', '2026-10-01', 1719.90, 'Salaire')");
  await db.run("INSERT INTO transactions (id, account_id, date, amount, label, group_id, manual) VALUES ('manual:new', 'new', '2026-09-20', -10, 'Saisie', 20, true)");
}

test("répare les comptes déjà dupliqués sans perdre leurs enveloppes ni doubler les opérations", async () => {
  await addDuplicate();
  await syncConnections(db, { ebGet: bank, userId: TEST_USER });
  expect((await listAccounts(db, TEST_USER)).map(a => a.id)).toEqual(["old"]);
  expect(await db.all("SELECT id, account_id FROM groups ORDER BY id")).toEqual([{ id: 10, account_id: "old" }, { id: 20, account_id: "old" }]);
  expect(await db.all("SELECT id, account_id, group_id FROM transactions ORDER BY id")).toEqual([
    { id: "manual:new", account_id: "old", group_id: 20 }, { id: "old::salary", account_id: "old", group_id: 10 },
  ]);
  expect(await db.all("SELECT id FROM bank_connections")).toEqual([{ id: newConnection }]);
});

test("un conflit de classement annule le rattachement entier", async () => {
  await addDuplicate();
  await db.run("UPDATE transactions SET group_id = 20 WHERE id = 'new::salary'");
  await expect(syncConnections(db, { ebGet: bank, userId: TEST_USER })).rejects.toThrow(/classement/i);
  expect(await db.all("SELECT id, balance FROM accounts ORDER BY id")).toEqual([{ id: "new", balance: 1535 }, { id: "old", balance: 745 }]);
  expect(await db.all("SELECT id, account_id FROM groups ORDER BY id")).toEqual([{ id: 10, account_id: "old" }, { id: 20, account_id: "new" }]);
});

test("ne déduit jamais l'identité des quatre derniers chiffres de l'IBAN", async () => {
  const unavailable = async <T>(path: string): Promise<T> => {
    if (path === "/sessions/old-session") throw new Error("Session introuvable");
    return bank<T>(path);
  };
  await expect(syncConnections(db, { ebGet: unavailable, userId: TEST_USER, connectionId: newConnection })).rejects.toThrow(/identit|identifier/i);
  expect((await listAccounts(db, TEST_USER)).map(a => a.id)).toEqual(["old"]);
});

test("ne rapproche jamais les comptes de deux utilisateurs", async () => {
  await db.run("UPDATE accounts SET user_id = 'someone-else' WHERE id = 'old'");
  await db.run("UPDATE bank_connections SET user_id = 'someone-else' WHERE id = $1", [oldConnection]);
  await syncConnections(db, { ebGet: bank, userId: TEST_USER, connectionId: newConnection });
  expect((await listAccounts(db, TEST_USER)).map(a => a.id)).toEqual(["new"]);
  expect((await listAccounts(db, "someone-else"))[0]).toMatchObject({ id: "old", balance: 745 });
});

test("supprimer un compte reconnecté ne le fait pas réapparaître à la prochaine synchronisation", async () => {
  await syncConnections(db, { ebGet: bank, userId: TEST_USER });
  await db.pourUtilisateur(TEST_USER, t => deleteAccount(t, "old"));
  await syncConnections(db, { ebGet: bank, userId: TEST_USER });
  expect(await listAccounts(db, TEST_USER)).toEqual([]);
});

test("une autorisation expirée laisse les autres banques se synchroniser et reste signalée", async () => {
  await db.run("UPDATE bank_connections SET aspsp_name = 'Autre banque' WHERE id = $1", [newConnection]);
  const result = await syncConnections(db, { ebGet: bank, userId: TEST_USER });
  expect(result).toMatchObject({ imported: 1, banques: 1, expired: ["CIC"] });
  expect((await listAccounts(db, TEST_USER)).find(a => a.id === "old")?.balance).toBe(745);
});

test("transfère les budgets datés, automatisations et rapprochements du doublon", async () => {
  await addDuplicate();
  await db.run("INSERT INTO group_lines (id, group_id, name, amount, keyword) VALUES (21, 20, 'Ligne', 25, 'achat')");
  await db.run("INSERT INTO line_amounts (line_id, effective_month, amount) VALUES (21, '2026-10', 25)");
  await db.run("INSERT INTO budget_amounts (group_id, account_id, effective_month, amount) VALUES (0, 'new', '2026-10', 100), (20, '', '2026-10', 25)");
  await db.run("INSERT INTO transactions (id, account_id, date, amount, label, group_id, line_id, comment, budget_month, ignored) VALUES ('new::purchase', 'new', '2026-09-28', -25, 'Achat', 20, 21, 'Commentaire', '2026-10', true)");
  await db.run("INSERT INTO automation_rules (id, account_id, label, direction, group_id, line_id) VALUES (30, 'new', 'achat', 'out', 20, 21)");
  await db.run("INSERT INTO automation_events (account_id, transaction_id, rule_id, label, target_name, rule_label, amount, transaction_date) VALUES ('new', 'new::purchase', 30, 'Achat', 'Ligne', 'achat', -25, '2026-09-28')");
  await db.run("INSERT INTO reconcile_ignored (user_id, manual_id, synced_id) VALUES ($1, 'manual:new', 'new::purchase')", [TEST_USER]);
  await db.run("INSERT INTO dismissed_notifications (user_id, id, dismissed_at) VALUES ($1, 'new::20::2026-10', '2026-10-02')", [TEST_USER]);
  await syncConnections(db, { ebGet: bank, userId: TEST_USER });
  expect(await db.one("SELECT account_id, group_id, line_id FROM automation_rules WHERE id = 30")).toEqual({ account_id: "old", group_id: 20, line_id: 21 });
  expect(await db.one("SELECT account_id, transaction_id FROM automation_events")).toEqual({ account_id: "old", transaction_id: "old::purchase" });
  expect(await db.one("SELECT synced_id FROM reconcile_ignored")).toEqual({ synced_id: "old::purchase" });
  expect(await db.one("SELECT id FROM dismissed_notifications")).toEqual({ id: "old::20::2026-10" });
  expect(await db.one("SELECT account_id, amount FROM budget_amounts WHERE group_id = 0")).toEqual({ account_id: "old", amount: 100 });
  expect(await db.one("SELECT amount FROM line_amounts WHERE line_id = 21")).toEqual({ amount: 25 });
  expect(await db.one("SELECT ignored, comment, budget_month, group_id, line_id FROM transactions WHERE id = 'old::purchase'"))
    .toEqual({ ignored: true, comment: "Commentaire", budget_month: "2026-10", group_id: 20, line_id: 21 });
});

test("garde le classement en attente du doublon quand l'ancien compte n'en avait pas", async () => {
  await addDuplicate();
  const op = { ...operation, status: "PDNG", credit_debit_indicator: "CRDT" as const };
  await db.run("UPDATE accounts SET pending_transactions = $1::jsonb WHERE id = 'old'", [JSON.stringify(pendingTransactions("old", [op]))]);
  await db.run("UPDATE accounts SET pending_transactions = $1::jsonb WHERE id = 'new'", [JSON.stringify(pendingTransactions("new", [op]).map(p => ({ ...p, groupId: 20, budgetMonth: "2026-11" })))]);
  const pendingBank = async <T>(path: string): Promise<T> => path.includes("/transactions") ? { transactions: [op] } as T : bank<T>(path);
  await syncConnections(db, { ebGet: pendingBank, userId: TEST_USER });
  expect((await listAccounts(db, TEST_USER))[0].pending_transactions?.[0]).toMatchObject({ groupId: 20, budgetMonth: "2026-11" });
});

test("ne perd pas un compte qui n'a pas été partagé pendant la reconnexion", async () => {
  await upsertAccount(db, { id: "unshared", name: "Épargne", iban_masked: "…9999", balance: 1234, currency: "EUR", last_synced: null }, TEST_USER);
  await attachAccountToConnection(db, "unshared", oldConnection);
  const partialBank = async <T>(path: string): Promise<T> => path === "/sessions/old-session"
    ? { accounts_data: [{ uid: "old", identification_hash: "identity" }, { uid: "unshared", identification_hash: "savings" }] } as T
    : bank<T>(path);
  await syncConnections(db, { ebGet: partialBank, userId: TEST_USER });
  expect((await listAccounts(db, TEST_USER)).find(a => a.id === "unshared")).toMatchObject({ balance: 1234, connection_id: oldConnection });
  expect(await db.all("SELECT id FROM bank_connections ORDER BY id")).toEqual([{ id: oldConnection }, { id: newConnection }]);
});

test("une ancienne synchronisation en vol ne rétablit pas un identifiant bancaire périmé après plusieurs renouvellements", async () => {
  await upsertAccount(db, { id: "unshared", name: "Épargne", iban_masked: null, balance: 10, currency: "EUR", last_synced: null }, TEST_USER);
  await attachAccountToConnection(db, "unshared", oldConnection);
  await syncConnections(db, { ebGet: bank, userId: TEST_USER, connectionId: newConnection });
  const outdatedBank = async <T>(path: string): Promise<T> => path.endsWith("/balances")
    ? { balances: [{ balance_amount: { amount: "745", currency: "EUR" } }] } as T : bank<T>(path);
  await syncAll(db, { ebGet: outdatedBank, userId: TEST_USER, connectionId: oldConnection, accountName: "CIC", accountUids: ["middle"] });
  expect((await listAccounts(db, TEST_USER)).find(a => a.id === "old"))
    .toMatchObject({ balance: 1535, bank_uid: "new", connection_id: newConnection });
});

test("reprend le deuxième compte si la première synchronisation de reconnexion s'interrompt", async () => {
  await setConnectionSession(db, newConnection, "new-session", "2099-01-01T00:00:00Z", ["new", "second"]);
  let fail = true;
  const twoAccounts = async <T>(path: string): Promise<T> => {
    if (path === "/sessions/new-session") return { accounts_data: [{ uid: "new", identification_hash: "identity" }, { uid: "second", identification_hash: "second-identity" }] } as T;
    if (path === "/accounts/second/balances" && fail) throw new Error("Banque temporairement indisponible");
    if (path === "/accounts/second/details") return { name: "Épargne", identification_hash: "second-identity" } as T;
    return bank<T>(path);
  };
  await expect(syncConnections(db, { ebGet: twoAccounts, userId: TEST_USER })).rejects.toThrow(/temporairement/);
  fail = false;
  await syncConnections(db, { ebGet: twoAccounts, userId: TEST_USER });
  expect((await listAccounts(db, TEST_USER)).map(a => a.id).sort()).toEqual(["old", "second"]);
});
