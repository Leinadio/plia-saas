import type Database from "better-sqlite3";

// Ajoute la colonne custom_name (alias utilisateur) aux bases antérieures.
// Idempotent : no-op si la colonne existe déjà. Ne touche à aucune donnée.
export function migrateAccountCustomName(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(accounts)").all() as { name: string }[];
  if (cols.some((c) => c.name === "custom_name")) return;
  db.exec(`ALTER TABLE accounts ADD COLUMN custom_name TEXT`);
}

// Refonte des groupes : type (enveloppe/recurring) + montant mensuel + mots-clés,
// et rattachement manuel des transactions (group_id). Clean slate sur les groupes
// (comptes/transactions conservés). Idempotent.
//
// ATTENTION : le marqueur de version est `monthly_amount`, et cette migration DÉTRUIT
// les groupes quand elle ne le trouve pas. Il a longtemps été `kind` — jusqu'à ce que
// cette colonne disparaisse (migrateDropGroupKind) : la base rouverte se serait crue en
// v1 et aurait effacé tous les groupes au redémarrage suivant. Ne jamais retirer
// `monthly_amount` sans changer ce marqueur d'abord. C'est le genre de mine qu'une base
// « :memory: » ne fait jamais sauter (voir tests/db/migration-drop-group-kind.test.ts).
export function migrateGroupsV2(db: Database.Database): void {
  const gcols = db.prepare("PRAGMA table_info(groups)").all() as { name: string }[];
  if (!gcols.some((c) => c.name === "monthly_amount")) {
    db.transaction(() => {
      db.exec(`
        DROP TABLE IF EXISTS group_keywords;
        DROP TABLE IF EXISTS group_lines;
        DROP TABLE IF EXISTS groups;
        CREATE TABLE groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id TEXT NOT NULL REFERENCES accounts(id),
          name TEXT NOT NULL,
          direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
          kind TEXT NOT NULL CHECK (kind IN ('envelope', 'recurring')),
          monthly_amount REAL
        );
        CREATE TABLE group_lines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          day INTEGER,
          keyword TEXT NOT NULL
        );
        CREATE TABLE group_keywords (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          keyword TEXT NOT NULL
        );
      `);
    })();
  }
  const tcols = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  if (!tcols.some((c) => c.name === "group_id")) {
    db.exec(`ALTER TABLE transactions ADD COLUMN group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL`);
  }
}

// Ajoute la colonne excluded : une transaction forcée « non catégorisé » est
// exclue de toute catégorisation (même si un mot-clé matcherait). Idempotent.
export function migrateTransactionExcluded(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  if (cols.some((c) => c.name === "excluded")) return;
  db.exec(`ALTER TABLE transactions ADD COLUMN excluded INTEGER NOT NULL DEFAULT 0`);
}

// Ajoute la colonne ignored : une transaction non comptabilisée est retirée de
// tous les calculs (dépenses, budgets, soldes, prévisionnel). À ne pas confondre
// avec excluded, qui la force en « non catégorisé » mais la garde comptée.
// Idempotent.
export function migrateTransactionIgnored(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  if (cols.some((c) => c.name === "ignored")) return;
  db.exec(`ALTER TABLE transactions ADD COLUMN ignored INTEGER NOT NULL DEFAULT 0`);
}

// Ajoute la colonne line_id : rattachement manuel d'une transaction à une ligne
// précise d'un groupe récurrent (ex. « Direct Assurance voiture »). Idempotent.
export function migrateTransactionLineId(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  if (cols.some((c) => c.name === "line_id")) return;
  db.exec(`ALTER TABLE transactions ADD COLUMN line_id INTEGER REFERENCES group_lines(id) ON DELETE SET NULL`);
}

