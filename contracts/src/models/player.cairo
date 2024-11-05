// Core imports
use core::traits::Into;

// External imports
use alexandria_math::bitmap::Bitmap;

// Inernal imports
use zkube::constants::{
    SECONDS_PER_DAY, MULTIPLIER_SCALE, STREAK_1_7_MULTIPLIER_START, STREAK_1_7_MULTIPLIER_INCREMENT,
    STREAK_8_30_MULTIPLIER_START, STREAK_8_30_MULTIPLIER_INCREMENT, STREAK_31_PLUS_MULTIPLIER,
    STREAK_MULTIPLIER_CAP, LEVEL_MULTIPLIER_START, LEVEL_MULTIPLIER_INCREMENT,
    ACCOUNT_AGE_MULTIPLIER_START, ACCOUNT_AGE_MULTIPLIER_INCREMENT, ACCOUNT_AGE_MULTIPLIER_CAP,
    STREAK_31_PLUS_MULTIPLIER_INCREMENT
};
use zkube::models::index::Player;
use zkube::helpers::math::Math;
use zkube::helpers::timestamp::Timestamp;
use zkube::types::level::{Level, LevelTrait};

mod errors {
    const PLAYER_NOT_EXIST: felt252 = 'Player: Does not exist';
    const PLAYER_ALREADY_EXIST: felt252 = 'Player: Already exist';
    const INVALID_NAME: felt252 = 'Player: Invalid name';
    const INVALID_MASTER: felt252 = 'Player: Invalid master';
}

#[generate_trait]
impl PlayerImpl of PlayerTrait {
    #[inline(always)]
    fn new(id: felt252, name: felt252, current_timestamp: u64) -> Player {
        // [Check] Name is valid
        assert(name != 0, errors::INVALID_NAME);

        let current_day = Timestamp::timestamp_to_day(current_timestamp);

        // [Return] Player
        Player {
            id,
            game_id: 0,
            name,
            points: 0,
            daily_streak: 0,
            last_active_day: current_day,
            account_creation_day: current_day,
        }
    }

    #[inline(always)]
    fn rename(ref self: Player, name: felt252) {
        // [Check] Name is valid
        assert(name != 0, errors::INVALID_NAME);
        // [Effect] Change the name
        self.name = name;
    }

    #[inline(always)]
    fn update_daily_streak(ref self: Player, current_timestamp: u64) {
        let current_day: u32 = Timestamp::timestamp_to_day(current_timestamp);

        // Don't update if it's the same day
        if current_day == self.last_active_day {
            return;
        }

        // Check if player was active yesterday
        if current_day == self.last_active_day + 1 {
            self.daily_streak += 1_u8;
        } else {
            self.daily_streak = 0_u8;
        }

        // [Effect] Update the last active day
        self.last_active_day = current_day;
    }

    #[inline(always)]
    fn update_points(
        ref self: Player, base_points: u32, mode_multiplier: u32, current_timestamp: u64
    ) -> u32 {
        // Get the current multiplier
        let daily_streak_multiplier = self.get_daily_streak_multiplier();
        let level_multiplier = self.get_level_multiplier();
        let account_age_multiplier = self.get_account_age_multiplier(current_timestamp);

        // Calculate the final points to add using integer division
        let final_points: u128 = (base_points.into()
            * daily_streak_multiplier.into()
            * level_multiplier.into()
            * account_age_multiplier.into()
            * mode_multiplier.into())
            / (MULTIPLIER_SCALE.into()
                * MULTIPLIER_SCALE.into()
                * MULTIPLIER_SCALE.into()
                * MULTIPLIER_SCALE.into());

        let final_points_u32: u32 = final_points.try_into().unwrap();

        self.points = self.points + final_points_u32;

        final_points_u32
    }

