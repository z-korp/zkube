# zKube Game Design Document

> **Version:** 3.0.0
> **Last Updated:** February 2026
> **Status:** Fully Implemented
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

zKube is a **Puzzle Roguelike** where players manipulate blocks on an 8×10 grid to form solid horizontal lines. The game features:

- **50 Levels** of progressive difficulty (survival mode after level 50)
- **15 Skills** — 5 active bonus abilities + 10 passive world effects
- **Skill Tree** — Persistent meta-progression with branching specializations
- **Draft System** — In-run build engine; draw cards from a unified 15-skill pool
- **CUBE Currency** — ERC-20 tokens earned through gameplay
- **Constraint System** — Per-level challenges for bonus rewards
- **Quest & Achievement Systems** — Daily tasks and lifetime trophies

Runs are shaped by **draft decisions**, not purchasing loops. Power comes from the skill tree (persistent upgrades bought with cubes) and the draft (in-run card picks). There is no shop.

---

## Grid & Block System

**Location:** `contracts/src/constants.cairo`

### Grid Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `DEFAULT_GRID_WIDTH` | 8 | Columns in game grid |
| `DEFAULT_GRID_HEIGHT` | 10 | Rows in game grid |
| `BLOCK_BIT_COUNT` | 3 | Bits per block |
| `ROW_BIT_COUNT` | 24 | Bits per row (8 blocks × 3 bits) |

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
- 10 rows × 8 columns × 3 bits = 240 bits
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

All levels use **±5% variance** for consistent gameplay experience.

The variance is applied to both moves and points calculations, ensuring levels feel slightly different on each playthrough while maintaining balanced difficulty progression.

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

**VeryEasy/Easy:**
- Many gaps (empty blocks)
- Mostly small blocks (size 1-2)
- Easier to clear lines

**Master:**
- Few gaps
- Mostly large blocks (size 3-4)
- Requires strategic planning

---

## Skill System

**Location:** `contracts/src/systems/skill_tree.cairo`, `contracts/src/systems/skill_effects.cairo`, `contracts/src/helpers/skill_effects.cairo`

### 5.1 Skill Roster

15 skills: 5 active bonus abilities + 10 passive world effects.

| ID | Name | Type | Description |
|---|---|---|---|
| 1 | Combo | Bonus | Adds combo to next move |
| 2 | Score | Bonus | Instantly adds bonus score |
| 3 | Harvest | Bonus | Destroys blocks of chosen size, earns cubes |
| 4 | Wave | Bonus | Clears entire horizontal rows |
| 5 | Supply | Bonus | Adds new lines at no move cost |
| 6 | Tempo | World | Extra max moves per level |
| 7 | Fortune | World | Bonus cubes per level completion |
| 8 | Surge | World | Score multiplier on all points |
| 9 | Catalyst | World | Lowers combo-cube thresholds |
| 10 | Resilience | World | Free moves that don't count against limit |
| 11 | Focus | World | Bonus constraint progress |
| 12 | Expansion | World | Generated lines are easier |
| 13 | Momentum | World | Consecutive clears grant bonus |
| 14 | Adrenaline | World | Bonus when grid is high (risk/reward) |
| 15 | Legacy | World | Power scales with run progress |

**Bonus skills** are active abilities — the player triggers them manually (consumes a charge).
**World skills** are passive effects — always active once drafted, no charges.

### 5.2 Skill Tree Structure

Each of the 15 skills has a persistent tree with 10 levels and 2 branches:

```
Tree:     Lv0 → Lv1 → Lv2 → Lv3 → Lv4
                                        ╲
Branch A:                                 Lv5A → Lv6A → Lv7A → Lv8A → Lv9A
                                        ╱
Branch B:                                 Lv5B → Lv6B → Lv7B → Lv8B → Lv9B
Draft-only:                                                           → Lv10 ★ (Maximum Joy)
```

- **Level 0**: Base effect (what you get when drafted at tree level 0).
- **Levels 1-4**: Core path. Linear upgrades.
- **Level 5**: Branch point. Choose Specialization A or B. Permanent choice.
- **Levels 5-9**: Branch-specific. Power ramps hard at levels 7-9.
- **Level 10**: "Maximum Joy" — draft-only. Cannot be purchased. Only reachable via in-run draft upgrades.

#### Skill Tree Costs (Cubes)

| Level | Cost | Cumulative | Notes |
|---|---|---|---|
| 0 → 1 | 50 | 50 | Dip your toes |
| 1 → 2 | 100 | 150 | Still cheap |
| 2 → 3 | 250 | 400 | ~3 days casual |
| 3 → 4 | 500 | 900 | Core path complete (~1 week casual) |
| 4 → 5 | 1,000 | 1,900 | Branch choice (~2 weeks casual) |
| 5 → 6 | 2,000 | 3,900 | ~1 month casual |
| 6 → 7 | 4,000 | 7,900 | ~2 months casual |
| 7 → 8 | 8,000 | 15,900 | ~4 months casual |
| 8 → 9 | 10,000 | 25,900 | ~7 months casual |
| **10** | **—** | **—** | **Draft-only. Cannot buy.** |

- **Full core (0→4)**: 900 cubes. ~1 week casual, ~4 days active.
- **Full branch (0→5)**: 1,900 cubes. ~2 weeks casual.
- **Full skill (0→9)**: 25,900 cubes. ~7 months casual, ~3.7 months active.
- **3 skills maxed**: 77,700 cubes. ~1.7 years casual, ~11 months active.
- **All 15 skills maxed**: 388,500 cubes. Years of play. Aspirational.

#### Branch Respec

