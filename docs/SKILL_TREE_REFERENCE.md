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
| Bonus enum | 5 values (Combo, Score, Harvest, Wave, Supply) | **12 skill IDs** (1-12) |
| Naming | "Bonus Skills" / "World Skills" | **"Active Skills"** / **"Passive Skills"** |
| Bonus levels | 3 (L1-L3) | **5** with branch at L3 |
| Score bonus | +10/+20/+30 flat | **Removed** → Overdrive multiplier |
| Supply bonus | Add 1-3 lines | **Removed** → Harvest Branch B |
| Wave bonus | Clear 1-3 bottom rows | **Redesigned** → Tsunami (targeted blocks/rows) |
| Harvest bonus | Destroy all blocks of chosen size | **Redesigned** → random blocks, cubes = block size |
| Combo bonus | +1/+2/+3 combo | **Redesigned** → Combo Surge (depth, branches) |
| Consumables | 3 types (BonusCharge, LevelUp, SwapBonus) | **Removed entirely** |
| In-game shop | Every 10 levels | **Removed** |
| Permanent shop | Bag size, unlock Wave/Supply, bridging | **TBD** (needs redesign) |
| Passive skill structs | BonusEffect/WorldEffects (33+47 fields) | **New structs** (ActiveEffect + PassiveEffect) |
| Charge refill | Combo-based + cadence | **Cadence only** (every 5 levels) |
| Cascade tracking | Not tracked | **New** transient `cascade_depth` counter |
| Grid height effects | Only via constraint (KeepGridBelow) | **Core mechanic** for 5+ skills |

### What's Being Removed

| Feature | Contract Location | Why |
|---------|-------------------|-----|
| `ConsumableType` enum | `types/consumable.cairo` | Consumables replaced by skills |
| `purchase_consumable()` | `systems/game.cairo` | No more in-game shop |
| In-game shop logic | `systems/game.cairo` (shop_purchases, last_shop_level) | Boss upgrades replace shop |
| Score bonus (type 2) | `types/bonus.cairo` | Replaced by Overdrive |
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
| Overdrive Branch B cadence modifier | Global charge cadence override (4/3/2 levels instead of 5) |
| Grid height checks in move resolution | Structural Integrity, Grid Harmony, High Stakes, Gambit |
| Targeted block/row selection | Tsunami and Harvest need player targeting data in contract call |

### Skill Name Mapping (v1 → vNext)

| v1 Skill | v1 ID | vNext Equivalent | vNext ID | Notes |
|----------|:-----:|------------------|:--------:|-------|
| Combo | 1 | **Combo Surge** | 1 | Branch B = level-wide combo depth |
| Score | 2 | — | — | Removed → Overdrive |
| Harvest | 3 | **Harvest** | 7 | Cubes scale with block SIZE. Random blocks. |
| Wave | 4 | **Tsunami** | 10 | Targeted blocks/rows. |
| Supply | 5 | — | — | Removed → Harvest Branch B |
| Tempo | 6 | **Rhythm** | 2 | Redesigned around combo_streak |
| Fortune | 7 | — | — | Removed |
| Surge | 8 | **Momentum Scaling** | 5 | Flat score at level start |
| Catalyst | 9 | — | — | Removed |
| Resilience | 10 | — | — | Removed |
| Focus | 11 | **Structural Integrity** | 11 | Extra row removal at high grid |
| Expansion | 12 | **Grid Harmony** | 12 | Extra row removal on clear at high grid |
| Momentum | 13 | — | — | Removed |
| Adrenaline | 14 | **High Stakes** | 8 | Cube-per-clear at height threshold |
| Legacy | 15 | — | — | Removed → Endgame Focus |
| — | — | **Cascade Mastery** | 3 | NEW |
| — | — | **Overdrive** | 4 | NEW |
| — | — | **Endgame Focus** | 6 | NEW |
| — | — | **Gambit** | 9 | NEW |

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
| `CHARGE_CADENCE_BASE` | 5 | +1 charge to all actives every 5 levels cleared |

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

**ALLOWED**: Score multipliers (%), per-level-cleared scaling, late-run ramping, charge cadence reduction (Branch B only)
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
| 2 | 🟣 Tempo | Passive | **Rhythm** |
| 3 | 🟣 Tempo | Passive | **Cascade Mastery** |
| 4 | 🟡 Scaling | Active | **Overdrive** |
| 5 | 🟡 Scaling | Passive | **Momentum Scaling** |
| 6 | 🟡 Scaling | Passive | **Endgame Focus** |
| 7 | 🔴 Risk | Active | **Harvest** |
| 8 | 🔴 Risk | Passive | **High Stakes** |
| 9 | 🔴 Risk | Passive | **Gambit** |
| 10 | 🔵 Control | Active | **Tsunami** |
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
| 3 | `1000` | Significant — branch commitment |
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
| Cadence modifier (Scaling Branch B only) | Reduce cadence to every 4 → 3 levels |
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

