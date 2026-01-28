use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use game_components_token::core::interface::{IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait};

use zkube::helpers::token;
use zkube::models::config::{GameSettings, GameSettingsTrait};
use zkube::types::difficulty::Difficulty;

#[generate_trait]
pub impl ConfigUtilsImpl of ConfigUtilsTrait {
    fn get_game_settings(world: WorldStorage, game_id: u64) -> GameSettings {
        let token_dispatcher: IMinigameTokenDispatcher = token::token_dispatcher(world);
        let settings_id = token_dispatcher.settings_id(game_id);
        let settings: GameSettings = world.read_model(settings_id);

        // Defensive fallback: if the token points at a missing settings_id, default to
        // the Progressive Difficulty settings (id = 1).
        if !settings.exists() {
            let fallback: GameSettings = world.read_model(1_u32);
            if fallback.exists() {
                fallback
            } else {
                // If no settings exist at all, use hardcoded defaults to prevent
                // all-zero weights from breaking block generation
                GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing)
            }
        } else {
            settings
        }
    }
}
