# zkube Deployment Guide

This guide explains how to deploy zkube using `FullTokenContract` from game-components, following the same pattern as death-mountain and dark-shuffle.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Flow                          │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Build contracts (sozo build)                       │
│  Step 2: Declare external contract classes (sozo declare)   │
│  Step 3: Deploy MinigameRegistryContract (sozo deploy)      │
│  Step 4: Deploy FullTokenContract (sozo deploy)             │
│  Step 5: Update dojo config with denshokan address          │
│  Step 6: Deploy Dojo world (sozo migrate)                   │
│  Step 7: Update client configuration                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Contract Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  External Contracts (deployed separately):                  │
│  ├── MinigameRegistryContract (game registry)              │
│  └── FullTokenContract (ERC721 game NFTs / denshokan)      │
│                                                             │
│  Dojo Systems (deployed via sozo migrate):                  │
│  ├── game_system (implements IMinigameTokenData)           │
│  ├── shop_system (permanent upgrades)                      │
│  ├── cube_token (soulbound ERC1155 CUBE)                   │
│  └── config_system                                          │
│                                                             │
│  Connection:                                                │
│  └── game_system.dojo_init(denshokan_address=FullToken)    │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Scarb installed (matches project version)
- Sozo installed (Dojo CLI)
- jq installed (for JSON parsing)

## Key Learnings

### Option Type Serialization in dojo_*.toml

```toml
[init_call_args]
"namespace-game_system" = [
    "0x123...",  # ContractAddress
    "0x456...",  # denshokan_address (FullTokenContract address)
    "1",         # Option::None (just "1", not "0", "0")
]
```

- `Option::Some(address)` = `"0", "address"`
- `Option::None` = `"1"`

### ByteArray Serialization in sozo deploy

```bash
sozo deploy CLASS_HASH --constructor-calldata \
    str:'Token Name' \    # ByteArray via str: prefix
    str:'SYMBOL' \        # ByteArray
    str:'' \              # Empty ByteArray
    0x123... \            # ContractAddress
    500 \                 # u128 (royalty fraction)
    0 0x456... \          # Option::Some(address)
    1                     # Option::None
```

### External Contracts Are NOT Deployed via sozo migrate

The `build-external-contracts` in Scarb.toml only **builds** the contracts. They must be deployed separately using `sozo declare` + `sozo deploy` before running `sozo migrate`.

## Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
./scripts/deploy_slot.sh
```

This script handles the complete workflow automatically.

### Method 2: Manual Deployment

#### Step 1: Build

```bash
cd contracts
sozo clean -P slot
sozo build -P slot
```

#### Step 2: Declare External Contract Classes

```bash
# Declare MinigameRegistryContract
sozo declare -P slot \
    --account-address $ACCOUNT \
    --private-key $PK \
    --rpc-url $RPC \
    target/slot/zkube_MinigameRegistryContract.contract_class.json

# Declare FullTokenContract
sozo declare -P slot \
    --account-address $ACCOUNT \
    --private-key $PK \
    --rpc-url $RPC \
    target/slot/zkube_FullTokenContract.contract_class.json
```

#### Step 3: Deploy MinigameRegistryContract

```bash
sozo deploy -P slot \
    --account-address $ACCOUNT \
    --private-key $PK \
    --rpc-url $RPC \
    $REGISTRY_CLASS_HASH \
    --constructor-calldata \
        str:'zKube Registry' \
        str:'ZKUBEREG' \
        str:'' \
        1  # event_relayer: Option::None
```

#### Step 4: Deploy FullTokenContract

```bash
sozo deploy -P slot \
    --account-address $ACCOUNT \
    --private-key $PK \
    --rpc-url $RPC \
    $TOKEN_CLASS_HASH \
    --constructor-calldata \
        str:'zKube' \
        str:'ZK' \
        str:'' \
        $ACCOUNT \
        500 \
        0 $REGISTRY_ADDRESS \  # game_registry: Option::Some
        1                       # event_relayer: Option::None
