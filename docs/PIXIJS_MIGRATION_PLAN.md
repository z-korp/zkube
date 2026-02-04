# PixiJS Client Migration Plan

## Overview

Create a new `client-pixijs` that replaces the CSS/DOM rendering in `client-budokan` with PixiJS WebGL rendering for better performance, visual effects, and mobile optimization.

## Goals

1. **Better visuals**: Glow effects, particle systems, smooth animations
2. **Mobile-first**: Optimized for CapacitorJS deployment
3. **Maintain architecture**: Keep existing Dojo integration, state management, game logic
4. **Performance**: 60fps rendering even on mobile devices

## Technology Stack

- **Renderer**: PixiJS v8 + @pixi/react v8
- **Effects**: @pixi/filter-glow, @pixi/particle-emitter
- **State**: Same as budokan (RECS, Zustand, React Context)
- **Dojo**: Same integration layer
- **UI**: React + TailwindCSS for non-game UI (dialogs, headers)

---

## Phase 1: Project Setup & Core Migration

### Status: [ ] Not Started

### Tasks

- [ ] Create `client-pixijs/` directory structure
- [ ] Initialize package.json with dependencies
- [ ] Copy Vite, TypeScript, Tailwind configs
- [ ] Copy Dojo integration layer (`src/dojo/`)
- [ ] Copy shared hooks (`src/hooks/`)
- [ ] Copy stores (`src/stores/`)
- [ ] Copy contexts (`src/contexts/`)
- [ ] Copy types and enums
- [ ] Copy utility functions
- [ ] Copy public assets
- [ ] Verify base app runs

### Directory Structure

```
client-pixijs/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── constants.ts
│   ├── cartridgeConnector.tsx
│   │
│   ├── dojo/                 # COPY from budokan
│   ├── hooks/                # COPY + new PixiJS hooks
│   ├── stores/               # COPY from budokan
│   ├── contexts/             # COPY from budokan
│   ├── types/                # COPY + PixiJS types
│   ├── utils/                # COPY from budokan
│   ├── enums/                # COPY from budokan
│   │
│   ├── pixi/                 # NEW - PixiJS layer
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── filters/
│   │   └── utils/
│   │
│   └── ui/                   # React UI components
│       ├── screens/
│       ├── components/
│       └── elements/
│
├── public/
│   └── assets/
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── dojo.config.ts
```

---

## Phase 2: Core PixiJS Components

### Status: [ ] Not Started

### Tasks

- [ ] Create `GameStage.tsx` - Main PixiJS Application wrapper
- [ ] Create `GameGrid.tsx` - Grid container with interaction
- [ ] Create `BlockSprite.tsx` - Individual block rendering
- [ ] Create `GridBackground.tsx` - Grid lines and background
- [ ] Create `NextLinePreview.tsx` - Next line component
- [ ] Set up texture loading and caching

### Key Components

#### GameStage.tsx
Main PixiJS Application component that wraps the game.

```tsx
<Application width={gridWidth} height={gridHeight}>
  <GameGrid blocks={blocks} onMove={handleMove} />
  <ParticleSystem ref={particleRef} />
</Application>
```

#### BlockSprite.tsx
Individual block with:
- Texture based on block width (1-4)
- Glow filter on selection
- Drag interaction handling
- Fall animation support

#### GridBackground.tsx
- Grid lines via Graphics API
- Background gradient
- Danger zone indicator (top 2 rows)

---

## Phase 3: State Machine Integration

### Status: [ ] Not Started

### Tasks

- [ ] Extract state machine from Grid.tsx to `useGameStateMachine` hook
- [ ] Separate rendering concerns from game logic
- [ ] Create `useBlockInteraction` hook for drag handling
- [ ] Integrate transaction handling
- [ ] Test state machine with PixiJS rendering

### State Machine States (unchanged)

```
WAITING → DRAGGING → GRAVITY → LINE_CLEAR → ADD_LINE → GRAVITY2 → LINE_CLEAR2 → UPDATE_AFTER_MOVE → WAITING
                  ↘ GRAVITY_BONUS → LINE_CLEAR_BONUS → UPDATE_AFTER_BONUS ↗
```

### Hook Structure

```tsx
const useGameStateMachine = ({ game, account }) => {
  // State
  const [blocks, setBlocks] = useState(initialData);
  const [gameState, setGameState] = useState(GameState.WAITING);
  
  // Logic (from Grid.tsx)
  // - applyGravity
  // - clearCompleteLine
  // - sendMoveTX
  // - isBlocked
  
  return { blocks, gameState, handleMove, handleBonusApply, ... };
};
```

