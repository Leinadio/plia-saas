// --- Le second verrou : la base refuse d'elle-même -----------------------------
//
// Jusqu'ici, ce qui séparait les données de deux personnes tenait entièrement dans le
// code : chaque requête précisait de qui elle parlait. Ça marche tant que personne
// n'oublie. Le jour où quelqu'un écrit une lecture sans le préciser, rien ne proteste —
// la page s'affiche, simplement elle montre tout le monde.
//
// Ces règles-ci vivent dans la base. Le serveur ne s'y connecte plus en administrateur
// mais avec un accès bridé, et il doit annoncer pour qui il travaille. Sans annonce,
// il ne voit rien. Avec, il ne voit que ce qui appartient à cette personne — même si la
// requête, elle, ne demandait aucun filtre.
//
// Les tests ci-dessous écrivent leurs données en administrateur, puis se rabaissent au
// rôle de l'application pour lire. C'est exactement la situation de production.
import { beforeEach, expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { upsertAccount } from "../../src/db/repositories/accounts";
import { insertGroup, insertLine } from "../../src/db/repositories/groups";
import { upsertTransaction } from "../../src/db/repositories/transactions";
import { setBudgetAmount } from "../../src/db/repositories/budget-amounts";
import { dismissNotification } from "../../src/db/repositories/dismissed-notifications";

const MOI = "u-moi";
const AUTRE = "u-autre";

let db: Db;

beforeEach(async () => {
  db = dbFrom(await createTestDb());
  for (const [user, compte] of [[MOI, "cic"], [AUTRE, "sg"]]) {
    await upsertAccount(
      db,
      { id: compte, name: compte, iban_masked: null, balance: 100, currency: "EUR", last_synced: null },
      user,
    );
    const gid = await insertGroup(db, compte, `Courses ${compte}`, "out", 300, "2026-01", null);
    await insertLine(db, gid, `Boulangerie ${compte}`, 50);
    await setBudgetAmount(db, gid, "2026-07", 300);
    await upsertTransaction(db, {
      id: `${compte}-t1`, account_id: compte, date: "2026-07-05", amount: -20, label: "X",
    });
    await dismissNotification(db, user, `${compte}::g::2026-07`);
  }
});

// Se rabaisser au rôle de l'application, et dire pour qui l'on travaille. `null`
// = on ne le dit pas, ce qui est le cas d'un code qui aurait oublié.
async function commeApplication(userId: string | null): Promise<void> {
  await db.run(`SET ROLE budget_app`);
  await db.run(`SELECT set_config('app.user_id', $1, false)`, [userId ?? ""]);
}

// La requête la plus naïve qui soit : tout le contenu d'une table, sans un mot sur le
// propriétaire. C'est celle qu'on écrit par erreur.
const tout = (table: string) => db.all<{ id: string }>(`SELECT id FROM ${table} ORDER BY id`);

test("sans annonce, l'application ne voit rien", async () => {
  await commeApplication(null);

  expect(await tout("accounts")).toEqual([]);
  expect(await tout("transactions")).toEqual([]);
  expect(await tout("groups")).toEqual([]);
});

test("avec l'annonce, une lecture sans filtre ne rend que les siennes", async () => {
  await commeApplication(MOI);

  expect((await tout("accounts")).map((r) => r.id)).toEqual(["cic"]);
  expect((await tout("transactions")).map((r) => r.id)).toEqual(["cic-t1"]);
  expect(await db.all(`SELECT * FROM groups`)).toHaveLength(1);
  expect(await db.all(`SELECT * FROM group_lines`)).toHaveLength(1);
  expect(await db.all(`SELECT * FROM budget_amounts`)).toHaveLength(1);
  expect(await db.all(`SELECT * FROM dismissed_notifications`)).toHaveLength(1);
});

// Lire n'est que la moitié du problème. Une écriture qui vise le numéro de quelqu'un
// d'autre ne doit rien changer chez lui — c'est la faille qu'on attrape aujourd'hui
// avec des vérifications dans le code, et que la base doit tenir toute seule.
test("écrire chez un autre ne touche rien", async () => {
  await commeApplication(MOI);

  await db.run(`UPDATE accounts SET custom_name = 'Piraté' WHERE id = 'sg'`);
  await db.run(`DELETE FROM transactions WHERE id = 'sg-t1'`);

  await db.run(`RESET ROLE`);
  expect(await db.one(`SELECT custom_name FROM accounts WHERE id = 'sg'`)).toEqual({ custom_name: null });
  expect(await db.all(`SELECT id FROM transactions WHERE id = 'sg-t1'`)).toHaveLength(1);
});

// Un compte bancaire qu'on s'inventerait au nom d'un autre serait pire qu'une lecture :
// il ferait apparaître chez lui des données qu'il n'a jamais demandées.
test("créer une ligne au nom d'un autre est refusé", async () => {
  await commeApplication(MOI);

  await expect(
    db.run(`INSERT INTO accounts (id, name, user_id) VALUES ('faux', 'Faux', $1)`, [AUTRE]),
  ).rejects.toThrow();
});

// --- Le geste de l'application -------------------------------------------------
//
// Tout ce qui précède suppose que le serveur enfile l'habit bridé et annonce pour qui
// il travaille. C'est ce que fait `pourUtilisateur` : il réserve une connexion, se
// rabaisse, annonce, fait le travail, et rend tout à la sortie.
//
// Les deux gestes vont ensemble et ne valent que le temps de la transaction. Une
// annonce qui survivrait à la requête serait pire que rien : la connexion revient dans
// le jeu commun et servirait la requête suivante, celle de quelqu'un d'autre.
test("pourUtilisateur borne les droits à la durée du travail", async () => {
  const vues = await db.pourUtilisateur(MOI, async (t) => {
    return {
      comptes: (await t.all<{ id: string }>(`SELECT id FROM accounts`)).map((r) => r.id),
      role: await t.one<{ r: string }>(`SELECT current_user AS r`),
    };
  });

  expect(vues.comptes).toEqual(["cic"]);
  expect(vues.role!.r).toBe("budget_app");

  // Dehors, la connexion est redevenue ce qu'elle était.
  expect((await db.all<{ id: string }>(`SELECT id FROM accounts ORDER BY id`)).map((r) => r.id))
    .toEqual(["cic", "sg"]);
});
