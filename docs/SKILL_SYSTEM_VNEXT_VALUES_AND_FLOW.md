# zKube Skill System vNext - Values and Integration Flow

> Status: Working design reference (based on your latest values).
> Purpose: Single source for archetype/level values plus current contract/client interaction flow.

---

## 1) System Snapshot (Target)

- Archetypes: 4 (`Tempo`, `Scaling`, `Risk`, `Control`)
- Skills: 12 (`4 active + 8 passive`)
- Levels: 5 (displayed `1..5`)
- Branch point: level 3 (`A` or `B`)
- Loadout slots: 3
- Active charge cap: 3

## 2) Skill Index (Target Values)

| ID | Archetype | Type | Name |
|---:|---|---|---|
| 1 | Tempo | Active | Combo Surge |
| 2 | Tempo | Passive | Rhythm |
| 3 | Tempo | Passive | Cascade Mastery |
| 4 | Scaling | Active | Overdrive |
| 5 | Scaling | Passive | Momentum Scaling |
| 6 | Scaling | Passive | Endgame Focus |
| 7 | Risk | Active | Harvest |
| 8 | Risk | Passive | High Stakes |
| 9 | Risk | Passive | Gambit (aka Volatility in older naming) |
| 10 | Control | Active | Tsunami |
| 11 | Control | Passive | Structural Integrity (aka Constraint Ease) |
| 12 | Control | Passive | Grid Harmony (aka Grid Discipline) |

---

## 3) Tempo (Purple)

### 1. Active - Combo Surge

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | Next cascade: `+1` combo depth |
| 2 | - | Next cascade: `+2` combo depth |
| 3 | A - Burst | `+3` combo depth |
| 3 | B - Flow | `+1` combo depth for the full level (once per level, non-stackable) |
| 4 | A - Burst | `+5` combo depth |
| 4 | B - Flow | `+2` combo depth for the full level (once per level, non-stackable) |
| 5 | A - Burst | `+7` combo depth |
| 5 | B - Flow | `+4` combo depth for the full level (once per level, non-stackable) |

### 2. Passive - Rhythm

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | Every `12` combo_streak gained -> next move `+1` combo depth (no cap) |
| 2 | - | Every `10` combo_streak gained -> next move `+1` combo depth (no cap) |
| 3 | A - Acceleration | Every `8` streak -> next move `+1` combo depth (no cap) |
| 3 | B - Stability | Every `10` streak -> next move `+2` combo depth (no cap) |
| 4 | A - Acceleration | Every `6` streak -> next move `+1` combo depth (no cap) |
| 4 | B - Stability | Every `10` streak -> next move `+3` combo depth (no cap) |
| 5 | A - Acceleration | Every `4` streak -> next move `+1` combo depth (no cap) |
| 5 | B - Stability | Every `10` streak -> next move `+4` combo depth (no cap) |

### 3. Passive - Cascade Mastery

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | If cascade depth `>= 5` -> `+1` combo depth |
| 2 | - | If cascade depth `>= 4` -> `+1` combo depth |
| 3 | A - Amplify | If cascade depth `>= 4` -> `+2` combo depth |
| 3 | B - Extend | If cascade depth `>= 3` -> `+1` combo depth |
| 4 | A - Amplify | If cascade depth `>= 4` -> `+3` combo depth |
| 4 | B - Extend | If cascade depth `>= 2` -> `+1` combo depth |
| 5 | A - Amplify | If cascade depth `>= 4` -> `+4` combo depth |
| 5 | B - Extend | If cascade depth `>= 2` -> `+2` combo depth |

---

## 4) Scaling (Yellow)

### 4. Active - Overdrive

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | Next move score `x1.5` |
| 2 | - | Next move score `x2` |
| 3 | A - Amplify | Next move score `x2.5` |
| 3 | B - Overflow | Charge cadence becomes every `4` levels (from 5) |
| 4 | A - Amplify | Next move score `x3` |
| 4 | B - Overflow | Charge cadence becomes every `3` levels |
| 5 | A - Amplify | Next move score `x4` |
| 5 | B - Overflow | Charge cadence becomes every `2` levels |

