# Plia — visite guidée de l’application

## Direction retenue

La demande finale du créateur remplace la proposition de présentateur face caméra
et la maquette à diapositives. La vidéo doit rester directement dans l’application,
avec une souris qui guide un vrai parcours et une voix française naturelle.

Le livrable courant est `artifacts/plia-visite/plia-visite-guidee.mp4`.
Il montre les vrais composants du mode démonstration, manipulés pendant une capture
continue. Les données sont fictives. La voix est générée par IA avec OpenAI Cedar ;
elle est signalée comme telle. Aucune photographie, aucun avatar ni tableau
reconstruit ne remplace l’application à l’écran.

## Parcours et narration

Un week-end à deux, des vacances, ou simplement un mois plus serein… Une fois les charges passées, quelle place reste-t-il pour vous ?

Avec Plia, vos revenus et vos dépenses sont réunis au même endroit. Vos courses, vos sorties, vos charges : vous voyez où va votre argent, sans refaire tous les calculs.

Un montant vous surprend ? Un clic, et vous retrouvez les achats qui l’expliquent. Vous comprenez l’écart, et vous savez sur quoi agir.

Et quand le mois ne se passe pas comme prévu, vous gardez la main. Ici, le transport coûte plus cher : on ajuste simplement son budget.

Vous validez, et vos prévisions se mettent à jour. Vous voyez tout de suite ce qu’il reste dans l’enveloppe, avec un budget qui suit votre quotidien.

Puis, prenez un peu d’avance. Regardez les mois à venir pour préparer vos projets. Ces soldes sont des estimations, calculées à partir de vos revenus et de vos budgets.

Moins de calculs en tête. Plus de place pour ce qui compte. Découvrez Plia, et commencez à préparer vos prochains projets.

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

La version du 11 septembre reprend un ton conversationnel plus chaleureux et
un discours centré sur les bénéfices du quotidien. Un accompagnement original
de claviers doux et de percussion légère soutient la voix. Le volume de la musique
baisse pendant la narration. Le montage dure 1 min 14 ; le parcours a été recapturé
pour suivre le nouveau rythme et les sous-titres ont été resynchronisés.
