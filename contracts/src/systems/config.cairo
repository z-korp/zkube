use starknet::ContractAddress;
use zkube::models::config::{GameSettings, GameSettingsMetadata};
use zkube::types::difficulty::Difficulty;

#[starknet::interface]
pub trait IConfigSystem<T> {
    /// Add new game settings with default values for a given difficulty
    fn add_game_settings(
        ref self: T, name: felt252, description: ByteArray, difficulty: Difficulty,
    ) -> u32;

    /// Add new game settings with custom parameters
    fn add_custom_game_settings(
        ref self: T,
        name: felt252,
        description: ByteArray,
        difficulty: Difficulty,
        // Level Scaling
        base_moves: u16,
        max_moves: u16,
        base_ratio_x100: u16,
        max_ratio_x100: u16,
        // Difficulty Progression (non-linear tier thresholds)
        tier_1_threshold: u8,
        tier_2_threshold: u8,
        tier_3_threshold: u8,
        tier_4_threshold: u8,
        tier_5_threshold: u8,
        tier_6_threshold: u8,
        tier_7_threshold: u8,
        // Constraint Settings
        constraints_enabled: u8,
        constraint_start_level: u8,
        // Constraint Distribution (packed - use pack_constraint_* helpers)
        constraint_lines_budgets: u64, // Packed: lines(4x4bits) + budgets(4x8bits) + times(2x4bits)
        // Block Distribution (VeryEasy to Master scaling)
        veryeasy_size1_weight: u8,
        veryeasy_size2_weight: u8,
        veryeasy_size3_weight: u8,
        veryeasy_size4_weight: u8,
        veryeasy_size5_weight: u8,
        master_size1_weight: u8,
        master_size2_weight: u8,
        master_size3_weight: u8,
        master_size4_weight: u8,
        master_size5_weight: u8,
        // Variance Settings
        early_variance_percent: u8,
        mid_variance_percent: u8,
        late_variance_percent: u8,
        // Level Tier Thresholds
        early_level_threshold: u8,
        mid_level_threshold: u8,
        // Level Cap
        level_cap: u8,
        // Zone Assignment
        zone_id: u8,
        // Mutator Assignment
        active_mutator_id: u8,
        passive_mutator_id: u8,
        // Boss Settings
        boss_id: u8,
    ) -> u32;

    fn get_game_settings(self: @T, settings_id: u32) -> GameSettings;
    fn get_game_settings_metadata(self: @T, settings_id: u32) -> GameSettingsMetadata;
    /// Purchase access to a paid map
    fn purchase_zone_access(ref self: T, settings_id: u32);
    /// Unlock map access by burning zStar
    fn unlock_zone_with_stars(ref self: T, settings_id: u32);
    /// Check if a player has access to a map (free or purchased)
    fn has_zone_access(self: @T, player: ContractAddress, settings_id: u32) -> bool;
    /// Get configured zStar token address
    fn get_zstar_address(self: @T) -> ContractAddress;
    /// Admin: set map pricing
    fn set_zone_pricing(
        ref self: T,
        settings_id: u32,
        is_free: bool,
        price: u128,
        payment_token: ContractAddress,
        star_cost: u128,
    );
    /// Admin: set map enabled/disabled
    fn set_zone_enabled(ref self: T, settings_id: u32, enabled: bool);
    /// Admin: set map theme
    fn set_zone_theme(ref self: T, settings_id: u32, theme_id: u8);
    fn set_star_eligible(ref self: T, settings_id: u32, eligible: bool);
    fn is_star_eligible(self: @T, settings_id: u32) -> bool;
    fn set_zstar_address(ref self: T, token: ContractAddress);
    fn set_treasury(ref self: T, treasury: ContractAddress);
    fn get_treasury(self: @T) -> ContractAddress;
    fn settings_exists(self: @T, settings_id: u32) -> bool;
}

#[dojo::contract]
mod config_system {
    use core::num::traits::Zero;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_embeddable_game_standard::minigame::extensions::settings::interface::{
        IMinigameSettings, IMinigameSettingsDetails,
    };
    use game_components_embeddable_game_standard::minigame::extensions::settings::settings::SettingsComponent;
    use game_components_embeddable_game_standard::minigame::extensions::settings::structs::{
        GameSetting, GameSettingDetails,
    };
    use game_components_embeddable_game_standard::minigame::interface::{
        IMinigameDispatcher, IMinigameDispatcherTrait,
    };
    use openzeppelin_access::accesscontrol::{AccessControlComponent, DEFAULT_ADMIN_ROLE};
    use openzeppelin_interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::external::zstar_token::{IZStarTokenDispatcher, IZStarTokenDispatcherTrait};
    use zkube::helpers::encoding::U256BytesUsedTraitImpl;
    use zkube::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
    use zkube::models::entitlement::ZoneEntitlement;
    use zkube::models::mutator::MutatorDef;
    use zkube::types::difficulty::Difficulty;
    use super::IConfigSystem;

    pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

    component!(path: SettingsComponent, storage: settings, event: SettingsEvent);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl SettingsInternalImpl = SettingsComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        settings_counter: u32,
        cube_token_address: ContractAddress,
        zstar_token_address: ContractAddress,
        treasury_address: ContractAddress,
        star_eligible: Map<u32, bool>,
        #[substorage(v0)]
        settings: SettingsComponent::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        GameSettingsCreated: GameSettingsCreated,
        #[flat]
        SettingsEvent: SettingsComponent::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct GameSettingsCreated {
        settings_id: u32,
        name: felt252,
        difficulty: Difficulty,
        created_by: ContractAddress,
    }

    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
        cube_token_address: ContractAddress,
        payment_token_address: ContractAddress,
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        self.settings.initializer();