// Ajoute les colonnes de saisie manuelle : manual (1 = saisie main) et note
// (commentaire, reçoit le libellé manuel après fusion). Idempotent.
//
// Elle ajoutait aussi income_kind, la classe de revenu d'une transaction saisie à la
// main. Cette colonne est restée à NULL sur toutes les lignes : la classe venait du
// groupe, pas de la transaction. Elle a été retirée (migrateDropIncomeKind) — la
// rajouter ici la ferait revenir à chaque démarrage.
export function migrateTransactionManualFields(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "manual"))
    db.exec(`ALTER TABLE transactions ADD COLUMN manual INTEGER NOT NULL DEFAULT 0`);
  if (!cols.some((c) => c.name === "note"))
    db.exec(`ALTER TABLE transactions ADD COLUMN note TEXT`);
}

// Table des rapprochements écartés (« ce n'est pas la même ») : ne plus reproposer
// une paire (manuelle, synchronisée). Idempotent.
export function migrateReconcileIgnored(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS reconcile_ignored (
    manual_id TEXT NOT NULL,
    synced_id TEXT NOT NULL,
    PRIMARY KEY (manual_id, synced_id)
  )`);
}

// Retire la classe de revenu, des groupes comme des transactions. « Principale » et
// « supplémentaire » promettaient deux comportements et n'en disaient qu'un : ce revenu
// se reproduit, ou non. Sa durée le dit mieux, et dit en plus de quels mois il s'agit.
//
// ATTENTION : deux migrations ajoutaient cette colonne quand elles ne la trouvaient pas
// (migrateGroupIncomeKind, supprimée ; migrateTransactionManualFields, amputée). Toute
// migration qui la rajouterait la ferait revenir au démarrage suivant, indéfiniment —
// c'est ce que vérifie tests/db/migration-drop-income-kind.test.ts, sur une vraie base
// sur disque rouverte plusieurs fois.
export function migrateDropIncomeKind(db: Database.Database): void {
  for (const table of ["groups", "transactions"]) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (cols.some((c) => c.name === "income_kind")) {
      db.exec(`ALTER TABLE ${table} DROP COLUMN income_kind`);
    }
  }
}

// Ajoute la colonne planned : une dépense est prévue (1) ou non prévue (0), les deux
// blocs du tableau. Le défaut à 1 est tout l'enjeu de cette migration — le découpage
// arrive après les enveloppes, et aucune ne doit changer de bloc en rouvrant la base.
// Un revenu porte la colonne comme les autres, sans que rien ne la lise. Idempotent.
export function migrateGroupPlanned(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(groups)").all() as { name: string }[];
  if (cols.some((c) => c.name === "planned")) return;
  db.exec(`ALTER TABLE groups ADD COLUMN planned INTEGER NOT NULL DEFAULT 1`);
}

// --- À qui appartient un compte bancaire -------------------------------------
// Tout le budget pend au compte : une transaction a son account_id, un groupe aussi,
// un sous-poste appartient à son groupe. Poser le propriétaire ici suffit donc à en
// donner un à tout le reste.
//
// L'attribution de l'existant ne se fait que dans le seul cas où il n'y a rien à
// deviner : un utilisateur inscrit et un seul. À plusieurs on ne choisit pas — un
// compte donné au mauvais propriétaire est une fuite qui ne fait aucun bruit, et un
// rattrapage à la main vaut mieux qu'un mauvais choix automatique.
//
// La table `user` vient de Better Auth et non de schema.sql. Les bases de test ne
// l'ont pas : sans la garde ci-dessous, getDb lèverait partout.
export function migrateAccountOwner(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(accounts)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "user_id")) {
    db.exec(`ALTER TABLE accounts ADD COLUMN user_id TEXT`);
  }
  const aUser = db
    .prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user'`)
    .get();
  if (!aUser) return;
  const orphelins = (db.prepare(`SELECT COUNT(*) AS n FROM accounts WHERE user_id IS NULL`).get() as { n: number }).n;
  if (orphelins === 0) return;
  const users = db.prepare(`SELECT id FROM user`).all() as { id: string }[];
  if (users.length !== 1) return;
  db.prepare(`UPDATE accounts SET user_id = ? WHERE user_id IS NULL`).run(users[0].id);
}