- Costs 50% of the branch levels already purchased (rounded up).
- Resets branch levels to 4 (core stays). Must re-buy from 5 in the new branch.
- Prevents trivial swapping while not permanently punishing experimentation.

### 5.3 Bonus Skills (Active) — Full Level Tables

#### Combo

*Adds combo to your next move. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | +1 combo |
| 1 | +2 combo |
| 2 | +3 combo |
| 3 | +4 combo |
| 4 | +5 combo |

| Lv | Branch A: "Cascade" | Branch B: "Echo" |
|---|---|---|
| 5 | +6 combo, cleared lines grant +1 score each | +5 combo, 1-in-3 chance charge not consumed |
| 6 | +7, +2 score per line | +6, 1-in-3 chance |
| 7 | +8, +3 score per line | +7, 1-in-2 chance |
| 8 | +9, +4 score per line | +8, 1-in-2 chance |
| 9 | +10, +5 score per line, +1 cube per use | +9, 2-in-3 chance, +1 free move on proc |
| **10** | **+12 combo, +6 score/line, +1 charge to ALL active bonus skills** | **+10 combo, charge NEVER consumed, +2 free moves on use** |

**Cascade**: Big combo → big score engine. Rewards high line clears.
**Echo**: Sustain. Charges last the whole run. Rewards consistent play.

> "Chance charge not consumed" is deterministic from seed: `poseidon(seed, move_count, 'ECHO') % 3 < echo_threshold`.

#### Score

*Instantly adds bonus score. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | +5 score |
| 1 | +8 score |
| 2 | +12 score |
| 3 | +18 score |
| 4 | +25 score |

| Lv | Branch A: "Momentum" | Branch B: "Precision" |
|---|---|---|
| 5 | +30 score, +1 combo | +30 score, doubles if ≤ 5 moves remaining |
| 6 | +35, +1 combo | +35, doubles if ≤ 5 moves |
| 7 | +40, +2 combo | +42, doubles if ≤ 7 moves |
| 8 | +50, +2 combo | +50, doubles if ≤ 7 moves |
| 9 | +60, +3 combo, +1 cube per use | +60, doubles if ≤ 10 moves, +1 cube per use |
| **10** | **+80 score, +4 combo, score ÷10 also awarded as cubes** | **+80 score, TRIPLES if ≤ 10 moves remaining, +2 cubes/use** |

**Momentum**: Score + combo synergy. Enables chain reactions.
**Precision**: Clutch finisher. Save it for the end of tight levels.

#### Harvest

*Destroys all blocks of a chosen size, earns cubes per block. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | +1 cube per block destroyed |
| 1 | +1 cube, +2 adjacent same-size blocks also destroyed |
| 2 | +2 cubes per block |
| 3 | +2 cubes, +3 adjacent |
| 4 | +3 cubes per block |

| Lv | Branch A: "Excavator" | Branch B: "Prospector" |
|---|---|---|
| 5 | +3 cubes, also destroys ±1 size blocks | +4 cubes, only targets size 1-2 |
| 6 | +4, ±1 size | +5, size 1-2 |
| 7 | +5, ±1 size | +6, size 1-2, +1 score per block |
| 8 | +6, ±1 size, +1 score per block | +8, size 1-2, +2 score per block |
| 9 | +8, ±1 size, +2 score, triggers gravity+line check | +10, size 1-2, +3 score, +1 free move |
| **10** | **+10 cubes, destroys ±2 sizes, gravity+line cascade, +3 score/block** | **+15 cubes (size 1-2), +5 score/block, +2 free moves** |

**Excavator**: Area-of-effect. Picks a size, wipes the neighborhood.
**Prospector**: Maximum cube farming from small blocks.

#### Wave

*Clears entire horizontal rows. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | Clear 1 row |
| 1 | Clear 1 row, +1 score per block in row |
| 2 | Clear 2 rows |
| 3 | Clear 2 rows, +2 score per block |
| 4 | Clear 3 rows |

| Lv | Branch A: "Tsunami" | Branch B: "Ripple" |
|---|---|---|
| 5 | Clear 3 rows bottom-up, +3 score/block | Clear 2 rows, +1 free move |
| 6 | 4 rows bottom-up, +3 score/block | 2 rows, +2 free moves |
| 7 | 4 rows, +4 score/block | 3 rows, +2 free moves |
| 8 | 5 rows, +5 score/block | 3 rows, +3 free moves |
| 9 | 5 rows, +6 score/block, +1 cube per row | 4 rows, +3 free moves, +1 combo |
| **10** | **6 rows, +8 score/block, +2 cubes/row, auto-add 1 free line after** | **5 rows, +4 free moves, +2 combo, 50% charge not consumed** |

**Tsunami**: Mass clear + score engine. Nukes the board.
**Ripple**: Tempo. Fewer rows but generates free moves.

#### Supply

*Adds new lines at no move cost. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | Add 1 line |
| 1 | Add 1 line, -1 difficulty tier |
| 2 | Add 2 lines |
| 3 | Add 2 lines, -1 difficulty tier |
| 4 | Add 3 lines |

| Lv | Branch A: "Stockpile" | Branch B: "Overflow" |
|---|---|---|
| 5 | 3 lines, -2 difficulty tiers | 3 lines, +2 score per line added |
| 6 | 4 lines, -2 tiers | 3 lines, +3 score |
| 7 | 4 lines, -3 tiers | 4 lines, +4 score |
| 8 | 5 lines, -3 tiers | 4 lines, +5 score, +1 cube |
| 9 | 5 lines, VeryEasy always, +1 free move | 5 lines, +6 score, +2 cubes |
| **10** | **6 lines VeryEasy, +2 free moves, lines pre-arranged for clears** | **6 lines, +8 score/line, +3 cubes, lines count as constraint progress** |

