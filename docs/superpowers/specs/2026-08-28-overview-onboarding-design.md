# Vue d’ensemble et onboarding guidé

## Intention

Plia supprime le détour par un tableau de bord que l’utilisateur consulte peu. La
page aujourd’hui appelée « Historique » devient l’écran principal et prend le nom
« Vue d’ensemble ». Elle rassemble déjà ce que l’utilisateur vient chercher : ses
mois passés, son budget actuel et la trajectoire des mois suivants.

Le guide de découverte se déroule entièrement sur cet écran. L’utilisateur apprend
à lire puis à manipuler le vrai tableau de Plia avec des données fictives, sans être
déplacé vers Transactions et sans fournir de données bancaires.

## Nouvelle navigation

La navigation principale contient deux destinations, dans cet ordre :

1. « Vue d’ensemble » ouvre l’écran principal actuel d’Historique ;
2. « Transactions » conserve son rôle et son écran actuels.

L’onglet « Tableau de bord » disparaît. L’adresse `/app` ouvre directement « Vue
d’ensemble ». Le logo Plia renvoie lui aussi vers cet écran. L’adresse existante
`/app/historique` est conservée afin de ne pas casser les liens déjà enregistrés ;
seul le nom visible par l’utilisateur change.

Un bouton « Guide » est toujours visible après connexion. Sur ordinateur, il se
trouve dans la barre du haut, près des commandes de synchronisation. Il remet
immédiatement la démonstration à sa première étape, même après validation du guide
ou pendant un guide déjà en cours.

## En-tête mobile

Sur téléphone, l’en-tête utilise deux lignes pour éviter les chevauchements :

- la première contient la marque, le bouton « Guide », un menu « Actions » et le
  compte utilisateur ;
- la seconde contient les deux onglets « Vue d’ensemble » et « Transactions », de
  largeur égale.

Sur mobile, la synchronisation, les notifications et la calculatrice sont regroupées
dans le menu « Actions ». Le bouton « Guide » garde son libellé visible et le compte
utilisateur conserve son avatar compact. Sur ordinateur, ces commandes restent
directement visibles sur une seule ligne. Aucun bouton flottant ne recouvre le
tableau.

## Déclenchement et persistance

À la première arrivée, Plia ouvre « Vue d’ensemble » avec des données de
démonstration. Aucune connexion bancaire n’est demandée avant que l’utilisateur ait
compris la valeur du produit.

Le guide revient à chaque nouvelle session tant que l’utilisateur n’a pas cliqué sur
« Compris ». « Plus tard » masque les infobulles pour la session en cours sans
valider le guide. Un bouton de reprise reste disponible dans le bandeau de
démonstration.

Le clic sur « Compris » termine durablement le guide pour cet utilisateur. Si un
compte bancaire est déjà relié, les vraies données reviennent. Sinon, Plia propose
alors de connecter une banque, sans lancer automatiquement l’autorisation bancaire.

Le bouton permanent « Guide » démarre une relecture avec les données fictives. Une
relecture ne modifie pas la validation déjà enregistrée. La terminer ou l’abandonner
ramène donc simplement aux vraies données.

## Parcours en neuf infobulles

### 1. Vous êtes dans une démonstration

La première infobulle cible le compte Démo. Elle explique que tous les montants sont
fictifs et qu’aucune donnée bancaire réelle n’est consultée ou modifiée.

### 2. Choisissez votre période

La deuxième infobulle cible le sélecteur de mois. Elle montre comment élargir la
période vers le passé ou vers les mois à venir. Cette étape est informative : aucun
changement n’est obligatoire.

### 3. Situez-vous dans le temps

La troisième infobulle cible les en-têtes de mois. Elle explique que les mois passés
reposent sur les opérations connues, que le mois courant relie le réel au prévu et
que les mois suivants représentent une projection.

### 4. Voyez ce qui rentre

La quatrième infobulle cible la section des revenus. Elle explique la différence
entre ce qui était attendu et ce qui a réellement été reçu.

### 5. Anticipez ce qui doit sortir

La cinquième infobulle cible les dépenses prévues. Elle relie le budget fixé, le
montant déjà dépensé et le reste disponible.

### 6. Repérez les dépenses imprévues

La sixième infobulle cible les dépenses non prévues. Elle montre qu’elles affectent
immédiatement le solde même lorsqu’aucune enveloppe ne les avait anticipées.

### 7. Ajustez votre budget

La septième infobulle cible la valeur de l’enveloppe Transport du mois courant. Elle
demande de passer son budget fictif de 120 € à 150 €. Le clic ouvre le panneau de
modification habituel et l’utilisateur peut saisir la nouvelle valeur.

