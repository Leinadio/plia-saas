---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/landing-page.tsx","src/components/landing-hero.tsx","src/components/landing-budget-examples.tsx","src/components/landing-budget-examples.module.css","src/components/landing-use-cases.tsx","src/components/landing-use-cases.module.css","src/components/landing-demo.tsx","src/components/landing-faq.tsx","src/components/landing.module.css","src/components/landing-header.tsx","src/components/landing-header.module.css","src/components/landing-offers.tsx","src/components/prelaunch.module.css"]
---

## Situations de vie en carrousel — 17 septembre 2026

À la demande de l’utilisateur, le parcours vertical A → B → C → D est retiré
entièrement. Le carrousel suit désormais la vidéo, la section des exemples
de budgets ayant été retirée à la demande de l’utilisateur. Avant la démonstration,
il montre sept usages : un week-end à deux, les courses du quotidien, les
activités, un projet de travaux, la rentrée, le premier logement et les imprévus.
Le titre est « Pour tout ce qui fait votre
vie. ». Chaque scène associe des personnes souriantes et un usage concret des
budgets de Planora, sans témoignage inventé ni résultat financier garanti.
Le lien de chaque slide « Réserver mon accès » mène aux offres en `#offre`.

Extension locale en mode Persuade, dans l’identité existante : Bricolage,
Schibsted, eucalyptus en clair, anthracite et sable en sombre. Sur ordinateur,
la photographie occupe une scène de 660 px de haut ; le texte se place en bas
à gauche sur un voile sombre qui protège sa lisibilité. Les visages restent
visibles. Sous 700 px, l’image en 4:3 précède un panneau opaque portant le texte
et l’action. Le titre de scène passe à 32 px. Aucune nouvelle règle globale
n’est créée par cette composition.

Le visiteur choisit une des sept situations, utilise les flèches ou fait
un geste horizontal sur l’image. Il n’y a pas de défilement automatique.
Le clavier accepte les flèches, Home et End lorsque le carrousel a le focus.
Les slides hors champ sont inertes ; leurs liens ne polluent pas l’ordre de
tabulation. Le compteur annonce la situation active. Les flèches se désactivent
aux extrémités. Le mouvement est instantané sous réduction des animations.
Le défilement horizontal natif s’arrête sur chaque scène. Lors d’un changement
de largeur, la situation active reste sélectionnée et se recale immédiatement,
y compris au passage du téléphone à la tablette.

Les sept photographies sont des scènes fictives produites avec le générateur
d’images intégré, puis optimisées en WebP dans `public/landing/use-cases/`.
La mention sous le carrousel a été retirée à la demande de l’utilisateur.
Les prompts exacts sont conservés dans `prompts.json` et dans les
sidecars de chaque image ; le scan de provenance trouve zéro élément manquant.

La vérification navigateur couvre les quatre slides à 1440, 820, 390 et 320 px
en clair et à 1440 et 390 px en sombre. Les captures montrent les quatre scènes
à 1440 et 390 px en clair et la première dans les quatre autres variantes.
Preuves : `../review/carousel-{1440,390}-light-{0,1,2,3}.png`,
`../review/carousel-{320,820}-light-0.png` et
`../review/carousel-{1440,390}-dark-0.png`. Les parcours au clavier, les boutons,
le lien vers les offres, la suppression du flow et l’absence de débordement
ou d’erreur JavaScript sont vérifiés. Le geste tactile, la navigation animée
et la conservation de la situation active de 390 à 820 px sont aussi vérifiés.
Les 1 274 tests de 134 fichiers passent, dont quatre tests du carrousel écrits
avant leur implémentation ou correctif ; la compilation et le lint ciblé passent.
Revue indépendante finale de cet ajout : **ship**, sans défaut matériel.
La revue ciblée suivante confirme **ship** pour le correctif de conservation
de la situation au redimensionnement, avec le défaut noté **resolved**.
Ces verdicts portent sur cet ajout et ce correctif, sans nouvel audit global
ni modification du système visuel partagé.

## Budgets choisis par l’utilisateur — 17 septembre 2026

Le haut explique désormais que l’utilisateur fixe un montant pour chaque projet,
activité ou dépense du quotidien. Le bloc « Un budget pour chaque chose qui compte. »
illustre ce mécanisme après la vidéo, désormais placée directement sous le haut de page. Garder « budget »
et « sous-budget » dans tous les textes publics, descriptions accessibles et
métadonnées, conformément à PRODUCT.md.

