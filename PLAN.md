# zKube UI Redesign — Implementation Plan

## Overview

Adapt the design references into the production `client-budokan/` codebase. This is a **visual-only redesign** — the data layer (hooks, RECS, Dojo, stores, contexts) remains untouched. Per-theme block colors are preserved. All 10 themes get the new token system via algorithmic derivation.

**Design references:**
- `/zkube-ui-design.jsx` (1532 lines) — 7 screens: Home, Map, Play, Boss, Leaderboard, Daily, Settings
- `/zkube-dual-unlock.jsx` (846 lines) — Player Profile page with dual-unlock monetization model

**Key deliverables:**
- Extended theme token system (surface, border, glow, text, textMuted, accent2) for all 10 themes
- Font migration: Fredericka the Great → Chakra Petch (display) + DM Sans (body)
- Gradient backgrounds + SVG pattern overlays (replacing image backgrounds)
- Theme-aware BottomTabBar with 5 tabs (replacing hardcoded 4-tab emerald bar)
- 6 page redesigns matching the design reference
- 1 new page: BossRevealPage with navigation integration
- 1 new page: ProfilePage with 3 tabs (Overview, Quests, Achievements) + UnlockModal

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Block colors | **Per-theme (existing)** | Keep all 10 theme-specific block color palettes. Do NOT use the universal block colors from the design reference. |
| Theme coverage | **All 10 themes** | Auto-derive new tokens (surface, border, glow, text, textMuted, accent2) for all 10 themes algorithmically from existing accent colors. |
| Background strategy | **Gradient + SVG patterns** | Replace per-theme background.png images with CSS gradients and subtle SVG pattern overlays. Faster load, smaller bundle. |
| Font strategy | **Google Fonts** | Load Chakra Petch + DM Sans from Google Fonts CDN. Remove local Fredericka the Great TTF. |
| Styling approach | **TailwindCSS** | All new markup uses Tailwind utilities. No inline styles. Theme-dynamic values use CSS custom properties or `style={{}}` when computed. |
| Boss screen | **New overlay page** | Add "boss" as OverlayId in navigationStore, render BossRevealPage between map and play. |
| Profile page | **New tab page (5th tab)** | Add "profile" as TabId in navigationStore. BottomTabBar becomes 5 tabs: Home, Map, Profile, Ranks, Settings. |
| Profile data strategy | **Real data + mock placeholders** | Wire real hooks (username, stars, zones, games) for Overview tab. Use static mock data for Quests, Achievements, XP/Level, and ETH pricing — these need contract-side work that doesn't exist yet. |
| Grid.tsx | **DO NOT MODIFY** | The 690-line grid state machine is untouchable. Only its container/wrapper can change. |

---

## Design Reference

**File:** `/zkube-ui-design.jsx`

| Screen | Lines | Key Elements |
|--------|-------|--------------|
| Shared (themes, patterns, tab bar) | 1–208 | THEMES object, PatternOverlay, Star, TabBar, StatusBar |
| HomeScreen | 212–462 | Text logo, player card, daily banner, vertical zone list, NEW GAME button |
| MapScreen | 464–618 | Zone header + star count, sinusoidal SVG path, circle/square nodes |
| PlayScreen | 621–797 | Level badge + stars, moves/score/combo row, constraint bar, grid, next row, swipe hint |
| BossScreen | 799–919 | Large emoji, boss name + glow, description, dual constraint cards, FIGHT BOSS button |
| LeaderboardScreen | 921–1028 | Title, Zone/Endless/Daily tabs, card-based player list with medals |
| DailyScreen | 1030–1162 | Header + countdown pill, mini top-3 leaderboard, grid preview, START DAILY button |
| SettingsScreen | 1164–1322 | Account card, theme color dots, audio toggle switches, about section |

**File:** `/zkube-dual-unlock.jsx`

| Screen | Lines | Key Elements |
|--------|-------|--------------|
| Shared (ProgressBar, Star) | 1–66 | Theme tokens, ProgressBar with glow, Star icon, PatternOverlay |
| UnlockModal | 68–354 | Bottom sheet: zone header, dual-path (Earn It / Skip Ahead), discount scale bar chart |
| OverviewTab | 356–478 | 4-stat grid, zone progress with star bars, locked zone dual-unlock teaser, recent activity |
| QuestsTab | 480–625 | Next Unlock dual-path card, daily quests (3), weekly quests (3), milestones (3) |
| AchievementsTab | 627–717 | Summary card with rarity breakdown, 3 categories (Combat/Mastery/Explorer), 2-col achievement grid |
| ProfilePage main | 719–846 | Player card (avatar + level badge + XP bar + star count), 3-tab layout, bottom tab bar with 5 tabs |

---

## Dependency Graph

```
Phase 0 (Serial — Foundation)
├── 0.1 Theme Token Extension ──────────────┐
├── 0.2 Font Migration ─────────────────────┤
├── 0.3 Gradient Backgrounds + SVG Patterns ─┤ (depends on 0.1)
└── 0.4 BottomTabBar Theme-Aware (5 tabs) ──┘ (depends on 0.1)

Phase 1 (Parallel — all depend on Phase 0 complete)
├── 1.1 HomePage ──────────────┐
├── 1.2 PlayScreen HUD ────────┤
├── 1.3 MapPage ───────────────┤  All parallel, independent files
├── 1.4 SettingsPage ──────────┤
├── 1.5 LeaderboardPage ───────┤
└── 1.6 DailyChallengePage ────┘

Phase 2 (Parallel with Phase 1 — both depend on Phase 0 only)
├── 2.1 BossRevealPage + Navigation
└── 2.2 ProfilePage (3 tabs + UnlockModal)

Phase 3 (After Phase 1 + 2)
└── 3.1 Cross-Theme QA + Polish
```

---

## Phase 0: Foundation (Serial)

### Task 0.1: Extend Theme Token System

**Goal:** Add `surface`, `border`, `glow`, `text`, `textMuted`, `accent2`, and `bgGradient` tokens to all 10 themes.

**Files to modify:**
- `client-budokan/src/config/themes.ts` — Extend `ThemeColors` interface, add derived values to all 10 theme objects
- `client-budokan/src/index.css` — Add CSS custom properties for the new tokens in each `[data-theme="theme-N"]` block

**Extend the `ThemeColors` interface:**
```typescript
export interface ThemeColors {
  // === EXISTING (keep all) ===
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  gridLines: string;
  gridLinesAlpha: number;
  gridBg: string;
  gridCellAlt: string;
  frameBorder: string;
  hudBar: string;
  hudBarBorder: string;
  actionBarBg: string;
  dangerZone: string;
  dangerZoneAlpha: number;
  accent: string;
  blocks: Record<1 | 2 | 3 | 4, BlockColors>;
  particles: { primary: string[]; explosion: string[] };

  // === NEW TOKENS ===
  accent2: string;       // Warm secondary accent (gold/amber/coral)
  surface: string;       // Card/container bg: accent @ 8% opacity
  border: string;        // Card/container border: accent @ 15% opacity
  glow: string;          // Box-shadow for active elements: accent @ 30%
  text: string;          // Primary text color (light, slightly tinted)
  textMuted: string;     // Secondary text: text @ 50% opacity
  bgGradient: string;    // Full CSS gradient string for background
}
```

