# V3 Design Token Migration — Phase 1 Visual Polish

## TL;DR

> **Quick Summary**: Migrate 27 PixiJS components from hardcoded hex color literals to V3 design token imports (`@/pixi/design/tokens`), transforming the UI from a light/mixed theme to a consistent dark V3 aesthetic. This is a mechanical refactoring — replace hex literals with token references, no behavioral changes.
>
> **Deliverables**:
> - `tokens.ts` augmented with ~10 missing semantic color tokens
> - 27 component files updated to import and use V3 tokens
> - PlayScreen background changed from light sky gradient to dark V3 gradient
> - All `pnpm build` (tsc + vite) checks passing
>
> **Estimated Effort**: Large (27 files, ~120 color replacements)
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Token augmentation → Leaf components → Containers/Modals → Pages

---

## Context

### Original Request
Apply V3 visual styling to 32 Phase 1 components. Only ~10 of 55 components use V3 design tokens. 32 components still use old light-theme colors and hardcoded values. The task is to make Phase 1 look like the V3 spec (dark theme with semantic color tokens).

### Interview Summary
**Key Decisions**:
- Token source: `@/pixi/design/tokens` (file at `client/src/pixi/design/tokens.ts`)
- Keep `usePixiTheme().colors` for game-specific elements (blocks, particles, grid cells, themed assets)
- Use V3 tokens for UI chrome (backgrounds, borders, text, status indicators)
- PlayScreen StatsBar/ProgressHudBar: restyle in place, do NOT extract to separate files
- Font imports (FONT_TITLE, FONT_BOLD, FONT_BODY from utils/colors.ts): NO renames
- `pixi/ui/PixiButton.tsx`: OFF LIMITS per user constraints

**Research Findings**:
- 27 files actually need changes (not 32 — some were already migrated or color-free)
- ~120 hardcoded hex color values need replacing across all files
- ~10 frequently-used colors don't exist in current tokens.ts and need to be added
- Modal.tsx is shared by all 5 modals — changes propagate automatically
- Component interfaces don't change — all migrations are internal-only

### Metis Review
**Identified Gaps** (addressed):
- PlayScreen `Application background={0xD0EAF8}` must change with SkyBackground gradient (→ included in PlayScreen task)
- ~20 hardcoded colors have no direct V3 token match (→ add essential ones to tokens.ts, keep one-off colors as component-local constants)
- Theme-tinted HUD fallbacks (`colors.hudBar` etc.) must be preserved (→ keep `usePixiTheme()` for fallback paths, only replace non-themed hardcoded hex)
- `drawConstraintInline()` in PlayScreen duplicates ConstraintIndicator colors (→ both use same V3 tokens for consistency)
- No visual regression testing beyond build (→ grep audit for remaining hardcoded hex as acceptance criteria)

---

## Answers to Design Questions

### Q1: Optimal wave structure?
**4 waves** with build verification between each. Wave 1 handles foundation (token augmentation + trivial files). Waves 2-3 are heavily parallel (all leaf components and modals simultaneously). Wave 4 is the complex pages.

### Q2: Which components can be migrated independently?
**Almost all of them.** Since component interfaces don't change (only internal color values), there are zero ordering dependencies between sibling components. The only soft dependency is:
- `tokens.ts` augmentation should happen first (Wave 1) so subsequent tasks can import the new tokens
- `Modal.tsx` should happen before or alongside individual modals (same wave is fine)

### Q3: Priority ordering within each wave?
By complexity ascending. Quick wins first (ScorePopup=1 color, ThemeBackground=2 colors), then medium (HUD leaves=4-10 colors each), then complex (BonusButton=10+ colors with state logic, PlayScreen=25+ colors across 4 inline components).

### Q4: Restructure PlayScreen's StatsBar/ProgressHudBar or restyle in place?
**Restyle in place.** Extracting changes component lifecycle, memoization boundaries, and prop threading — that's scope creep for a purely visual task. The 757-line file stays messy, but the risk is lower. A future refactoring session can extract them cleanly.

### Q5: Risks with in-place migration vs creating new V3 components?
**In-place is correct.** Creating new V3 components would:
- Double the component count (confusing)
- Require updating all parent imports
- Add dead code (old components) or require a cutover plan
- Be massive scope creep

In-place migration is mechanical and safe: `0x1e293b` → `color.bg.primary`. Same visual intent, just sourced from tokens.

---

## Work Objectives

### Core Objective
Replace all hardcoded hex color literals in 27 PixiJS components with semantic imports from `@/pixi/design/tokens`, achieving a consistent dark V3 visual identity across Phase 1.

### Concrete Deliverables
- `client/src/pixi/design/tokens.ts` — augmented with missing color tokens
- 26 component `.tsx` files — updated with V3 token imports
- Zero hardcoded UI-chrome hex values remaining in modified files (validated by grep)
- `pnpm build` passing after all changes

### Definition of Done
- [ ] `pnpm build` exits 0 with zero errors
- [ ] `grep -rn '0x0f172a\|0x334155\|0x94a3b8\|0xfbbf24\|0x22c55e\|0xef4444\|0x3b82f6' client/src/pixi/components/ --include='*.tsx'` returns zero matches
- [ ] All modified files import from `@/pixi/design/tokens`
- [ ] `usePixiTheme()` still present in GridBackground, ActionBar, HUDBar, NextLinePreview, BonusButton, PlayScreen (StatsBar, ProgressHudBar)

### Must Have
- Every UI-chrome hex literal replaced with a V3 token import
- PlayScreen Application background changed from 0xD0EAF8 to dark V3 color
- PlayScreen SkyBackground gradient changed from light to dark
- Danger state colors (red text, red border) use `color.status.danger`
- Build passes after every wave

### Must NOT Have (Guardrails)
- **NO font renames** — FONT_TITLE, FONT_BOLD, FONT_BODY stay as-is, imported from `../../utils/colors`
- **NO component extraction** from PlayScreen — StatsBar, ProgressHudBar, SkyBackground, HudPillButton stay inline
- **NO changes to ThemeColors interface** or any theme definition (TIKI_COLORS, COSMIC_COLORS, etc.)
- **NO changes to** `getBlockColors()`, `getThemeColors()`, or any function in `utils/colors.ts`
- **NO changes to** `pixi/themes/`, `pixi/hooks/`, `pixi/utils/`, `pixi/ui/`, `pixi/assets/`, `pixi/audio/`, `dojo/`, `hooks/`, `stores/`, `contexts/`, `config/`
- **NO conditional logic changes** — combo thresholds, danger thresholds, animation parameters stay identical. ONLY hex values change.
- **NO `as any` type assertions**
- **NO alpha value changes** unless a specific value becomes invisible against the new dark background (must be flagged explicitly in the commit)
- **NO changes to** BlockSprite.tsx, GameGrid.tsx, ParticleSystem.tsx, ScreenShake.tsx, DragTrail.tsx

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks are verified by running commands. No manual visual inspection required.

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **Automated tests**: NO — this is a visual restyling. Unit tests don't verify color correctness.
- **Framework**: vitest (exists but not used for this task)

