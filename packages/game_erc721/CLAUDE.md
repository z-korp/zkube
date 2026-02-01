# zKube Game ERC721 Contract (Legacy)

> **Status:** DEPRECATED - Replaced by game-components FullTokenContract  
> **Kept for:** Reference only

## Overview

Legacy ERC721 NFT contract for zKube game tokens. Each NFT represents a playable game instance.

**Important:** This contract is NOT used in the current deployment. The project now uses `FullTokenContract` from the game-components framework, which provides integrated lifecycle management and minigame features.

## Contract Details

- **Name:** zKube-Game
- **Symbol:** ZKBG
- **Cairo Version:** 2.13.1
- **OpenZeppelin:** v3.0.0-alpha.3 (workspace)

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

## Why This Was Replaced

The game-components `FullTokenContract` provides:
1. **Lifecycle Management:** Built-in start/end times, playable state tracking
2. **IMinigameTokenData:** Standard interface for game data queries
3. **Registry Integration:** Works with MinigameRegistryContract
4. **Soulbound Support:** Native support for non-transferable tokens
5. **Renderer Support:** Custom SVG/metadata generation

See `/docs/DEPLOYMENT_GUIDE.md` for current deployment using FullTokenContract.

## Build & Test

```bash
cd packages/game_erc721
scarb build
snforge test
```

## Notes

- This contract remains in the codebase for reference
- Do not deploy this contract for new games
- Use FullTokenContract from game-components instead
