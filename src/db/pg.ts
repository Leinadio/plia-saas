// --- Parler à Postgres ---------------------------------------------------------
//
// Ce qui remplace better-sqlite3. Trois gestes, les mêmes qu'avant — lire une ligne,
// lire toutes les lignes, écrire — plus les écritures groupées. La seule différence
// de fond : il faut attendre la réponse.
//
// Volontairement minuscule. Le SQL reste écrit à la main, comme aujourd'hui : les
// requêtes du budget sont des requêtes de rapport, avec des fenêtres de mois et des
// montants en vigueur à une date, et aucune bibliothèque ne les écrirait mieux qu'à
// la main. Seuls les emplacements de paramètres changent de notation, de `?` à `$1`.
//
// Ce module ne connaît ni le pilote de production ni celui des tests : il travaille
// sur tout objet qui sait exécuter une requête et rendre des lignes. C'est ce qui
// permet aux tests de tourner sur un Postgres en mémoire et à la production sur
// Supabase, avec exactement le même code au-dessus.

// Ce que doit savoir faire un pilote pour être accepté ici. `fields` décrit les
// colonnes rendues : c'est de là que vient la traduction des types ci-dessous.
export interface QueryHost {
  query(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: unknown[]; fields: { name: string; dataTypeID: number }[] }>;
  // Réserver une connexion pour soi seul, le temps d'une transaction.
  //
  // En production les requêtes se répartissent sur un jeu de connexions partagées :
  // le BEGIN partirait sur l'une et l'écriture sur une autre, qui n'en saurait rien.
  // Les pilotes qui n'ont qu'une seule connexion — celui des tests — n'ont rien à
  // réserver et laissent ce point vide.
  reserve?(): Promise<{ host: QueryHost; release(): void }>;
}

// Les types que Postgres rend sous forme de texte alors que le code attend un nombre.
//
//   1700 = NUMERIC, le type des euros. Rendu en texte parce qu'aucun nombre flottant
//          ne peut représenter tous les décimaux exactement — c'est précisément
//          pourquoi les montants sont stockés ainsi.
//     20 = BIGINT, le type de tout COUNT(). Rendu en texte pour ne pas perdre les
//          très grands entiers.
//
// Sans cette traduction, un solde arrive comme "12.34" : ajouté à un autre solde il
// donne "12.3412.34", et rien ne proteste avant l'affichage.
const EN_TEXTE = new Set([1700, 20]);

export type Db = {
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<void>;
  // Tout ou rien. Supprimer une banque efface ses comptes, leurs opérations et leurs
  // enveloppes : s'arrêter au milieu laisserait des enveloppes sans compte.
  //
  // ATTENTION en production : ouvrir une transaction suppose de tenir la MÊME
  // connexion du début à la fin. Sur un jeu de connexions partagé, chaque requête
  // peut partir sur une connexion différente et le BEGIN se perdrait. La production
  // devra donc réserver une connexion pour la durée de la transaction — c'est le
  // rôle de l'assemblage, pas de ce module.
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  // Travailler au nom de quelqu'un, sous l'habit bridé de l'application.
  //
  // Deux gestes en un : le serveur cesse d'être administrateur de la base, et il
  // annonce pour qui il travaille. À partir de là, la base ne lui montre plus que les
  // lignes de cette personne — même si la requête, elle, ne demandait aucun filtre.
  // C'est le second verrou : un oubli dans le code ne fait plus fuiter quoi que ce soit.
  //
  // Les deux gestes ne valent que le temps du travail. Une annonce qui lui survivrait
  // serait pire que rien : la connexion retourne dans le jeu commun et servirait la
  // requête suivante, celle de quelqu'un d'autre.
  pourUtilisateur<T>(userId: string, fn: (db: Db) => Promise<T>): Promise<T>;
};

export function dbFrom(host: QueryHost): Db {
  async function all<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const res = await host.query(sql, params);
    const aTraduire = res.fields.filter((f) => EN_TEXTE.has(f.dataTypeID)).map((f) => f.name);
    if (aTraduire.length > 0) {
      for (const ligne of res.rows as Record<string, unknown>[]) {
        for (const nom of aTraduire) {
          const v = ligne[nom];
          if (typeof v === "string") ligne[nom] = Number(v);
        }
      }
    }
    return res.rows as T[];
  }

  const db: Db = {
    all,
    async one<T>(sql: string, params?: unknown[]): Promise<T | undefined> {
      const lignes = await all<T>(sql, params);
      return lignes[0];
    },
    async run(sql: string, params?: unknown[]): Promise<void> {
      await host.query(sql, params);
    },
    async tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
      // La connexion est rendue quoi qu'il arrive : sans ça, une transaction qui
      // échoue en emporte une, et le jeu se vide jusqu'au blocage complet.
      const reservation = host.reserve ? await host.reserve() : null;
      const dedans = reservation ? dbFrom(reservation.host) : db;
      try {
        await dedans.run("BEGIN");
        try {
          const resultat = await fn(dedans);
          await dedans.run("COMMIT");
          return resultat;
        } catch (e) {
          await dedans.run("ROLLBACK");
          throw e;
        }
      } finally {
        reservation?.release();
      }
    },
    pourUtilisateur<T>(userId: string, fn: (db: Db) => Promise<T>): Promise<T> {
      // Tout se passe dans une transaction, et c'est ce qui borne les deux gestes :
      // LOCAL veut dire « jusqu'au bout de celle-ci, pas plus loin ».
      return db.tx(async (t) => {
        await t.run("SET LOCAL ROLE budget_app");
        await t.run("SELECT set_config('app.user_id', $1, true)", [userId]);
        return fn(t);
      });
    },
  };

  return db;
}