**Derivation formulas (apply to all 10 themes):**

Given theme's existing `accent` hex color (e.g. `#A9D8FF`):
- `surface` = `rgba({accent_r}, {accent_g}, {accent_b}, 0.08)`
- `border` = `rgba({accent_r}, {accent_g}, {accent_b}, 0.15)`
- `glow` = `0 0 40px rgba({accent_r}, {accent_g}, {accent_b}, 0.3)`
- `textMuted` = `rgba({text_r}, {text_g}, {text_b}, 0.5)`
- `bgGradient` = `linear-gradient(170deg, {darken(bg, 0.3)} 0%, {bg} 40%, {lighten(bg, 0.08)} 70%, {lighten(bg, 0.15)} 100%)`

Create a helper function `hexToRgba(hex: string, alpha: number): string` in themes.ts to implement the derivation.

**accent2 and text — per-theme explicit values:**

| Theme | accent | accent2 | text |
|-------|--------|---------|------|
| 1 Polynesian | #A9D8FF | #FFD93D | #E0F0F5 |
| 2 Ancient Egypt | #D4AF37 | #FF6B4A | #F5EDE3 |
| 3 Norse | #7EB8DA | #C4A2FF | #E5EDF5 |
| 4 Ancient Greece | #3B6FA0 | #FFD93D | #E8ECF5 |
| 5 Feudal Japan | #C41E3A | #FFD700 | #F5E6D3 |
| 6 Ancient China | #50C878 | #FFD93D | #E0F5E8 |
| 7 Ancient Persia | #1E90FF | #FFB347 | #E8ECF5 |
| 8 Mayan | #4CAF50 | #FFD93D | #E5F0E5 |
| 9 Tribal | #40C8B8 | #E07850 | #F0E8E0 |
| 10 Inca | #D4AF37 | #FF6B4A | #F0EDE5 |

**CSS custom properties to add (for each `[data-theme="theme-N"]` block):**
```css
--theme-surface: ...;
--theme-border: ...;
--theme-glow: ...;
--theme-text: ...;
--theme-text-muted: ...;
--theme-accent2: ...;
--theme-bg-gradient: ...;
```

**Verification:**
- `pnpm build` passes (no TypeScript errors from interface change)
- Manually check: `getThemeColors("theme-1")` returns all new fields
- Grep for `getThemeColors` usage — ensure existing consumers still work (they just ignore new fields)

**Commit:** `feat: extend theme token system with surface/border/glow/text/accent2 for all 10 themes`

---

### Task 0.2: Font Migration

**Goal:** Replace Fredericka the Great with Chakra Petch (display) + DM Sans (body).

**Files to modify:**
- `client-budokan/index.html` — Add Google Fonts `<link>` for Chakra Petch and DM Sans
- `client-budokan/src/index.css` — Remove `@font-face` for Fredericka, update `:root { font-family }`, remove Bangers import
- `client-budokan/tailwind.config.cjs` — Update `fontFamily` mappings

**index.html — add in `<head>` (before other links):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**index.css — changes:**
- Remove line 1: `@import url("https://fonts.googleapis.com/css2?family=Bangers&display=swap");`
- Remove the `@font-face` block for Fredericka the Great (lines 7-13)
- Update `:root { font-family: "DM Sans", sans-serif; }` (was `"Fredericka the Great", sans`)

**tailwind.config.cjs — update fontFamily:**
```javascript
fontFamily: {
  sans: ['"DM Sans"', 'sans-serif'],
  display: ['"Chakra Petch"', 'sans-serif'],
  body: ['"DM Sans"', 'sans-serif'],
},
```

**Usage convention (for all subsequent tasks):**
- Display/headings: `className="font-display"` for Chakra Petch — page titles, scores, level numbers, boss names, button text, "zKube" logo
- Body/labels: default or `font-body` class (DM Sans) — descriptions, labels, muted text, constraints, about section
- Numeric data: `font-display tabular-nums` — scores, moves, combo counters, countdowns

**Verification:**
- `pnpm build` passes
- Open `https://localhost:5125` — fonts visually changed on all existing pages
- DevTools: check computed font-family on body = "DM Sans"

**Commit:** `feat: migrate fonts to Chakra Petch (display) + DM Sans (body)`

---

### Task 0.3: Gradient Backgrounds + SVG Pattern Overlays

**Goal:** Replace image-based backgrounds with CSS gradients and themed SVG patterns.

**Files to modify:**
- `client-budokan/src/ui/components/shared/ThemeBackground.tsx` — Rewrite to use gradient + pattern

**Files to create:**
- `client-budokan/src/ui/components/shared/PatternOverlay.tsx` — New SVG pattern component

**ThemeBackground.tsx — rewrite:**
```tsx
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors, type ThemeId } from "@/config/themes";
import PatternOverlay from "./PatternOverlay";

const ThemeBackground: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate as ThemeId);

  return (
    <>
      <div
        className="fixed inset-0 -z-20"
        style={{ background: colors.bgGradient }}
      />
      <PatternOverlay themeId={themeTemplate as ThemeId} />
    </>
  );
};

export default ThemeBackground;
```

**PatternOverlay.tsx — new component:**

Creates a full-screen SVG with a subtle geometric pattern at 4% opacity. The pattern shape depends on the theme.

Pattern assignments:

| Theme | Pattern | SVG Shape |
|-------|---------|-----------|
| 1 Polynesian | diamonds | `M20 0 L40 20 L20 40 L0 20Z` + center circle |
| 2 Ancient Egypt | triangles | Equilateral triangles in a grid |
| 3 Norse | hexagons | Hexagonal grid cells |
| 4 Ancient Greece | waves | Sine wave paths |
| 5 Feudal Japan | circles | Large circles with crosshairs |
| 6 Ancient China | waves | Sine wave paths |
| 7 Ancient Persia | waves | Cubic bezier waves + dots |
| 8 Mayan | triangles | Equilateral triangles |
| 9 Tribal | circles | Circles with dots |
| 10 Inca | diamonds | Diamond grid |

