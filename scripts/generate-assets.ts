import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3-pro-image-preview";
const CONCURRENCY = 2;
const REQUEST_DELAY_MS = 3_000;
const RETRY_BACKOFF_MS = [15_000, 30_000, 60_000, 120_000] as const;
const MAX_RETRIES = RETRY_BACKOFF_MS.length;

const STYLE_ANCHOR =
  "Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.";

type Scope = "per-theme" | "global" | "all";
type PerThemeAsset =
  | "blocks"
  | "background"
  | "loading-bg"
  | "logo"
  | "grid"
  | "theme-icon"
  | "map";
type GlobalAsset = "buttons" | "shared-icons" | "catalog-icons" | "bonus-icons" | "ui-chrome" | "panels" | "particles";
type AssetCategory = PerThemeAsset | GlobalAsset;
// Nano Banana Pro (Gemini 3 Pro Image) supported aspect ratios
type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
type ImageSize = "1K" | "2K";
type LimitRunner = <T>(fn: () => Promise<T>) => Promise<T>;
type PLimitFactory = (concurrency: number) => LimitRunner;

interface ThemeDefinition {
  name: string;
  icon: string;
  description: string;
  mood: string;
  palette: {
    bg: string;
    accent: string;
    blocks: [string, string, string, string];
  };
  motifs: string;
  blockMotifs: string;
  blockDesigns?: [string, string, string, string];
  scene: string;
  loadingScene: string;
  gridMaterial: string;
}

interface AssetJob {
  scope: "per-theme" | "global";
  category: AssetCategory;
  themeId?: string;
  filename: string;
  outputPath: string;
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  refKeys: RefKey[];
  refPaths?: string[];
  phase?: number;
}

interface CliOptions {
  theme?: string;
  scope: Scope;
  asset?: AssetCategory;
  dryRun: boolean;
  includeRefs: boolean;
  postProcess: boolean;
}

