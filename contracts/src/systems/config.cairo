use zkube::models::config::{GameSettingsMetadata, GameSettings};
use zkube::types::difficulty::Difficulty;

#[starknet::interface]
trait IConfigSystem<T> {
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
        // Cube Thresholds
        cube_3_percent: u8,
        cube_2_percent: u8,
        // Consumable Costs
        hammer_cost: u8,
        wave_cost: u8,
        totem_cost: u8,
        extra_moves_cost: u8,
        // Reward Multiplier
        cube_multiplier_x100: u16,
        // Difficulty Progression
        starting_difficulty: u8,
        difficulty_step_levels: u8,
        // Constraint Settings
        constraints_enabled: u8,
        constraint_start_level: u8,
        // Constraint Distribution (Easy to Master scaling)
        easy_none_chance: u8,
        master_none_chance: u8,
        easy_no_bonus_chance: u8,
        master_no_bonus_chance: u8,
        easy_min_lines: u8,
        master_min_lines: u8,
        easy_max_lines: u8,
        master_max_lines: u8,
        easy_min_times: u8,
        master_min_times: u8,
        easy_max_times: u8,
        master_max_times: u8,
        easy_dual_chance: u8,
        master_dual_chance: u8,
        // Block Distribution (Easy to Master scaling)
        easy_size1_weight: u8,
        easy_size2_weight: u8,
        easy_size3_weight: u8,
        easy_size4_weight: u8,
        easy_size5_weight: u8,
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
    ) -> u32;

    fn get_game_settings(self: @T, settings_id: u32) -> GameSettings;
    fn get_game_settings_metadata(self: @T, settings_id: u32) -> GameSettingsMetadata;
    fn settings_exists(self: @T, settings_id: u32) -> bool;
}

#[dojo::contract]
mod config_system {
    use super::IConfigSystem;

    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use zkube::models::config::{GameSettingsMetadata, GameSettings, GameSettingsTrait};
    use zkube::types::difficulty::Difficulty;
    use zkube::constants::{DEFAULT_NS};
    use zkube::constants::DEFAULT_SETTINGS::{
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT_METADATA,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD_METADATA,
    };

    use zkube::helpers::encoding::U256BytesUsedTraitImpl;

