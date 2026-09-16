# Inscription et connexion Google

Le bouton « Continuer avec Google » apparaît dans les deux modes de `/connexion`.
La première connexion crée le compte ; les suivantes retrouvent le même compte et
ouvrent `/app`. La connexion e-mail / mot de passe reste disponible. Le fournisseur
est configuré via Better Auth déjà installé, sans migration de schéma ni nouveau SDK
dans le navigateur. Le logo est servi localement, sans appel Google avant le clic.

## Activer Google

1. Créer un projet dans [Google Cloud Console](https://console.cloud.google.com/).
2. Dans Google Auth Platform, renseigner la marque Planora, l’adresse de support et
   les informations demandées pour l’écran de consentement. Choisir l’audience
   adaptée ; pour une application publique, elle est externe. En mode test, ajouter
   les adresses des personnes autorisées à essayer.
3. Créer un client OAuth de type « Application Web ». Déclarer l’origine du site et
   l’adresse de retour exacte. Pour le serveur local HTTPS actuel :
   `https://localhost:3000/api/auth/callback/google`. Pour un serveur HTTP local :
   `http://localhost:3000/api/auth/callback/google`. Pour la production :
   `https://votre-domaine.fr/api/auth/callback/google`.
4. Compléter les deux emplacements préparés dans `.env.local`, jamais dans Git ni
   dans une variable préfixée `NEXT_PUBLIC` :

   ```dotenv
   GOOGLE_CLIENT_ID=identifiant_fourni_par_google.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=secret_fourni_par_google
   ```

5. Vérifier que `BETTER_AUTH_URL` correspond exactement à l’origine utilisée :
   `https://localhost:3000` en développement HTTPS, ou le domaine public en
   production. Garder le `BETTER_AUTH_SECRET` existant : il protège aussi les jetons
   Google enregistrés. Ne pas confondre ce secret avec celui fourni par Google.
6. Redémarrer le serveur. Renseigner les mêmes variables sur l’hébergeur avant un
   déploiement, avec les origines et retours de production autorisés chez Google.

Sans les deux identifiants, le bouton est désactivé et propose de continuer par
e-mail. Leur présence active le bouton ; seule une connexion réelle permet de
vérifier leur validité et les réglages du projet Google.

Sources : [configuration Google dans Better Auth](https://better-auth.com/docs/authentication/google),
[création d’un client OAuth](https://support.google.com/cloud/answer/6158849).

## Accès demandés et comptes existants

Le parcours demande uniquement l’identité de base (`openid`, `email`, `profile`),
pas l’accès à Gmail, Drive ou aux données bancaires. Il utilise le code OAuth avec
state et PKCE gérés par Better Auth. Le choix du compte Google est explicite et
l’accès est de type `online` : aucun accès hors ligne supplémentaire n’est demandé.
Les jetons OAuth d’accès et de renouvellement enregistrés par Better Auth sont
chiffrés avec le secret de l’application.

Un compte Google déjà associé reconnecte son propriétaire. Pour une adresse déjà
connue mais pas encore associée, Better Auth exige que l’adresse soit vérifiée
des deux côtés. Un compte e-mail non vérifié garde son accès par mot de passe :
l’écran l’explique et ne fusionne pas les comptes. Aucun contournement par fournisseur
« de confiance » ni association entre adresses différentes n’est activé. L’association
manuelle depuis le compte n’est pas ajoutée par cette fonctionnalité.
Voir les [règles d’association Better Auth](https://better-auth.com/docs/concepts/users-accounts#account-linking).

Une erreur ou une annulation revient sur `/connexion` avec un texte français et la
possibilité de réessayer. Les descriptions brutes du fournisseur ne sont pas
affichées. Les comptes Google créés sans mot de passe continuent à utiliser Google ;
ce travail n’ajoute pas de parcours de création ou réinitialisation du mot de passe.

## Identité du bouton

Le bouton clair reste blanc sur les deux thèmes, avec le logo Google officiel.
La bordure `#747775`, le texte `#1f1f1f` et la famille Arial de secours suivent
le [bouton HTML et les consignes Google Identity](https://developers.google.com/identity/branding-guidelines).
Ces deux couleurs sont des exceptions locales documentées dans le contrôle de
design, limitées à ce composant. Le reste de l’écran conserve les styles Planora.

Logo vectoriel : `public/auth/google.svg`, fourni par Google, téléchargé sans
modification le 17 septembre 2026 depuis
[l’asset officiel Google Firebase UI](https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg).
Aucune image générée ni identité Google redessinée.

## Vérifier après configuration

Essayer avec un compte Google autorisé : création puis reconnexion, accès à la
démonstration, déconnexion, annulation et compte existant créé par e-mail.
La création et la reconnexion ont été testées avec le vrai moteur Better Auth et
un échange Google simulé, sans compte Google réel ni appel au fournisseur. Aucun
identifiant Google n’a été fourni pendant le développement. Ces tests ne valident
pas le consentement, les restrictions de test, les adresses de retour du projet
Google ou le déploiement.
