# zKube Cube Economy System

> **Status:** Planning Complete - Ready for Implementation  
> **Last Updated:** January 2026  
> **Token Standard:** ERC-1155 (Soulbound)

## Overview

CUBE is zKube's soulbound currency token. Players earn cubes by completing levels efficiently and achieving combos. Cubes can be spent in two shops:
- **Permanent Shop** (outside game): Loadouts, upgrades, cube bridging ranks
- **In-Game Shop** (every 5 levels): Consumables like extra bonuses, move refills

---

## Core Mechanics

### Cube Earning (During Run)

| Trigger | Cubes Earned | Notes |
|---------|--------------|-------|
| Level complete (3-cube performance) | 3 | Moves <= 40% of max |
| Level complete (2-cube performance) | 2 | Moves <= 70% of max |
| Level complete (1-cube performance) | 1 | Level completed |
| Level milestone (10, 20, 30...) | level / 2 | +5 at L10, +10 at L20, +15 at L30... (max +50) |
| Clear 4 lines in one move | +1 | Combo bonus |
| Clear 5 lines in one move | +2 | Rare combo bonus |
| Clear 6+ lines in one move | +3 | Very rare combo bonus |
| First 5x combo in run | +3 | One-time achievement |
| First 10x combo in run | +5 | One-time achievement |

#### Milestone Bonus Examples

| Level | Milestone Bonus | Calculation |
|-------|-----------------|-------------|
| 10 | +5 cubes | 10 / 2 |
| 20 | +10 cubes | 20 / 2 |
| 30 | +15 cubes | 30 / 2 |
| 50 | +25 cubes | 50 / 2 |
| 80 | +40 cubes | 80 / 2 |
| 100+ | +50 cubes | Capped at 50 |

### Cube Flow Diagram

```
                         WALLET: 253 CUBES
                               |
          +--------------------+--------------------+
          |                                         |
          v                                         v
   PERMANENT SHOP                            START NEW RUN
   (anytime)                                       |
          |                              +---------+---------+
          v                              |                   |
   - Loadouts                     Fresh Start         Bring Cubes
   - Bridging Ranks              (0 cubes)           (requires unlock)
   - New Bonuses                      |                   |
          |                           |                   v
          v                           |            Transfer cubes
     BURN CUBES                       |            into run budget
                                      |                   |
                                      +--------+----------+
                                               |
                                               v
                              +--------------------------------+
                              |          DURING RUN            |
                              |                                |
                              |  Brought: 20 (budget)          |
                              |  Earned:  0  (accumulating)    |
                              |                                |
                              |  Every 5 levels:               |
                              |  IN-GAME SHOP appears          |
                              |  - Spend brought cubes         |
                              |  - Buy consumables             |
                              +--------------------------------+
                                               |
                              +----------------+----------------+
                              |                                 |
                              v                                 v
                           DEATH                          GAME COMPLETE
                              |                                 |
                              v                                 v
                    Brought: LOST              Brought: LOST (spent or not)
                    Earned: MINTED             Earned: MINTED
                              |                                 |
                              +----------------+----------------+
                                               |
                                               v
                                    WALLET: 253 + earned cubes
```

---

## Two-Shop System

### 1. Permanent Shop (Outside Game)

Accessible from main menu. Purchases are permanent unlocks.

#### Starting Bonus Upgrades

Unlock the ability to start each run with bonuses already in your inventory.

| Bonus Type | Level | Cost | Starting Bonuses |
|------------|-------|------|------------------|
| Hammer | 1 | 50 | Start with 1 Hammer |
| Hammer | 2 | 200 | Start with 2 Hammers |
| Hammer | 3 | 500 | Start with 3 Hammers |
| Wave | 1 | 50 | Start with 1 Wave |
| Wave | 2 | 200 | Start with 2 Waves |
| Wave | 3 | 500 | Start with 3 Waves |
| Totem | 1 | 50 | Start with 1 Totem |
| Totem | 2 | 200 | Start with 2 Totems |
| Totem | 3 | 500 | Start with 3 Totems |

