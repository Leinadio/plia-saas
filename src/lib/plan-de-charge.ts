// LE PLAN DE CHARGE. Un mât par mois, planté sur la ligne du zéro ; sa hauteur
// est le solde qu'on projette à la fin de ce mois-là. Un mois qui passe sous zéro
// descend sous la ligne : son mât est brisé.
//
// Tout est exprimé en pourcentage de la zone de dessin, jamais en pixels : le
// composant qui l'affiche s'étire de 375 px à 2 000 px sans que cette géométrie
// ait à le savoir.

export type Mat = {
  // Position horizontale du mât, au centre de sa colonne (0 → 100).
  x: number;
  // Hauteur du mât, en pourcentage de la place disponible de son côté de la
  // ligne du zéro. Toujours positive : le sens se lit dans `brise`.
  hauteur: number;
  // Le solde projeté est-il négatif ? C'est la seule rupture du système.
  brise: boolean;
  solde: number;
};

export type Plan = {
  // Hauteur de la ligne du zéro, en pourcentage depuis le haut. À 100, tout
  // l'écran est au-dessus d'elle ; à 60, un tiers de la zone sert au négatif.
  zero: number;
  // Flèche du câble : de combien il pend au milieu d'une travée. Un câble tendu
  // entre deux points éloignés pend plus bas qu'entre deux points rapprochés,
  // donc elle suit la portée. Sans ça le câble est une polyligne droite, c'est-
  // à-dire une courbe de tendance — exactement ce que ce produit refuse.
  fleche: number;
  mats: Mat[];
};

// Un câble d'acier tendu pend d'environ 5 % de sa portée ; ici on force le trait
// (42 %) parce que la portée est comptée en pourcentage de largeur alors que la
// flèche se lit en pourcentage de hauteur, et que la zone de dessin est bien
// plus large que haute.
const PENTE = 0.42;

export function planDeCharge(soldes: number[]): Plan {
  const n = soldes.length;
  if (n === 0) return { zero: 100, fleche: 0, mats: [] };

  const hautMax = Math.max(0, ...soldes);
  const basMax = Math.max(0, ...soldes.map((s) => -s));
  // La ligne du zéro se pose au prorata : elle ne descend que si un mois passe
  // dessous. Mais le prorata seul est un mauvais conseiller — une rupture de
  // 320 € sous un solde de 1 830 € n'aurait qu'une vingtaine de pixels, alors
  // que c'est l'information la plus importante de l'écran. Dès qu'un mois passe
  // sous zéro, le sol se tient donc entre ces deux bornes : la rupture garde au
  // moins un cinquième de la hauteur, et ce qui porte au moins la moitié.
  const total = hautMax + basMax;
  const zero =
    total === 0
      ? 100
      : basMax === 0
        ? 100
        : Math.min(78, Math.max(55, (hautMax / total) * 100));

  const mats = soldes.map((solde, i) => {
    const brise = solde < 0;
    const reference = brise ? basMax : hautMax;
    return {
      // Le mât se plante au centre de sa colonne, pas à son bord : sinon le
      // premier collerait au cadre et le dernier tomberait dehors.
      x: ((i + 0.5) / n) * 100,
      hauteur: reference === 0 ? 0 : (Math.abs(solde) / reference) * 100,
      brise,
      solde,
    };
  });

  // La portée d'une travée : les mâts sont plantés au centre de colonnes égales,
  // donc deux voisins sont séparés d'une colonne entière.
  const portee = 100 / n;
  return { zero, fleche: portee * PENTE, mats };
}
