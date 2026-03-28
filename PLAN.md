# zKube Dead Code Cleanup (Contracts + Frontend) Implementation Plan

## Overview
This cleanup aligns the codebase with the post-pivot game: 10-level map + endless, stars-only progression, F2P + paid maps, daily challenge, and no roguelite meta systems. The goal is to remove dead systems/files and simplify active flows without changing core gameplay behavior. We keep wire compatibility where explicitly required (RunData bit layout, FullTokenContract).

## Goals
- Remove dead contract/frontend code that no longer belongs to the pivoted design.
- Eliminate dormant UI/routes/providers for quests, achievements, cubes, draft, zone/mutator map logic.
- Keep only systems required by current design (game, config, moves/grid/level, renderer, daily challenge, map purchase entitlement).
- Produce a clean, buildable/testable baseline for alpha iteration.

## Non-Goals
- No RunData repack/migration (zone_id/mutator_mask bits remain reserved and zeroed).
- No new gameplay features (no reintroduction of bonuses/quests/achievements).
- No monetization redesign beyond existing map purchase model.
- No migration of FullTokenContract ownership flow.

## Assumptions and Constraints
- User direction is authoritative: no skills/draft/skill tree/bonuses (deferred), no quest/achievement systems (deferred), no cube economy; stars are the only progression signal.
- "All content unlocked for alpha" means no extra gating beyond map purchase entitlement already in scope.
- Keep `full_token_contract` integration.
- Keep RunData bit shape as-is; do not repack storage.
- Use up-to-date game-components/Athanor-compatible integrations; avoid re-adding legacy components.

## Requirements

### Functional
- Delete identified dead contract files (draft/zone/mutator/skill tree/skill effects stack, dead helpers).
- Remove dead events and dead event fields (draft events, `RunEnded.zone_id`).
- Remove quest/achievement contract stubs from active module graph.
- Remove bonus system from active module graph and frontend interaction points.
- Remove cube-based frontend UI and copy; keep stars/score outputs.
- Simplify map UI from 5-zone roguelite structure to map-centric 10-level + endless representation.

### Non-Functional
- Build must pass for contracts and frontend.
- Diagnostics/type checks clean on changed files.
- No regression in mint → create/create_run → play core loop.
- Keep deterministic map/game config behavior.

## Technical Design

### Data Model
- **Keep:** `Game`, `GameSettings`, `GameSettingsMetadata`, `MapEntitlement`, `Daily*`.
- **Delete:** `DraftState`, `ZoneConfig`, `MutatorDef`, `PlayerSkillTree` models.
- **Keep but documented reserved fields:** `RunData.zone_id`, `RunData.mutator_mask` (always zero in active flow).
- **Event schema changes:**
  - Delete `DraftOpened`, `DraftRerolled`, `DraftSelected`.
  - Remove `zone_id` from `RunEnded`.

### API Design
- **Contracts removed from public surface:** `bonus_system`, `quest_system`, `achievement_system`, draft/zone/mutator/skill-tree systems.
- **Frontend system calls removed:** `applyBonus`, `claimQuest` (and their transport types/interfaces).
- **No change** to active calls: `free_mint`, `create`, `create_run`, `move`, map purchase/config, daily challenge calls.

### Architecture
```text
Before: roguelite meta layers (draft/skills/bonus/quests/achievements/cubes) around core puzzle loop
After:  core puzzle loop + settings-driven maps + entitlement + daily challenge

Contracts retained:
  game_system, move_system, grid_system, level_system, config_system,
  renderer_system, daily_challenge_system, external full_token/minigame registry

Frontend retained:
  Home -> Map -> Play, Daily Challenge, Leaderboard, Settings, MyGames
  (Quests page/provider/components and cube/bonus UX removed)
```

### UX Flow (if applicable)
- Home top bar/actions remove quest/cube affordances.
- Map view represents one map (10 levels + endless entry), not 5-zone campaign/draft transitions.
- End-of-level/game dialogs show stars/score progression only (no cube rewards or draft prompts).

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

These tasks create foundations that other work depends on. Complete in order.

#### Phase 0: Cleanup Contract/UI Decisions Lock + Safety Guardrails
**Prerequisite for:** All subsequent phases

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Freeze cleanup policy in code comments/docs: remove bonus/quest/achievement paths; keep RunData reserved bits | Decision note in PLAN + inline comments where needed |
| 0.2 | Prepare removal list and ownership map (imports/usages/build graph) before deletion | Ordered deletion checklist, avoids partial breaks |
| 0.3 | Add temporary compile checkpoints (contract + frontend) to validate each removal stage | Repeatable verification checkpoints |

---

### Parallel Workstreams

These workstreams can be executed independently after Phase 0.

#### Workstream A: Contract Graph Pruning
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams B, C

| Task | Description | Output |
|------|-------------|--------|
| A.1 | Remove dead contract files: `systems/{draft,zone,mutator,skill_tree,skill_effects}.cairo`, `models/{draft,zone,mutator,skill_tree}.cairo`, `helpers/{skill_effects,bonus_logic}.cairo` | Files deleted, no dangling imports |
| A.2 | Remove dormant systems from active graph: `systems/bonus.cairo`, `systems/quest.cairo`, `systems/achievement.cairo` and lib module exports | Active contract surface matches current game |
| A.3 | Update `events.cairo` and emitters: delete draft events, remove `RunEnded.zone_id`, adjust `helpers/game_over.cairo` emission | Event schema aligned to current runtime |
| A.4 | Remove skill-tree accessors/imports from `store.cairo` and any remaining references (including cube_token minter grants to skill tree) | Store and token setup free of skill-tree dependencies |
| A.5 | Keep `RunData` bit layout unchanged; annotate reserved/dead bits in `helpers/packing.cairo` and tests | Compatibility retained, intent explicit |

