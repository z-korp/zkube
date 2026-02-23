# Unified Skill Tree + Draft System Spec

> **Status:** Design  
> **Replaces:** Current 3-pool draft, permanent shop upgrades, in-game shop  
> **Depends on:** Existing level/boss/constraint systems (unchanged)

---

## 1. Core Concept

One **skill roster of 15 skills**. One **persistent skill tree** (meta-progression, cubes). One **draft system** (in-run acquisition, single pool).

```
SKILL TREE (persistent)                  DRAFT (in-run)
┌────────────────────────┐              ┌──────────────────────────────┐
│ 15 skills              │              │ 3 random cards drawn from    │
│ 5 Bonus + 10 World     │──────────────│ the same 15-skill pool       │
│ Each: levels 0-9       │  tree level  │                              │
│ Branches at level 5    │  = starting  │ Pick 1 → enters run at       │
│ Bought with cubes      │  floor       │ skill tree level             │
└────────────────────────┘              │                              │
                                        │ Already have it? → +1 level  │
                                        │ 5 slots full? → upgrades only│
                                        └──────────────────────────────┘
```

### What Changes

| Current System | New System |
|---|---|
| 3 draft pools (Bonus / Upgrade / World) | 1 unified pool of 15 skills |
| 3 bonus slots per run | 5 skill slots per run (bonus OR world) |
| Bonuses start empty, acquired via draft | Same — but world events also fill slots |
| Upgrade pool levels up bonuses | Duplicate draft picks level up (+1) |
| Permanent shop (starting charges, bag size, etc.) | Skill tree (persistent levels + branches) |
| In-game shop (charges, level-up, swap) | Removed — draft is the only build engine |
| Per-slot reroll counters | Shared reroll counter (exponential cost) |
| Boss-clear gating on some world options | No gating — all 15 skills always in pool |
| 3 bonus levels (L1/L2/L3) | 10 skill levels (0-9) with branch at 5 |

### What Stays Unchanged

- Grid core (8x10, gravity, line clears)
- 50-level run with boss cadence at 10/20/30/40/50
- Constraint and difficulty framework
- Draft trigger timing (post-level-1, zone micro, post-boss)
- Quest and achievement systems
- Cube token (ERC-20) as meta currency
- Dojo world + Torii sync architecture

---

## 2. Skill Roster

### 15 Skills: 5 Bonus (Active) + 10 World (Passive)

| ID | Name | Type | Description |
|---|---|---|---|
| 1 | Combo | Bonus | Adds combo to next move |
| 2 | Score | Bonus | Instantly adds bonus score |
| 3 | Harvest | Bonus | Destroys blocks of chosen size, earns cubes |
| 4 | Wave | Bonus | Clears entire horizontal rows |
| 5 | Supply | Bonus | Adds new lines at no move cost |
| 6 | Tempo | World | Extra max moves per level |
| 7 | Fortune | World | Bonus cubes per level completion |
| 8 | Surge | World | Score multiplier on all points |
| 9 | Catalyst | World | Lowers combo-cube thresholds |
| 10 | Resilience | World | Free moves that don't count against limit |
| 11 | Focus | World | Bonus constraint progress |
| 12 | Expansion | World | Generated lines are easier |
| 13 | Momentum | World | Consecutive clears grant bonus |
| 14 | Adrenaline | World | Bonus when grid is high (risk/reward) |
| 15 | Legacy | World | Power scales with run progress |

**Bonus skills** are active abilities — the player triggers them manually (consumes a charge).  
**World skills** are passive effects — always active once drafted, no charges.

---

## 3. Skill Tree Structure

### Per-Skill Layout

```
Tree:     Lv0 → Lv1 → Lv2 → Lv3 → Lv4
                                        ╲
Branch A:                                 Lv5A → Lv6A → Lv7A → Lv8A → Lv9A
                                        ╱
Branch B:                                 Lv5B → Lv6B → Lv7B → Lv8B → Lv9B
Draft-only:                                                           → Lv10 ★ (Maximum Joy)
```

 **Level 0**: Base effect (no investment needed — this is what you get when drafted at tree level 0).
 **Levels 1-4**: Core path. Linear upgrades, everyone takes the same nodes.
 **Level 5**: Branch point. Choose Specialization A or B. Permanent choice per skill.
 **Levels 5-9**: Branch-specific. "Starts small, scales hard" — levels 7-9 are the power fantasy.
 **Level 10**: "Maximum Joy" — draft-only. Cannot be purchased. Only reachable via in-run draft upgrades. The ultimate power tier.
 **Total tree investment per skill**: 9 purchases (0→1 through 8→9). Level 10 is earned in-run.

### Skill Tree Costs (Cubes)

| Level | Cost | Cumulative | Notes |
|---|---|---|---|
| 0 → 1 | 50 | 50 | Dip your toes |
| 1 → 2 | 100 | 150 | Still cheap |
| 2 → 3 | 250 | 400 | ~3 days casual |
| 3 → 4 | 500 | 900 | Core path complete (~1 week casual) |
| 4 → 5 | 1,000 | 1,900 | Branch choice (~2 weeks casual) |
| 5 → 6 | 2,000 | 3,900 | ~1 month casual |
| 6 → 7 | 4,000 | 7,900 | ~2 months casual |
| 7 → 8 | 8,000 | 15,900 | ~4 months casual |
| 8 → 9 | 10,000 | 25,900 | ~7 months casual |
| **10** | **—** | **—** | **Draft-only. Cannot buy. Maximum Joy.** |

