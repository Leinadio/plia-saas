---
version: 2
slug: "src-app-pour-qui-page-tsx"
primary_target: "src/app/pour-qui/page.tsx"
related_targets: ["src/app/pour-qui/page.module.css","src/app/layout.tsx","src/components/landing-header.tsx","src/components/landing-header.module.css","src/components/landing.module.css"]
---

## Portée et mode

Page publique `/pour-qui`, mode Read / Persuade, version construite
`audience-art-v2`. Elle s’adresse aux personnes seules et aux couples qui suivent
leur budget personnel, sans condition de revenus confortables. Les professionnels
ne sont pas visés. La route est rendue statiquement côté serveur ; son contrat
est émis dans le document de production.

## Travail à accomplir

Faire reconnaître des envies et situations de vie, montrer comment Plia aide à
organiser les dépenses et préparer les mois suivants, puis rejoindre la démonstration
ou commencer. Les bénéfices reposent sur les enveloppes, le détail des montants et
la comparaison des mois déjà présents dans le produit.

Le couple décrit un usage personnel pour préparer les dépenses du foyer et en
parler ensemble. Une note visible précise que l’accès partagé entre conjoints
n’est pas proposé. Les captures sont identifiées comme données de démonstration ;
la comparaison rappelle que les prévisions dépendent du budget renseigné.
Aucun nouvel accès familial, tarif ou engagement commercial n’est introduit.

## Direction retenue et autorité

La page hérite de « La lumière en mouvement » : fonds menthe et forêt, titres
Bricolage Grotesque, texte Schibsted Grotesk et commandes en capsules. Son expression
propre associe photographie de vie, courbes opposées, support corail et preuves du
produit. La première composition a été rejetée pour manque de style, d’images
nouvelles, de direction artistique recherchée et de force commerciale ; elle ne
fait plus autorité. Il n’existe pas de maquette d’interface approuvée.

Les rôles `landing-audience-*` de DESIGN.md et le CSS final font autorité pour
cette page seulement. Les règles du budget connecté et de l’accueil sont préservées.

## Composition et parcours

« La vie, à votre façon. » ouvre la page au centre. « Découvrir Plia » rejoint
`/#demonstration`. Deux photographies originales composent un diptyque : le solo
est décalé vers le bas, leurs grands coins sont opposés. Les photos entières sont
des liens vers `#en-solo` et `#a-deux`, avec cartouches opaques et flèches visibles.

« En solo. Faites-vous une place. » présente trois bénéfices courts : donner une
place aux dépenses, expliquer les écarts et lire les prochains mois. Une vraie
capture du détail est posée sur un support corail légèrement tourné, sous
« Un chiffre. Tout s’éclaire. ». Le lien propose « Préparer mon budget ».

Une courbe ouvre la plage forêt. « À deux. Voyez la suite ensemble. » associe
quotidien, projets et choix discutés à trois bénéfices courts. La capture réelle
de comparaison répond à « Aujourd’hui. Et après ? ». Le lien propose
« Préparer nos projets », suivi de la limite explicite de l’accès personnel.
Les deux liens ouvrent `/connexion`.

La conclusion « Faites de la place à votre prochaine envie. » propose
« Commencer avec Plia » vers `/connexion` et « Découvrir l’offre » vers `/#offre`.
Le bandeau et le pied communs conservent les liens vers l’accueil et ses sections.

## Images et provenance

`public/landing/audience-solo-v1.png` montre un moment de lecture sur un balcon ;
`audience-couple-v1.png` montre un couple choisissant une couleur pour aménager
son appartement. Ce sont des créations originales imagegen, pas des clients ni
des témoignages. Chaque prompt exact est conservé dans le `.prompt.txt` adjacent ;
la provenance est aussi embarquée. Le contrôle livré des huit images publiques
ne relève aucune provenance manquante.

`plia-detail-mobile.png` et `plia-soldes-mobile.png` montrent les vrais composants
avec données de démonstration. Les quatre images disposent d’un texte alternatif.

## Adaptation, typographie et interactions

