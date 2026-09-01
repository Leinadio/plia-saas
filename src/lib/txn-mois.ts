import { addMonthsKey, isMonthKey } from "./history";

// LE MOIS OÙ UNE TRANSACTION COMPTE.
//
// La banque dit quand l'argent est passé ; ça, personne n'y touche. Mais un achat
// du 31 août peut très bien appartenir au budget de septembre — les courses du
// week-end qui tombent la veille du mois, un prélèvement en avance, une facture
// qu'on rattache à la période qu'elle couvre. La transaction garde donc sa date et
// reçoit, en plus, un MOIS DE RATTACHEMENT.
//
// Un seul jeton pour deux lectures : la ligne montre toujours la date de la banque,
// les calculs du budget passent tous par ici. Rien d'autre ne doit refaire ce
// découpage à la main, sans quoi la moitié des colonnes compterait la transaction
// dans un mois et l'autre moitié dans l'autre.

export type AvecMois = { date: string; budgetMonth?: string | null };

// Le mois de rattachement s'il existe, sinon celui de la date. Un rattachement
// abîmé en base est ignoré plutôt que suivi : une dépense qui disparaîtrait d'un
// mois sans réapparaître ailleurs serait pire qu'une dépense mal rangée.
export function moisBudget(t: AvecMois): string {
  return t.budgetMonth && isMonthKey(t.budgetMonth) ? t.budgetMonth : t.date.slice(0, 7);
}

// Ce qu'on écrit en base quand on choisit un mois. Rien quand ce mois est déjà
// celui de la date : une transaction non déplacée ne doit rien traîner qui la
// ferait paraître déplacée — et qui la retiendrait dans l'ancien mois le jour où
// sa date changerait.
export function rattachementUtile(date: string, mois: string | null): string | null {
  if (!mois || !isMonthKey(mois)) return null;
  return mois === date.slice(0, 7) ? null : mois;
}

// Les mois qu'on propose au choix : ceux qui entourent la date, et rien de plus.
// Rattacher, c'est décaler d'un cran ou deux — les courses du 31 qu'on met sur le
// mois suivant, le prélèvement tombé en avance. Une liste courte se lit d'un coup
// d'œil ; une année entière obligerait à chercher.
//
// Le rattachement en cours s'ajoute s'il tombe hors de cette fenêtre : sans lui, le
// menu n'afficherait pas le mois où l'opération compte vraiment, et le premier clic
// l'effacerait sans qu'on l'ait voulu.
export function moisProposables(date: string, rattachement: string | null, portee = 2): string[] {
  const centre = date.slice(0, 7);
  const mois = new Set<string>();
  for (let n = -portee; n <= portee; n += 1) mois.add(addMonthsKey(centre, n));
  if (rattachement && isMonthKey(rattachement)) mois.add(rattachement);
  return [...mois].sort();
}
