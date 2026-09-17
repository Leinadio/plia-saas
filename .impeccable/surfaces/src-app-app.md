---
version: 1
slug: "src-app-app"
primary_target: "src/app/app"
related_targets: ["src/components/app-topbar.tsx", "src/components/app-page-heading.tsx", "src/app/app-theme.css", "src/components/history-treasury.tsx", "src/components/history-treasury.css", "src/components/history-reading.tsx", "src/components/history-reading.css", "src/components/history-grid.tsx", "src/components/history-surfaces.css", "src/components/history-mobile.css", "src/components/history-section-heading.css", "src/components/history-mobile-columns.tsx", "src/components/history-comparison.tsx", "src/lib/history-columns.ts"]
---

## Palette commune approuvée — 16 septembre 2026

Cette révision chromatique fait autorité ; les revues antérieures ci-dessous
restent des traces historiques. Blanc majoritaire en clair ; graphite neutre en sombre. Eucalyptus pour
les actions et revenus, bleu brume pour les dépenses, pêche douce pour les filtres,
le contexte et les courbes. Textes et trésorerie anthracite, cellules gris neutre.
Les mêmes rôles s’appliquent à l’application, à la landing, à Pour qui et à la connexion.
Formes, fontes, espacements, photos, textes et parcours sont conservés.
Source : `src/app/palette.css`. Brief : `docs/design/2026-09-16-harmony-colors-shape.md`.
Revue indépendante finale : **ship**, sans défaut matériel pour cette passe couleur.
La carte QUALITY BAR était indisponible ; ce verdict ne constitue pas un audit
global d’accessibilité ou d’ergonomie. Revue et preuves :
`.impeccable/review/harmony-colors-finish-review.md` et
`.impeccable/review/harmony-colors-validation.md`.


## Portée

### Règles automatiques — ajout du 17 septembre 2026

« Automatisation » ouvre la gestion des rattachements automatiques par libellé et montant.
La liste ordonnée, le formulaire critères → budget et l’aperçu explicite de
l’historique reprennent le monde établi, blanc en clair et forêt en sombre.
Chaque rattachement rejoint la cloche avec les dépassements. Le [brief dédié](src-app-app-automatisations.md)
décrit les parcours, les états, l’adaptation mobile et les limites des preuves.

### Contact — ajout du 16 septembre 2026

« Nous contacter » dans le menu du compte ouvre `/app/contact`. Le formulaire
partagé avec l’accueil demande e-mail, sujet et message ; l’adresse du compte
est préremplie et modifiable. Une personne non connectée rejoint la connexion.
La page reprend les surfaces blanches ou graphite, les titres Bricolage et les
commandes Schibsted, avec une action eucalyptus. Aucun montant ni aucune opération
n’accompagne le message. Le [brief dédié](src-app-app-contact.md) décrit le parcours,
les états et les preuves. L’envoi reste désactivé jusqu’à la configuration d’e-mail ;
la revue porte sur les composants réels avec une session de démonstration et des
réponses simulées, sans e-mail réel ni déploiement.

### Périmètre général
L’application connectée : budget, historique, transactions, réglages et compte.
L’accueil redirige vers l’historique. La connexion partage la même identité ; son
cadrage vit dans `src-app-connexion.md`. Les pages publiques gardent leurs briefs.

## Mode du visiteur
Operate. Une personne seule ou en couple consulte son budget personnel sur ordinateur
ou téléphone pour comprendre les dépenses et préparer les prochains mois. Les données
et les actions doivent rester immédiatement lisibles. Ce contexte n’implique pas un
compte partagé.

## Direction retenue
« La lumière en mouvement », adaptée de la landing à un espace de travail quotidien.
Blanc, eucalyptus, bleu brume et pêche, marque et titres Bricolage, données et commandes Schibsted,
cartes opaques de 16 px et capsules. Le titre et une phrase courte ouvrent chaque page.
Les deux courbes décoratives du titre ont été retirées à la demande de l’utilisateur
le 17 septembre 2026. La lecture financière garde sa structure.

## Composition et adaptation
La barre produit repose sur le fond de l’application, sans séparation lourde. Les
choix de navigation occupent une capsule, avec une destination active contrastée.
Le contenu dispose de marges de 32 px, puis 16 px sous 640 px, sur 1600 px maximum.
Chaque écran conserve ses limites internes de largeur.

