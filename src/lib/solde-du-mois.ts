import { monthType } from "./history-columns";

// LE SOLDE ANNONCÉ EN TÊTE D'UN MOIS.
//
// Le tableau porte déjà trois colonnes de solde, mais elles se lisent tout en bas,
// après des dizaines de lignes de postes. En haut, sous le nom du mois, un seul
// chiffre répond à la question qu'on se pose en arrivant : combien il y avait,
// combien il y a, combien il y aura.
//
// Ce n'est pas le même chiffre selon où l'on est dans le temps :
//   passé   → le solde à la fin de ce mois-là, tel qu'il a été ;
//   courant → le solde d'aujourd'hui, celui de la banque ;
//   futur   → le solde PRÉVU, pas le réel prolongé. Sur un mois qui n'a pas eu lieu,
//             ce qui compte est ce qui est engagé.
//
// La nature accompagne la valeur : sans elle, l'en-tête écrirait le même nombre de
// la même façon qu'on regarde un relevé ou une promesse.

export type NatureDuSolde = "passe" | "actuel" | "prevu";
export type SoldeDuMois = { valeur: number | null; nature: NatureDuSolde };

export function soldeDuMois(
  mois: string,
  moisCourant: string,
  i: number,
  closings: readonly number[],
  prevuClosings: readonly (number | null)[],
): SoldeDuMois {
  const type = monthType(mois, moisCourant);
  const nature: NatureDuSolde = type === "past" ? "passe" : type === "current" ? "actuel" : "prevu";
  const reel = closings[i] ?? null;
  // Le prévu peut manquer (aucune projection calculable) : le réel prolongé vaut
  // mieux qu'une case vide, il reste la meilleure réponse qu'on ait.
  const valeur = nature === "prevu" ? (prevuClosings[i] ?? reel) : reel;
  return { valeur, nature };
}
