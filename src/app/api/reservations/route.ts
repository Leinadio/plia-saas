import { createHmac } from "node:crypto";
import { db } from "@/db";
import { parseReservation } from "@/lib/prelaunch/offers";
import { reserve, consumeRequestQuota } from "@/lib/prelaunch/reservations";
import { getMailConfig, sendReservationEmail } from "@/lib/prelaunch/email";
import { readReservationRequest, reply, RequestError, requestFailure } from "@/lib/prelaunch/http";

export async function POST(request: Request) {
  try {
    const config = getMailConfig();
    const body = await readReservationRequest(request, config.origin);
    let input;
    try { input = parseReservation(body); }
    catch (error) { throw new RequestError((error as Error).message, 400); }
    const database = db();
    // Hors Vercel, quota partagé : ne pas faire confiance à un en-tête IP arbitraire.
    const source = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
    const sourceHash = createHmac("sha256", config.apiKey).update(source).digest("hex");
    if (!await consumeRequestQuota(database, sourceHash)) {
      throw new RequestError("Trop de demandes rapprochées. Réessayez dans une heure.", 429);
    }
    await reserve(database, input, (message) => sendReservationEmail(config, message));
    return reply({ ok: true });
  } catch (error) { return requestFailure(error); }
}