### 5. Passive - Momentum Scaling

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | `+1` score at level start (once) |
| 2 | - | `+2` score at level start (once) |
| 3 | A - Late Bloom | `+3` score per zone cleared at level start (once) |
| 3 | B - Stable Growth | `+3` score at level start (once) |
| 4 | A - Late Bloom | `+5` score per zone cleared at level start (once) |
| 4 | B - Stable Growth | `+5` score at level start (once) |
| 5 | A - Late Bloom | `+10` score per zone cleared at level start (once) |
| 5 | B - Stable Growth | `+10` score at level start (once) |

### 6. Passive - Endgame Focus

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | `+1` score at level start (once) on levels `>= 10` |
| 2 | - | `+2` score at level start (once) on levels `>= 20` |
| 3 | A - Deep End | `+0.2` score per level cleared at level start (once) |
| 3 | B - Smooth Ramp | `+5` score at level start (once) on levels `>= 25` |
| 4 | A - Deep End | `+0.3` score per level cleared at level start (once) |
| 4 | B - Smooth Ramp | `+10` score at level start (once) on levels `>= 30` |
| 5 | A - Deep End | `+0.5` score per level cleared at level start (once) |
| 5 | B - Smooth Ramp | `+20` score at level start (once) on levels `>= 40` |

---

## 5) Risk / Economy (Red)

### 7. Active - Harvest

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | Destroy `2` random blocks -> `+1 cube per block size` |
| 2 | - | Destroy `3` random blocks -> `+1 cube per block size` |
| 3 | A - Extraction | Destroy `5` random blocks -> `+1 cube per block size` |
| 3 | B - Injection | Add `1` line -> `+10` cubes |
| 4 | A - Extraction | Destroy `7` random blocks -> `+1 cube per block size` |
| 4 | B - Injection | Add `2` lines -> `+20` cubes |
| 5 | A - Extraction | Destroy `10` random blocks -> `+1 cube per block size` |
| 5 | B - Injection | Add `3` lines -> `+40` cubes |

### 8. Passive - High Stakes

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | If grid `>= 9` rows -> `+1 cube per clear` |
| 2 | - | If grid `>= 8` rows -> `+1 cube per clear` |
| 3 | A - Edge | If grid `>= 8` rows -> `+3 cubes per clear` |
| 3 | B - Threshold | If grid `>= 7` rows -> `+1 cube per clear` |
| 4 | A - Edge | If grid `>= 8` rows -> `+5 cubes per clear` |
| 4 | B - Threshold | If grid `>= 6` rows -> `+1 cube per clear` |
| 5 | A - Edge | If grid `>= 8` rows -> `+10 cubes per clear` |
| 5 | B - Threshold | If grid `>= 5` rows -> `+1 cube per clear` |

### 9. Passive - Gambit (Volatility naming legacy)

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | If grid reaches `>= 9` this level and you survive -> `+3` cubes (once per level) |
| 2 | - | If grid reaches `>= 9` this level and you survive -> `+5` cubes (once per level) |
| 3 | A - Survivor | If grid reaches `>= 9` and you survive -> `+10` cubes (once per level) |
| 3 | B - Momentum | If grid reaches `>= 8` and you survive -> `+5` cubes (once per level) |
| 4 | A - Survivor | If grid reaches `>= 9` and you survive -> `+15` cubes (once per level) |
| 4 | B - Momentum | If grid reaches `>= 7` and you survive -> `+5` cubes (once per level) |
| 5 | A - Survivor | If grid reaches `>= 9` and you survive -> `+30` cubes (once per level) |
| 5 | B - Momentum | If grid reaches `>= 6` and you survive -> `+5` cubes (once per level) |

---

## 6) Control (Blue)

### 10. Active - Tsunami

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | Clear `1` targeted block |
| 2 | - | Clear `2` targeted blocks |
| 3 | A - Wide | Clear `3` targeted blocks |
| 3 | B - Target | Destroy `1` targeted row |
| 4 | A - Wide | Clear `5` targeted blocks |
| 4 | B - Target | Destroy `2` targeted rows |
| 5 | A - Wide | Clear all blocks of targeted size |
| 5 | B - Target | Destroy `3` targeted rows |

