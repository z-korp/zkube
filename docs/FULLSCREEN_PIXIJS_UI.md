# Full-Screen PixiJS UI - Candy Crush Style

## Vision

Transform zKube into a fully integrated, Candy Crush-style game where the **entire screen is a single PixiJS canvas**. No React components visible during gameplay - everything rendered in WebGL for a seamless, polished experience.

## Current Problems

1. **Separated UI**: React header sits above PixiJS canvas - looks disjointed
2. **No Desktop Scaling**: Canvas doesn't scale on larger screens
3. **Mixed Technologies**: React + PixiJS creates visual inconsistency
4. **Wasted Space**: Header takes valuable screen real estate
5. **Not Mobile-First**: Doesn't maximize grid size on mobile

## Target Experience (Like Candy Crush)

```
┌─────────────────────────────────────────────────────────────┐
│                    FULL PIXIJS CANVAS                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [☰]  [🧊 115]              [Quests] [🏆] [Shop]    │   │ ← PixiJS TopBar
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│              ┌─────────────────────────┐                   │
│              │    LEVEL 9  ⭐⭐⭐       │                   │ ← Level Badge
│              └─────────────────────────┘                   │
│                                                             │
│    ┌───┐  ┌─────────────────────────────────┐  ┌───┐      │
│    │   │  │                                 │  │   │      │
│    │ S │  │                                 │  │ M │      │ ← Score & Moves
│    │ C │  │         8 x 10 GRID             │  │ O │      │   (Side panels)
│    │ O │  │      (Maximized for screen)     │  │ V │      │
│    │ R │  │                                 │  │ E │      │
│    │ E │  │                                 │  │ S │      │
│    │   │  │                                 │  │   │      │
│    └───┘  └─────────────────────────────────┘  └───┘      │
│                                                             │
│              ┌─────────────────────────┐                   │
│              │    [NEXT LINE PREVIEW]   │                   │
│              └─────────────────────────┘                   │
│                                                             │
│         ┌─────────────────────────────────┐                │
│         │  [🔨x2] [🌊x1] [🗿x0]   🔥3     │                │ ← Action Bar
│         └─────────────────────────────────┘                │
│                                                             │
│  ════════════════ THEMED BACKGROUND ══════════════════════ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

### Single PixiJS Application
- One `<Application>` fills the entire viewport
- All UI elements are PixiJS containers/sprites
- React only used for: Dialogs, Wallet connection, Routing

### Responsive Scaling
- Canvas always fills viewport (100vw x 100vh)
- Grid size calculated based on available space
- UI elements scale proportionally
- Desktop: Grid centered with decorative side panels
- Mobile: Grid maximized, minimal margins

### Component Hierarchy

```
PixiApplication (fullscreen)
├── BackgroundLayer
│   ├── ThemeBackground (sprite - totem/beach scene)
│   └── Vignette overlay
│
├── GameLayer
│   ├── TopBar
│   │   ├── MenuButton
│   │   ├── CubeBalance
│   │   ├── QuestsButton
│   │   ├── TrophyButton
│   │   └── ShopButton
│   │
│   ├── LevelDisplay (centered above grid)
│   │   ├── LevelNumber
│   │   ├── StarRating
│   │   └── ConstraintBadges
│   │
│   ├── SidePanel_Left (desktop only)
│   │   ├── ScoreDisplay
│   │   ├── ProgressBar (vertical)
│   │   └── TargetScore
│   │
│   ├── GridContainer (centered)
│   │   ├── GridBackground
│   │   ├── BlocksContainer
│   │   └── EffectsContainer
│   │
│   ├── SidePanel_Right (desktop only)
│   │   ├── MovesDisplay
│   │   ├── ComboMeter
│   │   └── MaxCombo
│   │
│   ├── NextLinePreview
│   │
│   └── ActionBar
│       ├── BonusButtons (3)
│       ├── ComboDisplay (mobile)
│       └── SurrenderButton
│
└── EffectsLayer (particles, popups)
```

## Implementation Plan

### Phase 1: Fullscreen Canvas Foundation
1. Create `FullscreenGame` component that fills viewport
2. Implement `useFullscreenLayout` hook for responsive calculations
3. Load theme background as sprite
4. Remove React header from Play screen
5. Basic scaling for mobile/desktop

### Phase 2: PixiJS TopBar
1. Create TopBar container with buttons
2. MenuButton (hamburger) - opens React dialog
3. CubeBalance display
4. Navigation buttons (Quests, Trophy, Shop) - trigger React dialogs
5. Style to match theme

### Phase 3: Integrated Game UI
1. Level display centered above grid
2. Score/Moves side panels (desktop) or compact bar (mobile)
3. Constraint badges with progress
4. Improved action bar with better bonus buttons

### Phase 4: Polish & Effects
1. Smooth transitions between states
2. Button hover/press animations
3. Score counting animations
4. Level complete celebration
5. Particle effects integration

### Phase 5: Desktop Experience
1. Decorative side panels with theme art
2. Proper centering and max-width
3. Keyboard shortcuts
4. Hover states for desktop

## File Structure

```
client-pixijs/src/pixi/
├── components/
│   ├── FullscreenGame.tsx      # Main fullscreen canvas
│   ├── background/
│   │   ├── ThemeBackground.tsx  # Themed background sprite
│   │   └── Vignette.tsx         # Edge darkening
│   ├── topbar/
│   │   ├── TopBar.tsx           # Container
│   │   ├── MenuButton.tsx       # Hamburger menu
│   │   ├── CubeBalance.tsx      # Currency display
│   │   └── NavButton.tsx        # Generic nav button
│   ├── game/
│   │   ├── GameContainer.tsx    # Wraps grid + UI
│   │   ├── LevelDisplay.tsx     # Level badge + stars
│   │   ├── ScorePanel.tsx       # Score with progress
│   │   ├── MovesPanel.tsx       # Moves countdown
│   │   └── ...existing
│   └── ...existing
├── hooks/
│   ├── useFullscreenLayout.ts   # Responsive layout calc
│   └── ...existing
```

## Layout Calculations

```typescript
interface FullscreenLayout {
  // Viewport
  screenWidth: number;
  screenHeight: number;
  