- **Full core (0→4)**: 900 cubes. ~1 week casual, ~4 days active.
- **Full branch (0→5)**: 1,900 cubes. ~2 weeks casual.
- **Full skill (0→9)**: 25,900 cubes. ~7 months casual, ~3.7 months active.
- **3 skills maxed**: 77,700 cubes. ~1.7 years casual, ~11 months active.
- **All 15 skills maxed**: 388,500 cubes. Years of play. Aspirational.

**Implementation** (Cairo):
```cairo
fn skill_upgrade_cost(current_level: u8) -> u16 {
    match current_level {
        0 => 50,     // 0→1
        1 => 100,    // 1→2
        2 => 250,    // 2→3
        3 => 500,    // 3→4
        4 => 1000,   // 4→5 (branch choice)
        5 => 2000,   // 5→6
        6 => 4000,   // 6→7
        7 => 8000,   // 7→8
        8 => 10000,  // 8→9
        _ => 0,      // 9 = max tree, 10 = draft only
    }
}
```

### Branch Respec

- Costs 50% of the branch levels already purchased (rounded up).
- Resets branch levels to 4 (core stays). Must re-buy from 5 in the new branch.
- Prevents trivial swapping while not permanently punishing experimentation.

---

## 4. Bonus Skills (Active) — Full Level Tables

### 4.1 Combo

*Adds combo to your next move. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | +1 combo |
| 1 | +2 combo |
| 2 | +3 combo |
| 3 | +4 combo |
| 4 | +5 combo |

| Lv | Branch A: "Cascade" | Branch B: "Echo" |
|---|---|---|
| 5 | +6 combo, cleared lines grant +1 score each | +5 combo, 1-in-3 chance charge not consumed |
| 6 | +7, +2 score per line | +6, 1-in-3 chance |
| 7 | +8, +3 score per line | +7, 1-in-2 chance |
| 8 | +9, +4 score per line | +8, 1-in-2 chance |
| 9 | +10, +5 score per line, +1 cube per use | +9, 2-in-3 chance, +1 free move on proc |
| **10** | **+12 combo, +6 score/line, +1 charge to ALL active bonus skills** | **+10 combo, charge NEVER consumed, +2 free moves on use** |

**Cascade**: Big combo → big score engine. Rewards high line clears.  
**Echo**: Sustain. Charges last the whole run. Rewards consistent play.

> Note: "Chance charge not consumed" is deterministic from seed: `poseidon(seed, move_count, 'ECHO') % 3 < echo_threshold`.

### 4.2 Score

*Instantly adds bonus score. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | +5 score |
| 1 | +8 score |
| 2 | +12 score |
| 3 | +18 score |
| 4 | +25 score |

| Lv | Branch A: "Momentum" | Branch B: "Precision" |
|---|---|---|
| 5 | +30 score, +1 combo | +30 score, doubles if ≤ 5 moves remaining |
| 6 | +35, +1 combo | +35, doubles if ≤ 5 moves |
| 7 | +40, +2 combo | +42, doubles if ≤ 7 moves |
| 8 | +50, +2 combo | +50, doubles if ≤ 7 moves |
| 9 | +60, +3 combo, +1 cube per use | +60, doubles if ≤ 10 moves, +1 cube per use |
| **10** | **+80 score, +4 combo, score ÷10 also awarded as cubes** | **+80 score, TRIPLES if ≤ 10 moves remaining, +2 cubes/use** |

**Momentum**: Score + combo synergy. Enables chain reactions.  
**Precision**: Clutch finisher. Save it for the end of tight levels.

### 4.3 Harvest

*Destroys all blocks of a chosen size, earns cubes per block. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | +1 cube per block destroyed |
| 1 | +1 cube, +2 adjacent same-size blocks also destroyed |
| 2 | +2 cubes per block |
| 3 | +2 cubes, +3 adjacent |
| 4 | +3 cubes per block |

| Lv | Branch A: "Excavator" | Branch B: "Prospector" |
|---|---|---|
| 5 | +3 cubes, also destroys ±1 size blocks | +4 cubes, only targets size 1-2 |
| 6 | +4, ±1 size | +5, size 1-2 |
| 7 | +5, ±1 size | +6, size 1-2, +1 score per block |
| 8 | +6, ±1 size, +1 score per block | +8, size 1-2, +2 score per block |
| 9 | +8, ±1 size, +2 score, triggers gravity+line check | +10, size 1-2, +3 score, +1 free move |
| **10** | **+10 cubes, destroys ±2 sizes, gravity+line cascade, +3 score/block** | **+15 cubes (size 1-2), +5 score/block, +2 free moves** |

**Excavator**: Area-of-effect. Picks a size, wipes the neighborhood.  
**Prospector**: Maximum cube farming from small blocks.

### 4.4 Wave

