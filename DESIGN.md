---
name: Plia
description: Un budget dessiné comme une structure en tenségrité — du béton, du carbone, un seul câble rouge.
colors:
  ground: "#e6e3df"
  plate: "#eeece8"
  carbon: "#0d000f"
  graphite: "#2b2b2e"
  ash: "#9a9a9c"
  void-white: "#f7f7f8"
  tension: "#d7262e"
  portant: "#1f8a55"
  voile: "#383838"
  tension-ink: "#b31d25"
  muted: "#dcd9d4"
  muted-foreground: "#6b6966"
  border: "#c7c3bd"
  input: "#b6b2ab"
  beam: "#17161a"
  beam-foreground: "#b9b6b1"
  beam-accent: "#232227"
  beam-rule: "#2e2d32"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 86"
  title:
    fontFamily: "Azeret Mono, ui-monospace, 'SF Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.09em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  numeric:
    fontFamily: "Azeret Mono, ui-monospace, 'SF Mono', monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Azeret Mono, ui-monospace, 'SF Mono', monospace"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.09em"
  caption:
    fontFamily: "Azeret Mono, ui-monospace, 'SF Mono', monospace"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.11em"
  command:
    fontFamily: "Azeret Mono, ui-monospace, 'SF Mono', monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.void-white}"
    rounded: "{rounded.none}"
    padding: "0 16px 0 28px"
    height: "36px"
    typography: "{typography.command}"
  button-primary-hover:
    backgroundColor: "{colors.graphite}"
  button-destructive:
    backgroundColor: "{colors.tension}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
    typography: "{typography.command}"
  button-outline:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
    typography: "{typography.command}"
  button-outline-hover:
    backgroundColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
    typography: "{typography.command}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.carbon}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
    typography: "{typography.command}"
  input-text:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.none}"
    padding: "4px 12px"
    height: "36px"
  card-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.none}"
    padding: "20px"
  chip:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.void-white}"
    rounded: "{rounded.none}"
    padding: "0.34em 0.55em 0.3em"
    typography: "{typography.label}"
  chip-slack:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.none}"
    padding: "0.34em 0.55em 0.3em"
    typography: "{typography.label}"
  chip-tension:
    backgroundColor: "{colors.tension}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "0.34em 0.55em 0.3em"
    typography: "{typography.label}"
  beam-nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.beam-foreground}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "52px"
    typography: "{typography.command}"
  beam-nav-item-active:
    textColor: "{colors.void-white}"
  table-head:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    height: "32px"
    typography: "{typography.caption}"
---

# Design System: Plia

## Overview

**Creative North Star: « La colonne en tension »**

Un budget n'est pas un tableau de bord : c'est une structure qui tient par deux forces
opposées. Ce qui porte — le solde acquis, les revenus encaissés — est un mât de carbone
planté dans le sol. Ce qui tire — les dépenses engagées, les reports, les dépassements —
est un câble rouge. L'équilibre entre les deux est le sujet de l'application, et il n'a
qu'une couleur.

Le monde est fait de trois matières et d'un seul accent : un sol de béton coulé (une
dalle photographiée posée en fond de page, à peine perceptible, la seule image du
produit), une structure de carbone presque noir, du cendre pour ce qui dort, et le rouge
de tension pour ce qui tire, le vert du portant pour ce qui entre. Ces deux couleurs ne
jugent pas : elles ne disent pas « bon » ou « mauvais », elles disent le SENS d'une
force — ça porte ou ça tire. L'ambre n'existe toujours pas, et aucune troisième
couleur n'entre dans ce système. Aucune surface n'est arrondie — la famille
de formes est la coupe à 45°, comme une plaque d'appareillage qu'on chanfreine plutôt que
d'adoucir. Aucune ombre non plus : le relief vient de la découpe, du filet d'un pixel et
de la masse du carbone.

Les chiffres sont le sujet, tout le reste est de la charpente. Ils sont en mono technique
(Azeret Mono), tabulaires, alignés à droite, partout — y compris isolés dans une phrase,
parce que `font-variant-numeric: tabular-nums` est posé sur le corps du document et non
sur les tableaux. L'interface autour d'eux est en Archivo, resserrée sur son axe de
chasse pour prendre le dessin d'une capitale gravée. Rien ne bouge nulle part pour le
plaisir : la mise en tension du plan de charge à l'ouverture, et le mouvement d'attente
— le tirage, le fil de tension — qui dit qu'une machine travaille.

