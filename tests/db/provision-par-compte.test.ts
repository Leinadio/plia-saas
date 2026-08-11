// --- La provision des non catégorisés appartient à un compte -------------------
//
// Dans le tableau, la ligne « Non catégorisés » a une case de budget comme les autres :
// ce qu'on compte dépenser sans le ranger dans une enveloppe. Elle était enregistrée
// sur le groupe 0, sans aucun compte, alors que l'historique affiche un onglet par
// compte. Poser 200 € sur le compte courant en affichait 200 sur le compte joint, et
// corriger l'un corrigeait l'autre.
//
// Ce n'est pas une fuite entre personnes. C'est un mélange entre les comptes d'une même
// personne, et il existait bien avant les comptes utilisateurs.
import { beforeEach, expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { listBudgetAmounts, setBudgetAmount } from "../../src/db/repositories/budget-amounts";
import { TEST_USER } from "../helpers/test-user";

let db: Db;

beforeEach(async () => {
  db = dbFrom(await createTestDb());
  for (const id of ["courant", "joint"]) {
    await upsertAccount(db, { id, name: id, iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  }
});

const provisions = async () =>
  (await listBudgetAmounts(db))
    .filter((b) => b.groupId === 0)
    .map((b) => [b.accountId, b.effectiveMonth, b.amount]);

test("deux comptes tiennent chacun leur provision au même mois", async () => {
  await setBudgetAmount(db, 0, "2026-08", 200, "ongoing", "courant");
  await setBudgetAmount(db, 0, "2026-08", 50, "ongoing", "joint");

  expect((await provisions()).sort()).toEqual([
    ["courant", "2026-08", 200],
    ["joint", "2026-08", 50],
  ]);
});

// Le cœur du bug : la seconde écriture écrasait la première, faute de compte dans la
// clé d'unicité.
test("corriger la provision d'un compte ne touche pas celle de l'autre", async () => {
  await setBudgetAmount(db, 0, "2026-08", 200, "ongoing", "courant");
  await setBudgetAmount(db, 0, "2026-08", 50, "ongoing", "joint");
  await setBudgetAmount(db, 0, "2026-08", 300, "ongoing", "courant");

  expect((await provisions()).sort()).toEqual([
    ["courant", "2026-08", 300],
    ["joint", "2026-08", 50],
  ]);
});

// Les budgets de groupes, eux, ne portent pas de compte : ils le tiennent déjà de leur
// groupe. Leur unicité doit rester celle d'avant, sans quoi réécrire un budget en
// créerait un second au lieu de remplacer le premier.
test("le budget d'une dépense se remplace toujours au même mois", async () => {
  await setBudgetAmount(db, 7, "2026-08", 400);
  await setBudgetAmount(db, 7, "2026-08", 450);

  const dun = (await listBudgetAmounts(db)).filter((b) => b.groupId === 7);
  expect(dun).toHaveLength(1);
  expect(dun[0].amount).toBe(450);
});

// Les deux portées cohabitent au même mois pour un même compte : relever durablement à
// partir d'août ET faire une exception pour août.
test("les deux portées cohabitent sur un même compte", async () => {
  await setBudgetAmount(db, 0, "2026-08", 200, "ongoing", "courant");
  await setBudgetAmount(db, 0, "2026-08", 90, "once", "courant");

  expect(await provisions()).toHaveLength(2);
});
