import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "../db/index";
import type { Db } from "../db/pg";

// L'utilisateur de la requête en cours, côté serveur uniquement. Les pages et les
// actions passent par ici, jamais par le client : un identifiant qui viendrait du
// navigateur serait un identifiant que le navigateur peut changer.
//
// Elle redirige plutôt que de rendre null. Un appelant qui reçoit null doit penser à
// le traiter, et le jour où il oublie il interroge la base sans propriétaire. Ici
// l'oubli est impossible : ou bien on a un identifiant, ou bien on n'est plus sur la
// page.
export async function requireUserId(): Promise<string> {
  const session = await auth().api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  return session.user.id;
}

// Tout le travail d'une page ou d'une action, fait au nom de la personne connectée.
//
// C'est le seul chemin vers la base depuis un écran. Il fait trois choses d'un coup :
// il identifie la personne, il enfile l'habit bridé de l'application, et il annonce à
// la base pour qui elle travaille. À partir de là, la base ne montre plus que les
// lignes de cette personne — même à une requête qui ne demandait aucun filtre.
//
// Passer par ici plutôt que d'appeler `db()` directement, c'est ce qui rend l'oubli
// impossible : il n'y a pas de version « sans propriétaire » de ce geste.
export async function pourMoi<T>(fn: (db: Db, userId: string) => Promise<T>): Promise<T> {
  // Hors de la transaction : sans session, requireUserId quitte la page, et il serait
  // absurde d'avoir ouvert une transaction pour rien.
  const userId = await requireUserId();
  return db().pourUtilisateur(userId, (database) => fn(database, userId));
}
