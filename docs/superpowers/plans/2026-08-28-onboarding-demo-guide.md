# Onboarding guidé sur données de démonstration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire découvrir Plia dans ses vrais écrans avec des données fictives avant toute demande de connexion bancaire, puis mémoriser le clic final sur « Compris ».

**Architecture:** Le cadre puis chaque page financière choisissent leur mode avant de lire la moindre donnée réelle : démonstration automatique, relecture volontaire ou réel. Une session de relecture est signalée au serveur par un cookie de session HttpOnly, afin que le cadre ne charge pas les notifications réelles derrière la démo. Les données fictives et les deux gestes guidés vivent dans un fournisseur client conservé par le cadre de l’application ; seule la date de fin du guide est écrite en base.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Postgres/Supabase avec RLS, Vitest/PGlite.

**Spec:** `docs/superpowers/specs/2026-08-28-onboarding-demo-guide-design.md`

## Global Constraints

- Lancer `npm test` avant la première modification de chaque session d’exécution et conserver sa sortie comme référence.
- Pour chaque règle, écrire le test, lancer le test ciblé pour le voir échouer, puis seulement écrire le code.
- Ne jamais lire les comptes, transactions, budgets ou notifications réels quand une page est en démonstration.
- Ne jamais appeler une action serveur de modification, la synchronisation ni le parcours bancaire depuis la démonstration.
- Ne jamais écrire les données fictives dans Postgres. Seul `onboarding_status.completed_at` est durable.
- Conserver les changements locaux déjà présents. Chaque commit ci-dessous doit ajouter uniquement les chemins nommés dans sa tâche.
- Les tests de logique et de base sont obligatoires. Les placements, le téléphone et le thème sombre sont aussi vérifiés dans le vrai serveur, car ce sont des comportements visuels.

## File Structure

### Persistance et décision serveur

- `src/db/schema.pg.sql` — table, droits et règle RLS de fin de guide.
- `src/db/repositories/onboarding-status.ts` — lecture et écriture idempotente de la décision.
- `src/lib/onboarding-mode.ts` — choix pur entre démo automatique, cookie de relecture et réel.
- `src/lib/current-onboarding.ts` — lecture serveur de la décision pour l’utilisateur connecté.
- `src/app/app/onboarding-actions.ts` — actions « Compris », démarrage et sortie d’une relecture ; aucune ne reçoit d’identifiant utilisateur du navigateur.

### Démonstration et parcours

- `src/lib/demo-finances.ts` — compte, groupes, opérations et montants fictifs, datés relativement au mois courant.
- `src/lib/demo-projection.ts` — application pure des deux gestes et construction des données des trois écrans.
- `src/lib/onboarding-tour.ts` — sept étapes, conditions de passage et transitions.
- `src/lib/onboarding-position.ts` — calcul pur du placement ancré ou centré.
- `src/components/demo-experience-provider.tsx` — état partagé, stockage de session, pause, reprise et relecture.
- `src/components/demo-status-band.tsx` — bandeau « Démonstration · Aucune donnée réelle ».
- `src/components/onboarding-tour.tsx` — voile, infobulle ordinateur, panneau bas téléphone et focus.
- `src/components/demo-dashboard.tsx` — tableau de bord alimenté par les calculs existants.
- `src/components/demo-transactions.tsx` — écran d’opérations et classement local de MONOPRIX.
- `src/components/demo-history.tsx` — historique et ajustement local de Transport.

### Réutilisation des écrans existants

- `src/app/app/layout.tsx` — monte l’expérience et remplace les commandes réelles en démo.
- `src/app/app/page.tsx`, `src/app/app/transactions/page.tsx`, `src/app/app/historique/page.tsx` — choisissent le mode avant les lectures financières.
- `src/app/app/settings/page.tsx`, `src/app/app/compte/page.tsx` — renvoient vers la démo tant que le guide automatique n’est pas terminé.
- `src/components/app-topbar.tsx` — navigation qui conserve la relecture et commande « Revoir le guide ».
- `src/components/horizon.tsx`, `src/components/releves-band.tsx`, `src/components/carte-postes.tsx` — repères stables du tableau de bord.
- `src/components/transactions-browser.tsx`, `src/components/group-select-field.tsx` — comportement local facultatif et mode lecture seule.
- `src/components/history-with-detail.tsx`, `src/components/history-grid.tsx`, `src/components/history-blocks/budget-edit-block.tsx` — repères et édition locale facultative de Transport.
- `src/components/first-account-onboarding.tsx`, `src/lib/onboarding.ts` — proposition de banque uniquement après « Compris ».

### Tests

