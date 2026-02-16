import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3-pro-image-preview";
const CONCURRENCY = 2;
const REQUEST_DELAY_MS = 3_000;
const RETRY_BACKOFF_MS = [10_000, 20_000, 40_000] as const;
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
  | "decos"
  | "theme-icon"
  | "map";
type GlobalAsset = "buttons" | "shared-icons" | "catalog-icons" | "panels" | "particles";
type AssetCategory = PerThemeAsset | GlobalAsset;
type AspectRatio = "1:1" | "16:9" | "4:5" | "3:4" | "9:16";
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
  scene: string;
  gridMaterial: string;
  decoLeft: string;
  decoRight: string;
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
}

interface CliOptions {
  theme?: string;
  scope: Scope;
  asset?: AssetCategory;
  dryRun: boolean;
  includeRefs: boolean;
}

const THEMES: Record<string, ThemeDefinition> = {
  "theme-3": {
    name: "Easter Island",
    icon: "🗿",
    description: "Mysterious stone moai statues on a volcanic island under starlit skies",
    mood: "Mysterious, eerie, ancient",
    palette: { bg: "#1A0A2E", accent: "#FF00FF", blocks: ["#39FF14", "#00FFFF", "#FF00FF", "#FFE600"] },
    motifs: "Stone moai faces, volcanic rock, obsidian, bioluminescent tide pools, star constellations",
    blockMotifs: "Stone moai faces, volcanic rock patterns, obsidian edges",
    scene: "Volcanic island at night, giant moai statues silhouetted against starry sky, bioluminescent tide pools",
    gridMaterial: "Dark volcanic basalt with faint glow veins",
    decoLeft: "Moai statue silhouette with glowing eyes",
    decoRight: "Volcanic rock formation with bioluminescent moss",
  },
  "theme-4": {
    name: "Maya",
    icon: "🏛️",
    description: "Ancient Mesoamerican temples and jade jungle ruins",
    mood: "Mystical, ancient, lush",
    palette: { bg: "#0A2540", accent: "#00CED1", blocks: ["#00E5A0", "#00B4D8", "#FF6F91", "#FFC947"] },
    motifs:
      "Quetzalcoatl serpents, stepped pyramids, jade carvings, sun stones, jaguar patterns, feathered serpent glyphs",
    blockMotifs: "Jade carvings, serpent glyphs, temple step patterns, sun stone motifs",
    scene:
      "Deep jungle with ancient stepped Mayan temple in background, jade-green canopy, misty waterfalls, turquoise cenote pools",
    gridMaterial: "Deep ocean-floor jade stone with turquoise tint",
    decoLeft: "Jungle vine curtain with jade ornaments and feathered serpent",
    decoRight: "Stone serpent pillar with carved glyphs and moss",
  },
  "theme-5": {
    name: "Cyberpunk",
    icon: "💜",
    description: "Neon-lit dystopian cityscape with holographic interfaces",
    mood: "Electric, edgy, futuristic",
    palette: { bg: "#0D1117", accent: "#BD00FF", blocks: ["#00FF88", "#00BFFF", "#FF00FF", "#FFD700"] },
    motifs: "Circuit traces, neon signs, holographic glitch, chrome panels, digital rain",
    blockMotifs: "Circuit board traces, neon glow panels, holographic fragments",
    scene:
      "Rain-slicked cyberpunk alley at night, neon signs reflecting in puddles, towering buildings with holographic billboards",
    gridMaterial: "Dark carbon fiber with faint neon circuit traces",
    decoLeft: "Cyberpunk neon sign post with flickering lights",
    decoRight: "Chrome mechanical arm with holographic display",
  },
  "theme-6": {
    name: "Medieval",
    icon: "⚔️",
    description: "Stone castle courtyard with torchlit walls and iron gates",
    mood: "Epic, warm, noble",
    palette: { bg: "#1A1410", accent: "#DAA520", blocks: ["#CD7F32", "#DC143C", "#228B22", "#FFD700"] },
    motifs: "Shield crests, iron rivets, stone bricks, torch flames, heraldic lions, sword motifs",
    blockMotifs: "Shield crests, iron rivets, stone brick patterns",
    scene:
      "Castle courtyard at sunset, stone walls with burning torches, distant towers, iron portcullis, heraldic banners",
    gridMaterial: "Weathered sandstone with iron-stud grain",
    decoLeft: "Stone tower with burning torch and ivy",
    decoRight: "Shield rack with crossed swords and heraldic banner",
  },
  "theme-7": {
    name: "Ancient Egypt",
    icon: "🏺",
    description: "Golden pyramids at dusk with hieroglyph-covered obelisks",
    mood: "Majestic, mystical, regal",
    palette: { bg: "#0A1628", accent: "#FFD700", blocks: ["#40E0D0", "#4169E1", "#DDA0DD", "#DAA520"] },
    motifs: "Hieroglyphs, scarab beetles, Eye of Horus, lotus flowers, ankh symbols, papyrus scrolls",
    blockMotifs: "Hieroglyphs, scarab beetles, lotus flower carvings",
    scene:
      "Desert at twilight, golden pyramids with hieroglyph-covered obelisks, Nile river reflecting sky, palm trees",
    gridMaterial: "Cool blue-grey slate with gold hieroglyph inlays",
    decoLeft: "Obelisk with hieroglyphs and Eye of Horus",
    decoRight: "Papyrus reeds, lotus flowers, and golden ankh",
  },
  "theme-8": {
    name: "Volcano",
    icon: "🌋",
    description: "Volcanic forge with rivers of lava and obsidian pillars",
    mood: "Intense, dramatic, primal",
    palette: { bg: "#1A0A00", accent: "#FF4500", blocks: ["#FF6600", "#DC143C", "#FFB700", "#FF69B4"] },
    motifs: "Lava cracks, obsidian shards, ember glow, volcanic vents, magma flows, basalt columns",
    blockMotifs: "Obsidian shards, lava crack patterns, ember glow veins",
    scene:
      "Volcanic forge interior, rivers of lava flowing between obsidian platforms, ember-filled sky, basalt columns",
    gridMaterial: "Cracked obsidian with faint ember glow between fissures",
    decoLeft: "Obsidian column with lava drips and ember particles",
    decoRight: "Ember-wreathed rock arch with magma glow",
  },
  "theme-9": {
    name: "Tribal",
    icon: "🪘",
    description: "Earthy savanna ritual grounds with painted stones and drums",
    mood: "Earthy, spiritual, organic",
    palette: { bg: "#1A1220", accent: "#FF69B4", blocks: ["#8FBC8F", "#87CEEB", "#DDA0DD", "#FFD700"] },
    motifs: "Painted patterns, drum motifs, feather marks, bone beads, ritual masks, cave paintings",
    blockMotifs: "Painted tribal patterns, drum circle motifs, feather marks",
    scene:
      "Savanna at dawn, ritual stone circle, painted rocks, wildflowers, distant acacia trees, drum circle",
    gridMaterial: "Rose-tinted clay with faint handprint texture",
    decoLeft: "Painted totem pole with feathers and bone beads",
    decoRight: "Ceremonial drum and feather arrangement with painted stones",
  },
  "theme-10": {
    name: "Arctic",
    icon: "❄️",
    description: "Frozen tundra under aurora borealis with steampunk brass structures",
    mood: "Cold, wondrous, mechanical",
    palette: { bg: "#0A1628", accent: "#B8860B", blocks: ["#CD7F32", "#B8860B", "#808000", "#B7410E"] },
    motifs: "Ice crystals, brass gears, copper pipes, snowflakes, aurora waves, frozen clockwork",
    blockMotifs: "Brass gear faces, copper pipe rivets, frozen clockwork",
    scene:
      "Frozen tundra under aurora borealis, ice crystal formations, brass and copper mechanical structures half-buried in snow",
    gridMaterial: "Dark worn leather with brass patina rivets",
    decoLeft: "Ice pillar with embedded brass gears and frost patterns",
    decoRight: "Snow-covered mechanical crane with copper patina",
  },
};

