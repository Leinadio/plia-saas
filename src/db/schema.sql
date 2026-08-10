CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,             -- Enable Banking account uid
  name TEXT NOT NULL,
  iban_masked TEXT,
  balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  last_synced TEXT,                -- ISO datetime
  custom_name TEXT,                -- alias utilisateur ; NULL = utiliser name
  -- Propriétaire du compte (user.id de Better Auth). NULL = compte hérité d'avant les
  -- comptes utilisateurs, ou base où l'attribution n'a pas pu se décider. Pas de FK :
  -- la table `user` n'est pas créée par ce schéma mais par le CLI de Better Auth, et
  -- les bases de test n'en ont pas.
  user_id TEXT,
  -- Connexion bancaire qui a rapporté ce compte. Dit quelle session présenter pour le
  -- rafraîchir, et quelle banque redemander quand l'autorisation expire.
  connection_id INTEGER REFERENCES bank_connections(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,             -- Enable Banking id, ou "manual:<uuid>" pour une saisie
  account_id TEXT NOT NULL REFERENCES accounts(id),
  date TEXT NOT NULL,              -- YYYY-MM-DD
  amount REAL NOT NULL,            -- signed euros: debit negative, credit positive
  label TEXT NOT NULL,             -- raw bank label ou libellé saisi
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  line_id INTEGER REFERENCES group_lines(id) ON DELETE SET NULL,
  excluded INTEGER NOT NULL DEFAULT 0,  -- 1 = forcé « non catégorisé »
  ignored INTEGER NOT NULL DEFAULT 0,   -- 1 = non comptabilisée (invisible pour tout calcul)
  manual INTEGER NOT NULL DEFAULT 0,    -- 1 = saisie manuelle
  note TEXT,                            -- libellé de la saisie manuelle, conservé après fusion
  comment TEXT                          -- commentaire libre de l'utilisateur, affiché sous le libellé
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  -- Vestige : plus lu par aucun calcul de budget (la vérité est dans budget_amounts).
  -- Sert AUSSI de marqueur de version à migrateGroupsV2, qui détruit les groupes quand
  -- il ne le trouve pas : ne pas retirer sans changer ce marqueur d'abord.
  -- Conservé parce que les INSERT existants le remplissent encore ; ne pas s'en servir.
  monthly_amount REAL,
  start_month TEXT,                -- 'YYYY-MM' : mois de départ (invisible avant)
  end_month TEXT,                  -- 'YYYY-MM' ou NULL : dernier mois (NULL = permanent)
  -- 1 = dépense prévue, 0 = non prévue : les deux blocs du tableau. Se fixe à la
  -- création et ne bouge plus. Le défaut range d'office les enveloppes d'avant le
  -- découpage. Porté aussi par les revenus, où rien ne le lit.
  planned INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS group_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Vestige, comme groups.monthly_amount : le budget d'une ligne vit dans
  -- line_amounts. Encore lu par listGroups (affichage) et par la reprise de données.
  amount REAL NOT NULL,
  day INTEGER,
  keyword TEXT NOT NULL,
  start_month TEXT,                -- 'YYYY-MM' ou NULL : premier mois (NULL = pas de borne)
  end_month TEXT                   -- 'YYYY-MM' ou NULL : dernier mois (NULL = permanente)
);

CREATE TABLE IF NOT EXISTS reconcile_ignored (
  manual_id TEXT NOT NULL,
  synced_id TEXT NOT NULL,
  PRIMARY KEY (manual_id, synced_id)
);

-- Budgets datés : montant d'un groupe à partir d'un mois donné. SEULE source de
-- vérité du budget d'une enveloppe. Le montant en vigueur pour un mois M est celui
-- de la ligne au plus grand effective_month <= M ; sans ligne applicable, le montant
-- est 0 — on ne retombe sur AUCUN montant de base (cf. src/lib/budget-in-force.ts).
-- La reprise de données (migrateSeedDatedAmounts) garantit une entrée au mois de
-- départ de chaque enveloppe, et chaque création en pose une aussitôt.
-- group_id = 0 = non catégorisés (provision) : pas de FK volontairement, puisque ce
-- groupe-là n'existe dans aucune table.
CREATE TABLE IF NOT EXISTS budget_amounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  -- Compte de la provision des non catégorisés (group_id = 0), qui n'a pas de groupe
  -- pour lui en donner un. Chaîne vide pour un budget de groupe, jamais NULL : SQLite
  -- tient deux NULL pour distincts dans une contrainte d'unicité.
  account_id TEXT NOT NULL DEFAULT '',
  effective_month TEXT NOT NULL,   -- YYYY-MM
  amount REAL NOT NULL,
  -- Portée : 'ongoing' = vaut à partir de ce mois et pour les suivants ; 'once' = ne
  -- vaut que pour ce mois. Les deux peuvent coexister au même mois (relever durablement
  -- à partir de juillet ET faire une exception pour juillet), d'où la portée dans la
  -- clé d'unicité — sinon écrire l'une effacerait l'autre.
  scope TEXT NOT NULL DEFAULT 'ongoing',
  UNIQUE(group_id, account_id, effective_month, scope)
);

-- Montants datés d'une ligne de récurrent. Même règle que budget_amounts : le
-- montant en vigueur au mois M est celui de la ligne au plus grand
-- effective_month <= M. Le budget d'un récurrent est la somme de ses lignes.
-- ON DELETE CASCADE : supprimer une ligne emporte son historique.
CREATE TABLE IF NOT EXISTS line_amounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER NOT NULL REFERENCES group_lines(id) ON DELETE CASCADE,
  effective_month TEXT NOT NULL,   -- YYYY-MM
  amount REAL NOT NULL,
  -- Portée : 'ongoing' = vaut à partir de ce mois et pour les suivants ; 'once' = ne
  -- vaut que pour ce mois. Les deux peuvent coexister au même mois (relever durablement
  -- à partir de juillet ET faire une exception pour juillet), d'où la portée dans la
  -- clé d'unicité — sinon écrire l'une effacerait l'autre.
  scope TEXT NOT NULL DEFAULT 'ongoing',
  UNIQUE(line_id, effective_month, scope)
);

-- Notifications fermées d'une croix par l'utilisateur. L'identité est celle que
-- construit overspendNotifications (« compte::cible::mois ») : on écarte par identité,
-- pas par montant, pour qu'un dépassement qui continue de grossir ne fasse pas
-- reparaître une notification déjà écartée.
CREATE TABLE IF NOT EXISTS dismissed_notifications (
  id TEXT PRIMARY KEY,
  dismissed_at TEXT NOT NULL   -- ISO datetime
);

-- Une autorisation bancaire : une banque, une session, une expiration à 90 jours. Une
-- ligne par banque ET par utilisateur — c'est ce qui permet d'en avoir plusieurs, là
-- où trois réglages uniques n'en tenaient qu'une. session_id et valid_until sont nuls
-- entre la demande et le retour de la banque.
CREATE TABLE IF NOT EXISTS bank_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  aspsp_name TEXT NOT NULL,
  aspsp_country TEXT NOT NULL,
  session_id TEXT,
  valid_until TEXT,
  -- Les uid de comptes rapportés par la banque, en JSON. Nécessaires à la toute
  -- première synchronisation, quand aucun compte n'est encore en base.
  account_uids TEXT
);
