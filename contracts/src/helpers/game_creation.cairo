//! Shared game creation logic.
//! Extracted from game_system to reduce CASM bytecode size.
//! Called by game_system.create_run() for NFT-token games.

use core::num::traits::Zero;
use dojo::event::EventStorage;
use dojo::model::ModelStorage;
use dojo::world::{WorldStorage, WorldStorageTrait};
use starknet::{ContractAddress, get_block_timestamp};
use zkube::elements::tasks::index::Task;
use zkube::elements::tasks::interface::TaskTrait;
use zkube::events::StartGame;
use zkube::external::zstar_token::{IZStarTokenDispatcher, IZStarTokenDispatcherTrait};
use zkube::helpers::config::ConfigUtilsTrait;
use zkube::helpers::game_libs::{
    GameLibsImpl, IGridSystemDispatcherTrait, ILevelSystemDispatcherTrait,
};
use zkube::helpers::mutator::MutatorEffectsTrait;
use zkube::helpers::random::RandomImpl;
use zkube::models::config::GameSettingsMetadata;
use zkube::models::entitlement::ZoneEntitlement;
use zkube::models::game::{GameSeed, GameTrait};
use zkube::models::mutator::MutatorDef;
use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
use zkube::models::story::{StoryZoneProgress, StoryZoneProgressTrait};
use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};
use zkube::systems::progress::{IProgressSystemDispatcher, IProgressSystemDispatcherTrait};

/// Create a new NFT-token game (non-daily). Handles settings lookup,
/// entitlement gating, seed generation, mutator/bonus selection, player meta update,
/// and grid/level initialization via dispatchers.
/// Daily games are created exclusively through start_daily_game() in daily_challenge_system.
pub fn create_game(
    ref world: WorldStorage,
    game_id: felt252,
    run_type: u8,
    player: ContractAddress,
    vrf_address: ContractAddress,
) {
    let run_type_val: u8 = run_type & 0x1;

    let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

    if run_type_val == 1 {
        // Endless gating: require boss clear for the zone this settings belongs to.
        // zone_id=0 means no zone gating (custom settings without restriction).
        let zone_for_endless = settings.zone_id;
        if zone_for_endless > 0 {
            let progress: StoryZoneProgress = world.read_model((player, zone_for_endless));
            assert!(progress.exists() && progress.boss_cleared, "Clear story zone first");
        }
    }

    // === MAP ACCESS GATE ===
    let metadata: GameSettingsMetadata = world.read_model(settings.settings_id);
    if !metadata.is_free {
        let entitlement: ZoneEntitlement = world.read_model((player, settings.settings_id));
        assert!(entitlement.purchased_at != 0, "Zone not unlocked - unlock this zone first");
    }

    // Generate seed via VRF or pseudo-random.
    let vrf_on = !vrf_address.is_zero();
    let random = if vrf_address.is_zero() {
        RandomImpl::new_pseudo_random()
    } else {
        RandomImpl::new_vrf(game_id)
    };
    let (seed, vrf_enabled) = (random.seed, vrf_on);
    // Read bonus config from the active mutator
    let active_mut_id = settings.active_mutator_id;
    let bonus_mutator_def: MutatorDef = if active_mut_id > 0 {
        world.read_model(active_mut_id)
    } else {
        MutatorEffectsTrait::neutral(0)
    };
    let seed_u256: u256 = seed.into();
    let (bonus_slot, bonus_type, starting_charges) = select_bonus_slot(
        seed_u256, @bonus_mutator_def,
    );

    let timestamp = get_block_timestamp();

    // Store passive mutator in RunData for stat effects during gameplay
    let passive_mut_id = settings.passive_mutator_id;
    let mut game = GameTrait::new_empty(game_id, timestamp, 0, passive_mut_id, run_type_val);
    let mut run_data = game.get_run_data();
    run_data.bonus_slot = bonus_slot;
    run_data.bonus_type = bonus_type;
    run_data.bonus_charges = if starting_charges > 15 {
        15
    } else {
        starting_charges
    };
    game.set_run_data(run_data);

    // Store the seed separately
    let game_seed = GameSeed { game_id, seed, level_seed: seed, vrf_enabled };
    world.write_model(@game_seed);

    // Initialize or update player meta
    let mut player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        player_meta = PlayerMetaTrait::new(player);
    } else if player_meta.last_active > 0 && timestamp - player_meta.last_active > 604800 {
        match world.dns_address(@"config_system") {
            Option::Some(config_address) => {
                let config_dispatcher = IConfigSystemDispatcher {
                    contract_address: config_address,
                };
                let zstar_address = config_dispatcher.get_zstar_address();
                if !zstar_address.is_zero() {
                    let zstar = IZStarTokenDispatcher { contract_address: zstar_address };
                    zstar.mint(player, 5);
                }
            },
            Option::None => {},
        }
        player_meta.increment_xp(500);
    }

    let libs = GameLibsImpl::new(world);

    world.write_model(@game);

    player_meta.increment_runs();
    player_meta.last_active = timestamp;
    world.write_model(@player_meta);

    // Emit quest/achievement progress via progress_system
    match world.dns_address(@"progress_system") {
        Option::Some(progress_addr) => {
            let progress = IProgressSystemDispatcher { contract_address: progress_addr };
            progress.emit_progress(player, Task::GameStart.identifier(), 1, settings.settings_id);
        },
        Option::None => {},
    }

    // Emit start game event
    world.emit_event(@StartGame { player, timestamp, game_id });

    // Initialize run-type-specific level config, then grid.
    if run_type_val == 1 {
        libs.level.initialize_endless_level(game_id);
    } else {
        libs.level.initialize_level(game_id);
    }
    libs.grid.initialize_grid(game_id);
}

/// Select a bonus slot from the active mutator's non-None bonus slots.
/// Returns (bonus_slot, bonus_type, starting_charges).
fn select_bonus_slot(seed_u256: u256, mutator_def: @MutatorDef) -> (u8, u8, u8) {
    let mut count: u8 = 0;
    if *mutator_def.bonus_1_type > 0 {
        count += 1;
    }
    if *mutator_def.bonus_2_type > 0 {
        count += 1;
    }
    if *mutator_def.bonus_3_type > 0 {
        count += 1;
    }
    if count == 0 {
        return (0, 0, 0);
    }

    let pick: u8 = (seed_u256 % count.into()).try_into().unwrap();
    let mut found: u8 = 0;

    if *mutator_def.bonus_1_type > 0 {
        if found == pick {
            return (0, *mutator_def.bonus_1_type, *mutator_def.bonus_1_starting_charges);
        }
        found += 1;
    }
    if *mutator_def.bonus_2_type > 0 {
        if found == pick {
            return (1, *mutator_def.bonus_2_type, *mutator_def.bonus_2_starting_charges);
        }
        found += 1;
    }
    if *mutator_def.bonus_3_type > 0 {
        if found == pick {
            return (2, *mutator_def.bonus_3_type, *mutator_def.bonus_3_starting_charges);
        }
    }

    (0, 0, 0)
}
