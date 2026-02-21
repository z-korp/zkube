# Phase 1 Completion — PixiJS V3 Client

## TL;DR

> **Quick Summary**: Build the tween/choreography engine, fix modal lifecycle for exit animations, adjust V3 layout dimensions, implement full animation choreography for all three end-state modals, enhance VictoryModal confetti, and redesign the Home Hub with hero card + tile grid.
> 
> **Deliverables**:
> - `client/src/pixi/design/tween.ts` — Choreography engine (timeline sequencer, ref-based, reduced-motion-aware)
> - Modified `Modal.tsx` — Exit animation support (delayed unmount)
> - Modified `PlayScreen.tsx` — V3 layout (44px HUD, 80px action bar, 8px progress bar)
> - Modified `LevelCompleteModal.tsx` — Full enter choreography (stars, count-up, button pulse)
> - Modified `GameOverModal.tsx` — Full enter choreography (title drift, stat stagger, button fade)
> - Modified `VictoryModal.tsx` — Enhanced confetti (150 particles, alpha+scale fade, gold text cycle, stat count-up)
> - New `client/src/pixi/components/core/HeroCard.tsx` — Start/Continue Run card
> - Modified `MainScreen.tsx` — Home Hub with hero card + 5-tile grid
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (tween engine) + Task 2 (Modal exit) → Tasks 5, 6, 7 (modal choreography)

---

## Context

### Original Request
Complete Phase 1 of the PixiJS 8 puzzle game client. The V3 token migration is done across all 27 files. What remains: tween infrastructure, V3 layout adjustments, modal animation choreography (LevelComplete, GameOver, Victory), and Home Hub redesign (hero card + tile grid).

### Interview Summary
**Key Decisions**:
- User provided exact animation timings for all three modal choreographies (ms-level precision)
- No external tween libraries — pure PixiJS useTick + custom utilities
- New files go in `client/src/pixi/design/` alongside tokens.ts
- Must respect `prefers-reduced-motion` (skip to final state)
- Build verification: `tsc && vite build → 0 errors`

**Research Findings**:
- **Easing functions ALREADY EXIST** in `tokens.ts` lines 141-171 (ease.outCubic, ease.inCubic, ease.outBack, ease.outBounce, ease.inOutQuad, ease.linear)
- **useAnimatedValue hook EXISTS** in `pixi/hooks/useAnimatedValue.ts` — but uses `Math.round` (integer-only), unsuitable for scale/alpha animations
- **Layout hook** `useFullscreenLayout()` accepts config overrides — PlayScreen can pass `{ baseStatsBarHeight: 44, baseActionBarHeight: 80 }` without modifying the locked hook file
- **Modal.tsx instantly unmounts** on `isOpen=false` (line 155: `if (!isOpen) return null`) — exit animations are IMPOSSIBLE with current architecture
- **Modal.tsx has its own enter animation** (6-frame scale+fade) that conflicts with per-modal choreography
- **HubTile component exists** but is NOT used in MainScreen
- **Card component exists** but is NOT used

### Metis Review
**Identified Gaps** (addressed):

| Gap | Resolution |
|-----|-----------|
| Modal.tsx instant unmount blocks exit animations | **Task 2**: Add delayed-unmount "closing" state to Modal.tsx |
| Modal.tsx enter animation conflicts with choreography | **Task 2**: Add `skipEnterAnimation` prop to Modal.tsx |
| `useAnimatedValue` is integer-only (Math.round) | **Task 1**: Choreography engine does its own float-precision lerp |
| Constraints/stars don't fit in 8px progress bar | **Task 3**: Constraints move into StatsBar (now 44px tall); star thresholds become notch markers on 8px bar |
| "Grid darken sweep" requires cross-component coordination | **Task 6**: Descoped to backdrop gradient wipe within modal scope |
| "Cube fly arc" requires cross-component rendering | **Tasks 5,6**: Descoped to in-place cube icon scale-up with gold glow (easeOutBack) |
| bezierPoint utility becomes dead code without fly arcs | **Cut entirely** — not needed |
| design/ directory pattern breaks with hooks | **Accepted deliberately** — design/ evolves from "tokens" to "design system" |
| HeroCard empty state undefined | **Task 4**: "Start New Run" card when no active games |
| useAnimatedValue doesn't animate on first mount | **Documented**: Use delayed-trigger pattern or choreography engine |
| Gold/white text cycling may re-render textures | **Task 7**: Implemented via ref-based style.fill mutation per tick, not React state |

---

## Work Objectives

### Core Objective
Complete all Phase 1 visual features: animation infrastructure, V3 layout compliance, modal choreography, and Home Hub redesign — making the client feel polished and responsive.

### Concrete Deliverables
- 1 new file: `client/src/pixi/design/tween.ts`
- 1 new file: `client/src/pixi/components/core/HeroCard.tsx`
- 5 modified files: Modal.tsx, PlayScreen.tsx, LevelCompleteModal.tsx, GameOverModal.tsx, VictoryModal.tsx, MainScreen.tsx

### Definition of Done
- [ ] `cd client && npx tsc --noEmit` → 0 errors
- [ ] `cd client && npx vite build` → 0 warnings, 0 errors
- [ ] All modal choreographies play on open
- [ ] Modal exit animations play before unmount
- [ ] Home Hub shows hero card + 5-tile grid
- [ ] All animations skip to final state when `prefersReducedMotion=true`

### Must Have
- Choreography engine with timeline-based sequencing
- Modal delayed-unmount for exit animations
- Float-precision interpolation (not integer-rounded)
- 44px StatsBar, 80px action bar, 8px score progress bar
- Star pop-in with easeOutBack overshoot
- Score/cube count-up animations in modals
- 150 confetti particles with alpha fade + scale shrink
- HeroCard showing active game or "Start New Run"
- 5-tile hub grid using existing HubTile component

### Must NOT Have (Guardrails)
- ❌ No external tween libraries (GSAP, anime.js, Framer Motion)
- ❌ No `as any` or `@ts-ignore` — strict TypeScript throughout
- ❌ No `useState` during active choreography playback — all ref-based
- ❌ No modifications to locked directories: `dojo/`, `hooks/`, `stores/`, `contexts/`, `config/`, `pixi/assets/`, `pixi/audio/`, `pixi/utils/`, `pixi/themes/`, `pixi/hooks/`
- ❌ No modifications to `BlockSprite.tsx` or `GameGrid.tsx`
- ❌ No re-definition of easing functions — import from `tokens.ts`
- ❌ No cross-component flying animations (cube fly arcs) — keep animations self-contained within modal scope
- ❌ No particle changes in `ParticleSystem.tsx` — confetti is managed inline in VictoryModal
- ❌ No new custom hooks directory — hooks live in tween.ts (design/) or inline in components
- ❌ No complex Bézier path utilities — descoped; use simple easeOutBack scale-up instead

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Vitest in client/)
- **Automated tests**: NO — visual/animation code is verified via build + Playwright screenshots
- **Framework**: `tsc --noEmit` + `vite build` for type/bundle verification

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| TypeScript compilation | Bash | `cd client && npx tsc --noEmit` → exit code 0 |
| Bundle build | Bash | `cd client && npx vite build` → exit code 0 |
| Visual UI | Playwright | Navigate to dev server, take screenshots, assert elements exist |
| Animation behavior | Playwright | Wait for animation timing, screenshot at key frames |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — No Dependencies):
├── Task 1: Tween/choreography engine (design/tween.ts) — NEW FILE
├── Task 2: Modal.tsx exit animation support — MODIFY
├── Task 3: V3 layout adjustments (PlayScreen) — MODIFY
└── Task 4: Home Hub redesign (HeroCard + MainScreen) — NEW FILE + MODIFY

