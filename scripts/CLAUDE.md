# zKube Scripts

## Overview

Utility scripts for deployment, transaction analysis, player analytics, and testing.

## Scripts

### Deployment

**deploy_slot.sh** - Full automated deployment to Cartridge Slot:
```bash
./scripts/deploy_slot.sh
```

This script performs the complete slot deployment:
1. Builds contracts with `sozo build -P slot`
2. Declares MinigameRegistryContract and FullTokenContract classes
3. Deploys MinigameRegistryContract
4. Deploys FullTokenContract with registry address
5. Updates `dojo_slot.toml` with `denshokan_address` and `config_system` external `cube_token_address`
6. Runs `sozo migrate -P slot` to deploy the Dojo world
7. Updates `contracts/torii_slot.toml` with world and token addresses
8. Updates `client-budokan/.env.slot` with all deployed addresses
9. Copies manifest to `contracts/manifest_slot.json`

**Important Notes:**
- Requires a fresh katana instance (restart if you get schema upgrade errors)
- Reads and updates `./dojo_slot.toml` (workspace root)
- External CUBE token can be forced via `CUBE_TOKEN_ADDRESS=0x...`; otherwise script uses current `config_system` init value
- **CRITICAL:** `sozo build` and `sozo migrate` MUST run from the workspace root (`/home/djizus/zkube/`), NOT from `contracts/`. Running from `contracts/` causes init to fail with "contract address 0x0 not deployed"
- Uses configured external CubeToken (ERC20) address for Torii and client env; warns if world manifest `cube_token` differs

**After running the script:**
```bash
# Start Torii indexer
torii --config contracts/torii_slot.toml

# Start the client
cd client-budokan && pnpm slot
```

### Transaction Checking

**check_tx*.py** - Various transaction checking utilities for debugging deployed contracts:
- Verify transaction status
- Decode transaction data
- Debug failed transactions

### Player Analytics

**count_player.py** - Count and analyze player statistics:
- Total player count
- Active players
- Game statistics

### Encoding Utilities

**encode_full_token_calldata.py** - Generate calldata for token operations:
- Encode complex function calls
- Generate multicall data
- Test contract interactions

### Comparison Tools

**comparison.py** - Compare data between environments:
- State comparison across networks
- Contract verification
- Data validation

## Usage

```bash
# Deployment script (bash)
./scripts/deploy_slot.sh

# Python scripts
cd scripts
python <script_name>.py
```

## Requirements

- **deploy_slot.sh**: Requires `sozo`, `jq`, and slot credentials in `dojo_slot.toml`
- **Python scripts**: Python 3.x with Starknet dependencies

## Notes

These scripts are primarily for:
- Slot deployment automation
- Development debugging
- Deployment verification
- Analytics and monitoring
- Testing contract interactions

They are not part of the production application.