const THEMES: Record<string, ThemeDefinition> = {
  "theme-1": {
    name: "Tiki",
    icon: "🌴",
    description: "Tropical moonlit beach with carved tiki totems",
    mood: "Warm, inviting",
    palette: { bg: "#87CEEB", accent: "#FF8C00", blocks: ["#4ADE80", "#4AA8DE", "#9F7AEA", "#FBBF24"] },
    motifs: "Tiki masks, bamboo, palm trees, tropical flowers",
    blockMotifs: "Carved tiki mask faces, bamboo weave patterns, tropical flower motifs",
    scene: "Tropical moonlit beach at night, carved tiki totems, palm trees silhouetted, gentle waves",
    loadingScene: "Close-up of a carved tiki mask with glowing eyes, surrounded by tropical flowers",
    gridMaterial: "Weathered bamboo planks with rope lashing",
  },
  "theme-2": {
    name: "Cosmic",
    icon: "🌌",
    description: "Synthwave alien landscape with cratered planets and neon rim-lighting",
    mood: "Vast, dreamy",
    palette: { bg: "#0B0D21", accent: "#A29BFE", blocks: ["#00D2D3", "#6C5CE7", "#FD79A8", "#FDCB6E"] },
    motifs: "Crystals, nebula swirls, alien glyphs, planets",
    blockMotifs: "Cosmic crystal formations, nebula swirl patterns, alien glyph carvings",
    scene: "Synthwave alien landscape, cratered planets, neon rim-lighting",
    loadingScene: "A swirling nebula with crystal formations floating in deep space",
    gridMaterial: "Dark crystalline surface with faint nebula glow",
  },
  "theme-3": {
    name: "Easter Island",
    icon: "🗿",
    description: "Mysterious volcanic island with ancient stone guardians",
    mood: "Mysterious, eerie, ancient",
    palette: { bg: "#0A0A1A", accent: "#00FFFF", blocks: ["#4A8A5B", "#3A7A8A", "#8A4A6A", "#B89A4A"] },
    motifs: "Moai statues, petroglyphs, volcanic rock",
    blockMotifs: "Stone moai faces, volcanic rock patterns, petroglyph carvings",
    blockDesigns: [
      "A stoic forward-facing moai head with closed eyes, weathered mossy stone texture",
      "A stern moai head with deep eye sockets looking slightly left, ocean-worn stone with teal lichen",
      "A fierce moai head with open mouth and bared teeth, dark volcanic basalt with magenta mineral veins",
      "A wise elder moai head with elongated features and a pukao (topknot hat), sandy weathered stone with ochre patina",
    ],
    scene: "Volcanic island at night, moai silhouettes, bioluminescent pools",
    loadingScene: "A single moai statue face emerging from volcanic mist, bioluminescent glow",
    gridMaterial: "Dark volcanic basalt with faint glow veins",
  },
  "theme-4": {
    name: "Maya",
    icon: "🏛️",
    description: "Ancient jungle temple civilization with jade and gold",
    mood: "Adventurous, lush",
    palette: { bg: "#0A2540", accent: "#00CED1", blocks: ["#00E5A0", "#00B4D8", "#FF6F91", "#FFC947"] },
    motifs: "Jade serpents, stepped pyramids, feathered motifs",
    blockMotifs: "Jade serpent glyphs, stepped pyramid patterns, feathered serpent motifs",
    scene: "Deep jungle, stepped temple, jade canopy, misty waterfalls",
    loadingScene: "Jade serpent carving on a moss-covered temple wall, golden light filtering through",
    gridMaterial: "Deep ocean-floor stone with turquoise tint",
  },
  "theme-5": {
    name: "Cyberpunk",
    icon: "💜",
    description: "Enchanted ancient forest with golden mystical light",
    mood: "Serene, enchanted",
    palette: { bg: "#1A3A1A", accent: "#DAA520", blocks: ["#66BB6A", "#42A5F5", "#AB47BC", "#FFCA28"] },
    motifs: "Leaf veins, bark rings, glowing runes, moss",
    blockMotifs: "Leaf veins, bark rings, moss patches, glowing runes",
    scene: "Forest clearing at golden hour, towering trees with moss",
    loadingScene: "Ancient tree trunk close-up with glowing runes and bark patterns",
    gridMaterial: "Dark mossy wood bark",
  },
  "theme-6": {
    name: "Medieval",
    icon: "⚔️",
    description: "Stone castle courtyard with torchlit walls and iron gates",
    mood: "Epic, warm, noble",
    palette: { bg: "#C2956B", accent: "#E07B39", blocks: ["#E07B39", "#D4463B", "#3D9970", "#E8C547"] },
    motifs: "Shield crests, iron rivets, stone bricks, torch flames, heraldic lions, sword motifs",
    blockMotifs: "Shield crests, iron rivets, stone brick patterns",
    scene: "Castle courtyard at sunset, torches, towers, iron portcullis",
    loadingScene: "Torchlit stone wall with a shield and crossed swords, warm firelight",
    gridMaterial: "Weathered sandstone with grain",
  },
  "theme-7": {
    name: "Ancient Egypt",
    icon: "🏺",
    description: "Golden pyramids at dusk with hieroglyph-covered obelisks",
    mood: "Majestic, mystical, regal",
    palette: { bg: "#D0E8F0", accent: "#40E0D0", blocks: ["#40E0D0", "#5B9BD5", "#B070D0", "#F0C060"] },
    motifs: "Hieroglyphs, scarab beetles, Eye of Horus, lotus flowers, ankh symbols, papyrus scrolls",
    blockMotifs: "Hieroglyphs, scarab beetles, lotus flower carvings",
    scene: "Desert twilight, golden pyramids, obelisks, Nile reflection",
    loadingScene: "Hieroglyph-covered wall with Eye of Horus, golden torchlight",
    gridMaterial: "Cool blue-grey slate with gold hieroglyph inlays",
  },
  "theme-8": {
    name: "Volcano",
    icon: "🌋",
    description: "Volcanic forge with rivers of lava and obsidian pillars",
    mood: "Intense, dramatic, primal",
    palette: { bg: "#1A0A0A", accent: "#FF6600", blocks: ["#FF6600", "#FF2222", "#FFAA00", "#FF4488"] },
    motifs: "Lava cracks, obsidian shards, ember glow, volcanic vents, magma flows, basalt columns",
    blockMotifs: "Obsidian shards, lava crack patterns, ember glow veins",
    scene:
      "Volcanic forge interior, rivers of lava flowing between obsidian platforms, ember-filled sky, basalt columns",
    loadingScene: "Obsidian rock face with molten lava cracks glowing orange-red",
    gridMaterial: "Cracked obsidian with faint ember glow between fissures",
  },
  "theme-9": {
    name: "Tribal",
    icon: "🪘",
    description: "Earthy savanna ritual grounds with painted stones and drums",
    mood: "Earthy, spiritual, organic",
    palette: { bg: "#FFF0F5", accent: "#FF69B4", blocks: ["#7DCEA0", "#85C1E9", "#D7BDE2", "#F9E154"] },
    motifs: "Painted patterns, drum motifs, feather marks, bone beads, ritual masks, cave paintings",
    blockMotifs: "Painted tribal patterns, drum circle motifs, feather marks",
    scene: "Savanna dawn, ritual stone circle, wildflowers, acacia trees",
    loadingScene: "Painted ritual drum surrounded by feathers and wildflowers, warm earth tones",
    gridMaterial: "Rose-tinted clay with faint handprint texture",
  },
  "theme-10": {
    name: "Arctic",
    icon: "❄️",
    description: "Frozen tundra under aurora borealis with steampunk brass structures",
    mood: "Cold, wondrous, mechanical",
    palette: { bg: "#2A1F14", accent: "#D4A017", blocks: ["#B87333", "#C5A050", "#6B8E23", "#CC5544"] },
    motifs: "Ice crystals, brass gears, copper pipes, snowflakes, aurora waves, frozen clockwork",
    blockMotifs: "Brass gear faces, copper pipe rivets, frozen clockwork",
    scene: "Frozen tundra, aurora borealis, ice crystals, brass structures",
    loadingScene: "Ice crystal formation with aurora light refracting through, brass gears embedded",
    gridMaterial: "Dark worn leather with brass patina rivets",
  },
};

const PER_THEME_ASSETS = [
  "blocks",
  "background",
  "loading-bg",
  "logo",
  "grid",
  "theme-icon",
  "map",
] as const;
const GLOBAL_ASSETS = ["buttons", "shared-icons", "catalog-icons", "bonus-icons", "ui-chrome", "panels", "particles"] as const;
const PER_THEME_ASSET_SET = new Set<PerThemeAsset>(PER_THEME_ASSETS);
const GLOBAL_ASSET_SET = new Set<GlobalAsset>(GLOBAL_ASSETS);
const ALL_ASSET_SET = new Set<AssetCategory>([...PER_THEME_ASSETS, ...GLOBAL_ASSETS]);

const BUTTON_CONFIGS = {
  orange: { color: "#FF8C00", highlight: "#FFB74D", shadow: "#CC6600", desc: "warm orange" },
  green: { color: "#4CAF50", highlight: "#81C784", shadow: "#2E7D32", desc: "emerald green" },
  purple: { color: "#9C27B0", highlight: "#CE93D8", shadow: "#6A1B9A", desc: "royal purple" },
  red: { color: "#F44336", highlight: "#EF9A9A", shadow: "#C62828", desc: "crimson red" },
  icon: { color: "#455A64", highlight: "#90A4AE", shadow: "#263238", desc: "dark grey-blue" },
} as const;

