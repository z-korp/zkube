import fs from "node:fs";
import path from "node:path";
import {
  buildBackgroundPrompt,
  buildBlockMasterPromptFromTemplate,
  buildBonusIconPrompt,
  buildButtonPrompt,
  buildGridBackgroundPrompt,
  buildLoadingBackgroundPrompt,
  buildLogoPrompt,
  buildPanelPrompt,
  buildParticlePrompt,
  buildThemeIconPrompt,
  buildUiChromePrompt,
  buildWhiteIconPrompt,
} from "./lib/prompts";
import sharp from "sharp";
import { CONCURRENCY, IMAGE_MODEL, COMMON_ROOT, ASSETS_ROOT, formatError, loadPLimitFactory, relativePath } from "./lib/env";
import { fal, generateImage, savePng, tintImage, featherEdges } from "./lib/fal-client";
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

const MASTER_WIDTH = 1024;
const MASTER_HEIGHT = 256;
const BLOCK_SIZES = [
  { name: "block-4.png", width: 1024 },
  { name: "block-3.png", width: 768 },
  { name: "block-2.png", width: 512 },
  { name: "block-1.png", width: 256 },
];

async function cropCenter(imageBuffer: Buffer, targetWidth: number, height: number): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const srcWidth = meta.width!;
  const left = Math.round((srcWidth - targetWidth) / 2);
  return sharp(imageBuffer)
    .extract({ left, top: 0, width: targetWidth, height })
    .toBuffer();
}

async function runBlockPipeline(
  themeId: string,
  theme: ThemeDefinition,
  options: CliOptions,
): Promise<{ success: number; failures: number }> {
  const themeRoot = path.join(ASSETS_ROOT, themeId);
  fs.mkdirSync(themeRoot, { recursive: true });

  const requestedBlocks = BLOCK_SIZES.filter((b) => {
    if (!options.only) return true;
    return options.only.some((n) => (n.endsWith(".png") ? n : `${n}.png`) === b.name);
  });

  if (requestedBlocks.length === 0) {
    return { success: 0, failures: 0 };
  }

  let success = 0;
  let failures = 0;

  const masterPath = path.join(themeRoot, "block-master.png");
  const startedAt = Date.now();

  console.log(`  [block-master]  Generating neutral master (${MASTER_WIDTH}×${MASTER_HEIGHT})...`);
  let masterBuffer: Buffer;
  try {
    const prompt = buildBlockMasterPromptFromTemplate(theme);
    masterBuffer = await generateImage({
      scope: "per-theme",
      category: "blocks",
      themeId,
      filename: "block-master.png",
      outputPath: masterPath,
      prompt,
      width: MASTER_WIDTH,
      height: MASTER_HEIGHT,
    }, false);

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`  [block-master]  Done (${elapsed}s). Cropping + tinting...`);
  } catch (error) {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`  [block-master]  FAILED (${elapsed}s): ${formatError(error)}`);
    return { success: 0, failures: requestedBlocks.length };
  }

  for (const block of requestedBlocks) {
    const blockIndex = BLOCK_SIZES.indexOf(block);
    const colorIndex = 3 - blockIndex;
    const color = theme.palette.blocks[colorIndex];

    try {
      const cropped = await cropCenter(masterBuffer, block.width, MASTER_HEIGHT);
      const tinted = await tintImage(cropped, color);
      const feathered = await featherEdges(tinted);
      await savePng(path.join(themeRoot, block.name), feathered, false);
      console.log(`  [${block.name}]  Cropped to ${block.width}×${MASTER_HEIGHT}, tinted ${color}, feathered`);
      success += 1;
    } catch (error) {
      console.log(`  [${block.name}]  FAILED: ${formatError(error)}`);
      failures += 1;
    }
  }

  return { success, failures };
}

