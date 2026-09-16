---
version: 1
slug: "src-app-connexion"
primary_target: "src/app/connexion/page.tsx"
related_targets: ["src/app/app-theme.css"]
---

## État courant — Google, 17 septembre 2026

La préférence utilisateur pour le vert forêt (`#102b24`) en sombre remplace le
graphite de la passe couleur consignée plus bas. Le clair reste blanc. Cette note
fait autorité pour la surface ; les décisions antérieures sont conservées comme
historique, sans révision du système global.

La tâche étend l’écran existant, en mode Operate et réalisation en code : ajouter
« Continuer avec Google » à la connexion comme à l’inscription, au-dessus du
séparateur « ou avec ton adresse e-mail ». La composition, l’image, les polices
Planora et le parcours e-mail existants restent la base. Aucune nouvelle direction,
carte QUALITY BAR comparative ou sélection de concept n’était nécessaire.

Le bouton Google garde son identité officielle : fond blanc dans les deux thèmes,
bordure `#747775`, texte `#1f1f1f`, Arial et logo vectoriel officiel servi localement.
Ces couleurs et cette police sont des exceptions limitées au bouton. Il occupe
toute la largeur, conserve la forme capsule et une hauteur minimale de 48 px.
Le focus reprend la couleur d’action Planora. Aucun appel Google ne précède le clic.

Sans les deux identifiants serveur, le bouton est désactivé et le texte propose
l’adresse e-mail. Quand ils sont renseignés, la première connexion crée le compte,
les suivantes retrouvent le même compte et ouvrent l’application. Pendant l’attente,
le libellé devient « Redirection vers Google… » ; les actions de connexion et la
bascule du formulaire sont bloquées pour éviter les doubles demandes. Le retour
par l’historique du navigateur rétablit ces commandes. Annulation et erreur ramènent
un message français accessible et permettent de réessayer, sans afficher le texte
brut du fournisseur.

Google demande seulement l’identité de base. Les secrets restent côté serveur et
les jetons d’accès et de renouvellement enregistrés sont chiffrés. Les comptes e-mail non vérifiés ne sont pas
associés silencieusement ; leur mot de passe reste utilisable. Aucun écran
d’association de comptes ni parcours de création de mot de passe n’est ajouté.
Le guide `docs/google-auth.md` et `.env.local.example` préparent l’activation.
Les emplacements locaux sont préparés sans identifiants fournis ; aucun déploiement
ni connexion réelle à Google n’a été effectué.

La revue indépendante finale conclut **ship**, sans défaut matériel sur les douze
captures : connexion et inscription à 1440 et 390 px, en clair et sombre, bouton
activable aux deux largeurs, erreur et annulation sur mobile. Preuves dans
`.impeccable/review/` : `google-login-{1440,390}-{light,dark}.png`,
`google-signup-{1440,390}-{light,dark}.png`, `google-ready-{1440,390}.png`,
`google-error-mobile.png` et `google-cancel-mobile.png`.
Validation finale transmise : 128 fichiers et 1 219 tests réussis, contre 125 fichiers
et 1 197 tests avant le travail ; build, TypeScript et lint ciblé réussis.
Les échanges Google sont simulés : le consentement, les identifiants et les retours
du projet Google restent à vérifier après configuration réelle.

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


## Portée et tâche
Se connecter ou créer un compte avec le formulaire existant. La bascule ajoute le nom
à l’inscription ; les champs, erreurs et redirection vers l’application gardent leur rôle.

## Direction et composition
La connexion prolonge « La lumière en mouvement » : fond blanc ou graphite, titres
Bricolage, texte Schibsted, champs opaques et commandes en capsule. Sur ordinateur,
la photographie de verre occupe la colonne gauche avec une grande découpe arrondie ;
le formulaire et la marque occupent la droite. Le message de bienvenue repose sur
un cartouche anthracite opaque. Sous 768 px, l’image disparaît et le formulaire reste seul,
sur 400 px maximum. Les champs et boutons atteignent au moins 48 px de hauteur.

## Moyens et provenance
L’image existante `public/landing/lumiere-hero-v1.png` est réutilisée sans modification.
Sa provenance et son prompt d’origine restent ceux du brief public et de l’asset livré.
Aucune nouvelle image raster n’est générée. L’illustration est décorative et masquée
aux lecteurs d’écran ; le titre du formulaire reste le titre principal accessible.

## Validation
Le rendu doit être lu en clair et en sombre, sur ordinateur et téléphone, avec les deux
modes du formulaire et le focus clavier. Ce brief consigne l’implémentation et ne vaut
pas verdict de revue ni preuve d’une connexion réelle.
