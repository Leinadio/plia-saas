---
version: 4
slug: "src-app-pour-qui-page-tsx"
primary_target: "src/app/pour-qui/page.tsx"
related_targets: ["src/app/pour-qui/page.module.css","src/components/landing-layout.module.css","src/components/landing-header.tsx","src/components/landing-header.module.css","src/components/landing.module.css"]
---

## Portée et autorité — 17 septembre 2026

Refonte de la page publique `/pour-qui`, mode Read / Persuade, dans l’identité
Planora déjà approuvée. Cette version remplace la composition `audience-art-v2` ;
les anciennes captures de revue restent historiques et ne décrivent plus la page.
La réalisation est menée en code, sans maquette d’interface approuvée ni carte
QUALITY BAR spécifique. Les sources finales font autorité.

Bricolage Grotesque porte les titres, Schibsted Grotesk le texte et les montants.
Le fond blanc ou anthracite, les actions communes, les grandes photos, les accents
pêche et les courbes prolongent les pages publiques actuelles. Les références
retenues sont la page Sécurité et les marges partagées de l’accueil.

## Travail à accomplir et vérité produit

Faire reconnaître deux situations de vie — en solo et à deux — puis montrer
comment les budgets aident à prévoir les dépenses et préparer les projets.
Le public reste celui du budget personnel, sans condition de revenus confortables
et sans ciblage professionnel. Employer « budget » et « sous-budget ».

Le couple décrit les dépenses du foyer suivies depuis un compte personnel.
La limite « L’accès partagé entre conjoints n’est pas proposé aujourd’hui » reste
visible. Le tableau solo porte « Exemple fictif de budgets mensuels » : ses
850 €, 120 € et 250 € illustrent des choix, pas les données d’un utilisateur.
La réservation est gratuite, sans carte bancaire, au stade du pré-lancement ;
elle ne constitue pas un abonnement actif.

## Composition et parcours

« Votre vie change. Votre budget suit. » ouvre la page avec une courte explication,
« Réserver mon accès » vers `/reservation` et « Trouver mon rythme » vers
`#vos-priorites`. Une grande scène de départ en week-end suit, accompagnée des
phrases « De la place pour le quotidien. » et « Et pour ce qui vous attend. ».
La navigation dédiée mène ensuite à `#en-solo` et `#a-deux`.

« En solo, vos priorités passent au premier plan. » introduit le quotidien,
les loisirs et les projets. Une seule paire photo/tableau illustre ce propos :
lecture sur un balcon à gauche, budgets fictifs sur vert profond à droite.
« Voir les budgets en action » mène à `/#demonstration`.

« De nouvelles habitudes. À chaque nouveau départ. » prolonge le parcours solo
avec trois situations : premier salaire, changement de rythme et besoin de comprendre
ses dépenses. Ces textes se lisent en une seule colonne, séparés par des filets.

« À deux, préparez la suite sur des bases claires. » ouvre une bande verte bordée
de courbes. Une photo panoramique d’aménagement précède trois bénéfices courts
et la limite explicite du compte personnel. La lecture reste verticale.

« Les mois se suivent. Ils ne se ressemblent pas. » présente les vacances,
la rentrée et les imprévus. Une grande photo de séjour précède trois textes,
empilés sur mobile. Les sous-budgets, prévisions par mois et dépassements sont
expliqués à partir de ces situations, sans promettre d’épargne automatique.

« Commencez simplement. Avancez à votre rythme. » apporte cinq réponses : débuter,
budget serré, revenus variables, connexion bancaire facultative et limite du compte
personnel. Les accordéons animés partagés conservent leurs états accessibles et la
réduction des mouvements. Un lien mène à `/contact`.

« Votre façon de vivre. Votre façon de budgétiser. » conclut avec `/reservation`,
`/#offre`, la mention de réservation gratuite et un lien `/securite`. Le pied de
page conserve la marque, les questions fréquentes et `/contact`. Le header partagé
reste fixé en haut, se compacte au scroll et conserve la navigation des pages
publiques. Son empreinte initiale reste réservée pour stabiliser le contenu.

## Images et provenance

Quatre photographies de marque existantes sont réutilisées :
`public/landing/projets-foyer-v1.png`, `audience-solo-v1.png` et
`audience-couple-v1.png`, ainsi que `public/landing/use-cases/weekend.webp`.
Les trois premières montrent respectivement un départ en week-end,
une lecture sur un balcon et un choix de peinture pour un appartement.
La quatrième montre un couple en terrasse au bord de la mer ; son fichier de
provenance adjacent et `use-cases/prompts.json` sont conservés. Les trois prompts exacts restent dans les fichiers `.prompt.txt` adjacents,
avec la provenance embarquée des images. Aucun nouvel asset n’a été produit.
Ces personnes sont illustratives, pas des clients ni des témoignages.
Chaque image possède un texte alternatif ; les cadrages préservent les visages.
Le tableau HTML est identifié comme fictif et possède une légende accessible.
Aucune capture produit n’est affichée dans cette version.

