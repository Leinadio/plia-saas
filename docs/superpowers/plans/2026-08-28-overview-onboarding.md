# Vue d’ensemble and Guided Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard navigation with a primary “Vue d’ensemble” screen and rebuild the demo onboarding as nine anchored steps that stay on that screen.

**Architecture:** Keep `/app/historique` as the stable internal URL and make `/app` redirect to it. Keep the tour definition and transitions pure in `src/lib/onboarding-tour.ts`; the demo page only exposes stable targets and reports the two required gestures. The top bar becomes a responsive two-row grid on mobile, with a permanent Guide button and one compact secondary-actions disclosure.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Radix/shadcn primitives.

**Spec:** `docs/superpowers/specs/2026-08-28-overview-onboarding-design.md`

## Global Constraints

- Run `npm test` before the first source edit and record any pre-existing failure.
- For every behavior change, write the test first, run it, and see the expected failure before changing source code.
- The visible navigation is exactly “Vue d’ensemble”, then “Transactions”; “Tableau de bord” is absent.
- All nine onboarding steps use `/app/historique`; the tour never sends the user to Transactions.
- No real account, transaction, budget, database action, or banking route is read or written in demo mode.
- “Plus tard” pauses only the current session; “Compris” remains the only durable completion action.
- The permanent “Guide” button is visible on every authenticated app screen and restarts at step one.
- Mobile uses two header rows; Sync, notifications, and calculator live in one “Actions” disclosure.
- Interactive steps never render a blocking veil, never trap focus, and never cover the field or detail panel they require.
- Preserve unrelated work already present in the dirty worktree. Stage only files owned by the current task when making a checkpoint commit.

---

### Task 1: Replace the tour state machine with the nine-step overview journey

**Files:**
- Modify: `src/lib/onboarding-tour.ts`
- Modify: `src/components/demo-experience-provider.tsx`
- Test: `tests/lib/onboarding-tour.test.ts`

**Interfaces:**
- Produces: `TourStepId` with nine overview-only IDs.
- Produces: `TourState.detailOpened: boolean`.
- Produces: `TourStep.completionTarget?: string`.
- Produces: `activeTourTarget(step: TourStep, state: TourState): string`.
- Produces: `DemoExperience.restart(): void`.
- Preserves: `MONOPRIX_CATEGORIZED` and `edits.monoprixGroupId` so the optional demo Transactions screen still works outside the guide.

- [ ] **Step 1: Write the failing state-machine tests**

Replace the seven-step expectation and add the two required gesture checks:

```ts
expect(TOUR_STEPS.map(({ id, route, target }) => [id, route, target])).toEqual([
  ["demo-account", "/app/historique", "demo-account"],
  ["period-range", "/app/historique", "overview-period"],
  ["time-context", "/app/historique", "overview-time"],
  ["income", "/app/historique", "overview-income"],
  ["planned-expenses", "/app/historique", "overview-planned-expenses"],
  ["unplanned-expenses", "/app/historique", "overview-unplanned-expenses"],
  ["adjust-transport", "/app/historique", "adjust-transport"],
  ["amount-detail", "/app/historique", "open-amount-detail"],
  ["ending-balance", "/app/historique", "overview-ending-balance"],
]);

expect(TOUR_STEPS[6].requiredAction).toBe("transport-adjusted");
expect(TOUR_STEPS[7].requiredAction).toBe("detail-opened");

let state = freshTourVisit().tour;
state = { ...state, step: "amount-detail" };
expect(canAdvance(state)).toBe(false);
expect(activeTourTarget(TOUR_STEPS[7], state)).toBe("open-amount-detail");
state = reduceTour(state, { type: "DETAIL_OPENED" });
expect(canAdvance(state)).toBe(true);
expect(activeTourTarget(TOUR_STEPS[7], state)).toBe("amount-detail-panel");

const unavailableGesture = { ...freshTourVisit().tour, step: "adjust-transport" as const };
expect(reduceTour(unavailableGesture, { type: "SKIP" }).step).toBe("amount-detail");
```

