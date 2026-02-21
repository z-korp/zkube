import fs from "node:fs";
import path from "node:path";
import type { ThemeDefinition } from "./types";

const TEMPLATES_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data", "templates");

const templateCache = new Map<string, string>();

function loadTemplate(name: string): string {
  const cached = templateCache.get(name);
  if (cached) return cached;
  const raw = fs.readFileSync(path.join(TEMPLATES_DIR, `${name}.json`), "utf-8");
  templateCache.set(name, raw);
  return raw;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.substring(0, 2), 16),
    g: Number.parseInt(h.substring(2, 4), 16),
    b: Number.parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`.toUpperCase();
}

function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function lightenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

/* ------------------------------------------------------------------ */
/*  Block master prompt                                                */
/* ------------------------------------------------------------------ */

export function buildBlockMasterPrompt(theme: ThemeDefinition): string {
  return theme.blockData.blockPrompt;
}

/* ------------------------------------------------------------------ */
/*  Grid background prompt (template-based)                           */
/* ------------------------------------------------------------------ */

function buildGridBgSubstitutionMap(theme: ThemeDefinition): Record<string, string> {
  const bd = theme.blockData;
  const bg = theme.palette.bg;

  return {
    theme_name: theme.name,
    bg_color: bg,
    bg_secondary: darkenHex(bg, 0.1),
    bg_highlight: lightenHex(bg, 0.08),
    bg_shadow: darkenHex(bg, 0.4),
    grid_material: theme.gridMaterial,
    motifs_short: theme.motifs.split(",").slice(0, 3).join(","),
    inspiration_1: bd.inspirations[0],
    theme_keyword_1: bd.themeKeywords[0],
    theme_keyword_2: bd.themeKeywords[1],
    theme_keyword_3: bd.themeKeywords[2],
  };
}

export function buildGridBackgroundPrompt(theme: ThemeDefinition): string {
  const template = loadTemplate("grid-bg");
  const vars = buildGridBgSubstitutionMap(theme);
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? _match);
}

/* ------------------------------------------------------------------ */
/*  Scene prompts (background, loading, theme-icon)                   */
/* ------------------------------------------------------------------ */

export function buildBackgroundPrompt(theme: ThemeDefinition): string {
  return `
{
  "style_name": "${theme.name} Immersive Theme Background",
  "inspiration": [
    "${theme.blockData.inspirations[0]}",
    "${theme.blockData.inspirations[1]}",
    "Modern vector landscape illustration",
    "Immersive full-bleed scenic wallpaper"
  ],
  "scene": "${theme.scene}",
  "style": "flat vector illustration with bold linework, smooth gradients, and high-contrast cel shading",
  "color_palette": {
    "primary": "${theme.palette.bg}",
    "secondary": "${theme.palette.accent}",
    "highlight": "${lightenHex(theme.palette.accent, 0.25)}",
    "shadow": "${darkenHex(theme.palette.bg, 0.35)}",
    "background_gradient": ["${darkenHex(theme.palette.bg, 0.25)}", "${theme.palette.bg}"]
  },
  "lighting": "cinematic environmental lighting with clear highlight and shadow separation",
  "mood": "${theme.mood}",
  "background": {
    "type": "scenery",
    "details": "full-bleed seamless world scene extending edge-to-edge with uninterrupted scenery"
  },
  "composition": "wide immersive panoramic composition, scenery bleeds past all four edges naturally",
  "camera": {
    "angle": "eye-level",
    "distance": "wide shot",
    "lens": "35mm",
    "focus": "sharp focus across frame"
  },
  "medium": "digital vector art",
  "textures": "clean edges, smooth gradient volumes, subtle print-like grain",
  "effects": "subtle atmospheric depth and selective glow accents",
  "themes": ["${theme.name}", "${theme.blockData.themeKeywords[0]}", "${theme.blockData.themeKeywords[1]}", "${theme.blockData.themeKeywords[2]}"],
  "usage_notes": "Square 1:1 opaque image. Scenery fills the entire canvas edge-to-edge. Pure landscape, seamless, unframed."
}
`.trim();
}

export function buildLoadingBackgroundPrompt(theme: ThemeDefinition): string {
  return `
{
  "style_name": "${theme.name} Loading Atmosphere",
  "inspiration": [
    "${theme.blockData.inspirations[0]}",
    "${theme.blockData.inspirations[1]}",
    "Stylized cinematic key art",
    "Modern vector poster composition"
  ],
  "scene": "${theme.loadingScene}",
  "style": "flat vector illustration with bold linework, smooth gradients, and dramatic cel-shaded contrast",
  "color_palette": {
    "primary": "${theme.palette.bg}",
    "secondary": "${theme.palette.accent}",
    "highlight": "${lightenHex(theme.palette.accent, 0.22)}",
    "shadow": "${darkenHex(theme.palette.bg, 0.42)}",
    "background_gradient": ["${darkenHex(theme.palette.bg, 0.35)}", "${theme.palette.bg}"]
  },
  "lighting": "focused hero lighting with moody shadow falloff",
  "mood": "${theme.mood}, cinematic, mysterious",
  "background": {
    "type": "scenery",
    "details": "close-up immersive scene filling the entire frame"
  },
  "composition": "centered focal hierarchy, atmospheric edges, no framing",
  "camera": {
    "angle": "eye-level",
    "distance": "medium close-up",
    "lens": "50mm",
    "focus": "sharp hero details"
  },
  "medium": "digital vector art",
  "effects": "subtle glow accents and depth haze",
  "usage_notes": "Square 1:1, opaque image, no text, no UI, no logos, no characters."
}
`.trim();
}

export function buildThemeIconPrompt(theme: ThemeDefinition): string {
  return `A bold ${theme.blockData.centerpiece} icon on a dark background (${darkenHex(theme.palette.bg, 0.2)}). The ${theme.blockData.centerpiece} is drawn in white (#FFFFFF) with ${theme.palette.accent} accent highlights. Stylized 2D vector game art with bold black outlines and flat cel-shading. Thick strokes, centered composition, instantly readable at small sizes. Sharp square corners — no rounded edges, no circular framing. No text, no logos, no clutter. 256x256 pixels.`;
}

