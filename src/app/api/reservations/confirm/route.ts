import { db } from "@/db";
import { confirmReservation } from "@/lib/prelaunch/reservations";
import { getMailConfig } from "@/lib/prelaunch/email";
import { readReservationRequest, reply, RequestError, requestFailure } from "@/lib/prelaunch/http";

export async function POST(request: Request) {
  try {
    const body = await readReservationRequest(request, getMailConfig().origin);
    const token = body && typeof body === "object" && "token" in body ? body.token : null;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      throw new RequestError("Ce lien est invalide. Demandez un nouveau lien.", 410);
    }
    const offer = await confirmReservation(db(), token);
    if (!offer) throw new RequestError("Ce lien a expiré ou a été remplacé. Demandez un nouveau lien.", 410);
    return reply({ offer });
  } catch (error) {
    if (error instanceof RequestError) return requestFailure(error);
    return reply({ error: "La confirmation est indisponible. Réessayez un peu plus tard." }, 503);
  }
}
