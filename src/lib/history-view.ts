// Quelle vue de l'Historique, et sur quel mois. Deux réglages indépendants :
// le tableau garde sa plage (from/to), la vue simple son mois (mois). Séparés
// exprès — basculer d'une vue à l'autre ne doit pas détruire le réglage de
// celle qu'on quitte.
import { addMonthsKey, clampMonth, isMonthKey } from "./history";

export type VueHistorique = "simple" | "tableau";

// Le choix voyage dans un cookie et non dans localStorage : c'est le serveur
// qui rend la page, il doit connaître la vue avant le premier octet. Avec
// localStorage, la page s'afficherait dans la mauvaise vue puis basculerait
// sous les yeux de l'utilisateur.
export const COOKIE_VUE = "vue-historique";

// Défaut : la vue simple. Toute valeur inconnue (cookie trafiqué, reste d'une
// version précédente) vaut « pas de choix » plutôt que de casser la page.
export function lireVue(valeur: string | undefined): VueHistorique {
  return valeur === "tableau" ? "tableau" : "simple";
}

// Le mois à afficher : celui de l'adresse s'il est lisible, le mois courant
// sinon — et dans tous les cas ramené dans les bornes de la frise du compte,
// pour qu'aucune adresse bricolée n'ouvre sur un mois sans montants.
export function moisAffiche(
  param: unknown,
  stripMin: string,
  stripMax: string,
  currentMonth: string,
): string {
  const demande = isMonthKey(param) ? param : currentMonth;
  return clampMonth(demande, stripMin, stripMax);
}

// null quand on est déjà sur la borne : c'est ce qui éteint la flèche.
export function moisPrecedent(mois: string, stripMin: string): string | null {
  const p = addMonthsKey(mois, -1);
  return p < stripMin ? null : p;
}

export function moisSuivant(mois: string, stripMax: string): string | null {
  const n = addMonthsKey(mois, 1);
  return n > stripMax ? null : n;
}