**Stockpile**: Guaranteed easy fills. Reliable line material.
**Overflow**: Supply = score engine. More lines = more points.

### 5.4 World Skills (Passive) — Full Level Tables

World skills are always active once drafted. No charges, no manual trigger.

#### Tempo

*Extra max moves per level.*

| Lv | Core | Branch A: "Marathon" | Branch B: "Sprint" |
|---|---|---|---|
| 0 | +1 max move/level | | |
| 1 | +2 | | |
| 2 | +3 | | |
| 3 | +4 | | |
| 4 | +5 | | |
| 5 | | +7 moves | +5 moves, every 3rd line clear refunds 1 move |
| 6 | | +9 | +5, every 2nd clear refunds |
| 7 | | +11 | +6, every 2nd |
| 8 | | +14 | +7, every 2nd, +1 score per refund |
| 9 | | +18 | +8, every 2nd, +2 score per refund |
| **10** | | **+25 moves** | **+10, EVERY clear refunds 1 move, +3 score/refund** |

**Marathon**: Raw extra moves. Simple, reliable.
**Sprint**: Move efficiency. Rewards consistent line clearing.

#### Fortune

*Bonus cubes per level completion.*

| Lv | Core | Branch A: "Midas" | Branch B: "Jackpot" |
|---|---|---|---|
| 0 | +1 cube/level | | |
| 1 | +1 | | |
| 2 | +2 | | |
| 3 | +2 | | |
| 4 | +3 | | |
| 5 | | +4, +1 cube per 5 lines cleared in level | +3, double cubes on 3-star levels |
| 6 | | +5, +1 per 4 lines | +4, double on 3-star |
| 7 | | +6, +1 per 3 lines | +5, double on 2-star+ |
| 8 | | +8, +1 per 3 lines | +6, double on 2-star+ |
| 9 | | +10, +2 per 3 lines | +8, triple on 3-star, double on 2-star |
| **10** | | **+15 cubes/level, +3 per 2 lines** | **+12 cubes/level, 4× on 3-star, 3× on 2-star** |

**Midas**: Consistent cube income. Scales with line count.
**Jackpot**: Star-gated multiplier. Rewards clean play.

#### Surge

*Score multiplier on all points earned.*

| Lv | Core | Branch A: "Amplify" | Branch B: "Crescendo" |
|---|---|---|---|
| 0 | +5% score | | |
| 1 | +8% | | |
| 2 | +12% | | |
| 3 | +16% | | |
| 4 | +20% | | |
| 5 | | +25% flat | +20%, +2% per level completed this run |
| 6 | | +30% | +20%, +3% per level |
| 7 | | +35% | +20%, +4% per level |
| 8 | | +40% | +22%, +5% per level |
| 9 | | +50% | +25%, +6% per level (up to +325% at L50) |
| **10** | | **+75% flat** | **+30%, +8% per level (up to +430% at L50)** |

**Amplify**: Flat, reliable multiplier.
**Crescendo**: Weak early, insane late. Rewards long runs.

#### Catalyst

*Lowers combo-cube thresholds (normally 4 lines → +1 cube, etc.).*

| Lv | Core | Branch A: "Ignition" | Branch B: "Fusion" |
|---|---|---|---|
| 0 | -1 line for combo-cube thresholds | | |
| 1 | -1 | | |
| 2 | -1, +1 bonus cube on combo rewards | | |
| 3 | -1, +1 | | |
| 4 | -2 line threshold | | |
| 5 | | -2, +2 bonus cubes | -2, combo cubes also grant +1 score each |
| 6 | | -2, +3 | -2, +2 score |
| 7 | | -3, +3 | -2, +3 score |
| 8 | | -3, +4 | -3, +4 score |
| 9 | | -3, +5, double cubes on 6+ line clear | -3, +5 score, +1 free move on combo reward |
| **10** | | **-4, +7 cubes, 3× cubes on 5+ line clear** | **-4, +7 score/combo reward, +2 free moves on combo reward** |

**Ignition**: Maximum cube yield from combos.
**Fusion**: Combo cubes → score + tempo engine.

#### Resilience

*Free moves that don't count against the level move limit.*

| Lv | Core | Branch A: "Iron Will" | Branch B: "Second Wind" |
|---|---|---|---|
| 0 | +1 free move/level | | |
| 1 | +1 | | |
| 2 | +2 | | |
| 3 | +2 | | |
| 4 | +3 | | |
| 5 | | +4 free moves | +3, regain 1 on 3+ line clear |
| 6 | | +5 | +3, regain on 2+ clear |
| 7 | | +6 | +4, regain on 2+ |
| 8 | | +7 | +4, regain on any clear |
| 9 | | +9 | +5, regain on any clear, +1 score per free move used |
| **10** | | **+12 free moves** | **+6, regain 2 on any clear, +2 score per free move used** |

**Iron Will**: Raw free moves. Brute-force safety.
**Second Wind**: Regenerating free moves. Rewards consistent play.

#### Focus

*Bonus constraint progress per qualifying action.*

| Lv | Core | Branch A: "Discipline" | Branch B: "Shortcut" |
|---|---|---|---|
| 0 | +1 bonus constraint progress on qualifying action | | |
| 1 | +1 | | |
| 2 | +1, +1 score when constraint progresses | | |
| 3 | +2 | | |
| 4 | +2, +2 score | | |
| 5 | | +3 progress, +3 score | +2, constraints start 25% pre-filled |
| 6 | | +3, +4 score | +2, 30% pre-filled |
| 7 | | +4, +5 score | +3, 35% pre-filled |
| 8 | | +4, +6 score | +3, 40% pre-filled |
| 9 | | +5, +8 score, +1 cube per constraint completed | +4, 50% pre-filled, +1 cube per constraint |
| **10** | | **+6 progress, +10 score, +2 cubes/constraint** | **+5, 60% pre-filled, +2 cubes/constraint** |

