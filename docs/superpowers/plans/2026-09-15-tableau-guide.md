# Tableau guidé Implementation Plan

> Exécution dans la session autorisée par « Oui vas y », sans nouvelle confirmation.

**Goal:** Rendre chaque colonne compréhensible et supprimer l’introduction répétée.
**Architecture:** Un module de présentation partagé décrit les en-têtes et les résultats
d’enveloppe. Le tableau et les libellés mobiles l’utilisent. Les montants calculés et les
références existants restent la source ; seuls les totaux bruts et leurs explications
s’alignent sur les valeurs déjà affichées dans leurs lignes.
**Tech Stack:** Next.js, React, CSS, Vitest.
**Spec:** `docs/superpowers/specs/2026-09-15-tableau-guide-design.md`

## Contraintes
- Conserver la palette, les deux thèmes, les deux vues mobiles, les clés et interactions.
- Aucun changement des calculs de prévision ou des règles de remboursement.
- Une seule introduction pour tous les mois et sections.

## 1. Contrat de lecture
- [x] Compléter les tests de rendu existants : compter une introduction sur deux mois,
  vérifier les mentions pour 100/150/80, 100/100/100, 100/120/0 et les totaux bruts.
- [x] Exécuter les tests pour voir échouer les nouvelles attentes.
- [x] Créer `history-reading.tsx` : descriptions communes de colonnes et résultat
  d’enveloppe basé sur `MonthCell.balance` ; ne jamais recalculer le reste dans la vue.
- [x] Brancher les en-têtes, le résultat et les totaux dans `history-grid.tsx` ;
  explications des totaux construites avec les opérations du sens correspondant.

## 2. Présentation cohérente
- [x] Remplacer l’en-tête répété par une introduction globale ; conserver le filtre mobile.
- [x] Brancher les libellés mobiles sur le même vocabulaire, opérateurs décoratifs
  distincts des noms accessibles, sans changer les choix du filtre.
- [x] Ajouter `history-reading.css` : hiérarchie, en-têtes explicatifs, alignement,
  contraste et séparation enveloppe/trésorerie. Conserver les largeurs du tableau.

## 3. Validation
- [x] Tests ciblés puis suite complète, lint ciblé et build.
- [x] Fixture réelle temporaire : téléphone/ordinateur, clair/sombre, comparaison,
  résultats remboursés et panneaux. Une passe de captures, corrections groupées.
- [x] Détecteur puis revue indépendante Impeccable ; appliquer les corrections utiles.
- [x] Supprimer la fixture, documenter le rendu et les vérifications finales.