### How Skills Enter a Run

1. Before each level (or at run start), a **draft event** triggers
2. Player sees **3 skill choices** (cards)
3. If loadout has empty slots (< 3): **Select** adds the skill at level 1
4. If loadout is full (3/3): **Upgrade** — selecting a skill already in loadout increases its level

### Reroll Mechanic

- Cost formula: `ceil(5 * 1.5^n)` where `n` = reroll count this draft
- Cost sequence: 5, 8, 12, 18, 27, 41, ...
- Costs CUBE (deducted from wallet)

### Branch Choice

- At level 3, player must choose Branch A or B
- Respec possible at 50% CUBE cost

---

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
| Charge cadence reduction | ❌ | ✅ (Branch B only) | ❌ | ❌ |
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

### 2️⃣ Passive — Rhythm

**ID**: 2 | **Type**: Passive | **Domain**: Combo streak scaling

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

### 3️⃣ Passive — Cascade Mastery

**ID**: 3 | **Type**: Passive | **Domain**: Multi-phase gravity cascades

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

### 4️⃣ Active — Overdrive

**ID**: 4 | **Type**: Active (consumes 1 charge) | **Domain**: Score multiplier burst

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | x1,5 next move score |
| 2 | — | x2 next move score |
| 3 | A — Amplify | x2,5 next move score |
| 3 | B — Overflow | Charge cadence: every 4 levels (was 5) |

**Branch A — Amplify** (raw score power)

| Level | Effect |
|:-----:|--------|
| 4 | x3 next move score |
| 5 | x4 next move score |

**Branch B — Overflow** (charge economy)

| Level | Effect |
|:-----:|--------|
| 4 | Charge cadence: every 3 levels (was 5) |
| 5 | Charge cadence: every 2 levels (was 5) |

**Design Notes**:
- Amplify = raw late-run score explosion
- Overflow = more charges for all active skills (team-wide benefit)
- Branch B is the ONLY place in the entire game where charge cadence can be modified
- No cubes, no combo, no grid manipulation

---

### 5️⃣ Passive — Momentum Scaling

**ID**: 5 | **Type**: Passive | **Domain**: Per-level score scaling

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | +1 score at level start (once) |
| 2 | — | +2 score at level start (once) |
| 3 | A — Late Bloom | +3 score per zone cleared at level start (once) |
| 3 | B — Stable Growth | +3 score at level start (once) |

**Branch A — Late Bloom** (exponential late-run payoff)

| Level | Effect |
|:-----:|--------|
| 4 | +5 per zone cleared at level start (once) |
| 5 | +10 per zone cleared at level start (once) |

**Branch B — Stable Growth** (consistent linear scaling)

| Level | Effect |
|:-----:|--------|
| 4 | +5 at level start (once) |
| 5 | +10 at level start (once) |

**Design Notes**:
- Late Bloom = weak early, monster late
- Stable Growth = reliable value from level 1 (less ceiling, more floor)

---

### 6️⃣ Passive — Endgame Focus

**ID**: 6 | **Type**: Passive | **Domain**: Late-run ramping

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

### 7️⃣ Active — Harvest

**ID**: 7 | **Type**: Active (consumes 1 charge) | **Domain**: Cube generation via block destruction / line injection

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

### 8️⃣ Passive — High Stakes

**ID**: 8 | **Type**: Passive | **Domain**: Grid height cube rewards

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

### 9️⃣ Passive — Gambit

**ID**: 9 | **Type**: Passive | **Domain**: Survive danger → earn cubes

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

### 🔟 Active — Tsunami

**ID**: 10 | **Type**: Active (consumes 1 charge) | **Domain**: Row clears / targeted destruction

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

### Contract Changes

#### Files to Rewrite

| File | Current Role | What Changes |
|------|-------------|-------------|
| `types/bonus.cairo` | 5-value Bonus enum (Combo, Score, Harvest, Wave, Supply) | Replace with 12 skill IDs. Remove `requires_unlock()`, `bag_index()`. |
| `helpers/skill_effects.cairo` | BonusEffect (33 fields) + WorldEffects (47 fields), match-based dispatch | Complete rewrite: 12 skills × 5 levels × 2 branches. New `ActiveEffect` + `PassiveEffect` structs. |
| `helpers/packing.cairo` | RunData struct (195 bits). Has per-bonus counts, shop fields, unallocated_charges. | Remove: shop fields, per-bonus counts, unallocated_charges. Add: `branch` per slot (2 bits × 3), `gambit_triggered_this_level` (1 bit), `combo_surge_flow_active` (1 bit). |

#### Files to Modify

