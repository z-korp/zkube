# v1.3 Contract Cleanup — Full v1.2 Dead Code Removal

## Overview
Remove all v1.2 dead code artifacts (cubes, bonuses, skills, draft, shop, quests) from the zKube contracts. This is a breaking storage change — requires fresh deployment (katana reset or namespace bump). The goal is a clean, minimal codebase with only v1.3 features.

## Goals
- Remove all 869 identified v1.2 dead code artifacts
- Zero references to cubes, bonuses, skills, draft, shop, or quest systems
- Clean constraint enum (remove FillAndClear + NoBonusUsed)
- Update VERSION to v1.3
- All tests pass after cleanup (`scarb build && scarb test`)

## Non-Goals
- No new features — pure subtraction
- No frontend changes (separate cleanup)
- No namespace bump in this plan (done separately at deploy time)

## Assumptions and Constraints
- Fresh deploy required (model hash changes from struct field removal)
- Boss identities using NoBonusUsed will be updated to use KeepGridBelow
- types/bonus.cairo module kept in lib.cairo ONLY if something still imports it — otherwise removed
- Orphaned files on disk (not in lib.cairo) are deleted from filesystem
- 183 tests currently passing — cleanup must maintain or improve this count

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

#### Phase 0: Delete Dead Files
**Prerequisite for:** All subsequent phases — removes files that would cause compile errors during refactoring

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Delete orphaned files NOT in lib.cairo: `systems/cube_token.cairo`, `store.cairo`, `elements/bonuses/` (3 files), `elements/tasks/` (10 files) | 15 dead files removed |
| 0.2 | Remove `pub mod bonus` from `lib.cairo` types section | Dead module deregistered |
| 0.3 | Update `contracts/src/constants.cairo`: VERSION = 'v1.3.0', remove stale comments referencing cubes/quests | Version bumped |
| 0.4 | `scarb build` to verify no compile errors from deleted files | Clean build |

---

### Parallel Workstreams

#### Workstream A: Model & Struct Field Cleanup
**Dependencies:** Phase 0
**Can parallelize with:** B, C, D

| Task | Description | Output |
|------|-------------|--------|
| A.1 | `models/config.cairo` — Remove from GameSettings: `cube_3_percent`, `cube_2_percent`, `draft_picks`, `draft_pool_mask`, `draft_fixed_level`, `boss_upgrades_enabled`, `reroll_base_cost`, `starting_charges`. Remove corresponding defaults from `GameSettingsDefaults`. Remove validation code for these fields. | GameSettings has only active fields |
| A.2 | `models/game.cairo` — Remove from GameLevel: `cube_3_threshold`, `cube_2_threshold`. Update `from_level_config()` to not set them. | GameLevel clean |
| A.3 | `models/daily.cairo` — Remove from DailyEntry: `best_cubes`. Remove from DailyChallenge: `ranking_metric` (hardcoded composite now). Update test helpers. | Daily models clean |
| A.4 | `models/player.cairo` — Remove `add_cubes_earned()` function. Remove test for cubes. | PlayerMeta clean |
| A.5 | `helpers/packing.cairo` — Remove from MetaData: `total_cubes_earned`. Update pack/unpack. Update MetaDataBits. | MetaData has only active fields |
| A.6 | `events.cairo` — Remove from LevelCompleted: `cubes`, `bonuses_earned`. Remove RunCompleted event entirely (v1.2 victory concept). Remove stale RunEnded.endless_depth (rename to current_difficulty). | Events match v1.3 |

#### Workstream B: Type & Constraint Cleanup
**Dependencies:** Phase 0
**Can parallelize with:** A, C, D

| Task | Description | Output |
|------|-------------|--------|
| B.1 | `types/constraint.cairo` — Remove `FillAndClear` and `NoBonusUsed` variants from ConstraintType enum. Remove `fill_and_clear()` and `no_bonus()` factory functions. Remove evaluation logic for both. Update Into<u8> and from(u8) impls. | 4 clean constraint types only |
| B.2 | `helpers/boss.cairo` — Replace all NoBonusUsed constraint generation with KeepGridBelow. Remove any FillAndClear references. | Boss system uses only active constraints |
| B.3 | `types/level.cairo` — Remove `cube_3_threshold`, `cube_2_threshold` from LevelConfig. Remove `calculate_cubes()` and `potential_cubes()` functions. | LevelConfig clean |
| B.4 | `types/daily.cairo` — Remove `RankingMetric::CubesEarned` variant. Update conversion impls. | RankingMetric clean |

#### Workstream C: System & Helper Cleanup
**Dependencies:** Phase 0
**Can parallelize with:** A, B, D

