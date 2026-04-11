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
  - Full flow: build, declare externals, deploy externals (MinigameRegistryContract, FullTokenContract, ZStarToken), update `dojo_slot.toml`, `sozo migrate -P slot`, grant ZStar roles, update manifest/env/torii configs
  - `sozo migrate` alone does NOT deploy external contracts
- **Sepolia**: `./scripts/deploy_sepolia.sh` (uses shared Denshokan token, no registry deploy)
- **Mainnet**: `sozo migrate -P mainnet` with production credentials/keystore

## Config (`dojo_*.toml`)

System init args (keep in sync with contract signatures before migration):
- `game_system.dojo_init`: `creator_address`, `denshokan_address`, `renderer_address` (Option), `vrf_address`
- `config_system.dojo_init`: `creator_address`, `cube_token_address` (zStar), `payment_token_address` (USDC/STRK)
- `daily_challenge_system.dojo_init`: `admin_address`
- `progress_system.dojo_init`: no args (self-registers quests/achievements)
- Option encoding:
  - `Option::None` => `"1"`
  - `Option::Some(x)` => `"0", "<x>"`

## After Contract Changes

1. Update `dojo_*.toml` init args if signatures changed
2. Run deploy/migrate flow (prefer `deploy_slot.sh`)
3. Confirm refreshed manifest — Dojo 1.8+ writes `manifest_slot.json` at workspace root, `deploy_slot.sh` copies to `contracts/`
4. Validate frontend: `pnpm tsc --noEmit && pnpm build` in `client-budokan/`

## Contract Systems (9 total)

- `game_system` — game creation, bonus application, surrender, NFT metadata via MinigameComponent
- `move_system` — player moves, grid updates, level completion trigger
- `grid_system` — non-hot-path grid ops (initialize, reset, insert line)
- `level_system` — level init, finalization, star calculation, auto-advance, PlayerBestRun updates
- `config_system` — game settings CRUD, zone pricing, access control (purchase/unlock), treasury
- `progress_system` — quest/achievement tracking and zStar reward minting
- `daily_challenge_system` — daily challenge generation, settlement, weekly endless settlement
- `story_system` — story mode zone progression, replay, perfection claims
- `renderer_system` — on-chain SVG/JSON metadata generation for token URIs

## Runtime Architecture

- **Story mode**: non-NFT, via `story_system` — 10 zones × 10 levels each
- **Endless mode**: NFT-based (FullTokenContract / EGC flow) — any zone where boss is cleared
- **Daily challenge**: via `daily_challenge_system` — auto-generated daily, admin-settled rewards
- **Weekly endless**: settlement via `settle_weekly_endless()` — admin provides ranked list per zone
- **Mutator system**: passive mutators (stat modifiers) + active mutators (bonus slots: Hammer, Totem, Wave)

## Contract Semantics

- Story entrypoints (`contracts/src/systems/story.cairo`):
  - `start_story_attempt(zone_id)`, `replay_story_level(zone_id, level)`, `claim_zone_perfection(zone_id)`
- Story models (`contracts/src/models/story.cairo`):
  - `StoryZoneProgress(player, zone_id)`, `StoryAttempt(game_id)`, `ActiveStoryAttempt(player)`
- Daily entrypoints (`contracts/src/systems/daily_challenge.cairo`):
  - `start_daily_game()`, `replay_daily_level(level)`, `settle_challenge(challenge_id, ranked_players)`, `settle_weekly_endless(week_id, settings_id, ranked_players)`
- Daily models (`contracts/src/models/daily.cairo`):
  - `DailyChallenge(challenge_id)`, `DailyEntry(challenge_id, player)`, `DailyAttempt(game_id)`, `ActiveDailyAttempt(player)`
- Settings mapping: `settings_id = (zone_id - 1) * 2`
- 10 zones fully designed (see `docs/ZONE_DESIGN.md`), each with unique theme, mutators, boss
- Endless requires `StoryZoneProgress(zone).boss_cleared` for the target zone

## Economy (summary)

- Zone 1 free; Zones 2+ require stars, payment, or hybrid burn+payment
- Tiered pricing: Tier 1 (Z2-4) $2/40 stars, Tier 2 (Z5-7) $5/100 stars, Tier 3 (Z8-10) $10/200 stars
- Hybrid discount capped at 50% — stars never cover more than half the payment price
- Stars delta-only: replaying a 3-star level mints 0 new stars
- Perfection: 30/30 stars in zone allows one-time `claim_zone_perfection(zone_id)` → 20 zStar + 700 XP
- Daily/weekly settlements are admin-triggered (oracle) — players receive zStar passively
- Full reference: `docs/ECONOMY.md`

## Client Wiring

- Manifest selection: `client-budokan/src/config/manifest.ts` (reads `contracts/manifest_*.json`)
- Dojo setup: `client-budokan/src/dojo/setup.ts`
- System call wrappers: `client-budokan/src/dojo/systems.ts`
- Contract models (RECS): `client-budokan/src/dojo/contractModels.ts` (28 components)
- Story progression reads `StoryZoneProgress`, not `PlayerBestRun`, for map/zone state
- RECS key normalization: `useGame.tsx` strips leading zeros for game lookups
- Story tx wrappers must extract `game_id` from story event payload (StartGame path)
- Pages: Home, PlayScreen, Map, DailyChallenge, BossReveal, Leaderboard, Profile, Rewards, Settings
- State: Zustand stores (navigation, moveTx) + 7 React contexts (Dojo, Music, Sound, GameEvents, Controllers, Quests, Metagame)
- 10 themes with full color palettes, block tints, and per-theme audio

## Further Reference

- Economy details: `docs/ECONOMY.md`
- Zone design (settings, mutators, bosses): `docs/ZONE_DESIGN.md`
- Client feature matrix and priority gaps: `docs/CLIENT_FLOWS_AND_GAPS.md`
- Asset pipeline: `scripts/generate-assets/README.md`
