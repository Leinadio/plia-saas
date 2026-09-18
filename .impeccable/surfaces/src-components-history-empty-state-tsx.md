---
version: 1
slug: "src-components-history-empty-state-tsx"
primary_target: "src/components/history-empty-state.tsx"
related_targets: ["src/components/history-empty-state.module.css", "src/components/history-with-detail.tsx", "src/components/new-group-inline.tsx"]
---

## Premier budget — 18 septembre 2026

Mode Operate. Remplacer les sections « Ce qui rentre » et « Ce qui sort » lorsque
le compte sélectionné ne possède aucun groupe, par une invitation utilisable à
créer son premier budget. Préserver la palette commune, les surfaces existantes,
la trésorerie actuelle et l’accès aux transactions. Aucun nouveau calcul financier.

La condition porte sur les groupes du compte, jamais sur les lignes visibles :
un mois sans données conserve le tableau si des budgets existent. Les comptes
sans connexion gardent leur accueil bancaire existant. Le mode démonstration,
qui contient des groupes, conserve son tableau et son parcours guidé.

« Faites une place à ce qui compte. » accompagne une icône Wallet, une explication
courte et l’action « Créer mon premier budget ». Un bouton secondaire permet de
commencer par un revenu. Trois raccourcis (logement, loisirs, voyage) ouvrent le
formulaire existant et préremplissent uniquement son nom ; rien n’est écrit avant
validation. Aucun montant d’exemple ne se fait passer pour une donnée personnelle.

Le formulaire conserve le compte, le mois consulté et les bornes autorisées. Il
se ferme lors d’un changement de compte ou de période. Le focus passe au nom à
l’ouverture et revient au déclencheur à l’annulation. Les libellés Nom et Montant
sont reliés à leurs champs. Les contrôles d’ouverture exposent aria-controls et
aria-expanded. Le tableau reprend sa place après réception du premier groupe.

Une surface unique avec bordure, sans cartes imbriquées pour les suggestions.
Titres Bricolage 40/32 px ; texte 16/15 px. Les trois raccourcis s’empilent sous
900 px ; le formulaire se lit verticalement sous 640 px, avec des cibles de 44 px
et une réserve sous le bloc pour les outils mobiles. Les rôles planora communs
portent les deux thèmes ; aucune nouvelle couleur ou image. Les changements de
couleur des raccourcis respectent prefers-reduced-motion.

Vérification : quatre tests de comportement écrits et vus échouer avant
l’implémentation, puis réussis. Contrôles du premier budget prérempli, absence
d’écriture avant validation, compte/mois/sens transmis, retour du tableau et
annulation au changement de compte. Suite complète : 1294 tests dans 140 fichiers.
ESLint, TypeScript et détecteur de design ciblé réussis. Vérification dans le vrai
navigateur sur un compte sans budget, rendu et préremplissage à largeur habituelle,
390 et 320 px, annulation et focus. Aucune création sur les données réelles.
Les comptes avec des budgets conservent le tableau habituel.
