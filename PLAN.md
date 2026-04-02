# UX Flow & Layout Overhaul — Implementation Plan

## Overview

Major UX overhaul of the zKube client (`client-budokan/` only). This changes **flow and layout** — not the design system (fonts, colors, themes, cards stay). Key changes: remove "ON-CHAIN PUZZLE" subtitle & enlarge logo, add per-theme background images on home, replace the Map tab with a "My Games" tab, introduce a mutator dice-roll reveal page in the new-game flow, fix grid proportions (revert to width-only sizing), add a GameActionBar with bonus slots during gameplay, and hide the BottomTabBar during play.

**Contracts are READ-ONLY. All changes in `client-budokan/`.**

## Goals

- Restore grid proportions to budokan-quality sizing (width-only ResizeObserver)
- Replace Map tab with "My Games" showing all owned games (active + completed)
- Implement new-game flow: mint → loading → mutator reveal → map → play
- Add GameActionBar during gameplay with 3 bonus slots + map + surrender
- Hide BottomTabBar and weird top bar during gameplay
- Use per-theme `background.png` images on HomePage
- Make logo bigger, remove "ON-CHAIN PUZZLE" subtitle

## Non-Goals

- **No design system changes** — fonts, colors, themes, cards, gradients all stay
- **No contract changes** — all work in `client-budokan/` only
- **No new data hooks** — `useGameTokensSlot`, `useZoneProgress`, `useZStarBalance` already exist
- **No new game logic** — move/bonus/surrender system calls already exist in `systems.ts`
- **No quest/achievement UI** — deferred
- **No cosmetic shop** — deferred

## Assumptions and Constraints

- **Background images exist**: All 10 themes have `/public/assets/theme-N/background.png` (confirmed)
- **Mutator definitions hardcoded**: Only 2 mutators exist (Tidecaller ID 1, Riptide ID 2). Hardcode in client config rather than syncing MutatorDef model from contract
- **Bonus data in run_data**: Bits 101-117 of `run_data` contain `mode`, `bonus_type`, `bonus_charges`, `level_lines_cleared`, `bonus_slot` — but `runDataPacking.ts` currently only unpacks bits 0-100. Must extend.
- **`useGameTokensSlot` returns all needed data** for My Games page (token_id, score, game_over, metadata with level)
- **`actionbar/` directory exists but is empty** — ready for GameActionBar component
- **BossRevealPage is the structural template** for MutatorRevealPage

## Requirements

### Functional

- **F1**: HomePage shows larger logo (h-28+), no "ON-CHAIN PUZZLE" subtitle, per-theme background image
- **F2**: Bottom tab bar reads: Home | My Games | Profile | Ranks | Settings
- **F3**: My Games page lists all owned game NFTs (active at top, completed below), click to resume
- **F4**: New game flow: mint → loading screen → mutator dice reveal → navigate to map → play
- **F5**: PlayScreen has no BottomTabBar, no redundant top bar; uses GameActionBar at bottom
- **F6**: GameActionBar shows: Map button | 3 bonus slots (type + charges) | Surrender | Settings
- **F7**: Grid sizing uses width-only constraint (remove height-based `Math.min`), cells 28-64px
- **F8**: Map page is accessed from GameActionBar (in-game), not from tab bar
- **F9**: Compact HUD: single-row Level + Score + Combo + Constraints + Moves

### Non-Functional

- **NF1**: `pnpm build` succeeds with zero TypeScript errors
- **NF2**: `pnpm test` passes all existing + new tests
- **NF3**: Page transitions remain smooth (≤150ms with existing AnimatePresence)
- **NF4**: Grid renders at ≥40px cell size on iPhone SE (375px width)

---

## Technical Design

### Navigation Architecture Change

```
CURRENT TABS:  Home | Map     | Profile | Ranks | Settings
NEW TABS:      Home | MyGames | Profile | Ranks | Settings

CURRENT OVERLAYS (full-screen, hide tabs): play | daily | boss
NEW OVERLAYS:   play | daily | boss | mutator-reveal

CURRENT FLOW:
  Home → [NEW GAME] → Map (tab) → Play

NEW FLOW:
  Home → [NEW GAME] → Loading → MutatorReveal → Map (in-game overlay) → Play
  Home → MyGames (tab) → [tap game card] → Map (in-game overlay) → Play
```

