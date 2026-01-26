# zKube Level System - Implementation Plan

> **Status:** Partially Implemented  
> **Last Updated:** January 2026  
> **Estimated Duration:** 3-4 weeks
>
> **Related:** See [CUBE_ECONOMY.md](./CUBE_ECONOMY.md) for the cube token economy system

## Overview

Transform zKube into a **Puzzle Roguelike** with two game modes:
- **Daily Challenge**: Same seed for all players, once per day, competitive leaderboard
- **Endless Mode**: Random seed per run, practice and personal bests

Both modes share the same progression system: 100 auto-generated levels, cube rewards, and persistent bonus inventory within a run.

### Core Features

| Feature | Description |
|---------|-------------|
| **100 Levels** | Auto-generated with scaling difficulty |
| **Cube System** | 1-3 cubes based on move efficiency (ERC-1155 token) |
| **Constraints** | Level-specific objectives (clear X lines, no bonus, etc.) |
| **Bonus Inventory** | Earned bonuses persist across levels, lost on death |
| **Revival System** | One-time paid revival per run (costs cubes) |
| **Two Game Modes** | Daily Challenge (same seed) + Endless (random seed) |
| **Permanent Shop** | Spend cubes on loadouts, upgrades |
| **In-Game Shop** | Spend brought cubes on consumables (every 5 levels) |

### Game Modes Comparison

| Aspect | Daily Challenge | Endless Mode |
|--------|-----------------|--------------|
| **Seed** | Same for all players | Random per run |
| **Plays per day** | Once | Unlimited |
| **Leaderboard** | Daily global ranking | Personal best |
| **Purpose** | Competition | Practice & mastery |
| **Revival** | Once per day | Once per run |

---

## Game Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY CHALLENGE FLOW                     │
└─────────────────────────────────────────────────────────────┘

ACCUEIL
  └─> Player clicks "Daily Challenge"
      └─> Check if already played today
          ├─> YES: Show results + leaderboard
          └─> NO: Continue to start

START DAILY
  └─> Contract call: start_daily()
      └─> Create DailyPlayer (day_id, timestamp_order)
      └─> Create Game (level=1)
      └─> Generate LevelConfig for level 1
      └─> Emit: DailyStarted

GAMEPLAY LOOP (per level)
  ┌─────────────────────────────────────────┐
  │  LEVEL X                                │
  │  ┌─────────────────────────────────┐   │
  │  │ Objective: 40 points             │   │
  │  │ Constraint: Clear 3 lines (2x)   │   │
  │  │ Moves: 12/30  ★★★ possible      │   │
  │  └─────────────────────────────────┘   │
  │                                         │
  │  [GRID 8x10]                           │
  │                                         │
  │  Bonuses: 🔨x2  🌊x1  🗿x0             │
  └─────────────────────────────────────────┘

  └─> Player makes a move
      └─> Check constraint progress
      └─> Check points
      └─> Check moves limit
          │
          ├─> LEVEL COMPLETE (points + constraints OK)
          │   └─> Calculate stars (based on moves used)
          │   └─> Award bonus based on stars
          │   └─> Reset level_score, constraints
          │   └─> Advance to level+1
          │   └─> Emit: LevelCompleted
          │   └─> Continue loop
          │
          ├─> MOVE LIMIT REACHED (level not complete)
          │   └─> GAME OVER (or revival option)
          │
          └─> GRID FULL (blocks reach top)
              └─> GAME OVER (or revival option)

GAME OVER
  └─> Revival available?
      ├─> YES: Show revival modal
      │   └─> Player pays?
      │       ├─> YES: Reset current level, continue
      │       └─> NO: End daily
      └─> NO: End daily

END DAILY
  └─> Save final state to DailyPlayer
  └─> Emit: DailyEnded
  └─> Show results + leaderboard position