- `tests/db/onboarding-status.test.ts`, `tests/db/pg-schema.test.ts`, `tests/db/rls.test.ts` — stockage, forme et isolement.
- `tests/lib/onboarding-mode.test.ts`, `tests/lib/onboarding-tour.test.ts`, `tests/lib/demo-projection.test.ts`, `tests/lib/onboarding-position.test.ts` — règles pures.
- `tests/components/demo-status-band.test.ts`, `tests/components/onboarding-tour.test.ts`, `tests/components/group-select-field.test.ts`, `tests/components/demo-pages.test.ts` — balisage, contrôles et absence de commandes réelles.
- `tests/app/onboarding-routing.test.ts`, `tests/app/onboarding-actions.test.ts`, `tests/app/onboarding.test.ts`, `tests/app/callback-onboarding.test.ts` — branchement des pages et sortie du guide.

---

### Task 1: Persist the durable “Compris” decision

**Files:**

- Create: `src/db/repositories/onboarding-status.ts`
- Create: `tests/db/onboarding-status.test.ts`
- Modify: `src/db/schema.pg.sql`
- Modify: `tests/db/pg-schema.test.ts`
- Modify: `tests/db/rls.test.ts`

- [ ] Run the full baseline before editing.

Run: `npm test`

Expected: the current 77 files and 853 tests pass. If the count has moved, record the actual green baseline instead of attributing it to this task.

- [ ] Extend the schema test first.

Add `onboarding_status` to the ordered table list and to `FORME`:

```ts
onboarding_status: ["completed_at:text", "user_id:text"],
```

Run: `npm test -- tests/db/pg-schema.test.ts`

Expected: FAIL because the tenth table does not exist.

- [ ] Add repository tests before implementation.

Cover all three cases:

```ts
expect(await isOnboardingComplete(db, "u1")).toBe(false);
await completeOnboarding(db, "u1", "2026-08-28T10:00:00.000Z");
expect(await isOnboardingComplete(db, "u1")).toBe(true);
await completeOnboarding(db, "u1", "2026-08-28T11:00:00.000Z");
expect(await db.all("SELECT * FROM onboarding_status")).toHaveLength(1);
```

Run: `npm test -- tests/db/onboarding-status.test.ts`

Expected: FAIL because the repository and table are absent.

- [ ] Add the table before the grant and RLS blocks.

```sql
CREATE TABLE IF NOT EXISTS onboarding_status (
  user_id TEXT PRIMARY KEY,
  completed_at TEXT NOT NULL
);
```

Include it in the application role grant, enable RLS, and add the direct-owner policy:

```sql
ALTER TABLE onboarding_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY a_soi ON onboarding_status
  USING (user_id = app_user_id())
  WITH CHECK (user_id = app_user_id());
```

- [ ] Implement the repository with an idempotent insert.

```ts
export async function isOnboardingComplete(db: Db, userId: string): Promise<boolean>;
export async function completeOnboarding(db: Db, userId: string, completedAt: string): Promise<void>;
```

Use `INSERT ... ON CONFLICT (user_id) DO NOTHING`. The first completion date is the durable decision and must not move during a replay.

- [ ] Extend the RLS setup with one completed row per fixture user, then assert that the app role sees only its own row and cannot update or insert the other user’s row.

Run: `npm test -- tests/db/pg-schema.test.ts tests/db/onboarding-status.test.ts tests/db/rls.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/db/schema.pg.sql src/db/repositories/onboarding-status.ts tests/db/pg-schema.test.ts tests/db/onboarding-status.test.ts tests/db/rls.test.ts
git commit -m "feat: persist onboarding completion"
```

### Task 2: Decide the experience before any financial read

**Files:**

- Create: `src/lib/onboarding-mode.ts`
- Create: `src/lib/current-onboarding.ts`
- Create: `tests/lib/onboarding-mode.test.ts`

- [ ] Write the mode matrix first.

```ts
type OnboardingMode = "automatic-demo" | "replay-demo" | "real";

expect(resolveOnboardingMode({ completed: false, replayCookie: false })).toBe("automatic-demo");
expect(resolveOnboardingMode({ completed: false, replayCookie: true })).toBe("automatic-demo");
expect(resolveOnboardingMode({ completed: true, replayCookie: false })).toBe("real");
expect(resolveOnboardingMode({ completed: true, replayCookie: true })).toBe("replay-demo");
```

Run: `npm test -- tests/lib/onboarding-mode.test.ts`

Expected: FAIL because the resolver is absent.

- [ ] Implement the pure resolver and cookie parser.

