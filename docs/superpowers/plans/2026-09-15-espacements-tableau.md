# Espacements du relevé — Implementation Plan

> Exécution dans la session courante, selon les autorisations de l’utilisateur.

**Goal:** rendre réguliers les espacements du relevé sans changer ses couleurs.
**Architecture:** une feuille locale porte les rôles d’espacement et la largeur des noms ; les composants existants conservent leurs parcours.
**Tech Stack:** React, Next.js, Tailwind, CSS.
**Spec:** docs/superpowers/specs/2026-09-15-espacements-tableau-design.md

## Contraintes
Couleurs, textes et calculs conservés. Boutons mobiles de 44 px. Pas de commit automatique.

## Réalisation
- [x] Tests initiaux : 1 150 réussis. Diagnostic visuel indépendant et scan mécanique (aucun signal).
- [x] Créer history-layout.css : cellules 12 px, sections 24 px, noms 20 rem / 16 rem sous 1024 px ; appliquer history-layout sur le conteneur existant.
- [x] Modifier history-grid.tsx : Reste 9 rem, espace revenus 18 rem, largeur de trame 32/5 rem, trésorerie 10,5 rem ; mois 96 px, espace 24 px, rôles de noms/détails.
- [x] Modifier history-reading.css/history-treasury.css : titres sur deux lignes communes, texte associé proche, centrage vertical, suppression des marges cumulées.
- [x] Modifier history-mobile.css/app-theme.css : retraits 16 px, lignes 48 px, sections 8 px autour des boutons 44 px, détails 12 px.
- [x] Contrôler dans le serveur réel aux tailles prévues ; corriger les défauts observés en une passe.
- [x] Tests, lint, build et documentation du rendu final.

## Validation finale

Serveur réel sur https://localhost:3000, avec composants du produit et données
fictives. Captures à 1600 et 390 px en clair/sombre, 980 et 320 px en clair.
Vérifications : noms et montants longs, enveloppe dépliée, choix de comparaison,
détail du remboursement, fermeture/réouverture des revenus. Aucun débordement
du document ni erreur JavaScript ; explications des quatre colonnes alignées ;
boutons mobiles de 44 × 44 px. La route temporaire a été supprimée.

1 150 tests réussis dans 117 fichiers (30,40 s). Lint ciblé et build de production
réussis. Scan de disposition final : aucun signal. Documentation mise à jour
dans DESIGN.md, la fiche de surface et le fichier de design.

Preuves locales : `.impeccable/review/spacing-*.png`,
`/private/tmp/planora-spacing-browser.json`,
`/private/tmp/planora-spacing-tests-final.log`,
`/private/tmp/planora-spacing-build.log`.
