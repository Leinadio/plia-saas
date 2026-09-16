export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function readReservationRequest(request: Request, origin: string): Promise<unknown> {
  if (request.headers.get("origin") !== origin) throw new RequestError("Rechargez la page puis réessayez.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new RequestError("Format de demande invalide.", 400);
  }
  // Lire par morceaux pour refuser un corps trop grand, même sans Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Demande vide.", 400);
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 4096) {
        await reader.cancel();
        throw new RequestError("Votre réponse est trop longue.", 413);
      }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new RequestError("Vérifiez les informations saisies.", 400); }
  } finally { reader.releaseLock(); }
}

export function reply(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export function requestFailure(error: unknown): Response {
  if (error instanceof RequestError) return reply({ error: error.message }, error.status);
  // Aucun e-mail, jeton, secret ou détail fournisseur dans les réponses/logs publics.
  return reply({ error: "La confirmation n’a pas pu être envoyée. Réessayez un peu plus tard." }, 503);
}