Wave 2 (After Tasks 1 + 2):
├── Task 5: LevelCompleteModal choreography [depends: 1, 2]
├── Task 6: GameOverModal choreography [depends: 1, 2]
└── Task 7: VictoryModal enhancements [depends: 1]

Wave 3 (After All):
└── Task 8: Build verification + integration [depends: all]

Critical Path: Task 1 → Task 5 (longest chain)
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 5, 6, 7 | 2, 3, 4 |
| 2 | None | 5, 6 | 1, 3, 4 |
| 3 | None | 8 | 1, 2, 4 |
| 4 | None | 8 | 1, 2, 3 |
| 5 | 1, 2 | 8 | 6, 7 |
| 6 | 1, 2 | 8 | 5, 7 |
| 7 | 1 | 8 | 5, 6 |
| 8 | All | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3, 4 | 4 parallel `category="visual-engineering"` with `load_skills=["pixi-js"]` |
| 2 | 5, 6, 7 | 3 parallel `category="visual-engineering"` with `load_skills=["pixi-js"]` |
| 3 | 8 | 1 `category="quick"` with `load_skills=["pixi-js"]` |

---

## TODOs

### ─── WAVE 1 — Foundation (Start Immediately, All Parallel) ───

- [ ] 1. Create Tween/Choreography Engine

  **What to do**:
  Create `client/src/pixi/design/tween.ts` with:

  **A) `useChoreography` hook** — Timeline-based animation sequencer
  ```typescript
  interface ChoreographyStep {
    id: string;           // e.g. "star1", "title", "backdrop"
    property: string;     // e.g. "scale", "alpha", "x", "y"
    from: number;
    to: number;
    delay: number;        // ms from sequence start
    duration: number;     // ms
    ease: (t: number) => number; // from tokens.ts
  }

  interface ChoreographyResult {
    values: Record<string, Record<string, number>>; // e.g. values.star1.scale
    isComplete: boolean;
    phase: 'idle' | 'entering' | 'exiting';
  }

  function useChoreography(
    enterSteps: ChoreographyStep[],
    exitSteps: ChoreographyStep[],
    options: {
      isOpen: boolean;
      onExitComplete?: () => void;  // called when exit finishes
    }
  ): ChoreographyResult
  ```

  **Implementation requirements**:
  - 100% ref-based — `useRef` for all animation state, `useTick` for frame updates
  - ZERO `useState` calls during playback (no re-renders)
  - Returns a stable `values` object that components read in their useTick/draw callbacks
  - `values` object is mutated in-place each frame (ref-like pattern)
  - Import easings from `@/pixi/design/tokens` (`ease.outCubic`, etc.) — NEVER re-define
  - Import `usePerformanceSettings` from `../../themes/ThemeContext` for `prefersReducedMotion`
  - When `prefersReducedMotion=true`: skip to final "to" values immediately, call `onExitComplete` synchronously
  - When `isOpen` transitions false→true: run enter steps
  - When `isOpen` transitions true→false: run exit steps, then call `onExitComplete`
  - Float-precision lerp: `from + (to - from) * easedProgress` — NO Math.round
  - Each step tracked independently by `id+property` key
  - Timing source: `ticker.deltaMS` from useTick (NOT performance.now())
  
  **B) `getChoreographyValue` helper** — Read current value for a specific property
  ```typescript
  function getChoreographyValue(
    result: ChoreographyResult,
    id: string,
    property: string,
    defaultValue: number
  ): number
  ```

  **C) Type exports** — ChoreographyStep, ChoreographyResult exported for consumers

  **Must NOT do**:
  - Do NOT re-define easing functions — import from tokens.ts
  - Do NOT create a `useCountUp` wrapper — consumers use `useAnimatedValue` from hooks/ for simple count-ups, or choreography steps for sequenced count-ups
  - Do NOT add bezierPoint or path interpolation — descoped
  - Do NOT import from `pixi/hooks/useAnimatedValue.ts` — choreography is independent
  - Do NOT use `useState` anywhere in the tick callback

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Pure animation infrastructure, requires understanding of PixiJS ticker and React ref patterns
  - **Skills**: [`pixi-js`]
    - `pixi-js`: PixiJS 8 ticker API, @pixi/react useTick patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `client/src/pixi/hooks/useAnimatedValue.ts:52-101` — Animation ref pattern (animRef with active/elapsed/startValue/endValue). Follow this pattern for per-step tracking, but WITHOUT Math.round and WITHOUT useState during playback.
  - `client/src/pixi/hooks/useAnimatedValue.ts:132-153` — usePulseRef tick callback pattern (ref-based, zero re-renders). This is the GOLD STANDARD for how the choreography tick should work.
  - `client/src/pixi/components/effects/ParticleSystem.tsx:46-82` — Imperative tick callback pattern with in-place mutation and direct Graphics drawing. Shows how to handle arrays of animated entities efficiently.

  **API/Type References**:
  - `client/src/pixi/design/tokens.ts:141-171` — `ease` object with all easing functions. Import `ease` from here.
  - `client/src/pixi/design/tokens.ts:176-189` — `duration` object with named duration constants. Reference but don't import (modals have their own timing specs).

  **Infrastructure References**:
  - `client/src/pixi/themes/ThemeContext.tsx` — `usePerformanceSettings()` hook returns `{ prefersReducedMotion }`. Import this for accessibility.
  - `@pixi/react` — `useTick` for frame-based animation loop

  **Acceptance Criteria**:

  - [ ] File exists: `client/src/pixi/design/tween.ts`
  - [ ] Exports: `useChoreography`, `getChoreographyValue`, `ChoreographyStep`, `ChoreographyResult`
  - [ ] Imports `ease` from `@/pixi/design/tokens` (NOT re-defined)
  - [ ] Imports `usePerformanceSettings` from `../../themes/ThemeContext`
  - [ ] Zero `useState` calls in the file (search: no matches for `useState`)
  - [ ] All animation state in `useRef`
  - [ ] `cd client && npx tsc --noEmit` → 0 errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Preconditions: File created at correct path
    Steps:
      1. Run: cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
      3. Assert: No errors mentioning tween.ts
    Expected Result: Clean compilation
    Evidence: Terminal output captured

  Scenario: No useState in tween.ts
    Tool: Bash (grep)
    Steps:
      1. grep -c "useState" client/src/pixi/design/tween.ts
      2. Assert: Output is "0"
    Expected Result: Zero useState occurrences
    Evidence: grep output

  Scenario: Imports ease from tokens (not re-defined)
    Tool: Bash (grep)
    Steps:
      1. grep "from.*tokens" client/src/pixi/design/tween.ts
      2. Assert: Contains import of ease from tokens
      3. grep -c "Math.pow\|=> t \*" client/src/pixi/design/tween.ts
      4. Assert: No inline easing function definitions
    Expected Result: Easings imported, not duplicated
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(client): add choreography engine for modal animations`
  - Files: `client/src/pixi/design/tween.ts`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 2. Modal.tsx — Exit Animation + Choreography Support

  **What to do**:
  Modify `client/src/pixi/components/ui/Modal.tsx` to support:

  **A) Delayed unmount for exit animations**
  - Add `exitDuration?: number` prop (default: 0 = instant unmount as today)
  - When `isOpen` transitions true→false AND `exitDuration > 0`:
    - Enter "closing" internal state instead of returning null
    - Track exit progress (0→1) over `exitDuration` ms using `useTick`
    - During closing: apply reverse of enter animation (scale 1→0.94, alpha 1→0.6, backdrop alpha 0.7→0)
    - When exit progress reaches 1: transition to "closed" state → return null
  - Add `onExitComplete?: () => void` prop — called when exit animation finishes
  - When `exitDuration === 0` (default): behave exactly as today (instant unmount)

  **B) Skip enter animation for choreographed modals**
  - Add `skipEnterAnimation?: boolean` prop (default: false)
  - When true: set `enterProgress` to 1 immediately on mount, skip the 6-frame ramp
  - Choreographed modals will set this to true and manage their own enter sequence
  - When true: backdrop alpha is controlled by the modal's own choreography, NOT Modal.tsx's formula

  **C) Choreography-controlled backdrop alpha**
  - Add `backdropAlpha?: number` prop (default: undefined)
  - When provided: use this value instead of the calculated `0.7 * (0.6 + enterProgress * 0.4)` formula
  - This allows choreographed modals to animate backdrop independently

  **Implementation details**:
  - Internal state: `'closed' | 'entering' | 'open' | 'exiting'` (currently just enterProgress 0→1)
  - The existing `enterProgress` logic stays for non-choreographed modals (backward compatible)
  - The `if (!isOpen) return null` check at line 155 becomes: `if (!isOpen && internalState === 'closed') return null`
  - Exit tick callback mirrors enter: progress 0→1 over exitDuration
  - All existing prop defaults maintain backward compatibility — ZERO breaking changes

  **Must NOT do**:
  - Do NOT change the existing enter animation behavior for modals that DON'T pass skipEnterAnimation
  - Do NOT change the existing instant-unmount behavior for modals that DON'T pass exitDuration
  - Do NOT import from tween.ts — Modal.tsx manages its own simple exit ramp
  - Do NOT add choreography logic here — that stays in individual modals

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component modification with animation lifecycle
  - **Skills**: [`pixi-js`]
    - `pixi-js`: PixiJS container lifecycle, @pixi/react useTick

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `client/src/pixi/components/ui/Modal.tsx:43-90` — FULL current Modal implementation. Lines 74-90 are the enter animation. Line 155 is the instant-unmount gate. Understand ALL of this before modifying.
  - `client/src/pixi/components/ui/Modal.tsx:92-97` — Backdrop drawing. The `alpha` prop on line 163 uses `backdropAlpha` calculated from `enterProgress`.
  - `client/src/pixi/components/ui/Modal.tsx:156-159` — Current scale/alpha calculations from enterProgress. Exit animation should reverse these.

  **Consumer References** (who uses Modal):
  - `client/src/pixi/components/modals/LevelCompleteModal.tsx:169-180` — Passes `showCloseButton=false`, `closeOnBackdrop=false`. Will use `skipEnterAnimation=true` + `exitDuration` after this task.
  - `client/src/pixi/components/modals/GameOverModal.tsx:98-111` — Same pattern.
  - `client/src/pixi/components/modals/MenuModal.tsx` — Will NOT use choreography. Must remain backward compatible.
  - `client/src/pixi/components/modals/InGameShopModal.tsx` — Will NOT use choreography. Must remain backward compatible.

  **Acceptance Criteria**:

  - [ ] New props added: `exitDuration`, `onExitComplete`, `skipEnterAnimation`, `backdropAlpha`
  - [ ] Default behavior unchanged when new props not passed (backward compatible)
  - [ ] MenuModal and InGameShopModal still work identically (no new props passed)
  - [ ] When `exitDuration > 0` + `isOpen→false`: modal stays visible during exit animation
  - [ ] When `skipEnterAnimation=true`: enterProgress starts at 1
  - [ ] `cd client && npx tsc --noEmit` → 0 errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TypeScript compilation passes with new props
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output

  Scenario: Backward compatibility — existing modals unaffected
    Tool: Bash (grep)
    Steps:
      1. grep -n "exitDuration\|skipEnterAnimation\|backdropAlpha" client/src/pixi/components/modals/MenuModal.tsx
      2. Assert: 0 matches (MenuModal doesn't use new props)
      3. grep -n "exitDuration\|skipEnterAnimation\|backdropAlpha" client/src/pixi/components/modals/InGameShopModal.tsx
      4. Assert: 0 matches (InGameShopModal doesn't use new props)
    Expected Result: Non-choreographed modals untouched
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(client): add exit animation and choreography support to Modal.tsx`
  - Files: `client/src/pixi/components/ui/Modal.tsx`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 3. V3 Layout Adjustments

  **What to do**:
  Modify `client/src/pixi/components/pages/PlayScreen.tsx` to achieve V3 layout compliance:

  **A) HUD bar → 44px, Action bar → 80px**
  - In `PlayScreenInner` (line 450), change `useFullscreenLayout()` to:
    ```typescript
    useFullscreenLayout({ baseStatsBarHeight: 44, baseActionBarHeight: 80, baseProgressBarHeight: 8 })
    ```
  - This uses the existing config parameter — no hook modification needed
  - Also update the wrapper `PlayScreen` component (line 746) if it calls `useFullscreenLayout()`

  **B) Score progress bar → 8px thin bar**
  - Redesign `ProgressHudBar` component (lines 267-375) to be a minimal 8px bar:
    - Full-width rounded rect track (8px height, surface color background)
    - Filled portion shows score progress (blue → green as score approaches target)
    - 3 small notch markers at star threshold positions (1★, 2★, 3★) — tiny 2px vertical ticks
    - No text labels on the bar itself — it's purely visual
  - Move constraint indicators INTO `StatsBar` (lines 131-262):
    - StatsBar is now 44px (taller), has room for constraint dots
    - Add constraint rendering between the score/moves and cube balance sections
    - Use the existing `drawConstraintInline()` function (lines 377-409) with adjusted positioning

  **C) Moves danger pulse → alpha pulse**
  - When `isPlayerInDanger` (moves ≤ 3):
    - Moves text alpha pulses 0.8→1.0 over 800ms loop (sine wave)
    - Fill color: `color.status.danger` (red, 0xef4444)
  - Currently uses `usePulseRef` for scale pulse (line 142). Change to alpha pulse instead:
    - Use a ref-based approach similar to `usePulseRef` but manipulating `container.alpha` instead of `container.scale`
    - Or use `usePulseRef`'s `valueRef` to read the sine value and apply it to alpha in the draw callback
  - The existing red danger border (lines 738-740) stays unchanged

  **Must NOT do**:
  - Do NOT modify `useFullscreenLayout.ts` — only pass config overrides
  - Do NOT remove the constraint system — just relocate the rendering
  - Do NOT touch GameGrid or BlockSprite
  - Do NOT change how `isPlayerInDanger` is computed

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Layout recalculation and component restructuring with visual impact
  - **Skills**: [`pixi-js`]
    - `pixi-js`: PixiJS container positioning, Graphics draw callbacks

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `client/src/pixi/hooks/useFullscreenLayout.ts:86-94` — DEFAULT_CONFIG showing current base values (32, 26, 64). The `config` parameter on line 110 overrides these.
  - `client/src/pixi/hooks/useFullscreenLayout.ts:170-173` — How base values are scaled: `Math.round(baseValue * uiScale)`. Your override values will be scaled the same way.
  - `client/src/pixi/components/pages/PlayScreen.tsx:267-375` — Full ProgressHudBar implementation to redesign. Note the constraint rendering (lines 321-341) and star rendering (lines 344-373).
  - `client/src/pixi/components/pages/PlayScreen.tsx:131-262` — Full StatsBar implementation. Constraints will be added here. Note the available horizontal space (scoreX to movesX region).
  - `client/src/pixi/components/pages/PlayScreen.tsx:377-409` — `drawConstraintInline()` function. Reuse this in StatsBar.
  - `client/src/pixi/hooks/useAnimatedValue.ts:117-158` — `usePulseRef` pattern for sine-wave animation. Reference for the alpha pulse approach.

  **Token References**:
  - `client/src/pixi/design/tokens.ts:194-203` — `layout` object confirming target values: `topBarHeight: 44`, `actionBarHeight: 80`
  - `client/src/pixi/design/tokens.ts:119-129` — Status colors: `danger: 0xef4444` for moves warning

  **Acceptance Criteria**:

  - [ ] `useFullscreenLayout` called with `{ baseStatsBarHeight: 44, baseActionBarHeight: 80, baseProgressBarHeight: 8 }`
  - [ ] Score progress bar renders at 8px height (scaled) with star threshold notches
  - [ ] Constraint indicators visible in StatsBar (44px tall, enough room)
  - [ ] Moves text pulses alpha 0.8→1.0 when `isPlayerInDanger=true`
  - [ ] All existing gameplay features still work (score display, combo, level badge)
  - [ ] `cd client && npx tsc --noEmit` → 0 errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output

  Scenario: Layout config override is applied
    Tool: Bash (grep)
    Steps:
      1. grep "baseStatsBarHeight.*44" client/src/pixi/components/pages/PlayScreen.tsx
      2. Assert: Match found
      3. grep "baseActionBarHeight.*80" client/src/pixi/components/pages/PlayScreen.tsx
      4. Assert: Match found
      5. grep "baseProgressBarHeight.*8" client/src/pixi/components/pages/PlayScreen.tsx
      6. Assert: Match found
    Expected Result: Config overrides present in code
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(client): apply V3 layout — 44px HUD, 80px action bar, 8px progress bar`
  - Files: `client/src/pixi/components/pages/PlayScreen.tsx`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 4. Home Hub Redesign — HeroCard + Tile Grid

  **What to do**:

  **A) Create `client/src/pixi/components/core/HeroCard.tsx`**

  A prominent card component for the Home screen center:

  ```typescript
  interface HeroCardProps {
    variant: 'start' | 'continue';
    width: number;
    x?: number;
    y?: number;
    // For 'continue' variant:
    level?: number;
    totalScore?: number;
    bonusIcons?: string[]; // e.g. ["⚡", "🎯", "🌊"]
    // Interaction:
    onTap: () => void;
  }
  ```

  **variant="start"** (no active games):
  - Background: gradient-feel rounded rect (accent.blue → accent.purple), 120px height
  - Title: "START NEW RUN" in FONT_DISPLAY, white, centered
  - Subtitle: "Choose bonuses and begin" in FONT_BODY, text.secondary
  - Press animation: scale 0.96 + color darken (same pattern as HubTile)
  - Subtle glow border on the card edge (accent.blue at 30% alpha)

  **variant="continue"** (active game exists):
  - Background: gradient-feel rounded rect (accent.gold → accent.orange), 120px height
  - Title: "CONTINUE RUN" in FONT_DISPLAY, white
  - Left side: Level badge circle (same as StatsBar level badge)
  - Right side: Score display, bonus icons row
  - Press animation: same as start variant

  **Implementation patterns**:
  - Follow HubTile pattern for press animation (ref-based scale, useTick)
  - Follow Card pattern for rounded rect background
  - Use design tokens for all colors, fonts, spacing

  **B) Modify `client/src/pixi/components/pages/MainScreen.tsx` HomePageContent**

  Replace the current 4-button vertical list (lines 260-284) with:

  **Layout (top to bottom)**:
  ```
  ┌─ HomeTopBar ─────────────────────────┐  (existing, unchanged)
  │ 🧊 42  [?] [📜] [🏆] [⚙️] [👤]     │
  └───────────────────────────────────────┘
  
  ┌─ Logo ────────────────────────────────┐  (existing, smaller)
  │            ZKUBE                       │  height: 60px (was 80-120)
  └───────────────────────────────────────┘
  
  ┌─ HeroCard ────────────────────────────┐  NEW
  │  ⭐ CONTINUE RUN                      │  
  │  Level 12 · Score 847 · ⚡🎯🌊       │  height: 120px
  └───────────────────────────────────────┘
  
  ┌─ Tile Grid (3 + 2) ──────────────────┐  NEW (using HubTile)
  │ ┌──────┐ ┌──────┐ ┌──────┐          │
  │ │Quests│ │ Shop │ │Achiev│ row 1    │  3 tiles, equal width
  │ └──────┘ └──────┘ └──────┘          │  height: 88px
  │    ┌──────────┐ ┌──────────┐         │
  │    │Leaderboard│ │My Games │ row 2    │  2 tiles, wider
  │    └──────────┘ └──────────┘         │  height: 88px
  └───────────────────────────────────────┘
  ```

  **Tile specifications**:
  | Tile | Label | Badge | Tap Action |
  |------|-------|-------|------------|
  | Quests | "Quests" | Quest count or "Daily" | `navigate('quests')` |
  | Shop | "Shop" | — | `navigate('shop')` |
  | Achievements | "Achievements" | Trophy count | `onTrophyClick()` |
  | Leaderboard | "Leaderboard" | — | `navigate('leaderboard')` |
  | My Games | "My Games" | Active game count | `navigate('mygames')` |

  **Layout math**:
  - Content width: `Math.min(screenWidth - 2 * padding, layout.maxContentWidth)`
  - Tile gap: `space.sm` (8px) between tiles
  - Row 1: 3 tiles, each `(contentWidth - 2 * gap) / 3` wide
  - Row 2: 2 tiles, each `(contentWidth - gap) / 2` wide, centered

  **HeroCard game selection logic**:
  - If `games` has any active game (`!gameOver`): use most recent active game → variant="continue"
  - If `games` is empty OR all are `gameOver`: variant="start"
  - "continue" onTap → `handleNavigateToGame(game.tokenId)` (from existing MainScreen)
  - "start" onTap → `navigate('loadout')`

  **Must NOT do**:
  - Do NOT remove HomeTopBar — it stays at top
  - Do NOT remove the footer text ("Built on Starknet with Dojo")
  - Do NOT change LoadoutPage, PlayScreen, or any other page
  - Do NOT modify the PageNavigator system
  - Do NOT remove the existing PLAY GAME / MY GAMES / SHOP / LEADERBOARD buttons — REPLACE them with the new layout

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: New UI component creation + layout redesign
  - **Skills**: [`pixi-js`]
    - `pixi-js`: PixiJS component composition, @pixi/react rendering patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `client/src/pixi/components/core/HubTile.tsx:1-115` — FULL HubTile implementation. Follow this EXACTLY for press animation pattern (ref-based scale, useTick, pivot-based scaling). Use this component directly for the tile grid.
  - `client/src/pixi/components/core/Card.tsx` — Generic card container pattern. Reference for HeroCard background.
  - `client/src/pixi/components/pages/MainScreen.tsx:227-302` — Current HomePageContent. This is what gets replaced. Keep `Logo`, keep `HomeTopBar`, replace the 4 `PixiButton` components.
  - `client/src/pixi/components/pages/MainScreen.tsx:105-141` — Logo component (animated bob). Reduce `logoMaxH` from 80→60 for mobile.
  - `client/src/pixi/components/pages/MainScreen.tsx:25-32` — `PlayerGame` type. Use this for HeroCard data.

  **Token References**:
  - `client/src/pixi/design/tokens.ts:11-20` — `space` object for gaps (sm=8, md=12, lg=16)
  - `client/src/pixi/design/tokens.ts:97-136` — `color` semantic colors for card backgrounds
  - `client/src/pixi/design/tokens.ts:27-29` — Font constants (FONT_DISPLAY, FONT_UI, FONT_BODY)
  - `client/src/pixi/design/tokens.ts:200` — `layout.maxContentWidth: 480`

  **Acceptance Criteria**:

  - [ ] New file: `client/src/pixi/components/core/HeroCard.tsx`
  - [ ] HeroCard renders variant="start" when no active games
  - [ ] HeroCard renders variant="continue" with game data when active game exists
  - [ ] 5 HubTile instances in 3+2 grid layout
  - [ ] All tiles navigate to correct pages on tap
  - [ ] Logo height reduced to 60px on mobile
  - [ ] `cd client && npx tsc --noEmit` → 0 errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output

  Scenario: HeroCard exports correct interface
    Tool: Bash (grep)
    Steps:
      1. grep "variant.*start.*continue" client/src/pixi/components/core/HeroCard.tsx
      2. Assert: Match found (variant prop type)
      3. grep "export.*function\|export.*const.*HeroCard" client/src/pixi/components/core/HeroCard.tsx
      4. Assert: Match found (component exported)
    Expected Result: Component has correct API
    Evidence: grep output

  Scenario: HubTile used in MainScreen
    Tool: Bash (grep)
    Steps:
      1. grep "HubTile" client/src/pixi/components/pages/MainScreen.tsx
      2. Assert: At least 5 matches (5 tile instances)
    Expected Result: Tile grid instantiated
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(client): redesign Home Hub with hero card and tile grid`
  - Files: `client/src/pixi/components/core/HeroCard.tsx`, `client/src/pixi/components/pages/MainScreen.tsx`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

