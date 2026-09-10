# Plia — maquette vidéo

Version supersédée : voir [la visite guidée dans l’application](../plia-visite/README.md).

Ouvrir `plia-demo-maquette.mp4` pour regarder le montage de 47 secondes.
Export Full HD, H.264 / AAC, 30 images par seconde, avec sous-titres intégrés.
Les six fichiers `scene-*.jpg` permettent de parcourir le storyboard.

**Ce n’est pas encore la version avec une personne qui parle.** La voix est une
synthèse locale provisoire (macOS Thomas). Aucun service de génération de
présentateur n’est disponible dans la session et aucun compte n’a été créé.
La personne photoréaliste et sa voix finale restent à produire.

Le scénario, le texte et la direction du présentateur sont dans
[`docs/video/plia-demo.md`](../../docs/video/plia-demo.md).
Les écrans utilisent uniquement les données fictives de la démonstration Plia.
Les photos sont illustratives ; leurs prompts et provenances accompagnent les
images dans `source/assets/`. Les fontes sont Bricolage Grotesque et Schibsted
Grotesk, reprises de la vitrine du projet.

## Reproduire le montage

Prérequis locaux : macOS avec la voix Thomas, Python 3, Node.js, FFmpeg et Playwright
avec Chromium. Aucune clé de service ni installation dans l’application.

```sh
python3 artifacts/plia-video/source/prepare-audio.py
PLAYWRIGHT_PATH=/chemin/vers/playwright node artifacts/plia-video/source/render.cjs
```

`source/scenes.json` contient les phrases. `source/timeline.json` contient les
temps mesurés sur chaque segment de voix. `plia-demo.srt` reprend ces sous-titres.
`source/render.html` contient la composition et les mouvements. Ajouter `--stills`
à la commande de rendu exporte seulement les six images du storyboard.

Pour une version finale incarnée, enregistrer ou générer les phrases du scénario,
remplacer les plans d’ouverture et de conclusion par le présentateur, garder les
écrans centraux sous sa narration et recalculer les sous-titres sur la voix finale.
Ne pas retirer la mention de maquette avant cette étape.

## Vérifications effectuées

Export décodé intégralement sans erreur. Durée : 46,57 secondes. Image H.264
1920 × 1080 à 30 i/s ; voix AAC mono à 48 kHz. Les quinze sous-titres suivent
les segments sonores sans intervalle manquant. Aucun écran noir détecté.
Les six images clés et une image extraite du MP4 ont été inspectées.
La qualité artistique de la voix reste celle d’une synthèse provisoire ;
aucune écoute humaine ni validation du présentateur n’est revendiquée.

Avant le travail, les 114 fichiers de tests de l’application et leurs 1 119 tests
passaient. Le code de l’application n’a pas été modifié pour cette vidéo.