// --- La provision des non catégorisés, par compte ------------------------------
// Le groupe 0 ne désigne pas un groupe mais les non catégorisés, dont la provision se
// règle comme un budget. Elle était écrite sans compte alors que l'historique affiche
// un onglet par compte : deux comptes d'une même personne partageaient la même, et
// corriger l'un corrigeait l'autre.
//
// L'unicité gagne donc le compte. TEXT NOT NULL DEFAULT '' et jamais NULL : SQLite
// tient deux NULL pour distincts dans une contrainte d'unicité, si bien qu'un budget de
// groupe (qui n'a pas de compte à lui, il le tient du groupe) pourrait être inséré deux
// fois au même mois au lieu d'être remplacé.
//
// Les provisions déjà en base n'ont pas de compte auquel les rendre. On ne devine pas :
// elles restent avec un compte vide, donc invisibles, et un avertissement le dit.
export function migrateProvisionPerAccount(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(budget_amounts)").all() as { name: string }[];
  if (cols.some((c) => c.name === "account_id")) return;
  db.transaction(() => {
    db.exec(`
      CREATE TABLE budget_amounts_owned (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        account_id TEXT NOT NULL DEFAULT '',
        effective_month TEXT NOT NULL,
        amount REAL NOT NULL,
        scope TEXT NOT NULL DEFAULT 'ongoing',
        UNIQUE(group_id, account_id, effective_month, scope)
      );
      INSERT INTO budget_amounts_owned (id, group_id, account_id, effective_month, amount, scope)
        SELECT id, group_id, '', effective_month, amount, scope FROM budget_amounts;
      DROP TABLE budget_amounts;
      ALTER TABLE budget_amounts_owned RENAME TO budget_amounts;
    `);
  })();
  const perdues = (db
    .prepare(`SELECT COUNT(*) AS n FROM budget_amounts WHERE group_id = 0 AND amount > 0`)
    .get() as { n: number }).n;
  if (perdues > 0) {
    console.warn(
      `[budgets] ${perdues} provision(s) de non catégorisés n'ont pas de compte auquel se rattacher : ` +
        `elles ne s'affichent plus. À reposer à la main sur le compte concerné.`,
    );
  }
}

