---
version: 1
slug: "src-app-app"
primary_target: "src/app/app"
related_targets: []
---

## Portée
Toute l'app connectée sous `/app` : la poutre de navigation, le tableau de bord,
les transactions, l'historique (vue simple et grand tableau), les réglages et le
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

## Composition approuvée
`.impeccable/mocks/comp-b-plan.png` (option B, « le plan de charge »), approuvée
par l'utilisateur le 13/08/2026, sidecar `approved: true`.
Skeleton : poutre carbone pleine largeur (nom + trois destinations + synchro,
notifications, compte) ; plan de charge pleine largeur (un mât par mois sur la
ligne du zéro, câble tendu entre les sommets, mât rompu sous zéro) ; bande de
quatre relevés séparés par un filet ; deux tables denses entrées / sorties.

## Grammaire d'implémentation
- Formes : aucun rayon. Plaque = quatre angles coupés à 45° (`.plate`), commande =
  deux angles coupés (`.plate-cut` / `.cut`). Filets d'un pixel qui suivent la coupe.
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
| Plaques, coupes, étiquettes | CSS `@layer components` dans globals.css |
| Icônes | Lucide, existant |
| Imagerie | aucune — le produit est un relevé, pas une vitrine |

## Décisions ouvertes
- La landing et l'écran de connexion restent à refondre.
- Le grand tableau garde sa structure ; seules ses familles de teintes ont changé
  (densité de carbone, rouge réservé aux dépenses).
