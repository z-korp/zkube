# Constraint System Configuration

> Edit values below and return for implementation.

---

## 1. Budget Interpolation (GameSettings)

Budget scales linearly from VeryEasy (tier 0) to Master (tier 7).

| Parameter | VeryEasy | Master |
|-----------|:---:|:---:|
| budget_min | 1 | 36 |
| budget_max | 3 | 40 |

**Interpolated per tier:**

| Tier | Difficulty | Budget Min | Budget Max |
|------|-----------|:---:|:---:|
| 0 | VeryEasy | 1 | 3 |
| 1 | Easy | 6 | 8 |
| 2 | Medium | 11 | 13 |
| 3 | MediumHard | 16 | 18 |
| 4 | Hard | 21 | 24 |
| 5 | VeryHard | 26 | 29 |
| 6 | Expert | 31 | 34 |
| 7 | Master | 36 | 40 |

---

## 2. Number of Constraints (GameSettings)

Deterministic constraint count per difficulty tier. Replaces the old probability-based dual_chance system.

Roll a random count in `[constraint_min, constraint_max]`, then generate that many constraints total.
**NoBonusUsed is boss-only** — never generated on regular levels.

| Tier | Difficulty | constraint_min | constraint_max |
|------|-----------|:---:|:---:|
| 0 | VeryEasy | 0 | 0 |
| 1 | Easy | 1 | 1 |
| 2 | Medium | 1 | 2 |
| 3 | MediumHard | 1 | 2 |
| 4 | Hard | 2 | 2 |
| 5 | VeryHard | 2 | 3 |
| 6 | Expert | 2 | 3 |
| 7 | Master | 3 | 3 |

---

## 3. Type Selection Weights

Weights per tier (must sum to 100). Controls which constraint type is rolled on regular levels.

| Tier | ClearLines | BreakBlocks | Fill | AchieveCombo |
|------|:---:|:---:|:---:|:---:|
| 0 VeryEasy | 80 | 15 | 0 | 5 |
| 1 Easy | 55 | 15 | 15 | 15 |
| 2 Medium | 50 | 18 | 15 | 17 |
| 3 MediumHard | 45 | 20 | 17 | 18 |
| 4 Hard | 40 | 22 | 18 | 20 |
| 5 VeryHard | 35 | 23 | 20 | 22 |
| 6 Expert | 30 | 24 | 24 | 22 |
| 7 Master | 25 | 25 | 28 | 22 |

---

## 4. ClearLines Cost Function

`line_cost(lines)` — higher lines are exponentially harder. Budget buys `times = budget / line_cost(lines)`.

| Lines | Cost |
|:---:|:---:|
| 2 | 2 |
| 3 | 4 |
| 4 | 6 |
| 5 | 10 |
| 6 | 15 |
| 7+ | 20 |

**What budget produces (max lines feasible, then times = budget/cost):**

| Budget | Max Lines | Sample outcomes (lines x times) |
|:---:|:---:|---|
| 1 | 2 | 2x1 |
| 3 | 2 | 2x1 |
| 4 | 3 | 3x1, 2x2 |
| 8 | 4 | 4x1, 3x2, 2x4 |
| 13 | 5 | 5x1, 4x2, 3x3, 2x6 |
| 18 | 6 | 6x1, 5x1, 4x3, 3x4, 2x9 |
| 24 | 7 | 7x1, 5x2, 4x4, 3x6, 2x12 |
| 29 | 7 | 7x1, 5x2, 4x4, 3x7, 2x14 |
| 34 | 7 | 7x1, 6x2, 5x3, 4x5, 2x17 |
| 40 | 7 | 7x2, 6x2, 5x4, 4x6, 2x20 |

---

## 5. BreakBlocks Cost Function

`break_cost(size)` — smaller blocks are easier to find. `blocks_max = (budget × BREAK_SCALE) / break_cost(size)`, clamped [4, 120].

| Size | Cost |
|:---:|:---:|
| 1 | 3 |
| 2 | 4 |
| 3 | 5 |
| 4 | 6 |

**BREAK_SCALE = 8**

**Max block size by tier:**

| Tier | Max Size |
|:---:|:---:|
| 0-1 | 2 |
| 2-3 | 3 |
| 4-7 | 4 |

**What budget produces (blocks_max per size):**

| Budget | Size-1 max | Size-2 max | Size-3 max | Size-4 max |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 4 | 4 | — | — |
| 3 | 8 | 6 | — | — |
| 8 | 21 | 16 | — | — |
| 13 | 34 | 26 | 20 | — |
| 18 | 48 | 36 | 28 | — |
| 24 | 64 | 48 | 38 | 32 |
| 29 | 77 | 58 | 46 | 38 |
| 34 | 90 | 68 | 54 | 45 |
| 40 | 106 | 80 | 64 | 53 |

Roll range is always [4, blocks_max] with skew-high.

---