**Discipline**: Progress faster, score while doing it.
**Shortcut**: Start with constraints partially done.

#### Expansion

*Generated lines are easier (lower difficulty tier).*

| Lv | Core | Branch A: "Simplify" | Branch B: "Sculpt" |
|---|---|---|---|
| 0 | -1 difficulty tier on generated lines | | |
| 1 | -1 | | |
| 2 | -1, +1 score per line added | | |
| 3 | -2 tiers | | |
| 4 | -2, +1 score | | |
| 5 | | -3 tiers | -2, guaranteed 1 gap per line |
| 6 | | -3, +2 score per line | -2, 2 guaranteed gaps |
| 7 | | -4 tiers | -3, 2 gaps |
| 8 | | -4, +3 score | -3, 2 gaps, +1 cube per 10 lines |
| 9 | | -5 (VeryEasy cap), +4 score, +1 cube/level | -3, 3 gaps, +2 cubes per 10 lines |
| **10** | | **-6 tiers (VeryEasy cap), +5 score/line, +2 cubes/level** | **-4, 4 gaps/line, +3 cubes per 10 lines** |

**Simplify**: Raw difficulty reduction.
**Sculpt**: Controlled gaps — shape the grid yourself.

#### Momentum

*Consecutive line clears (clearing on consecutive moves) grant bonus.*

| Lv | Core | Branch A: "Streak" | Branch B: "Blitz" |
|---|---|---|---|
| 0 | +1 score per consecutive clear | | |
| 1 | +1 | | |
| 2 | +2 per consecutive | | |
| 3 | +2 | | |
| 4 | +3 | | |
| 5 | | +4, streak of 3+ grants +1 cube | +3, streak resets 1 used move (-1 level_moves) |
| 6 | | +5, +1 cube | +4, -1 move |
| 7 | | +6, streak 3+ grants +2 cubes | +5, -1 move, +1 combo on streak 3+ |
| 8 | | +8, +2 cubes | +6, -2 moves, +1 combo |
| 9 | | +10, +3 cubes, streak 5+ clears a free row | +8, -2 moves, +2 combo |
| **10** | | **+12 score, +4 cubes on 3+, streak 5+ clears 2 free rows** | **+10, -3 moves, +3 combo on streak 3+** |

**Streak**: Cube engine from consecutive clears.
**Blitz**: Move refund + combo generation. Tempo machine.

#### Adrenaline

*Risk/reward — bonus when grid is high (>= filled_rows threshold).*

| Lv | Core | Branch A: "Daredevil" | Branch B: "Controlled Burn" |
|---|---|---|---|
| 0 | +2 score per line cleared at >= 7 rows | | |
| 1 | +3 | | |
| 2 | +4 | | |
| 3 | +5 | | |
| 4 | +6, +1 cube per clear at >= 7 | | |
| 5 | | +8, +2 cubes at >= 7 | +6, grid >= 8 → double combo value |
| 6 | | +10, +2 cubes | +7, >= 8 → double |
| 7 | | +12, +3 cubes at >= 7 | +8, >= 7 → double combo |
| 8 | | +15, +3 cubes | +10, >= 7 → double, +1 free move |
| 9 | | +20, +4 cubes, +1 free move at >= 8 | +12, >= 7 → triple combo, +2 free moves |
| **10** | | **+25 score, +6 cubes at ≥7, +2 free moves at ≥8** | **+15, ≥7 → 4× combo, +3 free moves** |

**Daredevil**: Play dangerously, earn big cubes.
**Controlled Burn**: Amplify combos by riding high.

#### Legacy

*Power scales with run progress (levels completed this run).*

| Lv | Core | Branch A: "Veteran" | Branch B: "Collector" |
|---|---|---|---|
| 0 | +1 score per 5 levels cleared this run | | |
| 1 | +1 per 4 levels | | |
| 2 | +1 per 3 levels | | |
| 3 | +2 per 3 levels | | |
| 4 | +2 per 3, +1 cube per 10 levels | | |
| 5 | | +3 per 3 levels, +1 cube per 5 | +2 per 3, +1 score per unique skill in loadout |
| 6 | | +3, +2 cubes per 5 levels | +2, +1 per unique skill |
| 7 | | +4, +2 cubes per 5 | +3, +2 per unique skill |
| 8 | | +5, +3 cubes per 5 | +3, +2 per skill, +1 free move per 10 levels |
| 9 | | +6 per 2 levels, +4 cubes per 5, +1 free move | +4, +3 per unique skill, +2 free moves per 10 levels |
| **10** | | **+8 per 2 levels, +6 cubes per 5, +2 free moves per 10** | **+5/level, +4 per skill, +3 free moves per 10 levels** |

**Veteran**: Late-run scaling. Rewards going deep.
**Collector**: Diversity bonus. Rewards a varied loadout.

---

## Draft System

**Location:** `contracts/src/systems/draft.cairo`

The draft is the only in-run build engine. No shop, no purchasing during runs.

### 6.1 Single Pool

All 15 skills are in one pool. Each draft event draws 3 random cards.

- **Randomness**: Deterministic from `poseidon(game_seed, 'DRAFT', event_slot, reroll_count)`.
- **No duplicates in one draw**: The 3 cards are always 3 distinct skills.
- **No gating**: All 15 skills are always available regardless of zone, boss clears, or progression.