// --- Le trousseau de connexions bancaires --------------------------------------
// Reprend la connexion qui vivait dans trois réglages uniques (session_id,
// account_uids, consent_valid_until) vers une table qui en tient plusieurs.
//
// Comme pour les comptes, la reprise ne devine que s'il n'y a rien à deviner : un seul
// inscrit. À plusieurs elle se tait — donner l'accès à la vraie banque de quelqu'un au
// mauvais utilisateur ne se rattrape pas.
//
// Les anciens réglages ne sont PAS supprimés. Ils ne sont plus lus, mais les effacer
// rendrait la reprise irréversible si elle s'était trompée.
export function migrateBankConnections(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS bank_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    aspsp_name TEXT NOT NULL,
    aspsp_country TEXT NOT NULL,
    session_id TEXT,
    valid_until TEXT,
    account_uids TEXT
  )`);
  const ccols = db.prepare("PRAGMA table_info(bank_connections)").all() as { name: string }[];
  if (!ccols.some((c) => c.name === "account_uids")) {
    db.exec(`ALTER TABLE bank_connections ADD COLUMN account_uids TEXT`);
  }
  const cols = db.prepare("PRAGMA table_info(accounts)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "connection_id")) {
    db.exec(`ALTER TABLE accounts ADD COLUMN connection_id INTEGER REFERENCES bank_connections(id) ON DELETE SET NULL`);
  }

  const deja = (db.prepare(`SELECT COUNT(*) AS n FROM bank_connections`).get() as { n: number }).n;
  if (deja > 0) return;
  const reglage = (cle: string): string | null => {
    const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(cle) as { value: string } | undefined;
    return row?.value ?? null;
  };
  const sessionId = reglage("session_id");
  if (!sessionId) return;
  const aUser = db.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='user'`).get();
  if (!aUser) return;
  const users = db.prepare(`SELECT id FROM user`).all() as { id: string }[];
  if (users.length !== 1) return;

  const info = db
    .prepare(`INSERT INTO bank_connections (user_id, aspsp_name, aspsp_country, session_id, valid_until, account_uids) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(users[0].id, process.env.ENABLEBANKING_ASPSP_NAME ?? "CIC", process.env.ENABLEBANKING_ASPSP_COUNTRY ?? "FR", sessionId, reglage("consent_valid_until"), reglage("account_uids"));
  const cid = Number(info.lastInsertRowid);
  // Tous les comptes de cet utilisateur viennent de cette connexion : c'était la seule.
  db.prepare(`UPDATE accounts SET connection_id = ? WHERE user_id = ? AND connection_id IS NULL`).run(cid, users[0].id);
}

// Durée de vie des groupes : mois de départ / de fin. Les groupes existants
// deviennent permanents et visibles partout (start_month très ancien).
export function migrateGroupLifespan(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(groups)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "start_month"))
    db.exec(`ALTER TABLE groups ADD COLUMN start_month TEXT`);
  if (!cols.some((c) => c.name === "end_month"))
    db.exec(`ALTER TABLE groups ADD COLUMN end_month TEXT`);
  db.exec(`UPDATE groups SET start_month = '2000-01' WHERE start_month IS NULL`);
}

// Durée de vie d'une ligne de récurrent : mêmes bornes que pour un groupe. Un
// abonnement résilié s'arrête sans emporter le récurrent qui le porte, et une ligne
// posée pour un seul mois ne traîne pas sur les suivants.
//
// Aucune reprise pour les lignes existantes : sans bornes, elles restent permanentes,
// ce qu'elles étaient. Leur début, lui, se lit déjà dans leur suite de montants datés
// (lineStarted) — leur inventer ici un mois de départ les ferait naître ailleurs que
// là où le tableau les montre naître. Idempotent.
export function migrateLineLifespan(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(group_lines)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "start_month"))
    db.exec(`ALTER TABLE group_lines ADD COLUMN start_month TEXT`);
  if (!cols.some((c) => c.name === "end_month"))
    db.exec(`ALTER TABLE group_lines ADD COLUMN end_month TEXT`);
}

// Retire la nature d'un groupe (« enveloppe » / « récurrent »). Elle ne décidait plus
// rien : le budget, le dépassement, la prévision et le rattachement se règlent tous sur
// un fait — la dépense a-t-elle des sous-postes. Deux mots qui promettaient deux
// comportements et n'en donnaient qu'un valaient moins que rien : ils faisaient croire
// à un choix au moment de créer une dépense.
//
// À passer APRÈS toutes les migrations qui lisent encore la colonne. Idempotent.
export function migrateDropGroupKind(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(groups)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "kind")) return;
  db.exec(`ALTER TABLE groups DROP COLUMN kind`);
}

// Retire le jour du mois des sous-postes. Il ne pilotait plus rien : aucun calcul ne
// le comparait à une date, et la frise d'échéances qu'il triait n'était plus affichée.
// Maintenant que n'importe quelle dépense peut avoir des sous-postes, le demander
// n'aurait aucun sens — « Boulangerie, le combien ? ». Idempotent.
export function migrateDropLineDay(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(group_lines)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "day")) return;
  db.exec(`ALTER TABLE group_lines DROP COLUMN day`);
}

// Retire la FK sur budget_amounts.group_id : la provision « non catégorisés »
// (group_id = 0) n'a pas de ligne dans groups, la FK faisait échouer l'insertion.
// Même traitement que overspend_decisions (pas de FK volontairement). Idempotent :
// no-op si la FK a déjà été retirée (détecté via PRAGMA foreign_key_list).
export function migrateBudgetAmountsDropGroupFk(db: Database.Database): void {
  const fks = db.prepare("PRAGMA foreign_key_list(budget_amounts)").all() as { table: string }[];
  if (!fks.some((fk) => fk.table === "groups")) return;
  db.transaction(() => {
    db.exec(`
      CREATE TABLE budget_amounts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        effective_month TEXT NOT NULL,
        amount REAL NOT NULL,
        UNIQUE(group_id, effective_month)
      );
      INSERT INTO budget_amounts_new (id, group_id, effective_month, amount)
        SELECT id, group_id, effective_month, amount FROM budget_amounts;
      DROP TABLE budget_amounts;
      ALTER TABLE budget_amounts_new RENAME TO budget_amounts;
    `);
  })();
}

// Table des notifications fermées d'une croix. Idempotent.
export function migrateDismissedNotifications(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS dismissed_notifications (
    id TEXT PRIMARY KEY,
    dismissed_at TEXT NOT NULL
  )`);
}