**Key Characteristics:**
- Du béton et du carbone, pas du papier ni du blanc d'écran ; un grain photographié sur `<html>`, jamais sur les plaques.
- Un seul accent, le rouge de tension, et il ne dit qu'une chose : une force qui tire.
- Aucun rayon, aucune ombre : la coupe à 45° et le filet d'un pixel font tout le relief.
- Deux fontes, deux rôles étanches : Archivo pour l'interface, Azeret Mono pour tout chiffre, mesure ou état.
- Quatre états de structure et rien d'autre : acquis, engagé, attendu, dépassé.
- Aucun mouvement décoratif : la mise en tension à l'ouverture, et l'attente qui dit qu'une machine travaille.

## Colors

Une palette de chantier : un béton clair, un carbone presque noir, du cendre pour le
dormant, et un rouge unique pour la tension. Le thème sombre est le même atelier, lumière
éteinte — il ne redéfinit qu'une poignée de jetons parce que toutes les teintes de fond
sont des mélanges au fond de page.

### Primary
- **Rouge de tension** (`{colors.tension}`) : la couleur du trait. Le câble du plan de
  charge, le mât rompu, la marque de rupture, le repère d'appui sous la destination
  courante et sous l'onglet actif, le trait oblique de la commande pleine, la bordure du
  champ en cours de saisie, l'étiquette d'un poste dépassé. En lumière éteinte elle
  s'éclaircit à `#e8434a` pour rester lisible sur du noir.
- **Encre de tension** (`{colors.tension-ink}`) : la même force, en version texte. Plus
  sombre pour tenir 4.5:1 sur le béton, elle porte tout montant négatif, le solde d'un
  mois rompu, et les liens. En sombre elle s'éclaircit à `#f0666c`.

### Neutral
- **Béton coulé** (`{colors.ground}`) : le sol de l'application, et l'ingrédient de tout
  mélange de fond. Il porte le grain photographié. En sombre : `#121114`.
- **Tôle peinte** (`{colors.plate}`) : la surface des plaques — cartes, panneaux,
  bande de relevés, panneau de détail. Un cran plus clair que le sol, et lisse : le grain
  s'arrête au bord de la plaque. En sombre : `#1a191d`.
- **Carbone** (`{colors.carbon}`) : la structure. Le texte courant, les mâts debout, les
  pastilles gravées, le fond des commandes pleines, le filet fort qui souligne un en-tête
  de tableau. C'est aussi la couleur qu'on dilue pour teinter les familles de colonnes.
- **Graphite** (`{colors.graphite}`) : le survol de la commande pleine, en clair
  uniquement.
- **Cendre** (`{colors.ash}`) : le ton du dormant, prévu pour les filets et les contours.
  *Écart : ce jeton est déclaré et exposé à Tailwind, mais aucun composant ne l'emploie
  aujourd'hui — le dormant réel passe par le filet et le cendre assombri.*
- **Cendre assombri** (`{colors.muted-foreground}`) : le texte secondaire, les légendes,
  les en-têtes de colonne, les montants à zéro. Le cendre pur ne tenait pas le contraste
  sur le béton ; celui-ci le tient.
- **Blanc de vide** (`{colors.void-white}`) : les capitales sur carbone, les popovers en
  clair. Ce n'est pas un blanc pur.
- **Sourdine** (`{colors.muted}`) : les fonds secondaires, les survols de ligne, la
  commande secondaire. En sombre : `#26252a`.
- **Filet** (`{colors.border}`) : bordures, séparateurs, fils de rappel. En sombre :
  `#302f34`.
- **Dormant** (`{colors.input}`) : le contour du champ au repos et de l'étiquette évidée.
  En sombre : `#3a393f`.

### Secondary
La poutre a ses jetons propres, distincts de tout le reste : c'est la seule masse de
carbone d'un écran de béton, et elle ne suit pas les surfaces claires.

- **Poutre** (`{colors.beam}`) : le fond du bandeau de navigation. En sombre elle
  s'enfonce d'un cran SOUS le sol (`#08070a`) : dans le noir on ne distingue plus que son
  arête.
- **Texte de poutre** (`{colors.beam-foreground}`) : les destinations au repos. En
  sombre : `#97948f`.
- **Filet de poutre** (`{colors.beam-rule}`) : le trait vertical qui sépare le nom des
  destinations. En sombre : `#242328`.
- **Appui de poutre** (`{colors.beam-accent}`) : le fond de survol des deux commandes
  posées dans la poutre — synchroniser et notifications. En sombre : `#1c1b20`.