*Clears entire horizontal rows. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | Clear 1 row |
| 1 | Clear 1 row, +1 score per block in row |
| 2 | Clear 2 rows |
| 3 | Clear 2 rows, +2 score per block |
| 4 | Clear 3 rows |

| Lv | Branch A: "Tsunami" | Branch B: "Ripple" |
|---|---|---|
| 5 | Clear 3 rows bottom-up, +3 score/block | Clear 2 rows, +1 free move |
| 6 | 4 rows bottom-up, +3 score/block | 2 rows, +2 free moves |
| 7 | 4 rows, +4 score/block | 3 rows, +2 free moves |
| 8 | 5 rows, +5 score/block | 3 rows, +3 free moves |
| 9 | 5 rows, +6 score/block, +1 cube per row | 4 rows, +3 free moves, +1 combo |
| **10** | **6 rows, +8 score/block, +2 cubes/row, auto-add 1 free line after** | **5 rows, +4 free moves, +2 combo, 50% charge not consumed** |

**Tsunami**: Mass clear + score engine. Nukes the board.  
**Ripple**: Tempo. Fewer rows but generates free moves.

### 4.5 Supply

*Adds new lines at no move cost. Consumes 1 charge.*

| Lv | Core Effect |
|---|---|
| 0 | Add 1 line |
| 1 | Add 1 line, -1 difficulty tier |
| 2 | Add 2 lines |
| 3 | Add 2 lines, -1 difficulty tier |
| 4 | Add 3 lines |

| Lv | Branch A: "Stockpile" | Branch B: "Overflow" |
|---|---|---|
| 5 | 3 lines, -2 difficulty tiers | 3 lines, +2 score per line added |
| 6 | 4 lines, -2 tiers | 3 lines, +3 score |
| 7 | 4 lines, -3 tiers | 4 lines, +4 score |
| 8 | 5 lines, -3 tiers | 4 lines, +5 score, +1 cube |
| 9 | 5 lines, VeryEasy always, +1 free move | 5 lines, +6 score, +2 cubes |
| **10** | **6 lines VeryEasy, +2 free moves, lines pre-arranged for clears** | **6 lines, +8 score/line, +3 cubes, lines count as constraint progress** |

**Stockpile**: Guaranteed easy fills. Reliable line material.  
**Overflow**: Supply = score engine. More lines = more points.

---

## 5. World Skills (Passive) — Full Level Tables

World skills are always active once drafted. No charges, no manual trigger.

### 5.1 Tempo

*Extra max moves per level.*

| Lv | Core | Branch A: "Marathon" | Branch B: "Sprint" |
|---|---|---|---|
| 0 | +1 max move/level | | |
| 1 | +2 | | |
| 2 | +3 | | |
| 3 | +4 | | |
| 4 | +5 | | |
| 5 | | +7 moves | +5 moves, every 3rd line clear refunds 1 move |
| 6 | | +9 | +5, every 2nd clear refunds |
| 7 | | +11 | +6, every 2nd |
| 8 | | +14 | +7, every 2nd, +1 score per refund |
| 9 | | +18 | +8, every 2nd, +2 score per refund |
| **10** | | **+25 moves** | **+10, EVERY clear refunds 1 move, +3 score/refund** |

**Marathon**: Raw extra moves. Simple, reliable.  
**Sprint**: Move efficiency. Rewards consistent line clearing.

### 5.2 Fortune

*Bonus cubes per level completion.*

| Lv | Core | Branch A: "Midas" | Branch B: "Jackpot" |
|---|---|---|---|
| 0 | +1 cube/level | | |
| 1 | +1 | | |
| 2 | +2 | | |
| 3 | +2 | | |
| 4 | +3 | | |
| 5 | | +4, +1 cube per 5 lines cleared in level | +3, double cubes on 3-star levels |
| 6 | | +5, +1 per 4 lines | +4, double on 3-star |
| 7 | | +6, +1 per 3 lines | +5, double on 2-star+ |
| 8 | | +8, +1 per 3 lines | +6, double on 2-star+ |
| 9 | | +10, +2 per 3 lines | +8, triple on 3-star, double on 2-star |
| **10** | | **+15 cubes/level, +3 per 2 lines** | **+12 cubes/level, 4× on 3-star, 3× on 2-star** |

**Midas**: Consistent cube income. Scales with line count.  
**Jackpot**: Star-gated multiplier. Rewards clean play.

### 5.3 Surge

*Score multiplier on all points earned.*

| Lv | Core | Branch A: "Amplify" | Branch B: "Crescendo" |
|---|---|---|---|
| 0 | +5% score | | |
| 1 | +8% | | |
| 2 | +12% | | |
| 3 | +16% | | |
| 4 | +20% | | |
| 5 | | +25% flat | +20%, +2% per level completed this run |
| 6 | | +30% | +20%, +3% per level |
| 7 | | +35% | +20%, +4% per level |
| 8 | | +40% | +22%, +5% per level |
| 9 | | +50% | +25%, +6% per level (up to +325% at L50) |
| **10** | | **+75% flat** | **+30%, +8% per level (up to +430% at L50)** |

**Amplify**: Flat, reliable multiplier.  
**Crescendo**: Weak early, insane late. Rewards long runs.

### 5.4 Catalyst

*Lowers combo-cube thresholds (normally 4 lines → +1 cube, etc.).*

