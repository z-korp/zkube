# Wire On-Chain Progression Data into Client

## Overview

Replace mock/placeholder data in `client-budokan/` with real on-chain state from Dojo RECS models (`PlayerMeta`, `PlayerBestRun`, `GameSettingsMetadata`) and an ERC20 balance query (`zStar`). Contracts are **READ-ONLY** — all changes are client-side.

## Goals

- Unpack `PlayerMeta.data` for `total_runs`, `daily_stars`, `lifetime_xp`
- Create `useZStarBalance` hook for soul-bound zStar ERC20 balance
- Create `usePlayerBestRun` hook for per-zone star progress
- Build `useZoneProgress` aggregate hook combining 4 data sources
- Wire real data into ProfilePage (OverviewTab, zone progress, XP/level, stats)
- Wire real data into HomePage (zone cards with real star counts)

## Non-Goals

- Modify any contract or Cairo code
- Wire quest/achievement data from arcade models (deferred — see Phase 4)
- Implement zone unlock transaction flows (already exist in `systems.ts`)
- Create new UI components (only wire existing components with real data)
- Replace `RECENT_ACTIVITY` mock data (no contract source exists)
- Replace `XP_PER_STAR`, `LEVEL_THRESHOLDS`, `PLAYER_TITLES` (keep as client-side derivation constants)

## Assumptions and Constraints

- **READ-ONLY contracts**: All changes confined to `client-budokan/`
- **Torii streams all world models**: Even models not in `modelsToSync` reach RECS via subscription. Adding them to `modelsToSync` ensures initial batch loading.
- **zStar DECIMALS=0**: Balance is a whole number, no decimal formatting needed
- **Metagame SDK API unknown**: Quest/achievement wiring deferred until SDK API is investigated
- **Arcade models are deployed**: Confirmed in `manifest_slot.json` — `QuestDefinition`, `AchievementDefinition`, etc. exist on-chain and Torii indexes them

## Requirements

### Functional

- **F1**: ProfilePage header shows real `lifetime_xp` (not `totalStars × XP_PER_STAR` proxy)
- **F2**: ProfilePage header shows real zStar balance (★ count)
- **F3**: OverviewTab stats grid shows real `total_runs` for "Games" count
- **F4**: Zone progress cards show per-zone star counts from `PlayerBestRun.best_stars`
- **F5**: Zone progress cards show real `star_cost` and `price` from `GameSettingsMetadata`
- **F6**: Zone unlock discount calculation uses real zStar balance
- **F7**: HomePage zone cards show real zone star progress and unlock status

### Non-Functional

- **NF1**: No new network requests — all data via existing Torii subscription + one ERC20 `balance_of` RPC call
- **NF2**: All bit-unpacking logic has unit tests matching Cairo packing exactly
- **NF3**: Hooks follow existing patterns (`normalizeEntityId`, `useComponentValue`, `useDeepMemo`)

---

## Technical Design

### Data Flow Architecture

```
                         ┌──────────────────────────┐
                         │    Torii (Indexer)        │
                         │                          │
                         │  Streams all world model  │
                         │  updates via subscription │
                         └─────────┬────────────────┘
                                   │
                          getSyncEntities()
                                   │
                    ┌──────────────▼──────────────┐
                    │       RECS Store             │
                    │                              │
                    │  PlayerMeta (NEW in sync)    │
                    │  PlayerBestRun (NEW model)   │
                    │  GameSettingsMetadata (+star_cost)│
                    │  MapEntitlement (existing)   │
                    │  Game, GameSeed, etc.        │
                    └──────────────┬───────────────┘
                                   │
              useComponentValue / runQuery
                                   │
         ┌─────────────────────────┼──────────────────────┐
         │                         │                      │
  usePlayerMeta()         usePlayerBestRun()      useZoneProgress()
  (extended: unpack       (NEW: query per        (NEW: aggregate
   data field)             zone+mode)              all zone data)
                                                          │
                                                   ┌──────┴──────┐
                                                   │             │
                                              ProfilePage   HomePage
                                              (real stats)  (real zones)

         ┌──────────────────┐
         │  Starknet RPC    │
         │  (via starknet-  │
         │   react)         │
         └────────┬─────────┘
                  │
           useReadContract()
                  │
         useZStarBalance()
         (NEW: ERC20 balance_of)
```

### RECS Model Changes

#### 1. Fix `PlayerMeta` — add `last_active`

**File**: `src/dojo/contractModels.ts`

