"use server";
import type { Db } from "../../../db/pg";
import { pourMoi } from "../../../lib/current-user";
import { ownsGroup, ownsLine, ownsTransaction, ownsAccount } from "../../../db/repositories/ownership";
import {
  setTransactionGroup,
  setTransactionIgnored,
  setTransactionComment,
  setTransactionBudgetMonth,
  getTransactionMonthInfo,
  insertManualTransaction,
  updateManualTransaction,
  deleteManualTransaction,
  mergeTransactions,
  ignoreMatch as ignoreMatchRepo,
} from "../../../db/repositories/transactions";
import { isValidManualForm, toManualInput, type ManualFormInput } from "@/lib/manual-txn";
import { normalizeComment } from "@/lib/txn-comment";
import { moisBudget, rattachementUtile } from "@/lib/txn-mois";
import { canAttachToGroup } from "@/lib/ownership";
import { isGroupAlive } from "@/lib/forecast";
import { countGroupLines, getLineGroupId, getGroupLifespan } from "../../../db/repositories/groups";
import { revalidatePath } from "next/cache";

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
  return pourMoi(async (base, moi) => {
    // Deux choses à vérifier, pas une : la transaction qu'on déplace, et la destination.
    // Rattacher SA transaction à la dépense d'un autre la ferait compter chez lui.
    const userId = moi;
    if (!(await ownsTransaction(base, userId, txnId))) return;
    const gid = groupId !== null && Number.isFinite(groupId) ? groupId : null;
    const lid = lineId !== null && Number.isFinite(lineId) ? lineId : null;
    const database = base;
    if (gid !== null) {
      if (!(await ownsGroup(database, userId, gid))) return;
      if (lid !== null && !(await ownsLine(database, userId, lid))) return;
      const lignes = await countGroupLines(database, gid);
      if (lignes === null || !canAttachToGroup(lignes > 0, lid)) return;
      // Une ligne d'un AUTRE groupe écrirait un couple (groupe, ligne) incohérent, que
      // plus aucun calcul ne relit correctement.
      if (lid !== null && (await getLineGroupId(database, lid)) !== gid) return;
      // Un groupe ne vit que certains mois : une enveloppe créée pour juillet ne peut
      // pas recevoir une dépense d'août. Rattachée quand même, elle ne compterait
      // nulle part — computeHistory ne reconnaît un propriétaire que s'il est vivant
      // ce mois-là — et la transaction disparaîtrait dans les non catégorisés sans
      // qu'on comprenne pourquoi.
      //
      // Le mois retenu est celui où la transaction COMPTE, rattachement compris : une
      // dépense du 31 août rangée en septembre doit trouver un poste vivant en
      // septembre, pas en août.
      const op = await getTransactionMonthInfo(database, txnId);
      const bornes = await getGroupLifespan(database, gid);
      if (op === null || bornes === null || !isGroupAlive(bornes, moisBudget(op))) return;
    }
    await setTransactionGroup(database, txnId, gid, false, lid);
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
    if (!(await ownsTransaction(base, moi, txnId))) return;
    const op = await getTransactionMonthInfo(base, txnId);
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
    await insertManualTransaction(base, { ...toManualInput(form), groupId: await groupeTenable(base, form) });
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
