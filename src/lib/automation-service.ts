import type { Db } from "../db/pg";
import { listGroups, type GroupRow } from "../db/repositories/groups";
import {
  matchesRule,
  validateRule,
  RuleError,
  type AutomationRule,
  type RuleInput,
} from "./automation";
import type { AutomationNotification } from "./notifications";

const COLUMNS = `r.id, r.account_id AS "accountId", r.label, r.direction,
 r.min_amount AS "minAmount", r.max_amount AS "maxAmount", r.group_id AS "groupId",
 r.line_id AS "lineId", r.enabled, r.revision`;
export function listRules(db: Db, userId: string): Promise<AutomationRule[]> {
  return db.all(
    `SELECT ${COLUMNS} FROM automation_rules r JOIN accounts a ON a.id=r.account_id WHERE a.user_id=$1 ORDER BY r.id`,
    [userId],
  );
}
// Appelé dans la transaction pourUtilisateur existante, jamais de transaction imbriquée.
// Sérialise les créations/modifications et l'application des règles pour un compte.
async function lockAccount(db: Db, userId: string, accountId: string) {
  if (
    !(await db.one(
      "SELECT id FROM accounts WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [accountId, userId],
    ))
  )
    throw new RuleError("Ce compte n’est pas disponible.");
}
function destination(rule: RuleInput, groups: GroupRow[]) {
  const g = groups.find(
    (g) => g.id === rule.groupId && g.accountId === rule.accountId,
  );
  if (!g || (rule.direction === "out" && g.direction === "in")) return null;
  const line =
    rule.lineId === null ? null : g.lines.find((l) => l.id === rule.lineId);
  if ((g.lines.length > 0 && !line) || (rule.lineId !== null && !line))
    return null;
  return { group: g, line, name: line ? `${g.name} · ${line.name}` : g.name };
}
export async function saveRule(
  db: Db,
  userId: string,
  value: RuleInput,
  id?: number,
  revision?: number,
): Promise<AutomationRule> {
  const input = validateRule(value);
  await lockAccount(db, userId, input.accountId);
  if (!destination(input, await listGroups(db, userId)))
    throw new RuleError(
      "Choisissez un budget de ce compte et, si nécessaire, son sous-poste.",
    );
  const params = [
    input.accountId,
    input.label,
    input.direction,
    input.minAmount,
    input.maxAmount,
    input.groupId,
    input.lineId,
  ];
  const result =
    id === undefined
      ? await db.one<{ id: number }>(
          `INSERT INTO automation_rules(account_id,label,direction,min_amount,max_amount,group_id,line_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          params,
        )
      : await db.one<{ id: number }>(
          `UPDATE automation_rules r SET label=$2,direction=$3,min_amount=$4,max_amount=$5,group_id=$6,line_id=$7,revision=revision+1
        WHERE r.id=$8 AND r.account_id=$1 AND r.revision=$9 AND EXISTS(SELECT 1 FROM accounts a WHERE a.id=r.account_id AND a.user_id=$10) RETURNING id`,
          [...params, id, revision, userId],
        );
  if (!result)
    throw new RuleError(
      "Cette règle a été modifiée. Rechargez la page avant de réessayer.",
    );
  return (await listRules(db, userId)).find((r) => r.id === result.id)!;
}
async function ownedRule(db: Db, userId: string, id: number) {
  const rule = (await listRules(db, userId)).find((r) => r.id === id);
  if (!rule) throw new RuleError("Cette règle n’est plus disponible.");
  await lockAccount(db, userId, rule.accountId);
  // Relire après l'attente du verrou : une autre requête a pu la modifier.
  const fresh = (await listRules(db, userId)).find((r) => r.id === id);
  if (!fresh) throw new RuleError("Cette règle n’est plus disponible.");
  return fresh;
}
export async function setRuleEnabled(
  db: Db,
  userId: string,
  id: number,
  enabled: boolean,
) {
  await ownedRule(db, userId, id);
  if (typeof enabled !== "boolean")
    throw new RuleError("État de la règle invalide.");
  await db.run(
    "UPDATE automation_rules SET enabled=$2,revision=revision+1 WHERE id=$1",
    [id, enabled],
  );
}
export async function deleteRule(db: Db, userId: string, id: number) {
  await ownedRule(db, userId, id);
  await db.run("DELETE FROM automation_rules WHERE id=$1", [id]);
}
export type PreviewTransaction = {
  id: string;
  label: string;
  amount: number;
  date: string;
  budgetMonth: string | null;
  accountId: string;
};
export type RulePreview = {
  revision: number;
  transactions: PreviewTransaction[];
  hasMore: boolean;
};
const PREVIEW_LIMIT = 200;
async function candidates(
  db: Db,
  userId: string,
  accountId: string,
  ids?: string[],
) {
  return db.all<PreviewTransaction>(
    `SELECT t.id,t.label,t.amount,t.date,t.budget_month AS "budgetMonth",t.account_id AS "accountId"
    FROM transactions t JOIN accounts a ON a.id=t.account_id
    WHERE a.user_id=$1 AND a.id=$2 AND t.group_id IS NULL AND t.line_id IS NULL AND NOT t.excluded AND NOT t.ignored
    AND NOT EXISTS(SELECT 1 FROM automation_events e WHERE e.transaction_id=t.id)
    ${ids ? "AND t.id=ANY($3::text[])" : ""} ORDER BY t.date DESC,t.id FOR UPDATE OF t`,
    ids ? [userId, accountId, ids] : [userId, accountId],
  );
}
const alive = (
  v: { startMonth: string | null; endMonth: string | null },
  month: string,
) =>
  (!v.startMonth || v.startMonth <= month) &&
  (!v.endMonth || v.endMonth >= month);
function winningRule(
  t: PreviewTransaction,
  rules: AutomationRule[],
  groups: GroupRow[],
) {
  const month = t.budgetMonth ?? t.date.slice(0, 7);
  return rules.find((r) => {
    if (!r.enabled || !matchesRule(r, t)) return false;
    const dest = destination(r, groups);
    return (
      dest &&
      alive(dest.group, month) &&
      (!dest.line || alive(dest.line, month))
    );
  });
}
export async function previewRule(
  db: Db,
  userId: string,
  id: number,
): Promise<RulePreview> {
  const rule = await ownedRule(db, userId, id);
  if (!rule.enabled)
    throw new RuleError(
      "Réactivez cette règle pour afficher les correspondances.",
    );
  const rules = await listRules(db, userId),
    groups = await listGroups(db, userId);
  const matching = (await candidates(db, userId, rule.accountId)).filter(
    (t) => winningRule(t, rules, groups)?.id === id,
  );
  return {
    revision: rule.revision,
    transactions: matching.slice(0, PREVIEW_LIMIT),
    hasMore: matching.length > PREVIEW_LIMIT,
  };
}
async function attach(
  db: Db,
  t: PreviewTransaction,
  r: AutomationRule,
  name: string,
): Promise<number> {
  // Le rattachement et sa notification sont un seul ordre SQL : jamais l'un sans l'autre.
  const row = await db.one<{ id: number }>(
    `WITH attached AS (
    UPDATE transactions SET group_id=$2,line_id=$3
    WHERE id=$1 AND group_id IS NULL AND line_id IS NULL AND NOT excluded AND NOT ignored
      AND NOT EXISTS(SELECT 1 FROM automation_events e WHERE e.transaction_id=$1)
    RETURNING id,account_id,label,amount,date
  ) INSERT INTO automation_events(account_id,transaction_id,rule_id,label,target_name,rule_label,amount,transaction_date)
    SELECT account_id,id,$4,label,$5,$6,amount,date FROM attached RETURNING id`,
    [t.id, r.groupId, r.lineId, r.id, name, r.label],
  );
  return row ? 1 : 0;
}
export async function applyRulePreview(
  db: Db,
  userId: string,
  id: number,
  revision: number,
  ids: string[],
): Promise<number> {
  if (
    !Array.isArray(ids) ||
    ids.length > PREVIEW_LIMIT ||
    ids.some((id) => typeof id !== "string" || id.length > 1000)
  )
    throw new RuleError("Relancez l’aperçu avant d’appliquer la règle.");
  const rule = await ownedRule(db, userId, id);
  if (rule.revision !== revision)
    throw new RuleError("Cette règle a été modifiée. Relancez l’aperçu.");
  if (!rule.enabled) throw new RuleError("Cette règle est en pause.");
  return applyAccount(db, userId, rule.accountId, ids, id);
}
async function applyAccount(
  db: Db,
  userId: string,
  accountId: string,
  ids: string[],
  onlyRule?: number,
) {
  await lockAccount(db, userId, accountId);
  const rules = await listRules(db, userId);
  if (!rules.some((r) => r.enabled && r.accountId === accountId)) return 0;
  const groups = await listGroups(db, userId);
  let count = 0;
  for (const t of await candidates(db, userId, accountId, ids)) {
    const r = winningRule(t, rules, groups);
    if (r && (onlyRule === undefined || onlyRule === r.id))
      count += await attach(db, t, r, destination(r, groups)!.name);
  }
  return count;
}
export async function applyNewTransactions(
  db: Db,
  userId: string,
  ids: string[],
): Promise<number> {
  if (!ids.length) return 0;
  const accounts = await db.all<{ id: string }>(
    `SELECT DISTINCT a.id FROM accounts a JOIN transactions t ON t.account_id=a.id WHERE a.user_id=$1 AND t.id=ANY($2::text[]) ORDER BY a.id`,
    [userId, ids],
  );
  let count = 0;
  for (const account of accounts)
    count += await applyAccount(db, userId, account.id, ids);
  return count;
}
export function listAutomationNotifications(
  db: Db,
  userId: string,
): Promise<AutomationNotification[]> {
  return db.all(
    `SELECT a.id || '::auto::' || e.id AS id,'automation' AS kind,
    COALESCE(a.custom_name,a.name) AS "accountName",e.target_name AS name,
    to_char(e.created_at AT TIME ZONE 'Europe/Paris','YYYY-MM') AS month,e.amount,
    e.label,e.rule_label AS "ruleLabel",e.transaction_date AS date,
    e.transaction_id AS "transactionId", (d.id IS NOT NULL) AS seen
    FROM automation_events e JOIN accounts a ON a.id=e.account_id
    LEFT JOIN dismissed_notifications d ON d.user_id=$1 AND d.id=a.id || '::auto::' || e.id
    WHERE a.user_id=$1 ORDER BY e.created_at DESC,e.id DESC`,
    [userId],
  );
}
