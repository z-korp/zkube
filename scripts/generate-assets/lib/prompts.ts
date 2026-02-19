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

function buildSubstitutionMap(theme: ThemeDefinition, blockIndex: number, blockWidth: number): Record<string, string> {
  const bd = theme.blockData;
  const block = bd.blocks[blockIndex];
  const color = theme.palette.blocks[blockIndex];

  return {
    theme_name: theme.name,
    bg_color: theme.palette.bg,
    material: block.material ?? bd.material,
    centerpiece_type: bd.centerpiece_type,
    centerpiece_description: bd.centerpiece_description,
    centerpiece_expression: bd.centerpiece_expression,
    primary_color: color,
    secondary_color: darkenHex(color, 0.15),
    highlight_color: lightenHex(color, 0.15),
    shadow_color: darkenHex(color, 0.35),
    inspiration_1: bd.inspirations[0],
    theme_keyword_1: bd.themeKeywords[0],
    theme_keyword_2: bd.themeKeywords[1],
    theme_keyword_3: bd.themeKeywords[2],
    block_width: String(blockWidth),
  };
}

export function buildBlockPromptFromTemplate(theme: ThemeDefinition, blockIndex: number, blockWidth: number): string {
  const templateName = blockWidth === 1 ? "block-1" : "block-multi";
  const template = loadTemplate(templateName);
  const vars = buildSubstitutionMap(theme, blockIndex, blockWidth);
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? _match);
}

function buildCenterpieceSubstitutionMap(theme: ThemeDefinition): Record<string, string> {
  const bd = theme.blockData;
  return {
    theme_name: theme.name,
    centerpiece_type: bd.centerpiece_type,
    centerpiece_description: bd.centerpiece_description,
    centerpiece_expression: bd.centerpiece_expression,
    inspiration_1: bd.inspirations[0],
    theme_keyword_1: bd.themeKeywords[0],
    theme_keyword_2: bd.themeKeywords[1],
    theme_keyword_3: bd.themeKeywords[2],
  };
}

export function buildCenterpiecePromptFromTemplate(theme: ThemeDefinition): string {
  const template = loadTemplate("centerpiece");
  const vars = buildCenterpieceSubstitutionMap(theme);
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? _match);
}

function buildBlockBgSubstitutionMap(theme: ThemeDefinition, blockIndex: number, blockWidth: number): Record<string, string> {
  const bd = theme.blockData;
  const block = bd.blocks[blockIndex];
  const color = theme.palette.blocks[blockIndex];

  return {
    theme_name: theme.name,
    bg_color: theme.palette.bg,
    material: block.material ?? bd.material,
    primary_color: color,
    secondary_color: darkenHex(color, 0.15),
    highlight_color: lightenHex(color, 0.15),
    shadow_color: darkenHex(color, 0.35),
    inspiration_1: bd.inspirations[0],
    theme_keyword_1: bd.themeKeywords[0],
    theme_keyword_2: bd.themeKeywords[1],
    theme_keyword_3: bd.themeKeywords[2],
    block_width: String(blockWidth),
  };
}

export function buildBlockBgPromptFromTemplate(theme: ThemeDefinition, blockIndex: number, blockWidth: number): string {
  const templateName = blockWidth === 1 ? "block-bg-1" : "block-bg-multi";
  const template = loadTemplate(templateName);
  const vars = buildBlockBgSubstitutionMap(theme, blockIndex, blockWidth);
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? _match);
}

function buildBlockMasterSubstitutionMap(theme: ThemeDefinition): Record<string, string> {
  const bd = theme.blockData;
  return {
    theme_name: theme.name,
    theme_mood: theme.mood,
    material: bd.material,
    centerpiece_type: bd.centerpiece_type,
    centerpiece_description: bd.centerpiece_description,
    centerpiece_expression: bd.centerpiece_expression,
    motifs_short: theme.motifs.split(",").slice(0, 3).join(","),
    inspiration_1: bd.inspirations[0],
    inspiration_2: bd.inspirations[1] ?? bd.inspirations[0],
    theme_keyword_1: bd.themeKeywords[0],
    theme_keyword_2: bd.themeKeywords[1],
    theme_keyword_3: bd.themeKeywords[2],
  };
}

