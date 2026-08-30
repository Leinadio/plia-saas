# Onboarding guidé sur données de démonstration

## Intention

La première expérience de Plia ne demande aucune donnée bancaire. Après la création
de son compte, l'utilisateur entre directement dans les vrais écrans de l'application,
alimentés par un jeu de données fictif clairement signalé. Le produit prouve d'abord
sa valeur : comprendre ce qui entre, ce qui sort et où le solde atterrit dans les mois
à venir.

La demande de connexion bancaire n'apparaît qu'après le clic final sur « Compris ».
Elle reste une action volontaire et séparée : Plia ne contacte jamais une banque et
n'ouvre jamais son parcours d'autorisation sans ce clic explicite.

Cette découverte concerne les nouveaux comptes comme les comptes déjà existants. Un
utilisateur qui n'a jamais validé le guide voit donc la démonstration, même si une
banque est déjà reliée. Dans ce cas, ses données réelles restent masquées pendant la
découverte et reviennent immédiatement après « Compris ».

## Moment de réussite

Le guide est réussi quand l'utilisateur comprend trois choses :

1. la projection est le solde attendu à la fin de chaque mois ;
2. une enveloppe montre ce qui était prévu, ce qui a été dépensé et ce qui déborde ;
3. classer une opération ou ajuster un budget change la trajectoire des mois suivants.

Le guide ne cherche pas à enseigner toute l'application. La calculatrice, les
notifications, les commentaires et les opérations manuelles restent disponibles,
mais ce chantier ne leur ajoute aucune nouvelle infobulle.

## Parcours en sept étapes

### 1. L'horizon des prochains mois

La première infobulle s'ancre sur l'horizon du tableau de bord. Elle explique que
chaque colonne indique le solde attendu à la fin d'un mois, et que les mois futurs
sont des prévisions, pas des sommes acquises.

### 2. La projection de fin de mois

La deuxième infobulle désigne le montant principal du relevé. Elle le présente comme
la réponse à la question « que restera-t-il à la fin du mois si ce qui est prévu se
réalise ? ».

### 3. Les enveloppes et le dépassement

La troisième infobulle s'ancre sur une enveloppe déjà entamée puis montre une enveloppe
dépassée. Elle nomme le budget, le dépensé, le reste et le débord rouge qui continue
au-delà de la jauge.

### 4. Classer une opération

Le guide ouvre l'écran des opérations et désigne la dépense fictive « MONOPRIX » de
68,40 €. L'utilisateur doit la rattacher à l'enveloppe « Courses ». Ce geste reste en
mémoire dans la démonstration et met immédiatement à jour la jauge correspondante.
« Suivant » reste désactivé tant que ce geste n'est pas accompli.

### 5. Ajuster une enveloppe

Le guide ouvre l'historique, cible l'enveloppe « Transport » et demande de passer son
budget fictif de 120 € à 150 €. La projection de démonstration est recalculée sans
écrire le moindre montant réel. « Suivant » reste désactivé tant que la valeur n'a pas
été appliquée.

### 6. Comprendre les mois qui se suivent

La sixième infobulle désigne les colonnes de l'historique. Elle relie le mois passé,
le mois courant et les mois futurs, puis explique qu'un reste ou un dépassement ne
disparaît pas au changement de mois.

### 7. Rafraîchir et revenir au réel

La dernière infobulle s'ancre sur la commande de rafraîchissement. Elle rappelle que
les données bancaires datent de la dernière synchronisation et ne sont jamais en temps
réel. Son bouton principal est « Compris ».

« Compris » termine définitivement le guide pour cet utilisateur. La démonstration se
ferme : un compte déjà relié retrouve ses vraies données ; un compte sans banque voit
l'écran qui propose de connecter une banque.

## Données de démonstration

Le jeu de données représente un indépendant aux revenus irréguliers. Il est stable,
daté relativement au mois courant et identique pour tous :

- un « Compte Démo » avec un solde crédible ;
- une mission payée ce mois-ci et une rentrée décalée le mois suivant ;
- un loyer, des courses, des transports et quelques logiciels ;
- une enveloppe « Courses » entamée ;
- une enveloppe « Transport » dépassée ;
- des mois futurs dont la trajectoire change après les deux gestes guidés ;
- des opérations classées et non classées, dont « MONOPRIX · −68,40 € ».

Ces données vivent dans des fonctions pures et des objets en mémoire. Elles ne sont
jamais insérées dans Postgres et ne portent aucun identifiant pouvant être confondu
avec un vrai compte. Les deux modifications du guide vivent dans l'état de la
session de démonstration, conservé pendant la navigation entre les écrans.

## Choix entre démonstration et données réelles

Avant toute lecture financière, chaque écran détermine son mode :

- onboarding non terminé : démonstration ;
- onboarding terminé : données réelles ;
- relance volontaire depuis « Revoir le guide » : démonstration ;
- fin ou abandon d'une relance volontaire : retour aux données réelles.

En mode démonstration, les écrans ne lisent pas les comptes, opérations ou budgets
réels. Ils reçoivent directement les mêmes formes de données que les composants
habituels, mais remplies par les fixtures. Cette séparation évite autant les écritures
accidentelles que l'apparition fugace d'un vrai solde derrière une infobulle.

La barre de navigation conserve le mode pendant les changements d'écran. Un bandeau
fin et neutre, sous la barre du produit, reste visible partout : pastille
« Démonstration » puis « Aucune donnée réelle ». Il utilise la surface creusée et
l'encre du système, sans introduire une nouvelle couleur ni une masse sombre.

