# Mobile-First UI Redesign Plan

## Status: Ready for Implementation
**Last Updated:** 2025-03-30
**Scope:** Full-app mobile-first redesign — all pages, navigation shell, design system
**Target:** Mobile-primary (390×844 reference), Wordle-style phone-frame on desktop

---

## 1. Context & Decisions

### Problem Statement

The current UI has critical mobile UX issues:
1. **60% dead space** on HomePage — decorative background with no interactive content above the fold
2. **No clear CTA** — "Log In" button looks like a form element, no PLAY affordance visible
3. **No mode selection** — Map vs Endless (core v1.3 feature) has zero UI entry point
4. **Leaderboard broken** — raw 70-char hex game IDs overflow cards
5. **Daily Challenge cut off** — half-visible at bottom, unclear scrollability
6. **Not game-like** — feels like a web form, not a game lobby

### Key Design Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Desktop layout | Phone-frame (max-w-[430px] centered) | User preference ("I love Wordle style") |
| 2 | Mode selection | Pill toggle on home card, Map default | No puzzle game gates mode choice before first play |
| 3 | Navigation | Keep 4-tab bottom bar (Home/Map/Ranks/Settings) | Games with 2+ sections universally use bottom tabs |
| 4 | Visual style | Hybrid — zone art hero top, opaque dark cards bottom | Preserves themed art while keeping interactive area clean |
| 5 | Viewport unit | `100dvh` (replace `useViewport` hook) | `dvh` handles iOS Safari address bar natively |
| 6 | Tab bar in-game | Hidden during PlayScreen | Already implemented; maximize grid area |
| 7 | HomePage content | 5 elements: zone/active-run/mode-pill/CTA/daily | Medium-sparse density; shows "next thing to do" |

### Reference: Death Mountain Patterns Adopted

- `100dvh` + `overflow: hidden` on body (no rubber-band scroll)
- 64px bottom nav with glow active states and `touch-action: manipulation`
- `user-select: none` globally, `-webkit-tap-highlight-color: transparent`
- PWA manifest with `display: fullscreen`
- Loading screen with thematic art (not spinner)

---

## 2. Design System Specification

### 2.1 Phone-Frame Shell

```
Desktop (≥768px):
┌─────────────────────────────────────────────┐
│             dark bg (#080414)                │
│         ┌───────────────────┐               │
│         │   max-w-[430px]   │               │
│         │   100dvh column   │               │
│         │   (the full app)  │               │
│         └───────────────────┘               │
└─────────────────────────────────────────────┘

Mobile (<768px):
┌─────────────────┐
│  full-width     │
│  100dvh         │
│  (no wrapper)   │
└─────────────────┘
```

### 2.2 Card Component

Two variants shared across all pages:

**Glass Card** (hero areas — zone selector, backgrounds):
```
bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl
```

**Solid Card** (interactive content — settings sections, leaderboard rows):
```
bg-slate-900/90 border border-white/10 rounded-xl
```

### 2.3 Button Hierarchy

| Level | Usage | Style |
|-------|-------|-------|
| Primary CTA | PLAY, CONTINUE | Image-based (`btn-green.png`), h-14, full-width, `Fredericka` font, `whileTap: scale(0.96)` |
| Secondary CTA | NEW game, mode-specific | Image-based (`btn-orange.png`), h-12 |
| Tertiary | Daily challenge, nav actions | `bg-white/5 border border-white/8`, text-based |
| Connect | Wallet login | Primary CTA style with gamepad icon, NOT a form-style button |
| Destructive | Surrender, Disconnect | `bg-red-500/20 text-red-300 border-red-500/30` |

### 2.4 Typography

- **Headings:** `font-['Fredericka_the_Great']` (already used, keep as-is)
- **Body/labels:** System sans-serif via Tailwind defaults
- **Stats/numbers:** `tabular-nums` for alignment

### 2.5 Touch Targets

- Minimum 44×44px for all interactive elements
- Bottom tab bar icons: 44×44px with 8px border-radius
- Zone selector thumbnails: 64×64px minimum (up from ~50px)

### 2.6 Active States

