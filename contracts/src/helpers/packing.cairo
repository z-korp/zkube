use alexandria_math::BitShift;

/// Bit-packing helpers for efficient storage
/// 
/// run_data layout (183 bits used, 69 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Range    │ Description     │
/// ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
/// │ 0-7     │ current_level         │ 8    │ 0-255    │ Current level   │
/// │ 8-15    │ level_score           │ 8    │ 0-255    │ Score this level│
/// │ 16-23   │ level_moves           │ 8    │ 0-255    │ Moves this level│
/// │ 24-31   │ constraint_progress   │ 8    │ 0-255    │ Times achieved  │
/// │ 32-39   │ constraint_2_progress │ 8    │ 0-255    │ 2nd constraint  │
/// │ 40      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
/// │ 41      │ combo_5_achieved      │ 1    │ 0-1      │ First 5x combo  │
/// │ 42      │ combo_10_achieved     │ 1    │ 0-1      │ First 10x combo │
/// │ 43-50   │ hammer_count          │ 8    │ 0-255    │ Inventory       │
/// │ 51-58   │ wave_count            │ 8    │ 0-255    │ Inventory       │
/// │ 59-66   │ totem_count           │ 8    │ 0-255    │ Inventory       │
/// │ 67-74   │ shrink_count          │ 8    │ 0-255    │ Shrink inventory│
/// │ 75-82   │ shuffle_count         │ 8    │ 0-255    │ Shuffle inv     │
/// │ 83-90   │ max_combo_run         │ 8    │ 0-255    │ Best combo      │
/// │ 91-98   │ extra_moves           │ 8    │ 0-255    │ Extra move cap  │
/// │ 99-114  │ cubes_brought         │ 16   │ 0-65535  │ Cubes for in-run│
/// │ 115-130 │ cubes_spent           │ 16   │ 0-65535  │ Cubes spent     │
/// │ 131-146 │ total_cubes           │ 16   │ 0-65535  │ Earned cubes    │
/// │ 147-162 │ total_score           │ 16   │ 0-65535  │ Cumulative score│
/// │ 163     │ run_completed         │ 1    │ 0-1      │ Victory flag    │
/// │ 164-166 │ selected_bonus_1      │ 3    │ 0-5      │ 1st bonus type  │
/// │ 167-169 │ selected_bonus_2      │ 3    │ 0-5      │ 2nd bonus type  │
/// │ 170-172 │ selected_bonus_3      │ 3    │ 0-5      │ 3rd bonus type  │
/// │ 173-174 │ bonus_1_level         │ 2    │ 0-2      │ L1/L2/L3        │
/// │ 175-176 │ bonus_2_level         │ 2    │ 0-2      │ L1/L2/L3        │
/// │ 177-178 │ bonus_3_level         │ 2    │ 0-2      │ L1/L2/L3        │
/// │ 179-181 │ free_moves            │ 3    │ 0-7      │ Free moves left │
/// │ 182     │ pending_level_up      │ 1    │ 0-1      │ Level-up pending│
/// │ 183-188 │ last_shop_level       │ 6    │ 0-63     │ Last shop level │
/// │ 189     │ shop_bonus_1_bought   │ 1    │ 0-1      │ Bonus 1 bought  │
/// │ 190     │ shop_bonus_2_bought   │ 1    │ 0-1      │ Bonus 2 bought  │
/// │ 191     │ shop_bonus_3_bought   │ 1    │ 0-1      │ Bonus 3 bought  │
/// │ 192-195 │ shop_refills          │ 4    │ 0-15     │ Refills bought  │
/// │ 196-251 │ reserved              │ 56   │ -        │ Future features │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked run data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct RunData {
    pub current_level: u8,
    pub level_score: u8,
    pub level_moves: u8,
    pub constraint_progress: u8,
    pub bonus_used_this_level: bool,
    pub total_cubes: u16,
    pub hammer_count: u8,
    pub wave_count: u8,
    pub totem_count: u8,
    pub shrink_count: u8,
    pub shuffle_count: u8,
    pub max_combo_run: u8,
    /// Extra moves added to the current level move limit (from consumables)
    pub extra_moves: u8,
    pub total_score: u16, // Cumulative score across all levels
    // Combo achievement flags (one-time per run)
    pub combo_5_achieved: bool, // First time achieving 5+ lines combo
    pub combo_10_achieved: bool, // First time achieving 10+ lines combo
    // In-game shop: cubes brought into run (burned from wallet on start)
    pub cubes_brought: u16, // Cubes transferred into run for spending
    pub cubes_spent: u16, // Cubes spent during run
    // Secondary constraint progress (for dual-constraint levels)
    pub constraint_2_progress: u8,
    // Victory flag: true if player completed level 50
    pub run_completed: bool,
    // Bonus V2.0: Selected bonuses (3 types selected at run start)
    // Values: 0=None, 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle
    pub selected_bonus_1: u8,
    pub selected_bonus_2: u8,
    pub selected_bonus_3: u8,
    // Bonus V2.0: Bonus levels (0=L1, 1=L2, 2=L3)
    pub bonus_1_level: u8,
    pub bonus_2_level: u8,
    pub bonus_3_level: u8,
    // Bonus V2.0: Free moves remaining (from Wave L2/L3 effect)
    pub free_moves: u8,
    // Bonus V2.0: Level-up pending after boss clear
    pub pending_level_up: bool,
    // In-game shop state (resets per shop visit)
    pub last_shop_level: u8,      // Level of last shop interaction (0 = none)
    pub shop_bonus_1_bought: bool, // Already bought bonus 1 this shop
    pub shop_bonus_2_bought: bool, // Already bought bonus 2 this shop
    pub shop_bonus_3_bought: bool, // Already bought bonus 3 this shop
    pub shop_refills: u8,         // Number of refills bought this shop
}

