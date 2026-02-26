# zKube Skill Tree & Bonus System — Complete Reference

> Generated from contract source of truth: `contracts/src/helpers/skill_effects.cairo`, `contracts/src/types/bonus.cairo`, and client code in `client-budokan/src/dojo/game/types/`.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture: Archetypes → Skills](#architecture-archetypes--skills)
3. [Skill Progression Mechanics](#skill-progression-mechanics)
4. [Bonus Skills (Active, IDs 1-5)](#bonus-skills-active-ids-1-5)
   - [Combo (ID 1) — Tempo Archetype](#combo-id-1--tempo-archetype)
   - [Score (ID 2) — Scaling Archetype](#score-id-2--scaling-archetype)
   - [Harvest (ID 3) — Economy Archetype](#harvest-id-3--economy-archetype)
   - [Wave (ID 4) — Control Archetype](#wave-id-4--control-archetype)
   - [Supply (ID 5) — Risk Archetype](#supply-id-5--risk-archetype)
5. [World Skills (Passive, IDs 6-15)](#world-skills-passive-ids-6-15)
   - [Tempo (ID 6) — Tempo Archetype](#tempo-id-6--tempo-archetype)
   - [Fortune (ID 7) — Economy Archetype](#fortune-id-7--economy-archetype)
   - [Surge (ID 8) — Scaling Archetype](#surge-id-8--scaling-archetype)
   - [Catalyst (ID 9) — Economy Archetype](#catalyst-id-9--economy-archetype)
   - [Resilience (ID 10) — Risk Archetype](#resilience-id-10--risk-archetype)
   - [Focus (ID 11) — Control Archetype](#focus-id-11--control-archetype)
   - [Expansion (ID 12) — Control Archetype](#expansion-id-12--control-archetype)
   - [Momentum (ID 13) — Tempo Archetype](#momentum-id-13--tempo-archetype)
   - [Adrenaline (ID 14) — Risk Archetype](#adrenaline-id-14--risk-archetype)
   - [Legacy (ID 15) — Scaling Archetype](#legacy-id-15--scaling-archetype)
6. [Draft System](#draft-system)
7. [Contract ↔ Client Interaction Flow](#contract--client-interaction-flow)
8. [Data Packing: run_data](#data-packing-run_data)

---

## System Overview

The skill system is a **roguelike skill tree** with 15 skills grouped into 5 archetypes. Each run, a player fills 3 **loadout slots** via a **draft** system. Skills have levels 0-10. At level 5, each skill **branches** into two specialization paths (A or B).

### Key Constants

| Constant | Value | Source |
|----------|-------|--------|
| `MAX_LOADOUT_SLOTS` | 3 | Max skills per run |
| `TOTAL_SKILLS` | 15 | 5 bonus + 10 world |
| `MAX_SKILL_LEVEL` | 9 (0-indexed → levels 0-9, displayed as 1-10) | `client-budokan/src/dojo/game/constants.ts` |
| `BRANCH_POINT_LEVEL` | 4 (0-indexed, displayed as level 5) | Level where branch choice is required |
| `BRANCH_SPLIT_LEVEL` | 5 (0-indexed, displayed as level 6) | First level requiring a branch |

### Skill Tree Upgrade Costs (CUBE)

| Display Level | Internal Level | Cost (CUBE) |
|:---:|:---:|---:|
| 1 | 0 | 50 |
| 2 | 1 | 100 |
| 3 | 2 | 250 |
| 4 | 3 | 500 |
| 5 | 4 | 1,000 |
| 6 | 5 | 2,000 |
| 7 | 6 | 4,000 |
| 8 | 7 | 8,000 |
| 9 | 8 | 10,000 |

**Total cost to max one skill: 25,900 CUBE**

Source: `client-budokan/src/dojo/game/helpers/runDataPacking.ts` line 260

### Skill Tiers (Visual)

| Tier | Levels | Visual |
|------|--------|--------|
| T1 | 0-3 (display 1-4) | Muted icon |
| T2 | 4-6 (display 5-7) | Vibrant icon |
| T3 | 7-9 (display 8-10) | Golden icon |

---

## Architecture: Archetypes → Skills

Each archetype contains exactly **3 skills**: 1 bonus (active) + 2 world (passive).

### Tempo Archetype (Purple `#9B59B6`)

> Move flow and chain pacing

| Skill | ID | Category | Description |
|-------|:--:|----------|-------------|
| **Combo** | 1 | Bonus (Active) | Turn amplifier for combo depth |
| **Tempo** | 6 | World (Passive) | Move flow and refunds |
| **Momentum** | 13 | World (Passive) | Consecutive clear value |

### Scaling Archetype (Yellow `#F1C40F`)

> Late-run growth

| Skill | ID | Category | Description |
|-------|:--:|----------|-------------|
| **Score** | 2 | Bonus (Active) | Direct score injection |
| **Surge** | 8 | World (Passive) | Score multiplier (hard capped) |
| **Legacy** | 15 | World (Passive) | Linear long-run scaling |

### Economy Archetype (Teal `#1ABC9C`)

> Cube amplification

| Skill | ID | Category | Description |
|-------|:--:|----------|-------------|
| **Harvest** | 3 | Bonus (Active) | Targeted block destruction and cube gain |
| **Fortune** | 7 | World (Passive) | Level and clear cube amplification |
| **Catalyst** | 9 | World (Passive) | Combo threshold and reward tuning |

### Control Archetype (Blue `#3498DB`)

> Board and constraint control

| Skill | ID | Category | Description |
|-------|:--:|----------|-------------|
| **Wave** | 4 | Bonus (Active) | Row clear reset tool |
| **Focus** | 11 | World (Passive) | Constraint acceleration |
| **Expansion** | 12 | World (Passive) | Easier generated lines |

### Risk Archetype (Red `#E74C3C`)

> High-pressure burst

| Skill | ID | Category | Description |
|-------|:--:|----------|-------------|
| **Supply** | 5 | Bonus (Active) | Line injection and board shaping |
| **Adrenaline** | 14 | World (Passive) | High-grid risk reward |
| **Resilience** | 10 | World (Passive) | Free-move safety budget |

---

## Skill Progression Mechanics

### Levels 0-4 (Core Path, No Branch)

- Linear progression, no choice required
- Each level increases the skill's base effect

### Level 4 → 5 (Branch Point)

- Player MUST choose Branch A or Branch B
- This is a **permanent choice** (respec costs 50% of invested CUBE)
- Branch determines all effects from level 5-10

### Levels 5-10 (Branched Path)

- Two parallel paths (A and B), only one active
- Increasingly powerful effects with specialization

### Branch IDs

| Convention | Branch A | Branch B |
|-----------|:--------:|:--------:|
| Contract (`skill_effects.cairo`) | `branch_id = 1` | `branch_id = 2` |
| SkillTreeData (storage) | `branch_id = 0` | `branch_id = 1` |
| Client display | Varies by skill | Varies by skill |

Conversion: `skill_effects branch_id = SkillTreeData branch_id + 1`

---

## Bonus Skills (Active, IDs 1-5)

Bonus skills are **active abilities** that the player triggers during gameplay by spending a **charge**. They modify the grid or game state directly.

### Contract Interaction

- **Apply**: `game_system.apply_bonus(game_id, bonus, row_index, line_index)`
- Contract value mapping: `0=None, 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply`
- Grid-modifying bonuses (Harvest, Wave) alter `blocks` directly
- Non-grid bonuses (Combo, Score, Supply) modify `run_data` fields

### Client Interaction

- **Apply**: `systems.ts → applyBonus({ account, game_id, bonus, row_index, line_index })`
- `BonusButton.tsx` renders the actionable bonus buttons during gameplay
- `GameActionBar.tsx` / `GameHud.tsx` host the bonus buttons

---

### Combo (ID 1) — Tempo Archetype

**Type**: Non-grid (modifies `run_data.combo_counter`)
**Branch A**: "Burst" — higher combo + score per line
**Branch B**: "Sustain" — chance to keep charge + free moves

| Level | Branch | combo_add | bonus_score_per_line | chance_no_consume | free_move_on_proc | cube_per_use | charge_all_bonus | combo_persistent | Description |
|:-----:|:------:|:---------:|:-------------------:|:-----------------:|:-----------------:|:------------:|:----------------:|:----------------:|-------------|
| 0 | — | 1 | — | — | — | — | — | — | +1 combo on next move |
| 1 | — | 2 | — | — | — | — | — | — | +2 combo on next move |
| 2 | — | 3 | — | — | — | — | — | — | +3 combo on next move |
| 3 | — | 4 | — | — | — | — | — | — | +4 combo on next move |
| 4 | — | 5 | — | — | — | — | — | — | +5 combo on next move |
| 5 | A | 6 | 1 | — | — | — | — | — | +6 combo, +1 score per line cleared |
| 5 | B | 5 | — | 1/3 (33%) | — | — | — | — | +5 combo, 33% chance to keep charge |
| 6 | A | 7 | 2 | — | — | — | — | — | +7 combo, +2 score per line cleared |
| 6 | B | 6 | — | 1/3 (33%) | — | — | — | — | +6 combo, 33% chance to keep charge |
| 7 | A | 8 | 3 | — | — | — | — | — | +8 combo, +3 score per line cleared |
| 7 | B | 7 | — | 1/2 (50%) | — | — | — | — | +7 combo, 50% chance to keep charge |
| 8 | A | 9 | 4 | — | — | — | — | — | +9 combo, +4 score per line cleared |
| 8 | B | 8 | — | 1/2 (50%) | — | — | — | — | +8 combo, 50% chance to keep charge |
| 9 | A | 10 | 5 | — | — | 1 | — | — | +10 combo, +5 score per line, +1 cube per use |
| 9 | B | 9 | — | 2/3 (67%) | 1 | — | — | — | +9 combo, 67% chance to keep charge, +1 free move on proc |
| 10 | A | 12 | 6 | — | — | — | **true** | — | +12 combo, +6 score per line, charges all bonuses |
| 10 | B | 10 | — | 1/1 (100%) | 2 | — | — | — | +10 combo, 100% keep charge, +2 free moves on proc |

---

### Score (ID 2) — Scaling Archetype

**Type**: Non-grid (modifies `run_data.level_score`)
**Branch A**: "Chain" — combo generation from score use
**Branch B**: "Finisher" — doubles when low on moves

| Level | Branch | score_add | combo_add_from_score | score_doubles_under_moves | score_triples | cube_per_use | score_div10_as_cubes | Description |
|:-----:|:------:|:---------:|:-------------------:|:-------------------------:|:-------------:|:------------:|:-------------------:|-------------|
| 0 | — | 5 | — | — | — | — | — | +5 instant score |
| 1 | — | 8 | — | — | — | — | — | +8 instant score |
| 2 | — | 12 | — | — | — | — | — | +12 instant score |
| 3 | — | 18 | — | — | — | — | — | +18 instant score |
| 4 | — | 25 | — | — | — | — | — | +25 instant score |
| 5 | A | 30 | 1 | — | — | — | — | +30 score, +1 combo added |
| 5 | B | 30 | — | 5 | — | — | — | +30 score, doubles if ≤5 moves left |
| 6 | A | 35 | 1 | — | — | — | — | +35 score, +1 combo added |
| 6 | B | 35 | — | 5 | — | — | — | +35 score, doubles if ≤5 moves left |
| 7 | A | 40 | 2 | — | — | — | — | +40 score, +2 combo added |
| 7 | B | 42 | — | 7 | — | — | — | +42 score, doubles if ≤7 moves left |
| 8 | A | 50 | 2 | — | — | — | — | +50 score, +2 combo added |
| 8 | B | 50 | — | 7 | — | — | — | +50 score, doubles if ≤7 moves left |
| 9 | A | 60 | 3 | — | — | 1 | — | +60 score, +3 combo added, +1 cube per use |
| 9 | B | 60 | — | 10 | — | 1 | — | +60 score, doubles if ≤10 moves left, +1 cube per use |
| 10 | A | 80 | 4 | — | — | — | **true** | +80 score, +4 combo added, score/10 = cubes |
| 10 | B | 80 | — | 10 | **true** | 2 | — | +80 score, doubles if ≤10 moves, triples, +2 cubes/use |

---

### Harvest (ID 3) — Economy Archetype

**Type**: Grid-modifying (clears all blocks of chosen size via `elements/bonuses/harvest.cairo`)
**Branch A**: "Control" — destroys adjacent sizes + triggers gravity
**Branch B**: "Economy" — higher CUBE yield, targets small blocks only

| Level | Branch | cube_reward_per_block | harvest_adjacent | harvest_size_range | harvest_only_small | harvest_score_per_block | harvest_triggers_gravity | harvest_free_moves | Description |
|:-----:|:------:|:--------------------:|:----------------:|:------------------:|:------------------:|:----------------------:|:------------------------:|:------------------:|-------------|
| 0 | — | 1 | — | — | — | — | — | — | Destroy blocks of chosen size, +1 cube/block |
| 1 | — | 1 | 2 | — | — | — | — | — | +1 cube/block, also destroys ±2 adjacent sizes |
| 2 | — | 2 | — | — | — | — | — | — | +2 cubes per block destroyed |
| 3 | — | 2 | 3 | — | — | — | — | — | +2 cubes/block, also destroys ±3 adjacent sizes |
| 4 | — | 3 | — | — | — | — | — | — | +3 cubes per block destroyed |
| 5 | A | 3 | — | 1 | — | — | — | — | +3 cubes/block, destroys ±1 adjacent sizes |
| 5 | B | 4 | — | — | **true** | — | — | — | +4 cubes/block, only targets small blocks |
| 6 | A | 4 | — | 1 | — | — | — | — | +4 cubes/block, destroys ±1 adjacent sizes |
| 6 | B | 5 | — | — | **true** | — | — | — | +5 cubes/block, only targets small blocks |
| 7 | A | 5 | — | 1 | — | — | — | — | +5 cubes/block, destroys ±1 adjacent sizes |
| 7 | B | 6 | — | — | **true** | 1 | — | — | +6 cubes/block, only small, +1 score/block |
| 8 | A | 6 | — | 1 | — | 1 | — | — | +6 cubes/block, ±1 adjacent, +1 score/block |
| 8 | B | 8 | — | — | **true** | 2 | — | — | +8 cubes/block, only small, +2 score/block |
| 9 | A | 8 | — | 1 | — | 2 | **true** | — | +8 cubes/block, ±1 adjacent, +2 score/block, triggers gravity |
| 9 | B | 10 | — | — | **true** | 3 | — | 1 | +10 cubes/block, only small, +3 score/block, +1 free move |
| 10 | A | 10 | — | **2** | — | 3 | **true** | — | +10 cubes/block, ±2 adjacent, +3 score/block, triggers gravity |
| 10 | B | 15 | — | — | **true** | 5 | — | 2 | +15 cubes/block, only small, +5 score/block, +2 free moves |

---

### Wave (ID 4) — Control Archetype

**Type**: Grid-modifying (clears horizontal rows via `elements/bonuses/wave.cairo`)
**Branch A**: "Tsunami" — more rows + score per block
**Branch B**: "Ripple" — fewer rows but free moves + combo

| Level | Branch | rows_to_clear | wave_score_per_block | wave_free_moves | wave_combo_add | wave_cube_per_row | wave_chance_no_consume | wave_auto_add_line | Description |
|:-----:|:------:|:------------:|:-------------------:|:---------------:|:--------------:|:-----------------:|:---------------------:|:------------------:|-------------|
| 0 | — | 1 | — | — | — | — | — | — | Clear 1 row |
| 1 | — | 1 | 1 | — | — | — | — | — | Clear 1 row, +1 score per block |
| 2 | — | 2 | — | — | — | — | — | — | Clear 2 rows |
| 3 | — | 2 | 2 | — | — | — | — | — | Clear 2 rows, +2 score per block |
| 4 | — | 3 | — | — | — | — | — | — | Clear 3 rows |
| 5 | A | 3 | 3 | — | — | — | — | — | Clear 3 rows, +3 score per block |
| 5 | B | 2 | — | 1 | — | — | — | — | Clear 2 rows, +1 free move |
| 6 | A | 4 | 3 | — | — | — | — | — | Clear 4 rows, +3 score per block |
| 6 | B | 2 | — | 2 | — | — | — | — | Clear 2 rows, +2 free moves |
| 7 | A | 4 | 4 | — | — | — | — | — | Clear 4 rows, +4 score per block |
| 7 | B | 3 | — | 2 | — | — | — | — | Clear 3 rows, +2 free moves |
| 8 | A | 5 | 5 | — | — | — | — | — | Clear 5 rows, +5 score per block |
| 8 | B | 3 | — | 3 | — | — | — | — | Clear 3 rows, +3 free moves |
| 9 | A | 5 | 6 | — | — | 1 | — | — | Clear 5 rows, +6 score/block, +1 cube/row |
| 9 | B | 4 | — | 3 | 1 | — | — | — | Clear 4 rows, +3 free moves, +1 combo |
| 10 | A | 6 | 8 | — | — | 2 | — | **true** | Clear 6 rows, +8 score/block, +2 cubes/row, auto-adds line |
| 10 | B | 5 | — | 4 | 2 | — | **true** | — | Clear 5 rows, +4 free moves, +2 combo, 100% keep charge |

---

### Supply (ID 5) — Risk Archetype

**Type**: Non-grid in `bonus_logic.cairo` (lines added via Controller in grid system)
**Branch A**: "Builder" — easier lines + free moves
**Branch B**: "Pressure" — score per line + cube reward

| Level | Branch | lines_to_add | supply_difficulty_reduction | supply_very_easy | supply_score_per_line | supply_cube_reward | supply_free_moves | Description |
|:-----:|:------:|:-----------:|:--------------------------:|:----------------:|:--------------------:|:-----------------:|:----------------:|-------------|
| 0 | — | 1 | — | — | — | — | — | Add 1 line (no move cost) |
| 1 | — | 1 | 1 | — | — | — | — | Add 1 line, easier difficulty |
| 2 | — | 2 | — | — | — | — | — | Add 2 lines |
| 3 | — | 2 | 1 | — | — | — | — | Add 2 lines, easier difficulty |
| 4 | — | 3 | — | — | — | — | — | Add 3 lines |
| 5 | A | 3 | 2 | — | — | — | — | Add 3 lines, -2 difficulty levels |
| 5 | B | 3 | — | — | 2 | — | — | Add 3 lines, +2 score per line |
| 6 | A | 4 | 2 | — | — | — | — | Add 4 lines, -2 difficulty levels |
| 6 | B | 3 | — | — | 3 | — | — | Add 3 lines, +3 score per line |
| 7 | A | 4 | 3 | — | — | — | — | Add 4 lines, -3 difficulty levels |
| 7 | B | 4 | — | — | 4 | — | — | Add 4 lines, +4 score per line |
| 8 | A | 5 | 3 | — | — | — | — | Add 5 lines, -3 difficulty levels |
| 8 | B | 4 | — | — | 5 | 1 | — | Add 4 lines, +5 score/line, +1 cube |
| 9 | A | 5 | — | **true** | — | — | 1 | Add 5 lines, very easy lines, +1 free move |
| 9 | B | 5 | — | — | 6 | 2 | — | Add 5 lines, +6 score/line, +2 cubes |
| 10 | A | 6 | — | **true** | — | — | 2 | Add 6 lines, very easy lines, +2 free moves |
| 10 | B | 6 | — | — | 8 | 3 | — | Add 6 lines, +8 score/line, +3 cubes |

---

## World Skills (Passive, IDs 6-15)

World skills provide **passive effects** that apply automatically during gameplay. They are not triggered by the player — they modify the game rules for the entire run.

### Tempo (ID 6) — Tempo Archetype

**Description**: Move flow and refunds
**Branch A**: "Allegro" — flat extra moves (bigger budget)
**Branch B**: "Adagio" — fewer extra moves but refund on clears + score on refund

| Level | Branch | extra_max_moves | tempo_refund_every_n_clears | tempo_refund_score | Description |
|:-----:|:------:|:---------------:|:--------------------------:|:------------------:|-------------|
| 0 | — | 1 | — | — | +1 extra move per level |
| 1 | — | 2 | — | — | +2 extra moves per level |
| 2 | — | 3 | — | — | +3 extra moves per level |
| 3 | — | 4 | — | — | +4 extra moves per level |
| 4 | — | 5 | — | — | +5 extra moves per level |
| 5 | A | 7 | — | — | +7 extra moves per level |
| 5 | B | 5 | 3 | — | +5 extra moves, refund 1 move every 3 clears |
| 6 | A | 9 | — | — | +9 extra moves per level |
| 6 | B | 5 | 2 | — | +5 extra moves, refund 1 move every 2 clears |
| 7 | A | 11 | — | — | +11 extra moves per level |
| 7 | B | 6 | 2 | — | +6 extra moves, refund 1 move every 2 clears |
| 8 | A | 14 | — | — | +14 extra moves per level |
| 8 | B | 7 | 2 | 1 | +7 extra moves, refund every 2 clears, +1 score on refund |
| 9 | A | 18 | — | — | +18 extra moves per level |
| 9 | B | 8 | 2 | 2 | +8 extra moves, refund every 2 clears, +2 score on refund |
| 10 | A | 25 | — | — | +25 extra moves per level |
| 10 | B | 10 | 1 | 3 | +10 extra moves, refund every clear, +3 score on refund |

---

### Fortune (ID 7) — Economy Archetype

**Description**: Level and clear cube amplification
**Note**: All levels get base `fortune_star_multiplier_3 = 1` and `fortune_star_multiplier_2 = 1`
**Branch A**: "Midas Touch" — flat cubes + cubes per N lines
**Branch B**: "Lucky Strike" — flat cubes + multiplied star cubes

| Level | Branch | fortune_flat_cubes | fortune_cubes_per_n_lines | fortune_lines_divisor | fortune_star_multiplier_3 | fortune_star_multiplier_2 | Description |
|:-----:|:------:|:------------------:|:------------------------:|:--------------------:|:------------------------:|:------------------------:|-------------|
| 0 | — | 1 | — | — | 1 | 1 | +1 flat cube on level complete |
| 1 | — | 1 | — | — | 1 | 1 | +1 flat cube on level complete |
| 2 | — | 2 | — | — | 1 | 1 | +2 flat cubes on level complete |
| 3 | — | 2 | — | — | 1 | 1 | +2 flat cubes on level complete |
| 4 | — | 3 | — | — | 1 | 1 | +3 flat cubes on level complete |
| 5 | A | 4 | 1 | 5 | 1 | 1 | +4 flat cubes, +1 cube per 5 lines cleared |
| 5 | B | 3 | — | — | **2** | 1 | +3 flat cubes, x2 cubes on 3-star |
| 6 | A | 5 | 1 | 4 | 1 | 1 | +5 flat cubes, +1 cube per 4 lines cleared |
| 6 | B | 4 | — | — | **2** | 1 | +4 flat cubes, x2 cubes on 3-star |
| 7 | A | 6 | 1 | 3 | 1 | 1 | +6 flat cubes, +1 cube per 3 lines cleared |
| 7 | B | 5 | — | — | **2** | **2** | +5 flat cubes, x2 on 3-star, x2 on 2-star |
| 8 | A | 8 | 1 | 3 | 1 | 1 | +8 flat cubes, +1 cube per 3 lines cleared |
| 8 | B | 6 | — | — | **2** | **2** | +6 flat cubes, x2 on 3-star, x2 on 2-star |
| 9 | A | 10 | 2 | 3 | 1 | 1 | +10 flat cubes, +2 cubes per 3 lines cleared |
| 9 | B | 8 | — | — | **3** | **2** | +8 flat cubes, x3 on 3-star, x2 on 2-star |
| 10 | A | 15 | 3 | 2 | 1 | 1 | +15 flat cubes, +3 cubes per 2 lines cleared |
| 10 | B | 12 | — | — | **4** | **3** | +12 flat cubes, x4 on 3-star, x3 on 2-star |

---

### Surge (ID 8) — Scaling Archetype

**Description**: Score multiplier (hard capped)
**Branch A**: "Chain Lightning" — flat high % bonus
**Branch B**: "Power Surge" — lower base but scales per level cleared

| Level | Branch | surge_score_percent | surge_per_level_percent | Description |
|:-----:|:------:|:-------------------:|:-----------------------:|-------------|
| 0 | — | 5 | — | +5% score bonus |
| 1 | — | 8 | — | +8% score bonus |
| 2 | — | 12 | — | +12% score bonus |
| 3 | — | 16 | — | +16% score bonus |
| 4 | — | 20 | — | +20% score bonus |
| 5 | A | 25 | — | +25% score bonus (flat) |
| 5 | B | 20 | 2 | +20% base, +2% per level cleared |
| 6 | A | 30 | — | +30% score bonus (flat) |
| 6 | B | 20 | 3 | +20% base, +3% per level cleared |
| 7 | A | 35 | — | +35% score bonus (flat) |
| 7 | B | 20 | 4 | +20% base, +4% per level cleared |
| 8 | A | 40 | — | +40% score bonus (flat) |
| 8 | B | 22 | 5 | +22% base, +5% per level cleared |
| 9 | A | 50 | — | +50% score bonus (flat) |
| 9 | B | 25 | 6 | +25% base, +6% per level cleared |
| 10 | A | 75 | — | +75% score bonus (flat) |
| 10 | B | 30 | 8 | +30% base, +8% per level cleared |

---

### Catalyst (ID 9) — Economy Archetype

**Description**: Combo threshold and reward tuning
**Branch A**: "Amplifier" — cube rewards on combo
**Branch B**: "Resonance" — score + free moves on combo

| Level | Branch | catalyst_threshold_reduction | catalyst_bonus_cubes | catalyst_bonus_score | catalyst_free_moves_on_combo | catalyst_double_cubes_above | catalyst_triple_cubes_above | Description |
|:-----:|:------:|:---------------------------:|:-------------------:|:-------------------:|:---------------------------:|:--------------------------:|:---------------------------:|-------------|
| 0 | — | 1 | — | — | — | — | — | Combo threshold -1 line |
| 1 | — | 1 | — | — | — | — | — | Combo threshold -1 line |
| 2 | — | 1 | 1 | — | — | — | — | Threshold -1, +1 cube on combo trigger |
| 3 | — | 1 | 1 | — | — | — | — | Threshold -1, +1 cube on combo trigger |
| 4 | — | 2 | — | — | — | — | — | Combo threshold -2 lines |
| 5 | A | 2 | 2 | — | — | — | — | Threshold -2, +2 cubes on combo |
| 5 | B | 2 | — | 1 | — | — | — | Threshold -2, +1 score on combo |
| 6 | A | 2 | 3 | — | — | — | — | Threshold -2, +3 cubes on combo |
| 6 | B | 2 | — | 2 | — | — | — | Threshold -2, +2 score on combo |
| 7 | A | 3 | 3 | — | — | — | — | Threshold -3, +3 cubes on combo |
| 7 | B | 2 | — | 3 | — | — | — | Threshold -2, +3 score on combo |
| 8 | A | 3 | 4 | — | — | — | — | Threshold -3, +4 cubes on combo |
| 8 | B | 3 | — | 4 | — | — | — | Threshold -3, +4 score on combo |
| 9 | A | 3 | 5 | — | — | 6 | — | Threshold -3, +5 cubes, double cubes above 6-combo |
| 9 | B | 3 | — | 5 | 1 | — | — | Threshold -3, +5 score, +1 free move on combo |
| 10 | A | 4 | 7 | — | — | — | 5 | Threshold -4, +7 cubes, triple cubes above 5-combo |
| 10 | B | 4 | — | 7 | 2 | — | — | Threshold -4, +7 score, +2 free moves on combo |

---

### Resilience (ID 10) — Risk Archetype

**Description**: Free-move safety budget
**Branch A**: "Fortress" — big flat free move budget
**Branch B**: "Flexibility" — smaller budget + regen on clears + score per free move

| Level | Branch | resilience_free_moves | resilience_regen_on_clear | resilience_regen_amount | resilience_score_per_free | Description |
|:-----:|:------:|:--------------------:|:------------------------:|:----------------------:|:------------------------:|-------------|
| 0 | — | 1 | — | — | — | +1 free move (no penalty) |
| 1 | — | 1 | — | — | — | +1 free move |
| 2 | — | 2 | — | — | — | +2 free moves |
| 3 | — | 2 | — | — | — | +2 free moves |
| 4 | — | 3 | — | — | — | +3 free moves |
| 5 | A | 4 | — | — | — | +4 free moves (flat budget) |
| 5 | B | 3 | 3 | 1 | — | +3 free moves, regen 1 move every 3 clears |
| 6 | A | 5 | — | — | — | +5 free moves |
| 6 | B | 3 | 2 | 1 | — | +3 free moves, regen 1 move every 2 clears |
| 7 | A | 6 | — | — | — | +6 free moves |
| 7 | B | 4 | 2 | 1 | — | +4 free moves, regen 1 move every 2 clears |
| 8 | A | 7 | — | — | — | +7 free moves |
| 8 | B | 4 | 1 | 1 | — | +4 free moves, regen 1 move every clear |
| 9 | A | 9 | — | — | — | +9 free moves |
| 9 | B | 5 | 1 | 1 | 1 | +5 free moves, regen every clear, +1 score per free move |
| 10 | A | 12 | — | — | — | +12 free moves |
| 10 | B | 6 | 1 | 2 | 2 | +6 free moves, regen 2 per clear, +2 score per free move |

---

### Focus (ID 11) — Control Archetype

**Description**: Constraint acceleration
**Branch A**: "Clarity" — bonus progress + score on progress
**Branch B**: "Insight" — bonus progress + constraint pre-fill %

| Level | Branch | focus_bonus_progress | focus_score_on_progress | focus_prefill_percent | focus_cube_per_constraint | Description |
|:-----:|:------:|:-------------------:|:----------------------:|:--------------------:|:------------------------:|-------------|
| 0 | — | 1 | — | — | — | +1 bonus constraint progress |
| 1 | — | 1 | — | — | — | +1 bonus constraint progress |
| 2 | — | 1 | 1 | — | — | +1 bonus progress, +1 score on progress |
| 3 | — | 2 | — | — | — | +2 bonus constraint progress |
| 4 | — | 2 | 2 | — | — | +2 bonus progress, +2 score on progress |
| 5 | A | 3 | 3 | — | — | +3 bonus progress, +3 score on progress |
| 5 | B | 2 | — | 25% | — | +2 bonus progress, constraint 25% pre-filled |
| 6 | A | 3 | 4 | — | — | +3 bonus progress, +4 score on progress |
| 6 | B | 2 | — | 30% | — | +2 bonus progress, constraint 30% pre-filled |
| 7 | A | 4 | 5 | — | — | +4 bonus progress, +5 score on progress |
| 7 | B | 3 | — | 35% | — | +3 bonus progress, constraint 35% pre-filled |
| 8 | A | 4 | 6 | — | — | +4 bonus progress, +6 score on progress |
| 8 | B | 3 | — | 40% | — | +3 bonus progress, constraint 40% pre-filled |
| 9 | A | 5 | 8 | — | 1 | +5 bonus progress, +8 score, +1 cube per constraint |
| 9 | B | 4 | — | 50% | 1 | +4 bonus progress, 50% pre-filled, +1 cube per constraint |
| 10 | A | 6 | 10 | — | 2 | +6 bonus progress, +10 score, +2 cubes per constraint |
| 10 | B | 5 | — | 60% | 2 | +5 bonus progress, 60% pre-filled, +2 cubes per constraint |

---

### Expansion (ID 12) — Control Archetype

**Description**: Easier generated lines
**Branch A**: "Foundation" — massive difficulty reduction + score per line
**Branch B**: "Scaffold" — moderate reduction + guaranteed gaps + cubes per lines

| Level | Branch | expansion_difficulty_reduction | expansion_score_per_line | expansion_guaranteed_gaps | expansion_cube_per_level | expansion_cube_per_10_lines | Description |
|:-----:|:------:|:-----------------------------:|:------------------------:|:------------------------:|:------------------------:|:---------------------------:|-------------|
| 0 | — | 1 | — | — | — | — | -1 difficulty level on generated lines |
| 1 | — | 1 | — | — | — | — | -1 difficulty level |
| 2 | — | 1 | 1 | — | — | — | -1 difficulty, +1 score per line |
| 3 | — | 2 | — | — | — | — | -2 difficulty levels |
| 4 | — | 2 | 1 | — | — | — | -2 difficulty, +1 score per line |
| 5 | A | 3 | — | — | — | — | -3 difficulty levels |
| 5 | B | 2 | — | 1 | — | — | -2 difficulty, +1 guaranteed gap |
| 6 | A | 3 | 2 | — | — | — | -3 difficulty, +2 score per line |
| 6 | B | 2 | — | 2 | — | — | -2 difficulty, +2 guaranteed gaps |
| 7 | A | 4 | — | — | — | — | -4 difficulty levels |
| 7 | B | 3 | — | 2 | — | — | -3 difficulty, +2 guaranteed gaps |
| 8 | A | 4 | 3 | — | — | — | -4 difficulty, +3 score per line |
| 8 | B | 3 | — | 2 | — | 1 | -3 difficulty, +2 gaps, +1 cube per 10 lines |
| 9 | A | 5 | 4 | — | 1 | — | -5 difficulty, +4 score/line, +1 cube per level |
| 9 | B | 3 | — | 3 | — | 2 | -3 difficulty, +3 gaps, +2 cubes per 10 lines |
| 10 | A | 6 | 5 | — | 2 | — | -6 difficulty, +5 score/line, +2 cubes per level |
| 10 | B | 4 | — | 4 | — | 3 | -4 difficulty, +4 gaps, +3 cubes per 10 lines |

---

### Momentum (ID 13) — Tempo Archetype

**Description**: Consecutive clear value
**Branch A**: "Snowball" — score + cubes per streak + row clears
**Branch B**: "Perpetual Motion" — score + move refunds + combo on streak

| Level | Branch | momentum_score_per_consec | momentum_streak_cube_threshold | momentum_streak_cubes | momentum_move_refund | momentum_combo_on_streak | momentum_streak_clear_rows | Description |
|:-----:|:------:|:------------------------:|:-----------------------------:|:--------------------:|:-------------------:|:------------------------:|:--------------------------:|-------------|
| 0 | — | 1 | — | — | — | — | — | +1 score per consecutive clear |
| 1 | — | 1 | — | — | — | — | — | +1 score per consecutive clear |
| 2 | — | 2 | — | — | — | — | — | +2 score per consecutive clear |
| 3 | — | 2 | — | — | — | — | — | +2 score per consecutive clear |
| 4 | — | 3 | — | — | — | — | — | +3 score per consecutive clear |
| 5 | A | 4 | 3 | 1 | — | — | — | +4 score/consec, +1 cube every 3 streak |
| 5 | B | 3 | — | — | 1 | — | — | +3 score/consec, refund 1 move on streak |
| 6 | A | 5 | 3 | 1 | — | — | — | +5 score/consec, +1 cube every 3 streak |
| 6 | B | 4 | — | — | 1 | — | — | +4 score/consec, refund 1 move on streak |
| 7 | A | 6 | 3 | 2 | — | — | — | +6 score/consec, +2 cubes every 3 streak |
| 7 | B | 5 | — | — | 1 | 1 | — | +5 score/consec, refund 1 move, +1 combo on streak |
| 8 | A | 8 | 3 | 2 | — | — | — | +8 score/consec, +2 cubes every 3 streak |
| 8 | B | 6 | — | — | 2 | 1 | — | +6 score/consec, refund 2 moves, +1 combo on streak |
| 9 | A | 10 | 3 | 3 | — | — | 1 | +10 score/consec, +3 cubes/3 streak, clear 1 row |
| 9 | B | 8 | — | — | 2 | 2 | — | +8 score/consec, refund 2 moves, +2 combo on streak |
| 10 | A | 12 | 3 | 4 | — | — | 2 | +12 score/consec, +4 cubes/3 streak, clear 2 rows |
| 10 | B | 10 | — | — | 3 | 3 | — | +10 score/consec, refund 3 moves, +3 combo on streak |

---

### Adrenaline (ID 14) — Risk Archetype

**Description**: High-grid risk reward
**Branch A**: "Last Stand" — high score + cubes when grid is tall
**Branch B**: "Second Wind" — combo multiplier + free moves when grid is tall

| Level | Branch | adrenaline_row_threshold | adrenaline_score_per_clear | adrenaline_cubes_per_clear | adrenaline_combo_multiplier | adrenaline_free_moves | adrenaline_free_moves_threshold | Description |
|:-----:|:------:|:------------------------:|:--------------------------:|:--------------------------:|:---------------------------:|:---------------------:|:-------------------------------:|-------------|
| 0 | — | 7 | 2 | — | — | — | — | When grid ≥7 rows: +2 score per clear |
| 1 | — | 7 | 3 | — | — | — | — | When grid ≥7 rows: +3 score per clear |
| 2 | — | 7 | 4 | — | — | — | — | When grid ≥7 rows: +4 score per clear |
| 3 | — | 7 | 5 | — | — | — | — | When grid ≥7 rows: +5 score per clear |
| 4 | — | 7 | 6 | 1 | — | — | — | When grid ≥7 rows: +6 score, +1 cube/clear |
| 5 | A | 7 | 8 | 2 | — | — | — | Grid ≥7: +8 score, +2 cubes per clear |
| 5 | B | 8 | 6 | — | 2 | — | — | Grid ≥8: +6 score, x2 combo multiplier |
| 6 | A | 7 | 10 | 2 | — | — | — | Grid ≥7: +10 score, +2 cubes per clear |
| 6 | B | 8 | 7 | — | 2 | — | — | Grid ≥8: +7 score, x2 combo multiplier |
| 7 | A | 7 | 12 | 3 | — | — | — | Grid ≥7: +12 score, +3 cubes per clear |
| 7 | B | 7 | 8 | — | 2 | — | — | Grid ≥7: +8 score, x2 combo multiplier |
| 8 | A | 7 | 15 | 3 | — | — | — | Grid ≥7: +15 score, +3 cubes per clear |
| 8 | B | 7 | 10 | — | 2 | 1 | 7 | Grid ≥7: +10 score, x2 combo, +1 free move at ≥7 rows |
| 9 | A | 7 | 20 | 4 | — | 1 | 8 | Grid ≥7: +20 score, +4 cubes, +1 free move at ≥8 rows |
| 9 | B | 7 | 12 | — | 3 | 2 | 7 | Grid ≥7: +12 score, x3 combo, +2 free moves at ≥7 rows |
| 10 | A | 7 | 25 | 6 | — | 2 | 8 | Grid ≥7: +25 score, +6 cubes, +2 free moves at ≥8 rows |
| 10 | B | 7 | 15 | — | 4 | 3 | 7 | Grid ≥7: +15 score, x4 combo, +3 free moves at ≥7 rows |

---

### Legacy (ID 15) — Scaling Archetype

**Description**: Linear long-run scaling
**Branch A**: "Dynasty" — score + cubes per N levels
**Branch B**: "Heritage" — score per unique skill + free moves per 10 levels

| Level | Branch | legacy_score_per_n_levels | legacy_level_divisor | legacy_cube_per_n_levels | legacy_cube_level_divisor | legacy_score_per_unique_skill | legacy_free_moves_per_10 | Description |
|:-----:|:------:|:------------------------:|:-------------------:|:------------------------:|:------------------------:|:-----------------------------:|:------------------------:|-------------|
| 0 | — | 1 | 5 | — | — | — | — | +1 score per 5 levels cleared |
| 1 | — | 1 | 4 | — | — | — | — | +1 score per 4 levels cleared |
| 2 | — | 1 | 3 | — | — | — | — | +1 score per 3 levels cleared |
| 3 | — | 2 | 3 | — | — | — | — | +2 score per 3 levels cleared |
| 4 | — | 2 | 3 | 1 | 10 | — | — | +2 score/3 levels, +1 cube per 10 levels |
| 5 | A | 3 | 3 | 1 | 5 | — | — | +3 score/3 levels, +1 cube per 5 levels |
| 5 | B | 2 | 3 | — | — | 1 | — | +2 score/3 levels, +1 score per unique skill |
| 6 | A | 3 | 3 | 2 | 5 | — | — | +3 score/3 levels, +2 cubes per 5 levels |
| 6 | B | 2 | 3 | — | — | 1 | — | +2 score/3 levels, +1 score per unique skill |
| 7 | A | 4 | 3 | 2 | 5 | — | — | +4 score/3 levels, +2 cubes per 5 levels |
| 7 | B | 3 | 3 | — | — | 2 | — | +3 score/3 levels, +2 score per unique skill |
| 8 | A | 5 | 3 | 3 | 5 | — | — | +5 score/3 levels, +3 cubes per 5 levels |
| 8 | B | 3 | 3 | — | — | 2 | 1 | +3 score/3 levels, +2 score/skill, +1 move/10 levels |
| 9 | A | 6 | 2 | 4 | 5 | — | 1 | +6 score/2 levels, +4 cubes/5 levels, +1 move/10 levels |
| 9 | B | 4 | 3 | — | — | 3 | 2 | +4 score/3 levels, +3 score/skill, +2 moves/10 levels |
| 10 | A | 8 | 2 | 6 | 5 | — | 2 | +8 score/2 levels, +6 cubes/5 levels, +2 moves/10 levels |
| 10 | B | 5 | 3 | — | — | 4 | 3 | +5 score/3 levels, +4 score/skill, +3 moves/10 levels |

---

## Draft System

### How Skills Enter a Run

1. **Before each level** (or at run start), a **draft event** triggers
2. Player sees **3 skill choices** (cards)
3. If loadout has empty slots (< 3 filled): **Select** adds the skill at level 0
4. If loadout is full (3/3 filled): **Upgrade** — selecting a skill already in loadout increases its level by 1

### Reroll Mechanic

- Player can **reroll** any of the 3 offered cards
- Cost formula: `ceil(5 * 1.5^n)` where `n` = reroll count this draft
- Cost sequence: 5, 8, 12, 18, 27, 41, ...
- Costs CUBE (deducted from wallet)

### Branch Choice

- When a skill reaches level 4 (internal) and player selects it again at level 5, they must choose Branch A or B
- This is done via the **Skill Tree Page** (`SkillTreePage.tsx`)
- Respec is possible but costs 50% of invested CUBE

### Contract Calls

| Action | System Call | Parameters |
|--------|-----------|------------|
| Reroll a draft card | `draft_system.reroll(game_id, reroll_slot)` | `reroll_slot`: 0, 1, or 2 |
| Select a draft card | `draft_system.select(game_id, selected_slot)` | `selected_slot`: 0, 1, or 2 |
| Upgrade a skill | `skill_tree_system.upgrade_skill(skill_id)` | `skill_id`: 1-15 |
| Choose branch | `skill_tree_system.choose_branch(skill_id, branch_id)` | `branch_id`: 0=A, 1=B |
| Respec branch | `skill_tree_system.respec_branch(skill_id)` | Costs 50% of invested CUBE |

### Client Calls (from `systems.ts`)

```typescript
systemCalls.rerollDraft({ account, game_id, reroll_slot })
systemCalls.selectDraft({ account, game_id, selected_slot })
systemCalls.upgradeSkill({ account, skill_id })
systemCalls.chooseBranch({ account, skill_id, branch_id })
systemCalls.respecBranch({ account, skill_id })
```

---

## Contract ↔ Client Interaction Flow

### Applying a Bonus (Active Skill)

```
Client (BonusButton click)
  → systems.ts: applyBonus({ account, game_id, bonus, row_index, line_index })
    → contractSystems.ts: client.game.bonus({ account, game_id, bonus, row_index, line_index })
      → Contract: game_system.apply_bonus(game_id, bonus: Bonus, row_index: u8, line_index: u8)
        → helpers/bonus_logic.cairo: apply_bonus_effect(bonus, blocks, row_index, index)
          → Harvest: elements/bonuses/harvest.cairo::BonusImpl::apply()
          → Wave: elements/bonuses/wave.cairo::BonusImpl::apply()
          → Combo/Score/Supply: run_data modified directly
        → helpers/skill_effects.cairo: bonus_effect_for_skill(skill_id, level, branch_id)
          → Returns BonusEffect struct with all level/branch-specific values
        → Grid system applies BonusEffect (charges, cubes, score, free moves, etc.)
```

### Skill Effects Resolution

```
Contract: grid_system processes a move or bonus
  → helpers/skill_effects.cairo: bonus_effect_for_skill(skill_id, level, branch_id)
    → Returns BonusEffect { combo_add, score_add, cube_reward_per_block, rows_to_clear, ... }
  → helpers/skill_effects.cairo: world_effect_for_skill(skill_id, level, branch_id)
    → Returns WorldEffects { extra_max_moves, surge_score_percent, ... }
  → helpers/skill_effects.cairo: aggregate_world_effects(run_data, branch_ids)
    → Combines WorldEffects from all 3 loadout slots
  → Applied during move resolution, level start, and level complete
```

### Reading Skill State (Client)

```
Client: useSkillTree() hook
  → Reads SkillTreeData model from Torii
  → Unpacks 15 skills × (level, branchChosen, branchId) from packed felt252
  → SkillTreePage.tsx renders the tree per archetype

Client: useDraft() hook
  → Reads DraftState model from Torii
  → Shows 3 skill choices with current effect descriptions
  → DraftPage.tsx renders draft cards

Client: useGame() → game.runData
  → Reads run_data from Game model
  → Unpacks activeSlotCount, slot 1-3 (skillId, level, charges)
  → Used by GameActionBar, GameHud for bonus button display
```

---

## Data Packing: run_data

The `run_data` field (felt252) stores the current run's skill loadout.

### Loadout Slot Layout (from `runDataPacking.ts`)

```
Bits 95-97:    active_slot_count (3 bits, 0-3)
Bits 98-101:   slot_1_skill (4 bits, skill ID 0-15)
Bits 102-105:  slot_1_level (4 bits, 0-10)
Bits 106-109:  slot_2_skill (4 bits, skill ID 0-15)
Bits 110-113:  slot_2_level (4 bits, 0-10)
Bits 114-117:  slot_3_skill (4 bits, skill ID 0-15)
Bits 118-121:  slot_3_level (4 bits, 0-10)
Bits 122-123:  slot_1_charges (2 bits, 0-3)
Bits 124-125:  slot_2_charges (2 bits, 0-3)
Bits 126-127:  slot_3_charges (2 bits, 0-3)
```

### SkillSlot Interface (Client)

```typescript
interface SkillSlot {
  skillId: number;  // 1-15 (1-5 = bonus, 6-15 = world), 0 = empty
  level: number;    // 0-10
  charges: number;  // 0-3 (only meaningful for bonus skills 1-5)
}
```

### Bonus vs World Skill Check

```typescript
function isBonusSkill(skillId: number): boolean {
  return skillId >= 1 && skillId <= 5;
}
```

---

## Key Source Files

### Contract

| File | Purpose |
|------|---------|
| `contracts/src/types/bonus.cairo` | Bonus enum (None, Combo, Score, Harvest, Wave, Supply) |
| `contracts/src/elements/bonuses/harvest.cairo` | Harvest grid logic (clear blocks of same size) |
| `contracts/src/elements/bonuses/wave.cairo` | Wave grid logic (clear entire row) |
| `contracts/src/helpers/bonus_logic.cairo` | Bonus dispatch (grid vs non-grid routing) |
| `contracts/src/helpers/skill_effects.cairo` | **ALL skill effect values** (1959 lines) — source of truth |
| `contracts/src/systems/game.cairo` | `apply_bonus()`, `purchase_consumable()` |
| `contracts/src/helpers/packing.cairo` | run_data bit layout |

### Client

| File | Purpose |
|------|---------|
| `client-budokan/src/dojo/game/types/bonus.ts` | BonusType enum, contract value mapping, descriptions |
| `client-budokan/src/dojo/game/types/skillData.ts` | 15 skill definitions, 5 archetype definitions, branch names |
| `client-budokan/src/dojo/game/types/skillEffects.ts` | Human-readable descriptions for all 15 skills at all levels |
| `client-budokan/src/dojo/game/helpers/runDataPacking.ts` | run_data unpacking, SkillSlot interface, costs |
| `client-budokan/src/dojo/game/constants.ts` | MAX_LOADOUT_SLOTS, MAX_SKILL_LEVEL, BRANCH_POINT_LEVEL |
| `client-budokan/src/dojo/systems.ts` | `applyBonus`, `upgradeSkill`, `chooseBranch`, `respecBranch`, `rerollDraft`, `selectDraft` |
| `client-budokan/src/ui/pages/DraftPage.tsx` | Draft UI (3 card selection) |
| `client-budokan/src/ui/pages/SkillTreePage.tsx` | Skill tree UI (upgrade, branch, respec) |
| `client-budokan/src/ui/components/BonusButton.tsx` | In-game bonus trigger buttons |
