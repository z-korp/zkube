use zkube::models::config::GameSettings;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use tournaments::components::models::game::TokenMetadata;

#[generate_trait]
pub impl ConfigUtilsImpl of ConfigUtilsTrait {
    fn get_game_settings(world: WorldStorage, game_id: u64) -> GameSettings {
        let token_metadata: TokenMetadata = world.read_model(game_id);
        let game_settings: GameSettings = world.read_model(token_metadata.settings_id);
        game_settings
    }
}
