// LA JAUGE D'ENVELOPPE, et sa géométrie.
//
// Un poste de dépense est une enveloppe : un budget, et ce qui en est déjà sorti.
// Le dessin de cette enveloppe est la pièce signature de l'écran, et il repose sur
// une seule idée : QUAND ÇA DÉBORDE, ÇA DÉBORDE VRAIMENT.
//
// Une barre de progression ordinaire se remplit puis s'arrête à cent pour cent.
// Elle sait dire « ce poste a rompu », elle ne sait pas dire « de combien ». Ici,
// la barre entière vaut la DÉPENSE, pas le budget : la piste — l'enveloppe — n'en
// occupe plus que la part budgétée, et le trop-plein se pose à sa droite. Un poste
// dépensé au double de son budget montre donc une demi-piste et un demi-débord ;
// on lit l'ampleur du dépassement sans avoir à comparer deux nombres.
//
// Les trois largeurs sortent en pourcentages, prêtes pour le CSS. `piste` et
// `debord` se partagent toujours exactement cent — sinon la barre changerait de
// longueur d'une ligne à l'autre, et une colonne de jauges cesserait de se
// comparer d'un coup d'œil. `part` est le remplissage DANS la piste.
export type PartsJauge = { piste: number; part: number; debord: number };

// Une décimale : au-delà, on écrit du bruit dans un style en ligne pour un
// pixel qu'aucun écran ne rend.
const arrondi = (n: number) => Math.round(n * 10) / 10;

export function partsJauge(budget: number, depense: number): PartsJauge {
  // Une dépense nulle ou rendue (un remboursement peut passer le net sous zéro)
  // laisse l'enveloppe intacte : la jauge se lit comme vide, jamais à l'envers.
  if (depense <= 0) return { piste: 100, part: 0, debord: 0 };
  // Pas d'enveloppe du tout — une dépense non prévue, ou un budget effacé : tout
  // ce qui sort est du débord, il n'y a rien à remplir.
  if (budget <= 0) return { piste: 0, part: 0, debord: 100 };
  // Dans le budget : la piste occupe toute la barre et se remplit au prorata.
  if (depense <= budget) return { piste: 100, part: arrondi((depense / budget) * 100), debord: 0 };
  // Au-delà : la barre vaut la dépense. Le débord se déduit de la piste plutôt
  // que de se calculer à part, pour que les deux fassent cent au pixel près.
  const piste = arrondi((budget / depense) * 100);
  return { piste, part: 100, debord: arrondi(100 - piste) };
}
