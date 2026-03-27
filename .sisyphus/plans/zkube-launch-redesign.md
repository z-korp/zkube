# zKube Launch Redesign — Implementation Plan

> **Status:** Final — All decisions locked
> **Date:** 2026-03-27
> **Scope:** Full game redesign from 50-level roguelite to fast zone-based score-survival
> **Target Namespace:** `zkube_budo_v1_3_0` (new world alongside v1.2)
> **Alpha policy:** All content unlocked, no gating, no monetization

---

## Executive Summary

Redesign zKube from a 50-level progression-heavy roguelite into a **fast, fair, skill-first puzzle score-survival game** with 10-level themed zones, endless mode, theme-bound mutators, and stars as the sole progression signal. **No skills, no draft, no skill trees, no cubes, no economy.** Roguelike feel comes from seed variation, theme identity, mutators, and endless pressure.

### Locked Decisions

| Decision | Answer |
|----------|--------|
| **Cubes** | **Fully removed.** No ERC20 minting/burning in v1.3. Stars are the only reward. |
| **Zones for alpha** | **3 zones:** Polynesian (theme-1), Feudal Japan (theme-5), Ancient Persia (theme-7) |
| **Content gating** | **None for alpha.** All 3 zones open. Monetization deferred. |
| **Mutators** | **Affect both level generation AND scoring.** Most flexible. |
| **Constraints** | **Keep 4 types:** ComboLines, BreakBlocks, ComboStreak, KeepGridBelow. Remove FillAndClear + NoBonusUsed. |
| **Daily rewards** | **Stars + leaderboard.** Bonus stars for participation/placement. |
| **NFT** | **Keep free mint.** game_id = token_id pattern stays. |
| **Skills/Draft/SkillTree** | **Removed.** |
| **Quest system** | **Deferred.** Not in v1.3. |
| **Score type** | **u32.** Endless will exceed u16. |
| **Mutator assignment** | **Deterministic from seed** for normal runs. **Admin-set** for daily. |
| **Auto-advance** | **Same-tx.** No `start_next_level`. Frontend overlay for transition. |
| **Endless difficulty** | **Linear pressure increase.** Points ratio rises, difficulty caps at Master. |
| **Daily attempts** | **Unlimited, best score counts, free entry.** |
| **Leaderboard** | **Depth first, score second.** Composite encoding. |

### Core Product Shape
- **1 run = 1 themed zone = 10 levels + endless until death**
- **3 zones at alpha** (Polynesian, Feudal Japan, Ancient Persia) each with 3 native mutators
- **Daily challenge** with shared seed, fixed zone, fixed mutator — ranked by depth then score
- **Stars** for performance grading and progression (the ONLY reward signal)
- **Free mint NFT** to play (existing FullTokenContract)

### Strategy: New Namespace Fork
Deploy `zkube_budo_v1_3_0` alongside existing `zkube_budo_v1_2_0`. No migration of existing game data. Frontend env-based switching. Old world stays playable during transition.

---

## Part 1: Gap Analysis — Current vs. Desired

### Contract Systems

| # | System | Action | Notes |
|---|--------|--------|-------|
| 1 | `game_system` | **MODIFY** | New `create_run(game_id, zone_id)`. Remove cube/draft/skill deps. |
| 2 | `moves_system` | **MODIFY** | Auto-advance, no pending transition, remove skill/quest hooks. |
| 3 | `bonus_system` | **DELETE** | No active abilities. |
| 4 | `grid_system` | **MODIFY** | Remove skill hooks. Keep grid ops + mutator scoring hooks. |
| 5 | `level_system` | **MODIFY** | 10-level zone + endless (L11+), auto-advance, boss at L10 only. |
| 6 | `config_system` | **KEEP** | Add zone-specific GameSettings presets. |
| 7 | `skill_tree_system` | **DELETE** | No skills. |
| 8 | `draft_system` | **DELETE** | No draft. |
| 9 | `cube_token_system` | **EXCLUDE** | Remove from v1.3 lib.cairo. ERC20 stays deployed for v1.2. |
| 10 | `quest_system` | **DEFER** | Remove from v1.3 lib.cairo. Re-add post-launch. |
| 11 | `achievement_system` | **MODIFY** | Retune for zone/endless. Remove cube-related achievements. |
| 12 | `daily_challenge_system` | **MODIFY** | Add zone/mutator. Depth-then-score ranking. Stars reward. |
| 13 | `skill_effects_system` | **DELETE** | No skills. |
| 14 | `renderer_system` | **KEEP** | Update displayed stats if needed. |

