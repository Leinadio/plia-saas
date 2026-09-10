# Plia — visite guidée de l’application

## Direction retenue

La demande finale du créateur remplace la proposition de présentateur face caméra
et la maquette à diapositives. La vidéo doit rester directement dans l’application,
avec une souris qui guide un vrai parcours et une voix française naturelle.

Le livrable courant est `artifacts/plia-visite/plia-visite-guidee.mp4`.
Il montre les vrais composants du mode démonstration, manipulés pendant une capture
continue. Les données sont fictives. La voix est générée par IA avec OpenAI Marin ;
elle est signalée comme telle. Aucune photographie, aucun avatar ni tableau
reconstruit ne remplace l’application à l’écran.

## Parcours et narration

Votre solde est positif. Mais que restera-t-il une fois les dépenses du mois
passées ? Regardons ensemble dans Plia.

Ici, les revenus et les dépenses sont réunis dans le même tableau. J’ouvre
l’enveloppe Courses : les achats apparaissent juste en dessous.

Pour comprendre un montant, je clique dessus. Le détail s’ouvre à droite,
avec les opérations qui l’expliquent.

Le transport a dépassé les cent vingt euros prévus. Je clique sur son budget,
puis je le passe à cent soixante euros.

J’applique. Le tableau se recalcule et le montant restant change. Je peux ainsi
ajuster mes prévisions à ma situation.

Je replie les enveloppes pour garder les totaux, puis je regarde les mois suivants.
Les soldes prévus sont des estimations, basées sur les revenus et les budgets
renseignés.

L’objectif : voir ce qui reste pour vos projets, une fois les dépenses prévues
prises en compte. C’est ça, Plia.

## Production

Le dossier de livraison contient le MP4, les sept segments vocaux, les sous-titres
facultatifs, les images des étapes et les sources permettant de refaire la capture.
Le fichier README explique le montage et les limites du mode démonstration.
L’ancienne maquette est conservée dans `artifacts/plia-video/` comme version
supersédée ; elle n’est pas la proposition à utiliser.

Les achats apparaissent avec les libellés de démo, le détail affiche les opérations
et le changement de budget utilise le recalcul existant. La saisie de 160 euros
ne change aucun compte personnel. Aucun service bancaire ni paiement n’est appelé.
La vidéo est intégrée à la landing juste après les trois repères du budget, dans
le lecteur Hero Video Dialog de Magic UI. Elle se charge à l’ouverture ; les
sous-titres français sont facultatifs. Aucun déploiement n’est effectué automatiquement.
