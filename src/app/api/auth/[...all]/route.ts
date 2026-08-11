// Le point d'entrée de Better Auth. Il répond à tout ce qui commence par
// /api/auth : inscription, connexion, déconnexion, session courante. Les autres
// routes du dossier api (connect, callback, sync) restent celles d'Enable Banking.
//
// Les deux fonctions ne construisent Better Auth qu'à la première requête reçue. Le
// faire au chargement du fichier reviendrait à exiger une base joignable au moment de
// compiler l'application, là où personne n'a encore rien demandé.
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export function GET(request: Request) {
  return toNextJsHandler(auth()).GET(request);
}

export function POST(request: Request) {
  return toNextJsHandler(auth()).POST(request);
}
