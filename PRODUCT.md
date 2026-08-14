# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Aujourd'hui, un seul utilisateur : le créateur, qui suit son propre budget. Le produit
est déjà construit pour en accueillir d'autres — comptes, connexion, cloisonnement des
données par utilisateur.

Demain, la cible confirmée est **les gens à revenus irréguliers** : freelances,
indépendants, salaires en dents de scie. Leur problème n'est pas de trier des dépenses
passées, c'est de savoir où leur solde atterrit dans deux ou trois mois quand une
rentrée d'argent glisse ou manque. Ils arrivent avec un compte bancaire réel, pas avec
un tableur à remplir.

## Product Purpose

Réunir les comptes bancaires au même endroit, ranger les dépenses dans des enveloppes
mensuelles, et montrer ce qu'il restera à la fin du mois — et des mois suivants.

C'est réussi quand l'utilisateur ouvre l'app, regarde une colonne de chiffres, et sait
en quelques secondes s'il peut dépenser ou pas. Pas quand il a fini de classer ses
transactions.

## Positioning

Quatre choses tiennent ensemble et doivent survivre à n'importe quelle refonte :

1. **L'historique prévisionnel.** L'app montre mois par mois où le solde atterrit, en
   avance. Elle ne se contente pas de raconter le passé déjà dépensé.
2. **Les enveloppes qui se reportent.** Un dépassement ou un reste ne disparaît pas au
   changement de mois : il suit dans le temps, et l'utilisateur décide de son sort.
3. **Un relevé, pas un tableau de bord.** Des chiffres alignés, lisibles en colonne,
   comme un relevé papier. Pas de camemberts, pas de jauges décoratives.
4. **Le vrai lien bancaire.** Les transactions arrivent de la banque via Enable Banking,
   pas d'un import CSV fait à la main.

## Operating Context

L'app se consulte sur ordinateur comme sur téléphone. Le shell applicatif est une barre
latérale à gauche, un en-tête avec « synchroniser » et les notifications, et un panneau
de détail qui s'ouvre à droite quand on clique un montant.

Trois écrans existent aujourd'hui sous `/app` : **Tableau de bord**, **Transactions**,
**Historique**. S'y ajoutent les réglages et l'écran de compte. Une landing publique et
un écran de connexion vivent en dehors de la porte de session.

Le rythme d'usage est dicté par la banque : on synchronise, on reclasse ce qui est mal
rangé, on ajuste une enveloppe, on regarde l'historique. Ce n'est pas une app qu'on
ouvre dix fois par jour.

## Capabilities and Constraints

Ce qui existe : connexion bancaire via Enable Banking (choix de la banque à l'écran,
CIC et la France par défaut), synchronisation des transactions et du solde, enveloppes
de budget mensuelles, transactions manuelles, règles de catégorisation, groupes,
projection sur plusieurs mois, notifications et alertes de dépassement, historique en
un seul grand tableau, suppression de compte.

Contraintes durables et assumées :

- **Jamais de temps réel.** Les données datent de la dernière synchronisation. L'offre
  gratuite d'Enable Banking limite le nombre de rafraîchissements par jour.
- **Reconnexion tous les ~90 jours** imposée par la DSP2. Incontournable, et vrai pour
  tous les outils du genre.
- **Données bancaires réelles**, cloisonnées par utilisateur dans Postgres (Supabase).
- L'interface est **en français**, entièrement. Aucune traduction n'est prévue.
- Le vocabulaire à l'écran est fixé : enveloppe, poste, groupe, solde, dépassement,
  report, projection.

Non décidé, à ne pas inventer : le modèle économique, un prix, une offre gratuite, une
date de mise en vente, la prise en charge de banques autres que celles du catalogue
Enable Banking.

## Brand Commitments

Le produit s'appelle **Plia**. La landing et le titre du navigateur disent encore
« Budget » : c'est un retard à rattraper, pas une intention.

Rien d'autre n'est figé. Les trois fontes actuelles (Fraunces pour les noms de mois,
IBM Plex Sans pour l'interface, IBM Plex Mono pour tous les chiffres) et l'icône
« pastille euro » sont l'état des lieux, pas des engagements : une refonte peut les
remplacer.

## Evidence on Hand

- Une vraie connexion bancaire qui fonctionne, en sandbox et en production (CIC).
- L'icône du produit : `src/app/icon.svg`, déclinée en `apple-icon.png` et `favicon.ico`.
- Vingt-cinq specs et plans de construction dans `docs/superpowers/`, qui documentent
  chaque décision produit prise depuis juillet.
- Une suite de tests conséquente sur la logique de calcul.

Ce qui n'existe pas et ne doit jamais être fabriqué : clients, témoignages, chiffres
d'usage, captures d'écran de tiers, logos de presse, comparatifs chiffrés avec la
concurrence. Le `README.md` décrit encore l'ancienne version locale sur SQLite : il est
périmé et ne fait pas foi.

## Product Principles

1. **Le chiffre d'abord.** Tout ce qui n'est pas un montant, une date ou un libellé
   doit justifier sa place à l'écran.
2. **Regarder devant.** Chaque écran doit aider à décider de la suite, pas seulement à
   constater le passé.
3. **Rien ne disparaît au 1er du mois.** Un dépassement, un reste, une décision : ça se
   reporte et ça reste visible.
4. **Dire la vérité sur la fraîcheur.** L'app annonce quand les données datent et quand
   la banque va demander une reconnexion. Elle ne fait jamais semblant d'être en direct.
5. **Le classement est un moyen, pas le produit.** Ranger une dépense doit coûter un
   clic ; personne n'est venu pour faire de la comptabilité.