### Type Changes (`navigationStore.ts`)

```typescript
// BEFORE
export type TabId = "home" | "map" | "profile" | "ranks" | "settings";
export type OverlayId = "play" | "daily" | "boss";

// AFTER
export type TabId = "home" | "mygames" | "profile" | "ranks" | "settings";
export type OverlayId = "play" | "daily" | "boss" | "mutator-reveal";
```

### RunData Extension (`runDataPacking.ts`)

```
Add bits 101-117 to RunData interface:
  mode: boolean           (bit 101, 0=Map, 1=Endless)
  bonusType: number       (bits 102-103, 0=None, 1=Hammer, 2=Totem, 3=Wave)
  bonusCharges: number    (bits 104-107, 0-15)
  levelLinesCleared: number (bits 108-115, 0-255)
  bonusSlot: number       (bits 116-117, 0-2)
```

### Mutator Config (client-side)

```typescript
// New file: src/config/mutators.ts
export interface MutatorDisplay {
  id: number;
  name: string;
  description: string;
  icon: string;     // emoji or asset path
  effect: string;   // e.g. "+2 lines per clear"
  color: string;    // accent color for the reveal
}

export const MUTATOR_DEFS: Record<number, MutatorDisplay> = {
  1: {
    id: 1,
    name: "Tidecaller",
    description: "The ocean surges with every line you clear",
    icon: "🌊",
    effect: "+2 bonus lines per clear",
    color: "#2ECFB0",
  },
  2: {
    id: 2,
    name: "Riptide",
    description: "Combo chains pull in devastating power",
    icon: "🌀",
    effect: "1.5× combo score, 1.3× endless ramp",
    color: "#7EC8E3",
  },
};
```

### PlayScreen Layout (New)

```
┌─────────────────────────────────────┐
│ [← Back]  Lv.X · Score   [⚙]      │  Top bar (h-11, minimal)
├─────────────────────────────────────┤
│ [LV.X ★★★] [MOVES 3/12] [SCORE    │  Compact HUD (single row)
│  120/200]  [COMBO x3]  [Constraint]│
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────┐             │
│         │  8×10 GRID  │             │  Grid (width-only sizing)
│         │  (BIGGER!)  │             │
│         └─────────────┘             │
│         NEXT: [■][■][□][■]...      │  Next row preview
│         ← Swipe to align →         │
│                                     │
├─────────────────────────────────────┤
│ [🗺] │ [⚡1] [🔨2] [🌊0] │ [🏳] [⚙]│  GameActionBar (h-14)
└─────────────────────────────────────┘
  Map    Bonus slots        Surrender
         (type + charges)   Settings
```

### MyGamesPage Layout

