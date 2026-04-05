# zKube MVP Redesign Plan

## Overview
This plan narrows the redesign to a prove-it-works MVP. The MVP ships a non-NFT story mode with 2 zones, Zone 2 unlock economy, and a single NFT-based Endless Zone 1 unlocked by clearing Story Zone 1. Daily challenges and broader multi-zone expansion are explicitly deferred to later iterations.

## Goals
- Ship a simpler story mode without NFT/indexer spam
- Prove level replay + star aggregation works cleanly
- Ship Zone 2 unlock economy with stars, USDC, and hybrid payment
- Ship one fully playable Endless Zone 1 with leaderboard and rewards
- Keep quests and achievements working for the MVP story/endless flows

## Non-Goals
- Daily challenge redesign or migration
- More than 2 story zones in MVP
- More than 1 endless zone in MVP
- Story-mode NFTs
- Broad custom-settings productization/UI
- Solving the full future multi-mode plan in this iteration

## Assumptions and Constraints
- Fresh deployment/reset is acceptable; no backward compatibility required
- Story mode should reuse current `Game` runtime where possible, but without NFT ownership
- Endless remains NFT-based and soulbound
- Weekly endless reward tiers should be reused as-is if compatible
- Existing quest and achievement systems should remain in scope for MVP
- Future daily/custom work should stay possible, but is deferred

## Requirements

### Functional
- Story mode has exactly 2 zones in MVP
- Zone 1 is free
- Zone 2 unlocks via:
  - 50 zStar burn path
  - USDC payment path
  - hybrid burn + payment path
- Story map allows replay of any unlocked level
- Replays use fresh RNG
- Replay is single-level only
- Clearing a replayed blocker level unlocks the next level on the map, then returns to map
- Clearing Story Zone 1 unlocks Endless Zone 1
- Endless Zone 1 is fully playable with leaderboard + reward settlement
- Quests and achievements work across MVP story + endless flows

### Non-Functional
- Story mode should reduce indexer load versus NFT-per-story-attempt design
- Endless leaderboard semantics must remain deterministic and fair
- Hybrid unlock logic must be explicit and testable
- MVP should minimize schema churn beyond what is needed to prove the new direction

## Technical Design

### Story Mode Model
Story mode becomes player-progress based, not NFT-based.

#### Keep
- `Game`
- `GameSeed`
- `GameLevel`
- `grid_system`
- most move/level/gameplay logic where reusable

#### Add
- `StoryProgress(player, zone_id)`
- small story session context model keyed by `game_id`

Recommended shape:

```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct StoryProgress {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub zone_id: u8,
    pub level_stars: felt252,      // 2 bits x 10 levels
    pub highest_cleared: u8,       // highest level cleared in this zone
    pub boss_cleared: bool,
    pub perfection_claimed: bool,
}
```

```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct StoryGame {
    #[key]
    pub game_id: felt252,
    pub player: ContractAddress,
    pub zone_id: u8,
    pub level: u8,
    pub is_replay: bool,
}
```

Story ownership/authorization is based on `StoryGame.player`, not ERC721 ownership.

### Story Session Rules
- Story uses no NFTs in MVP
- Story `game_id` is generated via `world.uuid()`
- Only one active story session is allowed per player at a time
- Starting a story level creates a `Game` + `GameSeed` + `GameLevel` + `StoryGame`
- A normal story run starts at the next intended progression level
- Map replay can start any unlocked prior level
- Replay is one-level only
- Replay completion behavior:
  - finish/fail returns to map
  - if the replayed level was the current blocker and is cleared, unlock the next level
  - replay does not chain into the next level automatically

### Story Progression Rules
- Levels unlock sequentially
- A player may play any unlocked level at any time
- Locked future levels remain unavailable until the prior blocker is cleared
- Stars are aggregated per level in `StoryProgress.level_stars`
- Delta minting only mints the improvement over prior best stars for that level
- Perfection bonus remains one-time per zone
- `StoryProgress` is the source of truth for story unlocks, stars, and Endless Zone 1 unlock state

### Story MVP Content
- Zone 1 exists and is free
- Zone 2 exists and costs 50 stars / USDC / hybrid
- Only these 2 zones are in MVP

### Endless MVP Model
Endless remains NFT-based for MVP.

- Only Endless Zone 1 exists in this iteration
- Endless Zone 1 unlocks when `StoryProgress(zone_id=1).boss_cleared == true`
- Endless uses the current EGC/NFT flow, with soulbound rules if needed by the current token setup
- Reuse current weekly leaderboard reward tiers as-is if they work cleanly
- Weekly leaderboard keeps only the top score per player
- All-time global leaderboard is deferred; MVP keeps all-time personal best only via `PlayerBestRun`

