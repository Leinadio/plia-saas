# Démonstrations des fonctionnalités

Les cinq cartes montrent les vrais composants de Planora avec des données fictives.
Les vidéos remplissent leur zone (`cover`), restent toujours cadrées sur une action
ou une information et suivent un curseur agrandi. Aucun plan général ni flou.
Le recadrage `cover` des cartes suit aussi le point du curseur calculé depuis les
fichiers `.camera.json`, pour ne pas le couper dans les cartes larges ou étroites.

| Clip | Action montrée |
| --- | --- |
| budgets | Création de Vacances à 250 €, puis nouveau budget et autres postes dans la liste |
| transactions | Recherche MONOPRIX puis LOYER, avec suivi du libellé et du montant |
| previsions | Colonnes de trésorerie : opérations réelles, selon vos budgets, dépassements inclus |
| depassements | Transport : 120 € prévus, 147,60 € dépensés et 27,60 € de dépassement |
| automatisation | Règle Carrefour, aperçu des deux correspondances puis rattachement à Courses |

Les sources sont des PNG sans perte, capturés à une densité de 2 sur ordinateur et
3 sur téléphone. `cursor-camera.mjs` produit la caméra et le pointeur à 60 images
par seconde, indépendamment de la cadence de capture du contenu. Les transitions
utilisent une interpolation douce sans rebond. Le curseur mesure 58 px dans les
exports 1280 × 720 et 40 px dans les exports mobiles 720 × 1320. Les positions
et horodatages des vrais contrôles sont conservés dans les fichiers `.camera.json`.
Les exports H.264 CRF 17 sont publiés atomiquement une fois terminés. Les posters
sont des vues rapprochées tirées du film. Les autres médias ne sont pas remplacés
lorsqu’une seule scène est réenregistrée.

Les aperçus se chargent à l’apparition de leur carte. La pause globale, l’onglet
masqué, la sortie de l’écran et l’ouverture du lecteur arrêtent leur lecture.
La préférence de mouvement réduit laisse les posters fixes jusqu’à une action
volontaire. Une erreur propose une nouvelle tentative. Le lecteur « Voir en grand »
utilise la capture portrait à 700 px et moins, avec commandes vidéo, fermeture par
Échap et retour du focus. Le mouvement fait partie du film et suit exactement sa pause.

## Refaire les captures

Prévoir Node, Python 3, FFmpeg et Playwright. Préparer la copie isolée :

```sh
node artifacts/landing-parcours/prepare-capture.mjs
node node_modules/next/dist/bin/next dev /tmp/planora-feature-snapshot --webpack -p 3011 --hostname 127.0.0.1
```

Cette copie n’inclut aucun fichier d’environnement ou secret. La route de capture
est limitée au développement et n’existe pas dans l’application publiée.
Le seul remplacement dans le code copié concerne l’action de création du budget :
`capture-budget-action.ts` transmet le formulaire à l’état local du scénario.
Les composants visuels restent ceux de production. `capture-history.ts` recalcule
les budgets et les soldes avec les vraies fonctions métier, sans écrire en base.
Les actions d’automatisation utilisent aussi des réponses locales fictives.

```sh
PLANORA_URL=http://127.0.0.1:3011 node artifacts/landing-parcours/record-features.mjs
PLANORA_URL=http://127.0.0.1:3011 MOBILE=1 node artifacts/landing-parcours/record-features.mjs
```

`PLAYWRIGHT_PATH` permet de préciser le module Playwright. `SCENE` accepte une
scène ou une liste séparée par des virgules. Le script bloque toute requête autre
que GET/HEAD et échoue en cas d’écriture tentée, d’erreur JS ou de montant créé
incorrect. Les manifestes et la provenance sont conservés avec chaque média.
Arrêter le serveur isolé à la fin. Ne jamais monter la route dans l’application réelle.

Les tests vérifient le montant créé et le total recalculé, ainsi que les cinq
sources, le chargement différé, les pauses, le mouvement réduit, les erreurs,
la nouvelle tentative et le choix du lecteur mobile.

## Sources antérieures

Les neuf enregistrements de `public/videos/parcours/` et les scripts `record.mjs`,
`record-extra.mjs`, `capture-page.tsx` restent les archives du parcours antérieur.
Ils ne sont plus chargés par le Bento.
