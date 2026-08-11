// Modifier la durée de vie d'un groupe (ou d'une ligne) APRÈS coup, et savoir ce que
// ça coûte avant d'écrire. Teste setGroupPeriod / setLinePeriod / periodImpact
// (src/app/app/historique/actions.ts) réellement appelées, base en mémoire (voir ./setup).
import { beforeEach, expect, test, vi } from "vitest";
import { freshDb, at } from "./setup";
import { setGroupPeriod, setLinePeriod, groupPeriodImpact, linePeriodImpact, addGroupLine } from "../../../src/app/app/historique/actions";
import { revalidatePath } from "next/cache";
import { insertGroup } from "../../../src/db/repositories/groups";
import { insertManualTransaction } from "../../../src/db/repositories/transactions";
import { listBudgetAmounts } from "../../../src/db/repositories/budget-amounts";
import { toDatedBudgets, amountInForce } from "../../../src/lib/history";
import type { Db } from "../../../src/db/pg";

let db: Db;
beforeEach(async () => {
  db = await freshDb();
  vi.mocked(revalidatePath).mockClear();
  at("2026-06");
});

const bornes = async (table: "groups" | "group_lines", id: number) =>
  await db.one(`SELECT start_month AS start, end_month AS fin FROM ${table} WHERE id = $1`, [id]);

const rattachement = async (id: string) =>
  await db.one(`SELECT group_id AS "groupId", line_id AS "lineId" FROM transactions WHERE id = $1`, [id]);

const depenseEn = async (mois: string, groupId: number, lineId: number | null = null) =>
  await insertManualTransaction(db, {
    accountId: "a1", date: `${mois}-12`, amount: -30, label: "PRLV", groupId, lineId, });

test("pose une fin à un groupe permanent : c'est comme ça qu'on l'arrête", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);

  await setGroupPeriod(gid, "2026-01", "2026-04");

  expect(await bornes("groups", gid)).toEqual({ start: "2026-01", fin: "2026-04" });
});

test("retire la fin d'un groupe borné : il redevient permanent", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", "2026-04");

  await setGroupPeriod(gid, "2026-01", null);

  expect(await bornes("groups", gid)).toEqual({ start: "2026-01", fin: null });
});

// Un seul mois = début et fin au même endroit. Le formulaire ne demande alors pas de
// mois de fin (pas de « + »), mais l'action doit accepter les deux bornes égales.
test("accepte une durée d'un seul mois", async () => {
  const gid = await insertGroup(db, "a1", "Cadeau", "out", 80, "2026-01", null);

  await setGroupPeriod(gid, "2026-04", "2026-04");

  expect(await bornes("groups", gid)).toEqual({ start: "2026-04", fin: "2026-04" });
});

test("refuse une fin antérieure au début, et n'écrit rien", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);

  await setGroupPeriod(gid, "2026-04", "2026-02");

  expect(await bornes("groups", gid)).toEqual({ start: "2026-01", fin: null });
});

test("refuse un mois mal formé", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);

  await setGroupPeriod(gid, "avril", null);

  expect(await bornes("groups", gid)).toEqual({ start: "2026-01", fin: null });
});

// Rallonger par le début ouvre des mois où le groupe n'a jamais eu de montant : sans
// rien poser, ils s'afficheraient à zéro. Le montant demandé à l'écran se pose au
// nouveau mois de départ, et ne touche pas aux montants postérieurs.
test("rallonger par le début pose le montant donné sur les mois gagnés, sans écraser la suite", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-04", null);
  await setGroupPeriod(gid, "2026-04", null, 300); // montant de départ, posé en avril

  await setGroupPeriod(gid, "2026-01", null, 250);

  const entries = toDatedBudgets(await listBudgetAmounts(db))[gid] ?? [];
  expect(amountInForce(entries, "2026-02")).toBe(250);
  expect(amountInForce(entries, "2026-04")).toBe(300);
});

// --- Ce que le changement coûte, avant de l'écrire --------------------------
// L'avertissement ne parle plus que des transactions : c'est la seule chose que le
// raccourcissement défait pour de bon. Le budget des mois retirés, lui, revient si on
// rallonge — il n'y a rien à demander là-dessus.

test("annonce, mois par mois, les transactions qui retourneront en non catégorisés", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  await setGroupPeriod(gid, "2026-01", null, 300);
  await depenseEn("2026-02", gid);
  await depenseEn("2026-05", gid);
  await depenseEn("2026-05", gid);
  await depenseEn("2026-06", gid);

  const impact = await groupPeriodImpact(gid, "2026-01", "2026-04");

  expect(impact.months).toEqual([
    { month: "2026-05", txns: 2 },
    { month: "2026-06", txns: 1 },
  ]);
});

// Un mois retiré qui ne portait aucune dépense n'a rien à annoncer : son budget
// reviendra si on rallonge, et rien ne change de place.
test("n'annonce pas un mois retiré sans transaction", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  await setGroupPeriod(gid, "2026-01", null, 300);

  expect((await groupPeriodImpact(gid, "2026-01", "2026-04")).months).toEqual([]);
});

test("n'annonce rien quand on rallonge", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-03", "2026-04");
  await setGroupPeriod(gid, "2026-03", "2026-04", 300);
  await depenseEn("2026-03", gid);

  expect(await groupPeriodImpact(gid, "2026-01", null)).toEqual({ months: [] });
});

