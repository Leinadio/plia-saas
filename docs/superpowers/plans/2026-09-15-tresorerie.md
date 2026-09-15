# Trésorerie Implementation Plan

> Exécution dans cette session, autorisée jusqu’au bout sans question supplémentaire.

**Goal:** Expliquer la trésorerie par des mouvements et des résultats distincts, sans changer les calculs.
**Architecture:** Un composant de présentation commun porte les montants et les intitulés. Le relevé conserve ses cellules, références et calculs. Le contexte mobile transmet le parcours de trésorerie choisi indépendamment de l’indicateur revenus/dépenses.
**Tech Stack:** Next.js, React, CSS existant, Vitest.
**Spec:** `docs/superpowers/specs/2026-09-15-tresorerie-design.md`

## Contraintes

- Calculs et identifiants de cellules inchangés ; zéro net vide, résultat négatif signé.
- Palette et polices existantes, français, clavier, deux thèmes et deux supports.
- Aucun bouton de détails ni sélecteur déroulant réintroduit.

## 1. Montants et résultats

- [x] Écrire `tests/components/history-treasury.test.tsx` : mouvement distinct du solde, découvert signé, neutralité, choix mobile et mois futur. Exécuter pour constater les échecs.
- [x] Créer `src/components/history-treasury.tsx` : `TreasuryAmount({v, delta})`, intitulés contextuels et libellés de clôture. Utiliser `soldeCell(v, delta, true)` pour conserver le seuil de neutralité existant.
- [x] Brancher ce composant dans `history-grid.tsx`, conserver les références et les boutons de montants, retirer l’ancien rendu qui confond le signe du mouvement et celui du solde.

## 2. Parcours et hiérarchie

- [x] Grouper les trois colonnes sous le titre commun, ajuster les largeurs concordantes du tableau interne et du pied, ajouter le filet et les libellés de résultat.
- [x] Transmettre `treasuryMetric` et `currentMonth` au contexte mobile ; montrer uniquement le parcours choisi sous les enveloppes tout en conservant leurs indicateurs propres.
- [x] Donner aux filtres et explications les mêmes noms, avec mention explicite des estimations futures. Préserver toutes les valeurs des filtres et leurs liens.
- [x] Ajouter les styles du parcours dans `history-treasury.css`, réutilisant les couleurs existantes et les états de focus. Conserver le contraste des résultats dans les deux thèmes.

## 3. Vérification et livraison

- [x] Exécuter les tests ciblés puis `npm test`, `npx tsc --noEmit`, le lint des fichiers modifiés et `npm run build`.
- [x] Vérifier le vrai serveur avec des données fictives : ordinateur/mobile, clair/sombre, comparaison et panneau de calcul. Capturer les rendus dans `.impeccable/review/`.
- [x] Regrouper les corrections issues du premier contrôle, confirmer une seule fois, lancer le détecteur Impeccable puis la revue indépendante demandée par le skill.
- [x] Mettre à jour le brief de surface et la documentation à partir du rendu final. Ne conserver aucune route de test temporaire.