```
┌─────────────────────────────────────┐
│  MY GAMES                           │  Header
├─────────────────────────────────────┤
│  Active (2)                         │  Section header
│  ┌─────────────────────────────────┐│
│  │ Game #142  Lv.7  Score: 1240   ││  Game card (active)
│  │ Polynesian · Map Mode    [→]   ││  Click → navigate to map
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ Game #138  Lv.3  Score: 420    ││
│  │ Norse · Endless Mode     [→]   ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  Completed (5)                      │  Section header
│  ┌─────────────────────────────────┐│
│  │ Game #130  Final: 3200  ★★★    ││  Game card (completed)
│  │ Polynesian · Zone Cleared      ││  Dimmed, non-interactive
│  └─────────────────────────────────┘│
│  ...                                │
└─────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 0: Foundation (Serial — Must Complete First)

**Prerequisite for**: All subsequent phases.
**Estimated complexity**: Low-medium. Type changes + new file stubs.

| Task | Description | Files | Output | Test |
|------|-------------|-------|--------|------|
| 0.1 | Update `TabId` and `OverlayId` types. Change `"map"` → `"mygames"` in TabId. Add `"mutator-reveal"` to OverlayId. Update `FULLSCREEN_PAGES` to include `"mutator-reveal"`. Update `getBackTarget()`: `play → mygames`, `mutator-reveal → mygames`, `boss → mygames`. | `stores/navigationStore.ts` | Updated types + back navigation | `pnpm build` succeeds |
| 0.2 | Update `BottomTabBar.tsx`: change Map tab to My Games (`{ id: "mygames", icon: "◫", label: "My Games" }`). | `ui/components/BottomTabBar.tsx` | Tab bar shows My Games | Visual: tab bar renders 5 tabs with "My Games" |
| 0.3 | Create shell pages: `MyGamesPage.tsx` (renders "My Games — coming soon"), `MutatorRevealPage.tsx` (renders "Mutator Reveal — coming soon"). | `ui/pages/MyGamesPage.tsx`, `ui/pages/MutatorRevealPage.tsx` | Two new page files | `pnpm build` succeeds |
| 0.4 | Update `App.tsx` page registry: import new pages, replace `map: <MapPage />` with `mygames: <MyGamesPage />`, add `"mutator-reveal": <MutatorRevealPage />`. Keep MapPage import (used as in-game overlay later). | `App.tsx` | All pages routable | Navigate to My Games tab works |
| 0.5 | Extend `runDataPacking.ts`: add `mode` (bit 101), `bonusType` (102-103), `bonusCharges` (104-107), `levelLinesCleared` (108-115), `bonusSlot` (116-117) to `RunData` interface and `unpackRunData()`. Add corresponding getters to `Game` class. | `dojo/game/helpers/runDataPacking.ts`, `dojo/game/models/game.ts` | Bonus data accessible via `game.bonusType`, `game.bonusCharges`, `game.bonusSlot` | Unit test: `unpackRunData` with known packed value returns correct bonus fields |
| 0.6 | Create `config/mutators.ts` with `MUTATOR_DEFS` record and `getMutatorDisplay(id)` function. | `config/mutators.ts` | Mutator display data | `pnpm build` succeeds |
| 0.7 | Create empty `GameActionBar.tsx` in `ui/components/actionbar/`. Renders placeholder text for now. | `ui/components/actionbar/GameActionBar.tsx` | File exists, exports component | `pnpm build` succeeds |

**Unit Tests for 0.5** (TDD — write first in `src/test/runDataPacking.test.ts`):
```typescript
describe("unpackRunData bonus fields", () => {
  it("extracts mode from bit 101", () => {
    const packed = 1n << 101n;
    expect(unpackRunData(packed).mode).toBe(true); // Endless
  });

  it("extracts bonusType from bits 102-103", () => {
    const packed = 2n << 102n; // Totem
    expect(unpackRunData(packed).bonusType).toBe(2);
  });

  it("extracts bonusCharges from bits 104-107", () => {
    const packed = 5n << 104n; // 5 charges
    expect(unpackRunData(packed).bonusCharges).toBe(5);
  });

  it("extracts bonusSlot from bits 116-117", () => {
    const packed = 2n << 116n; // slot 2
    expect(unpackRunData(packed).bonusSlot).toBe(2);
  });

  it("extracts all bonus fields from combined packed value", () => {
    // level=3, bonusType=1(Hammer), bonusCharges=3, bonusSlot=1
    const packed = 3n | (1n << 102n) | (3n << 104n) | (1n << 116n);
    const rd = unpackRunData(packed);
    expect(rd.currentLevel).toBe(3);
    expect(rd.bonusType).toBe(1);
    expect(rd.bonusCharges).toBe(3);
    expect(rd.bonusSlot).toBe(1);
  });
});
```

**Commit**: `feat: navigation foundation — update types, add page shells, extend runData with bonus fields`

---

### Phase 1: Parallel Workstreams (after Phase 0)

#### Workstream A: HomePage Overhaul
**Dependencies**: Phase 0.1 (navigation types), 0.4 (App routing)
**Can parallelize with**: Workstreams B, C, D

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| A.1 | Remove `ON-CHAIN PUZZLE` subtitle text (line 149 in current HomePage). Make logo bigger: `h-20` → `h-28 md:h-32`. | `ui/pages/HomePage.tsx` | Logo larger, no subtitle |
| A.2 | Add per-theme background image to HomePage. Use `getThemeImages(themeId).background` as a full-bleed background behind the content, with a dark overlay gradient for text readability. The gradient overlay preserves the existing color feel while adding visual depth. | `ui/pages/HomePage.tsx` | Background image visible behind content |
| A.3 | Update `handleStartGame()` flow: after `create()`, navigate to `"mutator-reveal"` instead of `"map"`. The mutator reveal page will then navigate to map. | `ui/pages/HomePage.tsx` | New game → mutator reveal page |
| A.4 | Remove "CONTINUE" button logic from HomePage. Multi-game management moves to My Games page. Keep the "NEW GAME" button. | `ui/pages/HomePage.tsx` | No continue button, cleaner home |

**Commit**: `feat: HomePage — bigger logo, theme bg image, remove subtitle, update game flow`

#### Workstream B: MyGamesPage
**Dependencies**: Phase 0.1, 0.3 (shell page), 0.4 (routing)
**Can parallelize with**: Workstreams A, C, D

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| B.1 | Implement `MyGamesPage.tsx`: use `useGameTokensSlot` to fetch all owned games. Split into "Active" and "Completed" sections. Each card shows: game name, level, score, zone icon, mode (Map/Endless). Active games have a click handler → `navigate("map", tokenId)`. | `ui/pages/MyGamesPage.tsx` | Full game list with sections |
| B.2 | Add pull-to-refresh via `refetch()` from `useGameTokensSlot`. Show loading skeleton while fetching. Empty state: "No games yet — start one from Home!" | `ui/pages/MyGamesPage.tsx` | Loading + empty states |
| B.3 | Parse `metadata` JSON from `SlotGameTokenData` to extract level, score, zone attributes for display. Use `unpackRunData` for additional data if `run_data` is available via RECS. | `ui/pages/MyGamesPage.tsx` | Rich game card data |

**Card Component Structure**:
```tsx
// Each game card
<button onClick={() => navigate("map", game.token_id)}>
  <div className="flex items-center gap-3">
    <img src={getThemeImages(getThemeId(zoneId)).themeIcon} className="h-10 w-10" />
    <div>
      <p>Game #{tokenId}</p>
      <p>Lv.{level} · Score: {score}</p>
      <p>{zoneName} · {mode === 0 ? "Map" : "Endless"}</p>
    </div>
    {!game_over && <span>→</span>}
  </div>
