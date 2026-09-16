# Planora — positionnement de la nouvelle landing

Proposition du 10 septembre 2026, mise à jour le 16 septembre avec le pré-lancement et les deux offres retenues. La cible reste les personnes seules et les couples. La direction visuelle « La lumière en mouvement » a été choisie dans la page de décision (seed `29f966f4`, option `assigned`, réalisation en code). Le choix de cible ne constitue pas une étude clients ; la volonté de payer reste à valider.

## Cible retenue

Les personnes seules et les couples qui veulent organiser leur budget personnel : les dépenses du quotidien, les charges fixes et les projets à financer. Le ciblage ne suppose plus de revenus confortables. La personne qui suit le budget doit encore faire mentalement le lien entre les dépenses d’aujourd’hui et les prochains mois.

Le déclencheur est concret : préparer un voyage, des travaux ou une rentrée, et vouloir comprendre ce qui restera une fois les dépenses prévues prises en compte. La valeur recherchée est une vision claire et un budget moins dispersé. Le ciblage ne suppose ni connexion partagée entre conjoints, ni gestion de patrimoine, ni conseil financier : ces fonctionnalités ne sont pas promises.

La page `/pour-qui`, reliée au header sur mobile et ordinateur, présente ces usages en solo et à deux. Le ciblage des professionnels exploré ensuite n’est pas retenu. Le choix de cette cible ne prouve pas sa volonté de payer un prix premium : il faudra confronter la proposition à des utilisateurs concernés, puis mesurer les inscriptions et l’activation réelle du budget.

## Offre proposée

Le pré-lancement présente **9,90 € par mois sans connexion bancaire**, avec saisie manuelle, et **19,90 € par mois pendant les 12 premiers mois d’abonnement puis 29 € par mois avec connexion bancaire**. Les deux formules prévoient les enveloppes, la comparaison et les prévisions. Les boutons conservent l’offre choisie et ouvrent une réservation gratuite, sans carte bancaire. Les 12 mois commencent avec l’abonnement, jamais avec la réservation.

L’hypothèse initiale d’une offre unique à 29 € accompagnée de « Tarif envisagé » est remplacée par le [cadrage du 16 septembre](design/2026-09-16-prelaunch-shape.md). Aucun essai gratuit, engagement annuel, import CSV, accès partagé, accompagnement ou niveau de service n’est promis. Le parcours autonome de budget sans banque reste à construire avant la vente de la formule manuelle.

L’hypothèse initiale à 29 € était ambitieuse au regard des repères publics consultés le 10 septembre 2026 : Bankin’ Plus annonçait 39,99 € par an ; YNAB affichait 14,99 USD par mois ou 109 USD par an ; Monarch Plus annonçait 199 USD par an. Ces repères historiques ne sont pas revérifiés dans cette passe. Les devises, les marchés et les fonctionnalités diffèrent : ces montants ne sont pas une comparaison à périmètre égal. Les tarifs retenus devront être défendus par la clarté du produit, la qualité de son utilisation et une valeur confirmée auprès de la cible, pas seulement par une esthétique premium.

