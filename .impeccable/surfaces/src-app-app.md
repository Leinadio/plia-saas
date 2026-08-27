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
Toute l'app connectée sous `/app` : la barre produit, le tableau de bord,
les transactions, l'historique, les réglages et le compte. La landing publique et
l'écran de connexion héritent des mêmes jetons et ont été repris avec eux.

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
- La landing reste sommaire : elle dit ce que le produit fait, sans preuve
  fabriquée. Elle mérite une vraie conception le jour où il y aura de quoi montrer.
- Les captures de la refonte ont été prises sur une route d'aperçu temporaire
  (`src/app/apercu`, supprimée) avec des données fabriquées : les vrais écrans
  demandent une session bancaire. À revoir sur les vraies données.
