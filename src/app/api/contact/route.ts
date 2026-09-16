import { createHmac } from "node:crypto";
import { db } from "@/db";
import { ContactError, parseContact } from "@/lib/contact/input";
import { getContactConfig, sendContactEmail } from "@/lib/contact/email";
import { consumeContactQuota } from "@/lib/contact/rate-limit";
import { readContactRequest } from "@/lib/contact/request";
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  try {
    const config = getContactConfig();
    if (!config)
      throw new ContactError(
        "Le contact par e-mail est en cours d’activation. Aucun message n’a été envoyé.",
        503,
      );
    const input = parseContact(
      await readContactRequest(request, config.origin),
    );
    if (!input) return reply({ ok: true });
    // Seule la plateforme Vercel garantit cet en-tête ; ailleurs le quota est partagé.
    const source =
      process.env.VERCEL === "1"
        ? (request.headers.get("x-vercel-forwarded-for") ?? "unknown")
        : "shared";
    const hash = (value: string) =>
      createHmac("sha256", config.apiKey).update(value).digest("hex");
    if (!(await consumeContactQuota(db(), hash(source), hash(input.email))))
      throw new ContactError(
        "Trop de messages rapprochés. Réessayez dans une heure.",
        429,
      );
    await sendContactEmail(config, input);
    return reply({ ok: true });
  } catch (error) {
    if (error instanceof ContactError)
      return reply({ error: error.message }, error.status);
    return reply(
      {
        error:
          "L’envoi est momentanément indisponible. Votre message est conservé dans le formulaire pour réessayer.",
      },
      503,
    );
  }
}
