# Deploy Runbook

## Toolchain (match CI)
- from `.tool-versions`:
  - `sozo 1.8.6`
  - `katana 1.7.1`
  - `torii 1.8.14`
  - `scarb 2.15.1`

## Slot Deployment (authoritative path)
- Run from repo root:

```bash
./scripts/deploy_slot.sh
```

- This script performs the full flow:
  - build
  - declare external classes
  - deploy external contracts (`MinigameRegistryContract`, `FullTokenContract`, `ZStarToken`)
  - update `dojo_slot.toml`
  - run `sozo migrate -P slot`
  - update `contracts/torii_slot.toml`
  - update `client-budokan/.env.slot`
  - update `contracts/manifest_slot.json`

## Profile Usage
- `slot`: default local/shared Slot workflow; prefer `./scripts/deploy_slot.sh`.
- `sepolia`: use `sozo migrate -P sepolia` with your network credentials/keystore.
- `mainnet`: use `sozo migrate -P mainnet` with production credentials/keystore.

## Important: `sozo migrate` Alone
- `sozo migrate -P slot` does **not** deploy external contracts by itself.
- Use the script above unless you intentionally do manual declare/deploy steps.

## `dojo_*.toml` Init Args (easy to break)
- `config_system.dojo_init` requires 3 args:
  1) `creator_address`
  2) `cube_token_address`
  3) `payment_token_address`
- `payment_token_address` is environment/profile-specific and should not be hardcoded in contract source.

- Option encoding in TOML:
  - `Option::None` => `"1"`
  - `Option::Some(addr)` => `"0", "<addr>"`

## After Contract Changes
1. Update `dojo_*.toml` init args if signatures changed.
2. Run deploy/migrate flow (`deploy_slot.sh` preferred).
3. Confirm refreshed manifest is in `contracts/manifest_slot.json`.
4. Validate frontend against updated schema:

```bash
cd client-budokan
pnpm tsc --noEmit
pnpm build
```

## Frontend Local Verification
- Slot dev server:

```bash
cd client-budokan
pnpm slot
```

- URL for manual/Playwright checks:
  - `https://127.0.0.1:5125`

## Canonical Read Order
1. `AGENTS.md`
2. `docs/PROJECT_REFERENCE.md`
3. `docs/DEPLOY_RUNBOOK.md`
4. `docs/ASSET_PIPELINE.md`
5. `CLAUDE.md` (pointer only)
