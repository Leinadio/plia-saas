// --- Parler à Postgres ---------------------------------------------------------
//
// La couche qui remplace better-sqlite3. Trois gestes, les mêmes qu'avant : lire une
// ligne, lire toutes les lignes, écrire. La différence tient en un mot — il faut
// désormais attendre la réponse.
//
// Elle porte aussi la traduction des types, et c'est là que se cachent les pièges.
// Postgres rend ses décimaux sous forme de texte, et ses comptages sous forme
// d'entiers 64 bits que le pilote rend aussi en texte. Sans traduction, un solde de
// douze euros arrive comme la chaîne "12.34" : additionné à un autre il donnerait
// "12.3412.34", et personne ne verrait l'erreur avant de la lire à l'écran.
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";

async function base() {
  return dbFrom(await createTestDb());
}

test("all rend toutes les lignes, one la première, undefined si rien", async () => {
  const db = await base();
  await db.run(`INSERT INTO accounts (id, name, user_id) VALUES ($1, $2, $3)`, ["c1", "Courant", "u1"]);
  await db.run(`INSERT INTO accounts (id, name, user_id) VALUES ($1, $2, $3)`, ["c2", "Livret", "u1"]);

  const tous = await db.all<{ id: string }>(`SELECT id FROM accounts ORDER BY id`);
  expect(tous.map((r) => r.id)).toEqual(["c1", "c2"]);

  const un = await db.one<{ name: string }>(`SELECT name FROM accounts WHERE id = $1`, ["c2"]);
  expect(un?.name).toBe("Livret");

  expect(await db.one(`SELECT name FROM accounts WHERE id = $1`, ["inconnu"])).toBeUndefined();
});

// Le piège central : sans traduction, tout montant arrive en texte.
test("les montants arrivent en nombres, pas en chaînes", async () => {
  const db = await base();
  await db.run(`INSERT INTO accounts (id, name, user_id, balance) VALUES ('c1', 'C', 'u1', 12.34)`);
  const ligne = await db.one<{ balance: number }>(`SELECT balance FROM accounts`);
  expect(ligne?.balance).toBe(12.34);
  expect(typeof ligne?.balance).toBe("number");
});

// Même piège sur les comptages : le pilote de production rend les entiers 64 bits en
// texte pour ne pas perdre de précision. Un `COUNT(*)` non traduit vaut "3", et
// `"3" > 2` est vrai par accident tandis que `"10" > 2` est faux.
test("les comptages arrivent en nombres", async () => {
  const db = await base();
  await db.run(`INSERT INTO accounts (id, name, user_id) VALUES ('c1', 'C', 'u1')`);
  const ligne = await db.one<{ n: number }>(`SELECT COUNT(*) AS n FROM accounts`);
  expect(ligne?.n).toBe(1);
  expect(typeof ligne?.n).toBe("number");
});

// Une écriture en plusieurs temps ne doit jamais s'arrêter au milieu. Supprimer une
// banque, c'est effacer ses comptes, leurs opérations et leurs enveloppes : à
// mi-chemin, l'application montrerait des enveloppes sans compte.
test("une transaction annulée ne laisse rien derrière elle", async () => {
  const db = await base();
  await db.run(`INSERT INTO accounts (id, name, user_id) VALUES ('c1', 'C', 'u1')`);

  await expect(
    db.tx(async (t) => {
      await t.run(`INSERT INTO accounts (id, name, user_id) VALUES ('c2', 'D', 'u1')`);
      throw new Error("ça casse");
    }),
  ).rejects.toThrow("ça casse");

  const restants = await db.all<{ id: string }>(`SELECT id FROM accounts`);
  expect(restants.map((r) => r.id)).toEqual(["c1"]);
});

// En production, les requêtes se répartissent sur un jeu de connexions partagées. Une
// transaction ne peut pas vivre là-dessus : le BEGIN partirait sur une connexion et
// l'écriture sur une autre, qui n'en saurait rien. Le pilote de production sait donc
// réserver une connexion pour lui seul, et la couche doit s'en servir — puis la rendre,
// même quand tout casse, sinon le jeu se vide connexion par connexion jusqu'au blocage.
test("une transaction réserve sa connexion et la rend toujours", async () => {
  const journal: string[] = [];
  const hote = {
    query: async (sql: string) => {
      journal.push(`partagé: ${sql}`);
      return { rows: [], fields: [] };
    },
    reserve: async () => {
      journal.push("réservation");
      return {
        host: {
          query: async (sql: string) => {
            journal.push(`réservé: ${sql}`);
            return { rows: [], fields: [] };
          },
        },
        release: () => journal.push("rendue"),
      };
    },
  };

  const db = dbFrom(hote);
  await db.tx(async (t) => {
    await t.run("UPDATE x SET y = 1");
  });
  expect(journal).toEqual([
    "réservation",
    "réservé: BEGIN",
    "réservé: UPDATE x SET y = 1",
    "réservé: COMMIT",
    "rendue",
  ]);

  journal.length = 0;
  await expect(db.tx(async () => { throw new Error("boum"); })).rejects.toThrow("boum");
  expect(journal).toEqual(["réservation", "réservé: BEGIN", "réservé: ROLLBACK", "rendue"]);
});

test("une transaction qui va au bout garde tout", async () => {
  const db = await base();
  await db.tx(async (t) => {
    await t.run(`INSERT INTO accounts (id, name, user_id) VALUES ('c1', 'C', 'u1')`);
    await t.run(`INSERT INTO accounts (id, name, user_id) VALUES ('c2', 'D', 'u1')`);
  });
  const restants = await db.all<{ id: string }>(`SELECT id FROM accounts ORDER BY id`);
  expect(restants.map((r) => r.id)).toEqual(["c1", "c2"]);
});