**Total to max all starting bonuses:** 750 * 3 = 2,250 cubes

#### Bonus Bag Size Upgrades

By default, players can hold **3 of each bonus type** (Hammer, Wave, Totem). Each upgrade increases the max capacity by 1.

| Bonus Type | Upgrade | Cost | New Max Capacity |
|------------|---------|------|------------------|
| Hammer | Level 1 | 10 | 4 |
| Hammer | Level 2 | 20 | 5 |
| Hammer | Level 3 | 40 | 6 |
| Hammer | Level 4 | 80 | 7 |
| Hammer | Level 5 | 160 | 8 |
| ... | ... | 2x previous | +1 |

Same progression applies to Wave and Totem independently.

**Formula:** Cost for level N = 10 * 2^(N-1) cubes

#### Cube Bridging Upgrades

Unlocks the ability to bring cubes into a run. Each upgrade doubles the cost and capacity.

| Rank | Cost | Max Cubes to Bring | Total Invested |
|------|------|-------------------|----------------|
| 0 (default) | Free | 0 | 0 |
| 1 | 100 | 5 | 100 |
| 2 | 200 | 10 | 300 |
| 3 | 400 | 20 | 700 |
| 4 | 800 | 40 | 1,500 |
| 5 | 1,600 | 80 | 3,100 |
| 6 | 3,200 | 160 | 6,300 |
| ... | 2x previous | 2x previous | ... |

**Formula:** 
- Cost for rank N = 100 * 2^(N-1) cubes
- Max cubes for rank N = 5 * 2^(N-1)

#### Future Unlocks (Post-MVP)

| Item | Cost | Effect |
|------|------|--------|
| Unlock "Freeze" Bonus | 500 | New bonus type |
| Unlock "Bomb" Bonus | 750 | New bonus type |

### 2. In-Game Shop (Every 5 Levels)

Appears after completing levels 5, 10, 15, 20, etc. Only spends **brought cubes**.

| Item | Cost | Effect |
|------|------|--------|
| Hammer | 5 | +1 Hammer |
| Wave | 5 | +1 Wave |
| Totem | 5 | +1 Totem |
| Full Refill (per type) | bag_size * 3 | Refill one bonus type to max (default: 9 cubes) |
| Skip Constraint | 20 | Auto-complete current level's constraint |
| Revival Token | 30 | Continue after death (single use) |

**Note:** Full Refill cost scales with your bag size upgrades. If you've upgraded Hammer bag to size 5, refilling Hammer costs 15 cubes (5 * 3).

---

## Brought vs Earned Cubes

This is the core risk/reward mechanic:

| Cube Type | Source | On Death | On Game Complete | Can Spend In-Game |
|-----------|--------|----------|------------------|-------------------|
| **Brought** | Transferred from wallet at run start | LOST | LOST | YES |
| **Earned** | Accumulated during run | MINTED | MINTED | NO |

### Why This Design?

1. **Brought cubes = consumable budget**: You bring them to spend them. Any unspent cubes are lost at game end.
2. **Earned cubes = pure reward**: Always minted to wallet, regardless of death or completion.
3. **Risk/reward**: Bringing cubes makes the run easier but costs you. Not bringing cubes is harder but all rewards are profit.

### Example Scenarios

**Scenario A: Aggressive spending**
- Bring 40 cubes (requires Bridging Rank 3)
- Spend on: 2 Hammers (10), 1 Wave (5), 1 Revival (30) = 45... oops, need to be smarter!
- Actually spend: 3 Hammers (15), 2 Waves (10), Skip Constraint (20) = 45 > 40, can't afford all
- Spend: 3 Hammers (15), 2 Waves (10) = 25 cubes
- Die at level 35
- Earned: 52 cubes (levels + milestones at 10, 20, 30)
- Result: +12 net cubes (52 earned - 40 brought)

