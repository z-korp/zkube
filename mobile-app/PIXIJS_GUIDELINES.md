# PixiJS v8 Best Practices — zKube Mobile App

Guidelines for agents and developers working on the `mobile-app/` PixiJS codebase.
Derived from the PixiJS v8 source code (`references/pixijs/`) and our codebase audit.

---

## Architecture Overview

```
mobile-app/src/pixi/
├── components/          # PixiJS components (@pixi/react)
│   ├── pages/           # Full-screen pages (MainScreen, PlayScreen)
│   ├── landing/         # Landing screen
│   ├── game/            # Game-specific (GameGrid, BlockSprite)
│   ├── hud/             # HUD elements (ScorePanel, MovesPanel, LevelDisplay)
│   ├── actionbar/       # Bottom action bar (BonusButton, SurrenderButton)
│   ├── effects/         # Visual effects (ParticleSystem, ScorePopup, ScreenShake)
│   ├── modals/          # Modal dialogs (GameOver, Victory, LevelComplete)
│   ├── topbar/          # Top bar components
│   └── ui/              # Reusable UI (Button, Modal, Panel, ScrollContainer)
├── hooks/               # Custom hooks (useAnimatedValue, useFullscreenLayout)
├── themes/              # Theme system (ThemeContext)
├── ui/                  # Extended UI components (PixiButton, PixiPanel)
├── utils/               # Utilities (colors, fonts)
└── types.ts             # PixiJS type extensions
```

All rendering uses `@pixi/react` with JSX components (`pixiContainer`, `pixiSprite`, `pixiGraphics`, `pixiText`).

---

## Rule 1: Animation — Always `useTick`, Never `requestAnimationFrame`

All animations inside `<Application>` MUST use `useTick` from `@pixi/react`.

```tsx
// CORRECT
const tickCallback = useCallback((ticker: { deltaMS: number }) => {
  const dt = ticker.deltaMS / 16.667; // normalize to ~1.0 at 60fps
  ref.current.x += speed * dt;
}, [speed]);
useTick(tickCallback);

// CORRECT — conditional tick
useTick(tickCallback, isAnimating); // 2nd arg is isEnabled boolean

// WRONG — never use rAF in PixiJS components
useEffect(() => {
  const raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}, []);
```

**Key rules:**
- Always `useCallback` the tick function (unmemoized = re-registration every frame)
- Always normalize time with `ticker.deltaMS / 16.667` for frame-rate independence
- Use `useRef` for animation state inside tick callbacks, NOT `useState` (avoids re-renders)
- Use the `isEnabled` second argument to pause/resume instead of adding/removing the tick

---

## Rule 2: Avoid State-Driven Animation — Use Refs

Setting React state inside a tick callback triggers a re-render every frame. This is the #1 performance killer.

```tsx
// WRONG — triggers 60 re-renders/second
useTick(() => {
  setPosition({ x: x + 1, y: y + 1 }); // re-render!
});

// CORRECT — mutate ref, update PixiJS directly
const posRef = useRef({ x: 0, y: 0 });
useTick((ticker) => {
  posRef.current.x += 1 * (ticker.deltaMS / 16.667);
});
// Use posRef.current in pixiContainer x={posRef.current.x}
// Force re-render only when needed: frameCount % N === 0

// CORRECT — for clouds/particles, use imperative Graphics
const tickCallback = useCallback((ticker: { deltaMS: number }) => {
  const g = graphicsRef.current;
  if (!g) return;
  g.clear();
  for (const p of particlesRef.current) {
    p.x += p.vx * dt;
    g.circle(p.x, p.y, p.size);
    g.fill({ color: p.color });
  }
}, []);
```

**Acceptable exception:** `setTick(n => n + 1)` throttled to every N frames for declarative children that must re-render (e.g., cloud positions in a `.map()`). Throttle to every 2-3 frames minimum.

---

## Rule 3: TextStyle — Memoize Always, Never Recreate

`new TextStyle()` allocates objects and triggers change tracking. Never create inside render.

```tsx
// WRONG — new TextStyle every render
const MyComponent = () => {
  const style = new TextStyle({ fontSize: 24, fill: 'white' }); // BAD
  return <pixiText style={style} text="Hello" />;
};

// CORRECT — useMemo
const MyComponent = ({ color }: { color: number }) => {
  const style = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE, fontSize: 24, fill: color,
  }), [color]);
  return <pixiText style={style} text="Hello" />;
};

// CORRECT — module-level constant for static styles
const LABEL_STYLE = new TextStyle({
  fontFamily: FONT_BODY, fontSize: 14, fill: 0x94a3b8,
});
```

**Inline `style={{...}}` on `pixiText`** is also bad — creates a new object every render. Always memoize.

---

## Rule 4: Graphics `draw` Callbacks — Always `useCallback`