Sources primaires : [Bankin’ Plus](https://support.bankin.com/hc/fr/articles/360006559578-Pr%C3%A9sentation-de-Bankin-Plus), [YNAB — tarifs](https://www.ynab.com/pricing), [Monarch Plus](https://www.monarch.com/blog/monarch-plus). La présence de prévisions chez Bankin’ et Monarch interdit de présenter l’anticipation comme une exclusivité de Planora.

## Ce que l’analyse du produit a changé

L’application actuelle organise les revenus, les dépenses et les soldes. Sur mobile, les vues « Par mois » et « Comparer » offrent des lectures distinctes ; la comparaison conserve un indicateur propre à chaque section. Les enveloppes peuvent avoir des sous-enveloppes, les opérations peuvent être reclassées et les montants ouvrent leur détail. Ces capacités servent de preuves dans la nouvelle page.

L’ancienne landing présentait une vidéo et des illustrations moins proches de l’interface actuelle, quatre blocs de bénéfices assez génériques et trois niveaux de prix provisoires. Elle affirmait également un nombre de banques non vérifié et un report systématique des restes ou dépassements. Ces affirmations ont été retirées de la nouvelle présentation.

## Parcours de conversion

Le titre « L’outil pour gérer vos finances sans vous compliquer la vie. » relie le budget au quotidien. Le texte explique immédiatement le rôle de Planora : revenus, dépenses et mois à venir. L’action principale rejoint les deux offres ; l’action secondaire ouvre la présentation du produit. Le hero annonce le pré-lancement et la réservation gratuite, sans carte. « Se connecter » conserve l’accès existant.

Le visiteur explore ensuite trois aperçus issus des vrais composants, avec des données de démonstration : le budget du mois, la comparaison des soldes et le détail d’un montant. Une photographie de départ en week-end remet ces chiffres dans le contexte d’un projet. Le fonctionnement, les deux offres et la FAQ expliquent le choix manuel ou connecté et les conditions. La page se termine par une nouvelle invitation à réserver.

Le formulaire demande l’adresse e-mail et, facultativement, le besoin principal. La confirmation de l’adresse et de la formule passe par un lien reçu puis un clic explicite ; elle mène à la démonstration identifiée comme fictive. Les adresses confirmées par formule constituent le premier signal d’intérêt. Elles ne garantissent ni un abonnement payé ni une activation future.

Les photographies sont des créations originales générées avec l’outil imagegen intégré. Elles ne représentent pas des clients. Les captures de produit utilisent les données fictives déjà présentes dans Planora ; leur caractère démonstratif est visible sur la page. Les prompts et les origines sont enregistrés avec les images dans `public/landing/`.

## Portée

Juste après les trois repères du budget, « Planora, en action. » propose une visite
guidée de 1 min 14 dans les vrais écrans de démonstration. Elle montre les achats,
le détail d’un montant, l’ajustement d’un budget et les mois à venir. Le lecteur
s’ouvre au clic, avec sous-titres français facultatifs. Les données fictives et
la voix générée par IA sont signalées sous l’aperçu.

La composition publique reste adaptée au mobile, au thème sombre et à la réduction des animations. Depuis l’harmonisation du 16 septembre, elle partage avec l’application la palette eucalyptus, bleu brume et pêche. Les pages publiques utilisent Bricolage pour les titres et Schibsted pour les textes et commandes ; les compositions restent propres aux surfaces. Le pré-lancement ajoute les offres et la réservation sans nouvelle identité.

L’intégration Resend et le schéma dédié sont préparés, mais leur configuration et leur installation en production restent à effectuer avant la collecte. Aucun e-mail réel ni paiement n’a été déclenché. Le [guide de mise en service](prelaunch.md) conserve ces limites. La date d’ouverture et les conditions commerciales restent à préciser ; la validation technique et visuelle du parcours préparé ne constitue pas un déploiement.

## Page « Pour qui ? » — proposition artistique

À la demande du créateur, la première version informative est remplacée par une
page de campagne : « La vie, à votre façon. » Deux photographies originales de
lecture en solo et de projet d’appartement en couple composent un diptyque décalé.
Les portraits permettent de rejoindre chaque usage. Trois arguments courts par
public accompagnent les vrais écrans de détail et de comparaison, sur des plages
corail et forêt. La page reprend les polices et les commandes publiques de Planora.

La promesse reste celle du budget personnel et de l’anticipation. L’absence d’accès
partagé entre conjoints est indiquée. Les photos sont fictives, créées par imagegen,
avec prompts et provenance intégrés ; aucun témoignage ni résultat client n’est
inventé. Cette passe artistique conservait les destinations et l’offre alors
existantes. Le pré-lancement suivant redirige les actions de conversion vers
les offres ou la réservation, tout en conservant la démonstration et le lien
« Se connecter ». Aucune nouvelle animation n’est introduite.
