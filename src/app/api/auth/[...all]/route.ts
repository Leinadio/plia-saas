// Le point d'entrée de Better Auth. Il répond à tout ce qui commence par
// /api/auth : inscription, connexion, déconnexion, session courante. Les autres
// routes du dossier api (connect, callback, sync) restent celles d'Enable Banking.
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
