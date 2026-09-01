import { pourMoi } from "./current-user";
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
// Lit la base à chaque rendu, comme le reste de l'app (pas de cache).
//
// Les six lectures partent l'une après l'autre, et non ensemble. Elles ne dépendent
// pourtant pas les unes des autres — mais elles empruntent toutes la MÊME connexion,
// celle que le travail au nom de la personne a réservée pour lui seul. Une connexion
// ne traite qu'une requête à la fois : les lancer ensemble ne les accélère pas d'une
// milliseconde, ça les met simplement en file d'attente, et le pilote proteste.
export async function appNotifications(): Promise<Notification[]> {
  const currentMonth = currentMonthKey(new Date());
  const { comptes, groupes, budgets, budgetsLignes, operations, ecartees } = await pourMoi(
    async (database, userId) => ({
      comptes: await listAccounts(database, userId),
      groupes: await listGroups(database, userId),
      budgets: await listBudgetAmounts(database),
      budgetsLignes: await listLineAmounts(database),
      operations: await listTransactions(database, userId),
      ecartees: await listDismissedNotifications(database, userId),
    }),
  );
  const groups = groupes as Group[];
  const dated = toDatedBudgets(budgets);
  const datedLines = toDatedLineAmounts(budgetsLignes);
  const txns: Txn[] = operations.map((t) => ({
    id: t.id, date: t.date, amount: t.amount, label: t.label, accountId: t.accountId,
    groupId: t.groupId, lineId: t.lineId, excluded: t.excluded, budgetMonth: t.budgetMonth,
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
