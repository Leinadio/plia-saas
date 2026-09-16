# Règles automatiques

La page **Automatisation**, dans la navigation de l’application, relie les nouvelles
transactions à un budget du même compte. L’utilisateur choisit un morceau de
libellé, le sens (dépense ou entrée), un minimum et un maximum facultatifs et
le budget ou son sous-poste. Pour un montant exact, les deux bornes sont égales.
La recherche ignore la casse, les accents et les espaces répétés ; elle cherche
une suite de caractères littérale, pas une expression régulière.

Les règles actives s’appliquent dans l’ordre de création. La première règle
compatible gagne. Modifier une règle conserve sa position. Les montants sont
comparés en centimes et en valeur absolue, avec des bornes inclusives. Une
dépense ne rejoint pas un budget de revenus ; une entrée peut rejoindre un
budget de dépenses, par exemple pour un remboursement.

## Nouvelles opérations et aperçu

Les nouvelles opérations bancaires comptabilisées sont traitées dans leur
transaction d’import, après reprise des choix faits sur les opérations en
attente. Les opérations déjà importées ne sont pas reparcourues à chaque
synchronisation. Les nouvelles saisies manuelles sans budget suivent les mêmes
règles. Modifier une saisie existante ne déclenche pas les règles.

Créer ou modifier une règle ne classe pas l’historique. **Voir les correspondances**
affiche jusqu’à 200 opérations encore sans budget, hors exclusions et opérations
ignorées. **Rattacher…** applique uniquement les identifiants de cet aperçu, après
une nouvelle vérification des critères, de l’ordre des règles et de la destination.
Une règle modifiée ou mise en pause entre les deux étapes rend l’aperçu périmé.
Si plus de 200 opérations correspondent, refaire un aperçu après application
permet de traiter les suivantes.

Les dates du budget et du sous-poste sont vérifiées avec le mois budgétaire de
l’opération, ou sa date s’il n’a pas été déplacé. Un budget découpé exige un
sous-poste. S’il est découpé après création d’une règle visant le groupe seul,
cette règle ne classe plus rien tant qu’un sous-poste n’est pas choisi.
Supprimer une destination supprime aussi ses règles ; l’historique des
notifications conserve les noms au moment du rattachement.

## Notifications et corrections

Chaque rattachement écrit en une seule instruction SQL l’affectation et son
événement de notification. Un échec annule les deux. Les notifications indiquent
le libellé, le montant, la date de l’opération, le compte, le budget et le libellé
de la règle. Elles partagent la cloche avec les dépassements. Le statut Vu/Non vu
est conservé par utilisateur. Elles sont rangées au mois du rattachement, même
si l’opération est ancienne, et restent accessibles une fois vues.

La personne peut corriger le budget depuis les transactions. Une opération déjà
traitée automatiquement n’est pas retraitée après cette correction : l’événement
unique par transaction protège le choix manuel. Les transactions historiquement
retirées manuellement, avant tout rattachement automatique, ne portent pas de
marque distincte dans le modèle existant ; elles peuvent donc apparaître dans
un aperçu explicite si elles sont sans budget. Aucun retrait manuel ne déclenche
l’application spontanée d’une règle.

Mettre en pause ou supprimer une règle ne défait pas ses rattachements.
Le mode démonstration montre un exemple, sans lecture des vraies règles ni écriture.

## Installation et vérification

Le schéma principal `src/db/schema.pg.sql` contient les deux tables additionnelles,
leurs index et leurs politiques d’accès par propriétaire. Sur une base existante :

```sh
node --env-file=.env.local scripts/appliquer-automatisations.mjs
```

L’installateur rejoue seulement le bloc additionnel dans une transaction, sans
modifier de transaction bancaire. Il a été exécuté sur la base configurée le
17 septembre 2026. Aucune règle ni opération réelle n’a été créée pour les essais.

Le service exige le contexte `pourUtilisateur` / `pourMoi` déjà transactionnel.
Il n’ouvre aucune transaction imbriquée. Le compte est verrouillé pour sérialiser
les changements de règles et leur application, et les transactions candidates
sont verrouillées et revérifiées avant rattachement. Les politiques de base
bloquent les lectures et écritures d’autres utilisateurs ; la destination doit
appartenir au compte de la règle.

Tests : critères, erreurs, sens, bornes, priorité, pause, isolation entre comptes,
mois et sous-postes, aperçu périmé, lot borné, choix manuels, annulation atomique,
notifications vues, import bancaire sans doublons, saisie manuelle et actions serveur.
La revue navigateur utilise les composants réels avec données fictives et actions
simulées à 1440 et 390 px en clair et sombre, sans connexion bancaire réelle.