Add a persistence assertion using version 2 and a reset assertion that a fresh visit starts at `demo-account` with `transportBudget: 120` and `detailOpened: false`.

- [ ] **Step 2: Run the state-machine test and verify the red result**

Run: `npm test -- tests/lib/onboarding-tour.test.ts`

Expected: FAIL because the old IDs still begin with `horizon`, there are seven steps, and `DETAIL_OPENED`/`activeTourTarget` do not exist.

- [ ] **Step 3: Implement the nine declarative steps and transitions**

Use these exact IDs, copy, and actions:

```ts
export type TourStepId =
  | "demo-account"
  | "period-range"
  | "time-context"
  | "income"
  | "planned-expenses"
  | "unplanned-expenses"
  | "adjust-transport"
  | "amount-detail"
  | "ending-balance";

export type TourState = {
  step: TourStepId;
  paused: boolean;
  monoprixCategorized: boolean;
  transportAdjusted: boolean;
  detailOpened: boolean;
};

export type TourStep = {
  id: TourStepId;
  route: "/app/historique";
  target: string;
  completionTarget?: string;
  title: string;
  text: string;
  placement: "top" | "right" | "bottom" | "left";
  requiredAction?: "transport-adjusted" | "detail-opened";
};
```

The visible strings are:

```ts
const TOUR_STEPS = [
  ["demo-account", "demo-account", "Vous êtes dans une démonstration", "Tous les montants sont fictifs. Aucune donnée bancaire réelle n’est utilisée."],
  ["period-range", "overview-period", "Choisissez votre période", "Affichez davantage de passé ou prolongez la vue vers les mois à venir."],
  ["time-context", "overview-time", "Situez-vous dans le temps", "Le passé repose sur les opérations connues, le mois courant relie le réel au prévu, puis viennent les projections."],
  ["income", "overview-income", "Voyez ce qui rentre", "Comparez ce qui était attendu avec ce qui a réellement été reçu."],
  ["planned-expenses", "overview-planned-expenses", "Anticipez ce qui doit sortir", "Le budget fixé, le montant dépensé et le reste montrent ce qui est encore disponible."],
  ["unplanned-expenses", "overview-unplanned-expenses", "Repérez les dépenses imprévues", "Elles affectent immédiatement le solde, même sans enveloppe prévue."],
  ["adjust-transport", "adjust-transport", "Ajustez votre budget", "Passez le budget Transport de 120 € à 150 €. Les mois suivants se recalculent sans modifier de vraies données."],
  ["amount-detail", "open-amount-detail", "Comprenez chaque montant", "Cliquez sur ce montant pour voir les opérations qui le composent."],
  ["ending-balance", "overview-ending-balance", "Regardez où vous allez", "Les revenus, les dépenses et vos ajustements construisent le solde de fin de chaque mois."],
] as const;
```

Set `completionTarget: "amount-detail-panel"` on `amount-detail`. Implement:

```ts
export function activeTourTarget(step: TourStep, state: TourState): string {
  return step.completionTarget && state.detailOpened ? step.completionTarget : step.target;
}
```

`canAdvance` blocks only `adjust-transport` until `transportAdjusted` and `amount-detail` until `detailOpened`. `DETAIL_OPENED` sets the new flag. `SKIP` advances one step without requiring its gesture and exists only for a confirmed missing target. Bump serialized visits to version 2 so old seven-step session data restarts cleanly.

- [ ] **Step 4: Add a restart method to the demo provider**

Expose this exact member on `DemoExperience`:

```ts
restart: () => void;
```