### 6.2 Draft Flow

```
LEVEL COMPLETE
    │
    ▼
IS THIS A DRAFT TRIGGER?
(post-level-1 / zone-micro / post-boss)
    │ yes
    ▼
DRAW 3 CARDS from 15-skill pool
    │
    ▼
PLAYER SEES 3 CARDS
    │
    ├── REROLL any card (shared cost counter)
    │   └── New card drawn for that slot
    │
    └── PICK ONE CARD
            │
            ├── Slots < 5? → Add skill at skill tree level
            │                 (or +1 if already owned)
            │
            └── Slots = 5? → +1 level to one existing skill
                              (3 cards = 3 different upgrade targets)
```

### 6.3 Slot-Full Behavior

When all 5 run slots are occupied:

- The 3 draft cards become **upgrade offers**: each targets a different active skill.
- Drawn from your 5 active skills (3 of the 5 are randomly selected).
- Picking one gives +1 run level to that skill (capped at 10).
- Rerolling replaces the upgrade target with a different one of your 5.

### 6.4 Run Level vs Tree Level

- **Tree level**: Persistent. Bought with cubes. Determines starting floor.
- **Run level**: Per-run. Starts at tree level. Draft picks and upgrades increase it.
- **Cap**: 10. Tree max is 9, but draft upgrades can push to 10 ("Maximum Joy" — draft-only tier).

Example: Player has Combo at tree level 3.
1. Draft offers Combo → enters run at level 3.
2. Later draft offers Combo again (duplicate) → run level becomes 4.
3. Another Combo draft (after slots full) → run level becomes 5.

### 6.5 Draft Trigger Timing

| Type | Trigger | Event Slot | Per Run |
|---|---|---|---|
| `post_level_1` | After clearing level 1 | 0 | 1 |
| `zone_micro` | Seeded random level per zone (2..8 within zone) | zone (1-5) | ~5 |
| `post_boss` | After boss levels 10/20/30/40 | 5 + zone | 4 |
| **Total** | | | **~9-10** |

### 6.6 Reroll System

**Shared counter**. One reroll counter per draft event, not per card slot.

**Formula**: `cost(n) = 5 * 3^(n-1)` where `n` = reroll number (1-indexed).

| Reroll # | Cost | Cumulative | Context |
|---|---|---|---|
| 1 | 5 | 5 | Trivial — single level clear |
| 2 | 15 | 20 | Noticeable |
| 3 | 45 | 65 | Serious investment |
| 4 | 135 | 200 | Wall — more than a full day of quests |
| 5 | 405 | 605 | Desperation |
| 6 | 1,215 | 1,820 | Functionally impossible |

**Rules:**
- Reroll replaces one of the 3 cards (player picks which card to reroll).
- Counter is shared: rerolling card 1 then card 2 costs 5 then 15.
- Counter resets per draft event.
- Reroll burns cubes from wallet (ERC-20 burn).

### 6.7 Charge System (Bonus Skills Only)

Bonus skills consume charges. World skills are passive (no charges).

**Charge Sources:**
- High line clears (3+ lines = +1 charge to a random active bonus)
- Combo streak milestones (5+ combo = +1 charge)
- Constraint completion rewards (+1 charge)
- Boss rewards (+2 charges, distributed)
- Level completion (3-star = +1 charge)

**No purchasing charges. Performance only.**

### 6.8 Zone Structure

| Zone | Levels | Boss |
|---|---|---|
| Zone 1 | 1-9 | Boss 1: Level 10 |
| Zone 2 | 11-19 | Boss 2: Level 20 |
| Zone 3 | 21-29 | Boss 3: Level 30 |
| Zone 4 | 31-39 | Boss 4: Level 40 |
| Zone 5 | 41-49 | Boss 5: Level 50 |

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

### When Constraints Apply

- **Levels 1-2:** No constraints (warm-up)
- **Level 3+:** Constraints generated from seed + difficulty via unified budget system
- **Constraint count:** Deterministic per tier — `constraint_min` to `constraint_max` rolled randomly (0-3 constraints depending on difficulty)
- **NoBonusUsed:** Boss-only — never generated on regular levels. Prevents use of any active bonus skills.
- **Boss levels (10/20/30/40/50):** Fixed constraint combos from boss identity system at budget_max, up to triple constraints at L40/50

### Unified Budget System

All constraint types (regular + boss) use the same budget-based generation engine:

1. **Budget** interpolates from VeryEasy (1-3) to Master (32-40)
2. **Type selection** uses difficulty-weighted probabilities (regular levels)
3. **Cost functions** per type convert budget → constraint values
4. **Skew-high rolls** favor harder values within budget range

**Type Selection Weights (regular levels):**

| Tier | ComboLines | BreakBlocks | FillAndClear | ComboStreak |
|------|:---:|:---:|:---:|:---:|
| 0 (VeryEasy) | 80% | 15% | 0% | 5% |
| 1 (Easy) | 55% | 15% | 15% | 15% |
| 2 (Medium) | 50% | 18% | 15% | 17% |
| 3 (MediumHard) | 45% | 20% | 17% | 18% |
| 4 (Hard) | 40% | 22% | 18% | 20% |
| 5 (VeryHard) | 35% | 23% | 20% | 22% |
| 6 (Expert) | 30% | 24% | 24% | 22% |
| 7 (Master) | 25% | 25% | 28% | 22% |

**Cost Functions:**