/* ------------------------------------------------------------------ */
/*  Map background prompt                                             */
/* ------------------------------------------------------------------ */

export function buildMapBackgroundPrompt(theme: ThemeDefinition): string {
  return `
{
  "style_name": "${theme.name} Top-Down Map Terrain",
  "inspiration": [
    "Satellite photography of natural terrain",
    "Top-down game map textures",
    "Stylized aerial landscape illustration"
  ],
  "scene": "Top-down bird's eye aerial view looking straight down at a single uniform natural surface — ${theme.mapScene}. ONLY ONE natural element filling the entire frame: just water, or just sand, or just snow, or just jungle canopy, or just earth. Absolutely no islands, no land masses, no clearings, no structures, no objects — pure uniform terrain texture.",
  "style": "flat vector illustration with smooth gradients and cel shading, stylized satellite-view aesthetic. Rich color saturation.",
  "color_palette": {
    "primary": "${theme.palette.bg}",
    "secondary": "${theme.palette.accent}",
    "highlight": "${lightenHex(theme.palette.accent, 0.3)}",
    "shadow": "${darkenHex(theme.palette.bg, 0.35)}"
  },
  "lighting": "even overhead lighting as seen from high altitude, subtle shadows from terrain elevation",
  "mood": "${theme.mood}",
  "composition": "uniform natural terrain filling the entire canvas edge-to-edge, no focal point, tileable feel, consistent texture across the frame",
  "camera": {
    "angle": "perfectly top-down, 90 degrees straight down",
    "distance": "high altitude aerial",
    "lens": "orthographic",
    "focus": "uniform sharpness"
  },
  "medium": "digital vector art",
  "effects": "subtle depth variation in terrain color, natural texture patterns",
  "themes": ["${theme.name}", "${theme.blockData.themeKeywords[0]}"],
  "usage_notes": "Square 1:1 opaque image. Pure natural terrain from above. NO buildings, NO structures, NO paths, NO roads, NO text, NO UI, NO characters. Just terrain — water, land, vegetation, sand, ice, rock as appropriate for the theme."
}
`.trim();
}