</button>
```

**Commit**: `feat: MyGamesPage — list owned games with active/completed sections`

#### Workstream C: MutatorRevealPage
**Dependencies**: Phase 0.1, 0.3, 0.5 (runData extension), 0.6 (mutator config)
**Can parallelize with**: Workstreams A, B, D

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| C.1 | Implement `MutatorRevealPage.tsx` following BossRevealPage pattern. Read `game.mutatorMask` via `useGame()`. Look up mutator display from `MUTATOR_DEFS`. | `ui/pages/MutatorRevealPage.tsx` | Shows mutator name + description |
| C.2 | Add entrance animation: icon slides up with spring, text fades in staggered, particle burst via ConfettiExplosion on reveal. Use `motion/react` for all animations. Play `"start"` SFX on mount. | `ui/pages/MutatorRevealPage.tsx` | Animated reveal sequence |
| C.3 | Add "CONTINUE TO MAP" button that navigates to `"map"` with `gameId`. Handle edge case: `mutatorMask === 0` (no mutator) — show "No mutator this run" with quick auto-advance (2s delay then navigate). | `ui/pages/MutatorRevealPage.tsx` | Navigation to map works |
| C.4 | Add loading state: show spinner until `seed !== 0n` (game synced from Torii). This replaces the separate loading screen — the mutator reveal page IS the loading screen with a reveal at the end. | `ui/pages/MutatorRevealPage.tsx` | Loading → reveal transition |

**Page Structure** (following BossRevealPage pattern at `ui/pages/BossRevealPage.tsx`):
```tsx
<div className="relative flex h-full min-h-0 flex-col px-5 py-4">
  <BackButton />
  <div className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center">
    {isLoading ? (
      <LoadingSpinner />
    ) : (
      <>
        <MutatorIcon />        {/* Animated icon with glow */}
        <MutatorLabel />       {/* "MUTATOR DRAWN" */}
        <MutatorName />        {/* e.g. "Tidecaller" */}
        <MutatorDescription /> {/* Effect description */}
        <EffectCard />         {/* "+2 lines per clear" */}
        <ContinueButton />     {/* "CONTINUE TO MAP" */}
      </>
    )}
  </div>
