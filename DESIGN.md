---
name: Plia
description: Un relevé en cartes claires — une sarcelle qui ne sert qu'à commander, une jauge qui déborde vraiment, et un pied d'encre qui ferme le grand tableau.
colors:
  encre: "#17222b"
  sol: "#edf1f2"
  surface: "#ffffff"
  surface-creuse: "#f4f7f8"
  surface-survol: "#f0f4f5"
  sarcelle: "#0b6e75"
  sarcelle-forte: "#095b61"
  sarcelle-encre: "#0a656c"
  sarcelle-voile: "#e2eff0"
  portant: "#1c7a4e"
  portant-voile: "#e2f1e8"
  tension: "#c0392b"
  tension-encre: "#a8332a"
  tension-voile: "#fbe7e4"
  attente: "#8a6410"
  attente-voile: "#f7eedb"
  ardoise: "#5a6b75"
  ardoise-claire: "#64747c"
  filet: "#dce4e7"
  filet-fort: "#c3d0d5"
  encre-nuit: "#e7edf0"
  sol-nuit: "#12181c"
  surface-nuit: "#1b2329"
  surface-creuse-nuit: "#232c33"
  surface-survol-nuit: "#29333a"
  sarcelle-nuit: "#3fa8ae"
  sarcelle-forte-nuit: "#55bcc2"
  sarcelle-encre-nuit: "#5cbfc5"
  sarcelle-voile-nuit: "#14313a"
  portant-nuit: "#4cb87f"
  portant-voile-nuit: "#14301f"
  tension-nuit: "#e4695a"
  tension-encre-nuit: "#f08b7d"
  tension-voile-nuit: "#351a17"
  attente-nuit: "#d8a94a"
  attente-voile-nuit: "#302614"
  ardoise-nuit: "#9aabb4"
  ardoise-claire-nuit: "#7b8b94"
  filet-nuit: "#2c363d"
  filet-fort-nuit: "#3d4950"
  commande-texte-nuit: "#06181a"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.012em"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.006em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  numeric:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.012em"
    fontFeature: "tabular-nums"
  command:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
  scale:
    "11": "0.6875rem"
    "12": "0.75rem"
    "13": "0.8125rem"
    "14": "0.875rem"
    "15": "0.9375rem"
    "16": "1rem"
    "18": "1.125rem"
    "20": "1.25rem"
    "24": "1.5rem"
    "28": "1.75rem"
    "32": "2rem"
    "36": "2.25rem"
    "44": "2.75rem"
rounded:
  xs: "5px"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.sarcelle}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.sarcelle-forte}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-outline-hover:
    backgroundColor: "{colors.surface-survol}"
  button-secondary:
    backgroundColor: "{colors.surface-creuse}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ardoise}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-ghost-hover:
    backgroundColor: "{colors.surface-survol}"
    textColor: "{colors.encre}"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.sarcelle-encre}"
    rounded: "{rounded.md}"
    padding: "0"
    height: "36px"
    typography: "{typography.body}"
  button-destructive:
    backgroundColor: "{colors.tension}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.encre}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  card-inset:
    backgroundColor: "{colors.surface-creuse}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  input-text:
    backgroundColor: "{colors.surface-creuse}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
    typography: "{typography.body}"
  input-text-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.encre}"
  select-native:
    backgroundColor: "{colors.surface-creuse}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
    typography: "{typography.body}"
  badge-default:
    backgroundColor: "{colors.surface-creuse}"
    textColor: "{colors.ardoise}"
    rounded: "{rounded.full}"
    padding: "0.2em 0.62em"
    typography: "{typography.label}"
  badge-portant:
    backgroundColor: "{colors.portant-voile}"
    textColor: "{colors.portant}"
    rounded: "{rounded.full}"
    padding: "0.2em 0.62em"
    typography: "{typography.label}"
  badge-tension:
    backgroundColor: "{colors.tension-voile}"
    textColor: "{colors.tension-encre}"
    rounded: "{rounded.full}"
    padding: "0.2em 0.62em"
    typography: "{typography.label}"
  badge-attente:
    backgroundColor: "{colors.attente-voile}"
    textColor: "{colors.attente}"
    rounded: "{rounded.full}"
    padding: "0.2em 0.62em"
    typography: "{typography.label}"
  badge-sarcelle:
    backgroundColor: "{colors.sarcelle-voile}"
    textColor: "{colors.sarcelle-encre}"
    rounded: "{rounded.full}"
    padding: "0.2em 0.62em"
    typography: "{typography.label}"
  badge-encre:
    backgroundColor: "{colors.encre}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "0.2em 0.62em"
    typography: "{typography.label}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ardoise}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
    typography: "{typography.command}"
  nav-item-active:
    backgroundColor: "{colors.sarcelle-voile}"
    textColor: "{colors.sarcelle-encre}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
    typography: "{typography.command}"
  tab-trigger-active:
    backgroundColor: "transparent"
    textColor: "{colors.sarcelle-encre}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "36px"
    typography: "{typography.command}"
  tooltip:
    backgroundColor: "{colors.encre}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
    typography: "{typography.body}"
