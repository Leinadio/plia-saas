# Démonstration persistante avec switch

## Objectif

La démonstration reste une partie permanente de Plia. Elle ne disparaît pas quand le
guide est terminé et reste strictement séparée des comptes bancaires réels. Un switch
shadcn « Démo » dans la barre du haut permet de passer des données réelles aux données
fictives à tout moment.

Un nouvel utilisateur arrive pour la première fois sur « Vue d’ensemble » avec la
démonstration activée et l’infobulle de l’étape 1 ouverte. Il peut utiliser le switch
pour voir l’écran réel et connecter une banque sans perdre sa progression dans la
démonstration.

## Comportement visible

- Le switch « Démo » est toujours visible dans la barre du haut, sur ordinateur comme
  sur mobile. Il reste distinct du bouton « Guide ».
- Switch activé : les écrans « Vue d’ensemble » et « Transactions » affichent
  uniquement les données fictives. Aucun compte, mouvement ou budget réel n’est lu ou
  modifié.
- Switch désactivé : les écrans affichent uniquement les données réelles.
- Réactiver le switch restaure la dernière étape, la pause éventuelle, les catégories
  fictives et les budgets fictifs enregistrés.
- « Compris » ferme les infobulles et laisse la démonstration activée.
- « Plus tard » masque temporairement les infobulles et laisse la démonstration
  activée. Le bandeau permet de reprendre le guide.
- Le bouton « Guide » active la démonstration, repart à l’étape 1 et remet les seules
  données fictives à leur état initial.
- Un nouvel utilisateur commence avec une visite neuve. Un utilisateur déjà existant
  conserve ses données réelles à l’écran après la migration : son switch est désactivé
  par défaut. S’il active la démonstration, les infobulles restent fermées jusqu’à ce
  qu’il clique sur « Guide ».

## État enregistré en base

La table `onboarding_status`, déjà cloisonnée par utilisateur, devient l’unique source
durable de l’expérience de démonstration. Elle conserve :

- si la démonstration est affichée ;
- la visite complète et versionnée du guide ;
- les modifications faites sur les données fictives ;
- si les infobulles sont en cours, en pause ou terminées ;
- la date du premier clic sur « Compris », si elle existe.

`completed_at` devient nullable afin qu’un état puisse être créé avant la fin du
guide. Un booléen `demo_active` et un document JSONB `demo_visit` sont ajoutés. Le JSON
est validé par le code avant utilisation ; une version inconnue ou un document abîmé
retombe sur un état neuf et sûr.

La migration initialise les lignes existantes avec `demo_active = false` et une visite
déjà terminée, pour ne pas remplacer leur écran réel ni rouvrir le guide. L’absence de
ligne correspond à un nouvel utilisateur : démonstration active, visite neuve,
étape 1.

## Flux des actions

Le cadre de l’application lit l’état de démonstration avant de charger une page. Il
choisit alors les données fictives ou réelles. Le switch appelle une action serveur qui
enregistre le choix, recharge le cadre, puis reste sur « Vue d’ensemble » ou
« Transactions » selon l’écran courant.

Dans la démonstration, les changements restent immédiats à l’écran. Chaque transition
du guide et chaque modification fictive enregistre ensuite le document complet en
base. En cas d’échec réseau, l’action locale reste utilisable ; le prochain changement
retente l’enregistrement du document complet. Le switch attend la sauvegarde en cours
et reste en démo si elle échoue, afin de ne pas remplacer à l’écran une modification
encore uniquement locale. Une erreur de sauvegarde ne doit jamais provoquer une
écriture dans les tables financières.

« Compris » marque la visite comme terminée, renseigne `completed_at` si nécessaire et
conserve `demo_active = true`. « Guide » remplace la visite par un état neuf et force
`demo_active = true`. Le switch ne réinitialise jamais la visite.

## Interface et responsive

Le switch utilise le composant shadcn existant ou sa primitive officielle. Il apparaît
près du bouton « Guide ». Sur mobile, son libellé peut être visuellement raccourci mais
reste accessible sous le nom « Activer la démonstration ». Il ne rejoint pas le menu
« Actions », car le passage réel/démo doit rester immédiatement visible.

Le bandeau « Démonstration · Aucune donnée réelle » reste présent lorsque le switch est
activé. Les boutons de synchronisation et de notifications restent cachés en démo et
reviennent sur les données réelles.

## Tests et critères d’acceptation

Les tests commencent par la logique pure et le dépôt Postgres, puis couvrent les
actions serveur et les composants :

- un nouvel utilisateur obtient démo active, étape 1 et données fictives initiales ;
- un utilisateur existant reste sur ses données réelles après migration ;
- désactiver puis réactiver la démo restaure exactement les modifications enregistrées ;
- « Compris » ferme le guide sans quitter la démo ;
- « Guide » réinitialise le guide et les données fictives sans toucher aux vraies ;
- le switch reste visible et accessible sur ordinateur et mobile ;
- les pages en démo n’appellent aucun dépôt financier réel ;
- la politique RLS interdit de lire ou modifier l’état de démonstration d’un autre
  utilisateur ;
- la suite complète, la compilation et un contrôle réel du switch sont verts.

## Hors périmètre

La démonstration ne crée pas un faux compte dans les tables financières. Elle ne se
synchronise pas avec Enable Banking et ne mélange jamais ses montants aux totaux réels.
Ce travail ne change ni l’import bancaire ni les règles de calcul du budget réel.
