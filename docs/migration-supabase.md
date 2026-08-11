# Migration vers Supabase — le plan

**Point de départ :** 770 tests verts, 73 fichiers de test, SQLite en fichier local.
**Point d'arrivée :** Postgres hébergé chez Supabase, l'application déployée sur Vercel,
les données de chaque personne inaccessibles aux autres.

---

## Ce qui rend cette migration coûteuse

Ce n'est pas Postgres. C'est que `better-sqlite3` répond **tout de suite**, alors qu'un
Postgres distant répond **plus tard**. Aujourd'hui la base est lue comme une variable ;
demain chaque lecture est une attente. Concrètement :

- **142 requêtes** écrites à la main dans 9 fichiers de repositories,
- **61 fonctions** exportées qui deviennent toutes asynchrones,
- **15 fichiers** qui les appellent et devront attendre leur réponse,
- **39 fichiers de test** qui ouvrent une base `:memory:` qui n'existera plus.

Rien de tout cela n'est difficile. Tout est long, mécanique, et se casse en silence si
on le fait sans filet. D'où l'ordre ci-dessous : le filet d'abord.

---

## Étape 1 — Faire tourner les tests sur du vrai Postgres

**Avant de toucher au code de production.** Les tests ouvrent une base SQLite en
mémoire. On la remplace par **PGlite** : un vrai Postgres compilé en WebAssembly, qui
tourne en mémoire, sans Docker et sans serveur. Les tests gardent leur vitesse actuelle
(2 secondes) tout en exécutant du SQL Postgres pour de bon.

Un seul point d'entrée à écrire dans les utilitaires de test, qui rend une base vide à
qui la demande. Attention au prix : allumer un Postgres coûte 600 ms, vider ses tables
en coûte 5. La suite ouvre une centaine de bases — le point d'entrée recycle donc les
moteurs au lieu d'en rallumer un à chaque fois.

**Fait.** Le socle est en place et la suite reste verte : les tests existants n'y
basculeront qu'à l'étape 3, quand le code qu'ils exercent saura parler à Postgres. Le
passage au rouge, c'est là qu'il aura lieu — et le compteur de tests verts servira de
barre de progression jusqu'à la fin.

## Étape 2 — Traduire le schéma

Dix tables à réécrire en Postgres. Les corrections qui s'imposent au passage :

- Les identifiants auto-incrémentés changent de syntaxe.
- Les colonnes qui valent 0 ou 1 (`excluded`, `ignored`, `manual`, `planned`) deviennent
  de vrais booléens.
- **Les montants quittent le flottant pour le décimal.** Aujourd'hui les euros sont
  stockés en nombre à virgule flottante : c'est un bug latent qui finira par afficher
  des centimes qui n'existent pas. Postgres sait faire du décimal exact, on en profite.

**Fait.** Avec une trouvaille au passage : l'ancien schéma avait pris du retard sur la
vraie base. Il déclarait encore une colonne sur les sous-postes qu'une migration
retirait aussitôt. Traduire le schéma tel qu'il était écrit aurait ressuscité une
colonne morte, sans que rien ne le signale. La forme des dix tables est donc relevée
sur la base réelle, colonne par colonne, et verrouillée par un test.

Ajoutés aussi : les **index** qui manquaient. La base locale n'en avait aucun, et elle
avait raison — sur un seul utilisateur, parcourir une table entière est instantané.
Partagée entre des centaines de personnes, la même table se reparcourt à chaque
affichage de mois.

Les **557 lignes de migrations** accumulées, elles, ne disparaissent pas encore. Elles
n'ont jamais servi qu'à rattraper la base locale d'une seule machine et n'ont aucun
avenir, mais neuf fichiers de test s'appuient encore dessus — les mêmes que l'étape 3
va réécrire. Les supprimer maintenant serait faire deux fois le même travail. Elles
partent avec SQLite, à la fin de l'étape 3.

## Étape 3 — Remplacer la couche d'accès

Un petit module qui offre les trois mêmes gestes qu'aujourd'hui — lire une ligne, lire
toutes les lignes, écrire — mais en asynchrone, sur une connexion Postgres. Le SQL déjà
écrit reste du SQL écrit à la main : pas d'ORM, pas de réécriture des 142 requêtes dans
un autre langage. Seuls les emplacements de paramètres changent de notation.

