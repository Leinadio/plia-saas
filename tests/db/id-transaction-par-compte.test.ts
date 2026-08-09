// --- Deux personnes, la même banque -------------------------------------------
//
// L'identifiant d'une opération venait tel quel de la banque, et servait de clé
// primaire pour toute la base. Or la banque rend le même identifiant pour la même
// opération, quelle que soit la personne qui la lui demande — c'est le sens même d'un
// identifiant. Deux comptes de l'application branchés sur le même compte bancaire
// réel se disputaient donc les mêmes clés, et l'insertion se fait en OR IGNORE : le
// premier arrivé gardait tout, le second voyait son solde s'afficher et pas une seule
// opération. C'est exactement ce qui s'est produit avec deux inscriptions et une même
// banque CIC.
//
// La correction préfixe l'identifiant par le compte bancaire. Une opération est
// désormais identifiée par « ce compte, cette opération », ce qu'elle a toujours été.
import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb } from "../../src/db/index";
import { syncAll } from "../../src/enablebanking/sync";
import { listTransactions } from "../../src/db/repositories/transactions";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { TEST_USER } from "../helpers/test-user";

const AUTRE = "u-autre";

// La banque rend la même opération, avec le même identifiant, aux deux demandeurs.
const ebGet = async <T>(path: string): Promise<T> => {
  if (path.includes("/balances")) return { balances: [{ balance_amount: { amount: "1804.37", currency: "EUR" } }] } as T;
  if (path.includes("/details")) return { name: "M DANIEL DUPONT" } as T;
  if (path.includes("/transactions"))
    return {
      transactions: [{
        entry_reference: "04008202621900001-ff9860b9dabd",
        booking_date: "2026-08-07",
        transaction_amount: { amount: "12.26", currency: "EUR" },
        credit_debit_indicator: "DBIT",
        remittance_information: ["F COTIS CP. GLOBAL"],
      }],
    } as T;
  return {} as T;
};

test("deux comptes branchés sur la même banque voient chacun leurs opérations", async () => {
  const db = getDb(":memory:");
  // Enable Banking rend un uid de compte différent à chaque autorisation, même pour
  // le même compte réel : les deux comptes de l'application cohabitent donc bien.
  await syncAll(db, { ebGet, accountUids: ["uid-premier"], accountName: "CIC", userId: TEST_USER });
  const second = await syncAll(db, { ebGet, accountUids: ["uid-second"], accountName: "CIC", userId: AUTRE });

  expect(second.imported).toBe(1);
  expect(listTransactions(db, TEST_USER)).toHaveLength(1);
  expect(listTransactions(db, AUTRE)).toHaveLength(1);
});

// Le revers : l'identifiant reste stable d'une synchronisation à l'autre pour un même
// compte, sinon chaque rafraîchissement dupliquerait tout l'historique.
test("resynchroniser le même compte ne duplique rien", async () => {
  const db = getDb(":memory:");
  await syncAll(db, { ebGet, accountUids: ["uid-premier"], accountName: "CIC", userId: TEST_USER });
  const second = await syncAll(db, { ebGet, accountUids: ["uid-premier"], accountName: "CIC", userId: TEST_USER });

  expect(second.imported).toBe(0);
  expect(listTransactions(db, TEST_USER)).toHaveLength(1);
});

// --- La reprise des bases existantes ------------------------------------------
// Les opérations déjà importées portent l'identifiant nu de la banque. Les laisser
// ainsi ferait pire que rien : la synchronisation suivante les réimporterait sous leur
// nouvelle forme préfixée, et tout l'historique se retrouverait en double.
test("reprend les identifiants nus des bases existantes", () => {
  const dossier = mkdtempSync(join(tmpdir(), "budget-ids-"));
  chemins.push(dossier);
  const path = join(dossier, "test.db");

  const avant = getDb(path);
  upsertAccount(avant, { id: "acc1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  avant.prepare(
    `INSERT INTO transactions (id, account_id, date, amount, label, comment, ignored)
     VALUES ('tx-nu', 'acc1', '2026-08-07', -12.26, 'F COTIS', 'vérifié', 1)`,
  ).run();
  // Une saisie manuelle rapprochée, puis écartée : la paire mémorisée désigne les
  // opérations par leur identifiant et doit suivre le changement.
  avant.prepare(
    `INSERT INTO transactions (id, account_id, date, amount, label, manual)
     VALUES ('manual:abc', 'acc1', '2026-08-07', -12.26, 'Cotisation', 1)`,
  ).run();
  avant.prepare(`INSERT INTO reconcile_ignored (manual_id, synced_id) VALUES ('manual:abc', 'tx-nu')`).run();
  avant.close();

  const apres = getDb(path);
  const txns = apres.prepare(`SELECT id, comment, ignored FROM transactions ORDER BY id`).all() as {
    id: string; comment: string | null; ignored: number;
  }[];
  const paires = apres.prepare(`SELECT manual_id, synced_id FROM reconcile_ignored`).all();
  apres.close();

  // La saisie manuelle garde son identifiant : elle ne vient d'aucune banque, aucune
  // autre ne peut la revendiquer.
  expect(txns.map((t) => t.id)).toEqual(["acc1::tx-nu", "manual:abc"]);
  // Ce qui pendait à l'opération l'a suivie, sans quoi la reprise effacerait à bas
  // bruit un commentaire ou une exclusion.
  expect(txns[0].comment).toBe("vérifié");
  expect(txns[0].ignored).toBe(1);
  expect(paires).toEqual([{ manual_id: "manual:abc", synced_id: "acc1::tx-nu" }]);
});

// Deux démarrages de suite ne doivent pas empiler deux préfixes.
test("la reprise ne repasse pas deux fois", () => {
  const dossier = mkdtempSync(join(tmpdir(), "budget-ids-"));
  chemins.push(dossier);
  const path = join(dossier, "test.db");

  const avant = getDb(path);
  upsertAccount(avant, { id: "acc1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  avant.prepare(
    `INSERT INTO transactions (id, account_id, date, amount, label) VALUES ('tx-nu', 'acc1', '2026-08-07', -1, 'X')`,
  ).run();
  avant.close();

  getDb(path).close();
  const troisieme = getDb(path);
  const ids = (troisieme.prepare(`SELECT id FROM transactions`).all() as { id: string }[]).map((t) => t.id);
  troisieme.close();

  expect(ids).toEqual(["acc1::tx-nu"]);
});

const chemins: string[] = [];
afterEach(() => {
  while (chemins.length > 0) rmSync(chemins.pop()!, { recursive: true, force: true });
});
