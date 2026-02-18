import fs from "node:fs";
import path from "node:path";
import {
  buildBackgroundPrompt,
  buildBlock1Prompt,
  buildBlockMultiPrompt,
  buildBonusIconPrompt,
  buildButtonPrompt,
  buildGridBackgroundPrompt,
  buildGridFramePrompt,
  buildLoadingBackgroundPrompt,
  buildLogoPrompt,
  buildMapPrompt,
  buildPanelPrompt,
  buildParticlePrompt,
  buildThemeIconPrompt,
  buildUiChromePrompt,
  buildWhiteIconPrompt,
} from "./lib/prompts";
import { CONCURRENCY, IMAGE_MODEL, COMMON_ROOT, ASSETS_ROOT, formatError, loadPLimitFactory, relativePath } from "./lib/env";
import { fal, generateImage, savePng } from "./lib/fal-client";
import { GLOBAL_ASSETS, PER_THEME_ASSETS, type AssetCategory, type AssetJob, type CliOptions, type GlobalAsset, type GlobalAssetsData, type PerThemeAsset, type ThemeDefinition } from "./lib/types";

const DATA_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "data");

const themes: Record<string, ThemeDefinition> = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "themes.json"), "utf-8"));
const globalAssets: GlobalAssetsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "global-assets.json"), "utf-8"));

const PER_THEME_ASSET_SET = new Set<PerThemeAsset>(PER_THEME_ASSETS);
const GLOBAL_ASSET_SET = new Set<GlobalAsset>(GLOBAL_ASSETS);
const ALL_ASSET_SET = new Set<AssetCategory>([...PER_THEME_ASSETS, ...GLOBAL_ASSETS]);

function shouldIncludeCategory(category: AssetCategory, filter?: AssetCategory): boolean {
  return !filter || filter === category;
}

function getTargetDimensions(filename: string, fallback: { width: number; height: number }): { width: number; height: number } {
  return globalAssets.targetDimensions[filename] ?? fallback;
}

function buildPerThemeJobs(themeId: string, theme: ThemeDefinition, filter?: AssetCategory): AssetJob[] {
  const themeRoot = path.join(ASSETS_ROOT, themeId);
  const jobs: AssetJob[] = [];

  if (shouldIncludeCategory("blocks", filter)) {
    for (let i = 0; i < 4; i += 1) {
      const width = i + 1;
      const color = theme.palette.blocks[i];
      const filename = `block-${width}.png`;
      const target = getTargetDimensions(filename, { width: 1024, height: 1024 });

      if (width === 1) {
        jobs.push({
          scope: "per-theme",
          category: "blocks",
          themeId,
          filename,
          outputPath: path.join(themeRoot, filename),
          prompt: buildBlock1Prompt(theme, color, i),
          width: target.width,
          height: target.height,
          phase: 0,
        });
      } else {
        const block1Path = path.join(themeRoot, "block-1.png");
        jobs.push({
          scope: "per-theme",
          category: "blocks",
          themeId,
          filename,
          outputPath: path.join(themeRoot, filename),
          prompt: buildBlockMultiPrompt(theme, color, i, width),
          width: target.width,
          height: target.height,
          refPaths: [block1Path],
          phase: 1,
        });
      }
    }
  }

  if (shouldIncludeCategory("background", filter)) {
    jobs.push({
      scope: "per-theme",
      category: "background",
      themeId,
      filename: "background.png",
      outputPath: path.join(themeRoot, "background.png"),
      prompt: buildBackgroundPrompt(theme),
      ...getTargetDimensions("background.png", { width: 2048, height: 2048 }),
    });
  }

  if (shouldIncludeCategory("loading-bg", filter)) {
    jobs.push({
      scope: "per-theme",
      category: "loading-bg",
      themeId,
      filename: "loading-bg.png",
      outputPath: path.join(themeRoot, "loading-bg.png"),
      prompt: buildLoadingBackgroundPrompt(theme),
      ...getTargetDimensions("loading-bg.png", { width: 2048, height: 2048 }),
    });
  }

  if (shouldIncludeCategory("logo", filter)) {
    jobs.push({
      scope: "per-theme",
      category: "logo",
      themeId,
      filename: "logo.png",
      outputPath: path.join(themeRoot, "logo.png"),
      prompt: buildLogoPrompt(theme),
      ...getTargetDimensions("logo.png", { width: 512, height: 512 }),
    });
  }

  if (shouldIncludeCategory("grid", filter)) {
    jobs.push({
      scope: "per-theme",
      category: "grid",
      themeId,
      filename: "grid-bg.png",
      outputPath: path.join(themeRoot, "grid-bg.png"),
      prompt: buildGridBackgroundPrompt(theme),
      ...getTargetDimensions("grid-bg.png", { width: 512, height: 640 }),
    });
    jobs.push({
      scope: "per-theme",
      category: "grid",
      themeId,
      filename: "grid-frame.png",
      outputPath: path.join(themeRoot, "grid-frame.png"),
      prompt: buildGridFramePrompt(theme),
      ...getTargetDimensions("grid-frame.png", { width: 576, height: 720 }),
    });
  }

  if (shouldIncludeCategory("theme-icon", filter)) {
    jobs.push({
      scope: "per-theme",
      category: "theme-icon",
      themeId,
      filename: "theme-icon.png",
      outputPath: path.join(themeRoot, "theme-icon.png"),
      prompt: buildThemeIconPrompt(theme),
      ...getTargetDimensions("theme-icon.png", { width: 128, height: 128 }),
    });
  }

  if (shouldIncludeCategory("map", filter)) {
    jobs.push({
      scope: "per-theme",
      category: "map",
      themeId,
      filename: "map.png",
      outputPath: path.join(themeRoot, "map.png"),
      prompt: buildMapPrompt(theme),
      ...getTargetDimensions("map.png", { width: 1080, height: 1920 }),
    });
  }

  return jobs;
}

