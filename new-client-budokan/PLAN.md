# UI Overhaul Plan: Budokan × New Design System Merge

## Design Philosophy

**Goal**: Merge the best visual patterns from budokan's live deployment with our new design system (Chakra Petch fonts, theme tokens, GameCard, ProfilePage, etc.).

**Key Architectural Decision**: Drop the PhoneFrame (430px phone container on desktop) in favor of full-bleed backgrounds everywhere. Content areas naturally constrain themselves via `max-w-[500px]` while backgrounds fill the entire viewport. This matches how budokan looks on desktop and is what games actually do.

**Contracts are READ-ONLY. Only `client-budokan/` changes.**

---

## Phase 0: App Shell — Full-Bleed Foundation

> **Dependency**: All other phases depend on this. Must be completed first.

### What Changes

| Component | Current | Target |
|-----------|---------|--------|
| `PhoneFrame.tsx` | `max-w-[430px]`, desktop border/shadow, constrains everything | Remove entirely — outer `div` is `fixed inset-0`, no max-width |
| `ThemeBackground.tsx` | Gradient-only (`colors.bgGradient`) + PatternOverlay | Add zone background image layer (full-bleed `background.png` at 20-30% opacity) |
| `App.tsx` | Wraps in `<PhoneFrame>` | Remove `<PhoneFrame>` wrapper, content area gets `mx-auto max-w-[500px]` per page |
| `navigationStore.ts` | `FULLSCREEN_PAGES: play, boss, mutator, map` | Add `daily` to FULLSCREEN_PAGES |
| `BottomTabBar.tsx` | 5 tabs (home, mygames, profile, ranks, settings) | Keep same 5 tabs, no changes |

### Files to Modify

1. **`src/ui/components/shared/PhoneFrame.tsx`** — DELETE or gut
2. **`src/App.tsx`** — Remove PhoneFrame import/wrapper, restructure layout
3. **`src/ui/components/shared/ThemeBackground.tsx`** — Add zone bg image layer
4. **`src/stores/navigationStore.ts`** — Add `daily` to FULLSCREEN_PAGES
5. **`src/index.css`** — Ensure `html, body` are `overflow: hidden` and full-height (already done)

### Detailed Changes

#### `PhoneFrame.tsx` → Delete or Replace

**Current** (17 lines):
```tsx
<div className="fixed inset-0 flex items-center justify-center bg-[#080414]">
  <div className="relative w-full h-dvh max-w-[430px] md:border md:border-white/5 md:rounded-2xl md:shadow-2xl md:overflow-hidden">
    {children}
  </div>
</div>
```

**Replace with** (inline in App.tsx):
```tsx
<div className="fixed inset-0 h-dvh w-full overflow-hidden">
  {children}
</div>
```

No max-width constraint. No border. No phone frame. Background fills viewport.

#### `App.tsx` — New Shell Structure

**Current**:
```tsx
<PhoneFrame>
  <div className="relative flex h-full flex-col">
    <ThemeBackground />
    <div className="relative flex-1 min-h-0 overflow-hidden"
         style={showTabBar ? { paddingBottom: 0 } : undefined}>
      <div className="absolute inset-0 overflow-hidden"
           style={showTabBar ? { bottom: "4rem" } : undefined}>
        <CurrentPage />
      </div>
    </div>
    {showTabBar && <BottomTabBar />}
  </div>
</PhoneFrame>
```

**New**:
```tsx
<div className="fixed inset-0 h-dvh w-full overflow-hidden">
  <div className="relative flex h-full flex-col">
    <ThemeBackground />
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden"
           style={showTabBar ? { bottom: "4rem" } : undefined}>
        <CurrentPage />
      </div>
    </div>
    {showTabBar && <BottomTabBar />}
  </div>
</div>
```

Changes: Remove `<PhoneFrame>` import/wrapper, add inline `fixed inset-0` wrapper. Remove padding logic (no longer needed without phone frame).