### Data Models

| Model | Action | Notes |
|-------|--------|-------|
| `Game` | **MODIFY** | New RunData layout (no cubes, no skills). |
| `GameSeed` | **KEEP** | Seed persistence unchanged. |
| `GameLevel` | **KEEP** | Same schema — generated for 10+endless. |
| `PlayerMeta` | **MODIFY** | Remove cube tracking. Add best_depth. |
| `PlayerSkillTree` | **DELETE** | No skills. |
| `DraftState` | **DELETE** | No draft. |
| `GameSettings` | **KEEP** | Add zone-specific presets. |
| `DailyChallenge` | **MODIFY** | Add zone_id, mutator_mask. |
| `DailyEntry` | **MODIFY** | Add best_depth. Stars reward. |
| `DailyLeaderboard` | **MODIFY** | Composite depth-then-score value. |

### Frontend Pages

| Page | Action | Notes |
|------|--------|-------|
| `HomePage` | **MODIFY** | Zone selection (3 zones), daily entry, remove cube balance. |
| `PlayScreen` | **MODIFY** | Remove bonus buttons/skill display. Add mutator + endless depth. |
| `MapPage` | **MODIFY** | 10 nodes + boss + endless indicator per zone. |
| `QuestsPage` | **DEFER** | Hide from nav. |
| `MyGamesPage` | **KEEP** | Same. |
| `LeaderboardPage` | **MODIFY** | Tabs: Zone / Endless / Daily. Depth-then-score. |
| `SettingsPage` | **KEEP** | Same. |
| `TutorialPage` | **MODIFY** | Update for zone/mutator model. |
| `DraftPage` | **DELETE** | No draft. |
| `SkillTreePage` | **DELETE** | No skills. |
| `DailyChallengePage` | **MODIFY** | Zone + mutator + depth display + stars reward. |
| `InGameShopPage` | **DELETE** | Already deprecated. |
| `SettingsPresetsPage` | **MODIFY** | Add v1.3 zone presets. |

---

## Part 2: New RunData Layout

With no cubes, no skills, and no draft — RunData is dramatically simpler.

### New RunData Bit Layout (~96 bits)

```
Bits 0-7:     current_level (u8)         — 1-10 zone, 11+ endless
Bits 8-15:    level_score (u8)           — score within current level
Bits 16-23:   level_moves (u8)           — moves used this level
Bits 24-31:   constraint_progress (u8)   — primary constraint
Bits 32-39:   constraint_2_progress (u8) — secondary (boss)
Bits 40-47:   max_combo_run (u8)         — best combo this run
Bits 48-79:   total_score (u32)          — cumulative run score (u32 for endless)
Bit  80:      zone_cleared (bool)        — set when L10 boss beaten
Bits 81-88:   endless_depth (u8)         — levels past L10 (0-255)
Bits 89-92:   zone_id (u4)              — which zone (0-15)
Bits 93-100:  mutator_mask (u8)         — active mutator bits
                                           Total: ~101 bits
```

**Removed from current layout (saved ~33 bits):**
- total_cubes (16 bits) — no cubes
- active_slot_count + 3 × (skill_id + level + charges + branch) — no skills
- bonus_used_this_level, no_bonus_constraint — no bonuses
- free_moves, gambit_triggered, combo_surge_flow — skill-related flags
- level_transition_pending — no 2-step transition
- constraint_3_progress — max 2 constraints now

**Added:**
- total_score upgraded to u32 (32 bits, was u16)
- zone_cleared (1 bit)
- endless_depth (8 bits)
- zone_id (4 bits)
- mutator_mask (8 bits)

---

## Part 3: Constraint System (Simplified)

### Kept (4 types)
| Type | Mechanic | Why kept |
|------|----------|----------|
| **ComboLines** | Clear X lines in one move, Y times | Core combo skill expression |
| **BreakBlocks** | Destroy X blocks of size S | Encourages targeting specific blocks |
| **ComboStreak** | Reach combo counter of X | Rewards sustained combo chains |
| **KeepGridBelow** | Keep grid below X filled rows | Creates tension/danger management |