export function buildMapNodePrompt(theme: ThemeDefinition, nodeType: "level" | "shop" | "boss" | "completed"): string {
  const nodeDescriptions: Record<string, Record<string, string>> = {
    "Polynesian": {
      level: "A small tropical island seen from above — sandy beach ring around lush green vegetation, surrounded by deep blue ocean. Compact circular island shape.",
      shop: "A small tropical island with a thatched-roof market hut and wooden dock seen from above — sandy beach, palm trees, a few colorful trade goods visible. Surrounded by ocean.",
      boss: "A volcanic island seen from above — dark rocky mountain with glowing orange lava crater at the center, surrounded by black volcanic beach and deep ocean. Larger and more dramatic than regular islands.",
      completed: "A small tropical island seen from above with a bright golden flag planted at its peak — sandy beach ring, lush green vegetation, golden glow emanating from the island. Surrounded by deep blue ocean. Victorious, conquered feel.",
    },
    "Ancient Egypt": {
      level: "A small desert oasis seen from above — sandy terrain with a cluster of palm trees around a turquoise water pool. Surrounded by golden desert sand.",
      shop: "A small desert bazaar seen from above — colorful market tents and awnings arranged around a central well, surrounded by sand.",
      boss: "A golden pyramid complex seen from above — large pyramid with smaller structures around it, long shadows cast on the sand. Imposing and monumental.",
      completed: "A small desert oasis seen from above with a golden ankh symbol glowing at the center — palm trees, turquoise water, warm golden radiance. Surrounded by sand. Conquered, blessed feel.",
    },
    "Norse": {
      level: "A small snowy clearing seen from above — a circle of standing rune stones on white snow, surrounded by dark pine forest. Faint blue glow from runes.",
      shop: "A small Viking village seen from above — a few wooden longhouses with snow-covered roofs arranged around a central fire pit, surrounded by snowy forest.",
      boss: "A massive frost fortress seen from above — ice-covered great hall with glowing blue windows on a frozen lake, surrounded by snow and dark forest. Imposing scale.",
      completed: "A small snowy clearing seen from above with rune stones glowing bright blue — warm golden fire burning at the center, victory runes illuminated. Surrounded by dark forest. Conquered feel.",
    },
    "Ancient Greece": {
      level: "A small rocky islet seen from above — white marble column ruins on sun-bleached rock, surrounded by azure Aegean sea.",
      shop: "A small harbor town seen from above — white buildings with blue roofs clustered around a tiny port with boats, surrounded by sea.",
      boss: "A grand temple complex on a hilltop seen from above — white marble Parthenon with surrounding columns, olive groves around the base. Gleaming in golden light.",
      completed: "A small rocky islet seen from above with a golden laurel wreath glowing at the center — white marble columns intact, warm golden light. Surrounded by azure sea. Victorious feel.",
    },
    "Feudal Japan": {
      level: "A small shrine clearing seen from above — a stone lantern and small torii gate amid pink cherry blossom trees, surrounded by dark misty forest.",
      shop: "A small tea house seen from above — wooden building with warm light, a zen rock garden beside it, cherry blossoms, surrounded by bamboo forest.",
      boss: "A grand castle seen from above — multi-tiered Japanese castle with red and black roofs, stone walls, surrounded by cherry blossom gardens and moats. Dramatic scale.",
      completed: "A small shrine clearing seen from above with cherry blossoms in full golden bloom — warm light radiating from the torii gate, victorious banners. Surrounded by misty forest. Conquered feel.",
    },
    "Ancient China": {
      level: "A small pagoda garden seen from above — a jade-green pagoda beside a lotus pond, surrounded by bamboo and misty terrain.",
      shop: "A small market courtyard seen from above — silk-draped stalls with hanging lanterns around a central jade fountain, surrounded by gardens.",
      boss: "An imperial palace complex seen from above — golden curved roofs of a grand palace with dragon statues, surrounded by formal gardens and walls. Majestic scale.",
      completed: "A small pagoda garden seen from above with golden lanterns lit and jade glowing bright — warm imperial radiance from the pagoda. Surrounded by misty terrain. Conquered feel.",
    },
    "Ancient Persia": {
      level: "A small garden pavilion seen from above — a blue-tiled dome structure beside a reflecting pool, surrounded by cypress trees and arid terrain.",
      shop: "A small caravanserai seen from above — an arched courtyard with colorful goods and carpets, a central fountain, surrounded by desert.",
      boss: "A grand palace seen from above — massive blue domes and golden minarets, geometric tile courtyards, reflecting pools. Luminous and imposing.",
      completed: "A small garden pavilion seen from above with golden light streaming from the blue dome — geometric tiles glowing, reflecting pool shimmering gold. Surrounded by arid terrain. Conquered feel.",
    },
    "Mayan": {
      level: "A small jungle temple ruin seen from above — a moss-covered stone platform with carved glyphs, partially hidden by jungle canopy. Green vines everywhere.",
      shop: "A small jungle marketplace seen from above — wooden platforms with woven awnings among the trees, offerings and trade goods visible, surrounded by dense canopy.",
      boss: "A stepped pyramid seen from above — massive Mayan pyramid rising above the jungle canopy, calendar sun disc carved into the top platform. Ancient and powerful.",
      completed: "A small jungle temple ruin seen from above with golden glyphs glowing on the stone — warm light radiating through the vines, conquered and reclaimed. Surrounded by canopy. Victorious feel.",
    },
    "Chokwe": {
      level: "A small ceremonial circle seen from above — red earth clearing with carved wooden poles arranged in a ring, surrounded by African forest.",
      shop: "A small village market seen from above — thatched-roof huts with woven raffia screens around a central fire pit, trade goods spread on cloths, surrounded by forest.",
      boss: "A grand ceremonial lodge seen from above — large carved wooden structure with mask facade, blazing fires around it, geometric patterns in the red earth. Powerful presence.",
      completed: "A small ceremonial circle seen from above with blazing golden fire at the center — carved poles glowing warm, red earth patterns illuminated. Surrounded by forest. Victorious feel.",
    },
    "Inca": {
      level: "A small stone terrace seen from above — interlocking polygonal stone walls forming a circular platform on a mountainside, surrounded by green highland terrain.",
      shop: "A small mountain trading post seen from above — stone buildings with textile-draped market stalls, llamas visible, surrounded by terraced mountain slopes.",
      boss: "A mountain citadel seen from above — massive interlocking stone walls and terraces of a Machu Picchu-style complex, golden Inti sun disc at the center. Cloud forest below.",
      completed: "A small stone terrace seen from above with a golden Inti sun disc glowing at the center — interlocking stones radiating warm light. Surrounded by highland terrain. Conquered feel.",
    },
  };

  const descriptions = nodeDescriptions[theme.name] ?? nodeDescriptions["Polynesian"];
  const description = descriptions[nodeType] ?? descriptions["level"];

  const sizeHint = nodeType === "boss" ? "occupying 85% of the frame" : "occupying 75% of the frame";

  return `${description} ${sizeHint}. Top-down bird's eye view, looking straight down. Highly saturated vibrant colors with strong contrast. Bold thick black outlines (3-4px equivalent). Bright vivid ${theme.palette.accent} and ${lightenHex(theme.palette.accent, 0.4)} accent highlights. Very dark background (${darkenHex(theme.palette.bg, 0.4)}) surrounding the landmark for maximum contrast. Flat vector game art style with cel shading. Square format, centered composition for circular crop display. No text, no UI.`;
}