---

# Design System: Plia

## Overview

**Creative North Star: « L'enveloppe »**

Un budget est une collection d'enveloppes. Chacune a un nom, une contenance, ce qu'on
en a déjà sorti — et, quand ça a mal tourné, ce qui a débordé au-delà du bord. Le monde
visuel de Plia n'a qu'un objet, la CARTE : tout ce qui est panneau, section, relevé,
enveloppe ou grand tableau est posé dedans, et rien ne s'imbrique.

L'Historique fait exception à la carte-liste et l'assume : c'est un RELEVÉ À COLONNES DE
MOIS, avec son épine de noms figée à gauche et son défilement horizontal. Cette forme
est celle du produit et elle ne se discute pas — on y compare les mois d'un regard, ce
qu'aucune pile de cartes ne sait faire. Ce qui a changé n'est pas sa structure mais sa
matière : il vit maintenant dans une carte, ses familles de colonnes se distinguent par
la DENSITÉ d'une même ardoise et non par des teintes différentes, et il se ferme sur un
pied d'encre — la seule masse sombre d'un écran clair.

La matière est celle d'un logiciel de travail, pas d'une vitrine. Un sol clair
légèrement cyan (#edf1f2), des cartes franchement blanches posées dessus, un filet d'un
pixel, une ombre courte : le relief vient de la lumière, jamais d'une découpe ni d'un
trait épais. Une seule fonte, Schibsted Grotesk, porte tout — titres, libellés,
commandes et montants — parce qu'une chasse fixe posée sur des chiffres n'est qu'un
costume de technicité, et que l'alignement des virgules s'obtient avec `tabular-nums`.
La densité est celle d'un relevé : des lignes serrées, des montants toujours à droite,
et rien qui ne soit ni un montant, ni une date, ni un libellé sans avoir à le justifier.

La couleur est rationnée, et c'est le cœur du système. Une seule teinte de marque, une
sarcelle profonde, qui ne sert QU'À COMMANDER : bouton principal, lien, onglet actif,
destination courante, mise au point, sélection. Elle ne qualifie jamais une valeur.
Face à elle, trois sens — le vert de ce qui rentre, le rouge de ce qui a rompu, le sable
de ce qui attend encore — ne teintent que des montants, des pastilles d'état et la
jauge. Tout le reste est de l'encre bleu-ardoise. Ce qui est refusé, explicitement : les
capitales de chasse fixe gravées en titre, les blocs à découpe oblique, le zéro-rayon
zéro-ombre, la poutre noire en haut de page, les camemberts et les jauges décoratives.

**Key Characteristics:**
- Une seule surface : la carte blanche, arrondie à 12 px, filet d'un pixel, ombre courte.
- Un seul tableau dense, celui de l'Historique, posé DANS une carte et fermé par un pied d'encre.
- Une seule fonte, variable, servie localement ; aucun couple d'affichage.
- Une seule couleur de commande, trois couleurs de sens, et rien d'autre.
- Des montants tabulaires, alignés à droite, toujours écrits en toutes lettres.
- Une jauge d'enveloppe qui déborde hors de sa piste au lieu de saturer à cent pour cent.
- Aucun geste d'ouverture : les deux seuls mouvements du produit disent l'attente.

## Colors

Une palette de bureau : une encre bleu-ardoise, un sol cyanisé, deux gris de filet, une
teinte de commande et trois teintes de sens. Chaque teinte de sens existe en deux
valeurs — son encre, qui tient 4,5:1 et porte du texte, et son voile, qui ne fait que
teinter un fond de pastille.

### Primary
- **Sarcelle profonde** (`{colors.sarcelle}`) : la couleur de la commande, et d'elle seule. Fond du bouton principal, texte des liens, trait de l'onglet actif, anneau de mise au point, fond de sélection de texte. Sa variante **appuyée** (`{colors.sarcelle-forte}`) sert au survol et à l'enfoncement ; sa variante **encre** (`{colors.sarcelle-encre}`) est la seule autorisée à porter du texte sur un fond clair ; son **voile** (`{colors.sarcelle-voile}`) remplit la pastille de la destination courante et les bandeaux d'information.

### Secondary
- **Vert portant** (`{colors.portant}`) : ce qui rentre et ce qui est acquis. Encre d'un montant reçu, texte de la pastille « acquis », remplissage de la jauge d'entrée.
- **Rouge tension** (`{colors.tension}`) : ce qui a rompu. Réservé au débord de la jauge, au bouton destructeur et au mois qui plonge sous la ligne du zéro. Son **encre** (`{colors.tension-encre}`) porte les montants négatifs et la part budgétée d'une enveloppe rompue ; son **voile** (`{colors.tension-voile}`) remplit la pastille « dépassé » et le bandeau d'alerte.
- **Sable attente** (`{colors.attente}`) : ce qui est prévu mais pas encore arrivé. Pastille « attendu », bandeau d'attente. Jamais un avertissement — l'attente n'est pas une faute.

### Neutral
- **Encre bleu-ardoise** (`{colors.encre}`) : tout le texte porteur, les colonnes de l'horizon du mois en cours, le carré de la marque, le fond des infobulles.
- **Sol cyanisé** (`{colors.sol}`) : le fond du document, sous les cartes. Ce n'est pas du blanc — c'est ce demi-ton qui décolle les cartes.
- **Blanc de carte** (`{colors.surface}`) et **surface creusée** (`{colors.surface-creuse}`) : la carte, et ce qui s'enfonce dedans (pied de totaux, champ de saisie, piste de jauge, tirage). Le **survol** (`{colors.surface-survol}`) est le troisième ton, réservé aux états de passage.
- **Ardoise** (`{colors.ardoise}`) : le texte secondaire et les légendes en petites capitales. **Ardoise claire** (`{colors.ardoise-claire}`) porte les dates d'opération, les montants à zéro et le texte d'invite des champs — elle a valu 3,4:1 avant d'être remontée ; un ton « clair » ne dispense pas de se lire.
- **Filet** (`{colors.filet}`) et **filet fort** (`{colors.filet-fort}`) : le cerclage des cartes et les séparateurs de lignes ; le second pour les contours de champ, la ligne du zéro et le survol d'une carte ouvrable.

Le pendant sombre est le même bureau, la lampe éteinte : le sol s'enfonce
(`{colors.sol-nuit}`), les cartes remontent d'un cran (`{colors.surface-nuit}`), et les
quatre teintes s'éclaircissent juste assez pour rester lisibles. Les rôles ne changent
pas d'un thème à l'autre ; seules les valeurs bougent.

### Named Rules

**La règle de la sarcelle.** La sarcelle ne commande que. Bouton principal, lien, onglet
actif, destination courante, anneau de mise au point, sélection : rien d'autre. Aucun
montant n'est jamais sarcelle, aucune commande secondaire non plus — une commande
secondaire se distingue par sa matière (fond blanc, filet, ombre courte), pas par une
teinte plus pâle de la même couleur. Test : masquez tous les éléments cliquables de
l'écran ; il ne doit plus rester un seul pixel sarcelle.

**La règle des trois sens.** Le portant, la tension et l'attente ne teintent que des
montants, des pastilles — et la jauge. La jauge est la seule et unique exception à
l'interdit du sens en aplat : sa piste remplie prend le vert portant ou l'encre de
tension, son débord prend le rouge de tension. Elle est écrite ici plutôt que passée
sous silence, parce qu'une règle qu'on prétend sans exception se fait contourner
partout.

**La règle du négatif par nature.** Un montant négatif par nature reste à l'encre. Le
« dépensé » d'une enveloppe est négatif sur chaque ligne sans exception ; le peindre en
rouge rendait le rouge muet. Seuls le reste et la jauge portent la couleur — c'est-à-dire
les deux endroits où le signe est une information et non une fatalité.

## Typography

**Fonte unique :** Schibsted Grotesk (variable, sous-ensemble latin, servie par
next/font ; repli `ui-sans-serif, system-ui, sans-serif`).

**Caractère :** un grotesque de presse — formes ouvertes, hauteur d'x généreuse, un
caractère qui n'est ni l'anonymat d'une fonte système ni le maniérisme d'une fonte de
marque. Elle tient à 11 px comme à 44 px, ses chiffres s'alignent, et elle porte seule
les titres, les libellés, les commandes et les montants. Un logiciel de travail n'a pas
besoin d'un couple d'affichage : il a besoin d'une famille qui tienne partout.

### Hierarchy
- **Display** (700, 2rem, montant à 2.75rem dès 640 px, interlettrage -0.025em) : le titre de la landing, et lui seul. Il n'existe pas sous la porte de session.
- **Headline** (600, 1.75rem, montant à 2.25rem dès 640 px, tabulaire) : la mesure de tête du relevé — le seul chiffre de l'écran qui réponde directement à « est-ce que je peux dépenser ? ».
- **Title** (600, 0.9375rem, interligne 1.3) : le titre d'une carte. Une phrase en casse normale, pas une inscription. L'ancien monde gravait ses titres en capitales de chasse fixe ; celui-ci les écrit.
- **Body** (400, 0.875rem, interligne 1.5) : le texte courant, les libellés de transaction, les phrases d'explication. Le texte creux passe à 0.8125rem.
- **Numeric** (600, 0.875rem par défaut, tabulaire, interlettrage -0.012em) : tout montant. Toujours à droite, jamais coupé (`white-space: nowrap`). Les trois sens ne changent que son encre.
- **Command** (600, 0.8125rem) : les onglets, les destinations de la barre produit, les liens d'action en tête de carte. Les boutons montent à 0.875rem.
- **Label** (600, 0.6875rem, interlettrage 0.06em, capitales) : la légende posée au-dessus d'un montant ou en tête de colonne. Ardoise, jamais de fond : c'est une cote, pas une étiquette.

Les titres de niveau 1 à 3 portent un interlettrage de -0.012em et `text-wrap: balance` :
un titre de carte tient sur une ligne ou se coupe proprement, il ne laisse pas un mot
seul en bas.

### Named Rules

**La règle de la chasse tabulaire.** `tabular-nums` ne se pose que sur des chiffres :
`.montant`, `.legende`, l'utilitaire `tabular-nums`, et rien d'autre — jamais sur
`body`. Dans cette fonte, la fonctionnalité donne aussi à la virgule et au point la
chasse d'un chiffre : posée sur le document entier, elle détachait la ponctuation de
chaque phrase du produit, jusque dans le titre de la page d'accueil.

**La règle de la fonte unique.** Une seule famille, et pas de chasse fixe. Un montant
n'a pas besoin d'être monospacé pour s'aligner ; il a besoin de `tabular-nums`. Toute
demande de « fonte de chiffres » se règle par une variante numérique, pas par une
deuxième famille.

## Layout

Une colonne unique qui descend. Le shell de l'app est une barre produit blanche de 56 px
(`h-14`) avec un filet en pied, puis une zone de contenu qui défile seule — la barre ne
bouge jamais. Les marges du contenu sont resserrées sur téléphone (12 px de chaque côté)
et s'ouvrent à 24 px dès 640 px : tout ce qu'on prendrait de plus serait pris sur la
largeur des cartes, là où vivent les montants.

Le rythme d'espacement est un pas de 4 px, et il n'en sort pas : gouttières de 12 px
entre les cartes d'un même écran, 16 px sur l'Historique où les mois doivent se séparer,
padding de carte 12 px vertical / 16 px horizontal montant à 20 px dès 640 px. Le tableau
de bord se borne à 1400 px, les écrans de réglages à 768 px (`max-w-3xl`) : un formulaire
qui s'étale n'est pas plus lisible.

Les points de bascule sont ceux de Tailwind, et trois seulement comptent. À 640 px les
mesures d'appui passent de deux à quatre de front, les marges s'ouvrent, les libellés
courts apparaissent. À 1024 px la mesure de tête du relevé se met à côté de ses appuis
plutôt qu'au-dessus, et la barre produit affiche les noms de destination en entier. À
1280 px les deux cartes de postes du mois se mettent côte à côte. Sur téléphone, une
grille à deux colonnes réglée plutôt qu'un retour à la ligne libre : à 390 px, six champs
de largeurs différentes retombent en escalier.

## Elevation & Depth

Le système est hybride, mais l'ordre compte : d'abord la valeur, ensuite l'ombre. En
lumière claire, une carte blanche sur un sol cyanisé est déjà décollée ; le filet d'un
pixel la borne, et l'ombre courte ne fait que la poser. En lumière sombre, l'écart de
valeur entre le sol et la carte porte tout le relief, et les ombres se contentent
d'asseoir ce qui flotte vraiment.

### Shadow Vocabulary
- **Ombre de carte** (`0 1px 2px rgba(23,34,43,.06), 0 1px 3px rgba(23,34,43,.05)`) : l'état de repos de toute carte, de la barre produit et des boutons pleins.
- **Ombre levée** (`0 2px 4px rgba(23,34,43,.06), 0 8px 20px -6px rgba(23,34,43,.14)`) : le survol d'une carte ouvrable, et rien d'autre. C'est le seul mouvement d'une carte.
- **Ombre flottante** (`0 4px 8px rgba(23,34,43,.08), 0 18px 44px -10px rgba(23,34,43,.2)`) : ce qui sort du flux — menus, infobulles, panneaux latéraux, messages passagers.

### Named Rules

**La règle de la lumière.** La profondeur vient de la lumière. Les trois ombres sont
décalées vers le bas et floues : une ombre sans décalage est un halo, c'est-à-dire une
décoration. Elles sont teintées de l'encre du monde, jamais du noir pur — un noir pur
sur un sol cyanisé donne une ombre grise et sale. Aucune ombre dure, aucun décalage sans
flou, aucun contour lumineux.

**La règle du non-emboîtement.** Rien ne s'imbrique. Il y a une surface et une seule,
`.carte`. Ce qui vit DANS une carte prend la surface creusée (`.creux`) : un pied de
totaux, une piste de jauge, un détail replié, un champ de saisie. Jamais une deuxième
carte, jamais une deuxième ombre. Test : sur n'importe quel écran, aucun rectangle
blanc à filet ne doit en contenir un autre.

## Shapes

Des rectangles arrondis, et une seule silhouette d'ovale. La carte est arrondie à 12 px
(`{rounded.lg}`) ; les commandes, les champs, les menus et les blocs creusés à 8 px
(`{rounded.md}`) ; les petits éléments — bouton minuscule, case cochable, onglet, tuile
de mois de la frise — à 6 px (`{rounded.sm}`, la case à 5 px). Les panneaux qui sortent
du flux, tiroir de téléphone compris, montent à 16 px (`{rounded.xl}`). Les pastilles
d'état, les jauges, les tirages et le fil d'attente sont pleinement ovales (999 px) :
c'est ce qui les distingue d'un bloc au premier coup d'œil.

Le trait est toujours un pixel, jamais deux : cerclage de carte, séparateur de ligne,
contour de champ, filet sous la barre produit, filet sous une rangée d'onglets. Le seul
trait de deux pixels du produit est l'anneau de mise au point, et le seul trait oblique
est celui qu'on refuse : aucune découpe à 45°, aucun angle vif, aucune bordure épaisse
en guise d'accent.

## Components

### Buttons
- **Forme :** coins arrondis à 8 px (`{rounded.md}`), hauteur 36 px par défaut (28 px en `sm`, 40 px en `lg`, 24 px en `xs`), casse normale, graisse 600.
- **Principal :** fond sarcelle, texte blanc, ombre de carte ; au survol, la sarcelle appuyée.
- **Secondaire (outline) :** une carte à hauteur de bouton — fond blanc, filet d'un pixel, ombre courte. Elle se distingue de la principale par sa matière, pas par une teinte plus pâle.
- **Discret (secondary/ghost) :** fond creusé ou transparent, encre ardoise, qui passe à l'encre pleine au survol.
- **Lien :** encre sarcelle, souligné au survol à 3 px de décalage.
- **Destructeur :** rouge de tension plein, texte blanc, assombri de 5 % au survol.
- **Mise au point :** l'anneau global, deux pixels de sarcelle détachés de deux pixels. Il est posé une fois pour toutes sur `:focus-visible` plutôt que composant par composant : ainsi il ne peut manquer nulle part.

### Chips (pastilles d'état)
- **Style :** un ovale plein en petites capitales (0.6875rem, graisse 600, interlettrage 0.02em), fond voilé, sans filet. La variante neutre garde un cerclage intérieur d'un pixel parce que le creux seul ne se voit pas.
- **Rôles :** portant (acquis, reçu), tension (dépassé), attente (attendu), sarcelle (état de commande), encre (marqueur fort). Une pastille nomme un ÉTAT — jamais une valeur.
- C'est le seul endroit du produit, avec la jauge, où une couleur de sens sert de fond.

### Cards / Containers
- **Coins :** 12 px. **Fond :** blanc de carte. **Filet :** un pixel de filet. **Ombre :** ombre de carte au repos.
- **En-tête :** séparé du contenu par un filet — c'est ce qui lui donne son assise quand la carte porte une liste. Titre à gauche, mesure et lien d'action à droite, alignés sur la même ligne de base.
- **Padding interne :** 12 px vertical, 16 px horizontal, montant à 20 px dès 640 px.
- **Ouvrable :** la variante active se lève d'un cran au survol (ombre levée, filet renforcé) en 160 ms. Une carte qui ne mène nulle part ne s'allume pas — un fond qui s'éclaire au passage promet un geste qui n'existe pas.

### Inputs / Fields
- **Style :** fond creusé, filet fort d'un pixel, coins à 8 px, hauteur 36 px.
- **Mise au point :** le champ s'éclaire en blanc et prend le filet sarcelle avec un halo de 25 % — un champ actif est une surface qui s'ouvre, pas un contour qui change de couleur.
- **Erreur :** découle de `aria-invalid`, jamais d'une classe posée à la main : c'est d'abord une information d'accessibilité.
- **Téléphone :** le texte reste à 16 px sous 768 px, sans quoi iOS zoome à la mise au point.

### Navigation
- La barre produit est blanche, haute de 56 px, séparée du contenu par un filet en pied : elle surplombe, elle ne pèse pas. La navigation n'est pas le sujet de l'écran, les enveloppes le sont.
- Une destination porte son icône et son nom, en 0.8125rem graisse 600, encre ardoise. **La destination courante prend une pastille sarcelle pleine** (fond voilé, encre sarcelle), pas un trait sous le pied.
- Le trait sous le pied est le repère des onglets DANS une page : deux repères identiques à deux niveaux ne se distinguent plus. Un onglet actif passe à l'encre sarcelle et fait apparaître son trait de 2 px en fondu.
- Sur téléphone, seule la destination courante dit son nom : trois libellés ne tiennent pas, et trois icônes muettes ne disent pas où l'on est.
- Réglages et déconnexion vivent sous le nom du compte, marqué par les initiales : ce sont des choses qu'on fait à soi, pas des destinations.

### La jauge d'enveloppe (composant signature)

La seule chose de l'écran qu'on doit voir avant tout le reste, et la pièce qui justifie
le monde entier.

Une barre de progression ordinaire se remplit puis s'arrête à cent pour cent : elle sait
dire qu'un poste a rompu, pas de combien. Ici, **la largeur totale de la barre vaut la
DÉPENSE, pas le budget**. La piste — l'enveloppe — n'occupe donc que sa part budgétée, et
le trop-plein se pose à sa DROITE, en rouge, séparé de la piste par une encoche de la
couleur de la carte pour qu'on lise deux corps et non une barre bicolore. Un poste dépensé
au double de son budget montre une demi-piste et un demi-débord ; on lit l'ampleur du
dépassement sans avoir à comparer deux nombres.

- **Forme :** 8 px de haut, pleinement ovale, largeur maximale 34 rem. Piste et débord se partagent toujours exactement cent pour cent, sinon une colonne de jauges cesserait de se comparer d'un coup d'œil.
- **Intacte :** piste creusée, remplissage ardoise (portant pour une entrée). Une enveloppe pleine mais intacte n'a **aucun** traitement à part : sa piste remplie jusqu'au bout le dit déjà. Elle a porté un temps une encre presque noire, ce qui en faisait la marque la plus lourde de l'écran — plus lourde qu'une enveloppe débordée. Exactement l'inverse de ce qu'on vient lire.
- **Rompue :** la barre passe **entièrement** au rouge — encre de tension pour la part budgétée, rouge vif pour le débord. Ce qui a rompu doit être la marque la plus lourde de la carte.
- **Débord minimal :** 6 px. Un dépassement de deux pour cent est un dépassement, et sans ce minimum un poste tout juste rompu était indiscernable d'un poste pile plein — or c'est exactement la différence qu'on vient chercher.
- **Sens inverse :** une entrée n'a pas de budget qu'on épuise, elle a un montant attendu qu'on encaisse. Rien n'y déborde jamais — un trop-perçu n'est pas une rupture : la piste occupe toute la barre et se remplit en portant.
- **Aucune transition de largeur.** La jauge ne change de valeur qu'au retour d'un rendu serveur, où elle est reconstruite de toute façon : l'animation n'aurait jamais lieu, et animer une propriété de mise en page pour rien fait travailler le navigateur à chaque passage.
- La géométrie vit dans une bibliothèque testée ; le composant ne fait que placer. Il est `aria-hidden` : le budget, le dépensé et le reste sont écrits en toutes lettres à côté. **Retirez la jauge, la ligne se lit encore** — c'est la condition pour qu'elle ait le droit d'être là.

### L'horizon

Une colonne par mois, plantée sur la ligne du zéro ; un mois qui passe dessous plonge en
rouge sous cette ligne, et on le voit avant d'avoir lu quoi que ce soit. Le mois en cours
est en encre pleine, les mois à venir dans la même encre **diluée dans la carte** à 32 %
— pas une deuxième couleur, le même corps vu à travers un voile — parce que ce sont des
projections et que rien ne doit laisser croire qu'elles sont acquises. La distinction se
lit sans légende, ce qui est la condition pour s'en passer.

Chaque montant est écrit au bout de sa colonne : au-dessus quand elle monte, en dessous
quand elle plonge, jamais aligné sur une seule ligne à distance de ce qu'il mesure. Les
noms de mois vivent sous un filet, hors de la zone de dessin, sinon une colonne qui
plonge passerait par-dessus son propre nom. La zone fait 96 px de haut, 128 px dès
640 px : ce dessin n'est pas la signature de l'écran, et une trajectoire sur six mois se
lit aussi bien en cent pixels qu'en deux cent vingt-quatre.

### Le bandeau de section
Un message posé en tête d'une carte : fond voilé, filet d'un pixel à gauche, coins à
8 px, texte à 0.8125rem. Trois variantes, celles des trois sens plus la sarcelle. Jamais
d'icône pleine, jamais de bordure sur les quatre côtés.

### L'attente
- **Le tirage** (squelettes) : une barre creusée, à l'emplacement et à la largeur exacte de ce qui la remplacera, qu'un reflet traverse en 1,5 s. Un squelette dessine la STRUCTURE réelle de la page — les mêmes cartes, aux mêmes places — pas une grappe de rectangles génériques. Ce qui arrive ensuite ne doit rien déplacer.
- **Le fil d'attente** : une barre sarcelle qui court sous la barre produit tant que le serveur recalcule. Elle ne mesure rien — personne ne sait combien de temps ça prendra — elle dit qu'une machine travaille. Sa gouttière de deux pixels reste là au repos, sans quoi chaque enregistrement décalerait l'écran d'un cran.

### Named Rules

**La règle du silence à l'ouverture.** Aucun geste d'ouverture. C'est une surface de
travail : rien n'entre en scène, rien ne monte en fondu, rien ne se décale à
l'apparition. Les deux seuls mouvements du produit sont les signaux d'attente — le
tirage et le fil — et tous deux s'arrêtent sous `prefers-reduced-motion` (le tirage
devient une barre pleine, le fil un câble tendu d'un bord à l'autre). Les seules autres
transitions durent 150 à 160 ms et ne portent que sur la couleur, l'ombre et le filet.

