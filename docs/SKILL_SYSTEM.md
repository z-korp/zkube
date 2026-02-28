# zKube Skill System Reference

> **Status:** Implemented
> **Source of Truth:** `contracts/src/helpers/skill_effects.cairo`
> **Principle:** CONTRACT IS LAW — all values in this document are derived from the deployed contract code.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Skill ID Layout](#skill-id-layout)
3. [Level Progression](#level-progression)
4. [Upgrade Costs](#upgrade-costs)
5. [Charge System](#charge-system)
6. [Archetype Domain Rules](#archetype-domain-rules)
7. [Tempo Archetype](#tempo-archetype-purple)
8. [Scaling Archetype](#scaling-archetype-yellow)
9. [Risk Archetype](#risk-archetype-red)
10. [Control Archetype](#control-archetype-blue)
11. [Draft System](#draft-system)
12. [Contract Reference](#contract-reference)

---

## System Overview

| Property | Value |
|----------|-------|
| Archetypes | 4 (Tempo, Scaling, Risk, Control) |
| Total Skills | 12 (4 active + 8 passive) |
| Max Level per Skill | 5 (displayed 1-5) |
| Branch Point | Level 3 (choose Branch A or B) |
| Loadout Slots per Run | 3 |
| Max Charges per Active Skill | 3 |
| Skills per Archetype | 3 (1 active + 2 passive) |

---

## Skill ID Layout

| ID | Archetype | Type | Name |
|:--:|-----------|------|------|
| 1 | Tempo (Purple) | Active | Combo Surge |
| 2 | Scaling (Yellow) | Active | Momentum |
| 3 | Risk (Red) | Active | Harvest |
| 4 | Control (Blue) | Active | Tsunami |
| 5 | Tempo | Passive | Rhythm |
| 6 | Tempo | Passive | Cascade Mastery |
| 7 | Scaling | Passive | Overdrive |
| 8 | Scaling | Passive | Endgame Focus |
| 9 | Risk | Passive | High Stakes |
| 10 | Risk | Passive | Gambit |
| 11 | Control | Passive | Structural Integrity |
| 12 | Control | Passive | Grid Harmony |

---

## Level Progression

```
Level 1: Foundation       --- Core identity, minimal effect
Level 2: Enhancement      --- Stronger version of Level 1
Level 3: Branch Point     --- CHOOSE Branch A or Branch B (permanent)
Level 4: Deepen           --- Significant power spike on chosen branch
Level 5: Capstone         --- Defining power; run-shaping effect
```

Branch IDs in contract: `NONE = 0`, `A = 1`, `B = 2`

Branch respec is possible at 50% CUBE cost of total investment.

---

## Upgrade Costs

| Level | Cost (CUBE) |
|:-----:|------------:|
| 1 | 100 |
| 2 | 500 |
| 3 | 1,000 |
| 4 | 5,000 |
| 5 | 10,000 |

---

## Charge System

Charges fuel **active skills only**. Passive skills do not use charges.

| Rule | Value |
|------|-------|
| Max charges per active skill | 3 |
| Starting charges on unlock | 1 |
| Base charge cadence | +1 to ALL active skills every 5 levels cleared |
| Cadence modifier | Overdrive passive (skill 7) reduces cadence interval |

---

## Archetype Domain Rules

### Tempo (Purple)

> Combo depth, cascade amplification, rhythm mastery.

**Allowed:** Combo depth/add, cascade amplification, combo-streak-gated bonuses
**Forbidden:** Cube generation, flat score injection, grid manipulation, score multipliers

### Scaling (Yellow)

> Score scaling, late-run ramping. The ONLY archetype that modifies charge cadence.

**Allowed:** Score per zone, flat score, per-level scaling, charge cadence reduction
**Forbidden:** Cube generation, move refunds, grid manipulation, combo injection

### Risk (Red)

> Cube generation, block destruction, line injection. High reward, high stakes.

**Allowed:** Cube generation, conditional cube bursts, grid height rewards, line injection, block destruction
**Forbidden:** Safe passive scaling, score multipliers, constraint easing

### Control (Blue)

> Row clears, targeted destruction, grid shaping, stability.

**Allowed:** Row clears, targeted block destruction, grid shaping, extra row removal
**Forbidden:** Score multipliers, cube generation, combo manipulation

---

## Tempo Archetype (Purple)

### Skill 1: Combo Surge (Active)

**Domain:** Combo amplification. Consumes 1 charge per use.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | Next cascade: +1 combo depth |
| 2 | -- | Next cascade: +2 combo depth |
| 3 | A -- Burst | +3 combo depth |
| 3 | B -- Flow | +1 combo depth for the full level (once per level, non-stackable) |
| 4 | A -- Burst | +5 combo depth |
| 4 | B -- Flow | +2 combo depth for the full level (once per level, non-stackable) |
| 5 | A -- Burst | +7 combo depth |
| 5 | B -- Flow | +4 combo depth for the full level (once per level, non-stackable) |

**Contract fields:** Branch A uses `combo_add`. Branch B uses `combo_surge_flow = true` with `combo_surge_flow_depth`.

---

### Skill 5: Rhythm (Passive)

**Domain:** Combo streak scaling. Converts cumulative combo streak into combo depth bursts.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | Every 12 combo streak -> next move +1 combo depth |
| 2 | -- | Every 10 combo streak -> next move +1 combo depth |
| 3 | A -- Acceleration | Every 8 streak -> +1 combo depth |
| 3 | B -- Stability | Every 10 streak -> +2 combo depth |
| 4 | A -- Acceleration | Every 6 streak -> +1 combo depth |
| 4 | B -- Stability | Every 10 streak -> +3 combo depth |
| 5 | A -- Acceleration | Every 4 streak -> +1 combo depth |
| 5 | B -- Stability | Every 10 streak -> +4 combo depth |

**Contract fields:** `rhythm_streak_threshold`, `rhythm_combo_add`

---

### Skill 6: Cascade Mastery (Passive)

**Domain:** Multi-phase gravity cascades. Rewards deep cascade depth within a single move resolution.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | If cascade depth >= 5 -> +1 combo depth |
| 2 | -- | If cascade depth >= 4 -> +1 combo depth |
| 3 | A -- Amplify | If cascade depth >= 4 -> +2 combo depth |
| 3 | B -- Extend | If cascade depth >= 3 -> +1 combo depth |
| 4 | A -- Amplify | If cascade depth >= 4 -> +3 combo depth |
| 4 | B -- Extend | If cascade depth >= 2 -> +1 combo depth |
| 5 | A -- Amplify | If cascade depth >= 4 -> +4 combo depth |
| 5 | B -- Extend | If cascade depth >= 2 -> +2 combo depth |

**Contract fields:** `cascade_depth_threshold`, `cascade_combo_add`

---

## Scaling Archetype (Yellow)

### Skill 2: Momentum (Active)

**Domain:** Score burst with zone scaling. Consumes 1 charge per use.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | +1 score per zone cleared this run |
| 2 | -- | +2 score per zone cleared this run |
| 3 | A -- Late Bloom | +3 score per zone cleared this run |
| 3 | B -- Stable Growth | +5 flat score |
| 4 | A -- Late Bloom | +5 score per zone cleared this run |
| 4 | B -- Stable Growth | +10 flat score |
| 5 | A -- Late Bloom | +10 score per zone cleared this run |
| 5 | B -- Stable Growth | +20 flat score |

**Contract fields:** Branch A uses `score_per_zone`. Branch B uses `score_add`.

---

### Skill 7: Overdrive (Passive)

**Domain:** Charge cadence reduction. The ONLY skill that modifies the charge refill interval.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | Charge cadence: every 4 levels (base is 5) |
| 2 | -- | Charge cadence: every 3 levels |
| 3 | A -- Amplify | Charge cadence: every 2 levels |
| 3 | B -- Overflow | Cadence every 3 levels + start with +1 charge on all actives |
| 4 | A -- Amplify | Cadence every 2 levels + start with +1 charge |
| 4 | B -- Overflow | Cadence every 3 levels + start with +2 charges |
| 5 | A -- Amplify | Charge cadence: every 1 level |
| 5 | B -- Overflow | Cadence every 2 levels + start with +2 charges |

**Contract fields:** `overdrive_cadence`, `overdrive_starting_charges`

---

### Skill 8: Endgame Focus (Passive)

**Domain:** Late-run score ramping. Adds score at level start.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | +1 score at level start on levels >= 10 |
| 2 | -- | +2 score at level start on levels >= 20 |
| 3 | A -- Deep End | +0.2 score per level cleared at level start |
| 3 | B -- Smooth Ramp | +5 score at level start on levels >= 25 |
| 4 | A -- Deep End | +0.3 score per level cleared at level start |
| 4 | B -- Smooth Ramp | +10 score at level start on levels >= 30 |
| 5 | A -- Deep End | +0.5 score per level cleared at level start |
| 5 | B -- Smooth Ramp | +20 score at level start on levels >= 40 |

**Contract fields:** Branch A uses `endgame_per_level_x10` (stored as x10: 2 = 0.2, 3 = 0.3, 5 = 0.5). Branch B uses `endgame_score` + `endgame_min_level`.

---

## Risk Archetype (Red)

### Skill 3: Harvest (Active)

**Domain:** Cube generation via block destruction or line injection. Consumes 1 charge per use.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | Destroy 2 random blocks, earn cubes by block size |
| 2 | -- | Destroy 3 random blocks, earn cubes by block size |
| 3 | A -- Extraction | Destroy 5 random blocks, earn cubes by block size |
| 3 | B -- Injection | Add 1 line, +10 cubes |
| 4 | A -- Extraction | Destroy 7 random blocks, earn cubes by block size |
| 4 | B -- Injection | Add 2 lines, +20 cubes |
| 5 | A -- Extraction | Destroy 10 random blocks, earn cubes by block size |
| 5 | B -- Injection | Add 3 lines, +40 cubes |

**Contract fields:** Branch A uses `blocks_to_destroy` + `cubes_per_block_size = true`. Branch B uses `lines_to_add` + `cubes_flat`.

---

### Skill 9: High Stakes (Passive)

**Domain:** Grid height cube rewards. Earn cubes per clear when grid is at dangerous heights.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | If grid >= 9 rows -> +1 cube per clear |
| 2 | -- | If grid >= 8 rows -> +1 cube per clear |
| 3 | A -- Edge | If grid >= 8 rows -> +3 cubes per clear |
| 3 | B -- Threshold | If grid >= 7 rows -> +1 cube per clear |
| 4 | A -- Edge | If grid >= 8 rows -> +5 cubes per clear |
| 4 | B -- Threshold | If grid >= 6 rows -> +1 cube per clear |
| 5 | A -- Edge | If grid >= 8 rows -> +10 cubes per clear |
| 5 | B -- Threshold | If grid >= 5 rows -> +1 cube per clear |

**Contract fields:** `high_stakes_height`, `high_stakes_cubes`

---

### Skill 10: Gambit (Passive)

**Domain:** Survive danger, earn cubes. Once per level.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | If grid reaches >= 9 and you survive -> +3 cubes (once/level) |
| 2 | -- | If grid reaches >= 9 and you survive -> +5 cubes (once/level) |
| 3 | A -- Survivor | Grid >= 9 and survive -> +10 cubes (once/level) |
| 3 | B -- Momentum | Grid >= 8 and survive -> +5 cubes (once/level) |
| 4 | A -- Survivor | Grid >= 9 and survive -> +15 cubes (once/level) |
| 4 | B -- Momentum | Grid >= 7 and survive -> +5 cubes (once/level) |
| 5 | A -- Survivor | Grid >= 9 and survive -> +30 cubes (once/level) |
| 5 | B -- Momentum | Grid >= 6 and survive -> +5 cubes (once/level) |

**Contract fields:** `gambit_height`, `gambit_cubes`

---

## Control Archetype (Blue)

### Skill 4: Tsunami (Active)

**Domain:** Targeted block/row destruction. Consumes 1 charge per use.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | Clear 1 targeted block |
| 2 | -- | Clear 2 targeted blocks |
| 3 | A -- Wide | Clear 3 targeted blocks |
| 3 | B -- Target | Destroy 1 targeted row |
| 4 | A -- Wide | Clear 5 targeted blocks |
| 4 | B -- Target | Destroy 2 targeted rows |
| 5 | A -- Wide | Clear all blocks of targeted size |
| 5 | B -- Target | Destroy 3 targeted rows |

**Contract fields:** Branch A uses `blocks_to_clear` (L5A: `clear_by_size = true`). Branch B uses `rows_to_clear`.

---

### Skill 11: Structural Integrity (Passive)

**Domain:** Grid stability. First line clear this move destroys extra rows when grid is high.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | If grid >= 9 -> first clear destroys +1 extra row |
| 2 | -- | If grid >= 8 -> first clear destroys +1 extra row |
| 3 | A -- Aggressive | If grid >= 8 -> +2 extra rows |
| 3 | B -- Safe | If grid >= 7 -> +1 extra row |
| 4 | A -- Aggressive | If grid >= 8 -> +3 extra rows |
| 4 | B -- Safe | If grid >= 6 -> +1 extra row |
| 5 | A -- Aggressive | If grid >= 8 -> +4 extra rows |
| 5 | B -- Safe | If grid >= 5 -> +1 extra row |

**Contract fields:** `si_height`, `si_extra_rows`

---

### Skill 12: Grid Harmony (Passive)

**Domain:** Grid stability. Extra row removal on line clears when grid is high.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | -- | If grid >= 9 -> next clear removes +1 extra row |
| 2 | -- | If grid >= 8 -> next clear removes +1 extra row |
| 3 | A -- Stabilize | If grid >= 8 -> every clear removes +1 extra row |
| 3 | B -- Precision | If grid >= 8 -> next clear removes +2 extra rows |
| 4 | A -- Stabilize | If grid >= 7 -> every clear removes +1 extra row |
| 4 | B -- Precision | If grid >= 8 -> next clear removes +3 extra rows |
| 5 | A -- Stabilize | If grid >= 6 -> every clear removes +1 extra row |
| 5 | B -- Precision | If grid >= 8 -> next clear removes +4 extra rows |

**Contract fields:** `gh_height`, `gh_extra_rows`, `gh_every_clear` (Branch A sets `every_clear = true`)

---

## Draft System

Draft is the in-run build engine. No shop, no mid-run skill swap.

### Loadout Pacing (3 Slots)

Run starts with 0 equipped skills. Skills are acquired through augment pacing:

| Event | Purpose | Outcome |
|-------|---------|---------|
| Post Level 1 | Augment pick A | Fill slot 1 |
| Zone 1 micro draft (L2-L9) | Augment pick B | Fill slot 2 |
| Post Boss 1 (L10 clear) | Augment pick C | Fill slot 3 (full loadout) |

After loadout is full, drafts are upgrade-only (after boss clears at L20, L30, L40, L50).

### Reroll System

Shared escalating counter per draft event:

| Reroll # | Cost (CUBE) |
|:--------:|------------:|
| 1 | 5 |
| 2 | 15 |
| 3 | 45 |
| 4 | 135 |
| 5+ | 405 |

Formula: `cost(n) = 5 * 3^(n-1)`

### Pool Construction

- **Loadout < 3:** All 12 skills generate entries (add new or upgrade existing)
- **Loadout = 3:** Only equipped skills generate entries (upgrade only)
- **Branch at L3:** If tree has no branch locked, both A and B appear as separate entries
- **Maxed skills (L5):** Generate 0 entries

---

## Contract Reference

| File | Purpose |
|------|---------|
| `contracts/src/helpers/skill_effects.cairo` | Skill effect tables (all values) |
| `contracts/src/types/bonus.cairo` | Active skill enum (ComboSurge=1, Momentum=2, Harvest=3, Tsunami=4) |
| `contracts/src/helpers/packing.cairo` | RunData bit packing, skill tree data packing |
| `contracts/src/systems/skill_tree.cairo` | Persistent skill tree (upgrade, branch, respec) |
| `contracts/src/systems/draft.cairo` | Draft system (pool, picks, rerolls) |
| `contracts/src/systems/grid.cairo` | Move resolution + active/passive skill hooks |

### Data Structures

**ActiveEffect** (returned by `active_effect_for_skill`):
```
combo_add, combo_surge_flow, combo_surge_flow_depth, score_add, score_per_zone,
blocks_to_destroy, cubes_per_block_size, lines_to_add, cubes_flat,
blocks_to_clear, clear_by_size, rows_to_clear
```

**PassiveEffect** (returned by `passive_effect_for_skill`):
```
rhythm_streak_threshold, rhythm_combo_add, cascade_depth_threshold, cascade_combo_add,
overdrive_cadence, overdrive_starting_charges, endgame_score, endgame_min_level,
endgame_per_level_x10, high_stakes_height, high_stakes_cubes, gambit_height,
gambit_cubes, si_height, si_extra_rows, gh_height, gh_extra_rows, gh_every_clear
```