Le brillant de la poutre (`--beam-bright`) est le blanc de vide en clair, et le béton en
sombre : le nom du produit et la destination courante restent le point le plus contrasté
du bandeau dans les deux thèmes.

### Named Rules

**La règle du mélange au fond.** Toute teinte de fond s'écrit
`color-mix(in oklab, <couleur> N%, var(--background))`. Jamais un aplat opaque, jamais une
valeur codée en dur par thème. C'est pour cette raison que le thème sombre ne redéfinit
presque rien : le grand tableau entier bascule sans une seule teinte réécrite.

**La règle du rouge qui tire.** Le rouge ne décore jamais. Il ne se pose que sur une force
qui tire : un montant qui retranche, un câble, un mât rompu, une section de dépenses, un
état dépassé, la commande qui engage. S'il apparaît ailleurs, ce n'est pas une variante,
c'est une faute.

**La règle de la densité, pas de la teinte.** Dans le grand tableau, les familles de
colonnes se distinguent par la densité d'un même carbone, pas par la couleur : données à
4 %, Balance à 9 %, les trois chaînes de solde à 14 %, les lignes de totaux à 20 %. La
section des revenus est du carbone dilué (6 %, total à 16 %) ; la section des dépenses est
le seul endroit du tableau où le rouge entre en fond (7 %, sous-total 13 %, total 20 %).
*Écart : les commentaires du grand tableau annoncent encore que « Balance et Solde gardent
leur ambre et leur bleu » ; les valeurs, elles, sont bien du carbone dilué.*

**La règle des cellules, pas des lignes.** Une teinte se pose sur chaque cellule, jamais
sur la ligne. Un fond de cellule recouvre celui de sa ligne : peinte sur la ligne, la
teinte de colonne disparaîtrait au survol et ne resterait visible que dans les trous.

## Typography

