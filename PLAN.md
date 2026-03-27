# zKube Launch Redesign — Implementation Plan

## Overview

Redesign zKube from a 50-level progression-heavy roguelite into a fast, fair, skill-first puzzle score-survival game with 10-level themed zones, endless mode, theme-bound mutators, and stars as the sole progression signal. Same namespace (`zkube_budo_v1_2_0`), fresh katana seed. No skills, no draft, no cubes, no economy.

## Goals
- 1 run = 1 themed zone = 10 levels + endless until death
- 3 zones at alpha: Polynesian (theme-1), Feudal Japan (theme-5), Ancient Persia (theme-7)
- Theme-bound mutators (9 total, 3 per zone) affecting level generation + scoring
- Daily challenge with shared seed, depth-then-score leaderboard, stars reward
- Stars as only progression signal
- All content unlocked for alpha (no gating)

## Non-Goals
- No currency/economy (cubes fully removed)
- No skills, draft, or skill tree
- No quest system (deferred)
- No monetization gating (deferred)
- No new theme art (reuse existing 10 themes)
- No namespace change (keep `zkube_budo_v1_2_0`, fresh seed)

## Assumptions and Constraints
- Same namespace `zkube_budo_v1_2_0` with new katana seed (fresh chain)
- Keep NFT free-mint (game_id = token_id pattern)
- Keep 4 constraint types: ComboLines, BreakBlocks, ComboStreak, KeepGridBelow
- Remove 2 constraints: FillAndClear, NoBonusUsed
- Mutator assignment: deterministic from seed for normal runs, admin-set for daily
- Score: u32 (endless will exceed u16)
- Auto-advance: same-tx (no `start_next_level`)
- Endless difficulty: linear pressure increase (ratio +0.10/level, caps at Master)
- Daily: unlimited attempts, free entry, best score counts, stars + leaderboard

## Requirements

### Functional
- Create zone run by selecting zone_id (1-3)
- 10-level zone with boss at L10, auto-advance between levels
- Endless mode after L10 clear (L11+ with escalating difficulty)
- 9 mutators (3 per zone) applied to generation + scoring
- Daily challenge with shared seed, fixed zone + mutator
- Leaderboard ranked by depth first, score second (composite encoding)
- Stars for level performance (1/2/3 star) + daily participation/placement

### Non-Functional
- RunData fits in felt252 (~101 bits used of 252)
- Same-tx level advance (no multi-tx flow)
- Deterministic: same seed + same zone + same mutator = identical game

## Technical Design

### Data Model

**RunData (NEW ~101-bit layout):**
```
current_level(8) | level_score(8) | level_moves(8) | constraint_progress(8) |
constraint_2_progress(8) | max_combo_run(8) | total_score(32) |
zone_cleared(1) | endless_depth(8) | zone_id(4) | mutator_mask(8)
```

**New Models:**
- `ZoneConfig { zone_id, settings_id, theme_id, name, mutator_pool, enabled }`
- `MutatorDef { mutator_id, name, zone_id, moves_modifier, ratio_modifier, difficulty_offset, combo_score_mult_x100, star_threshold_modifier, endless_ramp_mult_x100 }`

**Modified Models:**
- `Game` — new RunData layout
- `PlayerMeta` — remove cube tracking, add best_depth, daily_stars
- `DailyChallenge` — add zone_id, mutator_id
- `DailyEntry` — add best_depth

**Deleted Models:**
- `PlayerSkillTree`, `DraftState`

### Architecture

```
Zone Select -> create_run(game_id, zone_id)
    -> seed generated (VRF/pseudo)
    -> mutator derived from seed % zone.mutator_count
    -> level 1 generated with zone settings + mutator modifiers
    -> grid initialized

Move Loop:
    move(game_id, row, start, final)
    -> grid.execute_move()
    -> check constraints
    -> if level complete AND level < 10: auto-advance (same tx)
    -> if level == 10 complete: zone_cleared=true, enter endless
    -> if level > 10 complete: endless_depth++, auto-advance
    -> if grid_full/moves_exhausted: game_over -> submit leaderboard

Game Over:
    -> compute composite rank: (endless_depth << 16) | total_score
    -> submit to zone + daily leaderboards
    -> award stars (level performance + daily participation)
    -> emit RunEnded event
```

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