</div>
```

**Commit**: `feat: MutatorRevealPage — animated mutator reveal with loading state`

#### Workstream D: GameActionBar + Grid Fix
**Dependencies**: Phase 0.5 (bonus data), 0.7 (shell component)
**Can parallelize with**: Workstreams A, B, C

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| D.1 | Implement `GameActionBar.tsx`: bottom bar with Map icon, divider, 3 bonus slots, divider, Surrender icon, Settings icon. Each bonus slot shows type icon + charge count badge. Use theme colors throughout. | `ui/components/actionbar/GameActionBar.tsx` | Functional action bar |
| D.2 | Fix grid sizing in `GameBoard.tsx`: remove `heightBasedSize` from `Math.min()`. Use width-only: `setGridSize(Math.max(28, Math.min(widthBasedSize, 64)))`. Increase max from 56→64. Remove `ROWS + 1.5` height calculation entirely. | `ui/components/GameBoard.tsx` | Bigger grid, width-only sizing |
| D.3 | Create bonus type icons/display helper. Map `bonusType` (0-3) to icon + label: 0=None, 1=Hammer (🔨), 2=Totem (🗿), 3=Wave (🌊). | `config/bonuses.ts` | Bonus display config |

**GameActionBar Component**:
```tsx
interface GameActionBarProps {
  onMapPress: () => void;
  onSurrender: () => void;
  onSettings: () => void;
  onBonusActivate: (slotIndex: number) => void;
  bonusType: number;       // 0=None, 1=Hammer, 2=Totem, 3=Wave
  bonusCharges: number;    // 0-15
  bonusSlot: number;       // active slot 0-2
  colors: ThemeColors;
}

// Renders:
// [🗺 Map] | [Bonus1] [Bonus2] [Bonus3] | [🏳 Surrender] [⚙]
```

**Grid Fix Detail**:
```typescript
// BEFORE (GameBoard.tsx line 40-46):
const widthBasedSize = Math.floor((w - padding) / COLS);
const heightBasedSize = h > 0 ? Math.floor((h - padding) / (ROWS + 1.5)) : widthBasedSize;
setGridSize(Math.max(28, Math.min(widthBasedSize, heightBasedSize, 56)));