#### `ThemeBackground.tsx` — Add Zone Image Layer

**Current** (17 lines):
```tsx
<div className="fixed inset-0 -z-20" style={{ background: colors.bgGradient }} />
<PatternOverlay themeId={themeTemplate} />
```

**New** — Add background image between gradient and pattern:
```tsx
<div className="fixed inset-0 -z-20" style={{ background: colors.bgGradient }} />
<img
  src={getThemeImages(themeTemplate as ThemeId).background}
  alt=""
  className="pointer-events-none fixed inset-0 -z-[15] h-full w-full object-cover opacity-20"
  draggable={false}
/>
<div
  className="pointer-events-none fixed inset-0 -z-[14]"
  style={{
    background: `linear-gradient(180deg, rgba(5,10,18,0.55) 0%, rgba(5,10,18,0.2) 35%, rgba(5,10,18,0.6) 100%)`
  }}
/>
<PatternOverlay themeId={themeTemplate as ThemeId} />
```

Layers (back to front): gradient → zone image (20% opacity) → dark vignette → pattern overlay.

Note: `getThemeImages` must be imported from `@/config/themes`.

#### `navigationStore.ts` — Expand Fullscreen Pages

```diff
-export const FULLSCREEN_PAGES: ReadonlySet<PageId> = new Set(["play", "boss", "mutator", "map"]);
+export const FULLSCREEN_PAGES: ReadonlySet<PageId> = new Set(["play", "boss", "mutator", "map", "daily"]);
```

### Tests (TDD)

Before implementation, write in `src/test/appShell.test.ts`:
- `ThemeBackground` renders zone image when `background.png` exists
- `FULLSCREEN_PAGES` includes `daily`
- App renders without PhoneFrame wrapper (no `max-w-[430px]` in DOM)

### Commit

```
feat(shell): drop PhoneFrame for full-bleed layout with zone backgrounds

Remove 430px phone frame constraint. Backgrounds now fill entire viewport.
Content areas self-constrain via max-w-[500px]. Add zone background.png
image layer to ThemeBackground. Add daily to FULLSCREEN_PAGES.
```

---

## Phase 1: HomePage — Remove Redundant Overlays, Add Centering

> **Depends on**: Phase 0 (full-bleed backgrounds)

### What to KEEP from Current

- Chakra Petch + DM Sans fonts
- Theme token system (`getThemeColors`)
- Zone selection with lock/unlock states
- Star progress per zone
- Mode pill selector (Map/Endless)
- Continue button for active runs
- New Game button with gradient
- Connect component for wallet
- Player card (username + stars + CONNECTED badge)
- Daily challenge shortcut button
- Large logo in top third, centered (`h-28 md:h-32`)

### What to ADOPT from Budokan

- **Full-bleed zone background image** fills entire viewport — handled by Phase 0's ThemeBackground
- **Background switches per zone** when `activeZone` changes — partially exists, needs reactive theme switching

### What to CHANGE

#### 1. Remove Per-Page Background Image/Gradient Overlay

Phase 0's ThemeBackground handles zone backgrounds globally. Remove the inline `<img>` and gradient overlay div from HomePage (lines 138-149).

**Remove** these lines:
```tsx
// DELETE: lines 138-149
<img
  src={getThemeImages(getThemeId(zones[activeZone]?.zoneId ?? 1)).background}
  alt=""
  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
  draggable={false}
/>
<div
  className="pointer-events-none absolute inset-0"
  style={{
    background: `linear-gradient(180deg, rgba(5, 10, 18, 0.55) 0%, rgba(5, 10, 18, 0.2) 35%, rgba(5, 10, 18, 0.6) 100%)`,
  }}
/>
```

These are now redundant — ThemeBackground provides the full-bleed zone image.

#### 2. Reactive Zone Theme Switching