    use game_components_minigame::extensions::settings::interface::{
        IMinigameSettings, IMinigameSettingsDetails,
    };
    use game_components_minigame::extensions::settings::settings::SettingsComponent;
    use game_components_minigame::extensions::settings::structs::{GameSetting, GameSettingDetails};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};

    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SettingsComponent, storage: settings, event: SettingsEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl SettingsInternalImpl = SettingsComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        settings_counter: u32,
        #[substorage(v0)]
        settings: SettingsComponent::Storage,
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
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        self.settings.initializer();

        let current_timestamp = get_block_timestamp();
        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT_METADATA(
                    current_timestamp, creator_address,
                ),
            );

        world.write_model(GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA(
                    current_timestamp, creator_address,
                ),
            );

        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD_METADATA(
                    current_timestamp, creator_address,
                ),
            );

        self.settings_counter.write(2);

        let (game_systems_address, _) = world.dns(@"game_system").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address: game_systems_address };
        let minigame_token_address = minigame_dispatcher.token_address();

        self
            .settings
            .create_settings(
                game_systems_address,
                0,
                "Fixed Difficulty - Expert",
                "Difficulty is fixed at expert level throughout your gameplay session.",
                array![GameSetting { name: "Difficulty", value: "Expert" }].span(),
                minigame_token_address,
            );

        self
            .settings
            .create_settings(
                game_systems_address,
                1,
                "Progressive Difficulty",
                "Starts easy and gradually becomes more challenging as you progress through the game.",
                array![GameSetting { name: "Difficulty", value: "Progressive" }].span(),
                minigame_token_address,
            );

        self
            .settings
            .create_settings(
                game_systems_address,
                2,
                "Fixed Difficulty - Very Hard",
                "Difficulty is fixed at very hard level throughout your gameplay session.",
                array![GameSetting { name: "Difficulty", value: "Very Hard" }].span(),
                minigame_token_address,
            );
    }

    #[abi(embed_v0)]
    impl MinigameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game_settings: GameSettings = world.read_model(settings_id);
            game_settings.exists()
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsDetailsImpl of IMinigameSettingsDetails<ContractState> {
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
                    felt_to_bytearray(name),
                    description.clone(),
                    generate_settings_array(game_settings),
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
            // Cube Thresholds
            cube_3_percent: u8,
            cube_2_percent: u8,
            // Consumable Costs
            hammer_cost: u8,
            wave_cost: u8,
            totem_cost: u8,
            extra_moves_cost: u8,
            // Reward Multiplier
            cube_multiplier_x100: u16,
            // Difficulty Progression
            starting_difficulty: u8,
            difficulty_step_levels: u8,
            // Constraint Settings
            constraints_enabled: u8,
            constraint_start_level: u8,
            // Constraint Distribution
            easy_none_chance: u8,
            master_none_chance: u8,
            easy_no_bonus_chance: u8,
            master_no_bonus_chance: u8,
            easy_min_lines: u8,
            master_min_lines: u8,
            easy_max_lines: u8,
            master_max_lines: u8,
            easy_min_times: u8,
            master_min_times: u8,
            easy_max_times: u8,
            master_max_times: u8,
            easy_dual_chance: u8,
            master_dual_chance: u8,
            // Block Distribution
            easy_size1_weight: u8,
            easy_size2_weight: u8,
            easy_size3_weight: u8,
            easy_size4_weight: u8,
            easy_size5_weight: u8,
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
        ) -> u32 {
            // Validate input
            assert(difficulty != Difficulty::None, 'Invalid difficulty');
            self._validate_settings(
                base_moves, max_moves, base_ratio_x100, max_ratio_x100,
                cube_3_percent, cube_2_percent, cube_multiplier_x100,
                starting_difficulty, difficulty_step_levels,
                constraints_enabled, constraint_start_level,
                easy_none_chance, master_none_chance, easy_no_bonus_chance, master_no_bonus_chance,
                easy_min_lines, master_min_lines, easy_max_lines, master_max_lines,
                easy_min_times, master_min_times, easy_max_times, master_max_times,
                easy_dual_chance, master_dual_chance,
                easy_size1_weight, easy_size2_weight, easy_size3_weight, easy_size4_weight, easy_size5_weight,
                master_size1_weight, master_size2_weight, master_size3_weight, master_size4_weight, master_size5_weight,
                early_variance_percent, mid_variance_percent, late_variance_percent,
                early_level_threshold, mid_level_threshold, level_cap
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
                // Cube Thresholds
                cube_3_percent,
                cube_2_percent,
                // Consumable Costs
                hammer_cost,
                wave_cost,
                totem_cost,
                extra_moves_cost,
                // Reward Multiplier
                cube_multiplier_x100,
                // Difficulty Progression
                starting_difficulty,
                difficulty_step_levels,
                // Constraint Settings
                constraints_enabled,
                constraint_start_level,
                // Constraint Distribution
                easy_none_chance,
                master_none_chance,
                easy_no_bonus_chance,
                master_no_bonus_chance,
                easy_min_lines,
                master_min_lines,
                easy_max_lines,
                master_max_lines,
                easy_min_times,
                master_min_times,
                easy_max_times,
                master_max_times,
                easy_dual_chance,
                master_dual_chance,
                // Block Distribution
                easy_size1_weight,
                easy_size2_weight,
                easy_size3_weight,
                easy_size4_weight,
                easy_size5_weight,
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
            };

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description: description.clone(),
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
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
                    felt_to_bytearray(name),
                    description.clone(),
                    generate_settings_array(game_settings),
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

        fn settings_exists(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings = world.read_model(settings_id);
            settings.exists()
        }
    }
    
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _validate_settings(
            self: @ContractState,
            base_moves: u16,
            max_moves: u16,
            base_ratio_x100: u16,
            max_ratio_x100: u16,
            cube_3_percent: u8,
            cube_2_percent: u8,
            cube_multiplier_x100: u16,
            // Difficulty settings
            starting_difficulty: u8,
            difficulty_step_levels: u8,
            constraints_enabled: u8,
            constraint_start_level: u8,
            // Constraint distribution
            easy_none_chance: u8,
            master_none_chance: u8,
            easy_no_bonus_chance: u8,
            master_no_bonus_chance: u8,
            easy_min_lines: u8,
            master_min_lines: u8,
            easy_max_lines: u8,
            master_max_lines: u8,
            easy_min_times: u8,
            master_min_times: u8,
            easy_max_times: u8,
            master_max_times: u8,
            easy_dual_chance: u8,
            master_dual_chance: u8,
            // Block distribution
            easy_size1_weight: u8,
            easy_size2_weight: u8,
            easy_size3_weight: u8,
            easy_size4_weight: u8,
            easy_size5_weight: u8,
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
        ) {
            // Validate moves
            assert!(base_moves > 0, "Base moves must be positive");
            assert!(max_moves >= base_moves, "Max moves must be >= base moves");
            assert!(max_moves <= 255, "Max moves cannot exceed 255");
            
            // Validate ratios
            assert!(base_ratio_x100 > 0, "Base ratio must be positive");
            assert!(max_ratio_x100 >= base_ratio_x100, "Max ratio must be >= base ratio");
            
            // Validate cube thresholds
            assert!(cube_3_percent <= 100, "Cube 3 percent must be <= 100");
            assert!(cube_2_percent <= 100, "Cube 2 percent must be <= 100");
            assert!(cube_3_percent < cube_2_percent, "Cube 3 threshold must be < cube 2 threshold");
            
            // Validate multiplier
            assert!(cube_multiplier_x100 > 0, "Cube multiplier must be positive");
            
            // Validate difficulty progression
            assert!(starting_difficulty <= 7, "Starting difficulty must be 0-7");
            // difficulty_step_levels can be 0 (means stay at starting difficulty forever)
            
            // Validate constraint settings
            assert!(constraints_enabled <= 1, "Constraints enabled must be 0 or 1");
            // constraint_start_level can be any value (high value = no constraints early)
            
            // Validate constraint distribution
            assert!(easy_none_chance <= 100, "Easy none chance must be <= 100");
            assert!(master_none_chance <= 100, "Master none chance must be <= 100");
            assert!(easy_no_bonus_chance <= 100, "Easy no bonus chance must be <= 100");
            assert!(master_no_bonus_chance <= 100, "Master no bonus chance must be <= 100");
            assert!(easy_none_chance + easy_no_bonus_chance <= 100, "Easy probabilities cannot exceed 100");
            assert!(master_none_chance + master_no_bonus_chance <= 100, "Master probabilities cannot exceed 100");
            assert!(easy_min_lines >= 2, "Easy min lines must be >= 2");
            assert!(easy_max_lines <= 10, "Easy max lines must be <= 10");
            assert!(easy_min_lines <= easy_max_lines, "Easy min lines must be <= max lines");
            assert!(master_min_lines >= 2, "Master min lines must be >= 2");
            assert!(master_max_lines <= 10, "Master max lines must be <= 10");
            assert!(master_min_lines <= master_max_lines, "Master min lines must be <= max lines");
            assert!(easy_min_times >= 1, "Easy min times must be >= 1");
            assert!(easy_max_times <= 15, "Easy max times must be <= 15");
            assert!(easy_min_times <= easy_max_times, "Easy min times must be <= max times");
            assert!(master_min_times >= 1, "Master min times must be >= 1");
            assert!(master_max_times <= 15, "Master max times must be <= 15");
            assert!(master_min_times <= master_max_times, "Master min times must be <= max times");
            assert!(easy_dual_chance <= 100, "Easy dual chance must be <= 100");
            assert!(master_dual_chance <= 100, "Master dual chance must be <= 100");
            
            // Validate block weights (must have at least some weight to generate blocks)
            let easy_total: u16 = easy_size1_weight.into() + easy_size2_weight.into() + easy_size3_weight.into() + easy_size4_weight.into() + easy_size5_weight.into();
            let master_total: u16 = master_size1_weight.into() + master_size2_weight.into() + master_size3_weight.into() + master_size4_weight.into() + master_size5_weight.into();
            assert!(easy_total > 0, "Easy block weights must sum to > 0");
            assert!(master_total > 0, "Master block weights must sum to > 0");
            
            // Validate variance settings
            assert!(early_variance_percent <= 50, "Early variance must be <= 50%");
            assert!(mid_variance_percent <= 50, "Mid variance must be <= 50%");
            assert!(late_variance_percent <= 50, "Late variance must be <= 50%");
            
            // Validate level tier thresholds
            assert!(early_level_threshold < mid_level_threshold, "Early threshold must be < mid threshold");
            
            // Validate level cap
            assert!(level_cap > 0, "Level cap must be positive");
            assert!(mid_level_threshold <= level_cap, "Mid threshold must be <= level cap");
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
            // Basic settings
            GameSetting { name: "Mode", value: difficulty_label(game_settings.get_mode()) },
            // Level Scaling
            GameSetting { name: "Base Moves", value: format!("{}", game_settings.base_moves) },
            GameSetting { name: "Max Moves", value: format!("{}", game_settings.max_moves) },
            GameSetting { name: "Base Ratio", value: format_ratio(game_settings.base_ratio_x100) },
            GameSetting { name: "Max Ratio", value: format_ratio(game_settings.max_ratio_x100) },
            // Cube Thresholds
            GameSetting { name: "3-Cube Threshold", value: format!("{}%", game_settings.cube_3_percent) },
            GameSetting { name: "2-Cube Threshold", value: format!("{}%", game_settings.cube_2_percent) },
            // Consumable Costs
            GameSetting { name: "Hammer Cost", value: format!("{}", game_settings.hammer_cost) },
            GameSetting { name: "Wave Cost", value: format!("{}", game_settings.wave_cost) },
            GameSetting { name: "Totem Cost", value: format!("{}", game_settings.totem_cost) },
            GameSetting { name: "Extra Moves Cost", value: format!("{}", game_settings.extra_moves_cost) },
            // Reward Multiplier
            GameSetting { name: "Cube Multiplier", value: format_ratio(game_settings.cube_multiplier_x100) },
            // Difficulty Progression
            GameSetting { name: "Starting Difficulty", value: difficulty_label(game_settings.get_difficulty_for_level(1)) },
            GameSetting { name: "Difficulty Step", value: format!("{} levels", game_settings.difficulty_step_levels) },
            // Constraint Settings
            GameSetting { name: "Constraints", value: if game_settings.constraints_enabled != 0 { "Enabled" } else { "Disabled" } },
            GameSetting { name: "Constraint Start", value: format!("Level {}", game_settings.constraint_start_level) },
            // Constraint Distribution (Easy to Master)
            GameSetting { name: "None Chance", value: format!("{}%-{}%", game_settings.easy_none_chance, game_settings.master_none_chance) },
            GameSetting { name: "No Bonus Chance", value: format!("{}%-{}%", game_settings.easy_no_bonus_chance, game_settings.master_no_bonus_chance) },
            GameSetting { name: "Lines Range", value: format!("{}-{} to {}-{}", game_settings.easy_min_lines, game_settings.easy_max_lines, game_settings.master_min_lines, game_settings.master_max_lines) },
            GameSetting { name: "Times Range", value: format!("{}-{} to {}-{}", game_settings.easy_min_times, game_settings.easy_max_times, game_settings.master_min_times, game_settings.master_max_times) },
            GameSetting { name: "Dual Chance", value: format!("{}%-{}%", game_settings.easy_dual_chance, game_settings.master_dual_chance) },
            // Block Distribution (Easy to Master) - size = block width
            GameSetting { name: "Size-1 Weight", value: format!("{}-{}", game_settings.easy_size1_weight, game_settings.master_size1_weight) },
            GameSetting { name: "Size-2 Weight", value: format!("{}-{}", game_settings.easy_size2_weight, game_settings.master_size2_weight) },
            GameSetting { name: "Size-3 Weight", value: format!("{}-{}", game_settings.easy_size3_weight, game_settings.master_size3_weight) },
            GameSetting { name: "Size-4 Weight", value: format!("{}-{}", game_settings.easy_size4_weight, game_settings.master_size4_weight) },
            GameSetting { name: "Size-5 Weight", value: format!("{}-{}", game_settings.easy_size5_weight, game_settings.master_size5_weight) },
            // Variance Settings
            GameSetting { name: "Early Variance", value: format!("{}%", game_settings.early_variance_percent) },
            GameSetting { name: "Mid Variance", value: format!("{}%", game_settings.mid_variance_percent) },
            GameSetting { name: "Late Variance", value: format!("{}%", game_settings.late_variance_percent) },
            // Level Tier Thresholds
            GameSetting { name: "Early Levels", value: format!("1-{}", game_settings.early_level_threshold) },
            GameSetting { name: "Mid Levels", value: format!("{}-{}", game_settings.early_level_threshold + 1, game_settings.mid_level_threshold) },
            // Level Cap
            GameSetting { name: "Level Cap", value: format!("{}", game_settings.level_cap) },
        ].span()
    }
    
    /// Format a ratio value (e.g., 100 -> "1.00", 250 -> "2.50")
    fn format_ratio(value_x100: u16) -> ByteArray {
        let whole = value_x100 / 100;
        let frac = value_x100 % 100;
        if frac < 10 {
            format!("{}.0{}", whole, frac)
        } else {
            format!("{}.{}", whole, frac)
        }
    }

    fn difficulty_label(difficulty: Difficulty) -> ByteArray {
        match difficulty {
            Difficulty::None => "Unspecified",
            Difficulty::Increasing => "Increasing",
            Difficulty::VeryEasy => "Very Easy",
            Difficulty::Easy => "Easy",
            Difficulty::Medium => "Medium",
            Difficulty::MediumHard => "Medium Hard",
            Difficulty::Hard => "Hard",
            Difficulty::VeryHard => "Very Hard",
            Difficulty::Expert => "Expert",
            Difficulty::Master => "Master",
        }
    }
}