### Agent-Executed QA (MANDATORY — ALL tasks)

**Primary Verification**: Build check + grep audit after each wave.

```bash
# After EVERY wave:
cd client && pnpm build
# Assert: exit code 0

# After final wave:
grep -rn '0x0f172a\|0x334155\|0x94a3b8\|0xfbbf24\|0x22c55e\|0xef4444\|0x3b82f6\|0x1e293b\|0x64748b\|0x475569' \
  client/src/pixi/components/ --include='*.tsx' | grep -v 'import'
# Assert: zero matches (all replaced with token imports)

# Verify token imports exist:
grep -rn "from.*design/tokens" client/src/pixi/components/ --include='*.tsx' | wc -l
# Assert: >= 25

# Verify theme hooks preserved:
grep -rn "usePixiTheme" client/src/pixi/components/ --include='*.tsx' | wc -l
# Assert: >= 6 (GridBackground, ActionBar, HUDBar, NextLinePreview, BonusButton, PlayScreen)
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately): Foundation + Trivials
├── Task 1: Augment tokens.ts with missing colors
├── Task 2: Migrate trivial components (ScorePopup, ThemeBackground, SurrenderButton)
└── Task 3: Migrate Modal.tsx (shared by all modals)
→ BUILD VERIFY

Wave 2 (After Wave 1): Leaf Components (all parallel)
├── Task 4: HUD leaves (LevelBadge, ProgressBar, MovesCounter, ConstraintIndicator)
├── Task 5: ActionBar leaves (BonusButton, ComboDisplay, StarRating)
├── Task 6: Game panels (ScorePanel, MovesPanel)
└── Task 7: Game displays + Grid (LevelDisplay, NextLinePreview, GridBackground)
→ BUILD VERIFY

Wave 3 (After Wave 2): Containers + Modals (all parallel)
├── Task 8: Container components (HUDBar, ActionBar)
├── Task 9: Modals A (GameOverModal, LevelCompleteModal, VictoryModal)
└── Task 10: Modals B (MenuModal, InGameShopModal)
→ BUILD VERIFY

Wave 4 (After Wave 3): Pages (most complex)
├── Task 11: PlayScreen.tsx (SkyBackground, HudPillButton, StatsBar, ProgressHudBar, danger border, status bubble, Application bg)
├── Task 12: LoadoutPage.tsx + PageTopBar.tsx
└── Task 13: Final grep audit + full build verification
→ FINAL BUILD VERIFY
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 (tokens.ts) | None | 2-12 (all need new tokens) | 2, 3 (if not using new tokens) |
| 2 (trivials) | 1 | None | 3 |
| 3 (Modal.tsx) | 1 | 9, 10 (modals render inside Modal) | 2 |
| 4 (HUD leaves) | 1 | 8 (HUDBar composes them) | 5, 6, 7 |
| 5 (ActionBar leaves) | 1 | 8 (ActionBar composes them) | 4, 6, 7 |
| 6 (Game panels) | 1 | None | 4, 5, 7 |
| 7 (Game displays) | 1 | None | 4, 5, 6 |
| 8 (Containers) | 1 | None | 9, 10 |
| 9 (Modals A) | 1, 3 | None | 8, 10 |
| 10 (Modals B) | 1, 3 | None | 8, 9 |
| 11 (PlayScreen) | 1 | 13 | 12 |
| 12 (Loadout+TopBar) | 1 | 13 | 11 |
| 13 (Final audit) | 1-12 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | 3× `category="quick"`, `load_skills=["pixi-js"]` |
| 2 | 4, 5, 6, 7 | 4× `category="quick"`, `load_skills=["pixi-js"]` |
| 3 | 8, 9, 10 | 3× `category="quick"`, `load_skills=["pixi-js"]` |
| 4 | 11, 12, 13 | 2× `category="unspecified-high"` + 1× `category="quick"` |

---

## TODOs

### Wave 1: Foundation + Trivials

- [ ] 1. Augment tokens.ts with missing semantic colors

  **What to do**:
  - Add the following tokens to the `color` object in `client/src/pixi/design/tokens.ts`:
    ```typescript
    // Inside color object, add:
    interactive: {
      pillBg: 0x333333,
      pillPressed: 0x555555,
    },
    ```
  - Add missing status variants:
    ```typescript
    // Extend status object:
    dangerDark: 0x7f1d1d,
    dangerLight: 0xfca5a5,
    successDark: 0x14532d,
    successLight: 0x86efac,
    warningDark: 0x78350f,
    warningLight: 0xfcd34d,
    ```
  - Ensure all exports are `as const` for type safety
  - Do NOT modify any existing token values

  **Must NOT do**:
  - Change any existing color value
  - Add font constants (fonts stay in utils/colors.ts)
  - Create new export files
  - Modify any file besides `client/src/pixi/design/tokens.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4-12 (all need new tokens available)
  - **Blocked By**: None

  **References**:
  - `client/src/pixi/design/tokens.ts:97-126` — existing `color` object structure to extend
  - `client/src/pixi/components/hud/ConstraintIndicator.tsx:78-94` — uses 0x7f1d1d, 0x14532d, 0xfca5a5, 0x86efac (the missing status tokens)
  - `client/src/pixi/components/hud/MovesCounter.tsx:36-46` — uses 0x78350f, 0xfcd34d (the missing warning tokens)
  - `client/src/pixi/components/pages/PlayScreen.tsx:103` — uses 0x333333, 0x555555 (the missing interactive tokens)

  **Acceptance Criteria**:
  - [ ] `client/src/pixi/design/tokens.ts` has `color.interactive.pillBg`, `color.interactive.pillPressed`
  - [ ] `client/src/pixi/design/tokens.ts` has `color.status.dangerDark`, `color.status.dangerLight`, `color.status.successDark`, `color.status.successLight`, `color.status.warningDark`, `color.status.warningLight`
  - [ ] All new values are `as const`
  - [ ] `cd client && pnpm build` → exit 0

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Tokens file compiles and exports new colors
    Tool: Bash
    Steps:
      1. cd client && pnpm build
      2. Assert: exit code 0
      3. grep -n 'interactive' client/src/pixi/design/tokens.ts
      4. Assert: output contains 'pillBg' and 'pillPressed'
      5. grep -n 'dangerDark' client/src/pixi/design/tokens.ts
      6. Assert: output contains '0x7f1d1d'
    Expected Result: Build passes, all new tokens present
  ```

  **Commit**: YES
  - Message: `style(tokens): add missing semantic colors for V3 migration`
  - Files: `client/src/pixi/design/tokens.ts`

---

- [ ] 2. Migrate trivial components (ScorePopup, ThemeBackground, SurrenderButton)

  **What to do**:
  - **ScorePopup.tsx** (1 color): Replace `0x000000` (line 57, 61) with `color.bg.overlay` from tokens. Add `import { color } from '@/pixi/design/tokens';`
  - **ThemeBackground.tsx** (2 colors): Replace `0x1a2744` (line 27) with `color.bg.primary`. Keep `0x000000` vignette as-is (intentional shadow effect). Add token import.
  - **SurrenderButton.tsx** (0 colors): This file only imports `FONT_BOLD` from utils/colors and delegates to PixiButton. No color changes needed — skip unless font import path changes.

  **Must NOT do**:
  - Change vignette alpha values in ThemeBackground
  - Modify PixiButton import or behavior in SurrenderButton
  - Change ScorePopup animation logic (vy, scale, life)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: None
  - **Blocked By**: Task 1 (needs `color.bg.overlay` token)

  **References**:
  - `client/src/pixi/components/effects/ScorePopup.tsx:57,61` — the 0x000000 values to replace
  - `client/src/pixi/components/background/ThemeBackground.tsx:27` — the 0x1a2744 fallback bg
  - `client/src/pixi/design/tokens.ts:98-103` — `color.bg` object with `overlay: 0x000000` and `primary: 0x1e293b`

  **Acceptance Criteria**:
  - [ ] ScorePopup.tsx imports from `@/pixi/design/tokens`
  - [ ] ThemeBackground.tsx imports from `@/pixi/design/tokens`
  - [ ] No hardcoded `0x1a2744` in ThemeBackground.tsx
  - [ ] `cd client && pnpm build` → exit 0

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Trivial components build with token imports
    Tool: Bash
    Steps:
      1. cd client && pnpm build
      2. Assert: exit code 0
      3. grep -n 'design/tokens' client/src/pixi/components/effects/ScorePopup.tsx
      4. Assert: import line present
      5. grep -n '0x1a2744' client/src/pixi/components/background/ThemeBackground.tsx
      6. Assert: zero matches
    Expected Result: Build passes, hardcoded colors replaced
  ```

  **Commit**: YES
  - Message: `style(effects,background): migrate ScorePopup and ThemeBackground to V3 tokens`
  - Files: `client/src/pixi/components/effects/ScorePopup.tsx`, `client/src/pixi/components/background/ThemeBackground.tsx`

