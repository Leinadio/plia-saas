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
| `comp-histo-ac2.png` | **Le bandeau et l'épine (retenue)** | Bandeau carbone des soldes en haut, une seule épine de postes en dessous, six colonnes par mois coupées en deux registres, et trois lignes de total dont « Solde fin de mois » en noir plein. |
| `comp-histo-ac.png` | Le bandeau et l'épine, première version | Même structure, mais la grille ne gardait que budget / dépensé / balance : les trois colonnes de solde vivaient uniquement dans le bandeau. |
| `comp-histo-a.png` | L'épine et les mois | Un seul tableau au lieu d'un par mois, sans bandeau. Les noms de postes ne s'écrivent qu'une fois, les mois défilent à leur droite. |
| `comp-histo-b.png` | Un mois ouvert, les autres en rail | Un seul mois déplié en entier ; les autres réduits, à droite, à leur nom et à leur solde d'atterrissage. |
| `comp-histo-c.png` | Les soldes en bandeau, la grille en dessous | Le bandeau apparaît ici pour la première fois, mais rien ne le cale sur la grille et les noms de postes restent répétés à chaque mois. |

## Ce qui a été retenu, et pourquoi

`comp-histo-ac2.png` est approuvée. Elle vient de la fusion de A et de C, puis
d'une correction demandée : les colonnes réel / prévu / si dépassement reviennent
dans la grille, parce qu'elles se lisent verticalement comme une opération, et la
ligne « Solde fin de mois » s'ajoute en bas.

Sa règle de construction, celle à ne pas perdre : les filets verticaux du bandeau
noir sont exactement ceux de la grille. Un solde et les postes qui l'ont fabriqué
tombent dans la même colonne.

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