function buildPerThemeJobs(themeId: string, theme: ThemeDefinition, filter?: AssetCategory): AssetJob[] {
  const themeRoot = path.join(ASSETS_ROOT, themeId);
  const jobs: AssetJob[] = [];

  // Blocks are handled by runBlockPipeline, not the generic job system

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
      ...getTargetDimensions("logo.png", { width: 1024, height: 1024 }),
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
      ...getTargetDimensions("grid-bg.png", { width: 768, height: 1024 }),
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
      ...getTargetDimensions("theme-icon.png", { width: 512, height: 512 }),
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
  console.log("  --only <names>           Comma-separated filenames (without .png) e.g. block-1,grid-bg");
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

    if (arg === "--only") {
      const val = readFlagValue(argv, i, "--only");
      options.only = val.split(",").map((s) => s.trim());
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

  if (options.only) {
    const names = new Set(options.only.map((n) => n.endsWith(".png") ? n : `${n}.png`));
    const filtered = jobs.filter((j) => names.has(j.filename));
    return { jobs: filtered, selectedThemeIds };
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

function blocksRequestedByFilters(options: CliOptions): boolean {
  if (options.asset && options.asset !== "blocks") return false;
  if (options.scope === "global") return false;
  if (options.only) {
    const blockNames = ["block-1", "block-2", "block-3", "block-4", "block-master"];
    return options.only.some((n) => blockNames.includes(n.replace(".png", "")));
  }
  return true;
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
  if (options.only) {
    console.log(`Only: ${options.only.join(", ")}`);
  }
  if (options.dryRun) {
    console.log("Dry run: enabled");
  }
  console.log("");

  const wantsBlocks = blocksRequestedByFilters(options) && (options.scope === "per-theme" || options.scope === "all");

  if (jobs.length === 0 && !wantsBlocks) {
    console.log("No assets matched the selected filters.");
    return;
  }

  if (options.dryRun) {
    if (wantsBlocks) {
      for (const themeId of selectedThemeIds) {
        console.log(`[${themeId}]  🧪 dry-run -> block pipeline (1 master → crop+tint → 4 blocks)`);
      }
    }
    jobs.forEach((job, index) => {
      const step = `[${index + 1}/${jobs.length}]`;
      console.log(`${step}  ⏳ ${job.filename}...`);
      console.log(`${step}  🧪 dry-run -> ${relativePath(job.outputPath)}`);
    });
    console.log("");
    const blockCount = wantsBlocks ? selectedThemeIds.length * 4 : 0;
    console.log(`✅ Dry run complete! ${jobs.length + blockCount} assets planned.`);
    console.log(`Output: ${outputSummaryPath(options, selectedThemeIds)}`);
    return;
  }

  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is required for generation. Export it and retry.");
  }

  fal.config({ credentials: process.env.FAL_KEY });

  let totalSuccess = 0;
  let totalFailures = 0;

  if (wantsBlocks) {
    for (const themeId of selectedThemeIds) {
      console.log(`\n--- ${themeId} (${themes[themeId].name}) — Block Pipeline ---\n`);
      const result = await runBlockPipeline(themeId, themes[themeId], options);
      totalSuccess += result.success;
      totalFailures += result.failures;
    }
  }

  if (jobs.length > 0) {
    if (wantsBlocks) {
      console.log(`\n--- Generic Assets ---\n`);
    }

    if (jobs.some((job) => job.category === "buttons")) {
      console.log("ℹ️  Button -pressed and -disabled variants are intentionally not generated via API.");
      console.log("");
    }

    const pLimitFactory = await loadPLimitFactory();
    const limit = pLimitFactory(CONCURRENCY);
    const failures: Array<{ job: AssetJob; error: unknown; index: number }> = [];

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
              await savePng(job.outputPath, imageBuffer, job.stripWhite);
              const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
              console.log(`${step}  ✅ ${job.filename} (${elapsed}s)`);
              totalSuccess += 1;
            } catch (error) {
              const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
              failures.push({ job, error, index: globalIndex - 1 });
              console.log(`${step}  ❌ ${job.filename} (${elapsed}s)`);
              console.log(`       ${formatError(error)}`);
              totalFailures += 1;
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
      await runBatch(phase1Jobs);
    }

    if (failures.length > 0) {
      for (const failure of failures) {
        console.log(`- ${relativePath(failure.job.outputPath)}: ${formatError(failure.error)}`);
      }
    }
  }

  console.log("");
  const totalAssets = totalSuccess + totalFailures;
  if (totalFailures === 0) {
    console.log(`✅ Complete! ${totalSuccess}/${totalAssets} assets generated.`);
  } else {
    console.log(`⚠️ Complete with errors. ${totalSuccess}/${totalAssets} assets generated.`);
    process.exitCode = 1;
  }

  console.log(`Output: ${outputSummaryPath(options, selectedThemeIds)}`);
}

main().catch((error) => {
  console.error(`\n❌ ${formatError(error)}`);
  process.exit(1);
});
