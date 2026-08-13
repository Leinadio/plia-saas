# Deux vues sur l'Historique : le tableau, et une vue simple

Date : 2026-08-13

## Le problème

L'Historique n'a qu'une seule présentation : un tableau large, un bloc de
colonnes par mois, huit colonnes par bloc. Quatre reproches, tous confirmés par
l'utilisateur :

1. Il faut défiler horizontalement, et on perd la ligne qu'on lisait. Sur
   téléphone c'est presque impraticable.
2. Les huit intitulés de colonnes (Budget rém., Budget dép., Dép., Reçu,
   Balance, Solde réel, Solde prévu, Solde si dépassement) doivent être retenus
   pour lire une seule ligne.
3. Les actions sont invisibles : modifier un budget, ranger une transaction ou
   créer un poste passe par un clic sur une case, qui ouvre un panneau à droite.
   Rien ne l'annonce.
4. La réponse qu'on vient chercher — où j'en suis ce mois-ci, est-ce que ça
   passe — est noyée dans la masse.

## Ce qu'on construit

Une deuxième vue de la même page, au choix de l'utilisateur, qui n'affiche
**qu'un mois à la fois**, de haut en bas, sans défilement latéral. Le tableau
actuel reste disponible, inchangé.

Contrainte non négociable, posée par l'utilisateur : **aucune fonctionnalité
n'est retirée**. Tout ce que le tableau sait faire se fait aussi dans la vue
simple. L'inventaire en fin de document en est la liste de contrôle.

## Ce qui rend la chose peu coûteuse

Trois découvertes faites en explorant, qui décident de l'architecture :

- **Le calcul est déjà à part.** `src/lib/history.ts`, `forecast.ts`,
  `history-explain.ts`, `history-columns.ts`, `calc-window.ts` produisent les
  sections, les chaînes de solde, les détails de case. Aucune de ces fonctions
  n'est retouchée. Les 743 tests existants restent la preuve que les chiffres ne
  bougent pas.
- **Le tableau rend déjà un tableau par mois.** `HistoryGrid` boucle sur
  `months` et appelle `monthTable(m, mi)` pour chacun, côte à côte dans un
  conteneur à défilement horizontal. Un seul mois est le cas normal avec une
  liste d'un élément.
