# zKube UI/UX Redesign Specification

## 1. UX Strategy

### 1.1 Design Philosophy

**Port, don't reinvent.** The mobile-app-old PixiJS codebase already has the correct UX architecture. This redesign ports that architecture into React + Tailwind + Motion, dropping PixiJS rendering while keeping all game logic intact.

**Core principles:**
- Mobile-first, desktop-equal. Both platforms are first-class.
- PWA before Capacitor native.
- Every screen is a full page with slide transitions. No modals except during active gameplay.
- Theme-driven visual identity. 10 themes share a common structure, colors and assets change per theme.
- Information density is earned. Show what matters for the current context, hide the rest.

### 1.2 Target Platforms

| Platform | Priority | Minimum Width | Grid Cell Size |
|----------|----------|---------------|----------------|
| Mobile (PWA) | Equal | 375px (iPhone SE) | 40px |
| Tablet | Equal | 768px | 48px |
| Desktop | Equal | 1024px+ | 50px |

### 1.3 Game Flow (Source of Truth: mobile-app-old)

```
CONNECT WALLET
    │
    ▼
HOME PAGE
    ├── PLAY GAME ────► LOADOUT PAGE ────► MAP PAGE ────► PLAY SCREEN
    │                                         ▲               │
    ├── MY GAMES ──────────────────────────────┘               │
    │                                                          │
    ├── SHOP PAGE (permanent upgrades)                         │
    │                                                          │
    ├── QUESTS PAGE                         ┌──────────────────┤
    │                                       │                  │
    ├── LEADERBOARD PAGE                    │     LEVEL COMPLETE (modal)
    │                                       │         │
    ├── SETTINGS PAGE                       │     IN-GAME SHOP (full page)
    │                                       │         │
    └── TUTORIAL PAGE                       │     PENDING LEVEL UP (modal)
                                            │         │
                                            ▼         ▼
                                        MAP PAGE ◄────┘
                                            │
                                        GAME OVER / VICTORY (modal)
                                            │
                                            ▼
                                        HOME PAGE
```

### 1.4 Navigation Model

**State-based page navigation** using React state (not URL routes). Each transition uses a horizontal slide animation via Motion.

```typescript
type PageId =
  | 'home'
  | 'loadout'
  | 'map'
  | 'play'
  | 'shop'
  | 'quests'
  | 'leaderboard'
  | 'settings'
  | 'mygames'
  | 'tutorial'
  | 'ingameshop';  // Full-page rest stop (not modal)
```

**Transition behavior:**
- Forward: New page slides in from right (300ms, ease-out cubic)
- Back: Current page slides out to right (300ms, ease-out cubic)
- Back always goes to `home` (except from `play` which goes to `map`, from `ingameshop` which goes to `play`)

### 1.5 Key UX Changes from Current Client

| Current (client-budokan) | Redesign |
|--------------------------|----------|
| 2 URL routes (`/`, `/play/:gameId`) | State-based page navigation (10+ pages) |
| Shop is a modal dialog | Shop is a full page |
| Quests is a modal dialog | Quests is a full page |
| Settings is a modal dialog | Settings is a full page |
| No map view | Full world map with 5 zones |
| Level complete jumps to next level | Level complete returns to map |
| In-game shop is a modal | In-game shop is a full-page rest stop |
| LevelHeaderCompact (532 lines, dense) | Split into StatsBar + ProgressBar (compact, focused) |
| 7+ header buttons | TopBar with cubes + 4-5 icon buttons |
| CSS grid background | Theme-aware background images |
| Responsive via media queries | Responsive via layout calculations (same code, both platforms) |

---

## 2. Information Architecture

### 2.1 Page Hierarchy

