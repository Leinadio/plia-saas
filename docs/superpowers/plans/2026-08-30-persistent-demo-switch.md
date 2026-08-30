# Persistent Demo Switch Implementation Plan

> **Execution:** direct dans cette session, sans Superpowers d’implémentation, conformément au choix de l’utilisateur. Chaque tâche suit rouge → vert.

**Goal:** Garder une démonstration activable à tout moment, sauvegardée par utilisateur en base, avec un nouvel utilisateur placé à l’étape 1.

**Architecture:** `onboarding_status` stocke le choix réel/démo et le document versionné de la visite. Le serveur choisit les données avant chaque rendu ; le fournisseur client applique les gestes immédiatement puis sauvegarde le document complet. Le switch ne réinitialise rien, tandis que « Guide » crée volontairement une visite neuve.

**Tech Stack:** Next.js 16, React 19, TypeScript, Postgres/Supabase, PGlite, Vitest, shadcn/Radix Switch.

**Spec:** `docs/superpowers/specs/2026-08-30-persistent-demo-switch-design.md`

## Global Constraints

- Les données fictives ne doivent jamais entrer dans les tables financières.
- Un nouvel utilisateur commence en démo à l’étape 1.
- Un utilisateur migré reste en réel jusqu’à l’activation volontaire du switch.
- Le switch conserve la visite ; « Guide » réinitialise la visite.
- « Compris » ferme les infobulles sans quitter la démo.
- Tous les changements métier commencent par un test rouge.

---

### Task 1: Modèle durable de la démonstration

**Files:**
- Modify: `src/lib/onboarding-tour.ts`
- Modify: `src/db/schema.pg.sql`
- Modify: `src/db/repositories/onboarding-status.ts`
- Modify: `tests/lib/onboarding-tour.test.ts`
- Modify: `tests/db/pg-schema.test.ts`
- Modify: `tests/db/onboarding-status.test.ts`
- Modify: `tests/db/rls.test.ts`

**Interfaces:**
- Produces: `TourState.finished: boolean`
- Produces: `DemoStatus = { demoActive: boolean; completedAt: string | null; visit: TourVisit }`
- Produces: `readDemoStatus(db, userId): Promise<DemoStatus>`
- Produces: `saveDemoVisit(db, userId, visit): Promise<void>`
- Produces: `setDemoActive(db, userId, active): Promise<void>`
- Produces: `finishDemoGuide(db, userId, visit, completedAt): Promise<void>`

- [ ] Add failing serialization tests for a versioned visit containing `finished`, including invalid JSON fallback.
- [ ] Run `npm test -- tests/lib/onboarding-tour.test.ts` and observe failure.
- [ ] Add failing repository/schema/RLS tests for a fresh user, an existing user, persistence, isolation and nullable `completed_at`.
- [ ] Run `npm test -- tests/db/onboarding-status.test.ts tests/db/pg-schema.test.ts tests/db/rls.test.ts` and observe failure.
- [ ] Add `finished` to the reducer state. A final completion produces `{ ...state, finished: true, paused: false }`; resume or restart uses a fresh unfinished visit.
- [ ] Extend `onboarding_status` with `demo_active BOOLEAN`, `demo_visit JSONB`, nullable `completed_at`, and idempotent ALTER/UPDATE statements. Existing rows become real + finished; absent rows resolve to demo + fresh.
- [ ] Implement the four repository functions with parameterized SQL and validated `restoreTourVisit(JSON.stringify(row.demo_visit))`.
- [ ] Run the focused tests and confirm green.

### Task 2: Lecture serveur et actions persistantes

**Files:**
- Modify: `src/lib/onboarding-mode.ts`
- Modify: `src/lib/current-onboarding.ts`
- Modify: `src/app/app/onboarding-actions.ts`
- Modify: `tests/lib/onboarding-mode.test.ts`
- Modify: `tests/app/onboarding-actions.test.ts`