        // Initialize access control: creator gets DEFAULT_ADMIN_ROLE + ADMIN_ROLE
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, creator_address);
        self.accesscontrol._grant_role(ADMIN_ROLE, creator_address);

        self.cube_token_address.write(cube_token_address);
        // NOTE: zstar_token_address is seeded from cube_token_address init arg.
        // cube_token_address is otherwise unused today. Use set_zstar_address()
        // post-deploy if the zStar contract differs from the cube_token arg.
        self.zstar_token_address.write(cube_token_address);
        self.treasury_address.write(creator_address);

        let current_timestamp = get_block_timestamp();

        // =====================================================================
        // Zone 1 — Polynesian (Settings 0 map, 1 endless)
        // =====================================================================
        let mut z1_map = GameSettingsTrait::new_with_defaults(0_u32, Difficulty::Increasing);
        z1_map.base_moves = 16;
        z1_map.max_moves = 48;
        z1_map.base_ratio_x100 = 64;
        z1_map.max_ratio_x100 = 144;
        z1_map.tier_1_threshold = 5;
        z1_map.tier_2_threshold = 8;
        z1_map.tier_3_threshold = 10;
        z1_map.tier_4_threshold = 11;
        z1_map.tier_5_threshold = 12;
        z1_map.tier_6_threshold = 13;
        z1_map.tier_7_threshold = 14;
        z1_map.constraint_start_level = 5;
        z1_map.level_cap = 10;
        z1_map.zone_id = 1;
        z1_map.active_mutator_id = 1;
        z1_map.passive_mutator_id = 2;
        z1_map.boss_id = 1;
        z1_map.endless_difficulty_thresholds = 0;
        z1_map.endless_score_multipliers = 0;
        world.write_model(@z1_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 0_u32,
                    name: 'Tiki',
                    description: "Explore the Polynesian islands...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 1,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        let mut z1_endless = GameSettingsTrait::new_with_defaults(1_u32, Difficulty::Increasing);
        z1_endless.base_moves = 16;
        z1_endless.max_moves = 48;
        z1_endless.level_cap = 255;
        z1_endless.zone_id = 1;
        z1_endless.active_mutator_id = 0;
        z1_endless.passive_mutator_id = 2;
        z1_endless.boss_id = 0;
        z1_endless.endless_difficulty_thresholds = 0; // use defaults
        z1_endless.endless_score_multipliers = 0; // use defaults
        world.write_model(@z1_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 1_u32,
                    name: 'Tiki Endless',
                    description: "Survive the endless tides...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 1,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 2 — Egypt (Settings 2 map, 3 endless)
        // =====================================================================
        let mut z2_map = GameSettingsTrait::new_with_defaults(2_u32, Difficulty::Increasing);
        z2_map.base_moves = 20;
        z2_map.max_moves = 55;
        z2_map.base_ratio_x100 = 80;
        z2_map.max_ratio_x100 = 165;
        z2_map.tier_1_threshold = 4;
        z2_map.tier_2_threshold = 7;
        z2_map.tier_3_threshold = 9;
        z2_map.tier_4_threshold = 11;
        z2_map.tier_5_threshold = 12;
        z2_map.tier_6_threshold = 13;
        z2_map.tier_7_threshold = 14;
        z2_map.constraint_start_level = 3;
        z2_map.level_cap = 10;
        z2_map.zone_id = 2;
        z2_map.active_mutator_id = 3;
        z2_map.passive_mutator_id = 4;
        z2_map.boss_id = 2;
        z2_map.endless_difficulty_thresholds = 0;
        z2_map.endless_score_multipliers = 0;
        world.write_model(@z2_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 2_u32,
                    name: 'Egypt',
                    description: "Push into the Egyptian ruins...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 2,
                    is_free: false,
                    enabled: true,
                    price: 2000000,
                    payment_token: payment_token_address,
                    star_cost: 40,
                },
            );

        let mut z2_endless = GameSettingsTrait::new_with_defaults(3_u32, Difficulty::Increasing);
        z2_endless.base_moves = 20;
        z2_endless.max_moves = 55;
        z2_endless.level_cap = 255;
        z2_endless.zone_id = 2;
        z2_endless.active_mutator_id = 0;
        z2_endless.passive_mutator_id = 4;
        z2_endless.boss_id = 0;
        // packed [0, 20, 55, 105, 200, 370, 650, 1170]
        z2_endless.endless_difficulty_thresholds = 92697735950297376096128832307220;
        // packed [10, 15, 20, 35, 50, 70, 100, 130]
        z2_endless.endless_score_multipliers = 9395711903752523530;
        world.write_model(@z2_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 3_u32,
                    name: 'Egypt Endless',
                    description: "Endless mode in the Egyptian ruins...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 2,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 3 — Norse (Settings 4 map, 5 endless)
        // =====================================================================
        let mut z3_map = GameSettingsTrait::new_with_defaults(4_u32, Difficulty::Increasing);
        z3_map.base_moves = 18;
        z3_map.max_moves = 50;
        z3_map.base_ratio_x100 = 70;
        z3_map.max_ratio_x100 = 155;
        z3_map.tier_1_threshold = 3;
        z3_map.tier_2_threshold = 6;
        z3_map.tier_3_threshold = 8;
        z3_map.tier_4_threshold = 10;
        z3_map.tier_5_threshold = 11;
        z3_map.tier_6_threshold = 12;
        z3_map.tier_7_threshold = 13;
        z3_map.constraint_start_level = 4;
        z3_map.level_cap = 10;
        z3_map.zone_id = 3;
        z3_map.active_mutator_id = 5;
        z3_map.passive_mutator_id = 6;
        z3_map.boss_id = 3;
        z3_map.endless_difficulty_thresholds = 0;
        z3_map.endless_score_multipliers = 0;
        world.write_model(@z3_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 4_u32,
                    name: 'Norse',
                    description: "Battle through the Norse realms...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 3,
                    is_free: false,
                    enabled: true,
                    price: 2000000,
                    payment_token: payment_token_address,
                    star_cost: 40,
                },
            );

        let mut z3_endless = GameSettingsTrait::new_with_defaults(5_u32, Difficulty::Increasing);
        z3_endless.base_moves = 18;
        z3_endless.max_moves = 50;
        z3_endless.level_cap = 255;
        z3_endless.zone_id = 3;
        z3_endless.active_mutator_id = 0;
        z3_endless.passive_mutator_id = 6;
        z3_endless.boss_id = 0;
        // packed [0, 15, 35, 70, 130, 240, 420, 750]
        z3_endless.endless_difficulty_thresholds = 59421629638969746509149254123535;
        // packed [10, 15, 20, 30, 45, 65, 90, 120]
        z3_endless.endless_score_multipliers = 8672315694489276170;
        world.write_model(@z3_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 5_u32,
                    name: 'Norse Endless',
                    description: "Endless mode in the Norse realms...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 3,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 4 — Greece (Settings 6 map, 7 endless)
        // =====================================================================
        let mut z4_map = GameSettingsTrait::new_with_defaults(6_u32, Difficulty::Increasing);
        z4_map.base_moves = 14;
        z4_map.max_moves = 44;
        z4_map.base_ratio_x100 = 60;
        z4_map.max_ratio_x100 = 140;
        z4_map.tier_1_threshold = 4;
        z4_map.tier_2_threshold = 7;
        z4_map.tier_3_threshold = 9;
        z4_map.tier_4_threshold = 11;
        z4_map.tier_5_threshold = 12;
        z4_map.tier_6_threshold = 13;
        z4_map.tier_7_threshold = 14;
        z4_map.constraint_start_level = 3;
        z4_map.level_cap = 10;
        z4_map.zone_id = 4;
        z4_map.active_mutator_id = 7;
        z4_map.passive_mutator_id = 8;
        z4_map.boss_id = 4;
        z4_map.endless_difficulty_thresholds = 0;
        z4_map.endless_score_multipliers = 0;
        world.write_model(@z4_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 6_u32,
                    name: 'Greece',
                    description: "Master the art of precision...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 4,
                    is_free: false,
                    enabled: true,
                    price: 2000000,
                    payment_token: payment_token_address,
                    star_cost: 40,
                },
            );

        let mut z4_endless = GameSettingsTrait::new_with_defaults(7_u32, Difficulty::Increasing);
        z4_endless.base_moves = 14;
        z4_endless.max_moves = 44;
        z4_endless.level_cap = 255;
        z4_endless.zone_id = 4;
        z4_endless.active_mutator_id = 0;
        z4_endless.passive_mutator_id = 8;
        z4_endless.boss_id = 0;
        // packed [0, 12, 30, 60, 120, 220, 400, 700]
        z4_endless.endless_difficulty_thresholds = 55460197334371199640621654343692;
        // packed [10, 15, 20, 30, 40, 60, 80, 100]
        z4_endless.endless_score_multipliers = 7228343544930635530;
        world.write_model(@z4_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 7_u32,
                    name: 'Greece Endless',
                    description: "Endless mode in Ancient Greece...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 4,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 5 — China (Settings 8 map, 9 endless)
        // Path A position 5, theme_id=6
        // =====================================================================
        let mut z5_map = GameSettingsTrait::new_with_defaults(8_u32, Difficulty::Increasing);
        z5_map.base_moves = 18;
        z5_map.max_moves = 52;
        z5_map.base_ratio_x100 = 75;
        z5_map.max_ratio_x100 = 160;
        z5_map.tier_1_threshold = 3;
        z5_map.tier_2_threshold = 5;
        z5_map.tier_3_threshold = 7;
        z5_map.tier_4_threshold = 9;
        z5_map.tier_5_threshold = 11;
        z5_map.tier_6_threshold = 12;
        z5_map.tier_7_threshold = 13;
        z5_map.constraint_start_level = 4;
        z5_map.level_cap = 10;
        z5_map.zone_id = 5;
        z5_map.active_mutator_id = 9;
        z5_map.passive_mutator_id = 10;
        z5_map.boss_id = 6;
        z5_map.endless_difficulty_thresholds = 0;
        z5_map.endless_score_multipliers = 0;
        world.write_model(@z5_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 8_u32,
                    name: 'China',
                    description: "Unleash the dragon's wrath...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 6,
                    is_free: false,
                    enabled: true,
                    price: 5000000,
                    payment_token: payment_token_address,
                    star_cost: 100,
                },
            );

        let mut z5_endless = GameSettingsTrait::new_with_defaults(9_u32, Difficulty::Increasing);
        z5_endless.base_moves = 18;
        z5_endless.max_moves = 52;
        z5_endless.level_cap = 255;
        z5_endless.zone_id = 5;
        z5_endless.active_mutator_id = 0;
        z5_endless.passive_mutator_id = 10;
        z5_endless.boss_id = 0;
        // packed [0, 18, 45, 90, 170, 310, 550, 950]
        z5_endless.endless_difficulty_thresholds = 75267419303470447273895393034258;
        // packed [10, 15, 20, 30, 45, 65, 90, 120]
        z5_endless.endless_score_multipliers = 8672315694489276170;
        world.write_model(@z5_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 9_u32,
                    name: 'China Endless',
                    description: "Endless mode in Ancient China...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 6,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 6 — Persia (Settings 10 map, 11 endless)
        // Path A position 6, theme_id=7
        // =====================================================================
        let mut z6_map = GameSettingsTrait::new_with_defaults(10_u32, Difficulty::Increasing);
        z6_map.base_moves = 16;
        z6_map.max_moves = 48;
        z6_map.base_ratio_x100 = 70;
        z6_map.max_ratio_x100 = 150;
        z6_map.tier_1_threshold = 3;
        z6_map.tier_2_threshold = 6;
        z6_map.tier_3_threshold = 8;
        z6_map.tier_4_threshold = 10;
        z6_map.tier_5_threshold = 11;
        z6_map.tier_6_threshold = 12;
        z6_map.tier_7_threshold = 13;
        z6_map.constraint_start_level = 3;
        z6_map.level_cap = 10;
        z6_map.zone_id = 6;
        z6_map.active_mutator_id = 11;
        z6_map.passive_mutator_id = 12;
        z6_map.boss_id = 7;
        z6_map.endless_difficulty_thresholds = 0;
        z6_map.endless_score_multipliers = 0;
        world.write_model(@z6_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 10_u32,
                    name: 'Persia',
                    description: "Create intricate mosaic patterns...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 7,
                    is_free: false,
                    enabled: true,
                    price: 5000000,
                    payment_token: payment_token_address,
                    star_cost: 100,
                },
            );

        let mut z6_endless = GameSettingsTrait::new_with_defaults(11_u32, Difficulty::Increasing);
        z6_endless.base_moves = 16;
        z6_endless.max_moves = 48;
        z6_endless.level_cap = 255;
        z6_endless.zone_id = 6;
        z6_endless.active_mutator_id = 0;
        z6_endless.passive_mutator_id = 12;
        z6_endless.boss_id = 0;
        // packed [0, 13, 35, 70, 135, 250, 440, 780]
        z6_endless.endless_difficulty_thresholds = 61798498693098537777651045826573;
        // packed [10, 15, 20, 30, 45, 60, 85, 110]
        z6_endless.endless_score_multipliers = 7950326881668304650;
        world.write_model(@z6_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 11_u32,
                    name: 'Persia Endless',
                    description: "Endless mode in Ancient Persia...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 7,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 7 — Japan (Settings 12 map, 13 endless)
        // Path A position 7, theme_id=5
        // =====================================================================
        let mut z7_map = GameSettingsTrait::new_with_defaults(12_u32, Difficulty::Increasing);
        z7_map.base_moves = 12;
        z7_map.max_moves = 38;
        z7_map.base_ratio_x100 = 55;
        z7_map.max_ratio_x100 = 125;
        z7_map.tier_1_threshold = 3;
        z7_map.tier_2_threshold = 5;
        z7_map.tier_3_threshold = 7;
        z7_map.tier_4_threshold = 9;
        z7_map.tier_5_threshold = 11;
        z7_map.tier_6_threshold = 12;
        z7_map.tier_7_threshold = 13;
        z7_map.constraint_start_level = 3;
        z7_map.level_cap = 10;
        z7_map.zone_id = 7;
        z7_map.active_mutator_id = 13;
        z7_map.passive_mutator_id = 14;
        z7_map.boss_id = 5;
        z7_map.endless_difficulty_thresholds = 0;
        z7_map.endless_score_multipliers = 0;
        world.write_model(@z7_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 12_u32,
                    name: 'Japan',
                    description: "Master lethal efficiency...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 5,
                    is_free: false,
                    enabled: true,
                    price: 5000000,
                    payment_token: payment_token_address,
                    star_cost: 100,
                },
            );

        let mut z7_endless = GameSettingsTrait::new_with_defaults(13_u32, Difficulty::Increasing);
        z7_endless.base_moves = 12;
        z7_endless.max_moves = 38;
        z7_endless.level_cap = 255;
        z7_endless.zone_id = 7;
        z7_endless.active_mutator_id = 0;
        z7_endless.passive_mutator_id = 14;
        z7_endless.boss_id = 0;
        // packed [0, 10, 25, 50, 100, 180, 320, 550]
        z7_endless.endless_difficulty_thresholds = 43575876242428104438765219020810;
        // packed [10, 15, 25, 35, 50, 70, 90, 110]
        z7_endless.endless_score_multipliers = 7951745273227185930;
        world.write_model(@z7_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 13_u32,
                    name: 'Japan Endless',
                    description: "Endless mode in Feudal Japan...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 5,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 8 — Mayan (Settings 14 map, 15 endless)
        // =====================================================================
        let mut z8_map = GameSettingsTrait::new_with_defaults(14_u32, Difficulty::Increasing);
        z8_map.base_moves = 16;
        z8_map.max_moves = 46;
        z8_map.base_ratio_x100 = 75;
        z8_map.max_ratio_x100 = 160;
        z8_map.tier_1_threshold = 3;
        z8_map.tier_2_threshold = 5;
        z8_map.tier_3_threshold = 7;
        z8_map.tier_4_threshold = 9;
        z8_map.tier_5_threshold = 11;
        z8_map.tier_6_threshold = 12;
        z8_map.tier_7_threshold = 13;
        z8_map.constraint_start_level = 3;
        z8_map.level_cap = 10;
        z8_map.zone_id = 8;
        z8_map.active_mutator_id = 15;
        z8_map.passive_mutator_id = 16;
        z8_map.boss_id = 8;
        z8_map.endless_difficulty_thresholds = 0;
        z8_map.endless_score_multipliers = 0;
        world.write_model(@z8_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 14_u32,
                    name: 'Mayan',
                    description: "Blood sacrifice powers your ritual...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 8,
                    is_free: false,
                    enabled: true,
                    price: 10000000,
                    payment_token: payment_token_address,
                    star_cost: 200,
                },
            );

        let mut z8_endless = GameSettingsTrait::new_with_defaults(15_u32, Difficulty::Increasing);
        z8_endless.base_moves = 16;
        z8_endless.max_moves = 46;
        z8_endless.level_cap = 255;
        z8_endless.zone_id = 8;
        z8_endless.active_mutator_id = 0;
        z8_endless.passive_mutator_id = 16;
        z8_endless.boss_id = 0;
        // packed [0, 18, 45, 95, 180, 330, 580, 1000]
        z8_endless.endless_difficulty_thresholds = 79228863697327190288693264711698;
        // packed [10, 15, 25, 35, 50, 70, 100, 130]
        z8_endless.endless_score_multipliers = 9395711903752851210;
        world.write_model(@z8_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 15_u32,
                    name: 'Mayan Endless',
                    description: "Endless mode in the Mayan temples...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 8,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 9 — Tribal (Settings 16 map, 17 endless)
        // =====================================================================
        let mut z9_map = GameSettingsTrait::new_with_defaults(16_u32, Difficulty::Increasing);
        z9_map.base_moves = 15;
        z9_map.max_moves = 45;
        z9_map.base_ratio_x100 = 70;
        z9_map.max_ratio_x100 = 155;
        z9_map.tier_1_threshold = 2;
        z9_map.tier_2_threshold = 4;
        z9_map.tier_3_threshold = 6;
        z9_map.tier_4_threshold = 8;
        z9_map.tier_5_threshold = 10;
        z9_map.tier_6_threshold = 11;
        z9_map.tier_7_threshold = 12;
        z9_map.constraint_start_level = 3;
        z9_map.level_cap = 10;
        z9_map.zone_id = 9;
        z9_map.active_mutator_id = 17;
        z9_map.passive_mutator_id = 18;
        z9_map.boss_id = 9;
        z9_map.endless_difficulty_thresholds = 0;
        z9_map.endless_score_multipliers = 0;
        world.write_model(@z9_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 16_u32,
                    name: 'Tribal',
                    description: "The war drums never stop...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 9,
                    is_free: false,
                    enabled: true,
                    price: 10000000,
                    payment_token: payment_token_address,
                    star_cost: 200,
                },
            );

        let mut z9_endless = GameSettingsTrait::new_with_defaults(17_u32, Difficulty::Increasing);
        z9_endless.base_moves = 15;
        z9_endless.max_moves = 45;
        z9_endless.level_cap = 255;
        z9_endless.zone_id = 9;
        z9_endless.active_mutator_id = 0;
        z9_endless.passive_mutator_id = 18;
        z9_endless.boss_id = 0;
        // packed [0, 14, 35, 75, 140, 260, 460, 800]
        z9_endless.endless_difficulty_thresholds = 63383086122084685670238872862734;
        // packed [10, 15, 25, 35, 50, 70, 95, 120]
        z9_endless.endless_score_multipliers = 8673728588490018570;
        world.write_model(@z9_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 17_u32,
                    name: 'Tribal Endless',
                    description: "Endless mode with tribal drums...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 9,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Zone 10 — Inca (Settings 18 map, 19 endless)
        // =====================================================================
        let mut z10_map = GameSettingsTrait::new_with_defaults(18_u32, Difficulty::Increasing);
        z10_map.base_moves = 14;
        z10_map.max_moves = 42;
        z10_map.base_ratio_x100 = 80;
        z10_map.max_ratio_x100 = 170;
        z10_map.tier_1_threshold = 2;
        z10_map.tier_2_threshold = 4;
        z10_map.tier_3_threshold = 6;
        z10_map.tier_4_threshold = 8;
        z10_map.tier_5_threshold = 9;
        z10_map.tier_6_threshold = 10;
        z10_map.tier_7_threshold = 11;
        z10_map.constraint_start_level = 2;
        z10_map.level_cap = 10;
        z10_map.zone_id = 10;
        z10_map.active_mutator_id = 19;
        z10_map.passive_mutator_id = 20;
        z10_map.boss_id = 10;
        z10_map.endless_difficulty_thresholds = 0;
        z10_map.endless_score_multipliers = 0;
        world.write_model(@z10_map);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 18_u32,
                    name: 'Inca',
                    description: "The Sun God demands perfection...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 10,
                    is_free: false,
                    enabled: true,
                    price: 10000000,
                    payment_token: payment_token_address,
                    star_cost: 200,
                },
            );

        let mut z10_endless = GameSettingsTrait::new_with_defaults(19_u32, Difficulty::Increasing);
        z10_endless.base_moves = 14;
        z10_endless.max_moves = 42;
        z10_endless.level_cap = 255;
        z10_endless.zone_id = 10;
        z10_endless.active_mutator_id = 0;
        z10_endless.passive_mutator_id = 20;
        z10_endless.boss_id = 0;
        // packed [0, 20, 50, 110, 210, 380, 660, 1100]
        z10_endless.endless_difficulty_thresholds = 87151776663741538866380839976980;
        // packed [10, 20, 30, 40, 60, 80, 110, 150]
        z10_endless.endless_score_multipliers = 10839689572428682250;
        world.write_model(@z10_endless);
        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 19_u32,
                    name: 'Inca Endless',
                    description: "Endless mode at the summit...",
                    created_by: creator_address,
                    created_at: current_timestamp,
                    theme_id: 10,
                    is_free: true,
                    enabled: true,
                    price: 0,
                    payment_token: Zero::zero(),
                    star_cost: 0,
                },
            );

        // =====================================================================
        // Active Mutators (odd IDs 1-19) — bonus profiles
        // Stat fields neutral: moves_modifier=128, ratio_modifier=128,
        // difficulty_offset=128, combo_score_mult_x100=100,
        // star_threshold_modifier=128, endless_ramp_mult_x100=100,
        // line_clear_bonus=0, perfect_clear_bonus=0, starting_rows=0
        // =====================================================================

        // Mutator 1 — Tidecaller (Z1 Polynesian active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 1,
                    zone_id: 1,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Hammer, combo, threshold 4, start 0
                    bonus_1_type: 1,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 4,
                    bonus_1_starting_charges: 0,
                    // Slot 2: Wave, score, threshold 20, start 0
                    bonus_2_type: 3,
                    bonus_2_trigger_type: 3,
                    bonus_2_trigger_threshold: 20,
                    bonus_2_starting_charges: 0,
                    // Slot 3: Totem, lines, threshold 10, start 0
                    bonus_3_type: 2,
                    bonus_3_trigger_type: 2,
                    bonus_3_trigger_threshold: 10,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 3 — Pharaoh's Command (Z2 Egypt active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 3,
                    zone_id: 2,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Wave, combo, threshold 3, start 1
                    bonus_1_type: 3,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 3,
                    bonus_1_starting_charges: 1,
                    // Slot 2: Hammer, lines, threshold 6, start 0
                    bonus_2_type: 1,
                    bonus_2_trigger_type: 2,
                    bonus_2_trigger_threshold: 6,
                    bonus_2_starting_charges: 0,
                    // Slot 3: None
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 5 — Ragnarok (Z3 Norse active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 5,
                    zone_id: 3,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Totem, combo, threshold 3, start 1
                    bonus_1_type: 2,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 3,
                    bonus_1_starting_charges: 1,
                    // Slot 2: Totem, lines, threshold 8, start 0
                    bonus_2_type: 2,
                    bonus_2_trigger_type: 2,
                    bonus_2_trigger_threshold: 8,
                    bonus_2_starting_charges: 0,
                    // Slot 3: None
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 7 — Athena's Chisel (Z4 Greece active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 7,
                    zone_id: 4,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Hammer, combo, threshold 4, start 0
                    bonus_1_type: 1,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 4,
                    bonus_1_starting_charges: 0,
                    // Slot 2: Hammer, score, threshold 15, start 0
                    bonus_2_type: 1,
                    bonus_2_trigger_type: 3,
                    bonus_2_trigger_threshold: 15,
                    bonus_2_starting_charges: 0,
                    // Slot 3: None
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 9 — Dragon Breath (Z5 China active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 9,
                    zone_id: 5,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Wave, lines, threshold 6, start 1
                    bonus_1_type: 3,
                    bonus_1_trigger_type: 2,
                    bonus_1_trigger_threshold: 6,
                    bonus_1_starting_charges: 1,
                    // Slot 2: Wave, score, threshold 18, start 0
                    bonus_2_type: 3,
                    bonus_2_trigger_type: 3,
                    bonus_2_trigger_threshold: 18,
                    bonus_2_starting_charges: 0,
                    // Slot 3: None
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 11 — Mosaic Eye (Z6 Persia active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 11,
                    zone_id: 6,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Totem, score, threshold 15, start 0
                    bonus_1_type: 2,
                    bonus_1_trigger_type: 3,
                    bonus_1_trigger_threshold: 15,
                    bonus_1_starting_charges: 0,
                    // Slot 2: Totem, lines, threshold 7, start 0
                    bonus_2_type: 2,
                    bonus_2_trigger_type: 2,
                    bonus_2_trigger_threshold: 7,
                    bonus_2_starting_charges: 0,
                    // Slot 3: None
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 13 — Iai Strike (Z7 Japan active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 13,
                    zone_id: 7,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Hammer, combo, threshold 3, start 0
                    bonus_1_type: 1,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 3,
                    bonus_1_starting_charges: 0,
                    // Slot 2: Hammer, lines, threshold 5, start 0
                    bonus_2_type: 1,
                    bonus_2_trigger_type: 2,
                    bonus_2_trigger_threshold: 5,
                    bonus_2_starting_charges: 0,
                    // Slot 3: None
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 15 — Blood Ritual (Z8 Mayan active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 15,
                    zone_id: 8,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Hammer, combo, threshold 6, start 2
                    bonus_1_type: 1,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 6,
                    bonus_1_starting_charges: 2,
                    // Slot 2: Wave, lines, threshold 12, start 2
                    bonus_2_type: 3,
                    bonus_2_trigger_type: 2,
                    bonus_2_trigger_threshold: 12,
                    bonus_2_starting_charges: 2,
                    // Slot 3: Totem, score, threshold 30, start 2
                    bonus_3_type: 2,
                    bonus_3_trigger_type: 3,
                    bonus_3_trigger_threshold: 30,
                    bonus_3_starting_charges: 2,
                },
            );

        // Mutator 17 — War Beat (Z9 Tribal active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 17,
                    zone_id: 9,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Hammer, combo, threshold 4, start 0
                    bonus_1_type: 1,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 4,
                    bonus_1_starting_charges: 0,
                    // Slot 2: Totem, combo, threshold 5, start 0
                    bonus_2_type: 2,
                    bonus_2_trigger_type: 1,
                    bonus_2_trigger_threshold: 5,
                    bonus_2_starting_charges: 0,
                    // Slot 3: Wave, combo, threshold 6, start 0
                    bonus_3_type: 3,
                    bonus_3_trigger_type: 1,
                    bonus_3_trigger_threshold: 6,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 19 — Inti's Demand (Z10 Inca active)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 19,
                    zone_id: 10,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    // Slot 1: Hammer, combo, threshold 5, start 0
                    bonus_1_type: 1,
                    bonus_1_trigger_type: 1,
                    bonus_1_trigger_threshold: 5,
                    bonus_1_starting_charges: 0,
                    // Slot 2: None
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    // Slot 3: None
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // =====================================================================
        // Passive Mutators (even IDs 2-20) — stat modifiers
        // Bonus fields all 0 (no bonus slots on passive mutators).
        // =====================================================================

        // Mutator 2 — Calm Tides (Z1 Polynesian passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 2,
                    zone_id: 1,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 127,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 1,
                    perfect_clear_bonus: 0,
                    starting_rows: 0,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 4 — Foundation Stone (Z2 Egypt passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 4,
                    zone_id: 2,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 150,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 15,
                    starting_rows: 5,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 6 — Frozen Rage (Z3 Norse passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 6,
                    zone_id: 3,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 150,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 2,
                    perfect_clear_bonus: 0,
                    starting_rows: 4,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 8 — Marble Discipline (Z4 Greece passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 8,
                    zone_id: 4,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 130,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 10,
                    starting_rows: 4,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 10 — Imperial Scale (Z5 China passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 10,
                    zone_id: 5,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 100,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 3,
                    perfect_clear_bonus: 0,
                    starting_rows: 5,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 12 — Geometric Flow (Z6 Persia passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 12,
                    zone_id: 6,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 120,
                    star_threshold_modifier: 130,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 1,
                    perfect_clear_bonus: 0,
                    starting_rows: 4,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 14 — Bushido (Z7 Japan passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 14,
                    zone_id: 7,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 130,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 5,
                    starting_rows: 4,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 16 — Jungle Altar (Z8 Mayan passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 16,
                    zone_id: 8,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 175,
                    star_threshold_modifier: 128,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 4,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 18 — Primal Pulse (Z9 Tribal passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 18,
                    zone_id: 9,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 160,
                    star_threshold_modifier: 130,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 0,
                    starting_rows: 4,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // Mutator 20 — Altitude (Z10 Inca passive)
        world
            .write_model(
                @MutatorDef {
                    mutator_id: 20,
                    zone_id: 10,
                    moves_modifier: 128,
                    ratio_modifier: 128,
                    difficulty_offset: 128,
                    combo_score_mult_x100: 200,
                    star_threshold_modifier: 132,
                    endless_ramp_mult_x100: 100,
                    line_clear_bonus: 0,
                    perfect_clear_bonus: 20,
                    starting_rows: 5,
                    bonus_1_type: 0,
                    bonus_1_trigger_type: 0,
                    bonus_1_trigger_threshold: 0,
                    bonus_1_starting_charges: 0,
                    bonus_2_type: 0,
                    bonus_2_trigger_type: 0,
                    bonus_2_trigger_threshold: 0,
                    bonus_2_starting_charges: 0,
                    bonus_3_type: 0,
                    bonus_3_trigger_type: 0,
                    bonus_3_trigger_threshold: 0,
                    bonus_3_starting_charges: 0,
                },
            );

        // =====================================================================
        // Settings counter and star eligibility
        // =====================================================================
        // Counter = 19 so next custom settings will be 20+
        self.settings_counter.write(19_u32);

        // All 20 settings (IDs 0..19) are star-eligible
        let mut sid: u32 = 0;
        loop {
            if sid > 19 {
                break;
            }
            self.star_eligible.write(sid, true);
            sid += 1;
        }

        // =====================================================================
        // Register minigame settings component entries
        // =====================================================================
        let (game_systems_address, _) = world.dns(@"game_system").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address: game_systems_address };
        let minigame_token_address = minigame_dispatcher.token_address();

        if !minigame_token_address.is_zero() {
            let zone_ids: Array<u32> = array![
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            ];
            let zone_descs: Array<ByteArray> = array![
                "Polynesian map mode", "Polynesian endless mode", "Egypt map mode",
                "Egypt endless mode", "Norse map mode", "Norse endless mode", "Greece map mode",
                "Greece endless mode", "China map mode", "China endless mode", "Persia map mode",
                "Persia endless mode", "Japan map mode", "Japan endless mode", "Mayan map mode",
                "Mayan endless mode", "Tribal map mode", "Tribal endless mode", "Inca map mode",
                "Inca endless mode",
            ];
            let zone_labels: Array<ByteArray> = array![
                "Polynesian", "Polynesian Endless", "Ancient Egypt", "Egypt Endless", "Norse",
                "Norse Endless", "Ancient Greece", "Greece Endless", "Ancient China",
                "China Endless", "Ancient Persia", "Persia Endless", "Feudal Japan",
                "Japan Endless", "Mayan", "Mayan Endless", "Tribal", "Tribal Endless", "Inca",
                "Inca Endless",
            ];

            let mut i: u32 = 0;
            loop {
                if i >= zone_ids.len() {
                    break;
                }
                self
                    .settings
                    .create_settings(
                        game_systems_address,
                        *zone_ids[i],
                        GameSettingDetails {
                            name: zone_labels[i].clone(),
                            description: zone_descs[i].clone(),
                            settings: array![GameSetting { name: 'MODE', value: 'PROGRESSIVE' }]
                                .span(),
                        },
                        minigame_token_address,
                    );
                i += 1;
            };
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game_settings: GameSettings = world.read_model(settings_id);
            game_settings.exists()
        }

        fn settings_exist_batch(self: @ContractState, settings_ids: Span<u32>) -> Array<bool> {
            let mut exists_batch = array![];
            let mut i: u32 = 0;

            loop {
                if i >= settings_ids.len() {
                    break;
                }

                let settings_id = *settings_ids.at(i);
                exists_batch.append(self.settings_exist(settings_id));
                i += 1;
            }

            exists_batch
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsDetailsImpl of IMinigameSettingsDetails<ContractState> {
        fn settings_count(self: @ContractState) -> u32 {
            self.settings_counter.read() + 1
        }

        fn settings_details(self: @ContractState, settings_id: u32) -> GameSettingDetails {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            let metadata: GameSettingsMetadata = world.read_model(settings_id);

            GameSettingDetails {
                name: felt_to_bytearray(metadata.name),
                description: metadata.description.clone(),
                settings: generate_settings_array(settings),
            }
        }

        fn settings_details_batch(
            self: @ContractState, settings_ids: Span<u32>,
        ) -> Array<GameSettingDetails> {
            let mut details_batch = array![];
            let mut i: u32 = 0;

            loop {
                if i >= settings_ids.len() {
                    break;
                }

                let settings_id = *settings_ids.at(i);
                details_batch.append(self.settings_details(settings_id));
                i += 1;
            }

            details_batch
        }
    }

    #[abi(embed_v0)]
    impl ConfigSystemImpl of IConfigSystem<ContractState> {
        fn add_game_settings(
            ref self: ContractState, name: felt252, description: ByteArray, difficulty: Difficulty,
        ) -> u32 {
            // Validate input
            assert(difficulty != Difficulty::None, 'Invalid difficulty');

            // Get the world dispatcher
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Increment settings counter
            let mut settings_id = self.settings_counter.read();
            settings_id += 1;
            self.settings_counter.write(settings_id);

            // Create the game settings with defaults
            let game_settings = GameSettingsTrait::new_with_defaults(settings_id, difficulty);

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description: description.clone(),
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
                theme_id: 1,
                is_free: true,
                enabled: true,
                price: 0,
                payment_token: Zero::zero(),
                star_cost: 0,
            };

            // Save to world
            world.write_model(@game_settings);
            world.write_model(@metadata);

            // Emit event
            self
                .emit(
                    GameSettingsCreated {
                        settings_id, name, difficulty, created_by: get_caller_address(),
                    },
                );

            let (game_systems_address, _) = world.dns(@"game_system").unwrap();
            let minigame_dispatcher = IMinigameDispatcher {
                contract_address: game_systems_address,
            };
            let minigame_token_address = minigame_dispatcher.token_address();

            self
                .settings
                .create_settings(
                    game_systems_address,
                    settings_id,
                    GameSettingDetails {
                        name: felt_to_bytearray(name),
                        description: description.clone(),
                        settings: generate_settings_array(game_settings),
                    },
                    minigame_token_address,
                );

            settings_id
        }

        fn add_custom_game_settings(
            ref self: ContractState,
            name: felt252,
            description: ByteArray,
            difficulty: Difficulty,
            // Level Scaling
            base_moves: u16,
            max_moves: u16,
            base_ratio_x100: u16,
            max_ratio_x100: u16,
            // Difficulty Progression (non-linear tier thresholds)
            tier_1_threshold: u8,
            tier_2_threshold: u8,
            tier_3_threshold: u8,
            tier_4_threshold: u8,
            tier_5_threshold: u8,
            tier_6_threshold: u8,
            tier_7_threshold: u8,
            // Constraint Settings
            constraints_enabled: u8,
            constraint_start_level: u8,
            // Constraint Distribution (packed)
            constraint_lines_budgets: u64,
            // Block Distribution (VeryEasy to Master)
            veryeasy_size1_weight: u8,
            veryeasy_size2_weight: u8,
            veryeasy_size3_weight: u8,
            veryeasy_size4_weight: u8,
            veryeasy_size5_weight: u8,
            master_size1_weight: u8,
            master_size2_weight: u8,
            master_size3_weight: u8,
            master_size4_weight: u8,
            master_size5_weight: u8,
            // Variance Settings
            early_variance_percent: u8,
            mid_variance_percent: u8,
            late_variance_percent: u8,
            // Level Tier Thresholds
            early_level_threshold: u8,
            mid_level_threshold: u8,
            // Level Cap
            level_cap: u8,
            // Zone Assignment
            zone_id: u8,
            // Mutator Assignment
            active_mutator_id: u8,
            passive_mutator_id: u8,
            // Boss Settings
            boss_id: u8,
        ) -> u32 {
            // Validate input
            assert(difficulty != Difficulty::None, 'Invalid difficulty');
            self
                ._validate_settings(
                    base_moves,
                    max_moves,
                    base_ratio_x100,
                    max_ratio_x100,
                    tier_1_threshold,
                    tier_2_threshold,
                    tier_3_threshold,
                    tier_4_threshold,
                    tier_5_threshold,
                    tier_6_threshold,
                    tier_7_threshold,
                    constraints_enabled,
                    constraint_start_level,
                    constraint_lines_budgets,
                    veryeasy_size1_weight,
                    veryeasy_size2_weight,
                    veryeasy_size3_weight,
                    veryeasy_size4_weight,
                    veryeasy_size5_weight,
                    master_size1_weight,
                    master_size2_weight,
                    master_size3_weight,
                    master_size4_weight,
                    master_size5_weight,
                    early_variance_percent,
                    mid_variance_percent,
                    late_variance_percent,
                    early_level_threshold,
                    mid_level_threshold,
                    level_cap,
                    active_mutator_id,
                    passive_mutator_id,
                    boss_id,
                );

            // Get the world dispatcher
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Increment settings counter
            let mut settings_id = self.settings_counter.read();
            settings_id += 1;
            self.settings_counter.write(settings_id);

            // Create the game settings with custom values
            let game_settings = GameSettings {
                settings_id,
                mode: difficulty.into(),
                // Level Scaling
                base_moves,
                max_moves,
                base_ratio_x100,
                max_ratio_x100,
                // Difficulty Progression (non-linear tier thresholds)
                tier_1_threshold,
                tier_2_threshold,
                tier_3_threshold,
                tier_4_threshold,
                tier_5_threshold,
                tier_6_threshold,
                tier_7_threshold,
                // Constraint Settings
                constraints_enabled,
                constraint_start_level,
                // Constraint Distribution (packed)
                constraint_lines_budgets,
                // Block Distribution (VeryEasy to Master)
                veryeasy_size1_weight,
                veryeasy_size2_weight,
                veryeasy_size3_weight,
                veryeasy_size4_weight,
                veryeasy_size5_weight,
                master_size1_weight,
                master_size2_weight,
                master_size3_weight,
                master_size4_weight,
                master_size5_weight,
                // Variance Settings
                early_variance_percent,
                mid_variance_percent,
                late_variance_percent,
                // Level Tier Thresholds
                early_level_threshold,
                mid_level_threshold,
                // Level Cap
                level_cap,
                // Endless Mode Settings (defaults)
                endless_difficulty_thresholds: 0,
                endless_score_multipliers: 0,
                // Zone Assignment
                zone_id,
                // Mutator Assignment
                active_mutator_id,
                passive_mutator_id,
                // Boss Settings
                boss_id,
            };

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description: description.clone(),
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
                theme_id: 1,
                is_free: true,
                enabled: true,
                price: 0,
                payment_token: Zero::zero(),
                star_cost: 0,
            };

            // Save to world
            world.write_model(@game_settings);
            world.write_model(@metadata);

            // Emit event
            self
                .emit(
                    GameSettingsCreated {
                        settings_id, name, difficulty, created_by: get_caller_address(),
                    },
                );

            let (game_systems_address, _) = world.dns(@"game_system").unwrap();
            let minigame_dispatcher = IMinigameDispatcher {
                contract_address: game_systems_address,
            };
            let minigame_token_address = minigame_dispatcher.token_address();

            self
                .settings
                .create_settings(
                    game_systems_address,
                    settings_id,
                    GameSettingDetails {
                        name: felt_to_bytearray(name),
                        description: description.clone(),
                        settings: generate_settings_array(game_settings),
                    },
                    minigame_token_address,
                );

            settings_id
        }

        fn get_game_settings(self: @ContractState, settings_id: u32) -> GameSettings {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn get_game_settings_metadata(
            self: @ContractState, settings_id: u32,
        ) -> GameSettingsMetadata {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn purchase_zone_access(ref self: ContractState, settings_id: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();

            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            assert!(metadata.enabled, "Map is not available");
            assert!(!metadata.is_free, "Map is free, no purchase needed");
            assert!(!metadata.price.is_zero(), "Map has no price set");
            assert!(!metadata.payment_token.is_zero(), "Map has no payment token set");

            let existing: ZoneEntitlement = world.read_model((caller, settings_id));
            assert!(existing.purchased_at == 0, "Map already purchased");

            let mut effective_price: u256 = metadata.price.into();
            let mut stars_to_burn: u256 = 0;
            if !metadata.star_cost.is_zero() {
                let zstar_erc20 = IERC20Dispatcher {
                    contract_address: self.zstar_token_address.read(),
                };
                let star_balance = zstar_erc20.balance_of(caller);
                let (computed_burn, computed_price) = InternalImpl::compute_hybrid_terms(
                    star_balance, metadata.star_cost.into(), metadata.price.into(),
                );
                stars_to_burn = computed_burn;
                effective_price = computed_price;
            }

            if !stars_to_burn.is_zero() {
                let zstar = IZStarTokenDispatcher {
                    contract_address: self.zstar_token_address.read(),
                };
                zstar.burn(caller, stars_to_burn);
            }

            let erc20 = IERC20Dispatcher { contract_address: metadata.payment_token };
            let success = erc20
                .transfer_from(caller, self.treasury_address.read(), effective_price);
            assert!(success, "Payment transfer failed");

            let entitlement = ZoneEntitlement {
                player: caller, settings_id, purchased_at: get_block_timestamp(),
            };
            world.write_model(@entitlement);
        }

        fn unlock_zone_with_stars(ref self: ContractState, settings_id: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();
            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            assert!(metadata.enabled, "Map is not available");
            assert!(!metadata.star_cost.is_zero(), "No star cost set");

            let existing: ZoneEntitlement = world.read_model((caller, settings_id));
            assert!(existing.purchased_at == 0, "Map already purchased");

            let zstar_erc20 = IERC20Dispatcher {
                contract_address: self.zstar_token_address.read(),
            };
            let star_balance = zstar_erc20.balance_of(caller);
            let star_cost_u256: u256 = metadata.star_cost.into();
            assert!(star_balance >= star_cost_u256, "Not enough zStar");

            let zstar = IZStarTokenDispatcher { contract_address: self.zstar_token_address.read() };
            zstar.burn(caller, star_cost_u256);

            let entitlement = ZoneEntitlement {
                player: caller, settings_id, purchased_at: get_block_timestamp(),
            };
            world.write_model(@entitlement);
        }

        fn has_zone_access(
            self: @ContractState, player: ContractAddress, settings_id: u32,
        ) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            if metadata.is_free {
                return true;
            }

            let entitlement: ZoneEntitlement = world.read_model((player, settings_id));
            entitlement.purchased_at != 0
        }

        fn get_zstar_address(self: @ContractState) -> ContractAddress {
            self.zstar_token_address.read()
        }

        fn set_zstar_address(ref self: ContractState, token: ContractAddress) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.zstar_token_address.write(token);
        }

        fn set_treasury(ref self: ContractState, treasury: ContractAddress) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.treasury_address.write(treasury);
        }

        fn get_treasury(self: @ContractState) -> ContractAddress {
            self.treasury_address.read()
        }

        fn set_zone_pricing(
            ref self: ContractState,
            settings_id: u32,
            is_free: bool,
            price: u128,
            payment_token: ContractAddress,
            star_cost: u128,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            InternalImpl::assert_owner_or_admin(@self, @world, settings_id);
            let mut metadata: GameSettingsMetadata = world.read_model(settings_id);
            metadata.is_free = is_free;
            metadata.price = price;
            metadata.payment_token = payment_token;
            metadata.star_cost = star_cost;
            world.write_model(@metadata);
        }

        fn set_zone_enabled(ref self: ContractState, settings_id: u32, enabled: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            InternalImpl::assert_owner_or_admin(@self, @world, settings_id);
            let mut metadata: GameSettingsMetadata = world.read_model(settings_id);
            metadata.enabled = enabled;
            world.write_model(@metadata);
        }

        fn set_zone_theme(ref self: ContractState, settings_id: u32, theme_id: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            InternalImpl::assert_owner_or_admin(@self, @world, settings_id);
            let mut metadata: GameSettingsMetadata = world.read_model(settings_id);
            metadata.theme_id = theme_id;
            world.write_model(@metadata);
        }

        fn set_star_eligible(ref self: ContractState, settings_id: u32, eligible: bool) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.star_eligible.write(settings_id, eligible);
        }

        fn is_star_eligible(self: @ContractState, settings_id: u32) -> bool {
            self.star_eligible.read(settings_id)
        }

        fn settings_exists(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings = world.read_model(settings_id);
            settings.exists()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Assert caller is settings owner or has ADMIN_ROLE.
        fn assert_owner_or_admin(self: @ContractState, world: @WorldStorage, settings_id: u32) {
            let caller = get_caller_address();
            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            if caller == metadata.created_by {
                return;
            }
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
        }

        fn compute_hybrid_terms(star_balance: u256, star_cost: u256, price: u256) -> (u256, u256) {
            if star_cost.is_zero() {
                return (0, price);
            }

            let max_burnable_stars: u256 = (star_cost * 50_u256) / 100_u256;
            let stars_to_burn = if star_balance > max_burnable_stars {
                max_burnable_stars
            } else {
                star_balance
            };
            let discount_percent: u256 = (stars_to_burn * 100_u256) / star_cost;
            let charge_percent: u256 = 100_u256 - discount_percent;
            let effective_price = (price * charge_percent) / 100_u256;
            (stars_to_burn, effective_price)
        }

        /// Unpack constraint_lines_budgets field
        fn _unpack_lines_budgets(packed: u64) -> (u8, u8, u8, u8, u8, u8, u8, u8, u8, u8) {
            let veryeasy_min_lines: u8 = (packed & 0xF).try_into().unwrap();
            let master_min_lines: u8 = ((packed / 0x10) & 0xF).try_into().unwrap();
            let veryeasy_max_lines: u8 = ((packed / 0x100) & 0xF).try_into().unwrap();
            let master_max_lines: u8 = ((packed / 0x1000) & 0xF).try_into().unwrap();
            let veryeasy_budget_min: u8 = ((packed / 0x10000) & 0xFF).try_into().unwrap();
            let veryeasy_budget_max: u8 = ((packed / 0x1000000) & 0xFF).try_into().unwrap();
            let master_budget_min: u8 = ((packed / 0x100000000) & 0xFF).try_into().unwrap();
            let master_budget_max: u8 = ((packed / 0x10000000000) & 0xFF).try_into().unwrap();
            let veryeasy_min_times: u8 = ((packed / 0x1000000000000) & 0xF).try_into().unwrap();
            let master_min_times: u8 = ((packed / 0x10000000000000) & 0xF).try_into().unwrap();
            (
                veryeasy_min_lines,
                master_min_lines,
                veryeasy_max_lines,
                master_max_lines,
                veryeasy_budget_min,
                veryeasy_budget_max,
                master_budget_min,
                master_budget_max,
                veryeasy_min_times,
                master_min_times,
            )
        }

        fn _validate_settings(
            self: @ContractState,
            base_moves: u16,
            max_moves: u16,
            base_ratio_x100: u16,
            max_ratio_x100: u16,
            // Difficulty tier thresholds
            tier_1_threshold: u8,
            tier_2_threshold: u8,
            tier_3_threshold: u8,
            tier_4_threshold: u8,
            tier_5_threshold: u8,
            tier_6_threshold: u8,
            tier_7_threshold: u8,
            constraints_enabled: u8,
            constraint_start_level: u8,
            // Constraint distribution (packed)
            constraint_lines_budgets: u64,
            // Block distribution (VeryEasy to Master)
            veryeasy_size1_weight: u8,
            veryeasy_size2_weight: u8,
            veryeasy_size3_weight: u8,
            veryeasy_size4_weight: u8,
            veryeasy_size5_weight: u8,
            master_size1_weight: u8,
            master_size2_weight: u8,
            master_size3_weight: u8,
            master_size4_weight: u8,
            master_size5_weight: u8,
            // Variance settings
            early_variance_percent: u8,
            mid_variance_percent: u8,
            late_variance_percent: u8,
            early_level_threshold: u8,
            mid_level_threshold: u8,
            level_cap: u8,
            // Mutator Assignment
            active_mutator_id: u8,
            passive_mutator_id: u8,
            // Boss Settings
            boss_id: u8,
        ) {
            // Validate moves
            assert!(base_moves > 0, "Base moves must be positive");
            assert!(max_moves >= base_moves, "Max moves must be >= base moves");
            assert!(max_moves <= 255, "Max moves cannot exceed 255");

            // Validate ratios
            assert!(base_ratio_x100 > 0, "Base ratio must be positive");
            assert!(max_ratio_x100 >= base_ratio_x100, "Max ratio must be >= base ratio");

            // Validate difficulty tier thresholds (must be in ascending order)
            assert!(tier_1_threshold >= 2, "Tier 1 must be >= 2 (at least 1 VeryEasy level)");
            assert!(tier_2_threshold > tier_1_threshold, "Tier 2 must be > tier 1");
            assert!(tier_3_threshold > tier_2_threshold, "Tier 3 must be > tier 2");
            assert!(tier_4_threshold > tier_3_threshold, "Tier 4 must be > tier 3");
            assert!(tier_5_threshold > tier_4_threshold, "Tier 5 must be > tier 4");
            assert!(tier_6_threshold > tier_5_threshold, "Tier 6 must be > tier 5");
            assert!(tier_7_threshold > tier_6_threshold, "Tier 7 must be > tier 6");

            // Validate constraint settings
            assert!(constraints_enabled <= 1, "Constraints enabled must be 0 or 1");
            // constraint_start_level can be any value (high value = no constraints early)

            // Unpack constraint values for validation
            let (
                _veryeasy_min_lines,
                _master_min_lines,
                _veryeasy_max_lines,
                _master_max_lines,
                _veryeasy_budget_min_raw,
                veryeasy_budget_max,
                _master_budget_min_raw,
                master_budget_max,
                _veryeasy_min_times,
                _master_min_times,
            ) =
                Self::_unpack_lines_budgets(
                constraint_lines_budgets,
            );
            // Budget-only constraint model: budget_min is derived from budget_max (70% ceil).
            assert!(master_budget_max > 0, "Master budget_max must be > 0");
            let veryeasy_budget_min: u16 = (veryeasy_budget_max.into() * 70 + 99) / 100;
            let master_budget_min: u16 = (master_budget_max.into() * 70 + 99) / 100;
            assert!(
                veryeasy_budget_min <= veryeasy_budget_max.into(),
                "Derived VeryEasy budget_min must be <= budget_max",
            );
            assert!(
                master_budget_min <= master_budget_max.into(),
                "Derived Master budget_min must be <= budget_max",
            );

            // Validate block weights (must have at least some weight to generate blocks)
            let veryeasy_total: u16 = veryeasy_size1_weight.into()
                + veryeasy_size2_weight.into()
                + veryeasy_size3_weight.into()
                + veryeasy_size4_weight.into()
                + veryeasy_size5_weight.into();
            let master_total: u16 = master_size1_weight.into()
                + master_size2_weight.into()
                + master_size3_weight.into()
                + master_size4_weight.into()
                + master_size5_weight.into();
            assert!(veryeasy_total > 0, "VeryEasy block weights must sum to > 0");
            assert!(master_total > 0, "Master block weights must sum to > 0");

            // Validate variance settings
            assert!(early_variance_percent <= 50, "Early variance must be <= 50%");
            assert!(mid_variance_percent <= 50, "Mid variance must be <= 50%");
            assert!(late_variance_percent <= 50, "Late variance must be <= 50%");

            // Validate level tier thresholds
            assert!(
                early_level_threshold < mid_level_threshold,
                "Early threshold must be < mid threshold",
            );

            // Validate level cap
            assert!(level_cap > 0, "Level cap must be positive");
            assert!(mid_level_threshold <= level_cap, "Mid threshold must be <= level cap");

            // Mutator ID validation (0 = no mutator, valid IDs depend on deployment)
            // active_mutator_id and passive_mutator_id are u8, no range check needed beyond type

            // Boss ID validation
            assert!(boss_id <= 10, "boss_id must be 0-10 (0=no boss, 1-10=boss identities)");
        }
    }

    fn felt_to_bytearray(word: felt252) -> ByteArray {
        let mut bytes = Default::default();
        if word != 0 {
            bytes.append_word(word, U256BytesUsedTraitImpl::bytes_used(word.into()).into());
        }
        bytes
    }

    fn generate_settings_array(game_settings: GameSettings) -> Span<GameSetting> {
        array![
            GameSetting { name: 'MODE', value: difficulty_label(game_settings.get_mode()) },
            GameSetting { name: 'BASE_MOVES', value: game_settings.base_moves.into() },
            GameSetting { name: 'MAX_MOVES', value: game_settings.max_moves.into() },
            GameSetting { name: 'BASE_RATIO', value: game_settings.base_ratio_x100.into() },
            GameSetting { name: 'MAX_RATIO', value: game_settings.max_ratio_x100.into() },
            GameSetting { name: 'TIER1', value: game_settings.tier_1_threshold.into() },
            GameSetting { name: 'TIER2', value: game_settings.tier_2_threshold.into() },
            GameSetting { name: 'TIER3', value: game_settings.tier_3_threshold.into() },
            GameSetting { name: 'TIER4', value: game_settings.tier_4_threshold.into() },
            GameSetting { name: 'TIER5', value: game_settings.tier_5_threshold.into() },
            GameSetting { name: 'TIER6', value: game_settings.tier_6_threshold.into() },
            GameSetting { name: 'TIER7', value: game_settings.tier_7_threshold.into() },
            GameSetting { name: 'CONS_EN', value: game_settings.constraints_enabled.into() },
            GameSetting { name: 'CONS_START', value: game_settings.constraint_start_level.into() },
            GameSetting {
                name: 'LINES_BUDGET', value: game_settings.constraint_lines_budgets.into(),
            },
            GameSetting { name: 'VE_S1', value: game_settings.veryeasy_size1_weight.into() },
            GameSetting { name: 'VE_S2', value: game_settings.veryeasy_size2_weight.into() },
            GameSetting { name: 'VE_S3', value: game_settings.veryeasy_size3_weight.into() },
            GameSetting { name: 'VE_S4', value: game_settings.veryeasy_size4_weight.into() },
            GameSetting { name: 'VE_S5', value: game_settings.veryeasy_size5_weight.into() },
            GameSetting { name: 'MA_S1', value: game_settings.master_size1_weight.into() },
            GameSetting { name: 'MA_S2', value: game_settings.master_size2_weight.into() },
            GameSetting { name: 'MA_S3', value: game_settings.master_size3_weight.into() },
            GameSetting { name: 'MA_S4', value: game_settings.master_size4_weight.into() },
            GameSetting { name: 'MA_S5', value: game_settings.master_size5_weight.into() },
            GameSetting { name: 'VAR_E', value: game_settings.early_variance_percent.into() },
            GameSetting { name: 'VAR_M', value: game_settings.mid_variance_percent.into() },
            GameSetting { name: 'VAR_L', value: game_settings.late_variance_percent.into() },
            GameSetting { name: 'EARLY_TH', value: game_settings.early_level_threshold.into() },
            GameSetting { name: 'MID_TH', value: game_settings.mid_level_threshold.into() },
            GameSetting { name: 'LEVEL_CAP', value: game_settings.level_cap.into() },
            GameSetting { name: 'ZONE_ID', value: game_settings.zone_id.into() },
            GameSetting { name: 'ACTIVE_MUT', value: game_settings.active_mutator_id.into() },
            GameSetting { name: 'PASSIVE_MUT', value: game_settings.passive_mutator_id.into() },
        ]
            .span()
    }

    fn difficulty_label(difficulty: Difficulty) -> felt252 {
        match difficulty {
            Difficulty::None => 'NONE',
            Difficulty::Increasing => 'INCREASING',
            Difficulty::VeryEasy => 'VERY_EASY',
            Difficulty::Easy => 'EASY',
            Difficulty::Medium => 'MEDIUM',
            Difficulty::MediumHard => 'MEDIUM_HARD',
            Difficulty::Hard => 'HARD',
            Difficulty::VeryHard => 'VERY_HARD',
            Difficulty::Expert => 'EXPERT',
            Difficulty::Master => 'MASTER',
        }
    }

    #[cfg(test)]
    mod tests {
        use super::InternalTrait;

        #[test]
        fn test_compute_hybrid_terms_caps_burn_at_fifty_percent() {
            let (burned, effective_price) = InternalTrait::compute_hybrid_terms(99, 100, 5000000);
            assert!(burned == 50, "burn should cap at 50");
            assert!(effective_price == 2500000, "price should be 50% of full price");
        }

        #[test]
        fn test_compute_hybrid_terms_partial_balance() {
            // 40 stars available, star_cost=75, max_burnable = 75*50/100 = 37
            // 40 > 37, so burns 37, discount = 37/75 = 49%, charge = 51%
            let (burned, effective_price) = InternalTrait::compute_hybrid_terms(40, 75, 5000000);
            assert!(burned == 37, "should burn up to 50% cap");
            assert!(effective_price == 2550000, "price should be ~51% of full price");
        }
    }
}
