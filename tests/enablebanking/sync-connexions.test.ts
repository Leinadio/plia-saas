// --- Synchroniser les banques d'un utilisateur --------------------------------
//
// Cette boucle vivait dans la route POST /api/sync, donc nulle part où un test puisse
// l'atteindre. Elle sert désormais à deux endroits : le bouton de rafraîchissement,
// qui passe toutes les banques en revue, et le retour d'autorisation, qui importe la
// banque tout juste connectée sans attendre un clic.
//
// Ce qu'elle doit savoir : de quels comptes parler pour chaque banque. Les comptes
// déjà en base font foi ; à la toute première synchronisation il n'y en a aucun, et
// c'est la liste d'uid rapportée par la banque à l'autorisation qui prend le relais.
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { syncConnections } from "../../src/enablebanking/sync-connections";
import { createConnection, setConnectionSession, attachAccountToConnection } from "../../src/db/repositories/bank-connections";
import { upsertAccount, listAccounts } from "../../src/db/repositories/accounts";
import { listTransactions } from "../../src/db/repositories/transactions";
import { TEST_USER } from "../helpers/test-user";

// Un faux Enable Banking qui rend une opération par compte, nommée d'après lui.
const ebGet = async <T>(path: string): Promise<T> => {
  const uid = path.split("/")[2];
  if (path.includes("/balances")) return { balances: [{ balance_amount: { amount: "100.00", currency: "EUR" } }] } as T;
  if (path.includes("/details")) return { name: `Compte ${uid}` } as T;
  if (path.includes("/transactions"))
    return {
      transactions: [{
        entry_reference: `tx-${uid}`,
        booking_date: "2026-07-01",
        transaction_amount: { amount: "10.00", currency: "EUR" },
        credit_debit_indicator: "DBIT",
        remittance_information: ["CARREFOUR"],
      }],
    } as T;
  return {} as T;
};

// Le cas du retour d'autorisation : la banque vient de dire oui, aucun compte n'est
// encore en base, et pourtant les opérations doivent arriver seules.
test("importe les comptes annoncés par une banque tout juste autorisée", async () => {
  const db = dbFrom(await createTestDb());
  const cx = await createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  await setConnectionSession(db, cx, "sess", "2026-11-01T00:00:00Z", ["acc-neuf"]);

  const res = await syncConnections(db, { ebGet, userId: TEST_USER });

  expect(res.imported).toBe(1);
  expect((await listAccounts(db, TEST_USER)).map((a) => a.id)).toEqual(["acc-neuf"]);
  expect(await listTransactions(db, TEST_USER)).toHaveLength(1);
});

// Le rafraîchissement courant : toutes les banques y passent, chacune avec ses comptes.
test("passe toutes les banques en revue", async () => {
  const db = dbFrom(await createTestDb());
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  const bourso = await createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  await setConnectionSession(db, cic, "s1", "2026-11-01T00:00:00Z", ["acc-cic"]);
  await setConnectionSession(db, bourso, "s2", "2026-11-01T00:00:00Z", ["acc-bourso"]);

  const res = await syncConnections(db, { ebGet, userId: TEST_USER });

  expect(res.imported).toBe(2);
  expect((await listAccounts(db, TEST_USER)).map((a) => a.id).sort()).toEqual(["acc-bourso", "acc-cic"]);
});

// Le retour d'autorisation ne concerne qu'une banque. Resynchroniser les autres au
// passage ferait attendre l'utilisateur pour des comptes qu'il n'a pas demandés.
test("ne synchronise qu'une banque quand on la nomme", async () => {
  const db = dbFrom(await createTestDb());
  const cic = await createConnection(db, TEST_USER, "CIC", "FR");
  const bourso = await createConnection(db, TEST_USER, "Boursorama Banque", "FR");
  await setConnectionSession(db, cic, "s1", "2026-11-01T00:00:00Z", ["acc-cic"]);
  await setConnectionSession(db, bourso, "s2", "2026-11-01T00:00:00Z", ["acc-bourso"]);

  await syncConnections(db, { ebGet, userId: TEST_USER, connectionId: bourso });

  expect((await listAccounts(db, TEST_USER)).map((a) => a.id)).toEqual(["acc-bourso"]);
});

// Une fois les comptes en base, ce sont eux qui font foi : la liste d'uid rapportée à
// l'autorisation vieillit, un compte supprimé chez nous ne doit pas revenir tout seul.
test("préfère les comptes en base à la liste d'origine", async () => {
  const db = dbFrom(await createTestDb());
  const cx = await createConnection(db, TEST_USER, "CIC", "FR");
  await setConnectionSession(db, cx, "s1", "2026-11-01T00:00:00Z", ["acc-vieux", "acc-garde"]);
  await upsertAccount(db, { id: "acc-garde", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  await attachAccountToConnection(db, "acc-garde", cx);

  await syncConnections(db, { ebGet, userId: TEST_USER });

  expect((await listAccounts(db, TEST_USER)).map((a) => a.id)).toEqual(["acc-garde"]);
});

// Une banque dont l'autorisation n'a jamais abouti n'a pas de session à présenter.
test("ignore une banque jamais autorisée", async () => {
  const db = dbFrom(await createTestDb());
  await createConnection(db, TEST_USER, "CIC", "FR");
  const res = await syncConnections(db, { ebGet, userId: TEST_USER });
  expect(res).toEqual({ imported: 0, banques: 0 });
});

// Le cas vécu du mode restreint : la banque autorise et ne partage aucun compte. Il
// n'y a rien à demander, et surtout rien qui doive ressembler à une panne.
test("ne bronche pas sur une banque sans aucun compte", async () => {
  const db = dbFrom(await createTestDb());
  const cx = await createConnection(db, TEST_USER, "Revolut", "FR");
  await setConnectionSession(db, cx, "s1", "2026-11-01T00:00:00Z", []);
  const res = await syncConnections(db, { ebGet, userId: TEST_USER });
  expect(res).toEqual({ imported: 0, banques: 0 });
});
