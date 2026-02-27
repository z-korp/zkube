# zKube Skill System — vNext Design Spec

> **Status**: Design spec — NOT YET IMPLEMENTED.
> **Purpose**: Prescriptive specification for the next version of the skill system. Use this document as the source of truth for implementation.
> **Replaces**: v1 system (15 skills, 5 archetypes, 10 levels, branch at level 5).

---

## Table of Contents

1. [Design Goals](#design-goals)
2. [Systemic Changes (v1 → vNext)](#systemic-changes-v1--vnext)
3. [System Overview](#system-overview)
4. [Archetypes (4)](#archetypes-4)
5. [Skill Structure](#skill-structure)
6. [Level Progression (5 Levels)](#level-progression-5-levels)
7. [Charge System](#charge-system)
8. [Cube Economy Rules](#cube-economy-rules)
9. [Draft System](#draft-system)
10. [Domain Separation Rules](#domain-separation-rules)
11. [Tempo — Flow & Cascades](#-tempo--flow--cascades)
12. [Scaling — Long-Run Growth](#-scaling--long-run-growth)
13. [Risk / Economy — Greed & Volatility](#-risk--economy--greed--volatility)
14. [Control — Board Mastery](#-control--board-mastery)
15. [Implementation Needs](#implementation-needs)

---

## Design Goals

1. **Reduce complexity**: 15 → 12 skills, 10 → 5 levels, 5 → 4 archetypes
2. **Strict domain separation**: Each archetype owns a clear domain; no cross-domain bleed
3. **Meaningful branches**: Branch at level 3 (not level 5) — players commit earlier
4. **Scarce charges**: Active skills are high-impact, timing-based — not spam tools
5. **Clear cube economy**: Only Risk archetype primarily generates cubes
6. **Skill-expressive gameplay**: Tempo = technical, Scaling = patient, Risk = greedy, Control = stabilizing
7. **No runaway loops**: All repeatable effects are hard-capped per level

---

## Systemic Changes (v1 → vNext)

### What's Changing

| Area | v1 (Current) | vNext |
|------|:---:|:---:|
| Archetypes | 5 (Tempo, Scaling, Economy, Control, Risk) | **4** (merge Economy into Risk) |
| Skills | 15 (5 active + 10 passive) | **12** (4 active + 8 passive) |
| Skill levels | 10 (0-9 internal) | **5** (1-5 displayed) |
| Branch point | Level 5 (internal 4) | **Level 3** |
| Bonus enum | 5 values (Combo, Score, Harvest, Wave, Supply) | **4 active skill IDs** (1-4) + 8 passive IDs (5-12) |
| Naming | "Bonus Skills" / "World Skills" | **"Active Skills"** / **"Passive Skills"** |
| Bonus levels | 3 (L1-L3) | **5** with branch at L3 |
| Score bonus | +10/+20/+30 flat | **Removed** → Momentum Scaling (now active charge-based score burst) |
| Supply bonus | Add 1-3 lines | **Removed** → Harvest Branch B |
| Wave bonus | Clear 1-3 bottom rows | **Redesigned** → Tsunami (targeted blocks/rows) |
| Harvest bonus | Destroy all blocks of chosen size | **Redesigned** → random blocks, cubes = block size |
| Combo bonus | +1/+2/+3 combo | **Redesigned** → Combo Surge (depth, branches) |
| Consumables | 3 types (BonusCharge, LevelUp, SwapBonus) | **Removed entirely** |
| In-game shop | Every 10 levels | **Removed** |
| Permanent shop | Bag size, unlock Wave/Supply, bridging | **GONE** — only skill tree remains for CUBE spending |
| Passive skill structs | BonusEffect/WorldEffects (33+47 fields) | **New structs** (ActiveEffect + PassiveEffect) |
| Charge refill | Combo-based + cadence | **Cadence only** (every 5 levels, reduced by Overdrive passive) |
| Cascade tracking | Not tracked | **New** transient `cascade_depth` counter |
| Grid height effects | Only via constraint (KeepGridBelow) | **Core mechanic** for 5+ skills |

### What's Being Removed

| Feature | Contract Location | Why |
|---------|-------------------|-----|
| `ConsumableType` enum | `types/consumable.cairo` | Consumables replaced by skills |
| `purchase_consumable()` | `systems/game.cairo` | No more in-game shop |
| In-game shop logic | `systems/game.cairo` (shop_purchases, last_shop_level) | Boss upgrades replace shop |
| Score bonus (type 2) | `types/bonus.cairo` | Replaced by Momentum Scaling (now active) |
| Supply bonus (type 5) | `types/bonus.cairo` | Folded into Harvest Branch B |
| `BonusEffect` / `WorldEffects` structs | `helpers/skill_effects.cairo` | Complete rewrite |
| run_data: `combo_count`, `score_count`, `harvest_count`, `wave_count`, `supply_count` | `helpers/packing.cairo` | Replaced by per-slot charges |
| run_data: `last_shop_level`, `shop_purchases`, `shop_level_up_bought`, `shop_swap_bought` | `helpers/packing.cairo` | Shop removed |
| run_data: `unallocated_charges` | `helpers/packing.cairo` | No more charge pool |

### What's Being Added

| Feature | Purpose |
|---------|---------|
| `branch` per loadout slot (2 bits × 3) | Track A/B branch choice per skill |
| `gambit_triggered_this_level` (1 bit) | Gambit once-per-level flag, reset on level advance |
| `combo_surge_flow_active` (1 bit) | Combo Surge Branch B level-wide flag, reset on level advance |
| `cascade_depth` (transient) | Count gravity phases per move — NOT stored in run_data |
| Overdrive passive cadence modifier | Global charge cadence override (4/3/2/1 levels instead of 5) |
| Grid height checks in move resolution | Structural Integrity, Grid Harmony, High Stakes, Gambit |
| Targeted block/row selection | Tsunami needs player targeting data in contract call (Harvest uses random) |

### Skill Name Mapping (v1 → vNext)

| v1 Skill | v1 ID | vNext Equivalent | vNext ID | Notes |
|----------|:-----:|------------------|:--------:|-------|
| Combo | 1 | **Combo Surge** | 1 | Active. Branch B = level-wide combo depth. |
| Score | 2 | — | — | Removed → Momentum Scaling (now active) |
| Harvest | 3 | **Harvest** | 3 | Active. Cubes scale with block SIZE. Random blocks. |
| Wave | 4 | **Tsunami** | 4 | Active. Targeted blocks/rows. |
| Supply | 5 | — | — | Removed → Harvest Branch B |
| Tempo | 6 | **Rhythm** | 5 | Passive. Redesigned around combo_streak. |
| Fortune | 7 | — | — | Removed |
| Surge | 8 | **Momentum Scaling** | 2 | **Active** (was passive). Score burst on charge use. |
| Catalyst | 9 | — | — | Removed |
| Resilience | 10 | — | — | Removed |
| Focus | 11 | **Structural Integrity** | 11 | Passive. Extra row removal at high grid. |
| Expansion | 12 | **Grid Harmony** | 12 | Passive. Extra row removal on clear at high grid. |
| Momentum | 13 | — | — | Removed |
| Adrenaline | 14 | **High Stakes** | 9 | Passive. Cube-per-clear at height threshold. |
| Legacy | 15 | — | — | Removed → Endgame Focus |
| — | — | **Cascade Mastery** | 6 | NEW passive. |
| — | — | **Overdrive** | 7 | **Passive** (was active). Charge cadence reduction. |
| — | — | **Endgame Focus** | 8 | NEW passive. |
| — | — | **Gambit** | 10 | NEW passive. |

---

## System Overview

| Property | v1 (Current) | vNext (This Spec) |
|----------|:---:|:---:|
| Archetypes | 5 | **4** |
| Skills | 15 (5 active + 10 passive) | **12** (4 active + 8 passive) |
| Max levels per skill | 10 (0-9 internal) | **5** (1-5 displayed) |
| Branch point | Level 5 (internal 4) | **Level 3** |
| Loadout slots per run | 3 | **3** |
| Max charges per skill | 3 | **3** |
| Naming: Active skills | "Bonus Skills" | **"Active Skills"** |
| Naming: Passive skills | "World Skills" | **"Passive Skills"** |

### Key Constants (vNext)

| Constant | Value | Notes |
|----------|-------|-------|
| `MAX_LOADOUT_SLOTS` | 3 | Unchanged |
| `TOTAL_SKILLS` | 12 | 4 active + 8 passive |
| `MAX_SKILL_LEVEL` | 5 | Displayed 1-5 |
| `BRANCH_POINT_LEVEL` | 3 | Player chooses Branch A or B at level 3 |
| `SKILLS_PER_ARCHETYPE` | 3 | 1 active + 2 passive |
| `NUM_ARCHETYPES` | 4 | Tempo, Scaling, Risk, Control |
| `MAX_CHARGES_PER_SKILL` | 3 | Hard cap |
| `CHARGE_CADENCE_BASE` | 5 | +1 charge to all actives every 5 levels cleared (modified by Overdrive passive) |

---

## Archetypes (4)

### 🟣 Tempo (Purple)

> **Identity**: Combo depth, cascade amplification, rhythm mastery.
> **Feel**: Technical and skill-expressive. Rewards mechanical precision.

**ALLOWED**: Combo depth/add, cascade amplification, combo-streak-gated bonuses, combo-tied move refunds
**FORBIDDEN**: Cube generation, flat score injection, grid manipulation, score multipliers

### 🟡 Scaling (Yellow)

> **Identity**: Score multipliers, per-level scaling, late-run ramping. The ONLY archetype allowed to modify charge cadence.
> **Feel**: Weak early, powerful late. Patience rewarded.

**ALLOWED**: Score multipliers (%), per-level-cleared scaling, late-run ramping, charge cadence reduction
**FORBIDDEN**: Cube generation, move refunds, grid manipulation, combo injection

### 🔴 Risk / Economy (Red)

> **Identity**: Cube generation, conditional cube bursts, grid height rewards, line injection, volatility. MUST include real downside.
> **Feel**: Dangerous and greedy. High reward, high stakes.

**ALLOWED**: Cube generation (primary source), conditional cube bursts, grid height rewards, line injection, volatile mechanics with real downside
**FORBIDDEN**: Safe passive scaling, score multipliers, constraint easing

### 🔵 Control (Blue)

> **Identity**: Row clears, targeted destruction, grid shaping, difficulty reduction, constraint easing.
> **Feel**: Stabilizes chaos. Safety net, not accelerator.

**ALLOWED**: Row clears, targeted block destruction, grid shaping, difficulty reduction, constraint easing
**FORBIDDEN**: Score multipliers, cube generation/amplification, combo manipulation

---

## Skill Structure

Each archetype contains exactly **3 skills**:

| Slot | Type | Charges? |
|------|------|----------|
| 1 | **Active Skill** — triggered ability | Yes (0-3) |
| 2 | **Passive Skill** — always-on effect | No |
| 3 | **Passive Skill** — always-on effect | No |

### Active Skill Rules

- High impact per use
- Timing-based (when you use it matters)
- Must NOT generate passive economy
- Must NOT be spam tools (charges are scarce)
- Consumes 1 charge per use

### Passive Skill Rules

- Always active during the run
- Scale with skill level
- No player-triggered activation
- All repeatable effects MUST be capped (max procs per level)

### Skill ID Layout

| ID | Archetype | Type | Name |
|:--:|-----------|------|------|
| 1 | 🟣 Tempo | Active | **Combo Surge** |
| 2 | 🟡 Scaling | Active | **Momentum Scaling** |
| 3 | 🔴 Risk | Active | **Harvest** |
| 4 | 🔵 Control | Active | **Tsunami** |
| 5 | 🟣 Tempo | Passive | **Rhythm** |
| 6 | 🟣 Tempo | Passive | **Cascade Mastery** |
| 7 | 🟡 Scaling | Passive | **Overdrive** |
| 8 | 🟡 Scaling | Passive | **Endgame Focus** |
| 9 | 🔴 Risk | Passive | **High Stakes** |
| 10 | 🔴 Risk | Passive | **Gambit** |
| 11 | 🔵 Control | Passive | **Structural Integrity** |
| 12 | 🔵 Control | Passive | **Grid Harmony** |

---

## Level Progression (5 Levels)

```
Level 1: Foundation       ─── Core identity, minimal effect
Level 2: Enhancement      ─── Stronger version of Level 1
Level 3: Branch Point     ─── CHOOSE Branch A or Branch B (permanent*)
Level 4: Deepen           ─── Significant power spike on chosen branch
Level 5: Capstone         ─── Defining power; run-shaping effect
```

*Branch respec possible at 50% CUBE cost of invested amount.

### Design Intent per Level

| Level | Name | Design Intent |
|:-----:|------|---------------|
| 1 | Foundation | Establish the skill's core loop. Noticeable but not transformative. |
| 2 | Enhancement | Strengthen the foundation. Player should feel the upgrade clearly. |
| 3 | Branch A / B | Specialize. Two meaningfully different paths. Commitment point. |
| 4 | Deepen | Major power increase on chosen path. This is where the build "comes online." |
| 5 | Capstone | Signature effect. Should feel like the payoff for full investment. |

### Upgrade Costs (CUBE)

| Level | Cost | Notes |
|:-----:|-----:|-------|
| 1 | `100` | Cheap — encourage trying skills |
| 2 | `500` | Moderate |
| 3 | `1000` | Branch commitment |
| 4 | `5000` | Expensive |
| 5 | `10000` | Premium — capstone investment |

**Respec cost**: 50% of total CUBE invested in that skill.

---

## Charge System

Charges fuel **Active Skills** only. Passive skills don't use charges.

| Rule | Value |
|------|-------|
| Max charges per active skill | **3** |
| Starting charges on unlock | **1** |
| Base charge cadence | **+1 to ALL active skills every 5 levels cleared** |
| Cadence modifier (Overdrive passive) | Reduce cadence from 5 to 4 → 3 → 2 levels |
| Charge generation from combos/score | **FORBIDDEN** (no skill may do this) |

### Charge Gain Timeline (Base Cadence)

| Levels Cleared | Charges Gained | Total (if started at 1) |
|:--------------:|:--------------:|:-----------------------:|
| 0 (on unlock) | — | 1 |
| 5 | +1 | 2 |
| 10 | +1 | 3 (capped) |

### Charge Gain Timeline (Scaling Branch B — Cadence Reduced to 3)

| Levels Cleared | Charges Gained | Total (if started at 1) |
|:--------------:|:--------------:|:-----------------------:|
| 0 (on unlock) | — | 1 |
| 3 | +1 | 2 |
| 6 | +1 | 3 (capped) |

---

## Cube Economy Rules

| Archetype | Cube Generation |
|-----------|:---:|
| 🟣 Tempo | ❌ None |
| 🟡 Scaling | ❌ None |
| 🔴 Risk | ✅ Primary source |
| 🔵 Control | ❌ None |

### Hard Rules

1. **Tempo and Scaling generate zero cubes** — no exceptions
2. **Risk cube generation must be conditional** — tied to dangerous states
3. **No skill may directly generate charges from combos or score**
4. **Control does not amplify cubes**

---

## Draft System

### Initial Draft (Run Start)

At the beginning of each run, the player drafts their first skill:

1. Player sees **3 skill choices** (cards drawn from pool of 12 skills)
2. Player **selects** one → skill enters loadout at its skill-tree level
3. Draft closes. Player starts the run with 1 skill.
4. Reroll mechanics available (costs CUBE)

### Boss Drafts (After Boss Levels)

After clearing each boss level (10, 20, 30, 40, 50), a boss draft opens:

- **If loadout < 3 slots filled**: Draw from **full pool** of 12 skills. Player can:
  - Select an **unpicked skill** → adds it to the loadout at its tree level
  - Select a **skill already in loadout** → upgrades it by +1 run level
- **If loadout is full (3 slots)**: Draw from **loadout skills only** (upgrade only)
- When upgrading from **level 2 → level 3**, the **branch is randomly assigned** (not player-chosen)

### Draft Pacing Summary

| Event | Trigger | Pool | Action |
|-------|---------|------|--------|
| Initial Draft | Run start | 12 skills | Pick 1 |
| Boss Draft 1 | Clear L10 | Full or loadout | Add or upgrade |
| Boss Draft 2 | Clear L20 | Full or loadout | Add or upgrade |
| Boss Draft 3 | Clear L30 | Full or loadout | Add or upgrade |
| Boss Draft 4 | Clear L40 | Loadout only | Upgrade only |
| Boss Draft 5 | Clear L50 | Loadout only | Upgrade only |

**Max augment picks per run**: 6 (1 initial + 5 boss)

### Reroll Mechanic

- Cost formula: `5 × 3^n` where `n` = reroll count this draft
- Cost sequence: 5, 15, 45, 135, 405, ...
- Costs CUBE (deducted from wallet)
- Only available during initial draft (boss drafts show fixed choices)

### Branch Choice

- At level 3 in the **skill tree** (persistent, outside runs), player must choose Branch A or B
- During runs, if a boss draft upgrades a skill to level 3, branch is **randomly assigned** using the game seed
- Respec possible at 50% CUBE cost (in skill tree, outside runs)

## Domain Separation Rules

### Effect → Archetype Permission Matrix

| Effect | 🟣 Tempo | 🟡 Scaling | 🔴 Risk | 🔵 Control |
|--------|:--------:|:---------:|:------:|:--------:|
| Combo add / depth | ✅ | ❌ | ❌ | ❌ |
| Cascade amplification | ✅ | ❌ | ❌ | ❌ |
| Combo-streak-gated bonus | ✅ | ❌ | ❌ | ❌ |
| Move refund (combo-tied) | ✅ | ❌ | ❌ | ❌ |
| Score multiplier (%) | ❌ | ✅ | ❌ | ❌ |
| Per-level scaling | ❌ | ✅ | ❌ | ❌ |
| Late-run ramping | ❌ | ✅ | ❌ | ❌ |
| Charge cadence reduction | ❌ | ✅ (Overdrive passive) | ❌ | ❌ |
| Cube generation | ❌ | ❌ | ✅ | ❌ |
| Conditional cube bursts | ❌ | ❌ | ✅ | ❌ |
| Grid height rewards | ❌ | ❌ | ✅ | ❌ |
| Line injection | ❌ | ❌ | ✅ | ❌ |
| Volatile / downside mechanics | ❌ | ❌ | ✅ | ❌ |
| Row clears | ❌ | ❌ | ❌ | ✅ |
| Targeted destruction | ❌ | ❌ | ❌ | ✅ |
| Grid shaping | ❌ | ❌ | ❌ | ✅ |
| Difficulty reduction | ❌ | ❌ | ❌ | ✅ |
| Constraint easing | ❌ | ❌ | ❌ | ✅ |
| Flat score injection | ❌ | ❌ | ❌ | ❌ |
| Flat move grants (unconditional) | ❌ | ❌ | ❌ | ❌ |
| Charge gen from combos/score | ❌ | ❌ | ❌ | ❌ |

---

## 🟣 TEMPO — Flow & Cascades

> Combo depth. Cascade amplification. Rhythm mastery.
> **No cubes. No grid manipulation. No score multipliers.**

### 1️⃣ Active — Combo Surge

**ID**: 1 | **Type**: Active (consumes 1 charge) | **Domain**: Combo amplification

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Next cascade: +1 combo depth |
| 2 | — | Next cascade: +2 combo depth |
| 3 | A — Burst | +3 combo depth |
| 3 | B — Flow | +1 combo depth for the full level (once per level, not stackable) |

**Branch A — Burst** (explosive spike potential)

| Level | Effect |
|:-----:|--------|
| 4 | +5 combo depth |
| 5 | +7 combo depth |

**Branch B — Flow** (sustainability for chaining players)

| Level | Effect |
|:-----:|--------|
| 4 | +2 combo depth for the full level (once per level, not stackable) |
| 5 | +4 combo depth for the full level (once per level, not stackable) |

**Design Notes**:
- Burst = explosive spike potential
- Flow = sustainability for chaining players
- No score injection, no cube generation
- Strong synergy with natural cascades

---

### 5️⃣ Passive — Rhythm

**ID**: 5 | **Type**: Passive | **Domain**: Combo streak scaling

Converts combo streak (`combo_counter`) into controlled bursts. Uses existing per-level cumulative combo streak — no new state needed.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Every 12 combo_streak gained → next move +1 combo depth (no cap) |
| 2 | — | Every 10 combo_streak gained → next move +1 combo depth (no cap) |
| 3 | A — Acceleration | Every 8 streak → next move +1 combo depth (no cap) |
| 3 | B — Stability | Every 10 streak → next move +2 combo depth (no cap) |

**Branch A — Acceleration** (scaling combo machine)

| Level | Effect |
|:-----:|--------|
| 4 | Every 6 streak → next move +1 combo depth (no cap) |
| 5 | Every 4 streak → next move +1 combo depth (no cap) |

**Branch B — Stability** (controlled power)

| Level | Effect |
|:-----:|--------|
| 4 | Every 10 streak → next move +3 combo depth (no cap) |
| 5 | Every 10 streak → next move +4 combo depth (no cap) |

**Design Notes**:
- No permanent scaling — resets each level
- Reads existing `combo_counter` (Game model) — zero new tracking state
- Acceleration = more frequent, moderate bursts
- Stability = fewer, larger bursts

---

### 6️⃣ Passive — Cascade Mastery

**ID**: 6 | **Type**: Passive | **Domain**: Multi-phase gravity cascades

Rewards deep cascades. Uses **per-resolution** cascade depth (transient, not cumulative). Distinct from Rhythm which uses cumulative combo_streak.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If cascade depth ≥ 5 → +1 combo depth |
| 2 | — | If cascade depth ≥ 4 → +1 combo depth |
| 3 | A — Amplify | If cascade depth ≥ 4 → +2 combo depth |
| 3 | B — Extend | If cascade depth ≥ 3 → +1 combo depth |

**Branch A — Amplify** (high-skill payoff for deep cascades)

| Level | Effect |
|:-----:|--------|
| 4 | If cascade depth ≥ 4 → +3 combo depth |
| 5 | If cascade depth ≥ 4 → +4 combo depth |

**Branch B — Extend** (consistency path for smoother chaining)

| Level | Effect |
|:-----:|--------|
| 4 | If cascade depth ≥ 2 → +1 combo depth |
| 5 | If cascade depth ≥ 2 → +2 combo depth |

**Design Notes**:
- Amplify = high-skill payoff for deep cascades
- Extend = consistency path for smoother chaining
- Per-resolution only (cascade_depth resets every move) — no cumulative scaling
- Synergizes strongly with Combo Surge

**Implementation**: Add `cascade_depth: u8` counter to `assess_game()` loop (transient local variable — NOT stored in run_data). Increment per outer loop iteration in `grid.cairo:830`.

---

## 🟡 SCALING — Long-Run Growth

> Weak early. Strong late.
> **No cubes. No combo injection. Only archetype that modifies charge cadence.**

### 2️⃣ Active — Momentum Scaling

**ID**: 2 | **Type**: Active (consumes 1 charge) | **Domain**: Score burst with scaling

> Formerly a passive. Now an active skill that uses charges for score injection.
> The core identity is per-level/per-zone score scaling — the longer the run, the bigger the burst.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Use charge: +1 score per zone cleared this run |
| 2 | — | Use charge: +2 score per zone cleared this run |
| 3 | A — Late Bloom | Use charge: +3 score per zone cleared this run |
| 3 | B — Stable Growth | Use charge: +5 flat score |

**Branch A — Late Bloom** (exponential late-run payoff)

| Level | Effect |
|:-----:|--------|
| 4 | Use charge: +5 score per zone cleared this run |
| 5 | Use charge: +10 score per zone cleared this run |

**Branch B — Stable Growth** (consistent value)

| Level | Effect |
|:-----:|--------|
| 4 | Use charge: +10 flat score |
| 5 | Use charge: +20 flat score |

**Design Notes**:
- Late Bloom: At zone 5 (levels 41-50), L5 gives +50 score per charge use
- Stable Growth: Reliable value from first use, no scaling dependency
- ⚠️ **NEEDS DESIGN REVIEW**: These values are adapted from the old passive. May need tuning for active charge-based use.

---

### 7️⃣ Passive — Overdrive

**ID**: 7 | **Type**: Passive | **Domain**: Charge cadence reduction

> Formerly an active score multiplier. Now a passive that reduces the charge refill interval for ALL active skills.
> This is the ONLY skill in the game that modifies charge cadence.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Charge cadence: every 4 levels (was 5) |
| 2 | — | Charge cadence: every 3 levels (was 5) |
| 3 | A — Amplify | Charge cadence: every 2 levels |
| 3 | B — Overflow | Charge cadence: every 3 levels + start run with +1 charge on all actives |

**Branch A — Amplify** (maximum charge throughput)

| Level | Effect |
|:-----:|--------|
| 4 | Charge cadence: every 2 levels + start run with +1 charge on all actives |
| 5 | Charge cadence: every 1 level (charge every level!) |

**Branch B — Overflow** (starting charges + steady cadence)

| Level | Effect |
|:-----:|--------|
| 4 | Charge cadence: every 3 levels + start run with +2 charges on all actives |
| 5 | Charge cadence: every 2 levels + start run with +2 charges on all actives |

**Design Notes**:
- Amplify L5 = charge every level = ~50 total charge refills across a 50-level run (absurd value)
- Overflow = front-loaded charges + moderate cadence (less total charges, but earlier availability)
- ⚠️ **NEEDS DESIGN REVIEW**: Cadence every 1 level (Amplify L5) may be too strong. Consider: every 2 levels + extra starting charges instead.

---

### 8️⃣ Passive — Endgame Focus

**ID**: 8 | **Type**: Passive | **Domain**: Late-run ramping

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | +1 score at level start (once) on levels ≥ 10 |
| 2 | — | +2 score at level start (once) on levels ≥ 20 |
| 3 | A — Deep End | +0.2 score per level cleared at level start (once) |
| 3 | B — Smooth Ramp | +5 score at level start (once) on levels ≥ 25 |

**Branch A — Deep End** (massive late-game spike)

| Level | Effect |
|:-----:|--------|
| 4 | +0.3 score per level cleared at level start (once) |
| 5 | +0.5 score per level cleared at level start (once) |

**Branch B — Smooth Ramp** (always-on linear growth)

| Level | Effect |
|:-----:|--------|
| 4 | +10 score at level start (once) on levels ≥ 30 |
| 5 | +20 score at level start (once) on levels ≥ 40 |

**Design Notes**:
- Deep End = huge payoff but only if you survive to high levels
- Smooth Ramp = consistent value at every level, lower ceiling
---

## 🔴 RISK / ECONOMY — Greed & Volatility

> Primary cube generation. Must include downside.
> **No safe passive scaling. No score multipliers. No constraint easing.**

### 3️⃣ Active — Harvest

**ID**: 3 | **Type**: Active (consumes 1 charge) | **Domain**: Cube generation via block destruction / line injection

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Destroy 2 random blocks → Earn +1 cube per block size (eg size 2 block grants +2 cubes, size 4 block grants +4 cubes) |
| 2 | — | Destroy 3 random blocks → Earn +1 cube per block size (eg size 2 block grants +2 cubes, size 4 block grants +4 cubes) |
| 3 | A — Extraction | Destroy 5 random blocks → Earn +1 cube per block size (eg size 2 block grants +2 cubes, size 4 block grants +4 cubes) |
| 3 | B — Injection | Add 1 line → +10 cubes |

**Branch A — Extraction**

| Level | Effect |
|:-----:|--------|
| 4 | Destroy random 7 blocks → Earn +1 cube per block size (eg size 2 block grants +2 cubes, size 4 block grants +4 cubes) |
| 5 | Destroy random 10 blocks → Earn +1 cube per block size (eg size 2 block grants +2 cubes, size 4 block grants +4 cubes) |

**Branch B — Injection** (line injection with cube burst — high risk)

| Level | Effect |
|:-----:|--------|
| 4 | Add 2 lines → +20 cubes |
| 5 | Add 3 lines → +40 cubes |

**Design Notes**:
- Extraction = controlled cube farming via destruction
- Injection = dangerous but lucrative (adding lines raises grid height = game over risk)
- Both paths have real tradeoffs (destroying blocks can break combos, adding lines risks game over)

---

### 9️⃣ Passive — High Stakes

**ID**: 9 | **Type**: Passive | **Domain**: Grid height cube rewards

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid ≥ 9 rows → +1 cubes per clear |
| 2 | — | If grid ≥ 8 rows → +1 cubes per clear |
| 3 | A — Edge | If grid ≥ 8 rows → +3 cubes per clear |
| 3 | B — Threshold | If grid ≥ 7 rows → +1 cubes per clear |

**Branch A — Edge** (maximum risk, maximum reward)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 8 rows → +5 cubes per clear |
| 5 | If grid ≥ 8 rows → +10 cubes per clear |

**Branch B — Threshold** (lower threshold, safer farming)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 6 rows → +1 cubes per clear |
| 5 | If grid ≥ 5 rows → +1 cubes per clear |

**Design Notes**:
- Edge = play at the brink of game over for massive cube payouts
- Threshold = reliable cube income at safer heights
- Both require high grid = real danger of game over

---

### 1️⃣0️⃣ Passive — Gambit

**ID**: 10 | **Type**: Passive | **Domain**: Survive danger → earn cubes

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid reaches ≥ 9 rows this level and you survive → +3 cubes (once per level) |
| 2 | — | If grid reaches ≥ 9 rows and you survive → +5 cubes (once per level) |
| 3 | A — Survivor | If grid reaches ≥ 9 rows and you survive → +10 cubes (once per level) |
| 3 | B — Momentum | If grid reaches ≥ 8 rows and you survive → +5 cubes (once per level) |

**Branch A — Survivor** (high frequency, moderate reward)

| Level | Effect |
|:-----:|--------|
| 4 | If grid reaches ≥ 9 rows and you survive → +15 cubes (once per level) |
| 5 | If grid reaches ≥ 9 rows and you survive → +30 cubes (once per level) |

**Branch B — Momentum** (low frequency, high reward)

| Level | Effect |
|:-----:|--------|
| 4 | If grid reaches ≥ 7 rows and you survive → +5 cubes (once per level) |
| 5 | If grid reaches ≥ 6 rows and you survive → +5 cubes (once per level) |

---

## 🔵 CONTROL — Board Mastery

> Grid shaping. Stability. Constraint easing.
> **No cubes. No combo injection. No score multipliers.**

### 4️⃣ Active — Tsunami

**ID**: 4 | **Type**: Active (consumes 1 charge) | **Domain**: Row clears / targeted destruction

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Clear 1 targeted block |
| 2 | — | Clear 2 targeted blocks |
| 3 | A — Wide | Clear 3 targeted blocks |
| 3 | B — Target | Destroy 1 targeted row |

**Branch A — Wide** (area clear)

| Level | Effect |
|:-----:|--------|
| 4 | Clear 5 targeted blocks |
| 5 | Clear all blocks of the targeted size (user click on a block and it clears all blocks of that size) |

**Branch B — Target** (precision destruction)

| Level | Effect |
|:-----:|--------|
| 4 | Destroy 2 targeted rows |
| 5 | Destroy 3 targeted rows |

---

### 1️⃣1️⃣ Passive — Structural Integrity

**ID**: 11 | **Type**: Passive | **Domain**: Grid stability

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid height ≥ 9 → first line clear this move destroy +1 extra row |
| 2 | — | If grid height ≥ 8 → first line clear this move destroy +1 extra row |
| 3 | A — Aggressive | If grid height ≥ 8 → first line clear this move destroy +2 extra row |
| 3 | B — Safe | If grid height ≥ 7 → first line clear this move destroy +1 extra row |

**Branch A — Aggressive** (constraint trivializer)

| Level | Effect |
|:-----:|--------|
| 4 | If grid height ≥ 8 → first line clear this move destroy +3 extra row |
| 5 | If grid height ≥ 8 → first line clear this move destroy +4 extra row |

**Branch B — Safe** (moderate easing + move budget)

| Level | Effect |
|:-----:|--------|
| 4 | If grid height ≥ 6 → first line clear this move destroy +1 extra row |
| 5 | If grid height ≥ 5 → first line clear this move destroy +1 extra row |

---

### 1️⃣2️⃣ Passive — Grid Harmony

**ID**: 12 | **Type**: Passive | **Domain**: Grid stability

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid ≥ 9 → next clear removes +1 extra row |
| 2 | — | If grid ≥ 8 → next clear removes +1 extra row |
| 3 | A — Stabilize | If grid ≥ 8 → every clear removes +1 extra row |
| 3 | B — Precision | If grid ≥ 8 → next clear removes +2 rows |

**Branch A — Stabilize** (easier generated lines)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 7 → every clear removes +1 extra row |
| 5 | If grid ≥ 6 → every clear removes +1 extra row |

**Branch B — Precision** (information advantage)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 8 → next clear removes +3 rows |
| 5 | If grid ≥ 8 → next clear removes +4 rows |

---

## Implementation Needs

### Resolved Design Decisions

| # | Question | Answer |
|---|---------|--------|
| 1 | **Overdrive Branch B** — cadence reduction is passive, not an active use. What's the active? | Move cadence reduction to a **passive skill** in the Scaling archetype. Put a **scoring active** in its place. (Requires reworking Scaling's 3 skills.) |
| 2 | **Permanent shop** — what stays? | **GONE entirely.** Only the skill tree remains for CUBE spending. |
| 3 | **Skill persistence** — per-run or persistent? | **Already exists.** `PlayerSkillTree` model stores 15 skills persistently (level + branch per skill). Players pay CUBEs to upgrade. Draft adds skills to per-run loadout. |
| 4 | **Targeting interface** — how do Tsunami/Harvest target? | **Harvest** = contract picks random blocks (pseudo-random from seed). **Tsunami** = user picks a block, like old Wave/Hammer. Existing `apply_bonus(game_id, bonus, row_index, col_index)` signature supports this. |
| 5 | **Grid height check timing** | After gravity resolves, always. Hook point: after `assess_game()` loop in `grid.cairo` (after line 256). |
| 6 | **Gambit "survive"** | Grid reached ≥ 9 at any point during the level AND player didn't game over. Track via `gambit_triggered_this_level` flag (set when height ≥ 9, checked on level complete). |
| 7 | **Endgame Focus fractional values** | Whatever is most gas-efficient. Fixed-point × 10 (store 2, apply as `value * levels / 10`) is the simplest approach in Cairo. |
| 8 | **SI vs GH overlap** | Trigger **sequentially** — Structural Integrity first, then Grid Harmony. They stack. |

---

### Existing Infrastructure (What Already Exists)

The codebase already has a complete skill tree, draft, and run-slot system. **This is NOT a greenfield implementation** — it's a redesign of existing infrastructure.

#### Persistent Skill Tree (`PlayerSkillTree` model)

- **Model**: `models/skill_tree.cairo` — keyed by `player: ContractAddress`
- **Storage**: `skill_data: felt252` — 15 skills × 6 bits each = 90 bits
- **Per-skill data**: `SkillInfo { level: u8 (4 bits, 0-9), branch_chosen: bool, branch_id: u8 (0=A, 1=B) }`
- **System**: `systems/skill_tree.cairo` — `upgrade_skill()`, `choose_branch()`, `respec_branch()`
- **Branch point**: Level 4 → choose_branch() sets level to 5
- **Cost table**: 50 / 100 / 250 / 500 / 1,000 / 2,000 / 4,000 / 8,000 / 10,000 CUBE (levels 0→9)
- **Respec**: 50% of cumulative branch investment

#### Per-Run Loadout (`RunData` in `Game.run_data`)

- **133 bits used** (119 reserved in felt252)
- **3 active slots**, each with: `skill_id` (4 bits), `level` (4 bits), `charges` (2 bits)
- **Helpers**: `add_skill()`, `find_skill_slot()`, `get_bonus_charges()`, `use_bonus_charge()`, `award_random_bonus_charge()`
- **Skill categorization**: IDs 1-5 = "bonus skills" (have charges), IDs 6-15 = "world skills" (no charges)

#### Draft System (`DraftState` model + `draft_system`)

- **Zone-based triggers**: Opens after levels 0, 10, 20, 30, 40 (zone entry) + 1 mid-zone random
- **10 draft slots total** (2 per zone: entry + micro)
- **3 choices** drawn from pool (inactive skills if <3 active, else active skills for upgrades)
- **Reroll**: 5 → 15 → 45 → 135 CUBE (×3 exponential)
- **Selection**: Adds skill to empty slot, or upgrades existing skill's run-level by +1

#### Bonus System (`bonus_system` + `grid.cairo`)

- **Entry**: `apply_bonus(game_id, bonus, row_index, col_index)` in `systems/bonus.cairo`
- **Implementation**: `grid.cairo` line 486 dispatches by bonus type
- **Wave**: Uses `row_index` as starting row, clears N rows upward. `col_index` ignored.
- **Harvest**: Uses `(row_index, col_index)` to identify block size, destroys all matching blocks
- **UI currently hardcodes (0, 0)** — needs wiring for Tsunami targeting

#### Move Resolution Pipeline (`grid.cairo` execute_move)

```
1. Swipe (line 217-226)
2. assess_game() loop (line 229-230): gravity → line clear → repeat until stable
3. Grid full check (line 233-240)
4. Insert new line (line 242-252)
5. assess_game() again after insert (line 254-256)
6. Combo & score updates (line 279-298)
7. World/skill effects (line 258-427) ← passive skill hook point
8. Constraint context + progress (line 428-447)
9. Move counter (line 449-457)
10. Final grid check & insert (line 463-477)
11. Persist state (line 479-481)
```

**Cascade depth**: NOT currently tracked. The `assess_game()` loop (gravity → line clear → repeat) doesn't count iterations. Adding a counter there is ~5 lines.

#### PlayerMeta (Simplified)

- `MetaData` struct: only `total_runs: u16` + `total_cubes_earned: u32`
- Old shop fields (starting_bonus, bag_level, wave_unlocked, etc.) still in the bit-layout **comment** but NOT in the MetaData struct — already removed
- Shop system file (`systems/shop.cairo`) already deleted

#### Client Infrastructure

- **SkillTreePage.tsx**: Full tree visualization, 5 archetypes, node upgrade modals, branch selection, respec
- **DraftPage.tsx**: 3-choice cards, reroll/select, loadout display, CUBE balance
- **useSkillTree.tsx**: Fetches `PlayerSkillTree` from RECS, unpacks skill data, optimistic updates
- **useDraft.tsx**: Fetches `DraftState` from RECS
- **skillData.ts**: 15 skills × 5 archetypes, tier system (T1/T2/T3 based on level 0-3/4-6/7-9)
- **skillEffects.ts**: Effect descriptions for all skills at all levels (0-10) with branch variants
- **constants.ts**: `MAX_SKILL_LEVEL=9`, `BRANCH_POINT_LEVEL=4`, `BRANCH_SPLIT_LEVEL=5`, `MAX_LOADOUT_SLOTS=3`
- **systems.ts**: `upgradeSkill()`, `chooseBranch()`, `respecBranch()`, `rerollDraft()`, `selectDraft()`

---

### Reconciliation (Doc vs Contract) — RESOLVED

All structural mismatches between the doc and existing contract are now decided.

| # | Issue | Resolution |
|---|-------|------------|
| 1 | **Level count** (doc: 5, contract: 10) | **5 levels.** Change contract: `MAX_TREE_LEVEL=5`, `BRANCH_POINT=3`. Cost table: 100/500/1K/5K/10K. |
| 2 | **Skill count** (doc: 12, contract: 15) | **12 skills.** Set `TOTAL_SKILLS=12`, IDs 1-12. IDs 0 and 13-14 unused. |
| 3 | **Active skill boundary** (contract: IDs 1-5 hardcoded) | **Actives = IDs 1-4.** Replace `is_bonus_skill_id(1..5)` with `is_active_skill(1..4)`. |
| 4 | **Overdrive passive swap** | **Overdrive → Passive** (cadence). **Momentum Scaling → Active** (score burst on charge use). Endgame Focus stays passive. |
| 5 | **Draft system** | **Simplified.** 1 pick at run start + 1 pick per boss clear (L10/L20/L30/L40/L50). When loadout < 3: full pool (add or upgrade). When full: upgrade only. Branch randomly assigned at level 3. |

---

### What Actually Needs Changing (Corrected)

Given the existing infrastructure, the real work is focused on **data changes** (skill definitions, effects, constants) rather than architectural rewrites.

#### Contract Changes

| File | Change Type | What |
|------|:-----------:|------|
| `types/bonus.cairo` | Modify | Update Bonus enum to 4 active skill IDs (1-4). Replace `is_bonus_skill_id()` with `is_active_skill()`. |
| `helpers/skill_effects.cairo` | **Rewrite** | Replace all 15 skill effect definitions with 12 new ones (5 levels × 2 branches each). New `ActiveEffect` + `PassiveEffect` structs. |
| `helpers/packing.cairo` | Modify | `SkillTreeBits`: `TOTAL_SKILLS=12`, `MAX_TREE_LEVEL=5`, `BRANCH_POINT=3`. RunData: add `gambit_triggered_this_level`, `combo_surge_flow_active`. Cost table: 100/500/1K/5K/10K. |
| `systems/skill_tree.cairo` | Modify | Level cap 5 (was 9). Branch at level 2→3 (was 4→5). Cost table update. |
| `systems/grid.cairo` | Modify | Add `cascade_depth` counter in `assess_game()`. Add passive skill hooks: Rhythm, Cascade Mastery, Overdrive cadence, SI, GH, High Stakes, Gambit. |
| `systems/bonus.cairo` / `grid.cairo` | Modify | Dispatch for 4 active skills (IDs 1-4). Wire Tsunami targeting. Harvest random selection. Momentum Scaling charge-based score burst. |
| `helpers/scoring.cairo` | Modify | Endgame Focus flat score on level start. Remove old Overdrive multiplier. |
| `elements/bonuses/harvest.cairo` | **Rewrite** | Random block selection instead of chosen-size destruction. |
| `elements/bonuses/wave.cairo` | **Rewrite** → `tsunami.cairo` | Targeted blocks (Branch A) or targeted rows (Branch B). |
| `systems/draft.cairo` | **Rewrite** | Replace zone-based system with: 1 pick at run start, boss drafts after L10/20/30/40/50 (full pool when loadout < 3, upgrade-only when full), random branch at L3. |
| `models/draft.cairo` | Modify | Simplify `DraftState`: remove zone/trigger_level/completed_mask. Add sequential pick tracking. |
| `models/game.cairo` | Modify | Reset `gambit_triggered_this_level`, `combo_surge_flow_active` on level advance. |
| `types/consumable.cairo` | **Delete** | Consumables removed entirely. |

#### Client Changes

| File | Change Type | What |
|------|:-----------:|------|
| `dojo/game/types/skillData.ts` | **Rewrite** | 12 skills, 4 archetypes, new names + IDs. |
| `dojo/game/types/skillEffects.ts` | **Rewrite** | All new effect descriptions for 5 levels × 2 branches. |
| `dojo/game/types/bonus.ts` | Modify | Update Bonus enum to 4 active skill IDs. |
| `dojo/game/helpers/runDataPacking.ts` | Modify | New RunData fields. Update `isBonusSkill()` → `isActiveSkill()`. Cost table: [100, 500, 1000, 5000, 10000]. |
| `dojo/game/constants.ts` | Modify | `TOTAL_SKILLS=12`, `MAX_SKILL_LEVEL=5`, `BRANCH_POINT_LEVEL=3`. |
| `ui/pages/SkillTreePage.tsx` | Modify | 4 archetypes. 5 levels. Branch at L3 (was L5). Update tree layout. |
| `ui/pages/DraftPage.tsx` | **Rewrite** | New flow: 3 sequential picks at start, boss upgrade selection. No zone triggers. |
| `ui/pages/PlayScreen.tsx` | Modify | Wire Tsunami targeting (row_index, col_index). Remove shop triggers. |
| `ui/components/BonusButton.tsx` | Modify | Handle Tsunami targeting mode. |
| `dojo/systems.ts` | Minimal | Rename `applyBonus` → `applyActiveSkill` (optional). |

#### New Components Needed

| Component | Purpose |
|-----------|---------|
| `TargetingOverlay.tsx` | Grid overlay for Tsunami block/row selection |

---

### Remaining Design Work

1. **Momentum Scaling active effects**: The doc now defines Momentum Scaling as active (ID 2) with charge-based score bursts. The values (adapted from old passive) are marked `⚠️ NEEDS DESIGN REVIEW` — may need tuning for active use.

2. **Overdrive passive values**: Cadence reduction values (4→3→2→1) and starting charge bonuses are drafted but marked `⚠️ NEEDS DESIGN REVIEW` — cadence every 1 level (Amplify L5) may be too strong.

3. **Endgame Focus fractional implementation**: +0.2/0.3/0.5 score per level — implement as fixed-point ×10 (store 2/3/5, apply as `value * levels_cleared / 10`).