Current:
```typescript
PlayerMeta: defineComponent(world, {
  player: RecsType.BigInt,
  data: RecsType.BigInt,
  best_level: RecsType.Number,
}, { metadata: { types: ["ContractAddress", "felt252", "u8"] } })
```

Target:
```typescript
PlayerMeta: defineComponent(world, {
  player: RecsType.BigInt,
  data: RecsType.BigInt,
  best_level: RecsType.Number,
  last_active: RecsType.Number,  // ADD
}, { metadata: { types: ["ContractAddress", "felt252", "u8", "u64"] } })  // ADD "u64"
```

#### 2. Fix `GameSettingsMetadata` — add `star_cost`

**File**: `src/dojo/contractModels.ts`

Add after `payment_token`:
```typescript
star_cost: RecsType.BigInt,  // ADD
// types array: append "u256"
```

#### 3. New `PlayerBestRun` RECS component

**File**: `src/dojo/contractModels.ts`

Cairo model:
```cairo
struct PlayerBestRun {
    #[key] player: ContractAddress,
    #[key] settings_id: u32,
    #[key] mode: u8,
    best_score: u32,
    best_stars: u8,
    best_level: u8,
    map_cleared: bool,
    best_level_stars: felt252,  // 2 bits × 10 levels
    best_game_id: felt252,
}
```

RECS definition:
```typescript
PlayerBestRun: defineComponent(world, {
  player: RecsType.BigInt,
  settings_id: RecsType.Number,
  mode: RecsType.Number,
  best_score: RecsType.Number,
  best_stars: RecsType.Number,
  best_level: RecsType.Number,
  map_cleared: RecsType.Boolean,
  best_level_stars: RecsType.BigInt,
  best_game_id: RecsType.BigInt,
}, {
  metadata: {
    namespace: VITE_PUBLIC_NAMESPACE,
    name: "PlayerBestRun",
    types: ["ContractAddress", "u32", "u8", "u32", "u8", "u8", "bool", "felt252", "felt252"],
  },
})
```

### Bit Packing Specifications

#### MetaData (PlayerMeta.data) — 64 bits

```
Bits 0-15:   total_runs    (u16)  mask: 0xFFFF
Bits 16-31:  daily_stars   (u16)  mask: 0xFFFF
Bits 32-63:  lifetime_xp   (u32)  mask: 0xFFFFFFFF
```

TypeScript (new file `metaDataPacking.ts`):
```typescript
export interface MetaData {
  totalRuns: number;
  dailyStars: number;
  lifetimeXp: number;
}

export function unpackMetaData(packed: bigint): MetaData {
  return {
    totalRuns:  Number((packed >> 0n)  & 0xFFFFn),
    dailyStars: Number((packed >> 16n) & 0xFFFFn),
    lifetimeXp: Number((packed >> 32n) & 0xFFFFFFFFn),
  };
}
```

Matches Cairo `MetaDataPacking::unpack` at `contracts/src/helpers/packing.cairo:291-340`.

#### best_level_stars (PlayerBestRun) — 20 bits

```
Bits (level-1)*2 to (level-1)*2+1: stars for level (0-3)
10 levels × 2 bits = 20 bits total
```

TypeScript (new file `levelStarsPacking.ts`):
```typescript
export function getLevelStars(packed: bigint, level: number): number {
  if (level < 1 || level > 10) return 0;
  const shift = BigInt((level - 1) * 2);
  return Number((packed >> shift) & 0x3n);
}

export function unpackAllLevelStars(packed: bigint): number[] {
  return Array.from({ length: 10 }, (_, i) => getLevelStars(packed, i + 1));
}

export function sumStars(packed: bigint): number {
  return unpackAllLevelStars(packed).reduce((sum, s) => sum + s, 0);
}
```

Matches Cairo `get_best_level_stars` at `contracts/src/models/player.cairo:140-145`.

### Hook Specifications

#### `usePlayerMeta` (EXTEND existing)

**File**: `src/hooks/usePlayerMeta.tsx`

```typescript
export interface PlayerMeta {
  player: string;
  bestLevel: number;
  // NEW fields:
  totalRuns: number;
  dailyStars: number;
  lifetimeXp: number;
  lastActive: number;  // unix timestamp
}
```

Changes:
- Import `unpackMetaData` from `metaDataPacking.ts`
- Unpack `component.data` via `unpackMetaData(BigInt(component.data))`
- Read `component.last_active` for lastActive

#### `useZStarBalance` (NEW)

