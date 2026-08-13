# Vue simple de l'Historique — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à la page Historique une deuxième vue, au choix de
l'utilisateur, qui n'affiche qu'un mois à la fois de haut en bas, sans rien
retirer de ce que sait faire le tableau actuel.

**Architecture:** La vue simple est **exclusivement du rendu**. Elle consomme
les mêmes `sections`, `solde`, `planned`, `grand`, `overspend`,
`ignoredBlocks`, `forecast` que le tableau, déjà calculés par la page en
passant `from = to = mois choisi` au pipeline existant (`calcWindow` élargit
seule la fenêtre de calcul pour y inclure le mois courant, puis les fonctions
`slice*` coupent ce qui dépasse). Aucune fonction de `src/lib` ni de `src/db`
n'est modifiée, aucune signature ne change. Les cinq blocs d'édition du panneau
de droite sont déplacés tels quels dans un dossier partagé pour que la vue
simple les rende sur place.

**Tech Stack:** Next.js 16 (App Router, composants serveur `force-dynamic`),
React 19, TypeScript, Tailwind + shadcn/ui, Vitest, Postgres via PGlite pour
les tests.

**Spec:** `docs/superpowers/specs/2026-08-13-vue-simple-historique-design.md`

## Global Constraints

- **Rien n'est retiré.** L'inventaire de trente-quatre lignes en fin de spec est
  la liste de contrôle ; la Task 9 la repasse une par une.
- **`src/components/history-grid.tsx` n'est pas touché.** Aucune exception.
- **Aucune fonction de `src/lib` ou `src/db` existante n'est modifiée**, ni son
  corps ni sa signature. On n'ajoute que des modules neufs.
- **Les 743 tests existants doivent rester verts** du début à la fin. Lancer
  `npm test` AVANT de commencer, pour connaître l'état de départ.
- **Le test s'écrit avant le code, et on le lance pour le voir échouer.**
- **Ne jamais dire « ça marche » sans la sortie de `npm test` sous les yeux.**
- **Le rendu n'a pas de test unitaire utile** : il se vérifie en lançant le vrai
  serveur, et on le dit explicitement (règle du projet).
- **Langue :** tout le texte affiché est en français, tutoiement, sans jargon.
  Les commentaires de code sont en français et expliquent le *pourquoi*.
- **Alias de colonnes SQL :** sans objet ici, aucune requête n'est écrite.

---

## Structure des fichiers

**Créés :**

| Fichier | Responsabilité |
|---|---|
| `src/lib/history-view.ts` | Choix de la vue et du mois affiché. Pur. |
| `src/lib/history-summary.ts` | Les quatre soldes d'un mois, choisis parmi ce qui est déjà calculé. Pur. |
| `src/components/history-view-switch.tsx` | Les deux onglets Simple / Tableau, écrivent le cookie. |
| `src/components/month-picker.tsx` | Le nom du mois et ses deux flèches. |
| `src/components/history-simple.tsx` | La vue simple : bloc des soldes, sections, totaux. |
| `src/components/history-simple-poste.tsx` | Une ligne de poste et son dépliage. |
| `src/components/history-blocks/budget-edit-block.tsx` | Déplacé du panneau. |
| `src/components/history-blocks/group-manage-block.tsx` | Déplacé du panneau. |
| `src/components/history-blocks/line-manage-block.tsx` | Déplacé du panneau. |
| `src/components/history-blocks/uncat-provision-block.tsx` | Déplacé du panneau. |
| `src/components/history-blocks/period-edit-block.tsx` | Déplacé du panneau. |
| `tests/lib/history-view.test.ts` | Tests de `history-view.ts`. |
| `tests/lib/history-summary.test.ts` | Tests de `history-summary.ts`. |

**Modifiés :**

| Fichier | Modification |
|---|---|
| `src/app/app/historique/page.tsx` | Lit le cookie, calcule `months` selon la vue, rend l'une ou l'autre. |
| `src/components/history-detail-sidebar.tsx` | Importe les cinq blocs au lieu de les définir. |

**Déjà là, réutilisé sans modification :** `src/lib/history.ts`,
`src/lib/history-month-view.ts` (`sectionsAtMonth`, `sectionSlots`,
`ignoredBlocksAtMonth`, `countIgnoredAtMonth`), `src/lib/history-columns.ts`
(`monthType`, `COL_LABEL`, `COL_INFO`), `src/lib/history-explain.ts`,
`src/lib/calc-window.ts`, `src/lib/forecast.ts`, `src/lib/budget-history.ts`,
`src/lib/group-period-label.ts`, et les composants `GroupSelectField`,
`TxnCommentField`, `IgnoreTxnToggle`, `ManualTxnActions`, `NewGroupInline`,
`NewLineInline`, `AddTransactionSheet`, `OverspendNotice`, `TruncatedText`,
`ForecastDetailSheet`, `useDetailSidebar`.

---

### Task 1 : Choix de la vue et du mois affiché

**Files:**
- Create: `src/lib/history-view.ts`
- Test: `tests/lib/history-view.test.ts`

