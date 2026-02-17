# zKube — UI/UX Specification v2

Complete UI/UX redesign. Every screen, interaction, and data binding derived from smart contract mechanics. Mobile-first, PixiJS-optimized, blockchain-invisible.

**Engine**: PixiJS 8 + @pixi/react (declarative). All rendering via `pixiContainer`, `pixiSprite`, `pixiGraphics`, `pixiText`.
**Target**: 375px portrait (iPhone SE baseline). Responsive via `uiScale = clamp(screenWidth / 375, 0.8, 1.5)`.
**Style**: Illustrated, bold outlines, theme-driven palettes. 10 visual themes — each run randomly picks 5 to form the campaign zones.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [User Stories](#2-user-stories)
3. [Navigation Architecture](#3-navigation-architecture)
4. [Design System](#4-design-system)
5. [Screen Specifications](#5-screen-specifications)
   - [5.1 Home Hub](#51-home-hub)
   - [5.2 Loadout Screen](#52-loadout-screen)
   - [5.3 Campaign Map](#53-campaign-map)
   - [5.4 Play Screen](#54-play-screen)
   - [5.5 Boss Level](#55-boss-level)
   - [5.6 In-Game Shop](#56-in-game-shop)
   - [5.7 Level Complete](#57-level-complete)
   - [5.8 Boss Level-Up Selection](#58-boss-level-up-selection)
   - [5.9 Run Complete / Game Over](#59-run-complete--game-over)
   - [5.10 Daily Challenge](#510-daily-challenge-future)
   - [5.11 Permanent Shop](#511-permanent-shop)
   - [5.12 Quest Screen](#512-quest-screen)
   - [5.13 Profile & Achievements](#513-profile--achievements)
   - [5.14 Onboarding](#514-onboarding)
6. [Modal Specifications](#6-modal-specifications)
7. [Animation & Effects](#7-animation--effects)
8. [Responsive Behavior](#8-responsive-behavior)
9. [Contract → UI Mapping](#9-contract--ui-mapping)
10. [Asset Requirements Summary](#10-asset-requirements-summary)

---

## 1. Design Philosophy

### Core Principles

| Principle | Rule |
|-----------|------|
| **Contract-driven** | Every UI element maps to a contract field. No invented state. |
| **Mobile-first** | Portrait 375px baseline. One-thumb reachable. All touch targets >= 44px. |
| **Blockchain invisible** | Players see "Sign In", "Cubes", "Play". No hex, no tx hashes, no gas. |
| **Celebrate everything** | Line clear → particles. Combo → screen text + shake. Level up → star animation. Boss defeat → cinematic. |
| **Grid is king** | Play screen: grid occupies 75-80% of viewport height. Everything else is minimal overlay. |
| **Sprites over text** | Icons for constraints, bonuses, currencies. Minimal text labels. |
| **Theme everything** | All visuals resolve through `resolveAsset(theme, assetId)`. Swap theme = swap look. |
| **uiScale everything** | Zero hardcoded pixels. All dimensions x uiScale. |

### Blockchain Abstraction

| Player sees | Contract reality |
|-------------|-----------------|
| "Sign In" | Cartridge Controller connect |
| "Play" | `create()` or `create_with_cubes()` tx |
| "Cubes: 142" | ERC1155 `balance_of_cubes()` |
| Drag block | `move(game_id, row, start, final)` tx |
| Use bonus | `apply_bonus(game_id, bonus, row, line)` tx |
| Buy upgrade | `upgrade_starting_bonus()` / `upgrade_bag_size()` tx |
| Claim quest | `quest_system.claim(quest_id, interval_id)` tx |

---

## 2. User Stories

### New Player
- As a **new player**, I want to sign in with one tap and immediately see what the game is, so that I don't bounce.
- As a **new player**, I want a free game token minted automatically, so that I can start playing without understanding tokens.
- As a **new player**, I want a brief interactive tutorial (3 screens max) showing how to swipe blocks and clear lines, so that I learn by doing.
- As a **new player**, I want to start my first run from the hub without navigating menus, so that time-to-play is under 30 seconds.

### Starting a Campaign Run
- As a **returning player**, I want to see my active run prominently on the hub, so that I can resume in one tap.
- As a **player starting a run**, I want to select 3 bonuses from my unlocked set, so that I can strategize my loadout.
- As a **player with cubes**, I want to choose how many cubes to bring into a run (based on my bridging rank), so that I can invest in in-game purchases.
- As a **player**, I want locked bonuses (Wave, Supply) to be visible but clearly locked with unlock cost shown, so that I know what to save for.

### Playing a Level
- As a **player mid-level**, I want the grid to dominate the screen with minimal chrome, so that I can focus on the puzzle.
- As a **player**, I want to see my remaining moves and score progress without looking away from the grid, so that I stay in flow.
- As a **player**, I want constraints shown as recognizable icons with fill-progress, so that I know at a glance what to do and how close I am.
- As a **player**, I want to use bonuses via the bottom action bar without a submenu, so that activation is fast (one tap for non-targeted, two taps for targeted).
- As a **player**, I want combo feedback (text overlay, particles, screen shake) that scales with combo size, so that big plays feel rewarding.
- As a **player**, I want a single menu button that opens a menu with Surrender/Settings/Sound, so that the screen is not cluttered with multiple buttons.
- As a **player**, I want to see a preview of the next row that will be added, so that I can plan ahead.

### Boss Levels
- As a **player reaching a boss**, I want a dramatic intro showing the boss name and portrait, so that boss levels feel like events.
- As a **player fighting a boss**, I want to see 2-3 constraint badges clearly (not just one), so that I know all the conditions.
- As a **player**, I want boss levels to feel visually distinct (danger palette, boss progress bar), so that tension increases.
- As a **player who defeats a boss**, I want to choose which bonus to upgrade (the level-up reward), so that I feel agency in progression.
- As a **player**, I want the boss cube bonus (+10/+20/+30/+40/+50) shown prominently on defeat, so that the reward feels substantial.

### In-Game Shop
- As a **player at a shop level**, I want a clear overlay showing 3 purchasable items with costs, so that I can decide quickly.
- As a **player**, I want to see my available cube balance and understand scaling costs, so that I can budget.
- As a **player**, I want to skip the shop if I don't want to buy anything, so that it's never a blocker.
- As a **player**, I want grayed-out items for things I can't buy (already purchased limit, insufficient cubes), so that I don't waste time.

### Daily Challenge [FUTURE]
- As a **competitive player**, I want a daily puzzle that everyone plays, so that I can compare my skill.
- As a **player**, I want to see a leaderboard after completing the daily challenge, so that I know where I rank.
- As a **player**, I want a streak counter for consecutive days played, so that I'm motivated to return daily.
- As a **player**, I want CUBE rewards based on my ranking, so that the daily challenge has tangible value.

### Between Runs
- As a **player between runs**, I want to see my best level, total cubes, and run stats, so that I track my progress.
- As a **player**, I want to see the campaign map with star ratings for completed levels, so that I can appreciate my journey.
- As a **player**, I want to browse permanent upgrades and understand what to save for, so that I have long-term goals.

### Quests
- As a **player**, I want to see my daily quest progress from the hub, so that I know what to aim for.
- As a **player**, I want to claim quest rewards with one tap, so that it feels rewarding and fast.
- As a **player**, I want the finisher quest (complete all 9) to be prominently shown, so that I'm motivated to complete everything.

### Permanent Shop
- As a **player with cubes**, I want to see all available upgrades organized by category, so that I can plan purchases.
- As a **player**, I want to see the effect of each upgrade level before buying, so that I make informed decisions.
- As a **player**, I want purchased upgrades reflected immediately in my loadout, so that feedback is instant.

### Profile & Achievements
- As a **player**, I want to see my lifetime stats and achievement progress, so that I feel accomplishment.
- As a **player**, I want achievements to show clear progress (50/100 games), so that I know how close I am.

---

## 3. Navigation Architecture

### Screen Graph

```
                    +---------------+
                    |  ONBOARDING   | (first time only)
                    +-------+-------+
                            |
                    +-------v-------+
             +------+  HOME HUB    +------+
             |      +--+-+-+-------+      |
             |         | | |              |
     +-------v--+  +---v+ | +v-------+   |
     | CAMPAIGN |  |SHOP| | | QUESTS |   |
     |   MAP    |  +----+ | +--------+   |
     +----+-----+         |        +-----v----+
          |          +----v-----+  | PROFILE  |
     +----v-----+   |  DAILY   |  +----------+
     | LOADOUT  |   |CHALLENGE |
     +----+-----+   +----------+
          |
     +----v-----+
     |   PLAY   |<------------------+
     +--+-+-+---+                   |
        | | |                       |
   +----+ | +----+            +-----+------+
   |      |      |            |  IN-GAME   |
   v      v      v            |   SHOP     |
 LEVEL  BOSS   GAME          +------------+
 DONE   DONE   OVER
   |      |
   |   +--v--------+
   |   | LEVEL-UP  |
   |   | SELECTION |
   |   +--+--------+
   |      |
   +--+---+
      v
   NEXT LEVEL (back to PLAY)
```

### Navigation Rules
- **Hub is always reachable** via back/home gesture from any non-gameplay screen
- **During gameplay**: only Pause modal provides exit (Resume or Surrender)
- **No bottom tab bar** — hub tiles are the navigation
- **Transitions**: Slide left/right between hub sections, slide up for gameplay entry, fade for modals

---

## 4. Design System

### 4.1 Color System

#### Theme Palettes (10 themes)

Each theme defines: `primary`, `secondary`, `accent`, `background`, `surface`, `gridBg`, `blockColors[4]`, `textPrimary`, `textSecondary`.

There are 10 visual themes. Each run, 5 are randomly selected via `deriveZoneThemes(seed)` and assigned to zones 1-5. The theme determines all visuals for that zone: map background, blocks, grid, music.

| Theme | Palette Character |
|-------|-------------------|
| Ocean | Cool blues, teals, deep water |
| Ice | Whites, pale blues, frost |
| Forest | Greens, browns, natural |
| Crystal | Emeralds, translucent, prismatic |
| Desert | Warm golds, sand, dry heat |
| Sunset | Oranges, reds, warm glow |
| Neon | Electric purples, pinks, vivid |
| Storm | Dark grays, lightning whites |
| Lava | Deep reds, oranges, ember |
| Shadow | Blacks, dark purples, dim glow |

#### Semantic Colors (theme-independent)

| Token | Value | Usage |
|-------|-------|-------|
| `color.cube` | `#FFD700` (gold) | CUBE currency icon/text |
| `color.star` | `#FFC107` (amber) | Star ratings |
| `color.danger` | `#FF4444` | Boss overlay tint, low moves warning |
| `color.success` | `#4CAF50` | Constraint complete, purchase success |
| `color.locked` | `#666666` at 50% alpha | Locked levels, locked bonuses |
| `color.constraint.ring` | `#FFFFFF` at 30% alpha (bg), theme `accent` (fill) | Constraint progress rings |

### 4.2 Typography

Single font family: **Tilt Prism** (display) for all text.

| Style | Size (x uiScale) | Weight | Usage |
|-------|-------------------|--------|-------|
| `display` | 48px | Bold | Victory text, boss names |
| `heading` | 28px | Bold | Screen titles, level numbers |
| `subheading` | 20px | SemiBold | Section headers, bonus names |
| `body` | 16px | Regular | Descriptions, quest text |
| `caption` | 12px | Regular | Costs, small labels |
| `hud` | 24px | Bold | Moves counter, score, combo |
| `hudSmall` | 14px | Bold | Constraint progress numbers |

### 4.3 Spacing & Layout

| Token | Value (x uiScale) | Usage |
|-------|--------------------|-------|
| `spacing.xs` | 4px | Inner padding, icon gaps |
| `spacing.sm` | 8px | Component padding |
| `spacing.md` | 16px | Section spacing |
| `spacing.lg` | 24px | Screen padding |
| `spacing.xl` | 32px | Major section gaps |

### 4.4 Touch Targets

- Minimum: 44 x 44px (Apple HIG)
- Grid blocks: `blockSize = floor((screenWidth - 2 * spacing.lg) / 8)` — typically ~40px at 375px, scaled
- Bonus icons in action bar: 56 x 56px
- Pause button: 44 x 44px

### 4.5 Component Patterns

#### Constraint Badge (reusable)
```
+---------------------+
|  +-------+          |
|  | ICON  |  <- 32x32 constraint type icon
|  +---+---+          |
|  circular progress ring (SVG arc, 36px diameter, 3px stroke)
|   "2/5"  <- progress text (hudSmall)
|   or checkmark when complete
+---------------------+
```
- Empty ring: `color.constraint.ring` background
- Filled ring: theme `accent` color, proportional arc
- Complete: full ring turns `color.success`, icon gets checkmark overlay

#### Bonus Slot (reusable)
```
+---------------+
|   +-------+   |
|   | ICON  |   |  <- 40x40 bonus type icon
|   +-------+   |
|   "x3"        |  <- charge count
|   "II"        |  <- upgrade level (Roman numerals)
+---------------+
```
- Background: rounded rect, theme `surface` color
- Border: 2px, theme `secondary`
- Active/selected: border becomes `accent`, subtle glow

#### CUBE Display
```
[coin_icon 142]  <- gold coin sprite + number
```
- Always visible in screen headers
- Gold icon (sprite, not emoji) + bold number
- Animates (count up) when earning cubes

---

## 5. Screen Specifications

### 5.1 Home Hub

The central navigation screen. No bottom tab bar — everything is tiles/cards.

#### Layout

```
+------------------------------+
|  [avatar]  zKube    [C 142]  |  <- header: player name + CUBE balance
+------------------------------+
|                              |
|  +------------------------+  |
|  |    CONTINUE RUN        |  |  <- largest tile, only if active run
|  |    Level 14 . **       |  |     shows current level + stars earned
|  |    [Combo][Score][Harv] |  |     shows equipped bonuses
|  +------------------------+  |
|                              |
|  +----------+ +-----------+  |
|  | NEW RUN  | |  DAILY    |  |  <- two equal tiles
|  |          | | CHALLENGE |  |
|  |  > Play  | | fire3 23h |  |     daily: streak + timer
|  +----------+ +-----------+  |
|                              |
|  +------+ +------+ +------+ |
|  | SHOP | |QUESTS| |STATS | |  <- three smaller tiles
|  |      | | 6/10 | |      | |     quests show progress count
|  +------+ +------+ +------+ |
|                              |
+------------------------------+
```

#### Data Bindings

| Element | Contract Source |
|---------|---------------|
| CUBE balance | `CubeToken.balance_of_cubes(player)` |
| Continue Run tile | `Game` model where `over == false` for player's tokens |
| Current level | `RunData.current_level` (unpacked from `Game.run_data`) |
| Stars earned | `Game.level_stars` (2 bits x 50 levels) |
| Equipped bonuses | `RunData.selected_bonus_1/2/3` |
| Quest progress | Quest contract `progress` queries |
| Player name | `get_player_name(game_id)` |

#### Interactions
- **Continue Run** -> navigates to Play Screen (resumes active game)
- **New Run** -> navigates to Loadout Screen
- **Daily Challenge** -> navigates to Daily Challenge screen [FUTURE]
- **Shop** -> navigates to Permanent Shop
- **Quests** -> navigates to Quest Screen
- **Stats** -> navigates to Profile & Achievements
- If no active run: "Continue Run" tile hidden, "New Run" becomes the largest tile

#### Transitions
- Hub -> any screen: slide left
- Return to hub: slide right
- Hub -> Play: slide up (entering gameplay)

---

### 5.2 Loadout Screen

Shown before starting a new campaign run. Player selects 3 bonuses and optionally bridges cubes.

#### Layout

```
+------------------------------+
|  < Back         NEW RUN      |
+------------------------------+
|                              |
|  SELECT 3 BONUSES            |
|                              |
|  +------+ +------+ +------+ |
|  |SLOT 1| |SLOT 2| |SLOT 3| |  <- 3 equip slots (empty initially)
|  |      | |      | |      | |
|  +------+ +------+ +------+ |
|                              |
|  AVAILABLE BONUSES           |
|  +------+ +------+ +------+ |
|  |Combo | |Score | |Harv. | |  <- always unlocked
|  |  I   | |  II  | |  I   | |     shows upgrade level
|  | x2   | | x1   | | x3   | |     shows starting charges
|  +------+ +------+ +------+ |
|  +------+ +------+          |
|  | Wave | |Supply|          |  <- locked until purchased (200 cubes)
|  | LOCK | | LOCK |          |     or shows level + charges if unlocked
|  +------+ +------+          |
|                              |
|  BRING CUBES INTO RUN        |
|  [====o---------] 50 / 200  |  <- slider, max = bridging rank cap
|  Rank 2: up to 200 cubes    |
|                              |
|  +------------------------+  |
|  |     > START RUN        |  |  <- disabled until 3 bonuses selected
|  +------------------------+  |
+------------------------------+
```

#### Data Bindings

| Element | Contract Source |
|---------|---------------|
| Bonus levels (I/II/III) | `PlayerMeta.data` -> `MetaData.bonus_X_level` |
| Starting charges | `PlayerMeta.data` -> `MetaData.starting_combo/score/harvest/wave/supply` |
| Wave unlocked | `PlayerMeta.data` -> `MetaData.wave_unlocked` |
| Supply unlocked | `PlayerMeta.data` -> `MetaData.supply_unlocked` |
| Bridging rank cap | `PlayerMeta.data` -> `MetaData.bridging_rank` (0->0, 1->50, 2->100, 3->200) |
| CUBE balance | `CubeToken.balance_of_cubes(player)` |

#### Interactions
- **Tap available bonus** -> fills next empty slot (with "equip" sound + scale animation)
- **Tap filled slot** -> removes bonus back to available pool (with "unequip" sound)
- **Locked bonus tap** -> tooltip: "Unlock in Shop for 200 cubes" with shortcut to shop
- **Cube slider** -> drag to set `cubes_amount` for `create_with_cubes()`
- **Start Run** -> calls `create(game_id)` or `create_with_cubes(game_id, amount)` -> transitions to Campaign Map -> first level

---

### 5.3 Campaign Map

Progression map showing all 50 levels across 5 zones. Each run randomly assigns a theme to each zone via `deriveZoneThemes(seed)`, picking 5 from the pool of 10 themes. Each theme has its own map background — the zone displays that theme's map with PixiJS nodes layered on top.

#### Layout Concept

```
+------------------------------+
|  < Hub    ZONE 3: DESERT     |  <- theme name + back button
+------------------------------+
|                              |
|  [THEME MAP BACKGROUND]      |  <- per-theme illustrated background
|                              |     (theme-N/map.png)
|     o-o-o-o-o               |
|    21 22 23 24 25            |  <- level nodes: small circles
|         |                    |
|     o-o-o-o-o               |
|    26 27 28 29               |
|              |               |
|           +-----+            |
|           | SHOP|            |  <- shop node (before boss)
|           +--+--+            |
|           +-----+            |
|           |BOSS |            |  <- boss node: 2x size, animated
|           | 30  |            |
|           +-----+            |
|                              |
+------------------------------+
  [. . . o .]                    <- zone indicator dots (1-5)
```

#### Zone Structure

5 zones per run, 10 levels each. Theme assignment is random per run (seed-derived).

| Zone | Levels | Theme | Boss |
|------|--------|-------|------|
| 1 | 1-10 | Random (from 10) | Boss at L10 |
| 2 | 11-20 | Random (from 10) | Boss at L20 |
| 3 | 21-30 | Random (from 10) | Boss at L30 |
| 4 | 31-40 | Random (from 10) | Boss at L40 |
| 5 | 41-50 | Random (from 10) | Boss at L50 (Final) |

Theme selection: `deriveZoneThemes(seed)` uses Poseidon hash to deterministically pick 5 unique themes from the 10 available. Same seed = same theme assignment. Each zone gets a different theme.

#### Node Types

| Node | Size | Visual | Condition |
|------|------|--------|-----------|
| Regular level | 36px circle | Level number, star indicator below | Always shown |
| Shop entrance | 40px square | Shopping bag icon | Before boss levels (L10/20/30/40/50) |
| Boss level | 64px circle | Boss icon + name, pulsing glow | Every 10 levels |
| Current level | 36px + glow | Pulsing highlight ring | `RunData.current_level` |
| Completed | 36px + stars | 1-3 star icons below node | `Game.level_stars` bits |
| Locked | 36px dimmed | Grayed out, no interaction | `level > best_level + 1` |

#### Background Design Spec (for asset generation)
- Each of the 10 themes has ONE map background image (2x resolution for retina)
- Background is a scenic illustration with a meandering path drawn into it
- PixiJS nodes are positioned along the path at predefined coordinates
- The path has clear "landing spots" where nodes sit (slightly lighter areas or clearings)
- Aspect ratio: tall (roughly 375x800 per zone section, scrollable)
- No interactive elements in the background itself — all interaction is PixiJS nodes on top
- Since themes are randomly assigned to zones, every map must work as any zone (1-5)

#### Interactions
- **Swipe horizontally** between zones (smooth slide, snaps to zone)
- **Tap completed/current level** -> enter level (Play Screen)
- **Tap boss node** -> if shop available first, prompt: "Visit shop before boss?" -> shop or skip
- **Tap locked level** -> no action (subtle shake feedback)
- **Zone dots** at bottom -> tap to jump to zone

#### Data Bindings

| Element | Contract Source |
|---------|---------------|
| Current level position | `RunData.current_level` |
| Star ratings | `Game.level_stars` (2 bits per level: 0=none, 1=star, 2=2star, 3=3star) |
| Best level reached | `PlayerMeta.best_level` |
| Boss identity | `GameSeed.seed` -> `(level_seed % 10) + 1` -> boss name |
| Zone theme | `deriveZoneThemes(GameSeed.seed)` -> `ThemeId` per zone |

---

### 5.4 Play Screen

The core gameplay screen. Grid dominates. Minimal chrome.

#### Layout

```
+------------------------------+
| = Lv.14  [A][B]  12M  85/120|  <- HUD bar
+------------------------------+
|                              |
|  +--+--+--+--+--+--+--+--+  |
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |  <- 8x10 game grid (75-80% of height)
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |
|  |  |  |  |  |  |  |  |  |  |
|  +--+--+--+--+--+--+--+--+  |
|  |  |##|##|  |##|  |##|##|  |
|  +--+--+--+--+--+--+--+--+  |
|  [=====next row preview====] |  <- next row (faded)
|                              |
|  +------+ +------+ +------+ |
|  |Combo | |Score | |Harv. | |  <- action bar: 3 bonus slots
|  | x2   | | x1   | | x3   | |
|  +------+ +------+ +------+ |
|         [+2 unalloc.]        |  <- unallocated charges indicator
+------------------------------+
```

#### HUD Bar (top, single row, 44px height)

```
+--------------------------------------------------+
|  =   Lv.14   [A 2/5] [B check]    12 M    85/120|
|  |     |       |       |           |         |   |
|  |     |       |       |           |         +- score/target
|  |     |       |       |           +- moves remaining
|  |     |       |       +- constraint 2 (complete)
|  |     |       +- constraint 1 (progress)
|  |     +- level number
|  +- pause button
+--------------------------------------------------+
```

**HUD elements left to right:**
1. **Menu button** (hamburger icon, 44x44) — top-left corner
2. **Level number** — "Lv.14" in `hud` style
3. **Constraint badges** — 1-3 badges (see Constraint Badge component). Centered or after level number.
4. **Moves remaining** — large number with moves icon. Turns red when <= 3.
5. **Score progress** — "85/120" with diamond icon. Or a thin progress bar below the HUD.

#### Grid

- 8 columns x 10 rows
- Each cell renders a block sprite based on 3-bit value (0=empty, 1-4=block sizes)
- Block colors from theme palette: `blockColors[value - 1]`
- Grid background: theme `gridBg` color
- Cell size: `blockSize = floor((screenWidth - 2 * spacing.md) / 8)`
- Grid sits in a container centered horizontally, offset from top by HUD height + spacing

#### Next Row Preview
- Rendered below the grid, same width, 50% opacity
- Shows `Game.next_row` (24 bits -> 8 blocks)
- Blocks use same sprites but dimmed
- When a line clears and new row enters: row slides up from preview position into grid bottom

#### Action Bar (bottom)

3 bonus slots + optional unallocated charges indicator.

| Bonus | Icon | Targeted? | Activation |
|-------|------|-----------|------------|
| Combo | chain links | No | Tap -> immediate apply |
| Score | score star | No | Tap -> immediate apply |
| Harvest | scythe | Yes (block size) | Tap -> tap grid block of target size |
| Wave | horizontal wave | Yes (row) | Tap -> tap row to clear |
| Supply | plus blocks | No | Tap -> immediate apply (adds lines) |

- Each slot: 56x56 icon + charge count badge (top-right corner)
- Charge count: `RunData.combo_count / score_count / harvest_count / wave_count / supply_count`
- Slot disabled (grayed) when charges = 0
- **NoBonusUsed constraint active**: all bonus slots show a warning badge — tapping shows tooltip "Bonus use forbidden by constraint"

**Unallocated charges** (if `RunData.unallocated_charges > 0`):
- Small "+N" button below action bar
- Tap -> opens Allocate Modal: shows 3 equipped bonuses, tap one to add charge to it. Calls `allocate_charges(game_id, bonus_slot)`.

#### Combo Overlay (mid-screen, temporary)

When `Game.combo_counter > 1`:
- Text appears center-screen: "2x COMBO", "3x COMBO", etc.
- Size scales: 32px at 2x, 40px at 3x, 48px at 4x, 56px at 5+
- Color intensifies: yellow -> orange -> red -> purple
- Duration: 0.8s fade-in/out
- Particle burst accompanies text (radial, 30-50 particles, block colors)
- Screen shake for 4+ combos (2-4px amplitude, 0.2s duration)

#### Interaction Flow

1. **Swipe block horizontally** -> `move(game_id, row, start, final)` tx
2. State machine: WAITING -> GRAVITY -> LINE_CLEAR -> ADD_LINE -> GRAVITY2 -> LINE_CLEAR2 -> UPDATE -> WAITING
3. **Line clear animation**: blocks flash white (0.1s) -> horizontal sweep -> particle burst -> blocks above fall with bounce
4. **Tap bonus** -> if non-targeted: immediate `apply_bonus()` tx. If targeted: enter targeting mode (grid highlights valid targets, tap to confirm)
5. **Tap menu** -> opens Menu Modal

#### Data Bindings

| Element | Contract Source |
|---------|---------------|
| Grid blocks | `Game.blocks` (felt252, 240 bits) |
| Next row | `Game.next_row` (u32, 24 bits) |
| Level number | `RunData.current_level` |
| Score / target | `RunData.level_score` / `GameLevel.points_required` |
| Moves remaining | `GameLevel.max_moves - RunData.level_moves` |
| Combo counter | `Game.combo_counter` |
| Constraint 1 type + progress | `GameLevel.constraint_type` + `RunData.constraint_progress` / `GameLevel.constraint_count` |
| Constraint 2 type + progress | `GameLevel.constraint_2_type` + `RunData.constraint_2_progress` / `GameLevel.constraint_2_count` |
| Constraint 3 type + progress | `GameLevel.constraint_3_type` + `RunData.constraint_3_progress` / `GameLevel.constraint_3_count` |
| Bonus charges | `RunData.combo_count`, `score_count`, `harvest_count`, `wave_count`, `supply_count` |
| Bonus levels | `RunData.bonus_1_level`, `bonus_2_level`, `bonus_3_level` |
| Bonus used flag | `RunData.bonus_used_this_level` |
| Unallocated charges | `RunData.unallocated_charges` |
| Game over | `Game.over` |

---

### 5.5 Boss Level

Boss levels (L10, L20, L30, L40, L50) use the same Play Screen layout but with distinct visual treatments.

#### Boss Intro Sequence (before gameplay starts)

```
+------------------------------+
|                              |
|       [BOSS PORTRAIT]        |  <- full-width illustration
|                              |
|       "COMBO MASTER"         |  <- boss name (display style)
|                              |
|      [A 3/5] [B x1]         |  <- constraint preview badges
|                              |
|        +30 CUBE bonus        |  <- boss cube reward preview
|                              |
|      [ > FIGHT ]             |  <- tap to begin
|                              |
+------------------------------+
```

- **Duration**: stays until player taps "Fight"
- **Animation**: portrait slides in from top, name fades in, constraints appear one by one
- **Sound**: ominous boss music intro sting

#### 10 Boss Visuals

| Boss ID | Name | Visual Theme | Constraint Types |
|---------|------|-------------|-----------------|
| 1 | Combo Master | Lightning/chain motif | ClearLines, AchieveCombo, NoBonusUsed |
| 2 | Demolisher | Wrecking ball/explosion | BreakBlocks, ClearLines, ClearGrid |
| 3 | Daredevil | Fire/trapeze | FillAndClear, AchieveCombo, ClearLines |
| 4 | Purist | Zen/minimalist | NoBonusUsed, ClearLines, AchieveCombo |
| 5 | Harvester | Scythe/grain | BreakBlocks, AchieveCombo, FillAndClear |
| 6 | Tidal | Ocean waves | ClearGrid, ClearLines, BreakBlocks |
| 7 | Stacker | Tetromino tower | FillAndClear, ClearLines, BreakBlocks |
| 8 | Surgeon | Precise/surgical | BreakBlocks, FillAndClear, NoBonusUsed |
| 9 | Ascetic | Monk/meditation | NoBonusUsed, AchieveCombo, FillAndClear |
| 10 | Perfectionist | Crown/perfection | ClearLines, FillAndClear, AchieveCombo |

Constraint count per boss level:
- L10, L20, L30: Primary + Secondary (2 constraints)
- L40, L50: Primary + Secondary + Tertiary (3 constraints)

#### In-Game Visual Differences

| Element | Normal Level | Boss Level |
|---------|-------------|------------|
| HUD bar background | Theme `surface` | `color.danger` tinted (red/orange overlay at 30%) |
| Constraint badges | 0-1 badges | 2-3 badges |
| Grid border | None or subtle | Pulsing red border (2px, slow pulse) |
| Background | Theme default | Darkened + subtle particle embers |
| Music | Theme BGM | Boss battle BGM (more intense) |
| Boss progress bar | None | Below HUD: thin bar showing overall level progress |

#### Boss Cube Rewards

| Boss Level | Cube Bonus |
|------------|-----------|
| L10 | +10 CUBE |
| L20 | +20 CUBE |
| L30 | +30 CUBE |
| L40 | +40 CUBE |
| L50 | +50 CUBE |

---

### 5.6 In-Game Shop

Appears when player reaches shop levels (after completing L9, L19, L29, L39, L49 — i.e., when `current_level` is 10, 20, 30, 40, 50 and before the boss fight begins).

#### Layout

```
+------------------------------+
|                              |
|  +------------------------+  |
|  |      SHOP              |  |
|  |      C 87 cubes        |  |  <- available cubes
|  |                        |  |
|  |  +------------------+  |  |
|  |  | BONUS CHARGE     |  |  |
|  |  |  Cost: 5 cubes   |  |  |  <- scales: ceil(5 x 1.5^n)
|  |  |  -> +1 unalloc.  |  |  |
|  |  |    [ BUY ]        |  |  |
|  |  +------------------+  |  |
|  |                        |  |
|  |  +------------------+  |  |
|  |  | LEVEL UP          |  |  |
|  |  |  Cost: 50 cubes  |  |  |  <- limit 1 per shop visit
|  |  |  Upgrade a bonus  |  |  |
|  |  |    [ BUY ]        |  |  |
|  |  +------------------+  |  |
|  |                        |  |
|  |  +------------------+  |  |
|  |  | SWAP BONUS        |  |  |
|  |  |  Cost: 50 cubes  |  |  |  <- limit 1 per shop visit
|  |  |  Swap an equipped |  |  |
|  |  |    [ BUY ]        |  |  |
|  |  +------------------+  |  |
|  |                        |  |
|  |  +--------------------+|  |
|  |  |  > CONTINUE        ||  |  <- proceed to boss
|  |  +--------------------+|  |
|  +------------------------+  |
|                              |
+------------------------------+
   (blurred game background)
```

#### BonusCharge Cost Scaling

| Purchase # (this visit) | Cost |
|------------------------|------|
| 1st | 5 cubes |
| 2nd | 8 cubes |
| 3rd | 12 cubes |
| 4th | 17 cubes |
| 5th | 26 cubes |

Formula: `ceil(5 x 1.5^n)` where n = `RunData.shop_purchases` this visit.

#### Buy Flows

**BonusCharge**: Tap Buy -> cost deducted -> `unallocated_charges += 1` -> show "+1 charge" animation -> cost updates for next purchase. Player allocates later via action bar "+" button.

**LevelUp**: Tap Buy -> shows bonus selection (3 equipped bonuses with current level) -> tap bonus to upgrade -> cost deducted -> `bonus_X_level += 1`. Button grays out after purchase.

**SwapBonus**: Tap Buy -> shows swap interface (current bonus -> available replacements) -> select new bonus -> calls `swap_bonus()`. Button grays out after purchase.

#### Data Bindings

| Element | Contract Source |
|---------|---------------|
| Available cubes | `RunData.total_cubes - cubes_spent` (= `get_available_cubes()`) |
| BonusCharge cost | `ConsumableTrait::get_bonus_charge_cost(RunData.shop_purchases)` |
| LevelUp bought | `RunData.shop_level_up_bought` |
| SwapBonus bought | `RunData.shop_swap_bought` |
| Current bonus levels | `RunData.bonus_1_level`, `bonus_2_level`, `bonus_3_level` |

---

### 5.7 Level Complete

Shown when a level's score target is met and all constraints satisfied.

#### Layout

```
+------------------------------+
|                              |
|         LEVEL 14             |
|        COMPLETE!             |
|                              |
|        *  *  .               |  <- star rating (animated fill)
|                              |
|   Score: 120 / 120   check   |
|   Moves: 8 / 20 used        |
|                              |
|   +--------------------+     |
|   | CUBES EARNED       |     |
|   |  Base:    +2 C     |     |  <- 1-3 based on star rating
|   |  Combo:   +3 C     |     |  <- if 5-line combo achieved
|   |  ----------------  |     |
|   |  Total:   +5 C     |     |
|   +--------------------+     |
|                              |
|   +------------------------+ |
|   |    > NEXT LEVEL        | |
|   +------------------------+ |
|                              |
+------------------------------+
```

#### Star Rating Logic

Stars based on moves used vs `GameLevel.max_moves`:
- 3 stars: used <= 40% of max moves
- 2 stars: used <= 70% of max moves
- 1 star: used <= 100% of max moves
- Values from `GameLevel.cube_3_threshold` and `GameLevel.cube_2_threshold`

#### Star Animation Sequence
1. Level complete banner slides down (0.3s)
2. Star 1 scales in with particle burst (0.4s delay)
3. Star 2 scales in (0.3s delay after star 1)
4. Star 3 scales in (0.3s delay after star 2) — or empty star if not earned
5. Score breakdown fades in (0.5s after stars)
6. Cube total counts up with coin sound (0.5s)
7. "Next Level" button fades in

#### Combo Cube Bonuses

| Lines cleared (single move) | Bonus CUBE |
|-----------------------------|-----------|
| 4 | +1 |
| 5 | +3 |
| 6 | +5 |
| 7 | +10 |
| 8 | +25 |
| 9+ | +50 |

These are tracked during play and shown in the breakdown.

---

### 5.8 Boss Level-Up Selection

Shown after defeating a boss level. The `boss_level_up_pending` flag triggers this screen.

#### Layout

```
+------------------------------+
|                              |
|      BOSS DEFEATED!          |
|     "COMBO MASTER"           |
|                              |
|      +30 C CUBE bonus        |
|                              |
|   +--------------------+     |
|   |  UPGRADE A BONUS   |     |
|   |  Choose one:       |     |
|   |                    |     |
|   |  +--------------+  |     |
|   |  | Combo         |  |     |  <- shows current -> next level
|   |  |   I -> II     |  |     |     "+1 combo -> +2 combo"
|   |  +--------------+  |     |
|   |                    |     |
|   |  +--------------+  |     |
|   |  | Score         |  |     |
|   |  |   II -> III   |  |     |     "+20 score -> +30 score"
|   |  +--------------+  |     |
|   |                    |     |
|   |  +--------------+  |     |
|   |  | Harvest       |  |     |
|   |  |   I -> II     |  |     |     "+1 cube/blk -> +2 cube/blk"
|   |  +--------------+  |     |
|   +--------------------+     |
|                              |
+------------------------------+
```

#### Upgrade Effect Preview

| Bonus | Level I | Level II | Level III |
|-------|---------|----------|-----------|
| Combo | +1 combo | +2 combo | +3 combo |
| Score | +10 score | +20 score | +30 score |
| Harvest | +1 cube/block | +2 cube/block | +3 cube/block |
| Wave | Clear 1 row | Clear 2 rows | Clear 3 rows |
| Supply | Add 1 line | Add 2 lines | Add 3 lines |

#### Interactions
- Player sees all 3 equipped bonuses with current and next level
- Bonuses already at max level (III) are grayed out with "MAX" badge
- **Tap a bonus** -> confirmation animation -> level upgraded -> proceeds to next level
- This calls the boss level-up handler (sets `boss_level_up_pending = false`, increments bonus level)

---

### 5.9 Run Complete / Game Over

#### Victory (L50 cleared, `run_completed = true`)

```
+------------------------------+
|                              |
|       VICTORY!               |
|                              |
|    All 50 levels cleared!    |
|                              |
|   +--------------------+     |
|   |  RUN SUMMARY       |     |
|   |                    |     |
|   |  Levels: 50/50     |     |
|   |  Total Score: 2847 |     |
|   |  Best Combo: 7x    |     |
|   |  Cubes Earned: 184 |     |
|   |  Stars: 142/150    |     |
|   +--------------------+     |
|                              |
|   +------------------------+ |
|   |    > HOME              | |
|   +------------------------+ |
|   +------------------------+ |
|   |    > NEW RUN           | |
|   +------------------------+ |
+------------------------------+
```

- Grand celebration: confetti, screen-wide particles, victory fanfare
- Cube minting animation: coins rain from top, counter ticks up
- Total cubes earned in run -> minted to wallet as ERC1155

#### Game Over (`Game.over = true`, not completed)

```
+------------------------------+
|                              |
|        RUN OVER              |
|     Reached Level 23         |
|                              |
|   +--------------------+     |
|   |  RUN SUMMARY       |     |
|   |                    |     |
|   |  Levels: 23/50     |     |
|   |  Total Score: 1203 |     |
|   |  Best Combo: 5x    |     |
|   |  Cubes Earned: 67  |     |
|   +--------------------+     |
|                              |
|   +------------------------+ |
|   |    > TRY AGAIN         | |  <- goes to Loadout Screen
|   +------------------------+ |
|   +------------------------+ |
|   |    > HOME              | |
|   +------------------------+ |
+------------------------------+
```

- Somber but not punishing. "Good effort" energy.
- Cubes earned still minted (they are NOT lost on game over)
- "Try Again" -> Loadout Screen -> new run

#### Data Bindings

| Element | Contract Source |
|---------|---------------|
| Levels reached | `RunData.current_level` |
| Total score | `RunData.total_score` |
| Best combo | `RunData.max_combo_run` |
| Cubes earned | `RunData.total_cubes` |
| Run completed | `RunData.run_completed` |
| Game over | `Game.over` |

---

### 5.10 Daily Challenge [FUTURE]

> **Note**: Daily Challenge mode does not exist in contracts yet. This section designs the full UI assuming contracts will be built to support it.

#### Concept
- Same puzzle mechanics as campaign
- All players get the same level (deterministic seed from date)
- Single level: fixed difficulty, fixed grid, fixed constraints
- One attempt per day
- Ranked by score (moves remaining as tiebreaker)
- No bonuses, no shop — pure puzzle skill

#### Entry Screen

```
+------------------------------+
|  < Hub     DAILY CHALLENGE   |
+------------------------------+
|                              |
|        Feb 16, 2026          |
|                              |
|        Streak: 7 days        |  <- consecutive days played
|                              |
|   Difficulty: HARD           |
|   Constraints:               |
|     [A Clear 4 lines x2]    |
|     [B Reach 5x combo]      |
|                              |
|   +------------------------+ |
|   |      > PLAY            | |
|   +------------------------+ |
|                              |
|   YESTERDAY'S RESULTS        |
|   Your Score: 156            |
|   Rank: #42 / 1,284         |
|   Reward: +20 C              |
|                              |
+------------------------------+
```

#### Post-Challenge Leaderboard

```
+------------------------------+
|        DAILY RESULTS         |
+------------------------------+
|                              |
|   Your Score: 142            |
|   Rank: #18 / 892            |
|   Reward: +50 C (Top 10%)   |
|                              |
|   +--------------------+     |
|   |  1. PlayerA  189   |     |
|   |  2. PlayerB  176   |     |
|   |  3. PlayerC  165   |     |
|   |  ...               |     |
|   | 18. YOU      142   |     |  <- highlighted
|   |  ...               |     |
|   +--------------------+     |
|                              |
|   +------------------------+ |
|   |      > HOME            | |
|   +------------------------+ |
+------------------------------+
```

#### Reward Tiers [FUTURE]

| Percentile | CUBE Reward |
|------------|-----------|
| Top 1% | 100 |
| Top 10% | 50 |
| Top 25% | 30 |
| Top 50% | 20 |
| Top 100% | 10 |

---

### 5.11 Permanent Shop

Between-run shop for spending cubes on permanent upgrades.

#### Layout

```
+------------------------------+
|  < Hub      SHOP    C 142    |
+------------------------------+
|                              |
|  STARTING BONUSES            |
|  +--------++--------++------+|
|  | Combo  || Score  ||Harv. ||  <- 3 cards per row
|  | Lv.1   || Lv.2   || Lv.0 ||
|  | x1->x2 || x2->x3 || x0->x1||
|  |100 C   ||250 C   ||100 C ||
|  | [BUY]  || [BUY]  ||[BUY] ||
|  +--------++--------++------+|
|  +--------++--------+        |
|  | Wave   ||Supply  |        |
|  |  LOCK  || LOCK   |        |  <- locked bonuses
|  |Unlock: ||Unlock: |        |
|  |200 C   ||200 C   |        |
|  | [BUY]  || [BUY]  |        |
|  +--------++--------+        |
|                              |
|  BAG SIZE                    |
|  +--------++--------++------+|
|  | Combo  || Score  ||Harv. ||
|  | 4->5   || 3->4   || 4->5 ||
|  |100 C   ||100 C   ||100 C ||
|  | [BUY]  || [BUY]  ||[BUY] ||
|  +--------++--------++------+|
|                              |
|  BRIDGING                    |
|  +------------------------+  |
|  | Rank 1 -> 2            |  |
|  | Bring 50->100 cubes    |  |
|  | Cost: 500 C  [BUY]     |  |
|  +------------------------+  |
|                              |
+------------------------------+
```

#### Upgrade Costs

**Starting Bonus** (per type):

| Level | Cost | Starting Charges |
|-------|------|-----------------|
| 0 -> 1 | 100 cubes | +1 charge at run start |
| 1 -> 2 | 250 cubes | +2 charges at run start |
| 2 -> 3 | 500 cubes | +3 charges at run start |

**Bag Size** (per type):

| Level | Cost | Effect |
|-------|------|--------|
| 0 -> 1 | 100 cubes | +1 max capacity |
| 1 -> 2 | 250 cubes | +2 max capacity |
| 2 -> 3 | 500 cubes | +3 max capacity |

**Bridging Rank**:

| Rank | Cost | Max Cubes in Run |
|------|------|-----------------|
| 0 -> 1 | 200 cubes | 0 -> 50 |
| 1 -> 2 | 500 cubes | 50 -> 100 |
| 2 -> 3 | 1000 cubes | 100 -> 200 |

**Unlock Bonus**:

| Bonus | Cost |
|-------|------|
| Wave | 200 cubes (one-time) |
| Supply | 200 cubes (one-time) |

#### Data Bindings

| Element | Contract Source |
|---------|---------------|
| Current levels | `PlayerMeta.data` -> MetaData fields |
| CUBE balance | `CubeToken.balance_of_cubes(player)` |
| Upgrade costs | `shop_system.get_starting_bonus_upgrade_cost()`, `get_bag_upgrade_cost()`, `get_bridging_upgrade_cost()` |
| Wave/Supply unlocked | `MetaData.wave_unlocked`, `supply_unlocked` |

---

### 5.12 Quest Screen

Daily quests for earning CUBE tokens. 10 quests, 102 CUBE/day total.

#### Layout

```
+------------------------------+
|  < Hub    DAILY QUESTS       |
|          Resets in 14h 23m   |
+------------------------------+
|                              |
|  PLAYER                      |
|  +----------------------+    |
|  | Warm-Up              |    |
|  | Play 1 game           |    |
|  | [########..] 1/1  OK |    |  <- complete, claimable
|  | +3 C  [CLAIM]        |    |
|  +----------------------+    |
|  +----------------------+    |
|  | Getting Started       |    |
|  | Play 3 games          |    |
|  | [####......] 2/3     |    |
|  | +6 C                 |    |
|  +----------------------+    |
|  +----------------------+    |
|  | Dedicated             |    |
|  | Play 5 games          |    |
|  | [####......] 2/5     |    |
|  | +12 C                |    |
|  +----------------------+    |
|                              |
|  CLEARER                     |
|  +----------------------+    |
|  | Line Breaker          |    |
|  | Clear 10 lines        |    |
|  | [######....] 7/10    |    |
|  | +3 C                 |    |
|  +----------------------+    |
|  ... (similar for 30, 50)    |
|                              |
|  COMBO                       |
|  ... (3+, 5+, 7+ combo)     |
|                              |
|  =========================   |
|  DAILY CHAMPION              |
|  Complete all 9 quests       |
|  [######....] 6/9           |
|  +25 C                      |
|  =========================   |
|                              |
+------------------------------+
```

#### Quest Details

| Category | Quest | Threshold | Reward |
|----------|-------|-----------|--------|
| Player | Warm-Up | 1 game | 3 CUBE |
| Player | Getting Started | 3 games | 6 CUBE |
| Player | Dedicated | 5 games | 12 CUBE |
| Clearer | Line Breaker | 10 lines | 3 CUBE |
| Clearer | Line Crusher | 30 lines | 6 CUBE |
| Clearer | Line Master | 50 lines | 12 CUBE |
| Combo | Combo Starter | 3+ combo | 5 CUBE |
| Combo | Combo Builder | 5+ combo | 10 CUBE |
| Combo | Combo Expert | 7+ combo | 20 CUBE |
| Finisher | Daily Champion | All 9 done | 25 CUBE |

#### Interactions
- Claimable quests have glowing "CLAIM" button
- **Tap Claim** -> `quest_system.claim(quest_id, interval_id)` -> coin animation -> balance updates
- Progress bars fill in real-time (from Torii subscription)
- Daily Champion auto-detects when all 9 are claimed

---

### 5.13 Profile & Achievements

#### Layout

```
+------------------------------+
|  < Hub      PROFILE          |
+------------------------------+
|                              |
|  +------------------------+  |
|  |  [Avatar]  PlayerName  |  |
|  |                        |  |
|  |  Total Runs: 47        |  |
|  |  Best Level: 34        |  |
|  |  Total Cubes: 1,284    |  |
|  |  Total Lines: 4,892    |  |
|  +------------------------+  |
|                              |
|  ACHIEVEMENTS (18/28)        |
|                              |
|  GRINDER                     |
|  [T][T][T][.][.]             |  <- 10/25/50 earned, 100/250 locked
|                              |
|  CLEARER                     |
|  [T][T][.][.][.]             |  <- 100/500 earned
|                              |
|  COMBO                       |
|  [T][T][T][.][.]             |
|                              |
|  CHAIN                       |
|  [T][.][.]                   |
|                              |
|  SUPERCHAIN                  |
|  [.][.][.]                   |
|                              |
|  LEVELER                     |
|  [T][T][T][.][.]             |
|                              |
|  SCORER                      |
|  [T][T][.]                   |
|                              |
|  MASTER                      |
|  [.]                         |
|                              |
+------------------------------+
```

#### Achievement Categories

| Category | Trophies | Milestones |
|----------|----------|-----------|
| Grinder | 5 | 10, 25, 50, 100, 250 games played |
| Clearer | 5 | 100, 500, 1K, 5K, 10K lines cleared |
| Combo | 5 | 10, 50, 100 3+ line combos |
| Chain | 3 | 5, 25, 50 5+ line combos |
| SuperChain | 3 | 1, 10, 25 7+ line combos |
| Leveler | 5 | Level 10, 20, 30, 40, 50 reached |
| Scorer | 3 | 100, 200, 300 high score |
| Master | 1 | Complete all daily quests in one day |

#### Interactions
- Tap trophy -> tooltip with name, description, progress
- Locked trophies show progress (e.g., "42/100 games")
- Earned trophies are full-color with shine animation

---

### 5.14 Onboarding

First-time player flow. Fast, interactive, zero jargon.

#### Step 1: Welcome + Connect

```
+------------------------------+
|                              |
|        [zKube Logo]          |
|                              |
|     Puzzle. Progress.        |
|        Prevail.              |
|                              |
|   +------------------------+ |
|   |     > SIGN IN          | |  <- triggers Cartridge Controller
|   +------------------------+ |
|                              |
+------------------------------+
```

- Cartridge Controller handles the auth UI (passkey, social login, etc.)
- After connect: auto `free_mint()` for game NFT token

#### Step 2: Tutorial (3 interactive screens)

**Screen 1: "Swipe to Move"**
- Shows a simple 4x4 mini-grid with 3 blocks
- Animated hand gesture showing swipe
- "Slide blocks left or right to arrange them"

**Screen 2: "Clear Lines"**
- Shows a full row being completed
- Line flashes and clears with particles
- "Complete a row to clear it and earn points"

**Screen 3: "Use Bonuses"**
- Shows bonus icons in action bar
- "Tap a bonus to activate its power"
- "Earn more as you progress!"

Each screen: tap/swipe to advance. Skip button in corner.

#### Step 3: First Run

- Arrives at Hub with "START FIRST RUN" prominently shown
- Default loadout pre-selected (Combo + Score + Harvest at level I)
- Cube slider hidden (no bridging rank yet)

---

## 6. Modal Specifications

### 6.1 Menu Modal

Triggered by: tap menu button (hamburger) during gameplay. The game is turn-based — there's nothing to "pause". This is simply a menu overlay.

```
+------------------------------+
|                              |
|  +------------------------+  |
|  |       MENU             |  |
|  |                        |  |
|  |   Level 14             |  |
|  |   Score: 85/120        |  |
|  |   Moves: 12 left       |  |
|  |                        |  |
|  |   [ SURRENDER   ]      |  |
|  |   [ SETTINGS    ]      |  |
|  |   [ SOUND ON    ]      |  |
|  |                        |  |
|  |   [ X CLOSE     ]      |  |
|  +------------------------+  |
|                              |
+------------------------------+
   (dimmed game background)
```

- Overlay with semi-transparent black background
- **Surrender**: confirmation prompt -> `surrender(game_id)` -> Game Over screen
- **Settings**: opens Settings sub-modal (controls sensitivity, visual quality)
- **Sound**: toggle on/off
- **Close** (or tap outside): closes modal, back to game

### 6.2 Surrender Confirmation

```
+----------------------------+
|                            |
|   Are you sure?            |
|   Your progress will be    |
|   saved and cubes earned   |
|   will be kept.            |
|                            |
|   [ SURRENDER ] [ CANCEL ] |
|                            |
+----------------------------+
```

### 6.3 Allocate Charges Modal

Triggered by: tap "+" unallocated charges button on play screen.

```
+------------------------------+
|                              |
|   ALLOCATE CHARGE            |
|   (2 unallocated)            |
|                              |
|   +------+ +------+ +------+|
|   |Combo | |Score | |Harv. ||
|   | x2   | | x1   | | x3   ||
|   |[+ADD]| |[+ADD]| |[+ADD]||
|   +------+ +------+ +------+|
|                              |
|   [ DONE ]                   |
|                              |
+------------------------------+
```

- Shows 3 equipped bonuses with current charges
- Tap "+ADD" to allocate one charge to that bonus
- Counter decrements unallocated, increments target bonus
- "Done" closes modal

### 6.4 Bonus Targeting Overlay

For Harvest and Wave bonuses that need a target.

**Harvest** (select block size to destroy):
- Grid highlights all blocks of each size with colored outlines
- Bottom prompt: "Tap a block to harvest all of that size"
- Tap block -> all blocks of that size flash + destroy -> particles + CUBE earned animation
- Cancel: tap anywhere outside grid or swipe down

**Wave** (select row to clear):
- Row indicators appear on left side (arrows pointing right)
- Bottom prompt: "Tap a row to clear it"
- Tap row -> horizontal wave sweep -> row cleared
- Cancel: tap anywhere outside grid

---

## 7. Animation & Effects

### 7.1 Line Clear

1. **Detection**: Full row detected after gravity
2. **Flash**: All blocks in row turn white (0.1s)
3. **Sweep**: Horizontal wipe left-to-right (0.15s)
4. **Burst**: 20-30 particles per block, radial burst, theme block colors
5. **Collapse**: Blocks above fall with easeOutBounce (0.3s)
6. **Score popup**: "+10" text floats up from cleared row (0.5s, fades out)

### 7.2 Combo Celebration

| Combo | Text | Size | Color | Shake | Particles |
|-------|------|------|-------|-------|-----------|
| 2x | "2x COMBO" | 32px | Yellow | None | 30 |
| 3x | "3x COMBO" | 40px | Orange | None | 50 |
| 4x | "4x COMBO!" | 48px | Red | 2px | 80 |
| 5x | "5x COMBO!!" | 56px | Purple | 4px | 120 |
| 6+ | "INCREDIBLE!" | 64px | Rainbow | 6px | 200 |

- Text: center screen, scales up 0.8->1.2->1.0 over 0.5s, then fades (0.3s)
- Particles: radial burst from center, gravity-affected, 0.8s lifetime
- Shake: horizontal oscillation, dampening over duration
- Sound: pitch increases with combo level

### 7.3 Boss Intro

1. Screen dims to 50% (0.3s)
2. Boss portrait slides down from top (0.5s, easeOutBack)
3. Boss name fades in below portrait (0.3s delay)
4. Constraint badges appear one by one (0.2s each, scale in)
5. CUBE bonus text fades in
6. "FIGHT" button pulses into view
7. Background: slow-moving embers/particles

### 7.4 Boss Defeat

1. Grid freezes
2. Boss portrait shatters (sprite breaks into triangular shards, explode outward)
3. "+30 CUBE" text scales up center (1.0s)
4. Gold coin burst (100 particles)
5. Transition to Level-Up Selection (1.5s total)

### 7.5 Level Transition

1. Current grid fades out (0.3s)
2. Level number increments with counter animation
3. New level constraints appear (badges animate in)
4. New grid fades in (0.3s)
5. Total transition: ~1.0s

### 7.6 Cube Earning

- Single coin: sprite flies from source to CUBE counter in header, arc trajectory
- Multiple coins: staggered (50ms apart), spread in a fan pattern
- Counter: number ticks up with each coin arrival
- Sound: "clink" per coin, ascending pitch

### 7.7 Star Rating

- Each star: starts at 0 scale, grows to 1.2, bounces to 1.0 (easeOutBack, 0.3s)
- Gold particle burst around star on fill
- Sound: ascending chime per star
- Empty star: same animation but gray, no particles, no sound

### 7.8 Performance Considerations

All animations use PixiJS native features:
- **Particles**: ref-based, imperatively updated via `useTick` — no React re-renders
- **Tweens**: GSAP or custom lerp functions targeting sprite properties directly
- **Screen shake**: container position offset via ref, not state
- **Text popups**: pooled text sprites, reused across animations
- **Textures**: pre-loaded via asset catalog, cached by theme
- Target: 60fps on mid-range mobile (iPhone 12, Pixel 6)

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| Device | Width | uiScale | Behavior |
|--------|-------|---------|----------|
| Small phone | < 360px | 0.8 | Compact spacing, smaller fonts |
| Phone (baseline) | 375px | 1.0 | Default layout |
| Large phone | 414px | 1.1 | Slightly larger elements |
| Tablet portrait | 768px | 1.5 (capped) | Wider margins, centered content |
| Tablet landscape | 1024px | 1.5 (capped) | Same as portrait, extra side margins |
| Desktop | 1440px+ | 1.5 (capped) | Centered max-width container |

### 8.2 Layout Rules

**Play Screen (all devices)**:
- Grid is always centered, max 8 x blockSize wide
- `blockSize = floor(min(availableWidth, availableHeight * 0.75) / 8)`
- On wide screens: decorative theme background fills sides
- HUD and action bar stretch to match grid width, not screen width
- NO side panels ever. Desktop = phone layout centered with theme art around it.

**Hub Screen**:
- Content max-width: 480px (prevents stretching on tablet/desktop)
- Tiles maintain aspect ratio, reflow into grid
- On wide screens: hub sits in a centered card over decorative background

**Map Screen**:
- Background image covers full screen
- Nodes positioned via normalized coordinates (0-1 range), scaled to actual screen
- On wide screens: map zooms slightly to fill, nodes scale proportionally

**Shop / Quests / Profile**:
- Scrollable single-column layout
- Content max-width: 480px
- Cards maintain consistent padding

### 8.3 Orientation

- **Portrait**: primary, designed for this
- **Landscape phone**: supported but grid becomes smaller (limited by height). Action bar moves to side. Not optimized.
- **Landscape tablet**: same as portrait with wider margins

---

## 9. Contract -> UI Mapping

Complete mapping of contract data to UI elements.

### Game Model

| Contract Field | Type | UI Element | Screen |
|---------------|------|-----------|--------|
| `Game.blocks` | felt252 (240 bits) | 8x10 grid rendering | Play |
| `Game.next_row` | u32 (24 bits) | Next row preview (dimmed, below grid) | Play |
| `Game.combo_counter` | u8 | Combo overlay ("3x COMBO") | Play |
| `Game.max_combo` | u8 | Level complete breakdown | Level Complete |
| `Game.run_data` | felt252 | (see RunData below) | Multiple |
| `Game.over` | bool | Triggers Game Over screen | Play -> Game Over |
| `Game.level_stars` | felt252 (100 bits) | Star display on map nodes | Map |

### RunData (unpacked from Game.run_data)

| Field | Bits | UI Element | Screen |
|-------|------|-----------|--------|
| `current_level` | 8 | Level number in HUD, map position | Play, Map |
| `level_score` | 8 | Score display (vs GameLevel.points_required) | Play HUD |
| `level_moves` | 8 | Moves used (max - used = remaining) | Play HUD |
| `constraint_progress` | 8 | Constraint badge 1 progress | Play HUD |
| `constraint_2_progress` | 8 | Constraint badge 2 progress | Play HUD |
| `constraint_3_progress` | 8 | Constraint badge 3 progress | Play HUD |
| `bonus_used_this_level` | 1 | NoBonusUsed constraint tracking | Internal |
| `combo_count` | 8 | Combo bonus charge counter | Action bar |
| `score_count` | 8 | Score bonus charge counter | Action bar |
| `harvest_count` | 8 | Harvest bonus charge counter | Action bar |
| `wave_count` | 8 | Wave bonus charge counter | Action bar |
| `supply_count` | 8 | Supply bonus charge counter | Action bar |
| `cubes_brought` | 16 | Bridging display | Shop |
| `cubes_spent` | 16 | Available cubes calc | Shop |
| `total_cubes` | 16 | Total earned display | Summary screens |
| `total_score` | 16 | Run total score | Summary screens |
| `run_completed` | 1 | Victory trigger | Game Over -> Victory |
| `selected_bonus_1/2/3` | 3 each | Equipped bonus icons | Action bar, Hub |
| `bonus_1/2/3_level` | 2 each | Bonus level indicator (I/II/III) | Action bar, Shop |
| `unallocated_charges` | varies | "+N" allocate button | Play action bar |
| `boss_level_up_pending` | 1 | Triggers Level-Up Selection | After boss |
| `shop_level_up_bought` | 1 | Gray out LevelUp in shop | In-Game Shop |
| `shop_swap_bought` | 1 | Gray out SwapBonus in shop | In-Game Shop |
| `shop_purchases` | 4 | BonusCharge cost calculation | In-Game Shop |
| `max_combo_run` | 8 | Run summary best combo | Game Over |

### GameLevel Model (synced via Torii)

| Field | UI Element | Screen |
|-------|-----------|--------|
| `level` | Level number validation | Play |
| `points_required` | Score target in HUD | Play |
| `max_moves` | Max moves for "remaining" calc | Play |
| `difficulty` | (internal, affects block generation) | — |
| `constraint_type` | Constraint badge 1 icon | Play HUD |
| `constraint_value` | Constraint badge 1 target value | Play HUD |
| `constraint_count` | Constraint badge 1 required count | Play HUD |
| `constraint_2_type/value/count` | Constraint badge 2 | Play HUD |
| `constraint_3_type/value/count` | Constraint badge 3 | Play HUD |
| `cube_3_threshold` | 3-star moves threshold | Level Complete |
| `cube_2_threshold` | 2-star moves threshold | Level Complete |

### PlayerMeta Model

| Field | UI Element | Screen |
|-------|-----------|--------|
| `best_level` | Profile stat, map unlock boundary | Profile, Map |
| `data` -> starting charges | Loadout starting charge counts | Loadout |
| `data` -> bag sizes | (max capacity for bonuses) | Internal |
| `data` -> wave_unlocked | Wave availability in loadout | Loadout |
| `data` -> supply_unlocked | Supply availability in loadout | Loadout |
| `data` -> bridging_rank | Max cubes slider in loadout | Loadout |

### GameSeed Model

| Field | UI Element | Screen |
|-------|-----------|--------|
| `seed` | Boss identity derivation (seed % 10 + 1) | Boss Intro |

---

## 10. Asset Requirements Summary

Quick reference of all assets needed. Full specifications in `ASSETS.md`.

### Per-Theme Assets (x 10 themes)

| Asset | Format | Purpose |
|-------|--------|---------|
| Map background | PNG, 750x1600 | Campaign map zone background (per-theme) |
| Grid background | PNG, tile | Play screen grid background |
| Block sprites (4 sizes) | PNG, 64x64 | Block rendering in grid |
| Block glow variants | PNG, 64x64 | Selected/highlighted blocks |
| Theme ambient particles | Spritesheet | Background atmosphere |

### Global Assets

| Asset | Format | Purpose |
|-------|--------|---------|
| Constraint icons (7) | PNG, 64x64 | ClearLines, BreakBlocks, AchieveCombo, FillAndClear, NoBonusUsed, ClearGrid, None |
| Bonus icons (5) | PNG, 64x64 | Combo, Score, Harvest, Wave, Supply |
| Bonus icons locked (2) | PNG, 64x64 | Wave locked, Supply locked |
| Boss portraits (10) | PNG, 256x256 | Boss intro screen |
| Boss defeat shards | Spritesheet | Boss defeat shatter animation |
| Star icons (filled, empty) | PNG, 32x32 | Star rating |
| CUBE coin icon | PNG, 32x32 | Currency display |
| Menu icon | PNG, 44x44 | HUD menu button |
| Navigation icons | PNG, 44x44 | Home, back, settings, sound |
| Hub tile backgrounds (6) | PNG, various | Continue, New Run, Daily, Shop, Quests, Profile |
| Consumable icons (3) | PNG, 64x64 | BonusCharge, LevelUp, SwapBonus |
| Line clear particles | Spritesheet | Line clear effects |
| Combo particles | Spritesheet | Combo celebration |
| Coin particles | Spritesheet | Cube earning animation |
| Confetti particles | Spritesheet | Victory celebration |
| Tutorial hand gesture | PNG, animated | Onboarding swipe indicator |

### Audio

| Asset | Format | Purpose |
|-------|--------|---------|
| Theme BGM (10 themes) | OGG | Background music per theme |
| Boss BGM | OGG | Boss level music |
| Victory fanfare | OGG | Run complete |
| Block slide | OGG | Block movement |
| Line clear | OGG | Row cleared |
| Combo hit (5 levels) | OGG | Combo counter increment |
| Star earned | OGG | Level complete star |
| Coin clink | OGG | Cube earned |
| Boss intro sting | OGG | Boss level entrance |
| Boss defeat | OGG | Boss shatter |
| Button tap | OGG | UI interaction |
| Bonus activate | OGG | Bonus used |
| Shop purchase | OGG | Item bought |
| Quest claim | OGG | Quest reward claimed |

---

## Appendix A: Constraint Icon Reference

| Type | Icon Description | Badge Behavior |
|------|-----------------|---------------|
| **ClearLines** | Three horizontal lines with sparkle on top line | Ring fills as "X/Y times" progress. Value shown as line count inside icon. |
| **BreakBlocks** | Cube with crack/fracture lines | Ring fills as blocks broken. Value shown as block size target. |
| **AchieveCombo** | Chain links (or lightning bolt) | Ring fills to full when combo reached. One-shot (either done or not). |
| **FillAndClear** | Upward arrow reaching a horizontal target line | Ring fills as fill events counted. Value = target row height. |
| **NoBonusUsed** | Star with diagonal strike-through | No progress ring. Binary: shows checkmark (still valid) or X (violated). Green while maintained, red if bonus used. |
| **ClearGrid** | Empty grid outline (clean/sparkle) | No progress ring. Binary: shows when grid fully cleared. |
| **None** | (no badge displayed) | — |

## Appendix B: Bonus Icon Reference

| Bonus | Icon Description | Color Theme |
|-------|-----------------|------------|
| **Combo** | Interlocking chain links / lightning arcs | Electric blue |
| **Score** | Rising star with score trails | Bright gold |
| **Harvest** | Scythe / crescent blade | Nature green |
| **Wave** | Horizontal wave / tsunami line | Ocean teal |
| **Supply** | Plus symbol with block outlines | Warm amber |

## Appendix C: Boss Visual Identity

Each boss gets a unique portrait and color accent for their intro screen.

| ID | Name | Portrait Concept | Accent Color |
|----|------|-----------------|-------------|
| 1 | Combo Master | Figure wreathed in chain lightning | Electric blue |
| 2 | Demolisher | Armored brute with wrecking ball | Dark red |
| 3 | Daredevil | Acrobat on a flaming tightrope | Hot orange |
| 4 | Purist | Zen monk with empty hands | Silver/white |
| 5 | Harvester | Cloaked figure with giant scythe | Dark green |
| 6 | Tidal | Water elemental with crashing waves | Deep ocean |
| 7 | Stacker | Tower of blocks forming a golem | Stone gray |
| 8 | Surgeon | Masked figure with precise instruments | Clinical teal |
| 9 | Ascetic | Floating meditator, no possessions | Pale gold |
| 10 | Perfectionist | Crowned figure atop a flawless grid | Royal purple |

## Appendix D: State Machine Reference

The gameplay animation state machine drives all visual transitions:

```
WAITING --(player swipes)--> GRAVITY
GRAVITY --(blocks settled)--> LINE_CLEAR
LINE_CLEAR --(lines cleared)--> ADD_LINE
ADD_LINE --(new row added)--> GRAVITY2
GRAVITY2 --(blocks settled)--> LINE_CLEAR2
LINE_CLEAR2 --(lines cleared)--> UPDATE_AFTER_MOVE
UPDATE_AFTER_MOVE --(state synced)--> WAITING
```

Each state has:
- **Entry action**: start animation/effect
- **Duration**: fixed or animation-dependent
- **Exit condition**: animation complete or timer elapsed
- **Data update**: which contract fields change

| State | Duration | Animation | Contract Update |
|-------|----------|-----------|----------------|
| GRAVITY | ~0.3s | Blocks fall with easeOutBounce | None (visual only) |
| LINE_CLEAR | ~0.5s | Flash -> sweep -> particles | `Game.blocks` updated |
| ADD_LINE | ~0.2s | New row slides up from preview | `Game.next_row` consumed |
| GRAVITY2 | ~0.3s | Second gravity pass | None (visual only) |
| LINE_CLEAR2 | ~0.5s | Second line clear pass (cascades) | `Game.blocks` updated |
| UPDATE_AFTER_MOVE | ~0.1s | Score/moves/combo counters update | `Game.run_data` updated |
