# Contact Planora

Le formulaire est accessible depuis la navigation et le pied de page de l’accueil,
et depuis « Nous contacter » dans le menu du compte de l’application. L’adresse du
compte y est préremplie et reste modifiable. Trois champs : e-mail, sujet, message.

## Activer l’envoi

Créer le compte Resend et vérifier le domaine d’expédition, puis renseigner côté
serveur, dans `.env.local` et chez l’hébergeur (jamais dans une variable NEXT_PUBLIC) :

```dotenv
RESEND_API_KEY=cle_du_service
PLANORA_EMAIL_FROM=Planora <adresse@votre-domaine.fr>
PLANORA_PUBLIC_URL=https://votre-domaine.fr
PLANORA_CONTACT_TO=adresse_qui_recoit_les_messages@votre-domaine.fr
```

L’adresse destinataire est privée et unique. Les trois premières variables sont
partagées avec les pré-réservations. L’origine doit être exacte, sans chemin ; en
local, utiliser `https://localhost:3000` avec le serveur HTTPS. Redémarrer Next.js
après modification de l’environnement.

Installer les compteurs anti-abus sur chaque base cible :

```sh
node --env-file=.env.local scripts/appliquer-contact.mjs
```

L’installation est idempotente et ne change aucune donnée de budget. Le formulaire
reste désactivé avec une explication si la configuration d’e-mail est absente ou
invalide. Une configuration présente ne garantit pas la validité de la clé ou du
domaine auprès de Resend : prévoir un envoi de contrôle après activation.

## Réception et erreurs

Chaque demande envoie un seul e-mail à l’adresse configurée. Aucun accusé de
réception n’est envoyé au visiteur. Le champ `reply_to` permet de lui répondre
directement depuis la messagerie ; son adresse est déclarative, non vérifiée.
Le message est du texte brut et ne joint aucune opération ni montant du budget.
Voir l’[API officielle Resend](https://resend.com/docs/api-reference/emails/send-email).

Le succès à l’écran signifie que Resend a accepté le message, pas qu’il a été lu
ou livré dans la boîte de réception. En cas d’échec, le texte reste dans le
formulaire ouvert pour réessayer. Il n’est pas sauvegardé après fermeture ou
rechargement de la page. Aucun envoi réel n’a été effectué pendant le développement.

## Limites

2 000 caractères maximum. Validation côté serveur, origine vérifiée et champ
piège contre les robots. Limites persistantes de 3 tentatives par heure et par
adresse, et de 20 par heure et par source réseau. Les heures sont des tranches UTC.
Sur Vercel, la source vient de l’en-tête réseau garanti par la plateforme ; hors
Vercel, les visiteurs partagent le quota de 20. Adapter ce point avant un autre
hébergement public.

La base ne conserve ni message, ni adresse ou IP en clair : seulement des compteurs
à clés HMAC, nettoyés lors des demandes suivantes après environ 24 h. Les messages
reçus sont conservés dans la messagerie destinataire et chez le prestataire selon
leurs propres règles. Les rôles publics Supabase et `budget_app` n’accèdent pas aux
compteurs. Un clic répété pendant un envoi est ignoré ; une nouvelle tentative
après une coupure réseau peut produire un doublon si Resend avait déjà accepté
la première demande.