Bottom tab bar uses glow instead of color fill:
```css
/* Active tab */
box-shadow: 0 0 10px rgba(THEME_ACCENT, 0.3);
border: 1px solid rgba(THEME_ACCENT, 0.3);
background-color: rgba(THEME_ACCENT, 0.1);

/* Inactive tab */
opacity: 0.5;
```

---

## 3. Page-by-Page Specifications

### 3.1 HomePage (Complete Redesign)

**Current:** 60% dead background, tiny zone selector, no mode choice, "Log In" form button.

**New layout (top to bottom, within phone-frame):**

```
┌──────────────────────────────┐
│  Zone Hero Art (40% height)  │  ← full-bleed themed background
│  + Animated logo overlay     │
│  + Zone name overlay         │
├──────────────────────────────┤
│  Zone Selector (3 thumbnails)│  ← 64×64px, horizontal, centered
├──────────────────────────────┤
│  [Active Run Banner]         │  ← conditional: "Level 4/10 — CONTINUE"
│  ┌────────────────────────┐  │
│  │  [ Map Mode | Endless ]│  │  ← pill toggle, Map is default
│  │                        │  │
│  │  ▶  PLAY               │  │  ← giant primary CTA
│  └────────────────────────┘  │
├──────────────────────────────┤
│  ★ Daily Challenge  12h 34m  │  ← teaser card with countdown
├──────────────────────────────┤
│  [Home] [Map] [Ranks] [⚙]   │  ← bottom tab bar (64px)
└──────────────────────────────┘
```

**Key behaviors:**
- NOT connected: Zone hero + selector + Connect button (styled as primary CTA: "▶ CONNECT & PLAY")
- Connected, no active run: Zone hero + selector + mode pill + PLAY button
- Connected, has active run: Zone hero + selector + active run banner (CONTINUE + small NEW) + mode pill + daily teaser
- Zone selector changes background with crossfade (`AnimatePresence mode="wait"`, already implemented)

### 3.2 MapPage (Polish)

**Changes:**
- Header: Replace bare `<` chevron with 44×44px back button + zone name + score badge
- Level nodes: Increase `NODE_R` from 6→8, `BOSS_R` from 8.5→11 for bigger tap targets
- Bottom sheet preview: Already good (spring animation, dark card) — keep
- Empty state when no active run: "Start a run from Home" with navigate-home button

### 3.3 LeaderboardPage (Fix + Enhance)

**Critical fix:** Game IDs are raw hex strings overflowing cards.
**Changes:**
- Truncate/replace game IDs with player names (from `useGetUsernames`)
- Add mode filter tabs at top: `[All | Map | Endless]` (pill-style, like mode selector)
- Fix podium card layout: constrain text, use `truncate` class
- Empty state: "No entries yet. Play a game to claim rank #1." with PLAY nav button

### 3.4 SettingsPage (Density Fix)

**Changes:**
- Tighten section spacing (currently lots of dead space below Account)
- Make theme thumbnails bigger (64×64px, up from 80×80px but fill the row properly — currently 3 thumbnails with wasted horizontal space)
- Add version/build info at very bottom (subtle)
- No structural changes needed — this page works

### 3.5 PlayScreen (Mobile Optimization)

**Changes:**
- Replace `h-screen-viewport` class with `h-dvh` (dvh migration)
- Compact the 44px header: merge level/score into HUD, keep only back + settings buttons (save 20-30px vertical space)
- GameBoard: The ResizeObserver-based `gridSize` calculation is good; ensure it maximizes to fill available space after HUD
- Grid.tsx (690 lines): DO NOT REFACTOR — complex state machine, behavior preservation is critical. Only change: ensure container allows maximum height

### 3.6 DailyChallengePage (Minor Polish)

**Changes:**
- Already well-structured with proper cards and layout
- Ensure back button is 44×44px (currently 32×32px)
- Ensure countdown ring and stats cards fit cleanly on 390px width

### 3.7 BottomTabBar (Refinement)

