# Asset Pipeline

## Scope
- Asset generation tooling lives in `scripts/generate-assets/`.
- This pipeline is separate from contract/frontend build/test.
- Detailed prompt/model internals live in `scripts/generate-assets/README.md`.

## Prerequisites
- `FAL_KEY` in repo-root `.env`.
- Node tooling available (`tsx`, `sharp`, `@fal-ai/client`).

## Primary Commands

### Images
```bash
# plan only
npx tsx scripts/generate-assets/generate-images.ts --dry-run

# generate all image scopes
npx tsx scripts/generate-assets/generate-images.ts

# generate one theme/category
npx tsx scripts/generate-assets/generate-images.ts --theme theme-4
npx tsx scripts/generate-assets/generate-images.ts --theme theme-3 --asset blocks
npx tsx scripts/generate-assets/generate-images.ts --scope global --asset bonus-icons
```

### SFX
```bash
# plan only
npx tsx scripts/generate-assets/generate-sfx.ts --dry-run

# generate all
npx tsx scripts/generate-assets/generate-sfx.ts

# specific effects
npx tsx scripts/generate-assets/generate-sfx.ts --only click,coin,victory
```

## Data/Template Sources
- `scripts/generate-assets/data/themes.json`
- `scripts/generate-assets/data/sfx.json`
- `scripts/generate-assets/data/global-assets.json`
- `scripts/generate-assets/data/templates/*`

## Output Consumption
- Generated frontend assets are consumed from `client-budokan/public/assets/**`.
- Verify generated filenames/paths match what `client-budokan/src/config/themes.ts` expects.

## Practical Workflow
1. Dry-run first.
2. Generate targeted scope (single theme/category) before full batch.
3. Validate in app locally (`pnpm slot`) after generation.

## Canonical Read Order
1. `AGENTS.md`
2. `docs/PROJECT_REFERENCE.md`
3. `docs/DEPLOY_RUNBOOK.md`
4. `docs/ASSET_PIPELINE.md`
5. `CLAUDE.md` (pointer only)
