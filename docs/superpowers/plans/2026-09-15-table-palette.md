# Fonds du relevé — Implementation Plan

## Évolution après les captures de 16 h 58
- [x] Baseline : 1 150 tests réussis dans 117 fichiers, 23,08 s.
- [x] Écrire le test des groupes de colonnes et observer son échec.
- [x] Ajouter les titres de groupes et conserver le calage des mois futurs.
- [x] Remplacer les fonds chauds par les rôles revenus vert d’eau, dépenses bleu brume, trésorerie commune ; retirer les fonds rouges.
- [x] Vérifier les vrais composants, les contrastes, la sélection, les deux thèmes et les formats mobiles ; tests, lint et build.
- [x] Revue indépendante avec les nouvelles captures utilisateur et actualisation documentaire.

### Preuves de la version courante
Test des groupes observé en échec avant réalisation, puis 47 tests ciblés réussis.
Suite complète : 1 150 tests dans 117 fichiers réussis, 38,24 s. Lint ciblé et
compilation de production réussis (exit 0). Journaux :
`/private/tmp/planora-table-zones-{baseline,red,targeted,tests,lint,build}.log`.
Deux passes visuelles sur les vrais composants avec données fictives ; le lot de
correction assombrit le support des résultats en mode sombre. Les 18 captures
finales `zones-*.png` ont toutes été ouvertes. Sept formats : 1600/390 px clair et
sombre, 2048/980/320 px clair. Aucune erreur JavaScript ni débordement du document ;
contrastes échantillonnés au minimum 5,35:1 en clair et 5,20:1 en sombre. Icônes
mobiles de 44 × 44 px, sélection et survol distincts. Colspans des mois courant et
futur vérifiés. Rapport : `/private/tmp/planora-table-zones-browser.json`.
La route de vérification temporaire a été retirée avant compilation.

La revue indépendante courante conclut « ship » après lecture des deux captures
utilisateur, des 18 captures finales, des sources et des rapports. Aucun défaut
matériel dans le périmètre couleur et regroupement de colonnes. Les signes et
mentions d’alerte, la neutralité du remboursement intégral, les détails et la
sélection restent lisibles. Cet avis remplace celui de la première proposition.
Il ne certifie pas les états non capturés ni l’accessibilité globale de l’application.

## Première proposition — historique, remplacée par la version ci-dessus
Exécution dans cette session avec executing-plans, selon l’autorisation utilisateur.

**Goal:** remplacer les aplats par colonnes par une lecture sur papier avec résultats colorés.
**Architecture:** une feuille locale possède les surfaces du relevé ; les classes de rendu les appliquent aux cellules. Les règles mobiles redondantes sont retirées.
**Tech Stack:** React, CSS, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-09-15-table-palette-design.md

## Contraintes
Calculs, contenu, commandes et largeurs conservés. Deux thèmes et deux vues mobiles.
Boutons mobiles de 44 px, sélection prioritaire, aucune modification bancaire.

## Réalisation
- [x] Baseline : `npm test`, 1 150 tests dans 117 fichiers réussis.
- [x] Créer `src/components/history-surfaces.css` avec les rôles papier, détail, total, résultat, alerte et bilan. Surfaces opaques et filets discrets.
- [x] Dans `history-grid.tsx`, remplacer les mélanges de couleurs de colonnes par ces classes ; rendre la teinte du total commune à toute sa ligne. Garder les noms, signatures et comportements.
- [x] Retirer les anciens fonds mobiles dans `history-mobile.css` et `history-treasury.css` ; faire porter aux montants de résultat leur accent local. Les panneaux de comparaison restent inchangés.
- [x] Capturer les vrais composants à 1600/2048/980/390/320 px, clair et sombre, avec dépassement, remboursement, détail, comparaison et sélection. Lire toutes les captures et les contrastes ; corriger en un lot puis confirmer.
- [x] Tests complets, lint ciblé, build après retrait de la route temporaire ; revue indépendante selon Impeccable.
- [x] Mettre à jour la documentation de design à partir du rendu final. Pas de commit automatique.

## Preuves

Baseline : 1 150 tests dans 117 fichiers, 23,84 s.
Après réalisation : 1 150 tests dans 117 fichiers, 31,80 s ; lint ciblé réussi.
Journaux : `/private/tmp/planora-table-palette-{baseline,tests,lint,build}.log`.

Deux passes visuelles, correction groupée des filets du bilan final entre les deux.
18 captures finales `palette-*.png` dans `.impeccable/review/`, toutes ouvertes.
Le navigateur a contrôlé les vues à 1600/390 px en clair et sombre, et 2048/980/320 px
en clair. Pas d’erreur JavaScript ni de débordement du document. Les intitulés,
mentions et résultats échantillonnés ont un contraste minimum de 5,39:1 en clair,
5,65:1 en sombre ; ceci ne certifie pas tous les états de l’application. Boutons
mobiles de 44 × 44 px ; survol et sélection distincts. Les données sont fictives.
Rapport : `/private/tmp/planora-table-palette-browser.json`.
La route temporaire a été retirée avant le build. Le hook de design actif n’a
signalé aucun problème déterministe sur la nouvelle feuille de surfaces.

La compilation de production réussit (exit 0). La revue indépendante conclut
« ship » dans le périmètre de cette refonte locale, sans défaut matériel après
lecture des sources, des 18 captures et des rapports. Elle accepte la jonction
du bandeau extérieur et du mois, encore sur le fond de carte existant, avec le
papier plus chaud du tableau. Elle ne recertifie pas les états non capturés ni
l’accessibilité complète de l’application et ne relance aucune vérification.
