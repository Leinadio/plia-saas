import { betterAuth } from "better-auth";
import { db } from "../db/index";

// --- Qui utilise l'application -----------------------------------------------
// L'app était mono utilisateur. Rien en base ne portait de propriétaire parce que
// personne d'autre ne pouvait la lire. Ouvrir l'outil à d'autres commence ici.
//
// Better Auth pose ses propres tables (user, session, account, verification) dans
// LA MÊME base que le reste. Une seule connexion better-sqlite3 pour tout, celle du
// projet : deux connexions sur un même fichier SQLite en écriture s'attendent l'une
// l'autre, et un compte créé dans un fichier séparé serait un compte qu'aucune
// requête métier ne pourrait joindre.
//
// ATTENTION. Nos migrations vivent dans src/db/migrations.ts et certaines détruisent
// des tables quand un marqueur de version leur manque (cf. migrateGroupsV2). Elles ne
// visent que les tables du budget et ignorent celles de Better Auth. Toute migration
// qui balaierait large est à écrire en connaissance de cela.
export const auth = betterAuth({
  database: db(),
  // Email et mot de passe pour commencer. Un fournisseur externe s'ajoute ici plus
  // tard sans rien défaire de ce qui suit.
  emailAndPassword: { enabled: true },
});