**Display Font:** Archivo (variable sur l'axe `wdth`, avec ui-sans-serif, system-ui)
**Body Font:** Archivo (même famille, à sa chasse normale)
**Label/Mono Font:** Azeret Mono (avec ui-monospace, "SF Mono")

**Character:** Deux fontes seulement, et aucune serif : rien ici n'est imprimé. Archivo est
variable sur l'axe de chasse — resserrée à `wdth 86`, elle prend le dessin d'une capitale
gravée sur plaque d'atelier sans avoir à charger une seconde fonte condensée ; à sa chasse
normale elle porte l'interface courante. Azeret Mono porte TOUT ce qui est chiffre, mesure
ou état : ses formes carrées viennent de la lecture d'instrument, et sa chasse fixe fait
que la virgule et les milliers tombent au même endroit d'une ligne à l'autre. Les deux
sont servies depuis l'application (next/font) : aucun appel réseau à l'exécution.
*Écart : le commentaire de la feuille de style annonce une chasse resserrée à 88 ; la
valeur réellement appliquée est 86.*

### Hierarchy
- **Display** (Archivo 700, `wdth 86`, 20 px, interlignage 1, interlettrage −0.01em) : le
  nom du produit dans la poutre, et les rares titres gravés. Jamais une donnée.
- **Title** (Azeret Mono 500, 12 px, interlettrage 0.09em, capitales) : le titre d'une
  plaque. Ce n'est pas une phrase, c'est une inscription.
- **Body** (Archivo 400, 14 px) : les libellés, les phrases explicatives, les noms de
  poste, les états vides.
- **Numeric** (Azeret Mono 500, 13 px, tabulaire) : les montants dans les tables. Les
  montants de tête de la bande de relevés montent à 17 px sur téléphone, 20 px à partir
  de 640 px, 24 px à partir de 1024 px — 17 px et non 20 px parce qu'à cette taille
  « −2 342,80 € » ne tient pas dans une demi-largeur d'écran de 390 px.
- **Label** (Azeret Mono 500, 10 px, interlettrage 0.09em, capitales) : l'étiquette gravée
  (`.chip`). Elle nomme un état, une colonne, une section — jamais une valeur.
- **Caption** (Azeret Mono 500, 10 px, interlettrage 0.11em, capitales, cendre assombri) :
  la légende posée au-dessus d'un montant ou en tête de colonne. Plus ouverte que
  l'étiquette, et sans fond : c'est une cote, pas une plaque.
- **Command** (Azeret Mono 500, 11 px, interlettrage 0.08em, capitales) : le texte de
  toute commande — boutons, onglets, destinations de la poutre.

### Named Rules

**La règle des deux rôles.** Archivo ne porte jamais un chiffre, un état ou une mesure.
Azeret Mono ne porte jamais une phrase. Il n'y a pas de troisième fonte, et il n'y aura
pas de serif : le jour où une donnée a besoin d'un caractère de titre, c'est la donnée qui
a été mal classée.

**La règle de la virgule alignée.** `font-variant-numeric: tabular-nums` est posé sur le
corps du document, pas sur les tableaux. Un montant isolé dans une phrase s'aligne donc
avec ses voisins d'une ligne à l'autre. Et tout montant s'aligne à droite, partout.

**La règle de la capitale gravée.** Tout ce qui est capitales est en Azeret Mono avec un
interlettrage ouvert (0.08em à 0.11em selon le rôle). Une capitale en Archivo non
resserrée n'appartient pas au système.

## Layout

L'application repose sur une poutre horizontale et non plus sur une colonne : un bandeau
de carbone de 52 px de haut, pleine largeur, qui porte le nom, les trois destinations, la
synchronisation, les notifications et le compte. Le choix est structurel — cette app se
lit horizontalement, mois après mois, et une barre latérale prenait 16 rem à des tableaux
qui en manquent. Les réglages et la déconnexion ne sont pas des destinations : ils vivent
sous le nom du compte.

Le shell tient dans l'écran (`h-svh`, débordement masqué) : c'est le contenu qui défile,
la poutre ne bouge jamais. Sous elle, le contenu s'empile en pleine largeur : le plan de
charge, puis la bande de relevés, puis les tables denses. La bande de relevés est une
grille de deux colonnes sur téléphone qui s'ouvre à autant de colonnes que de relevés à
partir de 1024 px ; un nombre impair laisse un orphelin, qui prend alors toute la largeur
plutôt que la moitié.

Le rythme est serré, par choix. La zone de contenu prend 12 px de gouttière horizontale et
16 px verticale sur téléphone, 24 px partout au-delà de 640 px. Les plaques ajoutent
12 px / 16 px sur téléphone et 20 px au-delà. Les cellules de tableau sont à 8 px
horizontal et 6 px vertical. Sur un écran de 375 px, des marges plus larges seraient prises
sur des colonnes de chiffres — c'est-à-dire sur ce qu'on vient lire.

Le panneau de détail est une colonne de 26 rem à droite, montée au niveau du shell et non
dans la page : la poutre et le contenu se rétrécissent quand il s'ouvre. En dessous de
1024 px il n'a plus la place d'être une colonne et s'ouvre par-dessus le tableau, à
`min(26rem, 100vw − 2rem)` — presque tout l'écran, sans jamais coller aux bords, parce que
le détail d'un calcul est une pile de montants alignés qu'un tiroir étroit rend illisible.

Deux points de rupture portent du sens. À 640 px (`sm`), les gouttières se desserrent,
l'état d'un poste remonte du dessous du nom vers sa propre colonne, la première colonne du
grand tableau passe de 176 px à 320 px, et les destinations de la poutre disent leur nom
court. À 1024 px (`lg`), les destinations prennent leur nom complet et le panneau de détail
pousse le contenu au lieu de le recouvrir.

**La règle du défilement plutôt que de l'écrasement.** Ce qui ne tient pas se fait
défiler horizontalement dans son propre conteneur : le plan de charge garde une largeur
minimale de 620 px, les tables ont leur `overflow-x`. Jamais on n'écrase des montants en
colonnes de deux lettres pour les faire entrer.

## Elevation & Depth

**Le système n'a aucune ombre.** Pas une seule `box-shadow` de relief dans le monde : ni
sur les plaques, ni sur les commandes, ni sur les champs. La profondeur vient de trois
choses, dans cet ordre : la découpe (une plaque se distingue du sol par ses angles coupés,
pas par une ombre portée), le filet d'un pixel qui suit cette découpe, et la masse — le
carbone de la poutre est ce qu'il y a de plus lourd à l'écran, et tout s'appuie dessus.

Le grain du béton renforce cette lecture : la dalle photographiée vit sur `<html>`, donc
DERRIÈRE tout le reste, en `background-size: 420px`, mélangée en `multiply` sur le béton
clair pour creuser le grain et en `soft-light` en lumière éteinte pour ne pas l'effacer.
Les plaques, elles, sont de la tôle peinte : lisses, sans grain. C'est cette différence de
matière qui décolle une plaque de son fond.

Les seuls `box-shadow` du système ne sont pas des ombres mais des traits, tous en `inset` :
`inset 0 0 0 1px var(--input)` dessine le contour de l'étiquette évidée, et
`inset 3px 0 0 0 var(--primary)` marque la ligne sélectionnée du panneau de détail. Une
ombre interne et non une bordure : une bordure décalerait le tableau d'un pixel à chaque
sélection. Le halo de mise au point clavier, lui, est un anneau de 2 px à la couleur de
tension.

### Named Rules

**La règle du zéro ombre.** Aucune surface ne se soulève. Si un élément a besoin de se
détacher, il prend une coupe et un filet, ou il change de matière — jamais une ombre.

## Shapes

**Il n'y a pas de rayon.** Les quatre pas du barème (`sm`, `md`, `lg`, `xl`) valent tous
`0px`, et c'est volontaire : la famille de formes est la coupe à 45°. Le chanfrein de base
mesure 9 px ; sur les commandes il tombe à 6 px. Le barème neutralisé fait plus qu'énoncer
une règle : il l'applique rétroactivement. Les primitives héritées qui écrivent encore
`rounded-md` ou `rounded-lg` (menus déroulants, listes de choix, tiroirs, squelettes de
chargement, panneau de détail) sortent carrées sans avoir été réécrites.
*Écart : `rounded-xs` n'est pas neutralisé et reste à 2 px — un seul emploi, le bouton de
fermeture du tiroir.*

Deux silhouettes, et elles se distinguent à l'œil :

- **La plaque** (`.plate`) : quatre angles coupés, cerclée d'un filet d'un pixel qui suit
  la coupe. C'est la forme des panneaux, cartes, bandes et sections.
- **La commande** (`.plate-cut` / `.cut`) : deux angles opposés coupés seulement — en haut
  à gauche et en bas à droite. C'est la forme des boutons, onglets et champs, et c'est ce
  qui permet de les distinguer d'un panneau sans autre signal.

Le filet d'un pixel ne peut pas être une `border` : une bordure CSS ignore `clip-path` et
resterait rectangulaire aux angles. La plaque est donc faite de **deux calques superposés**
en pseudo-éléments — le filet dessous à `inset: 0`, la surface un pixel à l'intérieur à
`inset: 1px`, tous deux découpés par le même `polygon()`. C'est la technique centrale du
système : toute nouvelle surface passe par `.plate` plutôt que de redessiner sa coupe.

Deux formes échappent au refus de l'arrondi, et seulement elles : les **nœuds** du plan de
charge (8 px) et les **pastilles ouvertes** d'annotation (7 px, contour d'un pixel), qui
sont des points de structure et non des surfaces. Un point d'appui est rond ; une plaque
ne l'est jamais.

