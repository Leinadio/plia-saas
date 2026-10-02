# Bank reconnection implementation plan

> Exécution native dans cette conversation : superpowers:executing-plans.

**Goal:** Retrouver le même compte après renouvellement et réparer les doublons CIC.
**Architecture:** Identité locale stable, identifiant bancaire séparé, rapprochement
par empreinte principale sous le même propriétaire et la même banque. Fusion
transactionnelle des données du doublon après réception de toutes les données bancaires.
**Tech Stack:** Next.js, TypeScript, Postgres, Vitest/PGlite.
**Spec:** docs/superpowers/specs/2026-10-02-bank-reconnection-design.md

## Contraintes
Tests avant code. Pas de dépendance nouvelle. Pas de modification des travaux en
cours sur les modules. Aucune fusion par nom ou IBAN masqué. Préservation des
comptes non partagés. Les opérations et budgets restent cloisonnés par utilisateur.

## Points à vérifier
Expiration d'une banque pendant la synchronisation ; abandon du parcours ;
empreintes indisponibles ; décisions contradictoires sur un doublon ; deuxième
synchronisation après rattachement et éventuelle suppression d'un compte.

## Étapes
- [x] Reproduire reconnexion et doublons dans tests/enablebanking/reconnection.test.ts,
  lancer `npm test -- tests/enablebanking/reconnection.test.ts` et constater l'échec.
- [x] Ajouter bank_uid et identification_hash à accounts, avec migration additive.
  Implémenter l'identification via les sessions dans enablebanking/account-identities.ts.
- [x] Implémenter le rattachement et la fusion atomique dans db/repositories/account-reconnection.ts.
  Tester alias, enveloppes, opérations, choix, isolation, refus et deuxième synchronisation.
- [x] Brancher sync.ts et sync-connections.ts : API via bank_uid, écritures via id local,
  sessions expirées ignorées et signalées. Tests ciblés de synchronisation et du schéma.
- [x] Ajouter le parcours Reconnecter dans connection.ts, api/connect et settings,
  avec validation de propriété et tests d'autorisation avant toute création.
- [x] Lancer `npm test`, TypeScript et lint ciblé. Appliquer la migration additive,
  lancer le serveur et vérifier l'écran réel. Vérifier une réparation seulement après
  tests verts, avec sauvegarde locale privée des données concernées.


## Vérification terminée le 2 octobre 2026

- État initial : 159 fichiers, 1 422 tests verts.
- Régressions observées avant correction : doublon de compte/salaire, blocage par
  l'ancienne session, perte des choix en attente, retour d'une session périmée,
  réapparition après suppression et compte oublié après import interrompu.
- Relecture indépendante : deux défauts (attentes, ancienne session en vol), corrigés
  avec leurs régressions observées en échec puis réussies.
- Vérification finale : `npm test` : 162 fichiers, 1 441 tests verts ; TypeScript,
  ESLint ciblé et `git diff --check` passent.
- Migration additive appliquée à la base configurée, sans modification de compte
  ou de budget.
- Simulation isolée PGlite sur une copie en mémoire : comptes identiques rattachés,
  enveloppes conservées et montant de départ attendu retrouvé. Les références
  communes ont été vérifiées sans conflit. Aucun montant personnel conservé ici.
- Serveur HTTPS existant disponible ; les réglages redirigent vers la connexion.
  L'utilisateur a été invité à se connecter. Aucun renouvellement ni rattachement
  bancaire réel n'a été déclenché pendant la vérification.
