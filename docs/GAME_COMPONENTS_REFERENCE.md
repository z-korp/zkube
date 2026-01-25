# Game Components Framework Reference

This document provides a reference for the Provable Games' `game-components` library used in zkube and death-mountain projects.

## Overview

Game Components is a modular Cairo library providing reusable smart contract components for building on-chain games on Starknet. It implements a component-based architecture with three core components that work together to enable NFT-based game instances.

## Core Interfaces

### IMinigameTokenData (Required)

Every game **must** implement this interface for the token contract to query game state:

```cairo
#[starknet::interface]
pub trait IMinigameTokenData<TState> {
    fn score(self: @TState, token_id: u64) -> u32;
    fn game_over(self: @TState, token_id: u64) -> bool;
}
```

**Implementation Example (zkube):**
```cairo
#[abi(embed_v0)]
impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
    fn score(self: @ContractState, token_id: u64) -> u32 {
        let world: WorldStorage = self.world(@DEFAULT_NS());
        let game: Game = world.read_model(token_id);
        game.score.into()
    }

    fn game_over(self: @ContractState, token_id: u64) -> bool {
        let world: WorldStorage = self.world(@DEFAULT_NS());
        let game: Game = world.read_model(token_id);
        game.over
    }
}
```

### IMinigame (Core Game Interface)

```cairo
#[starknet::interface]
pub trait IMinigame<TState> {
    fn token_address(self: @TState) -> ContractAddress;
    fn settings_address(self: @TState) -> ContractAddress;
    fn objectives_address(self: @TState) -> ContractAddress;
    fn mint_game(
        self: @TState,
        player_name: Option<felt252>,
        settings_id: Option<u32>,
        start: Option<u64>,
        end: Option<u64>,
        objective_ids: Option<Span<u32>>,
        context: Option<GameContextDetails>,
        client_url: Option<ByteArray>,
        renderer_address: Option<ContractAddress>,
        to: ContractAddress,
        soulbound: bool,
    ) -> u64;
}
```

### IMinigameToken (Token Interface)

```cairo
#[starknet::interface]
pub trait IMinigameToken<TState> {
    fn token_metadata(self: @TState, token_id: u64) -> TokenMetadata;
    fn is_playable(self: @TState, token_id: u64) -> bool;
    fn settings_id(self: @TState, token_id: u64) -> u32;
    fn player_name(self: @TState, token_id: u64) -> felt252;
    fn game_address(self: @TState) -> ContractAddress;
    fn mint(...) -> u64;
    fn update_game(ref self: TState, token_id: u64);
    fn update_player_name(ref self: TState, token_id: u64, name: felt252);
}
```

### Optional Extensions

#### IMinigameDetails
```cairo
#[starknet::interface]
pub trait IMinigameDetails<TState> {
    fn token_name(self: @TState, token_id: u64) -> ByteArray;
    fn token_description(self: @TState, token_id: u64) -> ByteArray;
    fn game_details(self: @TState, token_id: u64) -> Span<GameDetail>;
}
```

#### IMinigameDetailsSVG
```cairo
#[starknet::interface]
pub trait IMinigameDetailsSVG<TState> {
    fn game_details_svg(self: @TState, token_id: u64) -> ByteArray;
}
```

#### IMinigameSettings
For games with configurable settings (difficulty, rules, etc.)

#### IMinigameObjectives
For games with achievements/objectives tracking

## Component Architecture

### Component Registration

```cairo
use game_components_minigame::minigame::MinigameComponent;
use openzeppelin_introspection::src5::SRC5Component;

component!(path: MinigameComponent, storage: minigame, event: MinigameEvent);
component!(path: SRC5Component, storage: src5, event: SRC5Event);

#[abi(embed_v0)]
impl MinigameImpl = MinigameComponent::MinigameImpl<ContractState>;
impl MinigameInternalImpl = MinigameComponent::InternalImpl<ContractState>;

#[storage]
struct Storage {
    #[substorage(v0)]
    minigame: MinigameComponent::Storage,
    #[substorage(v0)]
    src5: SRC5Component::Storage,
}

#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    #[flat]
    MinigameEvent: MinigameComponent::Event,
    #[flat]
    SRC5Event: SRC5Component::Event,
}
```

### Initialization (dojo_init)