```
App (single route: /)
├── PageNavigator (state machine)
│   ├── HomePage
│   │   ├── TopBar (cubes, tutorial, quests, trophies, settings, profile)
│   │   ├── Logo (theme-specific, animated bounce)
│   │   ├── PlayButton (CONTINUE if active game, PLAY GAME if none)
│   │   ├── MyGamesButton
│   │   ├── ShopButton
│   │   └── LeaderboardButton
│   │
│   ├── LoadoutPage
│   │   ├── PageTopBar (title, back, cube balance)
│   │   ├── BonusSelector (5 tiles, select 3)
│   │   ├── CubeBridgingSlider (if unlocked)
│   │   ├── StartGameButton
│   │   └── CancelButton
│   │
│   ├── MapPage
│   │   ├── PageTopBar (WORLD MAP, back)
│   │   ├── ZoneBackground (themed per zone)
│   │   ├── MapNodes (10 per zone, positioned by theme)
│   │   ├── MapPaths (connecting lines between nodes)
│   │   ├── ZoneDots (pagination indicator)
│   │   └── LevelPreview (popup on node tap)
│   │
│   ├── PlayScreen
│   │   ├── ThemeBackground
│   │   ├── StatsBar (level badge, score/target, moves, cubes)
│   │   ├── ProgressBar (score fill + cube threshold markers + constraint icons + stars)
│   │   ├── GameGrid (8x10 blocks, drag/touch)
│   │   ├── NextLinePreview
│   │   ├── ActionBar (3 bonus buttons + combo display + surrender)
│   │   ├── LevelCompleteModal (stars, stats, bonuses, continue)
│   │   ├── PendingLevelUpModal (choose bonus to level up)
│   │   ├── GameOverModal (stats, share, play again)
│   │   └── VictoryModal (trophy, stats, share)
│   │
│   ├── InGameShopPage (full-page rest stop)
│   │   ├── PageTopBar (IN-GAME SHOP)
│   │   ├── CubesAvailable
│   │   ├── ChargesSection (buy + allocate)
│   │   ├── LevelUpSection (upgrade one bonus)
│   │   ├── SwapSection (replace one bonus)
│   │   └── ContinueRunButton
│   │
│   ├── ShopPage (permanent upgrades)
│   │   ├── PageTopBar (SHOP, back, cube balance)
│   │   ├── BonusCards (5 bonuses, each with starting + bag upgrades)
│   │   ├── BridgingCard (rank upgrades)
│   │   └── UnlockCards (Wave, Supply)
│   │
│   ├── QuestsPage
│   │   ├── PageTopBar (DAILY QUESTS, back)
│   │   ├── ClaimableSummary
│   │   ├── QuestFamilyCards (Player, Clearer, Combo)
│   │   ├── DailyChampionCard (Finisher)
│   │   └── ResetTimer
│   │
│   ├── LeaderboardPage
│   │   ├── PageTopBar (LEADERBOARD, back)
│   │   └── LeaderboardTable (rank, player, level, score)
│   │
│   ├── SettingsPage
│   │   ├── PageTopBar (SETTINGS, back)
│   │   ├── AudioSection (music + effects sliders)
│   │   ├── ThemeSelector (10 theme grid)
│   │   └── AccountSection (username, address, disconnect)
│   │
│   ├── MyGamesPage
│   │   ├── PageTopBar (MY GAMES, back)
│   │   └── GamesList (active + finished, resume button)
│   │
│   └── TutorialPage
│       ├── PageTopBar (TUTORIAL, back)
│       └── TutorialSteps (step-by-step walkthrough)
```

### 2.2 Data Dependencies per Page

| Page | Hooks Used | Writes |
|------|-----------|--------|
| HomePage | `useGameTokensSlot`, `useCubeBalance`, `useControllerUsername` | — |
| LoadoutPage | `usePlayerMeta`, `useCubeBalance` | localStorage (loadout) |
| MapPage | `useGame`, `useGameLevel` | — |
| PlayScreen | `useGame`, `useGrid`, `usePlayerMeta`, `useCubeBalance`, `useSettings` | `moveTxStore` |
| InGameShopPage | `useDojo` (systemCalls) | purchaseConsumable, allocateCharge, swapBonus |
| ShopPage | `usePlayerMeta`, `useCubeBalance`, `useDojo` | upgradeStartingBonus, upgradeBagSize, etc. |
| QuestsPage | `useQuests`, `useDojo` | claimQuest |
| LeaderboardPage | `useLeaderboard` (new hook needed) | — |
| SettingsPage | `useMusicPlayer`, `useTheme`, `useAccountCustom` | theme, volume |
| MyGamesPage | `useGameTokensSlot` | — |
| TutorialPage | — | localStorage (tutorial seen) |

### 2.3 Shared State