| Lv | Core | Branch A: "Ignition" | Branch B: "Fusion" |
|---|---|---|---|
| 0 | -1 line for combo-cube thresholds | | |
| 1 | -1 | | |
| 2 | -1, +1 bonus cube on combo rewards | | |
| 3 | -1, +1 | | |
| 4 | -2 line threshold | | |
| 5 | | -2, +2 bonus cubes | -2, combo cubes also grant +1 score each |
| 6 | | -2, +3 | -2, +2 score |
| 7 | | -3, +3 | -2, +3 score |
| 8 | | -3, +4 | -3, +4 score |
| 9 | | -3, +5, double cubes on 6+ line clear | -3, +5 score, +1 free move on combo reward |
| **10** | | **-4, +7 cubes, 3× cubes on 5+ line clear** | **-4, +7 score/combo reward, +2 free moves on combo reward** |

**Ignition**: Maximum cube yield from combos.  
**Fusion**: Combo cubes → score + tempo engine.

### 5.5 Resilience

*Free moves that don't count against the level move limit.*

| Lv | Core | Branch A: "Iron Will" | Branch B: "Second Wind" |
|---|---|---|---|
| 0 | +1 free move/level | | |
| 1 | +1 | | |
| 2 | +2 | | |
| 3 | +2 | | |
| 4 | +3 | | |
| 5 | | +4 free moves | +3, regain 1 on 3+ line clear |
| 6 | | +5 | +3, regain on 2+ clear |
| 7 | | +6 | +4, regain on 2+ |
| 8 | | +7 | +4, regain on any clear |
| 9 | | +9 | +5, regain on any clear, +1 score per free move used |
| **10** | | **+12 free moves** | **+6, regain 2 on any clear, +2 score per free move used** |

**Iron Will**: Raw free moves. Brute-force safety.  
**Second Wind**: Regenerating free moves. Rewards consistent play.

### 5.6 Focus

*Bonus constraint progress per qualifying action.*

| Lv | Core | Branch A: "Discipline" | Branch B: "Shortcut" |
|---|---|---|---|
| 0 | +1 bonus constraint progress on qualifying action | | |
| 1 | +1 | | |
| 2 | +1, +1 score when constraint progresses | | |
| 3 | +2 | | |
| 4 | +2, +2 score | | |
| 5 | | +3 progress, +3 score | +2, constraints start 25% pre-filled |
| 6 | | +3, +4 score | +2, 30% pre-filled |
| 7 | | +4, +5 score | +3, 35% pre-filled |
| 8 | | +4, +6 score | +3, 40% pre-filled |
| 9 | | +5, +8 score, +1 cube per constraint completed | +4, 50% pre-filled, +1 cube per constraint |
| **10** | | **+6 progress, +10 score, +2 cubes/constraint** | **+5, 60% pre-filled, +2 cubes/constraint** |

**Discipline**: Progress faster, score while doing it.  
**Shortcut**: Start with constraints partially done.

### 5.7 Expansion

*Generated lines are easier (lower difficulty tier).*

| Lv | Core | Branch A: "Simplify" | Branch B: "Sculpt" |
|---|---|---|---|
| 0 | -1 difficulty tier on generated lines | | |
| 1 | -1 | | |
| 2 | -1, +1 score per line added | | |
| 3 | -2 tiers | | |
| 4 | -2, +1 score | | |
| 5 | | -3 tiers | -2, guaranteed 1 gap per line |
| 6 | | -3, +2 score per line | -2, 2 guaranteed gaps |
| 7 | | -4 tiers | -3, 2 gaps |
| 8 | | -4, +3 score | -3, 2 gaps, +1 cube per 10 lines |
| 9 | | -5 (VeryEasy cap), +4 score, +1 cube/level | -3, 3 gaps, +2 cubes per 10 lines |
| **10** | | **-6 tiers (VeryEasy cap), +5 score/line, +2 cubes/level** | **-4, 4 gaps/line, +3 cubes per 10 lines** |

**Simplify**: Raw difficulty reduction.  
**Sculpt**: Controlled gaps — shape the grid yourself.

### 5.8 Momentum

*Consecutive line clears (clearing on consecutive moves) grant bonus.*

| Lv | Core | Branch A: "Streak" | Branch B: "Blitz" |
|---|---|---|---|
| 0 | +1 score per consecutive clear | | |
| 1 | +1 | | |
| 2 | +2 per consecutive | | |
| 3 | +2 | | |
| 4 | +3 | | |
| 5 | | +4, streak of 3+ grants +1 cube | +3, streak resets 1 used move (-1 level_moves) |
| 6 | | +5, +1 cube | +4, -1 move |
| 7 | | +6, streak 3+ grants +2 cubes | +5, -1 move, +1 combo on streak 3+ |
| 8 | | +8, +2 cubes | +6, -2 moves, +1 combo |
| 9 | | +10, +3 cubes, streak 5+ clears a free row | +8, -2 moves, +2 combo |
| **10** | | **+12 score, +4 cubes on 3+, streak 5+ clears 2 free rows** | **+10, -3 moves, +3 combo on streak 3+** |