```cairo
fn dojo_init(
    ref self: ContractState,
    creator_address: ContractAddress,
    denshokan_address: ContractAddress,
    renderer_address: Option<ContractAddress>,
) {
    let mut world: WorldStorage = self.world(@DEFAULT_NS());
    let (config_system_address, _) = world.dns(@"config_system").unwrap();

    self.minigame.initializer(
        creator_address,
        "GameName",                    // Name
        "Game description...",         // Description
        "Developer",                   // Developer name
        "Developer",                   // Developer short name
        "Genre",                       // Genre
        "https://example.com/icon.png", // Icon URL
        Option::Some("#3c2fba"),       // Theme color
        Option::None,                  // Client URL
        renderer_address,              // Custom renderer
        Option::Some(config_system_address), // Settings address
        Option::None,                  // Objectives address
        denshokan_address,             // Denshokan address
    );
}
```

## Pre/Post Action Hooks

Every game action should be wrapped with these hooks:

```cairo
use game_components_minigame::libs::{
    assert_token_ownership,
    get_player_name as get_token_player_name,
    post_action,
    pre_action,
};

fn some_action(ref self: ContractState, game_id: u64) {
    let token_address = self.token_address();

    // 1. Validate and prepare
    pre_action(token_address, game_id);

    // 2. Check ownership
    assert_token_ownership(token_address, game_id);

    // 3. Game logic here...

    // 4. Finalize
    post_action(token_address, game_id);
}
```

**What pre_action does:**
- Validates token exists
- Checks lifecycle state (playable)
- Updates game sync status

**What post_action does:**
- Syncs token state with game state
- Updates metadata timestamps

## Token Metadata Lifecycle

```cairo
use game_components_token::libs::LifecycleTrait;
use game_components_token::structs::TokenMetadata;

let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);

// Check if game is playable
assert!(
    token_metadata.lifecycle.is_playable(get_block_timestamp()),
    "Game {} lifecycle is not playable",
    game_id,
);
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                      Metagame                               │
│  - Coordinates tournament/event contexts                    │
│  - Token delegation and minting                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               MinigameToken (ERC721)                        │
│  - token_metadata: TokenMetadata                            │
│  - game_address → Minigame                                  │
│  - settings_id → IMinigameSettings                          │
│  - objectives → IMinigameObjectives                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Minigame                                 │
│  - Implements IMinigameTokenData (score, game_over)         │
│  - token_address → MinigameToken                            │
│  - settings_address → IMinigameSettings (optional)          │
│  - objectives_address → IMinigameObjectives (optional)      │
└─────────────────────────────────────────────────────────────┘
```

## Token Contract Size Optimization

The token package uses compile-time feature flags to stay under StarkNet's 4MB limit:

```cairo
// packages/token/src/config.cairo
pub const MINTER_ENABLED: bool = true;
pub const MULTI_GAME_ENABLED: bool = false;
pub const OBJECTIVES_ENABLED: bool = true;
pub const SETTINGS_ENABLED: bool = true;
pub const RENDERER_ENABLED: bool = true;
pub const CONTEXT_ENABLED: bool = false;
pub const SOULBOUND_ENABLED: bool = true;
```

Disabled features are completely eliminated at compile time.

## Game Lifecycle

```
1. Setup
   └── Deploy contracts with extension addresses configured

2. Mint
   └── Create tokens with game configuration and metadata
   └── Emits TokenMetadata event with game_id

3. Create
   └── Initialize game state (validate ownership, create models)
   └── Game ID = Token ID (tight coupling)

4. Play
   └── Validate is_playable()
   └── Execute game logic (wrapped in pre/post actions)
   └── Update game state via Dojo models

5. Sync
   └── Call update_game() to synchronize token state
   └── Token queries game for score/game_over status

6. Complete
   └── Game ends when game_over() returns true
   └── Achievements/objectives processed
```

## Best Practices

### 1. Always Verify Token Ownership
```cairo
let token_address = self.token_address();
assert_token_ownership(token_address, game_id);
```

### 2. Always Use Pre/Post Action Hooks
```cairo
pre_action(token_address, game_id);
// ... game logic ...
post_action(token_address, game_id);
```

### 3. Validate Lifecycle Before Actions
```cairo
let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
assert!(token_metadata.lifecycle.is_playable(get_block_timestamp()), "...");
```

### 4. Emit Events for Frontend Sync
```cairo
world.emit_event(@StartGame { player, timestamp, game_id });
```

### 5. Implement IMinigameTokenData
Every game must implement `score()` and `game_over()` for the token contract.

## Dependencies

```toml
[dependencies]
game_components_minigame = { git = "Provable-Games/game-components", tag = "v2.13.1" }
game_components_token = { git = "Provable-Games/game-components", tag = "v2.13.1" }
game_components_metagame = { git = "Provable-Games/game-components", tag = "v2.13.1" }
```

## Interface IDs

For SRC5 interface discovery:
```cairo
pub const IMINIGAME_ID: felt252 = 0x02c0f9265d...;
pub const IMINIGAME_TOKEN_ID: felt252 = 0xa08df7e54b...;
```
