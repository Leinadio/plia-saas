import { Pool } from "pg";
import { dbFrom, type Db, type QueryHost } from "./pg";

// --- La connexion à la base ----------------------------------------------------
//
// Un seul jeu de connexions pour toute l'application, ouvert à la première requête et
// gardé ensuite. Ouvrir une connexion à un Postgres distant coûte un aller-retour
// réseau et une poignée de main chiffrée : le faire à chaque affichage de page se
// verrait à l'œil nu.
//
// Le nombre de connexions est volontairement bas. L'hébergement d'une application web
// moderne démarre une copie du serveur par requête simultanée, et chacune voudrait son
// jeu : quelques dizaines de visiteurs suffiraient alors à épuiser les connexions
// autorisées par la base. C'est aussi pourquoi l'adresse doit viser le répartiteur de
// Supabase et non la base en direct.

let pool: Pool | null = null;

function jeuDeConnexions(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL absent : donner l'adresse du répartiteur Supabase dans .env.local.",
      );
    }
    pool = new Pool({ connectionString: url, max: 4 });
  }
  return pool;
}

function hote(p: Pool): QueryHost {
  return {
    query: (sql, params) => p.query(sql, params),
    // Une transaction doit tenir la même connexion du début à la fin : on en sort une
    // du jeu et on la garde pour elle seule.
    reserve: async () => {
      const client = await p.connect();
      return {
        host: { query: (sql, params) => client.query(sql, params) },
        release: () => client.release(),
      };
    },
  };
}

export function db(): Db {
  return dbFrom(hote(jeuDeConnexions()));
}

// Le jeu de connexions brut, pour Better Auth : il pose et interroge ses propres
// tables (comptes, sessions) avec son propre outillage, et veut le pilote tel quel.
export function poolPostgres(): Pool {
  return jeuDeConnexions();
}