All pages share these via providers/stores:
- **Theme** (ThemeProvider) — current theme template, CSS variables
- **Audio** (MusicPlayerProvider) — volume, music context (main/map/level/boss)
- **Wallet** (StarknetConfig) — account, connection state
- **Dojo** (DojoProvider) — RECS, system calls, torii client
- **Quests** (QuestsProvider) — quest state, subscriptions
- **Active Game ID** (PageNavigator state) — which game is being played

---

## 3. Page-by-Page Redesign

### 3.1 HomePage

**Purpose:** Main menu hub. Show logo, primary actions, quick access to all features.

**Layout (mobile):**
```
┌─────────────────────────────────┐
│ 🧊42  [📜] [🏆] [⚙️] [Profile] │ ← TopBar (fixed)
├─────────────────────────────────┤
│                                 │
│         [  LOGO  ]              │ ← Theme logo, gentle bounce
│                                 │
│     ┌─────────────────────┐     │
│     │    PLAY GAME        │     │ ← Primary CTA (orange)
│     └─────────────────────┘     │
│     ┌─────────────────────┐     │
│     │    MY GAMES (2)     │     │ ← Purple, shows active count
│     └─────────────────────┘     │
│     ┌─────────────────────┐     │
│     │    SHOP             │     │ ← Green
│     └─────────────────────┘     │
│     ┌─────────────────────┐     │
│     │    LEADERBOARD      │     │ ← Orange
│     └─────────────────────┘     │
│                                 │
│   Built on Starknet with Dojo   │ ← Footer
└─────────────────────────────────┘
```

**Layout (desktop):** Same structure, wider buttons (max 340px), centered. Logo larger (max 340px wide). Side panels can show decorative theme elements.

**Components:**
- `TopBar` — Shared across all non-play pages. Left: cube balance. Right: icon buttons (tutorial, quests, trophies, settings) + profile button.
- `Logo` — `<img>` from theme assets, CSS animation for gentle bounce (`@keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }`).
- `PlayButton` — If active games exist: "CONTINUE" and auto-navigate to map for most recent game. Else: "PLAY GAME" and navigate to loadout.
- `NavButton` — Reusable button component with variant colors (orange, purple, green).
- `ThemeBackground` — Full-screen background image from current theme.

### 3.2 LoadoutPage

**Purpose:** Select 3 bonuses and optionally bring cubes before starting a game.