---

- [ ] 3. Migrate Modal.tsx (shared modal container)

  **What to do**:
  - Add `import { color } from '@/pixi/design/tokens';` to Modal.tsx
  - Replace hardcoded color constants (lines 54-57):
    - `0x0f172a` → `color.bg.secondary`
    - `0x334155` → `color.bg.surface`
    - `0xffffff` → `color.text.primary`
    - `0x94a3b8` → `color.text.secondary`
  - Replace `0x000000` backdrop (line 95) with `color.bg.overlay`
  - Replace `0x334155` close button bg (line 128) with `color.bg.surface`
  - Replace `0xffffff` close button X (line 135) with `color.text.primary`
  - Replace `0x000000` shadow (line 104) with `color.bg.overlay`
  - Keep FONT_TITLE, FONT_BODY imports from utils/colors unchanged

  **Must NOT do**:
  - Change modal animation logic (enterProgress, scale, alpha)
  - Change modal sizing/layout (padding, cornerRadius, headerHeight)
  - Modify the ModalProps interface
  - Change alpha values (0.7 backdrop, 0.98 bg, 0.6 border, 0.3 separator)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 9, 10 (modals render inside Modal)
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/ui/Modal.tsx:54-57` — color constants to replace
  - `client/src/pixi/components/ui/Modal.tsx:92-136` — draw functions with hardcoded colors
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens to import

  **Acceptance Criteria**:
  - [ ] Modal.tsx imports `{ color }` from `@/pixi/design/tokens`
  - [ ] No hardcoded `0x0f172a`, `0x334155`, `0x94a3b8` in Modal.tsx
  - [ ] `cd client && pnpm build` → exit 0

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Modal component uses V3 tokens
    Tool: Bash
    Steps:
      1. cd client && pnpm build
      2. Assert: exit code 0
      3. grep -c 'color.bg\|color.text' client/src/pixi/components/ui/Modal.tsx
      4. Assert: count >= 5
      5. grep -c '0x0f172a\|0x334155' client/src/pixi/components/ui/Modal.tsx
      6. Assert: count = 0
    Expected Result: All hardcoded colors replaced with token references
  ```

  **Commit**: YES
  - Message: `style(modal): migrate shared Modal component to V3 tokens`
  - Files: `client/src/pixi/components/ui/Modal.tsx`

---

### Wave 2: Leaf Components (all parallel)

