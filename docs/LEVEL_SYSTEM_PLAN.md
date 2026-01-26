# zKube Level System - Implementation Plan

> **Status:** Planning Complete - Ready for Implementation  
> **Last Updated:** January 2026  
> **Estimated Duration:** 3-4 weeks

## Overview

Transform zKube into a **Puzzle Roguelike** with two game modes:
- **Daily Challenge**: Same seed for all players, once per day, competitive leaderboard
- **Endless Mode**: Random seed per run, practice and personal bests

Both modes share the same progression system: 100 auto-generated levels, star ratings, and persistent bonus inventory within a run.

### Core Features

| Feature | Description |
|---------|-------------|
| **100 Levels** | Auto-generated with scaling difficulty |
| **Star System** | 1-3 stars based on move efficiency |
| **Constraints** | Level-specific objectives (clear X lines, no bonus, etc.) |
| **Bonus Inventory** | Earned bonuses persist across levels, lost on death |
| **Revival System** | One-time paid revival per run |
| **Two Game Modes** | Daily Challenge (same seed) + Endless (random seed) |

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

### Star Thresholds

Stars are calculated based on moves used vs max_moves:

| Stars | Condition | Reward |
|-------|-----------|--------|
| ★★★ | moves < max_moves × 0.4 | Choose any bonus |
| ★★ | moves < max_moves × 0.7 | Random bonus |
| ★ | level completed | No bonus |

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

### 1. Meta-Progression (Persistent Unlocks)

Rewards that persist **permanently** across all runs. Stored on-chain in `PlayerMeta` model.

#### Unlock Categories

| Category | Unlocks | How to Earn |
|----------|---------|-------------|
| **Starting Loadouts** | Start with 1-3 bonuses | Reach level milestones |
| **New Bonus Types** | Unlock 4th, 5th bonus | Master specific constraints |
| **Cosmetics** | Themes, block skins | Achievements, streaks |
| **Mastery Badges** | Visual progression | Complete level tiers |

#### Milestone Unlocks

| Milestone | Unlock |
|-----------|--------|
| Reach Level 10 | Loadout: "Apprentice" (start with 1 Hammer) |
| Reach Level 25 | Loadout: "Prepared" (start with 1 of each) |
| Reach Level 50 | Loadout: "Veteran" (start with 2 Hammer, 1 Wave) |
| Reach Level 75 | Loadout: "Expert" (start with 2 of each) |
| Reach Level 100 | Loadout: "Master" (start with 3 of each) |
| Complete 7-day streak | Cosmetic: Special theme unlock |
| Complete 30-day streak | Cosmetic: Exclusive block skin |
| Clear 100 total levels | Badge: "Centurion" |
| Clear 10 levels with 3★ | Badge: "Perfectionist" |

#### Loadout Selection (Pre-Run)

```
┌─────────────────────────────────────────┐
│         SELECT YOUR LOADOUT             │
├─────────────────────────────────────────┤
│ ○ Fresh Start (default)                 │
│   No starting bonuses                   │
│                                         │
│ ○ Apprentice [UNLOCKED]                 │
│   🔨 x1                                 │
│                                         │
│ ○ Prepared [UNLOCKED]                   │
│   🔨 x1  🌊 x1  🗿 x1                   │
│                                         │
│ ○ Veteran [LOCKED - Reach Level 50]    │
│   🔨 x2  🌊 x1                          │
│                                         │
│           [ START RUN ]                 │
└─────────────────────────────────────────┘
```

---

### 2. Risk/Reward Choices

At milestone levels (10, 20, 30, 40, 50, 60, 70, 80, 90), player chooses between rewards.

#### Choice Types

| Choice Type | Option A | Option B |
|-------------|----------|----------|
| **Bonus Quantity** | +2 Hammer | +1 of each bonus |
| **Bonus vs Stars** | +1 random bonus | Next level: double stars |
| **Heal vs Reward** | Reset move counter for next level | +2 random bonuses |
| **Risk vs Safe** | Skip next constraint (but 1★ max) | Normal next level |
| **Specialist vs Generalist** | +3 of chosen bonus | +1 of each + extra move limit |

#### Choice Flow

```
┌─────────────────────────────────────────┐
│      🎉 LEVEL 20 COMPLETE! 🎉           │
│           ★★★ 3 STARS                   │
├─────────────────────────────────────────┤
│                                         │
│    Choose your reward for the next      │
│    stage of your journey:               │
│                                         │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │   STOCKPILE     │ │   DIVERSITY     ││
│  │                 │ │                 ││
│  │   🔨 🔨         │ │   🔨 🌊 🗿      ││
│  │   +2 Hammer     │ │   +1 of each    ││
│  │                 │ │                 ││
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

> These can be added after core + meta-progression + choices are working.

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

### Priority 3 - Major Features

| Element | Description |
|---------|-------------|
| **Shop System** | Buy items mid-run with earned coins |
| **Modifiers/Curses** | Random run modifiers for bonus rewards |
| **Special Blocks** | Bomb, Rainbow, Locked blocks |
| **New Bonus Types** | Unlockable 4th/5th bonus abilities |

---

## Open Questions

> These need to be resolved before implementation begins.

### Q1: Revival Payment
**Question:** What token/amount for the revival?
- Option A: Existing ERC20 (LORDS or FLORD)
- Option B: New in-game currency
- Option C: Credit system

**Decision:** _Pending_

### Q2: Daily Reset Time
**Question:** At what UTC hour does the daily challenge reset?
- Common options: 00:00 UTC, 12:00 UTC

**Decision:** _Pending_

### Q3: Seed Consistency
**Question:** Same VRF seed for all players on the same daily?
- YES: Fair competition, same puzzles
- NO: Different puzzles, pure skill comparison

**Decision:** _Pending_

### Q4: Migration Strategy
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