Si un panneau réduit la largeur disponible à 1050 px ou moins, la navigation passe
sur une seconde ligne dès 640 px de largeur d’écran. Les outils gardent leurs icônes,
compteurs et noms accessibles ; seuls leurs libellés visuels se retirent. Sur téléphone,
les commandes tactiles conservent leurs dimensions et leur ordre fonctionnel.

Le thème et la palette commune sont appliqués au document : menus, notifications
et panneaux rendus à l’extérieur du conteneur héritent des mêmes rôles.
Les contrôles natifs suivent le mode sombre « Anthracite et sable » et les commandes sable utilisent une
encre sombre. Les filtres d’opérations gardent des libellés visibles pendant la saisie.

## Structure financière conservée
Le grand tableau à colonnes de mois reste la présentation sur ordinateur. Sa colonne
de noms figée, ses familles de colonnes et les soldes contrastés conservent leur rôle.
Les titres et totaux distinguent revenus menthe et dépenses bleu brume. Sur mobile,
« Par mois » et « Comparer » gardent les sections verticales et leurs indicateurs.
Le relevé sépare données claires et trésorerie gris neutre, avec en-têtes et bilan anthracite. Les panneaux
mobiles gardent leurs repères vert pour les revenus, bleu pour les dépenses et sombre
pour les soldes ; ils suivent les mêmes rôles que le tableau.

Créer et gérer une enveloppe ou une sous-enveloppe, corriger un budget daté, classer
une opération, l’exclure, la commenter et ouvrir un calcul gardent leurs parcours.
La jauge conserve sa géométrie : le dépassement se lit au-delà de la part budgétée.
Le budget, le dépensé et le reste sont toujours écrits à côté.

## Trésorerie étape par étape — réalisation du 15 septembre 2026

Évolution locale du relevé, selon le brief approuvé
`docs/superpowers/specs/2026-09-15-tresorerie-design.md`. L’identité et les trois
calculs sont conservés. L’explication « Votre trésorerie, étape par étape » apparaît
une seule fois en tête du relevé. Sur ordinateur, elle introduit les colonnes « Opérations réelles »,
« Selon vos budgets » et « Dépassements inclus », guidées par un filet vertical.
Le réel des mois futurs est nommé « Estimation prolongée » ; ce parcours ne suppose
aucune opération future connue.

Chaque étape affiche d’abord le mouvement net signé, « ajoutés » ou « retirés »,
puis « = », le montant restant avec son propre signe et « restants à cette étape »
ou « à découvert ». Ces étapes suivent l’ordre des enveloppes, pas les dates des
opérations. Les dépenses intégralement remboursées gardent leurs cases de trésorerie
vides ; un mouvement réel qui aboutit à zéro affiche zéro.

Après les enveloppes, « Votre trésorerie » distingue « Trésorerie actuelle » et
« Dernière synchronisation », « Trésorerie en fin de mois » et « Opérations connues »,
puis les prévisions selon les budgets ou avec dépassements. Un résultat négatif
porte aussi « À découvert » pour le réel passé ou courant, ou « Découvert prévu »
pour une prévision. Le pied entier (résultat, estimation et dépassement total)
reste anthracite dans les deux thèmes, avec la sélection préservée. Les étapes mobiles
utilisent une surface gris neutre séparée du titre teinté, selon la palette locale
ci-dessous. Les montants restent cliquables et conservent leurs références
pour le détail et la calculatrice.

## Lecture des enveloppes — mise à jour du 15 septembre 2026

Le brief `docs/superpowers/specs/2026-09-15-tableau-guide-design.md` précise la lecture
prévision → opérations → résultat, en mode Operate. Les en-têtes Attendu et Reçu
expliquent les revenus. Les dépenses suivent « Budget », « − Dépensé »,
« + Remboursements / apports », « = Reste / manque », chacun avec une courte explication.
Sur ordinateur, ces quatre colonnes occupent 7 + 7 + 9 + 9 rem ; Attendu et Reçu
occupent 7 rem chacun, suivis de 18 rem libres pour aligner la trésorerie.
Chaque parcours de trésorerie conserve ses 10,5 rem.

La reprise des espacements utilise 4 / 8 / 12 / 16 / 24 / 32 px. Les cellules ont 12 px de marge intérieure et un alignement
vertical commun ; les lignes d’enveloppes mesurent au moins 80 px. Les noms
occupent 320 px, ou 256 px entre 640 et 1023 px. Les titres de colonnes des sections
réservent deux lignes, puis 8 px avant leur explication. Le mois mesure au moins
96 px, les sections s’écartent de 24 px, les détails dépliés regroupent leurs
éléments avec 12 px d’écart.
Sur mobile : retraits latéraux de 16 px, lignes de montants d’au moins 48 px,
boutons de section de 44 px. Ces rôles sont définis dans
`src/components/history-layout.css` et les feuilles locales de lecture/mobile.

