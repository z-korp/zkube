use starknet::ContractAddress;
use zkube::models::daily::DailyEntry;

#[starknet::interface]
pub trait IDailyChallengeSystem<T> {
    // === Admin ===

    /// Create a new daily challenge (admin only)
    /// @param settings_id: Map GameSettings ID for this challenge
    /// @param ranking_metric: legacy reserved field (unused)
    /// @param zone_id: Encodes game_mode (0=Map, 1=Endless) for backward compatibility
    /// @param mutator_id: Legacy reserved parameter (unused)
    /// @param prize_amount: LORDS to deposit as prize pool
    fn create_daily_challenge(
        ref self: T,
        settings_id: u32,
        ranking_metric: u8,
        zone_id: u8,
        mutator_id: u8,
        prize_amount: u256,
    );

    /// Settle a completed challenge -- compute prizes for top N players (admin only)
    /// @param challenge_id: The challenge to settle
    fn settle_challenge(ref self: T, challenge_id: u32);

    /// Withdraw unclaimed prizes after grace period (admin only)
    /// @param challenge_id: The settled challenge
    /// Grace period: 30 days after settlement
    fn withdraw_unclaimed(ref self: T, challenge_id: u32);

    // === Player ===

    /// Register an entry for a daily challenge (burns 1 zTicket)
    /// First registration creates the entry; subsequent ones add attempts
    /// @param challenge_id: The challenge to enter
    fn register_entry(ref self: T, challenge_id: u32);

    /// Submit a game result for a daily challenge (backup for auto-submit)
    /// Updates player's best scores if this run beats previous best
    /// @param challenge_id: The challenge
    /// @param game_id: The completed game to submit
    fn submit_result(ref self: T, challenge_id: u32, game_id: felt252);

    /// Claim prize for a settled challenge
    /// @param challenge_id: The challenge to claim from
    fn claim_prize(ref self: T, challenge_id: u32);

    // === Views ===

    /// Get the current active challenge ID (0 if none)
    fn get_current_challenge(self: @T) -> u32;

    /// Get a player's entry for a challenge
    fn get_player_entry(self: @T, challenge_id: u32, player: ContractAddress) -> DailyEntry;
}

/// Minimal ERC20 interface for LORDS transfer_from / transfer
#[starknet::interface]
pub trait IERC20Minimal<T> {
    fn transfer_from(
        ref self: T, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn transfer(ref self: T, recipient: ContractAddress, amount: u256) -> bool;
}

/// zTicket burn interface (authorized burn)
#[starknet::interface]
pub trait IZTicketBurn<T> {
    fn burn_from(ref self: T, account: ContractAddress, amount: u256);
}

#[dojo::contract]
mod daily_challenge_system {
    use core::num::traits::Zero;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::helpers::{daily, prize};
    use zkube::models::daily::{
        DailyChallenge, DailyChallengeTrait, DailyEntry, DailyEntryTrait, DailyLeaderboard,
        GameChallenge,
    };
    use zkube::models::game::{Game, GameTrait};
    use super::{
        IERC20MinimalDispatcher, IERC20MinimalDispatcherTrait, IZTicketBurnDispatcher,
        IZTicketBurnDispatcherTrait,
    };

    /// Grace period after settlement before admin can withdraw unclaimed prizes (30 days)
    const WITHDRAWAL_GRACE_PERIOD: u64 = 2_592_000; // 30 * 24 * 60 * 60

    #[storage]
    struct Storage {
        /// Auto-incrementing challenge ID counter
        next_challenge_id: u32,
        /// Admin address (can create challenges and settle them)
        admin_address: ContractAddress,
        /// zTicket ERC1155 contract address
        ticket_address: ContractAddress,
        /// LORDS ERC20 contract address
        lords_address: ContractAddress,
    }

    fn dojo_init(
        ref self: ContractState,
        admin_address: ContractAddress,
        ticket_address: ContractAddress,
        lords_address: ContractAddress,
    ) {
        assert!(!admin_address.is_zero(), "Admin address cannot be zero");
        self.next_challenge_id.write(1);
        self.admin_address.write(admin_address);
        self.ticket_address.write(ticket_address);
        self.lords_address.write(lords_address);
    }