**Streak**: Cube engine from consecutive clears.  
**Blitz**: Move refund + combo generation. Tempo machine.

### 5.9 Adrenaline

*Risk/reward — bonus when grid is high (>= filled_rows threshold).*

| Lv | Core | Branch A: "Daredevil" | Branch B: "Controlled Burn" |
|---|---|---|---|
| 0 | +2 score per line cleared at >= 7 rows | | |
| 1 | +3 | | |
| 2 | +4 | | |
| 3 | +5 | | |
| 4 | +6, +1 cube per clear at >= 7 | | |
| 5 | | +8, +2 cubes at >= 7 | +6, grid >= 8 → double combo value |
| 6 | | +10, +2 cubes | +7, >= 8 → double |
| 7 | | +12, +3 cubes at >= 7 | +8, >= 7 → double combo |
| 8 | | +15, +3 cubes | +10, >= 7 → double, +1 free move |
| 9 | | +20, +4 cubes, +1 free move at >= 8 | +12, >= 7 → triple combo, +2 free moves |
| **10** | | **+25 score, +6 cubes at ≥7, +2 free moves at ≥8** | **+15, ≥7 → 4× combo, +3 free moves** |

**Daredevil**: Play dangerously, earn big cubes.  
**Controlled Burn**: Amplify combos by riding high.

### 5.10 Legacy

*Power scales with run progress (levels completed this run).*

| Lv | Core | Branch A: "Veteran" | Branch B: "Collector" |
|---|---|---|---|
| 0 | +1 score per 5 levels cleared this run | | |
| 1 | +1 per 4 levels | | |
| 2 | +1 per 3 levels | | |
| 3 | +2 per 3 levels | | |
| 4 | +2 per 3, +1 cube per 10 levels | | |
| 5 | | +3 per 3 levels, +1 cube per 5 | +2 per 3, +1 score per unique skill in loadout |
| 6 | | +3, +2 cubes per 5 levels | +2, +1 per unique skill |
| 7 | | +4, +2 cubes per 5 | +3, +2 per unique skill |
| 8 | | +5, +3 cubes per 5 | +3, +2 per skill, +1 free move per 10 levels |
| 9 | | +6 per 2 levels, +4 cubes per 5, +1 free move | +4, +3 per unique skill, +2 free moves per 10 levels |
| **10** | | **+8 per 2 levels, +6 cubes per 5, +2 free moves per 10** | **+5/level, +4 per skill, +3 free moves per 10 levels** |

**Veteran**: Late-run scaling. Rewards going deep.  
**Collector**: Diversity bonus. Rewards a varied loadout.

---

## 6. Draft System (Revised)

### 6.1 Single Pool

All 15 skills are in one pool. Each draft event draws 3 random cards from the pool.

- **Randomness**: Deterministic from `poseidon(game_seed, 'DRAFT', event_slot, reroll_count)`.
- **No duplicates in one draw**: The 3 cards are always 3 distinct skills.
- **No gating**: All 15 skills are always available regardless of zone, boss clears, or progression.

### 6.2 Draft Flow

```
LEVEL COMPLETE
    │
    ▼
IS THIS A DRAFT TRIGGER?
(post-level-1 / zone-micro / post-boss)
    │ yes
    ▼
DRAW 3 CARDS from 15-skill pool
    │
    ▼
PLAYER SEES 3 CARDS
    │
    ├── REROLL any card (shared cost counter)
    │   └── New card drawn for that slot
    │
    └── PICK ONE CARD
            │
            ├── Slots < 5? → Add skill at skill tree level
            │                 (or +1 if already owned)
            │
            └── Slots = 5? → +1 level to one existing skill
                              (3 cards = 3 different upgrade targets)
```

### 6.3 Slot-Full Behavior

When all 5 run slots are occupied:

- The 3 draft cards become **upgrade offers**: each targets a different active skill.
- Drawn from your 5 active skills (3 of the 5 are randomly selected).
 Picking one gives +1 run level to that skill (capped at 10).
- Rerolling replaces the upgrade target with a different one of your 5.

### 6.4 Run Level vs Tree Level

- **Tree level**: Persistent. Bought with cubes. Determines starting floor.
- **Run level**: Per-run. Starts at tree level. Draft picks and upgrades increase it.
 **Cap**: 10. Tree max is 9, but draft upgrades can push to 10 ("Maximum Joy" — draft-only tier).

Example: Player has Combo at tree level 3.
1. Draft offers Combo → enters run at level 3.
2. Later draft offers Combo again (duplicate) → run level becomes 4.
3. Another Combo draft (after slots full) → run level becomes 5.

### 6.5 Draft Trigger Timing (Unchanged)

| Type | Trigger | Event Slot | Per Run |
|---|---|---|---|
| `post_level_1` | After clearing level 1 | 0 | 1 |
| `zone_micro` | Seeded random level per zone (2..8 within zone) | zone (1-5) | ~5 |
| `post_boss` | After boss levels 10/20/30/40 | 5 + zone | 4 |
| **Total** | | | **~9-10** |

### 6.6 Reroll System

**Shared counter**. One reroll counter per draft event, not per card slot.

**Formula**: `cost(n) = 5 * 3^(n-1)` where `n` = reroll number (1-indexed).