## 6. AchieveCombo Cost Function

`combo_cost(c) = c × (c-1) / 2` — triangular number. Max feasible combo where cost ≤ budget.

| Combo | Cost |
|:---:|:---:|
| 3 | 3 |
| 4 | 6 |
| 5 | 10 |
| 6 | 15 |
| 7 | 21 |
| 8 | 28 |
| 9 | 36 |

**What budget unlocks:**

| Budget | Max Combo |
|:---:|:---:|
| 1-2 | 3 |
| 3-5 | 3 |
| 6-9 | 4 |
| 10-14 | 5 |
| 15-20 | 6 |
| 21-27 | 7 |
| 28-35 | 8 |
| 36-40 | 9 |

Roll range is [3, max_combo] with skew-high.

---

## 7. Fill Cost Function

`fill_row_cost(row)` — higher rows are exponentially harder to maintain. `times = budget / row_cost`, capped by `fill_times_cap(row)`.

| Row | Cost | Times Cap |
|:---:|:---:|:---:|
| 4 | 2 | 4 |
| 5 | 5 | 3 |
| 6 | 10 | 2 |
| 7 | 17 | 2 |
| 8 | 26 | 1 |

**What budget produces:**

| Budget | Max Row | Sample outcomes (row x times) |
|:---:|:---:|---|
| 1 | 4 | Row4 x1 |
| 3 | 4 | Row4 x1 |
| 5 | 5 | Row5 x1, Row4 x2 |
| 8 | 5 | Row5 x1, Row4 x4 |
| 10 | 6 | Row6 x1, Row5 x2, Row4 x4 |
| 13 | 6 | Row6 x1, Row5 x2, Row4 x4 |
| 17 | 7 | Row7 x1, Row6 x1, Row5 x3 |
| 18 | 7 | Row7 x1, Row6 x1, Row5 x3 |
| 24 | 7 | Row7 x1, Row6 x2, Row5 x3 |
| 26 | 8 | Row8 x1, Row7 x1, Row6 x2 |
| 29 | 8 | Row8 x1, Row7 x1, Row6 x2 |
| 34 | 8 | Row8 x1, Row7 x2, Row6 x2 |
| 40 | 8 | Row8 x1, Row7 x2, Row6 x2 |

---

## 8. Difficulty Tier Thresholds (GameSettings)

Which levels map to which difficulty tier.

| Tier | Difficulty | Starts at Level |
|------|-----------|:---:|
| 0 | VeryEasy | 1 |
| 1 | Easy | 4 |
| 2 | Medium | 8 |
| 3 | MediumHard | 12 |
| 4 | Hard | 18 |
| 5 | VeryHard | 25 |
| 6 | Expert | 35 |
| 7 | Master | 45 |

Constraint start level: **3**

---

## 9. Boss Configuration

Boss levels: **10, 20, 30, 40, 50**

- L10/20/30: **Dual** constraints (primary + secondary)
- L40/50: **Triple** constraints (primary + secondary + tertiary)
- Boss constraints use **budget_max** for the level's difficulty tier
- Boss ID = `seed % 10 + 1` (deterministic per run)

### Boss Identities

| # | Name | Primary | Secondary | Tertiary (L40/50) |
|---|------|---------|-----------|-------------------|
| 1 | Combo Master | ClearLines | AchieveCombo | NoBonusUsed |
| 2 | Demolisher | BreakBlocks | ClearLines | ClearGrid |
| 3 | Daredevil | Fill | AchieveCombo | ClearLines |
| 4 | Purist | NoBonusUsed | ClearLines | AchieveCombo |
| 5 | Harvester | BreakBlocks | AchieveCombo | Fill |
| 6 | Tidal | ClearGrid | ClearLines | BreakBlocks |
| 7 | Stacker | Fill | ClearLines | BreakBlocks |
| 8 | Surgeon | BreakBlocks | Fill | NoBonusUsed |
| 9 | Ascetic | NoBonusUsed | AchieveCombo | Fill |
| 10 | Perfectionist | ClearLines | Fill | AchieveCombo |

### Boss Budget_max by Level

| Boss Level | Tier | Difficulty | budget_max |
|:---:|:---:|-----------|:---:|
| 10 | 2 | Medium | 13 |
| 20 | 4 | Hard | 24 |
| 30 | 5 | VeryHard | 29 |
| 40 | 6 | Expert | 34 |
| 50 | 7 | Master | 40 |

---

## 10. Skew-High Mechanic

All rolls use **skew-high**: `result = max(roll1, roll2)` where both rolls are uniform within range.

This shifts the distribution toward the ceiling. Probability of getting value `k` out of range `[1, N]`:
- P(k) = (2k - 1) / N²
- Median ≈ 70th percentile of uniform
- Mean ≈ 2/3 of range

Example for range [1, 10]: most likely result is 10 (19% chance), least likely is 1 (1% chance).
