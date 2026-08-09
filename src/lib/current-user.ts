import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// L'utilisateur de la requête en cours, côté serveur uniquement. Les pages et les
// actions passent par ici, jamais par le client : un identifiant qui viendrait du
// navigateur serait un identifiant que le navigateur peut changer.
//
// Elle redirige plutôt que de rendre null. Un appelant qui reçoit null doit penser à
// le traiter, et le jour où il oublie il interroge la base sans propriétaire. Ici
// l'oubli est impossible : ou bien on a un identifiant, ou bien on n'est plus sur la
// page.
export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  return session.user.id;
}
