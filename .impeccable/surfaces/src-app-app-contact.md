---
version: 1
slug: "src-app-app-contact"
primary_target: "src/app/app/contact/page.tsx"
related_targets: ["src/components/contact-form.tsx", "src/components/contact.module.css", "src/components/landing-contact.tsx"]
---

## Intention et autorité

Permettre d’écrire à Planora depuis l’accueil ou le menu du compte, avec trois
champs visibles : e-mail, sujet et message. Resend est le service choisi par
l’utilisateur. Le destinataire reste privé et n’est pas documenté ici.
Cette extension locale reprend le monde établi : blanc et gris doux, graphite
en sombre, eucalyptus pour agir, Bricolage pour les titres et Schibsted pour les
champs et commandes. Réalisation en code, sans nouvelle maquette, image, recherche
de concept ni carte QUALITY BAR. Aucun changement durable du système visuel ;
DESIGN.md et son sidecar restent hors périmètre.

## Parcours et états

Sur l’accueil, le bandeau et le pied de page mènent à `#contact`. Dans l’application,
« Nous contacter » ouvre `/app/contact`, réservée aux personnes connectées.
L’adresse du compte est préremplie et modifiable. Le sujet se choisit dans une
liste ; le message est limité à 2 000 caractères. Aucun montant ni aucune
opération du budget n’est joint. Aucune pièce jointe ni promesse de délai.

Pendant l’envoi, les champs et le bouton sont désactivés. Le succès remplace le
formulaire, rappelle l’adresse de réponse et permet d’écrire un autre message.
Il signifie que Resend a accepté la demande, sans garantir sa livraison ni sa
lecture. Une erreur conserve le texte dans le formulaire ouvert et reçoit le
focus ; le succès reçoit également le focus. Fermer ou recharger la page ne
conserve pas le brouillon. Sans configuration valide, une explication accompagne
les champs désactivés et le bouton « Envoi bientôt disponible ».

## Composition

Une introduction courte précède le formulaire dans la lecture. Sur ordinateur,
ils se partagent deux colonnes ; sous 760 px, ils s’empilent. Le formulaire public
repose sur gris doux avec une action en capsule. Dans l’application, il repose sur
une carte bordée et une action aux coins de 8 px. Les champs mesurent au moins
48 px et le texte saisi 16 px ; le message peut grandir verticalement. Les contours
de focus restent visibles. Les transitions de fond sont retirées sous réduction
des animations. Aucune nouvelle photographie ni illustration.

## Mise en service et preuves — 16 septembre 2026

Le destinataire est enregistré dans l’environnement local ignoré par Git. Les
compteurs anti-abus du contact sont installés sur la base configurée, avec RLS
vérifiée. Ils ne stockent pas le texte des messages. Resend, l’expéditeur et
l’origine publique restent à configurer : l’envoi est désactivé. Le schéma des
réservations reste indépendant et n’a pas été installé par cette passe.
Le [guide de contact](../../docs/contact.md) décrit l’activation et les quotas.

La [revue indépendante](../review/contact-finish-review.md) conclut **ship**,
13 captures `contact-*` inspectées, sans correction
matérielle. L’accueil réel couvre 1440, 390 et 320 px. Les composants et le menu
réels de l’application couvrent 1440 et 390 px sur une route temporaire avec un
utilisateur fictif ; elle a été retirée. Succès et erreur sont simulés, avec texte
conservé après erreur. Une capture sombre couvre 390 px. Aucun e-mail réel, aucune
session connectée réelle ni mise en production n’est validé.

La [validation](../review/contact-validation.md) consigne 1 197 tests réussis dans
125 fichiers, build, TypeScript et lint ciblé réussis. Cette passe documentaire
reprend ces preuves sans relancer de vérifications. Le décalage préexistant entre
DESIGN.md et son sidecar reste hors périmètre.