const PER_THEME_ASSETS = [
  "blocks",
  "background",
  "loading-bg",
  "logo",
  "grid",
  "decos",
  "theme-icon",
  "map",
] as const;
const GLOBAL_ASSETS = ["buttons", "shared-icons", "catalog-icons", "panels", "particles"] as const;
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
const ASSETS_ROOT = path.join(ROOT_DIR, "mobile-app", "public", "assets");
const COMMON_ROOT = path.join(ASSETS_ROOT, "common");
const THEME_1_ROOT = path.join(ASSETS_ROOT, "theme-1");

const REF_IMAGE_PATHS = {
  blocks: path.join(THEME_1_ROOT, "block-1.png"),
  background: path.join(THEME_1_ROOT, "background.png"),
  logo: path.join(THEME_1_ROOT, "logo.png"),
  grid: path.join(THEME_1_ROOT, "grid-bg.png"),
  decos: path.join(THEME_1_ROOT, "deco-left.png"),
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

function isRateLimitError(error: unknown): boolean {
  const candidate = error as {
    status?: number;
    statusCode?: number;
    code?: number;
    response?: { status?: number };
    message?: string;
  };
  const status = candidate.status ?? candidate.statusCode ?? candidate.code ?? candidate.response?.status;
  if (status === 429) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(candidate.message ?? error);
  return /(^|\D)429(\D|$)|rate\s*limit|quota/i.test(message);
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

function buildBlockPrompt(theme: ThemeDefinition, width: number, color: string): string {
  const shapeLine =
    width === 1
      ? "Generate a single square game block tile texture for a puzzle game."
      : `Generate a wide game block tile texture (${width} cells wide, 1 cell tall) for a puzzle game.`;

  const widthLine =
    width === 1
      ? ""
      : "The tile should be horizontally elongated with the pattern repeating/extending across its width.";

  return withStyleAnchor(`
${shapeLine}
Theme: ${theme.name} — ${theme.description}
Design: A decorative emblem tile with the theme's motifs: ${theme.blockMotifs}.
The tile should look like a carved/painted cultural emblem — bold central shape with decorative inner details.
Color palette: Primary fill ${color} with black outline separators and lighter highlight accents.
Subtle grunge/distressed texture overlay on the fill areas.
${widthLine}
Transparent background. Centered. No text, no people, no letters.
`);
}

function buildBackgroundPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a full-screen background illustration for a mobile puzzle game.
Theme: ${theme.name} — ${theme.description}
Scene: ${theme.scene}
Composition: Landscape orientation. Layered parallax depth — dark foreground silhouettes framing left and right edges, midground scene elements, atmospheric background fading into sky. Large decorative focal element on one side, bright atmospheric light source on the other.
Mood: ${theme.mood}. Rich, immersive, inviting.
Color palette: Deep dark tones for foreground (${theme.palette.bg}), mid-tones for scene (${theme.palette.accent}), with star/light accents.
NO text, NO UI elements, NO people, NO recognizable characters.
`);
}

function buildLoadingBackgroundPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a full-screen background illustration for a mobile puzzle game.
Theme: ${theme.name} — ${theme.description}
Scene: ${theme.scene}
Composition: Landscape orientation. Layered parallax depth — dark foreground silhouettes framing left and right edges, midground scene elements, atmospheric background fading into sky. Large decorative focal element on one side, bright atmospheric light source on the other.
Mood: ${theme.mood}. Rich, immersive, inviting.
Color palette: Deep dark tones for foreground (${theme.palette.bg}), mid-tones for scene (${theme.palette.accent}), with star/light accents.
Same scene but with a slightly darker, more atmospheric treatment — this is seen briefly during loading.
Slightly blurred/simplified version of the main background. Deeper shadows, more atmospheric fog.
NO text, NO UI elements, NO people, NO recognizable characters.
`);
}

function buildLogoPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a game logo icon for a puzzle game.
Theme: ${theme.name}
Design: An isometric 3D cube (front face dominant, top and right side visible) with the theme's cultural motifs carved/painted on its faces.
Front face: A stylized mask/emblem with ${theme.motifs} motifs — aggressive/intense expression with bold shapes.
Top face: Geometric glyph/pattern panel in theme accent color.
Side faces: Repeating decorative scroll/spiral motifs.
Style: Bold black outline contours. Cel-shaded with gradient fills in the theme's accent color (${theme.palette.accent}). White specular highlights on edges. Glossy carved appearance.
Color palette: ${theme.palette.accent} as primary, darker shade for shadows, white for highlights.
Square format. Transparent background. Centered. No text, no letters.
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
Style: An ornate rectangular frame border with themed decorative elements. The CENTER must be FULLY TRANSPARENT (the game grid shows through).
Border width: approximately 10% of the image on each side.
Border decoration: Cultural motifs and patterns from the theme carved into the frame material.
Frame color: Theme accent (${theme.palette.accent}) with darker shadow tones and bright highlights.
Portrait rectangle (4:5 ratio). Center is transparent. Bold border.
`);
}

function buildDecoPrompt(theme: ThemeDefinition, side: "left" | "right"): string {
  const content = side === "left" ? theme.decoLeft : theme.decoRight;
  const sideCaps = side.toUpperCase();
  const fadeLine =
    side === "left"
      ? "Composition: Element anchored to the LEFT edge. Fades to full transparency on the right side."
      : "Composition: Element anchored to the RIGHT edge. Fades to full transparency on the left side.";

  return withStyleAnchor(`