| Type | Cost → Values | Examples (budget=25) |
|------|--------------|---------------------|
| ComboLines | line_cost: 2→2, 3→4, 4→6, 5→10, 6→15, 7→20. min_lines: tier 0-1→2, 2-3→3, 4-6→4, 7→5 | 5 lines ×2, or 4 lines ×4 |
| BreakBlocks | break_cost(size): 1→3, 2→4, 3→5, 4→6. blocks=(budget×8)/cost | size-2: 50 blocks, size-4: 33 blocks |
| ComboStreak | combo_cost(c)=c×(c-1)/2: 3→3, 4→6, 5→10, 6→15, 7→21, 8→28. Max combo = 8 | combo 5 (cost 10) or combo 7 (cost 21) |
| FillAndClear | row_cost: 4→2, 5→5, 6→10, 7→17, 8→26. times_cap: 4→4, 5→3, 6→2, 7→2, 8→1 | row 6 ×2, or row 7 ×1 |

**Constraint count:** Deterministic per tier (0 at VeryEasy → 3 at Master). Each constraint rolls a different type from the weight table above.

### Boss Identity System

10 themed bosses with fixed constraint type combinations. Boss identity determines WHICH types, the unified budget system at `budget_max` determines the VALUES.

Selected by `derive_boss_id(level_seed) % 10 + 1`:

| # | Boss | Core Pair (L10-30) | Third Constraint (L40/50) |
|---|------|--------------------|---------------------------|
| 1 | Combo Master | ComboLines + ComboStreak | NoBonusUsed |
| 2 | Demolisher | BreakBlocks + ComboLines | KeepGridBelow |
| 3 | Daredevil | FillAndClear + ComboStreak | ComboLines |
| 4 | Purist | NoBonusUsed + ComboLines | ComboStreak |
| 5 | Harvester | BreakBlocks + ComboStreak | FillAndClear |
| 6 | Tidal | KeepGridBelow + ComboLines | BreakBlocks |
| 7 | Stacker | FillAndClear + ComboLines | BreakBlocks |
| 8 | Surgeon | BreakBlocks + FillAndClear | NoBonusUsed |
| 9 | Ascetic | NoBonusUsed + ComboStreak | FillAndClear |
| 10 | Perfectionist | ComboLines + FillAndClear | ComboStreak |

**Constraint progression:**
- L10/20/30: Dual constraints (core pair), generated at budget_max
- L40/50: Triple constraints (core pair + third), generated at budget_max
- NoBonusUsed and KeepGridBelow are binary (no budget needed)

---

## Cube Economy

**Token:** ERC-20 (`cube_token` system, name="zCubes", symbol="ZCUBE", 0 decimals)

### Earning Cubes (During Run)

| Source | Amount | Condition |
|--------|--------|-----------|
| Level complete (3-star) | 3 | Moves ≤ 40% of max |
| Level complete (2-star) | 2 | Moves ≤ 70% of max |
| Level complete (1-star) | 1 | Level completed |
| Clear 4 lines | +1 | Combo bonus |
| Clear 5 lines | +3 | Combo bonus |
| Clear 6 lines | +5 | Combo bonus |
| Clear 7 lines | +10 | Combo bonus |
| Clear 8 lines | +25 | Combo bonus |
| Clear 9+ lines | +50 | Combo bonus |
| First 5-line combo | +3 | One-time per run |
| First 10-line combo | +5 | One-time per run |
| Boss level (L10/20/30/40/50) | +10/20/30/40/50 | Boss level bonus |

### Cube Thresholds

Calculated from `max_moves` for each level:
- `cube_3_threshold = max_moves * 40%`
- `cube_2_threshold = max_moves * 70%`

### Boss Levels

Special levels every 10 levels with themed boss identities and bonus rewards:

| Level | Cube Bonus | Constraints | Boss Identity |
|-------|------------|-------------|---------------|
| 10 | +10 CUBE | Dual (core pair) | Seeded from run |
| 20 | +20 CUBE | Dual (core pair) | Seeded from run |
| 30 | +30 CUBE | Dual (core pair) | Seeded from run |
| 40 | +40 CUBE | Triple (core pair + third) | Seeded from run |
| 50 | +50 CUBE | Triple (core pair + third) | Seeded from run |

Boss identity is determined by `derive_boss_id(level_seed) % 10 + 1`, giving one of 10 themed bosses (see Constraint System). Completing level 50 triggers the victory state and mints all earned cubes.

### Spending Cubes

| Usage | Source | Destination |
|---|---|---|
| Skill tree upgrades | Wallet (burn) | Persistent progression |
| Draft rerolls | Wallet (burn) | Better draft options |
| Branch respec | Wallet (burn) | Change specialization |

### Cube Flow

```
WALLET (ERC-20)
       |
       +---> SKILL TREE (burn cubes for upgrades)
       |
       +---> DRAFT REROLLS (burn cubes for better options)
       |
       +---> BRANCH RESPEC (burn cubes to change specialization)

DURING RUN
       - Earn cubes via line clears, combos, level completes, boss clears
       - Cubes minted to wallet on game end
```

### Synergies

The unified 15-skill pool creates emergent synergies:

| Combo | Synergy |
|---|---|
| Combo (Cascade) + Surge (Amplify) | Big combos → big score → multiplied |
| Harvest (Prospector) + Fortune (Midas) | Cubes from harvesting + cubes from line clearing |
| Wave (Ripple) + Resilience (Second Wind) | Wave gives free moves, Resilience regenerates them |
| Adrenaline (Daredevil) + Supply (Stockpile) | Play high, supply easy lines to clear under pressure |
| Legacy (Collector) + 5 diverse skills | Collector rewards unique skill diversity |
| Momentum (Blitz) + Tempo (Sprint) | Both reward consecutive clears — move refund machine |
| Focus (Shortcut) + Catalyst (Fusion) | Constraints easier + combos give score + tempo |
| Score (Precision) + Resilience (Iron Will) | Save Score for last moves, free moves extend window |

