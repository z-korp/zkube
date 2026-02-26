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
8. [Augment System (Draft & Upgrades)](#augment-system-draft--upgrades)
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
    - [Gambit (Passive)](#9%EF%B8%8F⃣-passive--gambit)
13. [Control — Board Mastery](#-control--board-mastery)
    - [Tsunami (Active)](#-active--tsunami)
    - [Structural Integrity (Passive)](#1%EF%B8%8F⃣1%EF%B8%8F⃣-passive--structural-integrity)
    - [Grid Harmony (Passive)](#1%EF%B8%8F⃣2%EF%B8%8F⃣-passive--grid-harmony)
14. [Data Packing: run_data](#data-packing-run_data)
15. [Contract ↔ Client Interaction](#contract--client-interaction)
16. [Gap Analysis — Contracts](#gap-analysis--contracts)
17. [Gap Analysis — Client](#gap-analysis--client)
18. [Migration Notes (v1 → vNext)](#migration-notes-v1--vnext)

---

## Design Goals

1. **Reduce complexity**: 15 → 12 skills, 10 → 5 levels, 5 → 4 archetypes
2. **Strict domain separation**: Each archetype owns a clear domain; no cross-domain bleed
3. **Meaningful branches**: Branch at level 3 (not level 5) — players commit earlier
4. **Scarce charges**: Active skills are high-impact, timing-based — not spam tools
5. **Clear cube economy**: Only Risk archetype primarily generates cubes
6. **Skill-expressive gameplay**: Tempo = technical, Scaling = patient, Risk = greedy, Control = stabilizing
7. **No runaway loops**: All repeatable effects are hard-capped per level
8. **Simplified progression**: Startup draft (pick 3) → boss upgrades (level up 1) — no mid-map augments, no in-game shop

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
| Mid-map augments | Every N levels | **Removed** |
| In-game shop | Every 10 levels | **Removed** |
| Consumables | 4 types | **Removed** |
| Skill acquisition | Draft every N levels | **Startup draft (3 picks)** |
| Skill upgrades | Draft + shop | **Boss clear rewards (10/20/30/40)** |

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
| `UPGRADE_COST_L1` | 100 | CUBE cost for level 1 |
| `UPGRADE_COST_L2` | 500 | CUBE cost for level 2 |
| `UPGRADE_COST_L3` | 1000 | CUBE cost for level 3 (branch commitment) |
| `UPGRADE_COST_L4` | 5000 | CUBE cost for level 4 |
| `UPGRADE_COST_L5` | 10000 | CUBE cost for level 5 (capstone) |

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
- All repeatable effects — no cap (uncapped)

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
| 1 | 100 | Cheap — encourage trying skills |
| 2 | 500 | Moderate |
| 3 | 1,000 | Significant — branch commitment |
| 4 | 5,000 | Expensive |
| 5 | 10,000 | Premium — capstone investment |

**Respec cost**: 50% of total CUBE invested in that skill.

---

## Charge System

Charges fuel **Active Skills** only. Passive skills don't use charges.

| Rule | Value |
|------|-------|
| Max charges per active skill | **3** |
| Starting charges (after first draft) | **1 stack each** |
| Base charge cadence | **+1 to ALL active skills every 5 levels cleared** |
| Cadence modifier (Scaling Branch B only) | Reduce cadence to every 4 → 3 → 2 levels |
| Charge generation from combos/score | **FORBIDDEN** (no skill may do this) |
| Combo-based charge refill | **REMOVED** (was in v1) |

### Charge Gain Timeline (Base Cadence)

| Levels Cleared | Charges Gained | Total (if started at 1) |
|:--------------:|:--------------:|:-----------------------:|
| 0 (after draft) | — | 1 |
| 5 | +1 | 2 |
| 10 | +1 | 3 (capped) |

### Charge Gain Timeline (Scaling Branch B — Cadence Reduced to 2)

| Levels Cleared | Charges Gained | Total (if started at 1) |
|:--------------:|:--------------:|:-----------------------:|
| 0 (after draft) | — | 1 |
| 2 | +1 | 2 |
| 4 | +1 | 3 (capped) |

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

## Augment System (Draft & Upgrades)

The augment system replaces the previous draft/shop/consumable systems with a streamlined progression:

### Startup Draft (Game Creation)

Before level 1 begins, the player completes a **draft phase**:

1. Player sees a selection of available skills (cards)
2. Player picks **3 skills** to form their loadout
3. Each skill enters the loadout at **Level 1**
4. All active skills in the loadout receive **1 charge** each
5. Draft is **mandatory** — cannot start the run without 3 skills

**Draft Rules:**
- All 12 skills are available in the draft pool
- No archetype restrictions (can pick 3 from the same archetype)
- Reroll mechanic: `ceil(5 * 1.5^n)` CUBE cost where `n` = reroll count this draft
- Reroll cost sequence: 5, 8, 12, 18, 27, 41, ...
- Once 3 skills are selected, the draft phase ends and level 1 begins

### Boss Upgrade (Levels 10, 20, 30, 40)

After clearing a boss level (except level 50), the player receives a **Level Up Item**:

1. Player sees their current 3-skill loadout
2. Player selects **1 skill** to upgrade (level +1)
3. If a skill is already at **Level 5**, it **cannot be selected** for upgrade
4. At **Level 3**, the upgrade triggers a **branch choice** (A or B) — permanent for this run

**Boss Upgrade Rules:**
- Exactly 4 upgrade opportunities per run (levels 10, 20, 30, 40)
- Maximum achievable skill level in a single run: Level 5 (1 from draft + 4 from bosses, all on one skill)
- Level 50 boss does NOT grant an upgrade (run ends / victory)
- Player cannot skip the upgrade — must choose one skill

### Progression Timeline

```
Game Start → Startup Draft: Pick 3 skills (all Level 1)
                ↓
Levels 1-9  → Play with Level 1 skills, 1 charge each
                ↓
Level 10 Boss → Cleared! → Level Up Item → Upgrade 1 skill to Level 2
                ↓
Levels 11-19 → Play with upgraded loadout
                ↓
Level 20 Boss → Cleared! → Level Up Item → Upgrade 1 skill to Level 3 (BRANCH CHOICE)
                ↓
Levels 21-29 → Play with branched skill
                ↓
Level 30 Boss → Cleared! → Level Up Item → Upgrade 1 skill to Level 4
                ↓
Levels 31-39 → Near-capstone power
                ↓
Level 40 Boss → Cleared! → Level Up Item → Upgrade 1 skill to Level 5 (CAPSTONE)
                ↓
Levels 41-50 → Full power → Level 50 Boss → Victory!
```

### What Was Removed

| Feature | Status | Replacement |
|---------|--------|-------------|
| Mid-map augment draft | **Removed** | Startup draft + boss upgrades |
| In-game shop (every 10 levels) | **Removed** | Boss upgrade is free |
| Consumables (4 types) | **Removed** | Skills handle everything |
| Combo-based charge refill | **Removed** | Cadence-only charge refill (every 5 levels) |
| Reroll during mid-map drafts | **Removed** | Reroll only available at startup draft |

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
| 3 | B — Flow | +2 combo depth (combo depth lasts the full level, once per level, not stackable) |

**Branch A — Burst** (explosive spike potential)

| Level | Effect |
|:-----:|--------|
| 4 | +4 combo depth |
| 5 | +5 combo depth. If combo ≥ 6 → refund 1 move |

**Branch B — Flow** (sustained combo depth for an entire level)

| Level | Effect |
|:-----:|--------|
| 4 | +3 combo depth for the full level (once per level, not stackable) |
| 5 | +4 combo depth for the full level (once per level, not stackable) |

**Design Notes**:
- Burst = explosive spike potential, high immediate impact
- Flow = one activation boosts ALL moves for the rest of the level — massive sustained value
- Branch B "combo depth for the full level" means: after activation, every move this level gets bonus combo depth
- "Once per level, not stackable" = using a second charge on the same level has no additional effect
- No score injection, no cube generation
- Strong synergy with natural cascades

---

### 2️⃣ Passive — Rhythm

**ID**: 2 | **Type**: Passive | **Domain**: Combo streak scaling

Converts combo streak (`combo_counter`) into controlled bursts. Uses existing per-level cumulative combo streak — no new state needed.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Every 12 combo_streak gained → next move +1 combo (no cap) |
| 2 | — | Every 10 combo_streak gained → next move +1 combo (no cap) |
| 3 | A — Acceleration | Every 10 streak → next move +2 combo (no cap) |
| 3 | B — Stability | Every 10 streak → next move +3 combo (no cap) |

**Branch A — Acceleration** (frequent combo injections)

| Level | Effect |
|:-----:|--------|
| 4 | Every 8 streak → next move +2 combo (no cap) |
| 5 | Every 6 streak → next move +2 combo (no cap) |

**Branch B — Stability** (larger bursts, same frequency)

| Level | Effect |
|:-----:|--------|
| 4 | Every 8 streak → next move +3 combo (no cap) |
| 5 | Every 8 streak → next move +4 combo (no cap) |

**Design Notes**:
- **No cap** on procs per level — removed `max_rhythm_procs_per_level`
- No permanent scaling — combo_streak resets each level
- Reads existing `combo_counter` (Game model) — zero new tracking state
- Acceleration = more frequent, moderate bursts
- Stability = fewer, larger bursts

**Implementation**: No `rhythm_procs_this_level` needed in `run_data` (removed — was 3 bits). Only needs `rhythm_streak_accumulator` to track progress toward next proc threshold (or can derive from `combo_counter % threshold`).

---

### 3️⃣ Passive — Cascade Mastery

**ID**: 3 | **Type**: Passive | **Domain**: Multi-phase gravity cascades

Rewards deep cascades. Uses **per-resolution** cascade depth (transient, not cumulative). Distinct from Rhythm which uses cumulative combo_streak.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If cascade depth ≥ 5 → +1 bonus combo depth |
| 2 | — | If cascade depth ≥ 4 → +2 bonus combo depth |
| 3 | A — Amplify | If cascade depth ≥ 4 → +3 bonus combo depth |
| 3 | B — Extend | Cascade threshold reduced by 1 (easier multi-phase triggers) |

**Branch A — Amplify** (high-skill payoff for deep cascades)

| Level | Effect |
|:-----:|--------|
| 4 | If cascade depth ≥ 4 → +4 bonus combo depth |
| 5 | If cascade depth ≥ 3 → +5 bonus combo depth |

**Branch B — Extend** (consistency path for smoother chaining)

| Level | Effect |
|:-----:|--------|
| 4 | First cascade phase counts as depth 2 |
| 5 | First two cascade phases gain +1 depth |

**Design Notes**:
- Amplify = high combo depth payoff for deep cascades
- Extend = easier to trigger cascade bonuses
- Per-resolution only (cascade_depth resets every move) — no cumulative scaling
- Removed "score per cascade phase" and "combo multiplier" from previous version — now combo depth only
- Synergizes strongly with Combo Surge

**Implementation**: Add `cascade_depth: u8` counter to `assess_game()` loop (transient local variable — NOT stored in run_data). Increment per outer loop iteration in `grid.cairo:830`.

---

### 🟣 Tempo Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Combo Surge | High-impact spike / sustained depth | Combo depth injection |
| Rhythm | Chain engine | Combo-streak-gated bursts (uncapped) |
| Cascade Mastery | Depth enhancer | Per-resolution cascade reward (combo depth) |

**Identity Check**: ✅ Combo manipulation · ✅ Cascade enhancement · ✅ Combo-tied move sustain · ✅ No cubes · ✅ No difficulty reduction · ✅ No grid manipulation · ✅ No score multipliers

---

## 🟡 SCALING — Long-Run Growth

> Weak early. Strong late.
> **No cubes. No combo injection. Only archetype that modifies charge cadence.**

### 4️⃣ Active — Overdrive

**ID**: 4 | **Type**: Active (consumes 1 charge) | **Domain**: Score multiplier burst

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | x1.5 score this move |
| 2 | — | x2 score this move |
| 3 | A — Amplify | x2.5 score this move |
| 3 | B — Overflow | x2 score this move + reduce charge cadence |

**Branch A — Amplify** (raw score power)

| Level | Effect |
|:-----:|--------|
| 4 | x3 score this move |
| 5 | x4 score this move |

**Branch B — Overflow** (charge economy)

| Level | Effect |
|:-----:|--------|
| 4 | Charge cadence: every 4 levels (was 5) |
| 5 | Charge cadence: every 2 levels (was 5) |

**Design Notes**:
- Changed from % bonus to multipliers (x1.5, x2, x2.5, x3, x4)
- Amplify = raw late-run score explosion
- Overflow = more charges for all active skills (team-wide benefit)
- Branch B cadence now goes to every 2 levels (was every 3 in previous version)
- Branch B is the ONLY place in the entire game where charge cadence can be modified
- No cubes, no combo, no grid manipulation

---

### 5️⃣ Passive — Momentum Scaling

**ID**: 5 | **Type**: Passive | **Domain**: Per-level score scaling

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | +5 flat score at level start (per zone) |
| 2 | — | +10 flat score at level start (per zone) |
| 3 | A — Late Bloom | +15 flat score at level start (per zone) |
| 3 | B — Stable Growth | +8 flat score at every level start |

**Branch A — Late Bloom** (zone-based scaling — stronger in later zones)

| Level | Effect |
|:-----:|--------|
| 4 | +20 flat score at level start (per zone) |
| 5 | +30 flat score at level start (per zone) |

**Branch B — Stable Growth** (consistent flat score every level)

| Level | Effect |
|:-----:|--------|
| 4 | +12 flat score at every level start |
| 5 | +18 flat score at every level start |

**Design Notes**:
- Completely redesigned from % per level cleared → flat score at level start
- "Per zone" means the bonus amount scales by which zone (10-level block) the player is in
  - Zone 1 (L1-10): base amount × 1
  - Zone 2 (L11-20): base amount × 2
  - Zone 3 (L21-30): base amount × 3
  - Zone 4 (L31-40): base amount × 4
  - Zone 5 (L41-50): base amount × 5
- Branch A = zone-scaled (strong late, weak early)
- Branch B = same flat amount every level (consistent value)
- No multiplier — flat score injection (allowed for Scaling)

---

### 6️⃣ Passive — Endgame Focus

**ID**: 6 | **Type**: Passive | **Domain**: Late-run ramping

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | +5 flat score at level start + 0.2 per level cleared |
| 2 | — | +10 flat score at level start + 0.3 per level cleared |
| 3 | A — Deep End | +15 flat score at level start + 0.5 per level cleared |
| 3 | B — Smooth Ramp | +8 flat score at level start + 0.3 per level cleared (from level 1) |

**Branch A — Deep End** (massive late-game payoff with fractional scaling)

| Level | Effect |
|:-----:|--------|
| 4 | +20 flat score at level start + 0.5 per level cleared |
| 5 | +30 flat score at level start + 1.0 per level cleared |

**Branch B — Smooth Ramp** (always-on linear growth)

| Level | Effect |
|:-----:|--------|
| 4 | +12 flat score at level start + 0.5 per level cleared |
| 5 | +18 flat score at level start + 1.0 per level cleared |

**Design Notes**:
- Completely redesigned from threshold-based % to flat score + fractional per-level scaling
- "per level cleared" = cumulative bonus grows as more levels are beaten
  - At level 30 with +0.5 per level: bonus = base + (30 × 0.5) = base + 15
- Deep End = higher base, same fractional rate
- Smooth Ramp = lower base, same fractional rate, but counts from level 1 (Branch A may have late-start threshold)
- Fractional values stored as fixed-point (multiply by 10, divide at application)

---

### 🟡 Scaling Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Overdrive | Score burst / charge economy | Score multiplier or cadence reduction |
| Momentum Scaling | Zone-based growth | Flat score at level start (per zone or flat) |
| Endgame Focus | Late-run ramp | Flat score + fractional per-level scaling |

**Identity Check**: ✅ Score multipliers · ✅ Per-level scaling · ✅ Late-run ramping · ✅ Charge cadence (Branch B only) · ✅ No cubes · ✅ No combo · ✅ No grid manipulation

---

## 🔴 RISK / ECONOMY — Greed & Volatility

> Primary cube generation. Must include downside.
> **No safe passive scaling. No score multipliers. No constraint easing.**

### 7️⃣ Active — Harvest

**ID**: 7 | **Type**: Active (consumes 1 charge) | **Domain**: Cube generation via block destruction / line injection

Cubes scale with block **size** (size 2 block → +2 cubes, size 4 block → +4 cubes).

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Destroy 3 random blocks → cubes = block size per block |
| 2 | — | Destroy 5 random blocks → cubes = block size per block |
| 3 | A — Extraction | Destroy 6 random blocks → cubes = block size × 2 per block |
| 3 | B — Injection | Add 1 random line → +8 cubes |

**Branch A — Extraction** (targeted destruction for cubes, scaled by block size)

| Level | Effect |
|:-----:|--------|
| 4 | Destroy 8 random blocks → cubes = block size × 2 per block |
| 5 | Destroy 10 random blocks → cubes = block size × 3 per block |

**Branch B — Injection** (line injection with cube burst — high risk)

| Level | Effect |
|:-----:|--------|
| 4 | Add 1 line → +12 cubes |
| 5 | Add 2 lines → +20 cubes |

**Design Notes**:
- Extraction cubes now scale with block SIZE (size 2 → +2 cubes, size 4 → +4 cubes at L1-2; ×2 multiplier at L3A+)
- "Random blocks" instead of "blocks of chosen size" — removes player targeting, adds volatility
- Injection = dangerous but lucrative (adding lines raises grid height = game over risk)
- Both paths have real tradeoffs (destroying random blocks can break combos, adding lines risks game over)

---

### 8️⃣ Passive — High Stakes

**ID**: 8 | **Type**: Passive | **Domain**: Grid height cube rewards

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid ≥ 7 rows → +1 cube per clear |
| 2 | — | If grid ≥ 7 rows → +2 cubes per clear |
| 3 | A — Edge | If grid ≥ 8 rows → +4 cubes per clear |
| 3 | B — Threshold | Grid height threshold reduced by 1 |

**Branch A — Edge** (maximum risk, maximum reward)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 8 rows → +6 cubes per clear |
| 5 | If grid ≥ 8 rows → +10 cubes per clear (cap) |

**Branch B — Threshold** (lower threshold, safer farming)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 6 rows → +3 cubes per clear |
| 5 | If grid ≥ 5 rows → +4 cubes per clear |

**Design Notes**:
- Values lowered from previous version (was +2/+3/+5/+6/+8 → now +1/+2/+4/+6/+10)
- Edge Branch A caps at +10 cubes at ≥8 rows
- Threshold Branch B goes down to ≥5 (was ≥6)
- Edge = play at the brink of game over for massive cube payouts
- Threshold = reliable cube income at safer heights
- Both require high grid = real danger of game over

---

### 9️⃣ Passive — Gambit

**ID**: 9 | **Type**: Passive | **Domain**: Risk/reward cube generation from dangerous grid states

Completely redesigned from Volatility (random line injection). Gambit rewards surviving danger: when you clear a line with your grid at a dangerous height, you earn cubes. **Once per level trigger**.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid ≥ 8 rows when you clear a line → +3 cubes (once per level) |
| 2 | — | If grid ≥ 8 rows when you clear a line → +5 cubes (once per level) |
| 3 | A — Daredevil | If grid ≥ 9 rows → +8 cubes (once per level) |
| 3 | B — Opportunist | If grid ≥ 7 rows → +4 cubes (once per level) |

**Branch A — Daredevil** (extreme risk for massive payout)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 9 rows → +12 cubes (once per level) |
| 5 | If grid ≥ 9 rows → +18 cubes (once per level) |

**Branch B — Opportunist** (lower threshold, more reliable)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 7 rows → +6 cubes (once per level) |
| 5 | If grid ≥ 6 rows → +8 cubes (once per level) |

**Design Notes**:
- Completely replaces Volatility (random line injection with % chance)
- "Once per level" = the first time you clear a line at dangerous height, you earn cubes; subsequent clears at that height don't trigger again until next level
- Needs `gambit_triggered_this_level: bool` in run_data (1 bit), reset on level advance
- Daredevil = near-death grid state required, massive payout
- Opportunist = more forgiving threshold, steadier income
- Synergizes with High Stakes (both reward high-grid play)
- No randomness — purely skill/risk based

---

### 🔴 Risk Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Harvest | Cube burst (active) | Random block destruction (size-scaled) or line injection |
| High Stakes | Conditional cube income | Grid height threshold |
| Gambit | Risk/reward cube burst | Clear-at-danger-height bonus (once per level) |

**Identity Check**: ✅ Cube generation · ✅ Conditional rewards · ✅ Real downside · ✅ Grid height risk · ✅ No score multipliers · ✅ No constraint easing · ✅ No combo manipulation

---

## 🔵 CONTROL — Board Mastery

> Grid shaping. Stability. Constraint easing.
> **No cubes. No combo injection. No score multipliers.**

### 🔟 Active — Tsunami

**ID**: 10 | **Type**: Active (consumes 1 charge) | **Domain**: Targeted destruction / row clears

Completely redesigned — now targets specific blocks or rows instead of always clearing bottom rows.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | Destroy 4 targeted blocks |
| 2 | — | Destroy 6 targeted blocks |
| 3 | A — Purge | Destroy 8 targeted blocks |
| 3 | B — Sweep | Clear 1 targeted row |

**Branch A — Purge** (precision block destruction)

| Level | Effect |
|:-----:|--------|
| 4 | Destroy 10 targeted blocks |
| 5 | Clear all blocks of targeted size (player selects a block size, all blocks of that size are destroyed) |

**Branch B — Sweep** (row-based clearing)

| Level | Effect |
|:-----:|--------|
| 4 | Clear 2 targeted rows |
| 5 | Clear 3 targeted rows |

**Design Notes**:
- Completely redesigned from bottom-row clearing → targeted blocks/rows
- "Targeted blocks" = player selects specific blocks on the grid to destroy
- Branch A capstone: "clear all blocks of targeted size" = player picks a block size (1-4), all blocks of that size are destroyed
- Branch B: "targeted rows" = player selects which rows to clear (not always bottom)
- Purge = surgical removal of problem blocks
- Sweep = emergency row clearing with player choice
- No score bonus, no cube generation — pure grid control

---

### 1️⃣1️⃣ Passive — Structural Integrity

**ID**: 11 | **Type**: Passive | **Domain**: Grid stabilization via automatic row removal at high grid height

Completely redesigned from Constraint Ease. When your grid gets too high, automatically removes the bottom row(s) as a safety mechanism.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | If grid ≥ 9 rows after a move → remove 1 bottom row |
| 2 | — | If grid ≥ 8 rows after a move → remove 1 bottom row |
| 3 | A — Reinforced | If grid ≥ 8 rows → remove 2 bottom rows |
| 3 | B — Sensitive | If grid ≥ 7 rows → remove 1 bottom row |

**Branch A — Reinforced** (aggressive grid management at high height)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 8 rows → remove 2 bottom rows + constraint requirement reduced by 5% |
| 5 | If grid ≥ 7 rows → remove 2 bottom rows + constraint requirement reduced by 10% |

**Branch B — Sensitive** (earlier trigger, more frequent safety net)

| Level | Effect |
|:-----:|--------|
| 4 | If grid ≥ 6 rows → remove 1 bottom row |
| 5 | If grid ≥ 6 rows → remove 1 bottom row + 1 free move per level |

**Design Notes**:
- Replaces Constraint Ease — now primarily about grid height safety
- Automatic trigger (passive) — no player action needed
- Reinforced = aggressive removal at high grid, with mild constraint reduction at L4-5
- Sensitive = triggers earlier, more frequent but less removal
- Anti-synergy with High Stakes / Gambit (removes the high grid they need) — build tension!
- Constraint reduction only appears as a secondary bonus at L4-5 Branch A

---

### 1️⃣2️⃣ Passive — Grid Harmony

**ID**: 12 | **Type**: Passive | **Domain**: Grid stabilization via automatic row removal at high grid height

Replaces Grid Discipline. Provides a secondary grid-height-based row removal mechanism, complementing Structural Integrity with different triggers and thresholds.

| Level | Branch | Effect |
|:-----:|:------:|--------|
| 1 | — | After clearing ≥ 2 lines in one move, if grid ≥ 8 → remove 1 extra bottom row |
| 2 | — | After clearing ≥ 2 lines in one move, if grid ≥ 7 → remove 1 extra bottom row |
| 3 | A — Flow State | After clearing ≥ 2 lines, if grid ≥ 7 → remove 2 extra bottom rows |
| 3 | B — Balance | After clearing ≥ 1 line, if grid ≥ 8 → remove 1 extra bottom row |

**Branch A — Flow State** (rewards multi-line clears with aggressive grid management)

| Level | Effect |
|:-----:|--------|
| 4 | After clearing ≥ 2 lines, if grid ≥ 6 → remove 2 extra bottom rows |
| 5 | After clearing ≥ 2 lines, if grid ≥ 6 → remove 2 extra rows + generated lines have 20% fewer blocks |

**Branch B — Balance** (any clear can trigger, more consistent)

| Level | Effect |
|:-----:|--------|
| 4 | After clearing ≥ 1 line, if grid ≥ 7 → remove 1 extra bottom row |
| 5 | After clearing ≥ 1 line, if grid ≥ 7 → remove 1 extra row + next generated line preview visible |

**Design Notes**:
- Replaces Grid Discipline (generated-line difficulty reduction)
- Conditionally triggered: requires both a line clear AND high grid state
- Flow State = rewards skilled play (multi-line clears) with aggressive cleanup
- Balance = any clear can trigger, more forgiving
- Branch A L5 capstone retains "fewer blocks in generated lines" from old Grid Discipline
- Branch B L5 capstone retains "line preview" from old Grid Discipline
- Different from Structural Integrity: requires an active clear (not just any move), but combo-tied

---

### 🔵 Control Archetype Summary

| Skill | Role | Key Mechanic |
|-------|------|--------------|
| Tsunami | Emergency grid control | Targeted block/row destruction |
| Structural Integrity | Passive grid safety | Auto-remove rows at high grid height |
| Grid Harmony | Conditional grid cleanup | Remove rows on line-clear at high grid |

**Identity Check**: ✅ Grid shaping · ✅ Row clears · ✅ Targeted destruction · ✅ No cubes · ✅ No score multipliers · ✅ No combo manipulation

---

## Data Packing: run_data

### Current State (v1): 133/252 bits used

The `run_data` field (felt252) stores the current run's skill loadout and progress. 119 bits remain free.

### New Fields Required (vNext)

| Field | Bits | Purpose | Persisted? |
|-------|------|---------|------------|
| `gambit_triggered_this_level` | 1 | Track Gambit once-per-level trigger | ✅ Yes (reset on level advance) |
| `combo_surge_flow_active` | 1 | Track if Combo Surge Branch B is active this level | ✅ Yes (reset on level advance) |
| `cascade_depth` | — | Count gravity phases per move | ❌ No (transient local var) |

**Fields Removed (vs previous version):**
- `rhythm_procs_this_level` (was 3 bits) — REMOVED, no cap on Rhythm procs

**Total new run_data: 2 bits → 135/252 used (117 bits still free)**

### vNext Loadout Slot Layout

Skill IDs 1-12 still fit in 4 bits. Levels 1-5 fit in 3 bits (was 4). Charges 0-3 still fit in 2 bits.

```
Proposed narrower layout:
  active_slot_count: 2 bits (0-3)
  Per slot (×3):
    skill_id:  4 bits (0-12)
    level:     3 bits (0-5)
    charges:   2 bits (0-3)
    branch:    2 bits (0=none, 1=A, 2=B)
  = 2 + 3×(4+3+2+2) = 2 + 33 = 35 bits for loadout
```

### SkillSlot Interface (vNext)

```typescript
interface SkillSlot {
  skillId: number;  // 1-12 (1,4,7,10 = active; rest = passive), 0 = empty
  level: number;    // 1-5
  charges: number;  // 0-3 (only meaningful for active skills)
  branch: 'none' | 'A' | 'B';  // 'none' if level < 3
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

### Startup Draft Flow

```
Client: DraftPage (game creation)
  → Player selects 3 skills from pool
  → systems.ts: createGameWithDraft({ account, token_id, skill_ids: [a, b, c] })
    → Contract: game_system.create_with_draft(token_id, skill_ids)
      → Validate: exactly 3 skills, valid IDs (1-12)
      → Initialize loadout: all at Level 1, active skills get 1 charge each
      → Store in run_data
      → Start level 1
```

### Boss Upgrade Flow

```
Client: BossUpgradePage (after boss clear)
  → Player sees current 3 skills with levels
  → Player selects 1 skill to upgrade
  → If upgrading to Level 3: must also choose Branch A or B
  → systems.ts: upgradeBossReward({ account, game_id, skill_index, branch? })
    → Contract: game_system.boss_upgrade(game_id, skill_index, branch)
      → Validate: boss was just cleared, skill level < 5
      → Increment skill level
      → If level 3: store branch choice
      → Continue to next level
```

### Applying an Active Skill

```
Client (ActiveSkillButton click)
  → systems.ts: applyActiveSkill({ account, game_id, skill_id, target_data? })
    → Contract: game_system.apply_active_skill(game_id, skill_id, target_data)
      → Verify skill is in loadout and has charges > 0
      → Decrement charges
      → skill_effects.cairo: active_effect_for_skill(skill_id, level, branch_id)
        → Returns ActiveEffect struct
      → Apply effect (grid modification, combo add, etc.)
      → For Combo Surge Branch B: set combo_surge_flow_active flag
```

### Passive Skill Resolution

```
Contract: During move resolution / level start / level complete
  → skill_effects.cairo: passive_effect_for_skill(skill_id, level, branch_id)
  → skill_effects.cairo: aggregate_passive_effects(run_data, branch_ids)
    → Combines effects from all passive skills in loadout
  → Applied during move resolution (Rhythm, Cascade Mastery, High Stakes, Gambit, Structural Integrity, Grid Harmony)
  → Applied at level start (Momentum Scaling, Endgame Focus)
  → Applied at level complete (charge replenishment)
```

### Charge Replenishment

```
Contract: On level complete
  → Check levels_cleared % charge_cadence == 0
  → If yes: for each active skill in loadout, charges = min(charges + 1, 3)
  → charge_cadence = 5 (base) or 4/2 if Scaling Overflow Branch B is active
```

---

## Gap Analysis — Contracts

### Systems to Add

| System | Purpose | Effort |
|--------|---------|--------|
| `draft_system` | Handle startup draft: validate 3 skill selections, initialize loadout | Medium |
| `boss_upgrade_system` | Handle boss upgrades: validate skill selection, increment level, branch choice | Medium |

### Systems to Modify

| System | Changes | Effort |
|--------|---------|--------|
| `game_system.create()` | Integrate draft phase — require 3 skill IDs, initialize loadout in run_data | Medium |
| `game_system.move()` | Add passive skill hooks (Rhythm, Cascade Mastery, Structural Integrity, Grid Harmony) at appropriate resolution points | High |
| `game_system.apply_bonus()` | Rename to `apply_active_skill()`. Dispatch to new skill effect functions. Handle Combo Surge Branch B (level-wide flag). Handle Tsunami targeting. Handle Harvest random block selection. | High |
| `grid.cairo: execute_move()` | Add `cascade_depth` counter. Add Rhythm check after combo tracking. Add Cascade Mastery check after gravity loop. Add Structural Integrity check after move resolves. Add Grid Harmony check after line clear. | High |
| `grid.cairo: assess_game()` | Track cascade depth in gravity loop (~15 lines). Apply Gambit trigger on line clear at high grid. | Medium |
| `scoring.cairo` | Add Overdrive multiplier application. Add Momentum Scaling flat score at level start. Add Endgame Focus flat score + fractional scaling. | Medium |
| `packing.cairo` | Add `gambit_triggered_this_level` (1 bit), `combo_surge_flow_active` (1 bit), `branch` per slot (2 bits × 3). Remove `rhythm_procs_this_level`. Update bit layout. | Medium |
| `models/game.cairo` | Reset `gambit_triggered_this_level` and `combo_surge_flow_active` on level advance. Add boss upgrade tracking (which bosses cleared). | Low |
| `level.cairo` | Remove in-game shop trigger at levels 10/20/30/40. Add boss upgrade trigger instead. | Low |
| `bonus_logic.cairo` / `skill_effects.cairo` | Complete rewrite — 12 skills × 5 levels × 2 branches. New `ActiveEffect` + `PassiveEffect` structs. | High |

### Systems to Remove

| System | Reason |
|--------|--------|
| `shop_system` (in-game shop) | Replaced by boss upgrades |
| `purchase_consumable()` | Consumables removed |
| `consumable.cairo` types | No longer needed |
| Mid-map draft logic | Replaced by startup draft |

### New Types Required

| Type | Fields | Notes |
|------|--------|-------|
| `DraftSelection` | `skill_ids: [u8; 3]` | Startup draft payload |
| `BossUpgrade` | `skill_index: u8, branch: u8` | Boss upgrade payload |
| `ActiveEffect` | `combo_depth: u8, score_multiplier: u16, blocks_to_destroy: u8, lines_to_add: u8, cubes: u16, target_mode: u8, combo_surge_flow: bool` | Comprehensive active effect struct |
| `PassiveEffect` | `rhythm_threshold: u8, rhythm_combo: u8, cascade_threshold: u8, cascade_combo: u8, score_flat: u16, score_per_level: u16, cube_per_clear: u8, grid_threshold: u8, gambit_cubes: u8, gambit_threshold: u8, row_removal_threshold: u8, rows_to_remove: u8, constraint_reduction: u8, line_clear_min: u8, block_reduction_pct: u8, preview_lines: u8, free_moves: u8` | Comprehensive passive effect struct |

### Estimated Total Contract Effort

| Category | Effort |
|----------|--------|
| New systems (draft, boss upgrade) | **Medium** |
| Skill effects rewrite | **High** |
| Move resolution hooks | **High** |
| Data packing changes | **Medium** |
| Type cleanup (remove consumables, shop) | **Low** |
| **Total** | **~3-4 weeks** |

---

## Gap Analysis — Client

### New Screens / Pages

| Screen | Purpose | Priority |
|--------|---------|----------|
| `StartupDraftPage` | Pick 3 skills before run starts | **P0** (blocking) |
| `BossUpgradePage` | Pick 1 skill to level up after boss clear | **P0** (blocking) |
| `BranchChoicePage` (or modal) | Choose Branch A or B when upgrading to Level 3 | **P0** (blocking) |

### Screens to Remove

| Screen | Reason |
|--------|--------|
| `InGameShopPage` / shop modal | In-game shop removed |
| Consumable UI (if any) | Consumables removed |
| Mid-map draft UI | Mid-map augments removed |

### Screens to Modify

| Screen | Changes |
|--------|---------|
| `Play.tsx` | Remove shop trigger at boss levels. Add boss upgrade trigger. Remove consumable buttons. Update skill display (5 levels, branches). |
| `DraftPage.tsx` | Rewrite as startup-only draft. Show all 12 skills. Pick 3 (not upgrade existing). |
| `SkillTreePage.tsx` | 4 archetypes, 12 skills, 5 levels, branch at 3. Show upgrade costs (100/500/1K/5K/10K). |
| `Home.tsx` | May need to show permanent skill investment / CUBE costs |

### New Hooks Required

| Hook | Purpose |
|------|---------|
| `useDraft` | Manage startup draft state (available skills, selections, reroll) |
| `useBossUpgrade` | Manage boss upgrade flow (skill selection, branch choice) |
| `useActiveSkillTargeting` | Handle Tsunami/Harvest targeting UI (select blocks/rows on grid) |

### Data Types to Update

| File | Changes |
|------|---------|
| `bonus.ts` | Replace with `ActiveSkill` type. Add targeting modes. |
| `skillData.ts` | 12 skills, 4 archetypes, renamed skills (Gambit, Structural Integrity, Grid Harmony). |
| `skillEffects.ts` | All new effect descriptions from this doc. |
| `runDataPacking.ts` | New bit layout: `gambit_triggered_this_level`, `combo_surge_flow_active`, `branch` per slot. Remove `rhythm_procs_this_level`. |
| `constants.ts` | All new constants (upgrade costs, charge cadence, skill IDs). |

### System Calls to Update

| Call | Changes |
|------|---------|
| `systems.ts: create()` | Add `skill_ids` parameter for startup draft |
| `systems.ts: applyBonus()` | Rename to `applyActiveSkill()`. Add `target_data` for Tsunami/Harvest targeting. |
| NEW: `systems.ts: bossUpgrade()` | New call for boss upgrade selection |
| REMOVE: `systems.ts: purchaseConsumable()` | Consumables removed |

### UI Components

| Component | Status | Notes |
|-----------|--------|-------|
| `BonusButton.tsx` | **Rename** → `ActiveSkillButton.tsx` | Update for new skill IDs, targeting |
| `SkillCard.tsx` | **New** | Draft card showing skill info, archetype color, level |
| `BranchSelector.tsx` | **New** | Branch A/B choice UI at Level 3 |
| `BossRewardModal.tsx` | **New** | Boss clear → upgrade selection |
| `TargetingOverlay.tsx` | **New** | Grid overlay for Tsunami/Harvest block selection |
| Consumable buttons | **Remove** | No longer needed |
| Shop UI components | **Remove** | No longer needed |

### Estimated Total Client Effort

| Category | Effort |
|----------|--------|
| New pages (draft, boss upgrade, branch) | **High** |
| Targeting UI (Tsunami/Harvest) | **Medium** |
| Data type rewrites | **Medium** |
| Remove shop/consumable code | **Low** |
| Skill tree page rewrite | **Medium** |
| System call updates | **Low** |
| **Total** | **~3-4 weeks** |

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
| Mid-map augments | Every N levels | **Removed** |
| In-game shop | Every 10 levels | **Removed** |
| Consumables | 4 types | **Removed** |
| Skill acquisition | Draft mid-run | **Startup draft only** |
| Skill upgrades | Draft + shop | **Boss clear rewards** |

### Skill Name Mapping (v1 → vNext)

| v1 Skill | v1 ID | vNext Equivalent | vNext ID | Notes |
|----------|:-----:|------------------|:--------:|-------|
| Combo | 1 | **Combo Surge** | 1 | Simplified, 5 levels, +1/+2/+3 (was +2/+3/+5). Branch B = level-wide combo depth |
| Score | 2 | — | — | Removed (replaced by Overdrive) |
| Harvest | 3 | **Harvest** | 7 | Moved to Risk. Cubes scale with block SIZE. Random blocks (not chosen). |
| Wave | 4 | **Tsunami** | 10 | Renamed, moved to Control. Targeted blocks/rows (not bottom). |
| Supply | 5 | — | — | Removed (line injection folded into Harvest Branch B) |
| Tempo | 6 | **Rhythm** | 2 | Redesigned. No cap on procs. |
| Fortune | 7 | — | — | Removed (cube gen moved to Risk passives) |
| Surge | 8 | **Momentum Scaling** | 5 | Redesigned as flat score at level start (zone or flat) |
| Catalyst | 9 | — | — | Removed |
| Resilience | 10 | — | — | Removed (free moves folded into Structural Integrity Branch B) |
| Focus | 11 | **Structural Integrity** | 11 | Redesigned: auto-remove rows at high grid height |
| Expansion | 12 | **Grid Harmony** | 12 | Redesigned: conditional row removal on line-clear at high grid |
| Momentum | 13 | — | — | Removed (merged into Rhythm + Cascade Mastery) |
| Adrenaline | 14 | **High Stakes** | 8 | Redesigned: lower values, +1/+2/+4/+6/+10 |
| Legacy | 15 | — | — | Removed (replaced by Endgame Focus) |
| — | — | **Cascade Mastery** | 3 | NEW — higher thresholds (≥5, ≥4), combo depth only |
| — | — | **Overdrive** | 4 | NEW — multipliers (x1.5-x4), Branch B cadence to every 2 |
| — | — | **Endgame Focus** | 6 | NEW — flat score + fractional per-level scaling |
| — | — | **Gambit** | 9 | NEW — replaces Volatility. Survive danger → earn cubes (once per level) |

### Key Behavioral Changes

1. **No mid-run skill acquisition** — all 3 skills picked at game start
2. **No in-game shop** — boss clears provide free upgrades
3. **No consumables** — skills handle everything
4. **Charge refill is cadence-only** — no more combo-based refill
5. **Charges filled with 1 stack after draft** — not empty
6. **Overdrive uses multipliers** (x1.5, x2, etc.) — not % bonus
7. **Rhythm has no proc cap** — previously had max_procs_per_level
8. **Cascade Mastery rewards combo depth only** — removed score per phase, removed combo multiplier
9. **Harvest targets random blocks** — not player-chosen size
10. **Tsunami targets specific blocks/rows** — not always bottom rows
11. **Both Control passives are about row removal at high grid** — not constraint % / generated line difficulty

---

## Key Source Files (Reference)

### Contract

| File | Purpose |
|------|---------|
| `contracts/src/helpers/skill_effects.cairo` | ALL skill effect values — **complete rewrite needed** |
| `contracts/src/systems/grid.cairo` | Move resolution, cascade loop, skill hooks |
| `contracts/src/systems/game.cairo` | Game creation, apply_bonus → apply_active_skill |
| `contracts/src/systems/shop.cairo` | **TO BE REMOVED** (in-game shop) |
| `contracts/src/helpers/packing.cairo` | run_data bit layout |
| `contracts/src/helpers/scoring.cairo` | Combo tracking, score updates |
| `contracts/src/models/game.cairo` | Game state model |
| `contracts/src/types/bonus.cairo` | Bonus enum — **rewrite as skill IDs** |
| `contracts/src/types/consumable.cairo` | **TO BE REMOVED** |
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
| `client-budokan/src/ui/pages/DraftPage.tsx` | **Rewrite as startup-only draft** |
| `client-budokan/src/ui/pages/SkillTreePage.tsx` | **Rewrite for 4 archetypes, 5 levels** |
| `client-budokan/src/ui/components/BonusButton.tsx` | **Rename → ActiveSkillButton.tsx** |