| Reroll # | Cost | Cumulative | Context |
|---|---|---|---|
| 1 | 5 | 5 | Trivial — single level clear |
| 2 | 15 | 20 | Noticeable |
| 3 | 45 | 65 | Serious investment (~2/3 daily quests) |
| 4 | 135 | 200 | Wall — more than a full day of quests |
| 5 | 405 | 605 | Desperation |
| 6 | 1215 | 1820 | Functionally impossible |

**Implementation** (Cairo):
```cairo
fn reroll_cost(reroll_count: u8) -> u16 {
    let mut cost: u16 = 5;
    let mut i: u8 = 0;
    loop {
        if i >= reroll_count { break; }
        cost = cost * 3;
        i += 1;
    };
    cost
}
```

**Rules:**
- Reroll replaces one of the 3 cards (player picks which card to reroll).
- Counter is shared: rerolling card 1 then card 2 costs 5 then 15.
- Counter resets per draft event.
- Reroll burns cubes from wallet (ERC-20 burn).

---

## 7. Run Economy (Revised)

### Charge System (Bonus Skills Only)

Bonus skills consume charges. World skills are passive (no charges).

**Charge Sources:**
- High line clears (3+ lines = +1 charge to a random active bonus)
- Combo streak milestones (5+ combo = +1 charge)
- Constraint completion rewards (+1 charge)
- Boss rewards (+2 charges, distributed)
- Level completion (3-star = +1 charge)

**No purchasing charges. Performance only.**

### Cube Usage (Revised)

| Usage | Source | Destination |
|---|---|---|
| Skill tree upgrades | Wallet (burn) | Persistent progression |
| Draft rerolls | Wallet (burn) | Better draft options |
| Branch respec | Wallet (burn) | Change specialization |

**Removed:**
- In-game shop (charges, level-up, swap)
- Starting bonus charges
- Bag size upgrades
- Bridging rank / bringing cubes into run
- Permanent shop entirely (replaced by skill tree)

---

## 8. Data Model

### 8.1 New Model: `PlayerSkillTree`

Persistent per-player. Stores skill tree progression.

```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct PlayerSkillTree {
    #[key]
    pub player: ContractAddress,
    /// Packed skill data: 15 skills × (4 bits level + 1 bit branch_chosen + 1 bit branch_id) = 90 bits
    pub skill_data: felt252,
}
```

**Bit layout per skill (6 bits):**
| Bits | Field | Size | Range |
|---|---|---|---|
| 0-3 | level | 4 | 0-9 |
| 4 | branch_chosen | 1 | 0=no, 1=yes |
| 5 | branch_id | 1 | 0=A, 1=B |

**Total**: 15 skills × 6 bits = 90 bits. Fits in one felt252.

**Skill ID mapping**: skill_data bits `[id*6 .. id*6+5]` for skill ID 0-14.

### 8.2 Revised Model: `DraftState`

Per-game (per-run). Single pool, shared reroll counter.

```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct DraftState {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
    pub active: bool,
    pub event_slot: u8,          // Which draft event (0-9)
    pub event_type: u8,          // 1=post_level_1, 2=post_boss, 3=zone_micro
    pub trigger_level: u8,       // Level that triggered this draft
    pub zone: u8,                // Current zone (1-5)
    pub choice_1: u8,            // Skill ID (1-15) for card 1
    pub choice_2: u8,            // Skill ID (1-15) for card 2
    pub choice_3: u8,            // Skill ID (1-15) for card 3
    pub reroll_count: u8,        // Shared reroll counter
    pub spent_cubes: u16,        // Total cubes spent on rerolls this draft
    pub completed_mask: u16,     // Bitmask of completed event slots
    pub selected_picks: felt252, // Historical picks (packed)
    pub selected_slot: u8,       // Which card was selected (0-2)
    pub selected_choice: u8,     // Which skill ID was selected
}
```

**Key changes from current:**
- `choice_1/2/3` are now `u8` (skill IDs 1-15), not `u16` (encoded choice codes).
- Single `reroll_count` replaces `reroll_1/2/3`.
- No more `reroll_1/2/3` per-slot counters.

### 8.3 Revised: `run_data` Bit Layout

The 5-slot loadout with run levels replaces the old 3-bonus system.

**New fields needed:**
- 5 skill slots: skill ID (4 bits each) + run level (4 bits each) = 40 bits
- Active slot count (3 bits, 0-5)
- Free moves (4 bits, 0-15 — expanded from 3 bits)
- Charge counts per bonus slot: 5 × 8 bits = 40 bits (only bonus-type skills use charges)

**Fields to remove:**
- `selected_bonus_1/2/3` (3×3 bits)
- `bonus_1/2/3_level` (3×2 bits)
- `combo/score/harvest/wave/supply_count` (5×8 bits)
- `last_shop_level`, `shop_purchases`, `unallocated_charges`, `shop_level_up_bought`, `shop_swap_bought`, `boss_level_up_pending`

**Proposed new run_data layout:**

