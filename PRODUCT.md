# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Aujourd’hui, le créateur utilise Planora pour son budget personnel. Les comptes et les
données sont séparés par utilisateur ; cela ne constitue pas une preuve de demande.

La cible retenue par le créateur le 10 septembre 2026 est celle des personnes seules
et des couples qui souhaitent piloter leur budget personnel et préparer leurs projets.
Elle veut relier les dépenses d’aujourd’hui aux prochains mois, sans condition de
revenus confortables. Le ciblage professionnel exploré n’est pas retenu. Le besoin
et la volonté de payer restent à valider auprès d’utilisateurs. Ce positionnement
ne suppose pas un accès partagé entre conjoints. La page publique `/pour-qui`,
accessible depuis le header sur mobile et ordinateur, explique les deux usages.

## Product Purpose

Relier les opérations bancaires aux enveloppes de budget et aux soldes des mois à
venir. L’utilisateur doit comprendre ce qui est prévu, ce qui a été dépensé et ce
qu’il restera, avant de décider.

## Positioning

Planora réunit les revenus, les dépenses et les soldes dans un relevé lisible. Les vues
« Par mois » et « Comparer » rendent les mois à venir concrets ; les enveloppes,
sous-enveloppes et détails de montants expliquent les chiffres. La connexion bancaire
via Enable Banking alimente cette lecture. L’anticipation n’est pas présentée comme
une exclusivité concurrentielle, ni le report des restes et dépassements comme une
règle automatique universelle.

Le pré-lancement retenu le 16 septembre prévoit deux offres : **9,90 € par mois sans
connexion bancaire**, et **19,90 € par mois pendant les 12 premiers mois d’abonnement,
puis 29 € par mois avec connexion bancaire**. La réservation proposée est gratuite, sans
carte bancaire ; elle n’est ni un essai gratuit ni un abonnement actif. La volonté
de payer reste à valider. Le parcours manuel autonome reste à
préparer avant ouverture ; aucun import CSV, accès partagé ou accompagnement
personnel n’est promis.

La landing présente ces deux offres et mène au formulaire `/reservation`. Il
conserve la formule choisie et demande une confirmation par e-mail ; les 12 mois
promotionnels commencent avec le futur abonnement. L’intégration Resend et le
schéma des réservations sont préparés mais leur configuration de production reste
à effectuer avant la collecte. Aucun paiement ni e-mail réel n’a été déclenché.
Le [brief de pré-lancement](docs/design/2026-09-16-prelaunch-shape.md) décrit les
décisions ; le [guide d’installation](docs/prelaunch.md) décrit les limites et la mise en service.

## Operating Context

Planora se consulte sur ordinateur et téléphone. Une barre produit donne accès au budget,
aux transactions et aux réglages. Les montants ouvrent leur détail ; sur téléphone,
les formulaires et les choix de comparaison utilisent un panneau du bas.

Les vues « Par mois » et « Comparer » gardent une présentation adaptée au support :
relevé à colonnes sur ordinateur, sections et mois empilés sur téléphone. En comparaison
mobile, revenus, dépenses et soldes conservent chacun leur indicateur. La page publique
et la connexion sont accessibles avant la session.

On synchronise, corrige le classement, ajuste une enveloppe, puis consulte les soldes.
La valeur vient de la lecture et de la décision, pas du nombre de visites quotidiennes.

## Capabilities and Constraints

Le produit propose une connexion bancaire Enable Banking, la synchronisation des
opérations et du solde, des enveloppes et sous-enveloppes mensuelles, des transactions
manuelles, des règles de catégorisation, des projections, des alertes de dépassement
et le détail des montants. Les données sont cloisonnées par utilisateur dans Postgres
chez Supabase. L’interface est en français.

La page « Automatisation » automatise le rattachement des nouvelles opérations à un budget
du même compte, selon leur libellé, leur sens et des bornes de montant facultatives.
Chaque rattachement apparaît dans la cloche, à côté des dépassements. Les règles
se créent, se modifient, se mettent en pause et se suppriment ; la première règle
active compatible est prioritaire. L’historique sans budget passe par un aperçu
puis une application explicite. La démonstration reste en lecture seule.
Le [guide des règles](docs/automatisations.md) précise les limites et la mise en service.

L’inscription et la connexion proposent Google, en complément de l’adresse e-mail
et du mot de passe. La première connexion Google crée le compte ; les suivantes
retrouvent le même compte. Seule l’identité de base est demandée, sans accès à Gmail,
Drive ou aux données bancaires. Un compte e-mail non vérifié ne peut pas être associé
silencieusement à Google et conserve son accès par mot de passe ; aucun écran
d’association manuelle n’est ajouté. Au 17 septembre 2026, le parcours et sa
[mise en service](docs/google-auth.md) sont préparés, mais aucun identifiant Google
n’a été fourni : le bouton reste désactivé avec une explication et l’accès par e-mail.
La création et la reconnexion sont testées avec un échange Google simulé ; aucune
connexion réelle au fournisseur ni aucun déploiement ne sont validés.

