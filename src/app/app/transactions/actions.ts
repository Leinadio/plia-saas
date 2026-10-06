"use server";
import { applyNewTransactions } from "@/lib/automation-service";
import type { Db } from "../../../db/pg";
import { pourMoi } from "../../../lib/current-user";
import { ownsGroup, ownsTransaction, ownsAccount } from "../../../db/repositories/ownership";
import { getTransactionForAssignment, getGroupForAssignment } from "../../../db/repositories/transaction-assignment";
import {
  setTransactionGroup,
  setTransactionIgnored,
  setTransactionComment,
  setTransactionBudgetMonth,
  getTransactionFacts,
  insertManualTransaction,
  updateManualTransaction,
  deleteManualTransaction,
  mergeTransactions,
  ignoreMatch as ignoreMatchRepo,
} from "../../../db/repositories/transactions";
import { isValidManualForm, toManualInput, type ManualFormInput } from "@/lib/manual-txn";
import { normalizeComment } from "@/lib/txn-comment";
import { moisBudget, rattachementUtile } from "@/lib/txn-mois";
import { canAttachToGroup, peutRecevoir, sensDuMontant } from "@/lib/ownership";
import { isGroupAlive } from "@/lib/forecast";
import { getGroupLifespan } from "../../../db/repositories/groups";
import { revalidatePath } from "next/cache";
import { getPendingTransaction, setPendingChoices } from "../../../db/repositories/pending-transactions";
import { currentMonthKey } from "../../../lib/current-month";
import { isMonthKey } from "../../../lib/history";

function revalidateAll() {
  revalidatePath("/app/transactions");
  revalidatePath("/app/historique");
  revalidatePath("/app");
}

// Rattache une transaction (groupId null = non catégorisée). Une dépense découpée en
// sous-postes n'est pas une destination : ses transactions appartiennent à un de ses
// sous-postes, jamais au groupe lui-même (canAttachToGroup). Le sélecteur ne le
// propose plus, mais masquer une option
// n'empêche pas d'appeler cette action directement — la règle est donc tenue ici, comme
// le verrou des mois passés l'est dans les actions de budget.
//
// Un rattachement refusé ne défait rien : la transaction garde ce qu'elle avait, plutôt
// que de se retrouver nulle part par accident.
export async function setGroup(
  txnId: string,
  groupId: number | null,
  lineId: number | null = null,
) {
  return pourMoi(async (database, userId) => {
    // L'attente conserve le verrou du compte partagé avec la synchronisation.
    const pending = await getPendingTransaction(database, userId, txnId);
    const op = pending
      ? { ...pending, date: pending.date ?? "", budgetMonth: pending.budgetMonth ?? currentMonthKey(new Date()) }
      : await getTransactionForAssignment(database, userId, txnId);
    if (!op) return;
    const gid = groupId !== null && Number.isFinite(groupId) ? groupId : null;
    const lid = gid !== null && lineId !== null && Number.isFinite(lineId) ? lineId : null;
    if (gid !== null) {
      const group = await getGroupForAssignment(database, userId, op.accountId, gid, lid);
      if (!group || !canAttachToGroup(group.hasLines, lid)) return;
      if (lid !== null && !group.matchesLine) return;
      // Le mois choisi prime sur la date bancaire. Une dépense ne va que dans une
      // dépense ; un remboursement peut aussi alléger une enveloppe de dépenses.
      if (!isGroupAlive(group, moisBudget(op))) return;
      if (!peutRecevoir(sensDuMontant(op.amount), group.direction)) return;
    }
    if (pending) await setPendingChoices(database, userId, txnId, { groupId: gid, lineId: lid });
    else await setTransactionGroup(database, txnId, gid, false, lid);
    revalidateAll();
  });
}

// Pose un commentaire sous le libellé d'une transaction. Champ vidé = commentaire
// retiré : normalizeComment en fait un null, pour que la base dise « aucun
// commentaire » plutôt qu'un commentaire vide.
export async function setComment(txnId: string, comment: string) {
  return pourMoi(async (base, moi) => {
    if (!(await ownsTransaction(base, moi, txnId))) return;
    await setTransactionComment(base, txnId, normalizeComment(comment));
    revalidateAll();
  });
}