export function buildBlockMasterPromptFromTemplate(theme: ThemeDefinition): string {
  if (theme.blockData.blockPrompt) {
    return theme.blockData.blockPrompt;
  }
  const template = loadTemplate("block-master");
  const vars = buildBlockMasterSubstitutionMap(theme);
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? _match);
}

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

export function buildGridBgPromptFromTemplate(theme: ThemeDefinition): string {
  const template = loadTemplate("grid-bg");
  const vars = buildGridBgSubstitutionMap(theme);
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? _match);
}

/** @deprecated Use buildBlockPromptFromTemplate instead */
export function buildBlock1Prompt(theme: ThemeDefinition, color: string, blockIndex: number): string {
  if (theme.blockData) {
    return buildBlockPromptFromTemplate(theme, blockIndex, 1);
  }
  const focalDesign = theme.blockDesigns?.[blockIndex] ?? `A distinctive ${theme.name}-themed carved element`;
  return `${focalDesign}, centered as a bold focal element occupying 60% of a square game block. ${theme.blockMotifs} fill the remaining surface as decorative border relief. Theme: ${theme.name}. Dominant color ${color} covering 70% of the surface. Hand-painted cel-shaded game art.`.trim();
}

/** @deprecated Use buildBlockPromptFromTemplate instead */
export function buildBlockMultiPrompt(theme: ThemeDefinition, color: string, blockIndex: number, blockWidth: number): string {
  if (theme.blockData) {
    return buildBlockPromptFromTemplate(theme, blockIndex, blockWidth);
  }
  const focalDesign = theme.blockDesigns?.[blockIndex] ?? `A distinctive ${theme.name}-themed carved element`;
  return `${focalDesign}, centered as the dominant element of a horizontal game block spanning ${blockWidth} cells. Theme: ${theme.name}. Dominant color ${color}. Hand-painted cel-shaded game art.`.trim();
}

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

export function buildLogoPrompt(theme: ThemeDefinition): string {
  return `
{
  "style_name": "${theme.name} zKube Logo",
  "scene": "A dominant zKube wordmark with subtle ${theme.name} motifs surrounding it",
  "style": "flat vector illustration with bold linework, smooth gradients, and high-contrast cel shading",
  "color_palette": {
    "primary": "${theme.palette.accent}",
    "highlight": "${lightenHex(theme.palette.accent, 0.3)}",
    "shadow": "${darkenHex(theme.palette.accent, 0.35)}",
    "background": "${darkenHex(theme.palette.bg, 0.25)}"
  },
  "details": "Text 'zKube' fills at least 70% width, thick dark outline, bright inner highlights, minimal thematic motifs (${theme.motifs})",
  "usage_notes": "Square format. No extra text. Keep decorative elements secondary to readability."
}
`.trim();
}

/** @deprecated Use buildGridBgPromptFromTemplate instead */
export function buildGridBackgroundPrompt(theme: ThemeDefinition): string {
  return buildGridBgPromptFromTemplate(theme);
}