Implement it with `writeVisit(freshTourVisit())` followed by `router.push(TOUR_STEPS[0].route)`. Keep `finish`, `pause`, and real-data behavior unchanged.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- tests/lib/onboarding-tour.test.ts`

Expected: PASS.

- [ ] **Step 6: Record the checkpoint**

```bash
git add src/lib/onboarding-tour.ts src/components/demo-experience-provider.tsx tests/lib/onboarding-tour.test.ts
git commit -m "refactor: focus onboarding on overview"
```

---

### Task 2: Expose all overview targets and report the two user gestures

**Files:**
- Modify: `src/components/demo-history.tsx`
- Modify: `src/components/history-with-detail.tsx`
- Modify: `src/components/history-grid.tsx`
- Modify: `src/components/history-detail-sidebar.tsx`
- Test: `tests/components/demo-pages.test.ts`
- Create: `tests/components/history-detail-onboarding.test.tsx`

**Interfaces:**
- Consumes: `DemoExperience.dispatch({ type: "DETAIL_OPENED" })`.
- Produces: one initial DOM target for each of the nine steps except `amount-detail-panel`, which appears only after opening the side panel.
- Produces: `HistoryGrid` onboarding target object with `incomeTarget`, `plannedTarget`, `unplannedTarget`, `timeTarget`, `budgetTarget`, `detailTarget`, and `endingBalanceTarget`.

- [ ] **Step 1: Write failing target-count tests**

Update `tests/components/demo-pages.test.ts` to assert exactly one of each initial target:

```ts
for (const target of [
  "demo-account",
  "overview-period",
  "overview-time",
  "overview-income",
  "overview-planned-expenses",
  "overview-unplanned-expenses",
  "adjust-transport",
  "open-amount-detail",
  "overview-ending-balance",
]) {
  expect(countTarget(renderDemoHistory(), target), target).toBe(1);
}
```

Add a sidebar render test that supplies a non-null `CellDetail` and expects `data-onboarding-target="amount-detail-panel"` on the panel content.

- [ ] **Step 2: Run the component tests and verify the red result**

Run: `npm test -- tests/components/demo-pages.test.ts tests/components/history-detail-onboarding.test.tsx`

Expected: FAIL because only `adjust-transport` and `month-continuity` currently exist.

- [ ] **Step 3: Mark the demo account and period**

In `DemoHistory`, add a small, non-interactive account label above the range picker:

```tsx
<div data-onboarding-target="demo-account" className="w-fit rounded-lg border px-3 py-2 text-sm font-semibold">
  Compte Démo
</div>
<div data-onboarding-target="overview-period">
  <MonthRangePicker
    min={history.stripMin}
    max={history.stripMax}
    from={history.months[0]}
    to={history.months[history.months.length - 1]}
    current={history.currentMonth}
  />
</div>
```

Pass `DEMO_IDS.transport` for the editable budget and `DEMO_IDS.courses` for the detail cell. Pass all seven grid target names explicitly through the existing `onboarding` prop.

- [ ] **Step 4: Extend the grid’s onboarding contract**

Replace the current four-field private type with:

```ts
type OnboardingTargets = {
  budgetGroupId: number;
  detailGroupId: number;
  month: string;
  timeTarget: string;
  incomeTarget: string;
  plannedTarget: string;
  unplannedTarget: string;
  budgetTarget: string;
  detailTarget: string;
  endingBalanceTarget: string;
  onDetailOpened?: () => void;
};
```

Apply targets at these stable places:

- current-month `<TableHead>`: `timeTarget`;
- `bande("bloc-revenu", ...)`: `incomeTarget`;
- `bande("bloc-planned", ...)`: `plannedTarget`;
- `bande("bloc-unplanned", ...)`: `unplannedTarget`;
- Transport/current-month budget `CellAmount`: `budgetTarget`;
- Courses/current-month spent `CellAmount`: `detailTarget`;
- “Solde de fin de mois” footer `<TableRow>`: `endingBalanceTarget`.

Add `onOnboardingSelect?: () => void` to `CellAmount` and call it immediately after `onSelect(...)` in the amount button click. Supply it only to the targeted Courses cell.

- [ ] **Step 5: Wire the detail gesture without touching real mode**

In `DemoHistory`, obtain `dispatch` and pass:

```ts
onDetailOpened: () => dispatch({ type: "DETAIL_OPENED" })
```

`HistoryWithDetail` must remove `onDetailOpened` before spreading the onboarding object into `HistoryGrid`, then pass the remaining data and callback explicitly. Real history pages do not supply this callback, so no real click writes tour state.

Mark the rendered non-null detail body with:

```tsx
<SidebarContent data-onboarding-target="amount-detail-panel" className="p-4">
```

- [ ] **Step 6: Run the target and detail tests**

Run: `npm test -- tests/components/demo-pages.test.ts tests/components/history-detail-onboarding.test.tsx tests/lib/onboarding-tour.test.ts`

Expected: PASS with every initial target unique and the completed detail target present only in the side panel.

- [ ] **Step 7: Record the checkpoint**

```bash
git add src/components/demo-history.tsx src/components/history-with-detail.tsx src/components/history-grid.tsx src/components/history-detail-sidebar.tsx tests/components/demo-pages.test.ts tests/components/history-detail-onboarding.test.tsx
git commit -m "feat: guide overview interactions"
```

---

### Task 3: Make the tooltip follow dynamic targets and handle missing zones safely

**Files:**
- Modify: `src/components/onboarding-tour.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/components/onboarding-tour.test.ts`
- Test: `tests/lib/onboarding-position.test.ts`

**Interfaces:**
- Consumes: `activeTourTarget(step, tour)` and `TOUR_STEPS.length`.
- Produces: target states `seeking`, `found`, and `missing`.
- Produces: a bottom fallback with “Réessayer” and “Passer cette étape”; it never uses centered placement.

- [ ] **Step 1: Write failing tooltip tests**

Add assertions for dynamic progress and target behavior:

```ts
expect(renderTour({ target: availableTarget })).toContain("Étape 1 sur 9");

