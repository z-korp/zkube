mod setup {
    // Core imports

    use core::traits::Into;
    use core::debug::PrintTrait;

    // Starknet imports

    use starknet::ContractAddress;
    use starknet::testing::{set_contract_address, set_caller_address};
    use starknet::info::{get_contract_address, get_caller_address, get_block_timestamp};

    // Dojo imports

    use dojo::world::{IWorldDispatcherTrait, IWorldDispatcher};
    use dojo::utils::test::{spawn_test_world, deploy_contract};
    use dojo::model::Model;

    // External dependencies

    use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

    // Internal imports

    use zkube::constants;
    use zkube::models::game::{Game, GameTrait, GameImpl};
    use zkube::models::settings::Settings;
    use zkube::models::player::Player;
    use zkube::models::tournament::Tournament;
    use zkube::types::difficulty::Difficulty;
    use zkube::types::mode::Mode;
    use zkube::systems::account::{account, IAccountDispatcher, IAccountDispatcherTrait};
    use zkube::tests::mocks::erc20::{
        IERC20Dispatcher, IERC20DispatcherTrait, IERC20FaucetDispatcher,
        IERC20FaucetDispatcherTrait, ERC20
    };
    use zkube::systems::play::{play, IPlayDispatcher, IPlayDispatcherTrait};

    #[starknet::interface]
    trait IDojoInit<ContractState> {
        fn dojo_init(self: @ContractState, token_address: ContractAddress,) -> felt252;
    }

    // Constants

    fn PLAYER1() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER1'>()
    }
    const PLAYER1_NAME: felt252 = 'PLAYER1';

    fn PLAYER2() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER2'>()
    }
    const PLAYER2_NAME: felt252 = 'PLAYER2';

    fn PLAYER3() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER3'>()
    }
    const PLAYER3_NAME: felt252 = 'PLAYER3';

    fn PLAYER4() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER4'>()
    }
    const PLAYER4_NAME: felt252 = 'PLAYER4';


    #[derive(Drop)]
    struct Systems {
        account: IAccountDispatcher,
        play: IPlayDispatcher,
    }

    #[derive(Drop)]
    struct Context {
        owner: ContractAddress,
        player1_id: felt252,
        player1_name: felt252,
        player2_id: felt252,
        player2_name: felt252,
        player3_id: felt252,
        player3_name: felt252,
        player4_id: felt252,
        player4_name: felt252,
        erc20: IERC20Dispatcher,
        proof: Proof,
        seed: felt252,
        beta: felt252,
    }

    fn deploy_erc20() -> IERC20Dispatcher {
        let (address, _) = starknet::deploy_syscall(
            ERC20::TEST_CLASS_HASH.try_into().expect('Class hash conversion failed'),
            0,
            array![].span(),
            false
        )
            .expect('ERC20 deploy failed');
        IERC20Dispatcher { contract_address: address }
    }

    #[inline(always)]
    fn create_accounts() -> (IWorldDispatcher, Systems, Context) {
        let owner = get_contract_address();

        // [Setup] World
        let mut models = core::array::ArrayTrait::new();
        models.append(zkube::models::index::game::TEST_CLASS_HASH);
        models.append(zkube::models::index::player::TEST_CLASS_HASH);
        models.append(zkube::models::index::tournament::TEST_CLASS_HASH);
        models.append(zkube::models::index::credits::TEST_CLASS_HASH);
        models.append(zkube::models::index::settings::TEST_CLASS_HASH);
        let world = spawn_test_world(["zkube"].span(), models.span());

        let erc20 = deploy_erc20();

        // [Setup] SystemsDrop
        let account_address = world
            .deploy_contract('account', account::TEST_CLASS_HASH.try_into().unwrap());
        let play_address = world.deploy_contract('play', play::TEST_CLASS_HASH.try_into().unwrap());

        // [Setup] Permissions
        world.grant_writer(dojo::utils::bytearray_hash(@"zkube"), account_address);
        world.grant_writer(dojo::utils::bytearray_hash(@"zkube"), play_address);
        //world.grant_writer(selector_from_tag!("zkube-Settings"), play_address);
        //world.grant_writer(Model::<Settings>::selector(), play_address);

        // [Setup] Contract
        let selector = selector_from_tag!("zkube-play");
        world.init_contract(selector, array![erc20.contract_address.into()].span());

        let systems = Systems {
            account: IAccountDispatcher { contract_address: account_address },
            play: IPlayDispatcher { contract_address: play_address },
        };

        // [Setup] Context
        let faucet = IERC20FaucetDispatcher { contract_address: erc20.contract_address };

        set_contract_address(PLAYER1());
        faucet.mint();
        erc20.approve(play_address, ERC20::FAUCET_AMOUNT);
        systems.account.create(PLAYER1_NAME);

        set_contract_address(PLAYER2());
        faucet.mint();
        erc20.approve(play_address, ERC20::FAUCET_AMOUNT);
        systems.account.create(PLAYER2_NAME);

        set_contract_address(PLAYER3());
        faucet.mint();
        erc20.approve(play_address, ERC20::FAUCET_AMOUNT);
        systems.account.create(PLAYER3_NAME);

        set_contract_address(PLAYER4());
        faucet.mint();
        erc20.approve(play_address, ERC20::FAUCET_AMOUNT);
        systems.account.create(PLAYER4_NAME);

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

        let context = Context {
            owner: owner,
            player1_id: PLAYER1().into(),
            player1_name: PLAYER1_NAME,
            player2_id: PLAYER2().into(),
            player2_name: PLAYER2_NAME,
            player3_id: PLAYER3().into(),
            player3_name: PLAYER3_NAME,
            player4_id: PLAYER4().into(),
            player4_name: PLAYER4_NAME,
            erc20: erc20,
            proof: proof,
            seed: seed,
            beta: beta,
        };

        // [Set] Caller back to owner
        set_contract_address(context.owner);

        // [Return]
        (world, systems, context)
    }
}
