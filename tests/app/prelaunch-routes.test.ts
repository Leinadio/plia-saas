import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ db: vi.fn(), reserve: vi.fn(), confirm: vi.fn(), quota: vi.fn(), config: vi.fn(), send: vi.fn() }));
vi.mock("@/db", () => ({ db: mocks.db }));
vi.mock("@/lib/prelaunch/reservations", () => ({ reserve: mocks.reserve, confirmReservation: mocks.confirm, consumeRequestQuota: mocks.quota }));
vi.mock("@/lib/prelaunch/email", () => ({ getMailConfig: mocks.config, sendReservationEmail: mocks.send }));
import { POST } from "@/app/api/reservations/route";
import { POST as confirm } from "@/app/api/reservations/confirm/route";
const body = { email: "x@example.com", offer: "manual", need: "" };
function request(value: unknown, origin = "https://example.com") {
  return new Request("https://example.com/api/reservations", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(value) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.mockReturnValue({ origin: "https://example.com", apiKey: "test" });
  mocks.quota.mockResolvedValue(true);
  mocks.reserve.mockResolvedValue(undefined);
  mocks.confirm.mockResolvedValue("manual");
});
test("une requête valide ne révèle ni adresse ni jeton", async () => {
  const response = await POST(request(body));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(mocks.reserve).toHaveBeenCalled();
});
test("validation serveur, origine et limite avant tout envoi", async () => {
  expect((await POST(request({ ...body, offer: "invented" }))).status).toBe(400);
  expect((await POST(request(body, "https://other.example"))).status).toBe(403);
  expect((await POST(request({ ...body, need: "x".repeat(9000) }))).status).toBe(413);
  mocks.quota.mockResolvedValue(false);
  expect((await POST(request(body))).status).toBe(429);
  expect(mocks.reserve).not.toHaveBeenCalled();
});
test("service indisponible ou erreur d’envoi : jamais un faux succès", async () => {
  mocks.reserve.mockRejectedValueOnce(new Error("mail rejected"));
  expect((await POST(request(body))).status).toBe(503);
  mocks.config.mockImplementationOnce(() => { throw new Error("missing config"); });
  expect((await POST(request(body))).status).toBe(503);
});
test("confirmation POST explicite, retour de l’offre et lien périmé", async () => {
  expect(await (await confirm(request({ token: "a".repeat(64) }))).json()).toEqual({ offer: "manual" });
  mocks.confirm.mockResolvedValue(null);
  expect((await confirm(request({ token: "a".repeat(64) }))).status).toBe(410);
});
