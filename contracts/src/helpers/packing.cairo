use alexandria_math::BitShift;

/// Bit-packing helpers for efficient storage
/// 
/// run_data layout (197 bits used, 55 reserved):
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
/// │ 43-50   │ combo_count           │ 8    │ 0-255    │ Inventory       │
/// │ 51-58   │ score_count           │ 8    │ 0-255    │ Inventory       │
/// │ 59-66   │ harvest_count         │ 8    │ 0-255    │ Inventory       │
/// │ 67-74   │ wave_count            │ 8    │ 0-255    │ Wave inventory  │
/// │ 75-82   │ supply_count          │ 8    │ 0-255    │ Supply inv      │
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
/// │ 196     │ no_bonus_constraint   │ 1    │ 0-1      │ NoBonusUsed active│
/// │ 197-204 │ constraint_3_progress │ 8    │ 0-255    │ 3rd constraint  │
/// │ 205-251 │ reserved              │ 47   │ -        │ Future features │
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
    pub combo_count: u8,
    pub score_count: u8,
    pub harvest_count: u8,
    pub wave_count: u8,
    pub supply_count: u8,
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
    // Values: 0=None, 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
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
    // Constraint flags (set when level starts, reset on level transition)
    pub no_bonus_constraint: bool, // True if current level has NoBonusUsed constraint
    // Tertiary constraint progress (for triple-constraint boss levels 40/50)
    pub constraint_3_progress: u8,
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
    pub const COMBO_COUNT_POS: u8 = 43;
    pub const SCORE_COUNT_POS: u8 = 51;
    pub const HARVEST_COUNT_POS: u8 = 59;
    pub const WAVE_COUNT_POS: u8 = 67;
    pub const SUPPLY_COUNT_POS: u8 = 75;
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
    // Constraint flags
    pub const NO_BONUS_CONSTRAINT_POS: u8 = 196;
    // Tertiary constraint progress
    pub const CONSTRAINT_3_PROGRESS_POS: u8 = 197;

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
    // Constraint flags masks
    pub const NO_BONUS_CONSTRAINT_MASK: u256 = 0x1; // 1 bit
    // Tertiary constraint progress mask
    pub const CONSTRAINT_3_PROGRESS_MASK: u256 = 0xFF; // 8 bits
}