```ts
export function wantsReplay(cookieValue: string | undefined): boolean;
export function resolveOnboardingMode(input: {
  completed: boolean;
  replayCookie: boolean;
}): OnboardingMode;
export function isDemoMode(mode: OnboardingMode): boolean;
```

Only the session cookie value `1` requests a replay. An incomplete onboarding always remains `automatic-demo`, even if a stale replay cookie exists.

- [ ] Add the server-only adapter.

```ts
export const ONBOARDING_REPLAY_COOKIE = "plia_onboarding_replay";
export async function currentOnboardingCompletion(): Promise<boolean>;
export async function currentOnboardingMode(): Promise<OnboardingMode>;
```

It must call `pourMoi`, read only `onboarding_status`, read the cookie with `cookies()`, then pass both values to the pure resolver. It must not import accounts, transactions, groups or budgets.

- [ ] Add a source-boundary assertion to the test: `current-onboarding.ts` must not contain imports from financial repositories. This small structural check protects the “decide first” boundary.

Run: `npm test -- tests/lib/onboarding-mode.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/lib/onboarding-mode.ts src/lib/current-onboarding.ts tests/lib/onboarding-mode.test.ts
git commit -m "feat: resolve demo and real modes"
```

### Task 3: Build deterministic demo finances and recalculate them locally

**Files:**

- Create: `src/lib/demo-finances.ts`
- Create: `src/lib/demo-projection.ts`
- Create: `tests/lib/demo-projection.test.ts`

- [ ] Write tests for a fixed current month before creating fixtures.

Use `2026-08` and assert:

- the account ID is prefixed `demo-`;
- MONOPRIX is `-68.40`, initially uncategorized;
- Courses and Transport exist, with Transport at `120`;
- the fixture contains a past month, current month and at least two future months;
- no fixture value contains a real bank name, session ID or user ID.

Run: `npm test -- tests/lib/demo-projection.test.ts`

Expected: FAIL because the fixtures are absent.

- [ ] Implement `buildDemoFinances(currentMonth)` with stable IDs and dates relative to `currentMonth`.

Return domain-shaped objects, not rendered labels:

```ts
export type DemoFinances = {
  account: Account;
  groups: Group[];
  transactions: TxnView[];
  budgetAmounts: BudgetAmount[];
  lineAmounts: LineAmount[];
};
```

The exact fixture must include the account, irregular income, rent, groceries, transport, software, one delayed income, an exceeded envelope and MONOPRIX.

- [ ] Add tests for both guided changes.

```ts
const initial = buildDemoProjection("2026-08", { monoprixGroupId: null, transportBudget: 120 });
const categorized = buildDemoProjection("2026-08", { monoprixGroupId: DEMO_IDS.courses, transportBudget: 120 });
const adjusted = buildDemoProjection("2026-08", { monoprixGroupId: DEMO_IDS.courses, transportBudget: 150 });

expect(categorized.dashboard.coursesSpent).toBe(initial.dashboard.coursesSpent + 68.4);
expect(adjusted.history.transportBudget).toBe(150);
expect(adjusted.futureBalances).not.toEqual(categorized.futureBalances);
```

Run: `npm test -- tests/lib/demo-projection.test.ts`

Expected: FAIL until the projection builder exists.

- [ ] Implement `buildDemoProjection` by reusing `recapCompte`, `computeHistory`, `computeForecast`, `computeSolde` and `computePlannedSoldes`. Do not duplicate their formulas.

```ts
export type DemoEdits = {
  monoprixGroupId: number | null;
  transportBudget: number;
};

export function buildDemoProjection(month: string, edits: DemoEdits): {
  account: Account;
  dashboard: ReturnType<typeof recapCompte>;
  transactions: TxnView[];
  history: DemoHistoryProps;
};
```

Convert the raw arrays with `toDatedBudgets` and `toDatedLineAmounts`. Apply edits to cloned objects so the base fixture is never mutated across tests or visits.

Run: `npm test -- tests/lib/demo-projection.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/lib/demo-finances.ts src/lib/demo-projection.ts tests/lib/demo-projection.test.ts
git commit -m "feat: add in-memory demo finances"
```

### Task 4: Define the seven-step state machine and visit persistence

**Files:**

- Create: `src/lib/onboarding-tour.ts`
- Create: `tests/lib/onboarding-tour.test.ts`
- Create: `src/components/demo-experience-provider.tsx`

- [ ] Write the complete transition tests first.

Assert the ordered IDs and routes:

```ts
[
  ["horizon", "/app"],
  ["month-projection", "/app"],
  ["envelopes", "/app"],
  ["categorize-monoprix", "/app/transactions"],
  ["adjust-transport", "/app/historique"],
  ["month-continuity", "/app/historique"],
  ["refresh", "/app"],
]
```

