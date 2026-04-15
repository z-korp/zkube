// Mock VRF Provider for slot/katana testing
// Returns pseudo-random values without proof verification

use starknet::ContractAddress;

#[derive(Drop, Copy, Clone, Serde)]
pub enum Source {
    Nonce: ContractAddress,
    Salt: felt252,
}

#[starknet::interface]
pub trait IMockVrfProvider<TContractState> {
    fn request_random(self: @TContractState, caller: ContractAddress, source: Source);
    fn consume_random(ref self: TContractState, source: Source) -> felt252;
}

#[starknet::contract]
pub mod MockVrfProvider {
    use core::poseidon::poseidon_hash_span;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_tx_info};
    use super::Source;

    #[storage]
    struct Storage {
        // wallet -> nonce (for Source::Nonce)
        nonces: Map<ContractAddress, felt252>,
    }

    #[abi(embed_v0)]
    impl MockVrfProviderImpl of super::IMockVrfProvider<ContractState> {
        // No-op, just for compatibility with real VRF
        fn request_random(self: @ContractState, caller: ContractAddress, source: Source) {}

        // Returns pseudo-random value based on source + tx hash + timestamp
        fn consume_random(ref self: ContractState, source: Source) -> felt252 {
            let tx_info = get_tx_info().unbox();
            let caller = get_caller_address();
            let timestamp: felt252 = get_block_timestamp().into();

            let seed = match source {
                Source::Nonce(addr) => {
                    let nonce = self.nonces.read(addr);
                    self.nonces.write(addr, nonce + 1);
                    poseidon_hash_span(
                        array![
                            nonce, addr.into(), caller.into(), tx_info.transaction_hash, timestamp,
                        ]
                            .span(),
                    )
                },
                Source::Salt(salt) => {
                    poseidon_hash_span(
                        array![salt, caller.into(), tx_info.transaction_hash, timestamp].span(),
                    )
                },
            };

            // Return the hash as pseudo-random value
            seed
        }
    }
}