// Ajoute la PORTÉE aux montants datés : un montant vaut soit à partir de son mois
// (« ongoing »), soit pour son seul mois (« once »). Avant, la seconde sémantique
// était bricolée à l'écriture — appliquer un montant « ce mois seulement » posait EN
// PLUS une restauration de l'ancien montant au mois suivant. Cette écriture touchait
// un mois que personne n'avait demandé à changer, et se relisait ensuite comme un
// changement qu'on n'avait jamais fait. La portée dans la donnée rend cette béquille
// inutile : un montant ponctuel s'écrit une fois, dans son mois.
//
// L'unicité passe de (cible, mois) à (cible, mois, portée) : les deux portées peuvent
// coexister au même mois — relever durablement à partir de juillet ET faire une
// exception pour juillet. Sans ça, appliquer l'une effacerait silencieusement l'autre,
// et les mois suivants retomberaient sur un montant plus ancien que le bon.
//
// Tout ce qui est déjà en base devient « ongoing » : c'était la seule sémantique
// possible jusqu'ici, la reclasser autrement changerait des chiffres déjà affichés.
// Idempotent : la présence de la colonne suffit à savoir que c'est fait.
export function migrateBudgetAmountScope(db: Database.Database): void {
  const aScope = (table: string) =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === "scope");
  if (aScope("budget_amounts") && aScope("line_amounts")) return;
  db.transaction(() => {
    if (!aScope("budget_amounts")) {
      db.exec(`
        CREATE TABLE budget_amounts_scoped (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL,
          effective_month TEXT NOT NULL,
          amount REAL NOT NULL,
          scope TEXT NOT NULL DEFAULT 'ongoing',
          UNIQUE(group_id, effective_month, scope)
        );
        INSERT INTO budget_amounts_scoped (id, group_id, effective_month, amount, scope)
          SELECT id, group_id, effective_month, amount, 'ongoing' FROM budget_amounts;
        DROP TABLE budget_amounts;
        ALTER TABLE budget_amounts_scoped RENAME TO budget_amounts;
      `);
    }
    if (!aScope("line_amounts")) {
      db.exec(`
        CREATE TABLE line_amounts_scoped (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          line_id INTEGER NOT NULL REFERENCES group_lines(id) ON DELETE CASCADE,
          effective_month TEXT NOT NULL,
          amount REAL NOT NULL,
          scope TEXT NOT NULL DEFAULT 'ongoing',
          UNIQUE(line_id, effective_month, scope)
        );
        INSERT INTO line_amounts_scoped (id, line_id, effective_month, amount, scope)
          SELECT id, line_id, effective_month, amount, 'ongoing' FROM line_amounts;
        DROP TABLE line_amounts;
        ALTER TABLE line_amounts_scoped RENAME TO line_amounts;
      `);
    }
  })();
}