**File**: `src/hooks/useZStarBalance.ts`

Pattern: Clone `useNftBalance.ts` but use `erc20ABI` and `VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS`.

```typescript
import { useReadContract } from "@starknet-react/core";
import { erc20ABI } from "@/utils/erc20";
import { BlockTag } from "starknet";

const { VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS } = import.meta.env;

export const useZStarBalance = (address: string | undefined) => {
  const { refetch, data: balance, isLoading, isError, error } = useReadContract({
    address: VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS,
    abi: erc20ABI,
    functionName: "balance_of",
    args: address ? [address] : undefined,
    watch: true,
    refetchInterval: 5000,
    blockIdentifier: BlockTag.PENDING,
  });

  return {
    refetch,
    isLoading,
    isError,
    error,
    balance: balance ? Number(BigInt(balance.toString())) : 0,
  };
};
```

Note: Returns `number` not `bigint` since DECIMALS=0 and values are small.

#### `usePlayerBestRun` (NEW)

**File**: `src/hooks/usePlayerBestRun.ts`

Strategy: Use `runQuery([Has(PlayerBestRun)])` to scan all entities, filter by player address. Returns a map keyed by `${settings_id}-${mode}`.

```typescript
export interface PlayerBestRunData {
  settingsId: number;
  mode: number;
  bestScore: number;
  bestStars: number;
  bestLevel: number;
  mapCleared: boolean;
  levelStars: number[];  // unpacked array of 10 star values
  bestGameId: bigint;
}

export const usePlayerBestRun = (playerAddress: string | undefined) => {
  // Uses runQuery([Has(PlayerBestRun)]) + getComponentValue
  // Filters by player address match
  // Unpacks best_level_stars via unpackAllLevelStars()
  // Returns Map<string, PlayerBestRunData> keyed by "settingsId-mode"
};
```

#### `useZoneProgress` (NEW)

**File**: `src/hooks/useZoneProgress.ts`

Aggregate hook combining 4 data sources into `ZoneProgressData[]`:

```typescript
export const useZoneProgress = (
  playerAddress: string | undefined,
  zStarBalance: number,
) => {
  // 1. runQuery([Has(GameSettingsMetadata)]) → all zones with star_cost, price, is_free
  // 2. runQuery([Has(PlayerBestRun)]) filtered by player → per-zone best_stars, map_cleared
  // 3. runQuery([Has(MapEntitlement)]) filtered by player → which zones are unlocked
  // 4. zStarBalance parameter → for discount calculation
  //
  // Returns ZoneProgressData[] matching the existing interface
};
```

This replaces the inline zone calculation currently in `ProfilePage.tsx` (lines 110-134) and `HomePage.tsx`.

### ProfilePage Data Flow (Current vs Target)

| Data Point | Current Source | Target Source |
|---|---|---|
| `xp` | `totalStars × XP_PER_STAR` (proxy) | `PlayerMeta.data → lifetimeXp` |
| `level` | Derived from proxy XP | Derived from real `lifetimeXp` |
| `title` | Derived from proxy level | Derived from real level |
| `totalStars` | `bestLevel × 3` (proxy for zone 1 only) | Sum of `PlayerBestRun.best_stars` across all zones |
| `zones[].stars` | `zoneId === 1 ? zoneStars : 0` (only zone 1) | `PlayerBestRun.best_stars` per zone |
| `zones[].starCost` | `ZONE_UNLOCK_PRICES[zoneId].starCost` (mock) | `GameSettingsMetadata.star_cost` |
| `zones[].ethPrice` | `ZONE_UNLOCK_PRICES[zoneId].ethPrice` (mock) | `GameSettingsMetadata.price` |
| `zones[].unlocked` | `mapEntitlements.has(settingsId)` | Same (already real) |
| `zones[].cleared` | `stars >= 30` | `PlayerBestRun.map_cleared` |
| Stats: Games | `games.length` (owned NFTs) | `PlayerMeta.data → totalRuns` |
| Stats: Best Combo | `"--"` | `"--"` (deferred — requires achievement data) |
| Stats: Lines | `"--"` | `"--"` (deferred — requires achievement data) |
| Stats: Bosses | `"--"` | `"--"` (deferred — requires achievement data) |
| Quests | `QUEST_DEFS` (all mock) | Mock (Phase 4 — deferred) |
| Achievements | `ACHIEVEMENT_DEFS` (all mock) | Mock (Phase 4 — deferred) |
| zStar ★ display | `totalStars` (proxy) | `useZStarBalance` (real ERC20 balance) |