**Interfaces:**
- Consumes: `isMonthKey`, `clampMonth`, `addMonthsKey` de `src/lib/history.ts`.
- Produces:
  - `type VueHistorique = "simple" | "tableau"`
  - `const COOKIE_VUE = "vue-historique"`
  - `lireVue(valeur: string | undefined): VueHistorique`
  - `moisAffiche(param: unknown, stripMin: string, stripMax: string, currentMonth: string): string`
  - `moisPrecedent(mois: string, stripMin: string): string | null`
  - `moisSuivant(mois: string, stripMax: string): string | null`

- [ ] **Step 1 : Connaître l'état de départ**

Run: `npm test`
Expected: 65 fichiers, 743 tests, tous verts. Noter le chiffre : c'est la
référence. Si quelque chose est déjà rouge, le dire et ne pas se l'attribuer.

- [ ] **Step 2 : Écrire le test qui échoue**

Créer `tests/lib/history-view.test.ts` :

```ts
// Choisir la vue et le mois : la seule partie de la vue simple où une erreur
// afficherait le mauvais mois, ou renverrait l'utilisateur sur une vue qu'il
// n'a pas demandée. Donc la seule qui se teste unitairement.
import { describe, expect, it } from "vitest";
import { lireVue, moisAffiche, moisPrecedent, moisSuivant } from "../../src/lib/history-view";

describe("lireVue", () => {
  it("ouvre sur la vue simple quand rien n'a jamais été choisi", () => {
    expect(lireVue(undefined)).toBe("simple");
  });

  it("rend le tableau à qui l'a choisi", () => {
    expect(lireVue("tableau")).toBe("tableau");
  });

  it("retombe sur la vue simple si le cookie dit n'importe quoi", () => {
    // Un cookie trafiqué ou laissé par une version précédente ne doit pas
    // casser la page : il vaut « pas de choix ».
    expect(lireVue("grille-3d")).toBe("simple");
    expect(lireVue("")).toBe("simple");
  });
});

describe("moisAffiche", () => {
  const MIN = "2025-01";
  const MAX = "2027-08";
  const COURANT = "2026-08";

  it("ouvre sur le mois courant quand l'adresse ne dit rien", () => {
    expect(moisAffiche(undefined, MIN, MAX, COURANT)).toBe("2026-08");
  });

  it("respecte le mois demandé dans l'adresse", () => {
    expect(moisAffiche("2026-03", MIN, MAX, COURANT)).toBe("2026-03");
  });

  it("ramène dans les bornes un mois qui les dépasse", () => {
    // Une adresse bricolée à la main ne doit pas afficher un mois vide.
    expect(moisAffiche("2019-05", MIN, MAX, COURANT)).toBe("2025-01");
    expect(moisAffiche("2030-01", MIN, MAX, COURANT)).toBe("2027-08");
  });

  it("ignore une valeur qui n'est pas un mois", () => {
    expect(moisAffiche("bonjour", MIN, MAX, COURANT)).toBe("2026-08");
    expect(moisAffiche("2026-13", MIN, MAX, COURANT)).toBe("2026-08");
    expect(moisAffiche(["2026-03"], MIN, MAX, COURANT)).toBe("2026-08");
  });

  it("borne aussi le mois courant, si le compte est plus jeune que lui", () => {
    expect(moisAffiche(undefined, "2025-01", "2025-06", COURANT)).toBe("2025-06");
  });
});

describe("moisPrecedent et moisSuivant", () => {
  it("avancent et reculent d'un mois", () => {
    expect(moisPrecedent("2026-03", "2025-01")).toBe("2026-02");
    expect(moisSuivant("2026-03", "2027-08")).toBe("2026-04");
  });

  it("passent l'année", () => {
    expect(moisPrecedent("2026-01", "2025-01")).toBe("2025-12");
    expect(moisSuivant("2026-12", "2027-08")).toBe("2027-01");
  });

  it("rendent null sur les bornes, ce qui éteint la flèche", () => {
    expect(moisPrecedent("2025-01", "2025-01")).toBeNull();
    expect(moisSuivant("2027-08", "2027-08")).toBeNull();
  });
});
```

- [ ] **Step 3 : Lancer le test pour le voir échouer**

Run: `npx vitest run tests/lib/history-view.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/history-view"`.

- [ ] **Step 4 : Écrire le module**

Créer `src/lib/history-view.ts` :

```ts
// Quelle vue de l'Historique, et sur quel mois. Deux réglages indépendants :
// le tableau garde sa plage (from/to), la vue simple son mois (mois). Séparés
// exprès — basculer d'une vue à l'autre ne doit pas détruire le réglage de
// celle qu'on quitte.
import { addMonthsKey, clampMonth, isMonthKey } from "./history";

export type VueHistorique = "simple" | "tableau";

// Le choix voyage dans un cookie et non dans localStorage : c'est le serveur
// qui rend la page, il doit connaître la vue avant le premier octet. Avec
// localStorage, la page s'afficherait dans la mauvaise vue puis basculerait
// sous les yeux de l'utilisateur.
export const COOKIE_VUE = "vue-historique";

// Défaut : la vue simple. Toute valeur inconnue (cookie trafiqué, reste d'une
// version précédente) vaut « pas de choix » plutôt que de casser la page.
export function lireVue(valeur: string | undefined): VueHistorique {
  return valeur === "tableau" ? "tableau" : "simple";
}

// Le mois à afficher : celui de l'adresse s'il est lisible, le mois courant
// sinon — et dans tous les cas ramené dans les bornes de la frise du compte,
// pour qu'aucune adresse bricolée n'ouvre sur un mois sans montants.
export function moisAffiche(
  param: unknown,
  stripMin: string,
  stripMax: string,
  currentMonth: string,
): string {
  const demande = isMonthKey(param) ? param : currentMonth;
  return clampMonth(demande, stripMin, stripMax);
}

// null quand on est déjà sur la borne : c'est ce qui éteint la flèche.
export function moisPrecedent(mois: string, stripMin: string): string | null {
  const p = addMonthsKey(mois, -1);
  return p < stripMin ? null : p;
}

export function moisSuivant(mois: string, stripMax: string): string | null {
  const n = addMonthsKey(mois, 1);
  return n > stripMax ? null : n;
}
```