experience.step = TOUR_STEPS[7];
experience.tour = { ...experience.tour, step: "amount-detail", detailOpened: true };
expect(activeTourTarget(experience.step, experience.tour)).toBe("amount-detail-panel");
```

Using fake timers and an uncontrolled target, assert that no card is rendered while seeking; after the 1.5-second deadline, assert a fallback card with `onboarding-tour-card-missing`, “Réessayer”, and “Passer cette étape”, and assert the absence of `onboarding-tour-card-center`.

Keep the existing test that interactive steps have no veil and no `aria-modal="true"`.

- [ ] **Step 2: Run the tooltip tests and verify the red result**

Run: `npm test -- tests/components/onboarding-tour.test.ts tests/lib/onboarding-position.test.ts`

Expected: FAIL because progress is hard-coded to seven, the query uses `step.target`, and a missing target stays invisible forever.

- [ ] **Step 3: Resolve the live target and reset discovery at each transition**

Compute:

```ts
const targetName = activeTourTarget(step, tour);
```

Use `targetName` for all selectors and effect dependencies. Reset discovery to `seeking` whenever `step.id`, `targetName`, or a retry counter changes. When the detail gesture switches the target, the old focus ring disappears until the panel has been measured.

- [ ] **Step 4: Replace hard-coded progress and final-step checks**

Use:

```ts
const stepNumber = TOUR_STEPS.findIndex(({ id }) => id === step.id) + 1;
const isLast = stepNumber === TOUR_STEPS.length;
```

Render `Étape {stepNumber} sur {TOUR_STEPS.length}` and keep “Compris” only for the final step.

- [ ] **Step 5: Add the missing-target bottom state**

At the retry deadline, set status to `missing`. Render the card at the bottom edge using viewport-safe fixed coordinates; do not call `placeTourCard` with `null`. “Réessayer” increments the retry counter. “Passer cette étape” calls `experience.dispatch({ type: "SKIP" })`, which advances even when a required gesture cannot be performed. The fallback remains non-modal so the user can repair the page.

Add only the minimal CSS needed for the bottom fallback. Reuse existing surface, border, and dark-mode variables; do not introduce a new accent.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- tests/components/onboarding-tour.test.ts tests/lib/onboarding-tour.test.ts tests/lib/onboarding-position.test.ts`

Expected: PASS, including the non-blocking interaction tests from the previous fix.

- [ ] **Step 7: Record the checkpoint**

