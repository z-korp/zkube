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
/*  Logo prompt                                                       */
/* ------------------------------------------------------------------ */

export function buildCommonLogoPrompt(): string {
  return `The word "zKube" as a bold game logo on a solid black background. The letters have a faceted prismatic 3D style — each letter face is made of geometric crystal-like planes that catch light differently, creating a multi-tonal shimmering effect across the surface. Bold chunky letterforms with sharp geometric facets. Neutral mid-grey tones only (#707070 to #A0A0A0), no color. Subtle highlights where facet planes meet. Nothing else — just the text, centered, on black. 1024x1024 pixels.`;
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
  return `
${GLOBAL_ART_STYLE}

Generate a game bonus/power-up icon: ${description}
Style: Colorful, vibrant, detailed fantasy game icon. Rich colors with glowing highlights and subtle shadows.
The icon should be instantly recognizable at small sizes (64x64 display).
Centered composition, no text. Slight 3D depth with lighting from top-left.
Square format. 256x256 pixel target.
Dark background.
`.trim();
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