**Layout:**
```
┌─────────────────────────────────┐
│ ← SELECT LOADOUT       🧊 42   │ ← PageTopBar (back + title + cubes)
├─────────────────────────────────┤
│                                 │
│            BONUSES              │ ← Section title
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ Combo│ │Score │ │Harvest│   │ ← 5 tiles (3 across, 2 below)
│  │  ✓   │ │  ✓   │ │  ✓   │    │   Selected = green border
│  └──────┘ └──────┘ └──────┘    │   Locked = grayed + 🔒
│  ┌──────┐ ┌──────┐              │
│  │ Wave │ │Supply│              │
│  │  🔒  │ │  🔒  │              │
│  └──────┘ └──────┘              │
│                                 │
│     BRING CUBES (MAX 20)        │ ← Only if bridging unlocked
│     ○────────────────●── 15     │ ← Slider
│                                 │
│  ┌─────────────────────────┐    │
│  │     START GAME           │    │ ← Green, disabled until 3 selected
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │     CANCEL               │    │ ← Purple, goes back to home
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Components:**
- `PageTopBar` — Reusable: back arrow, title, optional subtitle, optional cube balance.
- `BonusTile` — Square tile with icon, name, selected/locked state, press animation (scale 0.95 on press, 1.05 on hover).
- `CubeSlider` — Range slider with numeric display. Track + knob + value label.

### 3.3 MapPage

**Purpose:** Show world map with 5 zones (10 levels each). Navigate between zones by swiping. Tap a level node to see preview and play.

**Layout:**
```
┌─────────────────────────────────┐
│ ← WORLD MAP                    │ ← PageTopBar (or standalone: no bar)
├─────────────────────────────────┤
│                                 │
│     ┌─────────────────────┐     │
│     │   ZONE BACKGROUND   │     │ ← Full-screen themed background
│     │                     │     │
│     │    ○───○───●───○    │     │ ← Level nodes + paths
│     │   /   |    \   \    │     │   ● = current level
│     │  ○    ○     ○   ○   │     │   ○ = available / cleared
│     │   \   |    /   /    │     │   ◌ = locked
│     │    ○───○───○        │     │
│     │                     │     │
│     └─────────────────────┘     │
│                                 │
│  ‹                          ›   │ ← Zone navigation arrows
│                                 │
│         ○ ● ○ ○ ○              │ ← Zone dots (pagination)
└─────────────────────────────────┘
```

**Data source:** `useMapData(seed, currentLevel, levelStarsFn)` — computes node positions, zone themes, and states from the game seed. This hook needs to be ported from the mobile-app-old PixiJS codebase.

**Interactions:**
- Swipe left/right to change zones (touch + mouse drag)
- Tap a node to open LevelPreview popup
- LevelPreview shows: level number, difficulty, constraints, stars earned, PLAY button
- Current level node pulses/glows

**Components to port from mobile-app-old:**
- `MapPage` → React component with touch/drag zone swiping
- `MapNode` → Circular node with state coloring and star count
- `MapPath` → SVG line or canvas path between nodes
- `ZoneBackground` → Theme background image per zone
- `LevelPreview` → Popup overlay with level details
- `useMapData` → Hook to compute map layout from seed

### 3.4 PlayScreen

**Purpose:** Active gameplay. Grid, HUD, bonus actions, game event modals.

**Layout:**
```
┌─────────────────────────────────┐
│ [🏠] [LV9] 42/80    26/30 🧊5 │ ← StatsBar
│ [████████░░░│░░│░] [◎◎] [⭐⭐☆] │ ← ProgressBar + Constraints + Stars
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │       GAME GRID           │  │
│  │       (8 × 10)            │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     NEXT LINE PREVIEW     │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ [Combo] [Score] [Harv]  │    │ ← ActionBar (pill shape)
│  │           3x    🏳️     │    │   Bonuses + combo + surrender
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**StatsBar components:**
- Home button (navigate to map/home)
- Level badge (circular, gold border, level number)
- Score display: `{levelScore}/{targetScore}`
- Moves display: `{moves}/{maxMoves}` (red when danger)
- Cube balance (if cubes in run)
- Combo indicator (when active)

**ProgressBar components:**
- Score progress fill (blue, animated lerp)
- **Cube threshold markers** at 1🧊, 2🧊, 3🧊 positions (vertical tick marks on the bar showing where each cube rating cutoff is — based on moves remaining)
- Constraint indicators: **Round icons with radial progress rings** and count badges
- Star rating: 3 stars (filled/empty based on current performance)

**Constraint Indicator (new design per user request):**
```
  ┌─────┐
  │ ╭─╮ │   Round icon in the center (constraint type icon)
  │ │🔲│ │   Circular progress ring around the icon
  │ ╰─╯ │   Badge with count (e.g., "2/3") at bottom-right
  └─────┘
```
- Circle stroke animates from 0 to progress percentage
- Green when satisfied, orange when in progress, red when NoBonusUsed and failed
- Icon represents constraint type (lines, blocks, combo, etc.)

**ActionBar components:**
- Pill-shaped container (rounded ends, semi-transparent bg)
- 3 BonusButton components (icon + count badge, selected state glow)
- ComboDisplay (current combo count, flame icon when > 0)
- SurrenderButton (flag icon, smaller)

**Modals (within PlayScreen only):**
- `LevelCompleteModal` — Animated stars, score, cubes breakdown, bonuses earned, continue button
- `PendingLevelUpModal` — Choose which bonus to level up (after boss levels)
- `GameOverModal` — Level reached, stats, share on X, play again
- `VictoryModal` — Trophy animation, all stats, share on X, return home

### 3.5 InGameShopPage (Full-page Rest Stop)

**Purpose:** Spend earned cubes on charges, level ups, and swaps between levels.