### Unlock Economy

#### Story Earnings
- Story stars are earned via per-level delta star improvement
- Perfection bonus remains enabled

#### MVP Unlock Cost
- Zone 2 star unlock cost = `50`

#### Hybrid Unlock Rule
- Modify existing `purchase_map()` rather than adding a new entrypoint
- Hybrid purchase burns stars first, then charges remaining USDC
- Hybrid burn is capped by the 90% discount cap
- Example:
  - `star_cost = 100`
  - player has `99`
  - burn `90`
  - keep `9`
  - pay remaining `10%`
- Full star unlock still burns full `star_cost`

### Quests and Achievements
- Full existing quest + achievement system remains in scope for MVP
- MVP must verify emissions for:
  - story level start
  - story level clear
  - story replay clear
  - endless run submission
  - leaderboard settlement flows where applicable

### Deferred Future Directions
These are not erased; they are explicitly deferred to later iterations:

- daily challenge redesign
- broader multi-zone story rollout beyond Zones 1-2
- additional endless zones beyond Zone 1
- deeper custom settings UX/productization
- broader multi-mode eligibility refinements if MVP proves the direction

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

#### Phase 0: Spec Freeze
**Prerequisite for:** all subsequent phases

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Freeze story contract model (`StoryProgress`, `StoryGame`, `world.uuid()`, one active story session) | Locked story contract spec |
| 0.2 | Freeze replay clear/fail semantics and blocker-unlock behavior | Locked story lifecycle |
| 0.3 | Freeze hybrid `purchase_map()` semantics and rounding (round down) | Locked economy contract behavior |
| 0.4 | Freeze Endless Zone 1 unlock source and weekly leaderboard policy | Locked endless contract behavior |
| 0.5 | Confirm fresh deployment path and seed change workflow | Deployment assumption |
| 0.6 | Freeze deferred items as out of scope | Reduced implementation surface |

---

### Contract-First Workstreams

#### Phase 1: Story Contract Core
**Dependencies:** Phase 0

| Task | Description | Output |
|------|-------------|--------|
| 1.1 | Add `StoryProgress` model | Persistent per-zone story progression |
| 1.2 | Add `StoryGame` context model | Non-NFT story session ownership/context |
| 1.3 | Add story start entrypoint using `world.uuid()` | Start current progression level |
| 1.4 | Add story replay entrypoint | Start selected unlocked level with fresh RNG |
| 1.5 | Enforce one active story session per player | MVP story session guard |
| 1.6 | Modify move/level finalization for single-level replay completion | Replay ends and returns to map semantics |
| 1.7 | Ensure clearing a replayed blocker unlocks the next level | Correct mobile-style progression |

#### Phase 2: Economy + Endless Contract Integration
**Dependencies:** Phase 1

| Task | Description | Output |
|------|-------------|--------|
| 2.1 | Configure Zone 1 free / Zone 2 priced | MVP zone config |
| 2.2 | Modify `purchase_map()` to support hybrid burn + payment semantics | Hybrid unlock contract path |
| 2.3 | Keep star-only unlock path for Zone 2 | Burn unlock path |
| 2.4 | Gate Endless Zone 1 on `StoryProgress.zone_1.boss_cleared` | Unlock dependency |
| 2.5 | Limit MVP endless to Zone 1 only | Reduced scope |
| 2.6 | Reuse current endless NFT flow | Playable endless mode |
| 2.7 | Reuse current weekly leaderboard submission + settlement if compatible | Competitive loop |
| 2.8 | Keep top-score-per-player weekly logic and all-time PB via `PlayerBestRun` | Locked leaderboard policy |

#### Phase 3: Contract Validation + Bindings Refresh
**Dependencies:** Phase 2

| Task | Description | Output |
|------|-------------|--------|
| 3.1 | Validate story start/replay/fail/clear flows | Stable story contracts |
| 3.2 | Validate hybrid unlock math and entitlement creation | Stable economy contracts |
| 3.3 | Validate Endless Zone 1 submission/settlement compatibility | Stable endless contracts |
| 3.4 | Validate quest/achievement emissions for story + endless | Stable meta progression contracts |
| 3.5 | Refresh manifests / Torii / client bindings for new models | Client-ready schema |

#### Phase 4: Client Wiring
**Dependencies:** Phase 3

| Task | Description | Output |
|------|-------------|--------|
| 4.1 | Reduce world map to 2 MVP story zones | MVP map shell |
| 4.2 | Show level unlock state from `StoryProgress` | Accurate map progression |
| 4.3 | Add unlocked-level replay interaction | Replay UX |
| 4.4 | Update Play flow to handle non-NFT story sessions | Story gameplay UX |
| 4.5 | Add Zone 2 unlock UI | Unlock UX |
| 4.6 | Wire Endless Zone 1 gate and entry flow | Endless MVP UX |

