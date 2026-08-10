import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { migrateAccountCustomName, migrateGroupsV2, migrateTransactionExcluded, migrateTransactionIgnored, migrateTransactionLineId, migrateTransactionManualFields, migrateTransactionComment, migrateReconcileIgnored, migrateGroupLifespan, migrateLineLifespan, migrateDropLineDay, migrateBudgetAmountsDropGroupFk, migrateBudgetAmountScope, migrateDismissedNotifications, migrateSeedDatedAmounts, migrateDropGroupKind, migrateDropIncomeKind, migrateGroupPlanned, migrateAccountOwner, migrateProvisionPerAccount, migrateBankConnections, migrateTransactionIdPerAccount, migrateDropDeadTables } from "./migrations";

const SCHEMA = readFileSync(join(process.cwd(), "src/db/schema.sql"), "utf8");

export function getDb(path = join(process.cwd(), "data/budget.db")): Database.Database {
  // better-sqlite3 does not create the parent directory; on a fresh checkout
  // the git-ignored data/ folder doesn't exist yet. ":memory:" has no directory.
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrateAccountCustomName(db);
  migrateGroupsV2(db);
  migrateTransactionExcluded(db);
  migrateTransactionIgnored(db);
  migrateTransactionLineId(db);
  migrateTransactionManualFields(db);
  migrateTransactionComment(db);
  migrateReconcileIgnored(db);
  migrateGroupLifespan(db);
  migrateLineLifespan(db);
  migrateDropLineDay(db);
  migrateBudgetAmountsDropGroupFk(db);
  migrateBudgetAmountScope(db);
  migrateDismissedNotifications(db);
  migrateSeedDatedAmounts(db);
  // En dernier : tout ce qui lit encore la nature d'un groupe, ou sa classe de revenu,
  // doit être passé avant. Une migration qui rajouterait l'une de ces colonnes après
  // coup la ferait revenir à chaque démarrage.
  migrateDropGroupKind(db);
  migrateDropIncomeKind(db);
  // Après les suppressions de colonnes de groups : elle en ajoute une, et doit passer
  // derrière celles qui en retirent pour ne pas se la faire emporter.
  migrateGroupPlanned(db);
  // Après les suppressions de colonnes : elle lit accounts telle qu'elle est à la fin.
  migrateAccountOwner(db);
  migrateProvisionPerAccount(db);
  // Après migrateAccountOwner : elle rattache les comptes à leur connexion par leur
  // propriétaire, qui doit donc déjà être posé.
  migrateBankConnections(db);
  // En dernier : elle réécrit les identifiants d'opérations, que les migrations
  // précédentes lisent encore telles qu'elles les ont écrites.
  migrateTransactionIdPerAccount(db);
  // Tout à la fin : migrateBudgets et migrateGroupsV2 recréent budgets et
  // group_keywords sur les bases les plus anciennes. Le ménage passe derrière elles.
  migrateDropDeadTables(db);
  return db;
}

let _db: Database.Database | null = null;
export function db(): Database.Database {
  if (!_db) {
    _db = getDb();
  }
  return _db;
}