**Add** zone-reactive theme switching so ThemeBackground updates when user selects a different zone:
```tsx
useEffect(() => {
  const zoneId = zones[activeZone]?.zoneId ?? 1;
  setThemeTemplate(getThemeId(zoneId));
}, [activeZone, zones, setThemeTemplate]);
```

**Remove** the existing mount-only effect (lines 49-52):
```tsx
// REPLACE this:
useEffect(() => {
  setThemeTemplate(loadThemeTemplate(), false);
  setMusicPlaylist(["main", "level"]);
}, [setMusicPlaylist, setThemeTemplate]);

// WITH this:
useEffect(() => {
  setMusicPlaylist(["main", "level"]);
}, [setMusicPlaylist]);

useEffect(() => {
  const zoneId = zones[activeZone]?.zoneId ?? 1;
  setThemeTemplate(getThemeId(zoneId));
}, [activeZone, zones, setThemeTemplate]);
```

#### 3. Content Centering for Desktop

```diff
-<div className="relative flex h-full min-h-0 flex-col overflow-hidden px-4 pb-3 pt-6">
+<div className="relative flex h-full min-h-0 flex-col overflow-hidden px-4 pb-3 pt-6 mx-auto w-full max-w-[500px]">
```

### File: `src/ui/pages/HomePage.tsx`

Summary of changes:
- Remove inline background image `<img>` (lines 138-143)
- Remove inline gradient overlay `<div>` (lines 144-149)
- Replace mount-only theme effect with zone-reactive effect
- Add `mx-auto w-full max-w-[500px]` to root div

### Tests

- HomePage renders without inline background image elements
- `setThemeTemplate` is called when `activeZone` changes
- Content wrapper has `max-w-[500px]` class

### Commit

```
refactor(home): remove redundant bg overlays, add content centering

ThemeBackground now handles zone backgrounds globally. Remove inline
background image and gradient from HomePage. Add max-w-[500px] centering.
Switch theme template reactively when active zone changes.
```

---

## Phase 2: PlayScreen — Bigger Grid, Compact HUD

> **Depends on**: Phase 0

### What to KEEP

- Grid state machine (`Grid.tsx` — **DO NOT TOUCH**, 690 lines of battle-tested logic)
- GameBoard responsive sizing with ResizeObserver
- GameActionBar with bonus slots
- GameOverDialog + VictoryDialog + SurrenderDialog
- Connect wallet dialog
- Level completion detection → navigate to map
- Next line preview below grid
- "← Swipe rows to align blocks →" instruction text
- Grid background uses `grid-bg.png` per theme (line 354)
- No bottom tab bar during play (already in FULLSCREEN_PAGES)

### What to CHANGE

#### 1. Remove the Top Header Bar (Save 40px of Vertical Space)

The PlayScreen has a `h-10` header bar (lines 261-288) with back button + "Lv.X · Score Y". This is **redundant** because `GameHud` already shows level, score, moves, and combo. Remove the header entirely.

**Remove** lines 261-288 (the `div.flex.h-10.shrink-0.border-b` header).

**Add** a floating back button instead (absolute positioned, overlapping the HUD area):
```tsx
<button
  onClick={goBack}
  className="absolute left-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm"
  style={{ color: colors.textMuted }}
>
  <ChevronLeft size={18} />
</button>
```

Place this inside the main `h-dvh flex flex-col` container, before the HUD.

#### 2. GameBoard Max-Width: Relax Constraint

Currently `GameBoard.tsx` line 67: `max-w-[500px]`. This is fine on mobile but on desktop with full-bleed layout, the grid can be bigger within a wider container.

Keep `max-w-[500px]` in GameBoard itself — it's correct for the card. The PlayScreen container will be wider to give more breathing room.

#### 3. Grid Container: Add Vertical Centering

The grid container (PlayScreen line 351-364) should center vertically in available space:

```diff
-className="flex min-h-0 flex-1 w-full flex-col items-center overflow-hidden rounded-xl bg-center bg-cover px-1 py-1"
+className="flex min-h-0 flex-1 w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-center bg-cover px-1 py-1"
```

