# Daily Challenge Implementation Plan

## Overview

Add a daily challenge gamemode where all players compete on the same puzzle (shared seed + fixed settings). Players burn a **zTicket** (ERC1155) to enter each attempt. zTickets are purchased for 100 LORDS or 1000 CUBEs — LORDS go to protocol treasury, CUBEs are burned. Prize pools are funded by admin with a fixed LORDS amount per challenge, distributed to top performers via power-law curve.

## Goals

- One daily challenge per day with a shared VRF seed — all players see identical block sequences
- **zTicket** ERC1155 token — transferable entry ticket, purchasable with LORDS or CUBEs
- On-chain leaderboard with flexible ranking (score, level reached, or CUBEs earned)
- Fixed prize pool per challenge (admin-funded), distributed to top N players
- Unlimited attempts per player (each burns 1 zTicket)
- Reuse existing `GameSettings` system for challenge presets

## Non-Goals

- Tournament brackets or elimination rounds (future feature)
- Cross-day streaks or multi-day challenges
- Automated challenge creation (admin/keeper creates daily)
- Frontend implementation (contract-only in this plan, frontend is a separate workstream)
- Dynamic ticket pricing (fixed per config, admin-changeable)

## Assumptions and Constraints

- LORDS ERC20 already deployed on Starknet (external contract)
- VRF available on Sepolia/Mainnet (pseudo-random fallback on Slot)
- 10 settings presets will be created via existing `add_custom_game_settings()` using IDs 100-109
- Challenge period: fixed 24h, midnight-to-midnight UTC
- zTicket price: 100 LORDS or 1000 CUBEs (configurable by admin)
- Prize pool: fixed LORDS amount deposited by admin at challenge creation

## Requirements

### Functional

- **zTicket contract**: Standalone ERC1155 with `purchase_with_lords()` and `purchase_with_cubes()` functions
- **Challenge creation**: Admin creates a daily challenge specifying settings_id, ranking metric, and prize pool amount (deposits LORDS)
- **Registration**: Player burns 1 zTicket to enter an attempt
- **Gameplay**: Player creates a game tied to the daily challenge (receives the shared seed)
- **Leaderboard**: On-chain model tracks each player's best result per challenge
- **Ranking metrics**: Score, level reached, or CUBEs earned — selectable per challenge
- **Prize distribution**: Top N players can claim their share after the challenge ends
- **Prize curve**: N = ceil(total_entries / 4), with a steep top-heavy distribution

### Non-Functional

- zTicket is a standard ERC1155 — transferable, tradeable, visible in wallets
- LORDS from ticket sales go to protocol treasury (not prize pool)
- CUBEs used for ticket purchase are burned (deflationary)
- Minimal gas overhead — leaderboard updates only when a player beats their own best
- Challenge state must be queryable via Torii for frontend

## Technical Design

### Token Architecture

```
┌─────────────────────────────────────────────────────┐
│                   zTicket (ERC1155)                   │
│                                                       │
│  purchase_with_lords(amount)                          │
│    └─ Transfer LORDS from player → treasury           │
│    └─ Mint zTicket(token_id=1) to player              │
│                                                       │
│  purchase_with_cubes(amount)                          │
│    └─ Burn CUBEs from player via CubeToken            │
│    └─ Mint zTicket(token_id=1) to player              │
│                                                       │
│  Standard ERC1155: transfer, balanceOf, etc.          │
│  Admin: set_lords_price, set_cube_price,              │
│         set_treasury_address                          │
└─────────────────────────────────────────────────────┘
```

### Data Model

#### zTicket Contract (standalone ERC1155)

```cairo
// Standalone contract (NOT inside Dojo world)
// Uses OpenZeppelin ERC1155 component
//
// Token ID 1 = zTicket (fungible within ERC1155)
//
// Storage:
//   lords_token: ContractAddress       // LORDS ERC20 address
//   cube_token: ContractAddress        // CubeToken address
//   treasury: ContractAddress          // Protocol treasury (receives LORDS)
//   lords_price: u256                  // Price per ticket in LORDS (default: 100e18)
//   cube_price: u256                   // Price per ticket in CUBEs (default: 1000)
//   daily_system: ContractAddress      // Daily challenge system (can burn tickets)
```

#### DailyChallenge (new Dojo model)