- [ ] 4. Migrate HUD leaf components (LevelBadge, ProgressBar, MovesCounter, ConstraintIndicator)

  **What to do**:
  - Add `import { color } from '@/pixi/design/tokens';` to each file
  - **LevelBadge.tsx** (69 lines, 4 colors):
    - `0x334155` → `color.bg.surface` (badge bg)
    - `0x475569` → `color.state.hover` (badge border)
    - `0x94a3b8` → `color.text.secondary` (label text)
    - `0xffffff` → `color.text.primary` (level number)
  - **ProgressBar.tsx** (128 lines, 4 colors):
    - `0x0f172a` → `color.bg.secondary` (bar bg)
    - `0x1e293b` → `color.bg.primary` (bar stroke)
    - `0x3b82f6` → `color.accent.blue` (fill, non-danger)
    - `0xef4444` → `color.status.danger` (fill, danger)
    - `0xffffff` → `color.text.primary` (score text, highlight alpha)
  - **MovesCounter.tsx** (101 lines, 7 colors):
    - `0x7f1d1d` → `color.status.dangerDark` (critical bg)
    - `0x78350f` → `color.status.warningDark` (warning bg)
    - `0x1e293b` → `color.bg.primary` (normal bg)
    - `0xfca5a5` → `color.status.dangerLight` (critical text)
    - `0xfcd34d` → `color.status.warningLight` (warning text)
    - `0xffffff` → `color.text.primary` (normal text)
    - `0xef4444` → `color.status.danger` (critical border)
    - `0xf97316` → `color.status.warning` (warning border)
    - `0x475569` → `color.state.hover` (normal border)
    - `0x94a3b8` → `color.text.secondary` (label text)
  - **ConstraintIndicator.tsx** (155 lines, 10 colors):
    - `0x7f1d1d` → `color.status.dangerDark` (failed bg)
    - `0x14532d` → `color.status.successDark` (satisfied bg)
    - `0x1e293b` → `color.bg.primary` (neutral bg)
    - `0xfca5a5` → `color.status.dangerLight` (failed text)
    - `0x86efac` → `color.status.successLight` (satisfied text)
    - `0x94a3b8` → `color.text.secondary` (neutral text)
    - `0xef4444` → `color.status.danger` (failed accent)
    - `0x22c55e` → `color.status.success` (satisfied accent)
    - `0x3b82f6` → `color.accent.blue` (neutral accent)
    - `0x475569` → `color.state.hover` (empty dot fill)

  **Must NOT do**:
  - Change ProgressBar animation logic (lerp factor, targetProgress)
  - Change MovesCounter threshold values (warningThreshold=5, criticalThreshold=3)
  - Change ConstraintIndicator dot sizing or spacing
  - Modify any component's props interface

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Task 8 (HUDBar composes these)
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/hud/LevelBadge.tsx` — 69 lines, full file
  - `client/src/pixi/components/hud/ProgressBar.tsx` — 128 lines, full file
  - `client/src/pixi/components/hud/MovesCounter.tsx` — 101 lines, full file
  - `client/src/pixi/components/hud/ConstraintIndicator.tsx` — 155 lines, full file
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens

  **Acceptance Criteria**:
  - [ ] All 4 files import from `@/pixi/design/tokens`
  - [ ] Zero hardcoded `0x0f172a`, `0x334155`, `0x94a3b8`, `0x22c55e`, `0xef4444`, `0x3b82f6` in any of the 4 files
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(hud): migrate LevelBadge, ProgressBar, MovesCounter, ConstraintIndicator to V3 tokens`
  - Files: 4 files in `client/src/pixi/components/hud/`

---

- [ ] 5. Migrate ActionBar leaf components (BonusButton, ComboDisplay, StarRating)

  **What to do**:
  - Add `import { color } from '@/pixi/design/tokens';` to each file
  - **BonusButton.tsx** (256 lines, 10+ colors):
    - `0x2D2D2D` → keep as component-local `const DISABLED_BG = 0x2D2D2D;` (not a V3 semantic color)
    - `0x1E3A5A` → keep as component-local `const SELECTED_BG = 0x1E3A5A;` (selected state, unique)
    - `0x4A4A4A` → keep as component-local `const PRESSED_BG = 0x4A4A4A;`
    - `0x3A3A3A` → keep as component-local `const HOVERED_BG = 0x3A3A3A;`
    - `0x2A2A2A` → keep as component-local `const DEFAULT_BG = 0x2A2A2A;`
    - `0x555555` → `color.interactive.pillPressed` (disabled border, generic gray)
    - `0x60a5fa` → `color.accent.blue` (selected border, glow)
    - `0x888888` / `0x666666` → keep as component-local constants (hover/default border)
    - `0x22c55e` → `color.status.success` (count badge)
    - `0xfbbf24` → `color.accent.gold` (level dots)
    - `0xffffff` → `color.text.primary` (text, count badge stroke, highlight)
  - **ComboDisplay.tsx** (114 lines, 5 colors):
    - `0xffd700` → keep as component-local `const COMBO_HIGH = 0xffd700;` (game-specific: 7+ combo gold shimmer, distinct from accent.gold)
    - `0xff6b00` → keep as component-local `const COMBO_MED = 0xff6b00;` (5+ combo orange-red, distinct from accent.orange)
    - `0xf97316` → `color.accent.orange` (3+ combo)
    - `0x64748b` → `color.text.muted` (inactive combo)
    - `0x000000` → `color.bg.overlay` (text stroke)
    - `0x94a3b8` → `color.text.secondary` (COMBO label)
  - **StarRating.tsx** (79 lines, 3 colors):
    - `0xfbbf24` → `color.accent.gold` (filled star)
    - `0x475569` → `color.state.hover` (empty star)
    - `0xfcd34d` → keep as component-local `const STAR_STROKE = 0xfcd34d;` (star border highlight, specific to star rendering)

  **Must NOT do**:
  - Change combo threshold values (7, 5, 3 in ComboDisplay)
  - Change BonusButton animation logic (pulse, glow filter params)
  - Change StarRating star geometry (outerRadius, innerRadius)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Task 8 (ActionBar composes these)
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/actionbar/BonusButton.tsx` — 256 lines, complex state logic
  - `client/src/pixi/components/actionbar/ComboDisplay.tsx` — 114 lines
  - `client/src/pixi/components/actionbar/StarRating.tsx` — 79 lines
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens

  **Acceptance Criteria**:
  - [ ] All 3 files import from `@/pixi/design/tokens`
  - [ ] BonusButton: `color.accent.blue`, `color.status.success`, `color.accent.gold` used where mapped
  - [ ] ComboDisplay: `color.accent.orange`, `color.text.muted`, `color.text.secondary` used
  - [ ] StarRating: `color.accent.gold`, `color.state.hover` used
  - [ ] Component-local constants have explanatory comments
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(actionbar): migrate BonusButton, ComboDisplay, StarRating to V3 tokens`
  - Files: 3 files in `client/src/pixi/components/actionbar/`

---

