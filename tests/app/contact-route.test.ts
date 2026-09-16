import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  send: vi.fn(),
  quota: vi.fn(),
  db: vi.fn(),
}));
vi.mock("@/lib/contact/email", () => ({
  getContactConfig: mocks.config,
  sendContactEmail: mocks.send,
}));
vi.mock("@/lib/contact/rate-limit", () => ({
  consumeContactQuota: mocks.quota,
}));
vi.mock("@/db", () => ({ db: mocks.db }));
import { POST } from "@/app/api/contact/route";
const body = {
  email: "camille@example.fr",
  subject: "question",
  message: "Bonjour !",
  website: "",
};
function request(value: unknown = body, origin = "https://example.fr") {
  return new Request("https://example.fr/api/contact", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(value),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockReturnValue({
    apiKey: "secret",
    from: "contact@example.fr",
    to: "private@example.fr",
    origin: "https://example.fr",
  });
  mocks.send.mockResolvedValue(undefined);
  mocks.quota.mockResolvedValue(true);
});
it("confirme l’envoi sans exposer l’adresse de réception", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(mocks.send).toHaveBeenCalledOnce();
});
it("refuse les données invalides et une origine étrangère avant d’envoyer", async () => {
  expect((await POST(request({ ...body, email: "bad" }))).status).toBe(400);
  expect((await POST(request(body, "https://evil.example"))).status).toBe(403);
  expect(
    (await POST(request({ ...body, message: "x".repeat(13000) }))).status,
  ).toBe(413);
  expect(mocks.send).not.toHaveBeenCalled();
});
it("accepte 2000 caractères multioctets dans la limite du message", async () => {
  expect(
    (await POST(request({ ...body, message: "漢".repeat(2000) }))).status,
  ).toBe(200);
});
it("bloque les robots et les envois trop rapprochés", async () => {
  expect((await POST(request({ ...body, website: "spam" }))).status).toBe(200);
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.quota).not.toHaveBeenCalled();
  mocks.quota.mockResolvedValue(false);
  expect((await POST(request())).status).toBe(429);
  expect(mocks.send).not.toHaveBeenCalled();
});
it("annonce honnêtement une configuration absente et un échec fournisseur", async () => {
  mocks.config.mockReturnValueOnce(null);
  const missing = await POST(request());
  expect(missing.status).toBe(503);
  expect((await missing.json()).error).toContain("activation");
  mocks.send.mockRejectedValue(
    new Error("secret fournisseur private@example.fr"),
  );
  const failure = await POST(request());
  expect(failure.status).toBe(503);
  expect(await failure.text()).not.toContain("private@example.fr");
});