À gauche, le texte explique que les dépenses saisies ou synchronisées doivent
être rattachées au bon budget pour calculer le reste. À droite, une seule figure
statique rassemble trois lignes : Week-end à deux (300 / 120 / 180 €), Sport
(60 / 40 / 20 €), Courses (350 / 216,30 / 133,70 €). Les colonnes sont « Vous
prévoyez », « Dépensé », « Il vous reste ». La légende précise « Exemple illustratif
pour un mois » ; la note rappelle que créer un budget ne déplace pas d’argent.
Le lien « Voir le suivi dans Planora » rejoint réellement `#demonstration`.

Extension locale réalisée en code, sans nouvelle identité, image ni maquette.
Elle reprend Bricolage, Schibsted et les surfaces opaques existantes, y compris
« Anthracite et sable » en sombre. Cette palette du 17 septembre, décrite dans
DESIGN.md, actualise la référence chromatique historique ci-dessous.
Texte et figure s’empilent à 1100 px et moins ; les trois montants restent côte
à côte sur téléphone, avec un ajustement compact sous 360 px, vérifié à 320 px.
Le montant choisi reçoit un fond d’accent doux ; le reste est plus gras.

Revue indépendante finale : **ship**, sans défaut matériel dans cet ajout.
Le vrai serveur a été vérifié en clair à 1440, 390 et 320 px, en sombre à 1440
et 390 px : aucun débordement ni erreur JavaScript ; dix couples de contraste
supérieurs à 4,5:1. Les 1 270 tests de 133 fichiers passent avant et après ;
le build passe. Preuves : `../review/budget-story-{1440-light,390-light,320-light,1440-dark,390-dark}.png`
et `../review/budget-story-hero.png`. Ce verdict reste limité à cette extension,
sans nouveau tournoi de concepts ni audit global QUALITY BAR.

## Palette commune approuvée — 16 septembre 2026

Cette révision chromatique fait autorité ; les revues antérieures ci-dessous
restent des traces historiques. Blanc majoritaire en clair ; graphite neutre en sombre. Eucalyptus pour
les actions et revenus, bleu brume pour les dépenses, pêche douce pour les filtres,
le contexte et les courbes. Textes et trésorerie anthracite, cellules gris neutre.
Les mêmes rôles s’appliquent à l’application, à la landing, à Pour qui et à la connexion.
Cette passe couleur conservait formes, fontes, espacements, photos, textes et parcours.
Le pré-lancement ci-dessous actualise ensuite l’offre et ses destinations.
Source : `src/app/palette.css`. Brief : `docs/design/2026-09-16-harmony-colors-shape.md`.
Revue indépendante finale : **ship**, sans défaut matériel pour cette passe couleur.
La carte QUALITY BAR était indisponible ; ce verdict ne constitue pas un audit
global d’accessibilité ou d’ergonomie. Revue et preuves :
`.impeccable/review/harmony-colors-finish-review.md` et
`.impeccable/review/harmony-colors-validation.md`.


## Portée et mode

Page publique `/`, mode Persuade. Elle parle aux personnes seules et aux couples
qui veulent suivre leur budget personnel, avec des charges et des projets.
Ce choix de cible est confirmé par l’utilisateur ; il n’impose pas un niveau de
revenus et ne vise pas les professionnels. La demande reste à valider sur le terrain.
Les écrans connectés partagent « La lumière en mouvement » et sa palette, avec
leur structure financière et leurs règles mobiles. Ce brief décrit la page publique.

## Travail à accomplir

Faire comprendre que revenus, dépenses et mois à venir se lisent ensemble pour
faire de la place aux projets. Le titre choisi est « L’outil pour gérer vos finances sans vous compliquer la vie. »
L’utilisateur conserve « L’outil pour gérer vos finances », sans la conjonction
« et », avec une promesse de simplicité.
Sa taille est réduite sur ordinateur et mobile. « finances » et « la vie »
portent deux courbes vertes dessinées sur mesure, d’épaisseur variable ; un second
trait léger prolonge le premier. Les mots restent dans la même phrase, sans animation.
L’utilisateur retient le premier fond à larges rubans, désormais bleu brume et pêche, sans sa
partie haute. Les courbes inférieures et leur tracé fin d’accompagnement sont
restaurés ; le titre et le bandeau restent sur fond uni. Les contours s’adaptent
au téléphone, les teintes au mode sombre. Leur amplitude verticale est réduite
de 40 % à la demande de l’utilisateur, pour des courbes plus plates.
Le décor est statique et n’intercepte
aucun clic. Le bloc des trois repères a été retiré à la demande de l’utilisateur.
L’action principale rejoint les deux offres en `#offre` ; chaque formule ouvre
`/reservation` avec le choix conservé. L’action secondaire rejoint la présentation
par captures. « Se connecter » garde `/connexion`. La réservation ne déclenche
ni paiement ni abonnement.