**Le module est écrit.** Il porte aussi la traduction des types, où se cachait un piège
sérieux : Postgres rend les montants et les comptages sous forme de **texte**. Sans
traduction, additionner deux soldes de douze euros donne « 12.3412.34 », et rien ne
proteste avant l'affichage.

**Fait.** Les 142 requêtes sont portées, les 61 fonctions sont asynchrones, et les
appelants les attendent — des pages aux actions serveur. Les tests aussi : la suite
entière tourne désormais sur Postgres. 732 tests verts, l'application compile.

Deux choses méritent d'être notées. D'abord, un piège de sécurité propre à ce genre de
migration : les vérifications du type « ce compte est-il bien le tien ? » rendent
désormais une promesse, et une promesse est toujours vraie. Les gardes seraient restées
en place à l'écran tout en ne refusant plus rien — sans une seule erreur de compilation.
Elles ont été reprises une par une, et les tests d'intrusion les tiennent.

Ensuite, un gain au passage : la liste des enveloppes interrogeait la base une fois par
enveloppe. Sur une base locale, gratuit ; sur une base distante, trente allers-retours
pour afficher une page. C'est devenu deux requêtes.

Les **557 lignes de migrations SQLite** sont parties avec le reste, ainsi que la
douzaine de fichiers de test qui ne servaient qu'à elles.

Puis on remonte : les repositories, les calculs, les pages, les actions. Fichier par
fichier, en regardant les tests repasser au vert un par un.

## Étape 4 — L'authentification

Better Auth est déjà en place et sait parler à Postgres. Le changement tient en une
ligne : on lui donne la connexion Supabase au lieu du fichier SQLite. Les écrans de
connexion et d'inscription ne bougent pas.

## Étape 5 — Le cloisonnement, cette fois pour de bon

Aujourd'hui, ce sont les actions qui vérifient à qui appartient un compte, un groupe,
une transaction. Ça marche, mais ça repose sur le fait que personne n'oublie jamais la
vérification. Postgres sait faire mieux : on déclare, table par table, qu'une ligne
n'est visible que par son propriétaire, et la base refuse d'elle-même. Un oubli dans le
code ne devient plus une fuite.

**Fait pour la partie base.** Le propriétaire est devenu obligatoire sur les comptes
bancaires — un compte sans propriétaire ne peut plus entrer, le cas ne se traite plus,
il ne peut plus se produire. Les trois tables qui n'en portaient aucun ont été
reprises : les réglages n'étaient plus utilisés par personne et ont disparu ; les
rapprochements écartés et les alertes acquittées ont désormais leur propriétaire, et
le refus de l'un ne vaut plus pour l'autre. Les neuf tables restantes ont leur règle,
et un rôle bridé remplace l'administrateur.

Les tests le vérifient dans les deux sens : sans annonce, une lecture sans filtre ne
rend rien du tout ; avec l'annonce, elle ne rend que ce qui appartient à la personne ;
et une écriture visant le numéro de quelqu'un d'autre ne touche rien.

**Reste à brancher.** Le geste qui enfile l'habit bridé existe et il est testé, mais
l'application ne s'en sert pas encore : elle se connecte toujours en administrateur, et
les règles ne s'appliquent pas à lui. Chaque page et chaque action doit encadrer son
travail par ce geste. C'est mécanique, mais ça touche une quinzaine de fichiers.

## Étape 6 — Reprendre les données existantes

Export de la base locale, réinjection dans Supabase, vérification à l'écran que les
soldes, les enveloppes et l'historique sont identiques. La base locale est conservée
telle quelle : si quelque chose manque, on recommence.

## Étape 7 — Le déploiement

Vercel ouvre et referme des connexions en permanence : on branche l'application sur le
pooler de Supabase, pas sur la base en direct. Restent les variables d'environnement, la
clé Enable Banking (qui sait déjà se lire depuis une variable, rien à changer), et
l'adresse de retour de la banque à déclarer sur le nouveau domaine.

---

## Ce qui ne change pas

L'application à l'écran. Aucune fonctionnalité n'est ajoutée ni retirée pendant cette
migration. Si l'écran change, c'est un bug.