Also test Back, Next, blocked Next at steps 4 and 5, pause, resume, and final state.

Run: `npm test -- tests/lib/onboarding-tour.test.ts`

Expected: FAIL because the state machine is absent.

- [ ] Implement a declared step list and pure reducer.

```ts
export type TourStepId =
  | "horizon" | "month-projection" | "envelopes"
  | "categorize-monoprix" | "adjust-transport"
  | "month-continuity" | "refresh";

export type TourState = {
  step: TourStepId;
  paused: boolean;
  monoprixCategorized: boolean;
  transportAdjusted: boolean;
};

export const TOUR_STEPS: readonly TourStep[];
export function reduceTour(state: TourState, event: TourEvent): TourState;
export function canAdvance(state: TourState): boolean;
```

Each step defines route, target name, title, text, preferred placement and optional required action.

- [ ] Add session serialization tests. Invalid JSON, an unknown version or an unknown step must fall back to step 1. A new `sessionStorage` session must therefore restart at step 1.

```ts
export const TOUR_SESSION_KEY = "plia:onboarding-tour:v1";
export type TourVisit = { tour: TourState; edits: DemoEdits };
export function serializeTourVisit(visit: TourVisit): string;
export function restoreTourVisit(raw: string | null): TourVisit;
```

The serialized visit must retain both completed gestures: MONOPRIX remains in Courses and Transport remains at 150 € after a reload in the same browser session.

- [ ] Implement `DemoExperienceProvider` around the pure reducer. It owns the current demo edits, writes the whole `TourVisit` to `sessionStorage`, navigates to the step route, and exposes an optional hook so production components can remain unchanged outside demo. Server rendering uses the default visit without touching `window`; hydration restores the session value.

```ts
export function DemoExperienceProvider(props: {
  mode: OnboardingMode;
  onFinish?: () => Promise<{ destination: "/app" }>;
  onExitReplay?: () => Promise<void>;
  children: React.ReactNode;
}): React.ReactNode;
export function useDemoExperience(): DemoExperience;
export function useDemoExperienceOptional(): DemoExperience | null;
```

Task 4 does not import a server action. It only calls injected callbacks when present. In automatic demo, pause stays local and leaves the demo visible. In replay demo, pause uses `onExitReplay`, navigates to `/app`, then refreshes back to real data.

Run: `npm test -- tests/lib/onboarding-tour.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/lib/onboarding-tour.ts src/components/demo-experience-provider.tsx tests/lib/onboarding-tour.test.ts
git commit -m "feat: add guided demo state machine"
```

### Task 5: Render the demo dashboard with stable tour targets

**Files:**

- Create: `src/components/demo-dashboard.tsx`
- Create: `tests/components/demo-pages.test.ts`
- Modify: `src/components/recapitulatif-compte.tsx`
- Modify: `src/components/horizon.tsx`
- Modify: `src/components/releves-band.tsx`
- Modify: `src/components/carte-postes.tsx`

- [ ] Write static-render tests first. Render `DemoDashboard` inside a provider fixture and assert one occurrence of each stable target:

```txt
data-onboarding-target="horizon"
data-onboarding-target="month-projection"
data-onboarding-target="envelopes"
```

Also assert that the visible amounts and the Courses/Transport labels come from the fixture.

Run: `npm test -- tests/components/demo-pages.test.ts`

Expected: FAIL because the component and target props are absent.

- [ ] Add optional target props without hard-coding demo IDs in generic components.

```ts
export function Horizon({ mois, onboardingTarget }: {
  mois: MoisDHorizon[];
  onboardingTarget?: string;
});
```

Use the same optional prop pattern for the projection card in `RelevesBand` and the outgoing envelope card/selected row in `CartePostes`. When absent, rendered production markup must remain unchanged.

- [ ] Implement `DemoDashboard`. It reads `buildDemoProjection` through the provider and renders the existing `RecapitulatifCompte`, never a simplified mock card.

Pass the three target names down through explicit optional props added to `RecapitulatifCompte`; do not select elements by their visible French text.

Run: `npm test -- tests/components/demo-pages.test.ts`

Expected: PASS.

- [ ] Run existing dashboard/component tests to catch presentation regressions.

Run: `npm test -- tests/components tests/lib/recap-compte.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/components/demo-dashboard.tsx src/components/horizon.tsx src/components/releves-band.tsx src/components/carte-postes.tsx src/components/recapitulatif-compte.tsx tests/components/demo-pages.test.ts
git commit -m "feat: render guided demo dashboard"
```