**Changes:**
- Height: Keep `h-16` (64px) — already correct
- Active state: Replace `scale-105 + emerald color` with glow box-shadow pattern
- Icons: Ensure 44×44px tap area (add padding if needed; current icons are 24×24px)
- Remove `backgroundImage: url(action-bar.png)` — replace with `bg-black/80 backdrop-blur-md`
- Keep `pb-[env(safe-area-inset-bottom)]` for iOS

---

## 4. Implementation Plan

### Phase 0: Foundation (Serial — must complete first)

All subsequent work depends on these shared primitives.

#### Task 0.1: DVH Migration + Mobile Hardening
**Files:** `index.css`, `index.html`, `PlayScreen.tsx`, `HomePage.tsx`
**What:**
- Replace `.h-screen-viewport { height: calc(var(--vh, 1vh) * 100) }` with `.h-dvh { height: 100dvh }`
- Add to `index.css`: `body { overflow: hidden; -webkit-user-select: none; user-select: none; }`
- Add `touch-action: manipulation; -webkit-tap-highlight-color: transparent;` to interactive elements base
- Remove `useViewport()` calls from `HomePage.tsx` and `PlayScreen.tsx` (the hook can stay for backward compat but is no longer needed)
- Update viewport meta in `index.html`: already has `viewport-fit=cover` ✓

**Test (Vitest unit):**
- `dvh-migration.test.ts`: Verify `.h-dvh` class exists in CSS output
- `index.css` snapshot test: Confirm `overflow: hidden` and `user-select: none` on body

**Commit:** `refactor(viewport): migrate from useViewport to 100dvh + harden mobile touch`

#### Task 0.2: Phone-Frame Shell Component
**Files:** NEW `src/ui/components/shared/PhoneFrame.tsx`, `App.tsx`
**What:**
- Create `PhoneFrame` wrapper: `max-w-[430px] mx-auto h-dvh` on `≥768px`, `w-full h-dvh` on mobile
- Desktop: dark background (`bg-[#080414]`) fills viewport, frame is centered
- Wrap `App.tsx` content in `PhoneFrame`
- The frame contains EVERYTHING: `ThemeBackground` + `CurrentPage` + `BottomTabBar`
- Add subtle border on desktop: `md:border md:border-white/5 md:rounded-2xl md:shadow-2xl`

**Test:**
- `PhoneFrame.test.tsx`: Render at 1024px → verify `max-w-[430px]` container. Render at 390px → verify full-width.

**Commit:** `feat(shell): add PhoneFrame wrapper for Wordle-style desktop layout`

