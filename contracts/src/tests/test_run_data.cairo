use zkube::helpers::level::BossLevel;
use zkube::helpers::packing::{RunData, RunDataPackingTrait};

fn assert_roundtrip(expected: RunData) {
    let packed = expected.pack();
    let unpacked = RunDataPackingTrait::unpack(packed);
    assert!(unpacked == expected, "RunData pack/unpack mismatch");
}

#[test]
fn test_run_data_pack_unpack_roundtrip_small_values() {
    let data = RunData {
        current_level: 1,
        level_score: 0,
        level_moves: 0,
        constraint_progress: 0,
        constraint_2_progress: 0,
        max_combo_run: 0,
        total_score: 0,
        zone_cleared: false,
        current_difficulty: 0,
        zone_id: 1,
        active_mutator_id: 0,
        mode: 0,
        bonus_type: 0,
        bonus_charges: 0,
        level_lines_cleared: 0,
        bonus_slot: 0,
    };

    assert_roundtrip(data);
}

#[test]
fn test_run_data_pack_unpack_roundtrip_max_values() {
    let data = RunData {
        current_level: 255,
        level_score: 255,
        level_moves: 255,
        constraint_progress: 255,
        constraint_2_progress: 255,
        max_combo_run: 255,
        total_score: 100000,
        zone_cleared: true,
        current_difficulty: 50,
        zone_id: 15,
        active_mutator_id: 255,
        mode: 0,
        bonus_type: 3,
        bonus_charges: 15,
        level_lines_cleared: 255,
        bonus_slot: 2,
    };

    assert_roundtrip(data);
}

#[test]
fn test_run_data_total_score_supports_u32_above_u16() {
    let total_score: u32 = 100000;
    assert!(total_score > 65535_u32, "Test value must exceed u16 max");

    let data = RunData {
        current_level: 7,
        level_score: 99,
        level_moves: 42,
        constraint_progress: 3,
        constraint_2_progress: 2,
        max_combo_run: 6,
        total_score,
        zone_cleared: false,
        current_difficulty: 0,
        zone_id: 9,
        active_mutator_id: 170,
        mode: 0,
        bonus_type: 0,
        bonus_charges: 0,
        level_lines_cleared: 12,
        bonus_slot: 1,
    };

    let unpacked = RunDataPackingTrait::unpack(data.pack());
    assert!(unpacked.total_score == total_score, "u32 total_score should roundtrip intact");
}

#[test]
fn test_run_data_zone_id_is_4_bits_and_active_mutator_id_is_u8() {
    let data = RunDataPackingTrait::new(31, 255, 0);
    assert!(data.zone_id == 15, "zone_id should be masked to 4 bits");
    assert!(data.active_mutator_id == 255, "active_mutator_id should keep full u8 range");

    let unpacked = RunDataPackingTrait::unpack(data.pack());
    assert!(unpacked.zone_id == 15, "zone_id should still be 15 after roundtrip");
    assert!(
        unpacked.active_mutator_id == 255, "active_mutator_id should still be 255 after roundtrip",
    );
}

#[test]
fn test_run_data_zone_lifecycle_struct_manipulation() {
    // No world harness is available under contracts/src/tests yet;
    // validate state transitions directly on RunData.
    let mut run_data = RunDataPackingTrait::new(1, 0, 0);

    assert!(run_data.zone_id == 1, "zone_id should be persisted from create_run");
    assert!(run_data.current_level == 1, "new run should start at level 1");
    assert!(!run_data.zone_cleared, "zone should start uncleared");
    assert!(run_data.current_difficulty == 0, "current difficulty should start at 0");

    // Simulate reaching L10 in zone mode.
    run_data.current_level = 10;
    run_data.zone_cleared = false;
    run_data.current_difficulty = 0;
    assert_roundtrip(run_data);

    // Simulate L10 completion: zone cleared and endless starts at depth 1 on L11.
    run_data.zone_cleared = true;
    run_data.current_difficulty = 1;
    run_data.current_level = 11;
    assert!(run_data.zone_cleared, "zone should be marked cleared after L10");
    assert!(run_data.current_difficulty == 1, "current difficulty should be 1 on L11");
    assert_roundtrip(run_data);
}

#[test]
fn test_run_data_mode_bit_roundtrip() {
    let map_data = RunDataPackingTrait::new(1, 0, 0);
    assert!(map_data.mode == 0, "Map mode should be 0");
    let unpacked_map = RunDataPackingTrait::unpack(map_data.pack());
    assert!(unpacked_map.mode == 0, "Map mode should roundtrip as 0");

    let endless_data = RunDataPackingTrait::new(1, 0, 1);
    assert!(endless_data.mode == 1, "Endless mode should be 1");
    let unpacked_endless = RunDataPackingTrait::unpack(endless_data.pack());
    assert!(unpacked_endless.mode == 1, "Endless mode should roundtrip as 1");
}

#[test]
fn test_run_data_bonus_fields_roundtrip() {
    let data = RunData {
        current_level: 4,
        level_score: 12,
        level_moves: 5,
        constraint_progress: 1,
        constraint_2_progress: 0,
        max_combo_run: 3,
        total_score: 321,
        zone_cleared: false,
        current_difficulty: 2,
        zone_id: 1,
        active_mutator_id: 1,
        mode: 0,
        bonus_type: 1,
        bonus_charges: 7,
        level_lines_cleared: 9,
        bonus_slot: 2,
    };

    let unpacked = RunDataPackingTrait::unpack(data.pack());
    assert!(unpacked.bonus_type == 1, "bonus_type should roundtrip as 1");
    assert!(unpacked.bonus_charges == 7, "bonus_charges should roundtrip as 7");
    assert!(unpacked.level_lines_cleared == 9, "level_lines_cleared should roundtrip as 9");
    assert!(unpacked.bonus_slot == 2, "bonus_slot should roundtrip as 2");
}

#[test]
fn test_is_boss_level_zone_mode_only_at_10() {
    let mut level: u8 = 1;
    while level <= 9 {
        assert!(!BossLevel::is_boss_level(level), "Levels 1-9 must not be boss levels");
        level += 1;
    }

    assert!(BossLevel::is_boss_level(10), "Level 10 must be a boss level");

    assert!(!BossLevel::is_boss_level(11), "Level 11+ must not be boss levels");
    assert!(!BossLevel::is_boss_level(50), "Level 11+ must not be boss levels");
}