**La règle de la coupe suivie.** Toute bordure d'une surface coupée doit suivre la coupe.
Si un contour reste rectangulaire aux angles, la forme est fausse — repasser par `.plate`.

## Components

### Buttons
- **Shape:** deux angles coupés à 6 px, aucun rayon, aucune ombre. Hauteur par défaut
  36 px, texte en capitales mono 11 px, interlettrage 0.08em.
- **Primary:** carbone plein, texte blanc de vide, 16 px de padding horizontal. Aux tailles
  qui portent du texte (`default` et `lg`), elle prend en plus le **trait oblique** — un
  filet rouge de 0,85 rem à −45° posé dans l'angle gauche, avec le padding gauche poussé à
  28 px (32 px en `lg`) pour lui laisser la place. C'est la marque de ce qui engage.
- **Hover / Focus:** la primaire passe au graphite en clair, à 85 % d'opacité en sombre.
  Au clavier, un anneau de 2 px à la couleur de tension.
- **Destructive:** rouge de tension plein, texte blanc, luminosité +10 % au survol,
  anneau de mise au point rouge lui aussi.
- **Outline / Secondary:** une plaque de commande — fond béton (outline) ou sourdine
  (secondary), filet d'un pixel. Au survol, le filet passe au trait fort.
- **Ghost:** rien au repos, sourdine au survol. C'est le bouton des barres d'outils et des
  actions de ligne.
- **Link:** encre de tension, casse normale, souligné au survol. La seule commande qui
  n'est pas en capitales.
- **Tailles:** 24 px (`xs`, actions posées dans une ligne), 32 px (`sm`), 36 px
  (`default`), 40 px (`lg`), plus quatre carrés d'icône seule aux mêmes hauteurs. Une
  icône seule ne prend jamais le trait oblique : il n'aurait pas la place et deviendrait
  un motif.

