import { ContactError } from "./input";
export async function readContactRequest(
  request: Request,
  origin: string,
): Promise<unknown> {
  if (request.headers.get("origin") !== origin)
    throw new ContactError("Rechargez la page puis réessayez.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ContactError("Format de demande invalide.");
  const reader = request.body?.getReader();
  if (!reader)
    throw new ContactError("Écrivez votre message avant de l’envoyer.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 12_000) {
        await reader.cancel();
        throw new ContactError("Votre message est trop long.", 413);
      }
      chunks.push(value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new ContactError("Vérifiez les informations saisies.");
    }
  } finally {
    reader.releaseLock();
  }
}