Add `justify-center` so grid centers vertically.

#### 4. Compact GameHud Padding

In `GameHud.tsx` — reduce outer padding to give grid more room:

```diff
-<div className="w-full shrink-0 px-2 pb-1 pt-1">
+<div className="w-full shrink-0 px-2 pb-0.5 pt-0.5">
```

Reduce inner card padding:
```diff
-<div className="mx-auto w-full max-w-[500px] rounded-xl border px-2.5 py-1.5"
+<div className="mx-auto w-full max-w-[500px] rounded-lg border px-2 py-1"
```

#### 5. PlayScreen Container Width

Add centering for desktop (wider than other pages since game grid benefits):

```diff
-<div className="h-dvh flex flex-col">
+<div className="h-dvh flex flex-col mx-auto w-full max-w-[600px]">
```

PlayScreen gets 600px max (instead of 500px) to allow the grid more room.

### Files to Modify

1. **`src/ui/pages/PlayScreen.tsx`** — Remove top header, add floating back button, widen container, center grid vertically
2. **`src/ui/components/hud/GameHud.tsx`** — Tighten padding

### What NOT to Modify

- **`src/ui/components/GameBoard.tsx`** — Keep `max-w-[500px]`, keep ResizeObserver logic
- **`src/ui/components/Grid.tsx`** — DO NOT TOUCH
- **`src/ui/components/actionbar/GameActionBar.tsx`** — Keep as-is

### Tests

- PlayScreen renders without `h-10` header bar (no element matching `.h-10.shrink-0.border-b`)
- Floating back button is present with `absolute left-2 top-2` positioning
- PlayScreen outer container has `max-w-[600px]`
- GameHud inner card has `py-1` (reduced from `py-1.5`)

### Commit

```
feat(play): maximize grid area by removing header, compacting HUD

Remove redundant top header bar (level/score already shown in GameHud).
Add floating back button. Tighten HUD padding. PlayScreen container
widens to 600px max on desktop for bigger grid area.
```

---

## Phase 3: MyGamesPage — Table Format

> **Depends on**: Phase 0

### What to KEEP

- Game data fetching via `useGameTokensSlot`
- `unpackRunData` for game state extraction
- Active / Completed split with collapsible completed section
- Motion animations with staggered delays
- Theme icon per zone
- Game metadata: zone name, mode, level, score, stars, moves

### What to ADOPT from Budokan

- **Table/row format** — simple horizontal rows instead of GameCard components
- **Active section with colored indicator** — green dot for active games
- **Play arrow per game** — simple play indicator, not a full card click area

### What to CHANGE

Replace `GameCard` wrapper with simple row divs. Each game is a single horizontal row.

#### New Active Game Row Structure

```tsx
<button
  onClick={() => navigate("map", game.token_id)}
  className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
  style={{
    backgroundColor: colors.surface,
    borderColor: colors.border,
  }}
>
  <img src={themeIcon} className="h-8 w-8 rounded-md" draggable={false} />
  <span className="font-display text-xs font-bold tabular-nums w-10"
        style={{ color: colors.textMuted }}>
    Lv.{level}
  </span>
  <span className="font-display text-sm font-bold tabular-nums flex-1"
        style={{ color: colors.text }}>
    {score.toLocaleString()}
  </span>
  <span className="text-[10px]" style={{ color: colors.accent2 }}>
    {"★".repeat(stars)}{"☆".repeat(3-stars)}
  </span>
  <span className="font-display text-xs font-black"
        style={{ color: colors.accent }}>▶</span>
</button>
```

#### New Section Headers

```tsx
<div className="flex items-center gap-2 mb-2">
  <div className="h-1.5 w-1.5 rounded-full"
       style={{ backgroundColor: "#4ade80" }} />
  <span className="text-[10px] uppercase tracking-[0.15em] font-bold"
        style={{ color: colors.textMuted }}>
    Active · {activeGames.length}
  </span>
</div>
```