/// Bit positions and masks for run_data
mod RunDataBits {
    // Bit positions (starting bit for each field)
    pub const CURRENT_LEVEL_POS: u8 = 0;
    pub const LEVEL_SCORE_POS: u8 = 8;
    pub const LEVEL_MOVES_POS: u8 = 16;
    pub const CONSTRAINT_PROGRESS_POS: u8 = 24;
    pub const CONSTRAINT_2_PROGRESS_POS: u8 = 32;
    pub const BONUS_USED_POS: u8 = 40;
    pub const COMBO_5_ACHIEVED_POS: u8 = 41;
    pub const COMBO_10_ACHIEVED_POS: u8 = 42;
    pub const HAMMER_COUNT_POS: u8 = 43;
    pub const WAVE_COUNT_POS: u8 = 51;
    pub const TOTEM_COUNT_POS: u8 = 59;
    pub const SHRINK_COUNT_POS: u8 = 67;
    pub const SHUFFLE_COUNT_POS: u8 = 75;
    pub const MAX_COMBO_RUN_POS: u8 = 83;
    pub const EXTRA_MOVES_POS: u8 = 91;
    pub const CUBES_BROUGHT_POS: u8 = 99;
    pub const CUBES_SPENT_POS: u8 = 115;
    pub const TOTAL_CUBES_POS: u8 = 131;
    pub const TOTAL_SCORE_POS: u8 = 147;
    pub const RUN_COMPLETED_POS: u8 = 163;
    // Bonus V2.0 positions
    pub const SELECTED_BONUS_1_POS: u8 = 164;
    pub const SELECTED_BONUS_2_POS: u8 = 167;
    pub const SELECTED_BONUS_3_POS: u8 = 170;
    pub const BONUS_1_LEVEL_POS: u8 = 173;
    pub const BONUS_2_LEVEL_POS: u8 = 175;
    pub const BONUS_3_LEVEL_POS: u8 = 177;
    pub const FREE_MOVES_POS: u8 = 179;
    pub const PENDING_LEVEL_UP_POS: u8 = 182;
    // Shop state positions
    pub const LAST_SHOP_LEVEL_POS: u8 = 183;
    pub const SHOP_BONUS_1_BOUGHT_POS: u8 = 189;
    pub const SHOP_BONUS_2_BOUGHT_POS: u8 = 190;
    pub const SHOP_BONUS_3_BOUGHT_POS: u8 = 191;
    pub const SHOP_REFILLS_POS: u8 = 192;

    // Bit masks (after shifting to position 0)
    pub const CURRENT_LEVEL_MASK: u256 = 0xFF; // 8 bits
    pub const LEVEL_SCORE_MASK: u256 = 0xFF; // 8 bits
    pub const LEVEL_MOVES_MASK: u256 = 0xFF; // 8 bits
    pub const CONSTRAINT_PROGRESS_MASK: u256 = 0xFF; // 8 bits
    pub const CONSTRAINT_2_PROGRESS_MASK: u256 = 0xFF; // 8 bits
    pub const BONUS_USED_MASK: u256 = 0x1; // 1 bit
    pub const COMBO_ACHIEVED_MASK: u256 = 0x1; // 1 bit
    pub const COUNT_MASK: u256 = 0xFF; // 8 bits
    pub const EXTRA_MOVES_MASK: u256 = 0xFF; // 8 bits
    pub const CUBES_BROUGHT_MASK: u256 = 0xFFFF; // 16 bits
    pub const CUBES_SPENT_MASK: u256 = 0xFFFF; // 16 bits
    pub const TOTAL_CUBES_MASK: u256 = 0xFFFF; // 16 bits
    pub const TOTAL_SCORE_MASK: u256 = 0xFFFF; // 16 bits
    pub const RUN_COMPLETED_MASK: u256 = 0x1; // 1 bit
    // Bonus V2.0 masks
    pub const SELECTED_BONUS_MASK: u256 = 0x7; // 3 bits (0-5 for bonus types)
    pub const BONUS_LEVEL_MASK: u256 = 0x3; // 2 bits (0-2 for L1/L2/L3)
    pub const FREE_MOVES_MASK: u256 = 0x7; // 3 bits (0-7)
    pub const PENDING_LEVEL_UP_MASK: u256 = 0x1; // 1 bit
    // Shop state masks
    pub const LAST_SHOP_LEVEL_MASK: u256 = 0x3F; // 6 bits (0-63)
    pub const SHOP_BOUGHT_MASK: u256 = 0x1; // 1 bit
    pub const SHOP_REFILLS_MASK: u256 = 0xF; // 4 bits (0-15)
}

#[generate_trait]
pub impl RunDataPacking of RunDataPackingTrait {
    /// Create a new RunData with initial values for level 1
    /// Default bonus selection: Hammer (1), Wave (3), Totem (2)
    fn new() -> RunData {
        RunData {
            current_level: 1,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            bonus_used_this_level: false,
            total_cubes: 0,
            hammer_count: 0,
            wave_count: 0,
            totem_count: 0,
            shrink_count: 0,
            shuffle_count: 0,
            max_combo_run: 0,
            extra_moves: 0,
            total_score: 0,
            combo_5_achieved: false,
            combo_10_achieved: false,
            cubes_brought: 0,
            cubes_spent: 0,
            constraint_2_progress: 0,
            run_completed: false,
            // Bonus V2.0: Default selection (Hammer, Wave, Totem)
            selected_bonus_1: 1, // Hammer
            selected_bonus_2: 3, // Wave
            selected_bonus_3: 2, // Totem
            // All bonuses start at level 0 (L1)
            bonus_1_level: 0,
            bonus_2_level: 0,
            bonus_3_level: 0,
            free_moves: 0,
            pending_level_up: false,
            // Shop state starts fresh
            last_shop_level: 0,
            shop_bonus_1_bought: false,
            shop_bonus_2_bought: false,
            shop_bonus_3_bought: false,
            shop_refills: 0,
        }
    }