// Les mois à venir ne comptent pas : rien ne s'y est encore passé, les retirer
// n'enlève aucun chiffre déjà lu.
test("ne compte pas les mois futurs parmi les mois perdus", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  await setGroupPeriod(gid, "2026-01", null, 300);

  expect((await groupPeriodImpact(gid, "2026-01", "2026-06")).months).toEqual([]);
});

// --- Ce que le raccourcissement défait pour de bon --------------------------

test("raccourcir détache les transactions des mois retirés, et elles seules", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  const gardee = await depenseEn("2026-02", gid);
  const detachee = await depenseEn("2026-05", gid);

  await setGroupPeriod(gid, "2026-01", "2026-04");

  expect(await rattachement(gardee)).toEqual({ groupId: gid, lineId: null });
  expect(await rattachement(detachee)).toEqual({ groupId: null, lineId: null });
});

// Le cœur de la règle : rallonger ne ramène rien. Le rattachement a été défait, il se
// refait à la main depuis Transactions.
test("rallonger ensuite ne ramène pas les transactions détachées", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-01", null);
  const t = await depenseEn("2026-05", gid);
  await setGroupPeriod(gid, "2026-01", "2026-04");

  await setGroupPeriod(gid, "2026-01", null);

  expect(await rattachement(t)).toEqual({ groupId: null, lineId: null });
});

test("raccourcir une ligne détache ses transactions, groupe parent compris", async () => {
  const gid = await insertGroup(db, "a1", "Abonnements", "out", 0, "2026-01", null);
  const lid = await addGroupLine(gid, "Spotify", 10, "2026-01");
  const t = await depenseEn("2026-05", gid, lid);

  await setLinePeriod(lid, "2026-01", "2026-03");

  expect(await rattachement(t)).toEqual({ groupId: null, lineId: null });
});

test("rallonger ne détache rien", async () => {
  const gid = await insertGroup(db, "a1", "Courses", "out", 300, "2026-03", "2026-04");
  const t = await depenseEn("2026-03", gid);

  await setGroupPeriod(gid, "2026-01", null);

  expect(await rattachement(t)).toEqual({ groupId: gid, lineId: null });
});

// --- Les lignes d'un récurrent, même règle ----------------------------------

test("arrête une ligne de récurrent sans toucher au groupe", async () => {
  const gid = await insertGroup(db, "a1", "Abonnements", "out", 0, "2026-01", null);
  const lid = await addGroupLine(gid, "Spotify", 10, "2026-01");

  await setLinePeriod(lid, "2026-01", "2026-03");

  expect(await bornes("group_lines", lid)).toEqual({ start: "2026-01", fin: "2026-03" });
  expect(await bornes("groups", gid)).toEqual({ start: "2026-01", fin: null });
});

test("annonce l'impact du raccourcissement d'une ligne", async () => {
  const gid = await insertGroup(db, "a1", "Abonnements", "out", 0, "2026-01", null);
  const lid = await addGroupLine(gid, "Spotify", 10, "2026-01");
  await depenseEn("2026-05", gid, lid);

  const impact = await linePeriodImpact(lid, "2026-01", "2026-03");

  // Juin n'est pas annoncé : la ligne y perd son budget, mais aucune transaction n'y
  // change de place — et c'est de cela seul que parle l'avertissement.
  expect(impact.months).toEqual([{ month: "2026-05", txns: 1 }]);
});

// Raccourcir une dépense emporte AUSSI les transactions posées sur ses sous-postes.
// C'est la seule réponse cohérente : un sous-poste n'existe plus dès que sa dépense
// n'existe plus, donc ses transactions n'ont plus où être rangées. Les laisser
// rattachées à un mois où plus rien ne vit les rendrait invisibles partout — comptées
// nulle part, mais absentes des non catégorisés.
test("raccourcir une dépense rend aussi les transactions de ses sous-postes", async () => {
  const gid = await insertGroup(db, "a1", "Abonnements", "out", 0, "2026-01", null);
  const lid = await addGroupLine(gid, "Spotify", 10, "2026-01", "from");
  const juin = await depenseEn("2026-06", gid, lid);   // posée sur le sous-poste
  const avril = await depenseEn("2026-04", gid, null); // posée sur la dépense elle-même
  const mai = await depenseEn("2026-05", gid, lid);

  await setGroupPeriod(gid, "2026-01", "2026-04");

  // Ce qui tombe hors des bornes revient aux non catégorisés, sous-postes compris.
  expect(await rattachement(juin)).toEqual({ groupId: null, lineId: null });
  expect(await rattachement(mai)).toEqual({ groupId: null, lineId: null });
  // Ce qui reste dans les bornes ne bouge pas.
  expect(await rattachement(avril)).toEqual({ groupId: gid, lineId: null });
});

// Et l'avertissement affiché avant d'écrire les compte, sinon il annoncerait moins de
// dégâts qu'il n'en fait — la pire façon de demander une confirmation.
test("l'avertissement compte les transactions des sous-postes", async () => {
  const gid = await insertGroup(db, "a1", "Abonnements", "out", 0, "2026-01", null);
  const lid = await addGroupLine(gid, "Spotify", 10, "2026-01", "from");
  await depenseEn("2026-05", gid, lid);
  await depenseEn("2026-06", gid, lid);
  await depenseEn("2026-06", gid, null);

  const impact = await groupPeriodImpact(gid, "2026-01", "2026-04");

  expect(impact.months).toEqual([
    { month: "2026-05", txns: 1 },
    { month: "2026-06", txns: 2 },
  ]);
});
