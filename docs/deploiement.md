# Déploiement

## Les branches

| Branche | Rôle | Où elle va |
| --- | --- | --- |
| `dev` | Branche par défaut. Tout arrive ici. | Nulle part |
| `staging` | Ce qu'on valide sur un vrai serveur | Projet Vercel de préprod |
| `prod` | Ce qui tourne pour de vrais utilisateurs | Projet Vercel de prod (pas encore créé) |

Mettre en préprod, c'est fusionner `dev` dans `staging`. Mettre en production, c'est
fusionner `staging` dans `prod`. Rien d'automatique entre les deux : le geste est
explicite, et c'est ce qui permet de regarder avant.

Les tags ne déclenchent aucun déploiement — Vercel écoute des branches. Ils restent
utiles pour marquer après coup ce qui est parti, pas pour l'envoyer.

## Le projet Vercel de préprod

Un projet branché sur le dépôt, dont la **branche de production est `staging`**. Son
adresse est celle en `.vercel.app` que Vercel attribue.

### Les variables à y poser

| Variable | Où la trouver |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → **Transaction pooler** (port 6543), mot de passe remplacé. La même que dans `.env.local`. |
| `BETTER_AUTH_SECRET` | À fabriquer : `openssl rand -base64 32`. Sert à signer les sessions ; s'il change, tout le monde est déconnecté. |
| `BETTER_AUTH_URL` | `https://<projet>.vercel.app` |
| `ENABLEBANKING_APPLICATION_ID` | Control Panel d'Enable Banking. La même que dans `.env.local`. |
| `ENABLEBANKING_PRIVATE_KEY` | **Le contenu** du fichier de `secrets/`, collé tel quel, retours à la ligne compris. Il n'y a pas de dossier `secrets/` sur un serveur. |
| `ENABLEBANKING_REDIRECT_URL` | `https://<projet>.vercel.app/api/callback` |

`ENABLEBANKING_ASPSP_NAME` et `ENABLEBANKING_ASPSP_COUNTRY` ne sont pas à reprendre.
L'écran de choix envoie la banque retenue avec chaque demande d'autorisation : ces deux
variables ne sont qu'un repli pour un appel qui ne dirait rien, et le code retombe déjà
sur CIC et la France. Les poser reviendrait à figer un choix que l'écran fait mieux.

`DIRECT_URL` non plus : elle ne sert qu'aux scripts d'installation du schéma, lancés
depuis une machine, jamais par l'application.

### Chez Enable Banking

Déclarer `https://<projet>.vercel.app/api/callback` comme adresse de retour. Sans ça,
connecter une banque depuis la préprod échouera — les connexions déjà autorisées, elles,
continuent de fonctionner, puisqu'elles ne repassent pas par le retour.

## La base

Aujourd'hui la préprod pointe sur la base **plia-staging**, celle qui contient les
données reprises. C'est ce qui permet de voir un vrai rendu tout de suite.

Le jour où la prod existe, elle aura **sa propre base**, et plia-staging restera la base
de préprod. Jamais l'inverse : une préprod branchée sur la base de prod, c'est un test
qui abîme les données de quelqu'un.

## Installer le schéma sur une nouvelle base

```
node --env-file=.env.local scripts/appliquer-schema.mjs
node --env-file=.env.local scripts/appliquer-auth.mjs
```

Les deux se relancent sans rien détruire. Le premier pose les tables du budget, leurs
index, le rôle bridé et ses règles ; le second les tables de connexion.

## Soldes bancaires et opérations en attente

Avant de déployer la correction de l'argent de départ, ajouter les colonnes sur
chaque base concernée (ou relancer le script de schéma) :

```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS booked_balance NUMERIC(14, 2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pending_transactions JSONB NOT NULL DEFAULT '[]'::jsonb;
```

Puis synchroniser les comptes. Le solde disponible reste dans `balance` ; le solde
comptabilisé est conservé séparément. Les opérations en attente sont un instantané
remplacé à chaque synchronisation, affiché avec la mention « En attente ».
L’utilisateur peut choisir une enveloppe, un sous-poste et un mois dès cette étape.
Ces choix sont conservés à la synchronisation et transférés à la transaction
comptabilisée quand sa référence ou une correspondance unique montant/libellé
permet de la reconnaître. Les correspondances ambiguës ne sont pas devinées. Seul l'écart bancaire sans opération détaillée reste sur une ligne
séparée. Aucun montant n'est compté deux fois, et les ouvertures des mois précédents
ne changent pas. Sans solde comptabilisé fourni par la banque, la colonne reste nulle.
