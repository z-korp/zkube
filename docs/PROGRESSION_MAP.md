# Progression Map — Design & Implementation Plan

## Overview

Replace the current "level complete → modal → next level" flow with a **Super Mario World-style progression map** that visualizes the player's journey through 5 themed zones, 50 gameplay levels, and 5 shop stops.

## Map Structure

```
Zone 1 (Ocean)          Zone 2 (Forest)         Zone 3 (Desert)         Zone 4 (Arctic)         Zone 5 (Lava)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ L1─L2─L3─L4─L5  │    │ L11─L12─L13─L14 │    │ L21─L22─L23─L24│    │ L31─L32─L33─L34│    │ L41─L42─L43─L44│
│ │               │    │ │               │    │ │               │    │ │               │    │ │               │
│ L6─L7─L8─L9     │    │ L15─L16─L17─L18│    │ L25─L26─L27─L28│    │ L35─L36─L37─L38│    │ L45─L46─L47─L48│
│        │        │    │        │        │    │        │        │    │        │        │    │        │        │
│       SHOP      │    │       SHOP      │    │       SHOP      │    │       SHOP      │    │       SHOP      │
│        │        │    │        │        │    │        │        │    │        │        │    │        │        │
│     ★BOSS★      │    │     ★BOSS★      │    │     ★BOSS★      │    │     ★BOSS★      │    │     ★BOSS★      │
│     (L10)       │    │     (L20)       │    │     (L30)       │    │     (L40)       │    │     (L50)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 55 Map Nodes (50 gameplay + 5 shops)

| Per Zone | Type | Contract Levels | Count |
|----------|------|----------------|-------|
| Classic | Gameplay puzzle | 1-9, 11-19, 21-29, 31-39, 41-49 | 9 |
| Shop | Non-gameplay stop | — (frontend only) | 1 |
| Boss | Gameplay puzzle | 10, 20, 30, 40, 50 | 1 |
| **Total** | | | **11 nodes/zone** |

### Node Numbering

Contract levels 1-50 are ALL gameplay. Shop nodes have no contract level — they're purely a map stop between the 9th classic and the boss.

```
Map Node:      1   2   3   4   5   6   7   8   9   SHOP  BOSS
Contract Lvl:  1   2   3   4   5   6   7   8   9   —     10
Zone:          ←─────────────────── Zone 1 ──────────────────→

Map Node:      12  13  14  15  16  17  18  19  20  SHOP  BOSS
Contract Lvl:  11  12  13  14  15  16  17  18  19  —     20
Zone:          ←─────────────────── Zone 2 ──────────────────→
```

## Zone Themes

5 themes are **seeded from VRF** — each run picks 5 of the 10 existing themes without replacement.

### Existing Themes (10 available)
Tiki, Cosmic, Neon, Ocean, Forest, Desert, Arctic, Lava, Candy, Steampunk

### Theme Derivation Algorithm
```
zone_seed = poseidon(game_seed, 'ZONE_THEMES')
Fisher-Yates shuffle first 5 positions of the 10-theme array using zone_seed
Zone 1 = shuffled[0], Zone 2 = shuffled[1], ..., Zone 5 = shuffled[4]
```

This is **frontend-only** — the contract has no concept of zones or themes. Both `mobile-app` and `client-budokan` must produce identical results from the same seed.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Total nodes | 55 (50 gameplay + 5 shops) | All 50 puzzle levels preserved |
| Map style | Super Mario World node path | Classic, proven UX |
| Zone themes | Seeded from VRF (5 of 10) | Every run feels different |
| Post-level flow | Brief rewards → map screen | Clean separation of concerns |
| Level preview | Progressive reveal | Next=full, future=difficulty only |
| Cleared level tap | View stats (no replay) | Simple, avoids contract complexity |
| Boss mechanics | Enhanced (deferred to Phase 5) | Ship map first, enhance bosses later |
| Boss preview | Show mechanics (placeholder text OK) | Player knows what they're getting into |
| Map visibility | Full map visible, locked zones dimmed/foggy | Player sees the journey ahead |
| Contract changes | Full stack | Shop trigger changes from every-5 to 9/19/29/39/49 |
| Namespace | Keep `zkube_budo_v1_2_0` (no bump) | Same deployment, surgical change |
| Target app | `mobile-app` only | `client-budokan` will be dropped |
| Map state | On-chain (no extra persistence needed) | `current_level` + seed = full map state |
| Animations | Simple for now | Iterate later |

## Contract Changes

### 1. Shop Trigger (REQUIRED)

**Current**: Shop available every 5 levels (`(current_level - 1) % 5 == 0`)
**New**: Shop available after levels 9, 19, 29, 39, 49 (`level % 10 == 9` but expressed as `(current_level - 1) % 10 == 9`)

Wait — the contract checks `(run_data.current_level - 1) % 5 == 0`. After completing level 9, `current_level` becomes 10. So the contract check becomes:

```
current_level is 10 (just completed level 9, now ON level 10)
(10 - 1) % 10 == 9 → true → shop available ✓