#### Phase 0: Scaffolding
**Prerequisite for:** All subsequent phases

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Update `lib.cairo`: remove skill_tree, draft, bonus, skill_effects, cube_token, quest systems and models from module declarations | `lib.cairo` compiles without deleted modules |
| 0.2 | Remove/disable FillAndClear + NoBonusUsed constraint generation in `types/constraint.cairo` and `helpers/level.cairo` | Only 4 constraint types generated |
| 0.3 | Verify `sozo build -P slot` passes with stubs for new models | Clean build |

**Verification:**
```bash
sozo build -P slot  # must succeed
```

---

#### Phase 1: Core Run Loop
**Prerequisite for:** Phases 2, 3
**Depends on:** Phase 0

| Task | Description | Output |
|------|-------------|--------|
| 1.1 | Rewrite RunData struct + bit layout in `helpers/packing.cairo` (~101 bits, u32 total_score, no cubes/skills, add zone_id/endless_depth/zone_cleared/mutator_mask) | New pack/unpack functions |
| 1.2 | Update `models/game.cairo` Game struct to use new RunData | Game model compiles |
| 1.3 | Modify `systems/game.cairo`: new `create_run(game_id, zone_id)` entry, remove draft/skill/cube deps | Create flow works |
| 1.4 | Modify `systems/moves.cairo`: remove transition pending, auto-advance on level complete, remove skill/quest/cube hooks | Move + auto-advance works |
| 1.5 | Modify `systems/level.cairo`: collapse 2-step into 1-step advance, boss only at L10, endless for L11+ | Level transitions work |
| 1.6 | Modify `helpers/level.cairo`: level_cap=10 for zone mode, endless scaling for L11+ (ratio +0.10/level, cap Master) | Level generation correct |
| 1.7 | Simplify `systems/grid.cairo`: remove skill effect hooks and bonus application paths | Grid ops clean |
| 1.8 | Update `helpers/game_over.cairo`: remove cube minting, remove quest hooks, add leaderboard submission stub | Game over flow works |
| 1.9 | Update `helpers/boss.cairo`: boss only at L10, remove L20/30/40/50 logic | Boss at L10 only |
| 1.10 | Write tests: RunData roundtrip, zone lifecycle (create -> L1-10 -> endless -> game_over), auto-advance, constraint types | All tests pass |

**Verification:**
```bash
scarb test  # all tests pass
# Key assertions:
# - RunData pack/unpack roundtrip with u32 total_score > 65535
# - create_run -> 10 levels -> zone_cleared=true -> endless -> game.over
# - No level_transition_pending anywhere
# - Only ComboLines/BreakBlocks/ComboStreak/KeepGridBelow generated
```

---

### Parallel Workstreams

#### Workstream A: Zones + Mutators (Contracts)
**Dependencies:** Phase 1
**Can parallelize with:** Workstream B, C

| Task | Description | Output |
|------|-------------|--------|
| A.1 | Create `models/zone.cairo` (ZoneConfig) + `systems/zone.cairo` (register/get) | Zone model + system |
| A.2 | Create `models/mutator.cairo` (MutatorDef) + `systems/mutator.cairo` (register/get) | Mutator model + system |
| A.3 | Integrate mutator effects into `helpers/level.cairo`: apply moves_modifier, ratio_modifier, difficulty_offset during generation | Mutator affects levels |
| A.4 | Integrate mutator scoring effects into grid/scoring: combo_score_mult, star_threshold_modifier | Mutator affects scoring |
| A.5 | Wire mutator assignment in game creation: `mutator_id = seed % zone.mutator_count` | Deterministic mutator selection |
| A.6 | Define 3 zone configs + 9 mutator defs as init data (dojo_init or deploy script) | Zones + mutators registered |
| A.7 | Tests: zone registration, mutator determinism, mutator effect on generation + scoring | All tests pass |

