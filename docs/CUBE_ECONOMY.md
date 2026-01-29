# zKube Cube Economy System

> **Status:** Fully Implemented  
> **Version:** 1.2.0  
> **Last Updated:** January 2026  
> **Token Standard:** ERC-1155 Soulbound Token (`cube_token` system, CUBE_TOKEN_ID=1)

## Overview

CUBE is zKube's currency. Players earn cubes by completing levels efficiently and achieving combos. Cubes can be spent in two shops:
- **Permanent Shop** (outside game): Starting bonuses, bag size upgrades, cube bridging ranks
- **In-Game Shop** (every 5 levels): Consumable bonuses (Hammer, Wave, Totem)

---

## Implementation Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| CUBE Token Contract | **IMPLEMENTED** | Soulbound ERC1155 in `systems/cube_token.cairo` |
| RunData cube tracking | **IMPLEMENTED** | cubes_brought, cubes_spent, combo achievements |
| Combo bonuses (4+, 5+, 6+ lines) | **IMPLEMENTED** | Awards +1/+2/+3 cubes |
| Achievement bonuses (5x, 10x combo) | **IMPLEMENTED** | Awards +3/+5 cubes one-time |
| Level completion cubes (1-3) | **IMPLEMENTED** | Based on moves vs cube_3_threshold/cube_2_threshold |
| Milestone bonuses | **NOT IMPLEMENTED** | Planned level/2 every 10 levels (capped at 50) |
| PlayerMeta model | **IMPLEMENTED** | Tracks upgrades and best_level |
| Permanent Shop (backend) | **IMPLEMENTED** | `systems/shop.cairo` |
| Permanent Shop (frontend) | **IMPLEMENTED** | `ShopDialog.tsx` component |
| Cube Bridging | **IMPLEMENTED** | `create_with_cubes()`, `BringCubesDialog.tsx` |
| In-Game Shop (backend) | **IMPLEMENTED** | Hammer, Wave, Totem consumables |
| In-Game Shop (frontend) | **IMPLEMENTED** | `InGameShopDialog.tsx` component |
| Cube earning animations | **IMPLEMENTED** | `CubeEarnedAnimation.tsx` component |
| Cube minting at game over | **IMPLEMENTED** | ERC1155 mint via CubeToken contract |
| ExtraMoves consumable | **NOT IMPLEMENTED** | Type exists but panics if purchased |

---

## Core Mechanics

### Cube Earning (During Run)

| Trigger | Cubes Earned | Status | Notes |
|---------|--------------|--------|-------|
| Level complete (3-cube performance) | 3 | **IMPLEMENTED** | Moves <= 40% of max (cube_3_threshold) |
| Level complete (2-cube performance) | 2 | **IMPLEMENTED** | Moves <= 70% of max (cube_2_threshold) |
| Level complete (1-cube performance) | 1 | **IMPLEMENTED** | Level completed |
| Level milestone (10, 20, 30...) | level / 2 | **NOT IMPLEMENTED** | +5 at L10, +10 at L20, etc. |
| Clear 4 lines in one move | +1 | **IMPLEMENTED** | Combo bonus |
| Clear 5 lines in one move | +2 | **IMPLEMENTED** | Rare combo bonus |
| Clear 6+ lines in one move | +3 | **IMPLEMENTED** | Very rare combo bonus |
| First 5x combo in run | +3 | **IMPLEMENTED** | One-time achievement |
| First 10x combo in run | +5 | **IMPLEMENTED** | One-time achievement |

#### Cube Thresholds (from LevelConfig)

The level generator calculates cube thresholds based on max_moves:
- `cube_3_threshold = max_moves * 40 / 100` (3 cubes if moves <= this)
- `cube_2_threshold = max_moves * 70 / 100` (2 cubes if moves <= this)
- 1 cube for any level completion

#### Milestone Bonus (NOT YET IMPLEMENTED)

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
                              |  - Spend brought OR earned     |
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
                    Earned: KEPT               Earned: KEPT
                              |                                 |
                              +----------------+----------------+
                                               |
                                               v
                                    WALLET: updated balance
