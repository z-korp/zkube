// SPDX-License-Identifier: MIT

use game_components_embeddable_game_standard::minigame::structs::GameDetail;

#[starknet::interface]
pub trait IRendererSystems<T> {
    /// Generate full metadata for a game token (JSON data URI)
    fn create_metadata(self: @T, game_id: u64) -> ByteArray;
    /// Generate SVG for a game token
    fn generate_svg(self: @T, game_id: u64) -> ByteArray;
    /// Generate game details (attributes)
    fn generate_details(self: @T, game_id: u64) -> Span<GameDetail>;
}

#[dojo::contract]
mod renderer_systems {
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_embeddable_game_standard::minigame::interface::{
        IMinigameDetails, IMinigameDetailsSVG, IMinigameDispatcher, IMinigameDispatcherTrait,
    };
    use game_components_embeddable_game_standard::minigame::minigame::get_player_name as libs_get_player_name;
    use game_components_embeddable_game_standard::minigame::structs::GameDetail;
    use zkube::constants::DEFAULT_NS;
    use zkube::helpers::encoding::bytes_base64_encode;
    use zkube::helpers::renderer as renderer_helper;
    use zkube::models::game::{Game, GameTrait};

    // ------------------------------------------ //
    // ------------ Helper Functions ------------ //
    // ------------------------------------------ //

    /// Get player name from game_system via libs
    /// Uses world.dns() to lookup the game_system contract address
    fn _get_player_name(world: WorldStorage, game_id: u64) -> felt252 {
        match world.dns(@"game_system") {
            Option::Some((
                game_system_address, _,
            )) => {
                let minigame_dispatcher = IMinigameDispatcher {
                    contract_address: game_system_address,
                };
                let token_address = minigame_dispatcher.token_address();
                let token_id_felt: felt252 = game_id.into();
                libs_get_player_name(token_address, token_id_felt)
            },
            Option::None => {
                // Fallback: return 0 if game_system not found
                0
            },
        }
    }

    // ------------------------------------------ //
    // ------------ IMinigameDetails ------------ //
    // ------------------------------------------ //

    #[abi(embed_v0)]
    impl GameDetailsImpl of IMinigameDetails<ContractState> {
        fn game_details(self: @ContractState, token_id: felt252) -> Span<GameDetail> {
            let game_id: u64 = token_id.try_into().expect('invalid token_id');
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            let mut details: Array<GameDetail> = array![];

            // Status
            details
                .append(
                    GameDetail {
                        name: 'STATUS', value: if game.over {
                            'OVER'
                        } else {
                            'ACTIVE'
                        },
                    },
                );

            // Level
            details
                .append(GameDetail { name: 'LEVEL', value: run_data.current_level.into() });

            // Score
            details
                .append(GameDetail { name: 'SCORE', value: run_data.total_score.into() });

            // Cubes
            details.append(GameDetail { name: 'CUBES', value: 0 });

            details.span()
        }

        fn token_name(self: @ContractState, token_id: felt252) -> ByteArray {
            "zKube Game"
        }

        fn token_description(self: @ContractState, token_id: felt252) -> ByteArray {
            let game_id: u64 = token_id.try_into().expect('invalid token_id');
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            if game.over {
                format!(
                    "A zKube game that reached level {} with a score of {}.",
                    run_data.current_level,
                    run_data.total_score,
                )
            } else {
                format!(
                    "An active zKube game on level {} with a score of {}.",
                    run_data.current_level,
                    run_data.total_score,
                )
            }
        }

        fn token_name_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<ByteArray> {
            let mut names = array![];
            let mut i: u32 = 0;

            loop {
                if i >= token_ids.len() {
                    break;
                }

                let token_id = *token_ids.at(i);
                names.append(self.token_name(token_id));
                i += 1;
            };

            names
        }

        fn token_description_batch(
            self: @ContractState, token_ids: Span<felt252>,
        ) -> Array<ByteArray> {
            let mut descriptions = array![];
            let mut i: u32 = 0;

            loop {
                if i >= token_ids.len() {
                    break;
                }

                let token_id = *token_ids.at(i);
                descriptions.append(self.token_description(token_id));
                i += 1;
            };

            descriptions
        }

        fn game_details_batch(
            self: @ContractState, token_ids: Span<felt252>,
        ) -> Array<Span<GameDetail>> {
            let mut details_batch = array![];
            let mut i: u32 = 0;

            loop {
                if i >= token_ids.len() {
                    break;
                }

                let token_id = *token_ids.at(i);
                details_batch.append(self.game_details(token_id));
                i += 1;
            };

            details_batch
        }
    }

    // ------------------------------------------ //
    // ------------ IMinigameDetailsSVG --------- //
    // ------------------------------------------ //