**Interfaces:**
- Produces: `currentDemoStatus(): Promise<DemoStatus & { mode: OnboardingMode }>`
- Produces: `toggleDemo(active: boolean): Promise<{ destination: "/app/historique" }>`
- Produces: `persistDemoVisit(visit: TourVisit): Promise<void>`
- Produces: `restartDemoGuide(): Promise<{ destination: "/app/historique"; visit: TourVisit }>`
- Produces: `finishOnboarding(visit: TourVisit): Promise<{ destination: "/app/historique" }>`

- [ ] Replace cookie-based expectations with failing tests driven by `demo_active` and persisted visits.
- [ ] Run the two focused test files and observe failure.
- [ ] Resolve mode from database state only: active gives a demo mode, inactive gives real; completion controls the guide state, not the selected data source.
- [ ] Implement server actions through `pourMoi`, revalidate the app layout after toggle/restart/finish, and never import a financial repository.
- [ ] Keep compatibility exports only when still consumed; remove the replay cookie flow and its dead code.
- [ ] Run the focused tests and confirm green.

### Task 3: Fournisseur client sauvegardé et fin sans sortie

**Files:**
- Modify: `src/components/demo-experience-provider.tsx`
- Modify: `src/components/onboarding-tour.tsx`
- Modify: `src/components/demo-status-band.tsx`
- Modify: `tests/components/demo-experience-provider.test.tsx`
- Modify: `tests/components/onboarding-tour.test.ts`
- Modify: `tests/components/demo-status-band.test.ts`

**Interfaces:**
- Consumes: `initialVisit: TourVisit`, `persistDemoVisit`, `finishOnboarding`
- Produces: `restart(): Promise<void>` and an experience whose edits come from the database snapshot.

- [ ] Add failing tests proving initial persisted edits render, every gesture saves the full visit, completion hides the tour but stays in demo, and restart clears only demo state.
- [ ] Run the focused component tests and observe failure.
- [ ] Replace `sessionStorage` as source of truth with `initialVisit`; keep optimistic client state and serialize saves so a later document cannot be overwritten by an earlier request.
- [ ] Make the last « Compris » event set `finished`, persist it, call the completion action, and remain on the demo page.
- [ ] Hide the tour when `finished`; allow the status band to resume only a paused unfinished tour.
- [ ] Run the focused tests and confirm green.

### Task 4: Switch shadcn permanent et responsive

**Files:**
- Create: `src/components/ui/switch.tsx`
- Modify: `src/components/app-topbar.tsx`
- Modify: `src/app/app/layout.tsx`
- Modify: `tests/components/app-topbar.test.tsx`
- Modify: `tests/app/onboarding-shell.test.ts`

**Interfaces:**
- Consumes: `toggleDemo`, `restartDemoGuide`, `DemoExperience.mode`
- Produces: switch accessible « Activer la démonstration » toujours visible.

- [ ] Add failing tests for checked/unchecked rendering, toggle persistence, Guide reset, mobile label and real-only tools.
- [ ] Run the focused tests and observe failure.
- [ ] Add the shadcn-style Radix Switch primitive using existing color tokens and focus treatment.
- [ ] Place it beside Guide in the first mobile header row. Disable it during the server transition and retain its accessible label.
- [ ] Pass the database visit into the provider from the layout and show notifications/sync only in real mode.
- [ ] Run the focused tests and confirm green.

### Task 5: Page isolation and final verification

**Files:**
- Modify: `tests/app/demo-page-routing.test.ts`
- Modify: `tests/app/overview-routing.test.ts`
- Modify only if a regression requires it: `src/app/app/historique/page.tsx`, `src/app/app/transactions/page.tsx`

- [ ] Add failing or strengthening tests proving active demo pages return before any financial read and switch-off restores real routing.
- [ ] Run focused routing tests and observe the intended red state if code changes are required.
- [ ] Apply only the minimal routing adjustment required by the new state reader.
- [ ] Run all focused onboarding, repository, RLS, routing and topbar tests.
- [ ] Run `npm test`, `git diff --check`, and `npm run build`.
- [ ] Start the real server and verify: new user step 1, switch off/on restores changes, Compris stays in demo, Guide resets demo, mobile header does not overlap.
