use dojo::world::{WorldStorage, WorldStorageTrait};
use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
use game_components_token::core::interface::{
    IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
};
use starknet::ContractAddress;

/// Returns the configured minigame token contract address registered in the Dojo world.
pub fn get_token_address(world: WorldStorage) -> ContractAddress {
    let (game_system_address, _) = world
        .dns(@"game_system")
        .expect('game_system not in world DNS');
    let dispatcher = IMinigameDispatcher { contract_address: game_system_address };
    dispatcher.token_address()
}

/// Convenience helper to instantiate the minigame token dispatcher.
pub fn token_dispatcher(world: WorldStorage) -> IMinigameTokenDispatcher {
    let token_address = get_token_address(world);
    IMinigameTokenDispatcher { contract_address: token_address }
}