const SHARED_ICON_CONFIGS = [
  { filename: "icon-moves.png", description: "A pair of footsteps or shoe prints — represents move count in a puzzle game" },
  { filename: "icon-score.png", description: "A star burst or sparkle — represents score/points" },
  { filename: "icon-cube.png", description: "A 3D isometric cube — represents the CUBE currency token" },
  { filename: "icon-level.png", description: "A numbered flag or milestone marker — represents current level" },
  { filename: "icon-surrender.png", description: "A white flag on a pole — represents surrender/quit action" },
] as const;

const CATALOG_ICON_CONFIGS = [
  { filename: "icon-star-filled.png", description: "A solid filled 5-pointed star — represents filled rating" },
  { filename: "icon-star-empty.png", description: "An outlined empty 5-pointed star — represents empty rating" },
  { filename: "icon-cube.png", description: "A 3D isometric cube — game currency" },
  { filename: "icon-crown.png", description: "A royal crown with 3 points — achievement/rank" },
  { filename: "icon-fire.png", description: "A flame/fire — combo/bonus indicator" },
  { filename: "icon-scroll.png", description: "A rolled parchment scroll — quest/task" },
  { filename: "icon-shop.png", description: "A shopping bag or cart — store/shop" },
  { filename: "icon-trophy.png", description: "A trophy cup with handles — achievement" },
  { filename: "icon-menu.png", description: "Three horizontal lines (hamburger menu) — navigation" },
  { filename: "icon-close.png", description: "An X/cross mark — close/dismiss" },
  { filename: "icon-settings.png", description: "A gear/cog wheel — settings" },
  { filename: "icon-lock.png", description: "A padlock in locked position — locked/unavailable" },
  { filename: "icon-music.png", description: "A musical note — music toggle" },
  { filename: "icon-sound.png", description: "A speaker with sound waves — sound toggle" },
] as const;

const BONUS_ICON_CONFIGS = [
  { filename: "combo.png", description: "A swirling vortex/cyclone of energy — represents combo multiplier power-up. Dynamic spiral motion, glowing trails." },
  { filename: "score.png", description: "An exploding starburst with radiating rays — represents instant score bonus. Bright, energetic, celebratory." },
  { filename: "harvest.png", description: "A crystal pickaxe or mining tool striking a gem — represents harvest bonus (destroying blocks for currency). Sharp, impactful." },
  { filename: "wave.png", description: "A horizontal shockwave or energy pulse rippling outward — represents wave bonus (clearing entire rows). Wide horizontal motion." },
  { filename: "supply.png", description: "A glowing crate or supply drop with an upward arrow — represents supply bonus (adding new lines). Sturdy, constructive feel." },
] as const;

const UI_CHROME_CONFIGS = [
  { filename: "hud-bar.png", description: "A wide horizontal bar for displaying game stats (score, level, moves). Dark semi-transparent with subtle ornate borders on top and bottom edges. Fantasy/tribal style.", width: 360, height: 40 },
  { filename: "action-bar.png", description: "A wide horizontal action bar for bonus buttons at the bottom of the screen. Dark semi-transparent with ornate borders. Slightly taller than hud-bar. Fantasy/tribal style.", width: 360, height: 64 },
  { filename: "bonus-btn-bg.png", description: "A square button background for bonus ability icons. Dark circular/rounded-square shape with a glowing border ring. Fantasy/tribal style. Should look pressable.", width: 64, height: 64 },
] as const;

const PANEL_CONFIGS = [
  { filename: "panel-wood.png", material: "Warm brown wood planks — carved wooden frame with nail studs", alpha: "0.95" },
  { filename: "panel-dark.png", material: "Dark slate/iron — thin metallic border with rivets", alpha: "0.95" },
  { filename: "panel-leaf.png", material: "Green plant matter — vine-wrapped edges with small leaves", alpha: "0.95" },
  { filename: "panel-glass.png", material: "Frosted glass — thin bright border, translucent center", alpha: "0.85" },
] as const;

const PARTICLE_CONFIGS = [
  { filename: "particle-spark.png", description: "A bright spark/point of light — diamond-shaped glow" },
  { filename: "particle-leaf.png", description: "A small leaf shape — slightly curved" },
  { filename: "particle-flower.png", description: "A tiny 5-petal flower — simple and symmetric" },
  { filename: "particle-star.png", description: "A tiny 4-pointed star — radiating points" },
] as const;

const ROOT_DIR = path.resolve(process.cwd());
const ASSETS_ROOT = path.join(ROOT_DIR, "client-budokan", "public", "assets");
const COMMON_ROOT = path.join(ASSETS_ROOT, "common");
const THEME_1_ROOT = path.join(ASSETS_ROOT, "theme-1");

const REF_IMAGE_PATHS = {
  blocks: path.join(THEME_1_ROOT, "block-1.png"),
  background: path.join(THEME_1_ROOT, "background.png"),
  logo: path.join(THEME_1_ROOT, "logo.png"),
  grid: path.join(THEME_1_ROOT, "grid-bg.png"),
} as const;

type RefKey = keyof typeof REF_IMAGE_PATHS;

const refCache = new Map<RefKey, string>();
let requestSlotChain: Promise<void> = Promise.resolve();
let nextRequestAt = 0;

function withStyleAnchor(prompt: string): string {
  return `${STYLE_ANCHOR}\n${prompt.trim()}`;
}

function relativePath(filePath: string): string {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRequestSlot(): Promise<void> {
  let release: ((value?: void | PromiseLike<void>) => void) | undefined;
  const previous = requestSlotChain;
  requestSlotChain = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    const now = Date.now();
    const waitMs = Math.max(0, nextRequestAt - now);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    nextRequestAt = Date.now() + REQUEST_DELAY_MS;
  } finally {
    if (release) {
      release();
    }
  }
}