    /// Calculate the daily streak multiplier based on the current streak.
    fn get_daily_streak_multiplier(self: Player) -> u32 {
        let daily_streak: u32 = self.daily_streak.into();

        if daily_streak >= 1 {
            if daily_streak <= 7 {
                // Streak between 1 and 7 days
                STREAK_1_7_MULTIPLIER_START + (daily_streak - 1) * STREAK_1_7_MULTIPLIER_INCREMENT
            } else {
                if daily_streak <= 30 {
                    // Streak between 8 and 30 days
                    STREAK_8_30_MULTIPLIER_START
                        + (daily_streak - 8) * STREAK_8_30_MULTIPLIER_INCREMENT
                } else {
                    if daily_streak <= 60 {
                        // Streak between 31 and 60 days
                        STREAK_31_PLUS_MULTIPLIER
                            + (daily_streak - 31) * STREAK_31_PLUS_MULTIPLIER_INCREMENT
                    } else {
                        // Streak greater than 60 days
                        Math::min(
                            STREAK_MULTIPLIER_CAP,
                            STREAK_31_PLUS_MULTIPLIER
                                + (daily_streak - 31) * STREAK_31_PLUS_MULTIPLIER_INCREMENT
                        )
                    }
                }
            }
        } else {
            // Default multiplier if daily_streak is less than 1
            return MULTIPLIER_SCALE;
        }
    }

    /// Calculates the level-based multiplier based on the player's score.
    #[inline(always)]
    fn get_level_multiplier(self: Player) -> u32 {
        let level = LevelTrait::from_points(self.points);
        let level_u8: u8 = level.into();

        LEVEL_MULTIPLIER_START
            + (level_u8.into() * LEVEL_MULTIPLIER_INCREMENT) // Capped by level (1-20)
    }

    /// Calculates the account age multiplier based on the player's account creation day.
    #[inline(always)]
    fn get_account_age_multiplier(self: Player, current_timestamp: u64) -> u32 {
        let account_age = Timestamp::timestamp_to_day(current_timestamp)
            - self.account_creation_day;

        if account_age < 120 {
            ACCOUNT_AGE_MULTIPLIER_START + (account_age.into() * ACCOUNT_AGE_MULTIPLIER_INCREMENT)
        } else {
            ACCOUNT_AGE_MULTIPLIER_CAP // Cap at 1.20x
        }
    }
}

#[generate_trait]
impl PlayerAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Player) {
        assert(self.is_non_zero(), errors::PLAYER_NOT_EXIST);
    }

    #[inline(always)]
    fn assert_not_exists(self: Player) {
        assert(self.is_zero(), errors::PLAYER_ALREADY_EXIST);
    }
}

impl ZeroablePlayerTrait of core::Zeroable<Player> {
    #[inline(always)]
    fn zero() -> Player {
        Player {
            id: 0,
            game_id: 0,
            name: 0,
            points: 0,
            daily_streak: 0,
            last_active_day: 0,
            account_creation_day: 0
        }
    }

    #[inline(always)]
    fn is_zero(self: Player) -> bool {
        self.name == 0
    }

    #[inline(always)]
    fn is_non_zero(self: Player) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;

    // Local imports

    use super::{Player, PlayerTrait, PlayerAssert};
    use zkube::constants::{
        SECONDS_PER_DAY, MULTIPLIER_SCALE, STREAK_1_7_MULTIPLIER_START,
        STREAK_1_7_MULTIPLIER_INCREMENT, STREAK_8_30_MULTIPLIER_START,
        STREAK_8_30_MULTIPLIER_INCREMENT, STREAK_31_PLUS_MULTIPLIER, STREAK_MULTIPLIER_CAP,
        LEVEL_MULTIPLIER_START, LEVEL_MULTIPLIER_INCREMENT, GAME_MODE_FREE_MULTIPLIER,
        ACCOUNT_AGE_MULTIPLIER_CAP, ACCOUNT_AGE_MULTIPLIER_INCREMENT, ACCOUNT_AGE_MULTIPLIER_START
    };
    use zkube::helpers::timestamp::Timestamp;
    use zkube::types::level::LevelTrait;

    // Helper function to convert day offset to timestamp
    fn day_offset_to_timestamp(day_offset: u64) -> u64 {
        day_offset * SECONDS_PER_DAY
    }

    #[test]
    fn test_player_initialization() {
        let player_id: felt252 = 1;
        let player_name: felt252 = 12345; // Mock name
        let current_timestamp = day_offset_to_timestamp(10); // Day 10

        let player = PlayerTrait::new(player_id, player_name, current_timestamp);

        assert_eq!(player.id, player_id);
        assert_eq!(player.game_id, 0);
        assert_eq!(player.name, player_name);
        assert_eq!(player.points, 0);
        assert_eq!(player.daily_streak, 0);
        assert_eq!(player.last_active_day, Timestamp::timestamp_to_day(current_timestamp));
    }