**Layout:**
```
┌─────────────────────────────────┐
│     IN-GAME SHOP                │ ← PageTopBar
├─────────────────────────────────┤
│     ┌───────────────────┐       │
│     │ 🧊 CUBES: 12      │       │ ← Cubes available card
│     └───────────────────┘       │
│                                 │
│  ── BONUS CHARGES ──            │
│  Buy charges, then assign       │
│  ┌─────────────────────────┐    │
│  │ BUY CHARGE · 5🧊        │    │
│  └─────────────────────────┘    │
│  Unallocated: 2                 │
│  [Combo 1/3] [+1]              │
│  [Score 2/3] [+1]              │
│  [Harvest 0/3] [+1]            │
│                                 │
│  ── LEVEL UP (50🧊) ──         │
│  [Combo Lv1] [LV1→2]           │
│  [Score Lv2] [LV2→3]           │
│  [Harvest Lv1] [LV1→2]         │
│                                 │
│  ── SWAP BONUS (50🧊) ──       │
│  [Combo] [SWAP]                 │
│  [Score] [SWAP]                 │
│  [Harvest] [SWAP]               │
│                                 │
│  ┌─────────────────────────┐    │
│  │   CONTINUE RUN           │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 3.6 ShopPage (Permanent Upgrades)

Matches the current `ShopDialog` content but rendered as a full page. 2-column grid of bonus cards + bridging card. Each card shows: icon, name, starting level pips, bag level pips, upgrade buttons with costs.

### 3.7 QuestsPage

Matches the current `QuestsDialog` content but rendered as a full page. Quest family cards with progress bars, claim buttons, daily champion card, reset timer.

### 3.8 LeaderboardPage

Table view: Rank, Player (username from controller), Best Level, Total Score. Sortable by level or score. Pull-to-refresh.

### 3.9 SettingsPage

Three sections:
1. **Audio** — Music volume slider, effects volume slider
2. **Theme** — Grid of 10 theme icons, tap to switch
3. **Account** — Username, address (copy button), disconnect button

### 3.10 MyGamesPage

List of player's games (active + finished). Each row: Game #, Level, Score, Status (Active/Finished), Resume/View button. Active games at top. Tap to navigate to map for that game.

### 3.11 TutorialPage

Step-by-step walkthrough with illustrations. Pages/slides explaining: grid basics, how to move blocks, line clearing, combos, bonuses, constraints, cubes, shop. Navigation: next/prev/skip.

---

## 4. Design System

### 4.1 Typography

| Token | Font | Weight | Usage |
|-------|------|--------|-------|
| `font-title` | Fredericka the Great | Regular | Headings, buttons, logos, modal titles |
| `font-bold` | Bangers | Regular | Stats, numbers, badges, emphasis |
| `font-body` | Bangers | Regular | Body text, labels, descriptions |

**Scale:**
| Name | Size | Usage |
|------|------|-------|
| `text-xs` | 10px | Footnotes, meta labels |
| `text-sm` | 12px | Body text, button labels |
| `text-base` | 14px | Primary content |
| `text-lg` | 18px | Section titles, stat values |
| `text-xl` | 22px | Page titles |
| `text-2xl` | 28px | Modal titles |
| `text-4xl` | 48px | Hero numbers (level display) |
| `text-6xl` | 64px | Logo fallback |

### 4.2 Color System

**Semantic colors (theme-independent):**
| Token | Value | Usage |
|-------|-------|-------|
| `--color-gold` | `#fbbf24` | Cubes, currency, stars |
| `--color-success` | `#22c55e` | Completed, satisfied |
| `--color-danger` | `#ef4444` | Failed, low moves |
| `--color-warning` | `#f97316` | In progress, combo |
| `--color-info` | `#3b82f6` | Progress bar, links |
| `--color-purple` | `#6d28d9` | Buttons, accents |
| `--color-text-primary` | `#ffffff` | Primary text |
| `--color-text-secondary` | `#94a3b8` | Secondary text, labels |
| `--color-text-dim` | `#475569` | Disabled, placeholder |
| `--color-surface` | `#1e293b` | Card backgrounds |
| `--color-surface-dark` | `#0f172a` | Deeper backgrounds |
| `--color-border` | `#334155` | Borders, dividers |

**Theme-specific colors (via CSS variables):**
Maintained from current system: `--theme-bg`, `--theme-grid-bg`, `--theme-grid-lines`, `--theme-frame-border`, `--theme-hud-bar`, `--theme-action-bar-bg`, `--theme-accent`, `--theme-block-N-image/fill/glow`.