```

**Implementation Note:** Currently, earned cubes reduce the loss from brought cubes. If you bring 20 and earn 15 but spend 25, you effectively lose 10 from your wallet (25 spent - 15 earned = 10 net loss from brought).

---

## Two-Shop System

### 1. Permanent Shop (Outside Game) - **IMPLEMENTED**

Accessible from main menu via ShopDialog. Purchases are permanent unlocks.

#### Starting Bonus Upgrades - **IMPLEMENTED**

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

#### Bonus Bag Size Upgrades - **IMPLEMENTED**

By default, players can hold **1 of each bonus type** (Hammer, Wave, Totem). Each upgrade increases the max capacity by 1, up to a maximum of 3 upgrades (max bag size = 4).

| Bonus Type | Upgrade | Cost | New Max Capacity |
|------------|---------|------|------------------|
| Hammer | Level 1 | 10 | 2 |
| Hammer | Level 2 | 20 | 3 |
| Hammer | Level 3 | 40 | 4 (max) |

Same progression applies to Wave and Totem independently.

**Formula:** Cost for level N = 10 * 2^(N-1) cubes

#### Cube Bridging Upgrades - **IMPLEMENTED**

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

#### Future Unlocks (Post-MVP) - **NOT IMPLEMENTED**

| Item | Cost | Effect |
|------|------|--------|
| Unlock "Freeze" Bonus | 500 | New bonus type |
| Unlock "Bomb" Bonus | 750 | New bonus type |

### 2. In-Game Shop (Every 5 Levels) - **PARTIALLY IMPLEMENTED**

Appears after completing levels 5, 10, 15, 20, etc. Can spend **brought + earned cubes**.

| Item | Cost | Effect | Status |
|------|------|--------|--------|
| Hammer | 5 | +1 Hammer | **IMPLEMENTED** |
| Wave | 5 | +1 Wave | **IMPLEMENTED** |
| Totem | 5 | +1 Totem | **IMPLEMENTED** |
| Full Refill (per type) | bag_size * 3 | Refill one bonus type to max | **NOT IMPLEMENTED** |
| Skip Constraint | 20 | Auto-complete current level's constraint | **NOT IMPLEMENTED** |
| Revival Token | 30 | Continue after death (single use) | **NOT IMPLEMENTED** |
| Extra Moves | 10 | Add extra moves to current level | **NOT IMPLEMENTED** |

---

## Brought vs Earned Cubes

This is the core risk/reward mechanic:

| Cube Type | Source | On Death | On Game Complete | Can Spend In-Game |
|-----------|--------|----------|------------------|-------------------|
| **Brought** | Transferred from wallet at run start | LOST | LOST | YES |
| **Earned** | Accumulated during run | KEPT | KEPT | YES (modified from original design) |

**Implementation Note:** The original design had earned cubes as unspendable during the run. The current implementation allows spending both brought AND earned cubes in the in-game shop. Spending depletes brought cubes first, then dips into earned cubes.

### Why This Design?

1. **Brought cubes = investment**: You bring them to spend them. Any unspent cubes are lost at game end.
2. **Earned cubes = reward**: Can be spent OR kept. At game end, remaining earned cubes (minus any that were spent) update your balance.
3. **Risk/reward**: Bringing cubes makes the run easier but costs you. Not bringing cubes is harder but all rewards are profit.

---

## Technical Architecture

### CUBE Token Contract (ERC-1155) - **IMPLEMENTED**

Soulbound ERC1155 token in `contracts/src/systems/cube_token.cairo`:
- Token ID: `CUBE_TOKEN_ID = 1`
- Soulbound: transfers blocked (only mint/burn allowed)
- Access Control: `MINTER_ROLE` granted to `game_system` and `shop_system` via world DNS
- Game over mints earned cubes; shop upgrades burn cubes
- Torii indexes balances via `register_external_contract()`
- Frontend queries via `useCubeBalance` hook (GraphQL polling every 10s)

### RunData (bit-packed) - **IMPLEMENTED**

```
Current layout (88 bits used):
  bits 0-6:   current_level (7 bits)
  bits 7-14:  level_score (8 bits)
  bits 15-21: level_moves (7 bits)
  bits 22-25: constraint_progress (4 bits)
  bit 26:     bonus_used_this_level (1 bit)
  bits 27-35: total_cubes (9 bits)
  bits 36-39: hammer_count (4 bits)
  bits 40-43: wave_count (4 bits)
  bits 44-47: totem_count (4 bits)
  bits 48-51: max_combo_run (4 bits)
  bits 52-67: total_score (16 bits)
  bit 68:     combo_5_achieved (1 bit)
  bit 69:     combo_10_achieved (1 bit)
  bits 70-78: cubes_brought (9 bits)
  bits 79-87: cubes_spent (9 bits)
