# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Aujourd’hui, le créateur utilise Plia pour son budget personnel. Les comptes et les
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

Plia réunit les revenus, les dépenses et les soldes dans un relevé lisible. Les vues
« Par mois » et « Comparer » rendent les mois à venir concrets ; les enveloppes,
sous-enveloppes et détails de montants expliquent les chiffres. La connexion bancaire
via Enable Banking alimente cette lecture. L’anticipation n’est pas présentée comme
une exclusivité concurrentielle, ni le report des restes et dépassements comme une
règle automatique universelle.

La proposition commerciale est une offre complète à **29 € par mois**. L’ambition
premium a été demandée par le créateur ; ce prix est une hypothèse, pas un tarif de
souscription validé. La page porte la mention « Tarif envisagé. L’offre commerciale
est en cours de finalisation. » Les boutons conduisent à l’accès Plia. Aucun paiement,
essai gratuit, abonnement annuel, accompagnement personnel ou offre gratuite n’est
promis. Le raisonnement et les repères tarifaires datés vivent dans
[le positionnement de lancement](docs/landing-positionnement.md).

## Operating Context

Plia se consulte sur ordinateur et téléphone. Une barre produit donne accès au budget,
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

Les chiffres reflètent la dernière synchronisation. Les prévisions sont des
estimations dépendant des budgets, revenus prévus et opérations connues. La banque
peut demander une nouvelle autorisation. Les banques disponibles dépendent du
catalogue Enable Banking au moment du choix ; aucun nombre d’établissements ni accès
universel n’est promis. Plia consulte les comptes et ne réalise pas de virements.
Créer une enveloppe ne déplace pas d’argent.

Ne pas inventer : paiement actif, prix définitif, date d’ouverture commerciale, essai,
connexion familiale partagée, gestion de patrimoine ou conseil financier.

## Brand Commitments

Le nom public est **Plia**. La marque associe clarté du budget et place donnée aux
projets. La page publique adopte « La lumière en mouvement », direction choisie dans
la page de décision (option `assigned`, seed `29f966f4`, réalisation en code).
Aucune maquette d’interface n’a été approuvée avant cette réalisation.

Les titres publics utilisent Bricolage Grotesque et le texte Schibsted Grotesk.
L’application conserve Schibsted et ses règles de relevé ; les couleurs et formes de
la vitrine sont limitées à cette page. Le système exact est documenté dans DESIGN.md.

## Evidence on Hand

Le produit, ses calculs testés et ses composants constituent la preuve disponible.
La présentation publique propose trois aperçus sélectionnables : le mois, les soldes
comparés et le détail d’un montant. Ce sont quatre captures des vrais composants avec
des données fictives, adaptées au support, pas une simulation de budget manipulable.
Le cartouche de soldes du haut est également identifié comme illustratif.

Une visite guidée de 1 min 04 suit les trois repères du budget. Elle montre les vrais
écrans de démonstration, un parcours guidé par la souris et une voix française
générée par IA, signalée dans la légende. Le lecteur s’ouvre au clic et propose
des sous-titres français facultatifs.

Les quatre photographies originales ont été générées avec imagegen ; les personnes
représentées ne sont pas des clients. Les huit PNG livrés dans `public/landing/`
portent leur provenance embarquée. La page `/pour-qui` présente deux scènes de vie
originales (lecture en solo et projet d’appartement en couple), des arguments courts
et deux captures des vrais écrans, identifiées comme démonstration. Les preuves du rendu clair, sombre, ordinateur,
téléphone et des trois vues sont conservées dans `.impeccable/review/`.

Aucun client, témoignage, chiffre d’usage ou logo de presse n’est disponible. Ne pas
les fabriquer. Le document de positionnement distingue les repères publics datés des
hypothèses propres à Plia ; ils ne prouvent ni une supériorité ni la volonté de payer.

## Product Principles

1. **Le chiffre d’abord dans l’application.** Chaque montant doit être lisible et son
   détail compréhensible. La vitrine peut raconter les projets que cette lecture aide.
2. **Regarder devant.** Aider à décider de la suite, pas seulement constater le passé.
3. **Expliquer les écarts.** Garder les budgets, dépenses et hypothèses accessibles ;
   ne pas promettre un automatisme que le produit ne garantit pas.
4. **Dire la vérité.** Distinguer opérations synchronisées, estimations, exemples et
   hypothèses commerciales.
5. **Le classement est un moyen.** L’organisation des opérations sert la décision.