---

## Phase 4: Visual Enhancements

### Status: [ ] Not Started

### Tasks

- [ ] Add glow filter to blocks (hover/selection)
- [ ] Add drop shadow to blocks
- [ ] Create particle system for line clears
- [ ] Implement smooth gravity animations (easing)
- [ ] Add block pickup/drop animations
- [ ] Create combo message animations
- [ ] Add processing border animation

### Effect Specifications

| Effect | Library | Details |
|--------|---------|---------|
| Block glow | @pixi/filter-glow | color: 0x00ffff, strength: 2-4 |
| Block shadow | @pixi/filter-drop-shadow | alpha: 0.3, blur: 4 |
| Line clear | @pixi/particle-emitter | 100 particles, 0.5s lifetime |
| Gravity | gsap or manual tween | easeOutBounce, 200ms |
| Combo text | PixiJS Text | Scale + fade animation |

---

## Phase 5: Mobile Optimization

### Status: [ ] Not Started

### Tasks

- [ ] Implement responsive grid sizing based on viewport
- [ ] Optimize touch handling
- [ ] Test on various screen sizes
- [ ] Add safe area support for notches
- [ ] Prepare Capacitor configuration
- [ ] Test WebGL performance on mobile WebView

### Responsive Grid Calculation

```tsx
const calculateGridSize = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padding = 32;
  const headerHeight = 120;
  const footerHeight = 80;
  
  const availableWidth = vw - padding;
  const availableHeight = vh - headerHeight - footerHeight;
  
  const fromWidth = Math.floor(availableWidth / 8);
  const fromHeight = Math.floor(availableHeight / 10);
  
  return Math.min(fromWidth, fromHeight, 60); // Cap at 60px
};
```

---

## Files Reference

### Copy Unchanged from client-budokan

| Directory/File | Notes |
|----------------|-------|
| `src/dojo/` | Entire directory |
| `src/stores/` | Entire directory |
| `src/contexts/` | Entire directory |
| `src/types/types.ts` | Core types |
| `src/enums/` | All enums |
| `src/utils/gridUtils.ts` | Grid manipulation |
| `src/utils/gridPhysics.ts` | Physics calculations |
| `src/hooks/useGame.tsx` | Game state hook |
| `src/hooks/useCubeBalance.tsx` | Balance hook |
| `src/hooks/usePlayerMeta.tsx` | Player data |
| `src/hooks/useDeepMemo.tsx` | Utility hook |
| `src/ui/elements/` | shadcn components |
| `src/ui/components/Shop/` | Shop dialogs |
| `src/ui/components/Quest/` | Quest components |
| `src/ui/components/*Dialog.tsx` | All dialogs |
| `public/assets/` | All assets |

### Rewrite for PixiJS

| Original | New | Purpose |
|----------|-----|---------|
| `Grid.tsx` | `pixi/components/GameGrid.tsx` | PixiJS grid |
| `Block.tsx` | `pixi/components/BlockSprite.tsx` | PixiJS block |
| `GameBoard.tsx` | `ui/components/GameBoard.tsx` | Modified wrapper |
| `NextLine.tsx` | `pixi/components/NextLinePreview.tsx` | PixiJS preview |
| `grid.css` | (removed) | Handled by PixiJS |

### New Files

| File | Purpose |
|------|---------|
| `pixi/components/GameStage.tsx` | PixiJS Application wrapper |
| `pixi/components/GridBackground.tsx` | Grid visual background |
| `pixi/components/ParticleSystem.tsx` | Line clear effects |
| `pixi/hooks/useResponsiveGridSize.ts` | Responsive sizing |
| `pixi/hooks/useBlockTextures.ts` | Texture management |
| `pixi/hooks/useGameStateMachine.ts` | Extracted state machine |

---

## Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| Phase 1: Setup | Not Started | - | - |
| Phase 2: Core Components | Not Started | - | - |
| Phase 3: State Machine | Not Started | - | - |
| Phase 4: Visual Effects | Not Started | - | - |
| Phase 5: Mobile | Not Started | - | - |

---

## Notes

- Keep client-budokan functional during migration
- Test each phase before moving to next
- Mobile testing should happen throughout, not just at end
- Consider feature flags to switch between renderers during development
