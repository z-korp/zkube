# PixiJS Grid Visual Enhancement Plan

## Overview

Transform the zKube game grid into a visually stunning, theme-switchable experience using PixiJS. Support two themes:
1. **Tiki Theme** (existing) - Tribal artwork with PNG textures
2. **Neon Theme** (new) - Procedurally generated geometric blocks with glow effects

## Architecture

```
client-pixijs/src/pixi/
├── components/
│   ├── GameStage.tsx          # Main PixiJS application wrapper
│   ├── GameGrid.tsx           # Grid container with drag logic
│   ├── GridBackground.tsx     # Background rendering
│   ├── BlockSprite.tsx        # Block rendering (theme-aware)
│   ├── ParticleSystem.tsx     # Line clear particles
│   └── effects/
│       ├── GlowEffect.tsx     # Glow filter wrapper
│       ├── ShakeEffect.tsx    # Screen shake
│       └── ScorePopup.tsx     # Floating score text
├── themes/
│   ├── ThemeContext.tsx       # PixiJS theme context
│   ├── tiki/
│   │   └── TikiBlockRenderer.tsx
│   └── neon/
│       └── NeonBlockRenderer.tsx
├── hooks/
│   ├── useGameStateMachine.ts # Game state logic
│   ├── useBlockAnimations.ts  # Block animation states
│   └── useParticles.ts        # Particle emitter hook
├── utils/
│   ├── colors.ts              # Theme color palettes
│   └── easing.ts              # Animation easing functions
├── extend.ts                  # PixiJS component registration
└── types.ts                   # TypeScript definitions
```

---

## Phase 1: Block Polish

### 1.1 Theme-Aware Block Renderer

Create a block renderer that switches between PNG (tiki) and procedural (neon) based on theme.

**Tiki Theme:**
- Load existing PNG textures (`block-1.png` to `block-4.png`)
- Add subtle drop shadow filter
- Add brightness filter on hover/selection

**Neon Theme (Procedural):**
- Draw rounded rectangles with Graphics API
- Apply GlowFilter for neon effect
- Dynamic color based on block width
- Animated pulse on selection

### 1.2 Block States

| State | Tiki Effect | Neon Effect |
|-------|-------------|-------------|
| **Idle** | Normal texture | Soft glow |
| **Hover** | +10% brightness | Glow intensity +50% |
| **Dragging** | Scale 1.05, shadow | Scale 1.05, trail effect |
| **Selected** | Pulsing outline | Pulsing glow |
| **Falling** | Motion blur (subtle) | Streak trail |

### 1.3 Color Palettes

**Tiki Theme Colors:**
```typescript
const TIKI_COLORS = {
  background: 0x10172A,
  gridLines: 0x1E293B,
  dangerZone: 0xEF4444,
  accent: 0x3B82F6,
};
```

**Neon Theme Colors:**
```typescript
const NEON_COLORS = {
  background: 0x0A0A0F,
  gridLines: 0x1A1A2E,
  dangerZone: 0xFF0040,
  accent: 0x00FFFF,
  blocks: {
    1: { fill: 0x00FF88, glow: 0x00FF88 }, // Green
    2: { fill: 0x00CCFF, glow: 0x00CCFF }, // Cyan
    3: { fill: 0xFF00FF, glow: 0xFF00FF }, // Magenta
    4: { fill: 0xFFFF00, glow: 0xFFFF00 }, // Yellow
  },
};
```

---

## Phase 2: Drag Feedback

### 2.1 Drag Lift Effect
- Block scales up to 1.05x when grabbed
- Add drop shadow (tiki) or glow intensify (neon)
- Slight rotation based on drag velocity

### 2.2 Ghost Trail (Neon only)
- Render fading copies of block at previous positions
- 3-5 ghost copies with decreasing alpha
- Creates "motion blur" effect

### 2.3 Snap Preview
- Show faint outline where block will snap to
- Helps user understand grid alignment
- Fade in/out based on proximity to snap point

### 2.4 Row Highlight
- Highlight the row being affected during drag
- Subtle glow on other blocks in same row

---

## Phase 3: Line Clear Effects

### 3.1 PixiJS Particle System

Replace tsparticles with native PixiJS particles for better integration.

**Particle Types:**
| Type | Use Case | Properties |
|------|----------|------------|
| **Spark** | Line clear | Fast, gravity, fade |
| **Glow** | Block explosion | Slow, float up, scale down |
| **Confetti** | Combo celebration | Wobble, gravity, rotate |

### 3.2 Block Shatter Animation

When a line clears:
1. Blocks flash white (50ms)
2. Blocks "shatter" into 4-6 pieces
3. Pieces fly outward with physics
4. Particles emit from center
5. Row collapses with gravity

### 3.3 Score Popup

- "+X" text floats up from cleared line
- Uses PixiJS Text with stroke
- Eases out with scale and fade
- Combo multiplier shows larger

### 3.4 Screen Shake

- Subtle shake on line clear (2-3px)
- Stronger shake on combo (5-8px)
- Configurable intensity
- Respects reduced motion preference

### 3.5 Combo Feedback

| Combo | Effect |
|-------|--------|
| 2 lines | Small particle burst |
| 3 lines | Medium burst + "NICE!" text |
| 4 lines | Large burst + "AMAZING!" + shake |
| 5+ lines | Full screen flash + "INCREDIBLE!" |

