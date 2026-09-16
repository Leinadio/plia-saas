# Pré-réservations Planora

Deux formules, aucun abonnement ni connexion bancaire créés par ce parcours.
Les réservations sont distinctes des comptes de l’application. Le tarif de lancement
connecté dure 12 mois à partir de l’activation future de l’abonnement.

## Installation

La configuration d’envoi n’existe pas encore dans ce projet. Créer un compte Resend,
vérifier le domaine d’expédition, puis renseigner côté serveur (jamais NEXT_PUBLIC) :

```dotenv
RESEND_API_KEY=cle_du_service
PLANORA_EMAIL_FROM=Planora <adresse@votre-domaine.fr>
PLANORA_PUBLIC_URL=https://votre-domaine.fr
```

`PLANORA_PUBLIC_URL` doit être l’origine exacte de la vitrine, sans chemin. En local,
utiliser `https://localhost:3000` si le serveur tourne en HTTPS. Ajouter les mêmes
variables dans Vercel et redémarrer le serveur après modification.

L’[API officielle Resend](https://resend.com/docs/api-reference/emails/send-email)
est appelée directement, avec un délai maximal de 10 secondes. Aucun envoi réel
n’a été effectué pendant le développement.

Installer les deux tables, sans toucher au schéma ni aux données du budget :

```sh
node --env-file=.env.local scripts/appliquer-prelaunch.mjs
```

Ce script est idempotent et utilise `DIRECT_URL` si disponible. Il doit être exécuté
sur la base cible avant d’ouvrir les réservations. Sans configuration d’e-mail,
le formulaire affiche une indisponibilité et ne simule aucun succès.

## Fonctionnement

Le visiteur choisit son offre, donne son adresse et éventuellement son besoin.
Le serveur valide, normalise l’adresse et envoie un lien valable 24 h. Un clic
explicite sur « Confirmer ma réservation » enregistre la formule comme confirmée.
Les prévisualisations automatiques d’e-mail ne peuvent pas la confirmer par GET.
Une nouvelle demande garde le choix confirmé tant que le nouveau lien n’est pas
validé. Un lien remplacé devient invalide. Seul le hash du jeton est conservé.

Une adresse reçoit au maximum un lien par minute. Les demandes sont limitées à
10 par heure et par source, avec compteurs persistants. Sur Vercel, la source est
l’en-tête réseau de la plateforme ; hors Vercel, le quota est partagé. Adapter ce
point si un autre hébergeur est choisi. Aucune IP en clair n’est enregistrée.
Les tables sont inaccessibles aux rôles publics Supabase et au rôle `budget_app`.

## Lire l’intérêt réel

Compter les adresses confirmées, pas les clics ni les demandes en attente :

```sql
SELECT offer, COUNT(*) AS confirmed_reservations
FROM prelaunch_reservations
WHERE confirmed_at IS NOT NULL
GROUP BY offer;
```

La confirmation propose la vidéo de démonstration avec des données fictives.
Aucun traqueur d’usage ni envoi de campagne n’est ajouté. Le visionnage de la démo
et les échanges qualitatifs restent à instrumenter ou suivre séparément.
Une réservation gratuite n’est pas un client payant garanti.

Pour supprimer une réservation à la demande de son propriétaire, utiliser une
requête serveur paramétrée `DELETE FROM prelaunch_reservations WHERE email = $1`.
Avant la collecte publique, fixer la durée de conservation et les coordonnées
à fournir dans les informations de confidentialité. Ne pas réutiliser les adresses
pour des campagnes étrangères à la réservation et à l’ouverture annoncées.

## Avant l’abonnement payant

La réservation ne remplace ni le paiement ni les conditions commerciales. Le
parcours autonome de budget sans banque reste à construire avant la vente de
l’offre manuelle. Aucune date d’ouverture, limite de places, import CSV, accès
partagé ou plafond de comptes n’est promis.