**Scenario B: Conservative run**
- Bring 0 cubes
- Reach level 25
- Earned: 40 cubes (25 from levels + 15 from milestones at 10, 20)
- Result: +40 net cubes (pure profit)

**Scenario C: Wasted investment**
- Bring 50 cubes, only spend 10
- Die at level 8
- Earned: 12 cubes
- Result: -38 net cubes (12 earned - 50 brought)

---

## Technical Architecture

### CUBE Token Contract (ERC-1155)

```
packages/cube_token/
├── Scarb.toml
└── src/
    ├── lib.cairo
    └── cube_token.cairo
```

**Key Features:**
- Token ID 1 = CUBE
- Soulbound (no transfers except to/from game contracts)
- Mint: Only callable by `game_system`
- Burn: Only callable by `shop_system` and `game_system`

```cairo
#[starknet::interface]
trait ICubeToken<TState> {
    // View
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn uri(self: @TState, token_id: u256) -> ByteArray;
    
    // Game system only
    fn mint(ref self: TState, to: ContractAddress, amount: u256);
    fn burn_from_game(ref self: TState, from: ContractAddress, amount: u256);
    
    // Shop system only  
    fn burn_from_shop(ref self: TState, from: ContractAddress, amount: u256);
}
```

### Game Model Changes

#### RunData (bit-packed, extends current structure)

Add these fields to the existing RunData:

```
Current (68 bits):
  bits 0-6:   current_level (7 bits)
  bits 7-14:  level_score (8 bits)
  bits 15-21: level_moves (7 bits)
  bits 22-25: constraint_progress (4 bits)
  bit 26:     bonus_used_this_level (1 bit)
  bits 27-35: total_stars (9 bits)         -> RENAME to cubes_earned
  bits 36-39: hammer_count (4 bits)
  bits 40-43: wave_count (4 bits)
  bits 44-47: totem_count (4 bits)
  bits 48-51: max_combo_run (4 bits)
  bits 52-67: total_score (16 bits)

New fields (add to reserved space):
  bits 68-76: cubes_brought (9 bits, max 511)
  bits 77-85: cubes_spent (9 bits, max 511)
  bit 86:     revival_available (1 bit)
  bits 87-90: combo_5_achieved (1 bit), combo_10_achieved (1 bit), reserved (2 bits)
```

#### PlayerMeta Model (new)

Stores permanent unlocks per player.

```cairo
#[dojo::model]
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    // Bag size upgrades (default 3, each upgrade +1)
    pub hammer_bag_level: u8,       // 0 = size 3, 1 = size 4, etc.
    pub wave_bag_level: u8,
    pub totem_bag_level: u8,
    // Cube bridging
    pub bridging_rank: u8,          // 0 = can't bridge, 1 = 5 cubes, 2 = 10, etc.
    // Future unlocks
    pub bonus_unlocks: u8,          // Bitmask of unlocked bonus types
    // Stats
    pub highest_level: u8,
    pub total_cubes_earned: u32,
    pub total_runs: u16,
}

// Helper functions
impl PlayerMetaImpl of PlayerMetaTrait {
    fn get_bag_size(self: @PlayerMeta, bonus_type: BonusType) -> u8 {
        let base_size: u8 = 3;
        match bonus_type {
            BonusType::Hammer => base_size + *self.hammer_bag_level,
            BonusType::Wave => base_size + *self.wave_bag_level,
            BonusType::Totem => base_size + *self.totem_bag_level,
        }
    }
    
    fn get_max_cubes_to_bring(self: @PlayerMeta) -> u16 {
        if *self.bridging_rank == 0 { return 0; }
        // 5 * 2^(rank-1)
        5_u16 * pow(2, (*self.bridging_rank - 1).into())
    }
}
```

### New Systems

#### Shop System

