// --- Ce que le grand tableau montre, et à quel mois --------------------------
// L'Historique n'affiche plus qu'UN tableau pour tous les mois. Une ligne le
// traverse donc entièrement, y compris les mois où elle ne vit pas : elle y reste,
// mais ses cases se vident (ligneVivante). Il a existé une découpe qui retirait
// carrément ces lignes, du temps d'un tableau par mois ; elle est partie avec.
import type { HistorySection, IgnoredBlock } from "./history";

// Une ligne dont on ne sait rien (aliveMonths trop court) reste affichée : mieux
// vaut une ligne de trop qu'un budget qui disparaît sans qu'on sache pourquoi.
export const ligneVivante = (alive: boolean[] | undefined, i: number) => alive?.[i] !== false;

// --- Les emplacements du tableau, garnis ou non -----------------------------
// computeHistory ne produit une section que si elle a quelque chose à montrer :
// pas de groupe de dépense, pas de section « enveloppe ». Or c'est l'en-tête de
// section qui porte le bouton qui crée un groupe. Un compte neuf n'avait donc
// aucun bouton, et il fallait déjà un groupe pour obtenir de quoi en créer un —
// le compte restait un tableau de transactions non catégorisées, sans issue.
//
// D'où cette liste d'EMPLACEMENTS : les deux sections structurelles ont toujours
// le leur, garni de la vraie section quand elle existe, vide sinon. Un emplacement
// vide n'affiche que son bouton d'ajout : ni total ni Balance, il n'y a rien à
// totaliser. Les non catégorisés n'en ont pas — on ne les crée pas, ils arrivent.
export type SectionSlot =
  | { kind: "section"; section: HistorySection }
  | { kind: "empty"; sectionKind: "income" | "expense" };

// L'ordre du tableau, celui que computeHistory produit : rémunérations, reçus non
// catégorisés, dépenses, dépenses non catégorisées.
const RANGS = ["income", "uncategorized-in", "expense", "uncategorized-out"] as const;

const rangDe = (sec: HistorySection): string =>
  sec.kind === "uncategorized" ? `uncategorized-${sec.uncatDirection ?? "out"}` : sec.kind;

export function sectionSlots(sections: HistorySection[]): SectionSlot[] {
  const slots: SectionSlot[] = [];
  for (const rang of RANGS) {
    const sec = sections.find((s) => rangDe(s) === rang);
    if (sec) slots.push({ kind: "section", section: sec });
    else if (rang !== "uncategorized-in" && rang !== "uncategorized-out") {
      slots.push({ kind: "empty", sectionKind: rang });
    }
  }
  // Une section d'un rang inconnu ne disparaît pas en silence : elle passe en queue.
  for (const sec of sections) {
    if (!RANGS.some((r) => r === rangDe(sec))) slots.push({ kind: "section", section: sec });
  }
  return slots;
}

// Les blocs « Non comptabilisées » ramenés à un mois : leurs transactions couvrent
// toute la frise, et c'est le comptage par mois qui en a besoin. Les totaux, eux,
// restent alignés sur tous les mois — ce sont eux que lisent les cases.
export function ignoredBlocksAtMonth(blocks: IgnoredBlock[], month: string): IgnoredBlock[] {
  return blocks.map((b) => ({ ...b, txns: b.txns.filter((t) => t.month === month) }));
}

// Combien d'opérations ce mois-là restent hors des calculs, les deux sens confondus.
// L'en-tête du mois l'annonce : sans ce chiffre, un total qui paraît faux n'a aucun
// indice à donner, et il faut ouvrir le bas du tableau pour comprendre.
export function countIgnoredAtMonth(blocks: IgnoredBlock[] | undefined, month: string): number {
  return ignoredBlocksAtMonth(blocks ?? [], month).reduce((n, b) => n + b.txns.length, 0);
}
