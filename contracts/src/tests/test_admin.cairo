use core::traits::Into;
use core::Zeroable;
use starknet::testing::{set_contract_address, set_caller_address};
use starknet::ContractAddress;

use zkube::models::admin::{Admin, AdminTrait, AdminAssert, ZeroableAdmin};
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::systems::settings::{ISettingsDispatcherTrait, ISettingsDispatcher};
use zkube::store::{Store, StoreTrait};

use zkube::tests::setup::{setup, setup::{Systems, ADMIN, PLAYER1, PLAYER2, PLAYER3, PLAYER4}};

#[test]
fn test_admin_creation_and_deletion() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();
    let store = StoreTrait::new(world);

    // [Create admin]
    // [Note] By default owner is admin
    set_contract_address(ADMIN());
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
    set_contract_address(ADMIN());
    systems.settings.set_admin(PLAYER2().into());

    // [Update settings as admin]
    set_contract_address(PLAYER2());
    let new_zkorp_address: ContractAddress = starknet::contract_address_const::<'0x123'>();
    systems.settings.update_zkorp_address(new_zkorp_address);

    // [Assert] Settings updated
    let settings = store.settings();
    assert(settings.zkorp_address == new_zkorp_address.into(), 'zkorp_address not updated');
}

#[test]
#[should_panic(expected: ('Not an admin', 'ENTRYPOINT_FAILED'))]
fn test_admin_non_admin_update_settings() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();

    // [Try to update settings as non-admin]
    set_contract_address(PLAYER3());
    let new_zkorp_address: ContractAddress = starknet::contract_address_const::<'0x123'>();
    systems.settings.update_zkorp_address(new_zkorp_address);
}


#[test]
#[should_panic(expected: ('Admin: Already exist', 'ENTRYPOINT_FAILED'))]
fn test_admin_create_existing_admin() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();

    // [Create admin]
    set_contract_address(ADMIN());
    systems.settings.set_admin(PLAYER2().into());

    // [Try to create the same admin again]
    systems.settings.set_admin(PLAYER2().into());
}

#[test]
fn test_admin_multiple_admins() {
    // [Setup]
    let (world, systems, _) = setup::create_accounts();
    let store = StoreTrait::new(world);

    // [Create multiple admins]
    set_contract_address(ADMIN());
    systems.settings.set_admin(PLAYER2().into());
    systems.settings.set_admin(PLAYER3().into());

    // [Assert] Both PLAYER2 and PLAYER3 are admins
    let admin2 = store.admin(PLAYER2().into());
    let admin3 = store.admin(PLAYER3().into());
    admin2.assert_exists();
    admin3.assert_exists();
}