```cairo
#[dojo::model]
pub struct DailyChallenge {
    #[key]
    pub challenge_id: u32,          // Sequential ID
    pub settings_id: u32,           // GameSettings ID (100-109)
    pub seed: felt252,              // VRF seed — shared by all players
    pub start_time: u64,            // UTC timestamp (midnight)
    pub end_time: u64,              // start_time + 86400
    pub ranking_metric: u8,         // 0=score, 1=level, 2=cubes_earned
    pub total_entries: u32,         // Total entry count (incremented per attempt)
    pub prize_pool: u256,           // Fixed LORDS amount deposited by admin
    pub settled: bool,              // True once prize distribution is finalized
}
```

#### DailyEntry (new Dojo model)

```cairo
#[dojo::model]
pub struct DailyEntry {
    #[key]
    pub challenge_id: u32,
    #[key]
    pub player: ContractAddress,
    pub attempts: u32,              // Number of attempts by this player
    pub best_score: u16,            // Best score achieved
    pub best_level: u8,             // Best level reached
    pub best_cubes: u16,            // Best CUBEs earned in a single run
    pub best_game_id: u64,          // Game ID of the best run (for verification)
    pub rank: u32,                  // Final rank (set during settlement)
    pub prize_amount: u256,         // LORDS prize (set during settlement)
    pub claimed: bool,              // Whether prize has been claimed
}
```

#### DailyLeaderboard (new Dojo model — top N tracking)

```cairo
#[dojo::model]
pub struct DailyLeaderboard {
    #[key]
    pub challenge_id: u32,
    #[key]
    pub rank: u32,                  // 1-indexed rank
    pub player: ContractAddress,    // Player at this rank
    pub value: u32,                 // Ranking metric value (score, level, or cubes)
}
```

### Ranking Metric Enum

```cairo
pub enum RankingMetric {
    Score,      // 0 — highest total_score from run_data
    Level,      // 1 — highest level reached
    CubesEarned // 2 — highest CUBEs earned in a single run
}
```

### Prize Distribution Formula

**N = ceil(total_entries / 4)** — number of winners scales with participation.

Distribution uses a power-law curve where the top rank gets the most:

```
share(rank) = (N - rank + 1)^1.5
total_shares = sum(share(1..N))
prize(rank) = pool * share(rank) / total_shares
```

Example with 100 entries, 50 LORDS prize pool (N=25):

| Rank | Share | % of Pool | Prize |
|------|-------|-----------|-------|
| 1 | 25^1.5 = 125.0 | ~18.3% | 9.15 LORDS |
| 2 | 24^1.5 = 117.6 | ~17.2% | 8.60 LORDS |
| 3 | 23^1.5 = 110.3 | ~16.1% | 8.05 LORDS |
| 5 | 21^1.5 = 96.2 | ~14.1% | 7.05 LORDS |
| 10 | 16^1.5 = 64.0 | ~9.4% | 4.70 LORDS |
| 25 | 1^1.5 = 1.0 | ~0.1% | 0.07 LORDS |

Small example (4 entries, 20 LORDS, N=1): winner takes all.

The exponent 1.5 creates a top-heavy but not winner-take-all distribution. The contract uses integer-scaled math (multiply by 1e18 before dividing).

### System Interface

```cairo
#[starknet::interface]
trait IDailyChallengeSystem {
    // === Admin ===
    fn create_daily_challenge(
        ref self: TContractState,
        settings_id: u32,
        ranking_metric: u8,
        prize_amount: u256,         // LORDS to deposit as prize pool
    );
    fn settle_challenge(ref self: TContractState, challenge_id: u32);

    // === Player ===
    fn register_entry(ref self: TContractState, challenge_id: u32);
    // Burns 1 zTicket from caller, increments attempts
    fn submit_result(ref self: TContractState, challenge_id: u32, game_id: u64);
    fn claim_prize(ref self: TContractState, challenge_id: u32);

    // === Views ===
    fn get_current_challenge(self: @TContractState) -> u32;
    fn get_player_entry(self: @TContractState, challenge_id: u32, player: ContractAddress) -> DailyEntry;
}
```

### Game Flow