### Removed (2 types)
| Type | Why removed |
|------|-------------|
| **FillAndClear** | Complex, hard to read, rarely satisfying |
| **NoBonusUsed** | No bonuses exist in v1.3 — constraint is meaningless |

### Constraint Usage
- **Regular levels (L1-9):** 0-1 constraint, budget-based selection from the 4 types
- **Boss (L10):** 1-2 constraints, harder thresholds
- **Endless (L11+):** 0-1 constraint, increasing difficulty

---

## Part 4: Zone System

### Alpha Zones

| Zone ID | Theme | Theme ID | Visual Identity | Mutator Pool |
|---------|-------|----------|-----------------|-------------|
| 1 | Polynesian | `theme-1` | Teal ocean, moonlit coast | 3 mutators |
| 2 | Feudal Japan | `theme-5` | Red/black lacquer, cherry blossoms | 3 mutators |
| 3 | Ancient Persia | `theme-7` | Deep blue geometric, golden | 3 mutators |

### Zone Model
```cairo
#[dojo::model]
pub struct ZoneConfig {
    #[key]
    pub zone_id: u8,
    pub settings_id: u32,      // links to GameSettings
    pub theme_id: u8,          // maps to frontend theme (1, 5, 7)
    pub name: felt252,         // 'Polynesian', 'Feudal Japan', 'Ancient Persia'
    pub mutator_pool: u8,      // bitmask of available mutators for this zone
    pub enabled: bool,         // whether zone is playable
}
```

### Zone System Interface
```cairo
trait IZoneSystem<T> {
    fn register_zone(ref self: T, zone_id: u8, settings_id: u32, theme_id: u8, name: felt252, mutator_pool: u8);
    fn get_zone(self: @T, zone_id: u8) -> ZoneConfig;
}
```

---

## Part 5: Mutator System

Mutators affect **both level generation AND scoring**. Each zone has 3 native mutators.

### Mutator Model
```cairo
#[dojo::model]
pub struct MutatorDef {
    #[key]
    pub mutator_id: u8,
    pub name: felt252,
    pub zone_id: u8,           // which zone owns this mutator
    // Generation effects (applied in level.cairo)
    pub moves_modifier: i8,    // +/- moves per level (signed offset)
    pub ratio_modifier: i8,    // +/- points ratio ×100 offset
    pub difficulty_offset: i8, // shift difficulty tier up/down
    // Scoring effects (applied in grid/scoring)
    pub combo_score_mult_x100: u16, // combo score multiplier (100 = 1.0×)
    pub star_threshold_modifier: i8, // shift star thresholds (easier/harder stars)
    pub endless_ramp_mult_x100: u16, // endless difficulty ramp rate (100 = normal)
}
```

### Proposed Alpha Mutators (9 total)

**Zone 1 — Polynesian (Tidal):**
| ID | Name | Generation | Scoring |
|----|------|-----------|---------|
| 1 | Riptide | -2 moves per level | Combo clears score +50% |
| 2 | Coral Calm | +3 moves per level | Star thresholds tightened (need more efficiency) |
| 3 | Moonrise | Difficulty +1 tier | Endless ramps 30% slower |

**Zone 2 — Feudal Japan (Blade):**
| ID | Name | Generation | Scoring |
|----|------|-----------|---------|
| 4 | Bushido | -3 moves per level | All line clears score +30% |
| 5 | Sakura | Normal generation | 4+ combo chains score double |
| 6 | Shogun | Difficulty +2 tiers | Star thresholds relaxed (easier stars) |

**Zone 3 — Ancient Persia (Mosaic):**
| ID | Name | Generation | Scoring |
|----|------|-----------|---------|
| 7 | Precision | +0 moves, ratio +20% | Efficient clears (≤50% moves) earn bonus score |
| 8 | Symmetry | Normal generation | Consecutive same-size block clears score +40% |
| 9 | Mirage | -2 moves, difficulty -1 tier | Endless starts 2 levels deeper |

### Integration Points
- **`helpers/level.cairo`**: Read mutator from `RunData.mutator_mask`, apply moves/ratio/difficulty modifiers during level generation
- **`grid_system` / scoring**: Read mutator, apply combo/score multipliers when calculating line clear rewards
- **Mutator assignment**: `mutator_index = level_seed % zone.mutator_count` (deterministic from seed)

