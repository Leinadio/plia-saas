# Plia — visite guidée dans l’application

Ouvrir **plia-visite-guidee.mp4**. La présentation se déroule intégralement dans
les composants interactifs de Plia, avec une souris visible et des clics réels.
La voix française est générée par IA avec OpenAI Marin. Ce n’est pas une voix
humaine enregistrée et aucun avatar n’est utilisé.

## Parcours

Le solde du mois, puis l’enveloppe Courses et ses achats. Un clic sur le montant
dépensé ouvre son détail à droite. Le budget Transport passe de 120 à 160 euros ;
le tableau se recalcule et le reste passe de −27,60 à 12,40 euros. Les sections
se replient pour conserver les totaux, puis la souris accompagne le défilement
vers octobre et novembre. La narration précise que les prévisions sont estimées.

L’ensemble repose sur les données fictives intégrées au mode démonstration.
Les montants ne sont ni des données bancaires personnelles, ni un résultat promis.
Le montage n’inclut pas les photos ou les diapositives de la première proposition.

## Enregistrement

Les composants existants `DemoHistory`, `DemoExperienceProvider`, `AppTopbar`,
`DemoStatusBand` et le panneau de détail ont été montés dans une entrée temporaire
de développement, sans compte utilisateur et sans base de données. La saisie du
budget suit le comportement interactif existant du mode démo. Les requêtes
d’écriture sont bloquées pendant la capture ; aucune n’a été nécessaire.
Cette entrée temporaire est retirée après l’enregistrement. Le code de
l’application ne reçoit aucune modification permanente pour la vidéo.

La capture est continue à 1440 × 810, exportée en 1920 × 1080. Le curseur est
superposé aux coordonnées réelles de la souris ; les cercles signalent les clics.
Une mention discrète indique la voix générée par IA. Les sous-titres français sont
facultatifs, dans le MP4 et dans `plia-visite.srt`, pour garder l’application visible.

La narration est générée via l’API de synthèse vocale officielle :
[Text to speech — OpenAI](https://developers.openai.com/api/docs/guides/text-to-speech).
Seul le texte public de présentation a été envoyé. La clé utilisée reste dans
l’environnement ; elle n’est présente dans aucun fichier de livraison.

## Sources pour refaire la vidéo

`source/narration.json` contient le texte ; `source/voice.py` produit les segments
vocaux. Les fichiers `voix-*.wav` sont conservés pour refaire le montage sans
nouvelle génération. `source/record.cjs` exécute le parcours et relève son timing.
`source/export.py` assemble capture et narration. Les images `etape-*.png` montrent
les sept étapes enregistrées.

L’entrée de capture est conservée hors des routes dans `source/capture-page.tsx`.
Pour reproduire localement, la copier temporairement dans
`src/app/apercu-video/page.tsx`, lancer le serveur de développement en HTTPS puis :

```sh
python3 artifacts/plia-visite/source/voice.py
PLAYWRIGHT_PATH=/chemin/vers/playwright node artifacts/plia-visite/source/record.cjs
python3 artifacts/plia-visite/source/export.py
```

Retirer ensuite la route temporaire. Ne pas publier cette entrée. Les scripts
nécessitent Python 3, FFmpeg, Node.js et Playwright/Chromium. Ne jamais remplacer
les fixtures de démonstration par des données bancaires réelles pour reproduire
la vidéo. Après toute modification de texte, régénérer le segment vocal concerné
avant de relancer la capture.

## Vérifications effectuées

Enregistrement terminé sans erreur de page ni requête d’écriture. La saisie du
budget à 160,00 euros et le reste de 12,40 euros ont été vérifiés dans l’interface.
Les images des étapes ont été inspectées, notamment le détail à droite et la
lecture des soldes futurs. Le MP4 se décode entièrement sans erreur, sans écran
noir détecté. Durée finale : 64,12 secondes ; image H.264 à 25 i/s, son AAC à
48 kHz. Les sous-titres sont une piste française facultative. La lecture dans
Chromium a été testée. L’entrée temporaire de capture a été retirée.

Avant et après le travail : 114 fichiers et 1 119 tests de l’application passent.
La narration est générée ; aucune validation par un comédien ni écoute humaine
n’est revendiquée. Le discours ne promet aucun résultat financier garanti.