#### Completed Game Row

Same structure but without play button, with "OVER" badge instead, and wrapped in `opacity-65 grayscale` classes.

#### Content Centering

```diff
-<div className="flex h-full min-h-0 flex-col px-4 pb-4 pt-4">
+<div className="flex h-full min-h-0 flex-col px-4 pb-4 pt-4 mx-auto w-full max-w-[500px]">
```

### File: `src/ui/pages/MyGamesPage.tsx`

Summary:
- Remove `GameCard` import and usage
- Replace card-wrapped entries with simple row buttons
- Update section headers to use dot indicators
- Add `mx-auto w-full max-w-[500px]` to root div

### What NOT to Change

- Keep the `GameCard` component file itself — it's used elsewhere (ProfilePage, etc.)
- Keep motion animations (staggered reveal looks good)
- Keep the collapsible completed section pattern

### Tests

- MyGamesPage renders rows without `GameCard` components (no `bg-slate-900/90`)
- Each active game row has a clickable play arrow
- Active section shows green dot indicator
- Content is constrained to 500px max-width

### Commit

```
refactor(mygames): replace card layout with compact table rows

Switch from GameCard-wrapped entries to simple horizontal rows.
Each game shows: zone icon | level | score | stars | play arrow.
Add green dot indicator for active section. Add max-w-[500px] centering.
```

---

## Phase 4: LeaderboardPage — Column Headers and Tighter Spacing

> **Depends on**: Phase 0

### What to KEEP