```
Admin: create_daily_challenge(settings_id=103, ranking=Score, prize=50_LORDS)
  └─ VRF generates shared seed
  └─ Admin transfers prize_amount LORDS to contract
  └─ Stores DailyChallenge model

Player: purchase_with_lords(5)  [on zTicket contract]
  └─ Transfers 500 LORDS (5 × 100) from player → treasury
  └─ Mints 5 zTickets to player

Player: register_entry(challenge_id)  [on daily_challenge_system]
  └─ Burns 1 zTicket from player
  └─ Increments total_entries, creates/updates DailyEntry

Player: create(game_id)  [existing game_system]
  └─ Game detects daily challenge context (token settings_id matches)
  └─ Uses challenge seed instead of VRF (all players get same blocks)
  └─ Game plays normally through move/bonus/surrender flow

Player: submit_result(challenge_id, game_id)
  └─ Reads game's final run_data (score, level, cubes)
  └─ If better than player's best → update DailyEntry
  └─ Update DailyLeaderboard (insert-sort into top N)

[After 24h]

Admin: settle_challenge(challenge_id)
  └─ Calculates N = ceil(total_entries / 4)
  └─ Computes prize amounts for ranks 1..N using power-law
  └─ Writes prize_amount + rank to each winner's DailyEntry
  └─ Marks challenge as settled

Winner: claim_prize(challenge_id)
  └─ Transfers LORDS from contract to winner
  └─ Marks claimed=true
```

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     zTicket (ERC1155)                          │
│  purchase_with_lords() ──► LORDS → treasury, mint ticket       │
│  purchase_with_cubes() ──► burn CUBEs, mint ticket             │
└──────────────┬────────────────────────────────────────────────┘
               │ burn 1 ticket
               ▼
┌───────────────────────────────────────────────────────────────┐
│                    DAILY CHALLENGE SYSTEM                      │
│                                                               │
│  create_daily_challenge() ──► DailyChallenge model            │
│                           ──► Admin deposits LORDS prize pool │
│                                                               │
│  register_entry() ──► Burns 1 zTicket from player             │
│                   ──► DailyEntry model (attempts++)           │
│                                                               │
│  [Player plays game via existing game_system]                 │
│  [Game uses challenge seed for deterministic blocks]          │
│                                                               │
│  submit_result() ──► Read Game.run_data                       │
│                  ──► Update DailyEntry (best scores)          │
│                  ──► Update DailyLeaderboard (top N)          │
│                                                               │
│  settle_challenge() ──► Compute prizes (power-law curve)      │
│                     ──► Write prize amounts to entries         │
│                                                               │
│  claim_prize() ──► Transfer LORDS to winner                   │
└──────────┬──────────────┬──────────────┬──────────────────────┘
           │              │              │
           ▼              ▼              ▼
     ┌──────────┐  ┌────────────┐  ┌──────────────┐
     │CubeToken │  │ LORDS ERC20│  │ Game System  │
     │(burn)    │  │ (transfer) │  │ (existing)   │
     └──────────┘  └────────────┘  └──────────────┘