- [ ] **Step 5 : Lancer le test pour le voir passer**

Run: `npx vitest run tests/lib/history-view.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 6 : Vérifier que rien d'autre n'a bougé**

Run: `npm test`
Expected: 743 + 12 tests verts.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/history-view.ts tests/lib/history-view.test.ts
git commit -m "feat(historique): choisir sa vue et son mois, sans sortir des bornes"
```

---

### Task 2 : Les quatre soldes d'un mois

**Files:**
- Create: `src/lib/history-summary.ts`
- Test: `tests/lib/history-summary.test.ts`

**Interfaces:**
- Consumes: `SoldeColumn`, `PlannedSoldes` de `src/lib/history.ts` ; `monthType`
  de `src/lib/history-columns.ts`.
- Produces:
  - `type SoldesDuMois = { depart: number; reel: number; prevu: number | null; siDepassement: number | null }`
  - `soldesDuMois(solde: SoldeColumn, planned: PlannedSoldes, months: string[], currentMonth: string, i: number): SoldesDuMois`

Ce module ne calcule rien : il **choisit** parmi ce que la page a déjà calculé,
en respectant les règles de `history-columns.ts`. C'est la seule partie de la
vue simple où une erreur de choix afficherait un chiffre faux.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `tests/lib/history-summary.test.ts` :

```ts
// Le bloc de tête de la vue simple : l'argent de départ du mois et ses trois
// soldes de clôture. Rien n'est calculé ici — tout vient des colonnes déjà
// produites par computeSolde et computePlannedSoldes. Ce qui se teste, c'est
// le CHOIX : lequel prendre, et lequel taire.
import { describe, expect, it } from "vitest";
import type { PlannedSoldes, SoldeColumn } from "../../src/lib/history";
import { soldesDuMois } from "../../src/lib/history-summary";

const MOIS = ["2026-07", "2026-08", "2026-09"];
const COURANT = "2026-08";

const solde: SoldeColumn = {
  openings: [100, 200, 300],
  closings: [200, 300, 400],
  rowRunning: {},
  uncategorizedRunning: null,
};

const planned: PlannedSoldes = {
  prevuClosings: [210, 310, 410],
  depassClosings: [190, 290, 390],
  prevuRowRunning: {},
  depassRowRunning: {},
  uncatPrevuRunning: {},
  uncatDepassRunning: {},
};

describe("soldesDuMois", () => {
  it("donne les quatre valeurs d'un mois passé", () => {
    expect(soldesDuMois(solde, planned, MOIS, COURANT, 0)).toEqual({
      depart: 100,
      reel: 200,
      prevu: 210,
      siDepassement: 190,
    });
  });

  it("donne les quatre valeurs du mois courant", () => {
    expect(soldesDuMois(solde, planned, MOIS, COURANT, 1)).toEqual({
      depart: 200,
      reel: 300,
      prevu: 310,
      siDepassement: 290,
    });
  });

  it("tait « si dépassement » sur un mois de projection", () => {
    // Sur un mois futur, cette colonne répéterait « solde prévu » : un
    // dépassement n'est jamais reconduit tout seul (cf. monthColumns). Une
    // ligne qui répète la précédente est une ligne de trop.
    expect(soldesDuMois(solde, planned, MOIS, COURANT, 2)).toEqual({
      depart: 300,
      reel: 400,
      prevu: 410,
      siDepassement: null,
    });
  });

  it("laisse passer une chaîne de plan sans valeur", () => {
    // computePlannedSoldes rend null quand il n'y a rien à prévoir : on ne
    // transforme pas ce vide en zéro, qui se lirait comme un solde nul.
    const vide: PlannedSoldes = { ...planned, prevuClosings: [null, null, null], depassClosings: [null, null, null] };
    const r = soldesDuMois(solde, vide, MOIS, COURANT, 0);
    expect(r.prevu).toBeNull();
    expect(r.siDepassement).toBeNull();
  });
});
```

Les champs `uncatPrevuRunning` / `uncatDepassRunning` de `PlannedSoldes`
(`src/lib/history.ts:553`) ne servent pas ici mais doivent figurer dans l'objet
de test : le type les exige. `SoldeColumn`, lui, porte bien
`uncategorizedRunning`, qui accepte `null`.

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `npx vitest run tests/lib/history-summary.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire le module**

Créer `src/lib/history-summary.ts` :

```ts
// Le bloc de tête d'un mois dans la vue simple : d'où il part, et où il finit
// selon les trois façons de compter. Aucun calcul — les valeurs viennent des
// colonnes déjà produites par la page ; ce module ne fait que choisir la bonne
// case et taire celles qui n'existent pas pour ce type de mois.
import type { PlannedSoldes, SoldeColumn } from "./history";
import { monthType } from "./history-columns";

