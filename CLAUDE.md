# CLAUDE.md

## Source of Truth

If prose docs conflict with scripts/config, trust executable sources:
- `.tool-versions` (toolchain versions)
- `.github/workflows/ci.yaml` (build order)
- `scripts/deploy_slot.sh` (deploy flow)
- `dojo_*.toml` (init args, profiles)
- `client-budokan/package.json` (frontend scripts)

## Scope

- Main frontend: `client-budokan/`
- Contracts: `contracts/` (root `Scarb.toml` workspace only includes `contracts`)
- Ignore `new-client-budokan/` unless explicitly asked

## Toolchain

All versions in `.tool-versions` — do not hardcode; read that file.

## Contract Workflow

- Format: `scarb fmt --check`
- Build: `scarb build`
- Test: `scarb test`
- CI enforces: fmt -> build -> test (`.github/workflows/ci.yaml`)

## Frontend Workflow (`client-budokan/`)

- Dev (slot): `pnpm slot` (HTTPS on port 5125 via mkcert)
- Typecheck: `pnpm tsc --noEmit`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Browser checks must use `https://127.0.0.1:5125` (not http)

## Deploy

- **Slot**: `./scripts/deploy_slot.sh` from repo root
  - Full flow: build, declare externals, deploy externals (MinigameRegistryContract, FullTokenContract, ZStarToken), update `dojo_slot.toml`, `sozo migrate -P slot`, update manifest/env/torii configs
  - `sozo migrate` alone does NOT deploy external contracts
- **Sepolia**: `sozo migrate -P sepolia` with network credentials/keystore
- **Mainnet**: `sozo migrate -P mainnet` with production credentials/keystore

## Config (`dojo_*.toml`)

- `config_system.dojo_init` requires 3 args:
  1. `creator_address`
  2. `cube_token_address`
  3. `payment_token_address`
- Option encoding:
  - `Option::None` => `"1"`
  - `Option::Some(x)` => `"0", "<x>"`
- Keep all `dojo_*.toml` init args in sync with the signature before migration

## After Contract Changes

1. Update `dojo_*.toml` init args if signatures changed
2. Run deploy/migrate flow (prefer `deploy_slot.sh`)
3. Confirm refreshed manifest in `contracts/manifest_slot.json`
4. Validate frontend: `pnpm tsc --noEmit && pnpm build` in `client-budokan/`

## Runtime Architecture

- **Story mode**: non-NFT, via `story_system`
- **Endless mode**: NFT-based (FullTokenContract / EGC flow)
- **Daily**: exists in contracts/client but out of current MVP scope

## MVP Contract Semantics

- Story entrypoints (`contracts/src/systems/story.cairo`):
  - `start_run(zone_id)`, `replay_level(zone_id, level)`, `claim_perfection(zone_id)`
- Story models (`contracts/src/models/story.cairo`):
  - `StoryProgress(player, zone_id)`, `StoryGame(game_id)`, `ActiveStoryGame(player)`
- Settings mapping: `settings_id = (zone_id - 1) * 2`
- Story/content scope limited to 2 zones in current MVP wiring
- Endless MVP: Zone 1 only (`settings_id == 1`), requires `StoryProgress(zone 1).boss_cleared`

## Economy (summary)

- Zone 1 free; Zones 2+ require stars, payment, or hybrid burn+payment
- `purchase_map()` hybrid: star burn discount capped at 90%, floor-priced remainder
- Zone 2 defaults: `star_cost=50`, `price=5_000_000` (base units), `payment_token` from `dojo_init`
- Stars delta-only: replaying a 3-star level mints 0 new stars
- Perfection: 30/30 stars in zone allows one-time `claim_perfection(zone_id)`
- Full reference: `docs/ECONOMY.md`

## Client Wiring

- Manifest selection: `client-budokan/src/config/manifest.ts` (reads `contracts/manifest_*.json`)
- Dojo setup: `client-budokan/src/dojo/setup.ts`
- System call wrappers: `client-budokan/src/dojo/systems.ts`
- Story progression reads `StoryProgress`, not `PlayerBestRun`, for map/zone state
- RECS key normalization: `useGame.tsx` strips leading zeros for game lookups
- Story tx wrappers must extract `game_id` from story event payload (StartGame path)

## Further Reference

- Economy details: `docs/ECONOMY.md`
- Zone design (settings, mutators, bosses): `docs/ZONE_DESIGN.md`
- Client feature matrix and priority gaps: `docs/CLIENT_FLOWS_AND_GAPS.md`
- Asset pipeline: `scripts/generate-assets/README.md`
