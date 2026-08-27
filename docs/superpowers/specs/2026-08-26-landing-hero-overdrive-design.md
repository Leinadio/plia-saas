# Hero Overdrive de la landing Plia

## Objectif

La Hero doit parler à une personne qui manque de visibilité sur ses finances, dépense sans toujours mesurer la suite et veut anticiper plusieurs mois. Elle doit donner envie d'essayer Plia sans inventer de résultat, de client ou de prix.

## Direction retenue

La direction retenue est « L'horizon vivant ». La projection devient la matière visuelle de la Hero, sans remplacer la grande démonstration vidéo ni introduire de MacBook.

La phrase principale est :

> Pilotez vos finances sans perdre de vue les mois à venir.

Le texte secondaire explique concrètement que Plia rend visibles les entrées, les dépenses, les enveloppes et le solde prévisionnel. Il reste court pour laisser la phrase principale porter l'émotion.

## Composition

La Hero reste en une colonne centrée. Elle contient, dans cet ordre : la navigation existante, la phrase principale, le texte secondaire, l'action principale, l'accès à la démonstration, puis la grande fenêtre vidéo.

Un horizon de mois très léger prend place derrière la partie basse de la Hero. Il évoque août, septembre et octobre par un rail temporel et quelques repères de projection. Il reste une matière d'arrière-plan : les montants complets demeurent dans l'aperçu illustratif de la vidéo.

La vidéo conserve les couleurs, les cartes et les données illustratives de Plia. Son cadre gagne en présence avec une profondeur douce, un filet précis et un bouton de lecture plus physique. Aucun ordinateur ou appareil décoratif ne l'entoure.

## Mouvement

Le titre et les actions restent stables à l'ouverture. Au défilement, l'horizon se déplace légèrement tandis que la fenêtre vidéo se redresse de quelques degrés et gagne en profondeur. Le bouton de lecture répond au survol par une impulsion courte, puis ouvre la démonstration avec le mouvement à ressort déjà présent.

Les effets doivent rester fluides, limités à des transformations et à l'opacité. Ils sont neutralisés avec `prefers-reduced-motion`, sans perte de contenu ni d'action.

## Responsive

Sur téléphone, l'horizon est simplifié et la perspective de la vidéo est supprimée. Les boutons occupent la largeur disponible. La miniature vidéo conserve son format horizontal sans provoquer de défilement latéral.

## Accessibilité et performance

Le contraste reste conforme aux couleurs documentées de Plia. Le bouton vidéo garde un libellé accessible, le focus reste visible et la modale conserve son piège de focus. Aucun canvas, WebGL ou nouvelle dépendance lourde n'est nécessaire : l'effet repose sur CSS et Motion déjà présent dans le projet.

## Vérification

Le travail sera contrôlé sur une vue desktop et une vue mobile dans le navigateur. La Hero devra rester lisible sans animation, la vidéo devra s'ouvrir au clavier, les tests existants devront passer et le build de production devra compiler.