function createLimitFallback(concurrency: number): LimitRunner {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`Invalid concurrency: ${concurrency}`);
  }

  let activeCount = 0;
  const queue: Array<() => void> = [];

  const runNext = () => {
    if (activeCount >= concurrency) {
      return;
    }
    const next = queue.shift();
    if (!next) {
      return;
    }
    activeCount += 1;
    next();
  };

  return async <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const execute = () => {
        Promise.resolve()
          .then(task)
          .then(resolve, reject)
          .finally(() => {
            activeCount -= 1;
            runNext();
          });
      };

      queue.push(execute);
      runNext();
    });
}

async function loadPLimitFactory(): Promise<PLimitFactory> {
  try {
    const importer = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
    const moduleValue = (await importer("p-limit")) as { default?: unknown };
    if (typeof moduleValue.default === "function") {
      return moduleValue.default as PLimitFactory;
    }
  } catch {}

  console.warn("⚠️  p-limit package not found; using built-in limiter fallback.");
  return createLimitFallback;
}

function isRetryableError(error: unknown): boolean {
  const candidate = error as {
    status?: number;
    statusCode?: number;
    code?: number;
    response?: { status?: number };
    message?: string;
  };
  const status = candidate.status ?? candidate.statusCode ?? candidate.code ?? candidate.response?.status;
  if (status === 429 || status === 503) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(candidate.message ?? error);
  return /(^|\D)(429|503)(\D|$)|rate\s*limit|quota|unavailable|high demand/i.test(message);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function loadRefBase64(refKey: RefKey): string | undefined {
  const cached = refCache.get(refKey);
  if (cached) {
    return cached;
  }

  const refPath = REF_IMAGE_PATHS[refKey];
  try {
    const data = fs.readFileSync(refPath);
    const base64 = data.toString("base64");
    refCache.set(refKey, base64);
    return base64;
  } catch {
    console.warn(`⚠️  Missing reference image: ${relativePath(refPath)} (continuing without it)`);
    return undefined;
  }
}

function loadFileBase64(filePath: string): string | undefined {
  try {
    const data = fs.readFileSync(filePath);
    return data.toString("base64");
  } catch {
    console.warn(`⚠️  Missing reference: ${relativePath(filePath)}`);
    return undefined;
  }
}

function buildBlock1Prompt(theme: ThemeDefinition, color: string, blockIndex: number): string {
  const focalDesign = theme.blockDesigns?.[blockIndex] ?? `A distinctive ${theme.name}-themed carved element`;

  return `
Generate a game block texture for a puzzle game. The block is a 1×1 square.
Use the reference image ONLY for aspect ratio and proportions — do NOT copy its visual content.

Focal element: ${focalDesign} — centered on the block, taking up ~60% of the space.
Surrounding decoration: ${theme.blockMotifs} — subtle carved relief filling the remaining area.
Theme: ${theme.name} — ${theme.description}

COLOR: The DOMINANT color MUST be ${color}. Use ${color} for at least 70% of the surface.
Add darker and lighter shades of ${color} for depth (2-3 tonal steps). Muted, earthy tones — NOT neon.
Use thin black outlines (2-3px) to separate shapes.

Style: Hand-painted game art. Flat cel-shaded with subtle bevel (lighter top-left, darker bottom-right).
Think Clash Royale card art — bold, clean, readable at small sizes.

Fill the ENTIRE canvas edge-to-edge. No margins, no padding, no background.
Opaque. No transparency. No text. No people. No logos.
`.trim();
}

function buildBlockMultiPrompt(theme: ThemeDefinition, color: string, blockIndex: number): string {
  const focalDesign = theme.blockDesigns?.[blockIndex] ?? `A distinctive ${theme.name}-themed carved element`;

  return `
Redraw the content from image 1 onto image 2, and adjust image 1 by adding content so that its aspect ratio matches image 2. At the same time, completely remove the content of image 2, keeping only its aspect ratio. Make sure no blank areas are left.
The dominant color MUST remain ${color}. Keep muted, earthy tones — NOT neon.
Focal element: ${focalDesign} — centered, taking up ~60% of the space.
Surrounding decoration: ${theme.blockMotifs} — subtle carved relief.
`.trim();
}

function buildBackgroundPrompt(theme: ThemeDefinition): string {
  return `
Generate a full-bleed background image for a mobile puzzle game. SQUARE format (1:1).
This is NOT a framed picture. The scene fills the ENTIRE canvas from edge to edge like a photograph taken inside the world.
Theme: ${theme.name} — ${theme.description}.
Scene: ${theme.scene}
Style: Rich digital painting. Atmospheric, immersive, painterly. Deep colors and dramatic lighting.
Composition: The viewer is INSIDE the scene looking around. Layered depth — foreground silhouettes at edges, main scene in the middle, distant background fading into atmosphere.
Important content stays in the center 60%. Edges are atmospheric filler (sky, ground, foliage).
Mood: ${theme.mood}. Dominant colors: ${theme.palette.bg} to ${theme.palette.accent}.
The image must be a seamless full-bleed scene with NO borders, NO frames, NO vignettes, NO picture-in-picture effect.
Opaque fill. No text, no UI, no people, no logos.
`.trim();
}

function buildLoadingBackgroundPrompt(theme: ThemeDefinition): string {
  return `
Generate a full-bleed loading screen image for a mobile puzzle game. SQUARE format (1:1).
This is NOT a framed picture. The scene fills the ENTIRE canvas from edge to edge.
Theme: ${theme.name} — ${theme.description}.
Scene: ${theme.loadingScene}
Style: Rich digital painting. Atmospheric, moody, slightly darker and more mysterious than a typical game background.
Composition: Close-up atmospheric detail. The viewer is right up against the subject. Fills the full canvas edge to edge.
Main focal point centered. Edges fade into dark atmosphere.
Mood: ${theme.mood}. Dominant colors: ${theme.palette.bg} to ${theme.palette.accent}.
The image must be a seamless full-bleed scene with NO borders, NO frames, NO vignettes, NO picture-in-picture effect.
Opaque fill. No text, no UI, no people, no logos.
`.trim();
}

function buildLogoPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a game logo for a puzzle game called "zKube".
Theme: ${theme.name}

LAYOUT: The text "zKube" must be LARGE and DOMINANT — filling at least 70% of the canvas width.
The text is the hero element. Theme decorations are subtle accents AROUND and BEHIND the text, never competing.

TYPOGRAPHY: Ultra-bold display font. THICK black outline (4-6px). Strong white inner glow or highlight for maximum contrast.
Each letter clearly separated and readable even at small sizes (48px).

DECORATION: Small ${theme.name} motifs (${theme.motifs}) as subtle accents flanking or framing the text.
A small isometric cube below or beside the text with theme patterns. Keep decorations MINIMAL — the text is king.

COLOR: Primary fill ${theme.palette.accent} with a darker shade for depth. STRONG white specular highlights on top edges.
Thick dark outline ensures readability on ANY background. High contrast between fill and outline.

Square format. Centered vertically and horizontally.
Dark background that blends with the theme's background color.
`);
}

function buildGridBackgroundPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a subtle background surface texture for a game grid area.
Theme: ${theme.name}
Material: ${theme.gridMaterial}
Style: Muted, low-contrast surface — the blocks will sit ON TOP of this.
Color: Dark base with very subtle tonal variation. Must not compete with colorful blocks placed on top.
No grid lines (drawn in code). No patterns that would interfere with gameplay readability.
Portrait rectangle (4:5 ratio). Filled completely, no transparency.
`);
}

function buildGridFramePrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate an ornamental frame/border for a game grid area.
Theme: ${theme.name}
Material: Matches the theme's decorative style — ${theme.motifs}.
Style: An ornate rectangular frame border with themed decorative elements.
Border width: approximately 10% of the image on each side.
Border decoration: Cultural motifs and patterns from the theme carved into the frame material.
Frame color: Theme accent (${theme.palette.accent}) with darker shadow tones and bright highlights.
Portrait rectangle (4:5 ratio). The frame art fills the entire canvas edge-to-edge.
Interior is a dark flat fill matching the grid material.
`);
}

function buildThemeIconPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a small square icon representing the "${theme.name}" theme for a game settings menu.
Theme: ${theme.name} (${theme.icon})
Design: A single iconic symbol that instantly communicates the theme. For example: ${theme.motifs} — pick the most recognizable single element.
Style: Bold silhouette icon, white fill. Thick strokes (3-4px equivalent). Clean, readable at 48×48 pixels.
Centered in frame. Square format. No text.
Dark background matching the theme.
`);
}

function buildMapPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a full-screen progression map for a mobile puzzle game zone.
Theme: ${theme.name} — ${theme.description}
The map shows a winding S-curve path with 11 small stone/themed platforms where game nodes will be placed.
The path starts at the BOTTOM of the image and winds up to a dramatic boss arena at the TOP.

PLATFORM POSITIONS (approximate, as percentage from left and from top):
1. Bottom-left area (35% from left, 90% from top) — small circular stone platform
2. Right side (65% left, 82% top) — small platform
3. Left side (35% left, 74% top) — small platform
4. Right side (60% left, 66% top) — small platform
5. Left side (30% left, 58% top) — small platform
6. Right side (60% left, 50% top) — small platform
7. Left side (35% left, 42% top) — small platform
8. Right side (60% left, 34% top) — small platform
9. Left side (30% left, 26% top) — small platform
10. Right side (60% left, 16% top) — slightly larger platform with a market stall or treasure chest (this is the SHOP)
11. Center top (50% left, 6% top) — LARGE dramatic boss arena with imposing ${theme.name}-themed architecture

A clear winding trail/path connects all 11 platforms in order from bottom to top.
The platforms should be small circular clearings (except shop = medium, boss = large).

Composition: Portrait (9:16). All 11 platforms must fit within the image — no cropping.
Background: ${theme.scene} — lush, atmospheric, fills the entire image.
Mood: ${theme.mood}. Adventurous, inviting exploration.
Color palette: Rich atmospheric tones. Path slightly lighter than surroundings. Accent: ${theme.palette.accent}.
The platforms should be visible but subtle — small stone/themed circles where UI buttons will be overlaid.
No text, no numbers, no labels, no UI elements, no people.
`);
}

function buildButtonPrompt(desc: string, color: string, highlight: string, shadow: string): string {
  return withStyleAnchor(`
Generate a 9-slice button texture for a game UI.
Color: ${desc} (${color})
Style: A rounded rectangle button with:
- Outer border: 2px dark outline
- Fill: Gradient from ${highlight} (top) to ${color} (bottom)
- Inner highlight: Thin bright line at top edge
- Shadow: ${shadow} at bottom edge
- Subtle bevel to appear pressable
The image is 96×96px conceptually. The outer 16px on all sides are the fixed border (for 9-slice stretching). The inner 64×64px center stretches.
Square format. Slight transparency possible for soft edges. No text, no icons.
`);
}

function buildWhiteIconPrompt(description: string): string {
  return withStyleAnchor(`
Generate a simple game UI icon: ${description}.
Style: Clean, bold, white silhouette on dark background.
Stylized for a fantasy/tribal puzzle game. Thick strokes (3-4px equivalent).
Rounded corners. Single shape, centered. No text, no color (white only).
Square format. 48×48 pixel target (generating larger for quality).
`);
}

function buildBonusIconPrompt(description: string): string {
  return withStyleAnchor(`