**Verification:**
```bash
scarb test
# - register_zone -> get_zone roundtrip
# - same seed -> same mutator always
# - mutator modifies level moves/ratio/difficulty correctly
# - mutator modifies scoring correctly
```

#### Workstream B: Leaderboards + Daily (Contracts)
**Dependencies:** Phase 1
**Can parallelize with:** Workstream A, C

| Task | Description | Output |
|------|-------------|--------|
| B.1 | Update `models/daily.cairo`: add zone_id, mutator_id to DailyChallenge; add best_depth to DailyEntry | Models compile |
| B.2 | Implement composite score encoding in `helpers/game_over.cairo`: `(endless_depth << 16) | total_score` | Composite ranking |
| B.3 | Update `helpers/daily.cairo` leaderboard update to use composite value | Daily leaderboard correct |
| B.4 | Update `systems/daily_challenge.cairo`: accept zone_id + mutator_id in creation | Daily creation works |
| B.5 | Add daily star tracking to `models/player.cairo` (daily_stars field in MetaData packing) | Stars tracked |
| B.6 | Wire star awards in game_over: participation star + placement bonus | Stars awarded |
| B.7 | Tests: composite ordering, daily flow, star awards | All tests pass |

**Verification:**
```bash
scarb test
# - (depth=5, score=1000) > (depth=3, score=9999)
# - (depth=5, score=2000) > (depth=5, score=1000)
# - daily flow: create -> register -> play -> auto-submit -> leaderboard
# - daily stars awarded on game_over
```

#### Workstream C: Frontend
**Dependencies:** Phase 0 (types), Phase 1 (RunData layout)
**Can parallelize with:** Workstreams A, B

| Task | Description | Output |
|------|-------------|--------|
| C.1 | Update `runDataPacking.ts`: new bit layout (u32 score, zone_id, endless_depth, mutator_mask, no cubes/skills) | TS types match Cairo |
| C.2 | Update `Game` class in `models/game.ts` | Game unpacking works |
| C.3 | Delete files: DraftPage, SkillTreePage, InGameShopPage, useDraft, useSkillTree, useCubeBalance, cubeBalanceStore, CubeBalance, CubeIcon, skillData.ts | No dead imports |
| C.4 | Update `systems.ts`: add `createRun(gameId, zoneId)`, remove bonus/skill/cube/draft tx wrappers | New tx interface |
| C.5 | Update `navigationStore.ts`: remove deleted page IDs, update nav flow | Navigation clean |
| C.6 | Build zone selection UI on `HomePage.tsx` (3 zone cards: Polynesian, Japan, Persia with theme art) | Zone select works |
| C.7 | Update `PlayScreen.tsx`: remove bonus buttons/cube display, add mutator indicator + endless depth HUD | Play screen clean |
| C.8 | Update `MapPage.tsx`: 10-node zone map + boss node + endless indicator | Map shows 10 levels |
| C.9 | Update `GameOverDialog.tsx`: show depth + score + stars (no cubes) | Game over clean |
| C.10 | Update `VictoryDialog.tsx`: "Zone Cleared! Entering Endless..." | Victory flow works |
| C.11 | Update `LeaderboardPage.tsx`: depth-then-score display | Leaderboard works |
| C.12 | Update `DailyChallengePage.tsx`: zone + mutator display + star rewards | Daily page works |
| C.13 | Update `GameHud.tsx` + `GameActionBar.tsx`: remove bonus buttons, add mutator/endless display | HUD clean |
| C.14 | Create hooks: `useZones`, `useMutators`, `useEndlessDepth`, `useDailyStars` | New hooks work |
| C.15 | Update `TutorialPage.tsx` for zone/mutator/endless flow | Tutorial updated |

**Verification:**
```bash
cd client-budokan && pnpm build  # 0 type errors
cd client-budokan && pnpm test   # all tests pass
# Manual: Home -> Zone -> Play -> L1-10 -> Boss -> Endless -> Game Over -> Leaderboard
```

