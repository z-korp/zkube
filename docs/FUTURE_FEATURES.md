# zKube Future Features & Roadmap

> **Status:** Planning/Reference  
> **Last Updated:** January 2026  
> **Purpose:** Consolidated list of unimplemented features and architecture improvements

---

## Table of Contents

1. [Bonus System V2.0](#bonus-system-v20) **(NEW - Major Overhaul)**
2. [Game Features](#game-features)
3. [In-Game Shop Expansions](#in-game-shop-expansions)
4. [Daily Challenge Mode](#daily-challenge-mode)
5. [Architecture Improvements](#architecture-improvements)
6. [Quick Wins](#quick-wins)
7. [Long-Term Vision](#long-term-vision)

---

## Bonus System V2.0

> **Status:** Design Complete  
> **Design Document:** [BONUS_SYSTEM_V2.md](./BONUS_SYSTEM_V2.md)  
> **Priority:** High - Major Feature Update

### Overview

A complete overhaul of the bonus system introducing:

| Feature | Current (v1.2) | New (v2.0) |
|---------|----------------|------------|
| Bonus Types | 3 (Hammer, Wave, Totem) | 5 (+Shrink, +Shuffle) |
| Levels | None | 3 levels per bonus |
| Selection | All available | Choose 3 of 5 per run |
| Level-up | N/A | After boss clear |

### Five Bonus Types

| Bonus | Unlocked | L1 Effect | L3 Effect |
|-------|----------|-----------|-----------|
| Hammer | Default | Clear target block | Clear + combo +2 |
| Wave | Default | Clear one row | Clear + 2 free moves |
| Totem | Default | Clear same-size blocks | Clear entire grid |
| Shrink | Unlock 500 | Shrink 1 block | Shrink by 2 sizes |
| Shuffle | Unlock 500 | Shuffle 1 row | Shuffle entire grid |

### Key Mechanics

1. **Selection**: Player chooses 3 of 5 bonuses at game start
2. **Level-ups**: After boss clears (L10, L20, L30, L40, L50), upgrade one bonus
3. **Unlock**: Shrink and Shuffle require permanent shop purchase
4. **Strategy**: 5 bosses = 5 level-ups across 3 bonuses

### Implementation Phases

- [ ] Phase 1: Core Mechanics (new bonus types, effects)
- [ ] Phase 2: Selection System (UI, validation)
- [ ] Phase 3: Level System (boss rewards, scaling)
- [ ] Phase 4: Shop Updates (unlock, new consumables)
- [ ] Phase 5: Client UI (dialogs, indicators)
- [ ] Phase 6: Testing & Polish

See [BONUS_SYSTEM_V2.md](./BONUS_SYSTEM_V2.md) for complete design specifications.

---

## Game Features

### Priority: High

| Feature | Description | Status |
|---------|-------------|--------|
| **Milestone Bonuses** | Award level/2 cubes every 10 levels (capped at 50) | Not Implemented |
| **ExtraMoves Consumable** | Add 5 moves to current level for 10 cubes | Type exists, panics |

### Priority: Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Revival Token** | One-time continue after death (30 cubes) | Planned |
| **Skip Constraint** | Auto-complete current constraint (20 cubes) | Planned |
| **Full Refill** | Refill one bonus type to max (bag_size * 3 cubes) | Planned |

### Priority: Low

| Feature | Description | Status |
|---------|-------------|--------|
| **Special Blocks** | Bomb, Rainbow, Locked blocks | Future |
| **Cosmetics** | Themes, block skins | Future |

> **Note:** New bonus types (Shrink, Shuffle) are now part of [Bonus System V2.0](#bonus-system-v20)

---

## In-Game Shop Expansions

Currently the in-game shop (every 5 levels) only sells basic consumables:

| Item | Cost | Effect | Status |
|------|------|--------|--------|
| Hammer | 5 | +1 Hammer | **Implemented** |
| Wave | 5 | +1 Wave | **Implemented** |
| Totem | 5 | +1 Totem | **Implemented** |
| Extra Moves | 10 | +5 moves | Not Implemented |
| Full Refill | bag*3 | Refill one type to max | Not Implemented |
| Skip Constraint | 20 | Auto-complete constraint | Not Implemented |
| Revival Token | 30 | Continue after death | Not Implemented |

### Implementation Notes

```cairo
// ConsumableType enum expansion needed:
pub enum ConsumableType {
    Hammer,       // 5 cubes - IMPLEMENTED
    Wave,         // 5 cubes - IMPLEMENTED
    Totem,        // 5 cubes - IMPLEMENTED
    ExtraMoves,   // 10 cubes - needs implementation
    FullRefill,   // bag_size * 3 cubes - needs implementation
    SkipConstraint, // 20 cubes - needs implementation
    RevivalToken,   // 30 cubes - needs implementation
}
```

---

## Daily Challenge Mode

### Concept

A competitive mode where all players play the same seed once per day.

### Design Overview

| Aspect | Endless Mode (Current) | Daily Challenge (Future) |
|--------|------------------------|--------------------------|
| Seed | Random per run | Same for all players |
| Plays per day | Unlimited | Once |
| Leaderboard | Personal best | Daily global ranking |
| Purpose | Practice & mastery | Competition |
| Revival | Once per run | Once per day |

### Required Components

#### Contract Models
```
models/
├── daily.cairo           # DailyPlayer, DailyLeaderboard
```

#### Contract Systems
```
systems/
├── daily.cairo           # start_daily(), end_daily()
```

#### Client Components
```
ui/
├── screens/
│   └── DailyHub.tsx      # Daily challenge hub
├── components/
│   ├── DailyLeaderboard.tsx
│   └── DailyCountdown.tsx
```

### Open Questions

| Question | Options | Decision |
|----------|---------|----------|
| Daily reset time | 00:00 UTC or 12:00 UTC | Pending |
| Seed consistency | Same VRF seed for all? | Pending |
| Migration strategy | Reset stats or migrate? | Pending |

---

## Architecture Improvements

### Budokan Compatibility (Implemented)

zkube is fully compatible with the Budokan/game-components framework from Provable Games.

**Implemented Components:**

| Component | Status | Location |
|-----------|--------|----------|
| `MinigameComponent` | Implemented | `game_system` |
| `IMinigameTokenData` | Implemented | `game_system` (score, game_over) |
| `IMinigameSettings` | Implemented | `config_system` |
| `IMinigameSettingsDetails` | Implemented | `config_system` |
| `SettingsComponent` | Implemented | `config_system` |
| `IMinigameDetails` | Implemented | `renderer_systems` |
| `IMinigameDetailsSVG` | Implemented | `renderer_systems` |
| Renderer fallback | Implemented | `game_system.dojo_init` resolves via world.dns |

**Architecture Pattern:**
- Follows Dark Shuffle pattern: single `game_system` with MinigameComponent + game logic
- Renderer resolved automatically via `world.dns(@"renderer_systems")` if not provided
- Config system provides game settings via IMinigameSettings interface

**Key Files:**
- `contracts/src/systems/game.cairo` - MinigameComponent + IMinigameTokenData
- `contracts/src/systems/config.cairo` - SettingsComponent + IMinigameSettings
- `contracts/src/systems/renderer.cairo` - IMinigameDetails + IMinigameDetailsSVG

### Contract Size Management

**Problem:** `game_system` contract exceeds Starknet's 81,920 felt limit.

**Solution:** Helper Systems pattern from death-mountain.

```cairo
// Split logic into separate contracts accessed via dispatchers
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub level: ILevelSystemsDispatcher,
    pub bonus: IBonusSystemsDispatcher,
    pub shop: IShopSystemsDispatcher,
}
```

**Benefits:**
- Each helper contract stays under size limit
- Logic is reusable
- Better separation of concerns

### Store Pattern

**Current:** Direct `world.read_model()`/`write_model()` calls scattered throughout.

**Target:** Centralized `Store` struct with typed methods.

```cairo
pub struct Store {
    world: WorldStorage,
}

impl StoreImpl of StoreTrait {
    fn get_game(ref self: Store, game_id: u64) -> Game { ... }
    fn set_game(ref self: Store, game: Game) { ... }
}
```

### Components Pattern

**Current:** Logic embedded directly in systems.

**Target:** Starknet components for reusable game logic.

```cairo
#[starknet::component]
mod AchievableComponent {
    // Achievement tracking logic
}
```

**Note:** Components don't reduce contract size (they compile into the contract), but they improve code organization and reusability.

---

## Quick Wins

### Priority 1 - Easy Implementation

| Feature | Description | Effort |
|---------|-------------|--------|
| **Personal Best UI** | Track/display highest level in Endless | Low |
| **Seeded Runs** | Share seed codes for Endless practice | Low |
| **Streak System** | Consecutive daily completion rewards | Medium |

### Priority 2 - Medium Effort

| Feature | Description | Effort |
|---------|-------------|--------|
| **Weekly Seed** | Same Endless seed all week for practice | Medium |
| **Challenge Modes** | "No Bonus Run", "Speed Run" variants | Medium |
| **Sound Effects** | Audio feedback for cube earning, combos | Medium |
| **Run Summary** | Detailed breakdown at game end | Medium |

---

## Long-Term Vision

### Roguelike Enhancements

| Feature | Description |
|---------|-------------|
| **Modifiers/Curses** | Random run modifiers for bonus rewards |
| **Milestone Choices** | Choose between rewards at levels 10, 20, 30... |
| **Loadout System** | Pre-configured starting bonus sets |
| **Prestige System** | Permanent multipliers after reaching level 50 |

### Multiplayer Features

| Feature | Description |
|---------|-------------|
| **Versus Mode** | Real-time 1v1 with shared garbage rows |
| **Co-op Mode** | Shared grid, alternating turns |
| **Tournaments** | Bracket-style competitions |

### Economy Expansions

| Feature | Description |
|---------|-------------|
| **LORD Integration** | Stake LORD for cube multipliers |
| **NFT Cosmetics** | Tradeable block skins, themes |
| **Leaderboard Prizes** | Automated prize distribution |

---

## Implementation Priority

### Phase 0: Bonus System V2.0 (Next Major Update)
1. **Core Mechanics** - Shrink/Shuffle effects, level system
2. **Selection System** - Choose 3 of 5 at game start
3. **Level-up System** - Boss clear rewards
4. **Shop Updates** - Unlock, new consumables
5. **UI Overhaul** - Selection dialog, level indicators

### Phase 1: Polish
1. Milestone bonuses
2. ExtraMoves consumable
3. Sound effects
4. Run summary UI

### Phase 2: Competitive
1. Daily Challenge mode
2. Leaderboard system
3. Streak rewards

### Phase 3: Expansion
1. Special blocks
2. Challenge modes
3. Cosmetics

### Phase 4: Architecture (Ongoing)
1. Contract size management
2. Store pattern
3. Helper systems refactoring

---

## References

For detailed technical specifications, see:
- `references/DEATH_MOUNTAIN_PATTERNS.md` - Helper systems pattern
- `references/DARK_SHUFFLE_PATTERNS.md` - Utils pattern
- `references/GAME_COMPONENTS.md` - game-components framework