**La règle du `<select>` natif.** Un `<select>` natif partout. La primitive `Select` de
shadcn a été supprimée ; chaque menu déroulant du produit est un `<select>` HTML habillé
des jetons du champ (fond creusé, filet fort, 8 px, 36 px de haut, mise au point
sarcelle). Deux raisons, toutes deux décisives ici : le regroupement par `optgroup`, dont
les listes de postes ont besoin, et l'ergonomie du sélecteur natif sur téléphone. Un seul
vocabulaire, écrit noir sur blanc pour qu'il ne se redéfausse pas.

### Le grand tableau de l'Historique
La pièce la plus dense du produit, et la seule qui ne soit pas une liste de cartes.

- **Sa surface :** une carte, `overflow-hidden`, qui coupe le tableau qui défile à
  l'intérieur. Une seule zone de défilement horizontal — deux imbriquées empêchent toute
  colonne figée de fonctionner.
- **Son épine :** la colonne des noms, écrite une fois pour tous les mois. Elle se fige
  au bord gauche à partir de 640 px seulement : en dessous, figée, elle occuperait 176
  des 390 pixels d'un téléphone en permanence.
- **Ses familles de colonnes :** trois, et elles se lisent à la DENSITÉ, pas à la
  teinte. Les colonnes de mouvement du mois partagent le fond le plus clair (ardoise à
  5 %), Balance a le sien (11 %), les trois chaînes de solde partagent le plus dense
  (18 %), les lignes de totaux montent à 24 %. Toutes ces teintes se mélangent à la
  CARTE, jamais au sol : le tableau est posé dans une carte blanche, et une teinte
  mélangée au sol tomberait à côté de la surface qui la porte.