## Direction retenue et autorité

« La lumière en mouvement », direction choisie par l’utilisateur dans la page de
décision : seed `29f966f4`, option `assigned`, candidat 7, réalisation en code.
Aucune maquette d’interface approuvée : la direction artistique et son contrat
ont guidé la composition. Le verre cintré vert et corail et sa lumière naturelle
restent photographiques. Les fonds sont blancs ou graphite, les plages de
démonstration anthracite et les accents eucalyptus, bleu brume et pêche, avec
titres Bricolage Grotesque et texte Schibsted Grotesk. Les chiffres
restent opaques et lisibles. Le CSS final et les jetons `landing-*` de DESIGN.md
font foi pour les valeurs ; la couleur du prompt artistique n’est pas la couleur
d’action de l’interface.

## Parcours et moment mémorable

Le haut partage la promesse à gauche et une photographie sculpturale à droite.
Un cartouche sombre posé au pied de l’image expose trois soldes prévus avec la
mention d’exemple illustratif. La section « Planora, en action. » suit directement
le haut de page et remplace le bloc des trois repères, retiré le 17 septembre 2026.
Elle présente la visite guidée de 1 min 14, ouverte au clic dans Hero Video Dialog
de Magic UI. L’exemple de trois budgets choisis vient ensuite, puis le carrousel
de situations de vie décrit en tête de ce brief.
Sur fond anthracite, la démonstration alterne « Votre mois »,
« Comparer » et « Le détail » ; la courbe lumineuse change avec la vue choisie.

Une scène de départ en week-end relie ensuite le budget à un projet concret.
Le fonctionnement présente saisie manuelle ou connexion bancaire, budgets et
comparaison, suivi d’un rappel que Planora ne déplace pas d’argent. Le bloc pêche
compare deux offres : 9,90 € / mois sans banque ; 19,90 € / mois pendant les
12 premiers mois d’abonnement puis 29 € / mois avec banque. La réservation est
gratuite et sans carte. La FAQ précise les prix, le démarrage des 12 mois avec
l’abonnement, la confirmation d’adresse et les limites bancaires. La dernière
invitation à réserver reprend la photographie sculpturale.

L’offre unique à 29 € avec la mention « Tarif envisagé » appartenait à la
version du 10 septembre ; elle est remplacée par le cadrage du 16 septembre.
La volonté de payer et les conditions de l’ouverture restent à valider.

## Preuve réelle et images livrées

Les trois aperçus sont une sélection de captures de vrais composants avec des données
de démonstration. Le choix met à jour le
texte et l’image ; il ne permet pas de modifier les budgets montrés.

La visite guidée qui précède ces aperçus est une capture continue des vrais écrans
de démonstration. Elle montre les achats, le détail d’un montant, l’ajustement d’un
budget et les prévisions. Sa légende signale les données fictives et la voix IA.
La narration chaleureuse part des projets et du quotidien ; une musique originale
de claviers et de percussion légère baisse de volume pendant la parole.
L’affiche et les quatre captures publiques reprennent les vrais composants avec
la palette actuelle et des données de démonstration. Leur provenance est conservée
à côté et embarquée. Le film préenregistré conserve sa palette antérieure.
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
Le bloc des offres possède son seuil local à 760 px : deux colonnes et un filet
vertical deviennent deux rangées séparées par un filet horizontal. Les prix,
la période et le passage à 29 € restent visibles avant chaque bouton. Les
commandes occupent la largeur disponible sur téléphone. La liste commune suit
les deux formules ; aucune troisième offre ni fausse recommandation n’est ajoutée.
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

Les thèmes clair et sombre suivent la classe du document commune à l’application.
Les rôles de fond,
encre et commande conservent leur contraste. Sous réduction des animations, la
révélation d’image, la courbe lumineuse et les transitions sont supprimées. Ces
adaptations ne changent pas la présentation du budget connecté.

## Revue antérieure de la landing et persistance

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

## Historique de l’ajout de la page « Pour qui ? »

