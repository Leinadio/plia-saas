// Le bloc de tête d'un mois dans la vue simple : d'où il part, et où il finit
// selon les trois façons de compter. Aucun calcul — les valeurs viennent des
// colonnes déjà produites par la page ; ce module ne fait que choisir la bonne
// case et taire celles qui n'existent pas pour ce type de mois.
import type { PlannedSoldes, SoldeColumn } from "./history";
import { monthType } from "./history-columns";

export type SoldesDuMois = {
  depart: number;
  reel: number;
  prevu: number | null;
  siDepassement: number | null;
};

export function soldesDuMois(
  solde: SoldeColumn,
  planned: PlannedSoldes,
  months: string[],
  currentMonth: string,
  i: number,
): SoldesDuMois {
  // Sur un mois de projection, « si dépassement » rejoint « prévu » : un
  // dépassement ne se reconduit pas tout seul (cf. monthColumns, qui retire
  // cette colonne du tableau pour la même raison).
  const futur = monthType(months[i], currentMonth) === "future";
  return {
    depart: solde.openings[i],
    reel: solde.closings[i],
    prevu: planned.prevuClosings[i] ?? null,
    siDepassement: futur ? null : (planned.depassClosings[i] ?? null),
  };
}