    #[test]
    fn test_consecutive_day_logins_and_break() {
        let player_id: felt252 = 2;
        let player_name: felt252 = 54321; // Mock name
        let initial_day_offset = 100; // Arbitrary day offset
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        // Simulate consecutive logins for 10 days
        let current_timestamp = day_offset_to_timestamp(initial_day_offset + 1_u64);
        player.update_daily_streak(current_timestamp);
        assert_eq!(player.daily_streak, 1_u8);

        let current_timestamp = day_offset_to_timestamp(initial_day_offset + 2_u64);
        player.update_daily_streak(current_timestamp);
        assert_eq!(player.daily_streak, 2_u8);

        let current_timestamp = day_offset_to_timestamp(initial_day_offset + 3_u64);
        player.update_daily_streak(current_timestamp);
        assert_eq!(player.daily_streak, 3_u8);

        // Skip days, should reset
        let current_timestamp = day_offset_to_timestamp(initial_day_offset + 10_u64);
        player.update_daily_streak(current_timestamp);
        assert_eq!(player.daily_streak, 0_u8);
    }

    #[test]
    fn test_daily_streak_comprehensive() {
        let player_id: felt252 = 1;
        let player_name: felt252 = 12345;
        let initial_day = 100;
        let initial_timestamp = day_offset_to_timestamp(initial_day);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        // Initial state check
        assert_eq!(player.daily_streak, 0, "Initial streak should be 0");
        assert_eq!(
            player.last_active_day,
            initial_day.try_into().unwrap(),
            "Initial last_active_day should match creation day"
        );

        // Same day login shouldn't affect streak
        player.update_daily_streak(initial_timestamp);
        assert_eq!(player.daily_streak, 0, "Same day login shouldn't affect streak");

        // Next day login should increment streak
        let next_day_timestamp = day_offset_to_timestamp(initial_day + 1);
        player.update_daily_streak(next_day_timestamp);
        assert_eq!(player.daily_streak, 1, "Streak should increment after next day login");
        assert_eq!(
            player.last_active_day,
            (initial_day + 1).try_into().unwrap(),
            "last_active_day should update"
        );

        // Another next day login should increment streak again
        let third_day_timestamp = day_offset_to_timestamp(initial_day + 2);
        player.update_daily_streak(third_day_timestamp);
        assert_eq!(player.daily_streak, 2, "Streak should increment after consecutive day");

        // Skip a day should reset streak
        let fifth_day_timestamp = day_offset_to_timestamp(initial_day + 4);
        player.update_daily_streak(fifth_day_timestamp);
        assert_eq!(player.daily_streak, 0, "Streak should reset after skip");

        // Test multiple consecutive days
        let mut current_day = initial_day + 4;
        let mut expected_streak = 0;
        loop {
            if (expected_streak > 4) {
                break;
            }
            current_day += 1;
            let timestamp = day_offset_to_timestamp(current_day);
            player.update_daily_streak(timestamp);
            assert_eq!(player.daily_streak, expected_streak + 1, "Streak should ++ properly");
            expected_streak += 1;
        };

        // Test same day multiple updates
        let same_day_timestamp = day_offset_to_timestamp(current_day);
        player.update_daily_streak(same_day_timestamp);
        assert_eq!(player.daily_streak, 5, "Streak should not change on same day updates");

        // Test backwards time (shouldn't happen in production but good to test)
        let previous_day_timestamp = day_offset_to_timestamp(current_day - 1);
        player.update_daily_streak(previous_day_timestamp);
        assert_eq!(player.daily_streak, 0, "Streak should reset if timestamp goes backwards");
    }

    #[test]
    fn test_edge_case_timestamps() {
        let player_id: felt252 = 2;
        let player_name: felt252 = 54321;
        let initial_day = 100;
        let initial_timestamp = day_offset_to_timestamp(initial_day);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        // Test end of day vs start of next day
        let end_of_day = day_offset_to_timestamp(initial_day) + SECONDS_PER_DAY - 1;
        let start_of_next_day = day_offset_to_timestamp(initial_day + 1);

        player.update_daily_streak(end_of_day);
        assert_eq!(player.daily_streak, 0, "End of day shouldn't affect initial streak");

        player.update_daily_streak(start_of_next_day);
        assert_eq!(player.daily_streak, 1, "Start of next day should increment streak");
    }