/* ------------------------------------------------------------------ */
/*  Logo prompt                                                       */
/* ------------------------------------------------------------------ */

export function buildCommonLogoPrompt(): string {
  return `The word "zKube" in Tilt Prism font as a bold flat 2D game logo on a solid black background. Chunky geometric letterforms with faceted prismatic surface fills — each letter filled with flat geometric triangular planes like a low-poly mosaic, different grey tones per facet. Completely flat 2D design, no depth, no shadows, no 3D perspective. Neutral mid-grey tones only (#707070 to #A0A0A0), no color. Nothing else — just the text, centered, on black. 1024x1024 pixels.`;
}

/* ------------------------------------------------------------------ */
/*  Global asset prompts                                              */
/* ------------------------------------------------------------------ */

const GLOBAL_ART_STYLE = `Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.`;

export function buildButtonPrompt(desc: string, color: string, highlight: string, shadow: string): string {
  return `
${GLOBAL_ART_STYLE}

Generate a 9-slice button texture for a game UI.
Color: ${desc} (${color})
Style: A rounded rectangle button with:
- Outer border: 2px dark outline
- Fill: Gradient from ${highlight} (top) to ${color} (bottom)
- Inner highlight: Thin bright line at top edge
- Shadow: ${shadow} at bottom edge
- Subtle bevel to appear pressable
The image is 96x96px conceptually. The outer 16px on all sides are the fixed border (for 9-slice stretching). The inner 64x64px center stretches.
Square format. Slight transparency possible for soft edges. No text, no icons.
`.trim();
}