```

---

## Level Generation System

### Scaling Parameters

| Level Range | Points | Max Moves | Difficulty | Constraints |
|-------------|--------|-----------|------------|-------------|
| 1-10 | 20-40 | 30-40 | VeryEasy → Easy | None → Clear 2 lines (1x) |
| 11-30 | 40-80 | 35-50 | Easy → Medium | Clear 2-3 lines (1-2x) |
| 31-50 | 60-100 | 40-60 | Medium → MediumHard | Clear 3-4 lines (2-3x), No bonus |
| 51-70 | 80-120 | 50-70 | Hard → VeryHard | Clear 4 lines (3-4x), No bonus |
| 71-90 | 100-150 | 60-80 | VeryHard → Expert | Clear 4-5 lines (4-5x) |
| 91-100 | 120-200 | 70-100 | Expert → Master | Clear 5 lines (5x+), No bonus |

### Cube Rewards (Performance-Based)

Cubes are calculated based on moves used vs max_moves:

| Performance | Condition | Cubes | Bonus Reward |
|-------------|-----------|-------|--------------|
| 3-Cube (★★★) | moves <= max_moves × 0.4 | 3 | 2 bonuses |
| 2-Cube (★★) | moves <= max_moves × 0.7 | 2 | 1 bonus |
| 1-Cube (★) | level completed | 1 | No bonus |

**Additional Cube Sources:**
- Level milestones (10, 20, 30...): level/2 cubes (+5/+10/+15... up to +50 max)
- Clear 4 lines: +1 cube
- Clear 5 lines: +2 cubes  
- Clear 6+ lines: +3 cubes
- First 5x combo: +3 cubes (one-time per run)
- First 10x combo: +5 cubes (one-time per run)

See [CUBE_ECONOMY.md](./CUBE_ECONOMY.md) for full details.

### Constraint Types

| Type | Description | Example |
|------|-------------|---------|
| `ClearLines` | Clear X lines in a single move, Y times | "Clear 3 lines at once, 2 times" |
| `NoBonusUsed` | Complete level without using any bonus | "No bonus allowed" |

---

## Data Storage (Bit-Packed)

### DailyPlayer Data Structure (252 bits)

```
┌─────────────────────────────────────────────────────────────┐
│ Bits    │ Field              │ Range        │ Description   │
├─────────┼────────────────────┼──────────────┼───────────────┤
│ 0-6     │ level              │ 0-127        │ Current level │
│ 7-22    │ score              │ 0-65535      │ Total score   │
│ 23-32   │ stars_total        │ 0-1023       │ Stars earned  │
│ 33-36   │ hammer             │ 0-15         │ Hammer count  │
│ 37-40   │ wave               │ 0-15         │ Wave count    │
│ 41-44   │ totem              │ 0-15         │ Totem count   │
│ 45      │ revival_used       │ 0-1          │ Revival flag  │
│ 46-61   │ timestamp_order    │ 0-65535      │ Rank tiebreak │
│ 62-93   │ constraint_progress│ 32 bits      │ Current level │
│ 94-251  │ reserved           │ -            │ Future use    │
└─────────────────────────────────────────────────────────────┘
```

### Leaderboard Ranking

Sorted by:
1. Level reached (higher = better)
2. Total score (higher = better)
3. Timestamp order (lower = better, first to register)

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Level types & constraints
- [ ] Level generator algorithm
- [ ] DailyPlayer model with bit-packing
- [ ] Unit tests for generation

### Phase 2: Core Systems (Week 2)
- [ ] GameSystem modifications
- [ ] Constraint tracking in moves
- [ ] Star calculation & bonus awards
- [ ] Level transition logic
- [ ] Integration tests

### Phase 3: Client Integration (Week 3)
- [ ] Zustand stores (dailyStore)
- [ ] Custom hooks (useDailyChallenge, useLevelConfig)
- [ ] UI components (level display, constraints, stars)
- [ ] Level complete flow & animations

### Phase 4: Polish & Features (Week 4)
- [ ] Revival system (contract + UI)
- [ ] Daily leaderboard
- [ ] Edge cases & error handling
- [ ] Performance optimization
- [ ] Final testing

---

---

## Core Roguelike Features

> **Note:** Meta-progression is now handled via the **Cube Economy** system.
> See [CUBE_ECONOMY.md](./CUBE_ECONOMY.md) for full details on shops and unlocks.

### 1. Meta-Progression (Permanent Shop)

Rewards that persist **permanently** across all runs. Purchased with CUBE tokens in the Permanent Shop.

#### Permanent Shop Categories

| Category | Items | Cost Range |
|----------|-------|------------|
| **Starting Bonuses** | Start runs with bonuses | 50-500 cubes per type |
| **Bonus Bag Size** | Increase max capacity per bonus type | 10-160+ cubes (doubling) |
| **Cube Bridging Ranks** | Unlock ability to bring cubes into runs | 100-3200 cubes |
| **New Bonus Types** | Unlock 4th, 5th bonus | 500-750 cubes (future) |

#### Starting Bonus Upgrades

| Level | Cost | Effect |
|-------|------|--------|
| 1 | 50 | Start with 1 of this bonus |
| 2 | 200 | Start with 2 of this bonus |
| 3 | 500 | Start with 3 of this bonus |

Each bonus type (Hammer, Wave, Totem) upgraded independently.

#### Bonus Bag Size Upgrades

By default, players can hold **3 of each bonus type**. Each upgrade increases capacity by 1.

| Upgrade Level | Cost | New Max Capacity |
|---------------|------|------------------|
| 1 | 10 | 4 |
| 2 | 20 | 5 |
| 3 | 40 | 6 |
| 4 | 80 | 7 |
| 5 | 160 | 8 |

**Formula:** Cost = 10 * 2^(level-1) cubes. Each bonus type upgraded independently.

#### Cube Bridging Ranks

| Rank | Cost | Max Cubes to Bring |
|------|------|-------------------|
| 0 | Free | 0 (can't bring) |
| 1 | 100 | 5 |
| 2 | 200 | 10 |
| 3 | 400 | 20 |
| 4 | 800 | 40 |
| 5 | 1600 | 80 |
| 6 | 3200 | 160 |

**Formula:** Cost = 100 * 2^(rank-1), Max = 5 * 2^(rank-1)

---

### 2. In-Game Shop (Every 5 Levels)

At levels 5, 10, 15, 20, etc., players can spend **brought cubes** on consumables.

#### Available Consumables

| Item | Cost | Effect |
|------|------|--------|
| Hammer | 5 | +1 Hammer |
| Wave | 5 | +1 Wave |
| Totem | 5 | +1 Totem |
| Full Refill | bag_size * 3 | Refill one bonus type to max (default: 9 cubes) |
| Skip Constraint | 20 | Auto-complete current constraint |
| Revival Token | 30 | Continue after death |

```
┌─────────────────────────────────────────┐
│      🎉 LEVEL 10 COMPLETE! 🎉           │
│           ███ 3 CUBES                   │
├─────────────────────────────────────────┤
│                                         │
│         IN-GAME SHOP                    │
│    Cubes available: 15                  │
│                                         │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │   🔨 Hammer     │ │   🌊 Wave       ││
│  │    5 cubes      │ │    5 cubes      ││
│  └─────────────────┘ └─────────────────┘│
│  ┌─────────────────┐ ┌─────────────────┐│
│  │  🔨 Full Refill │ │  Skip Constraint││
│  │    9 cubes      │ │    20 cubes     ││
│  └─────────────────┘ └─────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

