import type { Db } from "../pg";
import type { BudgetScope } from "../../lib/budget-in-force";

// Même modèle que budget_amounts : un montant daté porte sa portée. Voir
// src/db/repositories/budget-amounts.ts pour le détail du raisonnement.
export type LineAmount = { lineId: number; effectiveMonth: string; amount: number; scope: BudgetScope };

// Même tri que listBudgetAmounts : la règle avant l'exception (voir là-bas).
export function listLineAmounts(db: Db): Promise<LineAmount[]> {
  return db.all<LineAmount>(
    `SELECT line_id AS "lineId", effective_month AS "effectiveMonth", amount, scope
     FROM line_amounts ORDER BY line_id, effective_month, CASE scope WHEN 'ongoing' THEN 0 ELSE 1 END`,
  );
}

export async function setLineAmount(
  db: Db, lineId: number, effectiveMonth: string, amount: number, scope: BudgetScope = "ongoing",
): Promise<void> {
  await db.run(
    `INSERT INTO line_amounts (line_id, effective_month, amount, scope) VALUES ($1, $2, $3, $4)
     ON CONFLICT (line_id, effective_month, scope) DO UPDATE SET amount = EXCLUDED.amount`,
    [lineId, effectiveMonth, amount, scope],
  );
}

// Retire une entrée datée (ex. annulation d'une hausse « permanent »), portée comprise.
export async function deleteLineAmount(
  db: Db, lineId: number, effectiveMonth: string, scope: BudgetScope = "ongoing",
): Promise<void> {
  await db.run(
    `DELETE FROM line_amounts WHERE line_id = $1 AND effective_month = $2 AND scope = $3`,
    [lineId, effectiveMonth, scope],
  );
}

// Même chose pour une ligne : voir deleteBudgetAmountsAfter pour le raisonnement.
export async function deleteLineAmountsAfter(db: Db, lineId: number, effectiveMonth: string): Promise<void> {
  await db.run(`DELETE FROM line_amounts WHERE line_id = $1 AND effective_month > $2`, [lineId, effectiveMonth]);
}