- **Ses bandes de section :** pleine largeur, le nom dans l'épine. Ce qui rentre prend
  le voile du portant, ce qui sort celui de la tension. C'est le seul endroit du produit
  où une couleur de sens teinte une rangée entière.
- **Ses teintes se posent sur les CELLULES, jamais sur la ligne :** un fond de cellule
  recouvre celui de sa ligne, donc peinte sur la ligne une teinte de colonne
  disparaîtrait au survol et ne resterait visible que dans les trous.
- **Son pied :** trois lignes d'encre pleine — total du mois, solde de fin de mois,
  estimé, total dépassement. C'est la seule masse d'encre d'un écran de cartes claires,
  et en lumière éteinte, l'encre étant claire, le tampon s'inverse en bande pâle sur un
  tableau sombre. Dans les deux thèmes, il reste le bloc le plus contrasté de l'écran.
  Ses couleurs ne sont pas réécrites case par case : on y redéfinit les jetons que les
  cellules utilisent déjà (`--foreground`, `--muted-foreground`, `--tension-encre`,
  `--border`), et l'encre claire se pose sur la LIGNE et non sur les cellules, sans quoi
  elle écraserait le rouge d'un montant négatif.

## Do's and Don'ts

### Do:
- **Do** poser tout panneau, section, relevé ou enveloppe sur `.carte` — blanche, 12 px, filet d'un pixel, ombre de carte — et donner à ce qui vit dedans la surface creusée `.creux`.
- **Do** réserver la sarcelle aux commandes : bouton principal, lien, onglet actif, destination courante, anneau de mise au point, sélection.
- **Do** qualifier un montant par son sens uniquement quand le sens est une information : le reste d'une enveloppe, un solde sous zéro, une entrée reçue.
- **Do** écrire chaque montant en toutes lettres à côté du dessin qui le représente ; un écran doit rester lisible sans ses jauges et sans son horizon.
- **Do** poser `tabular-nums` sur les montants et les légendes chiffrées, et là seulement.
- **Do** faire d'un squelette la structure exacte de la page qu'il attend, aux mêmes places et aux mêmes largeurs.
- **Do** utiliser un `<select>` natif pour tout menu déroulant de saisie, habillé des jetons du champ.
- **Do** distinguer un état par une pastille ovale en petites capitales, jamais par une couleur de texte seule.