### Chips
- **Style:** pastille de carbone, capitales blanches en mono 10 px, interlettrage 0.09em,
  padding `0.34em 0.55em 0.3em`, aucun angle coupé — c'est une plaque gravée, trop petite
  pour porter un chanfrein.
- **États:** trois, et trois seulement. **Engagé** (carbone plein) est le défaut ;
  **dormant** (`chip-slack` : fond transparent, texte cendre assombri, contour d'un pixel)
  dit ce qui n'est pas encore engagé ; **rompu** (`chip-tension` : rouge de tension plein,
  texte blanc) est le seul chip rouge du système.
- **En sombre**, la pastille de carbone s'éclaircit à `#33323a`, sinon elle disparaîtrait
  dans le fond. Attention : cette règle est plus spécifique que les deux variantes, qui
  doivent donc être redites pour le thème sombre — sans quoi le dépassement cesse d'être
  rouge exactement là où il compte le plus.

### Cards / Containers
- **Corner Style:** quatre angles coupés à 9 px, aucun rayon.
- **Background:** tôle peinte, un cran plus clair que le sol, sans grain.
- **Shadow Strategy:** aucune (voir Elevation & Depth).
- **Border:** filet d'un pixel qui suit la coupe, via le double calque de `.plate`.
- **Internal Padding:** 20 px, 20 px de gouttière entre blocs internes ; 12 px horizontal
  et 16 px vertical sur téléphone pour les plaques du contenu.
- **Titre:** gravé en mono capitales 12 px, interlettrage 0.09em.

### Inputs / Fields
- **Style:** une plaque de commande évidée — deux angles coupés à 6 px, fond béton, filet
  d'un pixel, hauteur 36 px, padding `4px 12px`. Le texte reste à 16 px sous 768 px : en
  dessous, iOS zoome à la mise au point.
- **Focus:** le filet de la plaque passe au rouge de tension et un anneau de 2 px à 60 %
  d'opacité l'entoure. C'est le seul endroit où le rouge marque autre chose qu'une force
  qui tire — assumé : le champ actif est ce qui va engager une modification.
- **Error:** filet et anneau destructifs, déclenchés par `aria-invalid` et jamais par une
  classe posée à la main : l'état d'erreur est d'abord une information d'accessibilité.

### Navigation
La poutre : 52 px de haut, fond carbone, le nom « Plia » en Archivo resserrée 20 px gras,
puis un filet vertical de 24 px, puis les trois destinations. Chacune est une icône Lucide
de 16 px et son libellé en mono capitales 11 px, interlettrage 0.10em. La destination
courante prend le brillant de la poutre et **le repère d'appui** : un trait de tension de
2 px collé au pied du bandeau, là où la charge passe. À droite, la synchronisation, les
notifications et le menu du compte.

Sur téléphone, seule la destination courante dit son nom — trois libellés ne tiennent pas,
et trois icônes muettes ne disent pas où l'on est. Entre 640 px et 1024 px, les trois
portent leur nom court ; au-delà, leur nom complet.

Les **onglets** reprennent le même dessin à plus petite échelle : une rangée posée sur un
filet, hauteur 32 px, mono capitales 11 px, et celui qui porte la charge prend le trait de
tension de 2 px sous le pied.

### Tables
Le relevé, et c'est la forme du produit qui ne se discute pas : des lignes séparées par un
filet d'un pixel, des en-têtes gravés en capitales mono 10 px (interlettrage 0.10em,
cendre assombri, hauteur 32 px) posés sur un **filet fort** au carbone, et des montants à
droite en mono 13 px. Le survol d'une ligne prend la sourdine à 60 %. Un montant négatif
passe à l'encre de tension ; un montant à zéro passe au cendre assombri.

### Le panneau de détail
Une colonne de 26 rem à droite, qui s'ouvre au clic sur un montant et explique son calcul.
Elle est une **plaque claire** et non du carbone : elle a ses propres jetons (`--sidebar*`),
qui reprennent la tôle peinte et le filet, distincts de ceux de la poutre. La ligne
d'origine reste marquée tant que le panneau est ouvert, par un fond de carbone dilué à
18 % et un liseré interne de 3 px, y compris quand la souris passe ailleurs — le survol de
ligne ne doit pas éclaircir une sélection.