### 4.3 Spacing

Base unit: 4px. Scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24.

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight spacing (dots, pips) |
| `gap-2` | 8px | Inner padding, small gaps |
| `gap-3` | 12px | Standard gap between elements |
| `gap-4` | 16px | Section gaps |
| `gap-6` | 24px | Page padding |
| `gap-8` | 32px | Large section spacing |

### 4.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small chips, pips |
| `rounded` | 8px | Standard cards, inputs |
| `rounded-lg` | 12px | Modals, large cards |
| `rounded-xl` | 16px | Buttons, tiles |
| `rounded-full` | 9999px | Circles, pills, progress bars |

### 4.5 Component Library

**Shared components (reused across pages):**

| Component | Props | Description |
|-----------|-------|-------------|
| `PageNavigator` | `currentPage`, `navigate`, `goBack` | State machine + transition animation |
| `TopBar` | `cubeBalance`, `onTutorial`, `onQuests`, `onTrophies`, `onSettings`, `onProfile` | Home page top bar |
| `PageTopBar` | `title`, `subtitle?`, `onBack`, `cubeBalance?` | Sub-page top bar with back arrow |
| `NavButton` | `label`, `variant`, `onClick`, `badge?` | Large navigation button (home page) |
| `BonusTile` | `bonus`, `isSelected`, `isLocked`, `onPress` | Bonus selection tile |
| `BonusButton` | `type`, `count`, `isSelected`, `isDisabled`, `onClick` | In-game bonus action button |
| `IconButton` | `icon`, `onClick`, `size`, `badge?` | Small icon-only button |
| `CubeBalance` | `balance` | Yellow cube count display |
| `ProgressRing` | `progress`, `size`, `color`, `icon`, `badge?` | Circular progress indicator for constraints |
| `StarRating` | `stars`, `maxStars`, `size` | 1-3 star display |
| `LevelBadge` | `level` | Circular gold badge with level number |
| `GameButton` | `label`, `variant`, `disabled`, `loading`, `onClick` | Primary action button |
| `ThemeBackground` | — | Full-screen themed background |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | Overlay modal (gameplay only) |

### 4.6 Animation Tokens

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `transition-page` | 300ms | `cubic-bezier(0.33, 1, 0.68, 1)` | Page transitions |
| `transition-fast` | 150ms | `ease-out` | Button press, hover |
| `transition-normal` | 300ms | `ease-out` | Modal open/close |
| `transition-slow` | 500ms | `ease-out` | Star reveal, trophy |
| `spring-bounce` | — | `{ stiffness: 200, damping: 15 }` | Level badge pop-in |
| `spring-overshoot` | — | `{ stiffness: 300, damping: 10 }` | Stars, badges |

### 4.7 Layout Breakpoints

| Name | Width | Grid Size | TopBar Height | ActionBar Height |
|------|-------|-----------|---------------|------------------|
| Mobile | < 768px | 40px | 48px | 80px |
| Tablet | 768-1023px | 48px | 52px | 88px |
| Desktop | 1024px+ | 50px | 56px | 96px |

Desktop may show side panels (score panel left, moves panel right) flanking the grid, matching the mobile-app-old's `showSidePanels` pattern.

---

## 5. User Stories

### 5.1 New Player Flow

```
AS a new player
WHEN I visit the app for the first time
THEN I see the Home page with PLAY GAME button
AND I can connect my wallet via the profile button
AND after connecting, I click PLAY GAME
AND I'm taken to the Loadout page to select 3 bonuses
AND I click START GAME
AND a game is created (freeMint + create)
AND I'm taken to the Map page showing my level 1 position
AND I tap my current level node
AND I see a level preview with difficulty and constraints
AND I click PLAY
AND the game screen loads with my grid
```

### 5.2 Returning Player Flow

```
AS a returning player with an active game
WHEN I visit the app
THEN the PLAY button shows "CONTINUE"
AND clicking it takes me to the Map for my active game
AND I can see which levels I've cleared (with star ratings)
AND I tap my current level to continue playing
```

### 5.3 Level Completion Flow

