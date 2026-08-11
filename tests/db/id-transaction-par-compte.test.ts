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
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { syncAll } from "../../src/enablebanking/sync";
import { listTransactions } from "../../src/db/repositories/transactions";
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
  const db = dbFrom(await createTestDb());
  // Enable Banking rend un uid de compte différent à chaque autorisation, même pour
  // le même compte réel : les deux comptes de l'application cohabitent donc bien.
  await syncAll(db, { ebGet, accountUids: ["uid-premier"], accountName: "CIC", userId: TEST_USER });
  const second = await syncAll(db, { ebGet, accountUids: ["uid-second"], accountName: "CIC", userId: AUTRE });

  expect(second.imported).toBe(1);
  expect(await listTransactions(db, TEST_USER)).toHaveLength(1);
  expect(await listTransactions(db, AUTRE)).toHaveLength(1);
});

// Le revers : l'identifiant reste stable d'une synchronisation à l'autre pour un même
// compte, sinon chaque rafraîchissement dupliquerait tout l'historique.
test("resynchroniser le même compte ne duplique rien", async () => {
  const db = dbFrom(await createTestDb());
  await syncAll(db, { ebGet, accountUids: ["uid-premier"], accountName: "CIC", userId: TEST_USER });
  const second = await syncAll(db, { ebGet, accountUids: ["uid-premier"], accountName: "CIC", userId: TEST_USER });

  expect(second.imported).toBe(0);
  expect(await listTransactions(db, TEST_USER)).toHaveLength(1);
});