### Don't:
- **Don't** teinter un montant en sarcelle, ni une commande secondaire : elle se distingue par sa matière, pas par une teinte plus pâle.
- **Don't** peindre en rouge un montant négatif par nature — le « dépensé » d'une enveloppe est négatif sur chaque ligne, et le rouge y perd tout sens.
- **Don't** imbriquer une carte dans une carte, ni empiler deux ombres.
- **Don't** poser `tabular-nums` sur `body` ni sur du texte courant : dans cette fonte, la virgule et le point y prennent la chasse d'un chiffre.
- **Don't** donner un traitement particulier à une enveloppe pleine mais intacte ; sa piste remplie jusqu'au bout le dit déjà.
- **Don't** laisser une jauge rompue plus discrète qu'une jauge pleine : ce qui a rompu est la marque la plus lourde de la carte.
- **Don't** ajouter un geste d'entrée, un fondu d'apparition ou une animation de largeur ; les seuls mouvements du produit disent l'attente.
- **Don't** teinter les familles de colonnes du grand tableau : elles se distinguent par la DENSITÉ d'une même ardoise, jamais par des couleurs différentes.
- **Don't** mélanger une teinte de colonne au SOL : le tableau vit dans une carte, et une teinte prise sur le sol tombe à côté de la surface qui la porte.
- **Don't** introduire une deuxième famille de caractères, ni une chasse fixe pour les chiffres.
- **Don't** utiliser d'ombre dure, de découpe oblique, de bordure épaisse en guise d'accent, ni de camembert ou de jauge décorative.
