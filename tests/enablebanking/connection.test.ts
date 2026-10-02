import { beforeEach, expect, test, vi } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import { TEST_USER } from "../helpers/test-user";
import { createConnection, setConnectionSession, listConnections } from "../../src/db/repositories/bank-connections";

const mocks = vi.hoisted(() => ({ database: null as Db | null, ebPost: vi.fn() }));
vi.mock("../../src/db/index", () => ({ db: () => mocks.database }));
vi.mock("../../src/enablebanking/client", () => ({ ebPost: mocks.ebPost }));
import { startReauth, finishAuth } from "../../src/enablebanking/connection";

beforeEach(async () => {
  mocks.database = dbFrom(await createTestDb());
  mocks.ebPost.mockReset();
  mocks.ebPost.mockResolvedValue({ url: "https://bank.example/authorize" });
});

test("Reconnecter choisit la banque existante et laisse l'ancienne autorisation intacte", async () => {
  const db = mocks.database!;
  const id = await createConnection(db, TEST_USER, "CIC", "FR");
  await setConnectionSession(db, id, "old-session", "2026-10-01", ["old"]);
  await startReauth(TEST_USER, id);
  const connections = await listConnections(db, TEST_USER);
  expect(connections).toHaveLength(2);
  expect(connections[0]).toMatchObject({ id, sessionId: "old-session", accountUids: '["old"]' });
  expect(connections[1]).toMatchObject({ aspspName: "CIC", aspspCountry: "FR", sessionId: null });
  expect(mocks.ebPost).toHaveBeenCalledWith("/auth", expect.objectContaining({ aspsp: { name: "CIC", country: "FR" }, state: String(connections[1].id) }));
});

test("refuse de reconnecter la banque d'un autre utilisateur avant d'appeler la banque", async () => {
  const id = await createConnection(mocks.database!, "other", "CIC", "FR");
  await expect(startReauth(TEST_USER, id)).rejects.toThrow(/connexion/i);
  expect(await listConnections(mocks.database!, TEST_USER)).toEqual([]);
  expect(mocks.ebPost).not.toHaveBeenCalled();
});

test("retient l'expiration réellement accordée et ignore les comptes bancaires fermés sans uid", async () => {
  const id = await createConnection(mocks.database!, TEST_USER, "CIC", "FR");
  mocks.ebPost.mockResolvedValue({ session_id: "authorized", accounts: [{ uid: "new" }, {}], access: { valid_until: "2026-10-05T12:00:00Z" } });
  await finishAuth("code", String(id), TEST_USER);
  expect((await listConnections(mocks.database!, TEST_USER))[0]).toMatchObject({ validUntil: "2026-10-05T12:00:00Z", accountUids: '["new"]' });
});