```cairo
#[starknet::interface]
trait IShopSystem<TState> {
    // Permanent shop - Bag upgrades
    fn upgrade_bag_size(ref self: TState, bonus_type: BonusType);
    fn upgrade_bridging_rank(ref self: TState);
    fn purchase_bonus_unlock(ref self: TState, bonus_id: u8);
    
    // View
    fn get_bag_upgrade_cost(self: @TState, current_level: u8) -> u16;  // 10 * 2^level
    fn get_bridging_upgrade_cost(self: @TState, current_rank: u8) -> u16;  // 100 * 2^rank
    fn get_player_meta(self: @TState, player: ContractAddress) -> PlayerMeta;
}
```

#### Game System (modifications)

```cairo
// Consumable types
enum ConsumableType {
    Hammer,         // 5 cubes - +1 Hammer
    Wave,           // 5 cubes - +1 Wave
    Totem,          // 5 cubes - +1 Totem
    FullRefill,     // bag_size * 3 cubes - Refill one bonus type to max
    SkipConstraint, // 20 cubes - Auto-complete constraint
    Revival,        // 30 cubes - Continue after death
}

// New functions
fn start_run_with_cubes(ref self: TState, token_id: u64, cubes_amount: u16);
fn purchase_consumable(ref self: TState, game_id: u64, consumable: ConsumableType, bonus_type: Option<BonusType>);

// Modified functions
fn complete_level(ref self: TState, game: Game) {
    // ... existing logic ...
    
    // Award cubes based on performance (1-3)
    let cubes = calculate_cubes_earned(level_moves, max_moves);
    game.cubes_earned += cubes;
    
    // Milestone bonus: level / 2 cubes, capped at 50
    if game.level % 10 == 0 {
        let milestone_bonus = min(game.level / 2, 50);
        game.cubes_earned += milestone_bonus;
    }
    
    // Combo bonuses (4+ lines cleared in one move)
    // Handled in make_move() when lines are cleared
    
    // Check for shop trigger (every 5 levels)
    if game.level % 5 == 0 {
        emit!(InGameShopAvailable { game_id: game.id });
    }
}

fn make_move(ref self: TState, game: Game, ...) {
    // ... existing logic ...
    
    // Award combo cubes
    if lines_cleared >= 4 {
        let combo_cubes = match lines_cleared {
            4 => 1,
            5 => 2,
            _ => 3,  // 6+
        };
        game.cubes_earned += combo_cubes;
        emit!(CubesEarned { game_id: game.id, amount: combo_cubes, reason: CubeEarnReason::Combo });
    }
    
    // Check for first 5x/10x combo achievements
    if game.max_combo >= 5 && !game.combo_5_achieved {
        game.combo_5_achieved = true;
        game.cubes_earned += 3;
        emit!(CubesEarned { game_id: game.id, amount: 3, reason: CubeEarnReason::Achievement });
    }
    if game.max_combo >= 10 && !game.combo_10_achieved {
        game.combo_10_achieved = true;
        game.cubes_earned += 5;
        emit!(CubesEarned { game_id: game.id, amount: 5, reason: CubeEarnReason::Achievement });
    }
}

fn game_over(ref self: TState, game: Game) {
    // ... existing logic ...
    
    // Mint earned cubes (brought cubes are already lost)
    if game.cubes_earned > 0 {
        let cube_token = ICubeTokenDispatcher { contract_address: self.cube_token_address() };
        cube_token.mint(game.player, game.cubes_earned.into());
    }
    
    // Update player meta
    let mut meta: PlayerMeta = world.read_model(game.player);
    meta.total_cubes_earned += game.cubes_earned.into();
    meta.total_runs += 1;
    if game.level > meta.highest_level {
        meta.highest_level = game.level;
    }
    world.write_model(@meta);
}

fn purchase_consumable(ref self: TState, game_id: u64, consumable: ConsumableType, bonus_type: Option<BonusType>) {
    let game: Game = world.read_model(game_id);
    let meta: PlayerMeta = world.read_model(game.player);
    
    let cost = match consumable {
        ConsumableType::Hammer | ConsumableType::Wave | ConsumableType::Totem => 5,
        ConsumableType::FullRefill => {
            let bag_size = meta.get_bag_size(bonus_type.unwrap());
            bag_size.into() * 3
        },
        ConsumableType::SkipConstraint => 20,
        ConsumableType::Revival => 30,
    };
    
    assert!(game.cubes_brought - game.cubes_spent >= cost, "Not enough cubes");
    game.cubes_spent += cost;
    
    // Apply effect...
}
```