## Couleurs, formes et profondeur

Les scènes vertes gardent exactement les mêmes couleurs en clair et en sombre :
fond `#273330`, encre `#f5f8f6`, texte secondaire `#c6d3cc`, accent pêche
`#edc8b5`, filets `#64796e`. Le fond extérieur, les actions et le texte courant
suivent les rôles partagés. Les chiffres restent sur une surface opaque.

L’ouverture et le portrait solo ont un grand coin supérieur gauche de 160 px,
réduit respectivement à 80 et 100 px à 800 px. Le coin supérieur droit de la
photo couple passe de 120 à 80 px. Les autres coins et le tableau sont à 16 px.
Les courbes supérieure et inférieure de la bande couple passent de 80 à 40 px
à 800 px. Aucun effet de rotation, ombre locale ou animation décorative n’est
ajouté ; les commandes partagées respectent la réduction des mouvements.

## Adaptation et typographie

Le conteneur partagé est limité à 1440 px, avec marges internes de 64 px,
36 px à 1100 px, puis 24 px à 700 px. Les titres passent de 72 à 56, 48 puis
40 px aux seuils 1100, 800 et 380 px ; interligne 1.04, graisse 500.
Les sections et la conclusion utilisent 48, 40, 36 puis 32 px aux mêmes seuils,
interligne 1.12. Le titre du tableau passe de 36 à 28 px à 500 px.
Le corps passe de 18 à 16 px à 800 px. Les titres de bénéfice restent à 24 px,
leurs descriptions à 15 px, la limite du compte personnel à 14 px.

La paire solo utilise des colonnes 0.85fr / 1.15fr, avec un espace de 32 puis
24 px à 1100 px, et s’empile à 800 px. Les trois bénéfices couple s’empilent au
même seuil. La navigation de profils s’empile à 500 px ; l’ouverture et la
conclusion s’alignent à gauche. La grande photo d’ouverture mesure successivement
480, 400, 360 puis 320 px de haut aux seuils 1100, 800 et 500 px.
La photo solo mesure au moins 520 px, puis 360 px à 800 px ; la photo couple
passe de 400 à 320 px au même seuil.

## Revue et validation

La revue ci-dessous concerne la refonte initiale (version 3). L’enrichissement de
contenu version 4 est une passe distincte, sans nouvelle revue indépendante.


Disposition indépendante : **SHIP**, sans défaut matériel ni correction requise.
La revue a inspecté les sources et les captures du résultat. Elle reste une
revue statique : elle ne remplace pas un parcours navigateur indépendant ni un
audit global d’accessibilité. Aucune QUALITY BAR spécifique n’était disponible.

La revue est conservée dans `/tmp/planora-audience-review.md`, les captures dans
`/tmp/audience-{1440,768,390,320,1440-dark,390-dark}.png`, avec des vues de section
complémentaires. Ces preuves locales sont temporaires, non ajoutées au dépôt.

La réalisation a été vérifiée sur le vrai serveur en clair à 1440, 768, 390
et 320 px, puis en sombre à 1440 et 390 px. Les trois images sont chargées,
sans débordement horizontal ni erreur de page. Les ancres de profil et les liens
de réservation sont validés. ESLint et TypeScript passent. `npm test` réussit
avant et après la réalisation : 1290 tests dans 139 fichiers. Le relevé final
est conservé dans `/tmp/planora-audience-after.log`. Cette passe documentaire
reprend ces résultats ; elle ne les présente pas comme de nouveaux essais.

### Vérification de l’enrichissement version 4

Les nouvelles sections ont été inspectées dans le vrai navigateur, avec captures
à 1440 et 390 px. La page complète passe les contrôles à 1440, 768, 390 et 320 px
en clair, et à 1440 et 390 px en sombre : images chargées, aucun débordement
horizontal ni erreur de page. Ouverture et fermeture des nouvelles réponses
vérifiées sur ordinateur et mobile. Les liens de réservation et ancres restent
valides. ESLint, TypeScript et le détecteur de design ciblé ne signalent rien.
`npm test` avant et après : 1290 tests réussis dans 139 fichiers. Journaux dans
`/tmp/planora-audience-content-{before,after}.log`, captures des nouvelles sections
sous `/tmp/audience-new-*.png`. Aucun nouveau test unitaire pour cet ajout éditorial.

## Décisions ouvertes

Le besoin et la volonté de payer restent à valider. Les conditions commerciales
et la disponibilité suivent PRODUCT.md et le parcours de pré-lancement.
La page ne promet ni partage du compte, ni date d’ouverture, ni témoignage client.