- **La page sait déjà calculer une plage d'un seul mois.** `calcWindow(from, to,
  currentMonth)` élargit la fenêtre de calcul pour qu'elle contienne toujours le
  mois courant (c'est lui qui ancre les chaînes de solde sur le solde de la
  banque), puis `sliceHistorySections` / `sliceSoldeColumn` /
  `slicePlannedSoldes` coupent ce qui dépasse. Passer `from = to = mois choisi`
  suffit ; aucun code de calcul neuf.

Conséquence : la vue simple est **exclusivement du rendu**. Elle consomme les
mêmes `sections`, `solde`, `planned`, `grand`, `overspend`, `ignoredBlocks`,
`forecast` que le tableau, et rappelle les mêmes actions serveur.

## Architecture

### La page

`src/app/app/historique/page.tsx` reste un composant serveur `force-dynamic`.
Il gagne deux choses :

- La lecture du cookie de vue, pour décider quoi rendre **côté serveur** — pas
  de clignotement au chargement, contrairement à un `useState` initialisé depuis
  `localStorage`.
- Le calcul des mois : `months = [moisChoisi]` en vue simple,
  `monthRange(from, to)` en vue tableau. Le reste du corps de la fonction ne
  change pas d'une ligne.

Les onglets de comptes restent en tête, inchangés. Le sélecteur de vue
(« Simple » / « Tableau ») se place sous eux, à droite, au-dessus de la
navigation temporelle. Le bouton d'explication de la prévision
(`ForecastDetailSheet`) reste à sa place dans les deux vues.

### Navigation dans le temps : deux réglages distincts

| Vue | Réglage | Paramètre d'URL |
|-----|---------|-----------------|
| Tableau | plage de mois (`MonthRangePicker`) | `from`, `to` |
| Simple | un mois | `mois` |

Distincts **exprès** : basculer d'une vue à l'autre ne détruit pas le réglage de
la première. Les bornes sont celles d'aujourd'hui, par compte : de `stripMin`
(le premier mois où ce compte a des mouvements, au plus tard le mois précédent)
à `stripMax` (mois courant + 12).

En vue simple, la navigation est un nom de mois avec une flèche de chaque côté.
La flèche qui sortirait des bornes est désactivée.

### Mémoire du choix de vue

Cookie `vue-historique`, valeurs `simple` ou `tableau`, sans date d'expiration
courte (un an). Écrit par le sélecteur, lu par le serveur. Défaut en l'absence
de cookie : **simple**.

Pourquoi un cookie et non `localStorage` : le serveur rend la page, il doit
connaître la vue avant le premier octet. Avec `localStorage`, la page s'afficherait
d'abord dans la mauvaise vue puis basculerait.

### Nouveaux modules

**`src/lib/history-view.ts`** — pur, testé. Toute la logique de choix :

- `type VueHistorique = "simple" | "tableau"`
- `lireVue(valeurCookie: string | undefined): VueHistorique` — défaut `simple`,
  toute valeur inconnue retombe sur le défaut.
- `moisAffiche(param, stripMin, stripMax, currentMonth): string` — le mois à
  afficher : le paramètre d'URL s'il est un mois valide et dans les bornes
  (sinon clampé), le mois courant sinon (lui-même clampé aux bornes).
- `moisPrecedent(mois, stripMin): string | null` et
  `moisSuivant(mois, stripMax): string | null` — `null` quand la borne est
  atteinte, ce qui désactive la flèche.

Réutilise `isMonthKey`, `clampMonth`, `addMonthsKey` de `src/lib/history.ts`.

**`src/lib/history-summary.ts`** — pur, testé. Le bloc de tête d'un mois :

- `soldesDuMois(solde, planned, months, currentMonth, i)`
  → `{ depart, reel, prevu, siDepassement }` : l'argent de départ du mois et ses
  trois soldes de clôture. `siDepassement` vaut `null` sur un mois de projection,
  où la colonne n'existe pas (elle répéterait « solde prévu », cf.
  `monthColumns`) ; `prevu` vaut `null` quand la chaîne n'a pas de valeur pour ce
  mois.

L'estimé de fin de mois n'est **pas** dans ce bloc : il se déduit des totaux
(Total + rémunérations restant à recevoir − Balances vertes) et reste avec eux,
comme dans le tableau. Sur le mois courant il dit autre chose que le solde réel,
et les deux doivent rester lisibles côte à côte sans se répéter.

Ce module ne calcule rien de neuf : il **choisit** parmi ce que la page a déjà
calculé, en respectant exactement les règles de `history-columns.ts`. La raison
d'en faire une fonction pure plutôt que des `props` lues dans le composant :
c'est la seule partie de la vue simple où une erreur de choix afficherait un
chiffre faux, donc c'est la partie qui doit être testée.

### Nouveaux composants

- **`src/components/history-view-switch.tsx`** — les deux onglets Simple /
  Tableau. Écrit le cookie, puis `router.refresh()`.
- **`src/components/month-picker.tsx`** — le nom du mois et ses deux flèches.
- **`src/components/history-simple.tsx`** — la vue simple. Reçoit exactement les
  mêmes props que `HistoryWithDetail`, plus le mois choisi.
- **`src/components/history-simple-poste.tsx`** — une ligne de poste et son
  dépliage. Sorti dans son fichier parce que c'est la partie la plus dense.

### Refactorisation ciblée (et rien de plus)

`src/components/history-detail-sidebar.tsx` fait 839 lignes et contient cinq
blocs d'édition qui, aujourd'hui, ne servent qu'au panneau de droite :
`BudgetEditBlock`, `GroupManageBlock`, `LineManageBlock`,
`UncatProvisionBlock`, `PeriodEditBlock`.

La vue simple a besoin des mêmes blocs, rendus sur place au lieu du panneau. Ils
sont donc déplacés tels quels dans `src/components/history-blocks/`, un fichier
par bloc, et importés par le panneau comme par la vue simple. **Déplacement sans
modification de comportement** : c'est la condition pour que le panneau existant
continue de fonctionner à l'identique.

Aucun autre remaniement. `history-grid.tsx` n'est pas touché.

## Le contenu d'un mois, de haut en bas

### 1. Le bloc des soldes

L'argent de départ du mois, puis les trois soldes de clôture, chacun avec sa
phrase plutôt qu'un intitulé de colonne :

```
Mars 2026
=========================================
Sur ton compte aujourd'hui      1 240 EUR
Si tu t'en tiens au plan,
tu finiras le mois a               -25 EUR
Et si tu debordes comme
en fevrier, plutot a               -87 EUR
=========================================
```

Chaque chiffre reste cliquable et ouvre son explication dans le panneau de
droite, comme la case correspondante du tableau. Les phrases s'adaptent au type
de mois : un mois passé ne dit pas « tu finiras », il dit « tu as fini ».

Sur un mois de projection, « solde si dépassement » n'existe pas (il répéterait
« solde prévu », cf. `monthColumns`) : la ligne disparaît au lieu d'afficher un
doublon.

### 2. Ce qui rentre

Titre « Ce qui rentre », avec en face le total attendu et le total reçu. Puis un
poste par rémunération : son nom, sa durée de vie en clair (« depuis toujours »,
« ce mois uniquement »…), le montant attendu et le montant reçu. Bouton
« + une rentrée » toujours présent, même quand la section est vide.

Les reçus non rangés (« Non catégorisés », sens entrant) apparaissent ici,
comme dans le tableau.

### 3. Ce qui sort

Titre « Ce qui sort », avec le total prévu et le total sorti. Deux blocs, les
mêmes qu'aujourd'hui (`splitExpenseSection`) : les dépenses récurrentes, puis
les enveloppes. Chaque bloc se replie, garde son sous-total en se repliant, et
porte son bouton « + une dépense » — c'est le bloc où l'on clique qui décide du
bloc où la dépense naît, règle reprise telle quelle du tableau.

Chaque poste sur une ligne : nom, durée de vie, budget, dépensé, et ce qui reste
(en rouge et signé quand ça déborde, avec la mention « dépassement »).

Les dépenses non rangées suivent, séparées par un espace.

### 4. Les totaux

Dans l'ordre : total des rentrées, total des dépenses, la balance, le total
général, l'estimé de fin de mois, le total des dépassements hors budget. Les
mêmes valeurs et les mêmes détails que les lignes correspondantes du tableau.

### 5. Les opérations non comptabilisées

Tout en bas, après les totaux — la même place que dans le tableau, et pour la
même raison : on doit voir qu'elles ne participent à rien de ce qui précède.
Repliables, avec leur compte dans l'en-tête du mois.

### Un poste déplié

Le dépliage se fait sur place, et montre :

- **Son budget, modifiable directement** (`BudgetEditBlock`) : le champ, le
  choix « ce mois seulement » ou « à partir de ce mois », l'historique des
  changements. Pas de détour par le panneau.
- **Ses sous-postes**, chacun avec son propre budget modifiable et sa durée.
- **Ses transactions du mois** : date, libellé, montant, le menu de rangement
  vers un autre poste, le champ de commentaire, la bascule « ne pas
  comptabiliser », et pour une opération manuelle ses actions de modification et
  de suppression.
- **« + ajouter une dépense »** (`AddTransactionSheet`).
- **Gérer le poste** (`GroupManageBlock`) : renommer, changer sa durée de vie,
  le déplacer entre récurrentes et enveloppes, le supprimer, y ajouter un
  sous-poste.

## Inventaire : rien ne disparaît

Liste de contrôle, à repasser une par une avant de déclarer le travail fini.
Colonne de gauche : ce que le tableau sait faire. Colonne de droite : où ça se
trouve dans la vue simple.

| Fonction du tableau | Dans la vue simple |
|---|---|
| Onglets de comptes | Inchangés, en tête de page |
| Choix de la période | Un mois avec deux flèches, borné pareil |
| Explication d'une colonne (clic sur l'intitulé) | Chaque chiffre porte son mot ; le clic ouvre la même explication |
| Explication d'un montant (clic sur une case) | Identique : le panneau de droite |
| Surbrillance de la case liée depuis le panneau | Conservée sur la ligne correspondante |
| Détail des mouvements de solde (case à cocher) | Conservée, au-dessus du bloc des soldes |
| Argent de départ | Première phrase du bloc des soldes |
| Solde réel / prévu / si dépassement | Les trois phrases suivantes du bloc des soldes |
| Estimé de fin de mois | Ligne des totaux, avec ce dont il se déduit |
| Total dépassement hors budget | Ligne des totaux |
| Sections Rentrées / Dépenses | Les deux sections, avec leurs totaux |
| Deux blocs de dépenses (récurrentes, enveloppes) | Conservés, repliables, sous-total visible replié |
| Non catégorisés (entrants et sortants) | À leur place, dans le sens qui leur revient |
| Provision des non catégorisés | `UncatProvisionBlock`, sur la ligne |
| Créer une rentrée | Bouton « + une rentrée » |
| Créer une dépense (dans le bon bloc) | Bouton « + une dépense » de chaque bloc |
| Créer un sous-poste | Bouton sur la ligne du poste |
| Renommer / supprimer un poste | `GroupManageBlock`, dans le dépliage |
| Durée de vie d'un poste ou d'un sous-poste | Affichée sur la ligne, modifiable dans le dépliage |
| Déplacer un poste entre les deux blocs | `GroupManageBlock` |
| Modifier un budget (mois seul ou à partir de) | `BudgetEditBlock`, dans le dépliage |
| Historique des changements de budget | Dans `BudgetEditBlock`, inchangé |
| Retirer un montant de budget | `BudgetEditBlock`, inchangé |
| Déplier un poste vers ses transactions | Le dépliage |
| Ranger une transaction dans un poste | `GroupSelectField`, sur la transaction |
| Commenter une transaction | `TxnCommentField`, sur la transaction |
| Mettre une transaction hors calcul | `IgnoreTxnToggle`, sur la transaction |
| Modifier / supprimer une transaction manuelle | `ManualTxnActions`, sur la transaction |
| Ajouter une transaction à la main | Bouton dans le dépliage |
| Étiquette « dépassement » sur une Balance | Sur le reste du poste |
| Bandeau de dépassement et son acquittement | `OverspendNotice`, au même endroit |
| Compte des non comptabilisées du mois | Dans l'en-tête du mois |
| Transactions non comptabilisées | Bloc replié en bas |
| Explication du calcul de la prévision | `ForecastDetailSheet`, inchangé |

## Tests

Conformément à la méthode du projet, le test est écrit avant le code et on le
voit échouer.

**Testé unitairement** (`tests/lib/`), parce qu'une erreur y produirait un
chiffre ou un état faux :

- `history-view.test.ts` : défaut de vue et valeur de cookie inconnue ; mois
  hors bornes ramené dans les bornes ; mois absent de l'URL ; flèches
  désactivées aux deux bornes ; mois invalide ignoré.
- `history-summary.test.ts` : les trois soldes d'un mois passé, du mois courant
  et d'un mois de projection ; l'absence de « si dépassement » en projection.

**Non testé unitairement, et dit explicitement** : tout le rendu. Il se vérifie
en lançant le vrai serveur (`npm run dev -- --experimental-https`) et en
repassant l'inventaire ci-dessus, ligne par ligne.

**Ce qui protège l'existant** : aucune fonction de `src/lib` ni de `src/db`
n'est modifiée, aucune signature ne change. Les 743 tests actuels doivent rester
verts du début à la fin. Le déplacement des blocs d'édition vers
`history-blocks/` est un déplacement de fichiers sans changement de
comportement ; le panneau de droite doit se comporter à l'identique après.

## Ce qu'on ne fait pas

- Pas de refonte du tableau. `history-grid.tsx` n'est pas touché.
- Pas de vue unique qui s'adapterait à l'écran : l'utilisateur veut garder les
  deux, et un composant qui ferait les deux redeviendrait illisible.
- Pas de comparaison entre mois dans la vue simple : c'est le rôle du tableau,
  qui reste à un clic.
- Pas de nouvelle règle de calcul, pas de nouvelle action serveur.
