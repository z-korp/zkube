# AGENTS.md

## Scope and Source of Truth
- Main frontend is `client-budokan/` (ignore `new-client-budokan/` unless explicitly asked).
- Contracts live in `contracts/`; root `Scarb.toml` workspace only includes `contracts`.
- If docs conflict with scripts/config, trust executable sources:
  - `.github/workflows/ci.yaml`
  - `scripts/deploy_slot.sh`
  - `dojo_*.toml`
  - `client-budokan/package.json`

## Toolchain Versions (CI-aligned)
- Use `.tool-versions`:
  - `sozo 1.8.6`
  - `katana 1.7.1`
  - `torii 1.8.14`
  - `scarb 2.15.1`
  - `nodejs 20.19.0`

## Contract Workflow (authoritative commands)
- Format check: `scarb fmt --check`
- Build: `scarb build`
- Test: `scarb test`
- CI order is `fmt -> build -> test` (`.github/workflows/ci.yaml`).

## Frontend Workflow (`client-budokan/`)
- Dev (slot): `pnpm slot` (HTTPS dev server on port `5125` via mkcert).
- Typecheck: `pnpm tsc --noEmit`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Playwright/local browser checks must use `https://127.0.0.1:5125` (not http).

## Deploy / Config Gotchas
- Slot deploy entrypoint: `./scripts/deploy_slot.sh` (run from repo root).
- Script reads/writes root `dojo_slot.toml` and updates:
  - `contracts/manifest_slot.json`
  - `client-budokan/.env.slot`
  - `contracts/torii_slot.toml`
- `sozo migrate` alone does not deploy external token/registry contracts; `deploy_slot.sh` handles `declare + deploy + migrate`.
- `config_system.dojo_init` now requires 3 args:
  1) `creator_address`
  2) `cube_token_address`
  3) `payment_token_address`
- Keep all `dojo_*.toml` `config_system` init args in sync with that signature before migration.
- Dojo init arg encoding quirk when editing `dojo_*.toml` manually:
  - `Option::None` is encoded as `"1"`
  - `Option::Some(addr)` is encoded as `"0", "<addr>"`

## Current MVP Contract Semantics (easy to break)
- Story mode is non-NFT and uses `story_system`:
  - `start_run(zone_id)`
  - `replay_level(zone_id, level)`
  - `claim_perfection(zone_id)`
- Story settings mapping is `settings_id = (zone_id - 1) * 2` (`contracts/src/systems/story.cairo`).
- Endless MVP is restricted and gated in contract logic:
  - only Endless Zone 1 allowed (`settings_id == 1`)
  - requires `StoryProgress(zone 1).boss_cleared`.
- `purchase_map()` implements hybrid unlock math with capped burn (90%) and floor-priced remainder.
- Zone 2 default price is wired as `$5` in base units (`5_000_000`) and payment token comes from init arg.

## Client Wiring Gotchas
- Dojo manifest selection is in `client-budokan/src/config/manifest.ts` (reads `contracts/manifest_*.json`).
- Story tx wrappers must extract `game_id` from story event payload correctly (StartGame path in `dojo/systems.ts`).
- RECS entity key normalization matters for game lookups (`useGame.tsx` strips leading zeros).
- Story progress UI should come from `StoryProgress` (not `PlayerBestRun`) for map/zone state.

## When Changing Contracts
- After contract changes, rebuild/migrate before trusting frontend behavior:
  - update `dojo_*.toml` init args if signatures changed
  - run deploy/migrate flow
  - ensure refreshed `contracts/manifest_slot.json` is used by frontend
  - then run `pnpm tsc --noEmit` and `pnpm build` in `client-budokan/`.

## Canonical References
- Use `AGENTS.md` first, then:
  - `docs/PROJECT_REFERENCE.md`
  - `docs/DEPLOY_RUNBOOK.md`
  - `docs/ASSET_PIPELINE.md`
  - `CLAUDE.md` (root pointer only)
