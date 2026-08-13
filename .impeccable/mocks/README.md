# Compositions du grand tableau de l'Historique

Cinq propositions rendues le 13/08/2026, toutes dans le monde visuel déjà validé
(« La colonne en tension », cf. DESIGN.md). Aucune ne perd de fonctionnalité :
même dépliage des postes, même panneau de détail au clic sur un montant, mêmes
boutons de création, mêmes totaux. Ce qui change, c'est où les chiffres se posent.

Chaque image porte son texte de génération à l'intérieur du fichier et dans son
sidecar `.json`. Pour le relire :
`node ~/.claude/skills/impeccable/scripts/embed-prompt.mjs <image> --read`

| Fichier | Nom | Idée |
|---|---|---|
| `comp-histo-a.png` | **L'épine et les mois (RETENUE, construite)** | Un seul tableau au lieu d'un par mois : les noms de postes ne s'écrivent qu'une fois, à gauche, le nom du mois coiffe son bloc de colonnes, les sections sont des bandes pleine largeur et le pied tient en trois lignes de carbone plein. |
| `comp-histo-ac2.png` | Le bandeau et l'épine | Fusion de A et de C : les soldes montaient dans un bandeau carbone au-dessus de la grille. Construite, puis abandonnée — le bandeau éloignait le nom du mois de ses chiffres et disparaissait dès qu'on défilait. |
| `comp-histo-ac.png` | Le bandeau et l'épine, première version | Même bandeau, mais la grille ne gardait que budget / dépensé / balance : les trois colonnes de solde vivaient uniquement dans le bandeau. |
| `comp-histo-b.png` | Un mois ouvert, les autres en rail | Un seul mois déplié en entier ; les autres réduits, à droite, à leur nom et à leur solde d'atterrissage. |
| `comp-histo-c.png` | Les soldes en bandeau, la grille en dessous | Le bandeau apparaît ici pour la première fois, mais rien ne le cale sur la grille et les noms de postes restent répétés à chaque mois. |

## Ce qui a été retenu, et pourquoi

`comp-histo-a.png` est approuvée et construite. Le bandeau de carbone des deux
fusions a d'abord été construit, puis abandonné : à l'écran il éloignait le nom du
mois de ses chiffres, élargissait les colonnes pour rien, et n'existait plus dès
qu'on avait défilé d'un mois. La composition A garde le nom du mois là où il sert,
en tête de son bloc de colonnes.

Ce qu'elle pose, et qu'il ne faut pas défaire :

- Une PLAQUE aux quatre angles coupés à 45°, cerclée d'un filet d'un pixel qui suit
  la coupe. Deux calques, parce qu'une bordure CSS ignore `clip-path`.
- UN seul tableau pour tous les mois, la colonne des noms écrite une fois et figée
  à gauche, les mois séparés par un filet franc.
- L'épine de l'en-tête est NUE. Le nom du mois est centré au-dessus de son bloc,
  l'année en chasse fixe à côté, les intitulés de colonnes courts en dessous.
- AUCUNE teinte de colonne. Ce qui teinte, ce sont les BANDES de section, pleine
  largeur, nom dans l'épine — et le rouge n'y sert qu'aux dépenses non prévues.
- La durée d'un poste s'écrit SOUS son nom, pas à côté.
- Le pied : trois lignes en carbone plein, encre claire, montants négatifs en rouge
  vif.

## Ce que la construction ne doit pas perdre

Une maquette montre une pose, pas un comportement. Tout ce qui suit existe
aujourd'hui dans le tableau et doit se retrouver intact : déplier un poste vers
ses sous-postes puis ses transactions ; cliquer un montant pour ouvrir son calcul
dans le panneau de droite ; cliquer un intitulé de colonne pour lire son
explication ; le crayon et le plus qui apparaissent au survol d'un poste ; les
formulaires de création d'une rentrée, d'une dépense, d'un sous-poste ; replier un
bloc de dépenses sans faire disparaître son sous-total ; la case « Détailler les
mouvements de solde » ; le choix de la plage de mois et l'onglet de compte ; les
étiquettes de dépassement et de hors calcul ; le bloc des transactions sorties du
calcul, en bas, hors de toute somme ; le surlignage d'une case appelée depuis le
panneau, et le défilement qui va la chercher.

La vue simple et sa bascule ne sont pas touchées par ce travail.

## La série précédente, celle du tableau de bord

`comp-a-colonne.png`, `comp-b-plan.png` et `comp-c-fiche.png` n'appartiennent pas
à cette série : ce sont les trois propositions du tableau de bord, rendues plus
tôt le même jour. `comp-b-plan.png` est celle qui a été approuvée et construite.
