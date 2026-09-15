# La trésorerie, étape par étape

Direction approuvée le 15 septembre 2026. L’utilisateur demande une réalisation complète sans nouvelle question.

## Lecture et périmètre

Mode Operate, dans le relevé existant de Planora, ordinateur et mobile, thèmes clair et sombre. Les trois calculs restent inchangés. Le titre commun est « Votre trésorerie, étape par étape ». Les parcours s’appellent « Opérations réelles », « Selon vos budgets » et « Dépassements inclus ». Sur les mois futurs, le réel prolongé est explicitement une estimation, jamais une trésorerie connue.

Chaque enveloppe affiche séparément son mouvement net signé et le montant restant signé. Le solde intermédiaire est une étape dans l’ordre du tableau, pas un solde bancaire historique à la date d’une transaction. Un filet vertical guide la lecture. Une dépense intégralement remboursée conserve des cellules vides. Le résultat à zéro reste affiché si un mouvement réel y conduit ; un découvert garde son signe et une mention textuelle.

Le bandeau final distingue la trésorerie actuelle à la dernière synchronisation, le résultat passé et les deux prévisions. Les montants restent cliquables et transportables dans la calculatrice, avec leurs références existantes.

Sur mobile, un seul parcours de trésorerie accompagne les montants de chaque enveloppe : opérations réelles en vue mensuelle passée/courante, budget en vue mensuelle future, choix du filtre des soldes en comparaison. Le filtre des revenus et celui des dépenses gardent leur portée. Les remboursements neutres restent vides. Aucun sélecteur déroulant ni bouton de détail supprimé n’est réintroduit.

## Validation

Tests de référence avant modification : 1 136 tests réussis dans 116 fichiers. Tests de régression du signe et du parcours mobile avant implémentation, puis suite complète, TypeScript, lint ciblé, build et vrais rendus ordinateur/mobile dans les deux thèmes. Revue visuelle indépendante et documentation finale.

## Résultat vérifié

1 144 tests réussis dans 117 fichiers, TypeScript et lint ciblé réussis, compilation de production réussie. Les captures réelles à 1 600 × 1 100 et 390 × 844 couvrent les deux thèmes, la comparaison, les panneaux et les résultats négatifs. La revue complète a relevé uniquement la mention de découvert manquante au résultat final ; ce point a été corrigé puis jugé résolu (disposition ship). Les captures portent des données fictives. La route temporaire de vérification a été supprimée et retourne 404.

L’explication des opérations non catégorisées inclut désormais la provision et le dépassement dans le mouvement affiché ; le résultat calculé ne change pas. Cette correction d’explication est couverte par un test qui a échoué avant modification.
