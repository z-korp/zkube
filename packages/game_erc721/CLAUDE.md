# zKube Game ERC721 Contract

## Overview

ERC721 NFT contract for zKube game tokens. Each NFT represents a playable game instance. Built with OpenZeppelin Cairo contracts v0.18.0.

## Contract Details

- **Name:** zKube-Game
- **Symbol:** ZKBG
- **Cairo Version:** 2.8.4
- **OpenZeppelin:** v0.18.0

## Features

### ERC721 with Enumerable
Full ERC721 implementation with enumeration support for tracking all tokens.

### Role-Based Access Control
```cairo
const PAUSER_ROLE: felt252 = selector!("PAUSER_ROLE");
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const UPGRADER_ROLE: felt252 = selector!("UPGRADER_ROLE");
const PRICE_SETTER_ROLE: felt252 = selector!("PRICE_SETTER_ROLE");
```

### Pausable
Contract can be paused to halt minting and transfers.

### Upgradeable
Supports contract upgrades via UPGRADER_ROLE.

### Minting Modes
- **Minter Mint:** Free minting by authorized minters (airdrops)
- **Public Mint:** Paid minting with ERC20 token payment

## Storage

```cairo
struct Storage {
    erc721: ERC721Component::Storage,
    src5: SRC5Component::Storage,
    pausable: PausableComponent::Storage,
    accesscontrol: AccessControlComponent::Storage,
    erc721_enumerable: ERC721EnumerableComponent::Storage,
    upgradeable: UpgradeableComponent::Storage,
    // Custom storage
    erc20_token: ContractAddress,           // Payment token
    mint_price: u256,                        // Current mint price
    purchase_prices: Map<u256, u256>,        // Token ID -> purchase price
    token_id: u256,                          // Counter for next token ID
    constant_token_uri: ByteArray,           // Metadata URI
    // System addresses
    current_minter: ContractAddress,
    current_tournament: ContractAddress,
    current_chest: ContractAddress,
    current_zkorp: ContractAddress,
    current_play: ContractAddress,
}
```

## Key Functions

### Minting

```cairo
fn minter_mint(ref self: ContractState, recipient: ContractAddress)
```
Free mint by MINTER_ROLE (for airdrops). Sets purchase_price to 0.

```cairo
fn public_mint(ref self: ContractState, recipient: ContractAddress)
```
Public mint with ERC20 payment. Stores the purchase price for prize pool calculations.

### Price Management

```cairo
fn update_mint_price(ref self: ContractState, new_price: u256)
```
Updates the mint price. Only PRICE_SETTER_ROLE can call.

```cairo
fn get_mint_price(self: @ContractState) -> u256
fn get_purchase_price(self: @ContractState, token_id: u256) -> u256
```

### Admin Functions

```cairo
fn pause(ref self: ContractState)
fn unpause(ref self: ContractState)
fn burn(ref self: ContractState, token_id: u256)
fn update_base_uri(ref self: ContractState, new_uri: ByteArray)
fn update_system_addresses(ref self: ContractState, ...)
fn update_role(ref self: ContractState, role: felt252, account: ContractAddress, grant: bool)
fn recover_erc20(ref self: ContractState, token: ContractAddress, amount: u256)
```

## Constructor

```cairo
fn constructor(
    ref self: ContractState,
    default_admin: ContractAddress,
    pauser: ContractAddress,
    erc20_token: ContractAddress,
    tournament_system: ContractAddress,
    chest_system: ContractAddress,
    zkorp_system: ContractAddress,
    play_system: ContractAddress,
    minter_system: ContractAddress,
)
```

Sets up:
- ERC721 with metadata
- Access control roles
- ERC20 approvals for game systems
- Contract starts **paused** until price is set

## System Integration

### ERC20 Approvals
The contract auto-approves max u256 for game systems:
- Tournament system
- Chest system
- zKorp system

This allows these systems to transfer ERC20 tokens held by the contract (for prize distribution).

### System Address Updates
`update_system_addresses()` safely:
1. Revokes old ERC20 approvals
2. Revokes old roles
3. Grants new ERC20 approvals
4. Grants new roles
5. Emits tracking events

## Events

```cairo
SystemAddressUpdated { old_address, new_address, system_type }
ERC20ApprovalRevoked { system, previous_allowance }
RoleUpdated { role, account, granted }
ERC20Recovered { token, amount, recipient }
```

## Metadata

Default token URI: `ipfs://QmZf1uNuPPAcTqxXGBdcTjBnviPTftypxxUwMSgAGC1HDC/metadata.json`

All tokens share the same metadata (constant URI pattern).

## Build & Deploy

```bash
cd game_erc721
scarb build
# Deploy using sozo or starkli
```

Testing with Foundry:
```bash
snforge test
```

## Dependencies

```toml
[dependencies]
openzeppelin = { git = "OpenZeppelin/cairo-contracts", tag = "v0.18.0" }
starknet = "2.8.4"
```

## Relationship to Game

1. **Token = Game:** Each NFT token ID is also a game ID
2. **Ownership = Playing Rights:** Only the token owner can play that game
3. **Purchase Price Tracking:** Determines prize pool split for tournaments
4. **System Permissions:** Game systems interact with this contract for:
   - Verifying ownership before game actions
   - Distributing prizes from collected mint fees

## Security Considerations

1. **Contract starts paused** - prevents premature minting
2. **Role separation** - minter, pauser, admin are separate
3. **ERC20 recovery** - admin can recover stuck tokens
4. **Approval revocation** - old systems lose access when updated
5. **Price setter role** - only minter system can set price (not even admin directly)