### Task 6: Make MONOPRIX categorization interactive without a server write

**Files:**

- Create: `src/components/demo-transactions.tsx`
- Modify: `src/components/transactions-browser.tsx`
- Modify: `src/components/group-select-field.tsx`
- Modify: `tests/components/group-select-field.test.ts`
- Modify: `tests/components/demo-pages.test.ts`

- [ ] Add a failing `GroupSelectField` test for an injected local handler.

The component contract becomes:

```ts
onLocalChange?: (selection: { groupId: number | null; lineId: number | null }) => void;
onboardingTarget?: string;
```

The test must prove that rendering this mode does not invoke or require `setGroup`. Keep the existing production tests unchanged.

Run: `npm test -- tests/components/group-select-field.test.ts`

Expected: FAIL because the prop does not exist.

- [ ] Implement the local branch inside the existing `onChange`. If `onLocalChange` exists, update the optimistic value and call it; otherwise keep the current `pendant(() => setGroup(...))` path exactly.

- [ ] Add a read-only demo contract to `TransactionsBrowser`:

```ts
demo?: {
  targetTransactionId: string;
  onCategorize: (transactionId: string, groupId: number | null) => void;
};
```

In demo mode, hide adding, comments, ignore toggles and manual actions. Show the category selector because it is the guided action. Add `data-onboarding-target="categorize-monoprix"` to the MONOPRIX row.

- [ ] Write a failing demo page test proving that MONOPRIX and Courses are present while “Ajouter une opération”, comment controls and ignore controls are absent.

Run: `npm test -- tests/components/demo-pages.test.ts`

Expected: FAIL until `DemoTransactions` exists.

- [ ] Implement `DemoTransactions` with fixture data and provider callback. Selecting Courses must dispatch `MONOPRIX_CATEGORIZED`, which unlocks step 4 and changes the dashboard calculation when returning.

Run: `npm test -- tests/components/group-select-field.test.ts tests/components/demo-pages.test.ts tests/lib/demo-projection.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/components/demo-transactions.tsx src/components/transactions-browser.tsx src/components/group-select-field.tsx tests/components/group-select-field.test.ts tests/components/demo-pages.test.ts
git commit -m "feat: guide demo transaction categorization"
```

### Task 7: Make the Transport budget adjustment interactive in the real history UI

**Files:**

- Create: `src/components/demo-history.tsx`
- Modify: `src/components/history-with-detail.tsx`
- Modify: `src/components/history-grid.tsx`
- Modify: `src/components/history-blocks/budget-edit-block.tsx`
- Modify: `tests/components/demo-pages.test.ts`
- Modify: `tests/lib/demo-projection.test.ts`

- [ ] Add failing static tests that `DemoHistory` renders the existing history table with:

```txt
data-onboarding-target="adjust-transport"
data-onboarding-target="month-continuity"
```

Assert that the Transport edit starts at `120` and carries the demo bridge. Keep the state-change assertion in `demo-projection.test.ts`: changing the edit to `150` changes the projected balances. The real click sequence is verified on the running app in Task 12.

Run: `npm test -- tests/components/demo-pages.test.ts tests/lib/demo-projection.test.ts`

Expected: FAIL because the demo history path is absent.

- [ ] Add an optional demo budget bridge at the narrowest write boundary.

`BudgetEditBlock` receives no new required prop. It reads `useDemoExperienceOptional()` and only replaces the write when both are true:

- the provider is in demo mode;
- `info.id` is the fixture Transport group;

The local “Appliquer” path dispatches `TRANSPORT_BUDGET_CHANGED` and never imports or calls a server action dynamically. Production continues to call the four existing actions.

- [ ] Add optional target metadata to the Transport budget cell and the month header range. Thread it through `HistoryWithDetail` and `HistoryGrid` as explicit props:

```ts
onboarding?: {
  budgetGroupId: number;
  budgetMonth: string;
  budgetTarget: string;
  monthsTarget: string;
};
```

Do not search the DOM by label. Use the existing group ID and month index to place the attributes.

- [ ] Implement `DemoHistory` by consuming the already computed `history` props from `buildDemoProjection` and rendering `MonthRangePicker` plus `HistoryWithDetail`. Keep the same month span as the guide definition.

- [ ] In demo mode, hide or disable all other history writes with the text `Disponible avec vos données`: group creation, group management, transaction reassignment, comments, ignore toggles and notification dismissal. The Transport amount is the only active write-like control.