| Bits | Field | Size | Description |
|---|---|---|---|
| 0-7 | current_level | 8 | Current level (1-255) |
| 8-15 | level_score | 8 | Score this level |
| 16-23 | level_moves | 8 | Moves used this level |
| 24-31 | constraint_progress | 8 | Primary constraint |
| 32-39 | constraint_2_progress | 8 | Secondary constraint |
| 40-47 | constraint_3_progress | 8 | Tertiary constraint |
| 48 | bonus_used_this_level | 1 | For NoBonusUsed |
| 49-56 | max_combo_run | 8 | Best combo this run |
| 57-72 | total_cubes | 16 | Earned cubes |
| 73-88 | total_score | 16 | Cumulative score |
| 89 | run_completed | 1 | Victory flag |
| 90-93 | free_moves | 4 | Free moves (0-15) |
| 94 | no_bonus_constraint | 1 | NoBonusUsed active |
| 95-97 | active_slot_count | 3 | Filled slots (0-5) |
| 98-101 | slot_1_skill | 4 | Skill ID (1-15, 0=empty) |
| 102-105 | slot_1_level | 4 | Run level (0-10) |
| 106-109 | slot_2_skill | 4 | |
| 110-113 | slot_2_level | 4 | Run level (0-10) |
| 114-117 | slot_3_skill | 4 | |
| 118-121 | slot_3_level | 4 | Run level (0-10) |
| 122-125 | slot_4_skill | 4 | |
| 126-129 | slot_4_level | 4 | Run level (0-10) |
| 130-133 | slot_5_skill | 4 | |
| 134-137 | slot_5_level | 4 | Run level (0-10) |
| 138-145 | slot_1_charges | 8 | Charges (bonus skills only) |
| 146-153 | slot_2_charges | 8 | |
| 154-161 | slot_3_charges | 8 | |
| 162-169 | slot_4_charges | 8 | |
| 170-177 | slot_5_charges | 8 | |
| 178-251 | reserved | 74 | Future use |

**Total: 178 bits used** (vs 195 currently). Fits in felt252 (252 bits).

### 8.4 Model: `PlayerMeta` Changes

`PlayerMeta.data` loses the permanent shop fields:
- Remove: `starting_combo/score/harvest/wave/supply` (10 bits)
- Remove: `bag_combo/score/harvest/wave/supply_level` (20 bits)
- Remove: `bridging_rank` (4 bits)
- Remove: `wave_unlocked`, `supply_unlocked` (2 bits)
- Keep: `total_runs` (16 bits), `total_cubes_earned` (32 bits)

These are all replaced by `PlayerSkillTree`.

---

## 9. Contract System Changes

### 9.1 New System: `skill_tree_system`

```cairo
trait ISkillTreeSystem {
    /// Upgrade a skill's core level (levels 1-4)
    fn upgrade_skill(ref self: T, skill_id: u8);

    /// Choose a branch at level 5 (branch: 0=A, 1=B)
    fn choose_branch(ref self: T, skill_id: u8, branch: u8);

    /// Upgrade a branch level (levels 5-9)
    fn upgrade_branch(ref self: T, skill_id: u8);

    /// Respec a branch (costs cubes, resets to level 4)
    fn respec_branch(ref self: T, skill_id: u8);

    /// Read skill tree data
    fn get_skill_level(self: @T, player: ContractAddress, skill_id: u8) -> (u8, bool, u8);
}
```

### 9.2 Revised System: `draft_system`

```cairo
trait IDraftSystem {
    /// Called after level completion. Opens draft if trigger matches.
    fn maybe_open_after_level(ref self: T, game_id: u64, completed_level: u8, player: ContractAddress);

    /// Reroll a card slot (shared counter). Burns cubes.
    fn reroll(ref self: T, game_id: u64, card_slot: u8);

    /// Pick a card. Adds/upgrades skill in run loadout.
    fn select(ref self: T, game_id: u64, card_slot: u8);
}
```

**Key logic changes in `select`:**
1. Read `PlayerSkillTree` for the selected skill's tree level + branch.
2. Check if skill already in run loadout:
   - **Not present + slots < 5**: Add to next empty slot at tree level.
   - **Not present + slots = 5**: This shouldn't happen in slot-full mode (cards are upgrades). Assert.
   - **Already present**: +1 to that slot's run level (cap 10).
3. Update `run_data` with new slot state.

**Key logic changes in `maybe_open_after_level`:**
1. Draw 3 distinct skill IDs from `poseidon(seed, event_slot, reroll_count)`.
2. If slots < 5: draw from full 15-skill pool.
3. If slots = 5: draw 3 from the player's 5 active skills (upgrade mode).

### 9.3 Removed Systems

- **`shop_system`**: Entirely replaced by `skill_tree_system` (persistent) and draft (in-run).
- **In-game shop flow**: No more `purchase_consumable`, `allocate_charge`, `swap_bonus`.

### 9.4 Modified Systems

- **`game_system`**: Remove shop-related logic from `create()`. Remove `purchase_consumable()`. Game starts with empty loadout (5 empty slots).
- **`bonus_system` / `moves_system`**: Read active skills from new `run_data` layout instead of old bonus fields. Apply world skill effects during move resolution.
- **`level_system`**: Charge distribution on level complete comes from active bonus-type skills in loadout.

---

## 10. Frontend Changes

### 10.1 New Pages

