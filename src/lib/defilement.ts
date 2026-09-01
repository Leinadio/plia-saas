// LE GLISSEMENT DU GRAND TABLEAU vers un montant choisi dans le panneau de détail.
//
// Trois calculs, séparés du navigateur pour être vérifiables : de combien bouger,
// à quelle vitesse, et où l'on en est à un instant donné. Le navigateur ne sert
// qu'à donner des rectangles et à poser la position — il ne décide de rien.
//
// Pourquoi ne pas laisser faire le navigateur (`scrollBy` en « smooth ») : le
// tableau défile dans un conteneur à colonne collante, et le glissement doux y
// est ignoré. Le montant n'était alors jamais amené sous les yeux en douceur, il
// y sautait. On le fait donc à la main, image par image.

/** Le bord visible d'un conteneur, ou l'étendue d'un montant, sur un seul axe. */
export type Etendue = { debut: number; fin: number };

/** La durée d'un glissement. Assez pour suivre des yeux, trop court pour attendre. */
export const DUREE_GLISSEMENT = 420;

// De combien faire glisser le conteneur pour amener le montant dans la vue. Zéro
// quand il y est déjà : on ne bouge pas un tableau qu'on est en train de lire.
//
// L'ordre des deux cas compte. Un montant plus large que la fenêtre tombe dans les
// deux ; on le cale alors sur son DÉBUT, parce que c'est là qu'est son libellé.
export function deplacement(fenetre: Etendue, cible: Etendue, marge: number): number {
  if (cible.debut < fenetre.debut) return cible.debut - fenetre.debut - marge;
  if (cible.fin > fenetre.fin) return cible.fin - fenetre.fin + marge;
  return 0;
}

// L'adoucissement : le tableau démarre au ralenti, prend sa vitesse au milieu, et
// se pose. Un glissement à vitesse constante donne l'impression d'un décor tiré
// derrière une vitre ; celui-ci se lit comme un mouvement.
export function adoucir(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Où le conteneur doit se trouver à `ecoule` millisecondes du départ. Une durée
// nulle pose directement la destination : c'est le cas de qui a demandé que rien
// ne bouge.
export function positionA(depart: number, delta: number, ecoule: number, duree: number): number {
  if (duree <= 0) return depart + delta;
  return depart + delta * adoucir(ecoule / duree);
}
