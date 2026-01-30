# zKube Token Contract

## Overview

A simple ERC20 token contract called "Fake LORD" (FLORD) used for testing and development. Built with OpenZeppelin Cairo contracts.

> **Status:** Development/Testing only  
> **Production:** Mainnet uses real LORD token or STRK

## Contract Details

- **Name:** Fake Lord
- **Symbol:** FLORD
- **Decimals:** 18 (standard ERC20)
- **Cairo Version:** 2.13.1
- **OpenZeppelin:** v3.0.0-alpha.3 (workspace)

## Features

### Standard ERC20
Full ERC20 implementation via OpenZeppelin's `ERC20Component`.

### Ownable
Admin-controlled minting via OpenZeppelin's `OwnableComponent`.

### Faucet
Public faucet for getting test tokens:
- **Amount:** 1000 FLORD per claim
- **Cooldown:** 24 hours between claims

## Functions

### Owner-only
```cairo
fn mint(recipient: ContractAddress, amount: u256)
```
Mints new tokens to the specified address. Only owner can call.

### Public
```cairo
fn burn(value: u256)
```
Burns tokens from the caller's balance.

```cairo
fn faucet()
```
Claims 1000 FLORD tokens. Enforces 24-hour cooldown per address.

### Standard ERC20
All standard ERC20 functions: `transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance`, etc.

## Storage

```cairo
struct Storage {
    erc20: ERC20Component::Storage,
    ownable: OwnableComponent::Storage,
    last_faucet_claim: Map<ContractAddress, u64>,  // Tracks faucet claims
}
```

## Constants

```cairo
const FAUCET_AMOUNT: u256 = 1000 * 1_000_000_000_000_000_000;  // 1000 tokens
const FAUCET_COOLDOWN: u64 = 86400;  // 24 hours in seconds
```

## Constructor

```cairo
fn constructor(ref self: ContractState, owner: ContractAddress)
```
- Initializes ERC20 with name/symbol
- Sets the owner for minting privileges

## Build & Deploy

```bash
cd packages/token
scarb build
# Deploy using starkli
```

## Dependencies

Uses workspace dependencies:
```toml
[dependencies]
openzeppelin_token.workspace = true
openzeppelin_access.workspace = true
starknet.workspace = true
```

## Usage in zKube

This token is used for:
1. **Development/Testing:** Free tokens via faucet for testing game mechanics
2. **Prize Pools:** (In development - production uses real LORD token)
3. **NFT Minting:** Payment for public minting of game NFTs (development only)

## Notes

- This is a **development/test token** - not for production
- In mainnet, the game uses the actual LORD token or STRK
- Faucet allows easy onboarding during testing
- 24-hour cooldown prevents faucet abuse