Run: `npm test -- tests/components/demo-pages.test.ts tests/lib/demo-projection.test.ts tests/components/history-grid.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/components/demo-history.tsx src/components/history-with-detail.tsx src/components/history-grid.tsx src/components/history-blocks/budget-edit-block.tsx tests/components/demo-pages.test.ts tests/lib/demo-projection.test.ts
git commit -m "feat: guide demo budget adjustment"
```

### Task 8: Build the anchored tooltip, mobile panel and fallback

**Files:**

- Create: `src/lib/onboarding-position.ts`
- Create: `tests/lib/onboarding-position.test.ts`
- Create: `src/components/onboarding-tour.tsx`
- Create: `tests/components/onboarding-tour.test.ts`
- Modify: `src/app/globals.css`

- [ ] Write geometry tests first for preferred placement, viewport clamping and missing targets.

```ts
expect(placeTourCard({ target: null, viewport, card })).toEqual({ mode: "center", ... });
expect(placeTourCard({ target: nearRightEdge, preferred: "right", viewport, card }).x)
  .toBeLessThanOrEqual(viewport.width - card.width - 16);
```

Run: `npm test -- tests/lib/onboarding-position.test.ts`

Expected: FAIL because the helper is absent.

- [ ] Implement pure placement with a 16 px viewport gutter. Preferred placement may flip when it would cover the target or leave the viewport. Missing target returns centered mode.

- [ ] Write static markup tests for the tour controls and accessibility:

- dialog name comes from the step title;
- progress says `Étape N sur 7`;
- buttons are `Retour`, `Plus tard`, `Suivant` or `Compris`;
- blocked steps render `Suivant` disabled;
- fallback includes a short “zone indisponible” message without blocking continuation.

Run: `npm test -- tests/components/onboarding-tour.test.ts`

Expected: FAIL because the component is absent.

- [ ] Implement the overlay.

Desktop behavior:

- find `[data-onboarding-target="..."]` after navigation, retrying for at most 1.5 seconds;
- scroll it into the app viewport;
- measure with `getBoundingClientRect` and place the card without covering it;
- apply a visible focus ring and a light veil whose cutout leaves the target active for steps 4 and 5.

Mobile behavior below `768px`:

- render the explanation as a fixed bottom panel;
- keep the target visible above it;
- preserve the same controls and progress.

Keyboard behavior:

- focus the dialog heading or first control on step change;
- Escape dispatches pause;
- Tab remains inside the dialog controls;
- disabled Next remains unfocusable by native button behavior.

Motion behavior:

- use CSS transitions only when `prefers-reduced-motion: no-preference`;
- no animated scrolling or pulsing under reduced motion.

- [ ] Add only the necessary tokens/classes to `globals.css`, reusing the current surface, outline, shadow and focus colors. Verify dark selectors use semantic variables rather than fixed white/black.

Run: `npm test -- tests/lib/onboarding-position.test.ts tests/components/onboarding-tour.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/lib/onboarding-position.ts src/components/onboarding-tour.tsx src/app/globals.css tests/lib/onboarding-position.test.ts tests/components/onboarding-tour.test.ts
git commit -m "feat: add responsive onboarding tour"
```

### Task 9: Add the demo band, replay navigation and safe top bar

**Files:**

- Create: `src/components/demo-status-band.tsx`
- Create: `tests/components/demo-status-band.test.ts`
- Create: `src/app/app/onboarding-actions.ts`
- Create: `tests/app/onboarding-actions.test.ts`
- Create: `tests/app/onboarding-shell.test.ts`
- Modify: `src/components/app-topbar.tsx`
- Modify: `src/app/app/layout.tsx`

- [ ] Write static tests for both active and paused states.

Active must show `Démonstration` and `Aucune donnée réelle`. Paused must also show `Reprendre le guide`. Navigation uses normal `/app` links because the replay cookie, not the URL, preserves the mode.

Run: `npm test -- tests/components/demo-status-band.test.ts`

Expected: FAIL because the band is absent.

- [ ] Implement `DemoStatusBand` directly below the top bar and above `FilDAttente`. It is one neutral slim row, not a card and not a dark banner.

- [ ] Make `AppTopbar` consume `useDemoExperienceOptional()` and fall back to `real` when it is rendered outside the provider. Do not add a second source of truth through a required prop.

```ts
const demo = useDemoExperienceOptional();
const experience = demo?.mode ?? "real";
```

Behavior:

- automatic demo: keep the local calculator, but hide Sync, notifications, account/settings destinations and every bank-related command;
- replay demo: same safe command set; the session cookie keeps the mode between the three normal navigation links;
- real: preserve current navigation and add `Revoir le guide` in the account menu.

