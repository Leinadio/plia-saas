# Demande de tarification — Enable Banking

**Destinataire :** info@enablebanking.com
**Objet :** Pricing for account information (AIS) — France
**Statut :** à envoyer

---

## Pourquoi ce message

Enable Banking ne publie aucun tarif. La facturation se fait au volume — nombre de
comptes consultés et de paiements par mois — avec une facturation minimale
mensuelle. Le prix s'obtient uniquement sur devis.

Le projet tourne aujourd'hui en **mode restreint**, celui qui permet de brancher
ses propres comptes sans contrat. Pour que d'autres personnes connectent les
leurs, il faut un contrat. C'est donc un préalable au déploiement, au même titre
que le cloisonnement des données par utilisateur.

Reste à traiter séparément, mais pas dans ce message : savoir s'il faut obtenir
son propre agrément, ou si l'on peut opérer sous celui d'Enable Banking.

---

## Le message à envoyer

```
Subject: Pricing for account information (AIS) — France

Hello,

I'm building a personal budgeting web application for French consumers, using
your API to read account balances and transactions. I have been developing in
restricted mode with my own accounts, and I'm now preparing a public launch.

Could you tell me how your pricing is structured — per connected account, per
API call, or per end user ?

And could you give me an indicative monthly cost at these volumes: 50, 100, 500,
1 000 and 5 000 users ?

Thank you,

Daniel Dupont
```

---

## Ce qu'on fera de la réponse

| Réponse attendue | Ce qu'elle décide |
| --- | --- |
| Prix au compte connecté | Le coût réel par utilisateur (≈ 3 comptes chacun) |
| Minimum mensuel | Le nombre d'abonnés nécessaire pour être à l'équilibre |
| Coût aux paliers de volume | À partir de quand le modèle devient rentable |

Repère de calcul : à **9,99 € TTC** par mois, il reste environ **7,90 € net** par
abonné une fois la TVA et les frais de paiement retirés. Les frais fixes
(hébergement de la base + Vercel + domaine) tournent autour de **50 € par mois**,
soit sept abonnés pour les couvrir. Tout le reste part dans la facture bancaire.

---

## Devis à demander en parallèle

Aucun agrégateur européen ne se branche plus en libre-service depuis la fermeture
de Nordigen. Tous passent par un commercial et un minimum mensuel. À contacter
avec le même message :

- **Powens** (ex-Budget Insight) — meilleure couverture des banques françaises
- **Bridge** (par Bankin') — même chose, orienté entreprises
- **Salt Edge** — ne publie pas ses prix, pas d'essai gratuit
- **GoCardless Bank Account Data** — inscriptions fermées aux nouveaux clients
  depuis fin 2025, mais un message ne coûte rien

---

## Plan de repli si les prix sont trop élevés

Lancer sans agrégateur : chaque personne télécharge ses opérations depuis le site
de sa banque et dépose le fichier dans l'application. Moins agréable, mais aucun
coût, aucun agrément, et ça répond tout de suite à la seule question qui compte à
ce stade — est-ce que des inconnus veulent de cette application. La connexion
automatique devient alors le confort qu'on achète, au lieu d'un coût subi avant
d'avoir le moindre client.