Generate a decorative foreground element that sits on the ${sideCaps} side of a mobile game screen.
Theme: ${theme.name}
Content: ${content}
Style: Dark silhouetted foreground element with theme accent color (${theme.palette.accent}) highlights/glow.
${fadeLine}
Must not block more than 30% of the screen width.
Portrait format (3:4). PNG with transparency on the opposite side.
No text, no people.
`);
}

function buildThemeIconPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a small square icon representing the "${theme.name}" theme for a game settings menu.
Theme: ${theme.name} (${theme.icon})
Design: A single iconic symbol that instantly communicates the theme. For example: ${theme.motifs} — pick the most recognizable single element.
Style: Bold silhouette icon, white fill on transparent background. Thick strokes (3-4px equivalent). Clean, readable at 48×48 pixels.
Centered in frame. Square format. No text.
`);
}

function buildMapPrompt(theme: ThemeDefinition): string {
  return withStyleAnchor(`
Generate a vertical scrolling progression map background for a mobile puzzle game zone.
Theme: ${theme.name} — ${theme.description}
Scene: A winding path through a themed landscape with 11 locations visible:
- 9 regular stops (small clearings/platforms along the path)
- 1 shop/marketplace (with a small market stall or treasure chest)
- 1 boss arena at the top (larger, more dramatic platform with imposing architecture)
The path winds from bottom to top in a serpentine S-curve pattern.
Composition: Tall portrait (9:16). Path starts at bottom, ends at dramatic boss area at top.
Background: ${theme.scene} — atmospheric, with the path cutting through the themed landscape.
Mood: ${theme.mood}. Adventurous, inviting exploration.
Color palette: Dark atmospheric tones with the path slightly lighter. Accent: ${theme.palette.accent}.
The stop locations should be subtle clearings/platforms — NOT labeled or numbered.
No text, no UI elements, no people.
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
Style: Clean, bold, white silhouette on transparent background.
Stylized for a fantasy/tribal puzzle game. Thick strokes (3-4px equivalent).
Rounded corners. Single shape, centered. No text, no color (white only).
Square format. 48×48 pixel target (generating larger for quality).
`);
}