    #[abi(embed_v0)]
    impl GameDetailsSVGImpl of IMinigameDetailsSVG<ContractState> {
        fn game_details_svg(self: @ContractState, token_id: felt252) -> ByteArray {
            let game_id: u64 = token_id.try_into().expect('invalid token_id');
            // Generate the raw SVG
            let svg = self.generate_svg(game_id);
            // Return as base64-encoded data URI (required by FullTokenContract)
            format!("data:image/svg+xml;base64,{}", bytes_base64_encode(svg))
        }
    }

    // ------------------------------------------ //
    // ------------ IRendererSystems ------------ //
    // ------------------------------------------ //

    #[abi(embed_v0)]
    impl RendererSystemsImpl of super::IRendererSystems<ContractState> {
        fn create_metadata(self: @ContractState, game_id: u64) -> ByteArray {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();
            let player_name = _get_player_name(world, game_id);
            let capped_score: u16 = if run_data.total_score > 65535 {
                65535
            } else {
                run_data.total_score.try_into().unwrap()
            };

            renderer_helper::create_metadata(
                game_id,
                player_name,
                game.over,
                capped_score,
                run_data.level_moves.into(),
                game.combo_counter.into(),
                game.max_combo,
                0,
                0,
                0,
            )
        }

        fn generate_svg(self: @ContractState, game_id: u64) -> ByteArray {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();
            let player_name = _get_player_name(world, game_id);

            // Use the helper to generate elements and create SVG
            let rect = renderer_helper::create_rect();
            let mut _name: ByteArray = Default::default();

            if player_name != 0 {
                _name
                    .append_word(
                        player_name,
                        zkube::helpers::encoding::U256BytesUsedTraitImpl::bytes_used(
                            player_name.into(),
                        )
                            .into(),
                    );
            }

            let _game_id = format!("{}", game_id);
            let _score = format!("{}", run_data.total_score);
            let _combo = format!("{}", game.combo_counter);
            let _max_combo = format!("{}", game.max_combo);
            let _combo_bonus = format!("{}", 0);
            let _score_bonus = format!("{}", 0);
            let _harvest_bonus = format!("{}", 0);
            let _level = format!("{}", run_data.current_level);

            let mut elements = array![
                rect,
                renderer_helper::create_text(
                    "zKube #" + _game_id.clone(), "30", "40", "24", "middle", "left",
                ),
                renderer_helper::create_text(_name.clone(), "30", "80", "20", "middle", "left"),
            ];

            if run_data.total_score != 0 || run_data.current_level > 1 {
                elements
                    .append(
                        renderer_helper::create_text(
                            renderer_helper::game_state(game.over).clone(),
                            "300",
                            "40",
                            "20",
                            "middle",
                            "left",
                        ),
                    );
                elements
                    .append(
                        renderer_helper::create_text(
                            "Level: " + _level.clone(), "30", "125", "18", "middle", "left",
                        ),
                    );
                elements
                    .append(
                        renderer_helper::create_text(
                            "Score: " + _score.clone(), "30", "150", "18", "middle", "left",
                        ),
                    );
                elements
                    .append(
                        renderer_helper::create_text(
                            "Combo: " + _combo.clone(), "30", "175", "18", "middle", "left",
                        ),
                    );
                elements
                    .append(
                        renderer_helper::create_text(
                            "Max Combo: " + _max_combo.clone(), "30", "200", "18", "middle", "left",
                        ),
                    );
                elements
                    .append(
                        renderer_helper::create_text(
                            "Combo: " + _combo_bonus.clone(), "30", "250", "18", "middle", "left",
                        ),
                    );
                elements
                    .append(
                        renderer_helper::create_text(
                            "Score: " + _score_bonus.clone(), "30", "275", "18", "middle", "left",
                        ),
                    );
                elements
                    .append(
                        renderer_helper::create_text(
                            "Harvest: " + _harvest_bonus.clone(),
                            "30",
                            "300",
                            "18",
                            "middle",
                            "left",
                        ),
                    );
            } else {
                elements
                    .append(
                        renderer_helper::create_text(
                            "Game not started", "240", "40", "20", "middle", "left",
                        ),
                    );
            }

            let mut elements = elements.span();
            renderer_helper::create_svg(renderer_helper::combine_elements(ref elements))
        }

        fn generate_details(self: @ContractState, game_id: u64) -> Span<GameDetail> {
            // Reuse the game_details implementation
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            let mut details: Array<GameDetail> = array![];

            details
                .append(
                    GameDetail {
                        name: 'STATUS', value: if game.over {
                            'OVER'
                        } else {
                            'ACTIVE'
                        },
                    },
                );

            details
                .append(GameDetail { name: 'LEVEL', value: run_data.current_level.into() });

            details
                .append(GameDetail { name: 'SCORE', value: run_data.total_score.into() });

            details.append(GameDetail { name: 'CUBES', value: 0 });

            details.span()
        }
    }
}
