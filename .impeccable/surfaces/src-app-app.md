---
version: 1
slug: "src-app-app"
primary_target: "src/app/app"
related_targets: ["src/components/app-topbar.tsx", "src/components/app-page-heading.tsx", "src/app/app-theme.css", "src/components/history-treasury.tsx", "src/components/history-treasury.css", "src/components/history-reading.tsx", "src/components/history-reading.css", "src/components/history-grid.tsx", "src/components/history-mobile-columns.tsx", "src/components/history-comparison.tsx", "src/lib/history-columns.ts"]
---

## Portée
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
Menthe, forêt et corail, marque et titres Bricolage, données et commandes Schibsted,
cartes opaques de 16 px et capsules. Le titre et une phrase courte ouvrent chaque page.
Deux courbes fines, statiques et décoratives le bordent sur ordinateur et disparaissent
sur téléphone. La lecture financière garde sa structure.

## Composition et adaptation
La barre produit repose sur le fond de l’application, sans séparation lourde. Les
choix de navigation occupent une capsule, avec une destination active contrastée.
Le contenu dispose de marges de 32 px, puis 16 px sous 640 px, sur 1600 px maximum.
Chaque écran conserve ses limites internes de largeur.

Si un panneau réduit la largeur disponible à 1050 px ou moins, la navigation passe
sur une seconde ligne dès 640 px de largeur d’écran. Les outils gardent leurs icônes,
compteurs et noms accessibles ; seuls leurs libellés visuels se retirent. Sur téléphone,
les commandes tactiles conservent leurs dimensions et leur ordre fonctionnel.

Le thème est appliqué au document lorsque l’espace de travail est présent : menus,
notifications et panneaux rendus à l’extérieur du conteneur héritent de la palette.
Les contrôles natifs suivent le mode sombre et les commandes menthe utilisent une
encre sombre. Les filtres d’opérations gardent des libellés visibles pendant la saisie.

## Structure financière conservée
Le grand tableau à colonnes de mois reste la présentation sur ordinateur. Sa colonne
de noms figée, ses familles de colonnes, les bandes revenus/dépenses et les soldes
contrastés conservent leur rôle. Sur mobile, « Par mois » et « Comparer » gardent les
sections verticales et leurs choix d’indicateurs. Les revenus restent verts, les dépenses
rouges et les soldes sombres, jusque dans leurs panneaux, dans les deux thèmes.

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
pour une prévision. Les étapes mobiles et le pied entier (résultat, estimation et
dépassement total) gardent un fond sombre dans les deux thèmes, avec la sélection
préservée. Les montants restent cliquables et conservent leurs références
pour le détail et la calculatrice.

## Lecture des enveloppes — mise à jour du 15 septembre 2026

Le brief `docs/superpowers/specs/2026-09-15-tableau-guide-design.md` précise la lecture
prévision → opérations → résultat, en mode Operate. Les en-têtes Attendu et Reçu
expliquent les revenus. Les dépenses suivent « Budget », « − Dépensé »,
« + Remboursements / apports », « = Reste / manque », chacun avec une courte explication.
Sur ordinateur, ces quatre colonnes occupent 7 + 7 + 9 + 9 rem ; Attendu et Reçu
occupent 7 rem chacun, suivis de 18 rem libres pour aligner la trésorerie.
Chaque parcours de trésorerie conserve ses 10,5 rem.

La reprise des espacements utilise 4 / 8 / 12 / 16 / 24 / 32 px, sans changer
les couleurs. Les cellules ont 12 px de marge intérieure et un alignement
vertical commun ; les lignes d’enveloppes mesurent au moins 80 px. Les noms
occupent 320 px, ou 256 px entre 640 et 1023 px. Les titres réservent deux lignes
avant leur explication. Le mois mesure au moins 96 px, les sections s’écartent
de 24 px, les détails dépliés regroupent leurs éléments avec 12 px d’écart.
Sur mobile : retraits latéraux de 16 px, lignes de montants d’au moins 48 px,
8 px autour des boutons de section de 44 px. Ces rôles sont définis dans
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
absentes. Le panneau reprend le fond
vert, rouge ou noir du bloc. Le repli et l’ajout restent des actions indépendantes.
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
mois sans indicateur applicable sont nommés, sans montant inventé. Le total suit
le choix de sa section, même repliée, et les montants restent cliquables.
Les trois choix sont conservés au changement de période et lors des allers-retours
entre « Par mois » et « Comparer ». Les anciens liens avec `mobileMetric` restent
compatibles. Les jetons et les couleurs de section sont conservés.

Le grand tableau reste la présentation sur ordinateur. Les mêmes cellules et
actions servent les deux dispositions ; leurs index ne sont pas recalculés au
changement du mois consulté. Les références sont liées au compte et à la période.
Le détail remplit la largeur du téléphone ; sélectionner un terme referme le
panneau et révèle sa destination. L’ajout à la calculatrice dispose d’un bouton.


## Moyens et validation
Les surfaces et contrastes viennent de `src/app/app-theme.css`, avec les composants
existants du relevé. Le titre partagé utilise `src/components/app-page-heading.tsx`.
Les icônes restent celles du produit. Aucune nouvelle image n’est ajoutée au relevé.

Les preuves finales utilisent les vrais composants avec des données fictives :
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
