import type { ThemeDefinition } from "./types";

export function buildBlock1Prompt(theme: ThemeDefinition, color: string, blockIndex: number): string {
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

CRITICAL: The texture MUST fill EVERY PIXEL of the canvas. Hard square edges — NO rounded corners, NO border radius, NO margins, NO padding, NO background showing. The block content goes right to the pixel boundary on all 4 sides.
Opaque fill everywhere. No transparency. No text. No people. No logos.
`.trim();
}

export function buildBlockMultiPrompt(theme: ThemeDefinition, color: string, blockIndex: number, blockWidth: number): string {
  const focalDesign = theme.blockDesigns?.[blockIndex] ?? `A distinctive ${theme.name}-themed carved element`;

  return `
Generate a seamless game block texture for a puzzle game. The block spans ${blockWidth}×1 cells.
Theme: ${theme.name} — ${theme.description}

The design must read as one cohesive horizontal block with a strong central motif and decorative extensions to both sides.
The dominant color MUST remain ${color}. Keep muted, earthy tones — NOT neon.
Focal element: ${focalDesign} — centered, taking up ~60% of the space.
Surrounding decoration: ${theme.blockMotifs} — subtle carved relief flowing continuously edge-to-edge.

Style: Hand-painted game art. Flat cel-shaded with subtle bevel (lighter top-left, darker bottom-right).
Use thin black outlines (2-3px) to separate shapes.
CRITICAL: Fill every pixel of the canvas with opaque content. Hard rectangular edges — NO rounded corners, NO margins, NO transparency.
`.trim();
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

export function buildGridBackgroundPrompt(theme: ThemeDefinition): string {
  return `
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

Generate a subtle background surface texture for a game grid area.
Theme: ${theme.name}
Material: ${theme.gridMaterial}
Style: Muted, low-contrast surface — the blocks will sit ON TOP of this.
Color: Dark base with very subtle tonal variation. Must not compete with colorful blocks placed on top.
No grid lines (drawn in code). No patterns that would interfere with gameplay readability.
Portrait rectangle (4:5 ratio). Filled completely, no transparency.
`.trim();
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
Art style: Stylized 2D vector/cartoon game art. Bold black outlines as separators. Flat-fill cel-shading with 2-3 tonal steps per surface. Subtle distressed grunge texture overlay. Clean graphic readability. NOT photographic, NOT pixel art, NOT 3D rendered. Think tribal mask / cultural emblem aesthetic.

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