// AFTER:
const widthBasedSize = Math.floor((w - padding) / COLS);
setGridSize(Math.max(28, Math.min(widthBasedSize, 64)));
```

**Commit**: `feat: GameActionBar with bonus slots, fix grid sizing to width-only`

---

### Phase 2: Integration (after all Phase 1 workstreams)

**Dependencies**: Workstreams A, B, C, D all complete

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| 2.1 | Integrate GameActionBar into PlayScreen. Remove the current top-bar duplication. Keep minimal top bar (back + level + score + settings). Add GameActionBar at bottom. Wire bonus activation to `applyBonus` system call. Wire Map button to `navigate("map")`. Wire Surrender. | `ui/pages/PlayScreen.tsx` | Action bar visible during gameplay |
| 2.2 | Move Settings dialog OUT of PlayScreen top bar and INTO GameActionBar's settings button. Remove duplicate settings UI. | `ui/pages/PlayScreen.tsx` | Single settings access point |
| 2.3 | Update MapPage to work as in-game overlay (accessed from GameActionBar). Ensure `goBack()` from map returns to `"play"` (not `"mygames"`). Add conditional back target: if previous page was `"play"`, go back to `"play"` with same gameId. | `stores/navigationStore.ts`, `ui/pages/MapPage.tsx` | Map accessible from gameplay |
| 2.4 | Wire `game.bonusType`, `game.bonusCharges`, `game.bonusSlot` from `useGame()` into GameActionBar props in PlayScreen. | `ui/pages/PlayScreen.tsx` | Live bonus data in action bar |
| 2.5 | Compact GameHud to single row: remove the constraint sub-section, move constraint progress into inline badges next to score/moves. Level badge + Stars + Moves counter + Score bar + Combo badge + Constraint indicators — all in one row. | `ui/components/hud/GameHud.tsx` | Compact single-row HUD |
| 2.6 | Fix `getBackTarget()` for new flow. Map navigated from play should go back to play. Map navigated from mygames should go back to mygames. Use `previousPage` to determine context. | `stores/navigationStore.ts` | Context-aware back navigation |

**Updated `getBackTarget` logic**:
```typescript
const getBackTarget = (page: PageId, previous: PageId | null): PageId => {
  switch (page) {
    case "play":
      return "mygames";           // Play → My Games
    case "daily":
      return "home";
    case "boss":
      return "map";
    case "mutator-reveal":
      return "mygames";           // Cancel mutator → My Games
    case "map":
      return previous === "play" ? "play" : "mygames"; // Context-aware
    default:
      return "home";
  }
};
```

**Commit**: `feat: integrate GameActionBar into PlayScreen, compact HUD, context-aware map navigation`

---

### Phase 3: Polish & QA (after Phase 2)

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| 3.1 | Full flow test: Home → New Game → MutatorReveal (loading+reveal) → Map → Play (with action bar + bonus slots) → Surrender → My Games. Verify all transitions work. | All pages | End-to-end flow works |
| 3.2 | Full flow test: My Games → tap active game → Map → Play → Game Over → dialog → My Games. Verify completed games appear in My Games. | All pages | Resume flow works |
| 3.3 | Grid proportion test: verify cell size ≥40px on 375px viewport (iPhone SE). Verify grid fills ~70% of screen height. Compare before/after screenshots. | `GameBoard.tsx` | Grid visually improved |
| 3.4 | Clean up dead code: remove any remaining references to `"map"` as TabId. Remove CONTINUE button remnants from HomePage. | Multiple files | No dead code |
| 3.5 | Update `CLAUDE.md` navigation section and CLAUDE.md with new page types and flow. | `client-budokan/CLAUDE.md` | Docs updated |

**Commit**: `chore: QA polish, dead code cleanup, update documentation`

---

## Testing and Validation

### Unit Tests (TDD)

| Test File | Tests | Coverage |
|---|---|---|
| `src/test/runDataPacking.test.ts` | 5 new tests: mode, bonusType, bonusCharges, bonusSlot, combined | `unpackRunData()` bonus fields |

### Build Verification

```bash
cd client-budokan && pnpm build
```
Must complete with zero TypeScript errors.

### Test Execution

```bash
cd client-budokan && pnpm test
```
Must pass all tests (existing + new runData tests).

### Manual Flow Verification (agent-executable via Playwright)

**Flow 1: New Game**
1. Navigate to `https://localhost:5125`
2. Verify HomePage shows large logo, no "ON-CHAIN PUZZLE" text
3. Verify background image is visible behind content
4. Verify BottomTabBar shows: Home | My Games | Profile | Ranks | Settings
5. Click "NEW GAME" → verify MutatorRevealPage shows loading then mutator
6. Click "CONTINUE TO MAP" → verify MapPage renders with level nodes
7. Click current level → verify BottomSheetPreview shows
8. Click "PLAY" → verify PlayScreen renders with GameActionBar at bottom
9. Verify grid cells are visibly larger than before (≥40px)
10. Verify GameActionBar shows bonus slots with type icons
11. Verify no BottomTabBar visible during gameplay

**Flow 2: My Games**
1. Click "My Games" tab → verify page shows game list
2. Verify active games at top, completed games below
3. Click active game card → verify navigates to MapPage
4. Click back → verify returns to My Games

