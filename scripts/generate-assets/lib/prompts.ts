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

export function buildLoadingBackgroundPrompt(theme: ThemeDefinition): string {
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

export function buildLogoPrompt(theme: ThemeDefinition): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

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
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate a small square icon representing the "${theme.name}" theme for a game settings menu.
Theme: ${theme.name} (${theme.icon})
Design: A single iconic symbol that instantly communicates the theme. For example: ${theme.motifs} — pick the most recognizable single element.
Style: Bold silhouette icon, white fill. Thick strokes (3-4px equivalent). Clean, readable at 48×48 pixels.
Centered in frame. Square format. No text.
Dark background matching the theme.
`.trim();
}

export function buildMapPrompt(theme: ThemeDefinition): string {
  return `
Art style: Super Mario Bros world map / overworld map illustration. Stylized 2D cartoon game art with bold outlines, rich saturated colors, flat cel-shaded surfaces with 2-3 tonal steps. Hand-painted digital illustration — NOT photographic, NOT pixel art, NOT 3D rendered.

Generate a Super Mario Bros-style world map for a mobile puzzle game zone.
Theme: ${theme.name} — ${theme.description}

LAYOUT: A winding dirt/stone path snakes from the BOTTOM of the image to the TOP in an S-curve pattern, zigzagging left-right-left-right. The path is wide, clearly visible, and lighter than the surrounding terrain.

Along the path are 11 small circular platform clearings where game level nodes will be overlaid by UI code:
1. Bottom-left (35%, 92%) — small round clearing
2. Right (65%, 84%) — small clearing
3. Left (35%, 76%) — small clearing
4. Right (60%, 68%) — small clearing
5. Left (30%, 60%) — small clearing
6. Right (60%, 52%) — small clearing
7. Left (35%, 44%) — small clearing
8. Right (60%, 36%) — small clearing
9. Left (30%, 28%) — small clearing
10. Right (60%, 18%) — medium clearing with a small themed market stall or treasure chest (SHOP node)
11. Center-top (50%, 7%) — LARGE imposing boss arena with dramatic ${theme.name}-themed architecture

SCENERY: The landscape around the path is rich with ${theme.name} themed environment — ${theme.scene}. Lush decorative elements flank the path: ${theme.motifs}. The terrain has depth and variety — hills, vegetation, water features, rocks, themed decorations scattered throughout.

STYLE REFERENCE: Think Super Mario World overworld map — a bird's-eye view of a themed landscape with a clear winding path connecting level platforms. Bright, colorful, inviting. Each platform is a small raised circular area where a player icon would stand.

The clearings/platforms should be SUBTLE — small flat circles on the path, NOT mushroom platforms or elaborate structures (except the boss arena at top which should be dramatic). The UI will overlay interactive buttons on these spots.

Portrait (9:16). Full-bleed — fills entire canvas edge to edge.
Mood: ${theme.mood}. Adventurous, inviting exploration.
Color: Rich atmospheric palette. Path lighter than surroundings. Accent: ${theme.palette.accent}.
No text, no numbers, no labels, no UI elements, no people, no characters.
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
