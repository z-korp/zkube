mod setup {
    // Core imports

    use core::traits::Into;
    use core::debug::PrintTrait;

    // Starknet imports

    use starknet::ContractAddress;
    use starknet::testing::{set_contract_address, set_caller_address};
    use starknet::info::{get_contract_address, get_caller_address, get_block_timestamp};

    // Dojo imports

    use dojo::world::{WorldStorageTrait, WorldStorage};
    use dojo_cairo_test::{spawn_test_world, NamespaceDef, TestResource, ContractDefTrait};
    use dojo::model::Model;

    // External dependencies

    use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

    // Internal imports

    use zkube::constants;
    use zkube::models::game::{Game, m_Game, GameTrait, GameImpl};
    use zkube::models::settings::{Settings, m_Settings};
    use zkube::models::player::{Player, m_Player};
    use zkube::models::tournament::{Tournament, m_Tournament};
    use zkube::models::chest::{Chest, m_Chest};
    use zkube::models::admin::{Admin, m_Admin};
    use zkube::models::mint::{Mint, m_Mint};
    use zkube::models::participation::{Participation, m_Participation};

    use zkube::types::difficulty::Difficulty;
    use zkube::types::mode::Mode;
    use zkube::tests::mocks::erc20::{
        IERC20Dispatcher, IERC20DispatcherTrait, IERC20FaucetDispatcher,
        IERC20FaucetDispatcherTrait, ERC20
    };
    use zkube::systems::account::{account, IAccountDispatcher, IAccountDispatcherTrait};
    use zkube::systems::play::{play, IPlayDispatcher, IPlayDispatcherTrait};
    use zkube::systems::chest::{chest, IChestDispatcher, IChestDispatcherTrait};
    use zkube::systems::settings::{settings, ISettingsDispatcher, ISettingsDispatcherTrait};
    use zkube::systems::tournament::{
        tournament, ITournamentSystemDispatcher, ITournamentSystemDispatcherTrait
    };
    use zkube::systems::zkorp::{zkorp, IZKorpDispatcher, IZKorpDispatcherTrait};
    use zkube::systems::minter::{minter, IMinterDispatcher, IMinterDispatcherTrait};

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
        settings: ISettingsDispatcher,
        chest: IChestDispatcher,
        tournament: ITournamentSystemDispatcher,
        zkorp: IZKorpDispatcher,
        minter: IMinterDispatcher,
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
        play_address: ContractAddress,
        tournament_address: ContractAddress,
        zkorp_address: ContractAddress,
        chest_address: ContractAddress,
        account_address: ContractAddress,
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

    fn namespace_def(erc20_address: felt252, admin_address: felt252) -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: "zkube", resources: [
                TestResource::Model(m_Admin::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Chest::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Game::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Participation::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Player::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Settings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Tournament::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Mint::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Contract(
                    ContractDefTrait::new(account::TEST_CLASS_HASH, "account")
                        .with_writer_of([dojo::utils::bytearray_hash(@"zkube")].span())
                ),
                TestResource::Contract(
                    ContractDefTrait::new(play::TEST_CLASS_HASH, "play")
                        .with_writer_of([dojo::utils::bytearray_hash(@"zkube")].span())
                ),
                TestResource::Contract(
                    ContractDefTrait::new(chest::TEST_CLASS_HASH, "chest")
                        .with_writer_of([dojo::utils::bytearray_hash(@"zkube")].span())
                        .with_init_calldata([erc20_address].span())
                ),
                TestResource::Contract(
                    ContractDefTrait::new(settings::TEST_CLASS_HASH, "settings")
                        .with_writer_of([dojo::utils::bytearray_hash(@"zkube")].span())
                        .with_init_calldata([admin_address].span())
                ),
                TestResource::Contract(
                    ContractDefTrait::new(tournament::TEST_CLASS_HASH, "tournament")
                        .with_writer_of([dojo::utils::bytearray_hash(@"zkube")].span())
                        .with_init_calldata([erc20_address].span())
                ),
                TestResource::Contract(
                    ContractDefTrait::new(zkorp::TEST_CLASS_HASH, "zkorp")
                        .with_writer_of([dojo::utils::bytearray_hash(@"zkube")].span())
                        .with_init_calldata([erc20_address].span())
                ),
                TestResource::Contract(
                    ContractDefTrait::new(minter::TEST_CLASS_HASH, "minter")
                        .with_writer_of([dojo::utils::bytearray_hash(@"zkube")].span())
                ),
            ].span()
        };

        ndef
    }

    #[inline(always)]
    fn create_accounts() -> (WorldStorage, Systems, Context) {
        let owner = get_contract_address();

        let erc20 = deploy_erc20();

        // [Setup] World
        let ndef = namespace_def(erc20.contract_address.into(), PLAYER1().into());
        let mut world = spawn_test_world([ndef].span());

        // [Setup] SystemsDrop
        let (account_address, _) = world.dns(@"account").unwrap();
        let (play_address, _) = world.dns(@"play").unwrap();
        let (settings_address, _) = world.dns(@"settings").unwrap();
        let (chest_address, _) = world.dns(@"chest").unwrap();
        let (tournament_address, _) = world.dns(@"tournament").unwrap();
        let (zkorp_address, _) = world.dns(@"zkorp").unwrap();
        let (minter_address, _) = world.dns(@"minter").unwrap();

        let systems = Systems {
            account: IAccountDispatcher { contract_address: account_address },
            play: IPlayDispatcher { contract_address: play_address },
            settings: ISettingsDispatcher { contract_address: settings_address },
            chest: IChestDispatcher { contract_address: chest_address },
            tournament: ITournamentSystemDispatcher { contract_address: tournament_address },
            zkorp: IZKorpDispatcher { contract_address: zkorp_address },
            minter: IMinterDispatcher { contract_address: minter_address },
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
            play_address,
            tournament_address,
            zkorp_address,
            chest_address,
            account_address,
        };

        // [Set] Caller back to owner
        set_contract_address(context.owner);

        // [Return]
        (world, systems, context)
    }
}