// Matérialise les montants « de base » en première entrée datée, au mois de
// départ du groupe : chaque enveloppe dans budget_amounts, chaque ligne de
// récurrent dans line_amounts. Après passage, plus aucun calcul n'a besoin de
// groups.monthly_amount ni de group_lines.amount.
//
// Idempotent, mais pas seulement par l'unicité (group_id, effective_month) /
// (line_id, effective_month) : cette migration tourne à CHAQUE démarrage
// (getDb), pas une seule fois. Si elle ne vérifiait que « pas d'entrée pile à
// ce mois-là », une ligne ou un groupe déjà repris (dont la première entrée
// datée est à un mois différent de start_month — ex. une ligne ajoutée en
// cours d'année) se ferait réinjecter à chaque redémarrage une entrée
// rétroactive à start_month, avec la valeur COURANTE de monthly_amount /
// group_lines.amount — colonnes qui ne sont plus la source de vérité mais que
// certaines actions continuent d'écrire (editGroupLine, portée « once »
// incluse). La condition est donc « ce groupe/cette ligne n'a AUCUNE entrée
// datée du tout » (WHERE NOT EXISTS), pas « pas d'entrée à ce mois précis » :
// dès qu'une entrée existe, la reprise est faite pour de bon et la migration
// n'a plus jamais rien à y faire.
export function migrateSeedDatedAmounts(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS line_amounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id INTEGER NOT NULL REFERENCES group_lines(id) ON DELETE CASCADE,
      effective_month TEXT NOT NULL,
      amount REAL NOT NULL,
      UNIQUE(line_id, effective_month)
    );
  `);
  db.transaction(() => {
    db.exec(`
      INSERT OR IGNORE INTO budget_amounts (group_id, effective_month, amount)
        SELECT g.id, COALESCE(g.start_month, '2000-01'), COALESCE(g.monthly_amount, 0)
        FROM groups g
        WHERE NOT EXISTS (SELECT 1 FROM group_lines l WHERE l.group_id = g.id)
          AND NOT EXISTS (SELECT 1 FROM budget_amounts b WHERE b.group_id = g.id);
      INSERT OR IGNORE INTO line_amounts (line_id, effective_month, amount)
        SELECT l.id, COALESCE(g.start_month, '2000-01'), l.amount
        FROM group_lines l JOIN groups g ON g.id = l.group_id
        WHERE NOT EXISTS (SELECT 1 FROM line_amounts la WHERE la.line_id = l.id);
    `);
  })();
  // Un montant daté posé sur un groupe QUI A DES SOUS-POSTES est un vestige : il n'est
  // plus lu (son budget est la somme de ses sous-postes). On le signale sans y toucher ;
  // la base réelle n'en contient aucun.
  const vestiges = db
    .prepare(
      `SELECT COUNT(*) AS n FROM budget_amounts b
       WHERE EXISTS (SELECT 1 FROM group_lines l WHERE l.group_id = b.group_id)`,
    )
    .get() as { n: number };
  if (vestiges.n > 0) {
    console.warn(
      `[budgets] ${vestiges.n} montant(s) daté(s) posé(s) sur une dépense découpée sont ignorés : ` +
        `son budget est la somme de ses sous-postes. À reporter à la main sur les sous-postes concernés.`,
    );
  }
}

// Ajoute la colonne comment : la note libre que l'utilisateur pose sous le libellé
// d'une transaction. Une colonne à elle, et non la réutilisation de note : note
// reçoit le libellé de la saisie manuelle lors d'une fusion (mergeTransactions),
// un commentaire écrit à la main y serait écrasé sans prévenir.
//
// custom_label est l'ancien nom de cette même colonne, du temps où elle devait
// remplacer le libellé plutôt que le commenter. Renommée si on la trouve : la
// colonne est neuve et la sémantique la même (un texte libre de l'utilisateur),
// donc rien à convertir. Idempotent.
export function migrateTransactionComment(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  if (cols.some((c) => c.name === "comment")) return;
  if (cols.some((c) => c.name === "custom_label")) {
    db.exec(`ALTER TABLE transactions RENAME COLUMN custom_label TO comment`);
    return;
  }
  db.exec(`ALTER TABLE transactions ADD COLUMN comment TEXT`);
}

// --- L'identité d'une opération synchronisée ----------------------------------
//
// L'identifiant venait tel quel de la banque et servait de clé primaire pour toute la
// base. Or la banque rend le même identifiant pour la même opération à qui la lui
// demande : deux comptes de l'application branchés sur le même compte bancaire réel se
// disputaient les mêmes clés. L'insertion se faisant en OR IGNORE, le premier arrivé
// gardait tout et le second voyait son solde s'afficher sans une seule opération.
//
// Les opérations déjà en base prennent donc le préfixe de leur compte. Les laisser
// telles quelles ferait pire : la synchronisation suivante les réimporterait sous leur
// nouvelle forme, et tout l'historique se retrouverait en double.
//
// Les saisies manuelles gardent leur identifiant. Elles ne viennent d'aucune banque,
// aucune autre ne peut les revendiquer, et leur préfixe « manual: » les distingue déjà.
//
// Idempotent : une opération déjà préfixée par son compte est laissée en place.
export function migrateTransactionIdPerAccount(db: Database.Database): void {
  // substr plutôt que LIKE : les jokers % et _ prendraient un sens dans un identifiant
  // de compte qui en contiendrait.
  const dejaFait = `substr(t.id, 1, length(t.account_id) + 2) = t.account_id || '::'`;
  const aReprendre = db
    .prepare(`SELECT COUNT(*) AS n FROM transactions t WHERE t.manual = 0 AND NOT (${dejaFait})`)
    .get() as { n: number };
  if (aReprendre.n === 0) return;

  db.transaction(() => {
    // Les paires de rapprochement écartées d'abord : elles désignent les opérations par
    // leur identifiant, et la jointure ne les retrouverait plus une fois ceux-ci changés.
    db.prepare(
      `UPDATE reconcile_ignored SET synced_id = (
         SELECT t.account_id || '::' || t.id FROM transactions t
         WHERE t.id = reconcile_ignored.synced_id AND t.manual = 0 AND NOT (${dejaFait}))
       WHERE EXISTS (
         SELECT 1 FROM transactions t
         WHERE t.id = reconcile_ignored.synced_id AND t.manual = 0 AND NOT (${dejaFait}))`,
    ).run();
    db.prepare(
      `UPDATE transactions SET id = account_id || '::' || id
       WHERE manual = 0 AND NOT (substr(id, 1, length(account_id) + 2) = account_id || '::')`,
    ).run();
  })();
  console.warn(`[transactions] ${aReprendre.n} opération(s) rattachée(s) à leur compte.`);
}

// --- Le ménage des tables de la première version ------------------------------
//
// Sept tables ne sont plus lues ni écrites par une seule ligne de code. categories et
// rules et budgets viennent du temps où les dépenses se classaient par catégorie avec
// des règles de mots-clés ; group_keywords et recurring_payments du temps où un poste
// attrapait ses opérations par mot-clé ; overspend_decisions rangeait les décisions de
// dépassement avant qu'elles ne deviennent des notifications acquittables.
//
// Une table morte n'est pas inoffensive. overspend_decisions portait une clé étrangère
// vers accounts qui faisait échouer la suppression d'un compte, et categories en tenait
// une depuis transactions qui obligeait à traîner une colonne que rien ne remplit.
//
// Appelée EN DERNIER, après migrateBudgets et migrateGroupsV2 : celles-ci recréent
// budgets et group_keywords sur les bases les plus anciennes, et le ménage doit passer
// derrière elles, pas devant. Idempotent.
export function migrateDropDeadTables(db: Database.Database): void {
  // categories en dernier : rules et budgets la référencent, et transactions aussi
  // tant que sa colonne est là.
  // group_line_amounts est l'ancêtre de line_amounts, d'avant que la portée d'un
  // montant existe. Remplacée mais jamais supprimée.
  const mortes = [
    "budgets", "rules", "recurring_payments", "group_keywords", "overspend_decisions",
    "group_line_amounts", "categories",
  ];
  const presentes = new Set(
    (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as { name: string }[]).map((t) => t.name),
  );
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  const aCategorie = cols.some((c) => c.name === "category_id");
  const aFaire = mortes.filter((t) => presentes.has(t));
  if (aFaire.length === 0 && !aCategorie) return;

  db.transaction(() => {
    // La colonne avant sa table : sans quoi la clé étrangère pointerait dans le vide.
    if (aCategorie) db.exec(`ALTER TABLE transactions DROP COLUMN category_id`);
    for (const t of aFaire) db.exec(`DROP TABLE IF EXISTS ${t}`);
  })();
  console.warn(`[ménage] ${aFaire.length} table(s) de la première version supprimée(s).`);
}
