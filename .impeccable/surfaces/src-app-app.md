---
version: 1
slug: "src-app-app"
primary_target: "src/app/app"
related_targets: ["src/components/app-topbar.tsx", "src/components/app-page-heading.tsx", "src/app/app-theme.css"]
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

## Contrat d’interaction mobile

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


## Moyens et validation
Les surfaces et contrastes viennent de `src/app/app-theme.css`, avec les composants
existants du relevé. Le titre partagé utilise `src/components/app-page-heading.tsx`.
Les icônes restent celles du produit. Aucune nouvelle image n’est ajoutée au relevé.

Les aperçus de refonte utilisent des données fictives. Ce document décrit le code
implémenté ; il ne constitue pas un verdict de revue ni une validation sur un compte
bancaire réel. Les captures et résultats de contrôle vivent dans `.impeccable/review/`.