Le reste est plus fort visuellement. Sa mention décrit le vrai montant du modèle
(`MonthCell.balance`) : encore disponibles, de dépassement, budget utilisé,
entièrement remboursé, d’excédent reçu ou budget à venir. Une réservation terminée
porte « Budget clôturé après remboursement ». Les totaux Dépensé et Remboursements /
apports additionnent les montants bruts des lignes, comme Reçu côté revenus ; le détail
au clic reprend ces sommes et nomme les budgets clôturés dans le calcul du reste.
Les prévisions ne changent pas. Sur téléphone, les libellés gardent le même ordre
et les opérateurs décoratifs, sans changer les noms accessibles. Les trois choix
de comparaison restent indépendants.

## En-têtes ouverts — réalisation du 15 septembre 2026

Le brief `docs/superpowers/specs/2026-09-15-entetes-ouverts-design.md` fixe les titres
toujours ouverts. Sur ordinateur, titre de niveau 2 Bricolage de 20 px, sous-titre
et ajout occupent la gauche ; les colonnes expliquées occupent la droite.
Le contrat courant ci-dessous fixe leurs groupes et couleurs. La largeur de 32 rem
et les calculs sont conservés.

Revenus et dépenses restent visibles sur ordinateur et téléphone, sans chevron
ni action sur le titre. Les enveloppes et sous-enveloppes restent dépliables ;
une opération visée depuis un calcul est toujours révélée. Sur mobile, le titre
mesure 18 px, sans sous-titre, avec 16 px de retrait ; les actions de 44 × 44 px
restent à droite. En comparaison, le titre garde l’indicateur courant. Les filtres
et formulaires conservent leurs panneaux colorés et le mois ciblé.
La présentation vit dans `src/components/history-section-heading.css`.

## Fonds du relevé — en-têtes précisés le 16 septembre 2026

La structure de `docs/superpowers/specs/2026-09-15-table-palette-design.md`,
avec les couleurs approuvées le 16 septembre dans le brief commun, sépare deux lectures. À gauche, les données d’enveloppe reposent sur blanc frais,
graphite en sombre ; titres et totaux sont menthe pour les revenus, bleu brume pour les
dépenses. À droite, une surface gris neutre continue relie les trois parcours de trésorerie,
cases vides comprises, sous des en-têtes anthracite. À gauche, les titres et les deux
rangées d’en-tête côté enveloppe sont menthe pour les revenus, bleu brume pour les
dépenses, y compris les groupes et cellules vides, sur tous les mois. La trésorerie
conserve son texte clair sur anthracite.
Les groupes portent « Ce revenu » ou « Cette enveloppe », puis « Trésorerie après
ce revenu » ou « Trésorerie après cette enveloppe ». Le titre de section occupe
les deux rangées d’en-tête (`rowSpan={2}`), sans bande vide.

Les opérations ouvertes utilisent un léger creux neutre. Le reste garde un support
neutre et le résultat de trésorerie un support gris neutre, même négatifs. Aucun fond rouge
dans le relevé : signes, texte coloré et mentions explicitent les alertes.
Les retraits ordinaires restent discrets ; les entrées gardent leur vert sémantique.
Sur mobile, titre teinté et étape de trésorerie gris neutre restent séparés ; les noms
reprennent une teinte légère de leur section. L’argent de départ utilise détail ;
l’introduction, le mois et le bilan restent anthracite. Sur ordinateur, introduction et
mois extérieurs gardent le fond de carte existant.

Les alias `history-*` de `src/components/history-surfaces.css` reprennent les
rôles communs de `src/app/palette.css`.
Le survol distingue enveloppe et trésorerie ; la sélection garde son filet intérieur
sarcelle et rend transparent le support interne du montant. Panneaux, thème global,
calculs, sections ouvertes, largeurs et cibles mobiles de 44 × 44 px sont conservés.

## Contrat d’interaction mobile

### Vue d’ensemble sur téléphone — mise à jour du 15 septembre 2026