Un formulaire commun à l’accueil public et à l’application permet d’écrire à
Planora : adresse e-mail, sujet et message. Dans l’application, l’adresse du
compte est proposée et reste modifiable. Resend transmet le message à une adresse
privée, sans joindre les données du budget ni promettre un délai de réponse.
En cas d’erreur, le texte reste dans le formulaire ouvert pour réessayer.
Au 16 septembre 2026, le destinataire et les compteurs anti-abus sont installés
sur l’environnement configuré ; l’envoi reste explicitement désactivé tant que
Resend, l’expéditeur et l’origine publique ne sont pas configurés. Aucun e-mail
réel ni déploiement n’a été validé. Voir [la mise en service du contact](docs/contact.md).

Les chiffres reflètent la dernière synchronisation. Les prévisions sont des
estimations dépendant des budgets, revenus prévus et opérations connues. La banque
peut demander une nouvelle autorisation. Les banques disponibles dépendent du
catalogue Enable Banking au moment du choix ; aucun nombre d’établissements ni accès
universel n’est promis. Planora consulte les comptes et ne réalise pas de virements.
Créer une enveloppe ne déplace pas d’argent.

Ne pas inventer : paiement actif, prix définitif, date d’ouverture commerciale, essai,
connexion familiale partagée, gestion de patrimoine ou conseil financier.

## Brand Commitments

Le nom public est **Planora**. La marque associe clarté du budget et place donnée aux
projets. La page publique adopte « La lumière en mouvement », direction choisie dans
la page de décision (option `assigned`, seed `29f966f4`, réalisation en code).
Aucune maquette d’interface n’a été approuvée avant cette réalisation.

Cette identité relie désormais les pages publiques, la connexion et l’application.
Bricolage Grotesque porte la marque et les titres ; Schibsted Grotesk garde les données,
libellés et commandes. Le fond reste blanc en clair. En sombre, la palette
« Anthracite et sable » choisie le 17 septembre 2026 remplace le vert forêt :
fond charbon, cartes ardoise, actions sable, revenus sauge, dépenses bleu brume
et alertes corail. En clair, les actions et revenus restent eucalyptus ; la pêche
accompagne les filtres, le contexte et les courbes. Les cartes arrondies et les commandes en
capsule accompagnent le budget. Les chiffres restent sur des surfaces
opaques. Les repères financiers et les parcours existants guident cette adaptation :
le relevé distingue les revenus menthe, les dépenses bleu brume et la trésorerie
gris neutre, sans fonds rouges ; les panneaux mobiles suivent les mêmes repères.
Le système exact est documenté dans DESIGN.md.

## Evidence on Hand

Le produit, ses calculs testés et ses composants constituent la preuve disponible.
La présentation publique propose trois aperçus sélectionnables : le mois, les soldes
comparés et le détail d’un montant. Ce sont quatre captures des vrais composants avec
des données fictives, adaptées au support, pas une simulation de budget manipulable.
Le cartouche de soldes du haut est également identifié comme illustratif.

Une visite guidée de 1 min 14 suit les trois repères du budget. Elle montre les vrais
écrans de démonstration, un parcours guidé par la souris et une voix française
générée par IA, signalée dans la légende. Un accompagnement musical original reste
en retrait pendant la narration. Le lecteur s’ouvre au clic et propose
des sous-titres français facultatifs.

Les quatre photographies originales ont été générées avec imagegen ; les personnes
représentées ne sont pas des clients. Les huit PNG livrés dans `public/landing/`
portent leur provenance embarquée. La page `/pour-qui` présente deux scènes de vie
originales (lecture en solo et projet d’appartement en couple), des arguments courts
et deux captures des vrais écrans, identifiées comme démonstration. Les preuves du rendu clair, sombre, ordinateur,
téléphone et des trois vues sont conservées dans `.impeccable/review/`.

Aucun client, témoignage, chiffre d’usage ou logo de presse n’est disponible. Ne pas
les fabriquer. Le document de positionnement distingue les repères publics datés des
hypothèses propres à Planora ; ils ne prouvent ni une supériorité ni la volonté de payer.

## Product Principles

1. **Le chiffre d’abord dans l’application.** Chaque montant doit être lisible et son
   détail compréhensible. La vitrine peut raconter les projets que cette lecture aide.
2. **Regarder devant.** Aider à décider de la suite, pas seulement constater le passé.
3. **Expliquer les écarts.** Garder les budgets, dépenses et hypothèses accessibles ;
   ne pas promettre un automatisme que le produit ne garantit pas.
4. **Dire la vérité.** Distinguer opérations synchronisées, estimations, exemples et
   hypothèses commerciales.
5. **Le classement est un moyen.** L’organisation des opérations sert la décision.