    /// Pack RunData into a felt252
    fn pack(self: RunData) -> felt252 {
        let mut packed: u256 = 0;

        // Pack each field at its bit position using bitshift
        packed = packed
            | BitShift::shl(
                self.current_level.into() & RunDataBits::CURRENT_LEVEL_MASK,
                RunDataBits::CURRENT_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.level_score.into() & RunDataBits::LEVEL_SCORE_MASK,
                RunDataBits::LEVEL_SCORE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.level_moves.into() & RunDataBits::LEVEL_MOVES_MASK,
                RunDataBits::LEVEL_MOVES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.constraint_progress.into() & RunDataBits::CONSTRAINT_PROGRESS_MASK,
                RunDataBits::CONSTRAINT_PROGRESS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.constraint_2_progress.into() & RunDataBits::CONSTRAINT_2_PROGRESS_MASK,
                RunDataBits::CONSTRAINT_2_PROGRESS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.bonus_used_this_level { 1_u256 } else { 0_u256 },
                RunDataBits::BONUS_USED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.combo_5_achieved { 1_u256 } else { 0_u256 },
                RunDataBits::COMBO_5_ACHIEVED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.combo_10_achieved { 1_u256 } else { 0_u256 },
                RunDataBits::COMBO_10_ACHIEVED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.hammer_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::HAMMER_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.wave_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::WAVE_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.totem_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::TOTEM_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.shrink_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::SHRINK_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.shuffle_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::SHUFFLE_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.max_combo_run.into() & RunDataBits::COUNT_MASK,
                RunDataBits::MAX_COMBO_RUN_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.extra_moves.into() & RunDataBits::EXTRA_MOVES_MASK,
                RunDataBits::EXTRA_MOVES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.cubes_brought.into() & RunDataBits::CUBES_BROUGHT_MASK,
                RunDataBits::CUBES_BROUGHT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.cubes_spent.into() & RunDataBits::CUBES_SPENT_MASK,
                RunDataBits::CUBES_SPENT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_cubes.into() & RunDataBits::TOTAL_CUBES_MASK,
                RunDataBits::TOTAL_CUBES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_score.into() & RunDataBits::TOTAL_SCORE_MASK,
                RunDataBits::TOTAL_SCORE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.run_completed { 1_u256 } else { 0_u256 },
                RunDataBits::RUN_COMPLETED_POS.into(),
            );
        // Bonus V2.0 fields
        packed = packed
            | BitShift::shl(
                self.selected_bonus_1.into() & RunDataBits::SELECTED_BONUS_MASK,
                RunDataBits::SELECTED_BONUS_1_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.selected_bonus_2.into() & RunDataBits::SELECTED_BONUS_MASK,
                RunDataBits::SELECTED_BONUS_2_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.selected_bonus_3.into() & RunDataBits::SELECTED_BONUS_MASK,
                RunDataBits::SELECTED_BONUS_3_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bonus_1_level.into() & RunDataBits::BONUS_LEVEL_MASK,
                RunDataBits::BONUS_1_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bonus_2_level.into() & RunDataBits::BONUS_LEVEL_MASK,
                RunDataBits::BONUS_2_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bonus_3_level.into() & RunDataBits::BONUS_LEVEL_MASK,
                RunDataBits::BONUS_3_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.free_moves.into() & RunDataBits::FREE_MOVES_MASK,
                RunDataBits::FREE_MOVES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.pending_level_up { 1_u256 } else { 0_u256 },
                RunDataBits::PENDING_LEVEL_UP_POS.into(),
            );
        // Shop state fields
        packed = packed
            | BitShift::shl(
                self.last_shop_level.into() & RunDataBits::LAST_SHOP_LEVEL_MASK,
                RunDataBits::LAST_SHOP_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.shop_bonus_1_bought { 1_u256 } else { 0_u256 },
                RunDataBits::SHOP_BONUS_1_BOUGHT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.shop_bonus_2_bought { 1_u256 } else { 0_u256 },
                RunDataBits::SHOP_BONUS_2_BOUGHT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.shop_bonus_3_bought { 1_u256 } else { 0_u256 },
                RunDataBits::SHOP_BONUS_3_BOUGHT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.shop_refills.into() & RunDataBits::SHOP_REFILLS_MASK,
                RunDataBits::SHOP_REFILLS_POS.into(),
            );

        packed.try_into().unwrap()
    }