### Balance Levers

| Lever | Current Default | Adjustable Via |
|---|---|---|
| Skills in pool | 15 | Code (add new skills) |
| Draft events per run | ~9-10 | Zone micro trigger range |
| Max run slots | 5 | GameSettings |
| Skill level cap | 9 (tree), 10 (run) | Code constant |
| Branch point | Level 5 | Code constant |
| Reroll base cost | 5 | GameSettings |
| Reroll multiplier | 3× | GameSettings |
| Skill tree costs | 50/100/250/500/1K/2K/4K/8K/10K | Code (array) |
| Branch respec cost | 50% of branch investment | Code constant |
| Charge gain rates | Per-action grants | GameSettings |

---

## Data Architecture

### Game Model

```cairo
pub struct Game {
    #[key]
    pub game_id: u64,
    pub blocks: felt252,      // 240 bits - the grid
    pub next_row: u32,        // 24 bits - queued row
    pub combo_counter: u8,    // Current combo streak
    pub max_combo: u8,        // Best combo this level
    pub run_data: felt252,    // Bit-packed level/run progress
    pub level_stars: felt252,  // 2 bits per level × 50 levels = 100 bits
    pub started_at: u64,      // Run start timestamp
    pub over: bool,
}
```

### run_data Bit Layout (178 bits used)

| Bits | Field | Size | Description |
|------|-------|------|-------------|
| 0-7 | current_level | 8 | Current level (1-255) |
| 8-15 | level_score | 8 | Score this level |
| 16-23 | level_moves | 8 | Moves used this level |
| 24-31 | constraint_progress | 8 | Primary constraint |
| 32-39 | constraint_2_progress | 8 | Secondary constraint |
| 40-47 | constraint_3_progress | 8 | Tertiary constraint |
| 48 | bonus_used_this_level | 1 | For NoBonusUsed |
| 49-56 | max_combo_run | 8 | Best combo this run |
| 57-72 | total_cubes | 16 | Earned cubes |
| 73-88 | total_score | 16 | Cumulative score |
| 89 | run_completed | 1 | Victory flag |
| 90-93 | free_moves | 4 | Free moves (0-15) |
| 94 | no_bonus_constraint | 1 | NoBonusUsed active |
| 95-97 | active_slot_count | 3 | Filled slots (0-5) |
| 98-101 | slot_1_skill | 4 | Skill ID (1-15, 0=empty) |
| 102-105 | slot_1_level | 4 | Run level (0-10) |
| 106-109 | slot_2_skill | 4 | Skill ID |
| 110-113 | slot_2_level | 4 | Run level |
| 114-117 | slot_3_skill | 4 | Skill ID |
| 118-121 | slot_3_level | 4 | Run level |
| 122-125 | slot_4_skill | 4 | Skill ID |
| 126-129 | slot_4_level | 4 | Run level |
| 130-133 | slot_5_skill | 4 | Skill ID |
| 134-137 | slot_5_level | 4 | Run level |
| 138-145 | slot_1_charges | 8 | Charges (bonus skills only) |
| 146-153 | slot_2_charges | 8 | |
| 154-161 | slot_3_charges | 8 | |
| 162-169 | slot_4_charges | 8 | |
| 170-177 | slot_5_charges | 8 | |