    #[test]
    fn test_long_streak_maintenance() {
        let player_id: felt252 = 3;
        let player_name: felt252 = 98765;
        let initial_day = 100;
        let initial_timestamp = day_offset_to_timestamp(initial_day);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        // Build up a 30-day streak
        let mut current_day = initial_day;
        let mut i = 0;
        loop {
            if (i > 29) {
                break;
            }
            current_day += 1;
            let timestamp = day_offset_to_timestamp(current_day);
            player.update_daily_streak(timestamp);
            assert_eq!(player.daily_streak, i + 1);
            i = i + 1;
        };

        assert_eq!(player.daily_streak, 30, "Should build up to 30-day streak");

        // Miss a day
        current_day += 2;
        let timestamp = day_offset_to_timestamp(current_day);
        player.update_daily_streak(timestamp);
        assert_eq!(player.daily_streak, 0, "Should reset after missing a day");
    }

    #[test]
    fn test_consecutive_day_logins() {
        let player_id: felt252 = 2;
        let player_name: felt252 = 54321; // Mock name
        let initial_day_offset = 100; // Arbitrary day offset
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        let mut i: u8 = 1;
        loop {
            if (i > 10) {
                break;
            }
            let current_timestamp = day_offset_to_timestamp(initial_day_offset + i.into());
            player.update_daily_streak(current_timestamp);
            assert_eq!(player.daily_streak, i);
            i = i + 1;
        };

        // Check multiplier on day 10
        let expected_multiplier = STREAK_8_30_MULTIPLIER_START
            + (player.daily_streak.into() - 8_u32) * STREAK_8_30_MULTIPLIER_INCREMENT;
        assert_eq!(player.get_daily_streak_multiplier(), expected_multiplier);
    }

    #[test]
    fn test_get_level_multiplier_level_1() {
        let player_id: felt252 = 1;
        let player_name: felt252 = 12345; // Mock name
        let initial_day_offset = 10;
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);
        player.points = 100; // Level One