### Events

```cairo
#[dojo::event]
pub struct CubesEarned {
    #[key]
    pub game_id: u64,
    pub amount: u16,
    pub reason: CubeEarnReason,  // LevelComplete, Milestone, Combo, Achievement
}

#[dojo::event]
pub struct CubesSpent {
    #[key]
    pub game_id: u64,
    pub amount: u16,
    pub item_id: u8,
}

#[dojo::event]
pub struct InGameShopAvailable {
    #[key]
    pub game_id: u64,
}

#[dojo::event]
pub struct PermanentPurchase {
    #[key]
    pub player: ContractAddress,
    pub item_type: PurchaseType,  // Loadout, BridgingRank, BonusUnlock
    pub item_id: u8,
    pub cost: u16,
}
```

---

## Frontend Changes

### New Components

```
client-budokan/src/ui/
├── components/
│   ├── CubeBalance.tsx           # Wallet cube display
│   ├── InGameShopModal.tsx       # Shop at level 5, 10, 15...
│   ├── PermanentShopScreen.tsx   # Main menu shop
│   ├── LoadoutSelector.tsx       # Pre-run loadout choice
│   ├── CubeBridgeModal.tsx       # Choose cubes to bring
│   └── RunSummary.tsx            # End-of-run cube earnings
├── screens/
│   └── Shop.tsx                  # Permanent shop screen
```

### New Hooks

```typescript
// hooks/useCubeBalance.ts
function useCubeBalance(address: string): {
  balance: number;
  isLoading: boolean;
}

// hooks/usePlayerMeta.ts
function usePlayerMeta(address: string): {
  loadoutUnlocks: number[];
  bridgingRank: number;
  maxCubesToBring: number;
  highestLevel: number;
}

// hooks/useInGameShop.ts
function useInGameShop(gameId: string): {
  isShopAvailable: boolean;
  cubesAvailable: number;
  purchaseItem: (itemId: number) => Promise<void>;
}
```

### State Management

```typescript
// stores/cubeStore.ts
interface CubeStore {
  // Wallet
  walletBalance: number;
  
  // Current run
  cubesBrought: number;
  cubesSpent: number;
  cubesEarned: number;
  
  // Actions
  refreshBalance: () => Promise<void>;
  startRunWithCubes: (amount: number) => void;
  spendCubes: (amount: number, itemId: number) => void;
}
```

---

## Implementation Phases

### Phase 1: CUBE Token Contract (3-4 days)
- [ ] Create `packages/cube_token/` package
- [ ] Implement ERC-1155 with soulbound restrictions
- [ ] Add mint/burn functions with access control
- [ ] Write unit tests
- [ ] Deploy to slot

### Phase 2: Game Integration - Earning (3-4 days)
- [ ] Add cube tracking fields to RunData
- [ ] Implement cube earning on level complete
- [ ] Implement milestone bonuses (every 10 levels)
- [ ] Implement combo bonuses (4+, 5+, 6+ lines)
- [ ] Implement achievement bonuses (first 5x combo, 10x combo)
- [ ] Mint cubes at game over
- [ ] Add CubesEarned events
- [ ] Frontend: Display cubes earned during run