```

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

#### Phase 0: Data Models & Types

**Prerequisite for:** All subsequent phases

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Create `DailyChallenge` Dojo model in `contracts/src/models/daily.cairo` | New model file with struct + traits |
| 0.2 | Create `DailyEntry` Dojo model (compound key: challenge_id + player) | Model in same file |
| 0.3 | Create `DailyLeaderboard` Dojo model (compound key: challenge_id + rank) | Model in same file |
| 0.4 | Create `RankingMetric` enum in `contracts/src/types/daily.cairo` | New type file |
| 0.5 | Register new models and types in `contracts/src/lib.cairo` | Updated module tree |
| 0.6 | `scarb build` passes with new models | Clean build |

---

### Parallel Workstreams

#### Workstream A: zTicket ERC1155 Contract

**Dependencies:** Phase 0
**Can parallelize with:** Workstreams B, C, D

| Task | Description | Output |
|------|-------------|--------|
| A.1 | Create standalone ERC1155 contract using OpenZeppelin components at `packages/ticket/` | New package with Scarb.toml, src/lib.cairo |
| A.2 | Implement `purchase_with_lords(amount: u256)` — transfer LORDS to treasury, mint tickets | Purchase function with ERC20 transfer_from |
| A.3 | Implement `purchase_with_cubes(amount: u256)` — burn CUBEs via CubeToken, mint tickets | Purchase function with CUBE burn |
| A.4 | Admin functions: `set_lords_price`, `set_cube_price`, `set_treasury` | Configurable pricing |
| A.5 | Add `burn_from(account, amount)` callable by daily_challenge_system | Authorized burn for entry consumption |
| A.6 | Write unit tests for purchase, burn, transfer, admin functions | Test coverage |
| A.7 | Add to workspace Scarb.toml, verify `scarb build` | Integrated in workspace |

#### Workstream B: Core Challenge System

**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, C, D

| Task | Description | Output |
|------|-------------|--------|
| B.1 | Create `contracts/src/systems/daily_challenge.cairo` with trait + impl | New system file |
| B.2 | Implement `create_daily_challenge()` — admin-only, VRF seed, LORDS deposit, stores model | Challenge creation with prize pool |
| B.3 | Implement `register_entry()` — burns 1 zTicket, increments entries, creates/updates DailyEntry | Entry registration |
| B.4 | Implement `submit_result()` — read game run_data, update best scores, update leaderboard | Result submission + leaderboard |
| B.5 | Implement prize calculation helper — power-law curve with integer math (u256) | Pure function: `calculate_prize(rank, n_winners, total_pool) -> u256` |
| B.6 | Implement `settle_challenge()` — admin calls after 24h, computes and writes prizes | Settlement logic |
| B.7 | Implement `claim_prize()` — transfer LORDS from contract to winner | Prize claiming |
| B.8 | Implement view functions (`get_current_challenge`, `get_player_entry`) | Read-only views |

#### Workstream C: Game System Integration

**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, B, D

| Task | Description | Output |
|------|-------------|--------|
| C.1 | Add daily challenge seed injection to `game_system::create()` — detect challenge context via settings_id | Modified game creation to use challenge seed |
| C.2 | Add game-over hook to auto-submit result to daily challenge system | When game ends, check if it's a daily challenge game and update entry |
| C.3 | Add entry validation — ensure player has registered (has DailyEntry with attempts > 0) before creating challenge game | Assert check in create flow |
| C.4 | Verify `is_default_settings` gate prevents CUBE minting for challenge games | Confirm existing behavior |

#### Workstream D: Settings Presets

**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, B, C

| Task | Description | Output |
|------|-------------|--------|
| D.1 | Design 10 diverse settings presets with different draft configs, difficulty, constraints | 10 preset specifications |
| D.2 | Create deployment script to register presets as GameSettings IDs 100-109 | Script in `scripts/` |
| D.3 | Test each preset generates valid, playable games | Manual or scripted verification |

---

### Merge Phase

#### Phase N: Integration & Testing

**Dependencies:** Workstreams A, B, C, D

| Task | Description | Output |
|------|-------------|--------|
| N.1 | Wire zTicket contract address into daily_challenge_system config | System reads ticket contract address |
| N.2 | Wire daily_challenge_system into dojo config (writers, permissions) | Updated `dojo_*.toml` files |
| N.3 | Deploy zTicket contract and register with Torii as external contract | Torii indexes ticket balances |
| N.4 | Write integration tests: full flow (purchase ticket → create challenge → register → play → submit → settle → claim) | Test file `contracts/src/tests/test_daily_challenge.cairo` |
| N.5 | Write unit tests for prize calculation (edge cases: 1 entry, 4 entries, 100 entries, N=1) | Test cases |
| N.6 | Test leaderboard updates (insert, replace, ranking correctness, all 3 metrics) | Unit tests |
| N.7 | Test zTicket purchase with LORDS and CUBEs, insufficient balance, unauthorized burn | zTicket tests |
| N.8 | `scarb build && scarb test` — all green | Clean build + all tests pass |
| N.9 | Deploy to Slot and verify full flow manually | Working on Slot |

---

## Testing and Validation

### Unit Tests
- **zTicket**: purchase with LORDS, purchase with CUBEs, transfer, burn, admin price changes
- **Prize calculation**: 1 entry (winner takes all), 4 entries (N=1), 12 entries (N=3), 100 entries (N=25), 1000 entries (N=250)
- **Leaderboard**: insert first entry, update best, multiple players, ranking order, all 3 metric types
- **Entry**: burn ticket, insufficient tickets, double registration (should increment attempts)

### Integration Tests
- Full lifecycle: purchase ticket → create challenge → register → play → submit → settle → claim
- Multiple players competing on same seed produce identical block sequences
- Player beats own best (entry update)
- Claim after settlement, claim before settlement (should fail)
- Re-registration (second attempt, burns another ticket)

### Edge Cases
- 0 entries after 24h (settle with no winners — admin reclaims pool?)
- 1 entry (sole winner gets 100%)
- Player submits result for wrong challenge
- Player submits game that isn't over yet
- Challenge already settled (can't register)
- Double claim attempt
- Ticket purchased, challenge ends before player uses it (ticket not lost — usable next day)

---

## Rollout and Migration

1. Deploy zTicket ERC1155 contract
2. Deploy new Dojo models and daily_challenge_system to Slot
3. Create 10 settings presets (GameSettings IDs 100-109)
4. Test full daily challenge flow on Slot
5. Deploy to Sepolia for public testing
6. Deploy to Mainnet

**Rollback plan:** Daily challenge is fully additive — no changes to existing game logic. zTickets remain in wallets even if challenge system is paused. Can be disabled by simply not creating new challenges.

## Verification Checklist

- [ ] `scarb build` — zero errors, zero warnings
- [ ] `scarb test` — all tests pass including new daily challenge tests
- [ ] zTicket: `purchase_with_lords(1)` transfers 100 LORDS to treasury, mints 1 ticket
- [ ] zTicket: `purchase_with_cubes(1)` burns 1000 CUBEs, mints 1 ticket
- [ ] zTicket: transferable between players
- [ ] Register: burns exactly 1 zTicket from caller
- [ ] Prize calculation: `calculate_prize(1, 25, 50e18)` returns correct share
- [ ] Seed determinism: two games with same challenge_id produce identical block sequences
- [ ] Leaderboard: correctly ranked by selected metric
- [ ] Settlement: prizes computed and written to entries, sum ≤ prize_pool
- [ ] Claim: LORDS transferred from contract to winner, marked claimed

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LORDS token interface mismatch | Low | High | Verify standard ERC20 interface before building |
| Prize calculation overflow with large pools | Low | High | Use u256 for all prize math, test with max values |
| Same player submitting another player's game_id | Med | High | Verify game ownership via token contract |
| Admin forgets to settle (prizes locked) | Med | Med | Add emergency withdrawal after grace period |
| Gas cost of leaderboard maintenance too high | Low | Med | Cap leaderboard size, only update if player would enter top N |
| VRF unavailable on Slot | Low | Low | Fallback to pseudo-random (already supported) |
| zTicket price manipulation (front-run admin price change) | Low | Med | Price changes take effect next purchase, no retroactive impact |
| Unclaimed prizes accumulate in contract | Med | Low | Add admin sweep after 30-day grace period |

## Open Questions

- [ ] Max leaderboard size cap? (e.g., top 250 max even if N > 250)
- [ ] Grace period for claiming prizes before unclaimed funds are swept?
- [ ] Should settings presets be immutable once created, or admin-editable?
- [ ] Frontend scope: full daily challenge UI (lobby, leaderboard, claim) — separate plan needed
- [ ] Should zTicket have multiple token IDs for different ticket tiers, or just token_id=1?
- [ ] What happens to prize pool if 0 entries? Admin reclaims, or rolls over to next day?

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| zTicket ERC1155 for entry | Decouples purchase from entry, transferable/tradeable, clean UX | Direct LORDS payment (rejected: less flexible, no gifting/trading) |
| Standalone ERC1155 contract | Reusable, registerable with Torii for balance tracking, standard interface | Inside Dojo world (rejected: harder to integrate with wallets/marketplaces) |
| LORDS to treasury, not prize pool | Clean revenue separation, prize pool is admin-controlled | LORDS to pool (rejected: pool size unpredictable, hard to market fixed prizes) |
| CUBEs burned on ticket purchase | Deflationary mechanic, CUBEs stay as in-game economy | CUBEs to treasury (rejected: CUBEs aren't monetary) |
| Fixed prize pool per challenge | Predictable rewards, admin controls economics | Dynamic from entries (rejected: unpredictable, chicken-and-egg problem) |
| Reuse GameSettings for presets | Avoids new model, presets already work with draft system | New DailyPreset model (rejected: duplicates GameSettings) |
| Power-law 1.5 exponent | Top-heavy but not winner-take-all, rewards top ~25% | Linear split (too flat), winner-take-all (too harsh) |
| Challenge-only ranking_metric | Ranking is per-challenge, not per-settings | Adding to GameSettings (rejected: overloads settings model) |
| Admin-created challenges | Predictable ops, can curate preset selection | Lazy creation (rejected: first player bears gas + VRF cost) |
| Manual claim for prizes | Simpler contract, no automated settlement needed | Auto-distribute (rejected: unbounded gas for many winners) |
| Fixed 24h UTC period | Simple, predictable, no timezone confusion | Configurable (rejected: unnecessary complexity for v1) |
| Transferable zTicket | Can be gifted, traded, creates secondary market | Soulbound (rejected: limits flexibility, less fun) |