---

## Implementation Plan

### Phase 0: Foundation (Serial — Must Complete First)

**Prerequisite for**: All subsequent phases

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| 0.1 | Add `PlayerBestRun` RECS component to `contractModels.ts` | `src/dojo/contractModels.ts` | New component definition with 9 fields |
| 0.2 | Add `last_active` to `PlayerMeta` RECS component | `src/dojo/contractModels.ts` | Field + type added |
| 0.3 | Add `star_cost` to `GameSettingsMetadata` RECS component | `src/dojo/contractModels.ts` | Field + type added |
| 0.4 | Add `PlayerMeta`, `PlayerBestRun`, `GameSettings` to `modelsToSync` and `modelsToWatch` in `setup.ts` | `src/dojo/setup.ts` | 3 models added to both arrays |
| 0.5 | Create `metaDataPacking.ts` with `unpackMetaData()` + unit tests | `src/dojo/game/helpers/metaDataPacking.ts`, `src/test/metaDataPacking.test.ts` | Tested unpacking function |
| 0.6 | Create `levelStarsPacking.ts` with `getLevelStars()`, `unpackAllLevelStars()`, `sumStars()` + unit tests | `src/dojo/game/helpers/levelStarsPacking.ts`, `src/test/levelStarsPacking.test.ts` | Tested unpacking functions |

**Tests for 0.5** (TDD — write first):
```typescript
describe("unpackMetaData", () => {
  it("unpacks zero data", () => {
    const result = unpackMetaData(0n);
    expect(result).toEqual({ totalRuns: 0, dailyStars: 0, lifetimeXp: 0 });
  });

  it("unpacks total_runs in bits 0-15", () => {
    const packed = 42n; // 42 in bits 0-15
    expect(unpackMetaData(packed).totalRuns).toBe(42);
  });

  it("unpacks daily_stars in bits 16-31", () => {
    const packed = 100n << 16n; // 100 in bits 16-31
    expect(unpackMetaData(packed).dailyStars).toBe(100);
  });

  it("unpacks lifetime_xp in bits 32-63", () => {
    const packed = 5000n << 32n; // 5000 in bits 32-63
    expect(unpackMetaData(packed).lifetimeXp).toBe(5000);
  });

  it("unpacks all fields simultaneously", () => {
    // total_runs=10, daily_stars=20, lifetime_xp=3000
    const packed = 10n | (20n << 16n) | (3000n << 32n);
    expect(unpackMetaData(packed)).toEqual({ totalRuns: 10, dailyStars: 20, lifetimeXp: 3000 });
  });

  it("handles max values", () => {
    const packed = 0xFFFFn | (0xFFFFn << 16n) | (0xFFFFFFFFn << 32n);
    expect(unpackMetaData(packed)).toEqual({ totalRuns: 65535, dailyStars: 65535, lifetimeXp: 4294967295 });
  });
});
```

**Tests for 0.6** (TDD — write first):
```typescript
describe("getLevelStars", () => {
  it("returns 0 for empty packed value", () => {
    expect(getLevelStars(0n, 1)).toBe(0);
  });

  it("extracts stars for level 1 (bits 0-1)", () => {
    expect(getLevelStars(0x3n, 1)).toBe(3); // 3 stars
    expect(getLevelStars(0x2n, 1)).toBe(2); // 2 stars
  });

  it("extracts stars for level 5 (bits 8-9)", () => {
    const packed = 2n << 8n; // 2 stars at level 5
    expect(getLevelStars(packed, 5)).toBe(2);
  });

  it("extracts stars for level 10 (bits 18-19)", () => {
    const packed = 3n << 18n; // 3 stars at level 10
    expect(getLevelStars(packed, 10)).toBe(3);
  });

  it("returns 0 for out-of-range levels", () => {
    expect(getLevelStars(0xFFFFFn, 0)).toBe(0);
    expect(getLevelStars(0xFFFFFn, 11)).toBe(0);
  });
});

describe("unpackAllLevelStars", () => {
  it("unpacks all 10 levels", () => {
    // L1=3, L2=2, L3=1, rest=0
    const packed = 0x3n | (0x2n << 2n) | (0x1n << 4n);
    const stars = unpackAllLevelStars(packed);
    expect(stars).toEqual([3, 2, 1, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("handles all 3-star", () => {
    // All 10 levels at 3 stars: 0b11 repeated 10 times
    const packed = (1n << 20n) - 1n; // 20 bits all 1s
    expect(unpackAllLevelStars(packed)).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
  });
});

describe("sumStars", () => {
  it("sums correctly", () => {
    const packed = 0x3n | (0x2n << 2n) | (0x1n << 4n); // 3+2+1=6
    expect(sumStars(packed)).toBe(6);
  });
});
```