Sous 640 px, le relevé présente un mois verticalement : introduction au parcours,
argent de départ, revenus, dépenses, puis résultat et estimation. Les postes restent
dépliables, avec montants libellés et commandes tactiles visibles. « Comparer » place
la période commune en tête et présente ensemble « Ce qui rentre » et « Ce qui
sort ». Chaque titre indique le choix courant, par exemple « Ce qui sort · Dépensé ».
Le bouton avec une icône de filtre ouvre un panneau en bas de l’écran : une explication par indicateur,
le choix courant coché, fermeture après le choix et retour du focus au bouton.
Fermer sans choisir conserve l’indicateur. Les revenus proposent « Attendu » et
« Reçu » ; les dépenses « Budget », « Dépensé », « Reste » et « Remboursements » ;
la trésorerie « Opérations réelles », « Selon vos budgets » et « Dépassements inclus ».
Son filtre reste dans l’introduction en haut. Il choisit le parcours ajouté aux
montants des revenus et dépenses, sans remplacer leurs indicateurs respectifs.
En vue mensuelle, ce parcours suit les opérations réelles pour un mois passé ou
courant, et les budgets pour un mois futur. Les étapes sans mouvement net restent
absentes. Le panneau conserve son repère financier
vert, bleu ou sombre, indépendamment du papier des données. Le titre n’est pas un bouton ; filtre et ajout
gardent leurs commandes propres.
Les icônes du relevé ont une taille de 18 px dans des boutons de 44 × 44 px.
Les « + » et crayons sont sans fond ni bordure, et sans libellé visible. Dans les
deux vues mobiles, les ajouts d’enveloppes, de revenus et de sous-enveloppes,
ainsi que leur gestion, réutilisent le panneau du bas du filtre. Les formulaires
gardent le mois consulté et le parent choisi, puis rendent le focus au bouton
d’origine à la fermeture. La gestion sur ordinateur garde ses parcours.
Le solde réel du mois courant porte son estimation
cliquable juste dessous, sans deuxième liste de mois. Les estimations visées
depuis un calcul sont révélées sous le mois correspondant. Le bloc d’ouverture porte
le titre « Argent de départ ». Chaque poste aligne ses mois verticalement ; les
mois sans indicateur applicable sont nommés, sans montant inventé. Le total reste
visible et suit le choix de sa section ; les montants restent cliquables.
Les trois choix sont conservés au changement de période et lors des allers-retours
entre « Par mois » et « Comparer ». Les anciens liens avec `mobileMetric` restent
compatibles. Les panneaux gardent leurs couleurs ; les fonds du relevé suivent
le contrat courant décrit ci-dessus.

Le grand tableau reste la présentation sur ordinateur. Les mêmes cellules et
actions servent les deux dispositions ; leurs index ne sont pas recalculés au
changement du mois consulté. Les références sont liées au compte et à la période.
Le détail remplit la largeur du téléphone ; sélectionner un terme referme le
panneau et révèle sa destination. L’ajout à la calculatrice dispose d’un bouton.


## Moyens et validation
Les couleurs viennent de `src/app/palette.css` ; `src/app/app-theme.css` adapte
leurs rôles à l’application. Les surfaces locales du relevé viennent
de `src/components/history-surfaces.css`, avec les composants existants. Le titre partagé utilise `src/components/app-page-heading.tsx`.
Les icônes restent celles du produit. Aucune nouvelle image n’est ajoutée au relevé.

### Revues antérieures : lecture et en-têtes

Les preuves de la passe de lecture utilisent les vrais composants avec des données fictives :
`.impeccable/review/reading-desktop-expense.png`, `reading-desktop-dark-expense.png`,
`reading-mobile-expense.png`, `reading-mobile-dark-compare.png` et
`reading-mobile-detail.png`, dans le même dossier. Ces cinq captures et neuf autres
ont été revues indépendamment. La revue complète a trouvé un seul défaut P2 :
le fond et le contraste du pied en thème sombre. Le verdict « ship » confirme
uniquement sa résolution ; cette dernière passe n’est pas un second audit complet.
Le montant du dépassement atteint 8,24:1 selon
`/private/tmp/planora-table-footer-contrast.json`.

Après correction, 1 150 tests réussissent dans 117 fichiers, contre une base initiale
de 1 144 tests (`/private/tmp/planora-table-tests.log`). Le build de production et le
lint réussissent (`/private/tmp/planora-table-build.log` et
`/private/tmp/planora-table-lint.log`, fins confirmées par l’agent principal).
Le contrôle `/private/tmp/planora-table-design-check.json` retourne `[]`.
Les routes temporaires sont supprimées ; la route de capture répond 404.
La passe documentaire lit ces preuves sans relancer les vérifications applicatives.
Ces validations ne portent pas sur un compte bancaire réel.

