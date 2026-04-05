# Project Reference

## Scope
- Main app: `client-budokan/`
- Contracts: `contracts/`
- Ignore `new-client-budokan/` unless explicitly requested.

## Runtime Architecture (current)
- **Story mode** is non-NFT and created through `story_system`.
- **Endless mode** remains NFT-based (`FullTokenContract` / EGC flow).
- **Daily** exists in contracts/client but is not part of the current MVP scope.

## Current Game Design (MVP)
- Story loop:
  - select unlocked level on map
  - play one level
  - on clear/fail, return to map
- Story progression:
  - unlocked level range is sequential
  - replay of already-unlocked levels is allowed
  - clearing the current blocker level unlocks the next level
- Stars:
  - stars are tracked per level (0-3) in `StoryProgress.level_stars`
  - completion mints only star improvement delta (no duplicate full mint)
- Perfection:
  - 30/30 stars in a zone allows one-time `claim_perfection(zone_id)`
  - perfection reward mints zStar and grants XP
- Zone unlock economy:
  - Zone 1 free
  - Zone 2 unlock supports stars, payment, and hybrid burn+payment path
  - hybrid discount burn is capped at 90%
- Endless MVP:
  - only Zone 1 endless is enabled
  - unlock requires Story Zone 1 boss clear
  - leaderboard keeps top score per player per week
  - all-time is PB-only (not an all-time ranked board)

## Known MVP Limits
- Story/content scope is limited to 2 zones in current MVP wiring.
- Endless is contract-gated to Zone 1 only in current MVP logic.
- Daily challenge logic exists but is intentionally out of current MVP scope.

## MVP Gameplay Contract Invariants (current)
- Story entrypoints (`contracts/src/systems/story.cairo`):
  - `start_run(zone_id)`
  - `replay_level(zone_id, level)`
  - `claim_perfection(zone_id)`
- Story progression models (`contracts/src/models/story.cairo`):
  - `StoryProgress(player, zone_id)`
  - `StoryGame(game_id)`
  - `ActiveStoryGame(player)`
- Story settings mapping is fixed:
  - `settings_id = (zone_id - 1) * 2`
- MVP story content is zone-scoped to first 2 zones in config/UI.
- Endless MVP restriction in contract logic:
  - only Endless Zone 1 (`settings_id == 1`)
  - requires `StoryProgress(zone 1).boss_cleared`.

## Economy / Unlock Rules (current)
- Zone unlock paths are in `config_system`:
  - `unlock_with_stars(settings_id)`
  - `purchase_map(settings_id)`
- `purchase_map()` hybrid math:
  - star burn contributes discount
  - burn is capped by 90% discount ceiling
  - remaining payment is floored integer math
- Zone 2 default metadata:
  - `star_cost = 50`
  - `price = 5_000_000` (base units)
  - `payment_token` comes from `dojo_init(payment_token_address)`.

## Canonical Read Order
1. `AGENTS.md`
2. `docs/PROJECT_REFERENCE.md`
3. `docs/DEPLOY_RUNBOOK.md`
4. `docs/ASSET_PIPELINE.md`
5. `CLAUDE.md` (pointer only)

## Config / Settings Notes
- `config_system.dojo_init` signature is:
  1) `creator_address`
  2) `cube_token_address`
  3) `payment_token_address`
- Keep all `dojo_*.toml` init args aligned with this signature.
- Option encoding in `dojo_*.toml`:
  - `Option::None` => `"1"`
  - `Option::Some(x)` => `"0", "<x>"`

## Frontend Wiring Truths
- Manifest selection is centralized in:
  - `client-budokan/src/config/manifest.ts`
- Dojo setup/sync entrypoint:
  - `client-budokan/src/dojo/setup.ts`
- System call wrappers:
  - `client-budokan/src/dojo/systems.ts`
- Story map/progression should be driven by `StoryProgress`, not `PlayerBestRun`.
- RECS key normalization for game lookups matters (`useGame.tsx` strips leading zeros).

## Commands You Actually Use
- Contracts:
  - `scarb fmt --check`
  - `scarb build`
  - `scarb test`
- Frontend (`client-budokan/`):
  - `pnpm slot` (HTTPS on 5125)
  - `pnpm tsc --noEmit`
  - `pnpm build`
  - `pnpm lint`

## CI Order (authoritative)
- `.github/workflows/ci.yaml` enforces:
  - format -> build -> test
