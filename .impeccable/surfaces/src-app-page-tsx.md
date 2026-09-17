---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/landing-page.tsx","src/components/landing-bank-sync.tsx","src/components/landing-bank-sync.module.css","src/components/landing-hero.tsx","src/components/landing-budget-examples.tsx","src/components/landing-budget-examples.module.css","src/components/landing-budget-clarity.tsx","src/components/landing-budget-clarity.module.css","src/components/landing-use-cases.tsx","src/components/landing-use-cases.module.css","src/components/landing-demo.tsx","src/components/landing-demo.module.css","src/components/landing-demo-video.tsx","src/components/ui/bento-grid.tsx","public/videos/fonctionnalites/manifest.json","public/videos/fonctionnalites/manifest-mobile.json","artifacts/landing-parcours/README.md","artifacts/landing-parcours/record-features.mjs","artifacts/landing-parcours/check-motion.mjs","src/components/landing-faq.tsx","src/components/public-accordion.tsx","src/components/public-accordion.module.css","src/app/securite/page.tsx","src/components/landing.module.css","src/components/landing-header.tsx","src/components/landing-header.module.css","src/components/landing-offers.tsx","src/components/prelaunch.module.css"]
---

## Connexion bancaire et saisie allégée — 17 septembre 2026

La section `#fonctionnement` remplace « Votre vie est déjà assez remplie » et
ses trois étapes par « La synchronisation bancaire simplifie votre quotidien. ».
Elle suit la scène de départ en week-end, dont le lien devient « Moins de saisie
au quotidien », et précède les offres. Le texte présente le regroupement des
opérations et leur rattachement aux budgets. La commande « Découvrir la formule
connectée » mène à `#offre`.

À droite, une banque est reliée à Planora au-dessus d’un relevé illustratif :
salaire +2 450,00 €, cinéma −24,00 € et transport −48,60 €. L’état « Synchronisé »
et les trois opérations sont explicitement accompagnés de « Illustration ·
Données fictives » ; il ne s’agit pas de comptes réels. Sous les colonnes, un
filet introduit deux messages : à gauche, « Votre autorisation. Vos données.
Votre contrôle. » explique l’accord bancaire et la consultation ; à droite,
l’absence de virement précède « Comment vos données sont protégées » vers
`/securite`. Aucun prestataire n’est nommé dans le texte public. La FAQ conserve
les limites de synchronisation et la possible nouvelle autorisation.

Le système établi reste la référence : conteneur et titre communs,
Bricolage/Schibsted, capsule principale et couleurs sémantiques claires/sombres.
Les colonnes 1.1 / 1 ont 64 px d’écart, puis 32 px à 1100 px. À 800 px et moins,
le texte précède l’illustration (560 px maximum), puis la réassurance. Sous
380 px, les retraits se réduisent à 16 px et les icônes d’opérations disparaissent
pour garder les montants lisibles à 320 px. Aucun mouvement propre n’est ajouté.
La figure possède un nom accessible ; les icônes décoratives sont masquées.

La revue visuelle dédiée conclut **SHIP**, sans problème matériel relevé sur
1440, 390 et 320 px en clair, ni sur 390 px en sombre. Ce verdict porte uniquement
sur cette section et son lien d’entrée ; il ne renouvelle pas les revues historiques.

## Fonds sable en mode clair — 17 septembre 2026

À la demande de l’utilisateur, `#esprit-libre` et `#demonstration` partagent
le fond sable `#f4ecdf` via `sandSection`. Texte principal anthracite, texte
secondaire brun `#685d4c`, accent chaud et filets `#9a886e` conservent la lisibilité.
La règle est limitée au thème clair ; les couleurs sombres sont conservées.
La composition, la courbe supérieure et les animations restent identiques.

## Cinq fonctionnalités dans la démonstration — 17 septembre 2026

