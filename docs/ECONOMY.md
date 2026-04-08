# zkube Economy Reference

## Currency: zStar (non-transferable ERC20)

zStars are the game's soft currency. They cannot be traded or transferred — only earned through gameplay and spent on zone unlocks (and future tournament entry).

---

## Zone Unlock Costs

| Tier | Zones | Price ($) | Star Cost | 50% Hybrid |
|------|-------|-----------|-----------|------------|
| Free | Z1 Polynesian | $0 | 0 | — |
| Tier 1 | Z2 Egypt, Z3 Norse, Z4 Greece | $2 | 40 | 20 stars + $1 |
| Tier 2 | Z5 China, Z6 Persia, Z7 Japan | $5 | 100 | 50 stars + $2.50 |
| Tier 3 | Z8 Mayan, Z9 Tribal, Z10 Inca | $10 | 200 | 100 stars + $5 |

- **All zones paid**: $51
- **All zones hybrid** (50% stars + 50% payment): ~$25 + 420 stars
- **All zones F2P**: 840 stars
- Zones unlock in any order (non-sequential)
- Hybrid discount capped at 50%

---

## zStar Sources

### Story Mode (per zone, one-time)

| Source | zStars | Condition |
|--------|--------|-----------|
| Level star deltas | Up to 30 | 3 stars × 10 levels (only new improvements mint) |
| Perfection claim | 20 | 30/30 stars in a zone |
| **Total per zone** | **50** | Perfect all 10 levels + claim |

### Daily Challenge (per day)

| Percentile | zStars |
|-----------|--------|
| Top 1% | 10 |
| Top 5% | 7 |
| Top 10% | 5 |
| Top 25% | 3 |
| Top 50% | 1 |
| Bottom 50% | 0 |

### Weekly Endless (per week, per zone)

| Percentile | zStars |
|-----------|--------|
| Top 1% | 30 |
| Top 5% | 20 |
| Top 10% | 15 |
| Top 25% | 10 |
| Top 50% | 3 |
| Bottom 50% | 0 |

Based on all-time personal best — no need to grind every week.

### Returning Player Bonus

| Source | zStars | Condition |
|--------|--------|-----------|
| Weekly return | 5 | Inactive >7 days, then play any mode |

### Quests (daily/weekly rotating)

Quests do NOT mint zStars directly. They drive engagement and progress toward achievements (which grant XP only). Quest rewards shown in UI are cosmetic star indicators.

**12 quests total:**
- **Daily rotating** (3-day cycle, pick from 9):
  - Line Clear I/II/III: clear 30/60/100 lines
  - Combo I/II/III: hit 3+/4+/5+ combo
  - Bonus I/II: use 3/8 bonuses
  - Daily Challenger: play 1 daily challenge
- **Daily meta**: Daily Finisher (complete 3 daily quests)
- **Weekly**: Weekly Grinder (30 levels), Weekly Challenger (3 daily plays)

### Achievements (one-time, XP only)

24 achievements across 6 categories × 4 tiers. Grant XP (50-1000), no zStars.

---

## XP Sources

| Source | XP | Frequency |
|--------|-----|-----------|
| Star improvement (per star delta) | delta × 10 | Per level |
| Zone clear (first boss beat) | 1,000 | One-time per zone |
| Zone perfection (30/30 stars) | 700 | One-time per zone |
| Returning player (>7 days) | 50 | Per return |
| Daily first submission | 30 | Per daily |
| Achievements | 50-1,000 | One-time each |

---

## Weekly zStar Earning Rates

### Active Player (new zone available)

| Source | Weekly zStars |
|--------|-------------|
| Zone gameplay (first clear, ~25 stars) | ~25 |
| Zone perfection (once) | +20 |
| Daily challenge top 25% (7 days) | +21 |
| Weekly endless top 25% | +10 |
| **Peak week total** | **~76** |

### Steady State (replaying, no new zones)

| Source | Weekly zStars |
|--------|-------------|
| Daily challenge top 25% (7 days) | 21 |
| Weekly endless top 25% | 10 |
| **Steady state total** | **~31** |

---

## Player Progression User Stories

### Casual F2P (30 min/day, average skill)

| Week | Activity | zStars earned | Cumulative | Milestone |
|------|----------|--------------|------------|-----------|
| 1 | Play Z1, 2-star avg | 30 | 30 | — |
| 2 | Improve Z1, daily/weekly | 15 | 45 | Can unlock Tier 1 (40 stars) |
| 3-4 | Play Z2, improve | 25-30/wk | 95-105 | — |
| 5-6 | Play Z3 | 25-30/wk | 145-165 | Can unlock Tier 2 (100 stars) |
| ~12 | — | — | ~360 | All Tier 1+2 unlocked |
| ~30-40 | — | — | ~840 | All zones F2P |

### Dedicated Grinder (1hr/day, good skill, top 25%)

| Week | Activity | zStars earned | Cumulative | Milestone |
|------|----------|--------------|------------|-----------|
| 1 | Perfect Z1 | 81 | 81 | Unlock Z2 (40), keep 41 |
| 2 | Play Z2, daily/weekly | 56 | 97 | Unlock Z3 (40), keep 57 |
| 3 | Perfect Z2, start Z3 | 56 | 113 | Unlock Z4 (40), keep 73 |
| 6 | — | — | ~220 | All Tier 1 + first Tier 2 |
| 12 | — | — | ~500 | All Tier 1+2 |
| 25-30 | — | — | ~840 | All zones |

### Moderate Spender ($5-10/month)

| Month | Spent | Zones owned | Strategy |
|-------|-------|-------------|----------|
| 1 | $6 | Z1-4 (4 zones) | Buy all Tier 1 |
| 2 | $7.50 | Z1-6 (6 zones) | Buy Z5, hybrid Z6 |
| 3-4 | $10 | Z1-8 (8 zones) | Buy Z7, hybrid Z8 |
| 5-6 | $10-15 | All 10 | Buy/hybrid Z9+Z10 |
| **Total** | **~$33-43** | **All 10** | Mix of cash + earned stars |

### Whale (day 1)

- All zones: **$51**

---

## Future zStar Sinks

- **Tournament entry fees**: burn zStars to enter competitive tournaments
- **Cosmetic shop**: planned but not yet implemented (CosmeticDef model exists)

---

## Economy Invariants

1. zStars are **non-transferable** (ERC20 with transfer hook that only allows mint/burn)
2. Hybrid discount **capped at 50%** — stars can never cover more than half the payment price
3. Zone access is **non-sequential** — any zone purchasable in any order
4. Weekly endless uses **all-time PB** — no weekly grind pressure
5. Star improvements are **delta-only** — replaying a 3-star level mints 0 new stars
6. Perfection is **one-time per zone** — can't re-claim after first 30/30
