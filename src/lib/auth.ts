import { betterAuth } from "better-auth";
import { poolPostgres } from "../db/index";

// --- Qui utilise l'application -----------------------------------------------
// L'app était mono utilisateur. Rien en base ne portait de propriétaire parce que
// personne d'autre ne pouvait la lire. Ouvrir l'outil à d'autres commence ici.
//
// Better Auth pose ses propres tables (user, session, account, verification) dans
// LA MÊME base que le reste, et sur le même jeu de connexions : un compte créé
// ailleurs serait un compte qu'aucune requête métier ne pourrait joindre.
//
// Attention au voisinage des noms. Better Auth crée `account` au singulier, qui n'a
// rien à voir avec `accounts`, les comptes bancaires.
// Construit à la première utilisation, jamais au chargement du module. Sans cela, le
// simple fait d'importer un fichier qui touche à la session — de près ou de loin —
// exigerait une base joignable : les tests d'affichage, qui n'en ont aucun besoin,
// tomberaient sur une erreur de connexion avant même de commencer.
function construire() {
  return betterAuth({
    database: poolPostgres(),
    // Email et mot de passe pour commencer. Un fournisseur externe s'ajoute ici plus
    // tard sans rien défaire de ce qui suit.
    emailAndPassword: { enabled: true },
  });
}

let instance: ReturnType<typeof construire> | null = null;

export function auth(): ReturnType<typeof construire> {
  if (!instance) instance = construire();
  return instance;
}