function buildGlobalJobs(filter?: AssetCategory): AssetJob[] {
  const jobs: AssetJob[] = [];

  if (shouldIncludeCategory("buttons", filter)) {
    for (const [key, config] of Object.entries(globalAssets.buttons)) {
      const filename = `btn-${key}.png`;
      jobs.push({
        scope: "global",
        category: "buttons",
        filename,
        outputPath: path.join(COMMON_ROOT, "buttons", filename),
        prompt: buildButtonPrompt(config.desc, config.color, config.highlight, config.shadow),
        width: 1024,
        height: 1024,
      });
    }
  }

  if (shouldIncludeCategory("shared-icons", filter)) {
    for (const icon of globalAssets.sharedIcons) {
      jobs.push({
        scope: "global",
        category: "shared-icons",
        filename: icon.filename,
        outputPath: path.join(COMMON_ROOT, "icons", icon.filename),
        prompt: buildWhiteIconPrompt(icon.description),
        width: 1024,
        height: 1024,
      });
    }
  }

  if (shouldIncludeCategory("catalog-icons", filter)) {
    for (const icon of globalAssets.catalogIcons) {
      jobs.push({
        scope: "global",
        category: "catalog-icons",
        filename: icon.filename,
        outputPath: path.join(COMMON_ROOT, "icons", icon.filename),
        prompt: buildWhiteIconPrompt(icon.description),
        width: 1024,
        height: 1024,
      });
    }
  }

  if (shouldIncludeCategory("bonus-icons", filter)) {
    for (const bonus of globalAssets.bonusIcons) {
      jobs.push({
        scope: "global",
        category: "bonus-icons",
        filename: bonus.filename,
        outputPath: path.join(COMMON_ROOT, "bonus", bonus.filename),
        prompt: buildBonusIconPrompt(bonus.description),
        width: 1024,
        height: 1024,
      });
    }
  }

  if (shouldIncludeCategory("ui-chrome", filter)) {
    for (const chrome of globalAssets.uiChrome) {
      jobs.push({
        scope: "global",
        category: "ui-chrome",
        filename: chrome.filename,
        outputPath: path.join(COMMON_ROOT, "ui", chrome.filename),
        prompt: buildUiChromePrompt(chrome.description, chrome.width, chrome.height),
        width: chrome.width,
        height: chrome.height,
      });
    }
  }

  if (shouldIncludeCategory("panels", filter)) {
    for (const panel of globalAssets.panels) {
      jobs.push({
        scope: "global",
        category: "panels",
        filename: panel.filename,
        outputPath: path.join(COMMON_ROOT, "panels", panel.filename),
        prompt: buildPanelPrompt(panel.material, panel.alpha),
        width: 1024,
        height: 1024,
      });
    }
  }

  if (shouldIncludeCategory("particles", filter)) {
    for (const particle of globalAssets.particles) {
      jobs.push({
        scope: "global",
        category: "particles",
        filename: particle.filename,
        outputPath: path.join(COMMON_ROOT, "particles", particle.filename),
        prompt: buildParticlePrompt(particle.description),
        width: 1024,
        height: 1024,
      });
    }
  }

  return jobs;
}

function readFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function printHelp(): void {
  console.log("Usage: npx tsx scripts/generate-assets/generate-images.ts [options]");
  console.log("");
  console.log("Options:");
  console.log("  --theme <theme-id>       Generate per-theme assets for one theme (example: theme-4)");
  console.log("  --scope <scope>          per-theme | global | all (default: per-theme)");
  console.log("  --asset <category>       Filter to one category");
  console.log("  --dry-run                Print plan only; do not call generation API");
  console.log("  --ref                    Use block-1 as optional reference for wider blocks (default)");
  console.log("  --no-ref                 Disable optional image references");
  console.log("  --help                   Show this help");
  console.log("");
  console.log("Scopes: per-theme | global | all");
  console.log(`Per-theme categories: ${PER_THEME_ASSETS.join(", ")}`);
  console.log(`Global categories: ${GLOBAL_ASSETS.join(", ")}`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    scope: "per-theme",
    dryRun: false,
    includeRefs: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--theme") {
      options.theme = readFlagValue(argv, i, "--theme");
      i += 1;
      continue;
    }

    if (arg === "--scope") {
      const scope = readFlagValue(argv, i, "--scope");
      if (scope !== "per-theme" && scope !== "global" && scope !== "all") {
        throw new Error(`Invalid scope: ${scope}. Expected per-theme | global | all`);
      }
      options.scope = scope;
      i += 1;
      continue;
    }

    if (arg === "--asset") {
      const asset = readFlagValue(argv, i, "--asset");
      if (!ALL_ASSET_SET.has(asset as AssetCategory)) {
        throw new Error(`Invalid asset category: ${asset}`);
      }
      options.asset = asset as AssetCategory;
      i += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--ref") {
      options.includeRefs = true;
      continue;
    }

    if (arg === "--no-ref") {
      options.includeRefs = false;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function validateAssetAgainstScope(options: CliOptions): void {
  if (!options.asset) {
    return;
  }

  if (options.scope === "per-theme" && !PER_THEME_ASSET_SET.has(options.asset as PerThemeAsset)) {
    throw new Error(
      `Asset category "${options.asset}" is not valid for scope "per-theme". Valid categories: ${PER_THEME_ASSETS.join(
        ", ",
      )}`,
    );
  }

  if (options.scope === "global" && !GLOBAL_ASSET_SET.has(options.asset as GlobalAsset)) {
    throw new Error(
      `Asset category "${options.asset}" is not valid for scope "global". Valid categories: ${GLOBAL_ASSETS.join(", ")}`,
    );
  }
}

function buildJobList(options: CliOptions): { jobs: AssetJob[]; selectedThemeIds: string[] } {
  validateAssetAgainstScope(options);

  const jobs: AssetJob[] = [];
  const selectedThemeIds: string[] = [];

  if (options.scope === "per-theme" || options.scope === "all") {
    if (options.theme) {
      if (!themes[options.theme]) {
        throw new Error(`Unknown theme "${options.theme}". Available: ${Object.keys(themes).join(", ")}`);
      }
      selectedThemeIds.push(options.theme);
    } else {
      selectedThemeIds.push(...Object.keys(themes));
    }

    for (const themeId of selectedThemeIds) {
      jobs.push(...buildPerThemeJobs(themeId, themes[themeId], options.asset));
    }
  }

  if (options.scope === "global" || options.scope === "all") {
    jobs.push(...buildGlobalJobs(options.asset));
  }

  return { jobs, selectedThemeIds };
}

function buildHeaderThemeLabel(options: CliOptions, selectedThemeIds: string[]): string {
  if (options.scope === "global") {
    return "n/a (global assets only)";
  }

  if (selectedThemeIds.length === 1) {
    const id = selectedThemeIds[0];
    return `${id} (${themes[id].name})`;
  }

  return `all (${selectedThemeIds.length} themes)`;
}

function outputSummaryPath(options: CliOptions, selectedThemeIds: string[]): string {
  if (options.scope === "global") {
    return "client-budokan/public/assets/common/";
  }
  if (options.scope === "per-theme" && selectedThemeIds.length === 1) {
    return `client-budokan/public/assets/${selectedThemeIds[0]}/`;
  }
  return "client-budokan/public/assets/";
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { jobs, selectedThemeIds } = buildJobList(options);

  console.log("🎨 zKube Asset Generator");
  console.log(`Model: ${IMAGE_MODEL}`);
  console.log(`Theme: ${buildHeaderThemeLabel(options, selectedThemeIds)}`);
  console.log(`Scope: ${options.scope}`);
  console.log(`Reference images: ${options.includeRefs ? "enabled" : "disabled"}`);
  if (options.asset) {
    console.log(`Asset filter: ${options.asset}`);
  }
  if (options.dryRun) {
    console.log("Dry run: enabled");
  }
  console.log("");

  if (jobs.length === 0) {
    console.log("No assets matched the selected filters.");
    return;
  }

  console.log(`Generating ${jobs.length} assets...`);
  console.log("");

  if (options.dryRun) {
    jobs.forEach((job, index) => {
      const step = `[${index + 1}/${jobs.length}]`;
      console.log(`${step}  ⏳ ${job.filename}...`);
      console.log(`${step}  🧪 dry-run -> ${relativePath(job.outputPath)}`);
    });
    console.log("");
    console.log(`✅ Dry run complete! ${jobs.length}/${jobs.length} assets planned.`);
    console.log(`Output: ${outputSummaryPath(options, selectedThemeIds)}`);
    return;
  }

  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is required for generation. Export it and retry.");
  }

  fal.config({ credentials: process.env.FAL_KEY });

  if (jobs.some((job) => job.category === "buttons")) {
    console.log("ℹ️  Button -pressed and -disabled variants are intentionally not generated via API.");
    console.log("");
  }

  const pLimitFactory = await loadPLimitFactory();
  const limit = pLimitFactory(CONCURRENCY);
  const failures: Array<{ job: AssetJob; error: unknown; index: number }> = [];
  let successCount = 0;

  const phase0Jobs = jobs.filter((j) => (j.phase ?? 0) === 0);
  const phase1Jobs = jobs.filter((j) => (j.phase ?? 0) === 1);
  const totalJobs = jobs.length;
  let globalIndex = 0;

  const runBatch = async (batch: AssetJob[]) => {
    await Promise.all(
      batch.map((job) =>
        limit(async () => {
          globalIndex += 1;
          const step = `[${globalIndex}/${totalJobs}]`;
          const startedAt = Date.now();
          console.log(`${step}  ⏳ ${job.filename}...`);

          try {
            const imageBuffer = await generateImage(job, options.includeRefs);
            await savePng(job.outputPath, imageBuffer);
            const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
            console.log(`${step}  ✅ ${job.filename} (${elapsed}s)`);
            successCount += 1;
          } catch (error) {
            const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
            failures.push({ job, error, index: globalIndex - 1 });
            console.log(`${step}  ❌ ${job.filename} (${elapsed}s)`);
            console.log(`       ${formatError(error)}`);
          }
        }),
      ),
    );
  };

  if (phase0Jobs.length > 0) {
    await runBatch(phase0Jobs);
  }

  if (phase1Jobs.length > 0) {
    console.log("");
    console.log(`Phase 2: generating ${phase1Jobs.length} multi-cell blocks (using block-1 as optional reference)...`);
    console.log("");
    await runBatch(phase1Jobs);
  }

  console.log("");

  if (failures.length === 0) {
    console.log(`✅ Complete! ${successCount}/${jobs.length} assets generated.`);
  } else {
    console.log(`⚠️ Complete with errors. ${successCount}/${jobs.length} assets generated.`);
    for (const failure of failures) {
      const step = `[${failure.index + 1}/${jobs.length}]`;
      console.log(`- ${step} ${relativePath(failure.job.outputPath)}: ${formatError(failure.error)}`);
    }
    process.exitCode = 1;
  }

  console.log(`Output: ${outputSummaryPath(options, selectedThemeIds)}`);
}

main().catch((error) => {
  console.error(`\n❌ ${formatError(error)}`);
  process.exit(1);
});
