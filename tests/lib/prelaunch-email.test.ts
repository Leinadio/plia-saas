import { afterEach, expect, test, vi } from "vitest";
import { getMailConfig, sendReservationEmail } from "@/lib/prelaunch/email";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const config = { apiKey: "test-key", from: "Planora <hello@example.com>", origin: "https://example.com" };
test("aucune fausse confirmation lorsque l’envoi n’est pas configuré", () => {
  vi.stubEnv("RESEND_API_KEY", "");
  expect(() => getMailConfig()).toThrow();
});
test("l’e-mail reprend le choix, la hausse et un lien vers une confirmation explicite", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "message-id" }), { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  await sendReservationEmail(config, { email: "test@example.com", offer: "connected", token: "a".repeat(64) });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  const body = JSON.parse(options.body);
  expect(body.text).toContain("12 premiers mois d’abonnement, puis 29 €");
  expect(body.text).toContain("https://example.com/reservation/confirmer?token=");
  expect(body.text).toContain("aucun abonnement");
});
test("un refus du fournisseur et une réponse malformée ne sont pas des succès", async () => {
  for (const response of [new Response("down", { status: 500 }), new Response("{}", { status: 200 })]) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(sendReservationEmail(config, { email: "test@example.com", offer: "manual", token: "a".repeat(64) })).rejects.toThrow();
  }
});
