import {
  computeHistory, computeSolde, computePlannedSoldes, computeTableEstimate,
  grandTotals, monthlyOverspend,
  type DatedBudgets, type DatedLineAmounts,
} from "./history";
import type { Group, Txn } from "./forecast";
import { monthPhrase, monthShort } from "./transactions-view";
import { monthType } from "./history-columns";
import { soldeAffiche } from "./solde-affiche";

// LE RÉCAPITULATIF D'UN COMPTE.
//
// Le tableau de bord additionnait tout : un plan de charge, une bande de relevés
// et deux tables pour l'ensemble des comptes. Le total ne veut rien dire dès qu'il
// y a plus d'un compte — le solde d'un livret ne paie pas les courses du compte
// courant, et un dépassement ainsi mélangé ne désigne plus le compte qui l'a
// creusé. Chaque compte a donc désormais son récapitulatif, et ce module le
// fabrique.
//
// Le tri se fait ICI, pas chez l'appelant : c'est la règle qui porte tout le
// reste, et une page qui filtrerait elle-même pourrait l'oublier sans que rien
// ne le dise. On reçoit tous les postes et toutes les opérations, on ne rend que
// ceux du compte demandé.

// Les quatre états de la structure, dans le vocabulaire de toute l'app : acquis
// et engagé portent, attendu dort, dépassé a rompu.
export type EtatPoste = "acquis" | "attendu" | "engagé" | "dépassé";
export type LigneRecap = { id: number; nom: string; montants: number[]; etat: EtatPoste };
export type MoisRecap = { key: string; label: string; solde: number };
export type ReleveRecap = { label: string; valeur: number };

export type RecapCompte = {
  mois: MoisRecap[];
  releves: ReleveRecap[];
  entrees: LigneRecap[];
  sorties: LigneRecap[];
};

export function recapCompte(
  accountId: string,
  balance: number,
  allGroups: Group[],
  allTxns: Txn[],
  months: string[],
  currentMonth: string,
  datedBudgets: DatedBudgets,
  datedLines: DatedLineAmounts,
): RecapCompte {
  const groups = allGroups.filter((g) => g.accountId === accountId);
  const txns = allTxns.filter((t) => t.accountId === accountId);

  const sections = computeHistory(groups, txns, months, currentMonth, datedBudgets, datedLines);
  // L'estimé de fin du mois courant ancre les mois suivants : sans lui, la
  // projection repart du solde d'aujourd'hui et ignore ce qui est déjà engagé.
  const estime = computeTableEstimate(sections, months, currentMonth, balance)?.value ?? null;
  const solde = computeSolde(sections, months, currentMonth, balance, estime);
  const planned = computePlannedSoldes(sections, months, currentMonth, solde.openings, estime, datedBudgets);
  const totaux = grandTotals(sections, months.length);

  // ATTENTION. La chaîne réelle est PLATE sur les mois à venir : rien n'y est
  // encore réalisé. Prise telle quelle, elle dessinerait des mâts de la même
  // hauteur et le plan de charge ne dirait plus rien. C'est le prévu qui porte
  // l'atterrissage (cf. soldeAffiche).
  const mois = months.map((m, i) => ({
    key: m,
    label: monthShort(m, currentMonth),
    solde: soldeAffiche(solde.closings, planned.prevuClosings, i, monthType(m, currentMonth) === "future"),
  }));

  const income = sections.find((s) => s.kind === "income");
  const expense = sections.find((s) => s.kind === "expense");

  const entrees: LigneRecap[] = (income?.rows ?? [])
    .filter((r) => r.aliveMonths[0])
    .map((r) => ({
      id: r.id,
      nom: r.name,
      montants: [r.cells[0].budgeted, r.cells[0].recu],
      etat: r.cells[0].recu > 0 ? "acquis" : "attendu",
    }));

  const sorties: LigneRecap[] = (expense?.rows ?? [])
    .filter((r) => r.aliveMonths[0])
    .map((r) => ({
      id: r.id,
      nom: r.name,
      montants: [r.cells[0].budgeted, -r.cells[0].depense, r.cells[0].balance],
      etat:
        r.cells[0].balance < 0
          ? "dépassé"
          : r.cells[0].depense > 0
            ? "engagé"
            : "attendu",
    }));

  // Les cinq mesures du mois, dans le vocabulaire du produit. « Solde » est ce
  // que la banque dit aujourd'hui pour CE compte ; « projection » est là où le
  // mois y atterrit : deux chiffres différents, et c'est l'écart entre eux qui
  // fait décider.
  //
  // LA PROJECTION EST CELLE QUI PORTE LES DÉPASSEMENTS. Le plan seul répond à
  // « où j'atterris si je dépense pile ce que j'avais prévu » — or ce qui a
  // débordé est déjà parti du compte, et le mois ne reviendra pas en arrière.
  // Annoncer le plan nu ferait espérer un atterrissage que les débordements du
  // mois ont déjà rendu impossible. On prend donc la chaîne « si dépassement »,
  // la même que la colonne du tableau : le plan MOINS ce qui a débordé. Sans
  // aucun débordement les deux chiffres coïncident, et la case ne change pas.
  const depassement = monthlyOverspend(sections, months.length)[0];
  const releves: ReleveRecap[] = [
    { label: "Solde", valeur: balance },
    { label: `Entrées ${monthPhrase(currentMonth)}`, valeur: totaux[0].recu },
    { label: `Sorties ${monthPhrase(currentMonth)}`, valeur: -totaux[0].depense },
    { label: "Dépassement", valeur: -depassement },
    {
      label: "Projection",
      valeur: planned.depassClosings[0] ?? planned.prevuClosings[0] ?? solde.closings[0],
    },
  ];

  return { mois, releves, entrees, sorties };
}
