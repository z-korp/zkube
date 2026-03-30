# Add Back 3 Bonuses for Mutator System

## Goal
Restore the 3 original grid-manipulation bonuses (Hammer, Totem, Wave) from the main branch and wire them into the mutator system so mutators can grant bonus charges during a run.

## Context
The original bonuses were pure grid operations:
- **Hammer**: Destroy one block at (row, col)
- **Totem**: Destroy all blocks of same size on entire grid
- **Wave**: Destroy an entire row

They were removed during the v1.3 redesign. Now we want them back as mutator-granted abilities — not as a separate skill/draft system.

## Design: Bonuses as Mutator Effects

Bonuses are NOT player-chosen or drafted. They're granted by the active mutator:
- Each mutator defines which bonus it grants (if any)
- Bonus charges accumulate based on performance (score, combo depth, combo count)
- Player can spend a charge by calling `apply_bonus(game_id, row, col)`
- Applying a bonus consumes 1 charge and modifies the grid

### RunData Changes
Need to track bonus charges in RunData. Current layout has room (~101 of 252 bits used).

Add after bit 101:
```
Bits 102-103: bonus_type (u2)    -- 0=None, 1=Hammer, 2=Totem, 3=Wave
Bits 104-107: bonus_charges (u4) -- 0-15 charges available
```
Total: ~108 bits (still fits comfortably)

### MutatorDef Changes
Add a `bonus_type` field to MutatorDef:
```cairo
pub bonus_type: u8,  // 0=None, 1=Hammer, 2=Totem, 3=Wave
```

When a mutator with bonus_type > 0 is active, the bonus charge accumulation is enabled.

## Implementation Tasks

### Phase 1: Restore Bonus Code (contracts)

1.1. **Rewrite `types/bonus.cairo`** — Replace vNext enum (ComboSurge/Momentum/Harvest/Tsunami) with original 3 (Hammer/Totem/Wave):
```cairo
enum Bonus {
    None,
    Hammer,  // Destroy single block
    Totem,   // Destroy all blocks of same size
    Wave,    // Destroy entire row
}
```
Keep: `apply()` dispatch, `get_count()` dispatch, Into/From impls

1.2. **Restore `elements/bonuses/`** — Copy from git main branch:
- `elements/bonuses/interface.cairo` (BonusTrait: apply + get_count)
- `elements/bonuses/hammer.cairo` (destroy single block)
- `elements/bonuses/totem.cairo` (destroy all same-size blocks)
- `elements/bonuses/wave.cairo` (destroy entire row)

1.3. **Register in `lib.cairo`** — Add module declarations:
```cairo
pub mod elements {
    pub mod bonuses {
        pub mod interface;
        pub mod hammer;
        pub mod totem;
        pub mod wave;
    }
    // ... existing difficulties
}
```

1.4. **Verify build**: `sozo build -P slot`

### Phase 2: Wire into RunData + Mutators

2.1. **Extend RunData** — Add bonus_type (2 bits) + bonus_charges (4 bits) to packing.cairo:
- Update RunData struct
- Update pack/unpack
- Update new() constructor

2.2. **Extend MutatorDef** — Add `bonus_type: u8` field to models/mutator.cairo

2.3. **Wire bonus charge accumulation in moves_system** — After a successful move:
- If active mutator has bonus_type > 0:
  - Call `Bonus::get_count(score, combo_count, max_combo)` for the bonus type
  - If result > current charges: set charges to result (monotonic, doesn't decrease)

2.4. **Add `apply_bonus` to game_system** or a new endpoint:
```cairo
fn apply_bonus(ref self: T, game_id: felt252, row_index: u8, block_index: u8);
```
Logic:
- Read game, validate not over, validate bonus_charges > 0
- Get bonus_type from RunData
- Call `Bonus::apply(blocks, row_index, block_index)` to modify grid
- Apply gravity
- Decrement bonus_charges
- Write game

2.5. **Update packing tests** — RunData roundtrip with bonus fields

2.6. **Verify build + tests**: `sozo build -P slot && scarb test`

### Phase 3: Frontend (deferred — separate task)

3.1. Update runDataPacking.ts with bonus_type + bonus_charges fields
3.2. Add bonus button UI to PlayScreen (shows available charges, click to activate)
3.3. Add apply_bonus transaction wrapper to systems.ts
3.4. Bonus target selection UI (click grid cell after activating bonus)

## Files to Modify

### Contracts
- `contracts/src/types/bonus.cairo` — Rewrite enum
- `contracts/src/elements/bonuses/interface.cairo` — CREATE (restore from main)
- `contracts/src/elements/bonuses/hammer.cairo` — CREATE (restore from main)
- `contracts/src/elements/bonuses/totem.cairo` — CREATE (restore from main)
- `contracts/src/elements/bonuses/wave.cairo` — CREATE (restore from main)
- `contracts/src/lib.cairo` — Add bonus module declarations
- `contracts/src/helpers/packing.cairo` — Add bonus_type + bonus_charges to RunData
- `contracts/src/models/mutator.cairo` — Add bonus_type field
- `contracts/src/systems/game.cairo` — Add apply_bonus function
- `contracts/src/systems/moves.cairo` — Wire bonus charge accumulation

### Frontend (Phase 3, deferred)
- `client-budokan/src/dojo/game/helpers/runDataPacking.ts`
- `client-budokan/src/dojo/systems.ts`
- `client-budokan/src/ui/pages/PlayScreen.tsx`

## Open Questions
1. Should bonus charges reset between levels or persist across the entire run?
   - Recommendation: persist across run (simpler, more rewarding)
2. Should applying a bonus count as a "move" (decrement moves remaining)?
   - Recommendation: no (bonuses are rewards, not moves)
3. Should all mutators grant a bonus, or only some?
   - Recommendation: only some — bonus_type=0 means no bonus for that mutator