Generate a game bonus/power-up icon: ${description}
Style: Colorful, vibrant, detailed fantasy game icon. Rich colors with glowing highlights and subtle shadows.
The icon should be instantly recognizable at small sizes (64×64 display).
Centered composition, no text. Slight 3D depth with lighting from top-left.
Square format. 256×256 pixel target.
Dark background.
`);
}

function buildUiChromePrompt(description: string, width: number, height: number): string {
  return withStyleAnchor(`
Generate a game UI element: ${description}
Dimensions: ${width}×${height} pixels conceptually.
Style: Semi-transparent dark panel with subtle fantasy/tribal decorative edges.
The center area should be darker and flatter than the border so game content reads clearly above it.
Edges should have thin ornate borders matching a tribal/fantasy puzzle game aesthetic.
No text, no icons — just the background chrome element.
Dark background fill.
`);
}

function buildPanelPrompt(material: string, alpha: string): string {
  return withStyleAnchor(`
Generate a 9-slice panel texture for a game UI.
Material: ${material}
The image is 96×96px conceptually. The outer 24px on all sides are the fixed border. The inner 48×48px center will stretch.
Design the border with decorative edges. Center should be a subtle, stretchable fill matching the material.
Square format. PNG. The center area should have slight translucency (${alpha} alpha feel) over a dark background.
`);
}

function buildParticlePrompt(description: string): string {
  return withStyleAnchor(`
