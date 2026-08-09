// --- Ce qu'un connecté ne doit pas pouvoir écrire chez un autre ---------------
//
// Les actions serveur reçoivent des numéros venus du navigateur. Un intrus n'a rien à
// forcer : il se connecte normalement, ouvre les outils de développement, et change le
// numéro de groupe dans la requête. Il est authentifié, sa session est valide, et sans
// garde il modifie le budget de quelqu'un d'autre.
//
// Chaque action qui prend un identifiant de cible doit donc figurer ici. Une action
// ajoutée sans son test d'intrusion est une porte laissée ouverte.
import { ctx, freshDb, asUser, at, NOW_MONTH } from "./setup";
import { TEST_USER } from "../../helpers/test-user";
import { beforeEach, expect, test } from "vitest";
import type Database from "better-sqlite3";
import {
  renameGroupAction, deleteGroupAction, setGroupAmount, addGroupLine, editGroupLine,
  removeGroupLine, setGroupLineAmount, setGroupPeriod, setLinePeriod,
} from "../../../src/app/app/historique/actions";
import { setGroup, setComment, setIgnored } from "../../../src/app/app/transactions/actions";
import { upsertAccount } from "../../../src/db/repositories/accounts";
import { insertGroup, insertLine, listGroups } from "../../../src/db/repositories/groups";
import { upsertTransaction, listTransactions } from "../../../src/db/repositories/transactions";
import { listBudgetAmounts } from "../../../src/db/repositories/budget-amounts";
import { listLineAmounts } from "../../../src/db/repositories/line-amounts";

const INTRUS = "u-intrus";

let db: Database.Database;
let gid: number;
let lid: number;

// La victime possède le compte "a1" posé par freshDb, avec une dépense découpée et une
// transaction. L'intrus a son propre compte, vide, et connaît les numéros de l'autre.
beforeEach(() => {
  db = freshDb();
  gid = insertGroup(db, "a1", "Courses", "out", 400, NOW_MONTH, null);
  lid = insertLine(db, gid, "Boulangerie", 50);
  upsertTransaction(db, { id: "t1", account_id: "a1", date: `${NOW_MONTH}-05`, amount: -20, label: "CARREFOUR", category_id: null });
  upsertAccount(db, { id: "a-intrus", name: "SG", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, INTRUS);
  at(NOW_MONTH);
  asUser(INTRUS);
});

const groupeVictime = () => listGroups(db, TEST_USER).find((g) => g.id === gid);
const txnVictime = () => listTransactions(db, TEST_USER, { includeIgnored: true }).find((t) => t.id === "t1");

test("ne renomme pas la dépense d'un autre", async () => {
  await renameGroupAction(gid, "Piraté");
  expect(groupeVictime()!.name).toBe("Courses");
});

test("ne supprime pas la dépense d'un autre", async () => {
  await deleteGroupAction(gid);
  expect(groupeVictime()).toBeDefined();
});

test("ne change pas le budget d'un autre", async () => {
  await setGroupAmount(gid, NOW_MONTH, 9999, "ongoing");
  expect(listBudgetAmounts(db).filter((b) => b.groupId === gid && b.amount === 9999)).toEqual([]);
});

test("n'ajoute pas de sous-poste chez un autre", async () => {
  await addGroupLine(gid, "Intrus", 10, NOW_MONTH);
  expect(groupeVictime()!.lines.map((l) => l.name)).toEqual(["Boulangerie"]);
});

test("ne renomme pas le sous-poste d'un autre", async () => {
  await editGroupLine(lid, "Piraté");
  expect(groupeVictime()!.lines.map((l) => l.name)).toEqual(["Boulangerie"]);
});

test("ne supprime pas le sous-poste d'un autre", async () => {
  await removeGroupLine(lid);
  expect(groupeVictime()!.lines).toHaveLength(1);
});

test("ne change pas le montant d'un sous-poste d'un autre", async () => {
  await setGroupLineAmount(lid, NOW_MONTH, 9999, "ongoing");
  expect(listLineAmounts(db).filter((a) => a.lineId === lid && a.amount === 9999)).toEqual([]);
});

// Raccourcir la durée d'une dépense détache ses transactions : c'est une destruction
// de données déguisée en réglage.
test("ne change pas la durée de la dépense d'un autre", async () => {
  await setGroupPeriod(gid, NOW_MONTH, NOW_MONTH);
  expect(groupeVictime()!.endMonth).toBeNull();
});

test("ne change pas la durée du sous-poste d'un autre", async () => {
  await setLinePeriod(lid, NOW_MONTH, NOW_MONTH);
  expect(groupeVictime()!.lines[0].endMonth).toBeNull();
});

test("ne rattache pas la transaction d'un autre", async () => {
  await setGroup("t1", gid, null);
  expect(txnVictime()!.groupId).toBeNull();
});

test("ne commente pas la transaction d'un autre", async () => {
  await setComment("t1", "vu par un inconnu");
  expect(txnVictime()!.comment ?? null).toBeNull();
});

test("ne masque pas la transaction d'un autre", async () => {
  await setIgnored("t1", true);
  expect(txnVictime()!.ignored).toBe(false);
});

// Le pendant de tout ce qui précède : le propriétaire, lui, écrit sans entrave. Une
// garde qui bloquerait aussi le légitime serait une garde inutile.
test("le propriétaire garde la main sur tout", async () => {
  asUser(TEST_USER);
  await renameGroupAction(gid, "Courses et marché");
  await editGroupLine(lid, "Boulangerie du coin");
  await setComment("t1", "vérifié");

  expect(groupeVictime()!.name).toBe("Courses et marché");
  expect(groupeVictime()!.lines[0].name).toBe("Boulangerie du coin");
  expect(txnVictime()!.comment).toBe("vérifié");
});