## Persistance et reprise

La table `onboarding_status` conserve une seule décision durable par utilisateur :
`user_id` est sa clé primaire et `completed_at` contient la date du clic sur
« Compris ». Elle est cloisonnée par utilisateur comme les autres données de
l'application et l'écriture est idempotente.

L'absence de ligne signifie « guide à montrer ». Ce choix rend le lancement cohérent
pour les comptes existants : ils voient eux aussi la démonstration une fois.

« Plus tard » ne marque pas le guide comme compris. Il masque les infobulles pendant
la visite en cours tout en laissant les données de démonstration à l'écran. Une visite
correspond à la durée de la session du navigateur : la pause et l'étape courante
survivent à un rechargement, mais pas à une nouvelle session. Le guide revient alors à
la première étape. Un bouton discret « Reprendre le guide » reste visible dans le
bandeau de démonstration pendant la pause.

Après validation, « Revoir le guide » apparaît dans le menu du compte. Il relance une
session de démonstration sans effacer la date de validation. « Plus tard » ou la fin
de cette relecture ramène donc simplement aux vraies données.

## Architecture de l'interface

Un contrôleur client conservé par le cadre de l'application porte l'étape courante,
les deux gestes fictifs et l'état de pause. Il survit aux changements entre tableau de
bord, opérations et historique. L'étape et la pause sont recopiées dans le stockage de
session du navigateur pour tenir après un rechargement, jamais dans la base.

La définition du parcours reste une liste déclarative. Chaque étape indique :

- l'écran attendu ;
- la zone à cibler ;
- le titre et le texte ;
- le placement préféré ;
- l'éventuel geste obligatoire ;
- l'étape précédente et l'étape suivante.

Les zones réelles de Plia reçoivent un repère stable réservé au guide. Le contrôleur
n'a pas à connaître leur structure interne. Lors d'un changement d'écran, il attend
que la zone soit présente, la fait défiler dans la partie visible puis place
l'infobulle.

Sur ordinateur, l'infobulle est ancrée près de la zone sans la recouvrir. La zone
reçoit un filet renforcé et le reste de l'écran recule sous un voile léger. Sur
téléphone, l'explication devient un panneau bas ; la zone ciblée reste visible au-
dessus. Pour les deux gestes interactifs, la zone ciblée reste cliquable.

Le focus clavier entre dans l'infobulle. Tab parcourt ses commandes, les flèches
« Retour » et « Suivant » fonctionnent au clavier, et Échap déclenche « Plus tard ».
Le mouvement respecte la préférence de réduction des animations.

## Protection contre les écritures réelles

Le mode démonstration n'appelle aucune action qui écrit en base ni aucune route
bancaire. Les deux contrôles interactifs reçoivent explicitement un comportement de
démonstration et modifient seulement l'état en mémoire.

Les autres commandes d'écriture sont masquées ou désactivées avec une explication
« Disponible avec vos données ». La commande de rafraîchissement est montrée à la
dernière étape mais n'est pas exécutée. La banque n'est jamais contactée tant que
l'utilisateur n'a pas quitté la démo puis cliqué lui-même sur « Connecter ma banque ».

## États particuliers

- Si une zone n'apparaît pas après le chargement, l'infobulle se recentre, explique
  que l'élément n'est pas disponible et permet de continuer.
- Un rechargement pendant le guide reprend l'étape courante dans la même visite.
- Une nouvelle visite sans validation recommence à la première étape.
- Un utilisateur validé et sans banque voit l'écran de connexion, pas une page vide.
- Un utilisateur validé avec une banque voit ses vraies données.
- Une relance manuelle ne change jamais le choix durable déjà enregistré.
- Le thème sombre conserve les mêmes rôles : voile, encre, surface et focus adaptés,
  sans changer la signification des couleurs.

## Tests attendus

Les tests sont écrits avant l'implémentation et couvrent :

1. la nouvelle table, ses droits, son cloisonnement et l'idempotence de « Compris » ;
2. le choix du mode pour un utilisateur nouveau, existant, validé ou en relecture ;
3. les sept transitions, les retours en arrière, la pause et la reprise ;
4. le blocage de « Suivant » avant les deux gestes obligatoires ;
5. le recalcul fictif après classement et ajustement ;
6. l'absence d'écriture réelle pendant toute une session de démonstration ;
7. la sortie vers les vraies données ou vers la connexion bancaire selon le compte ;
8. le repli centré lorsqu'une cible manque ;
9. le clavier, la réduction des animations et la composition téléphone ;
10. le parcours « Revoir le guide » depuis un compte déjà validé.

La vérification finale se fait sur le vrai serveur, en format ordinateur et téléphone,
avec un compte sans banque puis un compte déjà relié. La suite complète de tests et le
build doivent être verts avant toute conclusion.

## Hors périmètre

- aucune donnée analytique ou mesure d'abandon ;
- aucun centre d'aide complet ;
- aucune vidéo dans le guide ;
- aucune donnée de démonstration écrite en base ;
- aucune connexion bancaire automatique ;
- aucun tutoriel exhaustif sur les fonctions avancées.

Le prototype de connexion bancaire créé avant cette spécification est conservé comme
écran suivant pour un utilisateur validé sans banque. Il ne constitue plus la première
expérience après la création du compte.
