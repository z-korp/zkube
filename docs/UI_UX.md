# zKube — UI/UX Redesign Specification

Full redesign of the mobile app UI/UX. Mobile-first, casual-friendly, bottom-tab navigation.

**Design references**: Candy Crush (celebration, polish, simplicity) + Slay the Spire (roguelike map, loadout clarity).
**Target**: 375px portrait (iPhone SE). All dimensions in CSS pixels unless noted.
**Style**: Cel-shaded illustration, bold outlines — evolved from existing art direction.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Navigation Architecture](#3-navigation-architecture)
4. [Global Components](#4-global-components)
5. [Tab Screens](#5-tab-screens)
6. [Gameplay Screens](#6-gameplay-screens)
7. [Modal Specifications](#7-modal-specifications)
8. [Onboarding Flow](#8-onboarding-flow)
9. [Animation & Effects](#9-animation--effects)
10. [Accessibility](#10-accessibility)
11. [Responsive Behavior](#11-responsive-behavior)
12. [Asset Requirements Summary](#12-asset-requirements-summary)
13. [Appendices](#appendices)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Casual-first** | Players see "Sign In", "Cubes", "Play" — never wallet addresses, hex strings, or transaction hashes. Blockchain is invisible. |
| **One-thumb play** | All interactive elements within thumb reach in portrait. Bottom tab bar, bottom action bar, center grid. |
| **Celebrate everything** | Every line cleared, combo hit, level completed, quest claimed — visual + audio + haptic feedback. Candy Crush-level juice. |
| **One font** | `FONT_TITLE` (Tilt Prism) everywhere. No `FONT_BODY`, no `FONT_BOLD`. |
| **Sprites over emoji** | Every icon is a PNG sprite loaded from the asset catalog. Zero emoji characters in UI. |
| **uiScale everything** | No hardcoded pixel values. All sizes multiply by `uiScale`. |
| **Content cap at 720px** | Scrollable list pages cap content width to prevent ultra-wide stretching on tablets/desktop. |

### Blockchain Abstraction

| User sees | Under the hood |
|-----------|----------------|
| "Sign In" | Cartridge Controller connect |
| "Play" | `create()` / `create_with_cubes()` transaction |
| "Cubes: 45" | ERC1155 balance query |
| Level complete animation | `move()` tx + state sync via Torii |
| "Claim Reward" | `claimQuest()` transaction |
| Loading spinner | Transaction confirmation |

Players never see: wallet addresses, transaction hashes, gas fees, network names, hex values, or "connect wallet" language.

---

## 2. Design System

### 2.1 uiScale

The single scaling factor for all UI elements.

```
uiScale = clamp(screenWidth / 375, 0.8, 1.5)
```

| Device | screenWidth | uiScale |
|--------|-------------|---------|
| iPhone SE | 375 | 1.0 |
| iPhone 14 | 390 | 1.04 |
| iPhone 14 Pro Max | 430 | 1.15 |
| iPad Mini | 768 | 1.5 (capped) |
| Desktop 1080p | 1920 | 1.5 (capped) |

**Mandatory pattern** for every component:
```typescript
const s = uiScale;
const fontSize = Math.round(16 * s);
const padding = Math.round(12 * s);
const btnSize = Math.round(44 * s);
```

### 2.2 Color Tokens

Source of truth: `mobile-app/src/pixi/utils/colors.ts`

**UI palette** (theme-independent):

| Token | Hex | Usage |
|-------|-----|-------|
| `UI.bg.primary` | `#1e293b` | Card backgrounds, modals |
| `UI.bg.secondary` | `#0f172a` | Darker sections, headers |
| `UI.bg.dark` | `#000000` | Top bar, overlays |
| `UI.text.primary` | `#ffffff` | Primary text |
| `UI.text.secondary` | `#94a3b8` | Subtitles, labels |
| `UI.text.muted` | `#64748b` | Disabled, hints |
| `UI.accent.gold` | `#fbbf24` | Cube balance, rewards, stars |
| `UI.accent.blue` | `#3b82f6` | Active states, links |
| `UI.accent.orange` | `#f97316` | Primary CTA buttons |
| `UI.status.success` | `#22c55e` | Complete, claimed, cleared |
| `UI.status.danger` | `#ef4444` | Low moves, surrender, danger |

**Per-theme colors** (10 themes, applied during gameplay):
- `ThemeColors.background`, `ThemeColors.grid`, `ThemeColors.accent`
- `ThemeColors.block1` through `ThemeColors.block4`
- Applied to: grid, blocks, backgrounds, map, particles

### 2.3 Typography

**Single font family**: `FONT_TITLE` = `'Tilt Prism, Arial Black, sans-serif'`

| Scale | Size (at s=1.0) | Usage |
|-------|-----------------|-------|
| xs | `Math.round(10 * s)` | Footer text, version labels |
| sm | `Math.round(12 * s)` | Captions, tier labels, timestamps |
| base | `Math.round(14 * s)` | Body text, list items |
| lg | `Math.round(16 * s)` | Section headers, card titles |
| xl | `Math.round(20 * s)` | Page titles, modal headers |
| 2xl | `Math.round(24 * s)` | Hero numbers (score, level) |
| 3xl | `Math.round(32 * s)` | Celebration text, victory messages |

All text uses `fontFamily: FONT_TITLE`. Drop shadow on light-on-dark text:
```typescript
dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 }
```

### 2.4 Spacing

Base unit: `Math.round(4 * s)`. All spacing is a multiple of this.

| Token | Value | Usage |
|-------|-------|-------|
| `space.xs` | `4 * s` | Inline icon gap |
| `space.sm` | `8 * s` | Tight padding, pill content |
| `space.md` | `12 * s` | Card padding, button padding |
| `space.lg` | `16 * s` | Section gaps, content margin |
| `space.xl` | `24 * s` | Major section separation |
| `space.2xl` | `32 * s` | Top-level screen padding |

### 2.5 Elevation

| Level | Usage | Visual |
|-------|-------|--------|
| 0 | Background | Flat |
| 1 | Cards, panels | 9-slice panel texture or rounded rect with border |
| 2 | Modals, popovers | Drop shadow + backdrop blur (0x000000, alpha 0.6) |
| 3 | Toasts | Floating above everything, slide animation |

### 2.6 Safe Areas

```
safeAreaTop    = max(CSS env(safe-area-inset-top), Capacitor nativePaddingTop)
safeAreaBottom = max(CSS env(safe-area-inset-bottom), Capacitor nativePaddingBottom)
```

- Top bar adds `safeAreaTop` to its height
- Tab bar adds `safeAreaBottom` to its height
- Play screen action bar respects `safeAreaBottom`

### 2.7 Canvas Setup

```
Canvas: 100vw × 100vh, position: fixed, inset: 0
Resolution: min(devicePixelRatio, 2)
autoDensity: true
antialias: true
Background: theme-dependent (ThemeColors.background)
```

### 2.8 Content Width Strategy

All scrollable tab screens share:

```typescript
const contentPadding = Math.round(16 * s);
const contentMaxWidth = Math.round(720 * s);
const contentWidth = Math.min(screenWidth - contentPadding * 2, contentMaxWidth);
const contentX = Math.max(contentPadding, (screenWidth - contentWidth) / 2);
```

Full-width on phones, capped + centered on tablets/desktop.

---

## 3. Navigation Architecture

### 3.1 Bottom Tab Bar

Persistent bottom navigation. 5 tabs, always visible except during gameplay.

```
+------------------------------------------------------------------+
|                                                                  |
|                      (current screen)                            |
|                                                                  |
+------------------------------------------------------------------+
| [🏠 Home]  [🗺 Map]  [🛒 Shop]  [📋 Quests]  [👤 Profile]      |
+------------------------------------------------------------------+
```

**Layout**:
```
height       = Math.round(56 * s) + safeAreaBottom
bgColor      = 0x0f172a
borderTop    = 1px 0x334155
tabWidth     = screenWidth / 5
iconSize     = Math.round(24 * s)
labelSize    = Math.round(10 * s)
activeColor  = UI.accent.gold (0xfbbf24)
inactiveColor= UI.text.muted (0x64748b)
```

**Tab definitions**:

| Tab | Icon | Label | Screen |
|-----|------|-------|--------|
| Home | `icon-home` | Home | HomeTab |
| Map | `icon-map` | Map | MapTab |
| Shop | `icon-shop` | Shop | ShopTab |
| Quests | `icon-scroll` | Quests | QuestsTab |
| Profile | `icon-profile` | Profile | ProfileTab |

**Badges**:
- Quests tab: red dot when rewards are claimable
- Home tab: blue dot when an active game exists

**Tab bar hides**: When PlayScreen is active (full-screen gameplay). Also hides during LoadoutPage push.

### 3.2 Screen Stack

Each tab maintains its own push/pop stack. Pushed screens slide in from right, back button pops.

| Tab | Root Screen | Push Screens |
|-----|-------------|--------------|
| Home | HomeScreen | — |
| Map | MapScreen | — |
| Shop | ShopScreen | — |
| Quests | QuestsScreen | — |
| Profile | ProfileScreen | SettingsScreen, LeaderboardScreen, TutorialScreen |

**Full-screen pushes** (hide tab bar):
- `HomeScreen → LoadoutPage → PlayScreen`
- `MapScreen → LoadoutPage → PlayScreen` (when tapping a level node)

### 3.3 Transitions

| Transition | Animation | Duration |
|-----------|-----------|----------|
| Tab switch | Cross-fade | 200ms |
| Screen push | Slide from right | 300ms ease-out |
| Screen pop | Slide to right | 250ms ease-in |
| Modal open | Scale 0.9→1.0 + fade in | 250ms |
| Modal close | Scale 1.0→0.95 + fade out | 200ms |
| Play enter | Slide up from bottom | 400ms ease-out |
| Play exit | Slide down | 300ms ease-in |

---

## 4. Global Components

### 4.1 ScreenHeader

Replaces the old `PageTopBar`. Used by all tab root screens and pushed screens.

```
+------------------------------------------------------------------+
| [←]  TITLE                                    [CubeBalance]     |
|       subtitle                                                   |
+------------------------------------------------------------------+
```

**Props**: `title`, `subtitle?`, `showBack?`, `onBack?`, `showCubeBalance?`, `cubeBalance?`, `rightAction?: { icon, onPress }`

**Layout**:
```
height       = Math.round(56 * s) + safeAreaTop
bgColor      = 0x000000, alpha 0.95
borderBot    = 1px 0x334155

backBtn      = SpriteIcon "icon-arrow-left", Math.round(28 * s), tapped area Math.round(44 * s)
titleStyle   = FONT_TITLE, Math.round(20 * s), fill 0xffffff
subStyle     = FONT_TITLE, Math.round(11 * s), fill UI.text.secondary
```

**CurrencyPill** (right side):
```
+--[icon-cube 16×16]--[45]--+
bgColor      = 0x1e293b, border 0x475569, rounded Math.round(16 * s)
textStyle    = FONT_TITLE, Math.round(14 * s), fill UI.accent.gold
padH         = Math.round(10 * s)
padV         = Math.round(6 * s)
```

### 4.2 PixiButton

9-slice texture button with variants. Existing component, kept as-is.

| Variant | Texture | Usage |
|---------|---------|-------|
| orange | btn-orange.png | Primary CTA (Play, Claim) |
| green | btn-green.png | Confirm, Start Game |
| purple | btn-purple.png | Secondary, Cancel |
| red | btn-red.png | Surrender, Danger |
| icon | btn-icon.png | Icon-only square buttons |

**9-slice borders**: `{ left: 16, top: 16, right: 16, bottom: 16 }`
**Press animation**: scale 0.95, 100ms

**Sizing**: Button dimensions always computed from `uiScale`:
```typescript
const btnW = Math.round(220 * s);
const btnH = Math.round(50 * s);
const fontSize = Math.round(16 * s);
```

### 4.3 Card

Rounded rectangle container for list items and shop items.

```
bgColor      = UI.bg.primary (0x1e293b)
border       = UI.border.primary (0x475569), width 1
radius       = Math.round(12 * s)
padding      = Math.round(14 * s)
```

**Variants**:
- `default` — Standard card
- `highlighted` — Border color = UI.accent.gold, glow effect
- `locked` — Alpha 0.5, lock icon overlay
- `claimable` — Border color = UI.status.success, pulse animation

### 4.4 ProgressBar

Horizontal progress indicator.

```
trackH       = Math.round(8 * s)
trackColor   = 0x334155
fillColor    = UI.accent.blue (or contextual color)
radius       = trackH / 2
```

**Variants**: default (blue), score (gold), danger (red when < 20%), success (green).

### 4.5 StarRating

1-3 stars display using SpriteIcon.

```
starSize     = Math.round(20 * s)
gap          = Math.round(4 * s)
filled       = SpriteIcon "star-filled", tint UI.accent.gold
empty        = SpriteIcon "star-empty", tint UI.text.muted
```

### 4.6 Toast Layer

Top-of-screen notification. Slides in from top, auto-dismisses.

```
toastY       = safeAreaTop + Math.round(8 * s)
toastW       = Math.min(screenWidth - Math.round(32 * s), Math.round(400 * s))
toastH       = Math.round(48 * s)
bgColor      = 0x1e293b
radius       = Math.round(10 * s)
textStyle    = FONT_TITLE, Math.round(14 * s)
duration     = 3000ms
```

**Types**: info (blue border), success (green), error (red), reward (gold + coin sound).

### 4.7 MomentumScroll

Shared scroll behavior for all scrollable pages.

```
- pointerDown: start drag, record Y
- pointerMove: calculate dy, update scrollY, track velocity
- pointerUp: stop drag, apply momentum
- tick: decay velocity (0.92^frameScale), apply delta
- clamp: [0, maxScroll]
- virtual scroll: only render visible items (BUFFER = 3 items)
- scrollbar: 6px track on right side, thumb proportional to content
```

### 4.8 SpriteIcon

Renders PNG icon sprites from catalog at a given size. White source, tinted in code.

```typescript
<SpriteIcon icon="icon-cube" size={Math.round(24 * s)} tint={0xfbbf24} x={x} y={y} />
```

**Available icons** (48×48px source, white on transparent):

| Category | Icons |
|----------|-------|
| Navigation | `icon-home`, `icon-map`, `icon-profile`, `icon-arrow-left`, `icon-arrow-right` |
| Game | `icon-star-filled`, `icon-star-empty`, `icon-cube`, `icon-crown`, `icon-fire`, `icon-level`, `icon-moves`, `icon-score` |
| UI | `icon-menu`, `icon-close`, `icon-settings`, `icon-lock`, `icon-info`, `icon-heart` |
| Audio | `icon-music`, `icon-sound` |
| Actions | `icon-shop`, `icon-scroll`, `icon-trophy`, `icon-surrender`, `icon-check`, `icon-play` |
| Quest | `icon-gamepad`, `icon-chart`, `icon-lightning` |
| Misc | `icon-medal-gold`, `icon-medal-silver`, `icon-medal-bronze`, `icon-skull`, `icon-refresh`, `icon-gesture`, `icon-bridge`, `icon-package`, `icon-wheat` |

---

## 5. Tab Screens

### 5.1 Home Tab

The landing screen. Logo, active game card (if any), and primary Play CTA.

```
+------------------------------------------------------------------+
| [CubeBalance: 45]                           [username]           |  ← ScreenHeader (no back)
+------------------------------------------------------------------+
|                                                                  |
|                       +-----------+                              |
|                       |   LOGO    |                              |  ← Bouncing anim
|                       +-----------+                              |
|                                                                  |
|   +--[Active Game Card]--gold-border--(if game exists)--------+  |
|   | [icon-play]  Game #42 — Level 12                          |  |
|   |              Score: 450 / 600        [RESUME →]           |  |
|   +-----------------------------------------------------------+  |
|                                                                  |
|                  +------------------------+                      |
|                  |      ▶ PLAY GAME       |                      |  ← orange, hero CTA
|                  +------------------------+                      |
|                                                                  |
|                  +------------------------+                      |
|                  |      LEADERBOARD       |                      |  ← purple
|                  +------------------------+                      |
|                                                                  |
|             Built on Starknet with Dojo                          |  ← xs footer
+------------------------------------------------------------------+
| [🏠]  [🗺]  [🛒]  [📋]  [👤]                                     |  ← Tab Bar
+------------------------------------------------------------------+
```

**Layout rules**:
```
-- Logo --
logoMaxH     = isMobile ? Math.round(80 * s) : Math.round(120 * s)
logoMaxW     = isMobile ? Math.round(220 * s) : Math.round(340 * s)
logoY        = headerH + Math.round(40 * s) + logoMaxH / 2
animation    = sin(t * 2) * Math.round(4 * s) vertical bounce

-- Active Game Card (replaces old MyGamesPage) --
cardW        = Math.min(screenWidth - Math.round(32 * s), Math.round(340 * s))
cardH        = Math.round(64 * s)
cardY        = logoY + logoMaxH / 2 + Math.round(24 * s)
show         = when player has an ongoing game (game.over === false)
onTap        = navigate to PlayScreen with that game

-- Buttons --
btnW         = isMobile ? Math.round(220 * s) : Math.round(260 * s)
btnH         = isMobile ? Math.round(50 * s) : Math.round(56 * s)
btnGap       = Math.round(12 * s)
playBtnY     = cardY + cardH + Math.round(24 * s)  (or logoY + offset if no card)
playFontSize = Math.round(20 * s)
otherFontSize= Math.round(16 * s)

-- PLAY GAME action --
If no active game: navigates to LoadoutPage
If active game exists: active game card handles resume, PLAY creates new game

-- Footer --
text         = "Built on Starknet with Dojo"
style        = FONT_TITLE, Math.round(10 * s), fill 0xffffff
y            = screenHeight - tabBarH - Math.round(16 * s)
```

**Key changes from old design**:
- **MyGamesPage removed** — active game surfaces as a card on Home
- **Settings, Tutorial, Trophy buttons removed from home** — moved to Profile tab
- **Quest button removed** — Quests is its own tab
- **Simpler, cleaner** — Logo + Active Game + Play + Leaderboard, that's it

### 5.2 Map Tab

Super Mario World-style progression map with 5 zones (10 levels each).

```
+------------------------------------------------------------------+
| ADVENTURE MAP                                  [Zone 1 of 5]    |  ← ScreenHeader
+------------------------------------------------------------------+
|                                                                  |
|  +-zone-bg-(1080×1920)-cover-scaled--------------------------+  |
|  |                                                           |  |
|  |    (●)———(●)———(●)———(●)                                |  |
|  |     L1    L2    L3    L4                                  |  |
|  |                  \                                         |  |
|  |                   (●)———(●)                               |  |
|  |                    L5    L6                                |  |
|  |                           \                                |  |
|  |    +--LevelPreview----+    (●)———(●)———(●)               |  |
|  |    | L3: Easy         |     L7    L8    L9                |  |
|  |    | ★★☆  Score 45/60 |           |                       |  |
|  |    | [PLAY]           |          (👑)  ← Boss L10         |  |
|  |    +------------------+                                    |  |
|  |                                                           |  |
|  +--------< swipe left/right to change zones >---------------+  |
|                                                                  |
|              [○]  [○]  [●]  [○]  [○]                            |  ← Zone dots
+------------------------------------------------------------------+
| [🏠]  [🗺]  [🛒]  [📋]  [👤]                                     |
+------------------------------------------------------------------+
```

**Layout**:
```
-- Zone scrolling --
zones        = 5 (levels 1-10, 11-20, 21-30, 31-40, 41-50)
zoneW        = screenWidth
swipeThreshold = Math.round(50 * s)
headerH      = ScreenHeader height

-- Map Nodes --
nodeR        = Math.round(18 * s)
nodeStroke   = Math.round(3 * s)
labelSize    = Math.round(12 * s)
states:
  locked     = gray fill, lock icon
  available  = white fill, pulsing glow
  cleared    = green fill, star icon
  current    = blue fill, animated ring
  boss       = larger radius (Math.round(24 * s)), gold border
  shop       = shop icon, distinct shape

-- Level Preview (popup on node tap) --
previewW     = Math.round(220 * s)
previewH     = dynamic
bgColor      = UI.bg.primary
border       = UI.border.primary
radius       = Math.round(12 * s)
content:
  - Level number + difficulty label
  - Star rating (1-3)
  - Score / target
  - Constraint summary
  - [PLAY] button (green, if available)

-- Zone indicator dots --
dotR         = Math.round(6 * s)
dotGap       = Math.round(12 * s)
bottomPad    = Math.round(24 * s) above tab bar
activeDot    = UI.accent.gold, filled
inactiveDot  = UI.text.muted, outlined

-- Paths between nodes --
lineWidth    = Math.round(3 * s)
lineColor    = 0xffffff, alpha 0.3 (locked), alpha 0.8 (cleared)
```

**Interaction**:
- Tap node → shows LevelPreview popup
- Tap PLAY in preview → pushes LoadoutPage (hides tab bar) → PlayScreen
- Swipe left/right → change zone with snap animation
- Zone backgrounds are per-theme (theme assigned per zone from VRF seed)

### 5.3 Shop Tab

2-column card grid with bonus upgrade cards and bridging card.

```
+------------------------------------------------------------------+
| SHOP                                           [45 CUBE]        |  ← ScreenHeader
+------------------------------------------------------------------+
|                                                                  |
|  +--[Combo]-----------+  +--[Score]-----------+                 |
|  | [bonus-icon]       |  | [bonus-icon]       |                 |
|  | Combo              |  | Score              |                 |
|  | ● ● ○  Starting    |  | ● ○ ○  Starting    |                 |
|  | ● ○ ○  Bag Size    |  | ● ○ ○  Bag Size    |                 |
|  | [UPGRADE 20]       |  | [UPGRADE 30]       |                 |
|  +--------------------+  +--------------------+                 |
|                                                                  |
|  +--[Harvest]---------+  +--[Wave]--locked-----+                |
|  | [bonus-icon]       |  | [🔒] Wave          |                 |
|  | Harvest            |  |                     |                 |
|  | ● ● ● Starting     |  |  [UNLOCK 200]      |                 |
|  | ● ○ ○ Bag Size     |  |                     |                 |
|  | [UPGRADE 15]       |  +--------------------+                 |
|  +--------------------+                                          |
|                                                                  |
|  +--[Supply]--locked---+  +--[Bridging]--------+                |
|  | [🔒] Supply        |  | [icon-bridge]      |                 |
|  |                     |  | Bridging Rank 2    |                 |
|  |  [UNLOCK 200]      |  | Max 10 cubes/run   |                 |
|  +--------------------+  | [UPGRADE 50]       |                 |
|                          +--------------------+                 |
+------------------------------------------------------------------+
| [🏠]  [🗺]  [🛒]  [📋]  [👤]                                     |
+------------------------------------------------------------------+
```

**Layout**:
```
pad          = Math.round(16 * s)
gap          = Math.round(12 * s)
cardW        = (contentWidth - gap) / 2
cardH        = Math.round(160 * s)
cardRadius   = Math.round(10 * s)
cardPad      = Math.round(14 * s)

-- Card content --
iconSize     = Math.round(40 * s) (bonus PNG textures from catalog)
nameStyle    = FONT_TITLE, Math.round(15 * s), fill 0xffffff
lockIcon     = SpriteIcon "icon-lock", Math.round(24 * s)

-- Level pips (●/○) --
pipW         = Math.round(18 * s)
pipH         = Math.round(6 * s)
pipGap       = Math.round(5 * s)
filledColor  = UI.accent.gold
emptyColor   = UI.text.muted

-- Upgrade button --
btnW         = cardW - cardPad * 2
btnH         = Math.round(36 * s)
variant      = orange (affordable), purple (too expensive)
fontSize     = Math.round(13 * s)
```

**Locked cards**: Alpha 0.6, single centered "UNLOCK [cost]" button.
**Max level**: Pips all filled, "MAX" label, button hidden.

### 5.4 Quests Tab

Daily quest families with tiered progress and claim buttons.

```
+------------------------------------------------------------------+
| DAILY QUESTS                                   [45 CUBE]        |  ← ScreenHeader
| 12 CUBE ready to claim!                                         |
+------------------------------------------------------------------+
|                  RESETS IN 05:32:18                              |
+------------------------------------------------------------------+
|                                                                  |
|  +--[Player]------green-border-(claimable)------------------+   |
|  | [icon-gamepad]  Player Quests                      2/3   |   |
|  |   [✓]  Warm-Up: Play 1 game                    +3 CUBE  |   |
|  |   [✓]  Getting Started: Play 3 games            +6 CUBE  |   |
|  |   [ ]  Dedicated: Play 5 games                 +12 CUBE  |   |
|  |   [========progress==========----]  3/5                  |   |
|  |   [      CLAIM  +6 CUBE      ]                           |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +--[Clearer]-----------------------------------------------+   |
|  | [icon-chart]  Clearer                              1/3   |   |
|  |   [✓]  Line Breaker: Clear 10 lines             +3 CUBE  |   |
|  |   [ ]  Line Crusher: Clear 30 lines             +6 CUBE  |   |
|  |   [🔒] Line Master: Clear 50 lines             +12 CUBE  |   |
|  |   [========progress======---------]  18/30               |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +--[Combo]------------------------------------------------+   |
|  | [icon-lightning]  Combo                            0/3   |   |
|  |   ...                                                     |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +--[Daily Champion]--gold-border--(all 9 complete)---------+   |
|  | [icon-crown]  Daily Champion                       0/1   |   |
|  |   Complete all 9 quests above                   +25 CUBE  |   |
|  +----------------------------------------------------------+   |
|                                                                  |
+------------------------------------------------------------------+
| [🏠]  [🗺]  [🛒]  [📋]  [👤]                                     |
+------------------------------------------------------------------+
```

**Layout**:
```
timerH       = Math.round(32 * s)
timerStyle   = FONT_TITLE, Math.round(12 * s), fill UI.text.muted
cardGap      = Math.round(14 * s)

-- Family Card --
cardPad      = Math.round(14 * s)
headerH      = Math.round(44 * s)
familyIcon   = SpriteIcon (icon-gamepad, icon-chart, icon-lightning, icon-crown), Math.round(24 * s)
familyName   = FONT_TITLE, Math.round(16 * s)
progressFrac = FONT_TITLE, Math.round(12 * s), fill UI.text.secondary

-- Tier Row --
rowH         = Math.round(28 * s)
stateIcon:
  completed  = SpriteIcon "icon-check", tint UI.status.success
  active     = SpriteIcon "icon-play", tint UI.accent.blue
  locked     = SpriteIcon "icon-lock", tint UI.text.muted
tierName     = FONT_TITLE, Math.round(12 * s)
tierReward   = FONT_TITLE, Math.round(12 * s), fill UI.accent.gold (active) or UI.text.muted (locked)

-- Progress bar --
height       = Math.round(10 * s)
below last tier row

-- Claim button --
variant      = green
height       = Math.round(44 * s)
show         = only when a tier is claimable
text         = "CLAIM +{reward} CUBE"
```

**Claimable state**: Card border = UI.status.success, subtle pulse animation.
**All complete**: Daily Champion card glows gold.

### 5.5 Profile Tab

Player identity, stats, and links to Settings/Leaderboard/Tutorial.

```
+------------------------------------------------------------------+
| MY PROFILE                                     [45 CUBE]        |  ← ScreenHeader
+------------------------------------------------------------------+
|                                                                  |
|  +--[Player Card]--------------------------------------------+  |
|  |  [avatar circle]                                          |  |
|  |  player_name_123                                          |  |
|  |  Best Level: 32    Total Games: 87                        |  |
|  +-----------------------------------------------------------+  |
|                                                                  |
|  +--[Stats Grid]---------------------------------------------+  |
|  | Lines Cleared    Combos Hit    Best Combo    Cubes Earned  |  |
|  |    4,820            312          8             1,245       |  |
|  +-----------------------------------------------------------+  |
|                                                                  |
|  +--[Menu List]----------------------------------------------+  |
|  | [icon-trophy]    Leaderboard                         [→]  |  |
|  | [icon-settings]  Settings                            [→]  |  |
|  | [icon-info]      How to Play                         [→]  |  |
|  +-----------------------------------------------------------+  |
|                                                                  |
|                    zKube v1.2.0                                  |
+------------------------------------------------------------------+
| [🏠]  [🗺]  [🛒]  [📋]  [👤]                                     |
+------------------------------------------------------------------+
```

**Layout**:
```
-- Player Card --
avatarSize   = Math.round(64 * s)
avatarBg     = UI.accent.blue
nameStyle    = FONT_TITLE, Math.round(20 * s)
statsStyle   = FONT_TITLE, Math.round(14 * s), fill UI.text.secondary
cardPad      = Math.round(20 * s)

-- Stats Grid --
gridCols     = 4
cellH        = Math.round(60 * s)
valueStyle   = FONT_TITLE, Math.round(18 * s), fill UI.accent.gold
labelStyle   = FONT_TITLE, Math.round(10 * s), fill UI.text.secondary

-- Menu List --
rowH         = Math.round(52 * s)
iconSize     = Math.round(24 * s)
labelStyle   = FONT_TITLE, Math.round(16 * s)
arrowIcon    = SpriteIcon "icon-arrow-right", Math.round(16 * s)
divider      = 1px 0x334155
```

**Pushed screens**:
- Tap "Leaderboard" → pushes LeaderboardScreen (slide from right)
- Tap "Settings" → pushes SettingsScreen
- Tap "How to Play" → pushes TutorialScreen

### 5.5.1 Leaderboard (Pushed from Profile)

Scrollable ranking list with medal rows for top 3.

```
+------------------------------------------------------------------+
| [←] LEADERBOARD                                                 |  ← ScreenHeader with back
|     42 players                                                   |
+------------------------------------------------------------------+
| #     PLAYER               LVL        SCORE                     |  ← Header row
+------------------------------------------------------------------+
| +--gold-border-----------------------------------------------+  |
| | [medal-gold]  PlayerOne       Lv 32            4,820       |  |
| +------------------------------------------------------------+  |
| +--silver-border---------------------------------------------+  |
| | [medal-silver] PlayerTwo      Lv 28            3,650       |  |
| +------------------------------------------------------------+  |
| +--bronze-border---------------------------------------------+  |
| | [medal-bronze] PlayerThree    Lv 25            2,980       |  |
| +------------------------------------------------------------+  |
| +--normal----------------------------------------------------+  |
| | #4   SomePlayer              Lv 18            1,520        |  |
| +------------------------------------------------------------+  |
|                         (scroll)                                 |
+------------------------------------------------------------------+
| [🏠]  [🗺]  [🛒]  [📋]  [👤]                                     |
+------------------------------------------------------------------+
```

**Layout**:
```
headerRowH   = Math.round(36 * s)
rowH         = Math.round(56 * s)
rowGap       = Math.round(8 * s)
contentMaxW  = Math.round(720 * s)

-- Medal rows (top 3) --
medalIcon    = SpriteIcon "icon-medal-gold/silver/bronze", Math.round(28 * s)
borderColor  = gold/silver/bronze hex

-- Normal rows --
rankStyle    = FONT_TITLE, Math.round(14 * s), fill UI.text.secondary
nameStyle    = FONT_TITLE, Math.round(16 * s), fill 0xffffff
levelStyle   = FONT_TITLE, Math.round(14 * s), fill UI.accent.blue
scoreStyle   = FONT_TITLE, Math.round(18 * s), fill UI.accent.gold
```

### 5.5.2 Settings (Pushed from Profile)

Reference implementation for uiScale. Kept from old design — already correct.

```
+------------------------------------------------------------------+
| [←] SETTINGS                                                    |
+------------------------------------------------------------------+
|  +--[AUDIO]----------------------------------------------+      |
|  | MUSIC                                      75%        |      |
|  | [============================--------] (●)            |      |
|  | SOUND EFFECTS                          100%           |      |
|  | [======================================] (●)          |      |
|  +-------------------------------------------------------+      |
|  +--[THEME]----------------------------------------------+      |
|  | [T1] [T2] [T3] [T4] [T5]                             |      |
|  | [T6] [T7] [T8] [T9] [T10]                            |      |
|  +-------------------------------------------------------+      |
|  +--[ACCOUNT]--------------------------------------------+      |
|  | DISPLAY NAME                          player123       |      |
|  | (no wallet address shown)                             |      |
|  +-------------------------------------------------------+      |
|                    zKube v1.2.0                                  |
+------------------------------------------------------------------+
```

**Note**: Wallet address **hidden** in redesign (casual-first). Only display name visible.

### 5.5.3 Tutorial / How to Play (Pushed from Profile)

Scrollable step cards explaining game mechanics. Interactive tutorial (see Section 8) replaces this for first-time players, but this static reference remains accessible.

```
+------------------------------------------------------------------+
| [←] HOW TO PLAY                                                 |
+------------------------------------------------------------------+
|  +--[Step 1]------------------------------------------------+  |
|  | [icon-moves] MOVE BLOCKS                                  |  |
|  | Swipe blocks left or right to form complete lines.        |  |
|  | Gravity pulls blocks down after each move.                |  |
|  +-----------------------------------------------------------+  |
|  +--[Step 2]------------------------------------------------+  |
|  | [icon-fire] USE BONUSES                                   |  |
|  | Tap bonus buttons during gameplay to activate powers.     |  |
|  | Combo, Score, Harvest, Wave, Supply — each unique.        |  |
|  +-----------------------------------------------------------+  |
|  +--[Step 3]------------------------------------------------+  |
|  | [icon-star-filled] EARN STARS                             |  |
|  | Beat the score target to clear levels. Get 1-3 stars      |  |
|  | based on performance. Stars unlock better bonuses.        |  |
|  +-----------------------------------------------------------+  |
|  +--[Step 4]------------------------------------------------+  |
|  | [icon-cube] COLLECT CUBES                                 |  |
|  | Cubes drop from combos and level completion. Spend        |  |
|  | them in the Shop on upgrades, or bring them into runs.    |  |
|  +-----------------------------------------------------------+  |
|  +--[Step 5]------------------------------------------------+  |
|  | [icon-shop] UPGRADE IN THE SHOP                           |  |
|  | Buy starting charges, increase bag size, unlock new       |  |
|  | bonus types, and upgrade your bridging rank.              |  |
|  +-----------------------------------------------------------+  |
+------------------------------------------------------------------+
```

**Layout**:
```
cardGap      = Math.round(12 * s)
cardPad      = Math.round(16 * s)
iconSize     = Math.round(32 * s)
titleStyle   = FONT_TITLE, Math.round(16 * s), fill 0xffffff
bodyStyle    = FONT_TITLE, Math.round(13 * s), fill UI.text.secondary, wordWrap
```

---

## 6. Gameplay Screens

### 6.1 Loadout Page

Full-screen push (tab bar hidden). Select 3 bonuses + cube bridging before a run.

```
+------------------------------------------------------------------+
| [←]  SELECT LOADOUT                           [45 CUBE]         |  ← ScreenHeader with back
|      Choose 3 bonuses for your run                               |
+------------------------------------------------------------------+
|                                                                  |
|                         BONUSES                                  |
|                                                                  |
|  +--------+  +--------+  +--------+  +--------+  +--------+    |
|  | [img]  |  | [img]  |  | [img]  |  | [img]  |  | [img]  |    |
|  | Combo  |  | Score  |  |Harvest |  | Wave   |  |Supply  |    |
|  | [SEL]  |  | [SEL]  |  | [SEL]  |  | [🔒]  |  | [🔒]  |    |
|  +--------+  +--------+  +--------+  +--------+  +--------+    |
|                                                                  |
|                   BRING CUBES (MAX 10)                           |
|  [================(●)--------------------]  5                    |
|                                                                  |
|  +---------------------------------------------------+          |
|  |              START GAME                            |          |  ← green
|  +---------------------------------------------------+          |
|  +---------------------------------------------------+          |
|  |                CANCEL                              |          |  ← purple
|  +---------------------------------------------------+          |
|                                                                  |
+------------------------------------------------------------------+
```

**Layout**:
```
contentTop   = headerH + Math.round(40 * s)

-- Bonus tiles --
tileSize     = Math.min(Math.round(80 * s), (contentWidth - 4 * Math.round(16 * s)) / 5)
tileGap      = Math.round(16 * s)
tileRadius   = Math.round(14 * s)
iconSize     = tileSize * 0.55

selectedBorder = UI.accent.gold, width Math.round(3 * s)
lockedAlpha    = 0.4
lockIcon       = SpriteIcon "icon-lock"

nameStyle    = FONT_TITLE, Math.round(12 * s)
sectionTitle = FONT_TITLE, Math.round(20 * s)

-- Cube slider --
trackH       = Math.round(10 * s)
knobR        = Math.round(16 * s)
knobColor    = UI.accent.gold
valueStyle   = FONT_TITLE, Math.round(18 * s)
range        = [0, playerMeta.maxCubes] (from bridging rank)

-- Buttons --
startBtnH    = Math.round(56 * s)
cancelBtnH   = Math.round(48 * s)
startFont    = Math.round(18 * s)
cancelFont   = Math.round(16 * s)

-- START GAME action --
Calls onStartGame(selectedBonuses, cubesToBring)
On success → push PlayScreen
```

### 6.2 Play Screen

Full-screen gameplay. No tab bar, no header. Custom HUD.

```
+------------------------------------------------------------------+
| [☰] L5  120/200   8/20  ×3                            12 CUBE  |  ← StatsBar
| [===progress========] [c1][c2]                       [★★☆]     |  ← ProgressHudBar
+------------------------------------------------------------------+
|                                                                  |
|  +--optional--+  +------------------------------+  +--optional--+
|  | Score      |  |                              |  | Moves      |
|  | Panel      |  |      8 × 10 GAME GRID       |  | Panel      |
|  | (desktop)  |  |                              |  | (desktop)  |
|  |            |  |   blocks, gravity, drag       |  |            |
|  +------------+  +------------------------------+  +------------+
|                  |     NEXT LINE PREVIEW          |
|                  +------------------------------+
+------------------------------------------------------------------+
| [Bonus1] [Bonus2] [Bonus3] | ×3 combo | ★★★ | [Surrender]      |  ← ActionBar
+------------------------------------------------------------------+
```

**Layout** (from `useFullscreenLayout()`):

```
-- Stats Bar --
barH         = Math.round(32 * s)
barY         = Math.round(6 * s) + safeAreaTop
menuBtn      = SpriteIcon "icon-menu", Math.round(28 * s)
levelBadge   = circle, radius (barH - 4) / 2, gold fill
scoreText    = FONT_TITLE, Math.round(13 * s)
movesText    = FONT_TITLE, Math.round(14 * s), red when ≤ 3 remaining
cubeDisplay  = SpriteIcon "icon-cube" + text, right-aligned

-- Progress Bar --
barH         = Math.round(26 * s)
progressH    = Math.round(8 * s) inner track
stars        = SpriteIcon "icon-star-filled" / "icon-star-empty"
constraints  = procedural dots (keep as-is)

-- Game Grid --
cellSize     = clamp(min(cellFromW, cellFromH), 28, 56)
gridW        = cellSize * 8
gridH        = cellSize * 10
gridX        = centered: (screenWidth - gridW) / 2
gridY        = hudTotalHeight + framePad

-- Next Line Preview --
height       = cellSize
y            = gridY + gridH + Math.round(4 * s)

-- Action Bar --
barH         = Math.round(64 * s)
barY         = screenHeight - barH - safeAreaBottom
bonusBtns    = 3 buttons, Math.round(48 * s) each
surrenderBtn = SpriteIcon "icon-surrender", red variant

-- Side Panels (desktop ≥ 900px only) --
panelW       = Math.round(100 * s)
leftX        = gridX - panelW - Math.round(16 * s)
rightX       = gridX + gridW + Math.round(16 * s)
```

**Interaction**:
- Drag blocks horizontally → `move()` transaction
- Tap bonus button → `applyBonus()` or bonus-specific modal
- Tap menu → MenuModal
- Tap surrender → confirmation → `surrender()` transaction

**State machine** (from `useGameStateMachine`):
```
idle → moving → animating_clear → animating_gravity → animating_spawn → idle
         ↓
    (no lines) → idle
```

---

## 7. Modal Specifications

All modals share base behavior: backdrop (0x000000, alpha 0.6), centered panel, scale-in animation.

### 7.1 PixiModal (Base)

```
backdrop     = fullscreen 0x000000, alpha 0.6, tap = close (optional)
panelW       = Math.round(Math.min(screenWidth * 0.85, 400) * s)
panelH       = dynamic per modal
panelX       = (screenWidth - panelW) / 2
panelY       = (screenHeight - panelH) / 2
radius       = Math.round(16 * s)
bgColor      = UI.bg.primary (0x1e293b)
border       = UI.border.primary (0x475569), width 1
titleStyle   = FONT_TITLE, Math.round(22 * s)
closeBtn     = SpriteIcon "icon-close", Math.round(32 * s), top-right
```

### 7.2 Level Complete Modal

Shown when level score target is met.

```
+----------------------------------------+
|              LEVEL COMPLETE!           |
|                                        |
|              ★ ★ ★                     |  ← 1-3 stars, animated
|                                        |
|   Score: 280        Cubes: +5          |
|   Combo: ×4         Moves left: 6     |
|                                        |
|   Bonus Awarded: [icon] Combo +1      |  ← if earned
|                                        |
|   [      NEXT LEVEL      ]            |  ← green
|   [        HOME           ]            |  ← purple
+----------------------------------------+
```

**Stars animation**: Each star scales from 0 → 1.2 → 1.0 with 200ms delay between each. Particle burst on each star.

**Layout**:
```
starSize     = Math.round(40 * s)
starGap      = Math.round(16 * s)
statLabel    = FONT_TITLE, Math.round(12 * s), fill UI.text.secondary
statValue    = FONT_TITLE, Math.round(18 * s), fill 0xffffff
cubeValue    = FONT_TITLE, Math.round(18 * s), fill UI.accent.gold
btnH         = Math.round(48 * s)
btnGap       = Math.round(10 * s)
```

### 7.3 Game Over Modal

Shown when moves run out before completing a level.

```
+----------------------------------------+
|    [icon-skull]  GAME OVER             |
|                                        |
|   Reached Level: 12                    |
|   Total Score: 1,450                   |
|   Max Combo: ×6                        |
|   Cubes Earned: 23                     |
|                                        |
|   [      TRY AGAIN      ]             |  ← orange
|   [        HOME          ]             |  ← purple
+----------------------------------------+
```

**Layout**:
```
skullSize    = Math.round(32 * s)
statRows     = 4, each Math.round(32 * s) height
labelStyle   = FONT_TITLE, Math.round(14 * s), fill UI.text.secondary
valueStyle   = FONT_TITLE, Math.round(20 * s), fill 0xffffff
cubeStyle    = fill UI.accent.gold
btnH         = Math.round(48 * s)
```

### 7.4 Victory Modal

Shown when level 50 is completed (run_completed).

```
+----------------------------------------+
|         🎉 VICTORY! 🎉                 |
|                                        |
|   [icon-crown] CHAMPION               |
|                                        |
|   Total Score: 12,450                  |
|   Cubes Earned: 145                    |
|   Max Combo: ×8                        |
|                                        |
|   [      CELEBRATE      ]             |  ← gold
|   [        HOME          ]             |  ← purple
+----------------------------------------+
```

**Particles**: Confetti particle system running behind the modal. Gold + theme accent colors.

### 7.5 Menu Modal

Pause menu during gameplay.

```
+----------------------------------------+
|              PAUSED                    |
|                                        |
|   [      RESUME       ]               |  ← green
|   [      SURRENDER     ]               |  ← red
|   [       HOME         ]               |  ← purple
+----------------------------------------+
```

**Layout**:
```
btnW         = panelW - Math.round(40 * s)
btnH         = Math.round(52 * s)
btnGap       = Math.round(12 * s)
```

### 7.6 In-Game Shop Modal

Appears every 10 levels. Spend cubes on consumables during a run.

```
+----------------------------------------+
|    [icon-shop]  LEVEL 10 SHOP          |
|    Budget: 15 CUBE                     |
+----------------------------------------+
|                                        |
|  +--[Buy Charges]---+  +--[Allocate]-+ |
|  | [bonus-icon]     |  | [bonus-icon]| |
|  | +3 Combo Charges |  | Move charge | |
|  | Cost: 5 CUBE     |  | to Harvest  | |
|  | [BUY]            |  | [ALLOCATE]  | |
|  +------------------+  +-------------+ |
|                                        |
|  +--[Level Up]------+  +--[Swap]-----+ |
|  | [bonus-icon]     |  | [bonus-icon]| |
|  | Upgrade Combo    |  | Swap Combo  | |
|  | Lv2 → Lv3       |  | for Score   | |
|  | [LEVEL UP]       |  | [SWAP]      | |
|  +------------------+  +-------------+ |
|                                        |
|   [       CONTINUE       ]             |  ← green
+----------------------------------------+
```

**Layout**:
```
gridCols     = 2
cardW        = (panelW - Math.round(36 * s)) / 2
cardH        = Math.round(120 * s)
cardGap      = Math.round(8 * s)
iconSize     = Math.round(32 * s)
costStyle    = FONT_TITLE, Math.round(12 * s), fill UI.accent.gold
```

---

## 8. Onboarding Flow

### First-Time Player Detection

```typescript
const isFirstTime = !localStorage.getItem('zkube_onboarded');
```

If first time → interactive tutorial overlay on first game. If returning → skip to normal flow.

### Interactive Tutorial (10 Steps)

Guided first game with contextual highlights and tips. A hand-pointer sprite animates to show where to interact.

| Step | Trigger | Highlight | Tip Text | Hand Target |
|------|---------|-----------|----------|-------------|
| 1 | Game loads | Full grid | "Welcome to zKube! Slide blocks to form lines." | Center of grid |
| 2 | After 2s | A specific block | "Drag this block to the right →" | The target block |
| 3 | After first move | Cleared line (if any) | "Nice! Cleared lines earn points." | Score counter |
| 4 | After 2 moves | Bonus bar | "Bonuses give you special powers." | First bonus button |
| 5 | After bonus tap | Grid effect | "Combo bonus adds to your streak!" | Combo display |
| 6 | After 3 moves | Progress bar | "Fill the bar to complete the level." | Progress bar |
| 7 | After 4 moves | Stars | "Score higher for more stars!" | Star display |
| 8 | After 5 moves | Constraint | "Meet the constraint for bonus rewards." | Constraint indicator |
| 9 | Level complete | Level modal | "Level complete! Tap to continue." | Next Level button |
| 10 | Dismiss | None | "You're ready! Have fun." | — |

### Tutorial Overlay Component

```
+------------------------------------------------------------------+
|                                                                  |
|   [dimmed everything except highlight target]                    |
|                                                                  |
|   +--[Tooltip bubble]--------+                                   |
|   | "Drag this block right →" |                                  |
|   +--[▼]---------------------+                                   |
|           👆                                                      |  ← hand-pointer sprite
|       [highlight target]                                         |
|                                                                  |
+------------------------------------------------------------------+
```

**Layout**:
```
overlayBg    = 0x000000, alpha 0.5 (everywhere except cutout)
cutout       = rectangular hole around highlight target, Math.round(8 * s) padding
tooltipBg    = UI.bg.primary
tooltipBorder= UI.accent.gold
tooltipW     = Math.round(240 * s)
tooltipStyle = FONT_TITLE, Math.round(14 * s), wordWrap
handSize     = Math.round(40 * s)
handAnim     = bob up/down (Math.round(6 * s) amplitude, 1.5s period)
tapToDismiss = tap anywhere outside highlight to advance
```

### Post-Tutorial

```typescript
localStorage.setItem('zkube_onboarded', 'true');
```

Tutorial can be replayed from Profile → How to Play → "Replay Tutorial" button.

---

## 9. Animation & Effects

### 9.1 Gameplay Effects

| Effect | Trigger | Description |
|--------|---------|-------------|
| **Line Clear** | Line completed | Flash white → particle burst along line → blocks fade out (200ms) → gravity drop (300ms) |
| **Combo** | 2+ lines in one move | Combo counter scales up 1.0→1.3→1.0, screen shake (2px, 150ms), combo SFX |
| **Multi-clear** | 4+ lines | Screen flash, larger particles, louder SFX, haptic heavy |
| **Gravity** | After clear | Blocks fall with easing (ease-out-bounce), 300ms per row |
| **Block spawn** | New line appears | Blocks scale from 0→1.0 with staggered delay (50ms per block) |
| **Bonus activate** | Tap bonus | Icon flashes, radial wave effect from button, SFX |
| **Harvest** | Harvest bonus | Targeted blocks glow → shrink → burst into cube particles |
| **Wave** | Wave bonus | Horizontal energy line sweeps across cleared rows |
| **Danger** | ≤3 moves left | Red vignette pulse at screen edges, moves counter turns red |
| **Game Over** | Moves = 0, not cleared | Grid blocks cascade-fall off screen bottom, rumble SFX |
| **Level Complete** | Score target met | Flash + stars fly in + confetti particles |

### 9.2 UI Transitions

| Element | Animation |
|---------|-----------|
| Tab switch | Content cross-fade, 200ms |
| Screen push | Slide in from right, 300ms ease-out |
| Screen pop | Slide out to right, 250ms ease-in |
| Modal open | Backdrop fade in (200ms) + panel scale 0.9→1.0 (250ms) |
| Modal close | Panel scale 1.0→0.95 (200ms) + backdrop fade out |
| Toast in | Slide down from top, 250ms |
| Toast out | Slide up + fade, 200ms |
| Button press | Scale 1.0→0.95→1.0, 100ms |
| Card highlight | Border pulse (opacity 0.5→1.0→0.5, 2s loop) |
| Node pulse | Scale 1.0→1.05→1.0 + glow opacity cycle, 1.5s loop |

### 9.3 Particle System

Shared particle emitter with preset configurations:

| Preset | Particle | Count | Lifetime | Behavior |
|--------|----------|-------|----------|----------|
| `line_clear` | Spark | 20 per block | 500ms | Burst from block center, radial, gravity |
| `combo` | Star | 30 | 800ms | Burst from combo counter, spiral outward |
| `level_complete` | Mixed | 100 | 2000ms | Rain from top, confetti drift, no gravity |
| `harvest` | Cube sparkle | 10 per block | 600ms | Float up from block, fade |
| `star_earn` | Star | 15 | 400ms | Burst from star position |
| `quest_claim` | Coin | 20 | 800ms | Burst up from claim button, arc down |

Particles are 16×16px white sprites, tinted per-theme via `ThemeColors.particles`.

### 9.4 Sound Effects

| SFX | File | Trigger |
|-----|------|---------|
| `break` | `break.mp3` | Line cleared |
| `explode` | `explode.mp3` | Multi-line combo (4+) |
| `move` | `move.mp3` | Block moved |
| `new` | `new.mp3` | New blocks spawned |
| `start` | `start.mp3` | Game started |
| `swipe` | `swipe.mp3` | Block swiped (before move confirms) |
| `over` | `over.mp3` | Game over |
| **New SFX** | | |
| `click` | `click.mp3` | UI button tap |
| `coin` | `coin.mp3` | Cube earned / received |
| `claim` | `claim.mp3` | Quest reward claimed |
| `star` | `star.mp3` | Star earned in level complete |
| `levelup` | `levelup.mp3` | Level completed fanfare |

### 9.5 Haptic Feedback

| Event | Haptic Type |
|-------|-------------|
| Button tap | Light (10ms) |
| Line clear | Medium (15ms) |
| Combo (2-3 lines) | Medium (20ms) |
| Big combo (4+ lines) | Heavy (30ms) |
| Level complete | Success pattern (light-medium-heavy) |
| Game over | Error pattern (heavy-pause-heavy) |
| Quest claim | Medium (15ms) |
| Star earned | Light (10ms) per star |

Implementation via Capacitor Haptics plugin:
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';
Haptics.impact({ style: ImpactStyle.Medium });
```

---

## 10. Accessibility

### Touch Targets

Minimum touch target: `Math.round(44 * s)` × `Math.round(44 * s)` (Apple HIG minimum 44pt).

All interactive elements — buttons, tab bar icons, bonus buttons, map nodes, list rows — meet this minimum.

### Color Contrast

- Primary text on dark bg: `#ffffff` on `#1e293b` → contrast ratio 12.6:1 ✓
- Secondary text: `#94a3b8` on `#1e293b` → contrast ratio 5.1:1 ✓
- Gold accent: `#fbbf24` on `#1e293b` → contrast ratio 8.2:1 ✓
- Danger red: `#ef4444` on `#1e293b` → contrast ratio 4.8:1 ✓ (large text)

### Reduced Motion

Respect system preference:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

When enabled:
- Disable particle effects
- Replace slide transitions with instant cuts
- Disable logo bounce animation
- Disable node pulse animations
- Keep essential feedback (line clear flash, score popup)

### Font Scaling

`uiScale` handles device-level scaling. No additional font scaling needed since all sizes are already relative to screen width.

---

## 11. Responsive Behavior

### 11.1 Breakpoints

| Breakpoint | Condition | Layout Changes |
|------------|-----------|----------------|
| **Phone** | `width < 768` | Standard layout, tab bar bottom, single column |
| **Tablet** | `768 ≤ width < 1024` | Content capped at 720px, larger touch targets |
| **Desktop** | `width ≥ 1024` | Content capped at 720px, side panels on PlayScreen |
| **Landscape** | `width > height` | PlayScreen uses horizontal layout, grid centered |

### 11.2 Content Width

```typescript
const contentMaxWidth = Math.round(720 * s);  // s capped at 1.5
const maxAbsolute = 1080;                      // hard cap in px
const contentWidth = Math.min(screenWidth - contentPadding * 2, contentMaxWidth, maxAbsolute);
```

### 11.3 Grid Scaling

```typescript
const cellSize = clamp(
  Math.min(
    (screenWidth - 2 * framePad) / 8,
    (availableHeight) / 10
  ),
  28,    // minimum cell size
  56     // maximum cell size
);
```

Grid is always centered horizontally. On desktop landscape, side panels fill the remaining space.

### 11.4 Tab Bar on Desktop

Tab bar remains at bottom on all screen sizes for consistency. On desktop (width ≥ 1024), tab bar width is capped at `Math.round(480 * s)` and centered.

### 11.5 Background Rendering

Portrait texture (1080×1920) rendered with cover mode:

```
scale = max(screenWidth / texWidth, screenHeight / texHeight)
offsetX = (screenWidth - texWidth * scale) / 2
offsetY = (screenHeight - texHeight * scale) / 2
```

On landscape desktop, the portrait texture crops heavily on top/bottom. Acceptable for now.

---

## 12. Asset Requirements Summary

### 12.1 New Icon Assets Needed

These don't exist in the current catalog and are needed for the tab bar and redesign:

| Icon | Size | Usage |
|------|------|-------|
| `icon-home` | 48×48 | Home tab |
| `icon-map` | 48×48 | Map tab |
| `icon-profile` | 48×48 | Profile tab |
| `icon-arrow-left` | 48×48 | Back button |
| `icon-arrow-right` | 48×48 | Menu list chevron |
| `icon-info` | 48×48 | How to Play menu item |
| `icon-heart` | 48×48 | Favorites / lives (future) |
| `icon-gamepad` | 48×48 | Quest family: Player |
| `icon-chart` | 48×48 | Quest family: Clearer |
| `icon-lightning` | 48×48 | Quest family: Combo |
| `icon-medal-gold` | 48×48 | Leaderboard #1 |
| `icon-medal-silver` | 48×48 | Leaderboard #2 |
| `icon-medal-bronze` | 48×48 | Leaderboard #3 |
| `icon-check` | 48×48 | Completed state |
| `icon-play` | 48×48 | In-progress / resume |
| `icon-skull` | 48×48 | Game over |
| `icon-refresh` | 48×48 | Retry |
| `icon-gesture` | 48×48 | Tutorial hand/swipe |
| `icon-bridge` | 48×48 | Bridging card |
| `icon-package` | 48×48 | Supply bonus icon |
| `icon-wheat` | 48×48 | Harvest bonus icon |

**Total**: 21 new icon sprites (48×48px, white on transparent, same pipeline as existing icons).

### 12.2 New SFX Needed

| SFX | Duration | Description |
|-----|----------|-------------|
| `click.mp3` | 0.1-0.15s | Clean UI button tap |
| `coin.mp3` | 0.2-0.3s | Cube/coin received |
| `claim.mp3` | 0.3-0.5s | Quest reward claimed, ascending chime |
| `star.mp3` | 0.2-0.3s | Single star earned, bright ding |
| `levelup.mp3` | 0.5-0.8s | Level complete fanfare, triumphant |

### 12.3 New Tutorial Assets

| Asset | Size | Description |
|-------|------|-------------|
| `tutorial-hand.png` | 64×64 | Hand/pointer sprite for tutorial overlay |

### 12.4 Existing Assets (No Changes)

All per-theme assets (blocks, backgrounds, logos, grids, maps, theme icons, music) remain as-is. The redesign only changes UI layout and navigation — not the game's visual theme system.

---

## Appendices

### Appendix A: Data Mapping (What Feeds Each Screen)

| Screen | Data Source | Hook / Store |
|--------|------------|--------------|
| HomeScreen | Player games, cube balance | `useGame`, `useCubeBalance`, `usePlayerMeta` |
| MapScreen | Game state (current level, cleared levels) | `useGame`, Zustand `generalStore` |
| ShopScreen | PlayerMeta (upgrades, bag size, bridging rank), cube balance | `usePlayerMeta`, `useCubeBalance` |
| QuestsScreen | Quest families, quest progress | `useQuests` context, `questFamilies` prop |
| ProfileScreen | PlayerMeta, leaderboard | `usePlayerMeta`, `useLeaderboard` |
| LoadoutPage | PlayerMeta (available bonuses, bag size, max cubes) | `usePlayerMeta` |
| PlayScreen | Game model (blocks, score, moves, combo, level) | `useGame`, `usePlayGame`, `useGameStateMachine` |
| Modals | Game state at completion | Props from PlayScreen |

### Appendix B: Page ID Migration

Old `PageNavigator` page IDs → new navigation structure:

| Old PageId | New Location |
|-----------|--------------|
| `home` | HomeTab (root) |
| `map` | MapTab (root) |
| `shop` | ShopTab (root) |
| `quests` | QuestsTab (root) |
| `settings` | ProfileTab → push SettingsScreen |
| `leaderboard` | ProfileTab → push LeaderboardScreen |
| `tutorial` | ProfileTab → push TutorialScreen |
| `mygames` | **Removed** — merged into HomeTab as Active Game Card |
| `loadout` | Full-screen push from Home/Map (hides tab bar) |
| `play` | Full-screen push from Loadout (hides tab bar) |

### Appendix C: Component Migration Checklist

Every component must be updated to:

1. **Receive `uiScale`** — via prop or `useFullscreenLayout()`
2. **Scale all dimensions** — `Math.round(value * s)` for every pixel value
3. **Use `FONT_TITLE` only** — replace all `FONT_BODY` and `FONT_BOLD` references
4. **Use SpriteIcon** — replace all emoji characters with SpriteIcon from catalog
5. **Respect safe areas** — top bar adds `safeAreaTop`, tab bar adds `safeAreaBottom`

**Priority order**:

| Phase | Components | Scope |
|-------|-----------|-------|
| 1 — Infrastructure | TabNavigator (new), ScreenStack (new), ScreenHeader (new), CurrencyPill (new) | New components |
| 2 — Tab screens | HomeScreen, MapScreen, ShopScreen, QuestsScreen, ProfileScreen | 5 root screens |
| 3 — Push screens | LeaderboardScreen, SettingsScreen, TutorialScreen | 3 pushed screens |
| 4 — Gameplay | LoadoutPage, PlayScreen | 2 full-screen pages |
| 5 — Modals | PixiModal base, LevelComplete, GameOver, Victory, Menu, InGameShop | 6 modals |
| 6 — HUD/ActionBar | StatsBar, ProgressBar, LevelBadge, MovesCounter, ActionBar, BonusButton, ComboDisplay | 7 components |
| 7 — Tutorial | TutorialOverlay (new), hand-pointer asset | New system |
| 8 — Polish | Particle presets, haptic integration, reduced motion, toast system | Cross-cutting |

### Appendix D: Legitimate Procedural Drawing (DO NOT Replace with Sprites)

These use `PixiGraphics.draw()` and should remain procedural:

| Component | What It Draws | Why Procedural |
|-----------|---------------|----------------|
| ProgressBar | Track + fill bar | Dynamic width |
| LevelPips | Upgrade level dots | Dynamic count |
| VolumeSlider | Track + fill + knob | Drag state |
| CubeSlider | Track + fill + knob | Drag state |
| ParticleSystem | Particle effects | Animated |
| ScorePopup | Floating score text | Animated |
| ScreenShake | Container transform | Animated |
| Modal backdrop | Semi-transparent overlay | Simple fill |
| Card backgrounds | Rounded rect with border | Dynamic state |
| Row backgrounds | Rounded rect with color | Dynamic state |
| Scroll hit areas | Invisible touch targets | Required |
| Scrollbar thumb | Position tracks scroll | Dynamic |
| Grid highlights | Selection indicators | Dynamic |
| Danger border | Red screen flash | Dynamic |
| Vignette overlay | Edge darkening gradient | Decorative |
| Constraint dots | Progress dots in HUD | Dynamic state |
| Map paths | Lines between nodes | Generated from data |
| Tab bar | Background + borders | Static but trivial |