---

### Merge Phase

#### Phase M: Integration + Polish
**Dependencies:** Workstreams A, B, C

| Task | Description | Output |
|------|-------------|--------|
| M.1 | Update achievement milestones for zone/endless model, remove cube-related | Achievements retuned |
| M.2 | Update RunEnded event payload (no cubes) | Event clean |
| M.3 | Deploy to slot: `./scripts/deploy_slot.sh` (adapted) | Slot running |
| M.4 | Run full integration QA checklist | All checks pass |
| M.5 | Fix any issues found in QA | Clean |

---

## Testing and Validation

### Contract Tests
```bash
scarb test  # all pass
```

### Frontend Tests
```bash
cd client-budokan && pnpm build && pnpm test  # all pass
```

### Integration QA (Slot)
```
[ ] Connect wallet -> free mint NFT
[ ] Select zone 1 (Polynesian) -> create run -> mutator displayed
[ ] Play 10 levels (auto-advance, no "next level" button, constraints work)
[ ] Clear L10 boss -> "Zone Cleared" message -> enters Endless
[ ] Play 3-5 Endless levels -> die -> Game Over shows depth + score + stars
[ ] Leaderboard shows entry with correct depth + score
[ ] Start daily challenge -> same seed as alt account -> leaderboard ranked
[ ] Select zone 2 (Japan) -> different theme/music/colors + different mutator
[ ] Select zone 3 (Persia) -> different theme/music/colors + different mutator
[ ] No cube balance displayed anywhere
[ ] No bonus buttons, skill tree, draft, or shop accessible
```

## Rollout and Migration

- **Same namespace** `zkube_budo_v1_2_0` with fresh katana seed
- No data migration -- fresh chain
- Frontend env switch: just point to new slot deployment
- Rollback: redeploy v1.2 contracts to a fresh seed if needed

## Verification Checklist

```bash
# 1. Contracts build
sozo build -P slot

# 2. Tests pass
scarb test

# 3. Deploy
./scripts/deploy_slot.sh

# 4. Frontend builds
cd client-budokan && pnpm build

# 5. Frontend tests pass
cd client-budokan && pnpm test

# 6. Manual integration (see QA checklist above)
cd client-budokan && pnpm slot
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| RunData packing bugs | Medium | High | Fuzz test pack/unpack roundtrips |
| Score overflow (u16 habits in TS) | Medium | High | u32 from day one, test values > 65535 |
| Auto-advance UX jank | Medium | Medium | Frontend animation handles grid resets via Torii sync |
| Mutator balance | Medium | Low | Start mild, tune via model updates |
| Removed systems still imported | Low | High | `sozo build` catches immediately |

## Open Questions

- [ ] Exact mutator numbers need playtesting (moves_modifier, combo_score_mult, etc.)
- [ ] Endless difficulty curve tuning (start with +0.10 ratio/level, adjust)
- [ ] Daily star display format (separate counter vs mixed into zone stars)
- [ ] Global vs per-zone Endless leaderboard (start global, segment later if needed)

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Same namespace, new seed | Simpler deployment, no migration | New namespace v1_3_0 (rejected: unnecessary complexity) |
| Cubes fully removed | No economy needed for alpha skill-first game | Cubes for cosmetics (rejected: adds complexity without value) |
| 3 zones (Polynesian, Japan, Persia) | Maximum visual contrast from existing themes | 10 zones (too many for alpha), Norse+Egypt+Japan (user preference) |
| 4 constraint types | Enough depth without complexity | All 7 (too complex), None (too simple) |
| u32 total_score | Endless will exceed 65535 | u16 (will overflow) |
| Deterministic mutator from seed | Preserves "run personality from seed" | Player-chosen (adds pre-run decision bloat) |
| Stars only progression | Simplest possible, no economy to balance | Cubes for cosmetics (adds systems without alpha value) |
| Free daily, unlimited attempts | Minimize friction for alpha testing | One attempt (too punishing), paid entry (no currency) |
