# Planora — pré-lancement et offres

Décisions retenues avec Daniel le 16 septembre 2026. Cadrage Shape approuvé,
puis mise en place de la landing et du parcours de réservation. Aucune mise en vente.

## Objectif et public

Personnes seules et couples qui organisent leur budget personnel. Mode de la
landing : Persuade. Constituer un premier groupe intéressé avant d’engager les
frais fixes de connexion bancaire. Aucune audience ni personne intéressée à ce
stade ; le recrutement initial reste à organiser.

## Offres retenues

| Formule | Prix mensuel | Différence |
| --- | --- | --- |
| Sans connexion bancaire | 9,90 € | Gestion du budget avec saisie manuelle, sans synchronisation bancaire. |
| Avec connexion bancaire | 19,90 € pendant les 12 premiers mois d’abonnement, puis 29 € | Gestion du budget avec synchronisation bancaire. |

Les 12 mois commencent avec l’abonnement, pas avec la réservation. La hausse à
29 € doit être visible dès le choix de l’offre. Aucune troisième formule servant
uniquement de prix de comparaison. Aucun plafond de comptes, accès partagé,
accompagnement, engagement annuel ou tarif à vie n’a été convenu.

## Parcours proposé

La landing annonce le pré-lancement et présente les deux formules avec leurs prix
et la différence de connexion. Chaque bouton « Réserver mon accès » conserve
l’offre choisie. La réservation est gratuite, sans carte bancaire et ne déclenche
aucun abonnement ni connexion bancaire.

Formulaire court : adresse e-mail ; question facultative sur le besoin principal.
Confirmation de l’adresse et de la formule choisie, puis invitation à découvrir
une démonstration clairement identifiée comme fictive. Aucun compteur, avis
client, nombre de places limitées ou calendrier d’ouverture inventé.

La palette et l’identité validées sont conservées. Le prix, le prix après 12 mois,
la présence ou l’absence de connexion et la gratuité de réservation doivent rester
lisibles sur mobile comme sur ordinateur. Prévoir saisie invalide, adresse déjà
inscrite, confirmation en attente, succès et échec d’envoi.

## Validation et limites

Mesurer les adresses confirmées par formule, l’utilisation de la démonstration et
les échanges avec les intéressés. Ces réservations donnent un signal d’intérêt
au prix affiché ; elles ne sont pas des abonnements payants garantis.

Calculer les besoins de lancement avec le tarif effectivement facturé : 9,90 € ou
19,90 € pendant la promotion. La présence de l’offre manuelle ne supprime pas les
frais fixes Enable Banking si l’offre connectée est ouverte. Les hypothèses de
coûts restent celles du [document Notion](https://www.notion.so/3dca6a52485381199526f55b89884357),
à compléter notamment par les frais de paiement et les autres dépenses.

Avant de commercialiser la formule manuelle, prévoir un parcours autonome de
création de compte de budget sans liaison bancaire ; la saisie manuelle existante
ne suffit pas à établir que ce parcours est déjà disponible. L’import CSV n’est
pas promis dans ces offres. Les conditions commerciales, la date d’ouverture,
le seuil de lancement et la période de disponibilité du tarif de lancement
restent à préciser. La volonté de payer aux deux tarifs reste à valider.

## État de livraison

La landing et le parcours de réservation sont réalisés et vérifiés sur ordinateur
et mobile, en clair et en sombre. Revue indépendante : `ship` sur le rendu et le
parcours préparé. Les succès d’envoi sont simulés en navigateur et le service est
testé sur PGlite ; aucun e-mail réel n’a été envoyé. À la demande du créateur,
l’intégration Resend est préparée sans compte d’envoi existant. La configuration
de l’expéditeur et l’installation du schéma sont décrites dans `docs/prelaunch.md`.