- [ ] 6. Migrate Game panels (ScorePanel, MovesPanel)

  **What to do**:
  - Add `import { color } from '@/pixi/design/tokens';` to each file
  - **ScorePanel.tsx** (174 lines, 11 colors):
    - `0x0f172a` → `color.bg.secondary` (panel bg)
    - `0x334155` → `color.bg.surface` (border)
    - `0xffffff` → `color.text.primary` (text, highlight)
    - `0x1e293b` → `color.bg.primary` (progress track)
    - `0x3b82f6` → `color.accent.blue` (progress fill blue)
    - `0x22c55e` → `color.status.success` (progress fill green)
    - `0xfbbf24` → `color.accent.gold` (progress fill yellow)
    - `0x94a3b8` → `color.text.secondary` (label)
    - `0x64748b` → `color.text.muted` (target text)
  - **MovesPanel.tsx** (233 lines, 11 colors):
    - `0x0f172a` → `color.bg.secondary` (panel bg)
    - `0x334155` → `color.bg.surface` (border, divider)
    - `0xef4444` → `color.status.danger` (danger border, moves text, flame ≥5)
    - `0xf97316` → `color.accent.orange` (flame 3-4)
    - `0xfbbf24` → `color.accent.gold` (flame 1-2, combo text)
    - `0xfef3c7` → keep as component-local `const FLAME_INNER = 0xfef3c7;` (flame inner glow, specific to flame drawing)
    - `0xffffff` → `color.text.primary` (moves number)
    - `0x94a3b8` → `color.text.secondary` (labels)
    - `0x64748b` → `color.text.muted` (inactive combo, max combo)

  **Must NOT do**:
  - Change score animation easing (easings.easeOut, duration 400)
  - Change flame drawing geometry (quadraticCurveTo paths)
  - Change danger pulse animation params
  - Change combo glow duration (150ms fadeIn, 350ms fadeOut)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/game/ScorePanel.tsx` — 174 lines, full file
  - `client/src/pixi/components/game/MovesPanel.tsx` — 233 lines, full file
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens

  **Acceptance Criteria**:
  - [ ] Both files import from `@/pixi/design/tokens`
  - [ ] Zero hardcoded `0x0f172a`, `0x334155`, `0x94a3b8` in either file
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(game): migrate ScorePanel and MovesPanel to V3 tokens`
  - Files: 2 files in `client/src/pixi/components/game/`

---

- [ ] 7. Migrate Game displays + Grid (LevelDisplay, NextLinePreview, GridBackground)

  **What to do**:
  - **LevelDisplay.tsx** (307 lines, 12 colors):
    - `0x1e293b` → `color.bg.primary` (badge bg)
    - `0x3b82f6` → `color.accent.blue` (badge border)
    - `0xffffff` → `color.text.primary` (text, highlight)
    - `0xfbbf24` → `color.accent.gold` (filled star)
    - `0x475569` → `color.state.hover` (empty star)
    - `0xfef3c7` → keep as component-local `const STAR_GLOW = 0xfef3c7;`
    - `0xfcd34d` → keep as component-local `const STAR_HIGHLIGHT = 0xfcd34d;`
    - `0x22c55e` → `color.status.success` (complete constraint bg)
    - `0x4ade80` → keep as component-local `const SUCCESS_BORDER = 0x4ade80;` (lighter success, not in tokens)
    - `0x374151` → keep as component-local `const INCOMPLETE_BG = 0x374151;`
    - `0x6b7280` → keep as component-local `const INCOMPLETE_BORDER = 0x6b7280;`
    - `0x94a3b8` → `color.text.secondary` (level label)
  - **NextLinePreview.tsx** (137 lines, 3 colors):
    - `0x0d1a2a` → `color.bg.secondary` (close enough — 0x0d1a2a vs 0x0f172a, standardize to token)
    - `0x334155` → `color.bg.surface` (border)
    - `0x64748b` → `color.text.muted` (NEXT label)
    - Keep `usePixiTheme()` + `getBlockColors()` for block rendering (theme-specific)
  - **GridBackground.tsx** (198 lines, 2 hardcoded colors):
    - `0x2E7D32` → keep as component-local `const FRAME_CAP_COLOR = 0x2E7D32;` (frame corner cap fill — theme-specific look, only in fallback path)
    - `0xef4444` → `color.status.danger` (danger glow filter color)
    - Keep ALL `usePixiTheme()` color references: `colors.gridBg`, `colors.gridCellAlt`, `colors.gridLines`, `colors.gridLinesAlpha`, `colors.frameBorder`, `colors.dangerZone`, `colors.dangerZoneAlpha`

  **Must NOT do**:
  - Change LevelDisplay star geometry (5-pointed star math)
  - Change NextLinePreview block rendering (PreviewBlock uses theme)
  - Change GridBackground grid line drawing logic
  - Remove ANY `usePixiTheme()` usage from GridBackground or NextLinePreview
  - Change GlowFilter parameters in GridBackground

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/game/LevelDisplay.tsx` — 307 lines, full file
  - `client/src/pixi/components/game/NextLinePreview.tsx` — 137 lines, full file
  - `client/src/pixi/components/GridBackground.tsx` — 198 lines, full file
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens

  **Acceptance Criteria**:
  - [ ] All 3 files import from `@/pixi/design/tokens`
  - [ ] GridBackground still imports and uses `usePixiTheme()`
  - [ ] NextLinePreview still imports and uses `usePixiTheme()` + `getBlockColors()`
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(game,grid): migrate LevelDisplay, NextLinePreview, GridBackground to V3 tokens`
  - Files: 3 files

---

### Wave 3: Containers + Modals

- [ ] 8. Migrate container components (HUDBar, ActionBar)

  **What to do**:
  - **HUDBar.tsx** (165 lines):
    - `0x1a2744` → `color.bg.primary` (fallback bg when no texture, line 92)
    - `0x334155` → `color.bg.surface` (fallback border, line 96)
    - Keep `usePixiTheme()` import — still used for `themeName` (asset resolution)
    - The fallback `g.fill({ color: 0x1a2744 })` path is only hit when barTex is null
  - **ActionBar.tsx** (131 lines):
    - Keep `usePixiTheme()` — used for `colors.actionBarBg`, `colors.hudBarBorder` (theme-tinted)
    - The theme-tinted colors in the procedural fallback path (when no barTex) should remain as `colors.actionBarBg` and `colors.hudBarBorder` — these are theme-specific
    - Only add token import if any non-themed hardcoded colors exist (review shows none beyond what theme provides)
    - If no changes needed, skip this file

  **Must NOT do**:
  - Remove `usePixiTheme()` from either file
  - Replace theme-specific `colors.hudBar` / `colors.actionBarBg` with uniform V3 tokens
  - Change layout calculations (padding, gap, button placement)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/hud/HUDBar.tsx:86-98` — drawBackground with fallback colors
  - `client/src/pixi/components/actionbar/ActionBar.tsx:82-92` — drawBackground with theme colors
  - `client/src/pixi/design/tokens.ts:97-103` — `color.bg` tokens

  **Acceptance Criteria**:
  - [ ] HUDBar.tsx: `0x1a2744` replaced with `color.bg.primary` in fallback path
  - [ ] ActionBar.tsx: theme colors preserved, minimal/no changes
  - [ ] Both still use `usePixiTheme()`
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(hud,actionbar): migrate HUDBar and ActionBar fallback colors to V3 tokens`
  - Files: `client/src/pixi/components/hud/HUDBar.tsx`, `client/src/pixi/components/actionbar/ActionBar.tsx`