---

## Part 6: Daily Challenge (Stars + Leaderboard)

### How Stars Work for Daily

**Participation stars:** Complete the daily challenge → earn 1 bonus star on your profile
**Performance stars:** Place in top 10 → earn 2 bonus stars; top 3 → earn 3 bonus stars

Stars are tracked in a new field on PlayerMeta (or a separate model):

```cairo
// Option: Add to PlayerMeta packed data
pub daily_stars_earned: u16,     // lifetime daily stars
pub daily_streak: u8,            // consecutive days participated
```

### Daily Challenge Model Changes
```cairo
pub struct DailyChallenge {
    // ... existing fields ...
    pub zone_id: u8,           // NEW: which zone
    pub mutator_id: u8,        // NEW: fixed mutator for the day
}
```

### Daily Leaderboard: Composite Score
```
ranking_value = (endless_depth << 16) | total_score
```
- Player A (depth=5, score=1000) beats Player B (depth=3, score=9999) — depth dominates
- Player A (depth=5, score=1000) loses to Player B (depth=5, score=2000) — score tiebreaker

---

## Part 7: Systems to Delete

### Contracts — Remove from `lib.cairo`

| System/Module | File | Reason |
|--------------|------|--------|
| `skill_tree_system` | `systems/skill_tree.cairo` | No skills |
| `draft_system` | `systems/draft.cairo` | No draft |
| `bonus_system` | `systems/bonus.cairo` | No active abilities |
| `skill_effects_system` | `systems/skill_effects.cairo` | No skills |
| `cube_token_system` | `systems/cube_token.cairo` | No cubes in v1.3 |
| `quest_system` | `systems/quest.cairo` | Deferred |

### Models — Remove from `lib.cairo`

| Model | File | Reason |
|-------|------|--------|
| `PlayerSkillTree` | `models/skill_tree.cairo` | No skills |
| `DraftState` | `models/draft.cairo` | No draft |

### Frontend — Delete

| File | Reason |
|------|--------|
| `DraftPage.tsx` | No draft |
| `SkillTreePage.tsx` | No skills |
| `InGameShopPage.tsx` | No shop |
| `useDraft.tsx` | No draft |
| `useSkillTree.tsx` | No skills |
| `useCubeBalance.tsx` | No cubes |
| `cubeBalanceStore.ts` | No cubes |
| `CubeBalance.tsx` | No cubes |
| `CubeIcon.tsx` | No cubes |
| `skillData.ts` | No skills |

---

## Part 8: Implementation Phases

### Phase 0: Scaffolding (2-4 hours)
- [ ] Create `zkube_budo_v1_3_0` namespace in constants.cairo
- [ ] Update lib.cairo: remove deleted systems/models, add new module stubs
- [ ] Remove FillAndClear + NoBonusUsed from constraint type enum (or disable in generation)
- [ ] Create deployment config for v1.3 (duplicate existing `dojo_slot.toml`, update namespace)
- [ ] Verify `sozo build` passes with stubs

**QA:**
```bash
sozo build -P slot
# Expected: Build succeeds. grep "zkube_budo_v1_3_0" contracts/src/constants.cairo → match
```

### Phase 1: Core Run Loop (2-3 days) — HIGHEST PRIORITY
- [ ] Rewrite RunData packing (new ~101-bit layout, u32 total_score, no cubes/skills)
- [ ] Update Game model to use new RunData
- [ ] Modify level_system: 10-level zone + endless (L11+), auto-advance in same tx, boss only at L10
- [ ] Modify game_system: new `create_run(game_id, zone_id)`, no draft/skill/cube dependencies
- [ ] Modify moves_system: remove transition pending, auto-advance on completion, remove skill/quest/cube hooks
- [ ] Simplify grid_system: remove skill effect hooks and bonus application paths
- [ ] Update game_over: remove cube minting, remove quest hooks, add leaderboard stub
- [ ] Write comprehensive tests