current_level is 20 (just completed level 19, now ON level 20)
(20 - 1) % 10 == 9 → true → shop available ✓
```

#### Files to change

| File | Current | New |
|------|---------|-----|
| `contracts/src/systems/shop.cairo:397` | `(run_data.current_level - 1) % 5 == 0` | `(run_data.current_level - 1) % 10 == 9` |
| `mobile-app/src/dojo/game/helpers/runDataPacking.ts:247` | `level % 5 === 0` | `level > 0 && level % 10 === 9` |
| `mobile-app/src/pixi/hooks/usePlayGame.ts:544` | Uses `isInGameShopAvailable()` | No change (uses function) |
| `client-budokan/src/dojo/game/helpers/runDataPacking.ts:247` | `level % 5 === 0` | `level > 0 && level % 10 === 9` |
| `client-budokan/src/ui/screens/Play.tsx:434` | Uses `isInGameShopAvailable()` | No change (uses function) |
| `client-budokan/src/ui/components/LevelCompleteDialog.tsx:122` | Uses `isInGameShopAvailable()` | No change (uses function) |

Also update the `isShopLevel()` helper (the "level right after a shop"):
```
Current: level > 1 && (level - 1) % 5 === 0  (levels 6, 11, 16...)
New:     level > 0 && level % 10 === 0        (levels 10, 20, 30... — the boss levels)
```

#### Test changes
- `runDataPacking.test.ts`: Update `isInGameShopAvailable` expectations
  - `true` for: 9, 19, 29, 39, 49
  - `false` for: 5, 10, 15, 20, 25
- `runDataPacking.test.ts`: Update `isBossLevel` expectations (unchanged — still 10, 20, 30, 40, 50)

### 2. No `run_data` Changes

Zones and themes are purely visual (frontend-only). The contract doesn't need zone awareness. The 55 remaining bits in `run_data` stay reserved.

### 3. Boss Enhancements (DEFERRED)

Enhanced boss mechanics will be a separate contract iteration. For now, boss levels keep their existing dual-constraint + bonus-cube behavior.

## Frontend Changes (mobile-app)

### New Files

| File | Purpose |
|------|---------|
| `pixi/utils/mapLayout.ts` | Map node ↔ contract level mapping utility |
| `pixi/utils/zoneThemes.ts` | Zone theme derivation from seed |
| `pixi/components/map/MapScreen.tsx` | Main map PixiJS component |
| `pixi/components/map/MapNode.tsx` | Individual node (classic/shop/boss) |
| `pixi/components/map/MapPath.tsx` | Dotted path between nodes |
| `pixi/components/map/ZoneBackground.tsx` | Zone-specific themed background |
| `pixi/components/map/LevelPreview.tsx` | Level info overlay on node tap |
| `pixi/components/map/RewardsSummary.tsx` | Brief rewards display after level clear |
| `pixi/hooks/useMapData.ts` | Generate all 55 node configs from seed |
| `pixi/hooks/useMapNavigation.ts` | Map scroll, zoom, focus logic |

### Modified Files

| File | Change |
|------|--------|
| `pixi/hooks/usePlayGame.ts` | Add `onLevelComplete` callback that returns to map |
| `pixi/components/pages/PlayScreen.tsx` | Support "return to map" after brief rewards |
| `pixi/components/pages/index.ts` | Export `MapScreen` |
| `pixi/components/pages/PageNavigator.tsx` | Add `'map'` page ID |
| `pixi/components/pages/MainScreen.tsx` | Render `MapScreen` page |
| `ui/screens/PlayNew.tsx` | Pass map navigation callbacks |
| `App.tsx` | Add `/map/:gameId` route |
| `dojo/game/helpers/runDataPacking.ts` | Change `isInGameShopAvailable()` |
| `dojo/game/helpers/runDataPacking.test.ts` | Update shop trigger tests |
| `pixi/utils/colors.ts` | Ensure all 10 themes have map-compatible color palettes |

### MapLayout Utility (`pixi/utils/mapLayout.ts`)

Single source of truth for all numbering conversions.

```typescript
// Types
type NodeType = 'classic' | 'shop' | 'boss';

