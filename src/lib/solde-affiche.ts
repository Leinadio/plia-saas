// LE SOLDE D'UN MOIS, quand on n'en montre qu'un par ligne.
//
// Deux chaînes de soldes coexistent dans ce produit. La chaîne RÉELLE remonte le
// fil des opérations depuis le solde de la banque : elle est sûre, et elle est
// PLATE sur les mois à venir — rien n'y est encore réalisé, donc rien ne la fait
// bouger. La chaîne PRÉVUE applique le plan mois après mois : c'est elle qui dit
// où l'on atterrit.
//
// Afficher la première sur toute la frise revient à écrire le solde d'aujourd'hui
// six fois de suite. C'est exactement ce que ce module empêche.
export function soldeAffiche(
  reels: number[],
  prevus: (number | null)[],
  i: number,
  futur: boolean,
): number {
  const reel = reels[i] ?? 0;
  if (!futur) return reel;
  const prevu = prevus[i];
  // Un mois de projection sans prévu (le cas d'un compte sans aucun budget) :
  // le réel reste la moins mauvaise réponse, et il est vrai.
  return prevu ?? reel;
}
