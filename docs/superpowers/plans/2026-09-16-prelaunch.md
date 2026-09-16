# Pré-lancement Planora — Implementation Plan

**Goal:** deux formules explicites et une réservation gratuite confirmée par e-mail.
**Architecture:** catalogue commun, service de réservation avec Postgres, adaptateur Resend, endpoints publics et formulaire dédié. Les comptes et abonnements existants sont indépendants.
**Tech Stack:** Next.js, React, TypeScript, pg/PGlite, API HTTP Resend.
**Spec:** docs/design/2026-09-16-prelaunch-shape.md

## Contraintes

9,90 €/mois sans connexion ; 19,90 €/mois pendant les 12 premiers mois d’abonnement puis 29 € avec connexion. Gratuit à la réservation, pas de carte ni de paiement. Aucune date ou rareté inventée. Conserver l’identité approuvée. Resend à configurer, aucun e-mail réel pendant les vérifications. Changements antérieurs conservés, pas de commit demandé.

## Exécution

- [x] Baseline `npm test` : 117 fichiers, 1150 tests réussis.
- [x] Écrire puis exécuter les tests du catalogue, de la validation et du service : adresse normalisée, offre invalide, doublon, confirmation, expiration, erreur d’envoi, changement de formule protégé.
- [x] Ajouter `src/db/schema-prelaunch.sql` et son script idempotent. Réservations privées au serveur, jetons hachés et limites d’envoi persistantes.
- [x] Implémenter `src/lib/prelaunch/{offers,reservations,email}.ts`, puis `src/app/api/reservations/route.ts` et `/confirm/route.ts`. Réponse identique pour les adresses existantes, validation serveur, contrôle d’origine, limite de taille, confirmation POST explicite.
- [x] Remplacer l’ancienne offre par deux choix, rediriger les appels à l’action publics vers la réservation, adapter fonctionnement/FAQ. Ajouter `/reservation` et `/reservation/confirmer` avec chargement, erreur, attente, renvoi et confirmation.
- [x] Vérifier le parcours navigateur desktop/mobile clair/sombre, les contrôles clavier et les deux offres. Tests réseau simulés sans envoi réel ; service vérifié sur PGlite.
- [x] Lancer tests, TypeScript, lint et build. Revue indépendante Impeccable et documentation finale. Documenter les variables, migration, statistiques confirmées par offre et nettoyage.

## Décisions techniques

Une nouvelle demande ne modifie jamais la formule déjà confirmée avant confirmation du nouveau lien. Les jetons expirent après 24 h, une adresse ne reçoit pas plus d’un lien par minute. Une confirmation n’est pas déclenchée par GET (prévisualisations de messagerie). Les erreurs du fournisseur ne sont pas présentées comme un succès. Le formulaire propose une question facultative, sans donnée bancaire.
