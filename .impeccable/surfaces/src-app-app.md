---
version: 1
slug: "src-app-app"
primary_target: "src/app/app"
related_targets: []
---

---
version: 1
slug: "src-app-app"
primary_target: "src/app/app"
related_targets: []
---

## Portée
Toute l'app connectée sous `/app` : la barre produit, les transactions,
l'historique, les réglages et le compte. L'accueil redirige vers l'historique.
L'écran de connexion hérite des jetons de l'application. La landing publique
possède depuis le 10 septembre 2026 son propre périmètre visuel, décrit dans
`src-app-page-tsx.md` ; ses couleurs et sa police de titre ne modifient pas l'app.

## Mode du visiteur
Operate. Un indépendant à revenus irréguliers ouvre l'app quelques fois par mois,
sur ordinateur comme sur téléphone, pour savoir s'il peut dépenser. La tâche prime :
lisibilité des montants, états explicites, aucune surprise.

## Direction retenue
« L'enveloppe » — direction épinglée par l'utilisateur (refonte complète, plus de
tableau, des cartes, la famille des logiciels de travail sans en copier aucun).

Un budget est une collection d'ENVELOPPES : chaque poste est une ligne à jauge —
pleine, entamée, ou débordée. Le tableau de bord et les transactions sont des listes
de cartes.

L'HISTORIQUE, LUI, RESTE UN GRAND TABLEAU à colonnes de mois. Il a été remplacé par
une pile de mois, puis par un rail à deux colonnes, et l'utilisateur l'a rappelé :
ce sont les couleurs qui devaient changer, pas la structure. On y compare les mois
d'un regard, ce qu'aucune liste de cartes ne sait faire.

## L'onglet Historique — ce qui a été essayé, et ce qui reste
Trois compositions ont été rendues à fidélité réelle (composants et jetons du produit,
données fabriquées) et mises devant l'utilisateur : `.impeccable/mocks/histo-a-rail-*`,
`histo-b-tuiles-*`, `histo-c-postes-*`. Le rail a été choisi, construit — puis écarté
avec les deux autres : L'UTILISATEUR A DEMANDÉ LE RETOUR DU GRAND TABLEAU, aux couleurs
neuves.

Ce qui vit donc aujourd'hui : `src/components/history-grid.tsx`, la grille d'origine,
retraduite dans le monde des cartes. Une carte qui la porte et coupe son défilement,
une épine de noms figée à partir de 640 px, des familles de colonnes distinguées par la
DENSITÉ d'une même ardoise (5 / 11 / 18 / 24 %) mélangée à la CARTE et non au sol, des
bandes de section au voile du portant et de la tension, et un pied d'encre qui ferme le
relevé — la seule masse sombre d'un écran clair, qui s'inverse en bande pâle sous la
lumière éteinte.

Les trois comps restent dans `.impeccable/mocks/` : ce sont des routes déjà explorées,
pas des propositions ouvertes. Ne pas les rejouer sans raison neuve.

## Le moment mémorable : la jauge qui déborde
La pièce signature, et la seule chose de l'écran qu'on doit voir avant tout le reste.
Une barre de progression ordinaire s'arrête à cent pour cent : elle sait dire qu'un
poste a rompu, pas de combien. Ici la barre entière vaut la DÉPENSE — la piste
(l'enveloppe) n'en occupe que la part budgétée, et le trop-plein se pose à sa droite
en rouge, séparé par une encoche. Un poste dépensé au double de son budget montre
une demi-piste et un demi-débord. La géométrie vit dans `src/lib/jauge.ts`, testée ;
le composant ne fait que placer.

## Ce qui a été remplacé, et ce qu'on ne refait pas
Le grand tableau de l'Historique (2 745 lignes, une épine figée à gauche, huit
colonnes par mois, défilement horizontal) est parti. Il comparait bien les mois entre
eux, mais sur téléphone il ne restait que deux colonnes de chiffres et l'état d'une
enveloppe se déduisait en comparant trois nombres alignés.

C'était l'analyse au moment de la refonte. Elle s'est révélée fausse sur le point
décisif : le tableau tient parce qu'on y compare les mois, et aucune des trois
compositions essayées ne remplaçait cela sans perte. Le grand tableau est revenu.

Ce qui restait vrai, et qui a été corrigé sans toucher à sa structure : ses teintes
tiraient sur un béton chaud qui n'existe plus, son pied était du carbone, et ses
chiffres étaient en chasse fixe.