The component renders:
```tsx
<svg className="fixed inset-0 -z-10 pointer-events-none opacity-[0.04] w-full h-full">
  <defs>
    <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
      {/* theme-specific path elements using accent color for stroke */}
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill={`url(#${patternId})`} />
</svg>
```

Reference the design file lines 62–131 for the 3 existing pattern implementations (Polynesian, Japan, Persia). Extrapolate the remaining 7 patterns from these.

**Verification:**
- `pnpm build` passes
- Open each of the 3 alpha themes (Polynesian, Japan, Persia) — see gradient background with faint pattern overlay
- No background image loading in Network tab for theme backgrounds
- Pattern is barely visible (4% opacity) but discernible on close inspection

**Commit:** `feat: replace image backgrounds with gradient + SVG pattern overlays`

---

### Task 0.4: BottomTabBar — Theme-Aware, 5 Tabs

**Goal:** Make the tab bar use theme accent colors instead of hardcoded emerald. Switch to 5 unicode-icon tabs including Profile.

**Files to modify:**
- `client-budokan/src/ui/components/BottomTabBar.tsx` — Rewrite styling, add Profile tab
- `client-budokan/src/stores/navigationStore.ts` — Add "profile" to TabId union type

**navigationStore.ts — type change:**
```diff
- export type TabId = "home" | "map" | "ranks" | "settings";
+ export type TabId = "home" | "map" | "profile" | "ranks" | "settings";
```

**BottomTabBar.tsx — new tab definition:**
```typescript
const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "home",     icon: "⬡", label: "Home" },
  { id: "map",      icon: "◈", label: "Map" },
  { id: "profile",  icon: "◉", label: "Profile" },
  { id: "ranks",    icon: "◆", label: "Ranks" },
  { id: "settings", icon: "⚙", label: "Settings" },
];
```

**Current issues being fixed:**
- Hardcoded `emerald-300`, `emerald-400`, `text-slate-400` colors
- Lucide icons (Home, Gamepad2, Trophy, Settings) — don't match design
- Only 4 tabs — design has 5

**New styling:**
- Use CSS variable `var(--theme-accent)` for active state colors
- Use `var(--theme-text-muted)` for inactive state
- Background: `bg-black/60 backdrop-blur-xl` with top border in `var(--theme-border)`
- Active indicator: top bar colored with `var(--theme-accent)` + glow

Reference design `/zkube-ui-design.jsx` lines 140–186 for 4-tab version, `/zkube-dual-unlock.jsx` lines 804–818 for 5-tab version with Profile.

**Key style mappings:**
```
Active icon/text color:   var(--theme-accent)
Inactive icon/text color: var(--theme-text-muted)
Background:               bg-black/60 backdrop-blur-xl
Top border:               border color = var(--theme-border)
Active top bar:           bg color = var(--theme-accent)
Active glow:              box-shadow = 0 0 8px var(--theme-accent)
```

**Verification:**
- `pnpm build` passes
- Tab bar shows 5 tabs with correct icons and labels
- Tab bar colors change when switching themes in Settings
- Profile tab navigates to "profile" page (will show empty until Task 2.2)
- No hardcoded emerald/slate references remain in BottomTabBar.tsx

**Commit:** `feat: make BottomTabBar theme-aware with 5 tabs including Profile`

---

## Phase 1: Page Redesigns (Parallel)

All Phase 1 tasks can execute in parallel — each modifies a different page file. All depend on Phase 0 being complete.

**Shared patterns across all pages:**
- Import theme: `const { themeTemplate } = useTheme(); const colors = getThemeColors(themeTemplate as ThemeId);`
- Display font: `className="font-display"` for Chakra Petch headings
- Body font: default (DM Sans via root)
- Surface cards: `style={{ background: colors.surface, border: \`1px solid ${colors.border}\` }}`
- Text: `style={{ color: colors.text }}` or `style={{ color: colors.textMuted }}`
- All data hooks stay EXACTLY as they are — only the JSX/styling changes

---

### Task 1.1: HomePage

**Goal:** Restructure home page to match design: text logo → player card → daily banner → vertical zone list → NEW GAME button.

**File:** `client-budokan/src/ui/pages/HomePage.tsx` (351 lines — rewrite)

**Design reference:** `/zkube-ui-design.jsx` lines 212–462

**New layout (top to bottom):**

1. **Logo section** — "zKube" in `font-display text-4xl font-black tracking-wider` with `textShadow: colors.glow`. Below: "ON-CHAIN PUZZLE" in `text-[10px] uppercase tracking-[0.3em]` in `colors.accent`.

2. **Player card** — Surface card with:
   - Left: Avatar square (gradient `accent→accent2`, initials "ZK" in font-display)
   - Middle: Username from `useControllerUsername()`, star count from `usePlayerMeta()`
   - Right: "CONNECTED" badge (accent bg at 15%, accent text)
   - If not connected: Show `<Connect />` component instead

3. **Daily Challenge banner** — Gradient card (`accent@20% → accent2@15%`), border `accent@30%`:
   - Left: "⚡ DAILY CHALLENGE" in `colors.accent2`, font-display. Below: countdown + player count
   - Right: "PLAY" pill button in `colors.accent2` bg
   - onClick: `navigate("daily")`

4. **Zone selector** — Section label "SELECT ZONE" in `text-[11px] uppercase tracking-[0.15em]` textMuted. Then vertical card list:
   - Each zone card: emoji icon + zone name (font-display) + star progress (3 mini stars + "X/30") + arrow (→) or lock (🔒)
   - Unlocked zones: surface bg, full opacity
   - Locked zones: `rgba(255,255,255,0.02)` bg, 40% opacity
   - Zone emojis: Polynesian 🌊, Egypt 🏛️, Norse ⚔️, Greece 🏺, Japan ⛩️, China 🐉, Persia 🕌, Mayan 🌿, Tribal 🥁, Inca ⛰️

5. **NEW GAME button** — Full width, gradient `accent→accent CC`, text `#0a1628`, font-display, tracking-[0.1em], `boxShadow: colors.glow`. onClick: trigger game creation flow (freeMint + create + navigate to map).

**Data hooks to use (existing, unchanged):**
- `useControllerUsername()` — player name
- `usePlayerMeta()` — star count (from best_level or packed MetaData)
- `useAccountCustom()` — wallet address / connected state
- `useGameTokensSlot()` — check for existing game to show CONTINUE
- `useTheme()` + `getThemeColors()` — theme colors
- `useNavigationStore()` — navigate()

**Keep existing logic for:**
- Game creation flow (freeMint → create → navigate)
- Zone selection state
- Mode selection (Map/Endless) — integrate ModePill somewhere appropriate (e.g. below zone list or in zone card interaction)
- Entitlement checking

**Verification:**
- `pnpm build` passes
- Playwright screenshot at 390x844 for Polynesian, Japan, Persia themes
- Player card shows username when connected, Connect button when not
- Zone cards are vertical, scrollable
- Daily banner navigates to daily page on click
- NEW GAME button triggers game creation flow

**Commit:** `feat: redesign HomePage with vertical zone list and daily banner`

---

### Task 1.2: PlayScreen HUD Redesign

**Goal:** Restructure the HUD layout above the grid. Do NOT modify Grid.tsx or GameBoard internals.

**Files to modify:**
- `client-budokan/src/ui/pages/PlayScreen.tsx` (418 lines — modify wrapper/HUD only)
- `client-budokan/src/ui/components/hud/GameHud.tsx` (308 lines — restyle)

**Design reference:** `/zkube-ui-design.jsx` lines 621–797

**New HUD layout (above grid):**

1. **Top bar** — flex row, space-between:
   - Left group: Level badge (`LV.{n}` in accent surface pill, font-display text-[10px] tracking-[0.1em]) + 3 star icons (filled/empty based on potential stars)
   - Right group: Three stat columns (MOVES, SCORE, COMBO) each with muted label (9px, DM Sans) above bold value (15px, Chakra Petch)
   - MOVES: `{used}/{max}` in colors.text
   - SCORE: value in colors.accent2
   - COMBO: `x{n}` in colors.accent

2. **Constraint bar** — Below HUD, above grid. Surface card with border, flex row:
   - Left: constraint emoji + constraint description (DM Sans, 10px, colors.text)
   - Right: progress `{current}/{target}` (Chakra Petch, bold, colors.accent)
   - If two constraints (boss level): stack two rows
   - If no constraint: hide the bar

3. **Grid area** — Keep existing GameBoard/Grid component. Don't modify props or internals.

4. **Next row preview** — Below grid. "NEXT" label (DM Sans, 9px, textMuted) + 8 small colored squares showing next_row data.

5. **Swipe hint** — Below next row. "← Swipe rows to align blocks →" in textMuted, 10px, centered.

**What stays from current PlayScreen:**
- All dialog components (GameOverDialog, VictoryDialog, LevelCompleteDialog)
- Game creation/loading logic
- Back button functionality
- Settings/surrender overlay
- All hooks and state management

**What changes:**
- HUD arrangement and styling (GameHud.tsx)
- Constraint display location (move from HUD to dedicated bar)
- Add next row preview section
- Add swipe hint text

**Verification:**
- `pnpm build` passes
- Level badge shows correct level number
- Stars reflect potential star rating
- Moves/Score/Combo display correctly during gameplay
- Constraint bar shows current constraint with progress
- Grid renders identically to before (no Grid.tsx changes)
- Swipe hint visible below grid

**Commit:** `feat: redesign PlayScreen HUD with compact layout and constraint bar`

---

### Task 1.3: MapPage

**Goal:** Restyle the zone map with simpler circle/square nodes following the design reference.

**File:** `client-budokan/src/ui/pages/MapPage.tsx` (524 lines — restyle, preserve data logic)

**Design reference:** `/zkube-ui-design.jsx` lines 464–618

**New layout:**

1. **Header** — flex row, space-between:
   - Left: Zone emoji + zone name (Chakra Petch, 18px, 800 weight)
   - Right: Star icon (filled) + `{earned}/30` (DM Sans, 11px, colors.accent2)

2. **Map visualization** — Keep the SVG-based approach but simplify node rendering:
   - **Completed nodes**: Circle (46px), `colors.surface` bg, `colors.border` border, level number in Chakra Petch
   - **Current node**: Circle (46px), gradient fill (`accent → accent2`), `accent` border (2px), glow shadow, ▼ indicator above
   - **Locked nodes**: Circle (46px), `rgba(255,255,255,0.03)` bg, `rgba(255,255,255,0.06)` border, textMuted number
   - **Boss node (L10)**: Rounded square (54px, borderRadius 14px), emoji 👹 instead of number, "BOSS" label below if locked
   - Stars shown below completed nodes (3 mini star icons)

3. **Path** — Keep existing SVG path logic but use `colors.border` for the dashed line color.

4. **Level preview bottom sheet** — Keep existing functionality, restyle with surface/border/text tokens.

**IMPORTANT: Boss node tap behavior:**
- If boss node (L10) is tapped AND player has reached level 10 → navigate to "boss" overlay (Task 2.1)
- This requires checking: `if (level === 10 && nodeState !== 'locked') navigate("boss", gameId)`
- Add this navigation hook but the BossRevealPage itself is created in Task 2.1

**Keep existing:**
- `useMapData()`, `useMapLayout()` hooks
- SVG path calculation logic
- Bottom sheet animation
- Auto-scroll to current level

**Verification:**
- `pnpm build` passes
- Map nodes are circles (regular) and rounded square (boss)
- Current level has gradient fill + glow
- Completed levels show star ratings
- Locked levels are dimmed
- Boss node shows 👹 emoji

**Commit:** `feat: redesign MapPage with simplified circle/square nodes`

---

### Task 1.4: SettingsPage

**Goal:** Restyle settings with account card first, theme dots, audio toggles, and about section.

**File:** `client-budokan/src/ui/pages/SettingsPage.tsx` (199 lines — restyle)

**Design reference:** `/zkube-ui-design.jsx` lines 1164–1322

**New layout (top to bottom):**

1. **Title** — "Settings" in Chakra Petch, 18px, 800 weight, colors.text

2. **Account section** — Label "ACCOUNT" (DM Sans, 10px, uppercase, tracking-[0.15em], textMuted). Surface card with:
   - Left: username (Chakra Petch, 12px, 700) + truncated address (DM Sans, 9px, textMuted)
   - Right: "Cartridge ✓" (DM Sans, 10px, accent)

3. **Theme section** — Label "PREVIEW THEME". Row of theme buttons (one per active theme):
   - Each: colored circle (20px, filled with theme's accent color) + theme name below (8px, DM Sans)
   - Selected theme has accent border (2px) + accent bg at 15%
   - Tapping a theme calls `setThemeTemplate(themeId)`

4. **Audio section** — Label "AUDIO". Two surface cards:
   - "Music" with toggle switch (pill shape: 40x22, accent bg when on, circle knob)
   - "Sound Effects" with toggle switch
   - Toggle state from `useMusicPlayer()` volume (> 0 = on)

5. **About section** — Label "ABOUT". Surface card:
   - "zKube v1.0 · Dojo 1.8.0" (DM Sans, 11px, colors.text)
   - "Fully on-chain · Starknet" (DM Sans, 9px, textMuted)

**Keep existing:**
- Theme persistence (localStorage)
- Audio volume management (useMusicPlayer)
- Disconnect functionality
- Copy-to-clipboard
- All hooks

**Verification:**
- `pnpm build` passes
- Theme dots switch themes in real-time
- Audio toggles control music/SFX
- Account info shows connected wallet details

**Commit:** `feat: redesign SettingsPage with theme dots and toggle switches`

---

### Task 1.5: LeaderboardPage

**Goal:** Add Zone/Endless/Daily tabs and switch to card-based player list.

**File:** `client-budokan/src/ui/pages/LeaderboardPage.tsx` (137 lines — rewrite)

**Design reference:** `/zkube-ui-design.jsx` lines 921–1028

**New layout:**

1. **Title** — "Leaderboard" in Chakra Petch, 18px, 800 weight

2. **Tab bar** — 3 tabs: "Zone", "Endless", "Daily". Flex row, each tab is flex-1:
   - Active tab: accent color text, `2px solid accent` bottom border, font-weight 700
   - Inactive tab: textMuted, transparent bottom border, font-weight 500
   - DM Sans, 11px

3. **Player list** — Vertical card list (gap 6px), scrollable:
   - Each card: surface bg, border, borderRadius 10px, padding 10px 12px
   - Left: rank display — medal emoji (🥇🥈🥉) for 1-3, number for 4+ (Chakra Petch, 800 weight)
   - Middle: player name (Chakra Petch, 12px, 700) + star mini-display (3 stars + count)
   - Right: score (Chakra Petch, 13px, 800, colors.text)
   - "You" card: highlighted with `accent@12%` bg, `accent@30%` border

**Tab filtering logic:**
- "Zone" tab: filter leaderboard by Map mode (mode = 0) — current default
- "Endless" tab: filter by Endless mode (mode = 1)
- "Daily" tab: show daily challenge leaderboard (use `useDailyLeaderboard` if available, or same data filtered)
- Note: Tab state is local useState, not persisted

**Data hooks:**
- `useLeaderboardSlot()` — existing hook, provides sorted game entries
- `useAccountCustom()` — for highlighting "you" entry
- `useGetUsernames()` — for resolving player names

**Verification:**
- `pnpm build` passes
- Three tabs are visible and switchable
- Player cards show rank, name, stars, score
- Current player's card is highlighted
- Medals show for top 3

**Commit:** `feat: redesign LeaderboardPage with tabs and card-based player list`

---

### Task 1.6: DailyChallengePage

**Goal:** Restructure with header + countdown + mini leaderboard + grid preview + CTA.

**File:** `client-budokan/src/ui/pages/DailyChallengePage.tsx` (324 lines — restyle)

**Design reference:** `/zkube-ui-design.jsx` lines 1030–1162

**New layout:**

1. **Header** — flex row, space-between:
   - Left: "⚡ Daily Challenge" (Chakra Petch, 16px, 800) + date string + "Same seed for all" (DM Sans, 10px, textMuted)
   - Right: Countdown pill (surface bg, accent border, Chakra Petch, "HH:MM:SS" format)

2. **Mini leaderboard** — Surface card with border, borderRadius 10px:
   - Section label "TODAY'S TOP 3" (DM Sans, 9px, uppercase, tracking-[0.15em], textMuted)
   - 3 rows: medal emoji + player name + score (Chakra Petch, accent2)
   - Rows separated by border-top in colors.border

3. **Grid preview** — Centered mini grid showing the daily challenge starting configuration:
   - Small blocks (22px) in `rgba(0,0,0,0.3)` container with border
   - Use per-theme block colors from `getBlockColors()`
   - Below: "X players today" (DM Sans, 10px, textMuted)

4. **START DAILY button** — Full width, gradient `accent2 → accent2 CC`, color `#0a1628`, Chakra Petch, tracking-[0.1em], glow shadow with accent2.

**Data hooks (existing, unchanged):**
- `useCurrentChallenge()` — active challenge data
- `usePlayerEntry()` — player's entry
- `useDailyLeaderboard()` — top entries
- Countdown timer logic (existing)

**Keep existing:**
- Challenge registration flow
- Prize claiming logic
- Settled state handling

**Verification:**
- `pnpm build` passes
- Countdown timer updates every second
- Mini leaderboard shows top 3 with medals
- START DAILY button triggers challenge registration
- Grid preview shows starting block configuration

**Commit:** `feat: redesign DailyChallengePage with mini leaderboard and grid preview`

---

## Phase 2: New Pages (Parallel with Phase 1)

Both Phase 2 tasks depend only on Phase 0 and are independent of each other and Phase 1.

### Task 2.1: BossRevealPage + Navigation

**Goal:** Create a new BossRevealPage shown before level 10 boss fights, and integrate it into navigation.

**Files to create:**
- `client-budokan/src/ui/pages/BossRevealPage.tsx` — New page component
- `client-budokan/src/config/bossIdentities.ts` — Client-side boss identity mapping

**Files to modify:**
- `client-budokan/src/stores/navigationStore.ts` — Add "boss" overlay
- `client-budokan/src/App.tsx` — Register BossRevealPage in pageComponents

**Step 1: Boss identity data (`config/bossIdentities.ts`)**

Map the 10 boss IDs from `contracts/src/helpers/boss.cairo` to display data:

```typescript
export interface BossDisplayData {
  id: number;
  name: string;
  emoji: string;
  title: string;
  description: string;
}

export const BOSS_IDENTITIES: Record<number, BossDisplayData> = {
  1:  { id: 1,  name: "COMBO MASTER",   emoji: "🔥", title: "Lord of Chains",      description: "Chains endless combos into devastating streaks" },
  2:  { id: 2,  name: "DEMOLISHER",     emoji: "💥", title: "Breaker of Blocks",    description: "Shatters blocks with relentless precision" },
  3:  { id: 3,  name: "DAREDEVIL",      emoji: "⚡", title: "Edge Walker",          description: "Thrives on the razor's edge of destruction" },
  4:  { id: 4,  name: "PURIST",         emoji: "🧊", title: "Keeper of Order",      description: "Demands absolute control of the grid" },
  5:  { id: 5,  name: "HARVESTER",      emoji: "🌀", title: "Reaper of Lines",      description: "Harvests blocks with surgical efficiency" },
  6:  { id: 6,  name: "TIDECALLER",     emoji: "🌊", title: "Master of Currents",   description: "Commands the deep currents of the grid" },
  7:  { id: 7,  name: "STACKER",        emoji: "🗼", title: "Tower Builder",        description: "Builds towering combos from nothing" },
  8:  { id: 8,  name: "SURGEON",        emoji: "🎯", title: "Precision Cutter",     description: "Cuts with perfect accuracy under pressure" },
  9:  { id: 9,  name: "ASCETIC",        emoji: "🧘", title: "Master of Restraint",  description: "Achieves victory through disciplined control" },
  10: { id: 10, name: "PERFECTIONIST",  emoji: "👹", title: "Flawless Executor",    description: "Demands nothing less than perfection" },
};

export function getBossDisplay(bossId: number): BossDisplayData {
  return BOSS_IDENTITIES[bossId] ?? BOSS_IDENTITIES[1];
}
```

**Step 2: Navigation (`navigationStore.ts`)**

```diff
- export type OverlayId = "play" | "daily";
+ export type OverlayId = "play" | "daily" | "boss";

- export const FULLSCREEN_PAGES: ReadonlySet<PageId> = new Set(["play"]);
+ export const FULLSCREEN_PAGES: ReadonlySet<PageId> = new Set(["play", "boss"]);
```

Update `getBackTarget`:
```typescript
case "boss": return "map";
```

**Step 3: App.tsx registration**

```diff
+ import BossRevealPage from "@/ui/pages/BossRevealPage";

  const pageComponents: Record<PageId, React.ReactNode> = {
    home: <HomePage />,
    play: <PlayScreen />,
    map: <MapPage />,
+   profile: <ProfilePage />,  // (added by Task 2.2)
    ranks: <LeaderboardPage />,
    settings: <SettingsPage />,
    daily: <DailyChallengePage />,
+   boss: <BossRevealPage />,
  };
```

Note: Both Task 2.1 and 2.2 add entries to this map. If executed in parallel, the second commit should merge cleanly since they're different keys.

**Step 4: BossRevealPage component**

**Design reference:** `/zkube-ui-design.jsx` lines 799–919

**Layout:**
- Full-screen centered layout, no tab bar (boss is in FULLSCREEN_PAGES)
- **Back button** — Top-left, navigates back to map via `goBack()`

- **Boss emoji** — 64px, centered, with `filter: drop-shadow(0 0 20px ${accent}80)`
- **Level label** — "Level 10 · Boss" in DM Sans, 10px, uppercase, tracking-[0.3em], accent color
- **Boss name** — Chakra Petch, 22px, 900 weight, colors.text, `textShadow: colors.glow`
- **Boss title** — DM Sans, 11px, textMuted, centered

- **Constraint cards** — Two cards stacked vertically (gap 8px), width 100%:
  - Each: `rgba(255,59,59,0.08)` bg, `rgba(255,59,59,0.2)` border, borderRadius 10px
  - Left: constraint emoji (18px) — 🔥 for ComboLines, 💎 for BreakBlocks, ⚡ for ComboStreak, 📊 for KeepGridBelow
  - Right: constraint name (Chakra Petch, 11px, 700, colors.text) + constraint description (DM Sans, 9px, textMuted)
  - Constraint data comes from the GameLevel model (constraint_type maps to description)

- **FIGHT BOSS button** — Full width, red gradient (`linear-gradient(135deg, #FF3B3B, #FF6B3B)`), white text, Chakra Petch, tracking-[0.1em], `boxShadow: 0 0 30px rgba(255,59,59,0.4)`
  - onClick: `navigate("play", gameId)` — starts the boss level

**Data required:**
- `gameId` from `useNavigationStore()`
- `useGame({ gameId })` — get game state to extract seed
- `useGameLevel({ gameId })` — get constraint data for level 10
- Boss identity: derive boss_id from game seed → `getBossDisplay(bossId)`
- Note: `bossId = Number(BigInt(seed) % 10n + 1n)` (mirrors contract logic from boss.cairo line 112-115)

**Boss sound effect:** Call `playSfx("boss-intro")` via `useMusicPlayer()` on page mount.

**Verification:**
- `pnpm build` passes
- Navigate to boss page: app does not crash, boss data displays
- Back button returns to map
- FIGHT BOSS navigates to play screen with correct gameId
- Boss emoji + name + constraints render correctly
- Tab bar is hidden on boss page

**Commit:** `feat: add BossRevealPage with boss identity data and navigation integration`

---

### Task 2.2: ProfilePage (3 Tabs + UnlockModal)

**Goal:** Create a Player Profile page with 3 tabs (Overview, Quests, Achievements) and a zone UnlockModal bottom sheet. This page uses **real data where available** and **static mock data** for features that lack contract support (quests, achievements, XP).

**Design reference:** `/zkube-dual-unlock.jsx` — entire file (846 lines)

**Files to create:**
- `client-budokan/src/ui/pages/ProfilePage.tsx` — Main page shell with header + tabs
- `client-budokan/src/ui/components/profile/OverviewTab.tsx` — Stats grid + zone progress + activity
- `client-budokan/src/ui/components/profile/QuestsTab.tsx` — Next unlock + quest lists
- `client-budokan/src/ui/components/profile/AchievementsTab.tsx` — Summary + achievement grid
- `client-budokan/src/ui/components/profile/UnlockModal.tsx` — Dual-path unlock bottom sheet
- `client-budokan/src/ui/components/shared/ProgressBar.tsx` — Reusable progress bar (used across Profile)
- `client-budokan/src/config/profileData.ts` — Mock quest/achievement/XP definitions + zone emoji mapping

**Files to modify:**
- `client-budokan/src/App.tsx` — Register ProfilePage in pageComponents

**Data strategy — what's real vs mock:**

| Data Point | Source | Status |
|-----------|--------|--------|
| Username | `useControllerUsername()` | ✅ Real |
| Total stars | `usePlayerMeta()` → derive from zone data | ✅ Real |
| Best level | `usePlayerMeta()` → best_level | ✅ Real |
| Total games | `useGameTokensSlot()` → games.length | ✅ Real |
| Best combo | Game run_data → max_combo_run (via useGameTokensSlot) | ✅ Real |
| Zone unlock status | `MapEntitlement` model (via RECS) | ✅ Real |
| Zone star counts per zone | `PlayerBestRun` (best_stars per settings_id) — may need RECS query | ⚠️ Partial (aggregate manually) |
| Player XP / Level | Not in contract models | 🔶 Mock (derive from total stars) |
| Player titles | Not in contract | 🔶 Mock (static map from level) |
| Lines cleared total | Not tracked in models | 🔶 Mock |
| Bosses defeated count | Not tracked (only zone_cleared bool) | 🔶 Mock |
| Quest progress (daily/weekly/milestone) | No quest system in contracts | 🔶 Mock |
| Achievement progress | No achievement system in contracts | 🔶 Mock |
| ETH pricing / sliding discount | Not in current purchase_map logic | 🔶 Mock |
| Recent activity feed | No event history accessible from client | 🔶 Mock |

**profileData.ts — mock data constants:**

```typescript
// XP system (mock — derived from total stars as a proxy)
export const XP_PER_STAR = 100;
export const LEVEL_THRESHOLDS = [0, 500, 1200, 2000, 3000, 4500, 6500, 9000, 12000, 16000]; // XP needed per level
export const PLAYER_TITLES: Record<number, string> = {
  1: "Novice", 2: "Apprentice", 3: "Puzzle Adept", 5: "Block Master",
  7: "Grid Sage", 10: "Puzzle Legend", 15: "Eternal",
};

// Zone metadata (complements existing THEME_META)
export const ZONE_EMOJIS: Record<number, string> = {
  1: "🌊", 2: "🏛️", 3: "❄️", 4: "🏺", 5: "⛩️",
  6: "🐉", 7: "🕌", 8: "🌿", 9: "🥁", 10: "⛰️",
};

// Mock unlock pricing
export const ZONE_UNLOCK_PRICES: Record<number, { starCost: number; ethPrice: number }> = {
  2: { starCost: 120, ethPrice: 0.015 },
  3: { starCost: 200, ethPrice: 0.020 },
  // ... other locked zones
};

// Quest definitions (all mock — structure ready for future contract integration)
export interface QuestDef { id: string; title: string; desc: string; icon: string; max: number; reward: number; color: string; category: "daily" | "weekly" | "milestone"; }
export const QUEST_DEFS: QuestDef[] = [ /* ... */ ];

// Achievement definitions (all mock)
export interface AchievementDef { id: string; name: string; desc: string; icon: string; rarity: "Common" | "Rare" | "Epic" | "Legendary"; category: "Combat" | "Mastery" | "Explorer"; }
export const ACHIEVEMENT_DEFS: AchievementDef[] = [ /* ... */ ];

export const RARITY_COLORS = { Common: "rgba(255,255,255,0.5)", Rare: "#4DA6FF", Epic: "#A78BFA", Legendary: "#FFD93D" };
```

Reference `/zkube-dual-unlock.jsx` lines 358–370 (zone data), 508–522 (quest data), 629–657 (achievement data) for the full mock data structures.

---

**Sub-deliverable A: ProfilePage shell (`ProfilePage.tsx`)**

Reference: `/zkube-dual-unlock.jsx` lines 719–823

Layout:
- **Back button** — Top-left, `← Profile` (Chakra Petch, 16px). Note: Profile is a tab, not overlay, so back button navigates to `"home"`.
- **Player card** — Gradient border card (`accent@10% → accent2@08%`):
  - Avatar: 48px rounded square, gradient fill (accent → accent2), "ZK" initials, level badge (20px circle at bottom-right with level number)
  - Username: Chakra Petch, 14px, 800 weight
  - Subtitle: "Level {n} · {title}" (DM Sans, 9px, textMuted)
  - Star count (right): Star icon + large number (18px, accent2) + "total stars" label
  - XP progress bar below: "Level {n}" left label, "{xp}/{xpMax} XP" right label, accent-colored bar with glow
  - Sub-label: "{remaining} XP to Level {n+1} · '{nextTitle}'"
  - **Real data:** username, total stars (derived from PlayerBestRun aggregation or PlayerMeta)
  - **Mock data:** XP value (= totalStars × XP_PER_STAR), level (from threshold lookup), title

- **Tab bar** — 3 tabs: "Overview", "Quests", "Achievements"
  - Active: accent text + 2px accent bottom border
  - Quests tab shows notification badge with pending quest count
  - Tab state: local useState

- **Content area** — Scrollable, renders active tab component

- **UnlockModal** — Conditionally rendered when a locked zone is tapped

**Sub-deliverable B: OverviewTab (`profile/OverviewTab.tsx`)**

Reference: `/zkube-dual-unlock.jsx` lines 356–478

1. **Stats grid** — 4-column grid:
   - Games: `useGameTokensSlot().games.length` (✅ real)
   - Best Combo: from game run data or `"--"` if unavailable (⚠️ partial)
   - Lines: `"--"` (🔶 mock — not tracked)
   - Bosses: `"--"` (🔶 mock — not tracked)

2. **Zone Progress** — Section label + vertical zone list:
   - For each zone: emoji + name + CLEARED/FREE badges + star progress bar + star count
   - Unlocked zones: accent-colored progress bar, `{stars}/{max}` count
   - Locked zones: show dual-unlock teaser: `{starCost}★` or `{ethPrice} ETH`
     - Star progress bar toward free unlock
     - `{currentStars}/{starCost}★ · {discount}% discount available`
     - `Tap to unlock →` link → opens UnlockModal
   - **Real data:** zone unlock status (MapEntitlement), zone stars (PlayerBestRun)
   - **Mock data:** starCost, ethPrice, discount

3. **Recent Activity** — Section label + 3-item feed:
   - Each: emoji + description + time ago
   - 🔶 All mock data (static placeholder entries)

**Sub-deliverable C: QuestsTab (`profile/QuestsTab.tsx`)**

Reference: `/zkube-dual-unlock.jsx` lines 480–625

> **All quest data is mock.** The quest system was removed from contracts. This tab shows the UI design for future implementation.

1. **Next Unlock teaser** — Gradient card showing dual-path to next locked zone:
   - Left half: "★ EARN IT" — star progress toward free unlock
   - Right half: "◆ SKIP AHEAD" — ETH price with discount badge
   - Tapping opens UnlockModal
   - Reference lines 526–592

2. **Daily Quests** — Header with "Resets in HH:MM" badge, 3 quest cards:
   - Each card: icon + title + description + progress bar + star reward
   - Completed quests show "CLAIMED" badge, reduced opacity
   - Reference lines 594–602

3. **Weekly Quests** — Header with "X days left" badge, 3 quest cards
   - Reference lines 605–614

4. **Milestones** — Header, 3 milestone cards (larger format)
   - Reference lines 616–623

**QuestCard sub-component:** (inline or shared)
- Surface bg (done: `color@08%`), border, borderRadius 10px
- Icon (16-18px) + title (Chakra Petch, 11px) + reward badge (`+{n}★`)
- Description (DM Sans, 9px, textMuted)
- Progress bar (4px height, colored by quest color, with `{n}/{max}` label)

**Sub-deliverable D: AchievementsTab (`profile/AchievementsTab.tsx`)**

Reference: `/zkube-dual-unlock.jsx` lines 627–717

> **All achievement data is mock.** No achievement system in contracts.

1. **Summary card** — Surface card:
   - Left: `{unlocked}/{total}` (Chakra Petch, 20px) + "Achievements unlocked"
   - Right: Rarity breakdown — 4 columns (Common, Rare, Epic, Legendary) each with count + rarity color

2. **Category sections** — 3 categories (Combat, Mastery, Explorer):
   - Section header: category name + `{unlocked}/{total}`
   - 2-column grid of achievement cards:
     - Unlocked: `rarity_color@08%` bg, `rarity_color@20%` border, full opacity, radial glow corner
     - Locked: `rgba(255,255,255,0.015)` bg, 40% opacity, grayscale emoji
     - Icon (16px) + rarity label (5.5px, uppercase, rarity color) + name (Chakra Petch, 9px) + description (DM Sans, 7.5px)

**Sub-deliverable E: UnlockModal (`profile/UnlockModal.tsx`)**

Reference: `/zkube-dual-unlock.jsx` lines 68–354

Bottom sheet overlay:
- **Backdrop** — `rgba(0,0,0,0.7)` + `backdrop-blur(8px)`, click to close
- **Sheet** — Gradient bg (`linear-gradient(180deg, lighten(bg), bg)`), top border-radius 20px, drag handle bar

1. **Zone header** — Large emoji (32px) + "Unlock Zone" label + zone name (Chakra Petch, 18px, 900) + "10 levels · Boss battle · Endless mode"
2. **Divider** — 1px line in colors.border
3. **Two-path layout** — Flex row with gap 8px:
   - **Earn It card** (left): accent2 tint, star icon, star cost (large number), progress bar, `{current}/{target}` count, `{remaining} more to go`. If stars >= cost → "UNLOCK FREE" button (accent2 bg)
   - **OR divider** (center): vertical line + "OR" text
   - **Skip Ahead card** (right): accent tint, diamond icon, ETH price (strikethrough if discount), discounted price (large), `{discount}% OFF` badge (accent3/pink), "BUY NOW" button (accent gradient)
4. **Star Discount Scale** — Bar chart visualization:
   - 10 bars (0-90% tiers), height proportional to tier, filled bars use accent/accent3 colors, current tier marked "YOU"
   - Labels: "0★ = Full price" ↔ "90%★ = 90% off"
   - Footer: "100% stars = FREE unlock · Every star counts toward a discount"

**Discount formula:** `discount% = floor(currentStars / starCost × 100)`, `finalPrice = basePrice × (1 - discount / 100)`

**Data for UnlockModal:**
- Zone name/emoji/starCost/ethPrice from profileData.ts mock config (🔶 mock)
- currentStars for the player — can derive from total earned stars across all zones (⚠️ partial real)
- Discount calculation is pure client-side math

**Sub-deliverable F: ProgressBar (`shared/ProgressBar.tsx`)**

Reference: `/zkube-dual-unlock.jsx` lines 24–44

Reusable progress bar component used across the Profile page:
```typescript
interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  height?: number;      // default 6
  glow?: boolean;       // default false — adds box-shadow
  showLabel?: boolean;  // default false — shows "{value}/{max}" above right end
}
```

Rendering:
- Outer: full width, `height` px, borderRadius `height/2`, bg `rgba(255,255,255,0.06)`
- Inner: width `min(value/max * 100, 100)%`, gradient fill (`{color}CC → {color}`), optional glow shadow
- Label: absolute positioned, fontSize 9px, Chakra Petch, color `{color}CC`

---

**App.tsx registration:**
```diff
+ import ProfilePage from "@/ui/pages/ProfilePage";

  const pageComponents: Record<PageId, React.ReactNode> = {
    // ... existing ...
+   profile: <ProfilePage />,
  };
```

**Verification:**
- `pnpm build` passes
- Profile tab in bottom bar navigates to ProfilePage
- Player card shows real username and star count
- Overview tab: stats grid renders, zone progress list shows real zone unlock status
- Quests tab: mock quests display with progress bars and reward badges
- Achievements tab: mock achievements display in 2-column grid with rarity colors
- UnlockModal: opens when tapping locked zone, shows dual-path layout, discount math is correct
- Tab bar remains visible on Profile page (it's a TabId, not OverlayId)
- Back button navigates to home

**Commit:** `feat: add ProfilePage with overview, quests, achievements tabs and unlock modal`

---

## Phase 3: QA & Polish

### Task 3.1: Cross-Theme Visual Verification

**Goal:** Verify all pages look correct across all 10 themes.

**Process:**
1. For each of the 3 alpha themes (Polynesian, Japan, Persia):
   - Take Playwright screenshots of all 8 pages (Home, Map, Play, Boss, Profile, Leaderboard, Daily, Settings) at 390x844 viewport
   - Verify: text readable, accent colors applied, surfaces visible, no contrast issues

2. For the remaining 7 themes:
   - Take Playwright screenshots of Home + Play + Profile + Settings pages
   - Verify: auto-derived tokens produce acceptable visuals
   - Fix any themes where text contrast is too low or surface is invisible

3. Run `pnpm build` — must pass with zero errors
4. Run `pnpm test` — must pass with zero regressions

**Files likely to adjust:**
- `client-budokan/src/config/themes.ts` — Fine-tune text/accent2 colors for specific themes
- Individual page files — Fix any contrast or spacing issues

**Verification commands:**
```bash
cd client-budokan && pnpm build
cd client-budokan && pnpm test
```

**Commit:** `fix: polish cross-theme visual consistency`

---

## Commit Strategy

Each commit must leave `pnpm build` passing. Commits are ordered by dependency:

| # | Commit | Phase | Dependencies |
|---|--------|-------|--------------|
| 1 | `feat: extend theme token system with surface/border/glow/text/accent2 for all 10 themes` | 0.1 | None |
| 2 | `feat: migrate fonts to Chakra Petch (display) + DM Sans (body)` | 0.2 | None (parallel with 1) |
| 3 | `feat: replace image backgrounds with gradient + SVG pattern overlays` | 0.3 | Commit 1 |
| 4 | `feat: make BottomTabBar theme-aware with 5 tabs including Profile` | 0.4 | Commit 1 |
| 5 | `feat: redesign HomePage with vertical zone list and daily banner` | 1.1 | Commits 1-4 |
| 6 | `feat: redesign PlayScreen HUD with compact layout and constraint bar` | 1.2 | Commits 1-4 |
| 7 | `feat: redesign MapPage with simplified circle/square nodes` | 1.3 | Commits 1-4 |
| 8 | `feat: redesign SettingsPage with theme dots and toggle switches` | 1.4 | Commits 1-4 |
| 9 | `feat: redesign LeaderboardPage with tabs and card-based player list` | 1.5 | Commits 1-4 |
| 10 | `feat: redesign DailyChallengePage with mini leaderboard and grid preview` | 1.6 | Commits 1-4 |
| 11 | `feat: add BossRevealPage with boss identity data and navigation integration` | 2.1 | Commits 1-4 |
| 12 | `feat: add ProfilePage with overview, quests, achievements tabs and unlock modal` | 2.2 | Commits 1-4 |
| 13 | `fix: polish cross-theme visual consistency` | 3.1 | All above |

**Parallel execution:** Commits 5-12 can be developed in parallel branches and merged sequentially, since they modify different files. The only shared touchpoints:
- `App.tsx` — modified by commits 11 and 12 (adding page registrations). These are additive changes to different keys in the same object literal — merge-safe.
- `navigationStore.ts` — modified by commit 4 (adds "profile" TabId) and commit 11 (adds "boss" OverlayId). Commit 4 runs first, so commit 11 builds on top.
- `themes.ts` — only modified by commits 1 and 13.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Grid rendering breaks | Medium | Critical | DO NOT modify Grid.tsx. Only change its container/wrapper. Verify grid renders after each PlayScreen change. |
| Theme token derivation produces bad contrast | Medium | Medium | Test all 10 themes visually. Fine-tune text/accent2 values per theme in Phase 3. |
| Font change breaks layout spacing | Medium | Low | Chakra Petch is taller/narrower than Fredericka. May need size/weight adjustments. Check each page after font migration. |
| Hardcoded colors elsewhere in codebase | Medium | Low | Run `ast_grep_search` for `emerald`, `slate-400`, `#34d399` patterns before Phase 1. Fix any found. |
| SVG patterns cause performance issues | Low | Low | Patterns are static SVG at 4% opacity — negligible GPU cost. Use `pointer-events-none`. |
| Boss screen data unavailable (seed not loaded) | Medium | Medium | BossRevealPage must handle loading state gracefully. Show skeleton while seed loads. |
| Google Fonts CDN latency | Low | Low | Use `font-display: swap` (already in the Google Fonts URL). Chakra Petch is a small font (~40KB). |
| Profile mock data creates false expectations | Medium | Medium | Add clear `// MOCK DATA` comments in profileData.ts. Mark quest/achievement sections with subtle "Coming Soon" indicators if desired. The UI should feel real but not promise features that don't exist yet. |
| 5-tab bar feels cramped on small screens | Low | Low | Test at 320px width minimum. Unicode icons are compact. Each tab only needs ~64px. 5 × 64 = 320px — tight but viable. |
| Profile + Boss both modify App.tsx | Low | Low | Changes are additive (different keys in pageComponents object). Standard merge, no conflict expected. |

---

## Must NOT Touch

These files/directories must remain completely unmodified:

| Path | Reason |
|------|--------|
| `client-budokan/src/ui/components/Grid.tsx` | 690-line grid state machine — zero tolerance for changes |
| `client-budokan/src/ui/components/Block.tsx` | Block rendering with per-theme images |
| `client-budokan/src/dojo/**` | Entire Dojo integration layer |
| `client-budokan/src/hooks/**` | All custom hooks (data layer) |
| `client-budokan/src/contexts/**` | All context providers |
| `client-budokan/src/stores/moveTxStore.ts` | Move transaction queue |
| `client-budokan/src/stores/generalStore.ts` | General app state |
| `contracts/**` | Smart contracts — no changes |
| Per-theme block image assets | `block-1.png` through `block-4.png` per theme stay as-is |

**Exceptions:**
- `client-budokan/src/stores/navigationStore.ts` — modified by Task 0.4 (adds "profile" TabId) and Task 2.1 (adds "boss" OverlayId)
- `client-budokan/src/App.tsx` — modified by Task 2.1 (BossRevealPage) and Task 2.2 (ProfilePage) to register new page components