### ─── WAVE 2 — Modal Choreography (After Wave 1 Tasks 1+2) ───

- [ ] 5. LevelCompleteModal — Full V3 Choreography

  **What to do**:
  Rewrite `client/src/pixi/components/modals/LevelCompleteModal.tsx` to use the choreography engine:

  **Enter choreography timeline** (all times from modal open):
  | Delay | Element | Property | From→To | Duration | Easing |
  |-------|---------|----------|---------|----------|--------|
  | 0ms | backdrop | alpha | 0→0.6 | 300ms | linear |
  | 100ms | title | scale | 0.8→1.0 | 300ms | outCubic |
  | 100ms | title | alpha | 0→1 | 300ms | outCubic |
  | 400ms | star1 | scale | 0→1.2 | 200ms | outBack |
  | 450ms | star1 | scale | 1.2→1.0 | 200ms | outCubic |
  | 400ms | star1 | alpha | 0→1 | 200ms | outCubic |
  | 600ms | star2 | scale | 0→1.2 | 200ms | outBack |
  | 650ms | star2 | scale | 1.2→1.0 | 200ms | outCubic |
  | 600ms | star2 | alpha | 0→1 | 200ms | outCubic |
  | 800ms | star3 | scale | 0→1.2 | 200ms | outBack |
  | 850ms | star3 | scale | 1.2→1.0 | 200ms | outCubic |
  | 800ms | star3 | alpha | 0→1 | 200ms | outCubic |
  | 1000ms | stats | alpha | 0→1 | 200ms | outCubic |
  | 1000ms | scoreValue | value | 0→levelScore | 500ms | outCubic |
  | 1200ms | cubeIcon | scale | 0→1.3 | 300ms | outBack |
  | 1250ms | cubeIcon | scale | 1.3→1.0 | 300ms | outCubic |
  | 1500ms | button | alpha | 0→1 | 200ms | outCubic |
  | 1500ms | buttonGlow | alpha | 0→0.3 | 800ms | linear (looping, sine) |

  **Implementation approach**:
  - Import `useChoreography`, `getChoreographyValue` from `@/pixi/design/tween`
  - Pass `skipEnterAnimation={true}`, `exitDuration={200}` to Modal wrapper
  - Pass `backdropAlpha` from choreography values to Modal
  - Define enter steps array matching the timeline above
  - Define simple exit steps (all elements alpha 1→0 over 200ms)
  - Use `getChoreographyValue(result, 'star1', 'scale', 0)` in render to position/scale elements
  - Star shapes: keep existing Graphics-based star drawing (lines 82-106)
  - Score count-up: use `useAnimatedValue` with delay matching choreography timing (1000ms delay). NOTE: useAnimatedValue initializes at targetValue on mount. Use the pattern: `const displayScore = useAnimatedValue(choreographyPhase === 'entering' && isComplete('stats') ? levelScore : 0)`
  - Remove the old `setTimeout`-based star animation (lines 63-79)
  - **Button pulse**: After choreography completes, the Continue button gets a subtle scale pulse using `usePulseRef` pattern (1.0↔1.03, 2000ms period)
  - Only show stars up to `stars` count — unfilled stars stay at alpha 0.4, scale 0.8 (no pop animation)

  **Gold particle burst on star 3**:
  - When star3 reaches scale 1.2: emit 8-12 small gold particles from star3's position
  - Particles: gold color (accent.gold), small size (3-5px), radial spread, fast fade (400ms life)
  - Draw inline in the modal's own Graphics (not the global ParticleSystem)
  - Simple implementation: array of particle refs, useTick update, clear when life expires

  **prefers-reduced-motion behavior**:
  - All choreography values jump to final state immediately
  - No particle burst
  - Stats shown immediately
  - Score shows final value (no count-up)

  **Must NOT do**:
  - Do NOT modify Modal.tsx further (Task 2 already handled it)
  - Do NOT modify ParticleSystem.tsx
  - Do NOT add dependencies on external animation libraries
  - Do NOT change the props interface of LevelCompleteModal (keep backward compatible with PlayScreen)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex animation choreography with precise timing
  - **Skills**: [`pixi-js`]
    - `pixi-js`: PixiJS Graphics animation, @pixi/react lifecycle patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `client/src/pixi/components/modals/LevelCompleteModal.tsx:1-254` — FULL current implementation. Preserve all props, keep star drawing logic (lines 82-106), keep stats box drawing (lines 109-118), keep bonus box.
  - `client/src/pixi/components/modals/LevelCompleteModal.tsx:63-79` — Old setTimeout star animation to REMOVE.
  - `client/src/pixi/components/modals/LevelCompleteModal.tsx:185-196` — Current star rendering with scale/alpha. Replace with choreography-driven values.
  - `client/src/pixi/components/effects/ParticleSystem.tsx:46-82` — Particle physics pattern to replicate for inline gold burst (velocity, gravity, alpha decay, size shrink).

  **API References**:
  - `client/src/pixi/design/tween.ts` — `useChoreography`, `getChoreographyValue` (created in Task 1)
  - `client/src/pixi/design/tokens.ts:141-171` — `ease` functions for step definitions
  - `client/src/pixi/hooks/useAnimatedValue.ts:39-106` — `useAnimatedValue` for score count-up

  **Acceptance Criteria**:

  - [ ] Old setTimeout star animation removed
  - [ ] `useChoreography` imported from design/tween
  - [ ] Modal receives `skipEnterAnimation={true}`, `exitDuration={200}`
  - [ ] Stars animate sequentially: 400ms, 600ms, 800ms with outBack overshoot
  - [ ] Score counts up from 0 after 1000ms delay
  - [ ] Button appears at 1500ms with pulse glow after
  - [ ] Props interface unchanged (backward compatible with PlayScreen)
  - [ ] `cd client && npx tsc --noEmit` → 0 errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output

  Scenario: Uses choreography engine (not setTimeout)
    Tool: Bash (grep)
    Steps:
      1. grep -c "setTimeout" client/src/pixi/components/modals/LevelCompleteModal.tsx
      2. Assert: Output is "0"
      3. grep "useChoreography" client/src/pixi/components/modals/LevelCompleteModal.tsx
      4. Assert: Match found
    Expected Result: Old animation removed, new engine used
    Evidence: grep output

  Scenario: Modal choreography props applied
    Tool: Bash (grep)
    Steps:
      1. grep "skipEnterAnimation" client/src/pixi/components/modals/LevelCompleteModal.tsx
      2. Assert: Match found (skipEnterAnimation={true})
      3. grep "exitDuration" client/src/pixi/components/modals/LevelCompleteModal.tsx
      4. Assert: Match found
    Expected Result: Choreography integration correct
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(client): add V3 choreography to LevelCompleteModal`
  - Files: `client/src/pixi/components/modals/LevelCompleteModal.tsx`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 6. GameOverModal — Full V3 Choreography

  **What to do**:
  Rewrite `client/src/pixi/components/modals/GameOverModal.tsx` to use the choreography engine:

  **Enter choreography timeline** (all times from modal open):
  | Delay | Element | Property | From→To | Duration | Easing |
  |-------|---------|----------|---------|----------|--------|
  | 0ms | backdrop | alpha | 0→0.7 | 500ms | linear |
  | 500ms | title | scale | 0.8→1.0 | 300ms | outCubic |
  | 500ms | title | alpha | 0→1 | 300ms | outCubic |
  | 500ms | title | y | 10→0 | 300ms | outCubic |
  | 700ms | subtitle | alpha | 0→1 | 200ms | outCubic |
  | 900ms | stat_level | alpha | 0→1 | 200ms | outCubic |
  | 1100ms | stat_score | alpha | 0→1 | 200ms | outCubic |
  | 1300ms | stat_cubes | alpha | 0→1 | 200ms | outCubic |
  | 1300ms | stat_cubes_value | value | 0→totalCubes | 400ms | outCubic |
  | 1500ms | stat_combo | alpha | 0→1 | 200ms | outCubic |
  | 1700ms | cubeGlow | scale | 0→1.3 | 300ms | outBack |
  | 1750ms | cubeGlow | scale | 1.3→1.0 | 300ms | outCubic |
  | 1700ms | cubeGlow | alpha | 0→1 | 200ms | outCubic |
  | 2300ms | buttons | alpha | 0→1 | 200ms | outCubic |

  **Implementation approach**:
  - Import and use `useChoreography` from design/tween.ts
  - Pass `skipEnterAnimation={true}`, `exitDuration={200}` to Modal
  - Stats stagger: each stat row fades in 200ms apart (200ms interval)
  - "Grid darken sweep" → **simplified to**: backdrop fades 0→0.7 over 500ms (longer than usual). This achieves the darkening effect without cross-component complexity.
  - Title drift: combines y-offset (10→0) with scale and alpha for a "floating up" entrance
  - Game over icon: also fades in with title (same timing)
  - Cube earned gold glow: scale-up from 0 with easeOutBack at the cube stat row, creating a "pop" highlight
  - Score count-up: use `useAnimatedValue` with 1100ms delay for total score
  - Cubes count-up: use `useAnimatedValue` with 1300ms delay

  **prefers-reduced-motion behavior**:
  - All elements at final state immediately
  - No stagger, no drift, no glow

  **Must NOT do**:
  - Do NOT implement grid-level darkening (stays within modal scope)
  - Do NOT change GameOverModal props interface
  - Do NOT modify PlayScreen's modal rendering

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Animation choreography with staggered timing
  - **Skills**: [`pixi-js`]
    - `pixi-js`: PixiJS Graphics animation, ref-based state management

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `client/src/pixi/components/modals/GameOverModal.tsx:1-156` — FULL current implementation. Preserve all props. Keep icon drawing (lines 81-96), keep stats box drawing (lines 69-78), keep StatRow component (lines 46-66).
  - `client/src/pixi/components/modals/LevelCompleteModal.tsx` — Reference for choreography integration pattern (done in Task 5). Follow same import/usage pattern.

  **API References**:
  - `client/src/pixi/design/tween.ts` — `useChoreography`, `getChoreographyValue` (from Task 1)
  - `client/src/pixi/design/tokens.ts:141-171` — `ease` functions
  - `client/src/pixi/hooks/useAnimatedValue.ts:39-106` — `useAnimatedValue` for count-ups

  **Acceptance Criteria**:

  - [ ] `useChoreography` imported from design/tween
  - [ ] Modal receives `skipEnterAnimation={true}`, `exitDuration={200}`
  - [ ] Backdrop fades over 500ms (not instant)
  - [ ] Title drifts in (y offset + scale + alpha)
  - [ ] Stats stagger in at 200ms intervals
  - [ ] Cube stat has gold glow pop (easeOutBack)
  - [ ] Buttons appear at 2300ms
  - [ ] Props interface unchanged
  - [ ] `cd client && npx tsc --noEmit` → 0 errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output

  Scenario: Uses choreography engine
    Tool: Bash (grep)
    Steps:
      1. grep "useChoreography" client/src/pixi/components/modals/GameOverModal.tsx
      2. Assert: Match found
      3. grep "skipEnterAnimation" client/src/pixi/components/modals/GameOverModal.tsx
      4. Assert: Match found
    Expected Result: Choreography integrated
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(client): add V3 choreography to GameOverModal`
  - Files: `client/src/pixi/components/modals/GameOverModal.tsx`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 7. VictoryModal — Enhanced Confetti + Gold Text + Stats Count-Up

  **What to do**:
  Enhance `client/src/pixi/components/modals/VictoryModal.tsx`:

  **A) Confetti: 40 → 150 particles with alpha fade + scale shrink**
  - Change particle count from 40 (line 74) to 150
  - Add `alpha` and `scale` fields to Confetti interface (lines 32-42):
    ```typescript
    interface Confetti {
      // ... existing fields ...
      alpha: number;      // starts at 1.0
      scale: number;      // starts at 1.0
    }
    ```
  - In `tickConfetti` callback (lines 90-117):
    - Add alpha decay: `p.alpha -= 0.003 * dt` (fades over ~5 seconds)
    - Add scale shrink: `p.scale *= Math.pow(0.995, dt)` (slow shrink)
    - Remove particle when `p.alpha <= 0` OR `p.y > 500` (whichever first)
    - Apply alpha and scale to rendering:
      ```typescript
      g.setFillStyle({ color: p.color, alpha: p.alpha * 0.9 });
      const s = p.size * p.scale;
      g.rect(p.x - s / 2, p.y - s / 4, s, s / 2);
      ```
  - Vary particle shapes: ~70% rectangles (current), ~30% squares (s×s instead of s×s/2)
  - Widen initial spread: `modalWidth / 2 + (Math.random() - 0.5) * 200` (was 100)

  **B) "VICTORY!" text gold↔white color cycling**
  - Store title text ref: `const titleRef = useRef<import('pixi.js').Text | null>(null)`
  - In a useTick callback:
    - Track elapsed time
    - Cycle between `color.accent.gold` (0xfbbf24) and `color.text.primary` (0xffffff)
    - Use sine wave: `t = (Math.sin(elapsed * 0.003) + 1) / 2`
    - Interpolate RGB channels: `r = goldR + (whiteR - goldR) * t` (same for g, b)
    - Set: `titleRef.current.style.fill = (r << 16) | (g << 8) | b`
  - Ensure this only runs when `isOpen=true`

  **C) Stats count-up animation**
  - Use `useAnimatedValue` for each stat with staggered delays:
    - Total Score: delay 200ms, duration 600ms, easeOut
    - Total Cubes: delay 400ms, duration 600ms, easeOut
    - Max Combo: delay 600ms, duration 400ms, easeOut
  - NOTE: `useAnimatedValue` initializes at targetValue. Use conditional pattern:
    ```typescript
    const [showStats, setShowStats] = useState(false);
    useEffect(() => { if (isOpen) { const t = setTimeout(() => setShowStats(true), 200); return () => clearTimeout(t); } setShowStats(false); }, [isOpen]);
    const displayScore = useAnimatedValue(showStats ? totalScore : 0, { duration: 600 });
    ```

  **prefers-reduced-motion behavior**:
  - Confetti count → 0 (no particles)
  - Gold text cycling → static gold
  - Stats → final values immediately (no count-up delay)

  **Must NOT do**:
  - Do NOT extract confetti into ParticleSystem — keep it inline in VictoryModal
  - Do NOT change the trophy icon or modal structure
  - Do NOT change props interface
  - Do NOT import from tween.ts (this modal doesn't need full choreography — the confetti + text cycling are simpler useTick patterns)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Particle system enhancement + color animation
  - **Skills**: [`pixi-js`]
    - `pixi-js`: PixiJS Graphics rendering, particle physics, style manipulation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1 (for useAnimatedValue patterns, though technically only needs tokens.ts)

  **References**:

  **Pattern References**:
  - `client/src/pixi/components/modals/VictoryModal.tsx:1-284` — FULL current implementation. Key areas: confetti interface (lines 32-42), particle creation (lines 63-88), tick callback (lines 90-121), rendering (lines 108-116).
  - `client/src/pixi/components/modals/VictoryModal.tsx:165-176` — Title text style with dropShadow. Keep this style but add the color cycling.
  - `client/src/pixi/components/effects/ParticleSystem.tsx:54-67` — Particle physics with alpha decay pattern. Reference for the enhanced confetti alpha/scale decay.

  **API References**:
  - `client/src/pixi/hooks/useAnimatedValue.ts:39-106` — `useAnimatedValue` for stats count-up
  - `client/src/pixi/design/tokens.ts:109-114` — Color values for gold (accent.gold: 0xfbbf24) and white (text.primary: 0xffffff)
  - `client/src/pixi/themes/ThemeContext.tsx` — `usePerformanceSettings()` for `prefersReducedMotion`

  **Acceptance Criteria**:

  - [ ] Confetti count: 150 particles (not 40)
  - [ ] Confetti has alpha fade (particles become transparent over time)
  - [ ] Confetti has scale shrink (particles get smaller over time)
  - [ ] ~30% of particles are squares, ~70% rectangles
  - [ ] VICTORY text cycles gold↔white via ref-based style mutation
  - [ ] Stats count up with staggered delays
  - [ ] `prefersReducedMotion`: no confetti, no cycling, immediate final values
  - [ ] Props interface unchanged
  - [ ] `cd client && npx tsc --noEmit` → 0 errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output

  Scenario: Confetti count increased
    Tool: Bash (grep)
    Steps:
      1. grep "150" client/src/pixi/components/modals/VictoryModal.tsx
      2. Assert: Match found in particle creation loop
      3. grep -v "40" client/src/pixi/components/modals/VictoryModal.tsx | grep "i < " || true
      4. Assert: No "i < 40" remains
    Expected Result: 150 particles, not 40
    Evidence: grep output

  Scenario: Confetti interface has alpha and scale fields
    Tool: Bash (grep)
    Steps:
      1. grep "alpha.*number" client/src/pixi/components/modals/VictoryModal.tsx
      2. Assert: At least one match in Confetti interface
      3. grep "scale.*number" client/src/pixi/components/modals/VictoryModal.tsx
      4. Assert: At least one match in Confetti interface
    Expected Result: New fields added to interface
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(client): enhance VictoryModal with 150 confetti, gold text cycling, stat count-up`
  - Files: `client/src/pixi/components/modals/VictoryModal.tsx`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

### ─── WAVE 3 — Verification (After All Tasks) ───

- [ ] 8. Build Verification + Integration Check

  **What to do**:
  Full build verification and integration smoke test:

  **A) Type checking**
  ```bash
  cd /home/djizus/projects/zkube/client && npx tsc --noEmit
  ```
  - Expected: exit code 0, zero errors

  **B) Production build**
  ```bash
  cd /home/djizus/projects/zkube/client && npx vite build
  ```
  - Expected: exit code 0, zero errors, zero warnings

  **C) Import verification**
  - Verify `tween.ts` is importable from all modal files
  - Verify `HeroCard` is importable from MainScreen
  - Verify no circular dependencies introduced

  **D) Reduced motion verification**
  - Grep all new/modified files for `usePerformanceSettings` or `prefersReducedMotion`
  - Confirm ALL choreographed modals check this flag
  - Confirm VictoryModal checks this flag for confetti + text cycling

  **E) Backward compatibility check**
  - Verify MenuModal and InGameShopModal are NOT modified (no choreography props)
  - Verify PlayScreen still renders all 5 modals correctly (no prop changes)

  **If build fails**: Fix type errors in the failing file. Common issues:
  - Missing imports for `ChoreographyStep`/`ChoreographyResult` types
  - Incorrect `getChoreographyValue` return type usage
  - Modal.tsx new optional props not marked as `?`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification task — run commands, check output, fix simple issues
  - **Skills**: [`pixi-js`]
    - `pixi-js`: Understand PixiJS import patterns for debugging

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential, final)
  - **Blocks**: None (final task)
  - **Blocked By**: All tasks 1-7

  **References**:

  All files from previous tasks.

  **Acceptance Criteria**:

  - [ ] `npx tsc --noEmit` → exit code 0
  - [ ] `npx vite build` → exit code 0
  - [ ] No `as any` or `@ts-ignore` in any modified/new file
  - [ ] `usePerformanceSettings` or `prefersReducedMotion` referenced in: tween.ts, LevelCompleteModal.tsx, GameOverModal.tsx, VictoryModal.tsx
  - [ ] MenuModal.tsx and InGameShopModal.tsx unchanged from before this plan
  - [ ] All 8 files (1 new tween.ts + 1 new HeroCard.tsx + 6 modified) pass type checking

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Full type check passes
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: Zero type errors
    Evidence: Terminal output (empty = success)

  Scenario: Production build succeeds
    Tool: Bash
    Steps:
      1. cd /home/djizus/projects/zkube/client && npx vite build
      2. Assert: Exit code 0
      3. Assert: Output contains "built in"
    Expected Result: Bundle created successfully
    Evidence: Terminal output with bundle stats

  Scenario: No type escape hatches
    Tool: Bash (grep)
    Steps:
      1. grep -rn "as any\|@ts-ignore\|@ts-nocheck" client/src/pixi/design/tween.ts client/src/pixi/components/core/HeroCard.tsx client/src/pixi/components/ui/Modal.tsx client/src/pixi/components/modals/LevelCompleteModal.tsx client/src/pixi/components/modals/GameOverModal.tsx client/src/pixi/components/modals/VictoryModal.tsx client/src/pixi/components/pages/PlayScreen.tsx client/src/pixi/components/pages/MainScreen.tsx
      2. Assert: 0 matches
    Expected Result: Strict TypeScript throughout
    Evidence: grep output (empty = success)

  Scenario: Reduced motion respected
    Tool: Bash (grep)
    Steps:
      1. grep -l "prefersReducedMotion\|usePerformanceSettings" client/src/pixi/design/tween.ts client/src/pixi/components/modals/LevelCompleteModal.tsx client/src/pixi/components/modals/GameOverModal.tsx client/src/pixi/components/modals/VictoryModal.tsx
      2. Assert: All 4 files listed
    Expected Result: All animation files check reduced motion
    Evidence: grep output

  Scenario: Non-choreographed modals untouched
    Tool: Bash
    Steps:
      1. git diff --name-only | grep -v "node_modules"
      2. Assert: MenuModal.tsx NOT in output
      3. Assert: InGameShopModal.tsx NOT in output
    Expected Result: MenuModal and InGameShopModal unchanged
    Evidence: git diff output
  ```

  **Commit**: NO (verification only — no code changes unless fixes needed)

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(client): add choreography engine for modal animations` | design/tween.ts | tsc --noEmit |
| 2 | `feat(client): add exit animation and choreography support to Modal.tsx` | ui/Modal.tsx | tsc --noEmit |
| 3 | `feat(client): apply V3 layout — 44px HUD, 80px action bar, 8px progress bar` | pages/PlayScreen.tsx | tsc --noEmit |
| 4 | `feat(client): redesign Home Hub with hero card and tile grid` | core/HeroCard.tsx, pages/MainScreen.tsx | tsc --noEmit |
| 5 | `feat(client): add V3 choreography to LevelCompleteModal` | modals/LevelCompleteModal.tsx | tsc --noEmit |
| 6 | `feat(client): add V3 choreography to GameOverModal` | modals/GameOverModal.tsx | tsc --noEmit |
| 7 | `feat(client): enhance VictoryModal with 150 confetti, gold text cycling, stat count-up` | modals/VictoryModal.tsx | tsc --noEmit |
| 8 | — (verify only) | — | tsc --noEmit + vite build |

---

## Success Criteria

### Verification Commands
```bash
cd /home/djizus/projects/zkube/client
npx tsc --noEmit      # Expected: exit code 0
npx vite build         # Expected: exit code 0, "built in Xs"
```

### Final Checklist
- [ ] **Infrastructure**: tween.ts exists with useChoreography hook (ref-based, reduced-motion-aware)
- [ ] **Modal lifecycle**: Modal.tsx supports exit animation via delayed unmount
- [ ] **Layout**: HUD=44px, ActionBar=80px, ProgressBar=8px with star notches
- [ ] **LevelComplete**: Full enter choreography — stars pop, stats fade, score counts up, button pulses
- [ ] **GameOver**: Full enter choreography — backdrop fade, title drift, stats stagger, cube glow, buttons fade
- [ ] **Victory**: 150 confetti with alpha+scale fade, gold↔white text cycle, stats count up
- [ ] **Home Hub**: HeroCard (start/continue variants) + 5-tile grid (3+2 layout)
- [ ] **Accessibility**: All animations skip to final state when prefersReducedMotion=true
- [ ] **Type safety**: Zero `as any`, zero `@ts-ignore`, clean tsc
- [ ] **Build**: `vite build` produces bundle with 0 errors
- [ ] **Backward compat**: MenuModal, InGameShopModal, PlayScreen modal rendering all unchanged
