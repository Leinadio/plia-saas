---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/landing-page.tsx","src/components/landing-hero.tsx","src/components/landing-demo.tsx","src/components/landing-faq.tsx","src/components/landing.module.css","src/components/landing-header.tsx","src/components/landing-header.module.css"]
---

## Portée et mode

Page publique `/`, mode Persuade. Elle parle aux personnes seules et aux couples
qui veulent suivre leur budget personnel, avec des charges et des projets.
Ce choix de cible est confirmé par l’utilisateur ; il n’impose pas un niveau de
revenus et ne vise pas les professionnels. La demande reste à valider sur le terrain. Les écrans
connectés conservent leur propre monde « L’enveloppe », leurs jetons et leurs
règles mobiles. Ce brief fait autorité pour la page publique.

## Travail à accomplir

Faire comprendre que revenus, dépenses et mois à venir se lisent ensemble pour
faire de la place aux projets. La promesse est « Faites de la place à vos projets. »
L’action principale ouvre `/connexion` ; l’action secondaire rejoint la présentation
par captures. Il n’y a ni paiement ni souscription simulée.

## Direction retenue et autorité

« La lumière en mouvement », direction choisie par l’utilisateur dans la page de
décision : seed `29f966f4`, option `assigned`, candidat 7, réalisation en code.
Aucune maquette d’interface approuvée : la direction artistique et son contrat
ont guidé la composition. Verre cintré vert et corail, lumière naturelle, fonds
menthe et forêt, titres Bricolage Grotesque et texte Schibsted Grotesk. Les chiffres
restent opaques et lisibles. Le CSS final et les jetons `landing-*` de DESIGN.md
font foi pour les valeurs ; la couleur du prompt artistique n’est pas la couleur
d’action de l’interface.

## Parcours et moment mémorable

Le haut partage la promesse à gauche et une photographie sculpturale à droite.
Un cartouche sombre posé au pied de l’image expose trois soldes prévus avec la
mention d’exemple illustratif. Trois repères relient ce qui rentre, ce qui sort et
ce qu’il restera. Une section « Plia, en action. » présente ensuite la visite
guidée de 1 min 04, ouverte au clic dans Hero Video Dialog de Magic UI.
Sur fond forêt, la démonstration alterne « Votre mois »,
« Comparer » et « Le détail » ; la courbe lumineuse change avec la vue choisie.

Une scène de départ en week-end relie ensuite le budget à un projet concret.
Le fonctionnement présente connexion bancaire, enveloppes et comparaison, suivi
d’un rappel que Plia ne déplace pas d’argent. L’offre unique est affichée à
29 € / mois avec « Tarif envisagé. L’offre commerciale est en cours de finalisation. »
L’ambition premium est autorisée ; le prix définitif reste à valider. La FAQ
répond sur le budget, la banque, les prévisions, la synchronisation et le classement.
Une dernière invitation à commencer reprend la photographie sculpturale.

## Preuve réelle et images livrées

Les trois aperçus sont une sélection de captures de vrais composants avec des données
de démonstration. Le choix met à jour le
texte et l’image ; il ne permet pas de modifier les enveloppes montrées.

La visite guidée qui précède ces aperçus est une capture continue des vrais écrans
de démonstration. Elle montre les achats, le détail d’un montant, l’ajustement d’un
budget et les prévisions. Sa légende signale les données fictives et la voix IA.
Son aperçu est extrait de la vidéo à 22 secondes, avec provenance conservée à côté.
Le MP4 se charge au clic ; le lecteur propose des sous-titres français, conserve
le focus, se ferme avec Échap et tient dans un écran mobile en paysage. La lecture
ne démarre pas automatiquement sous réduction des animations.

Les quatre captures dans `public/landing/` sont `plia-budget-desktop.png`,
`plia-enveloppes-mobile.png`, `plia-soldes-mobile.png` et `plia-detail-mobile.png`.
Elles montrent le budget du mois, les soldes en comparaison et l’explication d’un
montant. La comparaison actuelle conserve un indicateur indépendant pour chaque
section ; les enveloppes ont des sous-enveloppes et les montants leur détail.