---

## Phase 4: Background & Atmosphere

### 4.1 Gradient Background

- Radial gradient from center
- Tiki: Deep blue to dark navy
- Neon: Dark purple to black with subtle scan lines

### 4.2 Grid Lines

**Tiki:**
- Static subtle lines
- Slight glow on danger zone rows

**Neon:**
- Animated "pulse" traveling along lines
- Grid intersections have small glow dots
- Lines brighten momentarily on line clear

### 4.3 Danger Zone

- Top 2 rows pulse red when blocks are near
- Intensity increases as blocks get higher
- Tiki: Red overlay with fade
- Neon: Red grid lines + warning particles

### 4.4 Ambient Particles (Neon only)

- Slow-moving particles in background
- Very subtle, adds depth
- Parallax effect on drag (optional)

---

## Phase 5: Neon Theme Implementation

### 5.1 Procedural Block Generation

```typescript
function drawNeonBlock(g: Graphics, width: number, height: number, color: number) {
  const radius = 8;
  
  // Inner fill
  g.setFillStyle({ color, alpha: 0.9 });
  g.roundRect(2, 2, width - 4, height - 4, radius);
  g.fill();
  
  // Border
  g.setStrokeStyle({ width: 2, color: 0xFFFFFF, alpha: 0.3 });
  g.roundRect(2, 2, width - 4, height - 4, radius);
  g.stroke();
  
  // Inner highlight
  g.setStrokeStyle({ width: 1, color: 0xFFFFFF, alpha: 0.5 });
  g.roundRect(4, 4, width - 8, height / 3, radius - 2);
  g.stroke();
}
```

### 5.2 Glow Filter Settings

```typescript
const glowFilter = new GlowFilter({
  distance: 15,
  outerStrength: 2,
  innerStrength: 1,
  color: blockColor,
  quality: 0.3, // Lower for mobile performance
});
```

### 5.3 Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Hover glow | 150ms | ease-out |
| Drag lift | 100ms | ease-out |
| Drop snap | 80ms | ease-in |
| Line clear | 300ms | ease-in-out |
| Score popup | 800ms | ease-out |
| Gravity fall | 100ms/row | linear |

---

## Assets Required from Designer

### For Tiki Theme (existing, may need updates)

| Asset | Status | Notes |
|-------|--------|-------|
| `block-1.png` to `block-4.png` | ✅ Exists | Keep as-is |
| `particle-dust.png` | ❌ Need | 16x16 soft circle for dust |

### For Neon Theme (procedural - minimal assets)

| Asset | Size | Description |
|-------|------|-------------|
| `particle-spark.png` | 16x16 | Sharp white spark |
| `particle-glow.png` | 32x32 | Soft circular glow |

### Optional Enhancement Assets

| Asset | Size | Description |
|-------|------|-------------|
| `scanline-overlay.png` | 8x8 tileable | CRT scanline effect |
| `noise-texture.png` | 128x128 tileable | Subtle noise for depth |

---

## Performance Considerations (Mobile)

### Optimizations

1. **Particle limits**: Max 100 particles on screen
2. **Filter quality**: Reduce glow quality on mobile
3. **Batch rendering**: Group similar sprites
4. **Object pooling**: Reuse particle objects
5. **Reduced motion**: Respect `prefers-reduced-motion`

### Target Performance

| Device | Target FPS | Max Particles |
|--------|------------|---------------|
| Desktop | 60 | 200 |
| Mobile | 30-60 | 100 |
| Low-end | 30 | 50 |

### Detection

```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

---

## Implementation Order

### Week 1: Foundation
- [ ] Create theme context for PixiJS
- [ ] Implement NeonBlockRenderer with procedural drawing
- [ ] Add GlowFilter integration
- [ ] Implement block states (idle, hover, drag, selected)
- [ ] Add drop shadow for tiki theme

### Week 2: Interactions
- [ ] Drag lift effect
- [ ] Ghost trail (neon)
- [ ] Snap preview
- [ ] Row highlight during drag
- [ ] Gravity animation improvements

### Week 3: Effects
- [ ] PixiJS particle system
- [ ] Line clear explosion
- [ ] Score popups
- [ ] Screen shake
- [ ] Combo feedback

### Week 4: Polish
- [ ] Background gradients
- [ ] Grid line animations (neon)
- [ ] Danger zone effects
- [ ] Ambient particles
- [ ] Performance optimization
- [ ] Mobile testing

---

## Theme Switching

The theme can be switched via the existing `ThemeProvider`:

```typescript
// In settings or shop
const { themeTemplate, setThemeTemplate } = useTheme();

// Switch theme
setThemeTemplate('theme-neon'); // or 'theme-1' for tiki
```

The PixiJS components will read the theme from context and render accordingly.

---

## Testing Checklist

- [ ] Theme switching works without reload
- [ ] All block sizes render correctly
- [ ] Drag and drop feels responsive
- [ ] Line clear effects trigger properly
- [ ] Particles don't cause memory leaks
- [ ] Performance is smooth on mobile
- [ ] Reduced motion preference is respected
- [ ] No visual glitches on theme switch

---

## Next Steps

1. Review and approve this plan
2. Designer creates particle assets (2 small PNGs)
3. Begin Phase 1 implementation
4. Iterate based on feedback
