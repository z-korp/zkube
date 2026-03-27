// Re-export from the registry package
pub use game_components_embeddable_game_standard::registry::interface::{
    GameMetadata, IMINIGAME_REGISTRY_ID, IMinigameRegistry,
};

#[starknet::contract]
pub mod MinigameRegistryContract {
    use core::num::traits::Zero;
    use game_components_embeddable_game_standard::minigame::interface::IMINIGAME_ID;
    use game_components_embeddable_game_standard::token::interface::{
        ITokenEventRelayerDispatcher, ITokenEventRelayerDispatcherTrait,
    };
    use openzeppelin_interfaces::introspection::{ISRC5Dispatcher, ISRC5DispatcherTrait};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};
    use super::GameMetadata;
    use super::{IMINIGAME_REGISTRY_ID, IMinigameRegistry};

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 Mixin (includes SRC5 support)
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    // SRC5 Internal implementation (not exposed in ABI to avoid conflict)
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        // Game registry storage
        game_counter: u64,
        game_id_by_address: Map<ContractAddress, u64>,
        game_metadata: Map<u64, GameMetadata>,
        // Event relayer storage
        event_relayer_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        GameMetadataUpdate: GameMetadataUpdate,
        GameRegistryUpdate: GameRegistryUpdate,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GameMetadataUpdate {
        #[key]
        pub id: u64,
        pub contract_address: ContractAddress,
        pub name: ByteArray,
        pub description: ByteArray,
        pub developer: ByteArray,
        pub publisher: ByteArray,
        pub genre: ByteArray,
        pub image: ByteArray,
        pub color: ByteArray,
        pub client_url: ByteArray,
        pub renderer_address: ContractAddress,
        pub version: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GameRegistryUpdate {
        #[key]
        pub id: u64,
        pub contract_address: ContractAddress,
    }

    #[constructor]
    pub fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        base_uri: ByteArray,
        event_relayer_address: Option<ContractAddress>,
    ) {
        self.erc721.initializer(name, symbol, base_uri);
        self.src5.register_interface(IMINIGAME_REGISTRY_ID);

        // Store the event relayer address
        if let Option::Some(relayer) = event_relayer_address {
            self.event_relayer_address.write(relayer);
        }
    }

    #[abi(embed_v0)]
    impl MultiGameImpl of IMinigameRegistry<ContractState> {
        fn game_count(self: @ContractState) -> u64 {
            self.game_counter.read()
        }

        fn game_id_from_address(self: @ContractState, contract_address: ContractAddress) -> u64 {
            self.game_id_by_address.entry(contract_address).read()
        }

        fn game_address_from_id(self: @ContractState, game_id: u64) -> ContractAddress {
            self.game_metadata.entry(game_id).read().contract_address
        }

        fn game_metadata(self: @ContractState, game_id: u64) -> GameMetadata {
            self.game_metadata.entry(game_id).read()
        }

        fn is_game_registered(self: @ContractState, contract_address: ContractAddress) -> bool {
            self.game_id_by_address.entry(contract_address).read() != 0
        }

        fn register_game(
            ref self: ContractState,
            creator_address: ContractAddress,
            name: ByteArray,
            description: ByteArray,
            developer: ByteArray,
            publisher: ByteArray,
            genre: ByteArray,
            image: ByteArray,
            color: Option<ByteArray>,
            client_url: Option<ByteArray>,
            renderer_address: Option<ContractAddress>,
            royalty_fraction: Option<u128>,
            skills_address: Option<ContractAddress>,
            version: u64,
        ) -> u64 {
            let game_count = self.game_counter.read();
            let new_game_id = game_count + 1;
            let caller_address = get_caller_address();

            // Check that caller implements IMINIGAME_ID
            let src5_dispatcher = ISRC5Dispatcher { contract_address: caller_address };
            assert!(
                src5_dispatcher.supports_interface(IMINIGAME_ID),
                "MultiGame: Caller does not implement IMinigame",
            );

            // Check the game is not already registered
            let existing_game_id = self.game_id_by_address.entry(caller_address).read();
            assert!(existing_game_id == 0, "MultiGame: Game already registered");

            // Set up the game registry
            self.game_id_by_address.entry(caller_address).write(new_game_id);

            // Emit relayer event for game ID mapping
            match self.get_event_relayer() {
                Option::Some(relayer) => relayer
                    .emit_game_registry_update(new_game_id, caller_address),
                Option::None => self
                    .emit(GameRegistryUpdate { id: new_game_id, contract_address: caller_address }),
            }

            // Mint creator token
            self.mint_creator_token(new_game_id, creator_address);

            // Prepare optional fields
            let final_color = match color {
                Option::Some(color) => color,
                Option::None => "",
            };

            let final_client_url = match client_url {
                Option::Some(client_url) => client_url,
                Option::None => "",
            };

            let final_renderer_address: ContractAddress = match renderer_address {
                Option::Some(renderer_address) => renderer_address,
                Option::None => 0.try_into().unwrap(),
            };

            let final_royalty_fraction: u128 = match royalty_fraction {
                Option::Some(fraction) => fraction,
                Option::None => 0,
            };

            let final_skills_address: ContractAddress = match skills_address {
                Option::Some(addr) => addr,
                Option::None => 0.try_into().unwrap(),
            };

            // Store game metadata
            let metadata = GameMetadata {
                contract_address: caller_address,
                name: name.clone(),
                description: description.clone(),
                developer: developer.clone(),
                publisher: publisher.clone(),
                genre: genre.clone(),
                image: image.clone(),
                color: final_color.clone(),
                client_url: final_client_url.clone(),
                renderer_address: final_renderer_address,
                royalty_fraction: final_royalty_fraction,
                skills_address: final_skills_address.clone(),
                created_at: starknet::get_block_timestamp(),
                version,
            };

            self.game_metadata.entry(new_game_id).write(metadata);
            self.game_counter.write(new_game_id);

            // Emit events
            match self.get_event_relayer() {
                Option::Some(relayer) => relayer
                    .emit_game_metadata_update(
                        new_game_id,
                        caller_address,
                        name.clone(),
                        description,
                        developer,
                        publisher,
                        genre,
                        image,
                        final_color.clone(),
                        final_client_url.clone(),
                        final_renderer_address,
                        final_skills_address,
                    ),
                Option::None => self
                    .emit(
                        GameMetadataUpdate {
                            id: new_game_id,
                            contract_address: caller_address,
                            name: name.clone(),
                            description,
                            developer,
                            publisher,
                            genre,
                            image,
                            color: final_color.clone(),
                            client_url: final_client_url.clone(),
                            renderer_address: final_renderer_address,
                            version,
                        },
                    ),
            }

            new_game_id
        }

        fn set_game_royalty(ref self: ContractState, game_id: u64, royalty_fraction: u128) {
            // Validate game_id exists
            let game_count = self.game_counter.read();
            assert!(game_id > 0 && game_id <= game_count, "Registry: invalid game id");

            // Check caller owns the game creator token (game_id)
            let caller = get_caller_address();
            let owner = self.erc721.owner_of(game_id.into());
            assert!(caller == owner, "Registry: not game owner");

            // Update the royalty_fraction in game metadata
            let mut metadata = self.game_metadata.entry(game_id).read();
            metadata.royalty_fraction = royalty_fraction;
            self.game_metadata.entry(game_id).write(metadata);
        }

        fn skills_address(self: @ContractState, game_id: u64) -> ContractAddress {
            self.game_metadata.entry(game_id).read().skills_address
        }

        fn game_metadata_batch(self: @ContractState, game_ids: Span<u64>) -> Array<GameMetadata> {
            assert!(game_ids.len() > 0, "Registry: game_ids empty");
            let mut results: Array<GameMetadata> = ArrayTrait::new();
            let mut i: u32 = 0;
            loop {
                if i >= game_ids.len() {
                    break;
                }
                let game_id = *game_ids.at(i);
                results.append(self.game_metadata.entry(game_id).read());
                i += 1;
            }
            results
        }

        fn games_registered_batch(
            self: @ContractState, addresses: Span<ContractAddress>,
        ) -> Array<bool> {
            assert!(addresses.len() > 0, "Registry: addresses empty");
            let mut results: Array<bool> = ArrayTrait::new();
            let mut i: u32 = 0;
            loop {
                if i >= addresses.len() {
                    break;
                }
                let addr = *addresses.at(i);
                results.append(self.game_id_by_address.entry(addr).read() != 0);
                i += 1;
            }
            results
        }

        fn get_games(self: @ContractState, start: u64, count: u64) -> Array<GameMetadata> {
            let mut results: Array<GameMetadata> = ArrayTrait::new();
            if count == 0 {
                return results;
            }
            let game_count = self.game_counter.read();
            if start == 0 || start > game_count {
                return results;
            }
            let end = core::cmp::min(start + count, game_count + 1);
            let mut i = start;
            loop {
                if i >= end {
                    break;
                }
                results.append(self.game_metadata.entry(i).read());
                i += 1;
            }
            results
        }

        fn get_games_by_developer(
            self: @ContractState, developer: ByteArray, start: u64, count: u64,
        ) -> Array<GameMetadata> {
            let mut results: Array<GameMetadata> = ArrayTrait::new();
            if count == 0 {
                return results;
            }
            let game_count = self.game_counter.read();
            let mut game_id: u64 = 1;
            let mut skipped: u64 = 0;
            let mut collected: u64 = 0;
            loop {
                if game_id > game_count || collected >= count {
                    break;
                }
                let metadata = self.game_metadata.entry(game_id).read();
                if metadata.developer == developer {
                    if skipped >= start {
                        results.append(metadata);
                        collected += 1;
                    } else {
                        skipped += 1;
                    }
                }
                game_id += 1;
            }
            results
        }

        fn get_games_by_publisher(
            self: @ContractState, publisher: ByteArray, start: u64, count: u64,
        ) -> Array<GameMetadata> {
            let mut results: Array<GameMetadata> = ArrayTrait::new();
            if count == 0 {
                return results;
            }
            let game_count = self.game_counter.read();
            let mut game_id: u64 = 1;
            let mut skipped: u64 = 0;
            let mut collected: u64 = 0;
            loop {
                if game_id > game_count || collected >= count {
                    break;
                }
                let metadata = self.game_metadata.entry(game_id).read();
                if metadata.publisher == publisher {
                    if skipped >= start {
                        results.append(metadata);
                        collected += 1;
                    } else {
                        skipped += 1;
                    }
                }
                game_id += 1;
            }
            results
        }

        fn get_games_by_genre(
            self: @ContractState, genre: ByteArray, start: u64, count: u64,
        ) -> Array<GameMetadata> {
            let mut results: Array<GameMetadata> = ArrayTrait::new();
            if count == 0 {
                return results;
            }
            let game_count = self.game_counter.read();
            let mut game_id: u64 = 1;
            let mut skipped: u64 = 0;
            let mut collected: u64 = 0;
            loop {
                if game_id > game_count || collected >= count {
                    break;
                }
                let metadata = self.game_metadata.entry(game_id).read();
                if metadata.genre == genre {
                    if skipped >= start {
                        results.append(metadata);
                        collected += 1;
                    } else {
                        skipped += 1;
                    }
                }
                game_id += 1;
            }
            results
        }
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        fn mint_creator_token(
            ref self: ContractState, game_id: u64, creator_address: ContractAddress,
        ) {
            // Mint the ERC721 token to the creator
            self.erc721.mint(creator_address, game_id.into());
        }

        fn get_event_relayer(self: @ContractState) -> Option<ITokenEventRelayerDispatcher> {
            let event_relayer_address = self.event_relayer_address.read();
            if !event_relayer_address.is_zero() {
                Option::Some(
                    ITokenEventRelayerDispatcher { contract_address: event_relayer_address },
                )
            } else {
                Option::None
            }
        }
    }
}