    #[abi(embed_v0)]
    impl DailyChallengeImpl of super::IDailyChallengeSystem<ContractState> {
        fn create_daily_challenge(
            ref self: ContractState,
            settings_id: u32,
            ranking_metric: u8,
            zone_id: u8,
            mutator_id: u8,
            prize_amount: u256,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();

            // Admin-only
            self.assert_admin(caller);

            // Legacy reserved parameter; ranking is mode-aware and derived from game_mode.
            let _ = ranking_metric;
            // Backward-compatible parameter mapping:
            // - zone_id now carries game_mode (0=Map, 1=Endless)
            // - settings_id is the actual map settings id
            let game_mode: u8 = zone_id & 0x1;
            let map_settings_id: u32 = settings_id;
            // Kept in interface for backward compatibility; no longer stored on model.
            let _ = mutator_id;

            // Assign challenge ID
            let challenge_id = self.next_challenge_id.read();
            self.next_challenge_id.write(challenge_id + 1);

            // Fixed 24h window from creation
            let start_time = timestamp;
            let end_time = timestamp + 86400;

            // Transfer LORDS from caller to this contract as prize pool
            if prize_amount > 0 {
                let lords = IERC20MinimalDispatcher { contract_address: self.lords_address.read() };
                let success = lords.transfer_from(caller, get_contract_address(), prize_amount);
                assert!(success, "LORDS transfer failed");
            }

            // Generate shared seed from challenge parameters
            // On mainnet/sepolia, this could be enhanced with VRF
            let seed = core::poseidon::poseidon_hash_span(
                array![challenge_id.into(), timestamp.into(), 'DAILY_CHALLENGE'].span(),
            );

            let challenge = DailyChallenge {
                challenge_id,
                settings_id,
                seed,
                start_time,
                end_time,
                total_entries: 0,
                prize_pool: prize_amount,
                settled: false,
                game_mode,
                map_settings_id,
            };
            world.write_model(@challenge);
        }

        fn settle_challenge(ref self: ContractState, challenge_id: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();

            // Admin-only
            self.assert_admin(caller);

            let mut challenge: DailyChallenge = world.read_model(challenge_id);
            assert!(challenge.exists(), "Challenge does not exist");
            assert!(challenge.has_ended(timestamp), "Challenge has not ended yet");
            assert!(!challenge.settled, "Challenge already settled");

            // Calculate number of winners based on unique players
            let num_winners = prize::calculate_num_winners(challenge.total_entries);
            let capped_winners = if num_winners > daily::MAX_LEADERBOARD_SIZE {
                daily::MAX_LEADERBOARD_SIZE
            } else {
                num_winners
            };

            // Calculate and write prizes for each winner
            if capped_winners > 0 && challenge.prize_pool > 0 {
                let prizes = prize::calculate_all_prizes(capped_winners, challenge.prize_pool);
                let mut i: u32 = 0;
                while i < prizes.len() {
                    let (rank, prize_amount) = *prizes.at(i);

                    // Read leaderboard entry for this rank
                    let lb: DailyLeaderboard = world.read_model((challenge_id, rank));
                    if lb.player.is_non_zero() {
                        // Write prize to player's entry
                        let mut entry: DailyEntry = world.read_model((challenge_id, lb.player));
                        entry.rank = rank;
                        entry.prize_amount = prize_amount;
                        world.write_model(@entry);
                    }

                    i += 1;
                };
            }

            challenge.settled = true;
            world.write_model(@challenge);
        }

        fn withdraw_unclaimed(ref self: ContractState, challenge_id: u32) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();

            // Admin-only
            self.assert_admin(caller);

            let challenge: DailyChallenge = world.read_model(challenge_id);
            assert!(challenge.exists(), "Challenge does not exist");
            assert!(challenge.settled, "Challenge not yet settled");
            assert!(
                timestamp >= challenge.end_time + WITHDRAWAL_GRACE_PERIOD,
                "Grace period not yet elapsed (30 days after challenge end)",
            );

            // Calculate total claimed prizes
            let num_winners = prize::calculate_num_winners(challenge.total_entries);
            let capped_winners = if num_winners > daily::MAX_LEADERBOARD_SIZE {
                daily::MAX_LEADERBOARD_SIZE
            } else {
                num_winners
            };

            let mut total_claimed: u256 = 0;
            let mut rank: u32 = 1;
            while rank <= capped_winners {
                let lb: DailyLeaderboard = world.read_model((challenge_id, rank));
                if lb.player.is_non_zero() {
                    let entry: DailyEntry = world.read_model((challenge_id, lb.player));
                    if entry.claimed {
                        total_claimed += entry.prize_amount;
                    }
                }
                rank += 1;
            }

            let unclaimed = if challenge.prize_pool > total_claimed {
                challenge.prize_pool - total_claimed
            } else {
                0
            };

            assert!(unclaimed > 0, "No unclaimed prizes to withdraw");

            // Transfer unclaimed LORDS back to admin
            let lords = IERC20MinimalDispatcher { contract_address: self.lords_address.read() };
            let success = lords.transfer(caller, unclaimed);
            assert!(success, "LORDS withdrawal transfer failed");
        }

        fn register_entry(ref self: ContractState, challenge_id: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();
            let timestamp = get_block_timestamp();

            let challenge: DailyChallenge = world.read_model(challenge_id);
            assert!(challenge.exists(), "Challenge does not exist");
            assert!(challenge.is_active(timestamp), "Challenge is not active");

            // Burn 1 zTicket from player
            let ticket = IZTicketBurnDispatcher { contract_address: self.ticket_address.read() };
            ticket.burn_from(player, 1);

            // Read existing entry (zero model if first time)
            let mut entry: DailyEntry = world.read_model((challenge_id, player));
            let is_first_registration = !entry.exists();

            // Update entry
            entry.challenge_id = challenge_id;
            entry.player = player;
            entry.attempts += 1;
            world.write_model(@entry);

            // Only increment total_entries for unique players (first registration)
            // This ensures prize distribution N = ceil(unique_players / 4) is accurate
            if is_first_registration {
                let mut challenge_mut: DailyChallenge = world.read_model(challenge_id);
                challenge_mut.total_entries += 1;
                world.write_model(@challenge_mut);
            }
        }

