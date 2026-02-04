# zKube Grid UI Revamp

## Overview

Complete redesign of the game grid and UI components for optimal mobile UX using PixiJS.

**Goal:** Move all game-related UI into PixiJS canvas for consistent styling, smooth animations, and maximized grid size.

## Target Layout

```
┌─────────────────────────────────────────┐
│  ☰  [115 🧊]    Quests  🏆  Shop        │  ← React Header (48px)
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  Lvl 9  ████████░░░░░░░░  26 moves  │ │  ← PixiJS: HUD (40px)
│ ├─────────────────────────────────────┤ │
│ │                                     │ │
│ │           8 x 10 GRID               │ │  ← PixiJS: Maximized Grid
│ │        (Dynamic sizing)             │ │
│ │                                     │ │
│ ├─────────────────────────────────────┤ │
│ │  [Next Line Preview - Integrated]   │ │  ← PixiJS: Next Line
│ ├─────────────────────────────────────┤ │
│ │  [🔨x0] [🌊x1] [🗿x0]    🔥4  ⭐3+  │ │  ← PixiJS: Action Bar (56px)
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Architecture

### What Stays in React:
- Global header (hamburger, cube balance, quests, shop)
- Dialogs (game over, victory, settings, shop)
- Toasts/notifications

### What Moves to PixiJS:
- Level/score display (HUD)
- Bonus buttons (Action Bar)
- Progress indicators
- Next line preview
- Moves counter
- Combo display
- Star rating
- All game effects

---

## Progress Tracking

### Phase 1: Layout Foundation
- [x] Create `useGameLayout` hook with dynamic sizing
- [x] Create `GameCanvas` component (replaces GameStage)
- [x] Implement responsive grid sizing based on viewport
- [x] Move NextLine into PixiJS
- [x] Create `GameBoardCanvas` wrapper component
- [ ] Update Play screen to use new layout
- [ ] Remove old LevelHeaderCompact and NextLine React components

### Phase 2: HUD Components  
- [x] Build PixiJS `HUDBar` container
- [x] Build `LevelBadge` component
- [x] Build `ProgressBar` component (animated)
- [x] Build `MovesCounter` pill
- [ ] Add constraint indicators

### Phase 3: Action Bar
- [x] Build PixiJS `ActionBar` container
- [x] Build `BonusButton` with states (available/selected/disabled)
- [x] Build `ComboDisplay` with fire animation
- [x] Build `StarRating` display

### Phase 4: Polish & Animations
- [ ] Block hover/drag animations
- [ ] Score change animations
- [ ] Combo celebration effects
- [ ] Level completion effects
- [ ] Performance optimization
- [ ] Mobile testing on real devices

---

## Component Specifications

### Dynamic Grid Sizing

```typescript
const calculateLayout = (viewportWidth: number, viewportHeight: number) => {
  const padding = 8;
  const headerHeight = 48;  // React header
  const hudHeight = 40;     // PixiJS HUD
  const nextLineHeight = cellSize; // 1 row
  const actionBarHeight = 56;
  
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - headerHeight - padding * 2;
  
  // Calculate max cell size that fits
  const maxCellFromWidth = Math.floor(availableWidth / 8);
  const reservedHeight = hudHeight + actionBarHeight + padding * 2;
  const gridAndNextHeight = availableHeight - reservedHeight;
  const maxCellFromHeight = Math.floor(gridAndNextHeight / 11); // 10 grid + 1 next
  
  const cellSize = Math.min(maxCellFromWidth, maxCellFromHeight, 60);
  
  return {
    cellSize,
    gridWidth: cellSize * 8,
    gridHeight: cellSize * 10,
    canvasWidth: cellSize * 8 + padding * 2,
    canvasHeight: hudHeight + cellSize * 11 + actionBarHeight + padding * 2,
  };
};
```

### Touch Target Sizes

| Component | Minimum Size | Recommended |
|-----------|-------------|-------------|
| Bonus buttons | 44x44px | 48x48px |
| Progress bar tap area | 40px height | Full width |
| Block drag area | Cell size | Cell size + 4px |

### Color Palette (Tiki Theme)

```typescript
const TIKI_UI_COLORS = {
  hudBackground: 0x1a2744,
  hudBackgroundAlpha: 0.9,
  progressBarBg: 0x0f172a,
  progressBarFill: 0x3b82f6,
  progressBarGlow: 0x60a5fa,
  textPrimary: 0xffffff,
  textSecondary: 0x94a3b8,
  badgeBackground: 0x334155,
  dangerColor: 0xef4444,
  successColor: 0x22c55e,
  comboFire: 0xf97316,
  starFilled: 0xfbbf24,
  starEmpty: 0x475569,
};
```

---

## File Structure

```
src/pixi/
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx      # Main canvas with layout
│   │   ├── GameGrid.tsx        # Grid container
│   │   ├── BlockSprite.tsx     # Block rendering
│   │   └── NextLinePreview.tsx # Next line (PixiJS)
│   │
│   ├── hud/
│   │   ├── HUDBar.tsx          # Top bar container
│   │   ├── LevelBadge.tsx      # Level indicator
│   │   ├── ProgressBar.tsx     # Score progress
│   │   └── MovesCounter.tsx    # Moves pill
│   │
│   ├── actionbar/
│   │   ├── ActionBar.tsx       # Bottom container
│   │   ├── BonusButton.tsx     # Bonus buttons
│   │   ├── ComboDisplay.tsx    # Combo indicator
│   │   └── StarRating.tsx      # Star display
│   │
│   └── effects/
│       └── (existing effects)
│
├── hooks/
│   ├── useGameLayout.ts        # Dynamic sizing
│   └── (existing hooks)
│
└── utils/
    ├── layout.ts               # Layout calculations
    └── (existing utils)
```

---

## Animation Specs

### Block Interactions
| Action | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| Hover | Scale 1.02, lift | 100ms | ease-out |
| Drag start | Scale 1.05 | 80ms | ease-out |
| Drag end | Snap to grid | 100ms | ease-in-out |
| Fall | Y position | 80ms/row | linear |
| Clear | Scale → 0, particles | 200ms | ease-in |

### UI Feedback
| Event | Animation |
|-------|-----------|
| Score increase | Bar fill + count up |
| Combo up | Fire pulse + scale |
| Star earned | Fill + sparkle |
| Bonus selected | Glow + pulse |

---

## Notes

- All PixiJS components should respect `prefers-reduced-motion`
- Mobile-first approach: design for 375px width, scale up
- Touch targets minimum 44x44px per Apple HIG
- Use BitmapText for frequently updating numbers (performance)
- Batch similar sprites for draw call optimization
