# zKube UI/UX Specification

Complete layout, responsive, and asset specification for the PixiJS mobile app.

**Design reference**: 375px portrait (iPhone SE). All dimensions in CSS pixels unless noted.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Responsive System](#2-responsive-system)
3. [Global Components](#3-global-components)
4. [Page Specifications](#4-page-specifications)
   - [Home Page](#41-home-page)
   - [Play Screen](#42-play-screen)
   - [Map Page](#43-map-page)
   - [Settings Page](#44-settings-page)
   - [Leaderboard Page](#45-leaderboard-page)
   - [Shop Page](#46-shop-page)
   - [Quests Page](#47-quests-page)
   - [My Games Page](#48-my-games-page)
   - [Loadout Page](#49-loadout-page)
   - [Tutorial Page](#410-tutorial-page)
5. [Modal Specifications](#5-modal-specifications)
6. [Asset Requirements](#6-asset-requirements)
7. [Migration Checklist](#7-migration-checklist)

---

## 1. Design Philosophy

**Mobile-first, portrait-primary.** The game is designed for phones held vertically.
Desktop and landscape are supported but secondary viewports.

### Principles

- **One font**: `FONT_TITLE` everywhere. No `FONT_BODY`.
- **Sprites over emoji**: Every icon is a PNG sprite, never an emoji character.
- **uiScale everything**: No hardcoded pixel values. All sizes multiply by `uiScale`.
- **Content cap at 720px**: Scrollable list pages cap content width to prevent ultra-wide stretching.
- **Cover backgrounds**: Portrait backgrounds fill the viewport via CSS-like `object-fit: cover`.

---

## 2. Responsive System

### 2.1 uiScale

The single scaling factor for all UI elements.

```
uiScale = clamp(screenWidth / 375, 0.8, 1.5)
```

| Device              | screenWidth | uiScale | Notes                  |
|---------------------|-------------|---------|------------------------|
| iPhone SE           | 375         | 1.0     | Design reference       |
| iPhone 14           | 390         | 1.04    |                        |
| iPhone 14 Pro Max   | 430         | 1.15    |                        |
| iPad Mini           | 768         | 1.5     | Capped                 |
| iPad Pro            | 1024        | 1.5     | Capped                 |
| Desktop 1080p       | 1920        | 1.5     | Capped                 |
| Desktop 1440p       | 2560        | 1.5     | Capped                 |

**Usage pattern** (MANDATORY for every component):
```typescript
const s = uiScale;
const fontSize = Math.round(16 * s);
const padding = Math.round(12 * s);
const btnSize = Math.round(44 * s);
```

### 2.2 Breakpoints

| Breakpoint | Value            | Effect                                      |
|------------|------------------|----------------------------------------------|
| isMobile   | `width < 768`   | Smaller top bar, tighter padding             |
| isLandscape| `width > height` | Content area switches to landscape strategy  |
| showSidePanels | `width >= 900 && !isMobile` | PlayScreen shows score/moves panels |

### 2.3 Safe Areas

```
safeAreaTop    = max(CSS --safe-area-top, Capacitor nativePaddingTop)
safeAreaBottom = max(CSS --safe-area-bottom, Capacitor nativePaddingBottom)
```

Affects `topBarHeight` (adds safeAreaTop) and `actionBarY` (subtracts safeAreaBottom).

### 2.4 Canvas Setup

```
Canvas: 100vw x 100vh, position: fixed, inset: 0
Resolution: min(devicePixelRatio, 2)
autoDensity: true
antialias: true
Background: 0xD0EAF8 (light sky blue)
```

### 2.5 Content Width Strategy

All scrollable list pages share a common content width pattern:

```typescript
const contentPadding = Math.round(16 * s);
const contentMaxWidth = Math.round(720 * s);
const contentWidth = Math.min(screenWidth - contentPadding * 2, contentMaxWidth);
const contentX = Math.max(contentPadding, (screenWidth - contentWidth) / 2);
```

This ensures content is:
- Full-width on small phones (minus padding)
- Capped at 720px on tablets/desktop
- Horizontally centered when narrower than viewport

### 2.6 Background Rendering

Portrait texture (1080x1920) rendered with cover mode:

```
scale = max(screenWidth / texWidth, screenHeight / texHeight)
offsetX = (screenWidth - texWidth * scale) / 2
offsetY = (screenHeight - texHeight * scale) / 2
```

On landscape desktop (e.g. 1920x1080), the portrait texture is cropped heavily on top/bottom
to fill. This is acceptable for now -- the alternative would be landscape-specific backgrounds.

Fallback: 20-step vertical gradient from `#D0EAF8` to `#F5F0E0`.

---

## 3. Global Components

### 3.1 PageTopBar

Shared top bar used by all non-home pages.

```
+------------------------------------------------------------------+
| [<Home]  TITLE                                 [CubeBalance] [?] |
|          subtitle                                                |
+------------------------------------------------------------------+
```

**Props**: `title`, `subtitle?`, `screenWidth`, `topBarHeight`, `showCubeBalance?`, `cubeBalance?`, `actionIcon?`, `onAction?`

**Layout rules**:
```
height     = topBarHeight (from useFullscreenLayout, includes safeAreaTop)
bgColor    = 0x000000, alpha 1.0
borderBot  = 1px 0x334155, alpha 0.8

btnSize    = Math.round(clamp(topBarHeight - 12*s, 40*s, 48*s))
padding    = Math.round(12 * s)
centerY    = (topBarHeight - btnSize) / 2

homeBtn    = PixiButton icon-only "menu", x=padding, y=centerY
titleStyle = FONT_TITLE, Math.round(20 * s), fill 0xffffff
subStyle   = FONT_TITLE, Math.round(11 * s), fill 0x94a3b8
```

**TODO**: Currently `PageTopBar` does NOT receive `uiScale`. Must add it as prop and scale all internal values.

### 3.2 PixiButton

9-slice texture button with variants.

| Variant | Texture        | Usage                        |
|---------|---------------|------------------------------|
| orange  | btn-orange.png | Primary actions (Play, Claim)|
| green   | btn-green.png  | Confirm, Start Game          |
| purple  | btn-purple.png | Secondary, Cancel, Disabled  |
| red     | btn-red.png    | Surrender, Danger            |
| icon    | btn-icon.png   | Icon-only square buttons     |

**9-slice borders**: `{ left: 16, top: 16, right: 16, bottom: 16 }` (icon: 12px)
**Source size**: 96x96px
**Press animation**: scale 0.95

**TODO**: `PixiButton` has hardcoded `fontSize: 18`. Must accept scaled fontSize via `textStyle` prop or receive `uiScale`.

### 3.3 PixiPanel

9-slice texture panel for content sections.

**Variants**: panel-wood, panel-dark, panel-leaf, panel-glass (96x96px source)
**9-slice borders**: `{ left: 24, top: 24, right: 24, bottom: 24 }`

### 3.4 SpriteIcon

Renders PNG icon sprites from the catalog at a given size.

**Available icons** (48x48px source):
`star-filled`, `star-empty`, `crown`, `fire`, `scroll`, `shop`, `trophy`,
`menu`, `close`, `settings`, `lock`, `music`, `sound`, `cube`, `level`,
`moves`, `score`, `surrender`

**Usage**:
```typescript
<SpriteIcon icon="cube" size={Math.round(24 * s)} x={x} y={y} />
```

### 3.5 Toast Layer

Positioned at the top of the screen. Needs uiScale for font sizes and positioning.

### 3.6 Scroll Pattern

All scrollable pages share this momentum scroll implementation:

```
- pointerDown: start drag, record Y
- pointerMove: calculate dy, update scrollY, track velocity
- pointerUp: stop drag, apply momentum
- tick: decay velocity (0.92^frameScale), apply delta
- clamp: [0, maxScroll]
- virtual scroll: only render visible items (BUFFER = 3 items)
- scrollbar: 6px track on right side, thumb proportional to content
```

---

## 4. Page Specifications

### 4.1 Home Page

The landing page with logo, navigation buttons, and top bar.

```
+------------------------------------------------------------------+
| [CubeBalance]              [Tutor][Quest][Trophy][Set][Profile]  |  <- HomeTopBar
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                          +---------+                             |
|                          |  LOGO   |                             |  <- Bouncing animation
|                          +---------+                             |
|                                                                  |
|                    +--------------------+                        |
|                    |    PLAY GAME       |                        |  <- orange
|                    +--------------------+                        |
|                    +--------------------+                        |
|                    |    MY GAMES (2)    |                        |  <- purple
|                    +--------------------+                        |
|                    +--------------------+                        |
|                    |      SHOP          |                        |  <- green
|                    +--------------------+                        |
|                    +--------------------+                        |
|                    |   LEADERBOARD      |                        |  <- orange
|                    +--------------------+                        |
|                                                                  |
|                                                                  |
|              Built on Starknet with Dojo                         |  <- Footer
+------------------------------------------------------------------+
```

**Layout rules**:
```
background   = SkyBackground (theme texture or gradient)

-- HomeTopBar --
height       = topBarHeight
bgColor      = 0x000000
btnSize      = isMobile ? Math.round(44 * s) : Math.round(48 * s)
gap          = Math.round(8 * s)
pad          = Math.round(10 * s)
cubeIcon     = SpriteIcon "cube", Math.round(14 * s)  <-- currently emoji, must replace
cubeText     = FONT_TITLE, Math.round(14 * s), fill 0xfbbf24

-- Logo --
logoMaxH     = isMobile ? Math.round(80 * s) : Math.round(120 * s)
logoMaxW     = isMobile ? Math.round(220 * s) : Math.round(340 * s)
logoY        = topBarH + (isMobile ? Math.round(40*s) : Math.round(70*s)) + logoMaxH/2
animation    = sin(t*2) * Math.round(4*s) vertical bounce

-- Buttons --
btnW         = isMobile ? Math.round(220 * s) : Math.round(260 * s)
btnH         = isMobile ? Math.round(50 * s) : Math.round(56 * s)
btnGap       = Math.round(12 * s)
firstBtnY    = logoY + logoMaxH/2 + (isMobile ? Math.round(20*s) : Math.round(35*s))
fontSize     = isMobile ? Math.round(18 * s) : Math.round(20 * s)
             (PLAY GAME slightly larger: isMobile ? Math.round(20*s) : Math.round(24*s))

-- Footer --
text         = "Built on Starknet with Dojo"
style        = FONT_TITLE, Math.round(10 * s), fill 0xFFFFFF
y            = sh - Math.round(16 * s)
```

**Issues to fix**:
- `MAIN_FOOTER_STYLE` uses `FONT_BODY` -> change to `FONT_TITLE`
- Cube icon on HomeTopBar is emoji `🧊` -> replace with SpriteIcon

---

### 4.2 Play Screen

The core gameplay screen with HUD bars, grid, and action bar.

```
+------------------------------------------------------------------+
| [=] L5  120/200   8/20  x3                             12 CUBE  |  <- StatsBar
| [===progress========] [c1][c2]                        [***]     |  <- ProgressHudBar
+------------------------------------------------------------------+
|  +--optional--+  +--------------------------------+  +--optional--+
|  | Score      |  |                                |  | Moves      |
|  | Panel      |  |        8 x 10 GAME GRID       |  | Panel      |
|  | (desktop)  |  |                                |  | (desktop)  |
|  |            |  |     blocks, gravity, drag       |  |            |
|  +------------+  +--------------------------------+  +------------+
|                  |      NEXT LINE PREVIEW          |
|                  +--------------------------------+
+------------------------------------------------------------------+
| [Bonus1] [Bonus2] [Bonus3] | x3 combo | *** |  [Surrender]     |  <- ActionBar
+------------------------------------------------------------------+
```

**Layout source**: `useFullscreenLayout()` provides ALL positions.

**Key dimensions**:
```
-- Stats Bar (top) --
barH         = Math.round(32 * s)
barY         = Math.round(6 * s) + safeAreaTop
barX         = gridX - Math.round(8 * s)
barW         = gridWidth + Math.round(16 * s)
backBtn      = Math.round(28 * s) wide  <-- currently uses emoji "☰", replace with SpriteIcon
levelBadge   = circle, radius = (barH - 4) / 2, gold fill (0xB8860B)
scoreText    = FONT_TITLE, Math.round(13 * s)
movesText    = FONT_TITLE, Math.round(14 * s), red when danger

-- Progress Bar --
barH         = Math.round(26 * s)
progressH    = Math.round(8 * s) inner track
starSection  = Math.round(40 * s) right-aligned
stars        = SpriteIcon "star-filled"/"star-empty"  <-- currently emoji, must replace
constraints  = dots/circles drawn procedurally (keep as-is, legitimate)

-- Game Grid --
cellSize     = clamp(min(cellFromW, cellFromH), 28, 56)
gridW        = cellSize * 8
gridH        = cellSize * 10
gridX        = centered: (screenWidth - gridW) / 2
gridY        = hudTotalHeight + framePad

-- Next Line Preview --
height       = cellSize (one row)
y            = gridY + gridH + 4

-- Action Bar --
barH         = Math.round(64 * s)
barY         = screenHeight - barH - safeAreaBottom

-- Side Panels (desktop only, >= 900px) --
panelW       = Math.round(100 * s)
leftX        = gridX - panelW - padding
rightX       = gridX + gridW + padding
```

**Issues to fix**:
- `LOADING_SUB_STYLE` uses `FONT_BODY` -> FONT_TITLE
- `LOADING_TITLE_STYLE` has hardcoded `fontSize: 28` -> `Math.round(28 * s)`
- `BONUS_DESC_STYLE` has hardcoded `fontSize: 16` -> scale
- `STATUS_TEXT_STYLE` uses `FONT_BOLD` -> FONT_TITLE, hardcoded `fontSize: 13` -> scale
- StatsBar `labelStyle` uses `FONT_BODY` -> FONT_TITLE
- StatsBar `cubeStyle` uses `FONT_BODY` -> FONT_TITLE
- HudPillButton icon `☰` -> SpriteIcon "menu"
- Stars `⭐`/`☆` -> SpriteIcon "star-filled"/"star-empty"
- Cube display `🧊` -> SpriteIcon "cube"
- Status bubble `width: 180, height: 30` -> scale by `s`

---

### 4.3 Map Page

Super Mario World-style progression map with horizontal zone scrolling.

```
+------------------------------------------------------------------+
| [<Home]  ADVENTURE MAP                                           |  <- PageTopBar
|          Zone 1 of 5                                             |
+------------------------------------------------------------------+
|                                                                  |
|  +-zone-bg-1080x1920-portrait, cover-scaled-----------------+   |
|  |                                                           |   |
|  |    (o)----(o)----(o)----(o)                              |   |
|  |     L1     L2     L3     L4                              |   |
|  |                    \                                      |   |
|  |                     (o)----(o)                            |   |
|  |                      L5     L6                            |   |
|  |                              \                            |   |
|  |    +--LevelPreview---------+  (o)----(o)----(o)          |   |
|  |    | L3: Easy              |   L7     L8     L9          |   |
|  |    | Score: 45/60          |          |                   |   |
|  |    | *** (3 stars)         |         (o)----(BOSS)        |   |
|  |    | [PLAY]               |          L10                  |   |
|  |    +----------------------+                               |   |
|  |                                                           |   |
|  +-----------< swipe left/right to change zones >-----------+   |
|                                                                  |
|            [o]  [o]  [*]  [o]  [o]                              |  <- Zone dots
+------------------------------------------------------------------+
```

**Layout rules**:
```
zones        = 5 (levels 1-10 per zone)
zoneW        = screenWidth
zoneH        = screenHeight - headerH
headerH      = standalone ? 0 : topBarHeight
swipeThreshold = Math.round(50 * s)

-- Map Nodes --
nodeR        = Math.round(18 * s)
fontSize     = Math.round(11-18 * s) depending on type (level number, status)
cleared icon = SpriteIcon "star-filled"  <-- currently emoji "✓"
shop icon    = SpriteIcon "shop"          <-- currently emoji "🛒"
boss node    = larger radius, gold border

-- Level Preview (popup on node tap) --
previewW     = Math.round(220 * s)
previewH     = dynamic based on content
fontSize     = Math.round(11-18 * s)
stars        = SpriteIcon "star-filled"/"star-empty"  <-- currently "✓"/"✕"
skull icon   = SpriteIcon  <-- currently "💀"

-- Zone indicator dots --
dotR         = Math.round(6 * s)
dotGap       = Math.round(12 * s)
bottomPad    = Math.round(24 * s)

-- Back button text --
"← Back"    = SpriteIcon "menu" + "Back" text  <-- currently "←" emoji
```

**Issues to fix**:
- All fontSize values hardcoded -> multiply by `s`
- Emoji `✓`, `🛒`, `←`, `✕`, `💀` -> SpriteIcon
- `ZoneBackground` fontSize hardcoded -> scale
- Needs `uiScale` prop (currently not passed)

---

### 4.4 Settings Page (REFERENCE IMPLEMENTATION)

This page correctly implements `uiScale` throughout. Use as template for all others.

```
+------------------------------------------------------------------+
| [<Home]  SETTINGS                                                |
+------------------------------------------------------------------+
|                                                                  |
|  +--[AUDIO]----------------------------------------------+      |
|  | MUSIC                                       75%       |      |
|  | [============================--------] (o)            |      |
|  | SOUND EFFECTS                           100%          |      |
|  | [======================================] (o)          |      |
|  +-------------------------------------------------------+      |
|                                                                  |
|  +--[THEME]----------------------------------------------+      |
|  | [T1] [T2] [T3] [T4] [T5]                             |      |
|  | [T6] [T7] [T8] [T9] [T10]                            |      |
|  +-------------------------------------------------------+      |
|                                                                  |
|  +--[ACCOUNT]--------------------------------------------+      |
|  | USERNAME                              player123       |      |
|  | WALLET                           0x1234...abcd        |      |
|  +-------------------------------------------------------+      |
|                                                                  |
|                    zKube v1.2.0                                  |
|              Built on Starknet with Dojo                         |
+------------------------------------------------------------------+
```

**How it scales** (the correct pattern):
```typescript
const s = uiScale;
const contentPadding = Math.round(20 * s);
const contentTop = topBarHeight + Math.round(12 * s);
const contentWidth = screenWidth - contentPadding * 2;

// Section panel
const radius = Math.round(12 * s);
const padX = Math.round(16 * s);
const titleY = Math.round(12 * s);
const titleStyle = { fontFamily: FONT_TITLE, fontSize: Math.round(16 * s), fill: 0xffffff };

// Slider
const rowH = Math.round(60 * s);
const trackH = Math.round(8 * s);
const knobR = Math.round(12 * s);

// Theme grid
const gap = Math.round(8 * s);
const optionH = Math.round(56 * s);
```

**Status**: DONE. No changes needed (except PageTopBar receiving uiScale).

---

### 4.5 Leaderboard Page

Scrollable ranking list with medal rows for top 3.

```
+------------------------------------------------------------------+
| [<Home]  LEADERBOARD                                      [Ref] |
|          42 PLAYERS                                              |
+------------------------------------------------------------------+
| #     PLAYER               LVL        SCORE                     |  <- Header
+------------------------------------------------------------------+
| +--[ROW]--gold-border--------------------------------------------+
| | [medal]  PlayerOne        Lv 32              4,820             |  <- Top 1
| +----------------------------------------------------------------+
| +--[ROW]--silver-border------------------------------------------+
| | [medal]  PlayerTwo        Lv 28              3,650             |  <- Top 2
| +----------------------------------------------------------------+
| +--[ROW]--bronze-border------------------------------------------+
| | [medal]  PlayerThree      Lv 25              2,980             |  <- Top 3
| +----------------------------------------------------------------+
| +--[ROW]--normal----------------------------------------------+  |
| | #4       SomePlayer       Lv 18              1,520           |  |
| +--------------------------------------------------------------+  |
| +--[ROW]--normal----------------------------------------------+  |
| | #5       AnotherOne       Lv 15              1,200           |  |
| +--------------------------------------------------------------+  |
|                           (scroll)                               |
+------------------------------------------------------------------+
```

**Layout rules**:
```
contentPadding = Math.round(16 * s)
headerH      = Math.round(40 * s)
rowH         = Math.round(64 * s)
rowGap       = Math.round(10 * s)
contentMaxW  = Math.round(720 * s)

-- Row --
badgeSize    = Math.round(40 * s)
badgeX       = Math.round(8 * s)
badgeRadius  = Math.round(8 * s)
medal top 3  = SpriteIcon "crown"/"star-filled"  <-- currently emoji 🥇🥈🥉
rankStyle    = FONT_TITLE, Math.round(16 * s), fill 0x94a3b8
nameStyle    = FONT_TITLE, Math.round(16 * s), fill 0xffffff
statusStyle  = FONT_TITLE, Math.round(11 * s)
scoreStyle   = FONT_TITLE, Math.round(20 * s)
levelStyle   = FONT_TITLE, Math.round(14 * s), fill 0x60a5fa

-- Status icons --
"✓ Completed" = SpriteIcon "star-filled" + text  <-- currently emoji
"▶ In Progress" = procedural triangle or SpriteIcon  <-- currently emoji

-- Header --
headerBg     = 0x0f172a, alpha 0.9, rounded 10
labels       = FONT_TITLE, Math.round(11 * s), fill 0x94a3b8
```

**Issues to fix**:
- 6 text styles use `FONT_BODY` -> FONT_TITLE
- All fontSize values hardcoded -> multiply by `s`
- Emoji `🥇🥈🥉`, `✓`, `▶` -> SpriteIcon or procedural
- Row dimensions hardcoded -> scale
- Needs `uiScale` prop

---

### 4.6 Shop Page

2-column card grid with bonus upgrade cards and bridging card.

```
+------------------------------------------------------------------+
| [<Home]  SHOP                                      [123 CUBE]   |
+------------------------------------------------------------------+
|                                                                  |
|  +--[Combo]-----------+  +--[Score]-----------+                 |
|  | [icon] Combo       |  | [icon] Score       |                 |
|  | STARTING  [===] UP |  | STARTING  [===] UP |                 |
|  | BAG       [=--] UP |  | BAG       [=--] UP |                 |
|  +--------------------+  +--------------------+                 |
|                                                                  |
|  +--[Harvest]---------+  +--[Wave]--locked-----+                |
|  | [icon] Harvest     |  | [icon] Wave    [L]  |                |
|  | STARTING  [===] UP |  |                     |                |
|  | BAG       [=--] UP |  |    [UNLOCK 200]     |                |
|  +--------------------+  +--------------------+                 |
|                                                                  |
|  +--[Supply]--locked---+  +--[Bridging]--------+                |
|  | [icon] Supply  [L]  |  | [icon] Bridging    |                |
|  |                     |  | Rank 2             |                |
|  |    [UNLOCK 200]     |  | Max 10 cubes/run   |                |
|  +--------------------+  | [===]        [UP]   |                |
|                          +--------------------+                 |
+------------------------------------------------------------------+
```

**Layout rules**:
```
pad          = Math.round(16 * s)
gap          = Math.round(12 * s)
cardW        = (contentWidth - gap) / 2
cardH        = Math.round(148 * s)
cardRadius   = Math.round(10 * s)
cardPad      = Math.round(14 * s)
btnW         = Math.round(62 * s)
btnH         = Math.round(36 * s)

-- Card Header --
iconSize     = Math.round(22 * s)  <-- currently emoji, replace with bonus sprites
nameStyle    = FONT_TITLE, Math.round(15 * s)
lockIcon     = SpriteIcon "lock"  <-- currently emoji "🔒"

-- Level Pips --
pipW         = Math.round(18 * s)
pipH         = Math.round(6 * s)
pipGap       = Math.round(5 * s)

-- Labels --
labelStyle   = FONT_TITLE, Math.round(11 * s)
cubesStyle   = FONT_TITLE, Math.round(13 * s), fill 0xfbbf24
rankStyle    = FONT_TITLE, Math.round(12 * s)
```

**Issues to fix**:
- 10+ text styles use `FONT_BODY` -> FONT_TITLE
- Card icons are emoji (`🔥⭐🌾🌊📦🌉🛒🔒`) -> SpriteIcon/bonus sprites
- All dimensions hardcoded -> multiply by `s`
- Needs `uiScale` prop
- `CARD_RADIUS`, `CARD_PAD`, `BTN_W`, `BTN_H` are module-level constants -> compute from `s`

---

### 4.7 Quests Page

Daily quest families with tiered progress and claim buttons.

```
+------------------------------------------------------------------+
| [<Home]  DAILY QUESTS                              [45 CUBE]    |
|          12 CUBE ready!                                          |
+------------------------------------------------------------------+
|                    RESETS IN 05:32:18                            |
+------------------------------------------------------------------+
|  +--[Player]------green-border-(claimable)------------------+   |
|  | [icon]  Player Quests                            2/3     |   |
|  |   [v]  T1: Warm-Up (play 1 game)              +3 CUBE   |   |
|  |   [v]  T2: Getting Started (play 3)            +6 CUBE   |   |
|  |   [ ]  T3: Dedicated (play 5)                 +12 CUBE   |   |
|  |   [====progress==========----]  3/5                      |   |
|  |   [      CLAIM T2 (+6 CUBE)      ]                      |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +--[Clearer]-----------------------------------------------+   |
|  | [icon]  Clearer                                  1/3     |   |
|  |   [v]  T1: Line Breaker (10 lines)             +3 CUBE   |   |
|  |   [ ]  T2: Line Crusher (30 lines)             +6 CUBE   |   |
|  |   [L]  T3: Line Master (50 lines)             +12 CUBE   |   |
|  |   [=======progress======---------]  18/30                |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  (more families...)                                              |
+------------------------------------------------------------------+
```

**Layout rules**:
```
timerH       = Math.round(32 * s)
cardGap      = Math.round(14 * s)
cardPad      = Math.round(14 * s)

-- Family Card --
headerH      = Math.round(44 * s)
tierRowH     = Math.round(28 * s)
progressBarH = Math.round(10 * s)
claimBtnH    = Math.round(48 * s)

-- Family Header --
familyIcon   = SpriteIcon from bonus/catalog  <-- currently emoji 🎮📊⚡🏆
familyName   = FONT_TITLE, Math.round(16 * s), fill 0xffffff
progressText = FONT_TITLE, Math.round(12 * s)

-- Tier Row --
tierIcon     = SpriteIcon  <-- currently emoji ⚪✅🔒
tierName     = FONT_TITLE, Math.round(12 * s)
tierReward   = FONT_TITLE, Math.round(12 * s), fill gold/muted

-- Timer --
timerStyle   = FONT_TITLE, Math.round(12 * s), fill 0x64748b
```

**Issues to fix**:
- 8 text styles use `FONT_BODY` -> FONT_TITLE
- Family icons `🎮📊⚡🏆` -> need new icon sprites or use existing catalog
- Tier state icons `⚪✅🔒` -> SpriteIcon
- All dimensions hardcoded -> multiply by `s`
- Needs `uiScale` prop

---

### 4.8 My Games Page

List of active and completed games with resume action.

```
+------------------------------------------------------------------+
| [<Home]  MY GAMES                                                |
+------------------------------------------------------------------+
|                                                                  |
|  ONGOING                                                        |
|  +--[GameRow]--blue-bg--------------------------------------+   |
|  | Game #42    Lv 12    Score: 450    Cubes: 15     [PLAY>] |   |
|  +----------------------------------------------------------+   |
|  +--[GameRow]--blue-bg--------------------------------------+   |
|  | Game #38    Lv 8     Score: 280    Cubes: 8      [PLAY>] |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  FINISHED                                                        |
|  +--[GameRow]--gray-bg--------------------------------------+   |
|  | Game #35    Lv 23    Score: 1,200  Cubes: 45     [VIEW>] |   |
|  +----------------------------------------------------------+   |
|  +--[GameRow]--gray-bg--------------------------------------+   |
|  | Game #31    Lv 5     Score: 120    Cubes: 3      [VIEW>] |   |
|  +----------------------------------------------------------+   |
|                                                                  |
+------------------------------------------------------------------+
```

**Layout rules**:
```
sectionGap   = Math.round(16 * s)
rowH         = Math.round(44 * s)
rowGap       = Math.round(6 * s)
rowRadius    = Math.round(8 * s)

-- Section Title --
titleStyle   = FONT_TITLE, Math.round(16 * s), fill 0xffffff

-- Game Row --
bgActive     = 0x3b82f6, alpha 0.9
bgFinished   = 0x475569, alpha 0.9
nameStyle    = FONT_TITLE, Math.round(13 * s), fill 0xffffff
detailStyle  = FONT_TITLE, Math.round(13 * s), fill 0x94a3b8
cubeIcon     = SpriteIcon "cube"  <-- currently emoji "🧊"
checkIcon    = SpriteIcon "star-filled"  <-- currently emoji "✓"
arrowBtn     = PixiButton icon-only
```

**Issues to fix**:
- 5 text styles use `FONT_BODY` -> FONT_TITLE
- Emoji `🧊`, `✓` -> SpriteIcon
- All dimensions hardcoded -> multiply by `s`
- Needs `uiScale` prop

---

### 4.9 Loadout Page

Bonus selection grid with cube bridging slider.

```
+------------------------------------------------------------------+
| [<Home]  SELECT LOADOUT                            [45 CUBE]    |
|          CHOOSE 3 BONUSES FOR YOUR RUN                           |
+------------------------------------------------------------------+
|                                                                  |
|                          BONUSES                                 |
|                                                                  |
|  +-------+  +-------+  +-------+  +-------+  +-------+         |
|  | Combo |  | Score |  |Harvest|  | Wave  |  |Supply |         |
|  | [img] |  | [img] |  | [img] |  | [img] |  | [img] |         |
|  |  SEL  |  |  SEL  |  |  SEL  |  | LOCK  |  | LOCK  |         |
|  +-------+  +-------+  +-------+  +-------+  +-------+         |
|                                                                  |
|                    BRING CUBES (MAX 10)                          |
|  [==============(o)---------------------]  5                    |
|                                                                  |
|  +----------------------------------------------------+         |
|  |              START GAME                             |         |  <- green
|  +----------------------------------------------------+         |
|  +----------------------------------------------------+         |
|  |                CANCEL                               |         |  <- purple
|  +----------------------------------------------------+         |
|                                                                  |
+------------------------------------------------------------------+
```

**Layout rules**:
```
contentPadding = Math.round(24 * s)
contentTop   = topBarHeight + Math.round(40 * s)
tileSize     = Math.min(Math.round(80 * s), (contentWidth - 4 * Math.round(16*s)) / 5)
tileGap      = Math.round(16 * s)
tileRadius   = Math.round(14 * s)

-- Bonus Tile --
iconSize     = tileSize * 0.55  (uses bonus PNG textures)
nameStyle    = FONT_TITLE, Math.round(12 * s)  <-- currently FONT_BODY
lockIcon     = SpriteIcon "lock"  <-- currently emoji "🔒"

-- Cube Slider --
trackH       = Math.round(10 * s)
knobR        = Math.round(16 * s)
valueStyle   = FONT_TITLE, Math.round(18 * s)

-- Section Title --
bonusTitle   = FONT_TITLE, Math.round(20 * s)
cubeTitle    = FONT_TITLE, Math.round(18 * s)

-- Buttons --
startBtnH    = Math.round(56 * s)
cancelBtnH   = Math.round(48 * s)
startFont    = Math.round(18 * s)
cancelFont   = Math.round(16 * s)
```

**Issues to fix**:
- `LOCK_ICON_STYLE` hardcoded `fontSize: 24` -> scale
- `bonusLabelStyle` uses `FONT_BODY` -> FONT_TITLE
- Emoji `🔒` -> SpriteIcon "lock"
- Still references `.svg` paths for Wave/Supply textures -> should be `.png`
- Dimensions hardcoded -> multiply by `s`
- Needs `uiScale` prop

---

### 4.10 Tutorial Page

Scrollable step cards explaining game mechanics.

```
+------------------------------------------------------------------+
| [<Home]  HOW TO PLAY                                             |
+------------------------------------------------------------------+
|                                                                  |
|  +--[Step 1]------------------------------------------------+  |
|  | MOVE BLOCKS                                                |  |
|  | Swipe blocks left/right to form lines                     |  |
|  |                                                            |  |
|  | [icon] Slide blocks horizontally                          |  |
|  | [icon] Fill complete rows to clear them                   |  |
|  | [icon] Gravity pulls blocks down                          |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +--[Step 2]------------------------------------------------+  |
|  | USE BONUSES                                                |  |
|  | Tap bonus buttons during gameplay                         |  |
|  |                                                            |  |
|  | [icon] Combo: adds to your combo counter                  |  |
|  | [icon] Score: instant bonus points                        |  |
|  | [icon] Harvest: destroy blocks, earn cubes                |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  (more steps...)                                                 |
+------------------------------------------------------------------+
```

**Layout rules**:
```
contentPadding = Math.round(16 * s)
cardGap      = Math.round(12 * s)

-- Step Card --
cardPadding  = Math.round(14 * s)
headerH      = Math.round(50 * s)
descH        = Math.round(32 * s)
itemH        = Math.round(28 * s)
headerStyle  = FONT_TITLE, Math.round(16 * s), fill 0xffffff
descStyle    = FONT_TITLE, Math.round(11 * s), fill 0x94a3b8
itemStyle    = FONT_TITLE, Math.round(12 * s)

-- Item icons (currently emoji) --
All emoji icons -> SpriteIcon from catalog
  👆 -> icon-moves (swipe gesture)
  ✨⚡ -> icon-star-filled / icon-fire
  🔨🌊 -> bonus sprites (harvest, wave)
  🧊 -> icon-cube
  🛒 -> icon-shop
  👑 -> icon-crown
  etc.
```

**Issues to fix**:
- 16+ emoji characters -> SpriteIcon (biggest emoji consumer)
- All fontSize values hardcoded -> multiply by `s`
- Needs `uiScale` prop
- May need new "gesture" icon sprite for swipe instruction

---

## 5. Modal Specifications

All modals share `PixiModal` base component. Currently all modals have hardcoded dimensions.

### 5.1 PixiModal (Base)

```
+------------------------------------------------------------------+
|                                                                  |
|         +------semi-transparent-backdrop---------+               |
|         |                                        |               |
|         |  MODAL TITLE                     [X]  |               |
|         |                                        |               |
|         |  (modal-specific content)              |               |
|         |                                        |               |
|         |          [ACTION]    [CANCEL]          |               |
|         +----------------------------------------+               |
|                                                                  |
+------------------------------------------------------------------+
```

**Layout rules**:
```
backdrop     = fullscreen 0x000000, alpha 0.6
modalW       = Math.round(min(screenWidth * 0.85, 400) * s)
modalH       = dynamic per modal
modalX       = (screenWidth - modalW) / 2
modalY       = (screenHeight - modalH) / 2
radius       = Math.round(16 * s)
bgColor      = 0x1e293b
border       = 0x475569, width 1

titleStyle   = FONT_TITLE, Math.round(22 * s), fill 0xffffff
closeBtnSize = Math.round(36 * s)
closeBtnIcon = SpriteIcon "close"
```

**Issues to fix (PixiModal base)**:
- `fontSize={22}` -> `Math.round(22 * s)`
- `width={36} height={36}` -> `Math.round(36 * s)`
- All y offsets hardcoded -> scale
- Must accept and propagate `uiScale`

### 5.2 Modal-Specific Content

| Modal            | Key Content                                 | Special Needs                     |
|------------------|---------------------------------------------|-----------------------------------|
| GameOverModal    | Level reached, total score, cubes, max combo| Skull icon (currently emoji)      |
| VictoryModal     | Total score, cubes, max combo, share btn    | Trophy icon, confetti?            |
| LevelCompleteModal| Stars, score, bonus awarded, cubes earned  | Star sprites, bonus icon          |
| MenuModal        | Resume, Surrender, Go Home buttons          | Straightforward                   |
| InGameShopModal  | Buy charges, allocate, level up, swap       | Complex card layout, cube icon    |

All modals need `uiScale` prop and must scale all internal dimensions.

---

## 6. Asset Requirements

### 6.1 Current Asset Inventory

| Category     | Count | Source Size    | Render Size (mobile) | Render Size (desktop) |
|-------------|-------|---------------|----------------------|-----------------------|
| Buttons     | 5     | 96x96         | 40-56px (9-slice)    | 48-90px (9-slice)     |
| Icons       | 18    | 48x48         | 20-28px              | 24-48px               |
| Panels      | 4     | 96x96         | varies (9-slice)     | varies (9-slice)      |
| Bonus Icons | 5     | 256x256       | 44-64px              | 44-96px               |
| UI Chrome   | 3     | 360x40-64     | stretched to bar     | stretched to bar      |
| Particles   | 4     | 16x16         | 8-16px               | 8-16px                |
| Blocks      | 4/theme| 256-1024 wide | 28-56px per cell     | 28-56px per cell      |
| Grid BG     | 1/theme| 512x640      | gridW x gridH        | gridW x gridH         |
| Grid Frame  | 1/theme| 576x720      | gridW+pad x gridH+pad| gridW+pad x gridH+pad |
| Background  | 1/theme| 1080x1920    | cover fill           | cover fill            |
| Logo        | 1/theme| 512x512      | 180-280px            | 340-510px             |
| Map         | 1/theme| 1080x1920    | cover fill           | cover fill            |
| Theme Icon  | 1/theme| 128x128      | ~40-56px             | ~56-84px              |

### 6.2 Asset Sizing Adequacy

**Sufficient for all screen sizes** (downscaled from large source):
- Bonus icons (256px source, rendered at max ~96px)
- Blocks (256px per cell, rendered at max 56px)
- Grid BG/Frame (512-576px, rendered at max ~450px)
- Backgrounds (1080px wide, always downscaled)
- Logos (512px, rendered at max ~510px -- borderline, OK with bilinear)

**Sufficient but tight**:
- Buttons (96px source, rendered at max 90px) -- 9-slice handles this gracefully
- Panels (96px source) -- 9-slice handles this
- Theme icons (128px source, rendered at max ~84px)

**Adequate for current usage**:
- Icons (48px source, rendered at max ~48px) -- at DPR 2, this means 96 physical pixels
  At `resolution: min(dpr, 2)` this is exactly enough. No upscaling ever needed.

### 6.3 Missing Assets (New Sprites Needed)

These are currently emoji and need PNG sprite equivalents:

| Needed Icon  | Used Where                    | Suggested Name    | Size    |
|-------------|-------------------------------|-------------------|---------|
| Medal Gold  | Leaderboard #1                | icon-medal-gold   | 48x48   |
| Medal Silver| Leaderboard #2                | icon-medal-silver | 48x48   |
| Medal Bronze| Leaderboard #3                | icon-medal-bronze | 48x48   |
| Checkmark   | Completed states              | icon-check        | 48x48   |
| Play Arrow  | In-progress indicator         | icon-play         | 48x48   |
| Game Pad    | Quest family: Player          | icon-gamepad      | 48x48   |
| Chart       | Quest family: Clearer         | icon-chart        | 48x48   |
| Lightning   | Quest family: Combo           | icon-lightning    | 48x48   |
| Bridge      | Bridging card icon            | icon-bridge       | 48x48   |
| Package     | Supply bonus card icon        | icon-package      | 48x48   |
| Wheat       | Harvest bonus card icon       | icon-wheat        | 48x48   |
| Skull       | Death/game over               | icon-skull        | 48x48   |
| Refresh     | Reload/retry actions          | icon-refresh      | 48x48   |
| Menu Burger | Home/back button (☰)          | icon-hamburger    | 48x48   |
| Arrow Left  | Back navigation               | icon-arrow-left   | 48x48   |
| Gesture     | Swipe/drag tutorial           | icon-gesture      | 48x48   |
| Cart        | Shop related                  | icon-cart         | 48x48   |

Total: **17 new icon sprites** (48x48px, same pipeline as existing icons).

---

## 7. Migration Checklist

### 7.1 Phase 1: Generate Missing Assets

Generate the 17 new icon sprites listed in Section 6.3 using the existing `scripts/generate-assets.ts` pipeline.

### 7.2 Phase 2: Add uiScale to All Components

Every component must receive `uiScale` (either via prop or via `useFullscreenLayout()`).

**PageTopBar** (used by 8 pages):
- Add `uiScale` prop
- Scale `btnSize`, `padding`, `fontSize` by `s`
- Replace `actionIcon` emoji with SpriteIcon

**PixiButton**:
- Already accepts `textStyle` for fontSize override
- Default fontSize should still scale: `Math.round(18 * s)` when no textStyle provided

**PixiModal**:
- Add `uiScale` prop, propagate to all children
- Scale all internal dimensions

**MainScreen PageRenderer**:
- Pass `uiScale` to ALL pages (currently only Settings and PlayScreen get it)

### 7.3 Phase 3: Replace Hardcoded Values (Per Page)

Each page needs the same transformation. Reference: SettingsPage.tsx.

| Page            | File                        | Hardcoded Count | Emoji Count | Font Fix |
|-----------------|-----------------------------|-----------------|-------------|----------|
| LeaderboardPage | pages/LeaderboardPage.tsx   | ~15             | 5           | 4 FONT_BODY |
| ShopPage        | pages/ShopPage.tsx          | ~20             | 8           | 4 FONT_BODY |
| QuestsPage      | pages/QuestsPage.tsx        | ~18             | 5           | 4 FONT_BODY |
| MyGamesPage     | pages/MyGamesPage.tsx       | ~12             | 2           | 4 FONT_BODY |
| LoadoutPage     | pages/LoadoutPage.tsx       | ~15             | 1           | 1 FONT_BODY |
| TutorialPage    | pages/TutorialPage.tsx      | ~14             | 16+         | 0        |
| MapPage         | map/MapPage.tsx             | ~10             | 1           | 0        |
| MapNode         | map/MapNode.tsx             | ~8              | 2           | 0        |
| LevelPreview    | map/LevelPreview.tsx        | ~12             | 3           | 0        |
| ZoneBackground  | map/ZoneBackground.tsx      | ~3              | 0           | 0        |
| PageTopBar      | pages/PageTopBar.tsx        | ~8              | 0           | 0        |
| MainScreen      | pages/MainScreen.tsx        | ~6              | 1           | 1 FONT_BODY |
| PlayScreen      | pages/PlayScreen.tsx        | ~8              | 3           | 3 FONT_BODY |
| **Modals**      |                             |                 |             |          |
| PixiModal       | ui/PixiModal.tsx            | ~10             | 0           | 0        |
| GameOverModal   | modals/GameOverModal.tsx    | ~8              | 0           | 0        |
| VictoryModal    | modals/VictoryModal.tsx     | ~12             | 0           | 0        |
| LevelCompleteModal| modals/LevelCompleteModal.tsx| ~14           | 0           | 0        |
| MenuModal       | modals/MenuModal.tsx        | ~10             | 0           | 0        |
| InGameShopModal | modals/InGameShopModal.tsx  | ~12             | 2           | 4 FONT_BODY |
| **HUD/ActionBar**|                            |                 |             |          |
| HUDBar          | hud/HUDBar.tsx              | ~3              | 0           | 0        |
| ConstraintIndicator| hud/ConstraintIndicator.tsx| ~2           | 0           | 0        |
| ProgressBar     | hud/ProgressBar.tsx         | ~2              | 0           | 0        |
| LevelBadge      | hud/LevelBadge.tsx          | ~3              | 0           | 0        |
| MovesCounter    | hud/MovesCounter.tsx        | ~3              | 0           | 0        |
| ActionBar       | actionbar/ActionBar.tsx     | ~2              | 0           | 0        |
| BonusButton     | actionbar/BonusButton.tsx   | ~2              | 0           | 0        |
| ComboDisplay    | actionbar/ComboDisplay.tsx  | ~3              | 0           | 0        |
| NextLinePreview | game/NextLinePreview.tsx    | ~2              | 0           | 0        |
| **UI Components**|                            |                 |             |          |
| PixiButton      | ui/PixiButton.tsx           | ~2              | 0           | 0        |
| PixiPanel       | ui/PixiPanel.tsx            | ~2              | 0           | 0        |
| PixiComponents  | ui/PixiComponents.tsx       | ~6              | 0           | 0        |
| NavButton       | topbar/NavButton.tsx        | ~2              | 0           | 0        |
| PixiToastLayer  | ui/PixiToastLayer.tsx       | ~4              | 0           | 0        |

**Total**: ~30 files, ~200+ hardcoded values, ~50 emoji, ~20 FONT_BODY

### 7.4 Phase 4: Verify

After all changes:
1. `cd mobile-app && pnpm build` -- must pass
2. Visual test at 375px (iPhone SE)
3. Visual test at 430px (iPhone 14 Pro Max)
4. Visual test at 768px (iPad Mini portrait)
5. Visual test at 1920x1080 (desktop landscape)
6. Visual test at 1080x1920 (desktop portrait)

### 7.5 Execution Priority

**Batch 1 — Infrastructure** (do first, unlocks everything):
1. Generate 17 new icon sprites
2. Add `uiScale` prop to `PageTopBar`
3. Add `uiScale` prop to `PixiModal`
4. Pass `uiScale` from `MainScreen` PageRenderer to ALL pages
5. Add icons to `catalog.ts` and `resolver.ts`

**Batch 2 — Pages** (parallelize, each page is independent):
- LeaderboardPage + ShopPage + QuestsPage (most complex)
- MyGamesPage + LoadoutPage + TutorialPage (medium)
- MapPage + MapNode + LevelPreview + ZoneBackground (map cluster)

**Batch 3 — Modals + HUD** (parallelize):
- PixiModal base + all 5 modals
- HUD components (ConstraintIndicator, ProgressBar, LevelBadge, MovesCounter)
- ActionBar components (BonusButton, ComboDisplay)

**Batch 4 — Remaining UI + MainScreen/PlayScreen fixes**:
- PixiButton, PixiPanel, PixiComponents, NavButton, PixiToastLayer
- MainScreen (footer style, emoji)
- PlayScreen (loading styles, status bubble, star/cube emoji)

---

## Appendix A: Legitimate Procedural Drawing (DO NOT Replace)

These use `PixiGraphics.draw()` and should remain procedural:

| Component            | What It Draws                       | Why Procedural |
|----------------------|------------------------------------|----------------|
| ProgressBar          | Track + fill bar                    | Dynamic width  |
| LevelPips            | Upgrade level dots                  | Dynamic count  |
| VolumeSlider         | Track + fill + knob                 | Drag state     |
| CubeSlider           | Track + fill + knob                 | Drag state     |
| ParticleSystem       | Particle effects                    | Animated       |
| ScorePopup           | Floating score text                 | Animated       |
| ScreenShake          | Container transform                 | Animated       |
| Modal backdrop       | Semi-transparent overlay            | Simple fill    |
| Card backgrounds     | Rounded rect with border            | Dynamic state  |
| Row backgrounds      | Rounded rect with conditional color | Dynamic state  |
| Scroll hit areas     | Invisible touch targets             | Required       |
| Scrollbar thumb      | Position tracks scroll              | Dynamic        |
| Grid highlights      | Selection indicators                | Dynamic        |
| Danger border        | Red screen flash                    | Dynamic        |
| Vignette overlay     | Edge darkening gradient             | Decorative     |
| Constraint dots      | Progress dots in HUD                | Dynamic state  |
| Map paths/connections| Lines between map nodes             | Generated      |

---

## Appendix B: Complete Emoji-to-Sprite Mapping

| Current Emoji | Location(s)                              | Replacement               |
|--------------|------------------------------------------|---------------------------|
| `🧊`         | HomeTopBar, MyGames, PlayScreen, InGameShop, Shop | SpriteIcon "cube"  |
| `🥇`         | LeaderboardPage rank 1                   | SpriteIcon "medal-gold"   |
| `🥈`         | LeaderboardPage rank 2                   | SpriteIcon "medal-silver" |
| `🥉`         | LeaderboardPage rank 3                   | SpriteIcon "medal-bronze" |
| `✓`/`✅`     | Leaderboard, MyGames, MapNode, Quests    | SpriteIcon "check"        |
| `▶`          | LeaderboardPage in-progress              | SpriteIcon "play"         |
| `🔒`         | ShopPage, LoadoutPage, QuestsPage        | SpriteIcon "lock"         |
| `🔥`         | ShopPage Combo card                      | Bonus sprite "combo"      |
| `⭐`         | ShopPage Score card, PlayScreen stars    | SpriteIcon "star-filled"  |
| `☆`          | PlayScreen empty stars                   | SpriteIcon "star-empty"   |
| `🌾`         | ShopPage Harvest card                    | Bonus sprite "harvest"    |
| `🌊`         | ShopPage Wave card                       | Bonus sprite "wave"       |
| `📦`         | ShopPage Supply card                     | SpriteIcon "package"      |
| `🌉`         | ShopPage Bridging card                   | SpriteIcon "bridge"       |
| `🛒`         | ShopPage empty, MapNode shop             | SpriteIcon "cart"         |
| `🎮`         | QuestsPage Player family                 | SpriteIcon "gamepad"      |
| `📊`         | QuestsPage Clearer family                | SpriteIcon "chart"        |
| `⚡`         | QuestsPage Combo family                  | SpriteIcon "lightning"    |
| `🏆`         | QuestsPage Finisher family               | SpriteIcon "trophy"       |
| `💀`         | LevelPreview death                       | SpriteIcon "skull"        |
| `✕`          | LevelPreview close                       | SpriteIcon "close"        |
| `←`          | MapPage back button                      | SpriteIcon "arrow-left"   |
| `☰`          | PlayScreen menu button                   | SpriteIcon "hamburger"    |
| `🔄`         | LeaderboardPage refresh, TutorialPage    | SpriteIcon "refresh"      |
| `👆`         | TutorialPage swipe instruction           | SpriteIcon "gesture"      |
| `👑`         | TutorialPage crown                       | SpriteIcon "crown"        |
| `⚪`         | QuestsPage pending tier                  | Procedural circle (keep)  |

---

## Appendix C: Font Migration

Replace ALL `FONT_BODY` with `FONT_TITLE` in these files:

| File                           | Line(s) | Context                    |
|-------------------------------|---------|----------------------------|
| MainScreen.tsx                | 40      | MAIN_FOOTER_STYLE          |
| MainScreen.tsx                | 222     | usernameStyle              |
| PlayScreen.tsx                | 37      | LOADING_SUB_STYLE          |
| PlayScreen.tsx                | 180-183 | StatsBar labelStyle        |
| PlayScreen.tsx                | 200-203 | StatsBar cubeStyle         |
| LeaderboardPage.tsx           | 14      | RANK_NUM_STYLE             |
| LeaderboardPage.tsx           | 16      | LEVEL_BADGE_STYLE          |
| LeaderboardPage.tsx           | 17      | HEADER_LABEL_STYLE         |
| LeaderboardPage.tsx           | 43      | statusStyle                |
| ShopPage.tsx                  | 66      | STYLE_LABEL                |
| ShopPage.tsx                  | 69      | STYLE_RANK                 |
| ShopPage.tsx                  | 73      | STYLE_EMPTY_SUB            |
| QuestsPage.tsx                | 26      | TIMER_STYLE                |
| QuestsPage.tsx                | 27      | PROGRESS_TEXT_STYLE         |
| QuestsPage.tsx                | 33      | EMPTY_SUB_STYLE            |
| QuestsPage.tsx                | 173     | tierNameStyle              |
| QuestsPage.tsx                | 263     | familyProgressStyle        |
| MyGamesPage.tsx               | 12, 14, 19 | row text styles         |
| LoadoutPage.tsx               | 191     | bonusLabelStyle            |
| InGameShopModal.tsx           | 73, 81, 89, 97 | card label styles  |