- **`SkillTreePage`**: Replaces `ShopPage`. Shows 15 skills in a grid/tree layout. Tap a skill to see branch details. Upgrade buttons with cube costs.

### 10.2 Revised Pages

- **`DraftPage`**: Single pool UI. 3 cards, each showing skill name + level + branch effect. One reroll button per card with shared escalating cost. "Choose" button per card.
- **`MapPage`**: Draft events show skill icons instead of pool-specific indicators.
- **`PlayScreen`**: ActionBar shows up to 5 skill slots (bonus-type have charge counts, world-type show passive indicator). Loadout section replaces old 3-bonus layout.

### 10.3 Removed Pages

- **`InGameShopPage`**: No longer exists.
- **`LoadoutPage`**: No pre-run selection (loadout is built via draft).

### 10.4 New/Revised Hooks

- **`useSkillTree({ player })`**: Reads `PlayerSkillTree` model. Returns skill levels, branches.
- **`useDraft({ gameId })`**: Updated to handle single-pool, shared reroll, 5-slot logic.
- **`useRunLoadout({ gameId })`**: Extracts 5 active skill slots + run levels from `run_data`.

### 10.5 Navigation Flow Change

```
HOME → PLAY GAME → MAP → PLAY
                     ↑
                   DRAFT (triggered by level completion)
                     ↑
               LEVEL COMPLETE
```

No more Loadout → Map. Player goes straight to map, builds loadout via drafts.

---

## 11. Synergies & Design Space

The unified pool creates emergent synergies:

| Combo | Synergy |
|---|---|
| Combo (Cascade) + Surge (Amplify) | Big combos → big score → multiplied |
| Harvest (Prospector) + Fortune (Midas) | Cubes from harvesting + cubes from line clearing |
| Wave (Ripple) + Resilience (Second Wind) | Wave gives free moves, Resilience regenerates them |
| Adrenaline (Daredevil) + Supply (Stockpile) | Play high, supply easy lines to clear under pressure |
| Legacy (Collector) + 5 diverse skills | Collector rewards unique skill diversity |
| Momentum (Blitz) + Tempo (Sprint) | Both reward consecutive clears — move refund machine |
| Focus (Shortcut) + Catalyst (Fusion) | Constraints easier + combos give score + tempo |
| Score (Precision) + Resilience (Iron Will) | Save Score for last moves, free moves extend window |

---

## 12. Balance Levers

| Lever | Current Default | Adjustable Via |
|---|---|---|
| Skills in pool | 15 | Code (add new skills) |
| Draft events per run | ~9-10 | Zone micro trigger range |
| Max run slots | 5 | GameSettings |
| Skill level cap | 9 | Code constant |
| Branch point | Level 5 | Code constant |
| Reroll base cost | 5 | GameSettings |
| Reroll multiplier | 3x | GameSettings |
| Skill tree costs | 50/100/250/500/1000/2000/4000/8000/10000 | Code (array) |
| Branch respec cost | 50% of branch investment | Code constant |
| Charge gain rates | Per-action grants | GameSettings |

---

## 13. Implementation Plan

### Phase 1: Data Model + Skill Tree

1. Create `PlayerSkillTree` model
2. Create `skill_tree_system` (upgrade, branch, respec)
3. Revise `run_data` bit layout for 5-slot loadout
4. Update packing/unpacking helpers

### Phase 2: Draft Revision

5. Revise `DraftState` model (single pool, shared reroll)
6. Revise `draft_system` (single pool draw, slot-full upgrade mode)
7. Update `maybe_open_after_level` trigger logic (remove gating)
8. Update reroll to shared counter with `5 * 3^(n-1)` cost

### Phase 3: Skill Effect Implementation

9. Implement 5 bonus skill effects (core + branches) at all 10 levels
10. Implement 10 world skill effects (passive modifiers in move/level logic)
11. Charge distribution system for bonus-type skills
12. World skill hooks in `moves_system`, `bonus_system`, `level_system`

### Phase 4: Cleanup + Frontend

13. Remove `shop_system` from active run path
14. Remove in-game shop logic
15. Simplify `PlayerMeta` (remove shop fields)
16. Frontend: `SkillTreePage`, revised `DraftPage`, revised `PlayScreen`
17. Frontend: Remove `LoadoutPage`, `InGameShopPage`

### Phase 5: Balance + Test

18. Cairo tests for all 15 skill effects at key levels
19. Test draft flow (< 5 slots, = 5 slots, rerolls, edge cases)
20. Balance pass: charge rates, skill scaling, reroll costs
21. Playtest: median run outcomes, power spike timing, branch viability

---

## 14. Open Questions

1. **Charge distribution**: Exactly how are charges distributed on line clear / combo / boss clear? Random across active bonus skills? Player chooses?
2. **Branch visibility in draft**: When a draft card shows a skill, does it show the branch effect (if player has chosen a branch)? Or just the core level?
3. **Skill tree UI layout**: Grid of 15 tiles? Or grouped into Bonus (5) and World (10) sections?
4. **Deterministic "chance" effects**: Echo's "charge not consumed" needs deterministic randomness. Confirm: `poseidon(seed, move_count, skill_id) % denominator < threshold`?
5. **Respec frequency**: Should respec be limited (e.g., once per day) or just expensive?
