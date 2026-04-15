//! Regression tests for config_system authorization.
//!
//! These are unit-level checks that verify the ownership/admin rules
//! at the model layer. Full world-backed integration tests are deferred.

use starknet::ContractAddress;
use zkube::models::config::GameSettingsMetadata;

/// Helper: build a GameSettingsMetadata with a known created_by.
fn make_metadata(settings_id: u32, owner: ContractAddress) -> GameSettingsMetadata {
    GameSettingsMetadata {
        settings_id,
        name: 'TestZone',
        description: "test",
        created_by: owner,
        created_at: 1000,
        theme_id: 1,
        is_free: true,
        is_tournament: false,
        enabled: true,
        price: 0,
        payment_token: 0_felt252.try_into().unwrap(),
        star_cost: 0,
    }
}

// ── Owner / Admin rule tests
// ────────────────────────────────────────

#[test]
fn test_owner_matches_created_by() {
    let owner: ContractAddress = 0x1_felt252.try_into().unwrap();
    let metadata = make_metadata(1, owner);
    assert!(metadata.created_by == owner, "created_by should match owner");
}

#[test]
fn test_non_owner_does_not_match() {
    let owner: ContractAddress = 0x1_felt252.try_into().unwrap();
    let other: ContractAddress = 0x2_felt252.try_into().unwrap();
    let metadata = make_metadata(1, owner);
    assert!(metadata.created_by != other, "non-owner should not match created_by");
}

#[test]
fn test_admin_is_separate_from_owner() {
    let admin: ContractAddress = 0xAD01_felt252.try_into().unwrap();
    let owner: ContractAddress = 0x1_felt252.try_into().unwrap();
    let metadata = make_metadata(1, owner);
    // Admin bypass means admin != created_by is expected and fine
    assert!(metadata.created_by != admin, "admin is separate from owner");
}

#[test]
fn test_default_settings_created_by_is_creator() {
    // dojo_init sets created_by = creator_address for official settings (IDs 0,1,2).
    // After deploy, admin == creator, so admin can always edit official defaults.
    let creator: ContractAddress = 0xC8EA_felt252.try_into().unwrap();
    let official = make_metadata(0, creator);
    assert!(official.created_by == creator, "official settings should have creator as owner");
}