La section `#demonstration` utilise `BentoGrid` et `BentoCard`, suivant la demande
explicite de reprendre le [Bento Grid Magic UI](https://magicui.design/docs/components/bento-grid).
Cinq cartes présentent « Budgets et sous-budgets », « Suivi des transactions »,
« Prévisions de trésorerie », « Dépassements de budget » et « Règles d’automatisation ».
Trois cartes montrent les vrais composants filmés sur données fictives.
Transactions et automatisation montrent des illustrations animées : recherche
et rattachement d’une dépense de cinéma ; règle Cinéma de 10 à 50 € reliée au budget Sorties et loisirs.
Ces illustrations remplacent aussi les films dans le dialogue agrandi, avec pause
individuelle. Elles suivent le thème, la pause globale et la visibilité. Le mouvement
réduit conserve une scène fixe lisible.
La grille de vingt-quatre colonnes forme deux rangées : 7/9/8 puis 10/14.
Entre 701 et 1100 px, elle forme deux paires puis l’automatisation pleine largeur ;
à 700 px et moins, tout s’empile. « Les fonctionnalités en action · Données de
démonstration. » reste visible au-dessus, même sur téléphone.

La section pleine largeur conserve sa courbe supérieure (60 px, puis 30 px sur
mobile), le conteneur partagé, Bricolage/Schibsted et la palette anthracite/sable.
Les titres des cartes font 24 px et les descriptions 15 px. Les cartes opaques ont
un arrondi de 16 px ; les visuels occupent toute la largeur jusqu’au bord supérieur,
avec un filet inférieur de 1 px. Leur hauteur est de 240 px, puis de 220 px sur téléphone. Les vidéos remplissent leur cadre avec `cover`, sans bandes libres ; le point de recadrage suit le curseur,
sur le canevas blanc des vrais enregistrements, conservé même en mode sombre.
Les icônes portefeuille, liste filtrée, courbe, triangle d’alerte et organigramme précèdent les titres.
Leur trait de 1,5 px suit l’encre du thème, à 32 px sur tous les écrans.
Elles sont décoratives. Tout reste net et opaque, sans flou ni fondu.

Cinq MP4 et leurs images d’attente vivent dans `public/videos/fonctionnalites/`.
Les captures sans perte à densité 2 ou 3 sont encodées une fois en H.264 ;
les manifestes conservent dimensions et provenance. Aucune interface n’est générée.
Les fixtures de démonstration alimentent les composants de production et le script
bloque les écritures réseau. Les cinq caméras suivent les contrôles et les chiffres à
60 images/seconde, sans plan général, avec un curseur agrandi. Les captures montrent :
création de Vacances à 250 € puis liste des budgets ; recherche MONOPRIX puis LOYER ;
trois colonnes de trésorerie ; écart Transport de 27,60 € ; aperçu puis application
d’une règle Carrefour de 10 à 150 € vers Courses. La création du budget est locale
au scénario isolé et utilise les vrais calculs pour son montant et ses totaux.
Les exports sont en 1280 × 720 et les versions portrait en 720 × 1320.
Les neuf enregistrements antérieurs restent des archives.

« Voir en grand » ouvre chaque scène dans un dialogue natif, avec titre,
description, commandes vidéo et bouton de fermeture de 44 px. Échap et le fond
extérieur ferment aussi le lecteur ; le focus revient au déclencheur et le
défilement de la page est bloqué pendant l’ouverture. La largeur maximale est de
960 px, avec 16 px de retrait de chaque côté. À 700 px et moins, le lecteur charge
uniquement à l’ouverture une des cinq captures portrait de la vraie interface mobile,
enregistrée à 360 px et densité 3. Les cartes gardent les versions compactes.
Le fond extérieur utilise le jeton d’encre à 72 %, sans flou.

Les cartes n’ont plus d’animation d’entrée : la pause/reprise ne redémarre aucun
mouvement de leur cadre. Le survol à la souris relève la carte de 4 px.
Les vidéos s’animent seulement quand leur carte et l’onglet sont visibles,
et se mettent en pause derrière le lecteur agrandi.
La source vidéo n’est affectée qu’à la première apparition. La commande globale
de 44 px met les vidéos en pause ; elle
annule aussi transitions et déplacement au survol. En mouvement réduit, tout est
statique par défaut, y compris à l’ouverture du lecteur, avec lecture volontaire possible. Une erreur ou un refus de
lecture affiche le poster et « Réessayer l’aperçu », avec un focus visible.

`artifacts/landing-parcours/check-motion.mjs` mesure 0 px de déplacement après
pause/reprise à 1440, 820, 390 et 320 px. Les 1 283 tests de 135 fichiers passent,
dont neuf cas de cycle de vie ; lint et types passent. La grille est vérifiée aux
quatre largeurs en clair et à 1440/390 px en sombre ; le lecteur à 1440, 390 et
320 px. Les vidéos ont été inspectées sur des images décodées. Preuves :
`../review/features-{1440,820,390,320}-light.png`,
`../review/features-{1440,390}-dark.png`, `../review/features-modal-{1440,390,320}.png`,
`../review/features-result-budgets-1440.png` et
`../review/features-result-{budgets,previsions,notifications,automatisation}-mobile-390.png`.
La revue indépendante finale `features_finish_review` conclut **ship** pour les
deux corrections, lisibilité mobile et preuve du budget enregistré, sans régression
matérielle observée sur les captures. Ce verdict ne certifie pas l’application entière.
Le contrôle du fond extérieur a été corrigé par un jeton, sans exception persistée.
Cette mise à jour documentaire ne relance ni tests, ni navigateur, ni revue.

## Le doute en moins après la vidéo — 17 septembre 2026

Entre la vidéo et le carrousel, une bande sable en clair et anthracite en sombre, pleine largeur, reprend la
structure de la capture fournie par l’utilisateur : grand titre, introduction
et trois blocs sur le budget au quotidien. Le titre est « Votre budget au clair.
Le doute en moins. ». L’introduction explique la difficulté de distinguer
l’argent déjà dépensé de ce qu’il faut garder pour la suite. Les cartes traitent
de la répartition de l’argent en budgets, des petits montants qui s’accumulent et des dépenses
des prochains mois. Sous un filet, chaque carte présente en couleur d’accent
le bénéfice correspondant : organiser ses budgets, connaître le reste, anticiper.
Le premier bloc affirme « Budgétisez votre argent. » et invite à choisir combien
consacrer aux dépenses du quotidien, aux activités et aux projets.

La réalisation locale en code conserve Bricolage, Schibsted, les jetons du bandeau
en clair et sombre et le conteneur intérieur partagé. Tous les titres de section
de l’accueil partagent désormais la même taille : 60 px sur ordinateur, 48 px
à 1100 px et moins, puis 36 px à 700 px et moins, avec un interligne de 1,08.
La règle est propre à l’accueil ; le titre principal et les titres des cartes
gardent leurs rôles distincts. Les trois cartes s’empilent à 800 px et moins.
Aucune nouvelle image ni identité globale ; DESIGN.md reste inchangé.
L’ancre `esprit-libre` est conservée. Le seul lien « Voir mon budget en clair »
rejoint `#demonstration`, avec une hauteur minimale de 44 px et un focus visible.
Le contenu est statique ; seule la flèche du lien bouge au survol, mouvement
supprimé sous réduction des animations.

La revue indépendante initiale `clarity_finish_review` conclut **ship**, sans défaut matériel,
après lecture du code et des sept captures. Le vrai serveur a été vérifié à 1440,
1024, 820, 390 et 320 px en clair, puis à 1440 et 390 px en sombre : aucun débordement
du texte ou de la page, aucune erreur JavaScript, ordre vidéo → difficultés →
carrousel et marges alignées. Focus clavier, hauteur du lien et navigation vers
la démonstration sont confirmés. Les 1 274 tests de 134 fichiers passent avant
et après ; lint ciblé et contrôle du diff passent. Cette revue reste limitée à
cet ajout, sans nouvel audit global ni validation du build. Preuves :
`../review/clarity-{1440,390,320,820,1024}-light.png` et
`../review/clarity-{1440,390}-dark.png`.

L’harmonisation suivante confirme sur le vrai serveur une taille et un interligne
identiques pour les neuf titres de section à 1440, 1024, 390 et 320 px, sans
débordement. Les captures `../review/heading-clarity-{1440,1024,390,320}.png`
et `../review/heading-faq-{1440,390}.png` montrent cette réduction. Les 1 274
tests passent après cet ajustement ; le lint ciblé passe également.

## Situations de vie en carrousel — 17 septembre 2026

À la demande de l’utilisateur, le parcours vertical A → B → C → D est retiré
entièrement. Le carrousel suit désormais le bloc « Le doute en moins » placé après la vidéo ;
la section des exemples de budgets a été retirée à la demande de l’utilisateur. Avant la démonstration,
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

## Historique des exemples de budgets, retirés — 17 septembre 2026

Le haut explique désormais que l’utilisateur fixe un montant pour chaque projet,
activité ou dépense du quotidien. Le bloc « Un budget pour chaque chose qui compte. »
illustrait ce mécanisme après la vidéo, puis a été retiré à la demande de l’utilisateur.
La description et les preuves suivantes conservent la trace de cette version. Garder « budget »
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
`/reservation` avec le choix conservé. L’action secondaire rejoint les cinq cartes
du parcours animé. Le header propose « Réserver mon accès » vers `/reservation`. La réservation ne déclenche
ni paiement ni abonnement.

## Direction retenue et autorité

« La lumière en mouvement », direction choisie par l’utilisateur dans la page de
décision : seed `29f966f4`, option `assigned`, candidat 7, réalisation en code.
Aucune maquette d’interface approuvée : la direction artistique et son contrat
ont guidé la composition. Le verre cintré vert et corail et sa lumière naturelle
restent photographiques. Les fonds sont blancs ou graphite, les plages de
démonstration verte en clair et sombre, et les accents eucalyptus, bleu brume et pêche, avec
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
de Magic UI. Le bloc « Votre budget au clair. Le doute en moins. » vient ensuite,
puis le carrousel de situations de vie décrit en tête de ce brief.
Sur fond vert profond dans les deux thèmes, la démonstration présente budgets
et sous-budgets, transactions, prévisions, notifications et automatisation dans
cinq cartes Bento, avec trois vidéos et deux illustrations, toutes agrandissables.
La commande globale met les animations en pause ; la courbe supérieure reste
statique et identique.

Une scène de départ en week-end relie ensuite le budget à un projet concret.
Le fonctionnement présente la synchronisation bancaire et le temps de saisie
économisé, avec un relevé fictif, une commande vers les offres et le rappel des
limites de consultation bancaire décrit en tête de ce brief. Le bloc pêche
compare deux offres : 9,90 € / mois sans banque ; 19,90 € / mois pendant les
12 premiers mois d’abonnement puis 29 € / mois avec banque. La réservation est
gratuite et sans carte. La FAQ précise les prix, le démarrage des 12 mois avec
l’abonnement, la confirmation d’adresse et les limites bancaires. La dernière
invitation à réserver reprend la photographie sculpturale.

L’offre unique à 29 € avec la mention « Tarif envisagé » appartenait à la
version du 10 septembre ; elle est remplacée par le cadrage du 16 septembre.
La volonté de payer et les conditions de l’ouverture restent à valider.

## Preuve réelle et images livrées

Les cinq cartes du parcours montrent cinq vidéos distinctes des vrais composants
sur données d’exemple. Elles s’animent dans les cartes visibles, avec pause globale
et état statique par défaut en mouvement réduit. Le lecteur agrandi charge des
captures portrait sur téléphone et met les cartes en arrière-plan en pause.
Aucun budget personnel n’est modifié ; les écritures réseau étaient bloquées à la capture.

La visite guidée qui précède ce parcours est une capture continue des vrais écrans
de démonstration. Elle montre les achats, le détail d’un montant, l’ajustement d’un
budget et les prévisions. Sa légende signale les données fictives et la voix IA.
La narration chaleureuse part des projets et du quotidien ; une musique originale
de claviers et de percussion légère baisse de volume pendant la parole.
L’affiche de la visite et les cinq images d’attente du Bento reprennent les vrais
composants avec des données de démonstration. Leur provenance est conservée à côté
et embarquée. La visite préenregistrée conserve sa palette antérieure.
Le MP4 se charge au clic ; le lecteur propose des sous-titres français, conserve
le focus, se ferme avec Échap et tient dans un écran mobile en paysage. La lecture
ne démarre pas automatiquement sous réduction des animations.

Les quatre captures historiques dans `public/landing/` sont `plia-budget-desktop.png`,
`plia-enveloppes-mobile.png`, `plia-soldes-mobile.png` et `plia-detail-mobile.png`.
Elles montraient le budget du mois, les soldes en comparaison et l’explication d’un
montant ; la démonstration de l’accueil utilise désormais les cinq vidéos et posters
de `public/videos/fonctionnalites/`, avec cinq variantes portrait pour le lecteur agrandi.
La comparaison actuelle conserve un indicateur indépendant pour chaque
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
couple, avec la limite actuelle de l’espace personnel sans accès partagé. Les cinq
cartes du parcours s’empilent sur téléphone ; les vidéos s’adaptent
à la largeur de leur carte.
La mention d’exemple et la commande des animations restent visibles. Le clavier
accède à cette commande, aux lecteurs agrandis, aux nouvelles tentatives et aux boutons natifs de la FAQ animée ; les images
portent une description accessible.

Les thèmes clair et sombre suivent la classe du document commune à l’application.
Les rôles de fond,
encre et commande conservent leur contraste. Sous réduction des animations, la
présentation du parcours reste statique et supprime les mouvements décoratifs ;
les vidéos peuvent être relancées volontairement. Ces
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

La mention « Pré-lancement · Réservation gratuite, sans carte bancaire. »
figure désormais une seule fois, dans un badge au-dessus du titre principal.
La capsule reprend le fond d’action doux et la couleur d’action du thème,
avec un texte de 14 px pouvant revenir à la ligne sur mobile.

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

La section « Votre budget au clair » n’a pas de fond propre : le canevas de la page
reste visible, avec texte et accent du thème. Ses trois cartes gardent leur fond vert.
« Une vue d’avance » garde le fond vert profond #273330 de la page Sécurité dans
les deux thèmes, ses accents menthe et ses textes ivoire ; la courbe reste en place.

Dans la section bancaire, la protection des données est explicitée : accès aux
opérations réservé au compte, séparation des données entre utilisateurs, autorisation
auprès de la banque et lecture seule sans virement. Un cadenas relie banque et Planora,
avec une mention lisible « Accès bancaire en lecture seule ». Aucune certification ni
promesse de sécurité absolue ou de chiffrement de bout en bout n’est ajoutée.


## FAQ, sécurité et pied de page — 17 septembre 2026

Les FAQ de l’accueil et de `/securite` partagent le même accordéon : bouton natif
avec `aria-expanded` et `aria-controls`, région nommée, contenu fermé masqué aux
lecteurs d’écran et rendu `inert`. Ouverture et fermeture utilisent une grille
0fr/1fr sur 320 ms, une opacité sur 200 ms et la rotation du signe sur 280 ms ;
les transitions disparaissent en mouvement réduit. Les liens du pied de page,
hors marque, alignent texte et flèche en `inline-flex`, sur une cible de 44 px.

La revue de cette passe conclut **SHIP**, sans défaut matériel à 1440, 390 et
320 px en clair et à 390 px en sombre. Elle couvre les deux FAQ, la réassurance
scindée, le pied de page et la nouvelle page décrite dans
`src-app-securite-page-tsx.md`.

## Header public fixe et compact — 17 septembre 2026
Marque à gauche, ancres au centre, liens « Pour qui ? », « Sécurité » et « Contact » puis réservation
à droite. Le header reste fixé en haut, avec un fond opaque. Après 80 px de
défilement, il réduit ses espaces intérieurs en 240 ms ; sous 24 px, il retrouve
sa hauteur initiale. Son empreinte reste réservée pour éviter un saut de page. Sur mobile, le menu des sections est repliable ; les pages restent à droite.
Échap ferme le menu, le choix d’une ancre aussi. Les ancres gardent un retrait égal à la hauteur réelle du header plus 16 px.
La réduction des mouvements supprime la transition et le scroll progressif.

Les cinq cartes du bento partagent le fond de « Budgétisez votre argent »
(`color-mix` à 3 % d’encre du bandeau sur son fond). Texte ivoire, descriptions
vert pâle, liens et focus menthe assurent le contraste dans les deux thèmes.
Les vidéos et illustrations conservent leurs propres surfaces.

Le bento retrouve ses dimensions précédentes : cinq cartes de largeurs variées sur
deux rangées, 20 px entre les cartes, dans le conteneur partagé de la page.