**Commit**: `feat: add PlayerBestRun RECS component, fix PlayerMeta/GameSettingsMetadata fields, add packing helpers with tests`

---

### Phase 1: Core Hooks (Parallel Workstreams — after Phase 0)

#### Workstream A: Extend usePlayerMeta

**Dependencies**: Phase 0 (metaDataPacking.ts, PlayerMeta RECS fix)
**Can parallelize with**: Workstreams B, C

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| A.1 | Extend `PlayerMeta` interface to include new fields | `src/hooks/usePlayerMeta.tsx` | Updated interface |
| A.2 | Unpack `data` field using `unpackMetaData()` in the useMemo | `src/hooks/usePlayerMeta.tsx` | `totalRuns`, `dailyStars`, `lifetimeXp` exposed |
| A.3 | Expose `lastActive` from `component.last_active` | `src/hooks/usePlayerMeta.tsx` | `lastActive` field |

**Implementation detail**: The `component.data` from RECS is a BigInt. Pass directly to `unpackMetaData(BigInt(component.data))`.

**Commit**: `feat: extend usePlayerMeta to unpack total_runs, daily_stars, lifetime_xp, last_active`

#### Workstream B: Create useZStarBalance

**Dependencies**: Phase 0 (none technically, but logical grouping)
**Can parallelize with**: Workstreams A, C

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| B.1 | Create `useZStarBalance` hook following `useNftBalance` pattern | `src/hooks/useZStarBalance.ts` | Working hook |

**Pattern source**: `src/hooks/useNftBalance.ts` — identical pattern but with:
- `erc20ABI` instead of `erc721ABI`
- `VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS` instead of `VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS`
- Returns `number` (not `bigint`) since DECIMALS=0

**Environment**: `VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS` already exists in `.env.slot` as `0x06e5f1a7bf27f6075006ea9835d6614c7889779e9db19d5edf5c7e894c77868b`.

**Commit**: `feat: add useZStarBalance hook for zStar ERC20 balance`

#### Workstream C: Create usePlayerBestRun

**Dependencies**: Phase 0 (PlayerBestRun RECS component, levelStarsPacking.ts)
**Can parallelize with**: Workstreams A, B

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| C.1 | Create `usePlayerBestRun` hook using `runQuery` scan pattern | `src/hooks/usePlayerBestRun.ts` | Working hook |

**Query strategy**: Use `runQuery([Has(PlayerBestRun)])` to scan ALL PlayerBestRun entities, filter by matching `BigInt(entity.player) === BigInt(playerAddress)`. This follows the exact pattern used in `HomePage.tsx:109-125` for MapEntitlement.

**Return type**: `Map<string, PlayerBestRunData>` keyed by `"${settingsId}-${mode}"` for O(1) lookup.

**Commit**: `feat: add usePlayerBestRun hook for per-zone star progress`

---

### Phase 2: Aggregate Hook + Config Update (after Phase 1)

**Dependencies**: Workstreams A, B, C all complete

| Task | Description | Files | Output |
|------|-------------|-------|--------|
| 2.1 | Create `useZoneProgress` aggregate hook | `src/hooks/useZoneProgress.ts` | `ZoneProgressData[]` from real data |
| 2.2 | Remove `ZONE_UNLOCK_PRICES` mock from `profileData.ts` | `src/config/profileData.ts` | Mock prices removed |
| 2.3 | Update `ZoneProgressData` type: `ethPrice` → `price` (BigInt/u256 from contract) | `src/config/profileData.ts` | Type updated |

**useZoneProgress implementation**:

```typescript
export const useZoneProgress = (
  playerAddress: string | undefined,
  zStarBalance: number,
): { zones: ZoneProgressData[]; totalStars: number; isLoading: boolean } => {
  const { setup: { contractComponents: { GameSettingsMetadata, PlayerBestRun, MapEntitlement } } } = useDojo();

  const ownerBigInt = useMemo(() => playerAddress ? BigInt(playerAddress) : null, [playerAddress]);

  return useMemo(() => {
    if (!ownerBigInt) return { zones: [], totalStars: 0, isLoading: true };

    // 1. Get all GameSettingsMetadata entities
    const metadataEntities = Array.from(runQuery([Has(GameSettingsMetadata)]));
    const metadataMap = new Map<number, { star_cost: bigint; price: bigint; is_free: boolean; theme_id: number; enabled: boolean }>();
    for (const entity of metadataEntities) {
      const m = getComponentValue(GameSettingsMetadata, entity);
      if (m) metadataMap.set(m.settings_id, { star_cost: BigInt(m.star_cost), price: BigInt(m.price), is_free: m.is_free, theme_id: m.theme_id, enabled: m.enabled });
    }

    // 2. Get player's best runs (mode=0 for Map)
    const bestRunEntities = Array.from(runQuery([Has(PlayerBestRun)]));
    const bestRunMap = new Map<number, PlayerBestRunData>();
    for (const entity of bestRunEntities) {
      const br = getComponentValue(PlayerBestRun, entity);
      if (br && BigInt(br.player) === ownerBigInt && br.mode === 0) {
        bestRunMap.set(br.settings_id, {
          bestStars: br.best_stars,
          mapCleared: br.map_cleared,
          levelStars: unpackAllLevelStars(BigInt(br.best_level_stars)),
        });
      }
    }

    // 3. Get entitlements
    const entitlementEntities = Array.from(runQuery([Has(MapEntitlement)]));
    const entitlements = new Set<number>();
    for (const entity of entitlementEntities) {
      const e = getComponentValue(MapEntitlement, entity);
      if (e && BigInt(e.player) === ownerBigInt) entitlements.add(e.settings_id);
    }

    // 4. Build ZoneProgressData[] (sorted by settings_id)
    const zones: ZoneProgressData[] = Array.from(metadataMap.entries())
      .filter(([_, meta]) => meta.enabled)
      .sort(([a], [b]) => a - b)
      .map(([settingsId, meta]) => {
        const bestRun = bestRunMap.get(settingsId);
        const stars = bestRun?.bestStars ?? 0;
        const unlocked = meta.is_free || entitlements.has(settingsId);

        return {
          zoneId: meta.theme_id,
          settingsId,
          name: ZONE_NAMES[meta.theme_id] ?? `Zone ${meta.theme_id}`,
          emoji: ZONE_EMOJIS[meta.theme_id] ?? "🗺️",
          stars,
          maxStars: 30,
          unlocked,
          cleared: bestRun?.mapCleared ?? false,
          isFree: meta.is_free,
          starCost: Number(meta.star_cost),
          price: meta.price,
          currentStars: zStarBalance,
          levelStars: bestRun?.levelStars,
        };
      });

    const totalStars = zones.reduce((sum, z) => sum + z.stars, 0);
    return { zones, totalStars, isLoading: false };
  }, [ownerBigInt, zStarBalance, GameSettingsMetadata, PlayerBestRun, MapEntitlement]);
};
```

**Commit**: `feat: add useZoneProgress aggregate hook, remove mock zone prices`

---

### Phase 3: Wire Pages (after Phase 2)

#### Task 3.1: Wire ProfilePage

**File**: `src/ui/pages/ProfilePage.tsx`

Changes:
1. Import `useZStarBalance` and `useZoneProgress`
2. Replace inline zone calculation (lines 105-134) with `useZoneProgress(address, zStarBalance)`
3. Replace `xp = totalStars * XP_PER_STAR` with `playerMeta.lifetimeXp`
4. Replace `totalStars` in header with `zStarBalance`
5. Pass `playerMeta.totalRuns` to OverviewTab as `totalGames` instead of `games.length`

**File**: `src/ui/components/profile/OverviewTab.tsx`

Changes:
1. Remove import of `RECENT_ACTIVITY` (keep static for now — no contract source)
2. Update `totalGames` prop usage (already correct, value just changes upstream)

**Commit**: `feat: wire real PlayerMeta, zStar, and zone data into ProfilePage`

#### Task 3.2: Wire HomePage

**File**: `src/ui/pages/HomePage.tsx`

Changes:
1. Import `useZStarBalance` and `useZoneProgress`
2. Replace inline `mapMetadataById` computation (lines 127-149) with data from `useZoneProgress`
3. Replace static `ZONE_CONFIG` (lines 37-56) with dynamic zone list from `useZoneProgress`
4. Show real star counts on zone cards