#[generate_trait]
pub impl RunDataPacking of RunDataPackingTrait {
    /// Create a new RunData with initial values for level 1
    /// Default bonus selection: Combo (1), Score (2), Harvest (3)
    fn new() -> RunData {
        RunData {
            current_level: 1,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            bonus_used_this_level: false,
            total_cubes: 0,
            combo_count: 0,
            score_count: 0,
            harvest_count: 0,
            wave_count: 0,
            supply_count: 0,
            max_combo_run: 0,
            extra_moves: 0,
            total_score: 0,
            combo_5_achieved: false,
            combo_10_achieved: false,
            cubes_brought: 0,
            cubes_spent: 0,
            constraint_2_progress: 0,
            run_completed: false,
            // Bonus V3.0: Default selection (Combo, Score, Harvest)
            selected_bonus_1: 1, // Combo
            selected_bonus_2: 2, // Score
            selected_bonus_3: 3, // Harvest
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
            // Constraint flags (set when level actually starts)
            no_bonus_constraint: false,
            // Tertiary constraint progress
            constraint_3_progress: 0,
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
                self.combo_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::COMBO_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.score_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::SCORE_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.harvest_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::HARVEST_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.wave_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::WAVE_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.supply_count.into() & RunDataBits::COUNT_MASK,
                RunDataBits::SUPPLY_COUNT_POS.into(),
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
        // Constraint flags
        packed = packed
            | BitShift::shl(
                if self.no_bonus_constraint { 1_u256 } else { 0_u256 },
                RunDataBits::NO_BONUS_CONSTRAINT_POS.into(),
            );
        // Tertiary constraint progress
        packed = packed
            | BitShift::shl(
                self.constraint_3_progress.into() & RunDataBits::CONSTRAINT_3_PROGRESS_MASK,
                RunDataBits::CONSTRAINT_3_PROGRESS_POS.into(),
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
            combo_count: (BitShift::shr(data, RunDataBits::COMBO_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            score_count: (BitShift::shr(data, RunDataBits::SCORE_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            harvest_count: (BitShift::shr(data, RunDataBits::HARVEST_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            wave_count: (BitShift::shr(data, RunDataBits::WAVE_COUNT_POS.into())
                & RunDataBits::COUNT_MASK)
                .try_into()
                .unwrap(),
            supply_count: (BitShift::shr(data, RunDataBits::SUPPLY_COUNT_POS.into())
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
            // Constraint flags
            no_bonus_constraint: (BitShift::shr(data, RunDataBits::NO_BONUS_CONSTRAINT_POS.into())
                & RunDataBits::NO_BONUS_CONSTRAINT_MASK) == 1,
            // Tertiary constraint progress
            constraint_3_progress: (BitShift::shr(
                data, RunDataBits::CONSTRAINT_3_PROGRESS_POS.into(),
            )
                & RunDataBits::CONSTRAINT_3_PROGRESS_MASK)
                .try_into()
                .unwrap(),
        }
    }
}

// =============================================================================
// RunData helper methods
// =============================================================================

/// Helper methods for RunData to consolidate common operations
#[generate_trait]
pub impl RunDataHelpers of RunDataHelpersTrait {
    /// Convert bonus type code to bag index.
    /// Bonus types: 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
    /// Bag indices: 0=Combo, 1=Score, 2=Harvest, 3=Wave, 4=Supply
    #[inline(always)]
    fn bonus_type_to_bag_idx(bonus_type: u8) -> u8 {
        match bonus_type {
            1 => 0,  // Combo
            2 => 1,  // Score
            3 => 2,  // Harvest
            4 => 3,  // Wave
            5 => 4,  // Supply
            _ => 0,
        }
    }

    /// Get current bonus count for a bonus type.
    /// bonus_type: 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
    #[inline(always)]
    fn get_bonus_count(self: @RunData, bonus_type: u8) -> u8 {
        match bonus_type {
            1 => *self.combo_count,
            2 => *self.score_count,
            3 => *self.harvest_count,
            4 => *self.wave_count,
            5 => *self.supply_count,
            _ => 0,
        }
    }

    /// Add a bonus to inventory if bag has space.
    /// Returns true if added successfully, false if bag is full.
    /// bonus_type: 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
    fn add_bonus(ref self: RunData, bonus_type: u8, bag_size: u8) -> bool {
        match bonus_type {
            1 => {
                if self.combo_count >= bag_size { return false; }
                self.combo_count += 1;
                true
            },
            2 => {
                if self.score_count >= bag_size { return false; }
                self.score_count += 1;
                true
            },
            3 => {
                if self.harvest_count >= bag_size { return false; }
                self.harvest_count += 1;
                true
            },
            4 => {
                if self.wave_count >= bag_size { return false; }
                self.wave_count += 1;
                true
            },
            5 => {
                if self.supply_count >= bag_size { return false; }
                self.supply_count += 1;
                true
            },
            _ => false,
        }
    }

    /// Calculate available cubes (brought + earned - spent).
    #[inline(always)]
    fn get_available_cubes(self: @RunData) -> u16 {
        let total_budget: u32 = (*self.cubes_brought).into() + (*self.total_cubes).into();
        let spent: u32 = (*self.cubes_spent).into();
        let available: u32 = if total_budget >= spent { total_budget - spent } else { 0 };
        if available > 65535 { 65535_u16 } else { available.try_into().unwrap() }
    }

    /// Spend cubes from budget. Panics if insufficient cubes.
    fn spend_cubes(ref self: RunData, amount: u16) {
        let available = self.get_available_cubes();
        assert!(available >= amount, "Insufficient cubes");
        
        let new_spent: u32 = self.cubes_spent.into() + amount.into();
        assert!(new_spent <= 65535, "Cubes spent overflow");
        self.cubes_spent = new_spent.try_into().unwrap();
    }
}

// =============================================================================
// PlayerMeta packing
// =============================================================================

/// PlayerMeta.data layout (86 bits used, 166 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Description                │
/// ├─────────┼───────────────────────┼──────┼────────────────────────────┤
/// │ 0-1     │ starting_combo        │ 2    │ Starting combos (0-3)      │
/// │ 2-3     │ starting_score        │ 2    │ Starting scores (0-3)      │
/// │ 4-5     │ starting_harvest      │ 2    │ Starting harvests (0-3)    │
/// │ 6-7     │ starting_wave         │ 2    │ Starting waves (0-3)       │
/// │ 8-9     │ starting_supply       │ 2    │ Starting supplies (0-3)    │
/// │ 10-13   │ bag_combo_level       │ 4    │ Combo bag upgrades (0-15)  │
/// │ 14-17   │ bag_score_level       │ 4    │ Score bag upgrades (0-15)  │
/// │ 18-21   │ bag_harvest_level     │ 4    │ Harvest bag upgrades (0-15)│
/// │ 22-25   │ bag_wave_level        │ 4    │ Wave bag upgrades (0-15)   │
/// │ 26-29   │ bag_supply_level      │ 4    │ Supply bag upgrades (0-15) │
/// │ 30-33   │ bridging_rank         │ 4    │ Cube bridging rank (0-15)  │
/// │ 34      │ wave_unlocked         │ 1    │ Wave bonus unlocked        │
/// │ 35      │ supply_unlocked       │ 1    │ Supply bonus unlocked      │
/// │ 36-51   │ total_runs            │ 16   │ Lifetime run count         │
/// │ 52-83   │ total_cubes_earned    │ 32   │ Lifetime cubes earned      │
/// │ 84-85   │ reserved_flags        │ 2    │ Future unlocks/features    │
/// │ 86-251  │ reserved              │ 166  │ Future features            │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked player meta data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct MetaData {
    // Starting bonus charges (0 = none, upgradeable up to bag size via permanent shop)
    pub starting_combo: u8,
    pub starting_score: u8,
    pub starting_harvest: u8,
    pub starting_wave: u8,
    pub starting_supply: u8,
    // Bag size upgrades (0 = default size 1, each level adds +1 capacity, max 4 upgrades = size 5)
    pub bag_combo_level: u8,
    pub bag_score_level: u8,
    pub bag_harvest_level: u8,
    pub bag_wave_level: u8,
    pub bag_supply_level: u8,
    // Cube bridging rank (0 = can't bring, higher = more cubes allowed)
    pub bridging_rank: u8,
    // Bonus unlock flags (Wave and Supply require unlocking)
    pub wave_unlocked: bool,
    pub supply_unlocked: bool,
    // Stats
    pub total_runs: u16,
    pub total_cubes_earned: u32,
}

/// Bit positions and masks for meta_data
mod MetaDataBits {
    // Bit positions
    pub const STARTING_COMBO_POS: u8 = 0;
    pub const STARTING_SCORE_POS: u8 = 2;
    pub const STARTING_HARVEST_POS: u8 = 4;
    pub const STARTING_WAVE_POS: u8 = 6;
    pub const STARTING_SUPPLY_POS: u8 = 8;
    pub const BAG_COMBO_LEVEL_POS: u8 = 10;
    pub const BAG_SCORE_LEVEL_POS: u8 = 14;
    pub const BAG_HARVEST_LEVEL_POS: u8 = 18;
    pub const BAG_WAVE_LEVEL_POS: u8 = 22;
    pub const BAG_SUPPLY_LEVEL_POS: u8 = 26;
    pub const BRIDGING_RANK_POS: u8 = 30;
    pub const WAVE_UNLOCKED_POS: u8 = 34;
    pub const SUPPLY_UNLOCKED_POS: u8 = 35;
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
            starting_combo: 0,
            starting_score: 0,
            starting_harvest: 0,
            starting_wave: 0,
            starting_supply: 0,
            bag_combo_level: 0,
            bag_score_level: 0,
            bag_harvest_level: 0,
            bag_wave_level: 0,
            bag_supply_level: 0,
            bridging_rank: 0,
            wave_unlocked: false,
            supply_unlocked: false,
            total_runs: 0,
            total_cubes_earned: 0,
        }
    }

    /// Pack MetaData into a felt252
    fn pack(self: MetaData) -> felt252 {
        let mut packed: u256 = 0;

        // Starting combo is at position 0, no shift needed
        packed = packed | (self.starting_combo.into() & MetaDataBits::STARTING_BONUS_MASK);
        packed = packed
            | BitShift::shl(
                self.starting_score.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_SCORE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.starting_harvest.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_HARVEST_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.starting_wave.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_WAVE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.starting_supply.into() & MetaDataBits::STARTING_BONUS_MASK,
                MetaDataBits::STARTING_SUPPLY_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_combo_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_COMBO_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_score_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_SCORE_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_harvest_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_HARVEST_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_wave_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_WAVE_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bag_supply_level.into() & MetaDataBits::BAG_LEVEL_MASK,
                MetaDataBits::BAG_SUPPLY_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bridging_rank.into() & MetaDataBits::BRIDGING_RANK_MASK,
                MetaDataBits::BRIDGING_RANK_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.wave_unlocked { 1_u256 } else { 0_u256 },
                MetaDataBits::WAVE_UNLOCKED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.supply_unlocked { 1_u256 } else { 0_u256 },
                MetaDataBits::SUPPLY_UNLOCKED_POS.into(),
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
            // Starting combo is at position 0, no shift needed
            starting_combo: (data & MetaDataBits::STARTING_BONUS_MASK).try_into().unwrap(),
            starting_score: (BitShift::shr(data, MetaDataBits::STARTING_SCORE_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_harvest: (BitShift::shr(data, MetaDataBits::STARTING_HARVEST_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_wave: (BitShift::shr(data, MetaDataBits::STARTING_WAVE_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_supply: (BitShift::shr(data, MetaDataBits::STARTING_SUPPLY_POS.into())
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            bag_combo_level: (BitShift::shr(data, MetaDataBits::BAG_COMBO_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_score_level: (BitShift::shr(data, MetaDataBits::BAG_SCORE_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_harvest_level: (BitShift::shr(data, MetaDataBits::BAG_HARVEST_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_wave_level: (BitShift::shr(data, MetaDataBits::BAG_WAVE_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_supply_level: (BitShift::shr(data, MetaDataBits::BAG_SUPPLY_LEVEL_POS.into())
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bridging_rank: (BitShift::shr(data, MetaDataBits::BRIDGING_RANK_POS.into())
                & MetaDataBits::BRIDGING_RANK_MASK)
                .try_into()
                .unwrap(),
            wave_unlocked: (BitShift::shr(data, MetaDataBits::WAVE_UNLOCKED_POS.into())
                & MetaDataBits::UNLOCK_MASK) == 1,
            supply_unlocked: (BitShift::shr(data, MetaDataBits::SUPPLY_UNLOCKED_POS.into())
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
    /// bonus_type: 0=Combo, 1=Score, 2=Harvest, 3=Wave, 4=Supply
    fn get_bag_size(self: MetaData, bonus_type: u8) -> u8 {
        let base_size: u8 = 1;
        match bonus_type {
            0 => base_size + self.bag_combo_level,    // Combo
            1 => base_size + self.bag_score_level,    // Score
            2 => base_size + self.bag_harvest_level,  // Harvest
            3 => base_size + self.bag_wave_level,     // Wave
            4 => base_size + self.bag_supply_level,   // Supply
            _ => base_size,
        }
    }

    /// Get the starting count for a bonus type
    /// bonus_type: 0=Combo, 1=Score, 2=Harvest, 3=Wave, 4=Supply
    fn get_starting_bonus(self: MetaData, bonus_type: u8) -> u8 {
        match bonus_type {
            0 => self.starting_combo,
            1 => self.starting_score,
            2 => self.starting_harvest,
            3 => self.starting_wave,
            4 => self.starting_supply,
            _ => 0,
        }
    }

    /// Check if a bonus type is unlocked
    /// bonus_type: 0=Combo, 1=Score, 2=Harvest, 3=Wave, 4=Supply
    /// Combo, Score, and Harvest are always unlocked (default bonuses)
    fn is_bonus_unlocked(self: MetaData, bonus_type: u8) -> bool {
        match bonus_type {
            0 | 1 | 2 => true, // Combo, Score, Harvest - always unlocked
            3 => self.wave_unlocked,
            4 => self.supply_unlocked,
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
        assert!(data.combo_count == 0, "Should start with 0 combo charges");
        assert!(data.score_count == 0, "Should start with 0 score charges");
        assert!(data.harvest_count == 0, "Should start with 0 harvest charges");
        assert!(data.wave_count == 0, "Should start with 0 wave charges");
        assert!(data.supply_count == 0, "Should start with 0 supply charges");
        assert!(data.extra_moves == 0, "Should start with 0 extra moves");
        assert!(data.total_score == 0, "Should start with 0 total score");
        assert!(data.combo_5_achieved == false, "Should start with combo_5 not achieved");
        assert!(data.combo_10_achieved == false, "Should start with combo_10 not achieved");
        assert!(data.cubes_brought == 0, "Should start with 0 cubes brought");
        assert!(data.cubes_spent == 0, "Should start with 0 cubes spent");
        assert!(data.constraint_2_progress == 0, "Should start with 0 constraint_2 progress");
        assert!(data.constraint_3_progress == 0, "Should start with 0 constraint_3 progress");
        // Bonus V3.0: Default selection is Combo(1), Score(2), Harvest(3)
        assert!(data.selected_bonus_1 == 1, "Should start with Combo selected");
        assert!(data.selected_bonus_2 == 2, "Should start with Score selected");
        assert!(data.selected_bonus_3 == 3, "Should start with Harvest selected");
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
            combo_count: 5,
            score_count: 3,
            harvest_count: 2,
            wave_count: 4,
            supply_count: 6,
            max_combo_run: 7,
            extra_moves: 10,
            total_score: 12345,
            combo_5_achieved: true,
            combo_10_achieved: false,
            cubes_brought: 100,
            cubes_spent: 45,
            constraint_2_progress: 7,
            run_completed: false,
            // Bonus V3.0 fields
            selected_bonus_1: 4, // Wave
            selected_bonus_2: 1, // Combo
            selected_bonus_3: 5, // Supply
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
            // Constraint flags
            no_bonus_constraint: true,
            // Tertiary constraint progress
            constraint_3_progress: 12,
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
        assert!(unpacked.combo_count == original.combo_count, "combo_count mismatch");
        assert!(unpacked.score_count == original.score_count, "score_count mismatch");
        assert!(unpacked.harvest_count == original.harvest_count, "harvest_count mismatch");
        assert!(unpacked.wave_count == original.wave_count, "wave_count mismatch");
        assert!(unpacked.supply_count == original.supply_count, "supply_count mismatch");
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
        // Constraint flag assertions
        assert!(unpacked.no_bonus_constraint == original.no_bonus_constraint, "no_bonus_constraint mismatch");
        assert!(unpacked.constraint_3_progress == original.constraint_3_progress, "constraint_3_progress mismatch");
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
            combo_count: 255, // 8 bits max
            score_count: 255, // 8 bits max
            harvest_count: 255, // 8 bits max
            wave_count: 255, // 8 bits max
            supply_count: 255, // 8 bits max
            max_combo_run: 255, // 8 bits max
            extra_moves: 255, // 8 bits max
            total_score: 65535, // 16 bits max
            combo_5_achieved: true,
            combo_10_achieved: true,
            cubes_brought: 65535, // 16 bits max
            cubes_spent: 65535, // 16 bits max
            constraint_2_progress: 255, // 8 bits max
            run_completed: true, // 1 bit max
            // Bonus V3.0: max values
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
            // Constraint flags
            no_bonus_constraint: true,
            // Tertiary constraint progress
            constraint_3_progress: 255, // 8 bits max
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
            combo_count: 0,
            score_count: 0,
            harvest_count: 0,
            wave_count: 0,
            supply_count: 0,
            max_combo_run: 0,
            extra_moves: 0,
            total_score: 0,
            combo_5_achieved: false,
            combo_10_achieved: false,
            cubes_brought: 0,
            cubes_spent: 0,
            constraint_2_progress: 0,
            run_completed: false,
            // Bonus V3.0: zero values
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
            // Constraint flags
            no_bonus_constraint: false,
            // Tertiary constraint progress
            constraint_3_progress: 0,
        };

        let packed = zero_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == zero_values, "Zero values should roundtrip correctly");
    }

    #[test]
    fn test_meta_data_pack_unpack_roundtrip() {
        let original = MetaData {
            starting_combo: 2,
            starting_score: 1,
            starting_harvest: 3,
            starting_wave: 1,
            starting_supply: 2,
            bag_combo_level: 5,
            bag_score_level: 3,
            bag_harvest_level: 7,
            bag_wave_level: 2,
            bag_supply_level: 4,
            bridging_rank: 4,
            wave_unlocked: true,
            supply_unlocked: false,
            total_runs: 1000,
            total_cubes_earned: 50000,
        };

        let packed = original.pack();
        let unpacked = MetaDataPackingTrait::unpack(packed);

        assert!(unpacked.starting_combo == original.starting_combo, "starting_combo mismatch");
        assert!(unpacked.starting_score == original.starting_score, "starting_score mismatch");
        assert!(unpacked.starting_harvest == original.starting_harvest, "starting_harvest mismatch");
        assert!(unpacked.starting_wave == original.starting_wave, "starting_wave mismatch");
        assert!(unpacked.starting_supply == original.starting_supply, "starting_supply mismatch");
        assert!(
            unpacked.bag_combo_level == original.bag_combo_level, "bag_combo_level mismatch",
        );
        assert!(unpacked.bag_score_level == original.bag_score_level, "bag_score_level mismatch");
        assert!(unpacked.bag_harvest_level == original.bag_harvest_level, "bag_harvest_level mismatch");
        assert!(unpacked.bag_wave_level == original.bag_wave_level, "bag_wave_level mismatch");
        assert!(unpacked.bag_supply_level == original.bag_supply_level, "bag_supply_level mismatch");
        assert!(unpacked.bridging_rank == original.bridging_rank, "bridging_rank mismatch");
        assert!(unpacked.wave_unlocked == original.wave_unlocked, "wave_unlocked mismatch");
        assert!(unpacked.supply_unlocked == original.supply_unlocked, "supply_unlocked mismatch");
        assert!(unpacked.total_runs == original.total_runs, "total_runs mismatch");
        assert!(
            unpacked.total_cubes_earned == original.total_cubes_earned,
            "total_cubes_earned mismatch",
        );
    }

    #[test]
    fn test_meta_data_new() {
        let data = MetaDataPackingTrait::new();
        assert!(data.starting_combo == 0, "Should start with 0 starting combo");
        assert!(data.starting_wave == 0, "Should start with 0 starting wave");
        assert!(data.starting_supply == 0, "Should start with 0 starting supply");
        assert!(data.bag_wave_level == 0, "Should start with 0 wave bag level");
        assert!(data.bag_supply_level == 0, "Should start with 0 supply bag level");
        assert!(data.bridging_rank == 0, "Should start with 0 bridging rank");
        assert!(data.wave_unlocked == false, "Wave should start locked");
        assert!(data.supply_unlocked == false, "Supply should start locked");
        assert!(data.total_runs == 0, "Should start with 0 runs");
        assert!(data.total_cubes_earned == 0, "Should start with 0 cubes earned");
    }

    #[test]
    fn test_meta_data_bag_size() {
        let mut data = MetaDataPackingTrait::new();
        // Default bag size is 1
        assert!(data.get_bag_size(0) == 1, "Default combo bag should be 1");
        assert!(data.get_bag_size(1) == 1, "Default score bag should be 1");
        assert!(data.get_bag_size(2) == 1, "Default harvest bag should be 1");
        assert!(data.get_bag_size(3) == 1, "Default wave bag should be 1");
        assert!(data.get_bag_size(4) == 1, "Default supply bag should be 1");

        // Upgrade combo bag
        data.bag_combo_level = 2;
        assert!(data.get_bag_size(0) == 3, "Upgraded combo bag should be 3");
        assert!(data.get_bag_size(1) == 1, "Score bag should still be 1");

        // Upgrade wave bag
        data.bag_wave_level = 3;
        assert!(data.get_bag_size(3) == 4, "Upgraded wave bag should be 4");
    }

    #[test]
    fn test_meta_data_bonus_unlock() {
        let mut data = MetaDataPackingTrait::new();

        // Default bonuses are always unlocked
        assert!(data.is_bonus_unlocked(0), "Combo should be unlocked");
        assert!(data.is_bonus_unlocked(1), "Score should be unlocked");
        assert!(data.is_bonus_unlocked(2), "Harvest should be unlocked");

        // Wave and Supply start locked
        assert!(!data.is_bonus_unlocked(3), "Wave should start locked");
        assert!(!data.is_bonus_unlocked(4), "Supply should start locked");

        // Unlock Wave
        data.wave_unlocked = true;
        assert!(data.is_bonus_unlocked(3), "Wave should be unlocked after unlock");
        assert!(!data.is_bonus_unlocked(4), "Supply should still be locked");

        // Unlock Supply
        data.supply_unlocked = true;
        assert!(data.is_bonus_unlocked(4), "Supply should be unlocked after unlock");
    }

    #[test]
    fn test_meta_data_starting_bonus() {
        let mut data = MetaDataPackingTrait::new();

        // All starting bonuses default to 0
        assert!(data.get_starting_bonus(0) == 0, "Default starting combo should be 0");
        assert!(data.get_starting_bonus(3) == 0, "Default starting wave should be 0");
        assert!(data.get_starting_bonus(4) == 0, "Default starting supply should be 0");

        // Set starting values
        data.starting_wave = 2;
        data.starting_supply = 1;
        assert!(data.get_starting_bonus(3) == 2, "Starting wave should be 2");
        assert!(data.get_starting_bonus(4) == 1, "Starting supply should be 1");
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
