// Reprend la base SQLite locale dans la base Supabase.
//
//   node --env-file=.env.local scripts/reprendre-donnees.mjs [chemin/vers/budget.db]
//
// La base d'origine n'est jamais touchée : elle est ouverte en lecture seule et reste
// telle quelle. Si quelque chose manque à l'arrivée, on efface et on recommence.
//
// Tout passe dans UNE transaction. À moitié faite, la reprise laisserait une base
// incohérente — des dépenses sans compte, des opérations sans dépense — et il faudrait
// deviner où elle s'était arrêtée. Ici, ou bien tout est là, ou bien rien n'a bougé.
//
// Le script refuse de tourner sur une base qui contient déjà quelque chose. Repasser
// dessus doublerait les opérations, et un doublon d'opération, c'est un solde faux.
import Database from "better-sqlite3";
import { Client } from "pg";

const chemin = process.argv[2] ?? "data/budget.db";
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL (ou DATABASE_URL) absent. Lancer avec --env-file=.env.local.");
  process.exit(1);
}

const source = new Database(chemin, { readonly: true });
const cible = new Client({ connectionString: url });

// Les tables reprises, dans l'ordre où elles peuvent l'être : une table qui en cite une
// autre passe après elle, sinon la base refuse la ligne.
//
// Trois tables de la base d'origine restent au vestiaire. `session` : les connexions en
// cours ne survivent pas au déménagement, chacun se reconnectera. `verification` : elle
// est vide, et ce qu'elle contient expire de toute façon. `settings` : plus aucun écran
// ne la lit depuis que les connexions bancaires ont leur propre table.
const TABLES = [
  {
    nom: "user",
    lecture: `SELECT id, name, email, emailVerified, image, createdAt, updatedAt FROM user`,
    colonnes: ["id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt"],
    transforme: (r) => ({ ...r, emailVerified: r.emailVerified === 1 }),
  },
  {
    nom: "account",
    lecture: `SELECT id, accountId, providerId, userId, password, createdAt, updatedAt FROM account`,
    colonnes: ["id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt"],
  },
  {
    nom: "bank_connections",
    lecture: `SELECT id, user_id, aspsp_name, aspsp_country, session_id, valid_until, account_uids FROM bank_connections`,
    colonnes: ["id", "user_id", "aspsp_name", "aspsp_country", "session_id", "valid_until", "account_uids"],
  },
  {
    nom: "accounts",
    lecture: `SELECT id, name, iban_masked, balance, currency, last_synced, custom_name, user_id, connection_id FROM accounts`,
    colonnes: ["id", "name", "iban_masked", "balance", "currency", "last_synced", "custom_name", "user_id", "connection_id"],
  },
  {
    nom: "groups",
    lecture: `SELECT id, account_id, name, direction, monthly_amount, start_month, end_month, planned FROM groups`,
    colonnes: ["id", "account_id", "name", "direction", "monthly_amount", "start_month", "end_month", "planned"],
    transforme: (r) => ({ ...r, planned: r.planned === 1 }),
  },
  {
    nom: "group_lines",
    lecture: `SELECT id, group_id, name, amount, keyword, start_month, end_month FROM group_lines`,
    colonnes: ["id", "group_id", "name", "amount", "keyword", "start_month", "end_month"],
  },
  {
    nom: "transactions",
    lecture: `SELECT id, account_id, date, amount, label, group_id, line_id, excluded, ignored, manual, note, comment FROM transactions`,
    colonnes: ["id", "account_id", "date", "amount", "label", "group_id", "line_id", "excluded", "ignored", "manual", "note", "comment"],
    // SQLite ne connaît pas les booléens : ces quatre colonnes y valaient 0 ou 1.
    transforme: (r) => ({ ...r, excluded: r.excluded === 1, ignored: r.ignored === 1, manual: r.manual === 1 }),
  },
  {
    nom: "budget_amounts",
    lecture: `SELECT id, group_id, account_id, effective_month, amount, scope FROM budget_amounts`,
    colonnes: ["id", "group_id", "account_id", "effective_month", "amount", "scope"],
  },
  {
    nom: "line_amounts",
    lecture: `SELECT id, line_id, effective_month, amount, scope FROM line_amounts`,
    colonnes: ["id", "line_id", "effective_month", "amount", "scope"],
  },
];