```
AS a player who just completed level 9
WHEN the level completes
THEN a LevelCompleteModal appears with:
  - Animated star rating (1-3)
  - Score achieved vs target
  - Cubes earned breakdown (base + combo + boss)
  - Bonuses earned
AND I click CONTINUE
AND if it's a boss level (10), PendingLevelUpModal appears to choose a bonus upgrade
AND then if cubes are available and it's a shop level, I'm taken to InGameShopPage (full-page rest stop)
AND after the shop, I'm returned to the Map showing my new position at level 10
```

### 5.4 Game Over Flow

```
AS a player whose game just ended at level 23
WHEN game.over becomes true
THEN GameOverModal appears with:
  - Level reached (23) with contextual subtitle
  - NEW! badge if personal best
  - Stats: score, cubes earned, max combo
  - Share on X button (with dynamic tweet text)
  - Play Again button
AND clicking Play Again navigates to Home
AND my earned cubes are already minted to my wallet
```

### 5.5 Victory Flow (Level 50)

```
AS a player who just beat level 50
WHEN run_completed is true
THEN VictoryModal appears with:
  - Animated trophy with spinning stars
  - "VICTORY!" title
  - All 50 levels complete
  - Stats: cubes, score, max combo
  - Share Victory on X
  - Return to Home
```

### 5.6 Daily Quests Flow

```
AS a player checking daily quests
WHEN I tap the quests icon in the TopBar
THEN I'm taken to the QuestsPage (full page)
AND I see 3 quest families (Player, Clearer, Combo) with progress bars
AND I see the Daily Champion quest at the bottom
AND completed quests show a CLAIM button
AND I can claim rewards (cubes are minted)
AND I see when quests reset (midnight UTC countdown)
```

### 5.7 Shop Upgrade Flow

```
AS a player with 300 cubes
WHEN I tap SHOP on the Home page
THEN I'm taken to the ShopPage (full page)
AND I see my cube balance prominently
AND I see 5 bonus cards with Starting and Bag upgrade paths
AND I see a Bridging card
AND I can upgrade Starting Combo (cost: 100🧊)
AND the UI optimistically updates (pip fills, balance decreases)
AND if the transaction fails, the UI reverts
```

### 5.8 In-Game Shop Flow (Rest Stop)

```
AS a player who just completed level 5
WHEN the level complete flow finishes
THEN I'm taken to InGameShopPage (full-page rest stop)
AND I see my available cubes (earned this run + brought cubes)
AND I can buy charges and allocate them to my bonuses
AND I can level up one bonus (50🧊)
AND I can swap one bonus (50🧊)
AND I click CONTINUE RUN
AND I'm returned to the Map to play the next level
```

### 5.9 Theme Switching Flow

```
AS a player who wants to change the visual theme
WHEN I go to Settings
THEN I see a grid of 10 theme icons
AND I tap a theme
AND the entire app immediately switches to that theme:
  - Background changes
  - Block textures change
  - Grid colors change
  - Music changes
  - Logo changes
AND the selection is saved to localStorage
```

### 5.10 Map Zone Navigation Flow

```
AS a player at level 23 (Zone 3)
WHEN I'm on the Map page
THEN I see Zone 3 background with levels 21-30
AND I can swipe left to see Zone 2 (levels 11-20) with cleared nodes
AND I can swipe right to see Zone 4 (levels 31-40) with locked nodes
AND zone dots at the bottom show which zone I'm viewing
AND I can tap arrow buttons on the edges to navigate zones
AND each zone has a unique themed background based on the game seed
```

---

## 6. Implementation Priority

### Phase 1: Core Navigation + Game Screen (Must have)
1. `PageNavigator` with slide transitions
2. `HomePage` (buttons + logo + top bar)
3. `LoadoutPage` (bonus selection + cube bridging)
4. `PlayScreen` (refactored HUD: StatsBar + ProgressBar with cube thresholds + constraint rings)
5. `ActionBar` (pill shape, bonuses + combo + surrender)
6. Game event modals (LevelComplete, GameOver, Victory)

### Phase 2: Map + Shop Flow
7. `MapPage` (port from mobile-app-old, convert PixiJS to React)
8. `InGameShopPage` (full-page rest stop)
9. `PendingLevelUpModal`
10. Level complete → map → shop flow wiring