---

- [ ] 9. Migrate Modals A (GameOverModal, LevelCompleteModal, VictoryModal)

  **What to do**:
  - Add `import { color } from '@/pixi/design/tokens';` to each file
  - **GameOverModal.tsx** (155 lines):
    - `0x94a3b8` → `color.text.secondary` (label)
    - `0xffffff` → `color.text.primary` (value)
    - `0xef4444` → `color.status.danger` (game over icon)
    - `0x1e293b` → `color.bg.primary` (stats box bg)
    - `0x334155` → `color.bg.surface` (stats box border)
    - `0xfbbf24` → `color.accent.gold` (cubes value)
    - `0x60a5fa` → `color.accent.blue` (combo value)
  - **LevelCompleteModal.tsx** (248 lines):
    - `0xffffff` → `color.text.primary` (text)
    - `0x94a3b8` → `color.text.secondary` (labels)
    - `0xfbbf24` → `color.accent.gold` (star fill, cube text)
    - `0xf59e0b` → keep as component-local `const STAR_STROKE = 0xf59e0b;`
    - `0x374151` → keep as component-local `const EMPTY_STAR_FILL = 0x374151;`
    - `0x4b5563` → keep as component-local `const EMPTY_STAR_STROKE = 0x4b5563;`
    - `0x1e293b` → `color.bg.primary` (stats box bg)
    - `0x334155` → `color.bg.surface` (stats box border)
    - `0x166534` → keep as component-local `const BONUS_BOX_BG = 0x166534;`
    - `0x22c55e` → `color.status.success` (bonus box border, bonus text)
  - **VictoryModal.tsx** (280 lines):
    - `0x1e293b` → `color.bg.primary` (stats box bg, trophy shapes)
    - `0xfbbf24` → `color.accent.gold` (stats box border, trophy circle, title text, cubes value, confetti color)
    - `0x22c55e` → `color.status.success` (confetti color)
    - `0x3b82f6` → `color.accent.blue` (confetti color)
    - `0xef4444` → `color.status.danger` (confetti color)
    - `0xa855f7` → keep as component-local (confetti color, purple)
    - `0xec4899` → keep as component-local (confetti color, pink)
    - `0x94a3b8` → `color.text.secondary` (labels)
    - `0xffffff` → `color.text.primary` (values)
    - `0x000000` → `color.bg.overlay` (drop shadow)

  **Must NOT do**:
  - Change LevelCompleteModal star animation timing (200ms, 500ms, 800ms delays)
  - Change VictoryModal confetti physics (vx, vy, rotation)
  - Change GameOverModal icon X-mark geometry
  - Change any PixiButton variant props

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 3 (Modal.tsx must be migrated first)

  **References**:
  - `client/src/pixi/components/modals/GameOverModal.tsx` — 155 lines
  - `client/src/pixi/components/modals/LevelCompleteModal.tsx` — 248 lines
  - `client/src/pixi/components/modals/VictoryModal.tsx` — 280 lines
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens

  **Acceptance Criteria**:
  - [ ] All 3 files import from `@/pixi/design/tokens`
  - [ ] Zero hardcoded `0x1e293b`, `0x334155`, `0x94a3b8` in any file
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(modals): migrate GameOver, LevelComplete, Victory modals to V3 tokens`
  - Files: 3 files in `client/src/pixi/components/modals/`

---

- [ ] 10. Migrate Modals B (MenuModal, InGameShopModal)

  **What to do**:
  - **MenuModal.tsx** (217 lines, 5 colors):
    - `0x94a3b8` → `color.text.secondary` (label color, line 66)
    - `0xffffff` → `color.text.primary` (value color, line 67)
    - `0xfbbf24` → `color.accent.gold` (cube color, line 68)
    - `0x1e293b` → `color.bg.primary` (info box bg, line 98)
    - `0x334155` → `color.bg.surface` (info box border, line 99)
  - **InGameShopModal.tsx** (366 lines, 5 colors as top-level constants):
    - `SECTION_BORDER = 0x334155` → `color.bg.surface` (line 27)
    - `GOLD = 0xfbbf24` → `color.accent.gold` (line 28)
    - `TEXT_DIM = 0x94a3b8` → `color.text.secondary` (line 29)
    - `0x1e293b` → `color.bg.primary` (cubes card bg, line 105; swap picker bg, line 138)
    - `0x0f172a` → `color.bg.secondary` (alloc row bg, line 126)
    - `0xffffff` → `color.text.primary` (bonus name, line 85)
    - `0xf97316` → `color.accent.orange` (unallocated charges text, line 93)

  **Must NOT do**:
  - Change MenuModal surrender confirmation flow
  - Change InGameShopModal dynamic section height calculations
  - Change any PixiButton variant props or onPress handlers

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 3

  **References**:
  - `client/src/pixi/components/modals/MenuModal.tsx` — 217 lines
  - `client/src/pixi/components/modals/InGameShopModal.tsx` — 366 lines
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens

  **Acceptance Criteria**:
  - [ ] Both files import from `@/pixi/design/tokens`
  - [ ] InGameShopModal top-level constants (SECTION_BORDER, GOLD, TEXT_DIM) replaced with token references
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(modals): migrate MenuModal and InGameShopModal to V3 tokens`
  - Files: 2 files in `client/src/pixi/components/modals/`

---

### Wave 4: Pages (most complex)

