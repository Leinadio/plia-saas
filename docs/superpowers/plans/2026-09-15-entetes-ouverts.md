# En-têtes ouverts — Implementation Plan

Exécution dans la session courante selon les autorisations de l’utilisateur.

**Goal:** réunir titre, ajout et colonnes dans un en-tête continu, sans repli de section.
**Architecture:** HistoryGrid conserve les données et les opérations. Une feuille locale définit les en-têtes uniformes ; les contrôles de comparaison et d’ajout existants sont réutilisés.
**Tech Stack:** React, Next.js, CSS, Vitest.
**Spec:** docs/superpowers/specs/2026-09-15-entetes-ouverts-design.md

## Contraintes
Pas de modification des calculs. Détails des enveloppes conservés. Mobile :
44 px pour les boutons icône. Pas de commit automatique.

## Réalisation
- [x] Baseline : 1 150 tests réussis.
- [x] Remplacer les tests de repli des sections dans history-grid-reveal.test.tsx par l’affichage permanent des titres/revenus/dépenses/totaux ; conserver les tests de révélation d’opérations. Mettre à jour history-comparison.test.tsx et voir les nouveaux tests échouer.
- [x] Dans history-grid.tsx, supprimer les deux états de repli et leurs conditions. Réunir le titre et les colonnes dans sectionHeaders ; garder une rangée de titre simple sur mobile. Conserver les filtres, l’ajout et les repères d’onboarding.
- [x] Ajouter history-section-heading.css : fond de carte uniforme, titre Bricolage de 20 px, sous-titre discret, action visible, explications alignées, filets fins. Adapter les en-têtes mobiles à 16 px de retrait et des boutons de 44 px.
- [x] Lancer les tests ciblés ; vérifier les vrais composants sur le serveur avec données fictives aux six formats convenus. Une passe de corrections puis confirmation.
- [x] Revue indépendante Impeccable, corrections demandées si nécessaire. Tests complets, lint ciblé, build, suppression de la route temporaire.
- [x] Mettre à jour DESIGN.md, le fichier de design et la fiche de surface selon le résultat final.

## Vérification réalisée

Tests initiaux : 1 150 / 117 fichiers. Les nouveaux tests ont d’abord échoué
sur les deux titres de section et le titre en comparaison (3 échecs attendus).
Après réalisation : 55 tests ciblés réussis, puis les 1 150 tests réussis dans
117 fichiers (23,99 s). Lint ciblé sans erreur, build de production réussi.

Captures des vrais composants avec données fictives : 1600 et 390 px en clair
et sombre, 2048, 980 et 320 px en clair. Ajout ouvert puis fermé sans sauvegarde,
enveloppe dépliée, comparaison modifiée. Aucun débordement du document ni erreur
JavaScript. Tous les fonds d’en-tête sont identiques par thème ; boutons mobiles
44 × 44 px. Les 11 captures finales ont été ouvertes et vérifiées.
La route temporaire a été supprimée avant le build.

Preuves : `.impeccable/review/section-*.png`,
`/private/tmp/planora-section-heading-browser.json`,
`/private/tmp/planora-section-header-tests.log`,
`/private/tmp/planora-section-header-build.log`.
Le scan `/private/tmp/planora-section-header-design-check.json` retourne `[]`.

La revue indépendante conclut « ship », sans défaut matériel. Elle porte sur
les sources, les 11 captures finales et les rapports fournis, sans relancer les
vérifications. Les captures cadrent les dépenses ; les revenus sont vérifiés
par leur implémentation commune et le rapport de géométrie. Les parcours clavier,
les ratios précis de contraste et les états transitoires des formulaires n’ont
pas été recertifiés par cette revue.