### Phase 3: Supporting Pages
11. `ShopPage` (full page)
12. `QuestsPage` (full page)
13. `SettingsPage` (full page)
14. `MyGamesPage` (full page)
15. `LeaderboardPage` (full page, needs new data hook)

### Phase 4: Polish
16. `TutorialPage`
17. Desktop side panels (score + moves flanking grid)
18. PWA manifest + offline support
19. Performance optimization (reduce motion toggle, lazy loading)
20. Accessibility audit

---

## 7. Files to Create / Modify

### New Files
```
src/ui/pages/                    # New: full-page components
  HomePage.tsx
  LoadoutPage.tsx
  MapPage.tsx
  PlayScreen.tsx                 # Refactored from current Play.tsx
  InGameShopPage.tsx
  ShopPage.tsx
  QuestsPage.tsx
  LeaderboardPage.tsx
  SettingsPage.tsx
  MyGamesPage.tsx
  TutorialPage.tsx

src/ui/navigation/
  PageNavigator.tsx              # State machine + transitions
  PageTopBar.tsx                 # Sub-page top bar

src/ui/components/hud/
  StatsBar.tsx                   # Level + score + moves + cubes
  ProgressBar.tsx                # Score fill + cube thresholds
  ConstraintRing.tsx             # Round icon + radial progress
  StarRating.tsx                 # 3-star display

src/ui/components/map/
  MapPage.tsx                    # Zone-based map
  MapNode.tsx                    # Level node
  MapPath.tsx                    # Path between nodes
  ZoneBackground.tsx             # Themed zone background
  LevelPreview.tsx               # Level details popup

src/ui/components/actionbar/
  ActionBar.tsx                  # Pill-shaped bar
  BonusButton.tsx                # Bonus action button
  ComboDisplay.tsx               # Combo counter
  SurrenderButton.tsx            # Surrender flag

src/hooks/
  useMapData.ts                  # Port from mobile-app-old
  useFullscreenLayout.ts         # Layout calculations
  useLeaderboard.ts              # New: leaderboard data
```

### Files to Modify
```
src/App.tsx                      # Remove routes, add PageNavigator
src/main.tsx                     # Add PageNavigator provider
src/ui/screens/Home.tsx          # Replace with HomePage (or delete)
src/ui/screens/Play.tsx          # Replace with PlayScreen (or delete)
src/ui/components/GameBoard.tsx  # Refactor to use new HUD components
src/ui/components/Grid.tsx       # Keep game logic, update layout
src/grid.css                     # Update for new layout
src/index.css                    # Update theme variables if needed
```

### Files to Delete (replaced by new pages)
```
src/ui/components/LevelHeaderCompact.tsx    # Replaced by StatsBar + ProgressBar
src/ui/components/DesktopHeader.tsx         # Replaced by TopBar
src/ui/components/MobileHeader.tsx          # Replaced by TopBar
src/ui/containers/Header.tsx               # Replaced by TopBar
src/ui/components/Shop/ShopDialog.tsx      # Replaced by ShopPage
src/ui/components/Quest/QuestsDialog.tsx   # Replaced by QuestsPage
src/ui/components/SettingsDialog.tsx        # Replaced by SettingsPage
src/ui/actions/PlayFreeGame.tsx            # Logic moves into HomePage
src/ui/components/BackgroundBoard.tsx      # Replaced by ThemeBackground
src/ui/components/PalmTree.tsx             # No longer needed
```

---

## 8. Technical Constraints

1. **No PixiJS.** Everything renders in React + CSS + Motion.
2. **No URL routes.** Single page, state-based navigation.
3. **Keep all game logic.** Grid state machine, physics, drag handlers stay intact.
4. **Keep all hooks.** `useGame`, `useGrid`, `usePlayerMeta`, etc. are untouched.
5. **Keep all system calls.** `dojo/systems.ts` is untouched.
6. **Keep provider hierarchy.** ThemeProvider → StarknetConfig → MusicPlayerProvider → ... → App.
7. **No `as any`, no `@ts-ignore`.** Type-safe throughout.
8. **Theme CSS variables.** All theme-specific visuals via CSS custom properties.
9. **Motion for animations.** `motion/react` for transitions, spring physics, staggered reveals.
10. **Tailwind for layout.** All spacing, colors, responsive behavior via Tailwind classes.