```bash
git add src/components/onboarding-tour.tsx src/app/globals.css src/lib/onboarding-tour.ts tests/components/onboarding-tour.test.ts tests/lib/onboarding-tour.test.ts tests/lib/onboarding-position.test.ts
git commit -m "fix: anchor every onboarding step"
```

---

### Task 4: Make Vue d’ensemble the primary route and preserve the bank-connection result

**Files:**
- Modify: `src/app/app/page.tsx`
- Modify: `src/app/app/historique/page.tsx`
- Modify: `src/app/api/callback/route.ts`
- Create: `src/components/connexion-reussie.tsx`
- Delete: `src/components/demo-dashboard.tsx`
- Modify: `tests/app/demo-page-routing.test.ts`
- Modify: `tests/app/callback-onboarding.test.ts`
- Test: `tests/app/overview-routing.test.ts`

**Interfaces:**
- Produces: `/app` redirect to `/app/historique`, preserving `connected` and `imported` query values.
- Produces: the no-account connection screen and successful-import notice on Vue d’ensemble.
- Preserves: `/app/historique` as the stable URL.

- [ ] **Step 1: Write failing routing tests**

Mock `next/navigation.redirect` and assert:

```ts
await DashboardRedirect({ searchParams: Promise.resolve({ connected: "1", imported: "42" }) });
expect(redirect).toHaveBeenCalledWith("/app/historique?connected=1&imported=42");
```

Update the callback test to expect `/app/historique?connected=1&imported=…`. Replace the demo-dashboard test with an overview test proving demo mode renders `DemoHistory` without calling `pourMoi`.

- [ ] **Step 2: Run routing tests and verify the red result**

Run: `npm test -- tests/app/overview-routing.test.ts tests/app/demo-page-routing.test.ts tests/app/callback-onboarding.test.ts`

Expected: FAIL because `/app` still renders the dashboard and the callback returns to `/app`.

- [ ] **Step 3: Replace the dashboard page with a preserving redirect**

`src/app/app/page.tsx` should contain only query normalization and `redirect`. Allow only string `connected`/`imported` values, build `URLSearchParams`, and redirect to `/app/historique` with or without a query string. Delete `DemoDashboard`; do not delete shared finance components that other pages or tests may still use.

- [ ] **Step 4: Move the connection result UI to Vue d’ensemble**

Extract the current `ConnexionReussie` markup from the dashboard into `src/components/connexion-reussie.tsx` with:

```ts
export function ConnexionReussie({ imported }: { imported?: string }): ReactNode
```

Extend the history page search params with `connected` and `imported`. In real mode:

- no accounts: render `FirstAccountOnboarding connexionTerminee={connected === "1"}`;
- accounts present: render `ConnexionReussie` above the account tabs when connected is `1`.

Demo mode must return `DemoHistory` before any real account query.

- [ ] **Step 5: Point the banking callback directly to Vue d’ensemble**

Change only the successful redirect base to `/app/historique?connected=1`. Preserve `imported`, error redirects, first sync, and revalidation behavior.

- [ ] **Step 6: Run routing and onboarding shell tests**

Run: `npm test -- tests/app/overview-routing.test.ts tests/app/demo-page-routing.test.ts tests/app/callback-onboarding.test.ts tests/app/onboarding-shell.test.ts`

Expected: PASS. No test should import or render `DemoDashboard`.

- [ ] **Step 7: Record the checkpoint**

```bash
git add src/app/app/page.tsx src/app/app/historique/page.tsx src/app/api/callback/route.ts src/components/connexion-reussie.tsx src/components/demo-dashboard.tsx tests/app/overview-routing.test.ts tests/app/demo-page-routing.test.ts tests/app/callback-onboarding.test.ts
git commit -m "feat: make overview the primary screen"
```

---

### Task 5: Rebuild the top bar with two tabs, a permanent Guide button, and a safe mobile layout

**Files:**
- Modify: `src/components/app-topbar.tsx`
- Modify: `src/app/app/onboarding-actions.ts`
- Modify: `src/app/app/layout.tsx`
- Test: `tests/components/app-topbar.test.tsx`
- Modify: `tests/app/onboarding-actions.test.ts`