### Phase 3: PlayerMeta & Permanent Shop (4-5 days)
- [ ] Create PlayerMeta model
- [ ] Create shop_system.cairo
- [ ] Implement loadout purchases
- [ ] Implement bridging rank purchases
- [ ] Frontend: Permanent shop screen
- [ ] Frontend: Loadout selector at run start
- [ ] Frontend: Cube balance display

### Phase 4: Cube Bridging & In-Game Shop (4-5 days)
- [ ] Implement start_run_with_cubes()
- [ ] Implement cube spending (burn from wallet, add to run budget)
- [ ] Implement in-game shop trigger (every 5 levels)
- [ ] Implement purchase_consumable()
- [ ] Implement consumable effects (extra bonus, move refill, etc.)
- [ ] Frontend: Cube bridge modal
- [ ] Frontend: In-game shop modal
- [ ] Frontend: Run summary with cube breakdown

### Phase 5: Polish & Balance (2-3 days)
- [ ] Balance cube earning rates
- [ ] Balance shop prices
- [ ] Add animations for cube earning
- [ ] Add sound effects
- [ ] Edge case handling
- [ ] Final testing

---

## Migration Considerations

### Existing Players
- Current "stars" in RunData become "cubes_earned"
- No existing CUBE token balance (fresh start)
- PlayerMeta created on first interaction

### Data Migration
- RunData field rename: `total_stars` -> `cubes_earned`
- No breaking changes to existing game logic
- New fields use reserved bits in RunData

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Token name | CUBE |
| When is in-game shop accessible? | Every 5 levels (5, 10, 15...) |
| Cube earning beyond levels | Level completion + milestones + combos |
| What happens to brought cubes on death? | Lost (burned) |
| What happens to brought cubes on completion? | Lost (must spend or lose) |

---

## Success Criteria

- [ ] CUBE token deployed and functional
- [ ] Players earn cubes during gameplay
- [ ] Cubes minted to wallet at game over
- [ ] Permanent shop allows purchases
- [ ] Bridging ranks unlock cube-bringing ability
- [ ] In-game shop appears every 5 levels
- [ ] Brought cubes can be spent on consumables
- [ ] Unspent brought cubes are lost at game end
- [ ] All events emit correctly for indexing
- [ ] UI displays cube balance and earnings

---

## File Structure Summary

### New Files
```
packages/cube_token/
├── Scarb.toml
└── src/
    ├── lib.cairo
    └── cube_token.cairo

contracts/src/
├── models/
│   └── player_meta.cairo       # NEW
├── systems/
│   └── shop.cairo              # NEW
├── types/
│   ├── consumable.cairo        # NEW
│   └── loadout.cairo           # NEW
└── events/
    └── cube_events.cairo       # NEW

client-budokan/src/
├── hooks/
│   ├── useCubeBalance.ts       # NEW
│   ├── usePlayerMeta.ts        # NEW
│   └── useInGameShop.ts        # NEW
├── stores/
│   └── cubeStore.ts            # NEW
└── ui/
    ├── components/
    │   ├── CubeBalance.tsx         # NEW
    │   ├── InGameShopModal.tsx     # NEW
    │   ├── LoadoutSelector.tsx     # NEW
    │   ├── CubeBridgeModal.tsx     # NEW
    │   └── RunSummary.tsx          # NEW
    └── screens/
        └── Shop.tsx                # NEW
```

### Modified Files
```
contracts/src/
├── models/game.cairo           # Add cube fields to RunData
├── systems/game.cairo          # Add cube earning, minting, shop triggers
├── helpers/packing.cairo       # Add cube field packing
└── lib.cairo                   # Export new modules

client-budokan/src/
├── ui/screens/Play.tsx         # Add cube display, shop triggers
├── ui/screens/Home.tsx         # Add shop entry, cube balance
├── ui/components/LevelHeader.tsx    # Show cubes earned
└── ui/components/GameOverDialog.tsx # Show cube summary
```