- Tab navigation (Zone/Endless/Daily) with border-bottom indicator
- Data fetching via `useLeaderboardSlot`, `useCurrentChallenge`, `useDailyLeaderboard`
- Trophy images for top 3 (gold.png, silver.png, bronze.png)
- Current player highlighting (accent background + border)
- Star display per entry
- Score display with tabular-nums
- Row structure (already close to budokan's table format)

### What to CHANGE

#### 1. Add Table Header Row

Insert before the rank rows:
```tsx
<div className="mb-1 flex items-center gap-2 px-3 py-1">
  <span className="w-8 text-center text-[8px] uppercase tracking-wider"
        style={{ color: colors.textMuted }}>#</span>
  <span className="flex-1 text-[8px] uppercase tracking-wider"
        style={{ color: colors.textMuted }}>Player</span>
  <span className="text-[8px] uppercase tracking-wider"
        style={{ color: colors.textMuted }}>Score</span>
</div>
```

#### 2. Content Centering

```diff
-<div className="flex h-full flex-col">
+<div className="flex h-full flex-col mx-auto w-full max-w-[540px]">
```

#### 3. Tighten Row Spacing

```diff
-<div className="mx-auto max-w-[500px] space-y-1.5">
+<div className="mx-auto max-w-[500px] space-y-1">
```

### File: `src/ui/pages/LeaderboardPage.tsx`

Summary:
- Add header row before rank rows
- Add `mx-auto w-full max-w-[540px]` to root div
- Reduce `space-y-1.5` to `space-y-1`

### Tests

- LeaderboardPage renders a header row with "#" and "Player" and "Score" text
- Content wrapper has max-width centering
- Trophy images render for ranks 1-3
- Row spacing is `space-y-1`

### Commit

```
refine(leaderboard): add column headers, tighten table spacing

Add explicit #/Player/Score header row above rank entries. Reduce
row gap from 1.5 to 1. Add max-w-[540px] outer centering for desktop.
```

---

## Phase 5: MapPage — Corner Badge Level Numbers

> **Depends on**: Phase 0

### What to KEEP (everything except node number positioning)

- SVG-based winding path with cubic Bezier curves
- Node positioning via `useMapLayout`
- Map data via `useMapData`
- BottomSheetPreview for level details
- LevelCompleteDialog integration
- Current node glow effect (drop-shadow)
- Boss node larger size (h-14 w-14 vs h-12 w-12)
- Theme-specific `map-bg.png` background (MapPage uses its own bg, NOT ThemeBackground)
- Zone name + stars in header
- Scroll-to-current-node on mount
- All path styling (dashed/solid, opacity, stroke width)

### What to CHANGE

#### Node Level Badge — Centered → Corner Badge

Move level number from centered overlay to a small badge at bottom-right:

**Current** (lines 289-294):
```tsx
<span className="absolute inset-0 flex items-center justify-center font-display text-sm font-black"
      style={{ color: isCurrent ? "#0a1628" : colors.text }}>
  {node.contractLevel}
</span>
```

**New** — Small badge at bottom-right:
```tsx
<span
  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full font-display text-[10px] font-black"
  style={{
    backgroundColor: isCurrent ? colors.accent : "rgba(0,0,0,0.7)",
    color: isCurrent ? "#0a1628" : colors.text,
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
  }}
>
  {node.contractLevel}
</span>
```

### Why NOT Change the Background

MapPage uses `map-bg.png` (a map-specific asset) via inline background-image styling (lines 167-174). This is **intentionally different** from `background.png` used by ThemeBackground. MapPage keeps its own background — no change needed.

### File: `src/ui/pages/MapPage.tsx`

Summary:
- Replace centered level number span with corner badge span (lines 289-294)

### Tests

- Map nodes render with badge at bottom-right (`-bottom-1 -right-1`)
- Current node badge uses accent background color
- Non-current nodes use dark background badge (`rgba(0,0,0,0.7)`)

### Commit

```
refine(map): move level numbers to corner badges on map nodes

Level numbers now appear in small round badges at bottom-right of each
node instead of centered over the node image. Current node badge uses
accent color. Improves readability over node artwork.
```

---

## Phase 6: Remaining Pages — Content Centering Only

> **Depends on**: Phase 0

These pages are our innovations (budokan doesn't have ProfilePage) or already well-designed (MutatorRevealPage, BossRevealPage). The only change needed is content centering for the full-bleed layout.

### ProfilePage (`src/ui/pages/ProfilePage.tsx`)

```diff
-<div className="flex h-full flex-col">
+<div className="flex h-full flex-col mx-auto w-full max-w-[500px]">
```

Keep everything else: 3 tabs (Overview/Quests/Achievements), XP progress bar, zone unlock modal, zStar balance display.

### SettingsPage (`src/ui/pages/SettingsPage.tsx`)

Already has `max-w-[500px] mx-auto` on content area. Add to outer wrapper:

```diff
-<div className="flex h-full flex-col">
+<div className="flex h-full flex-col mx-auto w-full max-w-[500px]">
```

### MutatorRevealPage (`src/ui/pages/MutatorRevealPage.tsx`)

Already centered with `max-w-sm` (384px). **No change needed** — full-screen dark overlay with centered content works perfectly with full-bleed layout.

### BossRevealPage (`src/ui/pages/BossRevealPage.tsx`)

Already centered with `max-w-sm`. **No change needed**.

### DailyChallengePage (`src/ui/pages/DailyChallengePage.tsx`)

Already has `max-w-[500px]` on content. Add to outer wrapper:

```diff
-<div className="flex h-full flex-col">
+<div className="flex h-full flex-col mx-auto w-full max-w-[500px]">
```

### Files to Modify

1. `src/ui/pages/ProfilePage.tsx` — Add outer max-width
2. `src/ui/pages/SettingsPage.tsx` — Add outer max-width
3. `src/ui/pages/DailyChallengePage.tsx` — Add outer max-width
4. `src/ui/pages/MutatorRevealPage.tsx` — No change needed
5. `src/ui/pages/BossRevealPage.tsx` — No change needed

### Tests

- ProfilePage outer div has `max-w-[500px]`
- SettingsPage outer div has `max-w-[500px]`
- DailyChallengePage outer div has `max-w-[500px]`

### Commit

```
style(pages): add content centering for full-bleed desktop layout

Add max-w-[500px] centering to ProfilePage, SettingsPage, and
DailyChallengePage outer wrappers. MutatorRevealPage and BossRevealPage
already self-center. Ensures all pages look correct after PhoneFrame removal.
```

---

## Phase Summary & Dependency Graph

```
Phase 0: App Shell (foundation)  ← MUST BE FIRST
  ├── Phase 1: HomePage           (independent)
  ├── Phase 2: PlayScreen         (independent)
  ├── Phase 3: MyGamesPage        (independent)
  ├── Phase 4: LeaderboardPage    (independent)
  ├── Phase 5: MapPage            (independent)
  └── Phase 6: All Other Pages    (independent)
```

Phases 1-6 are independent of each other and CAN be parallelized after Phase 0.

---

## Atomic Commit Strategy

| Order | Commit | Files Changed | Risk |
|-------|--------|--------------|------|
| 1 | `feat(shell): drop PhoneFrame for full-bleed layout` | PhoneFrame.tsx, App.tsx, ThemeBackground.tsx, navigationStore.ts | **HIGH** — affects all pages |
| 2 | `refactor(home): remove redundant bg, add centering` | HomePage.tsx | LOW |
| 3 | `feat(play): maximize grid area, compact HUD` | PlayScreen.tsx, GameHud.tsx | MEDIUM — grid sizing |
| 4 | `refactor(mygames): table rows instead of cards` | MyGamesPage.tsx | LOW |
| 5 | `refine(leaderboard): add headers, tighten spacing` | LeaderboardPage.tsx | LOW |
| 6 | `refine(map): corner badge level numbers` | MapPage.tsx | LOW |
| 7 | `style(pages): content centering for remaining pages` | ProfilePage, SettingsPage, DailyChallengePage | LOW |

### Rollback Strategy

Each commit is independently revertable. If Phase 0 causes issues:
```bash
git revert HEAD~6..HEAD  # Revert all 7 commits
```

If only one page is broken (e.g., Phase 3):
```bash
git revert <commit-hash-of-phase-3>  # Revert just MyGamesPage changes
```

---

## Files NOT Modified (Explicitly Out of Scope)

| File | Reason |
|------|--------|
| `src/ui/components/Grid.tsx` (690 lines) | Battle-tested game logic — **DO NOT TOUCH** |
| `src/ui/components/Block.tsx` | Block rendering — no changes needed |
| `src/ui/components/GameBoard.tsx` | ResizeObserver + max-width is correct — keep as-is |
| `src/ui/components/actionbar/GameActionBar.tsx` | Action bar works well — keep as-is |
| `src/ui/components/shared/GameCard.tsx` | Still used by ProfilePage — keep the component |
| `src/ui/components/shared/PatternOverlay.tsx` | SVG patterns unchanged |
| `src/ui/components/BottomTabBar.tsx` | Tab bar unchanged (5 tabs, same icons) |
| `src/config/themes.ts` | Theme tokens are complete — no changes needed |
| `src/stores/moveTxStore.ts` | Transaction logic — no changes needed |
| `src/contexts/*` | All contexts unchanged |
| `src/hooks/*` | All hooks unchanged |
| `src/dojo/*` | All Dojo integration unchanged |
| `contracts/*` | **READ-ONLY. No contract changes.** |
| `public/assets/*` | All assets already exist and are correct |

---

## QA / Acceptance Criteria

### Build Verification

After all phases:
```bash
cd client-budokan && pnpm build
```
Must exit 0 with no TypeScript errors.

```bash
cd client-budokan && pnpm test
```
Must pass all existing + new tests.

### Specific Assertions

| Page | Assertion | Verification |
|------|-----------|-------------|
| App Shell | No element with class `max-w-[430px]` exists | `document.querySelector('[class*="max-w-[430px]"]') === null` |
| App Shell | ThemeBackground renders `<img>` with `background.png` src | `document.querySelector('img[src*="background.png"]') !== null` |
| App Shell | `FULLSCREEN_PAGES` includes `daily` | Import and assert in unit test |
| HomePage | No inline `<img>` with `opacity-20` class for bg | HomePage DOM check |
| HomePage | Root div has `max-w-[500px]` | Class check |
| PlayScreen | No `h-10` header bar exists | No `.h-10.shrink-0.border-b` in DOM |
| PlayScreen | Floating back button exists | Element with `absolute left-2 top-2` |
| PlayScreen | Outer container has `max-w-[600px]` | Class check |
| GameHud | Inner card has `py-1` padding | Class check |
| MyGamesPage | No `GameCard` components rendered | No `bg-slate-900/90` elements |
| MyGamesPage | Root div has `max-w-[500px]` | Class check |
| LeaderboardPage | Header row with "#" text exists | Text content check |
| LeaderboardPage | Row spacing is `space-y-1` | Class check |
| MapPage | Node badges have `-bottom-1 -right-1` | Class check |
| ProfilePage | Root div has `max-w-[500px]` | Class check |
| SettingsPage | Root div has `max-w-[500px]` | Class check |
| DailyChallengePage | Root div has `max-w-[500px]` | Class check |

### Visual Verification Checklist (per viewport)

#### Mobile (390×844)

- [ ] HomePage: Zone background visible behind content. Logo centered. Zones scrollable. NEW GAME at bottom.
- [ ] PlayScreen: Grid fills majority of screen. No top header bar. Floating back button. Action bar at bottom.
- [ ] MyGamesPage: Games as rows. Green active indicator. Play arrow visible.
- [ ] LeaderboardPage: Column header row. Trophies for top 3. Tab switching works.
- [ ] MapPage: Winding paths. Level badges at node corners. Current node glows.
- [ ] ProfilePage: 3 tabs work. XP bar visible. Content scrollable.

#### Desktop (1440×900)

- [ ] ALL PAGES: Background fills entire viewport. No phone frame border. No dark side panels.
- [ ] ALL PAGES: Content centered with natural max-width (500px most pages, 600px PlayScreen).
- [ ] Tab bar: Visible on home/mygames/profile/ranks/settings. Hidden on play/map/boss/mutator/daily.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PhoneFrame removal breaks layout on iOS Safari | HIGH | `h-dvh` handles dynamic viewport; test on real iOS device |
| PhoneFrame removal makes content too wide on ultra-wide monitors | LOW | Content max-widths (500-600px) prevent stretching; only bg changes |
| Grid sizing changes affect gameplay feel | MEDIUM | GameBoard ResizeObserver unchanged; only container width changes |
| Background image loading on slow connections | LOW | Images cached per theme; 20% opacity means quality isn't critical |
| Removing PlayScreen header bar loses navigation | LOW | Replaced with floating back button using same `goBack()` function |
| Content too narrow on tablets (768-1024px) | LOW | max-w-[500px] is fine for tablets; fills naturally below breakpoint |

---

## What is NOT Included (Explicit Scope Boundaries)

These are tempting but **OUT OF SCOPE** for this plan:

- ❌ **New navigation patterns** (keeping existing 5-tab + overlay system)
- ❌ **New components** (no new GameCard variants, no new button styles)
- ❌ **Animation changes** (keep existing motion transitions)
- ❌ **Font changes** (keep Chakra Petch + DM Sans)
- ❌ **Color/theme token changes** (themes.ts stays unchanged)
- ❌ **New pages** (no Skill Tree, no Shop redesign)
- ❌ **Bottom tab bar redesign** (keep same 5 tabs, same icons)
- ❌ **Grid/Block component changes** (Grid.tsx is sacred)
- ❌ **Sound/music changes**
- ❌ **Contract changes**
- ❌ **New asset creation** (all required assets already exist)
- ❌ **Responsive breakpoint overhaul** (current Tailwind defaults work)