- [ ] 11. Migrate PlayScreen.tsx (757 lines — SkyBackground, HudPillButton, StatsBar, ProgressHudBar, wrapper)

  **What to do**:
  - Add `import { color } from '@/pixi/design/tokens';` at top of file
  - **Application wrapper** (line 744): Change `background={0xD0EAF8}` → `background={color.bg.secondary}` (0x0f172a dark)
  - **SkyBackground** (lines 58-89): Change gradient from light sky to dark V3:
    - Top color: `{ r: 0x0F, g: 0x17, b: 0x2A }` (color.bg.secondary = 0x0f172a)
    - Bottom color: `{ r: 0x1E, g: 0x29, b: 0x3B }` (color.bg.primary = 0x1e293b)
    - Keep texture fallback logic unchanged
  - **HudPillButton** (lines 93-122):
    - `0x333333` → `color.interactive.pillBg`
    - `0x555555` → `color.interactive.pillPressed`
  - **StatsBar** (lines 124-255):
    - Keep `usePixiTheme()` for `colors.hudBar`, `colors.hudBarBorder` (theme-tinted fallback)
    - `0xB8860B` → keep as component-local `const LEVEL_BADGE_FILL = 0xB8860B;` (specific gold, different from accent.gold)
    - `0xDAA520` → keep as component-local `const LEVEL_BADGE_STROKE = 0xDAA520;`
    - `0xffffff` → `color.text.primary` (level text, score text)
    - `0x94a3b8` → `color.text.secondary` (labels)
    - `0xef4444` → `color.status.danger` (danger moves text)
    - `0xfbbf24` → `color.accent.gold` (cube text, default combo)
    - `0xffd700` → keep as component-local `const COMBO_HIGH = 0xffd700;` (high combo gold shimmer)
    - `0xf97316` → `color.accent.orange` (medium combo)
  - **ProgressHudBar** (lines 257-365):
    - Keep `usePixiTheme()` for `colors.hudBar`, `colors.hudBarBorder`
    - `0x333333` → `color.interactive.pillBg` (progress track bg)
    - `0x22c55e` → `color.status.success` (complete fill)
    - `0x4ade80` → keep as component-local `const PROGRESS_NEAR = 0x4ade80;` (near-complete)
    - `0x3b82f6` → `color.accent.blue` (in-progress fill)
    - `0xfbbf24` → `color.accent.gold` (star filled)
    - `0x555555` → `color.interactive.pillPressed` (star empty)
  - **drawConstraintInline** (lines 367-399):
    - `0x22c55e` → `color.status.success` (satisfied dots/circle)
    - `0xf97316` → `color.accent.orange` (in-progress dots)
    - `0x555555` → `color.interactive.pillPressed` (empty dots/circle)
    - `0x14532d` → `color.status.successDark` (NoBonusUsed ok bg)
    - `0x7f1d1d` → `color.status.dangerDark` (NoBonusUsed fail bg)
    - `0x22c55e` → `color.status.success` (NoBonusUsed ok border)
    - `0xef4444` → `color.status.danger` (NoBonusUsed fail border)
  - **Danger border** (line 505): `0xef4444` → `color.status.danger`
  - **Status bubble** (lines 516-521):
    - `0x1f2937` → `color.bg.primary` (close enough — standardize to token)
    - `0x60a5fa` → `color.accent.blue` (bubble border)
  - **Loading styles** (lines 33-46):
    - `0xffffff` → `color.text.primary`
    - `0x94a3b8` → `color.text.secondary`
    - `0xfbbf24` → `color.accent.gold`
    - `0x000000` → `color.bg.overlay`

  **Must NOT do**:
  - Extract StatsBar, ProgressHudBar, SkyBackground, or HudPillButton to separate files
  - Change combo threshold values (5, 3 in StatsBar)
  - Change ProgressHudBar score progress thresholds (>= 1.0 green, > 0.7 near-green)
  - Change constraint dot sizing or spacing in drawConstraintInline
  - Change danger border width (4) or alpha (0.25)
  - Change status bubble dimensions (180x30, radius 12)
  - Change any animation parameters
  - Remove usePixiTheme() from StatsBar or ProgressHudBar

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 757-line file with 5 inline components and 25+ color replacements
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 12)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 13 (final audit)
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/pages/PlayScreen.tsx` — 757 lines, FULL FILE (read it completely)
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens
  - `client/src/pixi/components/hud/ConstraintIndicator.tsx:78-94` — same color semantics as drawConstraintInline (must match)

  **Acceptance Criteria**:
  - [ ] `Application background=` no longer contains `0xD0EAF8`
  - [ ] SkyBackground gradient uses dark V3 colors (0x0f172a → 0x1e293b)
  - [ ] Zero hardcoded `0x94a3b8`, `0x334155`, `0x22c55e`, `0xef4444`, `0x3b82f6` remaining
  - [ ] `usePixiTheme()` still present in StatsBar and ProgressHudBar
  - [ ] drawConstraintInline colors match ConstraintIndicator.tsx tokens
  - [ ] `cd client && pnpm build` → exit 0

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: PlayScreen compiles with all V3 token replacements
    Tool: Bash
    Steps:
      1. cd client && pnpm build
      2. Assert: exit code 0
      3. grep -c '0xD0EAF8' client/src/pixi/components/pages/PlayScreen.tsx
      4. Assert: count = 0 (light sky blue removed)
      5. grep -c 'design/tokens' client/src/pixi/components/pages/PlayScreen.tsx
      6. Assert: count >= 1 (import present)
      7. grep -c 'usePixiTheme' client/src/pixi/components/pages/PlayScreen.tsx
      8. Assert: count >= 2 (theme hooks preserved)
    Expected Result: PlayScreen fully migrated to dark V3 theme
  ```

  **Commit**: YES
  - Message: `style(playscreen): migrate PlayScreen and all inline components to V3 dark theme`
  - Files: `client/src/pixi/components/pages/PlayScreen.tsx`

---