Generate a tiny particle texture for a game effect.
Shape: ${description}
Style: White silhouette on dark background. Soft edges with slight glow.
Very simple, minimal detail — this will be rendered at 16×16 pixels and tinted by code.
Square format. Centered.
`);
}

function shouldIncludeCategory(category: AssetCategory, filter?: AssetCategory): boolean {
  return !filter || filter === category;
}

function buildPerThemeJobs(themeId: string, theme: ThemeDefinition, filter?: AssetCategory): AssetJob[] {
  const themeRoot = path.join(ASSETS_ROOT, themeId);
  const jobs: AssetJob[] = [];

  if (shouldIncludeCategory("blocks", filter)) {
    for (let i = 0; i < 4; i += 1) {
      const width = i + 1;
      const color = theme.palette.blocks[i];
      const filename = `block-${width}.png`;
      const theme1RefPath = path.join(THEME_1_ROOT, filename);

      if (width === 1) {
        jobs.push({
          scope: "per-theme",
          category: "blocks",
          themeId,
          filename,
          outputPath: path.join(themeRoot, filename),
          prompt: buildBlock1Prompt(theme, color, i),
          aspectRatio: "1:1",
          imageSize: "1K",
          refKeys: [],
          refPaths: [theme1RefPath],
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
          prompt: buildBlockMultiPrompt(theme, color, i),
          aspectRatio: "1:1",
          imageSize: "2K",
          refKeys: [],
          refPaths: [block1Path, theme1RefPath],
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
      aspectRatio: "1:1",
      imageSize: "2K",
      refKeys: ["background"],
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
      aspectRatio: "1:1",
      imageSize: "2K",
      refKeys: ["background"],
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
      aspectRatio: "1:1",
      imageSize: "1K",
      refKeys: ["logo"],
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
      aspectRatio: "4:5",
      imageSize: "1K",
      refKeys: ["grid"],
    });
    jobs.push({
      scope: "per-theme",
      category: "grid",
      themeId,
      filename: "grid-frame.png",
      outputPath: path.join(themeRoot, "grid-frame.png"),
      prompt: buildGridFramePrompt(theme),
      aspectRatio: "4:5",
      imageSize: "1K",
      refKeys: ["grid"],
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
      aspectRatio: "1:1",
      imageSize: "1K",
      refKeys: ["logo"],
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
      aspectRatio: "9:16",
      imageSize: "2K",
      refKeys: ["background"],
    });
  }

  return jobs;
}

function buildGlobalJobs(filter?: AssetCategory): AssetJob[] {
  const jobs: AssetJob[] = [];

  if (shouldIncludeCategory("buttons", filter)) {
    for (const [key, config] of Object.entries(BUTTON_CONFIGS)) {
      const filename = `btn-${key}.png`;
      jobs.push({
        scope: "global",
        category: "buttons",
        filename,
        outputPath: path.join(COMMON_ROOT, "buttons", filename),
        prompt: buildButtonPrompt(config.desc, config.color, config.highlight, config.shadow),
        aspectRatio: "1:1",
        imageSize: "1K",
        refKeys: ["blocks"],
      });
    }
  }

  if (shouldIncludeCategory("shared-icons", filter)) {
    for (const icon of SHARED_ICON_CONFIGS) {
      jobs.push({
        scope: "global",
        category: "shared-icons",
        filename: icon.filename,
        outputPath: path.join(COMMON_ROOT, "icons", icon.filename),
        prompt: buildWhiteIconPrompt(icon.description),
        aspectRatio: "1:1",
        imageSize: "1K",
        refKeys: ["logo"],
      });
    }
  }

  if (shouldIncludeCategory("catalog-icons", filter)) {
    for (const icon of CATALOG_ICON_CONFIGS) {
      jobs.push({
        scope: "global",
        category: "catalog-icons",
        filename: icon.filename,
        outputPath: path.join(COMMON_ROOT, "icons", icon.filename),
        prompt: buildWhiteIconPrompt(icon.description),
        aspectRatio: "1:1",
        imageSize: "1K",
        refKeys: ["logo"],
      });
    }
  }

  if (shouldIncludeCategory("bonus-icons", filter)) {
    for (const bonus of BONUS_ICON_CONFIGS) {
      jobs.push({
        scope: "global",
        category: "bonus-icons",
        filename: bonus.filename,
        outputPath: path.join(COMMON_ROOT, "bonus", bonus.filename),
        prompt: buildBonusIconPrompt(bonus.description),
        aspectRatio: "1:1",
        imageSize: "1K",
        refKeys: ["logo"],
      });
    }
  }

  if (shouldIncludeCategory("ui-chrome", filter)) {
    for (const chrome of UI_CHROME_CONFIGS) {
      jobs.push({
        scope: "global",
        category: "ui-chrome",
        filename: chrome.filename,
        outputPath: path.join(COMMON_ROOT, "ui", chrome.filename),
        prompt: buildUiChromePrompt(chrome.description, chrome.width, chrome.height),
        aspectRatio: chrome.width > chrome.height * 2 ? "16:9" : "1:1",
        imageSize: "1K",
        refKeys: ["grid"],
      });
    }
  }

  if (shouldIncludeCategory("panels", filter)) {
    for (const panel of PANEL_CONFIGS) {
      jobs.push({
        scope: "global",
        category: "panels",
        filename: panel.filename,
        outputPath: path.join(COMMON_ROOT, "panels", panel.filename),
        prompt: buildPanelPrompt(panel.material, panel.alpha),
        aspectRatio: "1:1",
        imageSize: "1K",
        refKeys: ["grid"],
      });
    }
  }

  if (shouldIncludeCategory("particles", filter)) {
    for (const particle of PARTICLE_CONFIGS) {
      jobs.push({
        scope: "global",
        category: "particles",
        filename: particle.filename,
        outputPath: path.join(COMMON_ROOT, "particles", particle.filename),
        prompt: buildParticlePrompt(particle.description),
        aspectRatio: "1:1",
        imageSize: "1K",
        refKeys: ["logo"],
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
  console.log("Usage: npx tsx scripts/generate-assets.ts [options]");
  console.log("");
  console.log("Options:");
  console.log("  --theme <theme-id>       Generate per-theme assets for one theme (example: theme-4)");
  console.log("  --scope <scope>          per-theme | global | all (default: per-theme)");
  console.log("  --asset <category>       Filter to one category");
  console.log("  --dry-run                Print plan only; do not call Gemini API");
  console.log("  --ref                    Include theme-1 reference images (default)");
  console.log("  --no-ref                 Disable reference images");
  console.log("  --post-process           Convert JPEG→PNG + resize to target dimensions (no API calls)");
  console.log("  --help                   Show this help");
  console.log("");
  console.log(`Per-theme categories: ${PER_THEME_ASSETS.join(", ")}`);
  console.log(`Global categories: ${GLOBAL_ASSETS.join(", ")}`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    scope: "per-theme",
    dryRun: false,
    includeRefs: true,
    postProcess: false,
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

    if (arg === "--post-process") {
      options.postProcess = true;
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
      `Asset category "${options.asset}" is not valid for scope "global". Valid categories: ${GLOBAL_ASSETS.join(
        ", ",
      )}`,
    );
  }
}

function buildJobList(options: CliOptions): { jobs: AssetJob[]; selectedThemeIds: string[] } {
  validateAssetAgainstScope(options);

  const jobs: AssetJob[] = [];
  const selectedThemeIds: string[] = [];

  if (options.scope === "per-theme" || options.scope === "all") {
    if (options.theme) {
      if (!THEMES[options.theme]) {
        throw new Error(`Unknown theme "${options.theme}". Available: ${Object.keys(THEMES).join(", ")}`);
      }
      selectedThemeIds.push(options.theme);
    } else {
      selectedThemeIds.push(...Object.keys(THEMES));
    }

    for (const themeId of selectedThemeIds) {
      jobs.push(...buildPerThemeJobs(themeId, THEMES[themeId], options.asset));
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
    return `${id} (${THEMES[id].name})`;
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

interface GeminiInlineData {
  data: string;
  mimeType?: string;
}

interface GeminiPart {
  inlineData?: GeminiInlineData;
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

function extractBase64Png(response: unknown): string | undefined {
  const resp = response as GeminiResponse;
  const candidates = resp?.candidates;
  if (!Array.isArray(candidates)) {
    return undefined;
  }

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      const base64 = part?.inlineData?.data;
      if (typeof base64 === "string" && base64.length > 0) {
        return base64;
      }
    }
  }

  return undefined;
}

async function generateImage(ai: GoogleGenAI, job: AssetJob, includeRefs: boolean): Promise<string> {
  type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };
  let contents: ContentPart[];

  if (job.refPaths && job.refPaths.length > 0) {
    contents = [];
    for (let i = 0; i < job.refPaths.length; i += 1) {
      const data = loadFileBase64(job.refPaths[i]);
      if (!data) {
        continue;
      }
      const mimeType = isJpeg(Buffer.from(data, "base64")) ? "image/jpeg" : "image/png";
      contents.push({ text: `Image ${i + 1}:` });
      contents.push({ inlineData: { mimeType, data } });
    }
    contents.push({ text: job.prompt });
  } else {
    contents = [{ text: job.prompt }];
    if (includeRefs) {
      for (const refKey of new Set(job.refKeys)) {
        const refData = loadRefBase64(refKey);
        if (!refData) {
          continue;
        }
        contents.push({ inlineData: { mimeType: "image/png", data: refData } });
      }
    }
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await waitForRequestSlot();

      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: job.aspectRatio,
            imageSize: job.imageSize,
            outputQuality: 100,
          },
        },
      });

      const imageBase64 = extractBase64Png(response);
      if (!imageBase64) {
        throw new Error("No inline image data returned by Gemini.");
      }

      return imageBase64;
    } catch (error) {
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const backoffMs = RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
        console.warn(`   ↻ Retryable error (429/503). Retrying in ${Math.round(backoffMs / 1000)}s...`);
        await sleep(backoffMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to generate image after retries.");
}

const TARGET_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "block-1.png": { width: 544, height: 544 },
  "block-2.png": { width: 1088, height: 544 },
  "block-3.png": { width: 1632, height: 544 },
  "block-4.png": { width: 2176, height: 544 },
  "grid-bg.png": { width: 512, height: 640 },
  "grid-frame.png": { width: 576, height: 720 },
  "background.png": { width: 2048, height: 2048 },
  "loading-bg.png": { width: 2048, height: 2048 },
  "logo.png": { width: 512, height: 512 },
  "map.png": { width: 1080, height: 1920 },
  "theme-icon.png": { width: 128, height: 128 },
};

function isJpeg(buf: Buffer): boolean {
  return buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;
}

async function postProcessFile(filePath: string, target: { width: number; height: number }): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const metadata = await sharp(buf).metadata();
  const srcW = metadata.width ?? 0;
  const srcH = metadata.height ?? 0;
  if (srcW <= 0 || srcH <= 0) {
    throw new Error(`invalid source dimensions for ${path.basename(filePath)}`);
  }

  let pipeline = sharp(buf);
  const targetRatio = target.width / target.height;
  const srcRatio = srcW / srcH;

  if (Math.abs(targetRatio - srcRatio) > 0.05) {
    let cropW: number;
    let cropH: number;
    if (targetRatio > srcRatio) {
      cropW = srcW;
      cropH = Math.round(srcW / targetRatio);
    } else {
      cropH = srcH;
      cropW = Math.round(srcH * targetRatio);
    }
    const left = Math.round((srcW - cropW) / 2);
    const top = Math.round((srcH - cropH) / 2);
    pipeline = pipeline.extract({ left, top, width: cropW, height: cropH });
  }

  const outputBuf = await pipeline.resize(target.width, target.height).png().toBuffer();
  fs.writeFileSync(filePath, outputBuf);

  return `${srcW}x${srcH} → ${target.width}x${target.height}`;
}

async function postProcessDirectory(dirPath: string, label: string): Promise<void> {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".png"));
  if (files.length === 0) {
    return;
  }

  console.log(`\n🔧 Post-processing ${label}...`);
  let converted = 0;
  let resized = 0;
  let errors = 0;

  for (const filename of files) {
    const filePath = path.join(dirPath, filename);
    const target = TARGET_DIMENSIONS[filename];

    try {
      const sourceBuf = fs.readFileSync(filePath);
      if (isJpeg(sourceBuf)) {
        const pngBuf = await sharp(sourceBuf).png().toBuffer();
        fs.writeFileSync(filePath, pngBuf);
        converted += 1;
      }

      if (target) {
        const resizeLabel = await postProcessFile(filePath, target);
        resized += 1;
        console.log(`  📐 ${filename}: ${resizeLabel}`);
      } else if (isJpeg(sourceBuf)) {
        console.log(`  ✅ ${filename}: JPEG→PNG`);
      }
    } catch (error) {
      errors += 1;
      console.error(`  ❌ ${filename}: ${formatError(error)}`);
    }
  }

  console.log(`  Done: ${converted} converted, ${resized} resized, ${errors} errors`);
}

function savePng(outputPath: string, imageBase64: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const buf = Buffer.from(imageBase64, "base64");

  if (isJpeg(buf)) {
    console.warn(`   ⚠️  Gemini returned JPEG — saving raw (run post-process to convert)`);
  }

  fs.writeFileSync(outputPath, buf);
}

async function postProcessTheme(themeId: string): Promise<void> {
  const themeRoot = path.join(ASSETS_ROOT, themeId);
  if (!fs.existsSync(themeRoot)) {
    console.log(`No assets found at ${relativePath(themeRoot)}`);
    return;
  }

  await postProcessDirectory(themeRoot, themeId);
}

async function postProcessAll(options: CliOptions): Promise<void> {
  if (options.theme) {
    await postProcessTheme(options.theme);
  } else if (options.scope === "per-theme" || options.scope === "all") {
    for (const themeId of Object.keys(THEMES)) {
      await postProcessTheme(themeId);
    }
  }

  if (options.scope === "global" || options.scope === "all") {
    const commonDirs = ["bonus", "buttons", "icons", "panels", "particles", "ui"];
    for (const dir of commonDirs) {
      const dirPath = path.join(COMMON_ROOT, dir);
      await postProcessDirectory(dirPath, `common/${dir}`);
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { jobs, selectedThemeIds } = buildJobList(options);

  if (options.postProcess) {
    console.log("🔧 zKube Asset Post-Processor");
    await postProcessAll(options);
    return;
  }

  console.log("🎨 zKube Asset Generator");
  console.log(`Model: ${MODEL}`);
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

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for generation. Export it and retry.");
  }

  // Pressed/disabled button states must be derived via post-processing.
  if (jobs.some((job) => job.category === "buttons")) {
    console.log("ℹ️  Button -pressed and -disabled variants are intentionally not generated via API.");
    console.log("");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
            const imageBase64 = await generateImage(ai, job, options.includeRefs);
            savePng(job.outputPath, imageBase64);
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
    const block1Targets = TARGET_DIMENSIONS["block-1.png"];
    const postProcessed = new Set<string>();
    for (const job of phase1Jobs) {
      for (const refPath of job.refPaths ?? []) {
        if (refPath.endsWith("block-1.png") && !refPath.includes("theme-1") && !postProcessed.has(refPath)) {
          if (fs.existsSync(refPath)) {
            try {
              await postProcessFile(refPath, block1Targets);
              postProcessed.add(refPath);
              console.log(`  📐 Post-processed ${relativePath(refPath)} to ${block1Targets.width}x${block1Targets.height}`);
            } catch {
              console.warn(`  ⚠️  Could not post-process ${relativePath(refPath)}`);
            }
          }
        }
      }
    }

    console.log("");
    console.log(`Phase 2: generating ${phase1Jobs.length} multi-cell blocks (using block-1 as content source)...`);
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