---

### Merge Phase

#### Phase 5: MVP Integration
**Dependencies:** Phase 4

| Task | Description | Output |
|------|-------------|--------|
| 5.1 | Integrate story map, replay flow, and progression persistence | Coherent story MVP |
| 5.2 | Integrate Zone 2 economy paths | Unlockable second zone |
| 5.3 | Integrate Endless Zone 1 unlock and loop | Playable endless MVP |
| 5.4 | Integrate quests/achievements end to end | Meta progression MVP |

---

## Testing and Validation

### Contract
- story level start creates `Game` + `StoryGame`
- replay start on unlocked level works
- replay start on locked future level fails
- replay clear updates only that level’s star best
- replay clear of current blocker unlocks next level
- Zone 2 unlock via stars works
- Zone 2 unlock via USDC works
- Zone 2 hybrid unlock burns capped stars correctly
- Story Zone 1 clear unlocks Endless Zone 1
- Endless Zone 1 leaderboard submission works
- Endless Zone 1 settlement rewards work with current tiers

### Client
- 2-zone map renders correctly
- Zone 1 playable by default
- Zone 2 locked until unlocked
- unlocked levels can be replayed
- replay returns to map after finish/fail
- clearing replayed blocker level visibly unlocks next level
- Endless Zone 1 becomes available only after Story Zone 1 clear

### Meta Progression
- quests still advance on story and endless MVP flows
- achievements still advance on story and endless MVP flows

## Rollout and Migration
- Fresh deployment only
- Change dojo slot seed / namespace for deployment
- No migration/back-compat required for current live data

## Verification Checklist
- `scarb test`
- story flow manual check:
  - start Zone 1
  - clear levels forward
  - fail a blocker level
  - replay that level
  - clear it
  - verify next level unlocks
- unlock flow manual check:
  - earn stars
  - unlock Zone 2 via stars
  - unlock Zone 2 via USDC
  - unlock Zone 2 via hybrid path
- endless flow manual check:
  - clear Story Zone 1 boss
  - verify Endless Zone 1 unlocks
  - play endless
  - verify PB/leaderboard submission
  - verify settlement rewards
- client build:
  - `pnpm tsc --noEmit && pnpm build`

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Story replay logic breaks current chained-level assumptions | Med | High | Keep MVP story scope narrow and add explicit replay finalization paths |
| Hybrid unlock semantics diverge from current config code | High | Med | Modify `purchase_map()` directly and test all three unlock paths |
| Endless leaderboard reuse has hidden coupling | Med | Med | Reuse only if compatible; otherwise simplify without expanding MVP scope |
| Quest/achievement events miss replay edge cases | Med | Med | Add targeted replay + endless progression tests |
| Fresh deployment hides migration issues for later | Low | Med | Keep deferred notes for later iterations |

## Open Questions
- [ ] Exact USDC price for Zone 2
- [ ] Exact MVP mutator/config tuning for Zone 1 and Zone 2

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Story mode uses no NFTs in MVP | Reduce indexer load and prove cleaner progression model | Story NFTs, all-mode NFTs |
| Story replay is single-level only | Matches expected map-star replay behavior and minimizes complexity | Replay chains onward |
| Clearing replayed blocker unlocks next level but still returns to map | Mobile-game-consistent progression | Auto-chain to next level |
| MVP includes only 2 story zones | Constrains scope while proving economy + replay loop | Full 10-zone rollout |
| Zone 2 uses stars + USDC + hybrid unlock | Economy path should be validated early | Stars only, USDC only |
| Modify existing `purchase_map()` for hybrid | Smaller surface than adding a new entrypoint | New hybrid-specific function |
| Endless MVP is Zone 1 only | Prove unlock + competitive loop without scaling content | All endless zones |
| Reuse existing weekly reward tiers if they work | Faster MVP validation | New simplified reward schedule |
| Story `game_id` uses `world.uuid()` | Clean non-NFT session identity | Hash-based ids, progression-tied ids |
| Only one active story session per player | Simplest MVP lifecycle | Multiple concurrent sessions |
| Endless Zone 1 unlock is derived from `StoryProgress` | No extra unlock model needed in MVP | MapEntitlement, separate unlock model |
| Weekly leaderboard only; all-time PB only | Reuse current competitive loop without duplicate ranked state | On-chain all-time leaderboard |
| Daily is deferred | Keeps MVP tractable | Full multi-mode implementation now |
| Fresh deployment/reset | Simplest path for a breaking redesign | Backward-compatible migration |
