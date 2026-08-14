---
version: 1
slug: "src-app-app"
primary_target: "src/app/app"
related_targets: []
---

## Portée
Toute l'app connectée sous `/app` : la poutre de navigation, le tableau de bord,
les transactions, l'historique (un seul grand tableau), les réglages et le
compte. Hors portée : la landing publique et l'écran de connexion, qui héritent
seulement des nouveaux jetons.

## Mode du visiteur
Operate. Un indépendant à revenus irréguliers ouvre l'app quelques fois par mois,
sur ordinateur comme sur téléphone, pour savoir s'il peut dépenser. La tâche
prime : lisibilité des colonnes de chiffres, états explicites, aucune surprise.

## Direction retenue
« La colonne en tension » — challenger de tenségrité choisi par l'utilisateur
contre la direction tirée au sort (assignée 4/7, clé de tirage 4ed98fa0).
Un budget est une structure : des mâts de carbone qui portent (solde acquis,
revenus), des câbles rouges qui tirent (dépenses engagées, reports, dépassements).
Quatre états, ceux de la source : acquis/engagé (ça porte), attendu (ça dort),
dépassé (ça a rompu).

## Composition approuvée — le tableau de bord
`.impeccable/mocks/comp-b-plan.png` (option B, « le plan de charge »), approuvée
par l'utilisateur le 13/08/2026, sidecar `approved: true`.
Skeleton : poutre carbone pleine largeur (nom + trois destinations + synchro,
notifications, compte) ; plan de charge pleine largeur (un mât par mois sur la
ligne du zéro, câble tendu entre les sommets, mât rompu sous zéro) ; bande de
quatre relevés séparés par un filet ; deux tables denses entrées / sorties.

## Composition approuvée — le grand tableau de l'Historique
`.impeccable/mocks/comp-histo-a.png`, « L'épine et les mois », approuvée et
construite le 14/08/2026, sidecar `approved: true`.

Skeleton : une PLAQUE aux quatre angles coupés à 45°, cerclée d'un filet d'un pixel
qui suit la coupe ; dedans, UN seul tableau pour tous les mois affichés. La colonne
des noms de postes est écrite une fois et reste figée à gauche pendant que les mois
défilent ; chaque mois est un bloc de colonnes séparé du suivant par un filet franc,
coiffé du nom du mois centré, l'année en chasse fixe à côté, et des intitulés de
colonnes COURTS en dessous (« Réel », « Prévu », « Si dép. »). L'épine de l'en-tête
reste nue. Aucune teinte de colonne : ce qui teinte, ce sont les bandes de section,
pleine largeur, leur nom posé dans l'épine — et le rouge n'y sert qu'aux dépenses non
prévues. La durée d'un poste s'écrit sous son nom. Le pied tient en trois lignes de
carbone plein à encre claire : total du mois, solde de fin de mois, total dépassement.

Les cinq propositions et leur histoire vivent dans `.impeccable/mocks/README.md`.

## Grammaire d'implémentation
- Formes : aucun rayon. Plaque = quatre angles coupés à 45° (`.plate`), commande =
  deux angles coupés (`.plate-cut` / `.cut`). Filets d'un pixel qui suivent la coupe.
  Le bandeau du tableau, lui, ne se coupe pas : c'est une poutre, comme celle de la
  navigation, et une poutre traverse l'écran de part en part.
- Couleur : béton, carbone, cendre, et un seul accent, le rouge de tension. Le rouge
  ne dit qu'une chose : une force qui tire. Pas de vert, pas d'ambre.
- Type : Archivo (variable, wdth 86 pour les capitales gravées) pour l'interface ;
  Azeret Mono pour tout chiffre, mesure ou état.
- Étiquettes : pastille noire capitales (`.chip`), variante évidée (dormant) et
  rouge (rompu).
- Mouvement : un seul moment, la mise en tension du plan de charge à l'ouverture
  (mâts, nœuds, câble). Nulle part ailleurs.

## Inventaire des moyens
| Région | Moyen |
|---|---|
| Plan de charge (mâts, nœuds, ligne du zéro) | HTML/CSS positionné en pourcentage |
| Câble | SVG inline, path calculé, `vector-effect` |
| Géométrie (ligne du zéro, hauteurs) | `src/lib/plan-de-charge.ts`, testée |
| Bandeau du grand tableau | en-tête du `<table>`, jetons `--beam*` |
| Soldes du bandeau | `src/lib/history-bandeau.ts`, testée |
| Colonne des noms collante | `position: sticky`, une seule zone de défilement |
| Plaques, coupes, étiquettes | CSS `@layer components` dans globals.css |
| Icônes | Lucide, existant |
| Imagerie | aucune — le produit est un relevé, pas une vitrine |

## Ce qui a déjà dérivé une fois
Un bandeau de carbone posant les trois soldes au-dessus de la grille a été construit
puis retiré. À l'écran il éloignait le nom du mois de ses chiffres, élargissait les
colonnes du mois pour rien, et n'existait plus dès qu'on avait défilé d'un mois. Ne
pas y revenir sans une raison neuve.

Trois pièges déjà payés : `position: sticky` est ignoré sur un enfant de cellule de
tableau (d'où le mois courant calé à gauche plutôt que centré, cf. `center-scroll.tsx`) ;
deux zones de défilement horizontal imbriquées empêchent toute colonne figée de
fonctionner (celle du composant Table est neutralisée) ; et un jeton de couleur posé
sur les cellules du pied écrasait le rouge des montants négatifs — il se pose sur la
ligne, pour que les cellules gardent le dernier mot.

## Décisions ouvertes
## Décisions ouvertes
- La landing et l'écran de connexion restent à refondre.
- La vue simple a été supprimée, avec sa bascule : le grand tableau est la seule
  lecture de l'historique.
- Sur le mois en cours, la ligne « Solde fin de mois » affiche dans sa colonne réelle
  l'argent d'aujourd'hui, pas celui de la fin du mois. C'est la colonne qui le dit,
  et la ligne « Estimé fin de mois » juste en dessous donne la fin du mois. À
  trancher si la lecture gêne.