Tous les calculs sont intacts (`src/lib` n'a pas bougé), et toutes les modifications
qui se faisaient depuis le tableau vivent toujours dans la pile : créer un poste, le
gérer, le découper en sous-postes, corriger un budget daté, rattacher une
transaction, la sortir des calculs, la commenter. Le panneau de détail à droite
s'ouvre au clic sur n'importe quel montant, comme avant.

## Grammaire d'implémentation

### Vue d’ensemble sur téléphone — décision du 7 septembre 2026

La proposition mobile a été approuvée explicitement : sous 640 px, le relevé
présente un mois verticalement, avec soldes et estimation en tête, postes
dépliables, montants libellés et commandes tactiles visibles. « Comparer » place
la période commune en tête et présente ensemble « Ce qui rentre » et « Ce qui
sort ». Chaque titre indique le choix courant, par exemple « Ce qui sort · Dépensé ».
Le bouton avec une icône de filtre ouvre un panneau en bas de l’écran : une explication par indicateur,
le choix courant coché, fermeture après le choix et retour du focus au bouton.
Fermer sans choisir conserve l’indicateur. Les revenus proposent « Attendu » et
« Reçu » ; les dépenses « Budget », « Dépensé », « Reste » et « Remboursements » ;
les soldes « Réel », « Prévu » et « Si dépassement ». Le panneau reprend le fond
vert, rouge ou noir du bloc. Le repli et l’ajout restent des actions indépendantes.
Les icônes du relevé ont une taille de 18 px dans des boutons de 44 × 44 px.
Les « + » et crayons sont sans fond ni bordure, et sans libellé visible. Dans les
deux vues mobiles, les ajouts d’enveloppes, de revenus et de sous-enveloppes,
ainsi que leur gestion, réutilisent le panneau du bas du filtre. Les formulaires
gardent le mois consulté et le parent choisi, puis rendent le focus au bouton
d’origine à la fermeture. La présentation sur ordinateur reste identique.
Le solde réel du mois courant porte son estimation
cliquable juste dessous, sans deuxième liste de mois. Les estimations visées
depuis un calcul sont révélées sous le mois correspondant. Le bloc d’ouverture porte
le titre « Argent de départ ». Chaque poste aligne ses mois verticalement ; les
mois sans indicateur applicable sont nommés, sans montant inventé. Le total suit
le choix de sa section, même repliée, et les montants restent cliquables.
Les trois choix sont conservés au changement de période et lors des allers-retours
entre « Par mois » et « Comparer ». Les anciens liens avec `mobileMetric` restent
compatibles. Cette extension conserve la vue mensuelle, les jetons et les couleurs
de section existants.

Le grand tableau reste la présentation sur ordinateur. Les mêmes cellules et
actions servent les deux dispositions ; leurs index ne sont pas recalculés au
changement du mois consulté. Les références sont liées au compte et à la période.
Le détail remplit la largeur du téléphone ; sélectionner un terme referme le
panneau et révèle sa destination. L’ajout à la calculatrice dispose d’un bouton.

Vérification : serveur local avec données fictives, largeurs 320/390/1440 px,
navigation, huit indicateurs, détail, opérations, budget de démonstration et
formulaire d’ajout. Aucun débordement horizontal du relevé mobile constaté.

- Surfaces : une seule, la carte (`.carte`). Rien ne s'imbrique — ce qui vit DANS une
  carte prend la surface creusée (`.creux`), jamais une deuxième carte.
- Couleur : la sarcelle ne sert QU'À COMMANDER (bouton principal, lien, onglet actif,
  destination courante, mise au point). Elle ne qualifie jamais un montant. Les trois
  sens — portant, tension, attente — ne teintent que des montants et des pastilles.
- Un montant négatif par nature (le « dépensé » d'une enveloppe) reste à l'encre :
  le rouge posé sur chaque ligne ne veut plus rien dire. C'est le reste qui le porte.
- Mouvement : aucun geste d'ouverture. Les seuls signaux sont ceux de l'attente — le
  tirage des squelettes et le fil sous la barre produit.

## Inventaire des moyens
| Région | Moyen |
|---|---|
| Horizon (colonnes, ligne du zéro) | HTML/CSS positionné en pourcentage |
| Géométrie de l'horizon | `src/lib/plan-de-charge.ts`, testée |
| Jauge d'enveloppe | `src/lib/jauge.ts`, testée + `src/components/jauge.tsx` |
| Grand tableau de l'Historique | `src/components/history-grid.tsx` |
| Cartes, pastilles, légendes, jauge | CSS `@layer components` dans globals.css |
| Icônes | Lucide, existant |
| Imagerie | aucune — le produit est un relevé, pas une vitrine |

## Décisions ouvertes
- La refonte de la landing est décrite dans `src-app-page-tsx.md`. Ses captures
  de produit utilisent les données de démonstration et sont identifiées comme telles.
- Les captures de la refonte ont été prises sur une route d'aperçu temporaire
  (`src/app/apercu`, supprimée) avec des données fabriquées : les vrais écrans
  demandent une session bancaire. À revoir sur les vraies données.