**Note**: HomePage already queries `MapEntitlement` and `GameSettingsMetadata` inline. `useZoneProgress` consolidates this into a single hook, reducing code duplication between HomePage and ProfilePage.

**Commit**: `feat: wire real zone progress data into HomePage`

---

### Phase 4: Quest/Achievement Wiring (DEFERRED — Conditional)

**Status**: BLOCKED — requires metagame-sdk API investigation

**Precondition**: Determine whether `metagame-sdk@0.1.22` provides:
- React hooks or query methods for `QuestDefinition`, `QuestAdvancement`, `QuestCompletion`
- React hooks or query methods for `AchievementDefinition`, `AchievementAdvancement`, `AchievementCompletion`

**Investigation task** (run before starting):
```bash
# Check metagame-sdk exports
node -e "const m = require('metagame-sdk'); console.log(Object.keys(m))"
# Or check TypeScript types
ls node_modules/metagame-sdk/dist/
```

**If metagame-sdk provides hooks**: Wire them into QuestsTab and AchievementsTab, replacing mock `QUEST_DEFS` and `ACHIEVEMENT_DEFS`.

**If metagame-sdk does NOT provide hooks**: Two options:
1. **Option A** (Recommended): Add arcade models to RECS (`contractModels.ts` + `setup.ts`) and build custom hooks. The models are already deployed and indexed by Torii.
2. **Option B**: Use raw Torii GraphQL queries (like `useGameTokensSlot` pattern) to query arcade models directly.

**Arcade Models to add (if Option A)**:
```typescript
// QuestDefinition, QuestAdvancement, QuestCompletion
// AchievementDefinition, AchievementAdvancement, AchievementCompletion
// Plus supporting: QuestCondition, QuestAssociation, AchievementAssociation
```

**Stats that become available when achievements are wired**:
- "Lines" → `AchievementAdvancement` for Sweeper category (LineClear task progress)
- "Bosses" → `AchievementAdvancement` for Boss Slayer category (BossDefeat task progress)
- "Best Combo" → `AchievementAdvancement` for Combo Master category (Combo task progress)

**Not planned**: This will be a separate planning session once the SDK is investigated.

---

## Testing and Validation

### Unit Tests (TDD)

| Test File | Tests | Coverage |
|---|---|---|
| `src/test/metaDataPacking.test.ts` | 6 tests: zero, each field isolated, combined, max values | `unpackMetaData()` |
| `src/test/levelStarsPacking.test.ts` | 8 tests: zero, per-level, boundaries, full unpack, sum | `getLevelStars()`, `unpackAllLevelStars()`, `sumStars()` |

### Integration Verification

After all phases complete, verify via the running app:

1. **ProfilePage header**: Shows real XP value (not `totalStars × 100`), level derived from real XP
2. **ProfilePage ★ count**: Shows zStar ERC20 balance (matches `starkli call <zstar_addr> balance_of <player>`)
3. **OverviewTab Games stat**: Shows total_runs from PlayerMeta (not owned NFT count)
4. **Zone progress cards**: Show per-zone stars from PlayerBestRun (not all-zero for zones > 1)
5. **Zone unlock prices**: Show `star_cost` from GameSettingsMetadata (not hardcoded values)
6. **HomePage zone cards**: Reflect same real data as ProfilePage zones

### Build Verification

```bash
cd client-budokan && pnpm build
```

Must complete without TypeScript errors.

### Test Execution

```bash
cd client-budokan && pnpm test
```

Must pass all new unit tests plus no regressions.

---

## Verification Checklist

- [ ] `pnpm test` passes (new packing tests + no regressions)
- [ ] `pnpm build` succeeds with no type errors
- [ ] `PlayerMeta` RECS component has 4 fields: `player`, `data`, `best_level`, `last_active`
- [ ] `GameSettingsMetadata` RECS component includes `star_cost: RecsType.BigInt`
- [ ] `PlayerBestRun` RECS component defined with 9 fields
- [ ] `setup.ts` `modelsToSync` includes `PlayerMeta`, `PlayerBestRun`, `GameSettings`
- [ ] `usePlayerMeta` returns `totalRuns`, `dailyStars`, `lifetimeXp`, `lastActive`
- [ ] `useZStarBalance` calls `balance_of` on `VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS`
- [ ] `usePlayerBestRun` scans entities and unpacks `best_level_stars`
- [ ] ProfilePage no longer imports `ZONE_UNLOCK_PRICES`
- [ ] ProfilePage XP derived from `lifetimeXp`, not `totalStars × XP_PER_STAR`