Le lien de bandeau et la page dédiée prolongent le monde public existant. La page
`/pour-qui` possède désormais deux photographies originales, un diptyque décalé,
des bénéfices courts et deux preuves du produit sur corail et forêt. Aucune
animation n’est ajoutée. La revue de `audience-art-v2` conclut **ship**, sans défaut
matériel, après inspection de seize captures sur ordinateur et téléphone, en
clair et en sombre. Son brief conserve les preuves et les vérifications.
Cette passe artistique conservait l’offre unique alors provisoire ; le
pré-lancement suivant la remplace par les deux formules décrites ci-dessus.

## Pré-lancement livré — 16 septembre 2026

Extension du monde « La lumière en mouvement », seed hérité `29f966f4`, sans
nouvelle identité ni maquette à approuver. Le hero indique le pré-lancement et
la gratuité de réservation. Le bandeau dit « Les offres » ; les actions
publiques de conversion rejoignent les offres ou la réservation. Le lien de
connexion garde sa destination existante. Le formulaire, la confirmation et
leurs états sont décrits dans [le brief dédié](src-app-reservation.md).

Le parcours et les prix suivent [le cadrage approuvé](../../docs/design/2026-09-16-prelaunch-shape.md).
Resend et le schéma dédié sont préparés, mais ni configurés ni installés en
production. Aucun e-mail réel ni paiement n’a été déclenché. Le parcours manuel
autonome reste à construire avant l’abonnement ; voir [la mise en service](../../docs/prelaunch.md).

La [revue indépendante finale](../review/prelaunch-finish-review.md) conclut
**ship**, sans correction matérielle, pour le rendu et le parcours préparé.
QUALITY BAR était indisponible ; ce verdict ne valide pas la mise en service
de l’e-mail, de la base ni un déploiement. Les captures
`prelaunch-{hero,offers}-{1440,390}-{light,dark}.png` de `../review/` remplacent
les anciennes preuves pour ces deux blocs. Elles documentent le rendu livré,
pas une maquette préalable.

La [validation de cette passe](../review/prelaunch-validation.md) consigne
120 fichiers et 1167 tests réussis, le build, TypeScript et le lint ciblé
réussis ; le lint global reste en défaut hors périmètre. La présente mise à
jour documentaire ne relance ni serveur, ni tests, ni détecteur.

## Contact livré — 16 septembre 2026

Depuis le 17 septembre, le bandeau et le pied de page rejoignent `/contact`.
Le formulaire a été déplacé sur cette page publique dédiée et retiré de l’accueil.
Son lien FAQ revient à `/#faq`. Le bloc « Une question ?
On vous écoute. » associe une introduction et un renvoi à la FAQ au formulaire
e-mail, sujet et message. Deux colonnes sur ordinateur deviennent une colonne
sous 760 px. Le fond gris doux, les champs blancs ou graphite, l’action eucalyptus
en capsule et les fontes existantes prolongent le monde public sans nouvelle image.
À 420 px et en dessous, les flèches du bandeau disparaissent pour garder les liens
dans l’écran.

Le [brief commun du contact](src-app-app-contact.md) décrit les états, l’accès
connecté et les limites. L’envoi est actuellement désactivé avec une explication :
le destinataire et les compteurs anti-abus du contact sont prêts, mais la
configuration d’e-mail reste incomplète. Cette installation ne concerne pas le
schéma des réservations, toujours à installer séparément.

La [revue indépendante du contact](../review/contact-finish-review.md) conclut **ship**, sans correction matérielle,
après inspection de 13 captures `contact-*` dans `../review/`. Les états d’envoi
ont été simulés ; aucun e-mail réel ni déploiement n’a été validé. La
[validation](../review/contact-validation.md) conserve le périmètre exact.

## Décisions ouvertes

Les marges de toutes les sections de l’accueil sont unifiées : conteneur de
1440 px, retraits de 64 / 36 / 24 px aux seuils de 1100 / 700 px. Les fonds
colorés restent pleine largeur avec un contenu intérieur aligné. Vérification
sur le serveur à 320, 390, 700, 760, 820, 1100, 1440 et 1920 px : les treize
blocs partagent les mêmes bords, sans débordement horizontal. Les 1274 tests
passent après modification.

Valider la cible et la volonté de payer, mesurer les adresses confirmées par
formule puis les échanges qualitatifs. Configurer la collecte, préciser les
conditions et la date d’ouverture, puis construire le parcours manuel autonome
avant une souscription réelle. Une réservation n’est pas un abonnement payé.