### Le plan de charge (composant signature)
La pièce maîtresse, et la seule image que l'application s'autorise. Un mât par mois planté
sur la ligne du zéro, dont la hauteur est le solde projeté à la fin de ce mois-là ; un
câble rouge pend d'un sommet à l'autre ; un mois passé sous zéro **traverse** le sol en
rouge — il dépasse au-dessus autant qu'il plonge en dessous, comme un poteau qui a percé
sa semelle.

Sa géométrie vit dans une bibliothèque testée, exprimée en pourcentages et jamais en
pixels : la ligne du zéro se pose au prorata mais bornée entre 55 % et 78 % dès qu'un mois
rompt, pour que la rupture garde au moins un cinquième de la hauteur et que ce qui porte
en garde au moins la moitié. Le câble pend d'une flèche proportionnelle à la portée
(42 % de la portée) : c'est ce qui le distingue d'une polyligne, et une polyligne serait
une courbe de tendance — ce que ce produit refuse.

Le dessin : sol au filet fort d'un pixel, coté « zéro » par une étiquette gravée à chaque
bout ; mâts de 3 px (carbone debout, tension rompu) ; nœuds de 8 px aux sommets, cerclés
d'un anneau de tension à 30 % quand ils sont rompus ; fils de rappel d'un pixel qui
tombent de chaque annotation jusqu'à son sommet, pour qu'aucun montant ne flotte au-dessus
de rien ; câble SVG de 2,5 px en `vector-effect: non-scaling-stroke`, tracé en coordonnées
relatives pour s'étirer avec la plaque sans épaissir. Hauteur 176 px sur téléphone, 224 px
au-delà de 640 px, largeur minimale 620 px.

**La marque de rupture** : là où un mât a percé le sol, le trait du sol est interrompu sur
22 px et deux obliques rouges de 2 px inclinées à 24° disent la cassure. Dessinée et non
photographiée — c'est un élément de plan, il doit rester net à toutes les largeurs. C'est
la seule chose de cet écran qu'on doit voir avant tout le reste.

**La règle du dessin qui ne porte rien de neuf.** Chaque montant projeté est écrit en
toutes lettres au-dessus de son mât. Retirez le dessin, les chiffres suffisent encore —
c'est la condition pour qu'il ait le droit d'être là.

