# zKube Scripts

## Deployment

**deploy_slot.sh** — Full deployment to Cartridge Slot (Katana):
```bash
./scripts/deploy_slot.sh
```
Declares + deploys MinigameRegistryContract, FullTokenContract, ZStarToken.
Runs `sozo migrate`, updates dojo_slot.toml, torii config, and client .env.
Must run from workspace root.

**deploy_sepolia.sh** — Full deployment to Starknet Sepolia:
```bash
DOJO_PRIVATE_KEY="0x..." ./scripts/deploy_sepolia.sh
```
Same flow as slot with longer confirmation waits.
Grants MINTER_ROLE on ZStarToken to game_system and config_system post-deploy.

## Testing

**e2e_slot_without_torii.sh** — Runtime E2E test (mint, create, move):
```bash
./scripts/e2e_slot_without_torii.sh
```

## Utilities

**create_daily_presets.sh** — Template for creating daily challenge presets.
**encode_full_token_calldata.py** — Constructor calldata encoder for FullTokenContract.
**generate-assets/** — Asset generation tooling.