The refresh target at step 7 is a disabled visual control rendered specifically for demo; it carries `data-onboarding-target="refresh"` and never calls `SyncButton`.

- [ ] Before `appNotifications()` in the layout, call `currentOnboardingMode()`. Load real notifications only when the result is `real`; pass an empty list in either demo mode. This is required to prevent a hidden real-data read behind the overlay.

- [ ] Write `onboarding-shell.test.ts` with mocked auth, mode and notifications. Assert `appNotifications` is not called in `automatic-demo` or `replay-demo`, then is called once in `real`.

Run: `npm test -- tests/app/onboarding-shell.test.ts`

Expected: FAIL before the layout branches, then PASS after it does.

- [ ] Reorder providers in the layout so `DemoExperienceProvider` receives the server-resolved mode and wraps both the page content and the history detail sidebar. Pass `finishOnboarding` and `exitOnboardingReplay` as its server-action callbacks. The provider must not recompute mode from the URL.

- [ ] Write the action tests before creating the actions. Cover: authenticated completion, absence of a client-supplied user ID, idempotent repeated completion, unchanged first completion date during replay, no bank redirect, replay cookie creation and replay cookie deletion.

Run: `npm test -- tests/app/onboarding-actions.test.ts`

Expected: FAIL because the actions are absent.

- [ ] Create `onboarding-actions.ts`. `startOnboardingReplay` sets `plia_onboarding_replay=1` as an HttpOnly, SameSite Lax session cookie scoped to `/app`; `exitOnboardingReplay` deletes it. Neither action touches financial tables. `finishOnboarding` writes the durable completion through `pourMoi`, deletes the replay cookie, revalidates `/app`, and returns `/app`.

- [ ] Wire `Revoir le guide` to `startOnboardingReplay`, then navigate to `/app` and refresh. Keep the account menu and logout reachable in demo, but remove only `Mon compte` and `Réglages` until the user exits the demo.

- [ ] Verify the top bar’s existing route and logout behavior tests, then the new band tests.

Run: `npm test -- tests/components/demo-status-band.test.ts tests/app/onboarding-shell.test.ts tests/app/onboarding-actions.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/components/demo-status-band.tsx src/components/app-topbar.tsx src/app/app/layout.tsx src/app/app/onboarding-actions.ts tests/components/demo-status-band.test.ts tests/app/onboarding-actions.test.ts tests/app/onboarding-shell.test.ts
git commit -m "feat: add safe demo app shell"
```

### Task 10: Branch all pages before real data and finish safely

**Files:**

- Create: `tests/app/onboarding-routing.test.ts`
- Modify: `src/app/app/page.tsx`
- Modify: `src/app/app/transactions/page.tsx`
- Modify: `src/app/app/historique/page.tsx`
- Modify: `src/app/app/settings/page.tsx`
- Modify: `src/app/app/compte/page.tsx`
- Modify: `src/components/first-account-onboarding.tsx`
- Modify: `src/lib/onboarding.ts`
- Modify: `tests/app/onboarding.test.ts`

- [ ] Write route-boundary tests first with mocked mode and mocked repositories.

For each financial page, assert:

- `automatic-demo` renders its demo component;
- `replay-demo` renders its demo component;
- neither demo mode calls `listAccounts`, `listTransactions`, `listGroups`, budget reads or notification reads;
- `real` follows the current repository path.

Run: `npm test -- tests/app/onboarding-routing.test.ts`

Expected: FAIL because pages still read financial data before branching.

- [ ] At the first executable line of each page, call `currentOnboardingMode`. Return `DemoDashboard`, `DemoTransactions` or `DemoHistory` immediately when `isDemoMode(mode)` is true. Leave the current real-data code below that return.

- [ ] Guard `/app/settings` and `/app/compte` during automatic demo by redirecting to `/app`. During replay, call `exitOnboardingReplay` before entering one of those real destinations; do not surface bank connection inside the replay.

- [ ] Wire the final `Compris` control to `finishOnboarding()`. It clears the replay cookie, writes the first completion date idempotently, then the client navigates to `/app` and refreshes. The dashboard decides whether to show real finances or `FirstAccountOnboarding` from the actual account list.

- [ ] Rewrite the post-guide empty-account screen. Preserve the existing explicit `BankPicker`, security explanation and callback messages, but remove any wording that implies the bank must be connected before seeing Plia. Suggested lead:

```txt
Vous avez vu comment Plia fonctionne.
Reliez une banque quand vous êtes prêt à retrouver cette vue avec vos chiffres.
```

Ensure this screen is unreachable before `Compris` through the page mode branch.