// Range une opération dans un autre mois de budget — ou la rend à sa date, avec null.
//
// La date de la banque n'est jamais réécrite : c'est ce que la banque a enregistré,
// et la prochaine synchronisation la redonnerait de toute façon. Seul le mois où
// l'opération COMPTE change, et il change partout à la fois : enveloppes, totaux,
// chaîne de soldes, dépassements (cf. src/lib/txn-mois.ts).
//
// Le rattachement de groupe n'est pas touché. Si le poste ne vit pas le mois choisi,
// l'opération se lira dans « Pas encore rangé » de ce mois-là — exactement comme une
// dépense dont on a raccourci l'enveloppe après coup. Le menu de rattachement de sa
// ligne proposera alors les postes qui vivent ce mois-ci.
export async function setBudgetMonth(txnId: string, month: string | null) {
  return pourMoi(async (base, moi) => {
    const pending = await getPendingTransaction(base, moi, txnId);
    if (pending) {
      if (month !== null && !isMonthKey(month)) return;
      await setPendingChoices(base, moi, txnId, { budgetMonth: month });
      revalidateAll();
      return;
    }
    if (!(await ownsTransaction(base, moi, txnId))) return;
    const op = await getTransactionFacts(base, txnId);
    if (op === null) return;
    await setTransactionBudgetMonth(base, txnId, rattachementUtile(op.date, month));
    revalidateAll();
  });
}

// Retire (ou remet) une transaction de tous les calculs.
export async function setIgnored(txnId: string, ignored: boolean) {
  return pourMoi(async (base, moi) => {
    if (!(await ownsTransaction(base, moi, txnId))) return;
    await setTransactionIgnored(base, txnId, ignored);
    revalidateAll();
  });
}

// Le groupe demandé à la saisie, s'il vit bien le mois de la date saisie ; null
// sinon. Même règle que setGroup, à l'autre bout : la transaction est enregistrée,
// mais non catégorisée — on ne perd pas la saisie pour un groupe mal choisi.
async function groupeTenable(db: Db, form: ManualFormInput): Promise<number | null> {
  if (form.groupId === null) return null;
  const bornes = await getGroupLifespan(db, form.groupId);
  return bornes && isGroupAlive(bornes, form.date.slice(0, 7)) ? form.groupId : null;
}

export async function addTransaction(form: ManualFormInput) {
  return pourMoi(async (base, moi) => {
    if (!isValidManualForm(form)) return;
    const userId = moi;
    if (!(await ownsAccount(base, userId, form.accountId))) return;
    if (form.groupId !== null && !(await ownsGroup(base, userId, form.groupId))) return;
    const id = await insertManualTransaction(base, { ...toManualInput(form), groupId: await groupeTenable(base, form) });
    if (form.groupId === null) await applyNewTransactions(base, moi, [id]);
    revalidatePath("/app", "layout");
    revalidateAll();
  });
}

export async function editTransaction(id: string, form: ManualFormInput) {
  return pourMoi(async (base, moi) => {
    if (!(await ownsTransaction(base, moi, id))) return;
    if (!isValidManualForm(form)) return;
    const { accountId: _accountId, ...rest } = toManualInput(form);
    await updateManualTransaction(base, id, { ...rest, groupId: await groupeTenable(base, form) });
    revalidateAll();
  });
}

export async function removeTransaction(id: string) {
  return pourMoi(async (base, moi) => {
    if (!(await ownsTransaction(base, moi, id))) return;
    await deleteManualTransaction(base, id);
    revalidateAll();
  });
}

export async function mergeTransaction(syncedId: string, manualId: string) {
  return pourMoi(async (base, moi) => {
    const userId = moi;
    if (!(await ownsTransaction(base, userId, syncedId)) || !(await ownsTransaction(base, userId, manualId))) return;
    await mergeTransactions(base, { syncedId, manualId });
    revalidateAll();
  });
}

export async function ignoreMatch(manualId: string, syncedId: string) {
  return pourMoi(async (base, moi) => {
    const userId = moi;
    if (!(await ownsTransaction(base, userId, manualId)) || !(await ownsTransaction(base, userId, syncedId))) return;
    await ignoreMatchRepo(base, userId, manualId, syncedId);
    revalidateAll();
  });
}