The `draw` prop on `pixiGraphics` is called on every render. If the function reference changes, it re-draws.

```tsx
// WRONG — new function reference every render
<pixiGraphics draw={(g) => { g.clear(); g.rect(0, 0, w, h); g.fill({ color: 0xff0000 }); }} />

// CORRECT — useCallback
const drawBg = useCallback((g: PixiGraphics) => {
  g.clear();
  g.rect(0, 0, w, h);
  g.fill({ color: 0xff0000 });
}, [w, h]);
<pixiGraphics draw={drawBg} />

// WRONG — creating closures in .map() (N new functions per render)
{items.map(item => (
  <pixiGraphics draw={(g) => drawItem(g, item)} /> // new fn each
))}

// CORRECT — single imperative Graphics for particle-like rendering
const drawAll = useCallback((g: PixiGraphics) => {
  g.clear();
  for (const item of itemsRef.current) {
    g.rect(item.x, item.y, item.w, item.h);
    g.fill({ color: item.color });
  }
}, []);
```

**When to use Sprites instead of Graphics:**
- Static shapes that don't change → Render to texture once, use Sprite
- Repeated identical shapes → Single texture, multiple Sprites
- Complex procedural shapes that rarely change → `cacheAsTexture(true)`

---

## Rule 5: Filters — Use Sparingly, Clean Up Always

Each filter causes a render-to-texture pass. On mobile, this is expensive.

```tsx
// WRONG — filter on every child (30 blocks × 1 filter = 30 GPU passes)
{blocks.map(b => <BlockSprite key={b.id} filters={[new DropShadowFilter()]} />)}

// CORRECT — single filter on parent container
<pixiContainer filters={[shadowFilter]}>
  {blocks.map(b => <BlockSprite key={b.id} />)}
</pixiContainer>

// CORRECT — memoize filter instances
const glowFilter = useMemo(() => new GlowFilter({
  distance: 15, outerStrength: 2, color: 0xfbbf24,
}), []);

// CRITICAL — destroy filters on unmount
useEffect(() => {
  return () => { glowFilter.destroy(); };
}, [glowFilter]);

// CORRECT — toggle filter with enabled flag (cheaper than array mutation)
glowFilter.enabled = isActive; // no instruction rebuild
```

**Rules:**
- Never create `new Filter()` inside render body
- Always `useMemo` filter instances
- Always destroy filters in cleanup effect
- Prefer a single filter on a parent over many filters on children
- Use `filter.enabled = false` to toggle (not `filters = []`)
- Set `filterArea` when the filter only applies to a known region
- Consider pre-baked textures for static effects (shadows, glows)

---

## Rule 6: Event Handling — Set `eventMode` Explicitly

Every PixiJS object participates in hit testing unless told otherwise. Non-interactive elements waste CPU.

```tsx
// WRONG — children inherit interactive mode, get hit-tested
<pixiContainer eventMode="static" onPointerDown={onClick}>
  <pixiGraphics draw={drawBg} />           {/* inherits, gets hit-tested */}
  <pixiText text="Click me" />             {/* inherits, gets hit-tested */}
</pixiContainer>

// CORRECT — only the container handles events
<pixiContainer eventMode="static" onPointerDown={onClick}>
  <pixiGraphics draw={drawBg} eventMode="none" />
  <pixiText text="Click me" eventMode="none" />
</pixiContainer>
```

**Event mode reference:**
| Mode | When to Use |
|------|------------|
| `'none'` | Decorative elements, backgrounds, labels, icons |
| `'passive'` | Containers where only children need events |
| `'auto'` | Default (events if parent is interactive) |
| `'static'` | Buttons, clickable items (stationary) |
| `'dynamic'` | Draggable items, moving interactive objects |

**Also set `interactiveChildren = false`** on containers that handle all their own events.

---

## Rule 7: Texture/Asset Loading — Centralize, Don't Scatter

Every `Assets.load()` call in a component instance multiplies by the number of instances.

```tsx
// WRONG — 30 BlockSprites each call Assets.load() independently
const BlockSprite = ({ blockId }) => {
  useEffect(() => { Assets.load(`block-${blockId}.png`).then(setTex); }, []);
};

// CORRECT — load all textures once in parent, pass down
const GameGrid = () => {
  const textures = useAssetLoader(['block-1.png', 'block-2.png', ...]);
  return blocks.map(b => <BlockSprite texture={textures[b.type]} />);
};

// CORRECT — background-load upcoming assets
Assets.backgroundLoad(['level-2-assets.json']); // preload while user plays level 1
```

**Best practices:**
- Load all textures for a screen in a single `Assets.loadBundle()` call
- Use `Assets.backgroundLoad()` for upcoming screens
- Check `Assets.cache.has(key)` before loading
- Use `Assets.get(key)` for instant cache retrieval
- Set `texturePreference: { format: ['webp', 'png'] }` for mobile optimization

