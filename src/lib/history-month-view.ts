// --- Ce que le grand tableau montre, et à quel mois --------------------------
// L'Historique n'affiche plus qu'UN tableau pour tous les mois. Une ligne le
// traverse donc entièrement, y compris les mois où elle ne vit pas : elle y reste,
// mais ses cases s'y vident (ligneVivante). Il a existé une découpe qui retirait
// carrément ces lignes, du temps d'un tableau par mois ; elle est partie avec.
//
// Avec une réserve, et c'est l'autre règle de ce fichier : une ligne qui ne vit
// AUCUN des mois affichés ne traverse rien du tout — elle sort du tableau
// (sansLignesAbsentes). Les cases vides ne disent quelque chose que s'il y a, plus
// loin dans la même ligne, un mois où elles se remplissent.
import type { HistorySection, HistoryTxn, MonthCell, IgnoredBlock } from "./history";

// Une ligne dont on ne sait rien (aliveMonths trop court) reste affichée : mieux
// vaut une ligne de trop qu'un budget qui disparaît sans qu'on sache pourquoi.
export const ligneVivante = (alive: boolean[] | undefined, i: number) => alive?.[i] !== false;

// --- La ligne absente de la fenêtre -----------------------------------------
// Vider les cases d'un mois où la ligne ne vit pas (ligneVivante) suffit tant que
// la ligne vit AILLEURS dans la fenêtre : on lit alors une enveloppe qui commence
// en septembre, et ses deux premières colonnes vides disent exactement ça.
//
// Quand elle ne vit AUCUN des mois affichés, il ne reste plus rien à dire. Une
// enveloppe « Sucreries » qui démarre en juillet occupait, dans un tableau réglé
// sur juin seul, une ligne entière de cases vides qu'il fallait lire jusqu'au bout
// pour comprendre qu'elle ne disait rien. Elle sort du tableau, et elle revient dès
// que la fenêtre touche juillet.
//
// La seule exception, et elle est absolue : une ligne éteinte qui porte tout de
// même de l'argent reste. Le rattachement d'une transaction à un poste ne regarde
// pas la période de vie de ce poste (cf. resolveOwnership) — une dépense peut donc
// tomber hors des bornes de son enveloppe. Ce montant compte dans les totaux ; le
// cacher ferait un tableau dont la somme ne se retrouve nulle part.
const casePleine = (c: MonthCell) => c.budgeted !== 0 || c.depense !== 0 || c.recu !== 0;

const presente = (alive: boolean[], cells: MonthCell[], txns: HistoryTxn[]) =>
  // Aucune information sur la vie de la ligne : on affiche. Même prudence que
  // ligneVivante — un poste évaporé coûte plus cher qu'une ligne de trop.
  alive.length === 0 || alive.some(Boolean) || cells.some(casePleine) || txns.length > 0;

export function sansLignesAbsentes(sections: HistorySection[]): HistorySection[] {
  return sections.map((sec) => ({
    ...sec,
    rows: sec.rows
      .filter((r) => presente(r.aliveMonths, r.cells, r.txns))
      // Même règle un cran plus bas : un sous-poste qui ne commence qu'après la
      // fenêtre n'a pas plus à s'y montrer que la dépense qui le porte.
      .map((r) => ({
        ...r,
        subRows: r.subRows.filter((s) => presente(s.aliveMonths, s.cells, s.txns)),
      })),
  }));
}

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