**Interfaces:**
- Consumes: `DemoExperience.restart()`.
- Produces: `ResponsiveHeaderActions` using one `<details>` element, so actions are mounted only once.
- Produces: replay and finish destinations of `/app/historique`.

- [ ] **Step 1: Write failing navigation and responsive-header tests**

Render `AppTopbar` with mocked pathname/router/experience and assert:

```ts
expect(html.indexOf("Vue d’ensemble")).toBeLessThan(html.indexOf("Transactions"));
expect(html).not.toContain("Tableau de bord");
expect(html).toContain('href="/app/historique"');
expect(html).toContain('data-header-row="actions"');
expect(html).toContain('data-header-row="navigation"');
expect(html).toContain("Guide");
expect(html).toContain("Actions");
```

Add click tests for both modes: demo mode calls `experience.restart`; real mode calls `startOnboardingReplay`, then pushes `/app/historique` and refreshes. Update action tests so `startOnboardingReplay` and `finishOnboarding` return `{ destination: "/app/historique" }`.

- [ ] **Step 2: Run the header/action tests and verify the red result**

Run: `npm test -- tests/components/app-topbar.test.tsx tests/app/onboarding-actions.test.ts`

Expected: FAIL because the dashboard tab remains, Guide is hidden in the account menu, and destinations still use `/app`.

- [ ] **Step 3: Reduce the navigation and change the brand link**

Use exactly:

```ts
const NAV = [
  { href: "/app/historique", label: "Vue d’ensemble", court: "Vue", icon: History },
  { href: "/app/transactions", label: "Transactions", court: "Transactions", icon: ArrowLeftRight },
] as const;
```

The Plia brand link uses `/app/historique`. Remove the old “Revoir le guide” dropdown item because the permanent button replaces it.

- [ ] **Step 4: Add the permanent Guide behavior**

Render one visible button with a help/book icon and the text “Guide”. Its click handler is:

```ts
if (demo && experience) {
  experience.restart();
  return;
}
const result = await startOnboardingReplay();
router.push(result.destination);
router.refresh();
```

Keep it outside the secondary-actions disclosure. Update `startOnboardingReplay` and `finishOnboarding` return types and values to `/app/historique`. Update `DemoExperienceProvider.finish` and replay pause fallbacks to the same destination.

- [ ] **Step 5: Implement the mobile two-row header without duplicating action components**

Use a grid below `sm` and the existing single flex row from `sm` upward. Apply these exact structural classes to the existing header, action group, and navigation elements:

```tsx
className="bg-barre border-barre-filet grid min-h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center border-b px-3 sm:flex sm:h-14 sm:gap-2 sm:px-4"
data-header-row="actions"
className="col-start-3 row-start-1 flex items-center justify-end gap-1 sm:ml-auto"
data-header-row="navigation"
className="col-span-3 row-start-2 grid grid-cols-2 gap-1 pb-2 sm:flex sm:min-w-0 sm:items-center sm:gap-0.5 sm:pb-0"
```

Adapt the exact DOM order so the brand remains first and the account remains last. Put `children` and `localTools` once inside a native `<details>` wrapper:

```tsx
<details className="group relative sm:contents">
  <summary className="sm:hidden" aria-label="Ouvrir les actions">Actions</summary>
  <div className="bg-popover border-filet absolute top-full right-0 z-50 mt-2 hidden min-w-48 flex-col rounded-lg border p-2 shadow-lg group-open:flex sm:static sm:mt-0 sm:flex sm:min-w-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">{localTools}{children}</div>
</details>
```

On mobile the closed disclosure removes Sync, notifications, and calculator from the crowded line. On desktop `sm:contents` and `sm:flex` keep them directly visible. Ensure focus styles, keyboard toggle behavior, and an accessible name remain intact.

- [ ] **Step 6: Run header and shell tests**

Run: `npm test -- tests/components/app-topbar.test.tsx tests/app/onboarding-actions.test.ts tests/app/onboarding-shell.test.ts`

Expected: PASS with two visible navigation labels, Guide outside Actions, and no dashboard label.

