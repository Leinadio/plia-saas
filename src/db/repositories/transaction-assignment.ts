import type { Db } from "../pg";
import type { GroupRow } from "./groups";

type AssignmentTransaction = {
  accountId: string;
  date: string;
  budgetMonth: string | null;
  amount: number;
};

type AssignmentGroup = Pick<GroupRow, "direction" | "startMonth" | "endMonth"> & {
  hasLines: boolean;
  matchesLine: boolean;
};

// Lire les faits et vérifier le propriétaire ensemble évite une requête distincte
// pour chaque contrôle avant la moindre écriture.
export async function getTransactionForAssignment(db: Db, userId: string, id: string) {
  return db.one<AssignmentTransaction>(
    `SELECT t.account_id AS "accountId", t.date, t.budget_month AS "budgetMonth", t.amount
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     WHERE t.id = $1 AND a.user_id = $2`,
    [id, userId],
  );
}

// La destination doit appartenir au même compte. Le sens, les bornes et les
// sous-postes arrivent en une lecture, pour appliquer les règles métier existantes.
export async function getGroupForAssignment(
  db: Db,
  userId: string,
  accountId: string,
  groupId: number,
  lineId: number | null,
) {
  return db.one<AssignmentGroup>(
    `SELECT g.direction, g.start_month AS "startMonth", g.end_month AS "endMonth",
            EXISTS (SELECT 1 FROM group_lines l WHERE l.group_id = g.id) AS "hasLines",
            EXISTS (SELECT 1 FROM group_lines l WHERE l.group_id = g.id AND l.id = $4) AS "matchesLine"
     FROM groups g
     JOIN accounts a ON a.id = g.account_id
     WHERE a.user_id = $1 AND g.account_id = $2 AND g.id = $3`,
    [userId, accountId, groupId, lineId],
  );
}