| Task | Description | Output |
|------|-------------|--------|
| C.1 | `systems/grid.cairo` — Remove `apply_bonus()` function and trait method. Remove `Bonus` import. Remove `skill_data` parameter from `execute_move()` signature — change to just `(game_id, row, start, final)`. | Grid system clean |
| C.2 | `systems/level.cairo` — Remove `skill_data` parameter from `initialize_level()` and `finalize_level()`. Remove cube threshold initialization. Remove `cubes: 0` from LevelCompleted events. | Level system clean |
| C.3 | `systems/config.cairo` — Remove draft_* and cube_* parameters from `add_custom_game_settings()` interface and implementation. Remove draft validation. | Config system clean |
| C.4 | `systems/moves.cairo` — Update `execute_move()` call to remove `skill_data` parameter (was always 0). | Moves system clean |
| C.5 | `helpers/level.cairo` — Remove `CUBE_3_PERCENT`, `CUBE_2_PERCENT` constants. Remove `get_boss_cube_bonus()`. Remove cube threshold calculations from level generation. | Level helper clean |
| C.6 | `helpers/level_check.cairo` — Remove `calculate_cubes()` function. | Level check clean |
| C.7 | `helpers/game_over.cairo` — Remove total_cubes tracking. Remove best_cubes assignment. Remove cubes from RunEnded event emission. | Game over clean |
| C.8 | `helpers/scoring.cairo` — Remove stale comments referencing cube rewards and bonus system. | Clean comments |
| C.9 | `helpers/renderer.cairo` — Remove bonus-related SVG rendering code and variables. | Renderer clean |
| C.10 | `systems/renderer.cairo` — Remove CUBES detail field. Remove bonus rendering. | Renderer system clean |

#### Workstream D: Daily Challenge & Game System Cleanup
**Dependencies:** Phase 0
**Can parallelize with:** A, B, C

| Task | Description | Output |
|------|-------------|--------|
| D.1 | `systems/daily_challenge.cairo` — Remove cubes variable and best_cubes assignment in submit_result. Remove ranking_metric parameter from create (hardcode composite). | Daily challenge clean |
| D.2 | `systems/game.cairo` — Remove stale comments. Clean up get_game_data() to remove reserved fields (return meaningful data or simplify). | Game system clean |
| D.3 | `helpers/game_libs.cairo` — Update ILevelSystemDispatcher to match new signatures (no skill_data). Update IGridSystemDispatcher (no skill_data in execute_move, no apply_bonus). | Dispatchers match new interfaces |

---

### Merge Phase

#### Phase N: Integration, Build, Test
**Dependencies:** Workstreams A, B, C, D

| Task | Description | Output |
|------|-------------|--------|
| N.1 | `scarb build` — fix any remaining compile errors from cascading changes | Clean build |
| N.2 | Update tests: remove cube/bonus assertions, fix struct constructors to match new field layouts | Tests compile |
| N.3 | `scarb test` — all tests pass | ≥183 tests passing |
| N.4 | Final grep audit: `grep -rn "cube\|bonus\|draft\|quest\|skill_data\|FillAndClear\|NoBonusUsed\|v1.2" contracts/src/ --include="*.cairo"` — expect zero meaningful hits | Clean codebase |
| N.5 | Delete any remaining orphaned .cairo files not in lib.cairo | No dead files on disk |

---

## Testing and Validation

- `scarb build` — zero errors
- `scarb test` — ≥183 tests passing (some tests may be removed with dead code)
- Final grep for v1.2 keywords returns zero hits
- No files on disk that aren't registered in lib.cairo (except tests/)

## Verification Checklist

```bash
cd /home/djizus/projects/zkube
scarb build
scarb test
# Verify no dead keywords remain:
grep -rn "cube_3_percent\|cube_2_percent\|draft_picks\|total_cubes\|best_cubes\|apply_bonus\|FillAndClear\|NoBonusUsed\|v1\.2\.0" contracts/src/ --include="*.cairo" | grep -v "test" | grep -v "DEPRECATED"
# Verify no orphaned files:
find contracts/src/ -name "*.cairo" | while read f; do
  basename=$(echo $f | sed 's|contracts/src/||' | sed 's|/|::|g' | sed 's|\.cairo||')
  grep -q "$(basename $f .cairo)" contracts/src/lib.cairo || echo "ORPHAN: $f"
done
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Removing GameSettings fields breaks IntrospectPacked | High | High | Fresh deploy required — model hashes change |
| Removing skill_data from execute_move breaks dispatchers | High | Med | Update game_libs.cairo dispatchers simultaneously |
| Removing constraint types shifts enum values | Med | High | Update all Into<u8> impls and boss.cairo simultaneously |
| Some dead code has hidden callers | Low | Med | Final grep audit catches stragglers |
| Test count drops significantly | Med | Low | Acceptable — dead tests for dead features should be removed |

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Remove everything, fresh deploy | User decision — clean slate preferred over carrying legacy debt | Keep struct fields with DEPRECATED comments |
| Remove FillAndClear + NoBonusUsed from enum | User decision — dead constraint types with no game logic backing them | Keep in enum but never generate |
| Replace NoBonusUsed with KeepGridBelow in boss | NoBonusUsed is meaningless without bonuses; KeepGridBelow is the natural replacement | ComboStreak (less boss-appropriate) |
| Delete orphaned files first | Prevents compile errors from stale imports during refactoring | Clean at end (risky — compile breaks mid-refactor) |