| File | Changes |
|------|---------|
| `systems/game.cairo` | `apply_bonus()` → `apply_active_skill()`. Remove `purchase_consumable()`. Add skill-specific targeting (Tsunami blocks, Harvest random). |
| `systems/grid.cairo` | Add `cascade_depth` counter in `assess_game()` gravity loop. Add hooks: Rhythm check after combo, Cascade Mastery after gravity, Structural Integrity + Grid Harmony after line clear, High Stakes + Gambit cube awards. |
| `helpers/scoring.cairo` | Add Overdrive multiplier application. Add Momentum Scaling / Endgame Focus flat score at level start. |
| `models/game.cairo` | Reset `gambit_triggered_this_level`, `combo_surge_flow_active` on level advance. |
| `helpers/level.cairo` | Remove in-game shop trigger at boss levels. |
| `elements/bonuses/harvest.cairo` | Rewrite: random block selection instead of chosen-size destruction. Cube reward = block size. |
| `elements/bonuses/wave.cairo` | Rewrite as Tsunami: targeted blocks (Branch A) or targeted rows (Branch B). |

#### Files to Remove

| File | Why |
|------|-----|
| `types/consumable.cairo` | Consumables removed entirely |
| Shop-related logic in `systems/game.cairo` | In-game shop removed |

### Client Changes

#### Files to Rewrite

| File | What Changes |
|------|-------------|
| `dojo/game/types/bonus.ts` | Replace 5-value Bonus with 12 skill IDs + targeting modes |
| `dojo/game/types/skillData.ts` | 12 skills, 4 archetypes, new names (Gambit, Structural Integrity, Grid Harmony) |
| `dojo/game/types/skillEffects.ts` | All new effect descriptions matching this spec |
| `dojo/game/helpers/runDataPacking.ts` | New bit layout: add `branch`, `gambit_triggered`, `combo_surge_flow`. Remove shop/bonus-count fields. |
| `dojo/game/constants.ts` | New constants (upgrade costs, charge cadence, skill IDs) |

#### Files to Modify

| File | What Changes |
|------|-------------|
| `dojo/systems.ts` | `applyBonus()` → `applyActiveSkill()` with targeting data. Remove `purchaseConsumable()`. |
| `ui/pages/DraftPage.tsx` | Update for 12 skills, 4 archetypes, branch choice at L3 |
| `ui/pages/SkillTreePage.tsx` | 4 archetypes, 5 levels, branch at L3. Show upgrade costs. |
| `ui/screens/Play.tsx` | Remove shop trigger at boss levels. Remove consumable buttons. Update skill display. |
| `ui/components/BonusButton.tsx` | Rename → `ActiveSkillButton.tsx`. Add targeting mode for Tsunami/Harvest. |

#### New Components Needed

| Component | Purpose |
|-----------|---------|
| `TargetingOverlay.tsx` | Grid overlay for Tsunami block/row selection and Harvest display |
| `BranchSelector.tsx` | Branch A/B choice UI when skill reaches Level 3 |

### Open Questions

1. **Overdrive Branch B active use**: When Branch B is selected, Overdrive's active effect is only cadence reduction (passive benefit). What happens when the player USES a charge? Does it still give x2 score (inherited from L2)? Or is the charge mechanic removed for Branch B (charges still refill but are only usable by other active skills)?

2. **Permanent shop**: Currently sells bag size, Wave/Supply unlocks, bridging rank. With Wave/Supply gone and the skill system replacing bonuses — what stays? What changes? Does the CUBE upgrade cost table (100/500/1K/5K/10K) replace the permanent shop?

3. **Skill persistence**: Are skills per-run only (start L1, upgrade via draft/boss) or do CUBE upgrade costs represent persistent out-of-run investment? This fundamentally changes the data model.

4. **Targeting contract interface**: Tsunami "targeted blocks/rows" and Harvest "random blocks" — what's the contract call signature? For Tsunami: array of (row, col) pairs? Row indices? For Harvest: does the contract pick random blocks (VRF/pseudo) or does the client send targets?

5. **Grid height check timing**: Structural Integrity says "first line clear this move" and Grid Harmony says "next clear removes +1 extra row". In the move pipeline (swipe → gravity → line clear → new line insert), exactly when do these trigger? Before or after gravity resolves? Before or after scoring?

6. **Gambit "survive"**: "If grid reaches ≥ 9 rows and you survive" — what counts as surviving? Grid reached ≥ 9 at any point during the level, and you didn't game over? Or grid was ≥ 9 and you cleared it back down?

7. **Endgame Focus fractional values**: "+0.2 score per level cleared" — Cairo has no floats. Store as fixed-point × 10? (i.e., store 2, divide by 10 at application = 0.2). Or × 100 for more precision?

8. **Structural Integrity vs Grid Harmony overlap**: Both trigger on line clear at high grid. What's the interaction when both are in the loadout? Do they stack? Do they trigger simultaneously? Sequentially?