### La mise en tension (le seul moment animé)
Une seule animation dans toute l'application, et elle n'arrive qu'une fois : à
l'ouverture, les mâts se lèvent du sol l'un après l'autre (620 ms, `cubic-bezier(0.16, 1,
0.3, 1)`, 70 ms de décalage par mât, mise à l'échelle verticale depuis le pied — depuis le
sommet pour un mât rompu), les nœuds se posent (360 ms, décalés de 120 ms après leur mât),
et le câble se tend d'un bout à l'autre (900 ms, après 160 ms) par un rideau de gauche à
droite en `clip-path: inset()`. C'est le geste propre à une structure en tenségrité : elle
se monte, elle ne surgit pas.

Le rideau plutôt qu'un tracé au pointillé (`stroke-dasharray`) : le dessin est étiré en
largeur et pas en hauteur, le navigateur calcule alors les tirets dans l'espace déformé et
le câble sort en morceaux. Sous `prefers-reduced-motion: reduce`, les trois animations
sont coupées net.

**La règle du seul mouvement.** Nulle part ailleurs il n'y a d'animation décorative. Une
colonne de chiffres qui bouge est une colonne qu'on relit.

### L'attente (le tirage et le fil de tension)
La seule exception à la règle du seul mouvement, et elle ne décore rien : elle dit qu'une
machine travaille. Toutes les pages de l'app relisent la base à chaque visite, et chaque
modification fait recalculer l'écran entier côté serveur. Une à deux secondes pendant
lesquelles, sans repère, on croit que le clic n'a pas pris.

**Le tirage** (`.tirage`) tient la place d'une valeur qui n'est pas encore arrivée : une
barre de voile à 15 %, carrée comme tout le reste, posée à l'emplacement exact et à la
largeur approximative de ce qui la remplacera. Elle respire lentement — 1 600 ms, de 1 à
0,42 d'opacité — parce qu'une barre parfaitement immobile se lit comme un écran gelé,
c'est-à-dire le contraire de ce qu'elle doit dire. Les squelettes d'écran (`loading.tsx`)
en sont faits : ils dessinent la structure RÉELLE de leur page, jamais une grappe de
rectangles génériques, pour que l'arrivée des chiffres ne déplace rien.

**Le fil de tension** (`.fil-tension`) court sous la poutre tant qu'une écriture n'est pas
retombée à l'écran : un segment rouge de 32 % de large, 1 050 ms par passage. Il ne mesure
rien — personne ne sait combien de temps ça prendra — il dit seulement qu'une force
travaille quelque part. C'est le rouge dans son rôle : une traction en cours. Sa gouttière
de deux pixels reste là même au repos, sans quoi chaque enregistrement décalerait l'écran
d'un cran.

Pendant ce temps, le tableau concerné passe sous un **voile d'attente** : ses chiffres
s'éteignent d'un cran et cessent de répondre au clic. Ils restent lisibles — on ne cache
pas un montant — mais on n'ouvre pas le détail d'une case qui va changer dans la seconde.

Sous `prefers-reduced-motion: reduce`, le tirage devient une barre pleine et le fil un
câble tendu d'un bord à l'autre : les deux disent encore ce qu'ils ont à dire, sans le
mouvement.

## Do's and Don'ts

### Do:
- **Do** écrire toute teinte de fond en `color-mix(in oklab, <couleur> N%, var(--background))`, pour qu'elle suive le thème sans redéfinition.
- **Do** passer toute nouvelle surface par `.plate` (quatre angles) ou `.plate-cut` (deux angles) plutôt que de redessiner une coupe.
- **Do** poser les teintes sur les cellules, jamais sur les lignes.
- **Do** garder tout chiffre en Azeret Mono, tabulaire et aligné à droite, même isolé dans une phrase.
- **Do** réserver le rouge à une force qui tire : montant négatif, câble, rupture, dépassement, section de dépenses, commande qui engage.
- **Do** n'utiliser que les quatre états de la structure — acquis, engagé, attendu, dépassé — avec les mêmes mots partout.
- **Do** laisser l'état d'erreur découler de `aria-invalid`, pas d'une classe posée à la main.
- **Do** garder 16 px de corps sur les champs de saisie en dessous de 768 px.
- **Do** faire défiler horizontalement ce qui ne tient pas, plutôt que d'écraser des colonnes de chiffres.
- **Do** redire les variantes de `.chip` dans le thème sombre : la règle sombre est plus spécifique et leur reprendrait leur couleur.
- **Do** laisser le barème de rayon à `0px` : c'est lui qui rend carrées les primitives héritées sans qu'on ait à les réécrire.
- **Do** marquer une sélection par une ombre interne (`inset 3px 0 0 0`) et jamais par une bordure, qui décalerait le tableau.
- **Do** donner un `loading.tsx` à tout écran ajouté sous `/app`, et lui faire dessiner la structure réelle de sa page.
- **Do** faire passer toute écriture par la mise à jour partagée (`useMiseAJour`), pour qu'elle allume le fil de tension et garde sa commande éteinte jusqu'à ce que les nouveaux chiffres soient à l'écran.

### Don't:
- **Don't** ajouter un rayon, nulle part. Le barème vaut `0px` sur ses quatre pas, et la seule exception ronde est le nœud de structure.
- **Don't** ajouter une ombre portée. Le relief vient de la coupe, du filet et de la matière.
- **Don't** teinter les fonds de colonnes du grand tableau. Ils se font au voile, un gris neutre sans chroma : les deux seules couleurs du tableau doivent se voir sans effort.
- **Don't** introduire une troisième couleur, ni l'ambre. Il n'y a que deux forces, le portant et la tension, et un montant ne se juge pas bon ou mauvais.
- **Don't** poser le rouge sur autre chose qu'une force qui tire — pas de titre rouge, pas d'icône rouge, pas de fond rouge décoratif.
- **Don't** ajouter une animation décorative. Il n'y a que deux familles de mouvement : la mise en tension du plan de charge, une fois à l'ouverture, et l'attente (le tirage, le fil de tension), qui dit qu'une machine travaille.
- **Don't** introduire une troisième fonte, et surtout pas une serif : rien ici n'est imprimé.
- **Don't** utiliser une `border` CSS pour cercler une surface coupée : elle ignore `clip-path` et ressort rectangulaire aux angles.
- **Don't** poser le grain de béton ailleurs que sur `<html>`. Les plaques sont de la tôle peinte, lisse.
- **Don't** ajouter un graphique décoratif — camembert, jauge, dégradé, courbe de tendance. Le câble n'est pas une courbe : il pend.
- **Don't** confondre les jetons de la poutre (`--beam*`) avec ceux du panneau de détail (`--sidebar*`) : la poutre est du carbone, le panneau est une plaque claire.
