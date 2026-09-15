# Un tableau qui explique ses montants

Direction approuvée : lecture de gauche à droite, prévision → opérations → résultat.
Mode Operate, dans l’identité Planora existante. Application uniquement, ordinateur
et téléphone, clair et sombre. Aucune nouvelle règle financière.

L’introduction « Votre trésorerie, étape par étape » apparaît une seule fois pour
le relevé, quel que soit le nombre de sections ou de mois. Les en-têtes expliquent
Attendu et Reçu côté revenus ; Budget, − Dépensé, + Remboursements / apports,
= Reste / manque côté dépenses. Le reste de l’enveloppe et la trésorerie sont
explicitement distincts. Les trois parcours de trésorerie et leurs montants restent.

Les résultats d’enveloppe sont plus forts que les autres chiffres et portent une
mention adaptée : encore disponibles, de dépassement, budget utilisé ou entièrement
remboursé. Une rentrée supérieure à la dépense ne doit pas être qualifiée de simple
budget restant : c’est un excédent reçu. Un remboursement partiel peut recréer une
marge ; un remboursement intégral termine la réservation, selon le modèle existant.
Les totaux doivent additionner les montants affichés, avec la même décomposition au clic.

Les fonds restent doux, les séparations fines, les chiffres alignés. Sur téléphone,
le même ordre se lit verticalement et les filtres de comparaison restent indépendants.
Les actions, références de cellules, dépliages, calculatrice et données sont conservés.

Validation : tests de rendu et de calcul au clic, vrai serveur avec données fictives,
captures ordinateur/mobile dans les deux thèmes, contrôle des en-têtes et remboursements,
revue indépendante puis documentation. Aucune route temporaire livrée.

## Réalisation et vérification

L’introduction est unique sur ordinateur comme sur mobile. Les en-têtes portent les
descriptions et les opérateurs ; les résultats de chaque enveloppe expliquent leur
état. Les totaux de Dépensé et Reçu additionnent le brut de leurs lignes et le panneau
de calcul montre le même détail. Les réservations closes après remboursement restent
explicitement retirées. Les modèles de budget et de trésorerie ne changent pas.

Vérification au vrai serveur avec données fictives : 14 captures ordinateur/mobile,
clair/sombre, comparaison et détail dans `.impeccable/review/reading-*.png`. Une
introduction, aucun débordement du document, aucune erreur navigateur. La revue
indépendante a demandé une correction de contraste du pied sombre. La même surface
sombre couvre maintenant résultat, estimation et dépassement ; le montant de
dépassement atteint 8,24:1. Passe de verdict limitée à ce P2 : résolu, disposition ship.

Après correction : 1 150 tests réussis sur 117 fichiers, lint ciblé et build de production
réussis. Le détecteur n’a remonté aucun résultat. La route temporaire a été supprimée
et retourne 404. Ces contrôles ne constituent pas un essai sur un compte bancaire réel.
