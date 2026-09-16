import { afterEach, expect, it, vi } from "vitest";
import { getContactConfig, sendContactEmail } from "@/lib/contact/email";
const config = {
  apiKey: "secret-test",
  from: "Planora <contact@example.fr>",
  to: "owner@example.fr",
  origin: "https://example.fr",
};
const input = {
  email: "camille@example.fr",
  subject: "question" as const,
  message: "<b>Mon budget</b>\nUne question.",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("laisse le contact indisponible si l’envoi ou la réception manque", () => {
  vi.stubEnv("RESEND_API_KEY", "");
  expect(getContactConfig()).toBeNull();
  vi.stubEnv("RESEND_API_KEY", "test");
  vi.stubEnv("PLANORA_EMAIL_FROM", config.from);
  vi.stubEnv("PLANORA_PUBLIC_URL", config.origin);
  vi.stubEnv("PLANORA_CONTACT_TO", "");
  expect(getContactConfig()).toBeNull();
  vi.stubEnv("PLANORA_CONTACT_TO", config.to);
  expect(getContactConfig()).toMatchObject({ to: config.to });
  vi.stubEnv("PLANORA_CONTACT_TO", "a@example.fr,b@example.fr");
  expect(getContactConfig()).toBeNull();
});
it("envoie à l’adresse privée et permet de répondre à l’expéditeur sans interpréter son message", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ id: "sent" }), { status: 200 }),
    );
  vi.stubGlobal("fetch", fetcher);
  await sendContactEmail(config, input);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body.to).toEqual([config.to]);
  expect(body.from).toBe(config.from);
  expect(body.reply_to).toBe(input.email);
  expect(body.text).toContain(input.message);
  expect(body.html).toBeUndefined();
  expect(body.subject).toContain("Une question");
});
it.each([
  new Response("refus", { status: 403 }),
  new Response("{}"),
  new Response('{"id":""}'),
  new Response("invalide"),
])("ne confirme pas un envoi refusé ou malformé", async (response) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  await expect(sendContactEmail(config, input)).rejects.toThrow();
});
