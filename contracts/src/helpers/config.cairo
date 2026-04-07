use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use game_components_embeddable_game_standard::token::interface::{
    IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
};
use zkube::constants::DEFAULT_SETTINGS::DEFAULT_SETTINGS_ID;
use zkube::helpers::token;
use zkube::models::config::{GameSettings, GameSettingsTrait};
use zkube::models::daily::{DailyAttempt, DailyAttemptTrait, DailyChallenge};
use zkube::models::story::{StoryAttempt, StoryAttemptTrait};
use zkube::types::difficulty::Difficulty;

#[generate_trait]
pub impl ConfigUtilsImpl of ConfigUtilsTrait {
    fn get_game_settings(world: WorldStorage, game_id: felt252) -> GameSettings {
        // 1. Story game path
        let story_game: StoryAttempt = world.read_model(game_id);
        if story_game.exists() {
            let settings_id: u32 = ((story_game.zone_id - 1) * 2).into();
            let settings: GameSettings = world.read_model(settings_id);
            if settings.exists() {
                return settings;
            }
        }

        // 2. Daily game path — use zone settings with overridden mutators + boss
        let daily_game: DailyAttempt = world.read_model(game_id);
        if daily_game.exists() {
            let settings_id: u32 = ((daily_game.zone_id - 1) * 2).into();
            let mut settings: GameSettings = world.read_model(settings_id);
            if settings.exists() {
                // Override with the daily challenge's random mutators and boss
                let challenge: DailyChallenge = world.read_model(daily_game.challenge_id);
                settings.active_mutator_id = challenge.active_mutator_id;
                settings.passive_mutator_id = challenge.passive_mutator_id;
                settings.boss_id = challenge.boss_id;
                return settings;
            }
        }

        // 3. NFT token path (fallback)
        let token_dispatcher: IMinigameTokenDispatcher = token::token_dispatcher(world);
        let settings_id = token_dispatcher.settings_id(game_id);
        let settings: GameSettings = world.read_model(settings_id);

        // Defensive fallback: if the token points at a missing settings_id, default to
        // the official default settings (id = 0).
        if !settings.exists() {
            let fallback: GameSettings = world.read_model(DEFAULT_SETTINGS_ID);
            if fallback.exists() {
                fallback
            } else {
                // If no settings exist at all, use hardcoded defaults to prevent
                // all-zero weights from breaking block generation
                GameSettingsTrait::new_with_defaults(DEFAULT_SETTINGS_ID, Difficulty::Increasing)
            }
        } else {
            settings
        }
    }
}