interface MapNode {
  nodeIndex: number;        // 0-54 (55 total nodes)
  zone: number;             // 1-5
  nodeInZone: number;       // 0-10 (11 nodes per zone)
  type: NodeType;
  contractLevel: number | null;  // null for shop nodes
  difficulty?: Difficulty;
  displayLabel: string;     // "1-1", "1-SHOP", "1-BOSS"
}

// Constants
const NODES_PER_ZONE = 11;
const CLASSIC_PER_ZONE = 9;
const TOTAL_ZONES = 5;
const TOTAL_NODES = 55;

// Core functions
function getMapNode(nodeIndex: number): MapNode;
function contractLevelToNodeIndex(contractLevel: number): number;
function nodeIndexToContractLevel(nodeIndex: number): number | null;
function getZone(contractLevel: number): number;
function getNodesForZone(zone: number): MapNode[];
function getNodeType(nodeIndex: number): NodeType;
function isShopNode(nodeIndex: number): boolean;
function isBossNode(nodeIndex: number): boolean;
```

### Zone Theme Derivation (`pixi/utils/zoneThemes.ts`)

```typescript
import { hash } from 'starknet';
import { THEME_IDS } from './colors';

function deriveZoneThemes(seed: bigint): string[] {
  const zoneSeed = BigInt(hash.computePoseidonHashOnElements([
    seed,
    BigInt('0x5a4f4e455f5448454d4553'),  // 'ZONE_THEMES'
  ]));

  // Fisher-Yates shuffle (first 5 positions)
  const themes = [...THEME_IDS];
  for (let i = 0; i < 5; i++) {
    const stepSeed = BigInt(hash.computePoseidonHashOnElements([zoneSeed, BigInt(i)]));
    const remaining = themes.length - i;
    const j = i + Number(stepSeed % BigInt(remaining));
    [themes[i], themes[j]] = [themes[j], themes[i]];
  }

  return themes.slice(0, 5);
}
```

### Map Screen Component Architecture

```
MapScreen (PixiJS Application)
├── ZoneBackground (themed per zone, parallax scroll)
├── MapPath (dotted lines connecting nodes)
├── MapNodes (55 interactive nodes)
│   ├── ClassicNode (circle, star rating, difficulty color)
│   ├── ShopNode (bag/store icon, zone-colored)
│   └── BossNode (larger, skull/crown icon, glow effect)
├── CurrentMarker (animated player avatar on current node)
├── LevelPreview (overlay panel on node tap)
│   ├── Full details (next level)
│   ├── Difficulty only (future levels in current zone)
│   └── Locked/dimmed (future zones)
├── RewardsSummary (brief post-level overlay)
│   ├── Stars earned
│   ├── Cubes earned
│   ├── Bonus awarded
│   └── Auto-dismiss after 2s
└── NavigationControls
    ├── Scroll/pan (touch drag)
    ├── Zone jump buttons (tap zone indicator to jump)
    └── "Play" button (on current/next node)
```

### Post-Level Flow (New)

```
Current Flow:
  Level complete → LevelCompleteModal (tap Continue) → InGameShopModal (if applicable) → next level plays