- [ ] 12. Migrate LoadoutPage.tsx + PageTopBar.tsx

  **What to do**:
  - **PageTopBar.tsx** (181 lines):
    - `0xFFFFFF` → `color.text.primary` (title, balance text)
    - `0x94A3B8` → `color.text.secondary` (subtitle)
    - `0x000000` → `color.bg.overlay` (top bar bg)
    - `0x1e293b` → `color.bg.primary` (separator line)
    - `0x1E293B` → `color.bg.primary` (CubeBalanceDisplay bg)
    - `0x475569` → `color.state.hover` (CubeBalanceDisplay border)
  - **LoadoutPage.tsx** (585+ lines):
    - `0xffffff` → `color.text.primary` (slider value, section titles)
    - `0x000000` → `color.bg.overlay` (shadow, lock overlay)
    - `0x22c55e` → `color.status.success` (selected bonus bg)
    - `0x4ade80` → keep as component-local `const SELECTED_BORDER = 0x4ade80;`
    - `0x4b5563` → `color.state.disabled` (locked bonus bg)
    - `0x6b7280` → keep as component-local `const LOCKED_BORDER = 0x6b7280;`
    - `0x1e293b` → `color.bg.primary` (unselected bonus bg)
    - `0x475569` → `color.state.hover` (unselected bonus border)
    - `0x334155` → `color.bg.surface` (slider track)
    - `0x3b82f6` → `color.accent.blue` (slider fill)
    - `0x9ca3af` → keep as component-local `const LOCKED_TEXT = 0x9ca3af;`
    - Keep `usePixiTheme()` — used for themeName (bonus texture paths)

  **Must NOT do**:
  - Change LoadoutPage localStorage logic
  - Change CubeSlider drag behavior
  - Change BonusTile selection logic (3 max)
  - Change any PixiButton variant props
  - Remove usePixiTheme() from LoadoutPage

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: LoadoutPage is 585+ lines with interactive slider and bonus tiles
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 11)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 13
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pixi/components/pages/LoadoutPage.tsx` — 585+ lines
  - `client/src/pixi/components/pages/PageTopBar.tsx` — 181 lines
  - `client/src/pixi/design/tokens.ts:97-126` — V3 color tokens

  **Acceptance Criteria**:
  - [ ] Both files import from `@/pixi/design/tokens`
  - [ ] LoadoutPage still uses `usePixiTheme()` for texture paths
  - [ ] PageTopBar has zero hardcoded `0x1E293B`, `0x475569`, `0x94A3B8`
  - [ ] `cd client && pnpm build` → exit 0

  **Commit**: YES
  - Message: `style(pages): migrate LoadoutPage and PageTopBar to V3 tokens`
  - Files: 2 files in `client/src/pixi/components/pages/`

---

- [ ] 13. Final grep audit + full build verification

  **What to do**:
  - Run comprehensive grep to find any remaining hardcoded hex values that should be tokens
  - Verify all imports are clean
  - Run full build
  - Generate summary report

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`pixi-js`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (final step)
  - **Parallel Group**: Sequential (after all others)
  - **Blocks**: None
  - **Blocked By**: Tasks 1-12

  **Acceptance Criteria**:
  - [ ] `cd client && pnpm build` → exit 0
  - [ ] `grep -rn '0x0f172a\|0x334155\|0x94a3b8\|0xfbbf24\|0x22c55e\|0xef4444\|0x3b82f6\|0x1e293b\|0x64748b\|0x475569' client/src/pixi/components/ --include='*.tsx' | grep -v 'import' | grep -v 'const.*=' | grep -v '//'` → zero matches (all UI chrome colors use tokens)
  - [ ] `grep -rn "from.*design/tokens" client/src/pixi/components/ --include='*.tsx' | wc -l` → >= 25 files have token imports
  - [ ] `grep -rn "usePixiTheme" client/src/pixi/components/ --include='*.tsx' | wc -l` → >= 6 (theme hooks preserved where needed)
  - [ ] If any remaining hardcoded colors found that should be tokens: fix them in-place

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Complete migration audit passes
    Tool: Bash
    Steps:
      1. cd client && pnpm build
      2. Assert: exit code 0 (clean build)
      3. Run grep audit for common UI hex values
      4. Assert: zero matches outside tokens.ts
      5. Count token imports across components
      6. Assert: >= 25 files import from design/tokens
      7. Verify usePixiTheme preserved in key files
      8. Assert: GridBackground, ActionBar, HUDBar, NextLinePreview, BonusButton, PlayScreen all still use it
    Expected Result: All V3 migration complete, build clean, theme system intact
  ```

  **Commit**: YES (if fixes needed)
  - Message: `style: final V3 token migration cleanup`
  - Files: any remaining files with missed colors

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `style(tokens): add missing semantic colors for V3 migration` | tokens.ts | `pnpm build` |
| 2 | `style(effects,background): migrate ScorePopup and ThemeBackground to V3 tokens` | 2 files | `pnpm build` |
| 3 | `style(modal): migrate shared Modal component to V3 tokens` | Modal.tsx | `pnpm build` |
| 4 | `style(hud): migrate LevelBadge, ProgressBar, MovesCounter, ConstraintIndicator to V3 tokens` | 4 files | `pnpm build` |
| 5 | `style(actionbar): migrate BonusButton, ComboDisplay, StarRating to V3 tokens` | 3 files | `pnpm build` |
| 6 | `style(game): migrate ScorePanel and MovesPanel to V3 tokens` | 2 files | `pnpm build` |
| 7 | `style(game,grid): migrate LevelDisplay, NextLinePreview, GridBackground to V3 tokens` | 3 files | `pnpm build` |
| 8 | `style(hud,actionbar): migrate HUDBar and ActionBar fallback colors to V3 tokens` | 2 files | `pnpm build` |
| 9 | `style(modals): migrate GameOver, LevelComplete, Victory modals to V3 tokens` | 3 files | `pnpm build` |
| 10 | `style(modals): migrate MenuModal and InGameShopModal to V3 tokens` | 2 files | `pnpm build` |
| 11 | `style(playscreen): migrate PlayScreen and all inline components to V3 dark theme` | PlayScreen.tsx | `pnpm build` |
| 12 | `style(pages): migrate LoadoutPage and PageTopBar to V3 tokens` | 2 files | `pnpm build` |
| 13 | `style: final V3 token migration cleanup` | any remaining | `pnpm build` + grep audit |

---

## Success Criteria

### Verification Commands
```bash
cd client && pnpm build              # Expected: exit 0
grep -rn 'design/tokens' client/src/pixi/components/ --include='*.tsx' | wc -l  # Expected: >= 25
grep -rn 'usePixiTheme' client/src/pixi/components/ --include='*.tsx' | wc -l   # Expected: >= 6
```

### Final Checklist
- [ ] All "Must Have" items present (V3 tokens in all UI chrome, dark PlayScreen background)
- [ ] All "Must NOT Have" items absent (no font renames, no component extraction, no theme system changes)
- [ ] Build passes (`pnpm build` → exit 0)
- [ ] Grep audit clean (zero UI-chrome hex values outside token imports)
- [ ] Theme system intact (`usePixiTheme()` preserved in GridBackground, ActionBar, HUDBar, NextLinePreview, BonusButton, PlayScreen)