#### Choice Generation (Deterministic from seed)

```cairo
fn get_milestone_choice(seed: felt252, level: u8) -> (ChoiceType, OptionA, OptionB) {
    let choice_seed = poseidon_hash(seed, level);
    let choice_index = choice_seed % 5; // 5 choice types
    
    match choice_index {
        0 => (ChoiceType::BonusQuantity, ...),
        1 => (ChoiceType::BonusVsStars, ...),
        2 => (ChoiceType::HealVsReward, ...),
        3 => (ChoiceType::RiskVsSafe, ...),
        4 => (ChoiceType::SpecialistVsGeneralist, ...),
    }
}
```

---

## Future Roguelike Enhancements

> These can be added after core + cube economy are working.

### Priority 1 - Quick Wins

| Element | Description |
|---------|-------------|
| **Streak System** | Consecutive daily completion rewards |
| **Personal Best** | Track highest level in Endless |
| **Seeded Runs** | Share seed codes for Endless |

### Priority 2 - Medium Effort

| Element | Description |
|---------|-------------|
| **Weekly Seed** | Same Endless seed all week for practice |
| **Challenge Modes** | "No Bonus Run", "Speed Run" variants |

### Priority 3 - Major Features (Post-Cube Economy)

| Element | Description | Status |
|---------|-------------|--------|
| **Modifiers/Curses** | Random run modifiers for bonus rewards | Future |
| **Special Blocks** | Bomb, Rainbow, Locked blocks | Future |
| **New Bonus Types** | Unlockable 4th/5th bonus abilities | Planned in CUBE_ECONOMY |
| **Cosmetics** | Themes, block skins | Future |

