import { TEST_USER } from "../../helpers/test-user";
import { vi } from "vitest";
import { createTestDb } from "../../helpers/pg";
import { dbFrom, type Db } from "../../../src/db/pg";
import { upsertAccount } from "../../../src/db/repositories/accounts";

// Montage commun à tous les tests d'actions serveur (src/app/app/historique/actions.ts) :
// substitue une base en mémoire au singleton `db()`, et neutralise `revalidatePath`
// (sans objet requête, hors du sens de Next.js en dehors d'une vraie navigation).
// Ce fichier ne matche pas `tests/**/*.test.ts` : Vitest ne l'exécute jamais comme
// suite à lui seul, seulement importé par les fichiers qui en ont besoin. Vivre à cet
// unique endroit évite de recopier `vi.mock` (et son piège de hoisting) dans chaque
// fichier de test — voir la note ci-dessous sur l'ordre d'import.
//
// `ctx` est l'objet stable capturé par la factory de vi.mock : celle-ci s'exécute une
// seule fois, au chargement du module ; c'est pourquoi la base courante est un champ
// réassigné (ctx.db = ...) à chaque test, jamais une variable module-level qu'on
// réassignerait directement (la factory garderait alors sa valeur `null` d'origine).
export const ctx: { db: Db | null; userId: string } = { db: null, userId: TEST_USER };

// Change l'utilisateur que les actions croient voir. Sert aux tests qui vérifient
// qu'un intrus ne peut pas écrire chez quelqu'un d'autre : c'est exactement ce que
// ferait un appelant connecté qui poste un numéro qui n'est pas le sien.
export function asUser(id: string): void {
  ctx.userId = id;
}

// Mois « courant » de tous les tests d'actions. Plusieurs suites raisonnent sur la
// position d'un mois par rapport à aujourd'hui : sans horloge figée, ces tests
// passeraient aujourd'hui et échoueraient le mois suivant, en accusant le code au
// lieu du calendrier. Choisi assez tôt pour que tous les mois manipulés par ces
// suites (2025-02 et après) soient devant ; un test qui veut un mois derrière lui
// avance l'horloge lui-même.
export const NOW_MONTH = "2025-01";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// L'utilisateur de la requête. En production il vient de la session, donc des en-têtes
// HTTP, que Vitest n'a pas : sans ce mock, toute action qui lit les transactions
// tomberait sur `headers()` hors du contexte d'une requête Next. Il rend le même
// propriétaire que celui posé sur le compte "a1" par freshDb, sinon les actions
// travailleraient sur une base qu'elles ne voient pas.
vi.mock("../../../src/lib/current-user", () => ({ requireUserId: async () => ctx.userId }));
vi.mock("../../../src/db/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/db/index")>();
  return { ...actual, db: () => ctx.db! };
});

// Base en mémoire fraîche — un vrai Postgres, comme en production — avec un compte
// "a1" déjà présent — préalable de toutes les actions couvertes ici. À appeler dans
// un beforeEach de chaque fichier de test : chaque test démarre sur une base neuve,
// aucun état ne fuit d'un test à l'autre.
//
// IMPORTANT pour tout fichier qui importe ce module : il doit être importé AVANT
// `src/app/app/historique/actions.ts` (ou tout module import ant `src/db/index`), pour
// que `vi.mock` soit enregistré avant que ces modules soient chargés. Node/Vitest
// évalue les imports d'un fichier dans l'ordre où ils apparaissent : mettre cet
// import en premier suffit, sans avoir besoin d'un vi.mock recopié dans chaque
// fichier (qui bénéficierait, lui, du hoisting automatique de Vitest — mais c'est
// justement ce qu'on évite de dupliquer).
// Fige aussi l'horloge à NOW_MONTH (voir ci-dessus). Seul `Date` est simulé, pas
// les minuteries : les actions sont asynchrones, fausser setTimeout les ferait
// attendre pour rien.
// Place l'horloge au milieu d'un mois. Un test qui touche à un budget doit dire
// quand il se place : le verrou fait dépendre le résultat du mois courant. Sert
// aussi à arranger un test — ce qu'on veut avoir en base avant d'éprouver un refus
// a forcément été écrit à une époque où son mois était encore ouvert.
export function at(month: string): void {
  vi.setSystemTime(new Date(`${month}-15T12:00:00Z`));
}

// L'horloge n'est figée qu'APRÈS l'ouverture de la base : allumer un Postgres est
// une opération qui prend du temps réel, et la lui refuser la ferait attendre pour
// toujours.
export async function freshDb(): Promise<Db> {
  const database = dbFrom(await createTestDb());
  await upsertAccount(database, { id: "a1", name: "CIC", iban_masked: null, balance: 0, currency: "EUR", last_synced: null }, TEST_USER);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${NOW_MONTH}-05T12:00:00Z`));
  ctx.db = database;
  ctx.userId = TEST_USER;
  return database;
}