export type SoldesDuMois = {
  depart: number;
  reel: number;
  prevu: number | null;
  siDepassement: number | null;
};

export function soldesDuMois(
  solde: SoldeColumn,
  planned: PlannedSoldes,
  months: string[],
  currentMonth: string,
  i: number,
): SoldesDuMois {
  // Sur un mois de projection, « si dépassement » rejoint « prévu » : un
  // dépassement ne se reconduit pas tout seul (cf. monthColumns, qui retire
  // cette colonne du tableau pour la même raison).
  const futur = monthType(months[i], currentMonth) === "future";
  return {
    depart: solde.openings[i],
    reel: solde.closings[i],
    prevu: planned.prevuClosings[i] ?? null,
    siDepassement: futur ? null : (planned.depassClosings[i] ?? null),
  };
}
```

- [ ] **Step 4 : Lancer le test pour le voir passer**

Run: `npx vitest run tests/lib/history-summary.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/history-summary.ts tests/lib/history-summary.test.ts
git commit -m "feat(historique): les quatre soldes d'un mois, pour la vue simple"
```

---

### Task 3 : La bascule, la navigation par mois, et le bloc des soldes

Premier livrable visible : on peut passer d'une vue à l'autre, choisir son
mois, et lire les soldes. Les sections viennent à la Task 4.

**Files:**
- Create: `src/components/history-view-switch.tsx`
- Create: `src/components/month-picker.tsx`
- Create: `src/components/history-simple.tsx`
- Modify: `src/app/app/historique/page.tsx`

**Interfaces:**
- Consumes: `lireVue`, `COOKIE_VUE`, `moisAffiche`, `moisPrecedent`,
  `moisSuivant` (Task 1) ; `soldesDuMois` (Task 2) ; `useDetailSidebar` de
  `src/components/detail-sidebar`.
- Produces:
  - `<HistoryViewSwitch vue={VueHistorique} />`
  - `<MonthPicker mois={string} precedent={string | null} suivant={string | null} />`
  - `<HistorySimple />` avec **exactement les mêmes props que
    `HistoryWithDetail`** (`months`, `currentMonth`, `stripMin`, `stripMax`,
    `forecast`, `sections`, `ignoredBlocks`, `overspend`, `grand`, `groups`,
    `solde`, `planned`, `accountId`, `overspendsByMonth`), `months` ne contenant
    qu'un seul mois. Mêmes props exprès : la page ne fait que choisir le
    composant, elle ne prépare pas deux jeux de données.

- [ ] **Step 1 : Le sélecteur de vue**

Créer `src/components/history-view-switch.tsx` :

```tsx
"use client";
import { useRouter } from "next/navigation";
import { COOKIE_VUE, type VueHistorique } from "@/lib/history-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Le choix de vue s'écrit dans un cookie que le serveur relit au rendu suivant :
// c'est ce qui évite d'afficher d'abord la mauvaise vue. router.refresh()
// redemande la page au serveur sans recharger l'onglet, donc sans perdre le
// défilement ni les dépliages des autres comptes.
export function HistoryViewSwitch({ vue }: { vue: VueHistorique }) {
  const router = useRouter();
  const choisir = (v: string) => {
    // Un an : le choix est une préférence, pas une session.
    document.cookie = `${COOKIE_VUE}=${v}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };
  return (
    <Tabs value={vue} onValueChange={choisir}>
      <TabsList>
        <TabsTrigger value="simple">Simple</TabsTrigger>
        <TabsTrigger value="tableau">Tableau</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

- [ ] **Step 2 : La navigation par mois**

Créer `src/components/month-picker.tsx`. Le composant est un lien de chaque
côté du nom du mois ; un lien plutôt qu'un bouton pour que le mois vive dans
l'adresse et survive à un rechargement. Regarder d'abord
`src/components/month-range-picker.tsx` et reprendre sa façon de construire
l'adresse (il gère déjà `from`/`to`, qu'il ne faut pas écraser). La flèche
dont la cible est `null` est rendue désactivée, pas masquée : une flèche qui
disparaît fait sauter le nom du mois d'un cran.

Le mois s'écrit en toutes lettres, avec son année à côté, dans la même
typographie que les en-têtes du tableau (`font-display` pour le mois, mono
discret pour l'année) — c'est le même objet, il doit se reconnaître d'une vue
à l'autre.

- [ ] **Step 3 : Le bloc des soldes**

Créer `src/components/history-simple.tsx`, pour l'instant réduit au bloc de
tête. Composant client (`"use client"`), il appelle `useDetailSidebar()` comme
`HistoryWithDetail` pour que chaque montant reste cliquable et ouvre son
explication à droite.

Quatre phrases, adaptées au type de mois (`monthType`) :

| Valeur | Mois passé | Mois courant | Projection |
|---|---|---|---|
| `depart` | « Tu as commencé le mois avec » | « Tu as commencé le mois avec » | « Tu commenceras le mois avec » |
| `reel` | « Tu as fini le mois avec » | « Sur ton compte aujourd'hui » | « En prolongeant l'estimé, tu aurais » |
| `prevu` | « Si tu avais tenu ton plan, tu aurais fini à » | « Si tu t'en tiens au plan, tu finiras le mois à » | « Si tu t'en tiens au plan, tu finiras le mois à » |
| `siDepassement` | « Tes dépassements t'ont laissé à » | « Et si tu débordes comme prévu, plutôt à » | (ligne absente) |

Une valeur `null` fait disparaître sa ligne, elle n'affiche pas zéro.

Chaque montant est un bouton qui appelle `setDetail(...)` avec le même
`CellDetail` que la case correspondante du tableau. Pour cette étape, se
contenter de `makeInfo(COL_LABEL[col], COL_INFO[col])` (l'explication de la
colonne, déjà écrite dans `history-columns.ts`) — le détail chiffré arrive à la
Task 8, avec la surbrillance.

`soldeColor` (rouge si le solde est négatif) est **locale** à
`history-grid.tsx:101`, qui est intouchable : la recopier dans
`history-simple.tsx`, avec un commentaire disant d'où elle vient et pourquoi
elle est en double. Les montants en `tabular-nums` et en police mono, comme
partout ailleurs dans le projet.

- [ ] **Step 4 : Brancher la page**

Modifier `src/app/app/historique/page.tsx` :

1. Ajouter `mois?: string | string[]` au type de `searchParams`.
2. Lire le cookie en tête de fonction :

```tsx
import { cookies } from "next/headers";
import { lireVue, COOKIE_VUE, moisAffiche, moisPrecedent, moisSuivant } from "../../../lib/history-view";

const vue = lireVue((await cookies()).get(COOKIE_VUE)?.value);
```

3. Normaliser `mois` comme `from` et `to` le sont déjà :

```tsx
const rawMois = Array.isArray(sp.mois) ? sp.mois[0] : sp.mois;
```

4. Dans la boucle par compte, remplacer le calcul de `months` :

```tsx
// La vue simple n'affiche qu'un mois : c'est le seul écart entre les deux
// vues côté données. Tout ce qui suit (calcWindow, computeHistory, les
// chaînes de solde, les coupes) est rigoureusement le même code.
const moisSimple = moisAffiche(rawMois, stripMin, stripMax, currentMonth);
let from = ...;  // inchangé
let to = ...;    // inchangé
const months = vue === "simple" ? [moisSimple] : monthRange(from, to);
```

Attention : `calcWindow(from, to, currentMonth)` doit recevoir le mois simple
des deux côtés en vue simple, sinon la fenêtre de calcul ne correspond plus aux
mois affichés et les coupes décalent les colonnes.

```tsx
const w = vue === "simple"
  ? calcWindow(moisSimple, moisSimple, currentMonth)
  : calcWindow(from, to, currentMonth);
```

5. Rendre le sélecteur de vue au-dessus de la navigation, et l'une ou l'autre
   navigation selon la vue :

```tsx
<div className="flex items-center justify-between gap-3">
  <HistoryViewSwitch vue={vue} />
  <ForecastDetailSheet label={accountLabel(a)} forecast={forecast} />
</div>
{vue === "simple" ? (
  <MonthPicker
    mois={moisSimple}
    precedent={moisPrecedent(moisSimple, stripMin)}
    suivant={moisSuivant(moisSimple, stripMax)}
  />
) : (
  <MonthRangePicker min={stripMin} max={stripMax} from={from} to={to} current={currentMonth} />
)}
```

6. Rendre `<HistorySimple {...} />` à la place de `<HistoryWithDetail {...} />`
   quand `vue === "simple"`, avec les mêmes props.

- [ ] **Step 5 : Vérifier que le calcul n'a pas bougé**

Run: `npm test`
Expected: tous verts, au même nombre qu'à la Task 2. Si un test de
`tests/lib/history*.test.ts` tombe, c'est que la page a été modifiée plus
profondément que prévu : revenir en arrière.

- [ ] **Step 6 : Vérifier à l'écran**

Ceci est un changement de rendu et de routage : **il n'a pas de test unitaire
utile**, il se vérifie en lançant le vrai serveur.

Run: `npm run dev`
Vérifier : la page ouvre sur la vue simple ; les deux onglets basculent et le
choix survit à un rechargement ; les flèches changent de mois et l'adresse suit ;
la flèche est éteinte sur les deux bornes ; passer au tableau retrouve la plage
réglée avant ; les soldes affichés valent ceux de la colonne correspondante du
tableau pour le même mois — les comparer case par case.

- [ ] **Step 7 : Commit**

```bash
git add src/components/history-view-switch.tsx src/components/month-picker.tsx src/components/history-simple.tsx src/app/app/historique/page.tsx
git commit -m "feat(historique): une vue simple, un mois à la fois, et sa bascule"
```

---

### Task 4 : Les sections, les postes et les totaux

**Files:**
- Modify: `src/components/history-simple.tsx`
- Create: `src/components/history-simple-poste.tsx`

**Interfaces:**
- Consumes: `sectionsAtMonth`, `sectionSlots` de `src/lib/history-month-view.ts` ;
  `splitExpenseSection` de `src/lib/history.ts` ; `groupPeriodLabel` de
  `src/lib/group-period-label.ts`.
- Produces: `<PosteSimple row={HistoryRow} i={number} ... />`, en lecture seule
  à cette étape ; la Task 6 lui ajoute son dépliage.

Lecture seule d'abord, actions ensuite : c'est ce qui permet de vérifier que
tous les chiffres tombent juste avant d'ajouter la moindre écriture.

- [ ] **Step 1 : Les sections**

Dans `history-simple.tsx`, sous le bloc des soldes, boucler sur
`sectionSlots(sectionsAtMonth(sections, 0, mois))` — index 0 puisque la vue
n'affiche qu'un mois. Reprendre exactement l'ordre du tableau
(`history-grid.tsx:2265-2379`) : rentrées, non catégorisés entrants, total des
rentrées ; puis les deux blocs de dépenses issus de `splitExpenseSection`,
chacun avec son sous-total, puis le total des dépenses et sa balance ; puis les
dépenses non catégorisées.

Un emplacement `kind === "empty"` rend son bouton de création et rien d'autre
(ni total ni balance : il n'y a rien à totaliser). Le bouton lui-même vient à la
Task 7 ; pour l'instant, laisser l'emplacement vide avec un commentaire qui
renvoie à la Task 7.

- [ ] **Step 2 : Une ligne de poste**

Créer `src/components/history-simple-poste.tsx`. Une ligne montre : le sens
(flèche entrante ou sortante, mêmes icônes que le tableau), le nom, la durée de
vie via `groupPeriodLabel(sg?.startMonth, sg?.endMonth)`, puis les montants avec
leur mot devant plutôt qu'un intitulé de colonne :

- Un poste de dépense : « budget », « dépensé », « il reste » (ou « il manque »
  quand c'est négatif, en rouge, avec l'étiquette « dépassement » quand
  `signaleDepassement`).
- Un poste de rentrée : « attendu », « reçu ».

Chaque montant reste cliquable et ouvre son explication à droite, comme dans le
tableau.

- [ ] **Step 3 : Les totaux**

Sous les sections : total des rentrées, total des dépenses, la balance, le total
général, l'estimé de fin de mois, le total des dépassements hors budget. Les
mêmes valeurs que les lignes correspondantes du tableau
(`history-grid.tsx:2380-2466`) — les recopier depuis `grand`, `solde`,
`planned`, `overspend` et `computeTableEstimate`, sans les recalculer autrement.

- [ ] **Step 4 : Vérifier que le calcul n'a pas bougé**

Run: `npm test`
Expected: tous verts, au même nombre.

- [ ] **Step 5 : Vérifier à l'écran**

Run: `npm run dev`
Ouvrir la vue simple et le tableau sur le même mois, côte à côte dans deux
onglets, et comparer **chaque** montant : postes, sous-totaux, totaux, estimé,
dépassements. Un seul écart est un bug, pas un arrondi.

- [ ] **Step 6 : Commit**

```bash
git add src/components/history-simple.tsx src/components/history-simple-poste.tsx
git commit -m "feat(historique): la vue simple montre les postes et les totaux du mois"
```

---

### Task 5 : Sortir les blocs d'édition du panneau

Déplacement pur, sans changement de comportement. Fait à part exprès : si le
panneau de droite se met à boguer, on saura que c'est ce commit-ci.

**Files:**
- Create: `src/components/history-blocks/budget-edit-block.tsx`
- Create: `src/components/history-blocks/group-manage-block.tsx`
- Create: `src/components/history-blocks/line-manage-block.tsx`
- Create: `src/components/history-blocks/uncat-provision-block.tsx`
- Create: `src/components/history-blocks/period-edit-block.tsx`
- Modify: `src/components/history-detail-sidebar.tsx`

**Interfaces:**
- Produces: les cinq blocs, exportés sous leurs noms actuels
  (`BudgetEditBlock`, `GroupManageBlock`, `LineManageBlock`,
  `UncatProvisionBlock`, `PeriodEditBlock`) et leurs signatures actuelles,
  inchangées.

- [ ] **Step 1 : Déplacer, sans rien réécrire**

Couper chaque fonction de `src/components/history-detail-sidebar.tsx` (lignes
125, 237, 347, 448, 594) vers son fichier, avec ses commentaires. Ajouter
`export` devant. `PeriodEditBlock` est utilisé par `GroupManageBlock` et
`LineManageBlock` : ils l'importent depuis son nouveau fichier.

Ne **rien** changer d'autre : pas de renommage, pas de « pendant qu'on y est »,
pas de reformatage. Un déplacement dont le diff montre autre chose que des
lignes déplacées est un déplacement raté.

- [ ] **Step 2 : Importer depuis le panneau**

Dans `history-detail-sidebar.tsx`, remplacer les définitions par les imports.
Le fichier doit passer de 839 lignes à environ 300.

- [ ] **Step 3 : Vérifier que rien n'a bougé**

Run: `npm test`
Expected: tous verts, au même nombre.

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4 : Vérifier le panneau à l'écran**

Ceci est un déplacement de fichiers : **pas de test unitaire utile**, il se
vérifie en lançant le vrai serveur.

Run: `npm run dev`
Dans le **tableau** (pas la vue simple), ouvrir tour à tour : une case de
budget (modification du montant, « ce mois seulement » / « à partir de ce
mois », historique des changements, retrait du montant) ; la gestion d'un
groupe (renommer, durée de vie, déplacement entre blocs, suppression, ajout de
sous-poste) ; la gestion d'un sous-poste ; la provision des non catégorisés.
Tout doit se comporter exactement comme avant.

- [ ] **Step 5 : Commit**

```bash
git add src/components/history-blocks src/components/history-detail-sidebar.tsx
git commit -m "refactor(historique): les blocs d'édition sortent du panneau pour être partagés"
```

---

### Task 6 : Déplier un poste

**Files:**
- Modify: `src/components/history-simple-poste.tsx`

**Interfaces:**
- Consumes: les cinq blocs de la Task 5 ; `GroupSelectField`,
  `TxnCommentField`, `IgnoreTxnToggle`, `ManualTxnActions`,
  `AddTransactionSheet`.

- [ ] **Step 1 : L'état de dépliage**

Un `useState<Set<string>>` dans `HistorySimple`, passé aux postes. La clé est
l'identifiant du poste seul — contrairement au tableau, il n'y a qu'un mois à
l'écran, donc pas besoin de la clé composite `openKeyIn(k, month)`. L'écrire en
commentaire, sinon quelqu'un croira à un oubli.

- [ ] **Step 2 : Le contenu du dépliage**

Dans l'ordre :

1. `<BudgetEditBlock info={budgetEditOfGroup(sg, mois, currentMonth)} />`.
   `budgetEditOfGroup` est déjà exportée par `src/lib/history-detail.ts:185` :
   l'importer, ne pas la recopier. Vérifier sa signature exacte avant de
   l'appeler.
2. Les sous-postes (`r.subRows`), chacun avec son nom, sa durée, ses montants,
   son propre `BudgetEditBlock` et ses transactions.
3. Les transactions du mois (`r.txns`), chacune : date, libellé (via
   `TruncatedText`), montant, `GroupSelectField`, `TxnCommentField`,
   `IgnoreTxnToggle`, et `ManualTxnActions` quand c'est une opération manuelle.
4. `<AddTransactionSheet />` pour ajouter une opération à la main.
5. `<GroupManageBlock info={...} />` pour renommer, changer la durée, déplacer
   entre blocs, supprimer.

Contrairement au tableau, ces blocs sont rendus **sur place** et non dans le
panneau de droite : c'est le troisième reproche de l'utilisateur, les actions
doivent être visibles.

- [ ] **Step 3 : Vérifier**

Run: `npm test`
Expected: tous verts, au même nombre.

Run: `npm run dev`
Déplier un poste et faire, une par une : modifier le budget du mois seul ; le
modifier à partir de ce mois ; retirer un montant ; ranger une transaction dans
un autre poste ; commenter ; mettre hors calcul et remettre ; ajouter une
opération manuelle puis la modifier puis la supprimer ; renommer le poste ;
changer sa durée ; le déplacer entre récurrentes et enveloppes. Après chaque
écriture, vérifier que le montant du mois se met à jour.

- [ ] **Step 4 : Commit**

```bash
git add src/components/history-simple-poste.tsx src/components/history-simple.tsx
git commit -m "feat(historique): un poste se déplie sur place, avec toutes ses actions"
```

---

### Task 7 : Créer, replier, et les non catégorisés

**Files:**
- Modify: `src/components/history-simple.tsx`
- Modify: `src/components/history-simple-poste.tsx`

- [ ] **Step 1 : Les boutons de création**

Un bouton « + une rentrée » en tête de la section des rentrées, présent même
quand la section est vide. Un bouton « + une dépense » en tête de **chaque**
bloc de dépenses. Reprendre la règle du tableau
(`history-grid.tsx:1969-2012`) : le bloc où l'on clique décide du bloc où la
dépense naît, le formulaire ne pose pas la question. Ils ouvrent `NewGroupInline`
avec `defaultMonth={mois}` et `planned={bloc === "planned"}`.

Un bouton « + un sous-poste » sur chaque ligne de poste, qui ouvre
`NewLineInline`. Contrairement au tableau où il n'apparaît qu'au survol, il est
**toujours visible** dans la vue simple.

- [ ] **Step 2 : Les blocs repliables**

Les deux blocs de dépenses se replient. Replié, le bloc cache ses postes mais
**garde son sous-total** — sinon replier ferait disparaître de l'argent de
l'écran. C'est la règle du tableau, à reprendre telle quelle.

- [ ] **Step 3 : Les non catégorisés**

Les reçus non rangés dans la section des rentrées, les dépenses non rangées
après le total des dépenses, séparées par un espace. Leur provision se règle par
`UncatProvisionBlock`, rendu sur place dans leur dépliage.

- [ ] **Step 4 : Vérifier**

Run: `npm test` puis `npm run dev`
Créer une rentrée, une dépense récurrente, une enveloppe, un sous-poste.
Vérifier que chacun naît dans le bon bloc et au bon mois. Replier chaque bloc et
vérifier que son sous-total reste. Régler la provision des non catégorisés.

- [ ] **Step 5 : Commit**

```bash
git add src/components/history-simple.tsx src/components/history-simple-poste.tsx
git commit -m "feat(historique): créer, replier et régler les non catégorisés dans la vue simple"
```

---

### Task 8 : Dépassements, détail des soldes, surbrillance

**Files:**
- Modify: `src/components/history-simple.tsx`
- Modify: `src/components/history-simple-poste.tsx`

- [ ] **Step 1 : Les dépassements**

L'étiquette « dépassement » sous le reste d'un poste qui déborde. Le bandeau
`OverspendNotice` et son acquittement, alimentés par `overspendsByMonth[mois]`,
au même endroit que dans le tableau.

- [ ] **Step 2 : Le détail des mouvements de solde**

La case à cocher « Détailler les mouvements de solde » au-dessus du bloc des
soldes, avec le même effet que dans `HistoryWithDetail` : elle sépare le
mouvement du solde signé.

- [ ] **Step 3 : Les vrais détails de case et la surbrillance**

Remplacer les `makeInfo` posés à la Task 3 par les `CellDetail` complets, ceux
que le tableau construit pour la même case. Poser `data-cellkey` sur chaque
montant, avec la même clé (`cellKey(rowKey, col, i)`), pour que cliquer une
ligne du panneau surligne le bon montant dans la vue simple.

- [ ] **Step 4 : Les opérations non comptabilisées**

Tout en bas, **après** les totaux — la même place que dans le tableau, et pour
la même raison : on doit voir qu'elles ne participent à rien de ce qui précède.
Un bloc par sens (reçus, dépenses) via `ignoredBlocksAtMonth(ignoredBlocks,
mois)`, repliable, dépliant ses transactions. Elles gardent leurs actions de
ligne, dont `IgnoreTxnToggle` pour les remettre dans le calcul.

Le compte du mois (`countIgnoredAtMonth(ignoredBlocks, mois)`) s'affiche près
du nom du mois, dans le même ambre et avec la même formulation que sur la page
Transactions et dans l'en-tête de mois du tableau : c'est la même chose qu'on
annonce, elle doit se reconnaître d'un écran à l'autre.

- [ ] **Step 5 : Vérifier**

Run: `npm test` puis `npm run dev`
Cliquer chaque montant et vérifier que le panneau ouvre le même détail que
depuis le tableau. Cliquer une ligne du détail et vérifier que le montant
correspondant se surligne. Acquitter un dépassement et vérifier qu'il disparaît
des deux vues. Mettre une opération hors calcul et vérifier qu'elle descend
dans le bloc du bas, que le compte du mois augmente, et qu'aucun total ne
bouge autrement que du montant retiré.

- [ ] **Step 6 : Commit**

```bash
git add src/components/history-simple.tsx src/components/history-simple-poste.tsx
git commit -m "feat(historique): dépassements, non comptabilisées et surbrillance dans la vue simple"
```

---

### Task 9 : Repasser l'inventaire

**Files:**
- Modify: `docs/superpowers/specs/2026-08-13-vue-simple-historique-design.md`
  (cocher l'inventaire)

- [ ] **Step 1 : L'état final des tests**

Run: `npm test`
Expected: 743 tests d'origine + 16 nouveaux, tous verts. Coller la sortie dans
le message de rapport — la règle du projet interdit de dire « ça marche » sans
elle.

- [ ] **Step 2 : Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npm run build`
Expected: la construction passe.

- [ ] **Step 3 : Repasser les trente-quatre lignes**

Ouvrir la spec à l'inventaire, lancer `npm run dev`, et vérifier **chaque
ligne** dans la vue simple. Pour chacune : soit elle fonctionne et on la coche,
soit elle ne fonctionne pas et on le note. Ne rien cocher sur la foi du code
lu : il faut l'avoir fait à l'écran.

- [ ] **Step 4 : Dire la vérité**

Rapporter : ce qui a été vérifié à l'écran, ce qui reste couvert par les tests,
et **nommément** tout ce qui n'a pas pu être vérifié ou ne fonctionne pas. Une
ligne d'inventaire non cochée est un travail non fini, pas un détail.

- [ ] **Step 5 : Commit**

```bash
git add docs/superpowers/specs/2026-08-13-vue-simple-historique-design.md
git commit -m "docs(historique): l'inventaire de la vue simple, repassé à l'écran"
```

---

## Notes pour l'implémenteur

**Le piège principal.** Il est tentant de factoriser le tableau et la vue simple
en un composant commun. Ne pas le faire. Le tableau fait 2 498 lignes, et
chercher à en extraire quoi que ce soit fera bouger l'existant, qui n'a pas de
test de rendu pour le rattraper. La duplication assumée de quelques fonctions
d'aide est le prix, et il est bas.

**Ce qui protège.** Aucune règle de calcul n'est écrite ni modifiée. Si un test
de `tests/lib/` tombe pendant ce travail, c'est qu'on a touché à quelque chose
qui n'était pas au programme.

**Comparer, toujours.** À chaque étape visuelle, ouvrir la même donnée dans les
deux vues et comparer les montants. C'est la seule vérification qui vaille pour
du rendu, et elle est facile ici puisque les deux vues lisent les mêmes
tableaux de nombres.
