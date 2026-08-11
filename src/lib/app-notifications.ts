import { db } from "../db/index";
import { listAccounts } from "../db/repositories/accounts";
import { listGroups } from "../db/repositories/groups";
import { listTransactions } from "../db/repositories/transactions";
import { listBudgetAmounts } from "../db/repositories/budget-amounts";
import { listLineAmounts } from "../db/repositories/line-amounts";
import { listDismissedNotifications } from "../db/repositories/dismissed-notifications";
import { computeOverspends, toDatedBudgets, toDatedLineAmounts } from "./history";
import { overspendNotifications, type Notification } from "./notifications";
import { accountLabel } from "./account";
import { currentMonthKey } from "./current-month";
import type { Group, Txn } from "./forecast";

// Notifications affichées dans l'en-tête, tous comptes confondus. Vit à part de la page
// d'Historique : l'en-tête est monté par le layout et s'affiche sur toutes les pages,
// il ne peut donc pas dépendre du compte qu'une page particulière a sélectionné.
//
// Lit la base à chaque rendu, comme le reste de l'app (pas de cache). Les six lectures
// partent ensemble : elles ne dépendent pas les unes des autres, et les enchaîner
// ferait attendre six allers-retours au lieu d'un.
export async function appNotifications(userId: string): Promise<Notification[]> {
  const database = db();
  const currentMonth = currentMonthKey(new Date());
  const [comptes, groupes, budgets, budgetsLignes, operations, ecartees] = await Promise.all([
    listAccounts(database, userId),
    listGroups(database, userId),
    listBudgetAmounts(database),
    listLineAmounts(database),
    listTransactions(database, userId),
    listDismissedNotifications(database),
  ]);
  const groups = groupes as Group[];
  const dated = toDatedBudgets(budgets);
  const datedLines = toDatedLineAmounts(budgetsLignes);
  const txns: Txn[] = operations.map((t) => ({
    id: t.id, date: t.date, amount: t.amount, label: t.label, accountId: t.accountId,
    groupId: t.groupId, lineId: t.lineId, excluded: t.excluded,
  }));
  return overspendNotifications(
    comptes.map((a) => ({
      accountId: a.id,
      accountName: accountLabel(a),
      byMonth: computeOverspends(
        groups.filter((g) => g.accountId === a.id),
        txns.filter((t) => t.accountId === a.id),
        currentMonth,
        dated,
        datedLines,
      ).byMonth,
    })),
    ecartees,
    currentMonth,
  );
}
