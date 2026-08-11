// --- Aller chercher tout l'historique -----------------------------------------
//
// La banque ne rend pas ses opérations d'un bloc. Elle en donne une page, avec une
// clé pour demander la suivante. On ne lisait que la première : d'où des comptes
// arrêtés net à cinquante opérations, et un historique qui semblait ne remonter qu'à
// deux mois alors que la banque en offrait davantage.
//
// Elle accepte aussi une fenêtre de dates. Toutes ne l'acceptent pas aussi large,
// et un refus ne doit pas faire échouer la synchronisation entière : mieux vaut les
// trois derniers mois que rien du tout.
import { expect, test } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom } from "../../src/db/pg";
import { syncAll } from "../../src/enablebanking/sync";
import { listTransactions } from "../../src/db/repositories/transactions";
import { TEST_USER } from "../helpers/test-user";

const TEST_USER_ID = TEST_USER;

// Fabrique une opération numérotée, pour distinguer les pages entre elles.
const op = (n: number) => ({
  entry_reference: `tx-${n}`,
  booking_date: "2026-06-15",
  transaction_amount: { amount: "10.00", currency: "EUR" },
  credit_debit_indicator: "DBIT" as const,
  remittance_information: [`OPERATION ${n}`],
});

// Une banque qui rend `pages` pages de deux opérations, chacune désignant la suivante.
function banquePaginee(pages: number) {
  const appels: string[] = [];
  const ebGet = async <T>(path: string): Promise<T> => {
    appels.push(path);
    if (path.includes("/balances")) return { balances: [{ balance_amount: { amount: "0", currency: "EUR" } }] } as T;
    if (path.includes("/details")) return { name: "CIC" } as T;
    if (path.includes("/transactions")) {
      const cle = new URL(`https://x${path}`).searchParams.get("continuation_key");
      const page = cle === null ? 0 : Number(cle);
      return {
        transactions: [op(page * 2), op(page * 2 + 1)],
        continuation_key: page + 1 < pages ? String(page + 1) : undefined,
      } as T;
    }
    return {} as T;
  };
  return { ebGet, appels };
}

test("suit les pages jusqu'à la dernière", async () => {
  const db = dbFrom(await createTestDb());
  const { ebGet, appels } = banquePaginee(3);

  const res = await syncAll(db, { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER_ID });

  expect(res.imported).toBe(6);
  expect(await listTransactions(db, TEST_USER_ID)).toHaveLength(6);
  // Trois appels d'opérations : la première page sans clé, puis deux avec.
  expect(appels.filter((p) => p.includes("/transactions"))).toHaveLength(3);
});

test("s'arrête quand la banque ne rend plus de clé", async () => {
  const db = dbFrom(await createTestDb());
  const { ebGet, appels } = banquePaginee(1);

  await syncAll(db, { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER_ID });

  expect(appels.filter((p) => p.includes("/transactions"))).toHaveLength(1);
  expect(await listTransactions(db, TEST_USER_ID)).toHaveLength(2);
});

// Une banque qui rendrait toujours la même clé ferait tourner la synchronisation sans
// fin, sans rien importer de plus. Le garde-fou vaut mieux qu'un serveur bloqué.
test("ne tourne pas sans fin sur une banque qui rend toujours la même clé", async () => {
  const db = dbFrom(await createTestDb());
  let appels = 0;
  const ebGet = async <T>(path: string): Promise<T> => {
    if (path.includes("/balances")) return { balances: [{ balance_amount: { amount: "0", currency: "EUR" } }] } as T;
    if (path.includes("/details")) return { name: "CIC" } as T;
    if (path.includes("/transactions")) {
      appels += 1;
      return { transactions: [op(appels)], continuation_key: "toujours-la-meme" } as T;
    }
    return {} as T;
  };

  await syncAll(db, { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER_ID });

  expect(appels).toBeLessThanOrEqual(50);
  expect(appels).toBeGreaterThan(1);
});

// La fenêtre demandée doit remonter loin, sinon la pagination ne sert à rien : la
// banque s'arrêterait d'elle-même au bout de quelques semaines.
test("demande une fenêtre de dates qui remonte loin", async () => {
  const db = dbFrom(await createTestDb());
  const { ebGet, appels } = banquePaginee(1);

  await syncAll(db, { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER_ID });

  const premier = appels.find((p) => p.includes("/transactions"))!;
  const depuis = new URL(`https://x${premier}`).searchParams.get("date_from");
  expect(depuis).toBeTruthy();
  const jours = (Date.now() - new Date(depuis!).getTime()) / 86_400_000;
  expect(jours).toBeGreaterThan(300);
});

// Toutes les banques n'acceptent pas une fenêtre aussi large. Un refus ne doit pas
// coûter la synchronisation entière : on redemande sans fenêtre.
test("réessaie sans fenêtre quand la banque la refuse", async () => {
  const db = dbFrom(await createTestDb());
  const appels: string[] = [];
  const ebGet = async <T>(path: string): Promise<T> => {
    if (path.includes("/balances")) return { balances: [{ balance_amount: { amount: "0", currency: "EUR" } }] } as T;
    if (path.includes("/details")) return { name: "CIC" } as T;
    if (path.includes("/transactions")) {
      appels.push(path);
      if (path.includes("date_from")) throw new Error("HTTP 400: date_from too far in the past");
      return { transactions: [op(1)] } as T;
    }
    return {} as T;
  };

  const res = await syncAll(db, { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER_ID });

  expect(res.imported).toBe(1);
  expect(appels).toHaveLength(2);
  expect(appels[1]).not.toContain("date_from");
});

// Le repli ne vaut que pour la fenêtre. Une banque en panne doit rester une panne,
// pas une synchronisation qui rend zéro opération l'air de rien.
test("laisse remonter une panne qui n'a rien à voir avec la fenêtre", async () => {
  const db = dbFrom(await createTestDb());
  const ebGet = async <T>(path: string): Promise<T> => {
    if (path.includes("/balances")) return { balances: [{ balance_amount: { amount: "0", currency: "EUR" } }] } as T;
    if (path.includes("/details")) return { name: "CIC" } as T;
    throw new Error("HTTP 500: bank unavailable");
  };

  await expect(
    syncAll(db, { ebGet, accountUids: ["acc1"], accountName: "CIC", userId: TEST_USER_ID }),
  ).rejects.toThrow("bank unavailable");
});
