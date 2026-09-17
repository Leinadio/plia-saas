---
version: 1
slug: "src-app-app-automatisations"
primary_target: "src/app/app/automatisations/page.tsx"
related_targets: ["src/components/automation-panel.tsx", "src/components/automation-rule-form.tsx", "src/components/automation-rule-row.tsx", "src/components/automation-preview.tsx", "src/components/automation-notice.tsx", "src/components/automation.module.css", "src/components/notifications-button.tsx", "src/components/app-topbar.tsx"]
---

## Intention et autorité

La page « Automatisation » ouvre sur « À chaque opération, sa place. ». Elle permet de
relier les prochaines opérations à leur budget à partir du libellé et du montant,
avec une notification pour chaque rattachement. Le mode est Operate : les critères,
la destination et les actions doivent se lire immédiatement.

Cette extension reprend le monde Planora établi, sans nouvelle maquette ni carte
QUALITY BAR. Fond blanc en clair, anthracite (#181a1e) et commandes sable en sombre, selon la
préférence explicite de l’utilisateur ; surfaces opaques et palette commune.
Bricolage porte les titres, Schibsted les champs, données et commandes. Aucun
nouvel actif visuel ni changement du système global n’est nécessaire.

## Parcours et états

La liste ordonnée affiche le morceau de libellé, le compte, le sens, les bornes
de montant, le budget ou sous-poste et le statut Active/En pause. La première règle
active compatible est prioritaire ; modifier une règle conserve sa place.
« Nouvelle règle » et « Modifier » ouvrent le formulaire dans la page. Les bornes
sont facultatives ; deux bornes égales désignent un montant exact. Les destinations
proposées appartiennent au compte choisi. La recherche ignore majuscules et accents.

Enregistrer concerne les nouvelles opérations comptabilisées et les nouvelles
saisies sans budget. « Voir les correspondances » ouvre séparément l’aperçu de
l’historique encore sans budget, hors exclusions et opérations ignorées. Il nomme
la destination et présente libellés, dates et montants, jusqu’à 200 opérations.
Seul « Rattacher… », avec le nombre affiché, applique cet aperçu après revérification.
Un aperçu vide explique l’absence de correspondances ; un aperçu périmé doit être
relancé. Fermer l’aperçu rend le focus à son bouton d’origine.

Mettre en pause, réactiver et supprimer restent accessibles sur chaque règle.
La suppression demande une confirmation dans la ligne. Pause et suppression
conservent les rattachements précédents. Pendant une action, les commandes sont
bloquées ; les erreurs sont annoncées et reçoivent le focus, les succès sont
annoncés sans masquer la liste.

Sans règle, un exemple identifié explique le mécanisme. Sans compte, la page mène
aux réglages. Sans budget compatible, le formulaire explique où en créer un.
La démonstration montre uniquement un exemple en lecture seule, sans lire ni
modifier les vraies règles. Le chargement utilise les plaques squelettes existantes.

## Composition et adaptation

La liste reste plate : critères à gauche, flèche vers la destination, statut et
commandes lisibles. Le formulaire reprend cette relation sur deux colonnes sur
ordinateur, puis empile critères et destination sur téléphone. Les champs gardent
leurs libellés visibles et un texte de 16 px sur mobile. Les montants, actions
et explications restent sur des surfaces opaques. L’aperçu s’insère dans la page,
avec son action explicite à la fin ; il ne déclenche aucun classement à l’ouverture.

La cloche existante réunit dépassements et rattachements. Chaque rattachement
conserve le libellé, le montant, la date, le compte, le budget et la règle. Vu/Non vu
reste enregistré et les notifications vues restent consultables. « Voir les
transactions » ferme le panneau et efface son annulation temporaire avant la
navigation, sur ordinateur comme sur téléphone. Le classement se corrige ensuite
depuis les transactions.

## Mise en service et preuves — 17 septembre 2026

Le [guide des règles](../../docs/automatisations.md) fait autorité pour les critères,
la priorité, les dates de budgets, les corrections manuelles et les limites de
l’historique. Le schéma additionnel a été installé sur la base configurée, sans
création de règle ni modification d’opération réelle pour les essais.

La [revue indépendante](../review/rules-finish-review.md) a inspecté les 16 captures
`rules-*` : listes et formulaires à 1440 et 390 px en clair et sombre, bas du
formulaire mobile, aperçu, notifications, état vide et démonstration. Elles
utilisent les vrais composants avec des données fictives et des actions simulées ;
le dispositif temporaire a été retiré. Aucun compte bancaire réel ni mutation
authentifiée n’a été validé par cette revue.

La revue complète demandait deux corrections : fermeture des notifications lors
du passage aux transactions et texte des champs mobiles à 16 px. Le verdict final
« ship » confirme ces deux corrections après réouverture des 16 captures ; ce
n’est pas un nouvel audit complet. Cette passe documentaire lit les sources et
les preuves existantes, sans relancer les contrôles.

La [validation finale](../review/rules-validation.md) confirme 1 270 tests dans
133 fichiers réussis, le build réussi avec la nouvelle route et le lint ciblé
sans erreur. Elle conserve l’avertissement préexistant du raccordement de mise
à jour des transactions et distingue les essais simulés des écritures réelles.
Aucun appel bancaire réel ni déploiement n’est validé.

## Navigation mobile — ajustement du 17 septembre 2026

L’onglet se nomme « Automatisation » en entier. Sur mobile, les trois liens
prennent une largeur adaptée à leur texte, avec une cible tactile de 44 px.
Ils peuvent revenir à la ligne quand le texte est agrandi. Vérifié dans le
navigateur de 320 à 1440 px, sans dépassement des libellés, et à texte doublé
sur 320 px. Les règles métier et le fond vert forêt restent identiques.
