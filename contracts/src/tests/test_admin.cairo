use core::traits::Into;
use core::Zeroable;
use starknet::testing::{set_contract_address, set_caller_address};

use zkube::models::admin::{Admin, AdminTrait, AdminAssert, ZeroableAdmin};
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::systems::settings::{ISettingsDispatcherTrait, ISettingsDispatcher};
use zkube::store::{Store, StoreTrait};

use zkube::tests::setup::{setup, setup::{Systems, PLAYER1, PLAYER2, PLAYER3, PLAYER4}};

#[test]
fn test_admin_creation_and_deletion() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();
    let store = StoreTrait::new(world);

    // [Create admin]
    // [Note] By default owner is admin
    set_contract_address(PLAYER1());
    systems.settings.set_admin(PLAYER2().into());

    // [Assert] PLAYER2 is admin
    let admin = store.admin(PLAYER2().into());
    admin.assert_is_admin();

    // [Delete admin]
    systems.settings.delete_admin(PLAYER2().into());

    // [Assert] PLAYER2 is no longer admin
    let admin = store.admin(PLAYER2().into());
    assert(admin.is_zero(), 'Admin should be deleted');
}

#[test]
fn test_admin_update_settings() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();
    let store = StoreTrait::new(world);

    // [Create admin]
    set_contract_address(PLAYER1());
    systems.settings.set_admin(PLAYER2().into());

    // [Update settings as admin]
    set_contract_address(PLAYER2());
    let new_free_daily_credits: u8 = 5;
    systems.settings.update_free_daily_credits(new_free_daily_credits);

    // [Assert] Settings updated
    let settings = store.settings();
    assert(settings.free_daily_credits == new_free_daily_credits, 'Free credits not updated');
}

#[test]
#[should_panic(expected: ('Not an admin', 'ENTRYPOINT_FAILED'))]
fn test_non_admin_update_settings() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();

    // [Try to update settings as non-admin]
    set_contract_address(PLAYER3());
    systems.settings.update_free_daily_credits(5);
}

#[test]
#[should_panic(expected: ('Admin: Already exist', 'ENTRYPOINT_FAILED'))]
fn test_create_existing_admin() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();

    // [Create admin]
    set_contract_address(PLAYER1());
    systems.settings.set_admin(PLAYER2().into());

    // [Try to create the same admin again]
    systems.settings.set_admin(PLAYER2().into());
}

#[test]
fn test_multiple_admins() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();
    let store = StoreTrait::new(world);

    // [Create multiple admins]
    set_contract_address(PLAYER1());
    systems.settings.set_admin(PLAYER2().into());
    systems.settings.set_admin(PLAYER3().into());

    // [Assert] Both PLAYER2 and PLAYER3 are admins
    let admin2 = store.admin(PLAYER2().into());
    let admin3 = store.admin(PLAYER3().into());
    admin2.assert_exists();
    admin3.assert_exists();

    // [Update settings with different admins]
    set_contract_address(PLAYER2());
    systems.settings.update_daily_mode_price(100);

    set_contract_address(PLAYER3());
    systems.settings.update_normal_mode_price(200);

    // [Assert] Settings updated
    let settings = store.settings();
    assert(settings.daily_mode_price == 100, 'Daily mode price not updated');
    assert(settings.normal_mode_price == 200, 'Normal mode price not updated');
}