**QA:**
```bash
scarb test
# Verify these test scenarios exist and pass:

# 1. RunData roundtrip: pack(unpack(data)) == data for all field combos
#    - total_score > 65535 (u32 range)
#    - zone_id, endless_depth, zone_cleared, mutator_mask all roundtrip

# 2. Zone run lifecycle:
#    - create_run(zone_id=1) → 10× move() clearing each level
#    - After L10: zone_cleared == true, endless_depth == 0, game.over == false
#    - Continue moves in endless → endless_depth increments
#    - Grid full → game.over == true

# 3. Auto-advance:
#    - Move that completes level does NOT set any pending flag
#    - Next move operates on new level's grid
#    - No start_next_level() entrypoint exists

# 4. Constraints (4 types):
#    - ComboLines: tracked and satisfied correctly
#    - BreakBlocks: tracked and satisfied correctly
#    - ComboStreak: tracked and satisfied correctly
#    - KeepGridBelow: breach detected correctly (game over on breach)
#    - FillAndClear: NOT generated (removed)
#    - NoBonusUsed: NOT generated (removed)
```

### Phase 2: Zones + Mutators (1-2 days)
- [ ] Build ZoneConfig model + zone_system (register/get)
- [ ] Build MutatorDef model + mutator_system
- [ ] Integrate mutator effects into level generation (helpers/level.cairo): moves_modifier, ratio_modifier, difficulty_offset
- [ ] Integrate mutator effects into scoring: combo_score_mult, star_threshold_modifier
- [ ] Define 3 zone configs with GameSettings presets
- [ ] Define 9 mutator definitions
- [ ] Wire mutator assignment: `mutator_id = seed % zone.mutator_count` in game creation

**QA:**
```bash
scarb test
# 1. Zone registration: register_zone(1,...) → get_zone(1) matches
# 2. Invalid zone: create_run(zone_id=99) panics
# 3. Mutator determinism: same seed → same mutator always
# 4. Mutator generation effect: "Riptide" (-2 moves) → level has 2 fewer moves
# 5. Mutator scoring effect: combo multiplier applied in line clear reward
```

### Phase 3: Leaderboards + Daily (1-2 days)
- [ ] Implement composite score encoding in game_over: `(endless_depth << 16) | total_score`
- [ ] Update DailyChallenge model: add zone_id, mutator_id
- [ ] Update DailyEntry: add best_depth field
- [ ] Update DailyLeaderboard ranking to use composite score
- [ ] Add daily star rewards: participation + placement stars tracked on PlayerMeta
- [ ] Wire leaderboard submission into game_over (zone + daily boards)

**QA:**
```bash
scarb test
# 1. Composite ordering: (depth=5, score=1000) beats (depth=3, score=9999)
# 2. Tiebreaker: (depth=5, score=2000) beats (depth=5, score=1000)
# 3. Daily flow: create_daily → register → create_run → play → die → auto-submit
# 4. Better run replaces entry, worse run doesn't
# 5. Daily stars: participation star awarded, placement stars for top ranks
```

### Phase 4: Frontend Redesign (3-5 days) — PARALLEL WITH PHASES 1-3
- [ ] Update runDataPacking.ts for new bit layout (no cubes, no skills, u32 score)
- [ ] Update Game class unpacking
- [ ] Build zone selection UI on HomePage (3 zone cards with theme art)
- [ ] Update PlayScreen: remove bonus buttons, cube display. Add mutator indicator, endless depth HUD.
- [ ] Update MapPage: 10-node zone map + boss + endless indicator
- [ ] Update LeaderboardPage: Zone/Endless/Daily tabs with depth-then-score
- [ ] Update DailyChallengePage: zone + mutator display, star rewards
- [ ] Update systems.ts: add `createRun(gameId, zoneId)`, remove `applyBonus`, `selectSkill`, `rerollDraft`, `startNextLevel`, all cube/skill txs
- [ ] Delete: DraftPage, SkillTreePage, InGameShopPage, useDraft, useSkillTree, useCubeBalance, cubeBalanceStore, CubeBalance component, skillData.ts
- [ ] Update navigation store: remove deleted page IDs
- [ ] Update TutorialPage for zone/mutator/endless flow

