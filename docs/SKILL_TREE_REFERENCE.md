# zKube Skill System — vNext Design Spec

> **Status**: Design spec — NOT YET IMPLEMENTED.
> **Purpose**: Prescriptive specification for the next version of the skill system. Use this document as the source of truth for implementation.
> **Replaces**: v1 system (15 skills, 5 archetypes, 10 levels, branch at level 5).

---

## Table of Contents

1. [Design Goals](#design-goals)
2. [System Overview](#system-overview)
3. [Archetypes (4)](#archetypes-4)
4. [Skill Structure](#skill-structure)
5. [Level Progression (5 Levels)](#level-progression-5-levels)
6. [Charge System](#charge-system)
7. [Cube Economy Rules](#cube-economy-rules)
8. [Draft System](#draft-system)
9. [Domain Separation Rules](#domain-separation-rules)
10. [Tempo — Flow & Cascades](#-tempo--flow--cascades)
    - [Combo Surge (Active)](#1%EF%B8%8F⃣-active--combo-surge)
    - [Rhythm (Passive)](#2%EF%B8%8F⃣-passive--rhythm)
    - [Cascade Mastery (Passive)](#3%EF%B8%8F⃣-passive--cascade-mastery)
11. [Scaling — Long-Run Growth](#-scaling--long-run-growth)
    - [Overdrive (Active)](#4%EF%B8%8F⃣-active--overdrive)
    - [Momentum Scaling (Passive)](#5%EF%B8%8F⃣-passive--momentum-scaling)
    - [Endgame Focus (Passive)](#6%EF%B8%8F⃣-passive--endgame-focus)
12. [Risk / Economy — Greed & Volatility](#-risk--economy--greed--volatility)
    - [Harvest (Active)](#7%EF%B8%8F⃣-active--harvest)
    - [High Stakes (Passive)](#8%EF%B8%8F⃣-passive--high-stakes)
    - [Volatility (Passive)](#9%EF%B8%8F⃣-passive--volatility)
13. [Control — Board Mastery](#-control--board-mastery)
    - [Tsunami (Active)](#-active--tsunami)
    - [Constraint Ease (Passive)](#1%EF%B8%8F⃣1%EF%B8%8F⃣-passive--constraint-ease)
    - [Grid Discipline (Passive)](#1%EF%B8%8F⃣2%EF%B8%8F⃣-passive--grid-discipline)
14. [Data Packing: run_data](#data-packing-run_data)
15. [Contract ↔ Client Interaction](#contract--client-interaction)
16. [Migration Notes (v1 → vNext)](#migration-notes-v1--vnext)

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
| 9 | 🔴 Risk | Passive | **Volatility** |
| 10 | 🔵 Control | Active | **Tsunami** |
| 11 | 🔵 Control | Passive | **Constraint Ease** |
| 12 | 🔵 Control | Passive | **Grid Discipline** |

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
| 1 | `[TBD]` | Cheap — encourage trying skills |
| 2 | `[TBD]` | Moderate |
| 3 | `[TBD]` | Significant — branch commitment |
| 4 | `[TBD]` | Expensive |
| 5 | `[TBD]` | Premium — capstone investment |

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
| 1 | — | Next cascade: +2 combo depth |
| 2 | — | Next cascade: +3 combo depth |
| 3 | A — Burst | +5 combo depth |
| 3 | B — Flow | +4 combo depth |

**Branch A — Burst** (explosive spike potential)

| Level | Effect |
|:-----:|--------|
| 4 | +6 combo depth |
| 5 | +8 combo depth. If combo ≥ 6 → refund 1 move |

**Branch B — Flow** (sustainability for chaining players)

| Level | Effect |
|:-----:|--------|
| 4 | +4 combo depth. If combo ≥ 4 → 50% chance charge not consumed |
| 5 | +4 combo depth. If combo ≥ 4 → charge not consumed |

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
| 1 | — | Every 12 combo_streak gained → next move +1 combo (max 1 proc per level) |
| 2 | — | Every 10 combo_streak gained → next move +1 combo (max 2 procs per level) |
| 3 | A — Acceleration | Every 10 streak → next move +2 combo (max 2 procs per level) |
| 3 | B — Stability | Every 10 streak → next move +3 combo (max 1 proc per level) |

**Branch A — Acceleration** (scaling combo machine)

| Level | Effect |
|:-----:|--------|
| 4 | Every 8 streak → next move +2 combo (max 3 procs per level) |
| 5 | Every 6 streak → next move +2 combo (max 3 procs per level) |

**Branch B — Stability** (controlled power)

| Level | Effect |
|:-----:|--------|
| 4 | Every 8 streak → next move +3 combo (max 2 procs per level) |
| 5 | Every 8 streak → next move +4 combo (max 2 procs per level) |

**Design Notes**:
- Hard capped via `max_rhythm_procs_per_level` to avoid runaway feedback loops
- No permanent scaling — resets each level
- Reads existing `combo_counter` (Game model) — zero new tracking state
- Acceleration = more frequent, moderate bursts
- Stability = fewer, larger bursts

**Implementation**: Needs `rhythm_procs_this_level: u8` in `run_data` (~3 bits) to enforce cap. Reset on level advance.

---

### 3️⃣ Passive — Cascade Mastery

**ID**: 3 | **Type**: Passive | **Domain**: Multi-phase gravity cascades

Rewards deep cascades. Uses **per-resolution** cascade depth (transient, not cumulative). Distinct from Rhythm which uses cumulative combo_streak.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If cascade depth ≥ 2 → +1 bonus combo |
| 2 | — | If cascade depth ≥ 2 → +2 bonus combo |
| 3 | A — Amplify | If cascade depth ≥ 3 → +3 score per cascade phase |
| 3 | B — Extend | Cascade threshold reduced by 1 (easier multi-phase triggers) |

**Branch A — Amplify** (high-skill payoff for deep cascades)

| Level | Effect |
|:-----:|--------|
| 4 | If cascade depth ≥ 3 → +5 score per cascade phase |
| 5 | If cascade depth ≥ 4 → +1 combo multiplier (final cascade only) |

**Branch B — Extend** (consistency path for smoother chaining)

| Level | Effect |
|:-----:|--------|
| 4 | First cascade phase counts as depth 2 |
| 5 | First two cascade phases gain +1 depth |

**Design Notes**:
- Amplify = high-skill payoff for deep cascades
- Extend = consistency path for smoother chaining
- Per-resolution only (cascade_depth resets every move) — no cumulative scaling
- Synergizes strongly with Combo Surge

**Implementation**: Add `cascade_depth: u8` counter to `assess_game()` loop (transient local variable — NOT stored in run_data). Increment per outer loop iteration in `grid.cairo:830`.

---

### 🟣 Tempo Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Combo Surge | High-impact spike | Combo depth injection |
| Rhythm | Chain engine | Combo-streak-gated bursts |
| Cascade Mastery | Depth enhancer | Per-resolution cascade reward |

**Identity Check**: ✅ Combo manipulation · ✅ Cascade enhancement · ✅ Combo-tied move sustain · ✅ No cubes · ✅ No difficulty reduction · ✅ No grid manipulation · ✅ No score multipliers

---

## 🟡 SCALING — Long-Run Growth

> Weak early. Strong late.
> **No cubes. No combo injection. Only archetype that modifies charge cadence.**

### 4️⃣ Active — Overdrive

**ID**: 4 | **Type**: Active (consumes 1 charge) | **Domain**: Score multiplier burst

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | +20% score this move |
| 2 | — | +35% score this move |
| 3 | A — Amplify | +60% score this move |
| 3 | B — Overflow | +40% score this move + reduce charge cadence |

**Branch A — Amplify** (raw score power)

| Level | Effect |
|:-----:|--------|
| 4 | +80% score this move |
| 5 | +120% score this move |

**Branch B — Overflow** (charge economy)

| Level | Effect |
|:-----:|--------|
| 4 | Charge cadence: every 4 levels (was 5) |
| 5 | Charge cadence: every 3 levels (was 5) |

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
| 1 | — | +3% score per level cleared |
| 2 | — | +5% score per level cleared |
| 3 | A — Late Bloom | +7% per level cleared |
| 3 | B — Stable Growth | +4% per level cleared, starts counting from level 1 |

**Branch A — Late Bloom** (exponential late-run payoff)

| Level | Effect |
|:-----:|--------|
| 4 | +9% per level cleared |
| 5 | +12% per level cleared |

**Branch B — Stable Growth** (consistent linear scaling)

| Level | Effect |
|:-----:|--------|
| 4 | +6% per level cleared |
| 5 | +8% per level cleared |

**Design Notes**:
- Late Bloom = weak early, monster late (level 30+ = +270%+ score)
- Stable Growth = reliable value from level 1 (less ceiling, more floor)
- Multiplier only — never flat score injection

---

### 6️⃣ Passive — Endgame Focus

**ID**: 6 | **Type**: Passive | **Domain**: Late-run ramping

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | +10% score on levels ≥ 20 |
| 2 | — | +20% score on levels ≥ 20 |
| 3 | A — Deep End | +30% score on levels ≥ 25 |
| 3 | B — Smooth Ramp | +1% score per level (no threshold) |

**Branch A — Deep End** (massive late-game spike)

| Level | Effect |
|:-----:|--------|
| 4 | +40% score on levels ≥ 30 |
| 5 | +60% score on levels ≥ 35 |

**Branch B — Smooth Ramp** (always-on linear growth)

| Level | Effect |
|:-----:|--------|
| 4 | +1.5% score per level |
| 5 | +2% score per level |

**Design Notes**:
- Deep End = huge payoff but only if you survive to high levels
- Smooth Ramp = consistent value at every level, lower ceiling
- Both paths are multipliers, not flat score

---

### 🟡 Scaling Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Overdrive | Score burst / charge economy | % score multiplier or cadence reduction |
| Momentum Scaling | Per-level growth | % per level cleared |
| Endgame Focus | Late-run ramp | Threshold or linear % bonus |

**Identity Check**: ✅ Score multipliers · ✅ Per-level scaling · ✅ Late-run ramping · ✅ Charge cadence (Branch B only) · ✅ No cubes · ✅ No combo · ✅ No grid manipulation

---

## 🔴 RISK / ECONOMY — Greed & Volatility

> Primary cube generation. Must include downside.
> **No safe passive scaling. No score multipliers. No constraint easing.**

### 7️⃣ Active — Harvest

**ID**: 7 | **Type**: Active (consumes 1 charge) | **Domain**: Cube generation via block destruction / line injection

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Destroy 3 random blocks → +1 cube per block |
| 2 | — | Destroy 5 blocks → +1 cube per block |
| 3 | A — Extraction | Destroy 6 blocks → +2 cubes per block |
| 3 | B — Injection | Add 1 random line → +8 cubes |

**Branch A — Extraction** (targeted destruction for cubes)

| Level | Effect |
|:-----:|--------|
| 4 | Destroy 8 blocks → +2 cubes per block |
| 5 | Destroy 10 blocks → +3 cubes per block |

**Branch B — Injection** (line injection with cube burst — high risk)

| Level | Effect |
|:-----:|--------|
| 4 | Add 1 line → +12 cubes |
| 5 | Add 2 lines → +20 cubes |

**Design Notes**:
- Extraction = controlled cube farming via destruction
- Injection = dangerous but lucrative (adding lines raises grid height = game over risk)
- Both paths have real tradeoffs (destroying blocks can break combos, adding lines risks game over)

---

### 8️⃣ Passive — High Stakes

**ID**: 8 | **Type**: Passive | **Domain**: Grid height cube rewards

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid ≥ 6 rows → +2 cubes per clear |
| 2 | — | If grid ≥ 7 rows → +3 cubes per clear |
| 3 | A — Edge | If grid ≥ 8 rows → +5 cubes per clear |
| 3 | B — Threshold | Grid height threshold reduced by 1 |

**Branch A — Edge** (maximum risk, maximum reward)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 8 rows → +6 cubes per clear |
| 5 | If grid ≥ 9 rows → +8 cubes per clear |

**Branch B — Threshold** (lower threshold, safer farming)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 6 rows → +4 cubes per clear |
| 5 | If grid ≥ 6 rows → +6 cubes per clear |

**Design Notes**:
- Edge = play at the brink of game over for massive cube payouts
- Threshold = reliable cube income at safer heights
- Both require high grid = real danger of game over

---

### 9️⃣ Passive — Volatility

**ID**: 9 | **Type**: Passive | **Domain**: Random line injection with cube payoff

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Random line injection: 5% chance per move |
| 2 | — | 8% chance per move |
| 3 | A — Wild | 12% injection chance, +3 cubes when injected |
| 3 | B — Controlled | 6% injection chance, +5 cubes when injected |

**Branch A — Wild** (high frequency, moderate reward)

| Level | Effect |
|:-----:|--------|
| 4 | 15% injection chance, +3 cubes |
| 5 | 20% injection chance, +3 cubes |

**Branch B — Controlled** (low frequency, high reward)

| Level | Effect |
|:-----:|--------|
| 4 | 8% injection chance, +5 cubes |
| 5 | 10% injection chance, +5 cubes |

**Design Notes**:
- Wild = chaotic, frequent disruption with steady cube income
- Controlled = rare but lucrative injections
- Random injection = real downside (lines appear when you don't want them)
- Synergizes with High Stakes (injected lines raise grid height → more cube rewards)

---

### 🔴 Risk Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Harvest | Cube burst (active) | Block destruction or line injection |
| High Stakes | Conditional cube income | Grid height threshold |
| Volatility | Passive cube generation | Random line injection |

**Identity Check**: ✅ Cube generation · ✅ Conditional rewards · ✅ Real downside · ✅ Grid height risk · ✅ No score multipliers · ✅ No constraint easing · ✅ No combo manipulation

---

## 🔵 CONTROL — Board Mastery

> Grid shaping. Stability. Constraint easing.
> **No cubes. No combo injection. No score multipliers.**

### 🔟 Active — Tsunami

**ID**: 10 | **Type**: Active (consumes 1 charge) | **Domain**: Row clears / targeted destruction

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Clear 1 bottom row |
| 2 | — | Clear 2 rows |
| 3 | A — Wide | Clear 3 rows |
| 3 | B — Target | Destroy 8 targeted blocks |

**Branch A — Wide** (area clear)

| Level | Effect |
|:-----:|--------|
| 4 | Clear 4 rows |
| 5 | Clear 5 rows |

**Branch B — Target** (precision destruction)

| Level | Effect |
|:-----:|--------|
| 4 | Destroy 12 targeted blocks |
| 5 | Destroy 16 targeted blocks |

**Design Notes**:
- Wide = emergency board reset (clear half the grid)
- Target = surgical removal of problem blocks
- No score bonus, no cube generation — pure grid control

---

### 1️⃣1️⃣ Passive — Constraint Ease

**ID**: 11 | **Type**: Passive | **Domain**: Constraint requirement reduction

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Reduce constraint requirement by 5% |
| 2 | — | Reduce by 10% |
| 3 | A — Aggressive | Reduce by 15% |
| 3 | B — Safe | Reduce by 8% but +1 free move per level |

**Branch A — Aggressive** (constraint trivializer)

| Level | Effect |
|:-----:|--------|
| 4 | Reduce by 20% |
| 5 | Reduce by 25% |

**Branch B — Safe** (moderate easing + move budget)

| Level | Effect |
|:-----:|--------|
| 4 | Reduce by 10% + 1 free move per level |
| 5 | Reduce by 12% + 1 free move per level |

**Design Notes**:
- Aggressive = brute-force constraint reduction (boss levels become manageable)
- Safe = moderate reduction plus extra moves for safety margin
- Free moves in Branch B are flat per-level grants (not combo-tied) — allowed for Control

---

### 1️⃣2️⃣ Passive — Grid Discipline

**ID**: 12 | **Type**: Passive | **Domain**: Generated line difficulty reduction

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Generated lines have 10% fewer blocks |
| 2 | — | 20% fewer blocks |
| 3 | A — Purge | 30% fewer blocks |
| 3 | B — Predict | Next generated line preview visible |

**Branch A — Purge** (easier generated lines)

| Level | Effect |
|:-----:|--------|
| 4 | 40% fewer blocks |
| 5 | 50% fewer blocks |

**Branch B — Predict** (information advantage)

| Level | Effect |
|:-----:|--------|
| 4 | Preview next 2 generated lines |
| 5 | Preview next 3 generated lines |

**Design Notes**:
- Purge = generated lines are nearly empty (easier to clear)
- Predict = see what's coming, plan moves accordingly
- Predict is a CLIENT-SIDE feature — contract already generates `next_row`, Branch B exposes future rows

---

### 🔵 Control Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Tsunami | Emergency grid reset | Row clears or targeted destruction |
| Constraint Ease | Boss level helper | % constraint reduction |
| Grid Discipline | Difficulty reducer | Fewer blocks in generated lines |

**Identity Check**: ✅ Grid shaping · ✅ Row clears · ✅ Constraint easing · ✅ Difficulty reduction · ✅ No cubes · ✅ No score multipliers · ✅ No combo manipulation

---

## Data Packing: run_data

### Current State (v1): 133/252 bits used

The `run_data` field (felt252) stores the current run's skill loadout and progress. 119 bits remain free.

### New Fields Required (vNext)

| Field | Bits | Purpose | Persisted? |
|-------|------|---------|------------|
| `rhythm_procs_this_level` | 3 (0-7) | Cap Rhythm procs per level | ✅ Yes (reset on level advance) |
| `cascade_depth` | — | Count gravity phases per move | ❌ No (transient local var) |

**Total new run_data: 3 bits → 136/252 used (116 bits still free)**

### vNext Loadout Slot Layout

Skill IDs 1-12 still fit in 4 bits. Levels 1-5 fit in 3 bits (was 4). Charges 0-3 still fit in 2 bits.

```
Proposed narrower layout:
  active_slot_count: 2 bits (0-3)
  Per slot (×3):
    skill_id:  4 bits (0-12)
    level:     3 bits (0-5)
    charges:   2 bits (0-3)
  = 2 + 3×(4+3+2) = 2 + 27 = 29 bits for loadout
```

### SkillSlot Interface (vNext)

```typescript
interface SkillSlot {
  skillId: number;  // 1-12 (1,4,7,10 = active; rest = passive), 0 = empty
  level: number;    // 1-5
  charges: number;  // 0-3 (only meaningful for active skills)
}

function isActiveSkill(skillId: number): boolean {
  return [1, 4, 7, 10].includes(skillId);
}

function getArchetype(skillId: number): 'tempo' | 'scaling' | 'risk' | 'control' {
  if (skillId <= 3) return 'tempo';
  if (skillId <= 6) return 'scaling';
  if (skillId <= 9) return 'risk';
  return 'control';
}
```

---

## Contract ↔ Client Interaction

### Applying an Active Skill

```
Client (ActiveSkillButton click)
  → systems.ts: applyActiveSkill({ account, game_id, skill_id, row_index, line_index })
    → Contract: game_system.apply_active_skill(game_id, skill_id, row_index, line_index)
      → Verify skill is in loadout and has charges > 0
      → Decrement charges
      → skill_effects.cairo: active_effect_for_skill(skill_id, level, branch_id)
        → Returns ActiveEffect struct
      → Apply effect (grid modification, combo add, etc.)
```

### Passive Skill Resolution

```
Contract: During move resolution / level start / level complete
  → skill_effects.cairo: passive_effect_for_skill(skill_id, level, branch_id)
  → skill_effects.cairo: aggregate_passive_effects(run_data, branch_ids)
    → Combines effects from all passive skills in loadout
  → Applied during move resolution (Rhythm, Cascade Mastery, Momentum, etc.)
  → Applied at level start (Constraint Ease prefill, etc.)
  → Applied at level complete (cube rewards, etc.)
```

### Charge Replenishment

```
Contract: On level complete
  → Check levels_cleared % charge_cadence == 0
  → If yes: for each active skill in loadout, charges = min(charges + 1, 3)
  → charge_cadence = 5 (base) or 4/3 if Scaling Overflow Branch B is active
```

---

## Migration Notes (v1 → vNext)

### Structural Changes

| Aspect | v1 | vNext |
|--------|:---:|:---:|
| Archetypes | 5 (Tempo, Scaling, Economy, Control, Risk) | 4 (Tempo, Scaling, Risk/Economy, Control) |
| Economy archetype | Standalone | Merged into Risk |
| Total skills | 15 | 12 |
| Skill IDs | 1-15 | 1-12 |
| Active skill IDs | 1-5 | 1, 4, 7, 10 |
| Passive skill IDs | 6-15 | 2-3, 5-6, 8-9, 11-12 |
| Levels | 0-9 (display 1-10) | 1-5 |
| Branch point | Level 5 (internal 4) | Level 3 |
| Naming | Bonus Skills / World Skills | Active Skills / Passive Skills |

### Skill Name Mapping (v1 → vNext)

| v1 Skill | v1 ID | vNext Equivalent | vNext ID | Notes |
|----------|:-----:|------------------|:--------:|-------|
| Combo | 1 | **Combo Surge** | 1 | Simplified, 5 levels |
| Score | 2 | — | — | Removed (replaced by Overdrive) |
| Harvest | 3 | **Harvest** | 7 | Moved to Risk archetype, redesigned |
| Wave | 4 | **Tsunami** | 10 | Renamed, moved to Control |
| Supply | 5 | — | — | Removed (line injection folded into Harvest Branch B + Volatility) |
| Tempo | 6 | **Rhythm** | 2 | Redesigned around combo_streak |
| Fortune | 7 | — | — | Removed (cube gen moved to Risk passives) |
| Surge | 8 | **Momentum Scaling** | 5 | Redesigned as per-level % scaling |
| Catalyst | 9 | — | — | Removed |
| Resilience | 10 | — | — | Removed (free moves folded into Constraint Ease Branch B) |
| Focus | 11 | **Constraint Ease** | 11 | Redesigned as % reduction |
| Expansion | 12 | **Grid Discipline** | 12 | Redesigned as % fewer blocks |
| Momentum | 13 | — | — | Removed (merged into Rhythm + Cascade Mastery) |
| Adrenaline | 14 | **High Stakes** | 8 | Redesigned as cube-per-clear at height threshold |
| Legacy | 15 | — | — | Removed (replaced by Endgame Focus) |
| — | — | **Cascade Mastery** | 3 | NEW — per-resolution cascade depth reward |
| — | — | **Overdrive** | 4 | NEW — score burst + charge cadence modifier |
| — | — | **Endgame Focus** | 6 | NEW — late-run % ramp |
| — | — | **Volatility** | 9 | NEW — random line injection with cubes |

### Contract Changes Required

| File | Changes |
|------|---------|
| `helpers/skill_effects.cairo` | Complete rewrite — 12 skills × 5 levels × 2 branches. New `ActiveEffect` + `PassiveEffect` structs. |
| `systems/grid.cairo` | Add `cascade_depth` counter to `assess_game()`. Add Rhythm + Cascade Mastery hooks to `execute_move()`. |
| `helpers/packing.cairo` | Add `rhythm_procs_this_level` (3 bits). Update slot level from 4 bits to 3 bits. |
| `models/game.cairo` | Reset `rhythm_procs_this_level` in `complete_level_data()`. |
| `types/bonus.cairo` | Replace 5-value Bonus enum with 4 active skill IDs. |
| `helpers/bonus_logic.cairo` | Refactor for new active skill dispatch. |
| `constants.cairo` | Update all skill constants. |

### Client Changes Required

| File | Changes |
|------|---------|
| `dojo/game/types/bonus.ts` | Replace with active skill type. |
| `dojo/game/types/skillData.ts` | 12 skills, 4 archetypes, new names. |
| `dojo/game/types/skillEffects.ts` | All new effect descriptions (from this doc). |
| `dojo/game/helpers/runDataPacking.ts` | New bit layout, `rhythm_procs_this_level`. |
| `dojo/game/constants.ts` | All new constants. |
| `dojo/systems.ts` | `applyBonus` → `applyActiveSkill`. |
| `ui/pages/SkillTreePage.tsx` | 4 archetypes, 5 levels, branch at 3. |
| `ui/pages/DraftPage.tsx` | Updated skill pool. |
| `ui/components/BonusButton.tsx` | → `ActiveSkillButton.tsx`. |

---

## Key Source Files (Reference)

### Contract

| File | Purpose |
|------|---------|
| `contracts/src/helpers/skill_effects.cairo` | ALL skill effect values — **complete rewrite needed** |
| `contracts/src/systems/grid.cairo` | Move resolution, cascade loop, skill hooks |
| `contracts/src/helpers/packing.cairo` | run_data bit layout |
| `contracts/src/helpers/scoring.cairo` | Combo tracking, score updates |
| `contracts/src/models/game.cairo` | Game state model |
| `contracts/src/elements/bonuses/harvest.cairo` | Grid destruction logic (reusable for Harvest/Tsunami) |
| `contracts/src/elements/bonuses/wave.cairo` | Row clear logic (reusable for Tsunami) |

### Client

| File | Purpose |
|------|---------|
| `client-budokan/src/dojo/game/types/skillData.ts` | Skill/archetype definitions |
| `client-budokan/src/dojo/game/types/skillEffects.ts` | Effect descriptions |
| `client-budokan/src/dojo/game/helpers/runDataPacking.ts` | run_data packing |
| `client-budokan/src/dojo/game/constants.ts` | Constants |
| `client-budokan/src/dojo/systems.ts` | System calls |