Run: `npm test -- tests/app/onboarding-routing.test.ts tests/app/onboarding-actions.test.ts tests/app/onboarding.test.ts tests/app/callback-onboarding.test.ts`

Expected: PASS.

- [ ] Commit only this task, including the already-started onboarding files only after they match the final proof-before-permission flow.

```bash
git add src/app/app/page.tsx src/app/app/transactions/page.tsx src/app/app/historique/page.tsx src/app/app/settings/page.tsx src/app/app/compte/page.tsx src/components/first-account-onboarding.tsx src/lib/onboarding.ts tests/app/onboarding-routing.test.ts tests/app/onboarding.test.ts tests/app/callback-onboarding.test.ts
git commit -m "feat: route first visits through the demo"
```

### Task 11: Reconcile the bank callback and prove no automatic import path remains

**Files:**

- Modify: `src/app/api/callback/route.ts`
- Modify: `tests/app/callback-onboarding.test.ts`
- Modify: `src/components/bank-picker.tsx`
- Create: `tests/app/no-bank-before-consent.test.ts`

- [ ] Add a source and behavior regression test first.

It must prove:

- no demo component imports `BankPicker`, `SyncButton`, bank actions or Enable Banking modules;
- the onboarding completion action does not redirect to `/api/connect`;
- only a user click on the bank picker starts authorization;
- the callback still returns to `/app?connected=1&imported=N` after a real explicit connection.

Run: `npm test -- tests/app/no-bank-before-consent.test.ts tests/app/callback-onboarding.test.ts`

Expected: FAIL if any current prototype path still couples first visit and import.

- [ ] Reconcile the existing callback and bank-picker changes with the final flow. Keep the successful import message, but do not mark onboarding completed in the callback: completion already happened before the user was offered the picker.

- [ ] Confirm `BankPicker` remains a visible, explicit button and never starts on mount, URL parsing or onboarding completion.

Run: `npm test -- tests/app/no-bank-before-consent.test.ts tests/app/callback-onboarding.test.ts`

Expected: PASS.

- [ ] Commit only this task.

```bash
git add src/app/api/callback/route.ts src/components/bank-picker.tsx tests/app/callback-onboarding.test.ts tests/app/no-bank-before-consent.test.ts
git commit -m "fix: keep bank import explicitly user initiated"
```

### Task 12: Full verification on tests, build and real screens

**Files:**

- Modify only if a verification uncovers a defect, always with a failing regression test first.

- [ ] Run the complete automated suite.

Run: `npm test`

Expected: every test passes. Record the actual file and test counts.

- [ ] Run static checks and production build.

Run: `npm run lint`

Expected: exit 0 with no new warning.

Run: `npm run build`

Expected: exit 0 and all `/app` routes compile.

- [ ] Start the real server.

Run: `npm run dev`

Expected: the local URL opens and authentication reaches `/app`.

- [ ] Verify a user without completion and without a bank, desktop light mode:

1. `/app` shows fake finances immediately and no bank prompt.
2. The demo band says no real data.
3. Steps 1–3 target Horizon, projection and envelopes without covering them.
4. Step 4 navigates to operations; Next stays disabled until MONOPRIX is put in Courses.
5. Step 5 navigates to history; Next stays disabled until Transport is changed from 120 € to 150 €.
6. Steps 6–7 complete; only then does the explicit bank proposal appear.
7. No network call to the bank or sync endpoint occurs before clicking the bank button.

- [ ] Verify pause and visit behavior:

1. Escape and “Plus tard” hide the overlay but keep demo data and `Reprendre le guide`.
2. Reload in the same tab resumes the stored pause/step.
3. A new browser session starts again at step 1 when completion is absent.

- [ ] Verify an already completed user with a linked bank:

1. `/app` shows real data.
2. `Revoir le guide` enters demo and the session cookie keeps it active across all three destinations.
3. Pausing or finishing replay clears the cookie and restores real data.
4. The stored original completion date does not change.

- [ ] Verify mobile at 390 px in light and dark mode:

1. Explanations use the bottom panel.
2. The target remains visible above it.
3. Text, focus rings, veil and status band remain readable.
4. The real target stays clickable at steps 4 and 5.

- [ ] Verify reduced motion and keyboard:

1. With reduced motion enabled, no smooth scroll, pulse or animated transition runs.
2. Focus enters the dialog at every step.
3. Tab stays among the dialog commands.
4. Escape pauses; Return activates enabled controls only.

- [ ] Run the complete suite one final time after visual fixes.

Run: `npm test && npm run lint && npm run build`

Expected: all three commands exit 0. Only then report the onboarding as complete.
