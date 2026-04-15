// SPDX-License-Identifier: MIT

use game_components_embeddable_game_standard::minigame::structs::GameDetail;

#[starknet::interface]
pub trait IRendererSystems<T> {
    /// Generate full metadata for a game token (JSON data URI)
    fn create_metadata(self: @T, game_id: felt252) -> ByteArray;
    /// Generate SVG for a game token
    fn generate_svg(self: @T, game_id: felt252) -> ByteArray;
    /// Generate game details (attributes)
    fn generate_details(self: @T, game_id: felt252) -> Span<GameDetail>;
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
    fn _get_player_name(world: WorldStorage, game_id: felt252) -> felt252 {
        match world.dns(@"game_system") {
            Option::Some((
                game_system_address, _,
            )) => {
                let minigame_dispatcher = IMinigameDispatcher {
                    contract_address: game_system_address,
                };
                let token_address = minigame_dispatcher.token_address();
                libs_get_player_name(token_address, game_id)
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
            let game_id = token_id;
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            let mut details: Array<GameDetail> = array![];

            // Status
            details
                .append(
                    GameDetail { name: 'STATUS', value: if game.over {
                        'OVER'
                    } else {
                        'ACTIVE'
                    } },
                );

            // Level
            details.append(GameDetail { name: 'LEVEL', value: run_data.current_level.into() });

            // Score
            details.append(GameDetail { name: 'SCORE', value: run_data.total_score.into() });

            // Zone
            details.append(GameDetail { name: 'ZONE', value: run_data.zone_id.into() });

            // Mode
            details
                .append(
                    GameDetail {
                        name: 'MODE',
                        value: if run_data.run_type == 0 {
                            'ZONE'
                        } else {
                            'ENDLESS'
                        },
                    },
                );

            // Difficulty
            details
                .append(
                    GameDetail { name: 'DIFFICULTY', value: run_data.current_difficulty.into() },
                );

            // Max Combo
            details.append(GameDetail { name: 'MAX_COMBO', value: game.max_combo.into() });

            details.span()
        }

        fn token_name(self: @ContractState, token_id: felt252) -> ByteArray {
            "zKube Game"
        }

        fn token_description(self: @ContractState, token_id: felt252) -> ByteArray {
            let game_id = token_id;
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            let zone_name = renderer_helper::get_zone_name(run_data.zone_id);
            let mode_name = renderer_helper::get_mode_name(run_data.run_type);

            if game.over {
                format!(
                    "A {} {} game of zKube that reached level {} with a score of {}.",
                    zone_name,
                    mode_name,
                    run_data.current_level,
                    run_data.total_score,
                )
            } else {
                format!(
                    "An active {} {} game of zKube on level {} with a score of {}.",
                    zone_name,
                    mode_name,
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
            }

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
            }

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
            }

            details_batch
        }
    }

    // ------------------------------------------ //
    // ------------ IMinigameDetailsSVG --------- //
    // ------------------------------------------ //