  // Top bar
  topBarHeight: number;  // ~50px mobile, ~60px desktop
  
  // Grid area
  gridAreaWidth: number;
  gridAreaHeight: number;
  gridX: number;         // Centered
  gridY: number;
  cellSize: number;
  
  // Side panels (desktop only)
  sidePanelWidth: number;
  showSidePanels: boolean;
  
  // Action bar
  actionBarHeight: number;
  actionBarY: number;
  
  // Scale factor for UI elements
  uiScale: number;
}
```

## Mobile Layout (< 768px)
- TopBar: 50px
- Grid: Maximized (fills width - 16px padding)
- Side panels: Hidden (info in TopBar/ActionBar)
- ActionBar: 60px

## Desktop Layout (>= 768px)
- TopBar: 60px
- Grid: Centered, max 480px width
- Side panels: 120px each side
- ActionBar: 70px
- Max canvas height: 900px (centered vertically if larger)

## Button Interactions

All buttons in PixiJS will emit events that React listens to:

```typescript
// PixiJS emits
window.dispatchEvent(new CustomEvent('zkube:openMenu'));
window.dispatchEvent(new CustomEvent('zkube:openQuests'));
window.dispatchEvent(new CustomEvent('zkube:openShop'));

// React listens
useEffect(() => {
  const handleOpenMenu = () => setMenuOpen(true);
  window.addEventListener('zkube:openMenu', handleOpenMenu);
  return () => window.removeEventListener('zkube:openMenu', handleOpenMenu);
}, []);
```

## Migration Strategy

1. Create new `FullscreenGame` component alongside existing
2. Add feature flag to toggle between old/new UI
3. Gradually move components to new structure
4. Test thoroughly on mobile + desktop
5. Remove old components once stable

## Success Criteria

- [x] Entire game screen is one PixiJS canvas
- [x] No visible React elements during gameplay
- [x] Smooth 60fps on mobile devices
- [x] Proper scaling on all screen sizes (320px to 4K)
- [x] Touch targets >= 44px
- [x] Theme background visible and beautiful
- [x] Dialogs still work (React overlays)
- [x] All game functionality preserved

## Implementation Status (Completed)

### Phase 1: Fullscreen Canvas Foundation ✅
- `FullscreenGame.tsx` - Main fullscreen component
- `useFullscreenLayout.ts` - Responsive layout calculations
- `ThemeBackground.tsx` - Full-screen themed background

### Phase 2: PixiJS TopBar ✅
- `TopBar.tsx` - Navigation container
- `MenuButton.tsx` - Hamburger menu
- `CubeBalance.tsx` - Currency display
- `NavButton.tsx` - Quests/Trophy/Shop buttons

### Phase 3: Integrated Game UI ✅
- `LevelDisplay.tsx` - Centered level badge + stars + constraints
- `ScorePanel.tsx` - Left side panel (desktop)
- `MovesPanel.tsx` - Right side panel (desktop)

### Phase 4: Polish & Effects ✅
- `useAnimatedValue.ts` - Animation hooks (score counter, pulse, glow)
- Animated score counting
- Bonus button pulse when available
- Star glow when earned
- Combo pulse and glow
- Danger pulse for low moves

### Phase 5: Desktop Experience ✅
- `useKeyboardShortcuts.ts` - Keyboard shortcuts (1/2/3 for bonuses, Esc for menu)
- `Tooltip.tsx` - Hover tooltips
- `SurrenderButton.tsx` - Surrender button in action bar
- Side panels with score/moves (desktop only)

## How to Test

1. Start the client: `cd client-pixijs && pnpm slot`
2. Navigate to: `/play-fullscreen/{gameId}`
3. Test features:
   - Press 1/2/3 to select bonuses
   - Press Esc to open menu (or cancel bonus selection)
   - Resize window to see responsive layout
   - Watch score animations when lines are cleared
   - Watch bonus buttons pulse when available