Le haut est limité à 1440 px. Les portraits occupent des colonnes 1fr / 1.12fr,
avec un espace de 32 px et un décalage solo de 48 px. Leur hauteur passe de 460 à
400 px à 1100 px. À 700 px, les deux images restent côte à côte, hautes de 300 px,
avec espace de 12 px, décalage de 24 px et coins opposés de 80 px.

Les récits alternent texte et preuve, sur 1312 px maximum, colonnes 1.08fr / 1fr,
espace de 96 puis 48 px. Leurs marges latérales passent de 40 à 36 puis 24 px.
Sur téléphone, le texte précède toujours la preuve. Le support corail tourne de
2° et sa capture de −2° ; ces rotations statiques disparaissent sur téléphone.
La courbe forêt mesure 80 px, puis 48 px sur téléphone.

Le titre utilise `clamp(64px, 8vw, 96px)`, puis `clamp(52px, 12vw, 70px)` sur
mobile, graisse 550 et interligne 0.98. Les récits utilisent
`clamp(40px, 4.3vw, 60px)`, puis 42 px, graisse 500 et interligne 1.06.
Les phrases des preuves sont à 40/36 px pour le détail et 60/48 px pour la
comparaison. La conclusion utilise `clamp(40px, 5vw, 70px)`, puis 42 px.
Le corps passe de 18 à 16 px ; les bénéfices ont une phrase forte à 18/16 px
et une explication à 15/14 px. La limite d’accès personnel reste à 13 px.

Le corail `#f5b5a2`, son survol `#ef9d87`, le support sombre `#e5a18d`,
l’encre brune `#654234`, l’ombre `#56302724` et le filet `#54816b` ont des rôles
intentionnels limités à cette surface. Le minimum de titre à 64 px et les 80 px
des coins mobiles et de la courbe ne sont pas une exception générale pour le budget.

Le bandeau sépare les sections de l’accueil et les pages : flèche descendante
pour les trois ancres, diagonale pour « Pour qui ? » et la connexion. « Pour qui ? »
reste au centre, séparé des ancres par « / », tandis que la connexion reste à droite. À 1100 px
et en dessous, les sections restent accessibles sur une seconde ligne. Depuis
cette page, elles rejoignent la bonne ancre de l’accueil. Le défilement natif est
progressif, ou immédiat lorsque la réduction des animations est activée. Le lien actif est souligné, teinté de la couleur
d’action et annoncé par `aria-current="page"`. Les liens photographiques ont une
mise au point visible ; sur forêt, le contour est jaune. Les thèmes suivent la
préférence du navigateur. Le support solo s’assombrit légèrement et le bloc forêt
reprend sa variante publique sombre. Aucune animation décorative n’est ajoutée ; les commandes
partagées conservent leurs réactions et respectent la réduction des mouvements.

## Revue finale et persistance

La revue indépendante de `audience-art-v2` conclut **ship**, sans défaut matériel.
Seize captures valides ont été inspectées dans `.impeccable/review/` : pour chaque
largeur 1440 et 390, les fichiers `audience-art-{largeur}{thème}{vue}.png`, avec
thème vide ou `-dark` et vue vide, `-top`, `-solo` ou `-couple`. Cela représente
quatre pages complètes, quatre hauts et huit sections. Ce sont les preuves du
résultat construit, pas des maquettes approuvées. Les contrastes passent ; le
brun sur corail sombre atteint 4.12:1 pour les grands titres concernés.

La validation livrée compte 1119 tests réussis dans 114 fichiers ; ESLint et le
build de production ont réussi. Le contrat `audience-art-v2` a été vérifié dans
le HTML de production. Le navigateur a couvert 320, 390, 768, 1100 et 1440 px,
ainsi que le sombre à 390 et 1440 px : quatre images chargées, absence de
débordement, ancres photographiques, mise au point clavier et liens connexion /
démonstration validés. Cette passe documentaire ne relance ni serveur, ni tests,
ni détecteur ; elle conserve les résultats de la passe de réalisation et de revue.

## Décisions ouvertes

Vérifier l’adéquation des usages solo et couple auprès des utilisateurs concernés.
Le prix et les conditions commerciales gardent leur statut provisoire documenté
sur l’accueil ; cette page n’introduit aucune souscription.
