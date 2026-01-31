# Bonus System V2.0 - Design Document

> **Version:** 2.0.0 (Proposed)  
> **Status:** Design Phase  
> **Last Updated:** January 2026  
> **Depends On:** v1.2.0 codebase

## Table of Contents

1. [Overview](#overview)
2. [Five Bonus Types](#five-bonus-types)
3. [Level System](#level-system)
4. [Bonus Selection](#bonus-selection)
5. [Level-Up Mechanics](#level-up-mechanics)
6. [Permanent Shop Changes](#permanent-shop-changes)
7. [In-Game Shop Changes](#in-game-shop-changes)
8. [Data Structure Changes](#data-structure-changes)
9. [Contract Implementation](#contract-implementation)
10. [Client Implementation](#client-implementation)
11. [Migration Strategy](#migration-strategy)

---

## Overview

### What's Changing

| Aspect | Current (v1.2) | New (v2.0) |
|--------|----------------|------------|
| Bonus Types | 3 (Hammer, Wave, Totem) | 5 (+Shrink, +Shuffle) |
| Levels | None (fixed effect) | 3 levels per bonus |
| Selection | All available | Choose 3 of 5 per run |
| Level-up | N/A | After boss clear (L10, L20, L30, L40, L50) |
| Unlock System | None | 2 bonuses require permanent unlock |

### Design Goals

1. **Strategic Depth**: Players must choose which bonuses to bring and level up
2. **Build Variety**: Different bonus combinations create different playstyles
3. **Meaningful Progression**: Unlocking and leveling bonuses feels rewarding
4. **Boss Significance**: Boss clears now grant power-ups, not just cubes

---

## Five Bonus Types

### 1. Hammer (Default Unlocked)

Clear a targeted block with combo enhancement at higher levels.

| Level | Effect | Description |
|-------|--------|-------------|
| L1 | Clear target block | Basic single-block clear |
| L2 | Clear target + combo +1 | Adds 1 to current combo counter |
| L3 | Clear target + combo +2 | Adds 2 to current combo counter |

**Use Case**: Precision clearing of problematic blocks. Higher levels help chain combos.

### 2. Wave (Default Unlocked)

Clear an entire horizontal row with move economy at higher levels.

| Level | Effect | Description |
|-------|--------|-------------|
| L1 | Clear one row | Basic full-row clear |
| L2 | Clear row + 1 free move | Next move doesn't count against limit |
| L3 | Clear row + 2 free moves | Next 2 moves don't count |

**Use Case**: Emergency row clear when stuck. Higher levels give tempo advantage.

**Implementation Note**: Requires `free_moves` counter in RunData.

### 3. Totem (Default Unlocked)

Clear blocks by type with scaling rewards at higher levels.

| Level | Effect | Description |
|-------|--------|-------------|
| L1 | Clear all blocks of same size | Target a size, all matching disappear |
| L2 | Clear same size + 1 cube/block | Bonus cubes for blocks cleared |
| L3 | Clear entire grid | Nuclear option - clears everything |

**Use Case**: Mass clearing when many same-size blocks exist. L3 is emergency reset.

**Design Note**: L3 has no cube bonus to prevent exploitation.

### 4. Shrink (Must Unlock)

Reduce block sizes to create gaps and opportunities.

| Level | Effect | Description |
|-------|--------|-------------|
| L1 | Shrink one block by 1 | Size 4→3, 3→2, 2→1, 1→empty |
| L2 | Shrink all same-size blocks | All blocks of target size shrink |
| L3 | Shrink one block by 2 | Size 4→2, 3→1, 2→empty, 1→empty |

**Use Case**: Create gaps in dense grids. Pairs well with Wave for setup.

**Edge Case**: Size-1 blocks shrunk become empty (disappear).

### 5. Shuffle (Must Unlock)

Randomize block positions for new opportunities.

| Level | Effect | Description |
|-------|--------|-------------|
| L1 | Shuffle one row | Randomize positions within a row |
| L2 | Shuffle upcoming line | Change the next line before it appears |
| L3 | Shuffle entire grid | Randomize all visible blocks |

**Use Case**: Escape bad situations. L2 is preemptive control.

**Physics**: After shuffle, gravity applies and can trigger line clears.

---

## Level System

### How Levels Work

- All bonuses start at **Level 1** at the beginning of each run
- Levels are **per-run** (reset when game ends)
- Levels **do not persist** across runs
- Maximum level is **3**

### Level Indicators

UI should show:
- Current level (1/2/3) on each bonus button
- Visual distinction (glow, badge, color change)
- Level-up preview during selection

---

## Bonus Selection

### Selection Flow

```
[Game Creation]
       ↓
[Bonus Selection Dialog]
  - Show 5 bonus types (grayed if locked)
  - Player selects exactly 3
  - Confirm selection
       ↓
[Run Begins]
  - Selected bonuses available at L1
  - Locked for entire run*
```

*Exception: Swap consumable in in-game shop

### Selection Rules

1. Must select exactly 3 bonuses
2. Can only select unlocked bonuses
3. New players: Only Hammer, Wave, Totem available
4. Selection locked at run start
5. Swap consumable allows mid-run change (costs cubes)

### Default Selection

For players who skip selection or new players:
- **Default**: Hammer, Wave, Totem

---

## Level-Up Mechanics

### Trigger: Boss Clear

Boss levels occur at: **10, 20, 30, 40, 50**

After clearing a boss:
1. Normal boss rewards applied (cube bonus)
2. **Level-Up Dialog** appears
3. Player chooses 1 of their 3 selected bonuses
4. That bonus gains +1 level (capped at L3)

### Level-Up Math

| Bosses | Level-Ups Available | Max Possible |
|--------|---------------------|--------------|
| 5 | 5 | 5 level-ups across 3 bonuses |

**Strategy Examples**:
- Max 1 bonus (L3) + 2 bonuses at L2 = 3 + 2 = 5 levels
- All 3 bonuses at L2 = 2 + 2 + 2 = 6 levels (impossible with 5)
- 1 at L3, 1 at L2, 1 at L1 = 3 + 2 + 1 = 6 levels (impossible)

**Actual Options**:
- One L3, two L2 = 2 + 1 + 1 + 1 = 5 ✓
- One L3, one L2, one L1 = 2 + 1 + 0 = 3 (2 wasted) 
- Two L3, one L1 = 2 + 2 + 0 = 4 (1 wasted)

Players must choose wisely!

### Skip Level-Up?

**Decision**: Can players skip/save level-ups?

**Recommendation**: No skipping. Must choose immediately. Keeps game flowing.

---

## Permanent Shop Changes

### New Shop Structure

#### Unlock Section (New)

| Item | Cost | Effect |
|------|------|--------|
| Unlock Shrink | 500 CUBE | Can select Shrink in bonus selection |
| Unlock Shuffle | 500 CUBE | Can select Shuffle in bonus selection |

#### Starting Bonus Section (Expanded)

| Bonus | Level | Cost | Effect |
|-------|-------|------|--------|
| Starting Hammer | 1 | 50 | Start run with 1 Hammer |
| Starting Hammer | 2 | 200 | Start run with 2 Hammers |
| Starting Hammer | 3 | 500 | Start run with 3 Hammers |
| Starting Wave | 1 | 50 | Start run with 1 Wave |
| Starting Wave | 2 | 200 | Start run with 2 Waves |
| Starting Wave | 3 | 500 | Start run with 3 Waves |
| Starting Totem | 1 | 50 | Start run with 1 Totem |
| Starting Totem | 2 | 200 | Start run with 2 Totems |
| Starting Totem | 3 | 500 | Start run with 3 Totems |
| Starting Shrink | 1 | 50 | Start with 1 Shrink (requires unlock) |
| Starting Shrink | 2 | 200 | Start with 2 Shrinks |
| Starting Shrink | 3 | 500 | Start with 3 Shrinks |
| Starting Shuffle | 1 | 50 | Start with 1 Shuffle (requires unlock) |
| Starting Shuffle | 2 | 200 | Start with 2 Shuffles |
| Starting Shuffle | 3 | 500 | Start with 3 Shuffles |

**Note**: Starting bonuses only apply to selected bonus types.

#### Bag Size Section (Expanded)

| Bonus | Level | Cost | Max Capacity |
|-------|-------|------|--------------|
| Bag Hammer | 1 | 10 | 2 |
| Bag Hammer | 2 | 20 | 3 |
| Bag Hammer | 3 | 40 | 4 |
| Bag Wave | 1 | 10 | 2 |
| Bag Wave | 2 | 20 | 3 |
| Bag Wave | 3 | 40 | 4 |
| Bag Totem | 1 | 10 | 2 |
| Bag Totem | 2 | 20 | 3 |
| Bag Totem | 3 | 40 | 4 |
| Bag Shrink | 1 | 10 | 2 (requires unlock) |
| Bag Shrink | 2 | 20 | 3 |
| Bag Shrink | 3 | 40 | 4 |
| Bag Shuffle | 1 | 10 | 2 (requires unlock) |
| Bag Shuffle | 2 | 20 | 3 |
| Bag Shuffle | 3 | 40 | 4 |

#### Bridging Rank (Unchanged)

| Rank | Cost | Max Cubes |
|------|------|-----------|
| 1 | 100 | 5 |
| 2 | 200 | 10 |
| 3 | 400 | 20 |
| 4 | 800 | 40 |

---

## In-Game Shop Changes

### Consumables (Every 5 Levels)

**Important**: Only show bonuses that player has selected for this run.

| Item | Cost | Effect | Availability |
|------|------|--------|--------------|
| Hammer | 5 | +1 Hammer | If selected |
| Wave | 5 | +1 Wave | If selected |
| Totem | 5 | +1 Totem | If selected |
| Shrink | 5 | +1 Shrink | If selected & unlocked |
| Shuffle | 5 | +1 Shuffle | If selected & unlocked |
| Extra Moves | 10 | +5 moves | Always |
| **Swap Bonus** | 15 | Swap 1 selection | New |

### Swap Bonus Mechanic

1. Player pays 15 cubes
2. Dialog shows their 3 selected bonuses
3. Player picks one to swap out
4. Dialog shows available alternatives (unlocked bonuses not selected)
5. Player picks replacement
6. Replacement starts at L1 (loses any levels from swapped bonus)

**Use Case**: Realized you need Shuffle but brought Totem? Swap it out.

---

## Data Structure Changes

### RunData (run_data: felt252)

Current bit usage: 88 bits (out of 252 available)

#### New Fields Required

| Field | Bits | Size | Description |
|-------|------|------|-------------|
| selected_bonus_1 | 88-90 | 3 | Bonus type (0-4) |
| selected_bonus_2 | 91-93 | 3 | Bonus type (0-4) |
| selected_bonus_3 | 94-96 | 3 | Bonus type (0-4) |
| bonus_1_level | 97-98 | 2 | Level 0-2 (represents L1-L3) |
| bonus_2_level | 99-100 | 2 | Level 0-2 |
| bonus_3_level | 101-102 | 2 | Level 0-2 |
| shrink_count | 103-106 | 4 | Inventory 0-15 |
| shuffle_count | 107-110 | 4 | Inventory 0-15 |
| free_moves | 111-113 | 3 | Free moves remaining 0-7 |

**Total New**: 26 bits
**New Total**: 114 bits (well under 252 limit)

### MetaData (PlayerMeta.data: felt252)

Current bit usage: 54 bits

#### New Fields Required

| Field | Bits | Size | Description |
|-------|------|------|-------------|
| shrink_unlocked | 54 | 1 | 0/1 |
| shuffle_unlocked | 55 | 1 | 0/1 |
| starting_shrink | 56-57 | 2 | 0-3 |
| starting_shuffle | 58-59 | 2 | 0-3 |
| bag_shrink_level | 60-63 | 4 | 0-15 |
| bag_shuffle_level | 64-67 | 4 | 0-15 |

**Total New**: 14 bits
**New Total**: 68 bits (well under 252 limit)

---

## Contract Implementation

### New Files

| File | Description |
|------|-------------|
| `elements/bonuses/shrink.cairo` | Shrink effect implementation |
| `elements/bonuses/shuffle.cairo` | Shuffle effect implementation |

### Modified Files

| File | Changes |
|------|---------|
| `types/bonus.cairo` | Add `Shrink = 4`, `Shuffle = 5` to enum |
| `helpers/packing.cairo` | Add new RunData and MetaData fields |
| `models/game.cairo` | Update `apply_bonus()` for levels, free moves, new types |
| `systems/game.cairo` | Bonus selection at create, level-up after boss |
| `systems/shop.cairo` | Add unlock, shrink/shuffle starting/bag upgrades |
| `helpers/level.cairo` | Update bonus earning for 5 types |

### Key Function Changes

#### `game_system::create()` / `create_with_cubes()`

```cairo
fn create(
    ref self: ContractState,
    token_id: u64,
    selected_bonuses: Span<u8>,  // NEW: [bonus_type_1, bonus_type_2, bonus_type_3]
) {
    // Validate exactly 3 bonuses selected
    assert(selected_bonuses.len() == 3, 'Must select 3 bonuses');
    
    // Validate all selected bonuses are unlocked
    for bonus in selected_bonuses {
        if *bonus == 4 { // Shrink
            assert(player_meta.shrink_unlocked(), 'Shrink not unlocked');
        }
        if *bonus == 5 { // Shuffle
            assert(player_meta.shuffle_unlocked(), 'Shuffle not unlocked');
        }
    }
    
    // Store selection in run_data
    run_data.set_selected_bonuses(selected_bonuses);
    run_data.set_bonus_levels(0, 0, 0);  // All start at L1
    
    // Apply starting bonuses (only for selected types)
    // ...
}
```

#### `game_system::level_up_bonus()`

```cairo
fn level_up_bonus(
    ref self: ContractState,
    game_id: u64,
    bonus_slot: u8,  // 0, 1, or 2 (which of the 3 selected)
) {
    // Validate this is called after boss clear
    assert(is_pending_level_up(game), 'No level-up pending');
    
    // Get current level
    let current_level = run_data.get_bonus_level(bonus_slot);
    assert(current_level < 3, 'Already at max level');
    
    // Level up
    run_data.set_bonus_level(bonus_slot, current_level + 1);
    
    // Clear pending flag
    run_data.clear_pending_level_up();
}
```

#### `Game::apply_bonus()`

```cairo
fn apply_bonus(
    ref self: Game,
    seed: felt252,
    bonus_type: Bonus,
    row_index: u8,
    index: u8,
    settings: GameSettings,
) {
    // Validate bonus is in selected set
    assert(self.run_data.is_bonus_selected(bonus_type), 'Bonus not selected');
    
    // Get bonus level (1, 2, or 3)
    let level = self.run_data.get_level_for_bonus(bonus_type);
    
    // Apply effect based on type AND level
    match bonus_type {
        Bonus::Hammer => {
            self.blocks = Hammer::apply(self.blocks, row_index, index);
            if level >= 2 {
                self.combo_counter += 1;
            }
            if level >= 3 {
                self.combo_counter += 1;  // Total +2
            }
        },
        Bonus::Wave => {
            self.blocks = Wave::apply(self.blocks, row_index, index);
            if level >= 2 {
                self.run_data.add_free_moves(1);
            }
            if level >= 3 {
                self.run_data.add_free_moves(1);  // Total +2
            }
        },
        Bonus::Totem => {
            let cleared_count = Totem::apply_and_count(self.blocks, row_index, index);
            if level == 2 {
                self.run_data.add_cubes(cleared_count);  // 1 cube per block
            }
            if level == 3 {
                self.blocks = 0;  // Clear entire grid, no bonus
            }
        },
        Bonus::Shrink => {
            match level {
                1 => self.blocks = Shrink::apply_single(self.blocks, row_index, index),
                2 => self.blocks = Shrink::apply_same_size(self.blocks, row_index, index),
                3 => self.blocks = Shrink::apply_double(self.blocks, row_index, index),
            }
        },
        Bonus::Shuffle => {
            match level {
                1 => self.blocks = Shuffle::apply_row(self.blocks, seed, row_index),
                2 => self.next_row = Shuffle::apply_next(self.next_row, seed),
                3 => self.blocks = Shuffle::apply_grid(self.blocks, seed),
            }
        },
    }
    
    // Decrement inventory
    self.run_data.decrement_bonus(bonus_type);
}
```

---

## Client Implementation

### New Components

| Component | Purpose |
|-----------|---------|
| `BonusSelectionDialog.tsx` | Pre-game selection of 3 bonuses |
| `LevelUpDialog.tsx` | Post-boss choice of which bonus to level |
| `BonusLevelBadge.tsx` | Level indicator (1/2/3) on bonus buttons |

### Modified Components

| Component | Changes |
|-----------|---------|
| `PlayFreeGame.tsx` | Add bonus selection step before create |
| `BonusButton.tsx` | Show level, disabled if not selected |
| `LevelCompleteDialog.tsx` | Trigger level-up dialog for boss levels |
| `ShopDialog.tsx` | Add unlock section for Shrink/Shuffle |
| `InGameShopDialog.tsx` | Filter to selected bonuses, add swap |

### New Hooks

| Hook | Purpose |
|------|---------|
| `useBonusSelection()` | Manage selected bonuses state |
| `useBonusLevels()` | Read current levels from run_data |

### UI Flow

```
[Home] → [Mint Game] → [Bonus Selection Dialog] → [Create Transaction] → [Play]
                              ↓
                       Select 3 of 5
                       (grayed if locked)
                              ↓
                       Confirm selection
                              ↓
                       [Loading...]
                              ↓
                       [Play Screen]
                       - Selected bonuses visible
                       - Others hidden
                              ↓
                       [Boss Clear]
                              ↓
                       [Level Complete Dialog]
                              ↓
                       [Level-Up Dialog]
                       - Choose 1 of 3 to upgrade
                       - Show current levels
                       - Preview new effect
                              ↓
                       [Continue to next level]
```

---

## Migration Strategy

### Breaking Changes

This is a **major version change** that modifies:
- RunData bit layout
- MetaData bit layout
- Bonus enum values
- Create function signature

### Migration Options

#### Option A: New Namespace (Recommended)

1. Deploy as new namespace: `zkube_budo_v2_0_0`
2. Fresh start for all players
3. No data migration needed
4. Old games remain playable on old namespace

#### Option B: In-Place Upgrade

1. Requires careful bit-packing compatibility
2. Would need to default new fields for existing games
3. Risk of data corruption
4. Not recommended

### Recommended Approach

1. Complete implementation in new namespace
2. Test thoroughly on slot
3. Deploy to sepolia for broader testing
4. Deploy to mainnet as new game version
5. Consider cube migration tool (optional)

---

## Open Questions

### Resolved

| Question | Decision |
|----------|----------|
| New bonus types | Shrink and Shuffle |
| Level cap | 3 levels max |
| Selection count | 3 of 5 |
| Level reset | Per-run (not permanent) |
| Boss trigger | Every 10 levels (10, 20, 30, 40, 50) |
| Currency | CUBE only |

### To Decide

| Question | Options | Recommendation |
|----------|---------|----------------|
| Totem L2 cubes/block | 1, 2, or 3 | 1 cube per block |
| Unlock costs | 300/500/750 | 500 CUBE each |
| Swap consumable cost | 10/15/20 | 15 CUBE |
| Skip level-up? | Yes/No | No (must choose) |
| Shuffle randomness | VRF seed / pure random | Use existing level seed |

---

## Implementation Phases

### Phase 1: Core Mechanics
- [ ] Add Shrink and Shuffle to bonus enum
- [ ] Implement Shrink effect (3 levels)
- [ ] Implement Shuffle effect (3 levels)
- [ ] Update RunData packing for new fields
- [ ] Update MetaData packing for unlock flags

### Phase 2: Selection System
- [ ] Modify create() to accept bonus selection
- [ ] Validate selection against unlocked bonuses
- [ ] Store selection in run_data
- [ ] Filter bonus earning to selected types

### Phase 3: Level System
- [ ] Add level tracking to run_data
- [ ] Implement level-up after boss clear
- [ ] Modify apply_bonus for level-scaled effects
- [ ] Add free_moves mechanic for Wave L2/L3

### Phase 4: Shop Updates
- [ ] Add unlock system to permanent shop
- [ ] Add starting bonuses for Shrink/Shuffle
- [ ] Add bag sizes for Shrink/Shuffle
- [ ] Modify in-game shop to filter by selection
- [ ] Add swap consumable

### Phase 5: Client UI
- [ ] Bonus selection dialog
- [ ] Level-up dialog after boss
- [ ] Level indicators on bonus buttons
- [ ] Shop UI updates
- [ ] Tutorial updates

### Phase 6: Testing & Polish
- [ ] Unit tests for new bonus effects
- [ ] Integration tests for full flow
- [ ] UI/UX polish
- [ ] Balance testing

---

## Related Documentation

- [GAME_DESIGN.md](./GAME_DESIGN.md) - Current game design (v1.2)
- [DIFFICULTY_REBALANCE_V1_3.md](./DIFFICULTY_REBALANCE_V1_3.md) - Boss system details
- [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) - Roadmap

---

*This document will be updated as implementation progresses.*
