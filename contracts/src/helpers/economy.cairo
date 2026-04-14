//! Shared economy helpers.
//!
//! Both daily settlement and weekly endless settlement need to mint zStar
//! to ranked players. Centralising the dispatcher lookup here keeps the
//! systems thin and avoids drift between two copies of the same plumbing.

use core::num::traits::Zero;
use dojo::world::{WorldStorage, WorldStorageTrait};
use starknet::ContractAddress;
use zkube::external::zstar_token::{IZStarTokenDispatcher, IZStarTokenDispatcherTrait};
use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};

/// Mint `amount` zStar to `recipient` via the `config_system`-resolved token
/// address. No-ops gracefully if `config_system` isn't registered or the
/// zStar address hasn't been set yet (mirrors the previous in-system impl).
pub fn mint_zstar(ref world: WorldStorage, recipient: ContractAddress, amount: u256) {
    match world.dns_address(@"config_system") {
        Option::Some(config_address) => {
            let config = IConfigSystemDispatcher { contract_address: config_address };
            let zstar_address = config.get_zstar_address();
            if !zstar_address.is_zero() {
                let zstar = IZStarTokenDispatcher { contract_address: zstar_address };
                zstar.mint(recipient, amount);
            }
        },
        Option::None => {},
    }
}
