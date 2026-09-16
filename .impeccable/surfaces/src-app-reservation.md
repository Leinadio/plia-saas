---
version: 1
slug: "src-app-reservation"
primary_target: "src/app/reservation/page.tsx"
related_targets: ["src/app/reservation/confirmer/page.tsx","src/components/reservation-form.tsx","src/components/reservation-confirmation.tsx","src/components/prelaunch.module.css","src/components/landing-header.tsx"]
---

## Portée et autorité

Réservation gratuite d’une formule et confirmation d’adresse, avant ouverture
commerciale. Extension locale de « La lumière en mouvement », seed `29f966f4`,
conforme au [cadrage approuvé](../../docs/design/2026-09-16-prelaunch-shape.md)
et au [contrat de direction](../review/prelaunch-direction.md). Aucune nouvelle
identité ni maquette d’interface n’est créée. Les règles partagées restent dans
`DESIGN.md` ; les dispositions ci-dessous sont propres à ce parcours.

## Travail à accomplir

Conserver le choix fait depuis les offres, montrer son prix et ses conditions,
demander l’adresse et proposer une question facultative sur le besoin. Sans
choix dans le lien, la formule connectée est présélectionnée et peut être changée.
La formule manuelle coûte 9,90 € / mois ; la connectée 19,90 € / mois pendant
les 12 premiers mois d’abonnement, puis 29 € / mois. Les 12 mois commencent
avec le futur abonnement. La réservation est gratuite, sans carte bancaire,
sans abonnement ni connexion bancaire activée.

## Composition et matière

Le bandeau public est partagé ; ses sections reviennent aux ancres de l’accueil.
Sur ordinateur, une introduction et la photographie de verre existante précèdent
latéralement un formulaire bleu brume pâle. Le cadre atteint 1260 px, avec deux
colonnes 1fr / 1.15fr et un espace de 80 px, ramené à 40 px sous 1000 px. Sous
760 px, les colonnes s’empilent avec des marges de 24 px ; la photographie est
masquée et la promesse précède les choix. La confirmation reste une tâche courte
dans un cadre de 720 px maximum.

Les surfaces restent opaques, blanches ou graphite ; eucalyptus pour agir,
bleu brume pour regrouper le formulaire et menthe pour le choix confirmé.
Bricolage porte les titres, Schibsted les libellés et les prix de sélection.
Les contrôles réutilisent les petits arrondis, les filets et le focus de la
palette commune. Les radios restent visibles ; sur téléphone, le prix passe
sous le libellé. Aucune nouvelle animation de scène ni nouvelle image.

## États et suite du parcours

L’e-mail est requis, le besoin est facultatif. Pendant l’envoi, les champs et
le bouton sont indisponibles, avec une mention d’attente. Une erreur est annoncée
et reçoit le focus. Aucun état de réussite n’est affiché lorsque l’envoi est
indisponible.

Après une réponse réussie, le panneau demande d’ouvrir le dernier e-mail reçu.
Il affiche l’adresse, propose le renvoi après une minute et permet de corriger
l’adresse ou la formule, avec retour du focus au champ. Le lien de démonstration
porte explicitement la mention de données fictives.

Le lien reçu ouvre une page qui demande un clic sur « Confirmer ma réservation ».
Une simple ouverture ou prévisualisation de l’e-mail ne confirme pas la demande.
Après confirmation, le titre reçoit le focus, la formule et ses conditions sont
rappelées et la page propose la visite guidée fictive. Le lien expiré, incomplet
ou remplacé propose une nouvelle demande. Le retour à l’accueil reste disponible.

## Limites de livraison

Le service Resend et la persistance sont préparés ; leur configuration et
l’installation du schéma en production restent à faire. Aucun e-mail réel,
paiement ou déploiement n’a été effectué. Les états de succès du navigateur
ont utilisé des réponses simulées ; la persistance et la confirmation sont
couvertes sur PGlite. Le parcours de budget manuel autonome reste à construire
avant de vendre l’abonnement. Les [instructions de mise en service](../../docs/prelaunch.md)
font référence pour ces limites.

## Revue et preuves

La [revue indépendante finale](../review/prelaunch-finish-review.md) conclut
**ship**, sans correction matérielle. Le verdict couvre le rendu et le parcours
préparé, sans valider la collecte réelle ou le déploiement. QUALITY BAR était
indisponible. Un agent générique frais a suivi le contrat de Finish Reviewer ;
la documentation utilise de même un agent générique frais suivant le contrat
Documenter.

Preuves dans `../review/` :
`prelaunch-{reservation-connected,pending,confirmed}-{1440,390}-{light,dark}.png`.
La revue a aussi examiné les captures mobiles des choix manuels, erreurs et
liens expirés ; elle n’a pas examiné leurs compléments à 1440 px. La
[validation](../review/prelaunch-validation.md) décrit les contrôles clavier,
le choix manuel et la confirmation, les 1167 tests réussis dans 120 fichiers,
le build, TypeScript et le lint ciblé réussis. Le lint global reste en défaut
hors périmètre. La passe documentaire n’ajoute aucune vérification visuelle.