export function buildGridFramePrompt(theme: ThemeDefinition): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate an ornamental frame/border for a game grid area.
Theme: ${theme.name}
Material: Matches the theme's decorative style — ${theme.motifs}.
Style: An ornate rectangular frame border with themed decorative elements.
Border width: approximately 10% of the image on each side.
Border decoration: Cultural motifs and patterns from the theme carved into the frame material.
Frame color: Theme accent (${theme.palette.accent}) with darker shadow tones and bright highlights.
Portrait rectangle (4:5 ratio). The frame art fills the entire canvas edge-to-edge.
Interior is a dark flat fill matching the grid material.
`.trim();
}

export function buildThemeIconPrompt(theme: ThemeDefinition): string {
  return `
{
  "style_name": "${theme.name} Theme Icon",
  "scene": "Single emblematic ${theme.name} symbol",
  "style": "flat vector icon with bold linework and clean silhouette readability",
  "color_palette": {
    "symbol": "#FFFFFF",
    "background": "${darkenHex(theme.palette.bg, 0.2)}",
    "accent": "${theme.palette.accent}"
  },
  "details": "Use one recognizable symbol from ${theme.motifs}; thick strokes, centered composition, readable at 48x48",
  "usage_notes": "Square icon, no text, no logos, no clutter."
}
`.trim();
}

export function buildMapPrompt(theme: ThemeDefinition): string {
  return `
{
  "style_name": "${theme.name} World Map Landscape",
  "inspiration": [
    "${theme.blockData.inspirations[0]}",
    "${theme.blockData.inspirations[1]}",
    "Super Mario World overworld map",
    "Hand-painted fantasy game world illustration"
  ],
  "scene": "A lush ${theme.name}-themed landscape viewed from above at a slight angle. ${theme.scene}. Terrain varies with hills, valleys, and natural formations. Decorative elements scattered throughout: ${theme.motifs}.",
  "style": "Stylized 2D cartoon game art with bold outlines, rich saturated colors, flat cel-shaded surfaces with 2-3 tonal steps. Hand-painted digital illustration. NOT photographic, NOT pixel art, NOT 3D rendered.",
  "color_palette": {
    "primary": "${theme.palette.bg}",
    "secondary": "${theme.palette.accent}",
    "highlight": "${lightenHex(theme.palette.accent, 0.25)}",
    "shadow": "${darkenHex(theme.palette.bg, 0.35)}",
    "background_gradient": ["${darkenHex(theme.palette.bg, 0.25)}", "${theme.palette.bg}"]
  },
  "composition": "Portrait 9:16. Bird's-eye view of an atmospheric landscape. Full-bleed — scenery fills entire canvas edge to edge. The terrain should feel expansive and explorable with varied elevation and depth. Keep the center and middle-ground areas relatively open so game UI elements can overlay cleanly.",
  "mood": "${theme.mood}, adventurous, inviting exploration",
  "details": "Rich environmental storytelling through terrain features and themed decorations. Subtle depth cues with foreground and background layers. Organic variation across the canvas — no repeating tiles or obvious patterns.",
  "camera": {
    "angle": "top-down with slight tilt (3/4 view)",
    "distance": "wide establishing shot",
    "focus": "sharp across entire frame"
  },
  "usage_notes": "Portrait 9:16 opaque image. This is a DECORATIVE BACKGROUND ONLY — game paths and nodes are rendered as SVG overlays on top. Do NOT include any paths, roads, trails, platforms, clearings, markers, circles, or any elements suggesting a game route. Pure scenic landscape art. No text, no numbers, no labels, no UI, no characters."
}
`.trim();
}

export function buildButtonPrompt(desc: string, color: string, highlight: string, shadow: string): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

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
`.trim();
}

export function buildWhiteIconPrompt(description: string): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate a simple game UI icon: ${description}.
Style: Clean, bold, white silhouette on dark background.
Stylized for a fantasy/tribal puzzle game. Thick strokes (3-4px equivalent).
Rounded corners. Single shape, centered. No text, no color (white only).
Square format. 48×48 pixel target (generating larger for quality).
`.trim();
}

export function buildBonusIconPrompt(description: string): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate a game bonus/power-up icon: ${description}
Style: Colorful, vibrant, detailed fantasy game icon. Rich colors with glowing highlights and subtle shadows.
The icon should be instantly recognizable at small sizes (64×64 display).
Centered composition, no text. Slight 3D depth with lighting from top-left.
Square format. 256×256 pixel target.
Dark background.
`.trim();
}

export function buildUiChromePrompt(description: string, width: number, height: number): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate a game UI element: ${description}
Dimensions: ${width}×${height} pixels conceptually.
Style: Semi-transparent dark panel with subtle fantasy/tribal decorative edges.
The center area should be darker and flatter than the border so game content reads clearly above it.
Edges should have thin ornate borders matching a tribal/fantasy puzzle game aesthetic.
No text, no icons — just the background chrome element.
Dark background fill.
`.trim();
}

export function buildPanelPrompt(material: string, alpha: string): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate a 9-slice panel texture for a game UI.
Material: ${material}
The image is 96×96px conceptually. The outer 24px on all sides are the fixed border. The inner 48×48px center will stretch.
Design the border with decorative edges. Center should be a subtle, stretchable fill matching the material.
Square format. PNG. The center area should have slight translucency (${alpha} alpha feel) over a dark background.
`.trim();
}

export function buildParticlePrompt(description: string): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate a tiny particle texture for a game effect.
Shape: ${description}
Style: White silhouette on dark background. Soft edges with slight glow.
Very simple, minimal detail — this will be rendered at 16×16 pixels and tinted by code.
Square format. Centered.
`.trim();
}