#### Workstream B: Frontend Dead Feature Removal
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, C

| Task | Description | Output |
|------|-------------|--------|
| B.1 | Delete dead frontend files: `utils/draftEvents.ts`, legacy `ui/components/QuestCard.tsx`, unused `Quest/QuestFamilyCard.tsx` | Dead files removed |
| B.2 | Remove quest stack: `QuestsPage`, `QuestsProvider`, quest components/hooks/imports, navigation route/state entries, topbar quest action | No quest UI/runtime code paths |
| B.3 | Remove bonus stack from UI/system calls/types: `BonusButton`, `BonusType` usage in board/tutorial/action bars, `applyBonus` call path | No bonus controls in client |
| B.4 | Remove cube visuals/copy: `CubeIcon` usage, cube counters/reward labels in dialogs/topbar, `cubeBalance` props | Stars/score-only presentation |
| B.5 | Strip draft fields from settings forms/types (`draft_*`) and map flow flags (`draftWillOpen`, `node.type === 'draft'`) | Settings/map UI matches pivot |

#### Workstream C: Map UX Simplification
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, B

| Task | Description | Output |
|------|-------------|--------|
| C.1 | Refactor `useMapData` from 5-zone × 11-node model to map-centric 10-level + endless model | Simplified node model and state rules |
| C.2 | Retire zone theme/layout machinery (`useMapLayout`, `ZoneBackground`, zone swiping, zone dots) and replace with linear/progressive map representation | Map page no longer zone-based |
| C.3 | Update `MapPage`, `LevelPreview`, `LevelCompleteDialog`, `PlayScreen` to consume new map model and remove zone/mutator assumptions | End-to-end map/play transition coherent |
| C.4 | Keep endless-depth rendering/logic where meaningful; remove only dead zone/mutator display fields | Endless mode preserved |

---

### Merge Phase

After parallel workstreams complete, these tasks integrate the work.

#### Phase N: Integration + Regression Safety
**Dependencies:** Workstreams A, B, C

| Task | Description | Output |
|------|-------------|--------|
| N.1 | Reconcile generated/manifest bindings (`contractSystems.ts`, model/system wrappers) with removed contracts/interfaces | No stale ABI calls/imports |
| N.2 | Full compile/test pass and runtime smoke test of core flow | Verified clean baseline |
| N.3 | Remove stale docs/comments naming removed systems (README/CLAUDE sections that mislead maintainers) | Documentation reflects product direction |

---

## Testing and Validation

- Contract compile and tests after each deletion stage.
- Frontend typecheck/build after each feature-slice removal (quests, bonus, cube, map).
- Manual smoke tests:
  - Connect wallet → start map run → play moves → level complete → map progression.
  - Daily challenge flow still operable.
  - Paid/free map selection remains functional.

## Rollout and Migration

- Rollout as a single cleanup branch, but execute in commits by workstream for easy rollback.
- If a regression appears, rollback offending workstream commit(s) without reverting whole cleanup.
- No on-chain data migration required (storage compatibility preserved by not repacking RunData).

## Verification Checklist

- Contracts:
  - `scarb build`
  - `cd contracts && scarb test`
  - `cd contracts && sozo build -P slot`
- Frontend:
  - `cd client-budokan && pnpm build`
  - `cd client-budokan && pnpm test`
- Diagnostics (changed files):
  - run LSP diagnostics for changed TS/TSX and Cairo files; resolve all errors.
- Manual runtime:
  - Start local stack, mint/create/play loop, daily challenge, map selection states.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Removing systems breaks generated bindings/manifests | Med | High | Merge phase includes binding reconciliation + compile gates |
| Hidden quest/bonus/cube references remain in UI | High | Med | Search-driven cleanup checklist + strict TS build |
| Map refactor introduces progression UX regressions | Med | High | Isolate Workstream C + manual progression smoke tests |
| Event schema edits break indexer consumers | Low | Med | Update event consumers in same PR; verify Torii queries |
| Over-cleaning removes deferred-but-needed code | Low | Med | Keep cleanup focused on non-active/deferred systems only; preserve RunData compatibility |

## Open Questions

- [ ] Confirm alpha behavior for paid maps while also saying “all content unlocked for alpha”: should locked maps show purchase CTA or auto-owned in alpha builds?
- [ ] Confirm desired Home top bar replacement for removed quest/cube controls (minimal mode vs star summary widget).

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Remove bonus system from active contracts and UI | Product direction explicitly says no bonuses (deferred) | Keep contract-only dormant bonus path (rejected: confusion + dead ABI surface) |
| Remove quest + achievement systems now | User requested dropping both for now; current files are mostly stubs/dead UI | Keep dormant stubs indefinitely (rejected: unnecessary complexity) |
| Remove cube UX from frontend and keep stars as sole progression signal | Product direction: no cube economy, stars only | Keep cube icon/counters as cosmetic (rejected: contradicts direction) |
| Rewrite map page away from zone model | Current 5-zone draft-oriented map conflicts with 10-level+endless per-map design | Keep zone shell with hidden features (rejected: persistent conceptual debt) |
| Keep RunData dead bits (zone/mutator) reserved | Explicit constraint to avoid repack/migration risk | Repack now (rejected: unnecessary risk in cleanup sprint) |
| Keep FullTokenContract integration | Explicit constraint + existing flow stability | Replace token ownership flow (rejected: out of cleanup scope) |
