mod setup {
    // Core imports

    use core::debug::PrintTrait;

    // Starknet imports

    use starknet::ContractAddress;
    use starknet::testing::{set_contract_address, set_caller_address};

    // Dojo imports

    use dojo::world::{IWorldDispatcherTrait, IWorldDispatcher};
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    // External dependencies

    use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

    // Internal imports

    use zkube::models::game::{Game, GameTrait};
    use zkube::models::player::Player;
    use zkube::systems::actions::{actions, IActions, IActionsDispatcher, IActionsDispatcherTrait};

    // Constants

    fn PLAYER() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER'>()
    }

    const PLAYER_NAME: felt252 = 'PLAYER';

    #[derive(Drop)]
    struct Systems {
        actions: IActionsDispatcher,
    }

    #[derive(Drop)]
    struct Context {
        player_id: felt252,
        player_name: felt252,
        game_id: u32,
    }

    #[inline(always)]
    fn spawn_game() -> (IWorldDispatcher, Systems, Context) {
        // [Setup] World
        let mut models = core::array::ArrayTrait::new();
        models.append(zkube::models::index::game::TEST_CLASS_HASH);
        models.append(zkube::models::index::player::TEST_CLASS_HASH);
        let world = spawn_test_world(models);

        // [Setup] Systems
        let actions_address = deploy_contract(actions::TEST_CLASS_HASH, array![].span());
        let systems = Systems {
            actions: IActionsDispatcher { contract_address: actions_address },
        };

        // [Setup] Context
        set_contract_address(PLAYER());
        systems.actions.create(world, PLAYER_NAME);

        // [Setup] Game if mode is set
        let proof = Proof {
            gamma: Point {
                x: 3444596426869008043602370726459741399042335986798810610561332574893421899427,
                y: 2123064846425363891663217062216262307893599982125329045727025672352245240380
            },
            c: 1009013861275206330536599757704085446828267833031347631539467302052051465831,
            s: 1681627904985955485699279892692743421296426964282826567194146317024516561994,
            sqrt_ratio_hint: 2419289110723846757845450895535193600906321980090223281508354504968416532707,
        };
        let seed = 48;
        let beta = 502998338520997804786462808944365626190955582373168748079635287864535203785;
        let game_id = systems.actions.start(world, proof, seed, beta);

        let context = Context {
            player_id: PLAYER().into(), player_name: PLAYER_NAME, game_id: game_id,
        };

        // [Return]
        (world, systems, context)
    }
}
