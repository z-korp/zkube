use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use game_components_token::core::interface::{IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait};

use zkube::helpers::token;
use zkube::models::config::GameSettings;

#[generate_trait]
pub impl ConfigUtilsImpl of ConfigUtilsTrait {
    fn get_game_settings(world: WorldStorage, game_id: u64) -> GameSettings {
        let token_dispatcher: IMinigameTokenDispatcher = token::token_dispatcher(world);
        let settings_id = token_dispatcher.settings_id(game_id);
        let game_settings: GameSettings = world.read_model(settings_id);
        game_settings
    }
}