function buildPanelPrompt(material: string, alpha: string): string {
  return withStyleAnchor(`
Generate a 9-slice panel texture for a game UI.
Material: ${material}
The image is 96×96px conceptually. The outer 24px on all sides are the fixed border. The inner 48×48px center will stretch.
Design the border with decorative edges. Center should be a subtle, stretchable fill matching the material.
Square format. PNG. The center area should have slight transparency (${alpha} alpha).
`);
}

function buildParticlePrompt(description: string): string {
  return withStyleAnchor(`
Generate a tiny particle texture for a game effect.
Shape: ${description}
Style: White silhouette on transparent background. Soft edges with slight glow.
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
      const filename = `block-${width}.png`;
      jobs.push({
        scope: "per-theme",
        category: "blocks",
        themeId,
        filename,
        outputPath: path.join(themeRoot, filename),
        prompt: buildBlockPrompt(theme, width, theme.palette.blocks[i]),
        aspectRatio: "1:1",
        imageSize: "1K",
        refKeys: ["blocks"],
      });
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
      aspectRatio: "16:9",
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
      aspectRatio: "16:9",
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

  if (shouldIncludeCategory("decos", filter)) {
    jobs.push({
      scope: "per-theme",
      category: "decos",
      themeId,
      filename: "deco-left.png",
      outputPath: path.join(themeRoot, "deco-left.png"),
      prompt: buildDecoPrompt(theme, "left"),
      aspectRatio: "3:4",
      imageSize: "1K",
      refKeys: ["decos"],
    });
    jobs.push({
      scope: "per-theme",
      category: "decos",
      themeId,
      filename: "deco-right.png",
      outputPath: path.join(themeRoot, "deco-right.png"),
      prompt: buildDecoPrompt(theme, "right"),
      aspectRatio: "3:4",
      imageSize: "1K",
      refKeys: ["decos"],
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
        outputPath: path.join(COMMON_ROOT, icon.filename),
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
    return "mobile-app/public/assets/common/";
  }
  if (options.scope === "per-theme" && selectedThemeIds.length === 1) {
    return `mobile-app/public/assets/${selectedThemeIds[0]}/`;
  }
  return "mobile-app/public/assets/";
}

function extractBase64Png(response: unknown): string | undefined {
  const direct = (response as any)?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }

  const candidates = (response as any)?.candidates;
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
  const contents: Array<{ text: string } | { inlineData: { mimeType: "image/png"; data: string } }> = [
    { text: job.prompt },
  ];

  if (includeRefs) {
    for (const refKey of new Set(job.refKeys)) {
      const refData = loadRefBase64(refKey);
      if (!refData) {
        continue;
      }
      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: refData,
        },
      });
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
            outputMimeType: "image/png",
          },
        },
      });

      const imageBase64 = extractBase64Png(response);
      if (!imageBase64) {
        throw new Error("No inline image data returned by Gemini.");
      }

      return imageBase64;
    } catch (error) {
      if (isRateLimitError(error) && attempt < MAX_RETRIES) {
        const backoffMs = RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
        console.warn(`   ↻ 429 rate limit hit. Retrying in ${Math.round(backoffMs / 1000)}s...`);
        await sleep(backoffMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to generate image after retries.");
}

function savePng(outputPath: string, imageBase64: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(imageBase64, "base64"));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { jobs, selectedThemeIds } = buildJobList(options);

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

  await Promise.all(
    jobs.map((job, index) =>
      limit(async () => {
        const step = `[${index + 1}/${jobs.length}]`;
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
          failures.push({ job, error, index });
          console.log(`${step}  ❌ ${job.filename} (${elapsed}s)`);
          console.log(`       ${formatError(error)}`);
        }
      }),
    ),
  );

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