        let level_multiplier = player.get_level_multiplier();
        assert_eq!(level_multiplier, LEVEL_MULTIPLIER_START + LEVEL_MULTIPLIER_INCREMENT); // 1000
    }

    #[test]
    fn test_get_level_multiplier_level_10() {
        let player_id: felt252 = 2;
        let player_name: felt252 = 54321; // Mock name
        let initial_day_offset = 20;
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);
        player.points = LevelTrait::get_points(10_u8.into());

        assert_eq!(LevelTrait::from_points(player.points).into(), 10_u8);

        let level_multiplier = player.get_level_multiplier();
        let expected_multiplier = 1100000; // 1000 + 10(lvl)*10(increment) = 1100
        assert_eq!(level_multiplier, expected_multiplier);
    }

    #[test]
    fn test_get_level_multiplier_level_20() {
        let player_id: felt252 = 5;
        let player_name: felt252 = 11223; // Mock name
        let initial_day_offset = 50;
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);
        player.points = LevelTrait::get_points(20_u8.into());

        assert_eq!(LevelTrait::from_points(player.points).into(), 20_u8);

        let level_multiplier = player.get_level_multiplier();
        assert_eq!(level_multiplier, 1200000);
    }

    #[test]
    fn test_get_account_age_multiplier_below_cap() {
        let player_id: felt252 = 3;
        let player_name: felt252 = 67890; // Mock name
        let account_creation_day_offset = 50; // Day 50
        let current_day_offset = 100; // Day 100
        let account_creation_timestamp = day_offset_to_timestamp(account_creation_day_offset);
        let current_timestamp = day_offset_to_timestamp(current_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, account_creation_timestamp);

        let multiplier = player.get_account_age_multiplier(current_timestamp);
        let expected_multiplier = ACCOUNT_AGE_MULTIPLIER_START
            + (50 * ACCOUNT_AGE_MULTIPLIER_INCREMENT);
        assert_eq!(multiplier, expected_multiplier);
    }

    #[test]
    fn test_get_account_age_multiplier_at_cap() {
        let player_id: felt252 = 4;
        let player_name: felt252 = 98765; // Mock name
        let account_creation_day_offset = 0; // Day 0
        let current_day_offset = 150; // Day 150 (Assuming cap is at 120)
        let account_creation_timestamp = day_offset_to_timestamp(account_creation_day_offset);
        let current_timestamp = day_offset_to_timestamp(current_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, account_creation_timestamp);

        let multiplier = player.get_account_age_multiplier(current_timestamp);
        let expected_multiplier =
            ACCOUNT_AGE_MULTIPLIER_CAP; // Should cap at ACCOUNT_AGE_MULTIPLIER_CAP
        assert_eq!(multiplier, expected_multiplier);
    }

    #[test]
    fn test_get_daily_streak_multiplier_edge_cases() {
        let player_id: felt252 = 5;
        let player_name: felt252 = 13579; // Mock name
        let initial_day_offset = 200;
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        // Set streak to 7
        player.daily_streak = 7;
        let multiplier_at_7 = player.get_daily_streak_multiplier();
        let expected_at_7 = STREAK_1_7_MULTIPLIER_START
            + ((7 - 1) * STREAK_1_7_MULTIPLIER_INCREMENT);
        assert_eq!(multiplier_at_7, expected_at_7);

        // Set streak to 8 (transition to next range)
        player.daily_streak = 8;
        let multiplier_at_8 = player.get_daily_streak_multiplier();
        let expected_at_8 = STREAK_8_30_MULTIPLIER_START
            + ((8 - 8) * STREAK_8_30_MULTIPLIER_INCREMENT);
        assert_eq!(multiplier_at_8, expected_at_8);

        // Set streak to 30
        player.daily_streak = 30;
        let multiplier_at_30 = player.get_daily_streak_multiplier();
        let expected_at_30 = STREAK_8_30_MULTIPLIER_START
            + ((30 - 8) * STREAK_8_30_MULTIPLIER_INCREMENT);
        assert_eq!(multiplier_at_30, expected_at_30);

        // Set streak to 31 (transition to next range)
        player.daily_streak = 31;
        let multiplier_at_31 = player.get_daily_streak_multiplier();
        let expected_at_31 = STREAK_31_PLUS_MULTIPLIER + ((31 - 31) * 2);
        assert_eq!(multiplier_at_31, expected_at_31);
    }

    #[test]
    fn test_get_daily_streak_multiplier_cap() {
        let player_id: felt252 = 6;
        let player_name: felt252 = 24680; // Mock name
        let initial_day_offset = 300;
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        // Set streak above cap
        player.daily_streak = 61; // Assuming cap is at 60
        let multiplier = player.get_daily_streak_multiplier();
        let expected_multiplier = STREAK_MULTIPLIER_CAP;
        assert_eq!(multiplier, expected_multiplier);
    }

    #[test]
    fn test_update_points_combined_multipliers() {
        let player_id: felt252 = 7;
        let player_name: felt252 = 112358; // Mock name
        let initial_day_offset = 400;
        let initial_timestamp = day_offset_to_timestamp(initial_day_offset);

        let mut player = PlayerTrait::new(player_id, player_name, initial_timestamp);

        // Set streak and level
        player.daily_streak = 5; // Within 1-7 range
        player.points = 500; // Level based on points

        // Assume get_level_multiplier for 500 points is LEVEL_MULTIPLIER_START + (level *
        // LEVEL_MULTIPLIER_INCREMENT)
        let level = LevelTrait::from_points(player.points);
        let level_u8: u8 = level.into();

        let level_u8: u8 = level.into();
        let expected_level_multiplier = LEVEL_MULTIPLIER_START
            + (level_u8.into() * LEVEL_MULTIPLIER_INCREMENT);

        // Similarly, calculate expected daily streak multiplier
        let expected_daily_streak_multiplier = STREAK_1_7_MULTIPLIER_START
            + ((5 - 1) * STREAK_1_7_MULTIPLIER_INCREMENT);

        // Calculate expected final points
        let base_points = 1000;
        let expected_final_points: u128 = (base_points.into()
            * expected_daily_streak_multiplier.into()
            * expected_level_multiplier.into())
            / (MULTIPLIER_SCALE.into() * MULTIPLIER_SCALE.into());
        let expected_final_points_u32: u32 = expected_final_points.try_into().unwrap();

        let final_points = player
            .update_points(base_points, GAME_MODE_FREE_MULTIPLIER, initial_timestamp);
        assert_eq!(final_points, expected_final_points_u32);
        assert_eq!(player.points, 500 + expected_final_points_u32);
    }
}
