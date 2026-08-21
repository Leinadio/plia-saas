// LA CALCULATRICE DE BROUILLON.
//
// Un coin de table pour se demander « et si ». On attrape un montant dans le
// tableau, on le tire dans la fenêtre, on en attrape un autre, et on regarde ce
// que ça ferait. C'est un brouillon : rien de ce qui s'y écrit ne touche au
// budget, aux enveloppes ou aux soldes. L'app ne le lit nulle part.
//
// Une BANDE DE CAISSE, pas une expression algébrique : les lignes s'enchaînent de
// haut en bas, chacune avec son signe, sans priorité des opérations. Quelqu'un qui
// empile « loyer, plus courses, fois douze » lit son ruban de haut en bas et
// attend
// le résultat de cette lecture-là — pas celui d'une formule où la multiplication
// passerait devant.

export type OperateurCalcul = "+" | "-" | "×";
const OPERATEURS: OperateurCalcul[] = ["+", "-", "×"];

// Une ligne du brouillon. `libelle` vient du tableau au moment où on attrape le
// montant, et se réécrit ensuite : c'est un brouillon, on y note ce qu'on veut.
export type LigneCalcul = {
  id: string;
  libelle: string;
  montant: number;
  operateur: OperateurCalcul;
};

// Le centime, et pas plus loin. Sans cet arrondi, 0,1 + 0,2 affiche
// 0,30000000000000004 : de l'argent ne s'écrit pas comme ça.
const auCentime = (n: number) => Math.round(n * 100) / 100;

// Le total, lu de haut en bas. La PREMIÈRE ligne n'a rien au-dessus d'elle : elle
// pose le départ. En « moins », elle démarre le ruban dans le négatif ; en
// « fois », elle n'a rien à multiplier et vaut son montant tel quel.
export function totalCalcul(lignes: LigneCalcul[]): number {
  if (lignes.length === 0) return 0;
  const [premiere, ...suite] = lignes;
  const depart = premiere.operateur === "-" ? -premiere.montant : premiere.montant;
  return auCentime(
    suite.reduce((total, l) => {
      if (l.operateur === "+") return total + l.montant;
      if (l.operateur === "-") return total - l.montant;
      return total * l.montant;
    }, depart),
  );
}

// --- Le montant qu'on attrape dans le tableau --------------------------------
// Un type MIME à nous, et pas "text/plain" : le navigateur laisse tomber n'importe
// quel texte sélectionné dans une zone de dépôt, et la calculatrice se remplirait
// de lignes fantômes au premier glissement de souris malheureux.
export const FORMAT_MONTANT = "application/x-plia-montant";

export type MontantAttrape = { libelle: string; montant: number };

export function encoderMontant(m: MontantAttrape): string {
  return JSON.stringify({ libelle: m.libelle, montant: m.montant });
}

// Rend null sur tout ce qui n'est pas un montant attrapé chez nous. On lâche
// beaucoup de choses sur une fenêtre ouverte — du texte, un fichier, une image :
// aucune ne doit ajouter de ligne, et aucune ne doit casser l'écran.
export function decoderMontant(brut: string | null | undefined): MontantAttrape | null {
  if (!brut) return null;
  try {
    const v = JSON.parse(brut) as unknown;
    if (typeof v !== "object" || v === null) return null;
    const { libelle, montant } = v as { libelle?: unknown; montant?: unknown };
    if (typeof libelle !== "string" || typeof montant !== "number" || !Number.isFinite(montant)) return null;
    return { libelle, montant };
  } catch {
    return null;
  }
}

// --- Le brouillon gardé d'une visite à l'autre -------------------------------
// Il vit dans le navigateur, sur cette machine, et nulle part ailleurs : c'est un
// brouillon personnel, il n'a rien à faire en base ni à suivre le compte d'un
// écran à l'autre.
export const CLE_BROUILLON = "plia:calculatrice";

export function ecrireBrouillon(lignes: LigneCalcul[]): string {
  return JSON.stringify(lignes);
}

// Un stockage abîmé — une version d'avant, une écriture interrompue, une main
// dans la console — ne doit jamais empêcher l'app de s'afficher. On garde ce qui
// se tient et on jette le reste, sans rien dire : c'est un brouillon.
export function lireBrouillon(brut: string | null | undefined): LigneCalcul[] {
  if (!brut) return [];
  try {
    const v = JSON.parse(brut) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(estLigne);
  } catch {
    return [];
  }
}

function estLigne(v: unknown): v is LigneCalcul {
  if (typeof v !== "object" || v === null) return false;
  const l = v as Partial<LigneCalcul>;
  return (
    typeof l.id === "string" &&
    typeof l.libelle === "string" &&
    typeof l.montant === "number" &&
    Number.isFinite(l.montant) &&
    typeof l.operateur === "string" &&
    (OPERATEURS as string[]).includes(l.operateur)
  );
}

// --- La fenêtre flottante ----------------------------------------------------
export type Position = { x: number; y: number };
export type Taille = { largeur: number; hauteur: number };
export type Ecran = { largeur: number; hauteur: number };

// Où la fenêtre a le droit de se poser. Elle se déplace librement, MAIS elle ne
// sort jamais entièrement de l'écran : lâchée dehors, on ne pourrait plus la
// reprendre pour la ramener, et il faudrait recharger la page pour la revoir.
//
// Sur un écran plus petit qu'elle, on la colle en haut à gauche plutôt que de la
// pousser dans les négatifs : sa barre de titre, la seule prise qu'on ait sur
// elle, doit rester atteignable.
export function positionDansEcran(p: Position, taille: Taille, ecran: Ecran): Position {
  return {
    x: Math.max(0, Math.min(p.x, ecran.largeur - taille.largeur)),
    y: Math.max(0, Math.min(p.y, ecran.hauteur - taille.hauteur)),
  };
}
