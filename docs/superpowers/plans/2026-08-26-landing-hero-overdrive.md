# Landing Hero Overdrive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer la Hero publique en « horizon vivant » avec la phrase validée, une projection temporelle discrète et une grande démonstration vidéo animée au défilement.

**Architecture:** Extraire la Hero dans un composant client dédié afin d'isoler Motion du reste de la landing, qui reste un composant serveur. Le mouvement repose uniquement sur `transform` et `opacity`, avec des valeurs statiques sous `prefers-reduced-motion`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Motion, Magic UI `HeroVideoDialog`.

**Spec:** `docs/superpowers/specs/2026-08-26-landing-hero-overdrive-design.md`

## Global Constraints

- Phrase principale exacte : « Pilotez vos finances sans perdre de vue les mois à venir. »
- Hero en une colonne centrée, sans MacBook.
- Aucun prix, client, statistique ou résultat inventé.
- Sarcelle réservée aux actions ; données illustratives en vert, sable ou encre selon leur sens.
- Aucun canvas, WebGL, nouvelle police ou nouvelle dépendance.
- La Hero reste complète et lisible lorsque les animations sont réduites.

---

### Task 1: Créer la Hero « horizon vivant »

**Files:**
- Create: `src/components/landing-hero.tsx`
- Modify: `src/components/landing-page.tsx`
- Test: `tests/app/landing.test.ts`

**Interfaces:**
- Consumes: `Button`, `DotPattern`, `HeroVideoDialog`, `motion`, `useScroll`, `useTransform`, `useReducedMotion`.
- Produces: `LandingHero(): React.ReactElement` utilisé une seule fois par `LandingContent`.

- [ ] **Step 1: Lancer la suite existante avant modification**

Run: `npm test`
Expected: 74 fichiers et 848 tests passent, ou noter précisément tout échec préexistant.

- [ ] **Step 2: Mettre à jour le test de contenu de la landing**

Ajouter une assertion sur le texte exact :

```ts
expect(html).toContain("Pilotez vos finances sans perdre de vue les mois à venir.");
```

- [ ] **Step 3: Lancer le test ciblé pour voir l'échec**

Run: `npx vitest run tests/app/landing.test.ts`
Expected: FAIL car la nouvelle phrase n'est pas encore rendue.

- [ ] **Step 4: Créer le composant client**

Créer `LandingHero` avec une section `ref`, un titre stable, le texte secondaire factuel, les deux actions existantes, un rail de trois mois `aria-hidden` et un conteneur Motion autour de `HeroVideoDialog`.

Les transformations attendues sont :

```ts
const videoY = useTransform(progress, [0, 0.75], reduced ? [0, 0] : [0, -18]);
const videoRotateX = useTransform(progress, [0, 0.75], reduced ? [0, 0] : [3, 0]);
const horizonY = useTransform(progress, [0, 1], reduced ? [0, 0] : [0, 56]);
```

Le texte secondaire doit rester concret :

```text
Suivez ce qui entre, maîtrisez ce qui sort, répartissez votre budget par enveloppes puis projetez votre solde sur plusieurs mois.
```

- [ ] **Step 5: Remplacer l'ancienne Hero**

Importer `LandingHero` dans `landing-page.tsx`, supprimer l'ancien bloc Hero et rendre `<LandingHero />` sous l'en-tête sans modifier les sections suivantes.

- [ ] **Step 6: Vérifier le test ciblé**

Run: `npx vitest run tests/app/landing.test.ts`
Expected: PASS.

### Task 2: Aligner la documentation de surface

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `.impeccable/surfaces/src-app-page-tsx.md`

**Interfaces:**
- Consumes: la direction validée et le composant `LandingHero`.
- Produces: contrat HTML et brief de surface cohérents avec la Hero livrée.

- [ ] **Step 1: Mettre à jour le contrat de landing**

Remplacer la description du premier écran par la phrase validée, le rail temporel et la vidéo qui se redresse légèrement au défilement.

- [ ] **Step 2: Mettre à jour le brief Impeccable**

Documenter « L'horizon vivant », la nouvelle phrase et le comportement réduit sur téléphone.

- [ ] **Step 3: Lancer le détecteur de design**

Run: `node /Users/danieldupont/.agents/skills/impeccable/scripts/detect.mjs src/components/landing-hero.tsx src/components/landing-page.tsx`
Expected: aucune anomalie déterministe non justifiée.

### Task 3: Vérifier la livraison

**Files:**
- Verify: `src/components/landing-hero.tsx`
- Verify: `src/components/landing-page.tsx`
- Verify: `src/components/ui/hero-video-dialog.tsx`

**Interfaces:**
- Consumes: la Hero complète.
- Produces: preuve de compilation, de tests et de rendu responsive.

- [ ] **Step 1: Vérifier le code**

Run: `npx eslint src/components/landing-hero.tsx src/components/landing-page.tsx src/components/ui/hero-video-dialog.tsx src/app/layout.tsx && git diff --check`
Expected: sortie vide, code 0.

- [ ] **Step 2: Lancer tous les tests**

Run: `npm test`
Expected: tous les tests passent.

- [ ] **Step 3: Construire la production**

Run: `npm run build`
Expected: compilation Next.js et TypeScript réussie.

- [ ] **Step 4: Inspecter en navigateur**

Contrôler ensemble une vue desktop et une vue mobile : absence de débordement, titre lisible, rail secondaire, vidéo dominante, ouverture clavier et réduction des animations.

- [ ] **Step 5: Corriger une seule fois les défauts groupés puis confirmer**

Appliquer les corrections issues de la première inspection en un lot, puis refaire au maximum une seconde capture desktop/mobile.