#### Task 0.3: Shared Card Components
**Files:** NEW `src/ui/components/shared/GameCard.tsx`
**What:**
- `GameCard` with variants: `glass` (`bg-black/60 backdrop-blur-xl border-white/10 rounded-2xl`) and `solid` (`bg-slate-900/90 border-white/10 rounded-xl`)
- Props: `variant`, `className`, `children`, `padding` (default `p-4`)
- Replace ad-hoc card styles across pages with this component (progressive — don't block on full replacement)

**Test:**
- `GameCard.test.tsx`: Render `variant="glass"` → verify backdrop-blur class. Render `variant="solid"` → verify bg-slate-900 class.

**Commit:** `feat(design): add shared GameCard component with glass and solid variants`

#### Task 0.4: Mode Pill Component
**Files:** NEW `src/ui/components/shared/ModePill.tsx`, update `src/stores/navigationStore.ts`
**What:**
- Pill toggle: `[ Map Mode | Endless ]` — two segments, Map is default
- Stores selected mode in navigation store: add `selectedMode: 0 | 1` (0=Map, 1=Endless)
- Visual: `bg-white/5 rounded-full p-1`, active segment `bg-white/15 rounded-full`, text `text-white` vs `text-white/40`
- Emits mode value, consumed by HomePage's `handleStartGame`

**Test:**
- `ModePill.test.tsx`: Default renders with Map active. Click Endless → mode changes. Verify both segments render.

**Commit:** `feat(home): add ModePill toggle component for Map/Endless mode selection`

#### Task 0.5: Connect Button Restyle
**Files:** `src/ui/components/Connect.tsx`
**What:**
- Replace `Button variant="default"` with primary CTA style matching PLAY button
- Change label from "Log In" to "▶ CONNECT & PLAY"
- Use image-based button (`btn-green.png`) like the PLAY button in HomePage
- Keep `Gamepad2` icon but increase size

**Test:**
- `Connect.test.tsx`: Verify button renders with text "CONNECT & PLAY". Verify onClick calls connect.

**Commit:** `fix(connect): restyle Connect button as primary game CTA`

#### Task 0.6: PWA Manifest
**Files:** NEW `client-budokan/public/manifest.json`, update `index.html`
**What:**
- Create manifest: `name: "zKube"`, `short_name: "zKube"`, `display: "fullscreen"`, `background_color: "#080414"`, `theme_color: "#080414"`
- Add `<link rel="manifest" href="/manifest.json">` to `index.html`
- Update `<meta name="theme-color">` to match (already `#080414` ✓)

**Test:**
- Verify manifest.json is valid JSON with required fields (unit test or manual check)

**Commit:** `feat(pwa): add PWA manifest with fullscreen display`

---

### Phase 1: HomePage + Navigation (Parallel streams, after Phase 0)

#### Stream A: HomePage Redesign

##### Task A.1: HomePage Layout Skeleton
**Files:** `src/ui/pages/HomePage.tsx`
**What:**
- Restructure from "poster + bottom-crammed card" to "hero top (40%) + interactive bottom (60%)"
- Hero area: zone background (full-bleed, already has crossfade) + logo + zone name
- Interactive area: zone selector + mode pill + CTA + daily teaser
- Remove the `flex-1 min-h-0` dead spacer between logo and cards
- Ensure everything fits in `100dvh` WITHOUT scrolling (no overflow, no hidden content)

**Test:**
- `HomePage.test.tsx`: Render with mocked account → verify PLAY button present. Render without account → verify CONNECT button present. Verify mode pill renders.

**Commit:** `feat(home): restructure HomePage layout — hero top, interactive bottom`

##### Task A.2: Zone Selector Redesign
**Files:** `src/ui/pages/HomePage.tsx` (zone selector section)
**What:**
- Increase thumbnail size: 64×64px (from ~50px)
- Active zone: `w-16 h-16 border-2 border-white/80 shadow glow` (up from `w-14 h-14`)
- Inactive: `w-14 h-14 border border-white/15 opacity-40`
- Zone name below thumbnail: `text-xs font-semibold` (up from `text-[10px]`)
- Ensure swipe-friendly horizontal layout with proper gap

**Test:**
- Visual regression only (no unit test needed — layout change)

**Commit:** `feat(home): enlarge zone selector thumbnails for mobile tap targets`

##### Task A.3: Active Run Banner
**Files:** `src/ui/pages/HomePage.tsx`
**What:**
- New conditional section: shown when `activeGames.length > 0`
- Content: "Level {X}/10 on {ZoneName}" + CONTINUE button (primary CTA)
- When active run exists: CONTINUE is primary, NEW is secondary (smaller)
- Banner uses `GameCard variant="solid"` with accent left border
- Mode pill still shows below the banner

**Test:**
- `HomePage.test.tsx`: Mock `useGameTokensSlot` with active game → verify CONTINUE button renders. Mock with no active game → verify CONTINUE absent.

**Commit:** `feat(home): add active run banner with CONTINUE/NEW buttons`

##### Task A.4: Integrate Mode Selection into Game Flow
**Files:** `src/ui/pages/HomePage.tsx`, `src/dojo/systems.ts`
**What:**
- Mode pill value feeds into `handleStartGame`: calls `create({ account, token_id: gameId, mode: selectedMode })`
- Verify the `create` system call accepts `mode` parameter (check `systems.ts`)
- Default: Map (mode=0). Toggle to Endless (mode=1).
- Mode pill is visible in both connected states (with/without active run)

**Test:**
- `HomePage.test.tsx`: Click Endless → click PLAY → verify `create` called with `mode: 1`. Default PLAY → verify `mode: 0`.

**Commit:** `feat(home): wire mode pill to game creation flow`

##### Task A.5: Daily Challenge Teaser
**Files:** `src/ui/pages/HomePage.tsx`
**What:**
- Keep existing daily challenge card but refine:
  - Increase height to fill remaining space
  - Add countdown timer if challenge is active (reuse `CountdownRing` logic from DailyChallengePage, but inline/smaller)
  - Star icon + "Daily Challenge" + countdown OR "No challenge active"
  - Right chevron for navigation affordance
- Ensure it's always visible (no scroll needed)

**Test:**
- Visual regression only

**Commit:** `feat(home): polish daily challenge teaser card with countdown`

#### Stream B: Navigation Shell

##### Task B.1: BottomTabBar Refinement
**Files:** `src/ui/components/BottomTabBar.tsx`
**What:**
- Replace `backgroundImage: url(action-bar.png)` with `bg-black/80 backdrop-blur-md border-t border-white/10`
- Active state: glow box-shadow + accent-colored icon (per current theme) instead of `scale-105`
- Increase tap area: wrap each icon in 44×44px padded container
- Keep `pb-[env(safe-area-inset-bottom)]` for iOS safe area
- Add `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent`

**Test:**
- `BottomTabBar.test.tsx`: Render with `currentPage="home"` → verify home tab has active class. Click "ranks" → verify navigate called with "ranks".

**Commit:** `feat(nav): refine BottomTabBar with glow states and larger tap targets`

##### Task B.2: App.tsx Shell Integration
**Files:** `src/App.tsx`
**What:**
- Wrap entire content in `PhoneFrame` component
- Replace `h-screen-viewport` references with `h-dvh`
- Ensure `ThemeBackground` renders INSIDE the phone frame (not outside)
- Keep `AnimatePresence` page transitions (already good at 150ms)
- Verify tab bar positioning within phone frame on desktop

**Test:**
- `App.test.tsx`: Render at desktop viewport → verify PhoneFrame wrapper exists. Verify BottomTabBar renders for non-fullscreen pages.

**Commit:** `feat(shell): integrate PhoneFrame into App.tsx layout`

---

### Phase 2: Secondary Pages (Parallel, after Phase 0)

#### Stream C: PlayScreen Optimization

##### Task C.1: PlayScreen Compact Header
**Files:** `src/ui/pages/PlayScreen.tsx`
**What:**
- Current header is 44px (`h-11`) with back button + "Lv.X · Score" + settings gear
- Reduce to 36px: smaller text, tighter padding
- The level/score info can merge into GameHud (it's redundant — HUD already shows score)
- Keep only: back button (44×44 tap target via padding) + settings button (44×44)
- Save ~8px vertical space for grid

**Test:**
- `PlayScreen.test.tsx`: Render with mocked game → verify back and settings buttons present. Verify GameBoard renders.

**Commit:** `feat(play): compact PlayScreen header to maximize grid area`

##### Task C.2: GameBoard Max Height
**Files:** `src/ui/components/GameBoard.tsx`
**What:**
- The ResizeObserver gridSize calculation (lines 36-49) already caps at 56px cell size
- Adjust: let it calculate based on available HEIGHT too (not just width)
- Formula: `min(widthBasedSize, heightBasedSize, 56)` where `heightBasedSize = (availableHeight - hudHeight - padding) / ROWS`
- This ensures the grid fills the screen on tall phones without overflow on short ones

**Test:**
- `GameBoard.test.tsx`: Mock ResizeObserver → verify gridSize respects both width and height constraints.

**Commit:** `feat(play): make GameBoard gridSize responsive to available height`

#### Stream D: LeaderboardPage Fix

##### Task D.1: Fix Leaderboard Display
**Files:** `src/ui/pages/LeaderboardPage.tsx`
**What:**
- Replace raw `entry.token_id` display with `entry.player_name` (already available from hook)
- Add `truncate max-w-[140px]` on ALL name displays (some already have it, podium cards don't)
- Fix score/level display to show mode-appropriate values
- Style rank numbers consistently: `#1 gold, #2 silver, #3 bronze, rest slate`

**Test:**
- `LeaderboardPage.test.tsx`: Mock `useLeaderboardSlot` with 5 entries → verify no overflow. Verify player names display (not hex IDs). Verify empty state message.

**Commit:** `fix(leaderboard): fix hex ID overflow and display player names`

##### Task D.2: Leaderboard Mode Filter
**Files:** `src/ui/pages/LeaderboardPage.tsx`
**What:**
- Add pill-style tabs at top: `[All | Map | Endless]`
- Reuse `ModePill` pattern (or create `FilterPill` variant)
- Filter games by mode field from leaderboard data
- Default: "All"

**Test:**
- `LeaderboardPage.test.tsx`: Click "Map" filter → verify only Map entries shown. Click "All" → verify all entries.

**Commit:** `feat(leaderboard): add mode filter tabs (All/Map/Endless)`

#### Stream E: Other Pages

##### Task E.1: MapPage Header + Node Size
**Files:** `src/ui/pages/MapPage.tsx`
**What:**
- Back button: increase from 32×32px to 44×44px tap area
- Level nodes: increase `NODE_R` from 6→8 and `BOSS_R` from 8.5→11
- Adjust `VB_W`/`VB_H` if needed to prevent node overlap after size increase
- Empty state when `!game`: Show centered message "Start a run from Home" + button to navigate home

**Test:**
- `MapPage.test.tsx`: Render with no `gameId` → verify empty state renders. Render with game → verify SVG map renders.

**Commit:** `feat(map): increase node tap targets and add empty state`

##### Task E.2: SettingsPage Polish
**Files:** `src/ui/pages/SettingsPage.tsx`
**What:**
- Theme thumbnails: fill horizontal space better (use `flex-1` instead of fixed `w-20`)
- Reduce bottom dead space: add subtle version/build footer
- No structural changes

**Test:**
- Visual regression only

**Commit:** `fix(settings): tighten layout density and improve theme thumbnails`

##### Task E.3: DailyChallengePage Touch Targets
**Files:** `src/ui/pages/DailyChallengePage.tsx`
**What:**
- Back button: 32→44px tap area (same pattern as MapPage)
- Verify countdown ring + stats grid fit on 390px without horizontal overflow
- No structural changes — page is well-built

**Test:**
- Visual regression only

**Commit:** `fix(daily): increase back button tap target`

---

### Phase 3: Integration (Serial, after all streams)

##### Task M.1: Cross-Page Card Consistency
**Files:** All pages
**What:**
- Audit all pages: replace ad-hoc `bg-slate-900/80 rounded-xl border border-white/10` with `GameCard variant="solid"`
- Ensure all pages use consistent section headers: `font-['Fredericka_the_Great'] text-sm text-slate-300 tracking-wider`
- Verify phone-frame rendering on all pages at 1024px desktop viewport

**Commit:** `refactor(ui): apply GameCard component across all pages for consistency`

##### Task M.2: Animation & Transition Polish
**Files:** `App.tsx`, page components
**What:**
- Verify `AnimatePresence` slide transitions work correctly inside PhoneFrame
- Ensure page transitions don't overflow the phone-frame bounds on desktop
- Add `overflow: hidden` to PhoneFrame inner container to clip slide animations
- Test: navigate between all pages rapidly — no animation glitches

**Commit:** `fix(transitions): ensure page animations clip within PhoneFrame bounds`

##### Task M.3: Mobile Device Testing Pass
**What (manual verification, not automated):**
- Test on 390×844 (iPhone 14) and 360×800 (Android common)
- Verify: no content overflow, no scroll on HomePage, tab bar respects safe area
- Verify: PlayScreen grid fills available space, HUD readable
- Verify: all tap targets ≥44px
- Verify: no rubber-band scroll on any page
- Verify: PWA add-to-home-screen works (fullscreen mode)

**Commit:** No code commit — testing pass only. Any fixes get their own commits.

---

## 5. Dependency Graph

```
Phase 0 (Serial):
  0.1 DVH Migration
  0.2 PhoneFrame Shell ──────────┐
  0.3 GameCard Component         │
  0.4 ModePill Component         │
  0.5 Connect Button Restyle     │
  0.6 PWA Manifest               │
                                 │
Phase 1 (Parallel, after 0.*):   │
  Stream A: HomePage             │
    A.1 Layout Skeleton ─────────┤ depends on 0.2, 0.3
    A.2 Zone Selector            │
    A.3 Active Run Banner        │ depends on 0.3
    A.4 Mode Integration         │ depends on 0.4
    A.5 Daily Teaser             │
                                 │
  Stream B: Navigation           │
    B.1 BottomTabBar ────────────┤ depends on 0.1
    B.2 App.tsx Integration ─────┘ depends on 0.2, B.1
                                 
Phase 2 (Parallel, after 0.*):   
  Stream C: PlayScreen           
    C.1 Compact Header           │ depends on 0.1
    C.2 GameBoard Height         │
                                 
  Stream D: Leaderboard          
    D.1 Fix Display              │ independent
    D.2 Mode Filter              │ depends on 0.4 pattern
                                 
  Stream E: Other Pages          
    E.1 MapPage Polish           │ independent
    E.2 SettingsPage             │ independent
    E.3 DailyChallenge           │ independent

Phase 3 (Serial, after all):
  M.1 Card Consistency ──── depends on 0.3, all pages done
  M.2 Animation Polish ──── depends on B.2
  M.3 Testing Pass ──────── depends on everything
```

## 6. Commit Strategy

Each task = one atomic commit. The app must build and run after every commit.

**Naming convention:** `{type}({scope}): {description}`
- `refactor(viewport):` — infrastructure changes
- `feat(shell):` — new components/features
- `feat(home):` — HomePage changes
- `feat(nav):` — navigation changes
- `feat(play):` — PlayScreen changes
- `feat(map):` — MapPage changes
- `fix(leaderboard):` — bug fixes
- `fix(settings):` — bug fixes
- `fix(daily):` — bug fixes
- `refactor(ui):` — cross-cutting consistency

**Suggested branch:** `feat/mobile-first-redesign`

**Commit order (recommended):**
```
1.  refactor(viewport): migrate from useViewport to 100dvh + harden mobile touch
2.  feat(shell): add PhoneFrame wrapper for Wordle-style desktop layout
3.  feat(design): add shared GameCard component with glass and solid variants
4.  feat(home): add ModePill toggle component for Map/Endless mode selection
5.  fix(connect): restyle Connect button as primary game CTA
6.  feat(pwa): add PWA manifest with fullscreen display
7.  feat(home): restructure HomePage layout — hero top, interactive bottom
8.  feat(home): enlarge zone selector thumbnails for mobile tap targets
9.  feat(home): add active run banner with CONTINUE/NEW buttons
10. feat(home): wire mode pill to game creation flow
11. feat(home): polish daily challenge teaser card with countdown
12. feat(nav): refine BottomTabBar with glow states and larger tap targets
13. feat(shell): integrate PhoneFrame into App.tsx layout
14. feat(play): compact PlayScreen header to maximize grid area
15. feat(play): make GameBoard gridSize responsive to available height
16. fix(leaderboard): fix hex ID overflow and display player names
17. feat(leaderboard): add mode filter tabs (All/Map/Endless)
18. feat(map): increase node tap targets and add empty state
19. fix(settings): tighten layout density and improve theme thumbnails
20. fix(daily): increase back button tap target
21. refactor(ui): apply GameCard component across all pages for consistency
22. fix(transitions): ensure page animations clip within PhoneFrame bounds
```

---

## 7. QA / Acceptance Criteria

### Automated (Vitest)

| Test | Command | Expected |
|------|---------|----------|
| All unit tests pass | `cd client-budokan && pnpm test` | 0 failures |
| PhoneFrame renders correctly | `pnpm test -- PhoneFrame` | max-w-[430px] on desktop, full-width on mobile |
| ModePill toggles | `pnpm test -- ModePill` | Default = Map, click switches to Endless |
| GameCard variants | `pnpm test -- GameCard` | Glass has backdrop-blur, Solid has bg-slate |
| Connect button text | `pnpm test -- Connect` | "CONNECT & PLAY" renders |
| HomePage states | `pnpm test -- HomePage` | 3 states render correctly (no account, no run, active run) |
| Leaderboard no overflow | `pnpm test -- LeaderboardPage` | Player names display, no raw hex IDs |

### Manual (Playwright or human)

| Scenario | Viewport | Expected |
|----------|----------|----------|
| Desktop phone-frame | 1440×900 | App renders in centered 430px column, dark sides |
| Mobile full-width | 390×844 | App fills viewport, no horizontal scroll |
| HomePage no scroll | 390×844 | All content visible in viewport, no vertical scroll needed |
| PlayScreen grid fills | 390×844 | Grid uses maximum available height after HUD |
| Tab bar safe area | iPhone (Safari) | Tab bar respects notch/home indicator spacing |
| No rubber-band scroll | iOS Safari | Pull down/up on any page does NOT show browser bounce |
| PWA fullscreen | iOS add-to-home | Opens without browser chrome |
| Page transitions clip | Desktop 1024px | Slide animations don't overflow phone frame |
| All tap targets ≥44px | Any mobile | Bottom tabs, back buttons, zone selector all ≥44px |

---

## 8. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| `100dvh` not supported on older browsers | Low | `dvh` is supported in all modern browsers since 2023. Fallback: `height: 100vh; height: 100dvh;` (progressive enhancement) |
| Grid.tsx (690 lines) behavior regression | High | DO NOT refactor Grid.tsx internals. Only touch its container sizing. Run existing drag tests after changes. |
| Mode parameter not wired in `systems.ts` | Medium | Verify `create` system call accepts `mode` before Task A.4. If not, add it as a prerequisite sub-task. |
| PhoneFrame breaks existing page transitions | Medium | Add `overflow: hidden` to frame inner container. Test all transitions after B.2. |
| Image-based buttons don't scale well | Low | Already used in current app. Keep `object-fill` on button images. |
| `overflow: hidden` on body breaks dialog scrolling | Medium | Dialogs use Radix portals which create their own scroll context. Verify GameOverDialog, VictoryDialog, SettingsDialog still scroll. |

---

## 9. What's NOT in Scope

- ❌ Contracts — no contract changes
- ❌ Grid.tsx refactor — complex state machine, behavior preservation only
- ❌ New game features (achievements, quests, shop) — UI redesign only
- ❌ Desktop-specific responsive layouts — desktop is phone-frame only
- ❌ Torii/indexer changes
- ❌ Theme system changes (all 10 themes work as-is)
- ❌ Audio system changes
- ❌ Routing library migration (keep Zustand navigation store)

---

## 10. Files Changed Summary

### New Files (6)
- `src/ui/components/shared/PhoneFrame.tsx`
- `src/ui/components/shared/PhoneFrame.test.tsx`
- `src/ui/components/shared/GameCard.tsx`
- `src/ui/components/shared/GameCard.test.tsx`
- `src/ui/components/shared/ModePill.tsx`
- `public/manifest.json`

### Modified Files (12)
- `src/App.tsx` — PhoneFrame integration, dvh classes
- `src/index.css` — dvh class, body overflow/user-select, remove .h-screen-viewport
- `index.html` — PWA manifest link
- `src/ui/pages/HomePage.tsx` — Full layout redesign
- `src/ui/pages/PlayScreen.tsx` — Compact header, dvh migration
- `src/ui/pages/LeaderboardPage.tsx` — Fix IDs, add mode filter
- `src/ui/pages/MapPage.tsx` — Bigger nodes, empty state, header
- `src/ui/pages/SettingsPage.tsx` — Density fix
- `src/ui/pages/DailyChallengePage.tsx` — Back button size
- `src/ui/components/BottomTabBar.tsx` — Glow states, tap targets
- `src/ui/components/Connect.tsx` — Restyle as CTA
- `src/ui/components/GameBoard.tsx` — Height-responsive gridSize
- `src/stores/navigationStore.ts` — Add selectedMode field

### Untouched Critical Files
- `src/ui/components/Grid.tsx` — 690-line state machine, DO NOT MODIFY internals
- `src/ui/components/Block.tsx` — Block rendering
- `src/dojo/*` — Dojo integration layer
- `src/hooks/*` — All hooks preserved
- `src/contexts/*` — All contexts preserved
- `src/stores/moveTxStore.ts` — Move transaction state
