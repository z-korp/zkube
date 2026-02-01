use core::pedersen::pedersen;
use core::poseidon::poseidon_hash_span;

use starknet::ContractAddress;
use starknet::{get_caller_address, get_contract_address, get_block_timestamp, get_tx_info};

use zkube::interfaces::vrf::{IVrfProviderDispatcher, IVrfProviderDispatcherTrait, Source};

const VRF_PROVIDER_ADDRESS: felt252 =
    0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f;

#[derive(Copy, Drop, Serde)]
pub struct Random {
    pub seed: felt252,
    pub nonce: usize,
}

#[generate_trait]
pub impl RandomImpl of RandomTrait {
    // https://docs.cartridge.gg/vrf/overview
    // On networks with VRF (Sepolia/Mainnet), this consumes VRF randomness
    // On slot/katana without VRF, use new_pseudo_random() instead
    fn new_vrf() -> Random {
        let vrf_address: ContractAddress = VRF_PROVIDER_ADDRESS.try_into().unwrap();
        let vrf_provider = IVrfProviderDispatcher {
            contract_address: vrf_address
        };
        let seed = vrf_provider.consume_random(Source::Nonce(get_caller_address()));
        Random { seed, nonce: 0 }
    }

    // Generate pseudo-random seed for slot/katana (when VRF is not available)
    fn new_pseudo_random() -> Random {
        let tx_info = get_tx_info().unbox();
        let caller = get_caller_address();
        let contract = get_contract_address();
        let timestamp: felt252 = get_block_timestamp().into();

        let seed = poseidon_hash_span(
            array![
                tx_info.transaction_hash,
                caller.into(),
                contract.into(),
                timestamp,
                tx_info.nonce,
            ].span()
        );

        Random { seed, nonce: 0 }
    }

    fn next_seed(ref self: Random) -> felt252 {
        self.nonce += 1;
        self.seed = pedersen(self.seed, self.nonce.into());
        self.seed
    }
}