`lumiere-hero-v1.png` et `projets-foyer-v1.png` sont des créations originales
imagegen. Les personnes représentées ne sont pas des clients. Les six PNG portent
leur provenance embarquée ; leurs prompts et sources sont conservés à côté.
Aucun témoignage, chiffre d’usage, banque universellement compatible, temps réel,
report systématique, essai gratuit, accès familial ou gestion de patrimoine n’est
promis. Le détail commercial de référence est `docs/landing-positionnement.md`.

## Adaptation et interactions

À 1100 px, les marges passent à 36 px ; à 700 px, à 24 px et les sections s’empilent.
Sur téléphone, promesse et action précèdent l’image. Le bandeau partagé avec
`/pour-qui` distingue les sections de l’accueil (flèche vers le bas) des pages
« Pour qui ? » et connexion (flèche diagonale). « Pour qui ? » reste dans le
groupe central, après une barre oblique « / » ; la connexion reste à droite. À 1100 px et en dessous, les
sections restent visibles dans une seconde ligne, sous la marque et les pages.
Les ancres natives défilent progressivement, sauf sous réduction des animations. « Pour qui ? » ouvre une page présentant les usages solo et
couple, avec la limite actuelle de l’espace personnel sans accès partagé. La vue du mois remplace le grand tableau par
sa capture mobile ; les choix d’aperçu défilent horizontalement. Les captures
hautes peuvent défiler dans leur cadre. Le clavier accède aux choix et à la FAQ
native ; l’état pressé et la description du panneau sont annoncés.

Les thèmes clair et sombre suivent la préférence du navigateur. Les rôles de fond,
encre et commande conservent leur contraste. Sous réduction des animations, la
révélation d’image, la courbe lumineuse et les transitions sont supprimées. Ces
adaptations ne changent pas la présentation du budget connecté.

## Revue finale et persistance

La revue indépendante initiale retient **fix**, avec un seul correctif matériel : rendre
persistants la cible, le statut du prix et le système visuel effectivement livré.
Aucune correction matérielle de rendu n’a été demandée. Cette passe aligne PRODUCT.md,
les sections publiques de DESIGN.md, les extensions de `.impeccable/design.json`
et ce brief ; elle ne change ni le code ni les captures. Les anciennes alertes de
jetons non documentés sont traitées par les rampes exactes de la page publique,
sans élargir les règles de l’application.

Le passage de verdict final a noté ce correctif **resolved**, sans régression
documentaire : disposition **ship**, limitée à ce correctif. Le rendu conserve
les conclusions de la revue précédente, sans nouvel audit visuel.

Preuves du rendu, dans `.impeccable/review/` : `desktop.png`, `mobile.png`,
`desktop-dark.png`, `mobile-dark.png`, `desktop-hero.png`, `mobile-hero.png`,
`desktop-life.png`, `desktop-offre.png`, `desktop-compare.png` et
`desktop-detail.png`. Ces captures sont les références du résultat construit ;
ce ne sont pas des maquettes approuvées avant réalisation. Cette passe documentaire
ne relance ni serveur, ni tests, ni détecteur.

## Ajout de la page « Pour qui ? »

Le lien de bandeau et la page dédiée prolongent le monde public existant. La page
`/pour-qui` possède désormais deux photographies originales, un diptyque décalé,
des bénéfices courts et deux preuves du produit sur corail et forêt. Aucune
animation n’est ajoutée. La revue de `audience-art-v2` conclut **ship**, sans défaut
matériel, après inspection de seize captures sur ordinateur et téléphone, en
clair et en sombre. Son brief conserve les preuves et les vérifications.
L’offre et son statut provisoire restent ceux décrits ci-dessus.

## Décisions ouvertes

Valider la cible avec des utilisateurs concernés, mesurer inscriptions et activation,
puis confirmer le prix et les conditions commerciales avant une souscription réelle.