```

#### Step 5: Update Configuration

Edit `dojo_slot.toml`:

```toml
[init_call_args]
"zkube_budo_v1_2_0-game_system" = [
    "0x<your_creator_address>",
    "0x<FullTokenContract_address>",  # denshokan_address
    "1",  # renderer_address: Option::None
]
```

#### Step 6: Deploy Dojo World

**CRITICAL:** Must run from workspace root, NOT from `contracts/`:
```bash
sozo migrate -P slot
```

#### Step 7: Extract CubeToken Address

After migration, extract the CubeToken address from the manifest:
```bash
CUBE_TOKEN=$(jq -r '.contracts[] | select(.tag | contains("cube_token")) | .address' manifest_slot.json)
```

#### Step 8: Update Client

Create/update `client-budokan/.env.slot`:

```env
VITE_PUBLIC_DEPLOY_TYPE=slot
VITE_PUBLIC_NODE_URL=https://api.cartridge.gg/x/your-slot/katana
VITE_PUBLIC_TORII=https://api.cartridge.gg/x/your-slot/torii
VITE_PUBLIC_WORLD_ADDRESS=0x<world_address>
VITE_PUBLIC_GAME_TOKEN_ADDRESS=0x<FullTokenContract_address>
VITE_PUBLIC_CUBE_TOKEN_ADDRESS=0x<CubeToken_address>
```

#### Step 9: Update Torii Config

Add the CubeToken as an ERC1155 contract in `torii_slot.toml`:
```toml
[[contracts]]
type = "ERC1155"
address = "0x<CubeToken_address>"
```

## FullTokenContract Features

The game-components `FullTokenContract` provides:

- ERC721 with metadata
- Minting with settings and objectives
- Soulbound token support
- Custom renderer support
- Game registry integration
- Lifecycle management (start/end times)

### Key Interfaces

```cairo
// Token queries game for state
trait IMinigameTokenData {
    fn score(token_id: u64) -> u32;
    fn game_over(token_id: u64) -> bool;
}

// Game implements this in game_system
impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
    fn score(self: @ContractState, token_id: u64) -> u32 {
        let game: Game = world.read_model(token_id);
        game.score.into()
    }
    fn game_over(self: @ContractState, token_id: u64) -> bool {
        let game: Game = world.read_model(token_id);
        game.over
    }
}
```

## Network-Specific Deployment

### Slot (Development)

```bash
./scripts/deploy_slot.sh
# or manually (from workspace root):
sozo migrate -P slot
```

### Sepolia (Testnet)

```bash
# From workspace root:
sozo migrate -P sepolia --keystore /path/to/keystore.json
```

### Mainnet

```bash
# From workspace root:
sozo migrate -P mainnet --keystore /path/to/keystore.json
```

## Deployment Checklist

- [ ] Build contracts: `sozo build -P <profile>`
- [ ] Declare external contract classes
- [ ] Deploy MinigameRegistryContract
- [ ] Deploy FullTokenContract with registry address
- [ ] Update `dojo_<profile>.toml` with FullTokenContract address
- [ ] Deploy Dojo world: `sozo migrate -P <profile>`
- [ ] Update client `.env.<profile>` with addresses
- [ ] Start Torii indexer: `torii --config torii_<profile>.toml`
- [ ] Test game flow on frontend

## Troubleshooting

### "Minigame: Token does not support IMINIGAME_TOKEN_ID"

The denshokan_address in init_call_args is pointing to an invalid address (not a FullTokenContract). Make sure to:
1. Deploy FullTokenContract first
2. Update dojo_*.toml with the deployed address
3. Re-run sozo migrate

### "Failed to deserialize param #N"

Check Option serialization:
- `Option::Some(x)` = `0 x` (two values)
- `Option::None` = `1` (single value)

### External contracts not deployed

External contracts in `build-external-contracts` are only built, not deployed. You must deploy them separately using `sozo declare` + `sozo deploy`.

### Contract already deployed

If `sozo deploy` says "Contract already deployed", use the address from the output. The contract was deployed on a previous attempt.

## References

- Death Mountain deployment: `/references/death-mountain/contracts/dojo_*.toml`
- Dark Shuffle deployment: `/references/dark-shuffle/contracts/dojo_*.toml`
- Game Components docs: `/references/game-components/AGENTS.md`
- FullTokenContract source: `/references/game-components/packages/token/src/examples/`
- Deploy script: `/references/game-components/scripts/deploy_optimized_token.sh`