**QA:**
```bash
cd client-budokan && pnpm build
# Expected: 0 type errors. No imports from deleted files.

cd client-budokan && pnpm test
# 1. RunData packing roundtrip matches Cairo
# 2. total_score > 65535 unpacks correctly

# Manual on slot:
# [ ] Home → 3 zone cards visible → select zone → Play
# [ ] Play L1-10 → auto-advance (no "next level" button) → Boss L10
# [ ] Clear boss → "Zone Cleared! Entering Endless..." → Endless until death
# [ ] Game Over → depth + score + stars displayed
# [ ] Leaderboard → entry with correct depth + score
# [ ] Daily → shows zone + mutator → play → leaderboard ranked by depth
# [ ] No routes to Draft, SkillTree, InGameShop pages
# [ ] No cube balance displayed anywhere
```

### Phase 5: Achievement Retune + Polish (1 day)
- [ ] Update achievement milestones: Leveler → zone clear / endless depths. Remove Master (quests deferred). Remove cube-related.
- [ ] Update RunEnded event payload (no cubes field)
- [ ] Full integration QA on slot

**QA:**
```bash
./scripts/deploy_slot.sh  # adapted for v1.3
cd client-budokan && pnpm slot

# Full integration checklist:
# [ ] Connect wallet → free mint NFT
# [ ] Select zone 1 (Polynesian) → create run
# [ ] Play 10 levels (verify auto-advance, mutator displayed, constraints work)
# [ ] Clear L10 → "Zone Cleared" → Endless
# [ ] Play 3-5 endless → die → Game Over shows depth + score + stars
# [ ] Leaderboard → entry correct
# [ ] Start daily challenge → same seed as other accounts → leaderboard
# [ ] Select zone 2 (Japan) → different theme/music/colors
# [ ] Select zone 3 (Persia) → different theme/music/colors
# [ ] Achievements → zone clear milestone tracked
```

### Phase 6: Deployment (1 day)
- [ ] Deploy v1.3 to sepolia → run Phase 5 QA checklist
- [ ] Deploy to mainnet when stable
- [ ] Switch frontend default
- [ ] Monitor

---

## Part 9: Remaining Open Questions

All critical decisions are locked. These are refinement questions that can be answered during implementation:

1. **Mutator balance**: The proposed mutator numbers (e.g., -2 moves, +50% combo score) are starting points. Will need playtesting to tune. Can be adjusted via MutatorDef model without code changes.

2. **Endless difficulty curve details**: Locked as "linear pressure increase" — but exact numbers (how much does ratio increase per endless level?) need playtesting. Start with `+0.10 ratio per level, difficulty caps at Master, moves stay at 60`.

3. **Star display for daily**: How are bonus daily stars shown in the UI? Options: separate "daily stars" counter on profile, or mixed into the zone star count. Decide during frontend Phase 4.

4. **Leaderboard per zone or global**: For alpha, one global "Endless" leaderboard regardless of zone. Can segment per-zone post-alpha if needed.

---

## Part 10: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RunData packing bugs | Game-breaking | Extensive unit tests + fuzz test pack/unpack roundtrips |
| Score overflow (u16 habits) | Leaderboard corruption | u32 from day one in both Cairo + TypeScript |
| Auto-advance UX jank | Poor experience | Frontend animation system handles grid resets via Torii sync timing |
| Mutator balance issues | Unfair runs | Start mild, tune via model updates (no code changes needed) |
| Namespace migration confusion | Player churn | Clear UI, env toggle, old world stays accessible |

---

## Appendix A: File Change Summary

### Contracts — MODIFY (16 files)
```
contracts/src/constants.cairo                     — New namespace
contracts/src/lib.cairo                           — Remove/add modules
contracts/src/systems/game.cairo                  — create_run(game_id, zone_id)
contracts/src/systems/moves.cairo                 — Auto-advance, no pending, no skill/quest/cube hooks
contracts/src/systems/grid.cairo                  — Remove skill hooks, add mutator scoring hooks
contracts/src/systems/level.cairo                 — 10-level + endless, single-step advance
contracts/src/systems/daily_challenge.cairo        — zone/mutator fields, composite ranking, stars
contracts/src/systems/achievement.cairo            — Retune milestones, remove cube-related
contracts/src/helpers/level.cairo                  — Zone gen + endless scaling + mutator integration
contracts/src/helpers/packing.cairo                — New RunData layout (~101 bits)
contracts/src/helpers/game_over.cairo              — Remove cube minting, add leaderboard submit
contracts/src/helpers/boss.cairo                   — Boss only at L10
contracts/src/types/constraint.cairo               — Remove FillAndClear + NoBonusUsed from generation
contracts/src/models/game.cairo                    — RunData struct changes
contracts/src/models/player.cairo                  — Remove cube tracking, add best_depth, daily_stars
contracts/src/models/daily.cairo                   — zone_id + mutator_id + best_depth
```