Pendant cette étape, l’infobulle ne bloque ni le tableau ni le panneau latéral. Le
bouton « Suivant » reste indisponible tant que la valeur attendue n’a pas été
appliquée. La démonstration recalcule immédiatement les totaux et les mois suivants,
sans écrire en base.

### 8. Comprenez chaque montant

La huitième infobulle demande de cliquer sur un montant désigné. Le panneau de droite
s’ouvre et montre les opérations qui composent ce total. Une fois le panneau ouvert,
l’infobulle se replace près de son contenu sans recouvrir les lignes à consulter.

Le bouton « Suivant » devient disponible après l’ouverture du détail. Toute
l’application reste cliquable pendant cette étape.

### 9. Regardez où vous allez

La dernière infobulle cible les lignes de total et de solde de fin de mois. Elle
explique comment les revenus, les dépenses et les ajustements construisent la
trajectoire des mois suivants. Son bouton principal porte le libellé « Compris ».

## Comportement des infobulles

Chaque infobulle attend que sa zone soit réellement présente et mesurée avant de
s’afficher. Elle ne doit jamais apparaître au centre par défaut pendant le chargement.
Elle reste ancrée près de sa zone et se replace lors d’un défilement, d’un
redimensionnement ou de l’ouverture du panneau de détail.

Les étapes informatives atténuent le reste de l’écran et gardent le focus dans la
boîte de dialogue. Les étapes 7 et 8 sont interactives : elles ne posent aucun voile
bloquant, ne retiennent pas la touche Tab et ne déclarent pas la boîte comme modale.

Sur téléphone, l’infobulle devient un panneau bas. La cible est amenée dans la partie
visible au-dessus du panneau. L’ouverture du panneau de détail ne doit ni cacher le
champ ni remettre l’infobulle au centre.

Les commandes disponibles sont « Retour », « Suivant » et « Plus tard ». La dernière
étape remplace « Suivant » par « Compris ». Échap correspond à « Plus tard ». Les
animations respectent la préférence de réduction des mouvements.

## Données de démonstration

Le jeu fictif conserve un compte crédible, plusieurs mois passés et futurs, des
revenus réguliers ou décalés, des dépenses prévues, des dépenses imprévues et une
enveloppe Transport réglée à 120 €.

Deux gestes sont mémorisés uniquement dans la session de démonstration : le passage
de Transport à 150 € et l’ouverture du détail demandé. Les données ne sont jamais
insérées dans la base et les commandes bancaires restent inactives en démonstration.

## États particuliers

- Si une cible tarde à apparaître, le guide attend et réessaie sans afficher une
  infobulle au centre.
- Si une cible n’existe réellement plus, le guide affiche en bas de l’écran une
  explication neutre avec la possibilité de réessayer ou de passer l’étape.
- Un rechargement reprend l’étape et les gestes de la session en cours.
- Une nouvelle session non validée recommence à la première étape.
- La relance depuis « Guide » démarre toujours à la première étape.
- Le thème sombre conserve un contraste lisible pour la cible, le voile et
  l’infobulle.

## Tests attendus

Les tests sont écrits avant le code et couvrent :

1. l’ordre « Vue d’ensemble », puis « Transactions », sans Tableau de bord ;
2. l’ouverture de `/app` et du logo sur « Vue d’ensemble » ;
3. la présence permanente du bouton « Guide » ;
4. la composition mobile sur deux lignes sans chevauchement ;
5. les neuf étapes, leurs zones et leur ordre ;
6. le maintien de toutes les étapes sur « Vue d’ensemble » ;
7. le blocage de « Suivant » avant les gestes des étapes 7 et 8 ;
8. le recalcul fictif après le changement de Transport ;
9. le replacement de l’infobulle après l’ouverture du détail ;
10. l’absence de voile, de piège de focus et de blocage pendant les interactions ;
11. l’absence d’infobulle centrée avant la mesure de sa cible ;
12. la pause, la reprise, « Compris » et la relance permanente du guide ;
13. l’absence de lecture ou d’écriture de données financières réelles en démo.

La vérification finale se fait sur le vrai serveur en mode ordinateur et téléphone,
avec le thème clair puis sombre. Elle vérifie notamment la saisie de 150 €,
l’ouverture du détail et l’absence de chevauchement dans l’en-tête mobile.

## Hors périmètre

- la page Transactions ne reçoit pas de nouvelle infobulle ;
- les fonctions avancées ne sont pas ajoutées au guide ;
- aucune donnée d’analyse comportementale n’est collectée ;
- aucune connexion bancaire n’est lancée automatiquement ;
- aucune donnée de démonstration n’est écrite dans la base.
