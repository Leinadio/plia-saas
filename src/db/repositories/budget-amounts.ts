import type { Db } from "../pg";
import type { BudgetScope } from "../../lib/budget-in-force";

// Un montant daté d'un groupe, avec sa portée : « ongoing » vaut à partir de son mois
// et pour les suivants, « once » ne vaut que pour son mois (voir amountInForce).
export type BudgetAmount = {
  groupId: number;
  // Compte de la provision des non catégorisés (groupe 0). Chaîne vide pour un budget
  // de groupe, qui tient son compte de son groupe.
  accountId: string;
  effectiveMonth: string;
  amount: number;
  scope: BudgetScope;
};

// Tri : par mois, puis la règle (« ongoing ») avant l'exception (« once ») — c'est
// l'ordre de lecture de la frise, et celui qu'attend amountInForce pour balayer les
// montants permanents. Un ORDER BY scope simple mettrait « once » d'abord (alphabétique).
export function listBudgetAmounts(db: Db): Promise<BudgetAmount[]> {
  return db.all<BudgetAmount>(
    `SELECT group_id AS "groupId", account_id AS "accountId", effective_month AS "effectiveMonth", amount, scope
     FROM budget_amounts
     ORDER BY group_id, account_id, effective_month, CASE scope WHEN 'ongoing' THEN 0 ELSE 1 END`,
  );
}

// L'unicité porte sur (groupe, compte, mois, portée) : réécrire la même portée au même
// mois remplace le montant, mais poser une exception ne touche pas au montant permanent
// qui commence ce mois-là, et réciproquement.
// `accountId` ne sert qu'au groupe 0, la provision des non catégorisés : elle n'a pas
// de groupe pour lui donner un compte. Un budget de groupe le laisse vide.
export async function setBudgetAmount(
  db: Db, groupId: number, effectiveMonth: string, amount: number,
  scope: BudgetScope = "ongoing", accountId = "",
): Promise<void> {
  await db.run(
    `INSERT INTO budget_amounts (group_id, account_id, effective_month, amount, scope) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (group_id, account_id, effective_month, scope) DO UPDATE SET amount = EXCLUDED.amount`,
    [groupId, accountId, effectiveMonth, amount, scope],
  );
}

// Retire une entrée datée (ex. annulation d'une hausse « permanent » d'un dépassement).
// Vise une portée précise : retirer l'exception de juillet ne doit pas emporter le
// montant permanent qui commence le même mois.
export async function deleteBudgetAmount(
  db: Db, groupId: number, effectiveMonth: string, scope: BudgetScope = "ongoing", accountId = "",
): Promise<void> {
  await db.run(
    `DELETE FROM budget_amounts WHERE group_id = $1 AND account_id = $2 AND effective_month = $3 AND scope = $4`,
    [groupId, accountId, effectiveMonth, scope],
  );
}

// Supprime tous les montants POSTÉRIEURS à `effectiveMonth`, les deux portées comprises.
// Sert à la propagation « tous les mois suivants au même montant » : sans ça, un
// changement déjà posé plus tard reprendrait la main et la réponse ne voudrait pas dire
// ce qu'elle dit. Destructeur par construction — c'est le sens de la question posée.
export async function deleteBudgetAmountsAfter(
  db: Db, groupId: number, effectiveMonth: string, accountId = "",
): Promise<void> {
  await db.run(
    `DELETE FROM budget_amounts WHERE group_id = $1 AND account_id = $2 AND effective_month > $3`,
    [groupId, accountId, effectiveMonth],
  );
}
