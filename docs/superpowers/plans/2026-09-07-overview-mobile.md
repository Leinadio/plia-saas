# Vue d’ensemble mobile — Implementation Plan

**Goal:** adapter le relevé au téléphone avec toutes ses fonctions et la comparaison.
**Architecture:** conserver les constructeurs de montants et les actions existants.
Un contexte de navigation choisit mois/indicateur sans réindexer les données.
Une présentation de cellules dédiée transpose le relevé sur téléphone.
**Tech Stack:** React, Next.js, Tailwind, Vitest.
**Spec:** docs/superpowers/specs/2026-09-07-overview-mobile-design.md

## Contraintes

Calculs inchangés. Ordinateur inchangé. Français et jetons existants. Pas de commit.
Baseline avant code : npm test, 105 fichiers et 1031 tests verts.
Exécution avec tâches indépendantes et revue finale suivant subagent-driven-development.

## Tâche 1 — Navigation et intégration

- [x] Écrire et voir échouer les tests de navigation mensuelle et de comparaison.
- [x] Créer le contexte dans src/components/history-mobile-navigation.tsx.
- [x] Adapter HistoryPeriodFrame : commandes mobile, plage desktop inchangée,
  conservation des paramètres et de la période, attente lisible.
- [x] Adapter HistoryWithDetail : useIsMobile(640), passer à HistoryGrid une prop
  mobile { month, metric: ColKey | null, onMonthChange }, avec commandes autonomes
  en démonstration si HistoryPeriodFrame absent. Ne pas slicer les données.
- [x] Vérifier tests/components/history-period-frame.test.tsx et nouveaux tests.

## Tâche 2 — Relevé vertical

- [x] Tests rouges : changement de mois sans décaler les références ; indicateur
  comparé conservant ses montants/actions ; accès aux opérations depuis un calcul.
- [x] Créer src/components/history-mobile-columns.tsx et styles dédiés.
- [x] Adapter HistoryGrid : prop mobile optionnelle, cellules libellées, lignes
  lisibles, opérations du mois, boutons visibles, mois de création explicite.
- [x] Mettre les soldes et l’estimation avant les postes sur mobile en réutilisant
  les cellules existantes. Conserver les totaux et explications.
- [x] Vérifier les tests ciblés et les appelants de HistoryGrid.

## Tâche 3 — Détail et validation

- [x] Adapter le panneau de détail à la largeur du téléphone et le retour aux
  montants désignés. Tester le parcours de sélection.
- [x] Lancer npm test et npm run build, puis le vrai serveur.
- [x] Vérifier mobile/desktop : pas de débordement, comparaison, dépliage,
  budgets, navigation et retour depuis le détail. Revue du diff par un agent.
- [x] Corriger les défauts constatés et documenter le résultat final.

## Résultat de validation

- npm test : 107 fichiers, 1054 tests réussis, après baseline 1031 réussis.
- Nouveaux tests vus rouges : sélection mensuelle sans réindexation, comparaison,
  périodes, opérations hors mois/hors calcul, poste terminé, section repliée,
  références hors indicateur et sélection périmée après changement de plage.
- Navigateur Chromium local : 320/390 px sans débordement, détail de largeur 390,
  quatre contrôles de rattachement sur les opérations dépliées, huit indicateurs,
  budget Transport fictif modifié de 120 à 150, ajout proposé à partir d’octobre
  lorsqu’octobre est affiché ; aucune erreur JavaScript. Desktop vérifié à 1440 px.
- Aperçu temporaire retiré. Aucun commit, aucune donnée réelle modifiée.
- Compilation finale réussie après retrait de l’aperçu ; ESLint sans erreur ni
  avertissement sur tous les fichiers de code et tests modifiés. Les tests du
  guide et de la portée des références passent après le nettoyage final.
- Revue indépendante : les deux findings finaux (références hors indicateur et
  poste terminé conservé par un dépliage manuel) sont corrigés et confirmés.