---

## Commit Strategy (Atomic)

| # | Commit Message | Scope | Depends On |
|---|---|---|---|
| 1 | `feat: add PlayerBestRun RECS model, fix PlayerMeta + GameSettingsMetadata fields, add packing helpers with tests` | contractModels.ts, setup.ts, metaDataPacking.ts, levelStarsPacking.ts, 2 test files | — |
| 2 | `feat: extend usePlayerMeta to unpack data field (totalRuns, dailyStars, lifetimeXp, lastActive)` | usePlayerMeta.tsx | #1 |
| 3 | `feat: add useZStarBalance hook for zStar ERC20 balance` | useZStarBalance.ts | #1 |
| 4 | `feat: add usePlayerBestRun hook for per-zone star progress` | usePlayerBestRun.ts | #1 |
| 5 | `feat: add useZoneProgress aggregate hook, remove mock zone prices` | useZoneProgress.ts, profileData.ts | #2, #3, #4 |
| 6 | `feat: wire real progression data into ProfilePage` | ProfilePage.tsx, OverviewTab.tsx | #5 |
| 7 | `feat: wire real zone progress into HomePage` | HomePage.tsx | #5 |

Commits 2, 3, 4 can be executed in parallel after commit 1. Commits 5, 6, 7 are serial.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `PlayerBestRun` entities not synced from Torii on initial load | Medium | High — zones show 0 stars | Add to `modelsToSync` for batch initial load. Verify with Torii logs. |
| `GameSettingsMetadata.star_cost` not indexed by Torii | Low | Medium — unlock prices wrong | Already in manifest. Torii indexes all world models. Verify via GraphQL. |
| `erc20ABI` `balance_of` returns u256 with different serialization than expected | Low | Medium — balance shows 0 | Test against known non-zero balance. The ABI already works for CUBE token. |
| RECS field order mismatch causes deserialization errors | Medium | High — all PlayerBestRun data wrong | Test with deployed data. Field names (not positions) drive RECS mapping. |
| Metagame SDK has no quest/achievement query API | Medium | Low — quests stay as mock | Explicitly deferred. No impact on Phases 0-3. |
| `PlayerMeta.data` is 0 for players who haven't played since progression system deployed | High | Medium — shows 0 for everything | Handle gracefully: display "—" or "0" for unpacked fields when data is 0n |

---

## Open Questions

- [ ] **Metagame SDK API**: What query hooks does `metagame-sdk@0.1.22` expose for quest/achievement data? Determines Phase 4 approach.
- [ ] **Stats data source**: "Lines cleared", "Bosses defeated", "Best combo" — no direct model stores these as lifetime counters. They exist as achievement progress in arcade models. Wire from achievements in Phase 4, or add contract-side lifetime counters?
- [ ] **Recent Activity**: No contract event source for a "recent activity feed". Keep static mock, or build from game history (expensive scan)?
- [ ] **Zone settings_id mapping**: Current `ZONE_CONFIG` hardcodes `settingsId: 0` for Polynesian, `settingsId: 1` for Feudal Japan. The `useZoneProgress` hook dynamically reads all `GameSettingsMetadata` entities. Verify the mapping matches deployed config.

---

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Use `runQuery` scan for PlayerBestRun instead of per-key queries | Simpler code, don't need to know all settings_ids upfront. Matches existing MapEntitlement pattern. | `useComponentValue` per (player, settingsId, mode) — 20+ hook calls |
| Return `number` from useZStarBalance (not `bigint`) | DECIMALS=0, values are small integers. Simplifies downstream usage. | Return `bigint` for precision — unnecessary for whole numbers |
| Defer quest/achievement wiring to Phase 4 | Metagame SDK API is unknown. Mock data is acceptable UX. Avoids blocking real data wiring. | Add arcade models to RECS immediately — risk of scope creep |
| Keep `XP_PER_STAR`, `LEVEL_THRESHOLDS` as client constants | XP-to-level derivation is intentionally client-side. No contract stores "player level". | Query contract for level — doesn't exist |
| Keep `ZONE_NAMES`, `ZONE_EMOJIS` as client constants | Display-only data tied to `theme_id`. Contract stores theme_id, client maps to name/emoji. | Store names in GameSettingsMetadata.name — already exists but may not match display names |
| Add PlayerMeta to modelsToSync | Without it, PlayerMeta only arrives via streaming after a write. New players visiting profile before playing would see nothing. | Rely on streaming only — bad UX for first visit |