### Contracts — DELETE (7 files)
```
contracts/src/systems/skill_tree.cairo
contracts/src/systems/draft.cairo
contracts/src/systems/bonus.cairo
contracts/src/systems/skill_effects.cairo
contracts/src/helpers/skill_effects.cairo
contracts/src/models/skill_tree.cairo
contracts/src/models/draft.cairo
```

### Contracts — CREATE (4 files)
```
contracts/src/models/zone.cairo                    — ZoneConfig model
contracts/src/models/mutator.cairo                 — MutatorDef model
contracts/src/systems/zone.cairo                   — Zone registration/retrieval
contracts/src/systems/mutator.cairo                — Mutator registration/schedule
```

### Frontend — MODIFY (20+ files)
```
client-budokan/src/dojo/game/helpers/runDataPacking.ts  — New bit layout
client-budokan/src/dojo/game/models/game.ts             — Game class unpacking
client-budokan/src/dojo/systems.ts                      — New tx wrappers
client-budokan/src/ui/pages/HomePage.tsx                — Zone selection
client-budokan/src/ui/pages/PlayScreen.tsx              — Remove bonus, add mutator/endless
client-budokan/src/ui/pages/MapPage.tsx                 — 10-node zone map
client-budokan/src/ui/pages/LeaderboardPage.tsx         — Depth-then-score, 3 tabs
client-budokan/src/ui/pages/DailyChallengePage.tsx      — Zone + mutator + stars
client-budokan/src/ui/pages/TutorialPage.tsx            — Updated flow
client-budokan/src/ui/components/GameBoard.tsx           — Remove bonus integration
client-budokan/src/ui/components/hud/GameHud.tsx         — Mutator + endless depth display
client-budokan/src/ui/components/actionbar/GameActionBar.tsx — Remove bonus buttons
client-budokan/src/ui/components/GameOverDialog.tsx      — Depth + score + stars
client-budokan/src/ui/components/VictoryDialog.tsx       — "Zone Cleared → Endless"
client-budokan/src/hooks/useGame.tsx                     — New RunData unpacking
client-budokan/src/hooks/usePlayerMeta.tsx               — best_depth, daily_stars
client-budokan/src/hooks/useMapData.ts                   — 10 levels per zone
client-budokan/src/hooks/useCurrentChallenge.tsx         — Zone + mutator fields
client-budokan/src/stores/navigationStore.ts             — Remove deleted pages
client-budokan/src/App.tsx                              — Updated routes
```

### Frontend — DELETE (10 files)
```
client-budokan/src/ui/pages/DraftPage.tsx
client-budokan/src/ui/pages/SkillTreePage.tsx
client-budokan/src/ui/pages/InGameShopPage.tsx
client-budokan/src/hooks/useDraft.tsx
client-budokan/src/hooks/useSkillTree.tsx
client-budokan/src/hooks/useCubeBalance.tsx
client-budokan/src/stores/cubeBalanceStore.ts
client-budokan/src/ui/components/CubeBalance.tsx
client-budokan/src/ui/components/CubeIcon.tsx
client-budokan/src/dojo/game/types/skillData.ts
```

### Frontend — CREATE (4 files)
```
client-budokan/src/hooks/useZones.tsx
client-budokan/src/hooks/useMutators.tsx
client-budokan/src/hooks/useEndlessDepth.tsx
client-budokan/src/hooks/useDailyStars.tsx
```

---

## Appendix B: Effort Summary

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Phase 0: Scaffolding | 2-4 hours | None |
| Phase 1: Core Run Loop | 2-3 days | Phase 0 |
| Phase 2: Zones + Mutators | 1-2 days | Phase 1 |
| Phase 3: Leaderboards + Daily | 1-2 days | Phase 1 |
| Phase 4: Frontend | 3-5 days | **Parallel with Phases 1-3** (TS types can start immediately) |
| Phase 5: Polish + QA | 1 day | All above |
| Phase 6: Deployment | 1 day | Phase 5 |
| **Total** | **~2-3 weeks** | Phases 2-3 parallel; Phase 4 parallel with 1-3 |
