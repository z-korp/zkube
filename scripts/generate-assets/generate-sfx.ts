import fs from "node:fs";
import path from "node:path";
import { CONCURRENCY, SFX_MODEL, ASSETS_ROOT, formatError, loadPLimitFactory, relativePath } from "./lib/env";
import { fal, generateSfx, saveMp3 } from "./lib/fal-client";
import type { SfxCliOptions, SfxDefinition, SfxJob } from "./lib/types";

const DATA_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "data");

const sfxDefinitions: SfxDefinition[] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "sfx.json"), "utf-8"));

function readFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function printHelp(): void {
  console.log("Usage: npx tsx scripts/generate-assets/generate-sfx.ts [options]");
  console.log("");
  console.log("Options:");
  console.log("  --only <ids>             Comma-separated SFX IDs to generate");
  console.log("  --dry-run                Print plan only; do not call generation API");
  console.log("  --help                   Show this help");
}

function parseArgs(argv: string[]): SfxCliOptions {
  const options: SfxCliOptions = {
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--only") {
      const onlyValue = readFlagValue(argv, i, "--only");
      const parsedIds = onlyValue
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (parsedIds.length === 0) {
        throw new Error("--only requires at least one SFX ID");
      }

      options.only = parsedIds;
      i += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function buildSfxJobs(only?: string[]): SfxJob[] {
  const sfxRoot = path.join(ASSETS_ROOT, "common", "sounds", "effects");

  let definitions = [...sfxDefinitions];
  if (only && only.length > 0) {
    const onlySet = new Set(only);
    definitions = definitions.filter((definition) => onlySet.has(definition.id));
    const missing = only.filter((id) => !sfxDefinitions.some((definition) => definition.id === id));
    if (missing.length > 0) {
      throw new Error(`Unknown SFX IDs: ${missing.join(", ")}. Available: ${sfxDefinitions.map((definition) => definition.id).join(", ")}`);
    }
  }

  return definitions.map((definition) => ({
    id: definition.id,
    filename: definition.filename,
    outputPath: path.join(sfxRoot, definition.filename),
    prompt: definition.prompt,
    duration: definition.duration,
  }));
}

async function runSfxMode(options: SfxCliOptions): Promise<void> {
  const jobs = buildSfxJobs(options.only);

  console.log("🔊 zKube SFX Generator");
  console.log(`Model: ${SFX_MODEL}`);
  if (options.only && options.only.length > 0) {
    console.log(`SFX filter: ${options.only.join(", ")}`);
  }
  if (options.dryRun) {
    console.log("Dry run: enabled");
  }
  console.log("");

  if (jobs.length === 0) {
    console.log("No SFX matched the selected filters.");
    return;
  }

  console.log(`Generating ${jobs.length} SFX assets...`);
  console.log("");

  if (options.dryRun) {
    jobs.forEach((job, index) => {
      const step = `[${index + 1}/${jobs.length}]`;
      console.log(`${step}  ⏳ ${job.filename}...`);
      console.log(`${step}  🧪 dry-run -> ${relativePath(job.outputPath)}`);
    });
    console.log("");
    console.log(`✅ Dry run complete! ${jobs.length}/${jobs.length} SFX assets planned.`);
    console.log("Output: client-budokan/public/assets/common/sounds/effects/");
    return;
  }

  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is required for generation. Export it and retry.");
  }

  fal.config({ credentials: process.env.FAL_KEY });

  const pLimitFactory = await loadPLimitFactory();
  const limit = pLimitFactory(CONCURRENCY);
  const failures: Array<{ job: SfxJob; error: unknown; index: number }> = [];
  let successCount = 0;

  await Promise.all(
    jobs.map((job, index) =>
      limit(async () => {
        const step = `[${index + 1}/${jobs.length}]`;
        const startedAt = Date.now();
        console.log(`${step}  ⏳ ${job.filename}...`);

        try {
          const mp3Buffer = await generateSfx(job);
          saveMp3(mp3Buffer, job.outputPath);
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
          console.log(`${step}  ✅ ${job.filename} (${elapsed}s)`);
          successCount += 1;
        } catch (error) {
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
          failures.push({ job, error, index });
          console.log(`${step}  ❌ ${job.filename} (${elapsed}s)`);
          console.log(`       ${formatError(error)}`);
        }
      }),
    ),
  );

  console.log("");

  if (failures.length === 0) {
    console.log(`✅ Complete! ${successCount}/${jobs.length} SFX assets generated.`);
  } else {
    console.log(`⚠️ Complete with errors. ${successCount}/${jobs.length} SFX assets generated.`);
    for (const failure of failures) {
      const step = `[${failure.index + 1}/${jobs.length}]`;
      console.log(`- ${step} ${relativePath(failure.job.outputPath)}: ${formatError(failure.error)}`);
    }
    process.exitCode = 1;
  }

  console.log("Output: client-budokan/public/assets/common/sounds/effects/");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  await runSfxMode(options);
}

main().catch((error) => {
  console.error(`\n❌ ${formatError(error)}`);
  process.exit(1);
});