Pour les en-têtes ouverts, les 11 captures `section-*.png` ont été inspectées lors
de la revue indépendante, dont `section-desktop.png`, `section-dark.png`,
`section-mobile.png` et `section-mobile-dark-compare.png`. Verdict « ship », sans
défaut matériel dans cette refonte locale ; ce n’est pas une certification de
toute l’application. Les largeurs 1600 / 2048 / 980 / 390 / 320 px ne présentent
ni erreur de navigateur ni débordement du document ; les fonds d’en-tête sont
uniformes par thème et les commandes mobiles mesurent 44 × 44 px.
Les preuves de l’agent principal confirment 55 tests ciblés puis 1 150 tests dans
117 fichiers réussis, lint et build réussis. Elles vivent dans
`/private/tmp/planora-section-header-{tests,lint,build}.log` et
`/private/tmp/planora-section-heading-browser.json` ;
`/private/tmp/planora-section-header-design-check.json` retourne `[]`.
La route temporaire a été retirée avant le build. Cette passe documentaire lit
les sources, journaux et captures existants, sans relancer les contrôles.


### Revue du 15 septembre : couleurs et groupes de colonnes

Verdict indépendant « ship » : contrat et qualité visuelle validés, sans défaut
matériel sur les couleurs et groupes de colonnes. Le réviseur a ouvert les deux
captures utilisateur et les 18 captures finales `zones-*.png` de `.impeccable/review/`.
Données fictives : mois courant et futur, remboursement intégral neutre, remboursement
partiel laissant 30 € disponibles et long libellé. Aucun contrôle relancé par le réviseur.

L’agent principal confirme 1 150 tests dans 117 fichiers avant (23,08 s) et après
(38,24 s), échec observé sur les groupes absents, puis 47 tests ciblés réussis ; lint
et build réussis (exit 0). Journaux `/private/tmp/planora-table-zones-{baseline,red,targeted,tests,lint,build}.log`.
Le rapport `/private/tmp/planora-table-zones-browser.json` couvre 1600/390 px clair
et sombre, puis 2048/980/320 px clair : aucune erreur navigateur ni débordement du
document ; contrastes échantillonnés ≥ 5,35:1 clair / 5,20:1 sombre, icônes 44 × 44 px,
survol distinct et sélection sarcelle. Route temporaire retirée avant le build.
Cette passe documentaire valide uniquement son JSON ; la revue ne constitue pas
une certification globale d’accessibilité.

### Vérification antérieure à cette palette — en-têtes du 16 septembre
Contrôle direct sur les vrais composants : vert ou bleu côté enveloppe, forêt côté
trésorerie, cellules vides et tous les mois compris, sur sept formats et deux thèmes.
Deux captures de bureau `treasury-header-restore-*.png` inspectées. Aucun débordement
ni erreur navigateur ; contrastes échantillonnés ≥ 5,35:1 clair / 5,20:1 sombre.
Les 1 150 tests passent avant et après. Route temporaire retirée. Preuves :
`/private/tmp/planora-table-treasury-header-restore-browser.json` et
`/private/tmp/planora-treasury-header-restore-tests-final.log`.

### Protection contre le chevauchement — 17 septembre 2026

La barre ne compresse plus les onglets sous leur contenu. Jusqu’à 1600 px de
largeur disponible dans l’espace de travail, la marque et les outils occupent
la première ligne ; les destinations occupent une seconde ligne centrée.
Au-delà, le retour à la ligne reste possible si les outils et leurs compteurs
prennent davantage de place. Les outils peuvent également se répartir dans
leur propre zone quand le panneau latéral est ouvert. Le comportement mobile
avec libellés complets et cibles de 44 px est conservé.

Le contrôle navigateur mesure les intersections entre marque, navigation et
outils, ainsi que le débordement des liens hors de leur propre conteneur :
le seul dépassement de la page ne suffisait pas à détecter le défaut fourni
par l’utilisateur. Quatorze cas contrôlés de 320 à 2048 px, dont des espaces
de travail de 800 et 520 px dans une fenêtre de 1440 px, avec compteurs visibles.
Preuves : `.impeccable/review/header-overlap-*.png`.
