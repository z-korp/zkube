# zKube Game Design Document

> **Version:** 3.1.0
> **Last Updated:** February 2026
> **Status:** Validated Design Update
> **Namespace:** `zkube_budo_v1_2_0`

## Table of Contents

1. [Overview](#overview)
2. [Grid & Block System](#grid--block-system)
3. [Level System](#level-system)
4. [Difficulty System](#difficulty-system)
5. [Skill System](#skill-system)
6. [Draft System](#draft-system)
7. [Constraint System](#constraint-system)
8. [Cube Economy](#cube-economy)
9. [Data Architecture](#data-architecture)
10. [Quest System](#quest-system)
11. [Achievement System](#achievement-system)
12. [Related Documentation](#related-documentation)

---

## Overview

zKube is a **Puzzle Roguelike** where players manipulate blocks on an 8x10 grid to form solid horizontal lines. The game features:

- **50 Levels** of progressive difficulty (survival mode after level 50)
- **15 Skills** (5 active bonus skills + 10 passive world skills)
- **3 Skill Slots per run** with augment pacing (full loadout by end of Boss 1)
- **Skill Tree** for permanent progression (levels 0-9)
- **Draft-only Level 10** spikes for in-run power moments
- **No shop system** (removed)
- **CUBE Currency** (ERC-20, `zCubes`, `ZCUBE`, 0 decimals)
- **Constraint, Quest, and Achievement systems**

Core runtime principles:

- **Gravity always applies** after any move or bonus usage.
- **Combo depth** is the number of clear events in one resolution chain.
- **Archetypes are frontend taxonomy only** (skill page organization), not runtime loadout assignment.

### Combo Definition (Authoritative)

Combo depth is measured per action resolution:

1. Player action (move or bonus)
2. Clear full lines
3. Apply gravity
4. Clear newly formed lines
5. Repeat steps 3-4 until no lines clear

If a single action clears lines three times in sequence (primary clear + two gravity clears), **combo depth = 3**.

There is no separate cascade mechanic. Cascade terminology is replaced by combo depth.

---

## Grid & Block System

**Location:** `contracts/src/constants.cairo`

### Grid Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `DEFAULT_GRID_WIDTH` | 8 | Columns in game grid |
| `DEFAULT_GRID_HEIGHT` | 10 | Rows in game grid |
| `BLOCK_BIT_COUNT` | 3 | Bits per block |
| `ROW_BIT_COUNT` | 24 | Bits per row (8 blocks x 3 bits) |

### Block Types

| Value | Type | Width |
|-------|------|-------|
| 0 | Empty | 0 |
| 1 | Size 1 | 1 block |
| 2 | Size 2 | 2 blocks |
| 3 | Size 3 | 3 blocks |
| 4 | Size 4 | 4 blocks |

### Grid Storage

The grid is packed into a single `felt252` (240 bits):

- 10 rows x 8 columns x 3 bits = 240 bits
- Row 0 at bottom, Row 9 at top

---

## Level System

**Location:** `contracts/src/helpers/level.cairo`

### Design Summary

| Aspect | Implementation |
|--------|----------------|
| Total Levels | 50 (survival mode after) |
| Level Cap | Difficulty/scaling caps at level 50 |
| Seed Storage | Separate `GameSeed` model |
| Level Generation | Deterministic from seed |
| Game Over | All progress lost (true roguelike) |

### Moves Scaling (Linear)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `BASE_MOVES` | 20 | Moves at level 1 |
| `MAX_MOVES` | 60 | Moves at level 50 |

**Formula:** `base_moves = 20 + (level - 1) * 40 / 49`

### Points Ratio Scaling

| Parameter | Value | Description |
|-----------|-------|-------------|
| `BASE_RATIO_X100` | 80 | 0.80 points/move at level 1 |
| `MAX_RATIO_X100` | 180 | 1.80 points/move at level 50 |

**Formula:** `points_required = base_moves * ratio / 100`

### Variance

All levels use **+/-5% variance**.

### Sample Level Configs

| Level | Moves | Ratio | Points | Difficulty |
|-------|-------|-------|--------|------------|
| 1 | ~20 | 0.80 | ~16 | VeryEasy |
| 10 | ~28 | 1.00 | ~28 | Medium |
| 25 | ~40 | 1.30 | ~52 | VeryHard |
| 50 | ~60 | 1.80 | ~108 | Master |

---

## Difficulty System

**Location:** `contracts/src/types/difficulty.cairo`, `contracts/src/elements/difficulties/`

### Difficulty Tiers (50-Level Progression)

| Level Range | Difficulty |
|-------------|------------|
| 1-3 | VeryEasy |
| 4-7 | Easy |
| 8-11 | Medium |
| 12-17 | MediumHard |
| 18-24 | Hard |
| 25-34 | VeryHard |
| 35-44 | Expert |
| 45+ | Master |

### Block Distribution Examples

**VeryEasy / Easy**
- More gaps
- More small blocks
- Easier line setup

**Master**
- Fewer gaps
- More large blocks
- High planning pressure

---

## Skill System

**Location:** `contracts/src/systems/skill_tree.cairo`, `contracts/src/systems/skill_effects.cairo`, `contracts/src/helpers/skill_effects.cairo`

### 5.1 Skill Roster (15 Total)

| ID | Name | Type | Description |
|---|---|---|---|
| 1 | Combo | Active | Turn amplifier for combo depth |
| 2 | Score | Active | Direct score injection |
| 3 | Harvest | Active | Targeted block destruction and cube gain |
| 4 | Wave | Active | Row clear reset tool |
| 5 | Supply | Active | Line injection and board shaping |
| 6 | Tempo | World | Move flow and refunds |
| 7 | Fortune | World | Level and clear cube amplification |
| 8 | Surge | World | Score multiplier (hard capped) |
| 9 | Catalyst | World | Combo threshold and reward tuning |
| 10 | Resilience | World | Free-move safety budget |
| 11 | Focus | World | Constraint acceleration |
| 12 | Expansion | World | Easier generated lines |
| 13 | Momentum | World | Consecutive clear value |
| 14 | Adrenaline | World | High-grid risk reward |
| 15 | Legacy | World | Linear long-run scaling |

### 5.2 Skill Tree Structure

Each skill has persistent progression:

```
Lv0 -> Lv1 -> Lv2 -> Lv3 -> Lv4
                              \
                               Lv5A -> Lv6A -> Lv7A -> Lv8A -> Lv9A
                              /
                               Lv5B -> Lv6B -> Lv7B -> Lv8B -> Lv9B
                                                \
                                                 Lv10 (draft-only)
```

- Levels **0-9** are permanent tree levels (purchased with cubes).
- **Branch choice** happens at level 5.
- **Branch respec** costs 50% of branch investment (rounded up).
- **Level 10** is draft-only and cannot be purchased.

### 5.3 Skill Tree Costs

| Level | Cost | Cumulative |
|---|---|---|
| 0 -> 1 | 50 | 50 |
| 1 -> 2 | 100 | 150 |
| 2 -> 3 | 250 | 400 |
| 3 -> 4 | 500 | 900 |
| 4 -> 5 | 1,000 | 1,900 |
| 5 -> 6 | 2,000 | 3,900 |
| 6 -> 7 | 4,000 | 7,900 |
| 7 -> 8 | 8,000 | 15,900 |
| 8 -> 9 | 10,000 | 25,900 |

### 5.4 Archetypes (Frontend Skill Page Taxonomy Only)

Archetypes are used for UI grouping and build guidance. They do **not** auto-fill runtime loadout.

Each archetype has 1 active + 2 world skills.

| Archetype | Skills | Theme |
|---|---|---|
| Tempo | Combo, Tempo, Momentum | Move flow and chain pacing |
| Economy | Harvest, Fortune, Catalyst | Cube amplification |
| Control | Wave, Focus, Expansion | Board and constraint control |
| Risk | Supply, Adrenaline, Resilience | High-pressure burst |
| Scaling | Score, Surge, Legacy | Late-run growth |

### 5.5 Active Skills (Revised, Anti-Loop)

All active skills consume charges. Gravity always resolves after use. Reward clauses are capped.

#### Combo - Turn Amplifier

**Core (0-4)**
- Lv0: Next move gains +1 combo depth
- Lv1: +2 combo depth
- Lv2: +3 combo depth
- Lv3: If next move combo depth >=4, +2 cubes (once/level)
- Lv4: If next move combo depth >=6, +3 cubes (once/level)

**Branch A - Burst** (tradeoff: Lv8+ costs 2 charges)
- Lv5: Combo effect applies twice
- Lv6: Combo depth >=6 doubles combo cube reward for that move
- Lv7: Next combo move ignores move cost
- Lv8: 2-charge use, triple combo bonus
- Lv9: Combo depth >=8 gives +10 cubes (once/level)
- Lv10: Triple combo, free move, +15 cubes if combo depth >=8

**Branch B - Sustain** (tradeoff: combo bonus reduced by 1)
- Lv5: 50% chance no charge consumed
- Lv6: Combo depth >=4 refunds 1 move (max 2/level)
- Lv7: +1 cube on combo use
- Lv8: Always refund 1 move if combo depth >=5
- Lv9: First combo use per level is free
- Lv10: Free use, refunds move, +5 cubes once/level

#### Harvest - Targeted Destruction

**Core (0-4)**
- Lv0: Destroy selected size
- Lv1: Adjacent same-size blocks also destroyed
- Lv2: +1 cube per block
- Lv3: If destroyed >=8 blocks, +3 cubes (once/level)
- Lv4: If combo depth >=4, +3 cubes (once/level)

**Branch A - Control** (tradeoff: cube gain reduced 50%)
- Lv5: Target +/-1 size
- Lv6: Destroyed blocks count toward constraints
- Lv7: Next generated line -1 difficulty
- Lv8: Target two sizes
- Lv9: Constraint requirement -10% (once/level)
- Lv10: Forces one additional gravity resolution cycle

**Branch B - Economy** (tradeoff: only size 1-2 blocks)
- Lv5: +2 cubes per block
- Lv6: Double cubes if >=10 destroyed
- Lv7: +5 cubes if combo depth >=6
- Lv8: Refund charge if >=12 destroyed (once/level)
- Lv9: +10 cubes if combo depth >=8
- Lv10: Harvest doubles cube output once/level

#### Wave - Row Clear

**Core (0-4)**
- Lv0: Clear 1 row
- Lv1: +1 cube per row
- Lv2: Clear 2 rows
- Lv3: If combo depth >=4, +3 cubes
- Lv4: Bottom-up clear priority

**Branch A - Tsunami** (tradeoff: no move refunds)
- Lv5: Clear 3 rows
- Lv6: +2 cubes per row
- Lv7: Combo depth >=6 gives +1 charge (once/level)
- Lv8: Clear 4 rows
- Lv9: +10 cubes if combo depth >=8
- Lv10: Clear 5 rows, +15 cubes if combo depth >=8

**Branch B - Ripple** (tradeoff: clears fewer rows)
- Lv5: Clear 2 rows +1 move
- Lv6: Combo depth >=4 gives +1 move (max 2/level)
- Lv7: Clear 3 rows
- Lv8: +2 free moves
- Lv9: 50% chance no charge consumed
- Lv10: Clear 3 rows, +3 moves

#### Supply - Line Injection

**Core (0-4)**
- Lv0: Add 1 line
- Lv1: -1 difficulty on injected line
- Lv2: Add 2 lines
- Lv3: Immediate combo depth >=4 grants +2 cubes
- Lv4: Prefer gaps

**Branch A - Builder** (tradeoff: no cube scaling)
- Lv5: Biased near-complete rows
- Lv6: Guarantee one near-complete row
- Lv7: Next combo >=4 grants +1 charge
- Lv8: Add 3 setup lines
- Lv9: Combo depth >=6 grants +5 cubes
- Lv10: Add 4 setup lines, +1 charge if combo depth >=6

**Branch B - Pressure** (tradeoff: injected lines are harder)
- Lv5: +2 cubes per line cleared at >=7 filled rows
- Lv6: Add 3 hard lines
- Lv7: Combo depth >=6 at >=7 rows grants +1 charge
- Lv8: +1 combo per line added
- Lv9: +10 cubes if combo depth >=8 at >=7 rows
- Lv10: Add 4 hard lines, double next combo cube reward

#### Score - Direct Injection

**Core (0-4)**
- Lv0: +5 score
- Lv1: +10 score
- Lv2: +15 score
- Lv3: +1 combo depth
- Lv4: Double score at <=5 moves remaining

**Branch A - Chain** (tradeoff: lower base score)
- Lv5: +2 combo depth
- Lv6: +1 move
- Lv7: Combo depth >=6 grants +1 charge (once/level)
- Lv8: Double combo effect
- Lv9: +5 cubes if combo depth >=8
- Lv10: Double combo and +15 cubes once/level

**Branch B - Finisher** (tradeoff: no combo bonus)
- Lv5: Double score at <=7 moves remaining
- Lv6: Triple score at <=5 moves remaining
- Lv7: Freeze move counter for next move
- Lv8: +5 cubes if level ends with <=3 moves remaining
- Lv9: No charge consumed at <=5 moves remaining
- Lv10: Triple score, +15 cubes on 3-star

### 5.6 World Skills (Capped Policy)

All world skills must obey hard caps and no recursive amplification.

Global policy:

- No world skill may grant unbounded charges.
- No world skill may recursively multiply another world skill.
- Per-level trigger caps are mandatory.

#### Tempo
- Base: +1 max move
- Combo >=4 -> +1 move (max 4/level)
- Lv10: refund on combo >=4 (max 5/level)

#### Fortune
- Base: +1 cube per level clear
- +1 cube per 4 lines cleared
- Lv10: double 3-star reward

#### Surge
- Score bonus starts at +5%
- Hard cap +50%
- Lv10: flat +50% cap behavior

#### Catalyst
- -1 combo threshold for combo rewards
- +1 cube per combo reward
- Lv10: double combo reward once/level

#### Resilience
- +1 free move baseline
- Regen after 3 clears (max 3/level)
- Lv10: hard cap 8 free moves

#### Focus
- +1 constraint progress baseline
- Shortcut branch up to 30% start
- Lv10 hard cap 50% shortcut

#### Expansion
- -1 generated line difficulty
- 1 guaranteed gap per level baseline
- Lv10: 2 guaranteed gaps

#### Momentum
- +1 score per consecutive clear
- Combo >=4 -> +1 cube (once/level)
- Lv10: combo >=6 clears 1 extra row (once/level)

#### Adrenaline
- +2 score per line at >=7 filled rows
- Combo >=6 at >=7 rows -> +5 cubes (once/level)
- Lv10: double combo once/level

#### Legacy
- +1 score per 5 levels cleared
- +1 cube per 5 levels
- Lv10: +2 cubes per 5 levels

---

## Draft System

**Location:** `contracts/src/systems/draft.cairo`

Draft is the only in-run build engine. No shop and no mid-run skill swap.

### 6.1 Loadout Pacing (3 Slots)

Run starts with 0 equipped runtime skills. Skills are acquired through early augment pacing:

| Event | Purpose | Outcome |
|---|---|---|
| Post Level 1 | Augment pick A | Fill slot 1 |
| Zone 1 micro draft (L2-L9) | Augment pick B | Fill slot 2 |
| Post Boss 1 (L10 clear) | Augment pick C | Fill slot 3 (full loadout) |

By end of Boss 1, player has a full 3-skill loadout.

### 6.2 Post-Boss Upgrade Drafts

After loadout is full, drafts are upgrades only.

Upgrade drafts occur after:

- Boss 2 (L20)
- Boss 3 (L30)
- Boss 4 (L40)
- Boss 5 (L50)

Each upgrade draft can offer:

- +1 run level to one equipped skill
- Branch unlock if that skill is reaching level 5
- Level 10 unlock if that skill is already level 9

No new skills are added after slot 3 is filled.

### 6.3 Reroll System

Shared escalating counter per draft event:

`cost(n) = 5 * 3^(n-1)`

| Reroll # | Cost |
|---|---|
| 1 | 5 |
| 2 | 15 |
| 3 | 45 |
| 4 | 135 |
| 5+ | 405 |

Rules:

- Reroll replaces only the targeted card.
- Counter is shared inside that draft event.
- Counter resets on next draft event.
- Reroll burns cubes from wallet.

### 6.4 Invariants (Must Hold)

- Loadout slots are unlocked by progression only, not archetype.
- Slot count is fixed at 3 and cannot exceed 3.
- Upgrade drafts must exclude skills already at level 10.
- If all equipped skills are level 10, draft auto-resolves and does not block progression.

---

## Constraint System

**Location:** `contracts/src/types/constraint.cairo`, `contracts/src/helpers/boss.cairo`

### Constraint Types (7 total)

| # | Type | Value Meaning | Count Meaning | Regular | Boss |
|---|------|---------------|---------------|:---:|:---:|
| 0 | **None** | - | - | ✅ | ❌ |
| 1 | **ComboLines** | Lines to clear in one move | How many times | ✅ | ✅ |
| 2 | **BreakBlocks** | Block size to target (1-4) | Total blocks to destroy | ✅ | ✅ |
| 3 | **ComboStreak** | Combo target to reach | 1 (one-shot) | ✅ | ✅ |
| 4 | **FillAndClear** | Row height target (after resolve) | How many times | ✅ | ✅ |
| 5 | **NoBonusUsed** | 0 | 0 | ❌ | ✅ |
| 6 | **KeepGridBelow** | Keep grid below cap (6/7/8) | 1 (breach flag) | ❌ | ✅ |

Constraint generation and boss identity model remain unchanged from prior version.

---

## Cube Economy

**Token:** ERC-20 (`cube_token`, name="zCubes", symbol="ZCUBE", decimals=0)

### 8.1 Level Completion Rewards

| Result | Cubes |
|--------|-------|
| 3-Star | 5 |
| 2-Star | 3 |
| 1-Star | 1 |

No cube reward on failure.

### 8.2 Boss Cube Formula (Quadratic)

Boss clear reward is:

`boss_cubes(boss_index) = 10 * boss_index^2`

Where `boss_index` is 1..5 for levels 10,20,30,40,50.

| Boss | Cubes |
|------|-------|
| 1 | 10 |
| 2 | 40 |
| 3 | 90 |
| 4 | 160 |
| 5 | 250 |

Boss cubes are granted once per boss completion.

### 8.3 Combo Cube Rewards

| Combo Depth | Cube Bonus |
|-------------|------------|
| 4+ | +1 |
| 5+ | +3 |
| 6+ | +5 |
| 7+ | +10 |
| 8+ | +25 |
| 9+ | +50 |

### 8.4 Charge System (Two Sources Only)

Hard rules:

- Max 3 charges per active skill.
- No passive regen.
- No charge gain from shops (shop removed).
- No separate cascade farming mechanic.
- All writes clamp with: `charge = min(3, charge + delta)`.

Charge sources:

1. **Cadence source**: every 5 levels cleared, +1 charge to all equipped active skills.
2. **Combo source**: once per level, highest combo threshold reached grants:
   - Combo depth 4+: +1 to all active skills
   - Combo depth 6+: +2 to all active skills
   - Combo depth 8+: +3 to all active skills

Only highest tier applies once per level.

Implementation guards:

- `combo_charge_awarded_this_level` flag prevents multiple grants.
- Combo source and cadence source each have separate once-guards.
- Overflow above cap is dropped, not banked.

### 8.5 Spending Cubes

| Usage | Source | Destination |
|---|---|---|
| Skill tree upgrades | Wallet (burn) | Permanent progression |
| Draft rerolls | Wallet (burn) | Better draft options |
| Branch respec | Wallet (burn) | Change specialization |

---

## Data Architecture

### Game Model

```cairo
pub struct Game {
    #[key]
    pub game_id: u64,
    pub blocks: felt252,
    pub next_row: u32,
    pub combo_counter: u8,
    pub max_combo: u8,
    pub run_data: felt252,
    pub level_stars: felt252,
    pub started_at: u64,
    pub over: bool,
}
```

### run_data Bit Layout (3-Slot Revision)

| Bits | Field | Size | Description |
|------|-------|------|-------------|
| 0-7 | current_level | 8 | Current level |
| 8-15 | level_score | 8 | Score this level |
| 16-23 | level_moves | 8 | Moves used this level |
| 24-31 | constraint_progress | 8 | Primary constraint |
| 32-39 | constraint2_progress | 8 | Secondary |
| 40-47 | constraint3_progress | 8 | Tertiary |
| 48 | bonus_used_this_level | 1 | For NoBonusUsed |
| 49-56 | max_combo_depth_level | 8 | Max combo depth in level |
| 57-72 | total_cubes | 16 | Run cubes |
| 73-88 | total_score | 16 | Run score |
| 89 | run_completed | 1 | Victory flag |
| 90-93 | free_moves | 4 | Free moves |
| 94 | no_bonus_constraint | 1 | NoBonusUsed active |
| 95-96 | active_slot_count | 2 | 0-3 slots |
| 97-100 | slot_1_skill | 4 | Skill ID |
| 101-104 | slot_1_level | 4 | Runtime level |
| 105-106 | slot_1_charges | 2 | 0-3 charges |
| 107-110 | slot_2_skill | 4 | Skill ID |
| 111-114 | slot_2_level | 4 | Runtime level |
| 115-116 | slot_2_charges | 2 | 0-3 charges |
| 117-120 | slot_3_skill | 4 | Skill ID |
| 121-124 | slot_3_level | 4 | Runtime level |
| 125-126 | slot_3_charges | 2 | 0-3 charges |
| 127 | combo_charge_awarded_this_level | 1 | Once-per-level guard |
| 128-129 | highest_combo_tier_this_level | 2 | 0/4+/6+/8+ tier |

### PlayerSkillTree Model

```cairo
pub struct PlayerSkillTree {
    #[key]
    pub player: ContractAddress,
    /// 15 skills * (4 bits level + 1 bit branch_chosen + 1 bit branch_id) = 90 bits
    pub skill_data: felt252,
}
```

### DraftState Model (Pacing-Oriented)

```cairo
pub struct DraftState {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
    pub active: bool,
    pub event_slot: u8,       // Ordered draft event index for this run
    pub event_type: u8,       // 1=augment_fill, 2=boss_upgrade
    pub trigger_level: u8,
    pub choice_1: u8,
    pub choice_2: u8,
    pub choice_3: u8,
    pub reroll_count: u8,
    pub spent_cubes: u16,
    pub completed_mask: u16,
}
```

### PlayerMeta Model

```cairo
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    pub data: felt252,
    pub best_level: u8,
}
```

`PlayerMeta.data` (current usage):

- `total_runs`
- `total_cubes_earned`

### File Structure Notes

Current key files:

- `contracts/src/systems/skill_tree.cairo`
- `contracts/src/systems/draft.cairo`
- `contracts/src/systems/skill_effects.cairo`
- `contracts/src/helpers/skill_effects.cairo`
- `contracts/src/helpers/packing.cairo`
- `client-budokan/src/ui/pages/SkillTreePage.tsx`
- `client-budokan/src/ui/pages/DraftPage.tsx`

---

## Quest System

**Location:** `contracts/src/systems/quest.cairo`, `contracts/src/elements/quests/`

### Daily Quests (13 total, 92 CUBE/day)

| Category | Quest | Requirement | Reward |
|----------|-------|-------------|--------|
| Player | DailyPlayerOne | Play 1 game | 3 CUBE |
| Player | DailyPlayerTwo | Play 3 games | 5 CUBE |
| Player | DailyPlayerThree | Play 5 games | 10 CUBE |
| Clearer | DailyClearerOne | Clear 10 lines | 3 CUBE |
| Clearer | DailyClearerTwo | Clear 30 lines | 5 CUBE |
| Clearer | DailyClearerThree | Clear 50 lines | 10 CUBE |
| Combo | DailyComboOne | 3+ line combo | 3 CUBE |
| Combo | DailyComboTwo | 5+ line combo | 5 CUBE |
| Combo | DailyComboThree | 7+ line combo | 10 CUBE |
| ComboStreak | DailyComboStreakOne | 5+ combo streak | 3 CUBE |
| ComboStreak | DailyComboStreakTwo | 7+ combo streak | 5 CUBE |
| ComboStreak | DailyComboStreakThree | 9+ combo streak | 10 CUBE |
| Finisher | DailyFinisher | Complete all 12 | 20 CUBE |

---

## Achievement System

28 trophies tracked via Cartridge achievement system:

| Category | Milestones |
|----------|------------|
| Grinder | 10/25/50/100/250 games played |
| Clearer | 100/500/1K/5K/10K lines cleared |
| Combo (3+) | 10/50/100 combos |
| Chain (5+) | 5/25/50 combos |
| SuperChain (7+) | 1/10/25 combos |
| Leveler | Level 10/20/30/40/50 reached |
| Scorer | 100/200/300 high score |
| Master | Complete all daily quests |

---

## Related Documentation

- [CONFIGURABLE_SETTINGS.md](./CONFIGURABLE_SETTINGS.md) - GameSettings customization
- [CONSTRAINT_CONFIG.md](./CONSTRAINT_CONFIG.md) - Constraint budget and cost functions
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment guide
