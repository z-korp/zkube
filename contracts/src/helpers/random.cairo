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
    fn new() -> Random {
        Random { seed: seed(get_contract_address()), nonce: 0 }
    }

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

    fn bool(ref self: Random) -> bool {
        let seed: u256 = self.next_seed().into();
        seed.low % 2 == 0
    }

    fn felt(ref self: Random) -> felt252 {
        let tx_hash = starknet::get_tx_info().unbox().transaction_hash;
        let seed = self.next_seed();
        pedersen(tx_hash, seed)
    }

    fn occurs(ref self: Random, likelihood: u8) -> bool {
        if likelihood == 0 {
            return false;
        }

        let result = self.between::<u8>(0, 100);
        result <= likelihood
    }

    fn between<
        T, +Into<T, u128>, +Into<T, u256>, +TryInto<u128, T>, +PartialOrd<T>, +Copy<T>, +Drop<T>,
    >(
        ref self: Random, min: T, max: T,
    ) -> T {
        let seed: u256 = self.next_seed().into();

        assert(min < max, 'min must be less than max');

        let range: u128 = max.into() - min.into() + 1; // includes max
        let rand = (seed.low % range) + min.into();
        rand.try_into().unwrap()
    }
}

fn seed(salt: ContractAddress) -> felt252 {
    pedersen(starknet::get_tx_info().unbox().transaction_hash, salt.into())
}