export function buildWhiteIconPrompt(description: string): string {
  return `
${GLOBAL_ART_STYLE}

Generate a simple game UI icon: ${description}.
Style: Clean, bold, white silhouette on dark background.
Stylized for a fantasy/tribal puzzle game. Thick strokes (3-4px equivalent).
Rounded corners. Single shape, centered. No text, no color (white only).
Square format. 48x48 pixel target (generating larger for quality).
`.trim();
}

export function buildBonusIconPrompt(description: string): string {
  return `${description}. Stylized 2D game icon, bold black outlines, flat cel-shading with 3 tonal steps. Dark background (#0A0A14). Centered composition filling inner 70% of frame for circular crop. Square format, instantly readable at 48px. No text.`;
}

export function buildConstraintIconPrompt(description: string): string {
  return `${description}. Stylized 2D game icon, bold black outlines, flat cel-shading with 3 tonal steps. Dark background (#0A0A14). Centered composition filling inner 70% of frame for circular crop. Square format, instantly readable at 48px. No text.`;
}

export function buildUiChromePrompt(description: string, width: number, height: number): string {
  return `
${GLOBAL_ART_STYLE}

Generate a game UI element: ${description}
Dimensions: ${width}x${height} pixels conceptually.
Style: Semi-transparent dark panel with subtle fantasy/tribal decorative edges.
The center area should be darker and flatter than the border so game content reads clearly above it.
Edges should have thin ornate borders matching a tribal/fantasy puzzle game aesthetic.
No text, no icons — just the background chrome element.
Dark background fill.
`.trim();
}

export function buildPanelPrompt(material: string, alpha: string): string {
  return `
${GLOBAL_ART_STYLE}

Generate a 9-slice panel texture for a game UI.
Material: ${material}
The image is 96x96px conceptually. The outer 24px on all sides are the fixed border. The inner 48x48px center will stretch.
Design the border with decorative edges. Center should be a subtle, stretchable fill matching the material.
Square format. PNG. The center area should have slight translucency (${alpha} alpha feel) over a dark background.
`.trim();
}

export function buildParticlePrompt(description: string): string {
  return `
${GLOBAL_ART_STYLE}

Generate a tiny particle texture for a game effect.
Shape: ${description}
Style: White silhouette on dark background. Soft edges with slight glow.
Very simple, minimal detail — this will be rendered at 16x16 pixels and tinted by code.
Square format. Centered.
`.trim();
}
