# zKube Skill System — Structural Redesign (vNext Design Spec)

> **Status**: Design spec — NOT YET IMPLEMENTED.
> **Purpose**: Prescriptive specification for the next version of the skill system. Use this document as the source of truth for implementation.
> **Replaces**: v1 system (15 skills, 5 archetypes, 10 levels, branch at level 5).

---

## Table of Contents

1. [Design Goals](#design-goals)
2. [System Overview](#system-overview)
3. [Archetypes (4)](#archetypes-4)
   - [Tempo (Purple)](#-tempo-purple)
   - [Scaling (Yellow)](#-scaling-yellow)
   - [Risk / Economy (Red)](#-risk--economy-red)
   - [Control (Blue)](#-control-blue)
4. [Skill Structure](#skill-structure)
5. [Level Progression (5 Levels)](#level-progression-5-levels)
6. [Charge System](#charge-system)
7. [Cube Economy Rules](#cube-economy-rules)
8. [Draft System](#draft-system)
9. [Domain Separation Rules](#domain-separation-rules)
10. [Skill Templates](#skill-templates)
    - [Tempo Skills](#tempo-skills)
    - [Scaling Skills](#scaling-skills)
    - [Risk / Economy Skills](#risk--economy-skills)
    - [Control Skills](#control-skills)
11. [Data Packing: run_data](#data-packing-run_data)
12. [Contract ↔ Client Interaction](#contract--client-interaction)
13. [Migration Notes (v1 → vNext)](#migration-notes-v1--vnext)

---

## Design Goals

1. **Reduce complexity**: 15 → 12 skills, 10 → 5 levels, 5 → 4 archetypes
2. **Strict domain separation**: Each archetype owns a clear domain; no cross-domain bleed
3. **Meaningful branches**: Branch at level 3 (not level 5) — players commit earlier
4. **Scarce charges**: Active skills are high-impact, timing-based — not spam tools
5. **Clear cube economy**: Only Risk archetype primarily generates cubes
6. **Skill-expressive gameplay**: Tempo = technical, Scaling = patient, Risk = greedy, Control = stabilizing

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

> **Identity**: Combo depth, cascade amplification, consecutive clear bonuses, move refunds tied to combos.
> **Feel**: Technical and skill-expressive. Rewards mechanical precision.

**ALLOWED domains**:
- Combo depth / combo add
- Cascade amplification
- Consecutive clear bonuses
- Move refunds tied to combos (NOT flat move grants)

**FORBIDDEN domains**:
- Cube generation (zero cubes from Tempo)
- Flat score injection
- Grid manipulation (row clears, block destruction)

---

### 🟡 Scaling (Yellow)

> **Identity**: Score multipliers, per-level scaling, late-run ramping. The ONLY archetype allowed to modify charge cadence.
> **Feel**: Weak early, powerful late. Patience rewarded.

**ALLOWED domains**:
- Score multipliers (%, NOT flat)
- Per-level-cleared scaling
- Late-run ramping
- Charge cadence reduction (Branch B only — reduce from every 5 to every 4 → 3 levels)

**FORBIDDEN domains**:
- Cube generation (zero cubes from Scaling)
- Move refunds
- Grid manipulation

---

### 🔴 Risk / Economy (Red)

> **Identity**: Cube generation, conditional cube bursts, grid height rewards, line injection, volatility. MUST include real downside.
> **Feel**: Dangerous and greedy. High reward, high stakes.

**ALLOWED domains**:
- Cube generation (primary cube source)
- Conditional cube bursts
- Grid height rewards (high-grid = more reward)
- Line injection (adds lines = risk)
- Volatile mechanics with real downside

**FORBIDDEN domains**:
- Safe passive scaling (no "free" cube income)
- Score multipliers
- Constraint easing

---

### 🔵 Control (Blue)

> **Identity**: Row clears, targeted destruction, grid shaping, difficulty reduction, constraint easing.
> **Feel**: Stabilizes chaos. Safety net, not accelerator.

**ALLOWED domains**:
- Row clears
- Targeted block destruction
- Grid shaping
- Difficulty reduction on generated lines
- Constraint easing / acceleration

**FORBIDDEN domains**:
- Score multipliers
- Cube generation / amplification
- Combo manipulation

---

## Skill Structure

Each archetype contains exactly **3 skills**:

| Slot | Type | Naming | Charges? |
|------|------|--------|----------|
| 1 | **Active Skill** | Triggered ability | Yes (0-3) |
| 2 | **Passive Skill** | Always-on effect | No |
| 3 | **Passive Skill** | Always-on effect | No |

**Active Skill rules**:
- High impact per use
- Timing-based (when you use it matters)
- Must NOT generate passive economy
- Must NOT be spam tools (charges are scarce)
- Consumes 1 charge per use

**Passive Skill rules**:
- Always active during the run
- Scale with skill level
- No player-triggered activation

### Skill ID Layout (vNext)

| ID | Archetype | Type | Name |
|:--:|-----------|------|------|
| 1 | 🟣 Tempo | Active | `[TBD]` |
| 2 | 🟣 Tempo | Passive | `[TBD]` |
| 3 | 🟣 Tempo | Passive | `[TBD]` |
| 4 | 🟡 Scaling | Active | `[TBD]` |
| 5 | 🟡 Scaling | Passive | `[TBD]` |
| 6 | 🟡 Scaling | Passive | `[TBD]` |
| 7 | 🔴 Risk | Active | `[TBD]` |
| 8 | 🔴 Risk | Passive | `[TBD]` |
| 9 | 🔴 Risk | Passive | `[TBD]` |
| 10 | 🔵 Control | Active | `[TBD]` |
| 11 | 🔵 Control | Passive | `[TBD]` |
| 12 | 🔵 Control | Passive | `[TBD]` |

---

## Level Progression (5 Levels)

### Progression Map

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

### Core Rules

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

### Design Implications

- Active skills are **high-stakes decisions**, not spam buttons
- Players get at most 3 uses per active skill per run (unless Scaling cadence modifier applies)
- Timing of charge use is a core skill expression
- No "infinite charge" builds possible

---

## Cube Economy Rules

### Who Generates Cubes

| Archetype | Cube Generation | Notes |
|-----------|:---:|-------|
| 🟣 Tempo | ❌ None | Zero cubes. Ever. |
| 🟡 Scaling | ❌ None | Zero cubes. Ever. |
| 🔴 Risk | ✅ Primary | Main source. Must have real downside. |
| 🔵 Control | ❌ None | Zero cubes. |

### Hard Rules

1. **Tempo and Scaling generate zero cubes** — no exceptions, no "small cube bonus at capstone"
2. **Risk cube generation must be conditional** — tied to dangerous states (high grid, volatile mechanics)
3. **No skill may directly generate charges from combos or score** — charges come ONLY from the cadence system
4. **Control does not amplify cubes** — it stabilizes, not accelerates economy

### Cube Sources (Summary)

| Source | Archetype | Condition |
|--------|-----------|-----------|
| `[TBD — e.g., block destruction]` | 🔴 Risk Active | `[TBD — e.g., per block destroyed]` |
| `[TBD — e.g., high-grid bonus]` | 🔴 Risk Passive 1 | `[TBD — e.g., grid ≥ N rows]` |
| `[TBD — e.g., level complete bonus]` | 🔴 Risk Passive 2 | `[TBD — e.g., conditional on risk taken]` |
| Combo cube rewards (existing system) | Core game | 4+ lines cleared in one move |
| Level complete star rewards | Core game | 3-star / 2-star / 1-star |
| Daily quests | Core game | Quest completion |

---

## Draft System

### How Skills Enter a Run (Unchanged from v1)

1. **Before each level** (or at run start), a **draft event** triggers
2. Player sees **3 skill choices** (cards)
3. If loadout has empty slots (< 3 filled): **Select** adds the skill at level 1
4. If loadout is full (3/3 filled): **Upgrade** — selecting a skill already in loadout increases its level by 1

### Reroll Mechanic (Unchanged)

- Player can **reroll** any of the 3 offered cards
- Cost formula: `ceil(5 * 1.5^n)` where `n` = reroll count this draft
- Cost sequence: 5, 8, 12, 18, 27, 41, ...
- Costs CUBE (deducted from wallet)

### Branch Choice (Changed: Level 3 instead of Level 5)

- When a skill reaches level 2 and player upgrades to level 3, they must choose Branch A or B
- This is done via the **Skill Tree Page**
- Respec is possible but costs 50% of invested CUBE

### Contract Calls (vNext)

| Action | System Call | Parameters |
|--------|-----------|------------|
| Reroll a draft card | `draft_system.reroll(game_id, reroll_slot)` | `reroll_slot`: 0, 1, or 2 |
| Select a draft card | `draft_system.select(game_id, selected_slot)` | `selected_slot`: 0, 1, or 2 |
| Upgrade a skill | `skill_tree_system.upgrade_skill(skill_id)` | `skill_id`: 1-12 |
| Choose branch | `skill_tree_system.choose_branch(skill_id, branch_id)` | `branch_id`: 0=A, 1=B |
| Respec branch | `skill_tree_system.respec_branch(skill_id)` | Costs 50% of invested CUBE |

---

## Domain Separation Rules

This is the **enforcement matrix**. Every skill effect MUST be checked against this table before implementation.

### Effect → Archetype Permission Matrix

| Effect | 🟣 Tempo | 🟡 Scaling | 🔴 Risk | 🔵 Control |
|--------|:--------:|:---------:|:------:|:--------:|
| Combo add / depth | ✅ | ❌ | ❌ | ❌ |
| Cascade amplification | ✅ | ❌ | ❌ | ❌ |
| Consecutive clear bonus | ✅ | ❌ | ❌ | ❌ |
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

### Cross-Domain Violation Examples (DON'T DO THIS)

| Violation | Why It's Wrong |
|-----------|----------------|
| Tempo skill grants +1 cube at capstone | Tempo = zero cubes |
| Scaling passive gives flat +10 score | Scaling = multipliers, not flat injection |
| Risk passive gives +5% score multiplier | Risk = cubes/volatility, not score scaling |
| Control active boosts combo count | Control = grid shaping, not combo manipulation |
| Any skill generates charges on combo | Charges come ONLY from cadence system |

---

## Skill Templates

> **All skill names and numeric values are TBD.** These templates define the STRUCTURE and domain constraints for each skill slot. Fill in names and numbers during implementation.

---

### Tempo Skills

#### 🟣 Tempo Active (ID 1) — `[Name TBD]`

**Type**: Active (charges required)
**Domain**: Combo depth / cascade amplification
**Branch A**: `[TBD — e.g., burst combo depth]`
**Branch B**: `[TBD — e.g., sustained combo with move refund]`

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD: Foundation effect]` | `[TBD]` |
| 2 | — | `[TBD: Enhanced version]` | `[TBD]` |
| 3 | A | `[TBD: Branch A specialization]` | `[TBD]` |
| 3 | B | `[TBD: Branch B specialization]` | `[TBD]` |
| 4 | A | `[TBD: Deepened Branch A]` | `[TBD]` |
| 4 | B | `[TBD: Deepened Branch B]` | `[TBD]` |
| 5 | A | `[TBD: Capstone A]` | `[TBD]` |
| 5 | B | `[TBD: Capstone B]` | `[TBD]` |

**Constraints**: No cubes. No flat score. No grid manipulation.

---

#### 🟣 Tempo Passive 1 (ID 2) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Move flow / combo-tied refunds

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No cubes. No flat score. Move refunds must be combo-tied (not unconditional).

---

#### 🟣 Tempo Passive 2 (ID 3) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Consecutive clear bonuses / cascade value

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No cubes. No flat score.

---

### Scaling Skills

#### 🟡 Scaling Active (ID 4) — `[Name TBD]`

**Type**: Active (charges required)
**Domain**: Score multiplier burst / per-level scaling activation
**Branch A**: `[TBD — e.g., flat high % score burst]`
**Branch B**: `[TBD — e.g., charge cadence reduction + scaling over time]`

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No cubes. No move refunds. No grid manipulation. Branch B is the ONLY place in the game where charge cadence can be modified.

---

#### 🟡 Scaling Passive 1 (ID 5) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Score multiplier (%)

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No cubes. Multipliers only (not flat score). Should feel weak at levels 1-2, strong at 4-5.

---

#### 🟡 Scaling Passive 2 (ID 6) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Per-level-cleared scaling / late-run ramping

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No cubes. Must scale with levels cleared (not flat). Weak early, powerful late.

---

### Risk / Economy Skills

#### 🔴 Risk Active (ID 7) — `[Name TBD]`

**Type**: Active (charges required)
**Domain**: Cube generation via grid interaction (e.g., targeted destruction, line injection)
**Branch A**: `[TBD — e.g., targeted destruction for cubes]`
**Branch B**: `[TBD — e.g., line injection with cube burst]`

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: MUST include real downside. No safe passive income. No score multipliers.

---

#### 🔴 Risk Passive 1 (ID 8) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Conditional cube generation (e.g., high-grid rewards, volatile state bonuses)

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: Cube rewards MUST be conditional (not flat per level). Must involve risk/danger state.

---

#### 🔴 Risk Passive 2 (ID 9) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Volatility mechanics / risk-reward amplification

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: Must have real downside. No safe passive cube income. No score multipliers.

---

### Control Skills

#### 🔵 Control Active (ID 10) — `[Name TBD]`

**Type**: Active (charges required)
**Domain**: Row clears / targeted destruction / grid shaping
**Branch A**: `[TBD — e.g., wide row clear (Tsunami-like)]`
**Branch B**: `[TBD — e.g., targeted destruction with constraint progress]`

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No score multipliers. No cube generation. No combo manipulation.

---

#### 🔵 Control Passive 1 (ID 11) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Constraint easing / constraint acceleration

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No score multipliers. No cubes. No combo manipulation.

---

#### 🔵 Control Passive 2 (ID 12) — `[Name TBD]`

**Type**: Passive (always active)
**Domain**: Difficulty reduction / grid shaping on generated lines

| Level | Branch | Effect | Values |
|:-----:|:------:|--------|--------|
| 1 | — | `[TBD]` | `[TBD]` |
| 2 | — | `[TBD]` | `[TBD]` |
| 3 | A | `[TBD]` | `[TBD]` |
| 3 | B | `[TBD]` | `[TBD]` |
| 4 | A | `[TBD]` | `[TBD]` |
| 4 | B | `[TBD]` | `[TBD]` |
| 5 | A | `[TBD]` | `[TBD]` |
| 5 | B | `[TBD]` | `[TBD]` |

**Constraints**: No score multipliers. No cubes. No combo manipulation.

---

## Data Packing: run_data

### vNext Loadout Slot Layout

The `run_data` field (felt252) stores the current run's skill loadout. vNext changes:
- Skill IDs: 1-12 (was 1-15) → still fits in 4 bits
- Levels: 1-5 (was 0-9) → fits in 3 bits (was 4 bits)
- Charges: 0-3 → still 2 bits

```
[TBD — exact bit layout to be defined during implementation]

Proposed layout (narrower than v1 due to fewer bits needed):
  active_slot_count: 2 bits (0-3)
  Per slot (×3):
    skill_id:  4 bits (0-12)
    level:     3 bits (0-5)
    charges:   2 bits (0-3)
  = 2 + 3×(4+3+2) = 2 + 27 = 29 bits for loadout

  Remaining bits available for:
    charge_cadence_modifier: 3 bits (cadence value 3-5)
    [other run state TBD]
```

### SkillSlot Interface (vNext)

```typescript
interface SkillSlot {
  skillId: number;  // 1-12 (1,4,7,10 = active; rest = passive), 0 = empty
  level: number;    // 1-5
  charges: number;  // 0-3 (only meaningful for active skills: IDs 1,4,7,10)
}
```

### Active vs Passive Skill Check (vNext)

```typescript
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
      → helpers/skill_effects.cairo: active_effect_for_skill(skill_id, level, branch_id)
        → Returns ActiveEffect struct
      → Apply effect (grid modification, combo add, etc.)
      → Check domain constraints (no cross-archetype bleed)
```

### Passive Skill Resolution

```
Contract: During move resolution / level start / level complete
  → helpers/skill_effects.cairo: passive_effect_for_skill(skill_id, level, branch_id)
    → Returns PassiveEffect struct
  → helpers/skill_effects.cairo: aggregate_passive_effects(run_data, branch_ids)
    → Combines PassiveEffects from all passive skills in loadout
  → Applied during move resolution, level start, and level complete
```

### Charge Replenishment

```
Contract: On level complete
  → Check levels_cleared % charge_cadence == 0
  → If yes: for each active skill in loadout, charges = min(charges + 1, 3)
  → charge_cadence = 5 (base) or modified by Scaling Branch B
```

### Reading Skill State (Client)

```
Client: useSkillTree() hook
  → Reads SkillTreeData model from Torii
  → Unpacks 12 skills × (level, branchChosen, branchId)
  → SkillTreePage.tsx renders the tree per archetype

Client: useDraft() hook
  → Reads DraftState model from Torii
  → Shows 3 skill choices
  → DraftPage.tsx renders draft cards

Client: useGame() → game.runData
  → Reads run_data from Game model
  → Unpacks activeSlotCount, slots 1-3 (skillId, level, charges)
  → Used by GameActionBar for active skill buttons
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
| Active skill IDs | 1-5 | 1, 4, 7, 10 (first per archetype) |
| Passive skill IDs | 6-15 | 2-3, 5-6, 8-9, 11-12 |
| Levels | 0-9 (display 1-10) | 1-5 |
| Branch point | Level 5 (internal 4) | Level 3 |
| Naming | Bonus Skills / World Skills | Active Skills / Passive Skills |

### Removed v1 Skills (No Direct Mapping)

The following v1 skills have no direct equivalent in vNext. Their effects may be partially absorbed into vNext skills:

- **Economy archetype** (merged into Risk): Fortune (ID 7), Catalyst (ID 9)
- **Excess passives** (3 removed): Will be determined during skill naming

### Contract Changes Required

| File | Changes |
|------|---------|
| `contracts/src/types/bonus.cairo` | Replace Bonus enum (5 values → 4 active skill IDs) |
| `contracts/src/helpers/skill_effects.cairo` | Complete rewrite — 12 skills × 5 levels × 2 branches |
| `contracts/src/helpers/packing.cairo` | Update run_data bit layout |
| `contracts/src/systems/game.cairo` | `apply_bonus()` → `apply_active_skill()`, add charge management |
| `contracts/src/constants.cairo` | Update all skill constants |

### Client Changes Required

| File | Changes |
|------|---------|
| `client-budokan/src/dojo/game/types/bonus.ts` | Replace with activeSkill type |
| `client-budokan/src/dojo/game/types/skillData.ts` | 12 skills, 4 archetypes |
| `client-budokan/src/dojo/game/types/skillEffects.ts` | All new effect descriptions |
| `client-budokan/src/dojo/game/helpers/runDataPacking.ts` | New bit layout |
| `client-budokan/src/dojo/game/constants.ts` | All new constants |
| `client-budokan/src/dojo/systems.ts` | `applyBonus` → `applyActiveSkill` |
| `client-budokan/src/ui/pages/SkillTreePage.tsx` | 4 archetypes, 5 levels, branch at 3 |
| `client-budokan/src/ui/pages/DraftPage.tsx` | Updated skill pool |
| `client-budokan/src/ui/components/BonusButton.tsx` | → `ActiveSkillButton.tsx` |

---

## Key Source Files (Reference)

### Contract

| File | Purpose |
|------|---------|
| `contracts/src/types/bonus.cairo` | Active skill enum (to be refactored) |
| `contracts/src/elements/bonuses/harvest.cairo` | Grid destruction logic (reusable) |
| `contracts/src/elements/bonuses/wave.cairo` | Row clear logic (reusable) |
| `contracts/src/helpers/bonus_logic.cairo` | Active skill dispatch (to be refactored) |
| `contracts/src/helpers/skill_effects.cairo` | ALL skill effect values — **complete rewrite needed** |
| `contracts/src/systems/game.cairo` | Game system (refactor `apply_bonus`) |
| `contracts/src/helpers/packing.cairo` | run_data bit layout (update) |

### Client

| File | Purpose |
|------|---------|
| `client-budokan/src/dojo/game/types/bonus.ts` | Active skill type (refactor) |
| `client-budokan/src/dojo/game/types/skillData.ts` | Skill/archetype definitions (rewrite) |
| `client-budokan/src/dojo/game/types/skillEffects.ts` | Effect descriptions (rewrite) |
| `client-budokan/src/dojo/game/helpers/runDataPacking.ts` | run_data packing (update) |
| `client-budokan/src/dojo/game/constants.ts` | Constants (update) |
| `client-budokan/src/dojo/systems.ts` | System calls (rename + update) |
| `client-budokan/src/ui/pages/DraftPage.tsx` | Draft UI (update) |
| `client-budokan/src/ui/pages/SkillTreePage.tsx` | Skill tree UI (update) |
| `client-budokan/src/ui/components/BonusButton.tsx` | → `ActiveSkillButton.tsx` |