```

### PlayerMeta Model - **IMPLEMENTED**

Stores permanent unlocks per player in `contracts/src/models/player.cairo`:

```cairo
#[dojo::model]
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    pub data: felt252,      // Bit-packed MetaData (upgrades, stats)
    pub best_level: u8,     // Highest level reached
}
```

**Note:** `cube_balance` field was removed. Cube balance is now tracked via the ERC1155 CubeToken contract.

MetaData packing (in `helpers/packing.cairo`):
- `starting_hammer/wave/totem` (2 bits each, 0-3)
- `bag_hammer/wave/totem_level` (4 bits each)
- `bridging_rank` (4 bits)
- `total_runs`, `total_cubes_earned` (stats)

### Shop System - **IMPLEMENTED**

Located in `contracts/src/systems/shop.cairo`:

```cairo
trait IShopSystem {
    fn upgrade_starting_bonus(ref self: T, bonus_type: u8);
    fn upgrade_bag_size(ref self: T, bonus_type: u8);
    fn upgrade_bridging_rank(ref self: T);
}
```

### Game System (In-Game Shop) - **PARTIALLY IMPLEMENTED**

Located in `contracts/src/systems/game.cairo`:

```cairo
trait IGameSystem {
    // ... existing functions ...
    fn create_with_cubes(ref self: T, game_id: u64, cubes_amount: u16);
    fn purchase_consumable(ref self: T, game_id: u64, consumable: ConsumableType);
    fn get_shop_data(self: @T, game_id: u64) -> (u16, u16, u16);
}
```

ConsumableType enum in `contracts/src/types/consumable.cairo`:
```cairo
pub enum ConsumableType {
    Hammer,      // 5 cubes - IMPLEMENTED
    Wave,        // 5 cubes - IMPLEMENTED
    Totem,       // 5 cubes - IMPLEMENTED
    ExtraMoves,  // 10 cubes - NOT IMPLEMENTED (panics)
}
```

### Events - **PARTIALLY IMPLEMENTED**

```cairo
// IMPLEMENTED
pub struct ConsumablePurchased { game_id, player, consumable, cost, cubes_remaining }

// NOT IMPLEMENTED
pub struct CubesEarned { game_id, amount, reason }
pub struct CubesSpent { game_id, amount, item_id }
pub struct InGameShopAvailable { game_id }
pub struct PermanentPurchase { player, item_type, item_id, cost }
```

---

## Frontend Implementation

### Implemented Components

| Component | Location | Description |
|-----------|----------|-------------|
| ShopDialog | `ui/components/Shop/ShopDialog.tsx` | Permanent shop UI |
| ShopButton | `ui/components/Shop/ShopButton.tsx` | Button to open shop |
| InGameShopDialog | `ui/components/Shop/InGameShopDialog.tsx` | In-game shop at level 5, 10, 15... |
| BringCubesDialog | `ui/components/Shop/BringCubesDialog.tsx` | Choose cubes to bring at game start |
| CubeEarnedAnimation | `ui/components/CubeEarnedAnimation.tsx` | Animation for combo cube bonuses |

### Implemented Hooks

| Hook | Location | Description |
|------|----------|-------------|
| usePlayerMeta | `hooks/usePlayerMeta.tsx` | Get player upgrades and balance |

### Additional Implemented

| Hook/Component | Location | Description |
|----------------|----------|-------------|
| useCubeBalance | `hooks/useCubeBalance.tsx` | ERC1155 balance from Torii GraphQL (polls 10s) |
| CubeBalance | `ui/components/CubeBalance.tsx` | Standalone balance display |

### Not Implemented

- `useInGameShop.ts` - Shop state hook (logic in component)
- `cubeStore.ts` - Zustand store (using RECS/Torii sync)
- `RunSummary.tsx` - End-of-run breakdown

### Integration Points

- **PlayFreeGame.tsx**: Shows BringCubesDialog after minting if player has bridging rank
- **Play.tsx**: Shows InGameShopDialog after completing levels 5, 10, 15, etc.
- **GameBoard.tsx**: Renders CubeEarnedAnimation for combo bonuses
- **LevelHeader.tsx**: Displays total cubes earned in run

---

## Implementation Phases (Updated)

### Phase 1: CUBE Token Contract - **COMPLETE**
- [x] Create soulbound ERC1155 in `contracts/src/systems/cube_token.cairo`
- [x] Implement soulbound hook (blocks transfers, allows mint/burn)
- [x] Add mint/burn with AccessControl (MINTER_ROLE)
- [x] dojo_init grants MINTER_ROLE to game_system and shop_system
- [x] Deploy to slot

### Phase 2: Game Integration - Earning - **PARTIALLY COMPLETE**
- [x] Add cube tracking fields to RunData
- [ ] Implement cube earning on level complete (1-3 based on efficiency)
- [ ] Implement milestone bonuses (every 10 levels)
- [x] Implement combo bonuses (4+, 5+, 6+ lines)
- [x] Implement achievement bonuses (first 5x combo, 10x combo)
- [ ] Mint cubes at game over (balance updates but no actual minting)
- [ ] Add CubesEarned events
- [x] Frontend: Display cubes earned during run (in LevelHeader)
- [x] Frontend: Animation for cube earning (CubeEarnedAnimation)

### Phase 3: PlayerMeta & Permanent Shop - **COMPLETE**
- [x] Create PlayerMeta model
- [x] Create shop_system.cairo
- [x] Implement starting bonus purchases
- [x] Implement bag size purchases
- [x] Implement bridging rank purchases
- [x] Frontend: Permanent shop screen (ShopDialog)
- [x] Frontend: usePlayerMeta hook
- [x] Frontend: Cube balance display (in ShopDialog)

### Phase 4: Cube Bridging & In-Game Shop - **MOSTLY COMPLETE**
- [x] Implement create_with_cubes()
- [x] Implement cube burning from balance on run start
- [x] Implement in-game shop trigger (every 5 levels)
- [x] Implement purchase_consumable() for basic items
- [ ] Implement Full Refill consumable
- [ ] Implement Skip Constraint consumable
- [ ] Implement Revival Token consumable
- [ ] Implement Extra Moves consumable
- [x] Frontend: Cube bridge modal (BringCubesDialog)
- [x] Frontend: In-game shop modal (InGameShopDialog)
- [ ] Frontend: Run summary with cube breakdown

### Phase 5: Polish & Balance - **PARTIALLY COMPLETE**
- [ ] Balance cube earning rates
- [ ] Balance shop prices
- [x] Add animations for cube earning
- [ ] Add sound effects
- [ ] Edge case handling
- [ ] Final testing

---

## What Still Needs Implementation

### High Priority
1. **Milestone bonuses** - Award level/2 cubes every 10 levels (capped at 50)
2. **ExtraMoves consumable** - Add 5 moves to current level (type exists, needs implementation)

### Medium Priority
3. **Full Refill consumable** - Refill one bonus type to max
4. **CubesEarned events** - For indexing and analytics

### Low Priority
5. **Skip Constraint consumable** - Auto-complete constraint
6. **Revival Token consumable** - Continue after death
7. **Run Summary component** - Show detailed breakdown at game end
8. **Sound effects** - Audio feedback for cube earning

---

## File Structure Summary

### Created Files
```
contracts/src/
├── models/
│   └── player.cairo            # PlayerMeta model
├── systems/
│   ├── shop.cairo              # Permanent shop system
│   └── cube_token.cairo        # Soulbound ERC1155 CUBE token
├── types/
│   └── consumable.cairo        # ConsumableType enum
└── helpers/
    └── packing.cairo           # RunData & MetaData packing (updated)