**Total: 178 bits** (fits in felt252's 252 bits).

### PlayerSkillTree Model

Persistent per-player. Stores skill tree progression.

```cairo
pub struct PlayerSkillTree {
    #[key]
    pub player: ContractAddress,
    /// Packed: 15 skills × (4 bits level + 1 bit branch_chosen + 1 bit branch_id) = 90 bits
    pub skill_data: felt252,
}
```

**Bit layout per skill (6 bits):**

| Bits | Field | Size | Range |
|---|---|---|---|
| 0-3 | level | 4 | 0-9 |
| 4 | branch_chosen | 1 | 0=no, 1=yes |
| 5 | branch_id | 1 | 0=A, 1=B |

**Total**: 15 skills × 6 bits = 90 bits. Fits in one felt252.
**Skill ID mapping**: skill_data bits `[id*6 .. id*6+5]` for skill ID 0-14.

### DraftState Model

Per-game (per-run). Single pool, shared reroll counter.

```cairo
pub struct DraftState {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
    pub active: bool,
    pub event_slot: u8,          // Which draft event (0-9)
    pub event_type: u8,          // 1=post_level_1, 2=post_boss, 3=zone_micro
    pub trigger_level: u8,       // Level that triggered this draft
    pub zone: u8,                // Current zone (1-5)
    pub choice_1: u8,            // Skill ID (1-15) for card 1
    pub choice_2: u8,            // Skill ID (1-15) for card 2
    pub choice_3: u8,            // Skill ID (1-15) for card 3
    pub reroll_count: u8,        // Shared reroll counter
    pub spent_cubes: u16,        // Total cubes spent on rerolls this draft
    pub completed_mask: u16,     // Bitmask of completed event slots
    pub selected_picks: felt252, // Historical picks (packed)
    pub selected_slot: u8,       // Which card was selected (0-2)
    pub selected_choice: u8,     // Which skill ID was selected
}
```

### PlayerMeta Model

```cairo
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    pub data: felt252,      // Bit-packed stats
    pub best_level: u8,     // Highest level reached
}
```

### PlayerMeta.data Bit Layout (48 bits used)

| Bits | Field | Size | Description |
|------|-------|------|-------------|
| 0-15 | total_runs | 16 | Lifetime run count |
| 16-47 | total_cubes_earned | 32 | Lifetime cubes earned |

### GameLevel Model

```cairo
pub struct GameLevel {
    #[key]
    pub game_id: u64,
    pub level: u8,
    pub points_required: u16,
    pub max_moves: u16,
    pub difficulty: u8,
    // Primary constraint
    pub constraint_type: u8,
    pub constraint_value: u8,
    pub constraint_count: u8,
    // Secondary constraint
    pub constraint2_type: u8,
    pub constraint2_value: u8,
    pub constraint2_count: u8,
    // Tertiary constraint (boss levels 40/50)
    pub constraint3_type: u8,
    pub constraint3_value: u8,
    pub constraint3_count: u8,
    // Cube thresholds
    pub cube_3_threshold: u16,
    pub cube_2_threshold: u16,
}
```

Synced to client via Torii. Single source of truth for level config.

### File Structure

#### Contracts

```
contracts/src/
├── constants.cairo              # Grid constants, namespace
├── events.cairo                 # Event definitions
├── store.cairo                  # World store helpers
├── models/
│   ├── game.cairo               # Game state model
│   ├── player.cairo             # PlayerMeta model
│   ├── config.cairo             # GameSettings (configurable)
│   ├── draft.cairo              # DraftState model
│   └── skill_tree.cairo         # PlayerSkillTree model
├── systems/
│   ├── game.cairo               # Main game logic (create, move, surrender)
│   ├── draft.cairo              # Draft system (open, reroll, select)
│   ├── skill_tree.cairo         # Skill tree (upgrade, branch, respec)
│   ├── skill_effects.cairo      # Skill effect computation (separate contract)
│   ├── grid.cairo               # Grid manipulation + skill effect application
│   ├── moves.cairo              # Move resolution + world skill hooks
│   ├── bonus.cairo              # Bonus skill activation
│   ├── level.cairo              # Level generation + charge distribution
│   ├── cube_token.cairo         # ERC-20 CUBE token
│   ├── quest.cairo              # Daily quest system
│   ├── config.cairo             # Game settings management
│   ├── achievement.cairo        # Achievement tracking
│   └── renderer.cairo           # On-chain SVG renderer
├── types/
│   ├── difficulty.cairo         # Difficulty enum
│   ├── constraint.cairo         # Constraint types
│   ├── level.cairo              # LevelConfig struct
│   └── bonus.cairo              # Bonus enum + skill IDs
├── helpers/
│   ├── level.cairo              # Level generation with settings
│   ├── boss.cairo               # Boss identity system (10 bosses)
│   ├── packing.cairo            # Bit-pack/unpack for run_data + skill_tree
│   ├── skill_effects.cairo      # Skill effect calculations (BonusEffect, WorldEffects)
│   ├── controller.cairo         # Grid manipulation
│   ├── gravity.cairo            # Block falling logic
│   ├── game_over.cairo          # Game over + cube minting
│   └── random.cairo             # VRF / pseudo-random
└── elements/
    ├── bonuses/                 # Bonus implementations
    ├── difficulties/            # Difficulty configurations
    ├── tasks/                   # Quest task definitions
    └── quests/                  # Quest implementations
```

#### Client

```
client-budokan/src/
├── dojo/
│   ├── game/
│   │   ├── models/game.ts              # Game model
│   │   ├── types/bonus.ts              # Bonus/skill enums
│   │   ├── types/skillData.ts          # Skill tree data types
│   │   └── helpers/runDataPacking.ts   # Bit-pack/unpack
│   ├── systems.ts                      # Contract call wrappers
│   └── contractSystems.ts             # System interfaces
├── hooks/
│   ├── useGame.tsx                     # Game state hook
│   ├── usePlayerMeta.tsx               # Meta progression hook
│   ├── useCubeBalance.tsx              # ERC-20 balance
│   ├── useDraft.tsx                    # Draft state hook
│   └── useSkillTree.tsx                # Skill tree hook
└── ui/
    ├── pages/
    │   ├── HomePage.tsx                # Home screen
    │   ├── PlayScreen.tsx              # Game play screen
    │   ├── DraftPage.tsx               # Draft card selection
    │   ├── SkillTreePage.tsx           # Persistent skill upgrades
    │   └── ...
    └── components/
        └── ...
```

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

### Quest Chains

Progress is cumulative within each category. Quests within a family are tiered — completing tier 1 unlocks tier 2, etc. The Finisher quest requires all 12 other quests.

### Integration Points

| Game Function | Quest Progress |
|---------------|---------------|
| `create_with_cubes()` | +1 Grinder (games played) |
| `move()` | +N LineClearer (lines cleared) |
| `move()` | +1 ComboThree/Five/Seven (if combo achieved) |

### Dependencies

Uses Cartridge's `quest` and `achievement` packages from the arcade repository. Quest system needs `MINTER_ROLE` on `cube_token` to distribute CUBE rewards.

### Known Limitation

The Cartridge Controller's built-in profile quest UI claim button does not work (ENTRYPOINT_NOT_FOUND). Use the in-game QuestsDialog instead, which calls `quest_system.claim()` correctly.

---

## Achievement System

28 trophies tracked via Cartridge's arcade achievement system:

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

- [CONFIGURABLE_SETTINGS.md](./CONFIGURABLE_SETTINGS.md) — GameSettings customization
- [CONSTRAINT_CONFIG.md](./CONSTRAINT_CONFIG.md) — Constraint budget and cost function details
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Network deployment guide
