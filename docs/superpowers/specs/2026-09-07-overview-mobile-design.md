# Vue d’ensemble sur téléphone

Proposition approuvée le 7 septembre 2026 : vue verticale d’un mois, comparaison
multi-mois par indicateur, toutes les actions du tableau conservées. Ordinateur
inchangé. Les calculs et les références de cellules restent communs aux deux vues.

Sous 640 px, afficher un navigateur de mois avec sélection directe et flèches.
Le mois courant est choisi s’il appartient à la période chargée, sinon le premier.
Le mode Comparer conserve la plage de mois et propose chaque indicateur du tableau.
Chaque poste montre alors une valeur par mois, verticalement. Revenir au mois ne
doit pas effacer la plage choisie. Les bornes existantes restent applicables.

Le relevé commence par les soldes et l’estimation, puis les postes, sous-postes,
opérations et totaux. Les montants portent leur libellé. Les soldes intermédiaires
sont accessibles avec le bouton existant de détail des mouvements. Les postes
et opérations des autres mois ne polluent pas la lecture d’un seul mois.

Préserver : calculs et explications, sélection et révélation des montants liés,
création et gestion des revenus/dépenses/sous-postes, périodes, budgets datés et
leur historique, provision des non-catégorisés, commentaires, rattachement du
poste et du mois des opérations, exclusion/réintégration, dépassements et Vu,
opérations hors calcul, choix du compte et explication de la prévision.
Le panneau de détail prend toute la largeur du téléphone. Retour explicite au
relevé ; une référence vers un autre mois doit rendre sa destination visible.

Vérifier sur serveur réel à 390 et 320 px et sur ordinateur. Les tests couvrent
les interactions et les références de montants ; pas de tests qui figent le CSS.