---

## Open Questions

### Resolved Questions

| Question | Decision |
|----------|----------|
| Revival Payment | CUBE tokens (15 cubes in-game shop) |
| In-game currency | CUBE (ERC-1155, soulbound) |
| Shop timing | Every 5 levels (5, 10, 15...) |
| Cube bridging | Unlockable ranks (200-3200 cubes) |
| Brought cubes on death | Lost (burned) |

### Pending Questions

### Q1: Daily Reset Time
**Question:** At what UTC hour does the daily challenge reset?
- Common options: 00:00 UTC, 12:00 UTC

**Decision:** _Pending_

### Q2: Seed Consistency
**Question:** Same VRF seed for all players on the same daily?
- YES: Fair competition, same puzzles
- NO: Different puzzles, pure skill comparison

**Decision:** _Pending_

### Q3: Migration Strategy
**Question:** How to handle existing players?
- Reset all stats
- Migrate relevant data
- Parallel systems during transition

**Decision:** _Pending_

### Q5: Constraint Visuals
**Question:** How to display constraint progress during gameplay?
- Toast notification on progress
- Persistent UI element
- Both

**Decision:** _Pending_

---

## File Changes Summary

### Contracts (New Files)
```
contracts/src/
├── types/
│   ├── constraint.cairo      # NEW: Constraint types
│   └── level.cairo           # NEW: LevelConfig struct
├── models/
│   └── daily.cairo           # NEW: DailyPlayer, DailyLeaderboard
├── systems/
│   └── daily.cairo           # NEW: Daily challenge system
└── helpers/
    ├── level_generator.cairo # NEW: Level generation
    └── daily.cairo           # NEW: Bit-packing helpers
```

### Contracts (Modified Files)
```
contracts/src/
├── models/game.cairo         # ADD: level fields
├── systems/game.cairo        # ADD: level transitions, constraints
├── events.cairo              # ADD: new events
└── lib.cairo                 # ADD: new module exports
```

### Client (New Files)
```
client-budokan/src/
├── stores/
│   └── dailyStore.ts         # NEW: Daily challenge state
├── hooks/
│   ├── useDailyChallenge.tsx # NEW: Daily challenge hook
│   └── useLevelConfig.tsx    # NEW: Level config hook
├── ui/
│   ├── screens/
│   │   └── DailyHub.tsx      # NEW: Daily challenge hub
│   └── components/
│       ├── LevelProgress.tsx     # NEW
│       ├── StarDisplay.tsx       # NEW
│       ├── ConstraintTracker.tsx # NEW
│       ├── BonusInventory.tsx    # NEW
│       ├── RevivalModal.tsx      # NEW
│       ├── LevelCompleteModal.tsx# NEW
│       ├── DailyLeaderboard.tsx  # NEW
│       └── BonusSelectionModal.tsx # NEW
└── dojo/game/
    ├── types/
    │   ├── constraint.ts     # NEW
    │   └── level.ts          # NEW
    └── helpers/
        └── levelGenerator.ts # NEW
```

### Client (Modified Files)
```
client-budokan/src/
├── dojo/game/models/game.ts  # ADD: level fields
├── ui/screens/Play.tsx       # ADD: level UI
├── ui/screens/Home.tsx       # ADD: daily challenge entry
└── ui/components/GameBoard.tsx # ADD: constraint display
```

---

## Success Criteria

- [ ] Player can start a daily challenge
- [ ] Levels generate with appropriate difficulty scaling
- [ ] Constraints are tracked and enforced
- [ ] Stars are awarded based on move efficiency
- [ ] Bonuses accumulate and persist across levels
- [ ] Game over triggers on move limit or grid full
- [ ] Revival system works with payment
- [ ] Leaderboard shows correct ranking
- [ ] Cannot replay daily after completion
- [ ] All events emit correctly for indexing

---

## Related Documentation

- [Technical Specifications](./LEVEL_SYSTEM_TECHNICAL.md)
- [Progress Tracker](./LEVEL_SYSTEM_PROGRESS.md)