New Flow:
  Level complete → Brief rewards overlay (2s, auto-dismiss or tap) → Map screen
    → Map shows completed node lit up, stars, cubes
    → Current marker advances to next node
    → If next is SHOP: tap shop node → shop screen → tap continue → marker advances to boss
    → If next is BOSS: tap boss node → "Play" → enters boss level
    → If next is CLASSIC: tap next node → "Play" → enters next level
```

### Node States

| State | Visual | Interaction |
|-------|--------|-------------|
| Locked | Dimmed, no detail, grey | None |
| Available (next) | Glowing, pulsing, highlighted | Tap → level preview + "Play" button |
| Cleared (1 star) | Lit, 1 star | Tap → view stats |
| Cleared (2 stars) | Lit, 2 stars | Tap → view stats |
| Cleared (3 stars) | Lit, 3 stars, sparkle | Tap → view stats |
| Current (in progress) | Animated marker | Auto-focused |
| Shop (available) | Store icon, glowing | Tap → opens shop |
| Shop (visited) | Store icon, checkmark | Tap → view purchases |
| Boss (locked) | Skull icon, dark | None |
| Boss (available) | Skull icon, glowing, fire | Tap → boss preview + "Play" |
| Boss (cleared) | Crown icon, gold | Tap → view stats |

### Level Preview Content (Progressive Reveal)

| Level Relationship | Info Shown |
|-------------------|------------|
| Next level | Difficulty, target score, max moves, constraints (full detail), cube thresholds |
| Same zone (future) | Difficulty tier only ("Hard", "Expert") |
| Future zone (locked) | Zone theme name + "Locked" |
| Cleared level | Stats: score, stars, cubes earned, moves used |

## Implementation Phases

### Phase 1: Contract + Data Layer ✅ COMPLETED
**Goal**: Change shop trigger, create MapLayout utility, zone theme derivation
**Scope**: No UI changes
**Verification**: `scarb test`, `pnpm test`, `pnpm build`

- [x] Change shop trigger in `shop.cairo` (`(current_level - 1) % 10 == 9`)
- [x] Change `isInGameShopAvailable()` in `runDataPacking.ts` (mobile-app only, client-budokan being dropped)
- [x] Change `isShopLevel()` in `runDataPacking.ts` (mobile-app only)
- [x] Update tests in `runDataPacking.test.ts`
- [x] Create `pixi/utils/mapLayout.ts` with all mapping functions
- [x] Create `pixi/utils/zoneThemes.ts` with seed-based theme derivation
- [x] Create `pixi/hooks/useMapData.ts` that generates all 55 node configs from seed
- [x] Write unit tests for mapLayout (node ↔ level conversions)
- [x] Write unit tests for zoneThemes (determinism: same seed → same themes)
- [x] `scarb test` passes
- [x] `pnpm build` passes (mobile-app)
- [x] `pnpm vitest run` passes (mobile-app)

### Phase 2: Map Screen (Static) ✅ COMPLETED
**Goal**: Render the map with all 55 nodes, paths, zone backgrounds
**Scope**: New component, no flow integration yet

- [x] Create `MapPage.tsx` — Full scrollable vertical map
- [x] Create `MapNode.tsx` — render classic/shop/boss node by state
- [x] Create `MapPath.tsx` — Bezier curves between nodes
- [x] Create `ZoneBackground.tsx` — themed gradient background per zone
- [x] Create `LevelPreview.tsx` — Modal overlay on node tap
- [x] Wire `useMapData` hook to populate all nodes from seed
- [x] Implement node tap → preview overlay
- [x] Implement scroll/pan for navigating between zones
- [x] Add `'map'` to PageNavigator and MainScreen
- [x] Test: map renders correctly with mock game data
- [x] Test: all 55 nodes visible with correct types
- [x] Test: zone themes apply correctly

### Phase 3: Flow Integration ✅ COMPLETED
**Goal**: Connect map to gameplay loop (level complete → map → next level)
**Scope**: Modify PlayScreen, add navigation

- [x] Modify `usePlayGame.ts` — added `seed`, `showMapView`, `handleMapContinue`
- [x] Modify `PlayScreen` post-level flow: level complete → MapPage overlay
- [x] MapPage supports `standalone`/`onBack` props for overlay mode
- [x] Implement "Play" button on current/next node → continues gameplay
- [x] Test: complete level → see map → continue to next level

### Phase 4: Polish & Animations ✅ COMPLETED
**Goal**: Make the map feel alive and polished

- [x] Current level marker animation (pulsing scale via `usePulseRef`)
- [x] Boss node special effects (rotating golden dashed ring)
- [x] Shop node special effects (floating Y-axis bob)
- [x] Staggered node reveal (30ms per node radiating from current position)
- [x] Active path animation (ant-trail dots moving along paths)
- [x] Cleared path animation (alpha shimmer)
- [x] Locked path animation (static dashed)
- [x] LevelPreview slide-up + fade-in entrance
- [ ] Sound effects for node interactions (deferred — needs assets)
- [ ] Zone unlock animation (deferred)
- [ ] Star rating display on cleared nodes (deferred)

### Phase 4.5: MyGames → Map Wiring ✅ COMPLETED
**Goal**: Wire map into the game selection flow

- [x] `Home.tsx` — `selectedGameId` state + `useGame` hook for seed
- [x] `MainScreen.tsx` — `requestMapNavigation`/`onMapNavigated` props
- [x] Auto-navigate to `'map'` page when seed becomes available
- [x] `handlePlayLevel` navigates to `/play/{gameId}` from map

### Phase 5: Enhanced Bosses (DEFERRED — separate iteration)
**Goal**: Make boss levels mechanically unique

- [ ] Design boss mechanics per zone (TBD)
- [ ] Contract changes for boss-specific rules
- [ ] Boss intro screen/animation
- [ ] Boss-specific grid layouts
- [ ] Boss defeat celebration

## Callsite Inventory

All locations that reference shop/boss trigger logic:

### Shop Trigger (`isInGameShopAvailable`)
| File | Line | Type |
|------|------|------|
| `contracts/src/systems/shop.cairo` | 397 | Cairo assertion (CHANGE) |
| `mobile-app/src/dojo/game/helpers/runDataPacking.ts` | 247 | TS function (CHANGE) |
| `mobile-app/src/dojo/game/helpers/runDataPacking.test.ts` | 129-133 | Tests (UPDATE) |
| `mobile-app/src/pixi/hooks/usePlayGame.ts` | 544 | Consumer (no change — calls function) |

### Boss Detection (`isBossLevel`)
| File | Line | Type |
|------|------|------|
| `contracts/src/helpers/level.cairo` | 50-52 | Cairo function (NO CHANGE) |
| `contracts/src/helpers/level.cairo` | 133 | Consumer (NO CHANGE) |
| `mobile-app/src/dojo/game/helpers/runDataPacking.ts` | 263-264 | TS function (NO CHANGE) |
| `mobile-app/src/dojo/game/helpers/runDataPacking.test.ts` | 121-126 | Tests (NO CHANGE) |
| `mobile-app/src/dojo/game/types/level.ts` | 685 | TS function (NO CHANGE) |
| `mobile-app/src/dojo/game/types/level.ts` | 818 | Consumer (NO CHANGE) |

> Note: `client-budokan` callsites omitted — that app is being dropped.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Shop trigger change breaks active mainnet games | HIGH | Keep same namespace; deploy during low-activity window |
| Zone theme mismatch between Cairo and TS | LOW | Frontend-only (no Cairo needed for themes) |
| Map scroll performance with 55 animated nodes | MEDIUM | Cull off-screen nodes, limit particles |
| Post-level flow race condition (rewards + map nav) | MEDIUM | State machine with explicit transitions |
| Level preview data stale after contract update | LOW | Re-derive from seed on map mount |
| Mobile touch conflicts (scroll vs tap node) | MEDIUM | Require tap-and-hold for scroll, single tap for node |

## Resolved Questions

| Question | Answer |
|----------|--------|
| Namespace version bump? | No — keep `zkube_budo_v1_2_0` |
| Which app gets the map? | `mobile-app` only (`client-budokan` being dropped) |
| Map state persistence? | On-chain — `current_level` + seed deterministically defines full map state |
| Zone unlock animation? | Simple fade/dim for now, iterate later |
| Boss preview mechanics? | Yes, show them (placeholder text OK until Phase 5) |
