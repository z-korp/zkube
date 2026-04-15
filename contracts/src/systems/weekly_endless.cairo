use starknet::ContractAddress;

#[starknet::interface]
pub trait IWeeklyEndlessSystem<T> {
    /// Settle the weekly endless leaderboard for a specific zone's endless settings.
    /// `ranked_players` must be sorted by all-time `PlayerBestRun.best_score` descending
    /// (verified on-chain). Tournament settings are rejected — those are settled by
    /// Budokan at the metagame layer.
    fn settle_weekly_endless(
        ref self: T, week_id: u32, settings_id: u32, ranked_players: Span<ContractAddress>,
    );
}

#[dojo::contract]
mod weekly_endless_system {
    use core::num::traits::Zero;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use starknet::{ContractAddress, get_block_timestamp};
    use zkube::constants::DEFAULT_NS;
    use zkube::helpers::{economy, weekly};
    use zkube::models::config::{GameSettingsMetadata, RewardKind, RewardTiers};
    use zkube::models::player::PlayerBestRun;
    use zkube::models::weekly::{WeeklyEndless, current_week_id};

    #[abi(embed_v0)]
    impl WeeklyEndlessImpl of super::IWeeklyEndlessSystem<ContractState> {
        fn settle_weekly_endless(
            ref self: ContractState,
            week_id: u32,
            settings_id: u32,
            ranked_players: Span<ContractAddress>,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Tournament settings are not eligible for weekly endless settlement —
            // their rewards are distributed by Budokan at the metagame layer.
            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            assert!(!metadata.is_tournament, "Cannot settle tournament as weekly endless");

            let timestamp = get_block_timestamp();
            let current_week = current_week_id(timestamp);
            assert!(week_id < current_week, "Week has not ended yet");

            // Composite key (week_id * 1000 + settings_id) tracks per-zone settlement.
            let settlement_key: u32 = week_id * 1000 + settings_id;
            let mut weekly_meta: WeeklyEndless = world.read_model(settlement_key);
            assert!(!weekly_meta.settled, "Already settled for this week + zone");

            let len: u32 = ranked_players.len();
            assert!(len <= weekly::MAX_RANKED_PLAYERS, "Too many ranked players");

            // Verify descending order by all-time PB and distribute rewards.
            let mut prev_score: u32 = 0xFFFFFFFF;
            let mut rank: u32 = 1;
            while rank <= len {
                let player = *ranked_players.at(rank - 1);
                assert!(player.is_non_zero(), "Zero address in ranked list");

                let best_run: PlayerBestRun = world.read_model((player, settings_id, 1_u8));
                assert!(best_run.best_score > 0, "Player has no PB for this endless");
                assert!(best_run.best_score <= prev_score, "Invalid ranking order");
                prev_score = best_run.best_score;

                let star_reward = InternalImpl::compute_weekly_star_reward(@world, rank, len);
                if star_reward > 0 {
                    economy::mint_zstar(ref world, player, star_reward.into());
                }

                rank += 1;
            }

            weekly_meta.week_id = settlement_key;
            weekly_meta.total_participants = len;
            weekly_meta.settled = true;
            world.write_model(@weekly_meta);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Read configurable weekly reward magnitudes, falling back to the
        /// shipped defaults `(30, 20, 15, 10, 3)` when no `RewardTiers` row
        /// has been written yet (every field zero).
        fn read_weekly_tiers(world: @WorldStorage) -> (u64, u64, u64, u64, u64) {
            let cfg: RewardTiers = world.read_model(RewardKind::WEEKLY);
            if cfg.tier_0 == 0
                && cfg.tier_1 == 0
                && cfg.tier_2 == 0
                && cfg.tier_3 == 0
                && cfg.tier_4 == 0 {
                (30_u64, 20, 15, 10, 3)
            } else {
                (
                    cfg.tier_0.into(),
                    cfg.tier_1.into(),
                    cfg.tier_2.into(),
                    cfg.tier_3.into(),
                    cfg.tier_4.into(),
                )
            }
        }

        fn compute_weekly_star_reward(
            world: @WorldStorage, rank: u32, total_participants: u32,
        ) -> u64 {
            if total_participants == 0 {
                return 0;
            }
            let (t0, t1, t2, t3, t4) = Self::read_weekly_tiers(world);
            let percentile_x100: u32 = ((rank - 1) * 100) / total_participants;
            if percentile_x100 < 2 {
                t0
            } else if percentile_x100 < 5 {
                t1
            } else if percentile_x100 < 10 {
                t2
            } else if percentile_x100 < 25 {
                t3
            } else if percentile_x100 < 50 {
                t4
            } else {
                0
            }
        }
    }
}
