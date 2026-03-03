use dojo::event::EventStorage;
use dojo::model::ModelStorage;
use dojo::world::{WorldStorage, WorldStorageTrait};
use starknet::ContractAddress;
use crate::events::index::{LevelCompleted, LevelStarted, RunEnded, StartGame, UseBonus};
use crate::models::config::{GameSettings, GameSettingsMetadata};
use crate::models::game::{Game, GameSeed};
use crate::models::player::PlayerMeta;
use crate::models::skill_tree::PlayerSkillTree;
use crate::models::daily::{DailyChallenge, DailyEntry, DailyLeaderboard, GameChallenge};
use crate::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};
use crate::systems::cube_token::ICubeTokenDispatcher;

/// Centralized store for world storage access
/// Provides typed model accessors, dispatcher helpers, and event emission
#[derive(Copy, Drop)]
pub struct Store {
    pub world: WorldStorage,
}

#[generate_trait]
pub impl StoreImpl of StoreTrait {
    // ===== Constructor =====

    /// Create a new Store instance wrapping WorldStorage
    #[inline(always)]
    fn new(world: WorldStorage) -> Store {
        Store { world }
    }

    // ===== Game Model =====

    /// Read a Game model by game_id
    #[inline(always)]
    fn game(self: @Store, game_id: u64) -> Game {
        self.world.read_model(game_id)
    }

    /// Write a Game model
    #[inline(always)]
    fn set_game(ref self: Store, game: @Game) {
        self.world.write_model(game);
    }

    // ===== GameSeed Model =====

    /// Read a GameSeed model by game_id
    #[inline(always)]
    fn game_seed(self: @Store, game_id: u64) -> GameSeed {
        self.world.read_model(game_id)
    }

    /// Write a GameSeed model
    #[inline(always)]
    fn set_game_seed(ref self: Store, seed: @GameSeed) {
        self.world.write_model(seed);
    }

    // ===== GameSettings Model =====

    /// Read GameSettings by settings_id
    #[inline(always)]
    fn game_settings(self: @Store, settings_id: u32) -> GameSettings {
        self.world.read_model(settings_id)
    }

    /// Write GameSettings model
    #[inline(always)]
    fn set_game_settings(ref self: Store, settings: @GameSettings) {
        self.world.write_model(settings);
    }

    // ===== GameSettingsMetadata Model =====

    /// Read GameSettingsMetadata by settings_id
    #[inline(always)]
    fn game_settings_metadata(self: @Store, settings_id: u32) -> GameSettingsMetadata {
        self.world.read_model(settings_id)
    }

    /// Write GameSettingsMetadata model
    #[inline(always)]
    fn set_game_settings_metadata(ref self: Store, metadata: @GameSettingsMetadata) {
        self.world.write_model(metadata);
    }

    // ===== PlayerMeta Model =====

    /// Read PlayerMeta by player address
    #[inline(always)]
    fn player_meta(self: @Store, player: ContractAddress) -> PlayerMeta {
        self.world.read_model(player)
    }

    /// Write PlayerMeta model
    #[inline(always)]
    fn set_player_meta(ref self: Store, meta: @PlayerMeta) {
        self.world.write_model(meta);
    }

    // ===== PlayerSkillTree Model =====

    /// Read PlayerSkillTree by player address
    #[inline(always)]
    fn player_skill_tree(self: @Store, player: ContractAddress) -> PlayerSkillTree {
        self.world.read_model(player)
    }

    /// Write PlayerSkillTree model
    #[inline(always)]
    fn set_player_skill_tree(ref self: Store, tree: @PlayerSkillTree) {
        self.world.write_model(tree);
    }

    // ===== DailyChallenge Model =====

    /// Read DailyChallenge by challenge_id
    #[inline(always)]
    fn daily_challenge(self: @Store, challenge_id: u32) -> DailyChallenge {
        self.world.read_model(challenge_id)
    }

    /// Write DailyChallenge model
    #[inline(always)]
    fn set_daily_challenge(ref self: Store, challenge: @DailyChallenge) {
        self.world.write_model(challenge);
    }

    // ===== DailyEntry Model =====

    /// Read DailyEntry by compound key (challenge_id, player)
    #[inline(always)]
    fn daily_entry(self: @Store, challenge_id: u32, player: ContractAddress) -> DailyEntry {
        self.world.read_model((challenge_id, player))
    }

    /// Write DailyEntry model
    #[inline(always)]
    fn set_daily_entry(ref self: Store, entry: @DailyEntry) {
        self.world.write_model(entry);
    }

    // ===== DailyLeaderboard Model =====

    /// Read DailyLeaderboard by compound key (challenge_id, rank)
    #[inline(always)]
    fn daily_leaderboard(self: @Store, challenge_id: u32, rank: u32) -> DailyLeaderboard {
        self.world.read_model((challenge_id, rank))
    }

    /// Write DailyLeaderboard model
    #[inline(always)]
    fn set_daily_leaderboard(ref self: Store, lb: @DailyLeaderboard) {
        self.world.write_model(lb);
    }

    // ===== GameChallenge Model =====

    /// Read GameChallenge by game_id
    #[inline(always)]
    fn game_challenge(self: @Store, game_id: u64) -> GameChallenge {
        self.world.read_model(game_id)
    }

    /// Write GameChallenge model
    #[inline(always)]
    fn set_game_challenge(ref self: Store, gc: @GameChallenge) {
        self.world.write_model(gc);
    }

    // ===== Dispatchers =====

    /// Get CubeToken contract dispatcher via world DNS
    fn cube_token_disp(self: @Store) -> ICubeTokenDispatcher {
        let config_address = self
            .world
            .dns_address(@"config_system")
            .expect('ConfigSystem not found in DNS');
        let config = IConfigSystemDispatcher { contract_address: config_address };
        let address = config.get_cube_token_address();
        ICubeTokenDispatcher { contract_address: address }
    }

    // ===== Event Helpers =====

    /// Emit StartGame event
    #[inline(always)]
    fn emit_start_game(ref self: Store, event: @StartGame) {
        self.world.emit_event(event);
    }

    /// Emit UseBonus event
    #[inline(always)]
    fn emit_use_bonus(ref self: Store, event: @UseBonus) {
        self.world.emit_event(event);
    }

    /// Emit LevelStarted event
    #[inline(always)]
    fn emit_level_started(ref self: Store, event: @LevelStarted) {
        self.world.emit_event(event);
    }

    /// Emit LevelCompleted event
    #[inline(always)]
    fn emit_level_completed(ref self: Store, event: @LevelCompleted) {
        self.world.emit_event(event);
    }

    /// Emit RunEnded event
    #[inline(always)]
    fn emit_run_ended(ref self: Store, event: @RunEnded) {
        self.world.emit_event(event);
    }
}