- [ ] **Step 7: Record the checkpoint**

```bash
git add src/components/app-topbar.tsx src/app/app/onboarding-actions.ts src/app/app/layout.tsx src/components/demo-experience-provider.tsx tests/components/app-topbar.test.tsx tests/app/onboarding-actions.test.ts tests/app/onboarding-shell.test.ts
git commit -m "feat: add permanent responsive guide access"
```

---

### Task 6: Complete integration verification

**Files:**
- Verify: all source and test files changed in Tasks 1–5.
- Do not modify unrelated pre-existing lint failures.

**Interfaces:**
- Verifies the complete user-visible journey from first demo arrival to “Compris”, replay, and mobile layout.

- [ ] **Step 1: Run all onboarding and routing tests together**

Run:

```bash
npm test -- tests/lib/onboarding-tour.test.ts tests/components/onboarding-tour.test.ts tests/components/demo-pages.test.ts tests/components/history-detail-onboarding.test.tsx tests/components/app-topbar.test.tsx tests/app/overview-routing.test.ts tests/app/demo-page-routing.test.ts tests/app/onboarding-actions.test.ts tests/app/onboarding-shell.test.ts tests/app/callback-onboarding.test.ts
```

Expected: every listed file passes. Fix only regressions attributable to this feature, with a failing test before each correction.

- [ ] **Step 2: Run the full suite**

Run: `npm test`

Expected: all test files and tests pass with exit code 0. Record the exact totals for the handoff.

- [ ] **Step 3: Run formatting and production build checks**

Run:

```bash
git diff --check
npm run build
```

Expected: no whitespace errors; Next.js compilation, TypeScript, page generation, and build all finish with exit code 0.

- [ ] **Step 4: Verify the real app on desktop**

Start the existing HTTPS development server and use an authenticated local account. Verify:

1. `/app` lands on Vue d’ensemble;
2. only Vue d’ensemble and Transactions appear, in that order;
3. Guide starts at the demo account and stays on Vue d’ensemble for all nine steps;
4. Transport accepts 150 € while the tooltip is visible;
5. the detail cell opens the right panel and the tooltip moves beside it;
6. “Compris” returns to real data or the voluntary bank-connection screen;
7. Guide restarts from step one afterward.

- [ ] **Step 5: Verify mobile and dark mode**

At approximately 390 × 844 pixels, verify the first header row contains the brand, Guide, Actions, and account without overlap; the second row contains the two equal-width tabs. Open Actions and confirm Sync, notifications, and calculator are reachable. Repeat the nine-step path in light and dark mode, checking that the bottom tooltip never hides its target or an input.

- [ ] **Step 6: Review the final diff against the spec**

Run: `git diff --stat && git status --short`

Check every section of `docs/superpowers/specs/2026-08-28-overview-onboarding-design.md` against the resulting UI. Confirm no real-data call was introduced into demo components and no unrelated dirty file was overwritten.

- [ ] **Step 7: Record the final checkpoint**

```bash
git add src/lib/onboarding-tour.ts src/components/demo-experience-provider.tsx src/components/demo-history.tsx src/components/history-with-detail.tsx src/components/history-grid.tsx src/components/history-detail-sidebar.tsx src/components/onboarding-tour.tsx src/app/globals.css src/app/app/page.tsx src/app/app/historique/page.tsx src/app/api/callback/route.ts src/components/connexion-reussie.tsx src/components/demo-dashboard.tsx src/components/app-topbar.tsx src/app/app/onboarding-actions.ts src/app/app/layout.tsx tests/lib/onboarding-tour.test.ts tests/lib/onboarding-position.test.ts tests/components/demo-pages.test.ts tests/components/history-detail-onboarding.test.tsx tests/components/onboarding-tour.test.ts tests/components/app-topbar.test.tsx tests/app/overview-routing.test.ts tests/app/demo-page-routing.test.ts tests/app/callback-onboarding.test.ts tests/app/onboarding-actions.test.ts tests/app/onboarding-shell.test.ts
git commit -m "feat: launch overview onboarding"
```