    /// Unpack a felt252 into RunData
    fn unpack(packed: felt252) -> RunData {
        let data: u256 = packed.into();

        RunData {
            current_level: (BitShift::shr(data, RunDataBits::CURRENT_LEVEL_POS.into())
                & RunDataBits::CURRENT_LEVEL_MASK)
                .try_into()
                .unwrap(),
            level_score: (BitShift::shr(data, RunDataBits::LEVEL_SCORE_POS.into())
                & RunDataBits::LEVEL_SCORE_MASK)
                .try_into()
                .unwrap(),
            level_moves: (BitShift::shr(data, RunDataBits::LEVEL_MOVES_POS.into())
                & RunDataBits::LEVEL_MOVES_MASK)
                .try_into()
                .unwrap(),
            constraint_progress: (BitShift::shr(data, RunDataBits::CONSTRAINT_PROGRESS_POS.into())
                & RunDataBits::CONSTRAINT_PROGRESS_MASK)
                .try_into()
                .unwrap(),
            constraint_2_progress: (BitShift::shr(
                data, RunDataBits::CONSTRAINT_2_PROGRESS_POS.into(),
            )
                & RunDataBits::CONSTRAINT_2_PROGRESS_MASK)
                .try_into()
                .unwrap(),
            bonus_used_this_level: (BitShift::shr(data, RunDataBits::BONUS_USED_POS.into())
                & RunDataBits::BONUS_USED_MASK) == 1,
            combo_5_achieved: (BitShift::shr(data, RunDataBits::COMBO_5_ACHIEVED_POS.into())
                & RunDataBits::COMBO_ACHIEVED_MASK) == 1,
            combo_10_achieved: (BitShift::shr(data, RunDataBits::COMBO_10_ACHIEVED_POS.into())
                & RunDataBits::COMBO_ACHIEVED_MASK) == 1,
            hammer_count: (BitShift::shr(data, RunDataBits::HAMMER_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            wave_count: (BitShift::shr(data, RunDataBits::WAVE_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            totem_count: (BitShift::shr(data, RunDataBits::TOTEM_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            shrink_count: (BitShift::shr(data, RunDataBits::SHRINK_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            shuffle_count: (BitShift::shr(data, RunDataBits::SHUFFLE_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            max_combo_run: (BitShift::shr(data, RunDataBits::MAX_COMBO_RUN_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            extra_moves: (BitShift::shr(data, RunDataBits::EXTRA_MOVES_POS.into())
                & RunDataBits::EXTRA_MOVES_MASK)
                .try_into()
                .unwrap(),
            cubes_brought: (BitShift::shr(data, RunDataBits::CUBES_BROUGHT_POS.into())
                & RunDataBits::CUBES_BROUGHT_MASK)
                .try_into()
                .unwrap(),
            cubes_spent: (BitShift::shr(data, RunDataBits::CUBES_SPENT_POS.into())
                & RunDataBits::CUBES_SPENT_MASK)
                .try_into()
                .unwrap(),
            total_cubes: (BitShift::shr(data, RunDataBits::TOTAL_CUBES_POS.into())
                & RunDataBits::TOTAL_CUBES_MASK)
                .try_into()
                .unwrap(),
            total_score: (BitShift::shr(data, RunDataBits::TOTAL_SCORE_POS.into())
                & RunDataBits::TOTAL_SCORE_MASK)
                .try_into()
                .unwrap(),
            run_completed: (BitShift::shr(data, RunDataBits::RUN_COMPLETED_POS.into())
                & RunDataBits::RUN_COMPLETED_MASK) == 1,
            // Bonus V2.0 fields
            selected_bonus_1: (BitShift::shr(data, RunDataBits::SELECTED_BONUS_1_POS.into())
                & RunDataBits::SELECTED_BONUS_MASK)
                .try_into()
                .unwrap(),
            selected_bonus_2: (BitShift::shr(data, RunDataBits::SELECTED_BONUS_2_POS.into())
                & RunDataBits::SELECTED_BONUS_MASK)
                .try_into()
                .unwrap(),
            selected_bonus_3: (BitShift::shr(data, RunDataBits::SELECTED_BONUS_3_POS.into())
                & RunDataBits::SELECTED_BONUS_MASK)
                .try_into()
                .unwrap(),
            bonus_1_level: (BitShift::shr(data, RunDataBits::BONUS_1_LEVEL_POS.into())
                & RunDataBits::BONUS_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bonus_2_level: (BitShift::shr(data, RunDataBits::BONUS_2_LEVEL_POS.into())
                & RunDataBits::BONUS_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bonus_3_level: (BitShift::shr(data, RunDataBits::BONUS_3_LEVEL_POS.into())
                & RunDataBits::BONUS_LEVEL_MASK)
                .try_into()
                .unwrap(),
            free_moves: (BitShift::shr(data, RunDataBits::FREE_MOVES_POS.into())
                & RunDataBits::FREE_MOVES_MASK)
                .try_into()
                .unwrap(),
            pending_level_up: (BitShift::shr(data, RunDataBits::PENDING_LEVEL_UP_POS.into())
                & RunDataBits::PENDING_LEVEL_UP_MASK) == 1,
            // Shop state fields
            last_shop_level: (BitShift::shr(data, RunDataBits::LAST_SHOP_LEVEL_POS.into())
                & RunDataBits::LAST_SHOP_LEVEL_MASK)
                .try_into()
                .unwrap(),
            shop_bonus_1_bought: (BitShift::shr(data, RunDataBits::SHOP_BONUS_1_BOUGHT_POS.into())
                & RunDataBits::SHOP_BOUGHT_MASK) == 1,
            shop_bonus_2_bought: (BitShift::shr(data, RunDataBits::SHOP_BONUS_2_BOUGHT_POS.into())
                & RunDataBits::SHOP_BOUGHT_MASK) == 1,
            shop_bonus_3_bought: (BitShift::shr(data, RunDataBits::SHOP_BONUS_3_BOUGHT_POS.into())
                & RunDataBits::SHOP_BOUGHT_MASK) == 1,
            shop_refills: (BitShift::shr(data, RunDataBits::SHOP_REFILLS_POS.into())
                & RunDataBits::SHOP_REFILLS_MASK)
                .try_into()
                .unwrap(),
        }
    }
}

// =============================================================================
// PlayerMeta packing
// =============================================================================

/// PlayerMeta.data layout (86 bits used, 166 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Description                │
/// ├─────────┼───────────────────────┼──────┼────────────────────────────┤
/// │ 0-1     │ starting_hammer       │ 2    │ Starting hammers (0-3)     │
/// │ 2-3     │ starting_wave         │ 2    │ Starting waves (0-3)       │
/// │ 4-5     │ starting_totem        │ 2    │ Starting totems (0-3)      │
/// │ 6-7     │ starting_shrink       │ 2    │ Starting shrinks (0-3)     │
/// │ 8-9     │ starting_shuffle      │ 2    │ Starting shuffles (0-3)    │
/// │ 10-13   │ bag_hammer_level      │ 4    │ Hammer bag upgrades (0-15) │
/// │ 14-17   │ bag_wave_level        │ 4    │ Wave bag upgrades (0-15)   │
/// │ 18-21   │ bag_totem_level       │ 4    │ Totem bag upgrades (0-15)  │
/// │ 22-25   │ bag_shrink_level      │ 4    │ Shrink bag upgrades (0-15) │
/// │ 26-29   │ bag_shuffle_level     │ 4    │ Shuffle bag upgrades (0-15)│
/// │ 30-33   │ bridging_rank         │ 4    │ Cube bridging rank (0-15)  │
/// │ 34      │ shrink_unlocked       │ 1    │ Shrink bonus unlocked      │
/// │ 35      │ shuffle_unlocked      │ 1    │ Shuffle bonus unlocked     │
/// │ 36-51   │ total_runs            │ 16   │ Lifetime run count         │
/// │ 52-83   │ total_cubes_earned    │ 32   │ Lifetime cubes earned      │
/// │ 84-85   │ reserved_flags        │ 2    │ Future unlocks/features    │
/// │ 86-251  │ reserved              │ 166  │ Future features            │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked player meta data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct MetaData {
    // Starting bonus upgrades (0 = none, 1 = start with 1, 2 = start with 2, 3 = start with 3)
    pub starting_hammer: u8,
    pub starting_wave: u8,
    pub starting_totem: u8,
    pub starting_shrink: u8,
    pub starting_shuffle: u8,
    // Bag size upgrades (0 = default size 1, each level adds +1 capacity)
    pub bag_hammer_level: u8,
    pub bag_wave_level: u8,
    pub bag_totem_level: u8,
    pub bag_shrink_level: u8,
    pub bag_shuffle_level: u8,
    // Cube bridging rank (0 = can't bring, higher = more cubes allowed)
    pub bridging_rank: u8,
    // Bonus unlock flags (Shrink and Shuffle require unlocking)
    pub shrink_unlocked: bool,
    pub shuffle_unlocked: bool,
    // Stats
    pub total_runs: u16,
    pub total_cubes_earned: u32,
}

/// Bit positions and masks for meta_data
mod MetaDataBits {
    // Bit positions
    pub const STARTING_HAMMER_POS: u8 = 0;
    pub const STARTING_WAVE_POS: u8 = 2;
    pub const STARTING_TOTEM_POS: u8 = 4;
    pub const STARTING_SHRINK_POS: u8 = 6;
    pub const STARTING_SHUFFLE_POS: u8 = 8;
    pub const BAG_HAMMER_LEVEL_POS: u8 = 10;
    pub const BAG_WAVE_LEVEL_POS: u8 = 14;
    pub const BAG_TOTEM_LEVEL_POS: u8 = 18;
    pub const BAG_SHRINK_LEVEL_POS: u8 = 22;
    pub const BAG_SHUFFLE_LEVEL_POS: u8 = 26;
    pub const BRIDGING_RANK_POS: u8 = 30;
    pub const SHRINK_UNLOCKED_POS: u8 = 34;
    pub const SHUFFLE_UNLOCKED_POS: u8 = 35;
    pub const TOTAL_RUNS_POS: u8 = 36;
    pub const TOTAL_CUBES_EARNED_POS: u8 = 52;

    // Masks
    pub const STARTING_BONUS_MASK: u256 = 0x3; // 2 bits (0-3)
    pub const BAG_LEVEL_MASK: u256 = 0xF; // 4 bits (0-15)
    pub const BRIDGING_RANK_MASK: u256 = 0xF; // 4 bits (0-15)
    pub const UNLOCK_MASK: u256 = 0x1; // 1 bit (0-1)
    pub const TOTAL_RUNS_MASK: u256 = 0xFFFF; // 16 bits
    pub const TOTAL_CUBES_EARNED_MASK: u256 = 0xFFFFFFFF; // 32 bits
}

#[generate_trait]
pub impl MetaDataPacking of MetaDataPackingTrait {
    /// Create a new MetaData with initial values
    fn new() -> MetaData {
        MetaData {
            starting_hammer: 0,
            starting_wave: 0,
            starting_totem: 0,
            starting_shrink: 0,
            starting_shuffle: 0,
            bag_hammer_level: 0,
            bag_wave_level: 0,
            bag_totem_level: 0,
            bag_shrink_level: 0,
            bag_shuffle_level: 0,
            bridging_rank: 0,
            shrink_unlocked: false,
            shuffle_unlocked: false,
            total_runs: 0,
            total_cubes_earned: 0,
        }
    }

    /// Pack MetaData into a felt252
    fn pack(self: MetaData) -> felt252 {
        let mut packed: u256 = 0;

        // Starting hammer is at position 0, no shift needed
        packed = packed | (self.starting_hammer.into() & MetaDataBits::STARTING_BONUS_MASK);
        packed = packed
            | BitShift::shl(
                self.starting_wave.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_WAVE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.starting_totem.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_TOTEM_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.starting_shrink.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_SHRINK_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.starting_shuffle.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_SHUFFLE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_hammer_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_HAMMER_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_wave_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_WAVE_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_totem_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_TOTEM_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_shrink_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_SHRINK_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_shuffle_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_SHUFFLE_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bridging_rank.into() & MetaDataBits::BRIDGING_RANK_MASK,
                MetaDataBits::BRIDGING_RANK_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.shrink_unlocked { 1_u256 } else { 0_u256 },
                MetaDataBits::SHRINK_UNLOCKED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.shuffle_unlocked { 1_u256 } else { 0_u256 },
                MetaDataBits::SHUFFLE_UNLOCKED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_runs.into() & MetaDataBits::TOTAL_RUNS_MASK,
                MetaDataBits::TOTAL_RUNS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_cubes_earned.into() & MetaDataBits::TOTAL_CUBES_EARNED_MASK,
                MetaDataBits::TOTAL_CUBES_EARNED_POS.into(),
            );

        packed.try_into().unwrap()
    }

    /// Unpack a felt252 into MetaData
    fn unpack(packed: felt252) -> MetaData {
        let data: u256 = packed.into();

        MetaData {
            // Starting hammer is at position 0, no shift needed
            starting_hammer: (data & MetaDataBits::STARTING_BONUS_MASK).try_into().unwrap(),
            starting_wave: (BitShift::shr(data, MetaDataBits::STARTING_WAVE_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_totem: (BitShift::shr(data, MetaDataBits::STARTING_TOTEM_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_shrink: (BitShift::shr(data, MetaDataBits::STARTING_SHRINK_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_shuffle: (BitShift::shr(data, MetaDataBits::STARTING_SHUFFLE_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            bag_hammer_level: (BitShift::shr(data, MetaDataBits::BAG_HAMMER_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_wave_level: (BitShift::shr(data, MetaDataBits::BAG_WAVE_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_totem_level: (BitShift::shr(data, MetaDataBits::BAG_TOTEM_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_shrink_level: (BitShift::shr(data, MetaDataBits::BAG_SHRINK_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_shuffle_level: (BitShift::shr(data, MetaDataBits::BAG_SHUFFLE_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bridging_rank: (BitShift::shr(data, MetaDataBits::BRIDGING_RANK_POS.into())
                & MetaDataBits::BRIDGING_RANK_MASK)
                .try_into()
                .unwrap(),
            shrink_unlocked: (BitShift::shr(data, MetaDataBits::SHRINK_UNLOCKED_POS.into())
                & MetaDataBits::UNLOCK_MASK) == 1,
            shuffle_unlocked: (BitShift::shr(data, MetaDataBits::SHUFFLE_UNLOCKED_POS.into())
                & MetaDataBits::UNLOCK_MASK) == 1,
            total_runs: (BitShift::shr(data, MetaDataBits::TOTAL_RUNS_POS.into())
                & MetaDataBits::TOTAL_RUNS_MASK)
                .try_into()
                .unwrap(),
            total_cubes_earned: (BitShift::shr(data, MetaDataBits::TOTAL_CUBES_EARNED_POS.into())
                & MetaDataBits::TOTAL_CUBES_EARNED_MASK)
                .try_into()
                .unwrap(),
        }
    }

    /// Get the bag size for a bonus type (default 1 + upgrade level)
    /// bonus_type: 0=Hammer, 1=Wave, 2=Totem, 3=Shrink, 4=Shuffle
    fn get_bag_size(self: MetaData, bonus_type: u8) -> u8 {
        let base_size: u8 = 1;
        match bonus_type {
            0 => base_size + self.bag_hammer_level, // Hammer
            1 => base_size + self.bag_wave_level,   // Wave
            2 => base_size + self.bag_totem_level,  // Totem
            3 => base_size + self.bag_shrink_level, // Shrink
            4 => base_size + self.bag_shuffle_level, // Shuffle
            _ => base_size,
        }
    }

    /// Get the starting count for a bonus type
    /// bonus_type: 0=Hammer, 1=Wave, 2=Totem, 3=Shrink, 4=Shuffle
    fn get_starting_bonus(self: MetaData, bonus_type: u8) -> u8 {
        match bonus_type {
            0 => self.starting_hammer,
            1 => self.starting_wave,
            2 => self.starting_totem,
            3 => self.starting_shrink,
            4 => self.starting_shuffle,
            _ => 0,
        }
    }

    /// Check if a bonus type is unlocked
    /// bonus_type: 0=Hammer, 1=Wave, 2=Totem, 3=Shrink, 4=Shuffle
    /// Hammer, Wave, and Totem are always unlocked (default bonuses)
    fn is_bonus_unlocked(self: MetaData, bonus_type: u8) -> bool {
        match bonus_type {
            0 | 1 | 2 => true, // Hammer, Wave, Totem - always unlocked
            3 => self.shrink_unlocked,
            4 => self.shuffle_unlocked,
            _ => false,
        }
    }

    /// Get max cubes that can be brought into a run based on bridging rank
    /// Rank 0 = 0, Rank 1 = 5, Rank 2 = 10, Rank 3 = 20, etc. (5 * 2^(rank-1))
    fn get_max_cubes_to_bring(self: MetaData) -> u16 {
        if self.bridging_rank == 0 {
            0
        } else {
            let rank_minus_one: u8 = self.bridging_rank - 1;
            let pow: u32 = pow2_u16(rank_minus_one).into();
            let result: u32 = 5_u32 * pow;
            if result > 65535 {
                65535_u16
            } else {
                result.try_into().unwrap()
            }
        }
    }
}

/// Helper: compute 2^n as u16
fn pow2_u16(n: u8) -> u16 {
    let mut result: u16 = 1;
    let mut i: u8 = 0;
    loop {
        if i >= n {
            break result;
        }
        result = result * 2;
        i += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::{
        RunData, RunDataPacking, RunDataPackingTrait, MetaData, MetaDataPacking,
        MetaDataPackingTrait,
    };

    #[test]
    fn test_run_data_new() {
        let data = RunDataPackingTrait::new();
        assert!(data.current_level == 1, "Should start at level 1");
        assert!(data.level_score == 0, "Should start with 0 score");
        assert!(data.hammer_count == 0, "Should start with 0 hammers");
        assert!(data.shrink_count == 0, "Should start with 0 shrinks");
        assert!(data.shuffle_count == 0, "Should start with 0 shuffles");
        assert!(data.extra_moves == 0, "Should start with 0 extra moves");
        assert!(data.total_score == 0, "Should start with 0 total score");
        assert!(data.combo_5_achieved == false, "Should start with combo_5 not achieved");
        assert!(data.combo_10_achieved == false, "Should start with combo_10 not achieved");
        assert!(data.cubes_brought == 0, "Should start with 0 cubes brought");
        assert!(data.cubes_spent == 0, "Should start with 0 cubes spent");
        assert!(data.constraint_2_progress == 0, "Should start with 0 constraint_2 progress");
        // Bonus V2.0: Default selection is Hammer(1), Wave(3), Totem(2)
        assert!(data.selected_bonus_1 == 1, "Should start with Hammer selected");
        assert!(data.selected_bonus_2 == 3, "Should start with Wave selected");
        assert!(data.selected_bonus_3 == 2, "Should start with Totem selected");
        assert!(data.bonus_1_level == 0, "Bonus 1 should start at L1 (0)");
        assert!(data.bonus_2_level == 0, "Bonus 2 should start at L1 (0)");
        assert!(data.bonus_3_level == 0, "Bonus 3 should start at L1 (0)");
        assert!(data.free_moves == 0, "Should start with 0 free moves");
        assert!(data.pending_level_up == false, "Should start with no pending level up");
    }

    #[test]
    fn test_run_data_pack_unpack_roundtrip() {
        let original = RunData {
            current_level: 42,
            level_score: 150,
            level_moves: 25,
            constraint_progress: 3,
            bonus_used_this_level: true,
            total_cubes: 256,
            hammer_count: 5,
            wave_count: 3,
            totem_count: 2,
            shrink_count: 4,
            shuffle_count: 6,
            max_combo_run: 7,
            extra_moves: 10,
            total_score: 12345,
            combo_5_achieved: true,
            combo_10_achieved: false,
            cubes_brought: 100,
            cubes_spent: 45,
            constraint_2_progress: 7,
            run_completed: false,
            // Bonus V2.0 fields
            selected_bonus_1: 4, // Shrink
            selected_bonus_2: 1, // Hammer
            selected_bonus_3: 5, // Shuffle
            bonus_1_level: 2,    // L3
            bonus_2_level: 1,    // L2
            bonus_3_level: 0,    // L1
            free_moves: 3,
            pending_level_up: true,
            // Shop state fields
            last_shop_level: 11,
            shop_bonus_1_bought: true,
            shop_bonus_2_bought: false,
            shop_bonus_3_bought: true,
            shop_refills: 2,
        };

        let packed = original.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked.current_level == original.current_level, "current_level mismatch");
        assert!(unpacked.level_score == original.level_score, "level_score mismatch");
        assert!(unpacked.level_moves == original.level_moves, "level_moves mismatch");
        assert!(
            unpacked.constraint_progress == original.constraint_progress,
            "constraint_progress mismatch",
        );
        assert!(
            unpacked.bonus_used_this_level == original.bonus_used_this_level,
            "bonus_used_this_level mismatch",
        );
        assert!(unpacked.total_cubes == original.total_cubes, "total_cubes mismatch");
        assert!(unpacked.hammer_count == original.hammer_count, "hammer_count mismatch");
        assert!(unpacked.wave_count == original.wave_count, "wave_count mismatch");
        assert!(unpacked.totem_count == original.totem_count, "totem_count mismatch");
        assert!(unpacked.shrink_count == original.shrink_count, "shrink_count mismatch");
        assert!(unpacked.shuffle_count == original.shuffle_count, "shuffle_count mismatch");
        assert!(unpacked.max_combo_run == original.max_combo_run, "max_combo_run mismatch");
        assert!(unpacked.extra_moves == original.extra_moves, "extra_moves mismatch");
        assert!(unpacked.total_score == original.total_score, "total_score mismatch");
        assert!(
            unpacked.combo_5_achieved == original.combo_5_achieved, "combo_5_achieved mismatch",
        );
        assert!(
            unpacked.combo_10_achieved == original.combo_10_achieved, "combo_10_achieved mismatch",
        );
        assert!(unpacked.cubes_brought == original.cubes_brought, "cubes_brought mismatch");
        assert!(unpacked.cubes_spent == original.cubes_spent, "cubes_spent mismatch");
        assert!(unpacked.constraint_2_progress == original.constraint_2_progress, "constraint_2_progress mismatch");
        // Bonus V2.0 assertions
        assert!(unpacked.selected_bonus_1 == original.selected_bonus_1, "selected_bonus_1 mismatch");
        assert!(unpacked.selected_bonus_2 == original.selected_bonus_2, "selected_bonus_2 mismatch");
        assert!(unpacked.selected_bonus_3 == original.selected_bonus_3, "selected_bonus_3 mismatch");
        assert!(unpacked.bonus_1_level == original.bonus_1_level, "bonus_1_level mismatch");
        assert!(unpacked.bonus_2_level == original.bonus_2_level, "bonus_2_level mismatch");
        assert!(unpacked.bonus_3_level == original.bonus_3_level, "bonus_3_level mismatch");
        assert!(unpacked.free_moves == original.free_moves, "free_moves mismatch");
        assert!(unpacked.pending_level_up == original.pending_level_up, "pending_level_up mismatch");
        // Shop state assertions
        assert!(unpacked.last_shop_level == original.last_shop_level, "last_shop_level mismatch");
        assert!(unpacked.shop_bonus_1_bought == original.shop_bonus_1_bought, "shop_bonus_1_bought mismatch");
        assert!(unpacked.shop_bonus_2_bought == original.shop_bonus_2_bought, "shop_bonus_2_bought mismatch");
        assert!(unpacked.shop_bonus_3_bought == original.shop_bonus_3_bought, "shop_bonus_3_bought mismatch");
        assert!(unpacked.shop_refills == original.shop_refills, "shop_refills mismatch");
    }

    #[test]
    fn test_run_data_edge_values() {
        // Test maximum values for each field
        let max_values = RunData {
            current_level: 255, // 8 bits max
            level_score: 255, // 8 bits max
            level_moves: 255, // 8 bits max
            constraint_progress: 255, // 8 bits max
            bonus_used_this_level: true,
            total_cubes: 65535, // 16 bits max
            hammer_count: 255, // 8 bits max
            wave_count: 255, // 8 bits max
            totem_count: 255, // 8 bits max
            shrink_count: 255, // 8 bits max
            shuffle_count: 255, // 8 bits max
            max_combo_run: 255, // 8 bits max
            extra_moves: 255, // 8 bits max
            total_score: 65535, // 16 bits max
            combo_5_achieved: true,
            combo_10_achieved: true,
            cubes_brought: 65535, // 16 bits max
            cubes_spent: 65535, // 16 bits max
            constraint_2_progress: 255, // 8 bits max
            run_completed: true, // 1 bit max
            // Bonus V2.0: max values
            selected_bonus_1: 5, // 3 bits max (but only 0-5 valid)
            selected_bonus_2: 5,
            selected_bonus_3: 5,
            bonus_1_level: 2, // 2 bits max (but only 0-2 valid)
            bonus_2_level: 2,
            bonus_3_level: 2,
            free_moves: 7, // 3 bits max
            pending_level_up: true,
            // Shop state: max values
            last_shop_level: 63, // 6 bits max
            shop_bonus_1_bought: true,
            shop_bonus_2_bought: true,
            shop_bonus_3_bought: true,
            shop_refills: 15, // 4 bits max
        };

        let packed = max_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == max_values, "Max values should roundtrip correctly");
    }

    #[test]
    fn test_run_data_zero_values() {
        let zero_values = RunData {
            current_level: 0,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            bonus_used_this_level: false,
            total_cubes: 0,
            hammer_count: 0,
            wave_count: 0,
            totem_count: 0,
            shrink_count: 0,
            shuffle_count: 0,
            max_combo_run: 0,
            extra_moves: 0,
            total_score: 0,
            combo_5_achieved: false,
            combo_10_achieved: false,
            cubes_brought: 0,
            cubes_spent: 0,
            constraint_2_progress: 0,
            run_completed: false,
            // Bonus V2.0: zero values
            selected_bonus_1: 0,
            selected_bonus_2: 0,
            selected_bonus_3: 0,
            bonus_1_level: 0,
            bonus_2_level: 0,
            bonus_3_level: 0,
            free_moves: 0,
            pending_level_up: false,
            // Shop state: zero values
            last_shop_level: 0,
            shop_bonus_1_bought: false,
            shop_bonus_2_bought: false,
            shop_bonus_3_bought: false,
            shop_refills: 0,
        };

        let packed = zero_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == zero_values, "Zero values should roundtrip correctly");
    }

    #[test]
    fn test_meta_data_pack_unpack_roundtrip() {
        let original = MetaData {
            starting_hammer: 2,
            starting_wave: 1,
            starting_totem: 3,
            starting_shrink: 1,
            starting_shuffle: 2,
            bag_hammer_level: 5,
            bag_wave_level: 3,
            bag_totem_level: 7,
            bag_shrink_level: 2,
            bag_shuffle_level: 4,
            bridging_rank: 4,
            shrink_unlocked: true,
            shuffle_unlocked: false,
            total_runs: 1000,
            total_cubes_earned: 50000,
        };

        let packed = original.pack();
        let unpacked = MetaDataPackingTrait::unpack(packed);

        assert!(unpacked.starting_hammer == original.starting_hammer, "starting_hammer mismatch");
        assert!(unpacked.starting_wave == original.starting_wave, "starting_wave mismatch");
        assert!(unpacked.starting_totem == original.starting_totem, "starting_totem mismatch");
        assert!(unpacked.starting_shrink == original.starting_shrink, "starting_shrink mismatch");
        assert!(unpacked.starting_shuffle == original.starting_shuffle, "starting_shuffle mismatch");
        assert!(
            unpacked.bag_hammer_level == original.bag_hammer_level, "bag_hammer_level mismatch",
        );
        assert!(unpacked.bag_wave_level == original.bag_wave_level, "bag_wave_level mismatch");
        assert!(unpacked.bag_totem_level == original.bag_totem_level, "bag_totem_level mismatch");
        assert!(unpacked.bag_shrink_level == original.bag_shrink_level, "bag_shrink_level mismatch");
        assert!(unpacked.bag_shuffle_level == original.bag_shuffle_level, "bag_shuffle_level mismatch");
        assert!(unpacked.bridging_rank == original.bridging_rank, "bridging_rank mismatch");
        assert!(unpacked.shrink_unlocked == original.shrink_unlocked, "shrink_unlocked mismatch");
        assert!(unpacked.shuffle_unlocked == original.shuffle_unlocked, "shuffle_unlocked mismatch");
        assert!(unpacked.total_runs == original.total_runs, "total_runs mismatch");
        assert!(
            unpacked.total_cubes_earned == original.total_cubes_earned,
            "total_cubes_earned mismatch",
        );
    }

    #[test]
    fn test_meta_data_new() {
        let data = MetaDataPackingTrait::new();
        assert!(data.starting_hammer == 0, "Should start with 0 starting hammers");
        assert!(data.starting_shrink == 0, "Should start with 0 starting shrinks");
        assert!(data.starting_shuffle == 0, "Should start with 0 starting shuffles");
        assert!(data.bag_shrink_level == 0, "Should start with 0 shrink bag level");
        assert!(data.bag_shuffle_level == 0, "Should start with 0 shuffle bag level");
        assert!(data.bridging_rank == 0, "Should start with 0 bridging rank");
        assert!(data.shrink_unlocked == false, "Shrink should start locked");
        assert!(data.shuffle_unlocked == false, "Shuffle should start locked");
        assert!(data.total_runs == 0, "Should start with 0 runs");
        assert!(data.total_cubes_earned == 0, "Should start with 0 cubes earned");
    }

    #[test]
    fn test_meta_data_bag_size() {
        let mut data = MetaDataPackingTrait::new();
        // Default bag size is 1
        assert!(data.get_bag_size(0) == 1, "Default hammer bag should be 1");
        assert!(data.get_bag_size(1) == 1, "Default wave bag should be 1");
        assert!(data.get_bag_size(2) == 1, "Default totem bag should be 1");
        assert!(data.get_bag_size(3) == 1, "Default shrink bag should be 1");
        assert!(data.get_bag_size(4) == 1, "Default shuffle bag should be 1");

        // Upgrade hammer bag
        data.bag_hammer_level = 2;
        assert!(data.get_bag_size(0) == 3, "Upgraded hammer bag should be 3");
        assert!(data.get_bag_size(1) == 1, "Wave bag should still be 1");

        // Upgrade shrink bag
        data.bag_shrink_level = 3;
        assert!(data.get_bag_size(3) == 4, "Upgraded shrink bag should be 4");
    }

    #[test]
    fn test_meta_data_bonus_unlock() {
        let mut data = MetaDataPackingTrait::new();

        // Default bonuses are always unlocked
        assert!(data.is_bonus_unlocked(0), "Hammer should be unlocked");
        assert!(data.is_bonus_unlocked(1), "Wave should be unlocked");
        assert!(data.is_bonus_unlocked(2), "Totem should be unlocked");

        // Shrink and Shuffle start locked
        assert!(!data.is_bonus_unlocked(3), "Shrink should start locked");
        assert!(!data.is_bonus_unlocked(4), "Shuffle should start locked");

        // Unlock Shrink
        data.shrink_unlocked = true;
        assert!(data.is_bonus_unlocked(3), "Shrink should be unlocked after unlock");
        assert!(!data.is_bonus_unlocked(4), "Shuffle should still be locked");

        // Unlock Shuffle
        data.shuffle_unlocked = true;
        assert!(data.is_bonus_unlocked(4), "Shuffle should be unlocked after unlock");
    }

    #[test]
    fn test_meta_data_starting_bonus() {
        let mut data = MetaDataPackingTrait::new();

        // All starting bonuses default to 0
        assert!(data.get_starting_bonus(0) == 0, "Default starting hammer should be 0");
        assert!(data.get_starting_bonus(3) == 0, "Default starting shrink should be 0");
        assert!(data.get_starting_bonus(4) == 0, "Default starting shuffle should be 0");

        // Set starting values
        data.starting_shrink = 2;
        data.starting_shuffle = 1;
        assert!(data.get_starting_bonus(3) == 2, "Starting shrink should be 2");
        assert!(data.get_starting_bonus(4) == 1, "Starting shuffle should be 1");
    }

    #[test]
    fn test_meta_data_max_cubes_to_bring() {
        let mut data = MetaDataPackingTrait::new();

        // Rank 0 = can't bring any
        assert!(data.get_max_cubes_to_bring() == 0, "Rank 0 should allow 0 cubes");

        // Rank 1 = 5 cubes
        data.bridging_rank = 1;
        assert!(data.get_max_cubes_to_bring() == 5, "Rank 1 should allow 5 cubes");

        // Rank 2 = 10 cubes
        data.bridging_rank = 2;
        assert!(data.get_max_cubes_to_bring() == 10, "Rank 2 should allow 10 cubes");

        // Rank 3 = 20 cubes
        data.bridging_rank = 3;
        assert!(data.get_max_cubes_to_bring() == 20, "Rank 3 should allow 20 cubes");

        // Rank 4 = 40 cubes
        data.bridging_rank = 4;
        assert!(data.get_max_cubes_to_bring() == 40, "Rank 4 should allow 40 cubes");

        // Rank 15 would overflow u16 without clamping
        data.bridging_rank = 15;
        assert!(data.get_max_cubes_to_bring() == 65535, "Rank 15 should clamp to u16::MAX");
    }
}