    #[abi(embed_v0)]
    impl GameDetailsSVGImpl of IMinigameDetailsSVG<ContractState> {
        fn game_details_svg(self: @ContractState, token_id: felt252) -> ByteArray {
            let game_id = token_id;
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
        fn create_metadata(self: @ContractState, game_id: felt252) -> ByteArray {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();
            let player_name = _get_player_name(world, game_id);

            renderer_helper::create_metadata(
                game_id,
                player_name,
                game.over,
                run_data.total_score,
                run_data.current_level,
                game.max_combo,
                run_data.zone_id,
                run_data.current_difficulty,
                run_data.run_type,
            )
        }

        fn generate_svg(self: @ContractState, game_id: felt252) -> ByteArray {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();
            let player_name = _get_player_name(world, game_id);

            let (bg_color, accent_color, secondary_color) = renderer_helper::get_zone_colors(
                run_data.zone_id,
            );
            let zone_name = renderer_helper::get_zone_name(run_data.zone_id);
            let difficulty_name = renderer_helper::get_difficulty_name(run_data.current_difficulty);
            let mode_name = renderer_helper::get_mode_name(run_data.run_type);

            let rect = renderer_helper::create_rect(bg_color, accent_color.clone());
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
            let _max_combo = format!("{}", game.max_combo);
            let _level = format!("{}", run_data.current_level);

            let mut elements = array![
                rect,
                // Title row
                renderer_helper::create_text(
                    "zKube #" + _game_id.clone(), "30", "40", "24", "middle", "start",
                ),
                renderer_helper::create_text(
                    renderer_helper::game_state(game.over).clone(),
                    "440",
                    "40",
                    "16",
                    "middle",
                    "end",
                ),
                // Player name
                renderer_helper::create_text(_name.clone(), "30", "72", "20", "middle", "start"),
                // First separator
                renderer_helper::create_line("100", accent_color.clone()),
                // Zone name left, mode right
                renderer_helper::create_text(zone_name, "30", "135", "18", "middle", "start"),
                renderer_helper::create_text(mode_name, "440", "135", "18", "middle", "end"),
            ];

            // Score section (centered)
            elements
                .append(
                    "<text x='235' y='195' font-size='14' text-anchor='middle' dominant-baseline='middle' fill='"
                        + secondary_color.clone()
                        + "'>SCORE</text>",
                );
            elements
                .append(
                    renderer_helper::create_text(
                        _score.clone(), "235", "240", "36", "middle", "middle",
                    ),
                );

            // Bottom stats row
            elements
                .append(
                    "<text x='80' y='310' font-size='11' text-anchor='middle' dominant-baseline='middle' fill='"
                        + secondary_color.clone()
                        + "'>DIFFICULTY</text>",
                );
            elements
                .append(
                    renderer_helper::create_text(
                        difficulty_name, "80", "335", "16", "middle", "middle",
                    ),
                );

            elements
                .append(
                    "<text x='235' y='310' font-size='11' text-anchor='middle' dominant-baseline='middle' fill='"
                        + secondary_color.clone()
                        + "'>MAX COMBO</text>",
                );
            elements
                .append(
                    renderer_helper::create_text(
                        _max_combo.clone(), "235", "335", "16", "middle", "middle",
                    ),
                );

            elements
                .append(
                    "<text x='390' y='310' font-size='11' text-anchor='middle' dominant-baseline='middle' fill='"
                        + secondary_color
                        + "'>LEVEL</text>",
                );
            elements
                .append(
                    renderer_helper::create_text(
                        _level.clone(), "390", "335", "16", "middle", "middle",
                    ),
                );

            // Second separator
            elements.append(renderer_helper::create_line("375", accent_color.clone()));

            let mut elements = elements.span();
            renderer_helper::create_svg(
                renderer_helper::combine_elements(ref elements), accent_color,
            )
        }

        fn generate_details(self: @ContractState, game_id: felt252) -> Span<GameDetail> {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            let mut details: Array<GameDetail> = array![];

            details
                .append(
                    GameDetail { name: 'STATUS', value: if game.over {
                        'OVER'
                    } else {
                        'ACTIVE'
                    } },
                );

            details.append(GameDetail { name: 'LEVEL', value: run_data.current_level.into() });

            details.append(GameDetail { name: 'SCORE', value: run_data.total_score.into() });

            details.append(GameDetail { name: 'ZONE', value: run_data.zone_id.into() });

            details
                .append(
                    GameDetail {
                        name: 'MODE',
                        value: if run_data.run_type == 0 {
                            'ZONE'
                        } else {
                            'ENDLESS'
                        },
                    },
                );

            details
                .append(
                    GameDetail { name: 'DIFFICULTY', value: run_data.current_difficulty.into() },
                );

            details.append(GameDetail { name: 'MAX_COMBO', value: game.max_combo.into() });

            details.span()
        }
    }
}