// Les compteurs d'identifiants doivent repartir après le plus grand numéro repris.
// Oubliés, la prochaine dépense créée réclamerait le numéro 1, déjà pris.
const COMPTEURS = ["bank_connections", "groups", "group_lines", "budget_amounts", "line_amounts"];

function guillemets(nom) {
  return `"${nom}"`;
}

async function verse(table) {
  const lignes = source.prepare(table.lecture).all().map(table.transforme ?? ((r) => r));
  if (lignes.length === 0) return 0;
  const colonnes = table.colonnes.map(guillemets).join(", ");
  for (const ligne of lignes) {
    const valeurs = table.colonnes.map((c) => ligne[c]);
    const trous = valeurs.map((_, i) => `$${i + 1}`).join(", ");
    await cible.query(`INSERT INTO ${guillemets(table.nom)} (${colonnes}) VALUES (${trous})`, valeurs);
  }
  return lignes.length;
}

try {
  await cible.connect();

  const occupees = [];
  for (const t of [...TABLES, { nom: "reconcile_ignored" }, { nom: "dismissed_notifications" }]) {
    const { rows } = await cible.query(`SELECT count(*)::int AS n FROM ${guillemets(t.nom)}`);
    if (rows[0].n > 0) occupees.push(`${t.nom} (${rows[0].n})`);
  }
  if (occupees.length > 0) {
    console.error(`La base d'arrivée n'est pas vide : ${occupees.join(", ")}.`);
    console.error("Vider ces tables avant de reprendre, sinon les opérations se dédoubleraient.");
    process.exit(1);
  }

  await cible.query("BEGIN");

  for (const table of TABLES) {
    const n = await verse(table);
    console.log(`${table.nom.padEnd(18)} ${n}`);
  }

  // Les deux tables qui n'avaient pas de propriétaire dans l'ancienne base : il se
  // retrouve par le compte bancaire, qui commence l'identité d'un acquittement et
  // porte les opérations d'une paire écartée.
  const proprietaire = new Map(
    source.prepare(`SELECT id, user_id FROM accounts`).all().map((r) => [r.id, r.user_id]),
  );

  let acquittements = 0;
  const perdus = [];
  for (const r of source.prepare(`SELECT id, dismissed_at FROM dismissed_notifications`).all()) {
    const user = proprietaire.get(r.id.split("::")[0]);
    // Les plus anciennes identités commençaient par le NOM du compte et non par son
    // numéro. Elles ne désignent plus aucune alerte affichable : les reprendre
    // reviendrait à emporter des lignes que rien ne peut plus faire correspondre.
    if (!user) { perdus.push(r.id); continue; }
    await cible.query(
      `INSERT INTO dismissed_notifications (user_id, id, dismissed_at) VALUES ($1, $2, $3)`,
      [user, r.id, r.dismissed_at],
    );
    acquittements += 1;
  }
  console.log(`${"dismissed_notif.".padEnd(18)} ${acquittements}${perdus.length ? ` (${perdus.length} périmé(s) laissé(s))` : ""}`);

  const operations = new Map(
    source.prepare(`SELECT id, account_id FROM transactions`).all().map((r) => [r.id, r.account_id]),
  );
  let paires = 0;
  for (const r of source.prepare(`SELECT manual_id, synced_id FROM reconcile_ignored`).all()) {
    const user = proprietaire.get(operations.get(r.manual_id) ?? "");
    if (!user) continue;
    await cible.query(
      `INSERT INTO reconcile_ignored (user_id, manual_id, synced_id) VALUES ($1, $2, $3)`,
      [user, r.manual_id, r.synced_id],
    );
    paires += 1;
  }
  console.log(`${"reconcile_ignored".padEnd(18)} ${paires}`);

  for (const nom of COMPTEURS) {
    await cible.query(
      `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${guillemets(nom)}), 0) + 1, false)`,
      [nom],
    );
  }

  await cible.query("COMMIT");
  console.log("\nRepris. La base d'origine n'a pas été touchée.");
  if (perdus.length > 0) console.log(`Laissés de côté : ${perdus.join(", ")}`);
} catch (e) {
  await cible.query("ROLLBACK").catch(() => {});
  console.error("Échec, rien n'a été écrit :", e.message);
  process.exitCode = 1;
} finally {
  source.close();
  await cible.end();
}
