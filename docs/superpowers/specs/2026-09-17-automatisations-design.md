# Automatisations — périmètre confirmé

Demande : une page dans l’application pour rattacher automatiquement une opération
à un budget, et une notification pour chaque rattachement. Réponses confirmées :
critères sur le libellé et le montant ; historique seulement après aperçu et
application explicite. L’ajout s’inscrit dans l’identité existante, mode Operate,
fond blanc en clair et vert forêt en sombre. Le formulaire en ligne va des
conditions vers la destination ; la liste présente les règles dans leur ordre
d’application. L’aperçu est une section en ligne, sans fenêtre modale.

Une règle appartient à un compte, cible un budget ou sous-poste du même compte,
et peut être modifiée, mise en pause ou supprimée. Le premier résultat compatible
gagne. Les nouvelles opérations importées et saisies sans budget sont concernées.
Les choix manuels, exclusions, opérations ignorées et dates des budgets sont
respectés. Les rattachements et leurs notifications sont atomiques et persistants.
L’historique n’est jamais traité lors de l’enregistrement d’une règle.

Les calculs de budget continuent de lire l’affectation explicite en base : aucune
recherche de mots n’est ajoutée dans les calculs ou les composants de tableau.
Les états vide, attente, erreur, confirmation de suppression et démonstration
sont prévus. Les critères et écritures sont validés au serveur et isolés par
utilisateur. Voir `docs/automatisations.md` pour les détails du comportement livré.