---

## Rule 8: Container Hierarchy — Keep It Flat

Every `pixiContainer` adds transform calculation overhead. Flatten when possible.

```tsx
// WRONG — unnecessary nesting
<pixiContainer x={0} y={0}>
  <pixiContainer x={10} y={20}>
    <pixiText text="Hello" x={0} y={0} />
  </pixiContainer>
</pixiContainer>

// CORRECT — compute final position directly
<pixiText text="Hello" x={10} y={20} />
```

**When containers ARE needed:**
- Grouping elements that move/scale/rotate together
- Applying filters to a group
- Masking a group
- Z-ordering with `sortableChildren`

---

## Rule 9: Performance Flags on Containers

```tsx
// Culling — skip rendering off-screen objects
<pixiSprite cullable={true} />

// Fixed bounds — skip expensive recursive bounds calculation
<pixiContainer boundsArea={{ x: 0, y: 0, width: 200, height: 200 }} />

// Cache as texture — render complex static subtree once
container.cacheAsTexture(true);
container.updateCacheTexture(); // call when content changes

// Visible vs renderable
sprite.visible = false;     // skip render + transform updates (cheaper)
sprite.renderable = false;  // skip render, KEEP transform updates
```

---

## Rule 10: Text Rendering — Choose the Right System

| System | Use For | Performance |
|--------|---------|-------------|
| `Text` (Canvas) | Styled labels that rarely change | Medium — generates texture per unique text |
| `BitmapText` | Scores, timers, frequently updating text | Fast — shared atlas |
| `HTMLText` | Rich formatting (avoid if possible) | Slow — DOM + texture |

**For our game:**
- Scores, moves, combo counts → **BitmapText** (changes every frame)
- Button labels, modal titles → **Text** with memoized TextStyle
- Never use HTMLText in gameplay

---

## Rule 11: Destroy Patterns

Every PixiJS object holds GPU resources. Clean up on unmount.

```tsx
// Filter cleanup
useEffect(() => {
  const filter = new GlowFilter({ distance: 15 });
  setFilter(filter);
  return () => filter.destroy();
}, []);

// Texture cleanup (only if you OWN the texture)
useEffect(() => {
  return () => {
    if (ownedTexture) {
      ownedTexture.destroy(true); // true = also destroy source
    }
  };
}, [ownedTexture]);

// RenderTexture cleanup
useEffect(() => {
  const rt = RenderTexture.create({ width: 100, height: 100 });
  return () => rt.destroy(true);
}, []);
```

---

## Rule 12: Mobile-Specific

- Cap `devicePixelRatio` at 2: `Math.min(window.devicePixelRatio || 1, 2)`
- Use `roundPixels: true` on NineSliceSprite and ParticleContainer for crisp rendering
- Prefer WebGL over WebGPU (more stable on mobile browsers)
- Minimize filters — each is an extra GPU pass
- Use `ParticleContainer` for 50+ similar sprites (particles, confetti)
- Background-load upcoming screen assets while current screen is active
- Use `PrepareSystem` to pre-upload textures before gameplay:
  ```ts
  await app.renderer.prepare.upload(app.stage);
  ```

---

## Anti-Patterns Checklist

Before submitting code, verify NONE of these exist:

| Anti-Pattern | Fix |
|---|---|
| `requestAnimationFrame` in PixiJS components | Use `useTick` from `@pixi/react` |
| `new TextStyle(...)` in component body | Wrap in `useMemo` or module constant |
| `useState` setter inside `useTick` callback | Use `useRef` + imperative updates |
| Inline `draw={(g) => ...}` without `useCallback` | Extract to `useCallback` |
| Inline `style={{...}}` on `pixiText` | Wrap in `useMemo` |
| `new Filter()` without cleanup effect | Add `useEffect(() => () => filter.destroy())` |
| `Assets.load()` per component instance | Centralize in parent or asset loader |
| `window.__globalName` for effect systems | Use React Context or refs |
| `as any` / `@ts-ignore` / `@ts-expect-error` | Fix the types properly |
| Interactive children without `eventMode="none"` | Add to non-interactive children |
| Filter per child instead of per parent | Move filter to parent container |

---

## Font Constants

Always use centralized font constants from `src/pixi/utils/colors.ts`:

```ts
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';
```

- `FONT_TITLE` — headings, large text
- `FONT_BOLD` — emphasized text, values
- `FONT_BODY` — body text, labels

---

## File Organization Rules

- **No new files** unless they serve a clear architectural purpose
- Components go in the appropriate subdirectory (game/, hud/, effects/, etc.)
- Hooks go in `hooks/`
- Shared UI components go in `ui/` or `components/ui/`
- Theme-specific code goes in `themes/`
- Check existing components before creating new ones