### 11. Passive - Structural Integrity (Constraint Ease naming legacy)

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | If grid `>= 9`: first clear this move destroys `+1` extra row |
| 2 | - | If grid `>= 8`: first clear this move destroys `+1` extra row |
| 3 | A - Aggressive | If grid `>= 8`: first clear this move destroys `+2` extra rows |
| 3 | B - Safe | If grid `>= 7`: first clear this move destroys `+1` extra row |
| 4 | A - Aggressive | If grid `>= 8`: first clear this move destroys `+3` extra rows |
| 4 | B - Safe | If grid `>= 6`: first clear this move destroys `+1` extra row |
| 5 | A - Aggressive | If grid `>= 8`: first clear this move destroys `+4` extra rows |
| 5 | B - Safe | If grid `>= 5`: first clear this move destroys `+1` extra row |

### 12. Passive - Grid Harmony (Grid Discipline naming legacy)

| Level | Branch | Effect |
|---:|---|---|
| 1 | - | If grid `>= 9`: next clear removes `+1` extra row |
| 2 | - | If grid `>= 8`: next clear removes `+1` extra row |
| 3 | A - Stabilize | If grid `>= 8`: every clear removes `+1` extra row |
| 3 | B - Precision | If grid `>= 8`: next clear removes `+2` extra rows |
| 4 | A - Stabilize | If grid `>= 7`: every clear removes `+1` extra row |
| 4 | B - Precision | If grid `>= 8`: next clear removes `+3` extra rows |
| 5 | A - Stabilize | If grid `>= 6`: every clear removes `+1` extra row |
| 5 | B - Precision | If grid `>= 8`: next clear removes `+4` extra rows |

---

## 7) Contract Interaction (Current Code Paths)

### Active skill execution path

1. Client submits `apply_bonus(game_id, bonus, row_index, block_index)`
2. Contract `bonus_system.apply_bonus` delegates to `grid_system.apply_bonus`
3. `grid_system.apply_bonus`:
   - Resolves `skill_id` from `bonus`
   - Reads slot level/branch from `run_data`
   - Resolves active effect via `active_effect_for_skill(skill_id, level, branch)`
   - Applies skill-specific logic (ComboSurge, Momentum, Harvest, Tsunami)
   - Consumes one charge via `run_data.use_active_charge(skill_id)`
   - Re-assesses gravity/line clears and updates score/combo

### Passive skill application path

1. Every move starts in `grid_system.execute_move`
2. Passive aggregate computed via `get_passive_effects(@run_data)`
3. Move resolution then applies passive hooks:
   - Combo Surge Flow flag (`combo_surge_flow_active`)
   - Rhythm
   - Cascade Mastery
   - High Stakes
   - Gambit trigger flag (`gambit_triggered_this_level`)
   - Structural Integrity
   - Grid Harmony

### Core contract files

- Skill effect tables: `contracts/src/helpers/skill_effects.cairo`
- Active skill enum/type-code mapping: `contracts/src/types/bonus.cairo`
- Move + active execution: `contracts/src/systems/grid.cairo`
- Run-state bit packing + slots/charges/branches: `contracts/src/helpers/packing.cairo`
- Bonus system entrypoint: `contracts/src/systems/bonus.cairo`

---

## 8) Client Interaction (Current Code Paths)

### Selection and confirmation UX

- Bonus type enum + contract mapping: `client-budokan/src/dojo/game/types/bonus.ts`
- Confirm dialog for non-target actives (ComboSurge, Momentum):
  - `client-budokan/src/ui/pages/PlayScreen.tsx`
- Grid-targeted input for Harvest/Tsunami:
  - `client-budokan/src/ui/components/Grid.tsx`

### Transaction call chain

1. UI invokes `applyBonus(...)` from Dojo context
2. `client-budokan/src/dojo/systems.ts` wraps tx with loading/error handling
3. `client-budokan/src/dojo/contractSystems.ts` executes
   `entrypoint: "apply_bonus"` with calldata `[game_id, bonus, row_index, block_index]`
4. Torii sync updates game state for HUD/board

### Data sync and display

- Client `BonusType` values map to contract skill IDs `1..4`
- Level/branch/charges are runtime data in packed `run_data`
- Game HUD and board update reactively from synced models

---

## 9) Notes for Implementation Alignment

- This document captures your target values.
- There are currently naming drifts in historical docs (`Volatility` vs `Gambit`, `Constraint Ease` vs `Structural Integrity`, `Grid Discipline` vs `Grid Harmony`). This file normalizes them with aliases.
- If you want, next step is a strict implementation checklist that maps each row above to exact functions/fields to edit.