client-budokan/src/
├── hooks/
│   ├── usePlayerMeta.tsx       # Player meta hook
│   └── useCubeBalance.tsx      # ERC1155 balance from Torii GraphQL
└── ui/
    └── components/
        ├── Shop/
        │   ├── ShopDialog.tsx      # Permanent shop UI
        │   ├── ShopButton.tsx      # Shop button
        │   ├── InGameShopDialog.tsx # In-game shop
        │   ├── BringCubesDialog.tsx # Cube bridging modal
        │   └── index.ts
        ├── CubeEarnedAnimation.tsx  # Combo bonus animation
        └── CubeBalance.tsx          # Standalone balance display
```

### Modified Files
```
contracts/src/
├── models/game.cairo           # Added cube fields, combo achievement logic
├── systems/game.cairo          # Added create_with_cubes, purchase_consumable
├── events.cairo                # Added ConsumablePurchased
└── lib.cairo                   # Export new modules

client-budokan/src/
├── dojo/
│   ├── contractSystems.ts      # Added shop/game system calls
│   ├── systems.ts              # Added wrapper functions
│   └── game/
│       ├── models/game.ts      # Added cube getters
│       └── helpers/runDataPacking.ts # Added cube field unpacking
├── ui/
│   ├── screens/Play.tsx        # Integrated in-game shop flow
│   ├── actions/PlayFreeGame.tsx # Integrated bring cubes flow
│   └── components/
│       └── GameBoard.tsx       # Added CubeEarnedAnimation
```

---

## Design Decisions Made During Implementation

1. **Soulbound ERC1155 CUBE token**: Implemented as `cube_token` dojo system with CUBE_TOKEN_ID=1. Torii indexes balances for frontend queries.

2. **Earned cubes are spendable**: Changed from original design where only brought cubes could be spent. Now players can spend both.

3. **Spending order**: Brought cubes are depleted first, then earned cubes. At game end, only remaining earned cubes (after spending) update balance.

4. **Shop trigger**: Shows after LevelCompleteDialog closes if level % 5 === 0 AND cubesAvailable > 0.

5. **Combo detection**: Frontend detects combos by watching `comboCounter` changes rather than separate events.
