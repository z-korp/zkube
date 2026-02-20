import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ASSETS_ROOT, ROOT_DIR } from "./lib/env";
import type { ThemeDefinition } from "./lib/types";

type ThemeMap = Record<string, ThemeDefinition>;

async function recolorBlock(filePath: string, hexColor: string): Promise<void> {
  const input = await fs.promises.readFile(filePath);
  const gray = await sharp(input).ensureAlpha().greyscale().toBuffer();
  const tinted = await sharp(gray).ensureAlpha().tint(hexColor).png().toBuffer();
  await fs.promises.writeFile(filePath, tinted);
}

async function main(): Promise<void> {
  const themesPath = path.join(ROOT_DIR, "scripts", "generate-assets", "data", "themes.json");
  const themes = JSON.parse(fs.readFileSync(themesPath, "utf-8")) as ThemeMap;

  const themeFlag = process.argv.indexOf("--theme");
  const requestedThemes = themeFlag !== -1 && process.argv[themeFlag + 1]
    ? process.argv[themeFlag + 1].split(",").map((t) => t.trim())
    : undefined;

  const themeIds = requestedThemes ?? Object.keys(themes);
  for (const themeId of themeIds) {
    if (!themes[themeId]) {
      console.warn(`Unknown theme: ${themeId}, skipping`);
      continue;
    }
    const colors = themes[themeId].palette.blocks;
    for (let i = 1; i <= 4; i += 1) {
      const filePath = path.join(ASSETS_ROOT, themeId, `block-${i}.png`);
      if (!fs.existsSync(filePath)) continue;
      await recolorBlock(filePath, colors[i - 1]);
      console.log(`[${themeId}] block-${i}.png -> ${colors[i - 1]}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