        fn submit_result(ref self: ContractState, challenge_id: u32, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            let challenge: DailyChallenge = world.read_model(challenge_id);
            assert!(challenge.exists(), "Challenge does not exist");
            assert!(!challenge.settled, "Challenge already settled");

            let mut entry: DailyEntry = world.read_model((challenge_id, player));
            assert!(entry.exists(), "Player has no entry for this challenge");

            // Verify game exists and is over
            let game: Game = world.read_model(game_id);
            assert!(game.over, "Game is not over yet");

            // Verify game belongs to this challenge via GameChallenge mapping
            let game_challenge: GameChallenge = world.read_model(game_id);
            assert!(
                game_challenge.challenge_id == challenge_id,
                "Game does not belong to this challenge",
            );

            // Extract metrics from game run_data
            let run_data = game.get_run_data();
            let score: u16 = if run_data.total_score > 65535 {
                65535
            } else {
                run_data.total_score.try_into().unwrap()
            };
            let level = run_data.current_level;
            let depth = run_data.current_difficulty;

            // Mode-aware ranking:
            // - Map: total_stars * 65536 + total_score
            // - Endless: total_score
            let mode = challenge.game_mode;
            let stars = if mode == 0 {
                InternalImpl::calculate_total_stars(game)
            } else {
                0
            };
            let ranking_value: u32 = InternalImpl::compute_ranking_value(mode, stars, score);

            // Check if this beats the player's current best
            let current_best: u32 = if mode == 1 {
                entry.best_score.into()
            } else {
                let best_stars = if entry.best_game_id == 0 {
                    0
                } else {
                    let best_game: Game = world.read_model(entry.best_game_id);
                    InternalImpl::calculate_total_stars(best_game)
                };
                InternalImpl::compute_ranking_value(0, best_stars, entry.best_score)
            };

            if ranking_value > current_best {
                // Update entry with new bests
                entry.best_score = score;
                entry.best_level = level;
                entry.best_depth = depth;
                entry.best_game_id = game_id;
                world.write_model(@entry);

                // Update leaderboard via shared helper
                daily::update_daily_leaderboard(ref world, challenge_id, player, ranking_value);
            }
        }

        fn claim_prize(ref self: ContractState, challenge_id: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            let challenge: DailyChallenge = world.read_model(challenge_id);
            assert!(challenge.exists(), "Challenge does not exist");
            assert!(challenge.settled, "Challenge not yet settled");

            let mut entry: DailyEntry = world.read_model((challenge_id, player));
            assert!(entry.exists(), "Player has no entry");
            assert!(!entry.claimed, "Prize already claimed");
            assert!(entry.prize_amount > 0, "No prize to claim");

            entry.claimed = true;
            world.write_model(@entry);

            // Transfer LORDS from contract to winner
            let lords = IERC20MinimalDispatcher { contract_address: self.lords_address.read() };
            let success = lords.transfer(player, entry.prize_amount);
            assert!(success, "LORDS transfer to winner failed");
        }

        fn get_current_challenge(self: @ContractState) -> u32 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let timestamp = get_block_timestamp();

            // Check the most recent challenge (there's typically only one active)
            let latest_id = self.next_challenge_id.read();
            if latest_id <= 1 {
                return 0;
            }

            let check_id = latest_id - 1;
            let challenge: DailyChallenge = world.read_model(check_id);
            if challenge.exists() && challenge.is_active(timestamp) {
                return check_id;
            }

            0
        }

        fn get_player_entry(
            self: @ContractState, challenge_id: u32, player: ContractAddress,
        ) -> DailyEntry {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model((challenge_id, player))
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Compute ranking value by mode.
        /// - Map: total_stars * 65536 + total_score
        /// - Endless: total_score
        #[inline(always)]
        fn compute_ranking_value(mode: u8, total_stars: u8, total_score: u16) -> u32 {
            if mode == 1 {
                total_score.into()
            } else {
                total_stars.into() * 65536 + total_score.into()
            }
        }

        /// Sum stars across map levels 1..10.
        fn calculate_total_stars(game: Game) -> u8 {
            let mut stars: u8 = 0;
            let mut level: u8 = 1;
            while level <= 10 {
                stars += game.get_level_stars(level);
                level += 1;
            }
            stars
        }

        /// Assert caller is admin
        #[inline(always)]
        fn assert_admin(self: @ContractState, caller: ContractAddress) {
            let admin = self.admin_address.read();
            assert!(caller == admin, "Caller is not admin");
        }
    }
}