**Flow 3: In-Game Map**
1. During gameplay, click Map icon in GameActionBar
2. Verify MapPage shows
3. Click back → verify returns to PlayScreen (not My Games)

---

## Verification Checklist

- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm test` passes all tests
- [ ] `TabId` type no longer includes `"map"`, includes `"mygames"`
- [ ] `OverlayId` type includes `"mutator-reveal"`
- [ ] BottomTabBar shows "My Games" (not "Map")
- [ ] HomePage: no "ON-CHAIN PUZZLE" text visible
- [ ] HomePage: logo is h-28+ (not h-20)
- [ ] HomePage: background image from theme visible
- [ ] MyGamesPage: shows active + completed game sections
- [ ] MutatorRevealPage: shows loading then mutator animation
- [ ] PlayScreen: GameActionBar visible at bottom
- [ ] PlayScreen: no BottomTabBar visible
- [ ] PlayScreen: grid cells are ≥40px on 375px viewport
- [ ] GameActionBar: shows bonus type + charges
- [ ] Map accessible from GameActionBar during gameplay
- [ ] Back from in-game map returns to PlayScreen
- [ ] `runDataPacking.ts` unpacks `bonusType`, `bonusCharges`, `bonusSlot`
- [ ] `Game` class has `bonusType`, `bonusCharges`, `bonusSlot` getters

---

## Commit Strategy (Atomic)

| # | Commit Message | Scope | Depends On |
|---|---|---|---|
| 1 | `feat: navigation foundation — update types, add page shells, extend runData with bonus fields` | Phase 0 (all) | — |
| 2 | `feat: HomePage — bigger logo, theme bg image, remove subtitle, update game flow` | Workstream A | #1 |
| 3 | `feat: MyGamesPage — list owned games with active/completed sections` | Workstream B | #1 |
| 4 | `feat: MutatorRevealPage — animated mutator reveal with loading state` | Workstream C | #1 |
| 5 | `feat: GameActionBar with bonus slots, fix grid sizing to width-only` | Workstream D | #1 |
| 6 | `feat: integrate GameActionBar into PlayScreen, compact HUD, context-aware map navigation` | Phase 2 | #2, #3, #4, #5 |
| 7 | `chore: QA polish, dead code cleanup, update documentation` | Phase 3 | #6 |

Commits 2, 3, 4, 5 can be executed **in parallel** after commit 1. Commits 6-7 are serial.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MapPage used as both tab and overlay causes dual-rendering bugs | Medium | Medium | MapPage already renders correctly as standalone page. The change is where it's accessed from (GameActionBar vs tab), not how it renders. Back navigation uses `previousPage` for context. |
| Grid width-only sizing causes overflow on very short viewports (landscape) | Low | Medium | Keep `max-h` constraint on grid container. On landscape, grid will be smaller but correct. Test on 320px height. |
| `runDataPacking` bit positions don't match contract after recent changes | Medium | High | Compare with Cairo `RunDataBits` in `contracts/src/helpers/packing.cairo`. Cross-check with deployed game data. |
| `useGameTokensSlot` returns stale data (game finished but still shows active) | Low | Low | Already polls via `refreshTrigger`. Add refetch on page focus. |
| Mutator reveal blocks gameplay if seed takes too long to sync | Medium | Medium | 5s timeout auto-advances to map. Loading spinner shown. User can press back to cancel. |
| Bonus type/charges show 0 for games created before bonus system | High | Low | Handle gracefully: hide bonus slots when `bonusType === 0`. Show "No bonus this run" state. |

---

## Open Questions

- [ ] **RunData bit positions**: Verify bits 101-117 match the current Cairo contract. The CLAUDE.md layout may have shifted if new fields were added. Cross-check with `contracts/src/helpers/packing.cairo`.
- [ ] **Bonus activation flow**: Does `applyBonus` system call need rowIndex/lineIndex? If so, bonus activation from GameActionBar needs to enter a "targeting mode" before applying. This may need a follow-up task.
- [ ] **Background image quality**: The 10 `background.png` files are 1.3-1.6MB each. Consider generating WebP versions or adding lazy loading to avoid slow home page loads on mobile.

---

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Hardcode mutator definitions (MUTATOR_DEFS) rather than syncing MutatorDef model from Torii | Only 2 mutators exist. Adding RECS model sync adds complexity and sync delay for minimal benefit. Easy to extend later. | Add MutatorDef to contractModels.ts + setup.ts — overkill for 2 items |
| MutatorRevealPage doubles as loading screen | Avoids a separate loading page. User sees something interesting while game syncs. Reduces total page count. | Separate Loading → MutatorReveal — extra page transition |
| MapPage stays as shared component, not duplicated | Map renders identically whether accessed from GameActionBar or My Games. Only the back-navigation target differs, handled by `previousPage` context. | Duplicate MapPage for in-game vs standalone — unnecessary code duplication |
| Width-only grid sizing (remove height constraint) | The height constraint is the root cause of the "grid SUCKS" complaint. Budokan used width-only and it worked. Height overflow handled by scroll/clamp on the container. | Adjust height divisor (e.g. ROWS + 0.5) — half-measure, still constrains grid |
| Keep existing Map tab page as an overlay accessed from gameplay | User explicitly wants map as in-game view (from action bar), not as a persistent tab. "My Games" replaces it in the tab bar. | Keep map as tab AND in-game overlay — confusing dual access, user explicitly rejected map tab |
| Extend RunData with bonus fields rather than reading them separately | Bonus data is packed in the same `run_data` felt252. Unpacking it at the same time is natural, efficient, and consistent. | Separate `useBonusData` hook — unnecessary indirection |

---

## File Reference Summary

### Files to MODIFY

| File | Changes |
|------|---------|
| `stores/navigationStore.ts` | TabId: map→mygames, OverlayId: +mutator-reveal, getBackTarget context-aware |
| `App.tsx` | Import new pages, update pageComponents record |
| `ui/components/BottomTabBar.tsx` | Map tab → My Games tab |
| `ui/pages/HomePage.tsx` | Logo bigger, remove subtitle, bg image, flow to mutator-reveal |
| `ui/pages/PlayScreen.tsx` | Integrate GameActionBar, remove top-bar duplication, wire bonus data |
| `ui/components/GameBoard.tsx` | Width-only grid sizing, increase max cell size |
| `ui/components/hud/GameHud.tsx` | Compact single-row layout |
| `ui/pages/MapPage.tsx` | Context-aware back navigation |
| `dojo/game/helpers/runDataPacking.ts` | Extend RunData with bonus fields (bits 101-117) |
| `dojo/game/models/game.ts` | Add bonusType, bonusCharges, bonusSlot getters |

### Files to CREATE

| File | Purpose |
|------|---------|
| `ui/pages/MyGamesPage.tsx` | List of all owned games with active/completed sections |
| `ui/pages/MutatorRevealPage.tsx` | Animated mutator reveal + loading screen |
| `ui/components/actionbar/GameActionBar.tsx` | Bottom action bar during gameplay with bonus slots |
| `config/mutators.ts` | Mutator display definitions (hardcoded) |
| `config/bonuses.ts` | Bonus type display definitions (icon, label, color) |
| `src/test/runDataPacking.test.ts` | Unit tests for extended RunData unpacking |

### Files UNCHANGED (for reference only)

| File | Why Referenced |
|------|---------------|
| `ui/pages/BossRevealPage.tsx` | **Template** for MutatorRevealPage structure |
| `ui/screens/Loading.tsx` | **Pattern** for loading animation |
| `ui/components/ConfettiExplosion.tsx` | **Used** in MutatorRevealPage for particle reveal |
| `hooks/useGameTokensSlot.ts` | **Used** in MyGamesPage (already returns all needed data) |
| `hooks/useGame.tsx` | **Used** in MutatorRevealPage for game.mutatorMask |
| `config/themes.ts` | **Used** everywhere — `getThemeImages().background` for HomePage bg |
| `dojo/systems.ts` | **Used** for `applyBonus` in GameActionBar |
