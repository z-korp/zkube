# zKube — UI/UX Specification v3

Complete ground-up redesign. Build-ready blueprint. Every dimension, animation curve, and component hierarchy specified for direct PixiJS 8 implementation.

**Engine**: PixiJS 8 + @pixi/react. All rendering via `<pixiContainer>`, `<pixiSprite>`, `<pixiGraphics>`, `<pixiText>`.
**Target**: 375px portrait (iPhone SE baseline). Responsive via `uiScale = clamp(screenWidth / 375, 0.8, 1.5)`.
**Tone**: Cozy & rewarding — warm, celebratory, dopamine-driven. Every interaction is a small gift.
**Themes**: 10 cultural themes — Tiki, Cosmic, Easter Island, Maya, Cyberpunk, Medieval, Egypt, Volcano, Tribal, Arctic.

---

## Table of Contents

1. [UX Strategy](#1-ux-strategy)
2. [Information Architecture](#2-information-architecture)
3. [Design System](#3-design-system)
4. [Screen Specifications](#4-screen-specifications)
5. [User Stories](#5-user-stories)
6. [Modal Specifications](#6-modal-specifications)
7. [Animation & Effects System](#7-animation--effects-system)
8. [Responsive Behavior](#8-responsive-behavior)
9. [Asset Generation System](#9-asset-generation-system)
10. [Contract → UI Mapping](#10-contract--ui-mapping)
11. [Implementation Constraints](#11-implementation-constraints)

---

## 1. UX Strategy

### 1.1 Target Audience

| Segment | Profile | Expectations | Patience | Tech Comfort |
|---------|---------|-------------|----------|-------------|
| **Primary** | Casual mobile gamer, 25-40, plays puzzle games on commute | Instant gratification, clear goals, satisfying animations | Low — will bounce after 10s of confusion | High with phones, zero blockchain knowledge |
| **Secondary** | Crypto-native gamer, 20-35, values on-chain ownership | Transparent economy, provable fairness, wallet integration | Medium — tolerates loading if value is clear | Comfortable with wallets, expects web3 UX |
| **Tertiary** | Competitive player, 18-30, chases leaderboards | Rankings, daily challenges, optimal strategy depth | High — will learn complex systems for advantage | Power user, reads patch notes |

**Design for Primary, accommodate Secondary, reward Tertiary.**

### 1.2 Core Usability Principles

| # | Principle | Rule | Implementation |
|---|-----------|------|---------------|
| 1 | **Thumb Zone** | All primary actions within one-thumb reach (bottom 60% of screen) | Grid and bonuses in lower viewport. Navigation at top via dedicated bar. No floating action buttons requiring stretch. |
| 2 | **Blockchain Invisible** | Zero crypto jargon in UI. No hex addresses, no tx hashes, no gas. | "Sign In" not "Connect Wallet". "Cubes" not "ERC1155 tokens". "Play" not "Submit transaction". Loading spinners during tx, never tx hashes. |
| 3 | **Celebrate Everything** | Every positive action gets visual + audio feedback scaled to its significance. | Line clear → particles. Combo → screen text + shake. Level up → star cascade. Boss defeat → cinematic shatter. Victory → confetti rain. |
| 4 | **Two-Tap Maximum** | Any screen reachable from Home in ≤ 2 taps. | Hub → any screen = 1 tap. Hub → Play → in-game modal = 2 taps. No nested navigation deeper than 2 levels. |
| 5 | **Progressive Disclosure** | Show only what's needed now. Reveal complexity as players earn it. | New players see Play + basic bonuses. Shop details appear after first cube earnings. Wave/Supply shown as locked mysteries. |
| 6 | **Consistent Feedback** | Same action → same visual response, everywhere, always. | All buttons: press = 0.93x scale + darken. All purchases: coin fly animation. All errors: red shake + toast. |
| 7 | **Grid Sanctuary** | During gameplay, the grid is sacred space. Minimal chrome, maximum focus. | Grid occupies 65% of viewport height. HUD is a single compact bar. Bonuses are a bottom tray. Nothing overlaps the grid. |
| 8 | **Warm Persistence** | Player progress is always visible and celebrated. Never hide what they've earned. | Cube balance in header everywhere. Stars on map nodes. Best level on profile. Quest progress badges on hub. |
| 9 | **Graceful Degradation** | Network failures, slow txs, and errors never produce dead ends. | Optimistic UI updates. Retry with exponential backoff. "Something went wrong, tap to retry" — never a blank screen. |
| 10 | **Sensory Cohesion** | Visual, audio, and haptic feedback are a single unified language. | Line clear = white flash + "break" SFX + light haptic. Boss defeat = shatter visual + "boss-defeat" SFX + heavy haptic. |

### 1.3 Emotional Tone: "Warm Cascade"

The emotional framework. Every moment in zKube should feel like a cascade of small, warm rewards.

#### Emotional Arc of a Play Session

```
Anticipation → Focus → Satisfaction → Surprise → Accomplishment
    |              |          |            |            |
  Loadout       Puzzle     Line Clear    Combo      Level Up
  Selection     Solving    Animation     Burst      Stars + Cubes
```

#### Celebration Tiers

| Tier | Trigger | Visual | Audio | Haptic | Duration |
|------|---------|--------|-------|--------|----------|
| **Micro** | Block snap to position | Subtle position lock glow | Soft "click" | None | 0.1s |
| **Small** | Single line clear | Row flash → sweep → 20 particles | "break" SFX | Light tap | 0.5s |
| **Medium** | 2-3 line combo | Combo text overlay + 50 particles + score popup | "explode" SFX (low pitch) | Medium tap | 0.8s |
| **Large** | 4+ line combo | Full-screen combo text + 120 particles + screen shake | "explode" SFX (high pitch) | Strong tap | 1.2s |
| **Epic** | Boss defeat | Portrait shatter + 200 gold particles + "+N CUBE" rain | "boss-defeat" SFX + fanfare | Heavy impact | 2.0s |
| **Legendary** | Run complete (L50) | Confetti explosion + counter tick-up + victory fanfare | "victory" SFX (3s) | Triple pulse | 3.0s |

#### Color-Emotion Mapping

| Emotion | Color | Usage |
|---------|-------|-------|
| Joy / Reward | Gold `#FFD700` | Cube earnings, star fills, quest claims |
| Success / Complete | Emerald `#22C55E` | Constraint done, level clear, purchase success |
| Danger / Urgency | Crimson `#EF4444` | Low moves (≤3), boss overlay, surrender |
| Focus / Active | Sky Blue `#3B82F6` | Current level node, selected bonus, active UI |
| Locked / Unavailable | Slate `#64748B` at 50% | Locked levels, unavailable bonuses, disabled buttons |
| Premium / Rare | Purple `#8B5CF6` | Epic rewards, special achievements, Wave/Supply bonuses |

### 1.4 Interaction Philosophy

#### Gesture Vocabulary

| Gesture | Context | Action | Feedback |
|---------|---------|--------|----------|
| **Tap** | Buttons, nodes, icons | Primary activation | Scale 0.93x → 1.0x + SFX |
| **Horizontal Drag** | Grid blocks | Move block left/right | Block follows finger, ghost trail |
| **Horizontal Swipe** | Map zones | Navigate between zones | Smooth inertia slide + snap |
| **Tap + Hold** (300ms) | Bonus icon, shop item | Show tooltip/detail | Tooltip fade-in above finger |
| **Vertical Scroll** | Shop, Quests, Achievements | Scroll content | Native momentum + elastic bounce |
| **Swipe Down** | Targeting mode | Cancel bonus targeting | Overlay dismisses |

#### Response Time Budgets

| Category | Target | Example |
|----------|--------|---------|
| **Instant** | < 50ms | Button press visual feedback (scale change) |
| **Reactive** | < 100ms | Block snap to grid column |
| **Fast** | < 300ms | Modal appear, page transition start |
| **Animated** | < 600ms | Line clear sequence, star fill |
| **Cinematic** | < 2000ms | Boss intro, victory celebration |
| **Transaction** | < 5000ms | On-chain move confirmation (optimistic UI during wait) |

#### Haptic Feedback (via Capacitor)

| Event | iOS Pattern | Android Pattern |
|-------|-------------|-----------------|
| Button tap | `UIImpactFeedbackGenerator(.light)` | `HapticFeedbackConstants.VIRTUAL_KEY` |
| Line clear | `UIImpactFeedbackGenerator(.medium)` | `HapticFeedbackConstants.CONTEXT_CLICK` |
| Combo (4+) | `UIImpactFeedbackGenerator(.heavy)` | `HapticFeedbackConstants.LONG_PRESS` |
| Boss defeat | `UINotificationFeedbackGenerator(.success)` | Custom pattern: 50ms-50ms-100ms |
| Error | `UINotificationFeedbackGenerator(.error)` | `HapticFeedbackConstants.REJECT` |

### 1.5 Accessibility

| Requirement | Specification | Implementation |
|-------------|---------------|---------------|
| **Touch targets** | Minimum 44 × 44px (Apple HIG) | All interactive elements ≥ 44px. Grid blocks ≥ 40px with 2px gap tolerance. |
| **Color contrast** | WCAG AA (4.5:1 for text, 3:1 for UI) | All text on background meets 4.5:1. Semantic colors tested against both light and dark surfaces. |
| **Reduced motion** | Respect `prefers-reduced-motion` | Disable: screen shake, particle burst, combo text fly-in. Keep: state changes (instant), button feedback (scale only). |
| **Safe areas** | Handle notch, Dynamic Island, home indicator | Read CSS `--safe-area-top/bottom`. Add padding via `useFullscreenLayout`. Never clip interactive content behind safe areas. |
| **Font scaling** | Support system font size (partial) | `uiScale` incorporates a font multiplier capped at 1.3x to prevent layout break. |
| **Screen readers** | PixiJS canvas is opaque to screen readers | Provide semantic HTML overlay for critical flows: wallet connect, settings. Game grid remains canvas-only. |

### 1.6 Performance Budget

| Resource | Budget | Enforcement |
|----------|--------|-------------|
| **Frame rate** | 60fps sustained on iPhone 12 / Pixel 6 | Profile with PixiJS devtools. Drop to 30fps gracefully on low-end. |
| **Texture memory** | ≤ 50MB per screen | Max texture atlas: 2048×2048. Unload off-screen theme textures. |
| **Particle count** | ≤ 200 simultaneous particles | Object pool of 200 particles. Overflow particles skip (no new spawn). |
| **Draw calls** | ≤ 50 per frame during gameplay | Batch sprites via shared textures. Minimize container nesting. |
| **JS bundle** | ≤ 500KB gzipped (initial) | Code-split by route. Lazy-load shop, quests, achievements. |
| **Asset preload** | Essential bundle < 2MB, total < 15MB | Preload essentials (blocks, grid, HUD) on boot. Defer UI chrome, effects, audio. |
| **DPR cap** | 2.0 maximum | `renderer.resolution = Math.min(window.devicePixelRatio, 2)` |
| **Animation pooling** | Reuse text sprites, particle objects | Pool of 10 `ScorePopup` text sprites. Pool of 200 particle sprites. Never allocate during gameplay. |

---

## 2. Information Architecture

### 2.1 App Map

```
                        ┌──────────────┐
                        │  ONBOARDING  │ (first launch only)
                        │  3 steps     │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
              ┌─────────┤   HOME HUB   ├─────────┐
              │         └──┬──┬──┬──┬──┘         │
              │            │  │  │  │            │
        ┌─────▼───┐  ┌────▼┐ │ ┌▼───┐  ┌───────▼──┐
        │ CAMPAIGN│  │PERM.│ │ │QUEST│  │ PROFILE & │
        │   MAP   │  │SHOP │ │ │    │  │ACHIEVEMNTS│
        └────┬────┘  └─────┘ │ └────┘  └──────────┘
             │               │
        ┌────▼────┐   ┌──────▼──────┐
        │ LOADOUT │   │    DAILY    │
        └────┬────┘   │  CHALLENGE  │
             │        └─────────────┘
        ┌────▼────┐
        │  PLAY   │◄─────────────────┐
        └──┬─┬─┬──┘                  │
           │ │ │                     │
     ┌─────┘ │ └─────┐        ┌─────┴──────┐
     ▼       ▼       ▼        │  IN-GAME   │
   LEVEL   BOSS    GAME       │   SHOP     │
   DONE    DONE    OVER       └────────────┘
     │       │
     │  ┌────▼─────┐
     │  │ LEVEL-UP │
     │  │SELECTION │
     │  └────┬─────┘
     │       │
     └───┬───┘
         ▼
    NEXT LEVEL (back to PLAY)
```

### 2.2 Screen Inventory

| # | Screen | Type | Entry Point | Exit Points |
|---|--------|------|-------------|-------------|
| 1 | Onboarding | Flow (3 steps) | First launch | → Home Hub |
| 2 | Home Hub | Hub | App open / Back from any | → Map, Shop, Quests, Profile, Daily, Settings |
| 3 | Loadout | Configurator | Map → "Start Run" | → Map (cancel), Play (confirm) |
| 4 | Campaign Map | Navigation | Hub → "Play" or "Continue" | → Loadout, Play, Hub |
| 5 | Play Screen | Gameplay | Loadout confirm / Map level tap | → Level Complete, Game Over, Boss Done |
| 6 | Boss Level | Gameplay variant | Auto when level % 10 == 0 | → Boss Done → Level-Up Selection |
| 7 | In-Game Shop | Modal overlay | Auto before boss levels | → Play (continue) |
| 8 | Level Complete | Modal overlay | Level cleared | → Play (next level) |
| 9 | Boss Level-Up | Modal overlay | Boss defeated | → Play (next level) |
| 10 | Run Complete | Full screen | Level 50 cleared | → Hub, Loadout (new run) |
| 11 | Game Over | Full screen | All moves used / Grid full | → Hub, Loadout (retry) |
| 12 | Daily Challenge | Full screen | Hub tile | → Hub |
| 13 | Permanent Shop | Full screen | Hub tile | → Hub |
| 14 | Quest Screen | Full screen | Hub tile | → Hub |
| 15 | Profile & Achievements | Full screen | Hub tile | → Hub |
| 16 | Settings | Modal overlay | Hub gear icon | → Hub |

### 2.3 Navigation Model

**Model**: Hub-and-spoke with gameplay tunnel.

**Rules**:
1. **Home Hub is always ≤ 1 tap away** from any non-gameplay screen (back button or home icon)
2. **During gameplay**: only the Menu modal provides exit (Resume or Surrender). No accidental navigation.
3. **No bottom tab bar**: Hub uses tile-based navigation. Screens have a consistent top bar with Home button.
4. **Gameplay tunnel**: Loadout → Map → Play → Level Complete → Play → ... → Game Over. Linear flow, no branching during a run.

**Transitions**:

| From → To | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Hub → any screen | Slide from right | 300ms | `cubicOut` (1 - (1-t)³) |
| Any screen → Hub | Slide from left | 300ms | `cubicOut` |
| Hub → Play tunnel | Slide up | 400ms | `cubicOut` |
| Play → Game Over | Fade to dark + modal | 500ms | `linear` fade + `backOut` modal |
| Level Complete → Next Level | Crossfade grid | 300ms | `linear` |
| Page → Modal | Backdrop fade 0→0.6 + modal scale 0.85→1.0 | 250ms | `cubicOut` |
| Modal → Dismiss | Backdrop fade 0.6→0 + modal scale 1.0→0.95 + alpha→0 | 200ms | `cubicIn` |

### 2.4 State Machine: Gameplay

```
                    ┌──────────────────────────────────┐
                    │          PLAY SESSION             │
                    │                                  │
  ┌──────────┐     │  ┌─────────┐    ┌───────────┐    │    ┌──────────┐
  │ LOADOUT  │────►│  │ WAITING │───►│  GRAVITY  │    │───►│GAME OVER │
  └──────────┘     │  └─────────┘    └─────┬─────┘    │    └──────────┘
                    │       ▲              │          │
                    │       │         ┌────▼─────┐    │
                    │       │         │LINE_CLEAR│    │
                    │       │         └────┬─────┘    │
                    │       │              │          │
                    │       │         ┌────▼─────┐    │    ┌──────────┐
                    │       │         │ ADD_LINE │    │───►│  LEVEL   │
                    │       │         └────┬─────┘    │    │ COMPLETE │
                    │       │              │          │    └──────────┘
                    │       │         ┌────▼─────┐    │
                    │       │         │ GRAVITY2 │    │
                    │       │         └────┬─────┘    │
                    │       │              │          │
                    │       │        ┌─────▼──────┐   │
                    │       │        │LINE_CLEAR2 │   │
                    │       │        └─────┬──────┘   │
                    │       │              │          │
                    │       │        ┌─────▼──────┐   │
                    │       └────────┤   UPDATE   │   │
                    │                └────────────┘   │
                    └──────────────────────────────────┘
```

| State | Duration | Visual | Data Update |
|-------|----------|--------|-------------|
| WAITING | Until player acts | Grid idle, bonuses enabled | None |
| GRAVITY | 300ms | Blocks fall with `easeOutBounce` | None (visual only) |
| LINE_CLEAR | 500ms | Flash → sweep → particles → score popup | `Game.blocks` updated |
| ADD_LINE | 200ms | New row slides up from preview | `Game.next_row` consumed |
| GRAVITY2 | 300ms | Second gravity pass (cascade) | None (visual only) |
| LINE_CLEAR2 | 500ms | Second clear pass | `Game.blocks` updated |
| UPDATE | 100ms | Score/moves/combo counters animate | `Game.run_data` updated |

### 2.5 Modal Philosophy

**Principle**: Modals are for focused decisions. Never more than one modal visible. Never nest modals.

| Modal | Trigger | Dismissible | Blocking |
|-------|---------|-------------|----------|
| Menu | Tap menu button | Tap outside / X / Escape | No (game is turn-based) |
| Surrender Confirm | Tap "Surrender" in menu | Tap "Cancel" | Yes — must choose |
| Level Complete | Score target met | "Next Level" button only | Yes — must advance |
| Boss Level-Up | Boss defeated | Must choose upgrade | Yes — must choose |
| In-Game Shop | Enter shop level | "Continue" button | No — can skip |
| Game Over | Grid full / moves exhausted | "Home" or "Try Again" | Yes — must choose |
| Allocate Charges | Tap "+" in action bar | "Done" or tap outside | No |
| Bonus Targeting | Activate targeted bonus | Tap target or cancel | No — tap outside cancels |
| Settings | Tap gear icon | Tap outside / X | No |

### 2.6 Error & Edge Case Handling

| Scenario | Detection | UI Response | Recovery |
|----------|-----------|-------------|----------|
| Transaction pending | `await tx` in progress | Overlay: spinning loader + "Processing..." | Auto-resolves. 10s timeout → retry toast. |
| Transaction failed | TX receipt error | Red toast: "Move failed. Tap to retry." | One-tap retry. State unchanged. |
| Session expired | Session key error from Controller | Full-screen: "Session expired. Tap to reconnect." | Clears localStorage, re-authenticates. |
| Network offline | `navigator.onLine === false` | Banner at top: "Offline — reconnecting..." | Auto-retry on reconnect. Queue moves. |
| No games owned | Token query returns empty | Hub shows "Start your first adventure!" CTA | freeMint() on first play tap. |
| Wallet not connected | `account === undefined` | Hub shows "Sign In" as primary button | Triggers Controller connect. |
| Max upgrades reached | Upgrade level === max | Shop card shows "MAX" badge, button disabled | No action needed. Clear visual state. |
| Insufficient cubes | Balance < cost | Button disabled + "Need X more cubes" tooltip | Links to "How to earn cubes" or play. |
| Active run exists | `Game.over === false` found | Hub shows "Continue Run" as primary tile | Resume or surrender via menu. |

---

## 3. Design System

### 3.1 Typography

**Font Stack**:
- **Display**: `'Tilt Prism', 'Arial Black', sans-serif` — Titles, victory text, boss names
- **UI**: `'Arial Black', 'Arial Bold', 'Arial', sans-serif` — Buttons, HUD numbers, labels
- **Body**: `'Arial', 'Helvetica', sans-serif` — Descriptions, quest text, tooltips

**Scale** (all values × `uiScale`):

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text.display` | 48px | Bold | 1.1 | Victory text, boss names |
| `text.h1` | 32px | Bold | 1.2 | Screen titles ("SHOP", "QUESTS") |
| `text.h2` | 24px | Bold | 1.2 | Section headers, level number in HUD |
| `text.h3` | 20px | SemiBold | 1.3 | Card titles, bonus names |
| `text.body` | 16px | Regular | 1.4 | Descriptions, quest text |
| `text.caption` | 13px | Regular | 1.3 | Costs, small labels, timestamps |
| `text.micro` | 11px | Bold | 1.0 | Badge counts, charge numbers |
| `text.hud` | 28px | Bold | 1.0 | Score counter, moves counter |
| `text.hudSmall` | 16px | Bold | 1.0 | Constraint progress ("2/5") |
| `text.combo` | 40-64px | Bold | 1.0 | Combo overlay (scales with combo) |

**Text Rendering**:
- All PixiJS text uses `PIXI.Text` with `BitmapText` for frequently-updated numbers (score, moves, combo)
- Drop shadow: `{ distance: 2, angle: Math.PI/4, alpha: 0.3, blur: 2 }` on headings and HUD
- No text stroke (too heavy on mobile). Use shadow for readability on varied backgrounds.

### 3.2 Color System

#### 3.2.1 Semantic Colors (theme-independent)

| Token | Value | Usage |
|-------|-------|-------|
| `color.bg.primary` | `#1E293B` | Screen backgrounds, card fills |
| `color.bg.secondary` | `#0F172A` | Deeper backgrounds, modal backdrops |
| `color.bg.surface` | `#334155` | Elevated cards, input fields |
| `color.bg.overlay` | `#000000` at 60% alpha | Modal backdrop |
| `color.text.primary` | `#FFFFFF` | Primary text |
| `color.text.secondary` | `#94A3B8` | Secondary text, labels |
| `color.text.muted` | `#64748B` | Disabled text, hints |
| `color.accent.blue` | `#3B82F6` | Active states, links, current level |
| `color.accent.gold` | `#FBBF24` | Cube currency, star ratings |
| `color.accent.orange` | `#F97316` | Primary CTA buttons, active paths |
| `color.accent.purple` | `#8B5CF6` | Premium, rare, Wave/Supply bonuses |
| `color.status.success` | `#22C55E` | Completed, earned, confirmed |
| `color.status.danger` | `#EF4444` | Low moves, boss danger, surrender |
| `color.status.warning` | `#F97316` | Approaching limit, attention needed |
| `color.state.hover` | `#334155` | Button hover state |
| `color.state.pressed` | `#1E293B` | Button press state |
| `color.state.disabled` | `#4B5563` at 50% | Disabled interactive elements |
| `color.state.locked` | `#64748B` at 40% | Locked levels, unavailable content |

#### 3.2.2 Theme Color Structure

Each of the 10 cultural themes defines:

```typescript
interface ThemeColors {
  // Environment
  background: number;
  backgroundGradientStart: number;
  backgroundGradientEnd: number;
  
  // Grid
  gridBg: number;
  gridCellAlt: number;
  gridLines: number;
  gridLinesAlpha: number;
  frameBorder: number;
  
  // UI Chrome
  hudBar: number;
  hudBarBorder: number;
  actionBarBg: number;
  accent: number;
  
  // Gameplay
  dangerZone: number;
  dangerZoneAlpha: number;
  
  // Blocks (4 sizes)
  blocks: Record<1|2|3|4, {
    fill: number;
    glow: number;
    highlight: number;
  }>;
  
  // Particles
  particles: {
    primary: number[];
    explosion: number[];
  };
}
```

Source of truth: `mobile-app/src/pixi/utils/colors.ts`. All 10 themes fully defined there with palettes for Tiki, Cosmic, Easter Island, Maya, Cyberpunk, Medieval, Egypt, Volcano, Tribal, and Arctic.

### 3.3 Spacing System

All values × `uiScale`.

| Token | Value | Usage |
|-------|-------|-------|
| `space.2xs` | 2px | Hairline gaps, badge offsets |
| `space.xs` | 4px | Inner padding, icon-to-text gap |
| `space.sm` | 8px | Component internal padding |
| `space.md` | 12px | Card padding, section gaps |
| `space.lg` | 16px | Screen edge padding |
| `space.xl` | 24px | Section separators |
| `space.2xl` | 32px | Major section gaps |
| `space.3xl` | 48px | Screen top/bottom breathing room |

### 3.4 Layout Grid

**Principle**: Content flows in a single centered column. Max width 480px on large screens.

| Zone | Width | Alignment |
|------|-------|-----------|
| Content column | `min(screenWidth - 2×space.lg, 480px)` | Center |
| Grid (gameplay) | `8 × cellSize` where `cellSize = floor((columnWidth) / 8)` | Center |
| Cards (hub/shop) | `columnWidth` | Full width within column |
| Action bar | `columnWidth` | Bottom-aligned within column |

**Vertical Rhythm**:
- Screen title: `space.xl` from safe area top
- Section gaps: `space.xl`
- Card gaps: `space.md`
- Content within cards: `space.sm`

### 3.5 Iconography

**Style**: White silhouette on transparent. Tinted at runtime via `sprite.tint`.

**Sizes** (× `uiScale`):

| Context | Icon Size | Touch Target |
|---------|-----------|-------------|
| Top bar buttons | 24px | 44×44px |
| HUD constraint icons | 20px | — (not interactive) |
| Bonus action bar | 32px | 56×56px |
| Card icons | 24px | — (card is tappable) |
| Inline with text | 16px | — |
| Hub tile icons | 32px | — (tile is tappable) |

**Icon Catalog** (all from `/assets/common/icons/`):

| Category | Icons |
|----------|-------|
| Navigation | `icon-home`, `icon-arrow-left`, `icon-arrow-right`, `icon-close`, `icon-menu`, `icon-settings` |
| Game | `icon-moves`, `icon-score`, `icon-level`, `icon-cube`, `icon-star-filled`, `icon-star-empty` |
| Social | `icon-crown`, `icon-trophy`, `icon-medal-gold`, `icon-medal-silver`, `icon-medal-bronze` |
| Status | `icon-lock`, `icon-check`, `icon-fire`, `icon-skull`, `icon-play`, `icon-refresh` |
| Features | `icon-shop`, `icon-scroll`, `icon-gamepad`, `icon-chart`, `icon-lightning`, `icon-music`, `icon-sound` |
| Bonuses | `icon-wheat` (harvest), `icon-package` (supply), `icon-bridge` (bridging), `icon-gesture` (tutorial) |

### 3.6 Button System

All buttons use PixiJS `NineSliceSprite` for scalable backgrounds.

#### Button Variants

| Variant | BG Texture | Text Color | Usage |
|---------|-----------|-----------|-------|
| `primary` | `btn-orange.png` | White | Main CTA: "Play", "Start Run", "Claim" |
| `confirm` | `btn-green.png` | White | Confirm actions: "Buy", "Upgrade", "Fight" |
| `secondary` | `btn-purple.png` | White | Secondary: "Try Again", "New Run" |
| `danger` | `btn-red.png` | White | Destructive: "Surrender" |
| `ghost` | None (transparent) | `color.text.secondary` | Tertiary: "Cancel", "Skip" |
| `icon` | `btn-icon.png` | — | Icon-only: menu, settings, close |

#### Button States

| State | Visual Change | Transition |
|-------|-------------|-----------|
| Default | Normal appearance | — |
| Hover | `brightness(1.1)` filter | 100ms ease |
| Pressed | `scale(0.93)` + `brightness(0.9)` | 50ms ease |
| Disabled | `alpha(0.4)` + desaturate | Instant |
| Loading | Content replaced with spinning loader | 200ms crossfade |

#### Button Sizes (× `uiScale`)

| Size | Height | Min Width | Padding H | Font |
|------|--------|-----------|-----------|------|
| `lg` | 52px | 200px | 24px | `text.h3` (20px bold) |
| `md` | 44px | 140px | 16px | `text.body` (16px bold) |
| `sm` | 36px | 100px | 12px | `text.caption` (13px bold) |
| `icon` | 44px | 44px | 10px | — |

#### 9-Slice Borders

| Texture | Left | Top | Right | Bottom |
|---------|------|-----|-------|--------|
| `btn-*` | 16px | 16px | 16px | 16px |
| `panel-*` | 24px | 24px | 24px | 24px |

### 3.7 Component Library

Reusable components used across multiple screens.

#### CubeBalance

```
┌──────────────┐
│ [cube] 142   │  ← gold icon + bold number
└──────────────┘
```
- Icon: `icon-cube` at 20px, tinted `color.accent.gold`
- Text: `text.h3` (20px bold), white
- Gap: `space.xs` (4px)
- Used in: Top bar (all screens), shop headers, reward breakdowns
- Animation: Count-up tween when balance changes (500ms, `easeOutCubic`)

#### StarRating

```
★ ★ ☆
```
- Icons: `icon-star-filled` / `icon-star-empty` at 20px
- Filled: tinted `color.accent.gold`
- Empty: tinted `color.text.muted` at 40%
- Gap: `space.2xs` (2px)
- Animation: Each star scales in 0→1.2→1.0 with 200ms stagger

#### ConstraintBadge

```
┌─────────┐
│ [icon]  │  ← 20px constraint type icon
│  ◔ 2/5  │  ← circular progress ring + count
└─────────┘
```
- Ring: 28px diameter, 3px stroke
- Background ring: `#FFFFFF` at 20%
- Fill ring: theme `accent` color, proportional arc
- Complete state: full ring turns `color.status.success`, icon gets checkmark overlay
- Text: `text.hudSmall` (16px bold)

#### BonusSlot

```
┌───────────┐
│  [icon]   │  ← 32px bonus type icon
│   ×3      │  ← charge count badge
│    II     │  ← level indicator (I/II/III)
└───────────┘
```
- Background: `panel-dark` 9-slice, 64×72px
- Border: 2px, theme `accent` when selected
- Glow: `DropShadowFilter` with accent color when active
- Disabled: `alpha(0.3)`, grayscale

#### ProgressBar

```
┌──────────────────────────┐
│ ████████░░░░░  65%       │
└──────────────────────────┘
```
- Height: 8px (thin) or 16px (standard)
- Background: `color.bg.surface`
- Fill: `color.status.success` (or theme accent)
- Corner radius: height / 2
- Animation: Fill width tweens on change (300ms, `easeOutCubic`)

#### Card

```
┌──────────────────────────────┐
│  Title              [badge]  │
│  Description text            │
│  [content area]              │
│            [Action Button]   │
└──────────────────────────────┘
```
- Background: `panel-dark` 9-slice
- Padding: `space.md` (12px)
- Corner radius: 12px (via 9-slice)
- Title: `text.h3`, white
- Description: `text.body`, `color.text.secondary`

#### TopBar

```
┌──────────────────────────────────────────┐
│  [←]   Screen Title        [cube] 142   │
└──────────────────────────────────────────┘
```
- Height: 44px + safe area top
- Background: `color.bg.primary` at 90% alpha
- Back button: `icon-arrow-left` (left-aligned)
- Title: `text.h2` (24px bold), centered
- Right: CubeBalance component
- Home variant: No back button. Right side: icon buttons (settings, tutorial, quests, profile)

### 3.8 Animation System

#### Easing Functions

| Name | Formula | Usage |
|------|---------|-------|
| `linear` | `t` | Fade in/out, progress bars |
| `easeOutCubic` | `1 - (1-t)³` | Most UI transitions, modals |
| `easeOutBack` | `1 + 2.70158 × (t-1)³ + 1.70158 × (t-1)²` | Star pop-in, badge appear |
| `easeOutBounce` | Piecewise bounce | Block gravity, level number increment |
| `easeInCubic` | `t³` | Modal dismiss, fade out |
| `easeInOutQuad` | Piecewise `2t²` / `-1+(4-2t)t` | Smooth oscillations, pulsing |

#### Animation Patterns

| Pattern | Properties | Duration | Easing |
|---------|-----------|----------|--------|
| **Button press** | `scale: 1→0.93→1` | 150ms | `easeOutCubic` |
| **Modal enter** | `scale: 0.85→1, alpha: 0→1` | 250ms | `easeOutCubic` |
| **Modal exit** | `scale: 1→0.95, alpha: 1→0` | 200ms | `easeInCubic` |
| **Page slide in** | `x: 30%→0%, alpha: 0→1` | 300ms | `easeOutCubic` |
| **Page slide out** | `x: 0%→-30%, alpha: 1→0` | 300ms | `easeOutCubic` |
| **Star pop-in** | `scale: 0→1.2→1` | 400ms | `easeOutBack` |
| **Score count-up** | `value: old→new` | 500ms | `easeOutCubic` |
| **Particle burst** | `position: center→radial, alpha: 1→0, scale: 1→0.3` | 800ms | `linear` alpha |
| **Screen shake** | `x: ±amplitude, y: ±amplitude/2` | 200ms | Dampening sine |
| **Pulse glow** | `alpha: 0.3→0.6→0.3` | 1200ms | `easeInOutQuad` (loop) |
| **Coin fly** | `position: source→target (arc), scale: 1→0.5` | 600ms | `easeInCubic` |

#### Reduced Motion Alternatives

| Normal Animation | Reduced Alternative |
|-----------------|---------------------|
| Screen shake | Skip entirely |
| Particle burst | Single flash (50ms white overlay) |
| Combo text fly-in | Instant appear, 500ms hold, instant disappear |
| Star pop-in | Instant appear at full size |
| Coin fly arc | Instant balance update |
| Page slide | Instant swap |
| Button press scale | Opacity change only (1.0→0.7→1.0) |
| Pulse glow | Static glow at 0.5 alpha |

### 3.9 Sound Design Philosophy

**Principle**: Sound reinforces the "warm cascade" tone. Every positive action has a satisfying audio cue. Negative events are softened.

#### Sound Categories

| Category | Default Volume | Behavior |
|----------|---------------|----------|
| **BGM** | 20% | Loops. Crossfades on context change (1s). |
| **SFX** | 20% | One-shot. Max 3 simultaneous. Priority queue. |
| **UI** | 15% | Tied to SFX volume. Subtle clicks and feedback. |

#### Music Contexts

| Context | Track | When Active |
|---------|-------|-------------|
| `main` | `{theme}/sounds/musics/main.mp3` | Home Hub, Shop, Profile, Settings |
| `map` | `{theme}/sounds/musics/map.mp3` | Campaign Map, Loadout |
| `level` | `{theme}/sounds/musics/level.mp3` | Gameplay (non-boss levels) |
| `boss` | `{theme}/sounds/musics/boss.mp3` | Boss levels |

#### SFX Mapping

| Event | SFX | Priority |
|-------|-----|----------|
| Block move/snap | `move.mp3` | Low |
| Single line clear | `break.mp3` | Medium |
| Multi-line clear | `explode.mp3` | High |
| Level complete | `levelup.mp3` | Critical |
| Star earned | `star.mp3` | Medium |
| Boss intro | `boss-intro.mp3` | Critical |
| Boss defeat | `boss-defeat.mp3` | Critical |
| Victory (L50) | `victory.mp3` | Critical |
| Game over | `over.mp3` | Critical |
| Button tap | `click.mp3` | Low |
| Cube earned | `coin.mp3` | Medium |
| Quest claimed | `claim.mp3` | Medium |
| Bonus activated | `bonus-activate.mp3` | Medium |
| Shop purchase | `shop-purchase.mp3` | Medium |
| Bonus equip/unequip | `equip.mp3` / `unequip.mp3` | Low |
| Constraint complete | `constraint-complete.mp3` | Medium |

---

## 5. User Stories

### 5.1 Onboarding

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| O-1 | As a **new player**, I want to sign in with one tap so that I can start without understanding wallets. | P0 | Onboarding | "Sign In" button → Cartridge Controller modal. After auth, auto `freeMint()`. No hex displayed. |
| O-2 | As a **new player**, I want a brief 3-step tutorial so that I learn by watching, not reading. | P0 | Onboarding | 3 cards: (1) Swipe blocks, (2) Clear lines, (3) Use bonuses. Animated visuals. Skip button. < 30s total. |
| O-3 | As a **new player**, I want to start my first run from the hub without menus so that time-to-play < 30s. | P0 | Home Hub | "Start First Run" primary CTA. Default loadout pre-selected. One tap to begin. |
| O-4 | As a **new player**, I want locked features to appear as intriguing mysteries so that I have goals. | P1 | Loadout | Locked bonuses: lock icon + "?" overlay. Tap → cost tooltip. Clear differentiation from unlocked. |

### 5.2 Core Gameplay Loop

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| G-1 | As a **player**, I want the grid to dominate with minimal chrome so I can focus. | P0 | Play | Grid = 65% viewport height. HUD = single 44px bar. Action bar = compact bottom tray. |
| G-2 | As a **player**, I want moves and score visible without looking away from the grid. | P0 | Play | Moves (top-right) red at ≤3. Score bar fills progressively. |
| G-3 | As a **player**, I want constraints as icon badges with progress rings. | P0 | Play | Circular ring + icon + "2/5" text. Checkmark on complete. |
| G-4 | As a **player**, I want combo feedback scaled to combo size. | P0 | Play | 2x: yellow text. 4x+: screen shake. 6+: "INCREDIBLE!" |
| G-5 | As a **player**, I want one-tap bonus activation (non-targeted) and two-tap (targeted). | P0 | Play | Combo/Score/Supply: single tap. Harvest/Wave: tap → highlight targets → tap target. |
| G-6 | As a **player**, I want next row preview so I can plan ahead. | P1 | Play | Below grid at 40% opacity. Same sprites, dimmed. |
| G-7 | As a **player**, I want a single menu button for clean screen. | P1 | Play | Hamburger → Menu modal: Surrender, Sound toggle, Close. |
| G-8 | As a **player**, I want NoBonusUsed clearly indicated to avoid mistakes. | P1 | Play | Slash overlay on bonus slots + red warning. Tooltip on tap. |

### 5.3 Campaign Progression

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| M-1 | As a **returning player**, I want active run prominent on hub for one-tap resume. | P0 | Hub | "Continue Run" = largest tile when active. Shows level + stars + bonuses. |
| M-2 | As a **player**, I want star ratings on map nodes to appreciate my journey. | P0 | Map | Cleared nodes show 1-3 gold stars. Current pulses. Locked dimmed. |
| M-3 | As a **player**, I want swipe between map zones for natural navigation. | P0 | Map | Horizontal swipe. Smooth inertia + snap. Zone dots at bottom. |
| M-4 | As a **player**, I want boss nodes visually distinct to build anticipation. | P1 | Map | Boss = 2x size, pulsing glow, boss name on tap. |
| M-5 | As a **player**, I want level details on tap before committing. | P1 | Map | LevelPreview: difficulty, constraints, target, moves, stars. "Play" if available. |

### 5.4 Boss Encounters

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| B-1 | As a **player**, I want dramatic boss intro with name and constraints. | P0 | Boss Intro | Portrait slides in, name fades, constraints appear. "Fight" button. Boss BGM. |
| B-2 | As a **player fighting boss**, I want all 2-3 constraints clearly visible. | P0 | Play (Boss) | 2-3 badges in HUD. Red-tinted bar. Boss progress bar. |
| B-3 | As a **player defeating boss**, I want to choose which bonus to upgrade. | P0 | Level-Up | 3 equipped bonuses with current → next. Effect preview. Grayed if max. |
| B-4 | As a **player**, I want boss cube bonus shown prominently. | P1 | Boss Defeat | "+30 CUBE" center. Gold burst. Counter ticks up. |

### 5.5 Economy & Shops

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| E-1 | As a **player**, I want to select 3 bonuses before a run to strategize. | P0 | Loadout | 5 cards. Tap to toggle. 3 slots. Disabled until 3 chosen. |
| E-2 | As a **player with cubes**, I want a slider to choose how many to bring. | P1 | Loadout | Slider 0 to max (bridging rank). Rank 0: hidden + "Unlock in Shop". |
| E-3 | As a **player at shop level**, I want clear items with costs. | P0 | In-Game Shop | 3 items. Available cubes shown. "Continue" to skip. |
| E-4 | As a **player**, I want to skip the shop without friction. | P0 | In-Game Shop | "Continue" always visible and prominent. |
| E-5 | As a **player**, I want permanent upgrades organized by category. | P0 | Perm. Shop | Sections: Starting Bonuses, Bag Size, Bridging, Unlock. Current/next/cost per card. |
| E-6 | As a **player**, I want upgrades reflected immediately. | P1 | Shop | Coin fly → counter → card updates. Next loadout shows new values. |

### 5.6 Quests & Achievements

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| Q-1 | As a **player**, I want quest progress visible from hub. | P0 | Hub | Tile: "Quests 6/10" + progress bar. |
| Q-2 | As a **player**, I want one-tap quest claiming. | P0 | Quests | Gold "Claim" button. Tap → coin animation → "Claimed ✓". |
| Q-3 | As a **player**, I want Daily Champion quest prominent. | P1 | Quests | Gold border row. "Complete all 9" + overall progress. |
| Q-4 | As a **player**, I want achievement progress visible. | P1 | Profile | Earned: full color + shine. Locked: silhouette + "42/100". |
| Q-5 | As a **player**, I want quest countdown timer. | P1 | Quests | "Resets in 14h 23m" real-time countdown at top. |

### 5.7 Error Recovery & Edge Cases

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| ER-1 | As a **player**, I want auto-retry on failed transactions. | P0 | Any | 3 auto-retries. Then: "Tap to retry" toast. No hex errors shown. |
| ER-2 | As a **player**, I want game state preserved on app close. | P0 | Play | On-chain state. Reopen → Hub → "Continue Run" resumes exactly. |
| ER-3 | As a **player**, I want graceful session expiry handling. | P0 | Any | Overlay → "Reconnect" → re-auth → resume. No data loss. |
| ER-4 | As a **player on slow network**, I want optimistic UI. | P1 | Play | Grid updates immediately. If tx fails: revert + toast. |
| EC-1 | As a **player with no games**, I want a warm welcome. | P0 | Hub | Illustration + "Start your first adventure!" + Play button. |
| EC-2 | As a **player with max upgrades**, I want clear "maxed" state. | P1 | Shop | "MAX" badge, green check, disabled button. |
| EC-3 | As a **L50 completer**, I want a memorable victory. | P0 | Victory | Confetti, "VICTORY!", full run summary. |

### 5.8 Settings & Power Users

| ID | Story | Priority | Screen | Acceptance Criteria |
|----|-------|----------|--------|-------------------|
| SET-1 | As a **player**, I want independent music/effects volume. | P1 | Settings | Two sliders. Immediate apply. Persisted to localStorage. |
| SET-2 | As a **player**, I want theme selection. | P1 | Settings | 10 icons (5×2 grid). Tap to select. Immediate preview. |
| PU-1 | As a **power user**, I want detailed level info. | P2 | LevelPreview | Exact constraint values, point target, moves, cube thresholds. |
| PU-2 | As a **power user**, I want quick restart after game over. | P1 | Game Over | "Try Again" → Loadout (preserves selection). |
| PU-3 | As a **power user**, I want keyboard shortcuts on desktop. | P2 | Play | Arrow keys, 1/2/3 for bonuses, Escape for menu. |

---

## 4. Screen Specifications

Each screen specifies: layout (ASCII wireframe), component tree, data bindings, interactions, animations, PixiJS implementation notes, and responsive behavior.

**Coordinate system**: Origin = top-left of safe area. All dimensions × `uiScale`. Safe area insets handled by `useFullscreenLayout()`.

---

### 4.1 Onboarding (First Launch Only)

**Trigger**: `localStorage.getItem('zkube_onboarded') === null` AND no wallet connected.

**Structure**: 3-step card carousel with a final CTA. No navigation chrome — immersive.

#### Layout

```
┌──────────────────────────────────┐
│                                  │
│         [Theme Background]       │
│                                  │
│   ┌──────────────────────────┐   │
│   │                          │   │
│   │     [Animated Visual]    │   │  ← 200×200px sprite animation
│   │                          │   │
│   │   "Swipe blocks to       │   │  ← text.h2, white, center
│   │    clear lines"          │   │
│   │                          │   │
│   │   Short description      │   │  ← text.body, secondary, center
│   │                          │   │
│   └──────────────────────────┘   │
│                                  │
│          ● ○ ○                   │  ← step dots, 8px, space.sm gap
│                                  │
│     [ Next → ]                   │  ← primary button, lg
│                                  │
│     Skip                         │  ← ghost button, sm
│                                  │
└──────────────────────────────────┘
```

#### Steps

| Step | Visual | Headline | Description |
|------|--------|----------|-------------|
| 1 | Animated hand swiping a 3×3 mini-grid | "Swipe to Clear" | "Slide blocks left and right to form complete rows." |
| 2 | Lines flashing and disappearing with score popup | "Score & Combo" | "Clear multiple lines at once for massive combos." |
| 3 | Boss silhouette + stars + cube icon | "Conquer & Earn" | "Defeat bosses, earn cubes, unlock powerful bonuses." |

#### Step 3 → Sign In

After step 3, the "Next" button becomes "Sign In" (`primary`, `lg`). Tapping triggers Cartridge Controller auth flow. On success:
1. Auto-call `freeMint()` (invisible to user — spinner shows "Setting up your game...")
2. Set `localStorage.setItem('zkube_onboarded', 'true')`
3. Navigate to Home Hub with slide-up transition (400ms)

#### Component Tree

```
<pixiContainer name="onboarding">
  <pixiSprite texture="theme-bg" /> {/* full screen */}
  <pixiContainer name="card" y={safeTop + space.3xl}>
    <pixiSprite name="visual" /> {/* animated sprite */}
    <pixiText name="headline" style={text.h2} />
    <pixiText name="description" style={text.body} />
  </pixiContainer>
  <pixiContainer name="dots" y={screenHeight - 180}>
    {steps.map((_, i) => <pixiGraphics key={i} />)} {/* circles */}
  </pixiContainer>
  <PixiButton name="next" variant="primary" size="lg" y={screenHeight - 120} />
  <PixiButton name="skip" variant="ghost" size="sm" y={screenHeight - 60} />
</pixiContainer>
```

#### Animations

- **Card transition**: Current card slides out left (200ms, `easeOutCubic`) → new card slides in from right (200ms, `easeOutCubic`). 50ms stagger.
- **Visual**: Each step has a looping sprite animation (PixiJS `AnimatedSprite`, 12fps)
- **Dots**: Active dot scales 1→1.3 + tints white. Inactive dots tint `color.text.muted`.
- **Skip**: Ghost text, tap navigates to step 3 immediately.

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Step index | Local state `useState(0)` | "Next" tap |
| Auth state | Cartridge Controller callback | Auth complete |

---

### 4.2 Home Hub

**Entry**: Default screen on app open (if onboarded). Central hub for all navigation.

#### Layout — No Active Run

```
┌──────────────────────────────────────────┐
│  [⚙]  [?]              [🏆]  [cube] 142 │  ← TopBar (home variant)
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  [theme bg illustration]           │  │  ← 320×140 hero card
│  │                                    │  │
│  │      "Start New Run"               │  │  ← text.h1, white
│  │      [ Play → ]                    │  │  ← primary button, lg
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐     │  ← tile row 1 (3-up)
│  │ [icon] │  │ [icon] │  │ [icon] │     │
│  │ Quests │  │  Shop  │  │ Daily  │     │
│  │ 6/10   │  │        │  │ 14h23m │     │
│  └────────┘  └────────┘  └────────┘     │
│                                          │
│  ┌─────────────────┐ ┌────────────────┐  │  ← tile row 2 (2-up)
│  │ [icon]          │ │ [icon]         │  │
│  │ Leaderboard     │ │ My Games       │  │
│  │ Rank: #42       │ │ 5 games        │  │
│  └─────────────────┘ └────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

#### Layout — Active Run Exists

```
┌──────────────────────────────────────────┐
│  [⚙]  [?]              [🏆]  [cube] 142 │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  [map mini-preview with level]     │  │  ← Continue Run hero card
│  │                                    │  │
│  │  Level 14 — Zone 2 "Maya"         │  │  ← text.h2
│  │  ★★☆  Score: 847                  │  │  ← StarRating + score
│  │  [Combo] [Score] [Harvest]         │  │  ← 3 mini bonus icons
│  │                                    │  │
│  │     [ Continue Run → ]             │  │  ← primary button, lg
│  └────────────────────────────────────┘  │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  "New Run"                       │    │  ← secondary button card
│  │  Starts fresh from Level 1       │    │
│  │              [ New Run ]          │    │  ← secondary button, md
│  └──────────────────────────────────┘    │
│                                          │
│  [tiles: Quests | Shop | Daily]          │
│  [tiles: Leaderboard | My Games]         │
│                                          │
└──────────────────────────────────────────┘
```

#### Component Tree

```
<pixiContainer name="home-hub">
  <TopBar variant="home" cubeBalance={balance} />

  <pixiContainer name="content" y={topBarHeight + space.xl}>
    {activeRun ? (
      <ContinueRunCard run={activeRun} onContinue={resumeRun} />
    ) : (
      <HeroCard onPlay={openLoadout} />
    )}

    {activeRun && <NewRunCard onNewRun={openLoadout} />}

    <pixiContainer name="tile-row-1" y={heroHeight + space.xl}>
      <HubTile icon="icon-scroll" label="Quests" badge="6/10" onTap={goQuests} />
      <HubTile icon="icon-shop" label="Shop" onTap={goShop} />
      <HubTile icon="icon-lightning" label="Daily" badge="14h23m" onTap={goDaily} />
    </pixiContainer>

    <pixiContainer name="tile-row-2" y={row1Y + tileHeight + space.md}>
      <HubTile icon="icon-chart" label="Leaderboard" badge="#42" onTap={goLeaderboard} />
      <HubTile icon="icon-gamepad" label="My Games" badge="5" onTap={goMyGames} />
    </pixiContainer>
  </pixiContainer>
</pixiContainer>
```

#### Hub Tile Spec

```
┌───────────────┐
│    [icon]     │  ← 32px, tinted white
│               │
│   "Quests"    │  ← text.caption, white
│    6/10       │  ← text.micro, secondary (or badge)
└───────────────┘
```
- Size: `(columnWidth - 2×space.md) / 3` for 3-up, `(columnWidth - space.md) / 2` for 2-up
- Height: 88px
- Background: `panel-dark` 9-slice
- Corner radius: 12px
- Icon: centered, 32px
- Label: below icon, `space.xs` gap
- Badge (optional): `text.micro`, `color.text.secondary`. Or numeric badge (gold circle 18px, `text.micro` white)
- Tap: `scale: 1→0.93→1` (150ms) → navigate

#### Interactions

| Action | Handler | Result |
|--------|---------|--------|
| Tap "Play" / "Continue Run" | Navigate to Map (if run) or Loadout (if new) | Slide right transition |
| Tap "New Run" (with active run) | Confirm modal: "Abandon current run?" | If confirmed: surrender + navigate to Loadout |
| Tap Quest tile | Navigate to QuestsPage | Slide right |
| Tap Shop tile | Navigate to ShopPage | Slide right |
| Tap Daily tile | Navigate to DailyChallengePage | Slide right |
| Tap Leaderboard tile | Navigate to LeaderboardPage | Slide right |
| Tap My Games tile | Navigate to MyGamesPage | Slide right |
| Tap ⚙ | Open Settings modal | Modal enter |
| Tap ? | Navigate to TutorialPage | Slide right |
| Tap 🏆 | Navigate to Profile/Achievements | Slide right |

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Cube balance | `useCubeBalance()` → ERC1155 balance | Torii sync |
| Active run | `useGame(tokenId)` → `Game.over === false` | Torii sync |
| Run level/score | `unpackRunData(Game.run_data)` → `currentLevel`, `totalScore` | Torii sync |
| Quest progress | `useQuestProgress()` → completed count / total | Torii sync |
| Leaderboard rank | `useLeaderboard()` → player position | Periodic poll |

---

### 4.3 Loadout Screen

**Entry**: Hub → "Play" / "New Run". Configures bonus selection and cube bridging before a run.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]     "Loadout"          [cube] 142   │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  SELECT BONUSES (3)                      │  ← section title, text.h3
│  Choose 3 bonuses for your run           │  ← text.body, secondary
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐             │  ← row 1: always-available
│  │[icon]│ │[icon]│ │[icon]│             │
│  │Combo │ │Score │ │Harvst│             │
│  │ ×3   │ │ ×5   │ │ ×2   │             │
│  │  I   │ │  II  │ │  I   │             │
│  │  ✓   │ │  ✓   │ │      │             │  ← checkmark if selected
│  └──────┘ └──────┘ └──────┘             │
│                                          │
│  ┌──────┐ ┌──────┐                       │  ← row 2: unlockable
│  │[icon]│ │[icon]│                       │
│  │ Wave │ │Supply│                       │
│  │  🔒  │ │  ×1  │                       │  ← locked or available
│  │      │ │  I   │                       │
│  │      │ │  ✓   │                       │
│  └──────┘ └──────┘                       │
│                                          │
│  ─────────────────────────────────       │
│                                          │
│  BRING CUBES                             │  ← section title, text.h3
│  ┌──────────────────────────────────┐    │
│  │  [cube] 0 ─────○──────── 50     │    │  ← slider (if unlocked)
│  │  Max: 50 (Bridging Rank 2)      │    │
│  └──────────────────────────────────┘    │
│  Or: "Unlock in Shop" link               │  ← if rank 0
│                                          │
│          [ Start Run → ]                 │  ← primary button, lg
│          (disabled if < 3 selected)      │
│                                          │
└──────────────────────────────────────────┘
```

#### Bonus Card States

| State | Visual |
|-------|--------|
| Available, not selected | `panel-dark`, white icon, charge count visible |
| Available, selected | `panel-dark` + theme `accent` 2px border + glow | 
| Locked | `panel-dark` at 40% alpha, `icon-lock` overlay, tap shows "Unlock in Shop" toast |
| No charges | `panel-dark`, icon at 30% alpha, "×0" in red, selectable but warning shown |

#### Bonus Card Spec (Extended)

```
┌─────────────────┐
│                  │
│     [icon]       │  ← 40px, tinted white (or accent if selected)
│                  │
│    "Combo"       │  ← text.caption, white
│      ×3          │  ← text.micro, gold
│      I           │  ← level indicator, accent color
│                  │
│    [ ✓ ]         │  ← checkmark badge (green, bottom-right)
└─────────────────┘
```
- Size: `(columnWidth - 4×space.sm) / 3` × 100px (row 1), `(columnWidth - 3×space.sm) / 2` × 100px (row 2)
- Background: `panel-dark` 9-slice
- Selected border: 2px, theme `accent`, `DropShadowFilter({ color: accent, blur: 8, alpha: 0.4 })`
- Tap animation: `scale 1→0.93→1` (150ms)

#### Cube Slider

- Track: 4px height, `color.bg.surface`, rounded
- Fill: `color.accent.gold`, width proportional to value
- Thumb: 24px circle, `color.accent.gold`, `DropShadowFilter`
- Range: 0 to `maxBridging` (from `PlayerMeta.data` → bridging rank × 25 per rank, capped at balance)
- Hidden entirely if bridging rank = 0 (show "Unlock bridging in Shop" link instead)
- Value label: `text.h3`, gold, centered above thumb

#### Interactions

| Action | Handler | Result |
|--------|---------|--------|
| Tap bonus card (available) | Toggle selection | Border + glow toggle. If 4th selected, deselect oldest. |
| Tap bonus card (locked) | Toast: "Unlock Wave in the Shop!" | No state change |
| Drag cube slider | Update `cubesToBring` local state | Value label updates |
| Tap "Start Run" (3 selected) | Call `create(tokenId, bonuses, cubes)` | Loading spinner → navigate to Map |
| Tap "Start Run" (< 3) | Shake button + toast: "Select 3 bonuses" | No navigation |
| Tap ← back | Navigate to Hub (cancel) | Slide left |

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Available bonuses | `usePlayerMeta()` → `data` (starting charges per type) | Torii sync |
| Locked state (Wave/Supply) | `usePlayerMeta()` → unlock flags | Torii sync |
| Charge counts | `usePlayerMeta()` → starting charges (combo/score/harvest/wave/supply) | Torii sync |
| Bonus levels | `usePlayerMeta()` → bonus levels | Torii sync |
| Bridging rank & max | `usePlayerMeta()` → bridging rank | Torii sync |
| Cube balance | `useCubeBalance()` | Torii sync |
| Last loadout | `localStorage('zkube_loadout')` | On mount |

#### PixiJS Notes

- Persist selection to `localStorage` so it's remembered across sessions
- "Start Run" calls `systems.create(tokenId, selectedBonuses, cubesToBring)` — shows loading overlay during tx
- On `create` tx success: navigate to Campaign Map with the new game entity

---

### 4.4 Campaign Map

**Entry**: Hub → "Play" or Hub → "Continue Run". Shows level progression across 5 zones.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]      "Zone 2: Maya"    [cube] 142   │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  [Zone-specific background illustration] │  ← full-height themed bg
│                                          │
│         ●────────●                       │  ← S-curve node layout
│        /          \                      │
│       ●            ●                     │
│      /              \                    │
│     ●    [SHOP]      ●                  │  ← shop node (every 10th)
│      \              /                    │
│       ●            ●                     │
│        \          /                      │
│         ●────[BOSS]                      │  ← boss node (larger)
│                                          │
│                                          │
│     ● ● ● ● ●                           │  ← zone dots (bottom)
│                                          │
└──────────────────────────────────────────┘
```

#### Zone Structure (per zone)

Each zone = 11 nodes: 9 regular levels + 1 shop level + 1 boss level.

| Zone | Levels | Theme | Boss |
|------|--------|-------|------|
| 1 | 1-10 | Current theme (player selected) | Boss 1 (L10) |
| 2 | 11-20 | Current theme | Boss 2 (L20) |
| 3 | 21-30 | Current theme | Boss 3 (L30) |
| 4 | 31-40 | Current theme | Boss 4 (L40) |
| 5 | 41-50 | Current theme | Boss 5 (L50) |

#### Node Types

| Type | Size | Visual | Interaction |
|------|------|--------|-------------|
| **Cleared** | 36px | Gold circle, 1-3 stars below, gold path to next | Tap → LevelPreview (replay info) |
| **Current** | 44px | Pulsing glow (theme accent), player avatar on top | Tap → LevelPreview → "Play" |
| **Locked** | 28px | Gray circle, lock icon, dim path | Tap → nothing (or subtle shake) |
| **Shop** | 40px | `icon-shop` sprite, purple tint | Tap → shows "Shop available at level X" |
| **Boss** | 52px | Boss portrait mini, red glow, larger frame | Tap → LevelPreview with boss info |

#### Node Layout (S-Curve)

```typescript
// Nodes follow an S-curve within zone bounds
const NODES_PER_ZONE = 11;
const zoneHeight = screenHeight - topBarHeight - 60; // minus top bar and dots
const nodeSpacingY = zoneHeight / (NODES_PER_ZONE + 1);

for (let i = 0; i < NODES_PER_ZONE; i++) {
  const y = topBarHeight + nodeSpacingY * (i + 1);
  const progress = i / (NODES_PER_ZONE - 1);
  // S-curve: oscillate x position
  const xCenter = columnWidth / 2;
  const amplitude = columnWidth * 0.25;
  const x = xCenter + Math.sin(progress * Math.PI * 2) * amplitude;
  nodes[i].position.set(x, y);
}
```

#### Paths Between Nodes

- Cleared path: 3px stroke, `color.accent.gold`, 100% alpha
- Current path: 3px stroke, theme `accent`, pulsing alpha 0.5→1.0 (1200ms loop)
- Locked path: 2px stroke, `color.state.locked`, dashed (8px dash, 4px gap)
- All paths use `Graphics.moveTo/bezierCurveTo` for smooth curves

#### Zone Navigation

- **Swipe horizontal**: Switch between zones with momentum + snap
- **Zone dots**: 5 dots at bottom, active = white, inactive = `color.text.muted`
- **Auto-scroll**: On entry, scroll to current zone and center on current level node
- **Pinch disabled**: No zooming — fixed scale per zone

#### LevelPreview Popup (on node tap)

```
┌──────────────────────────────────┐
│  Level 14                        │  ← text.h2
│  ★★☆                            │  ← star rating (if cleared)
│                                  │
│  Difficulty: Medium              │  ← text.body
│  Target: 45 pts                  │
│  Moves: 28                       │
│                                  │
│  Constraints:                    │  ← ConstraintBadge(s)
│  [⚡ Clear 3+ lines ×2]          │
│                                  │
│  Cube Thresholds:                │
│  ★★★ = 60pts  ★★ = 45pts        │
│  ★ = 30pts                       │
│                                  │
│       [ Play → ]                 │  ← primary button, md (if current)
│       "Cleared ✓"                │  ← text.body, green (if cleared)
└──────────────────────────────────┘
```
- Appears as a bottom sheet (slides up from bottom, 250ms `easeOutCubic`)
- Dismiss: tap outside, swipe down, or X button
- "Play" button only visible for current level

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Current level | `unpackRunData(Game.run_data)` → `currentLevel` | Torii sync |
| Star ratings | `Game.level_stars` (2 bits × 50 levels) | Torii sync |
| Zone theme bg | Current theme from `ThemeProvider` | Theme selection |
| Level details | `GameLevel` generation (deterministic from seed + level) | Computed |
| Boss identity | `GameSeed.seed` → Poseidon hash → boss index | Computed |

---

### 4.5 Play Screen (Core Gameplay)

**Entry**: Loadout confirm or Map → "Play". The most critical screen — grid + HUD + action bar.

#### Layout

```
┌──────────────────────────────────────────┐
│  [≡]   L14 ★★☆  [⚡2/5]   Moves: 24    │  ← HUD Bar (44px)
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │   Score Progress Bar               │  │  ← 8px, full width of grid
│  │   ████████████░░░░░  34/45         │  │
│  │                                    │  │
│  │  ┌──┬──┬──┬──┬──┬──┬──┬──┐       │  │
│  │  │  │██│██│  │  │██│  │  │       │  │  ← row 10 (top)
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │  │  │  │██│██│██│  │  │       │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │██│██│  │  │  │  │██│██│       │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │  │██│██│██│  │  │  │  │       │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │██│  │  │██│██│  │██│  │       │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │██│██│██│  │  │██│██│██│       │  │  ← row 5
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │  │  │██│██│██│██│  │  │       │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │██│██│  │  │██│██│██│  │       │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │██│██│██│██│  │  │██│██│       │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┤       │  │
│  │  │██│██│██│██│██│██│██│██│       │  │  ← row 1 (bottom)
│  │  └──┴──┴──┴──┴──┴──┴──┴──┘       │  │
│  │                                    │  │
│  │  [next row preview — 40% opacity]  │  │  ← 1 row, dimmed
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ [Combo]  [Score]  [Harvest]  [+]   │  │  ← Action Bar
│  │   ×3       ×5       ×2      alloc  │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

#### Grid Dimensions

```typescript
const GRID_COLS = 8;
const GRID_ROWS = 10;
const gridTargetHeight = screenHeight * 0.65; // 65% of viewport
const cellSize = Math.floor(gridTargetHeight / (GRID_ROWS + 1.5)); // +1.5 for preview row + score bar
const gridWidth = cellSize * GRID_COLS;
const gridX = (screenWidth - gridWidth) / 2; // centered
const gridY = topBarHeight + space.sm; // below HUD
```

#### Cell Rendering

Each cell contains a block sprite:
- Block value 0 = empty (transparent)
- Block value 1-4 = themed block sprite, size proportional to cell
  - `{theme}/blocks/block_{size}.png` where size = 1,2,3,4
  - Block sprite scaled to fill cell with 1px padding
  - Tinted per `themeColors.blocks[size].fill`
- Grid background: `themeColors.gridBg` filled rectangle
- Grid lines: `themeColors.gridLines` at `themeColors.gridLinesAlpha`, 1px
- Alternating cell tint: every other cell `themeColors.gridCellAlt` at 5% alpha (checkerboard)

#### HUD Bar (44px)

```
┌───────────────────────────────────────────────┐
│ [≡]  L14 ★★☆  [⚡2/5][📐3/3]    Moves: 24   │
└───────────────────────────────────────────────┘
```

| Element | Position | Font | Color | Details |
|---------|----------|------|-------|---------|
| Menu (≡) | Left, 12px inset | — | White icon, 24px | Tap → Menu modal |
| Level | Left+48px | `text.hudSmall` | White | "L14" |
| Stars | After level, 4px gap | `icon-star-*` 14px | Gold/muted | Current level star rating |
| Constraints | Center-right | ConstraintBadge (compact) | Theme accent | 1-3 badges, 20px ring |
| Moves | Right, 12px inset | `text.hud` (28px) | White, **red** at ≤3 | Moves remaining |

**Moves danger state**: When ≤ 3 moves, the number turns `color.status.danger`, pulses 0.8→1.0 alpha (800ms loop), and a subtle red vignette appears at screen edges.

#### Score Progress Bar

- Position: Immediately above grid, full grid width
- Height: 8px
- Background: `color.bg.surface` at 50%
- Fill: `color.status.success` (green gradient)
- Label: `text.hudSmall`, right-aligned above bar, "34/45"
- Star thresholds: Small gold star icons at the ★★★, ★★, ★ positions along the bar
- Animation: Fill tweens on score change (300ms, `easeOutCubic`)
- On reaching target: bar flashes gold (200ms) + `levelup.mp3`

#### Next Row Preview

- Position: Below grid, `space.xs` gap
- Renders same block sprites as grid, but at 40% alpha
- Height: 1 × cellSize
- Shows `Game.next_row` (24 bits → 8 blocks × 3 bits)
- Subtle left/right breathing animation (x oscillation ±2px, 2s loop)

#### Action Bar

```
┌────────────────────────────────────────────────┐
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌─────┐  │
│  │ [icon] │  │ [icon] │  │ [icon] │  │ [+] │  │
│  │ Combo  │  │ Score  │  │Harvest │  │alloc│  │
│  │  ×3    │  │  ×5    │  │  ×2    │  │     │  │
│  │  II    │  │  I     │  │  I     │  │     │  │
│  └────────┘  └────────┘  └────────┘  └─────┘  │
└────────────────────────────────────────────────┘
```

- Position: Bottom of screen, `space.md` from safe area bottom
- Height: 80px
- Background: `themeColors.actionBarBg` at 90% alpha, 16px top corner radius
- Slots: 3 × BonusSlot + 1 AllocateButton (if `unallocatedCharges > 0`)
- BonusSlot spec: see Section 3.7
- **NoBonusUsed constraint**: Red slash overlay (45° line, `color.status.danger`, 60% alpha) on all slots. Tapping shows toast: "No bonuses allowed this level!"

#### Block Interaction (Drag/Swipe)

```
Touch Start → identify touched row (y → row index)
Touch Move  → delta.x determines block displacement
             → blocks in row shift, wrapping at edges
Touch End   → snap to nearest column
             → if position changed: call systems.move(row, startCol, endCol)
             → optimistic: animate immediately, revert on tx fail
```

**Drag behavior**:
- Touch only affects blocks in the touched row
- Blocks slide continuously during drag (pixel-perfect tracking)
- On release: snap to nearest column position (100ms, `easeOutCubic`)
- Wrap-around: blocks exiting right edge appear on left (and vice versa)
- Visual: dragged row elevates slightly (y-2px) with subtle shadow during drag
- DragTrail: faint trail particles follow finger (theme `particles.primary` colors)

**Tap vs Drag threshold**: 8px. Movement < 8px = tap (no move). ≥ 8px = drag.

#### Combo Display

When `combo_counter ≥ 2`, centered text overlay appears:

| Combo | Text | Size | Color | Extra |
|-------|------|------|-------|-------|
| 2-3 | "×2 COMBO" | 40px | `color.accent.gold` | Slide in from right, 500ms hold |
| 4-5 | "×4 COMBO!" | 52px | `color.accent.orange` | + screen shake (amplitude: 4px) |
| 6-7 | "INCREDIBLE!" | 56px | `color.accent.purple` | + screen shake (8px) + particle burst |
| 8+ | "LEGENDARY!" | 64px | Cycling gold→white | + epic shake (12px) + full confetti |

Animation: Text scales 0→1.3→1.0 (300ms, `easeOutBack`), holds 800ms, fades out (200ms).

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Grid blocks | `Game.blocks` (felt252 → 8×10 array) | Torii sync + optimistic |
| Next row | `Game.next_row` (u32 → 8 block values) | Torii sync |
| Score/Moves | `unpackRunData(Game.run_data)` → `levelScore`, `levelMoves` | Torii sync |
| Combo | `Game.combo_counter` (u8) | Torii sync |
| Constraints | `GameLevel` computed + `runData.constraintProgress/2/3` | Computed + sync |
| Bonus charges | `runData.comboCount`, `scoreCount`, `harvestCount`, `waveCount`, `supplyCount` | Torii sync |
| Unallocated | `runData.unallocatedCharges` | Torii sync |
| Level | `runData.currentLevel` | Torii sync |
| Star thresholds | `GameLevel` → points for ★/★★/★★★ | Computed |

---

### 4.6 Boss Level (Gameplay Variant)

**Entry**: Auto-triggered when `currentLevel` is 10, 20, 30, 40, or 50.

Same as Play Screen (4.5) with these modifications:

#### Boss Intro Sequence (pre-gameplay)

```
┌──────────────────────────────────────────┐
│                                          │
│   [dark overlay, 80% opacity]            │
│                                          │
│          ┌────────────┐                  │
│          │ [Boss      │                  │  ← Boss portrait, 160×160
│          │  Portrait] │                  │
│          └────────────┘                  │
│                                          │
│        "THE TIKI GUARDIAN"               │  ← text.display (48px), gold
│                                          │
│   Constraints:                           │
│   [⚡ Clear 4+ lines ×3]                 │  ← ConstraintBadge
│   [🚫 No Bonus Used]                     │  ← ConstraintBadge
│                                          │
│   Bonus: +30 CUBE                        │  ← text.h3, gold, with cube icon
│                                          │
│         [ Fight! ]                       │  ← danger button, lg
│                                          │
└──────────────────────────────────────────┘
```

- Duration: Stays until "Fight!" tapped (no auto-dismiss)
- Boss portrait: `/assets/{theme}/boss/portrait.png`
- Boss name: Determined by boss identity (from seed)
- Music: Crossfade from map BGM to boss BGM (1s fade)

#### Boss HUD Modifications

- HUD bar background tinted `color.status.danger` at 15%
- Boss portrait mini (24px) replaces level text
- Boss name shown instead of "L10"
- Red pulsing border around the entire grid (subtle, 1px, 40% alpha, 1200ms loop)

#### Boss Defeat → Level-Up Selection

When boss level cleared, instead of standard Level Complete:
1. Grid shatters (1s cinematic animation — blocks scatter outward with physics)
2. Boss portrait cracks and fades
3. "+30 CUBE" gold text flies to CubeBalance counter
4. Transition to Boss Level-Up Selection modal (see Section 6)

---

### 4.7 In-Game Shop

**Entry**: Auto-triggered when completing level 9, 19, 29, 39, or 49 (before boss).

**Type**: Full-screen overlay (not a small modal — important decisions here).

#### Layout

```
┌──────────────────────────────────────────┐
│                                          │
│          "Trail Shop"                    │  ← text.h1, centered
│          [cube] Available: 87            │  ← CubeBalance
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Bonus Charge                      │  │  ← Card
│  │  Add +1 charge to any bonus        │  │
│  │  Cost: 5 CUBE                      │  │  ← escalating cost
│  │  Purchased: 2 this visit           │  │
│  │              [ Buy ]               │  │  ← confirm button, md
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Level Up                          │  │  ← Card
│  │  Upgrade one bonus to next level   │  │
│  │  Cost: 50 CUBE                     │  │
│  │  [Already purchased ✓]             │  │  ← or disabled if bought
│  │              [ Buy ]               │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Swap Bonus                        │  │  ← Card
│  │  Replace one equipped bonus        │  │
│  │  Cost: 50 CUBE                     │  │
│  │              [ Buy ]               │  │
│  └────────────────────────────────────┘  │
│                                          │
│         [ Continue → ]                   │  ← secondary button, lg
│                                          │
└──────────────────────────────────────────┘
```

#### Shop Item Behavior

| Item | Contract Call | Max Per Visit | Cost |
|------|-------------|---------------|------|
| Bonus Charge | `purchaseConsumable(BonusCharge)` | Unlimited (escalating cost) | 5→8→12→18→27... CUBE |
| Level Up | `purchaseConsumable(LevelUp)` | 1 | 50 CUBE |
| Swap Bonus | `purchaseConsumable(SwapBonus)` | 1 | 50 CUBE |

**After buying Bonus Charge**: Opens Allocate Charges modal (choose which bonus to add charge to).
**After buying Level Up**: Opens Level-Up Selection modal (choose which bonus to upgrade).
**After buying Swap Bonus**: Opens Swap modal (select equipped bonus → select replacement from non-equipped).

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Available cubes | `getCubesAvailable(runData)` | After each purchase |
| Charge cost | `getBonusChargeCost(runData.shopPurchases)` | After each charge purchase |
| Level Up bought | `runData.shopLevelUpBought` | After purchase |
| Swap bought | `runData.shopSwapBought` | After purchase |
| Purchase count | `runData.shopPurchases` | After each charge purchase |

---

### 4.8 Level Complete (Modal)

**Entry**: Score target reached and all constraints met.

#### Layout

```
┌──────────────────────────────────────────┐
│                                          │
│   [backdrop 60% black]                   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │       "Level 14 Clear!"         │   │  ← text.h1, white
│   │                                  │   │
│   │          ★ ★ ☆                   │   │  ← StarRating (animated)
│   │                                  │   │
│   │    Score: 52/45                  │   │  ← text.h3
│   │    Moves left: 8                 │   │  ← text.body, green if > 0
│   │    Combo best: ×4               │   │  ← text.body
│   │                                  │   │
│   │    Cubes earned: +12             │   │  ← text.h3, gold + cube icon
│   │                                  │   │
│   │    Constraints: ✓ ✓              │   │  ← green checkmarks
│   │                                  │   │
│   │       [ Next Level → ]           │   │  ← primary button, lg
│   │                                  │   │
│   └──────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

#### Animations (Choreographed Sequence)

| Time | Element | Animation |
|------|---------|-----------|
| 0ms | Backdrop | Fade in 0→60% (300ms) |
| 100ms | "Level X Clear!" | Scale 0.8→1.0 + fade in (300ms, `easeOutCubic`) |
| 400ms | Star 1 | Pop in 0→1.2→1.0 (400ms, `easeOutBack`) + `star.mp3` |
| 600ms | Star 2 | Pop in (same) + `star.mp3` |
| 800ms | Star 3 (if earned) | Pop in (same) + `star.mp3` (higher pitch) |
| 1000ms | Stats | Fade in, score counts up (500ms) |
| 1200ms | Cube earned | Gold glow + cube icon flies to top bar (600ms arc) |
| 1500ms | "Next Level" button | Fade in + subtle pulse |

#### Special: Boss Level Clear

If level was a boss level, replace "Next Level" with boss defeat sequence (Section 4.6). After level-up selection, auto-advances.

#### Special: Shop Available

If next level is a shop level (9→10 boundary): button reads "Shop →" instead of "Next Level →".

---

### 4.9 Boss Level-Up Selection (Modal)

**Entry**: After defeating a boss OR purchasing Level Up in shop.

#### Layout

```
┌──────────────────────────────────────────┐
│                                          │
│   [backdrop 60% black]                   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │     "Level Up a Bonus!"          │   │  ← text.h1, gold
│   │     Choose one to upgrade        │   │  ← text.body, secondary
│   │                                  │   │
│   │  ┌──────────────────────────┐    │   │
│   │  │  [icon] Combo            │    │   │  ← Card
│   │  │  Level I → Level II      │    │   │  ← current → next
│   │  │  +1 → +2 combo added    │    │   │  ← effect description
│   │  │          [ Upgrade ]     │    │   │  ← confirm button
│   │  └──────────────────────────┘    │   │
│   │                                  │   │
│   │  ┌──────────────────────────┐    │   │
│   │  │  [icon] Score            │    │   │
│   │  │  Level I → Level II      │    │   │
│   │  │  +10 → +20 score        │    │   │
│   │  │          [ Upgrade ]     │    │   │
│   │  └──────────────────────────┘    │   │
│   │                                  │   │
│   │  ┌──────────────────────────┐    │   │
│   │  │  [icon] Harvest          │    │   │  ← greyed if already max
│   │  │  Level III (MAX)         │    │   │
│   │  │  Already at maximum      │    │   │
│   │  │          [  MAX  ]       │    │   │  ← disabled
│   │  └──────────────────────────┘    │   │
│   │                                  │   │
│   └──────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

#### Upgrade Card Details

| Bonus | Level I → II | Level II → III |
|-------|-------------|----------------|
| Combo | +1 → +2 combo | +2 → +3 combo |
| Score | +10 → +20 score | +20 → +30 score |
| Harvest | +1 → +2 CUBE/block | +2 → +3 CUBE/block |
| Wave | 1 → 2 rows cleared | 2 → 3 rows cleared |
| Supply | 1 → 2 lines added | 2 → 3 lines added |

**Interaction**: Tap "Upgrade" on a card → confirm animation (card glows gold, level indicator animates I→II) → modal dismisses → game continues.

**Must choose**: This modal is blocking. Player MUST select one upgrade (unless all are maxed, in which case auto-dismiss with toast "All bonuses maxed!").

---

### 4.10 Run Complete (Victory — Level 50)

**Entry**: Clearing level 50 (the final boss).

#### Layout

```
┌──────────────────────────────────────────┐
│                                          │
│        [confetti particles]              │
│                                          │
│        "VICTORY!"                        │  ← text.display (48px), cycling gold
│                                          │
│   ┌──────────────────────────────────┐   │
│   │        Run Summary               │   │
│   │                                  │   │
│   │  Total Score: 2,847              │   │  ← count-up animation
│   │  Levels: 50/50                   │   │
│   │  Best Combo: ×7                  │   │
│   │                                  │   │
│   │  Stars:                          │   │
│   │  ★★★: 32  ★★: 14  ★: 4          │   │  ← star breakdown
│   │                                  │   │
│   │  Cubes Earned: +247              │   │  ← gold, large, with icon
│   │                                  │   │
│   │  Bonuses Used:                   │   │
│   │  [Combo III] [Score II] [Harv I] │   │  ← mini bonus icons with levels
│   └──────────────────────────────────┘   │
│                                          │
│        [ New Run → ]                     │  ← primary button, lg
│        [ Home ]                          │  ← ghost button, md
│                                          │
└──────────────────────────────────────────┘
```

#### Animations

- Confetti: 200+ particles, 10s duration, gold/white/theme-accent colors, gravity fall
- "VICTORY!" text: Scale 0→2→1 (800ms, `easeOutBack`) + color cycling (gold→white→gold, 2s loop)
- Score: Counts up from 0 to total (1500ms, `easeOutCubic`)
- Cubes: Counts up with `coin.mp3` per increment, then coin fly arc to top
- Stars: Each category pops in sequentially (200ms stagger)
- Music: `victory.mp3` plays (overrides all other BGM)

---

### 4.11 Game Over

**Entry**: Moves reach 0 with score below target, or grid overflow.

#### Layout

```
┌──────────────────────────────────────────┐
│                                          │
│   [dark overlay, 80%]                    │
│                                          │
│        "Run Over"                        │  ← text.h1, muted red
│        Reached Level 14                  │  ← text.h3, secondary
│                                          │
│   ┌──────────────────────────────────┐   │
│   │        Run Summary               │   │
│   │                                  │   │
│   │  Total Score: 847                │   │
│   │  Levels Cleared: 13             │   │
│   │  Best Combo: ×4                  │   │
│   │                                  │   │
│   │  Stars: ★★★:8 ★★:4 ★:1          │   │
│   │                                  │   │
│   │  Cubes Earned: +34               │   │  ← gold
│   └──────────────────────────────────┘   │
│                                          │
│        [ Try Again → ]                   │  ← secondary button, lg
│        [ Home ]                          │  ← ghost button, md
│                                          │
└──────────────────────────────────────────┘
```

#### Animations

- Grid darkens from bottom to top (sweep, 500ms)
- "Run Over" fades in with subtle downward drift (y+10px over 300ms)
- Stats fade in (200ms stagger per line)
- Cubes earned still animate with coin fly (even on game over — reward the attempt)
- Music: `over.mp3` (somber but not punishing)
- "Try Again" → navigates to Loadout (preserves last selection)
- "Home" → navigates to Hub

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Level reached | `runData.currentLevel` | Final state |
| Total score | `runData.totalScore` | Final state |
| Stars per level | `Game.level_stars` decoded | Final state |
| Cubes earned | `runData.totalCubes` | Final state (minted on-chain) |
| Best combo | `runData.maxComboRun` | Final state |

---

### 4.12 Daily Challenge (Future)

**Entry**: Hub → "Daily" tile.

**Concept**: A single daily level with unique constraints. All players get the same seed. Leaderboard ranks by score.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]    "Daily Challenge"    [cube] 142  │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Today's Challenge                 │  │
│  │                                    │  │
│  │  Difficulty: Hard                  │  │
│  │  Constraints:                      │  │
│  │  [⚡ Clear 5+ lines ×3]            │  │
│  │  [🚫 No Bonus Used]                │  │
│  │                                    │  │
│  │  Resets in: 14h 23m                │  │  ← countdown timer
│  │                                    │  │
│  │       [ Play → ]                   │  │
│  │       or "Completed ✓" + score     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Today's Leaderboard                     │
│  ┌────────────────────────────────────┐  │
│  │  1. [crown] Player_A    1,247     │  │
│  │  2. [medal] Player_B    1,102     │  │
│  │  3. [medal] Player_C      998    │  │
│  │  ...                              │  │
│  │  42. You               847        │  │  ← highlighted
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

**Note**: This screen is not yet implemented in contracts. UI design provided for future implementation. Contract would need a daily seed mechanism and separate leaderboard.

---

### 4.13 Permanent Shop

**Entry**: Hub → "Shop" tile.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]       "Shop"           [cube] 142   │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  STARTING BONUSES                        │  ← section title
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  [icon] Combo Starting Charges   │    │  ← Card
│  │  Current: 3  →  Next: 4          │    │
│  │  Cost: 15 CUBE                   │    │
│  │  ████████░░ Level 3/5            │    │  ← ProgressBar
│  │               [ Upgrade ]        │    │  ← confirm button
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  [icon] Score Starting Charges   │    │
│  │  Current: 2  →  Next: 3          │    │
│  │  Cost: 10 CUBE                   │    │
│  │  ██████░░░░ Level 2/5            │    │
│  │               [ Upgrade ]        │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [... repeat for Harvest, Wave, Supply]  │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  BAG SIZE                                │  ← section title
│  ┌──────────────────────────────────┐    │
│  │  [icon] Bonus Bag Capacity       │    │
│  │  Current: 10  →  Next: 15        │    │
│  │  Cost: 25 CUBE                   │    │
│  │  ██████████░░░ Level 2/3         │    │
│  │               [ Upgrade ]        │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  BRIDGING                                │  ← section title
│  ┌──────────────────────────────────┐    │
│  │  [icon] Cube Bridging Rank       │    │
│  │  Current: 25 cubes  →  50 cubes  │    │
│  │  Cost: 30 CUBE                   │    │
│  │  ████░░░░░░ Rank 1/4             │    │
│  │               [ Upgrade ]        │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  UNLOCK BONUSES                          │  ← section title
│  ┌──────────────────────────────────┐    │
│  │  [icon] Unlock Wave              │    │
│  │  "Clears entire rows"            │    │
│  │  Cost: 100 CUBE                  │    │
│  │               [ Unlock ]         │    │  ← or "Unlocked ✓"
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  [icon] Unlock Supply            │    │
│  │  "Adds new lines for free"       │    │
│  │  Cost: 100 CUBE                  │    │
│  │               [ Unlock ]         │    │
│  └──────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

**Scrolling**: Content exceeds viewport. Use PixiJS mask + touch drag for vertical scrolling (inertia + bounce at edges). Scroll indicator (thin bar, right edge, fades after 2s inactivity).

#### Shop Card Spec

```
┌──────────────────────────────────────────┐
│  [icon]  Title                    [MAX]  │  ← 24px icon + text.h3 + optional badge
│  Current: X  →  Next: Y                 │  ← text.body, secondary → white
│  Cost: Z CUBE                            │  ← text.body, gold + cube icon
│  ████████░░  Level N/M                   │  ← ProgressBar, 8px
│                          [ Upgrade ]     │  ← confirm button, sm
└──────────────────────────────────────────┘
```
- Padding: `space.md` all sides
- Background: `panel-dark` 9-slice
- MAX state: Badge = "MAX" in green pill, button disabled, progress bar full + green

#### Interactions

| Action | Handler | Result |
|--------|---------|--------|
| Tap "Upgrade" / "Unlock" | Call `systems.shop.upgrade(upgradeType)` | Loading → coin fly → card updates |
| Tap card (insufficient cubes) | Toast: "Need X more cubes" | Button stays disabled |
| Scroll | Vertical touch drag | Content scrolls with inertia |

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| All upgrade levels | `usePlayerMeta()` → `data` (bit-packed) | Torii sync |
| Cube balance | `useCubeBalance()` | Torii sync |
| Costs | Hardcoded per upgrade tier (from contract constants) | Static |

---

### 4.14 Quest Screen

**Entry**: Hub → "Quests" tile.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]      "Quests"          [cube] 142   │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  Resets in: 14h 23m                      │  ← countdown, text.caption
│                                          │
│  PLAYER QUESTS                           │  ← section title
│  ┌──────────────────────────────────┐    │
│  │  Warm-Up                         │    │
│  │  Play 1 game                     │    │
│  │  ████████████████ 1/1  ✓         │    │  ← completed
│  │  +3 CUBE              [Claimed]  │    │  ← already claimed
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │  Getting Started                 │    │
│  │  Play 3 games                    │    │
│  │  ████████░░░░░░░ 2/3             │    │  ← in progress
│  │  +6 CUBE                         │    │
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │  Dedicated                       │    │
│  │  Play 5 games                    │    │
│  │  ████░░░░░░░░░░░ 2/5             │    │
│  │  +12 CUBE                        │    │
│  └──────────────────────────────────┘    │
│                                          │
│  CLEARER QUESTS                          │
│  [... Clear 10/30/50 lines cards ...]    │
│                                          │
│  COMBO QUESTS                            │
│  [... 3+/5+/7+ combo cards ...]          │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  🏆 Daily Champion               │    │  ← gold border card
│  │  Complete all 9 quests            │    │
│  │  ████████████░░░ 7/9              │    │
│  │  +25 CUBE             [Claim]    │    │  ← gold button when complete
│  └──────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

#### Quest Card States

| State | Visual |
|-------|--------|
| In progress | Default card. Progress bar partially filled. Reward text visible. |
| Completed (unclaimed) | Green checkmark. Gold "Claim" button pulsing. |
| Claimed | Muted card. "Claimed ✓" text. No button. |

#### Claim Animation

1. Tap "Claim" → button becomes spinner (200ms)
2. `systems.quest.claim(questId)` tx
3. On success: Card flashes gold (200ms) → cube icon flies from card to CubeBalance (600ms arc) → balance count-up
4. Card transitions to "Claimed" state

#### Data Bindings

| UI Element | Source | Update Trigger |
|------------|--------|---------------|
| Quest progress | `useQuestProgress()` (from QuestsProvider) | Torii sync |
| Claim status | Quest model per player | Torii sync |
| Reset timer | Server time → next UTC midnight | 1s interval |
| Cube balance | `useCubeBalance()` | After claim tx |

---

### 4.15 Profile & Achievements

**Entry**: Hub → 🏆 icon.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]      "Profile"         [cube] 142   │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  [avatar/identicon]               │  │  ← 64px, from Controller
│  │  Player_Name                      │  │  ← text.h2
│  │                                   │  │
│  │  Games: 127  |  Best: L34         │  │  ← text.body, secondary
│  │  Total Stars: ★ 247               │  │  ← gold
│  └────────────────────────────────────┘  │
│                                          │
│  ACHIEVEMENTS                            │  ← section title
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │  ← 4-column grid
│  │[icon]│ │[icon]│ │[icon]│ │[🔒] │   │
│  │ Gold │ │ Gold │ │Silver│ │Lockd │   │
│  │10/10 │ │25/25 │ │ 42/50│ │0/100│   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │[icon]│ │[icon]│ │[icon]│ │[🔒] │   │
│  │Bronze│ │ Gold │ │Lockd │ │Lockd │   │
│  │10/10 │ │100/  │ │ 3/25 │ │ 0/50│   │
│  │      │ │ 100  │ │      │ │     │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                          │
│  [... more achievement rows ...]         │
│                                          │
└──────────────────────────────────────────┘
```

#### Achievement Tile States

| State | Visual |
|-------|--------|
| Earned (Gold) | Full-color icon + gold border + shine shimmer (subtle, 3s loop) |
| Earned (Silver) | Full-color icon + silver border |
| Earned (Bronze) | Full-color icon + bronze border |
| In Progress | Silhouette icon + progress text ("42/100") + dim border |
| Locked | Lock icon + "0/X" + `color.state.locked` tint |

**Achievement Tile Size**: `(columnWidth - 3×space.sm) / 4` square (~80px)

#### Achievement Detail (on tap)

Bottom-sheet popup showing:
- Full achievement name + description
- Progress bar
- Tier thresholds (Bronze at X, Silver at Y, Gold at Z)
- Current progress: "42 of 100 lines cleared"

---

### 4.16 Settings (Modal)

**Entry**: Hub → ⚙ icon. Appears as modal overlay.

#### Layout

```
┌──────────────────────────────────────────┐
│  [backdrop 60% black]                    │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  "Settings"              [×]     │   │  ← text.h2 + close button
│   │                                  │   │
│   │  Music Volume                    │   │
│   │  [🔇 ────────○──── 🔊]          │   │  ← slider 0-100
│   │                                  │   │
│   │  Effects Volume                  │   │
│   │  [🔇 ────────────○ 🔊]          │   │  ← slider 0-100
│   │                                  │   │
│   │  ──────────────────────────      │   │
│   │                                  │   │
│   │  Theme                           │   │
│   │  ┌────┐┌────┐┌────┐┌────┐┌────┐ │   │  ← 5×2 grid of theme icons
│   │  │Tiki││Cosm││East││Maya││Cybr│ │   │
│   │  └────┘└────┘└────┘└────┘└────┘ │   │
│   │  ┌────┐┌────┐┌────┐┌────┐┌────┐ │   │
│   │  │Medv││Egyp││Volc││Trib││Arct│ │   │
│   │  └────┘└────┘└────┘└────┘└────┘ │   │
│   │                                  │   │
│   │  ──────────────────────────      │   │
│   │                                  │   │
│   │  Reduce Motion  [ toggle ]       │   │  ← toggle switch
│   │                                  │   │
│   │  ──────────────────────────      │   │
│   │                                  │   │
│   │  Account                         │   │
│   │  [address truncated]    [copy]   │   │  ← only for secondary audience
│   │                                  │   │
│   └──────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

#### Theme Selector

- Each theme: 48×48 square with theme-representative icon/color
- Active: 2px accent border + checkmark badge
- Tap: Immediate preview — background colors change, block themes swap
- Persisted to `localStorage('zkube_theme')`

#### Volume Sliders

- Track: 4px, `color.bg.surface`
- Fill: `color.text.primary`
- Thumb: 20px circle, white
- Change: Immediate. Persisted to `localStorage`.
- Mute icon: tapping toggles volume between 0 and last value

#### Toggle (Reduce Motion)

- 48×24 pill shape
- Off: `color.bg.surface` with left-aligned 20px circle
- On: `color.status.success` with right-aligned 20px circle
- Transition: 200ms slide
- Effect: Enables all reduced motion alternatives (see Section 3.8)

---

### 4.17 Leaderboard

**Entry**: Hub → "Leaderboard" tile.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]    "Leaderboard"       [cube] 142   │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  [All Time]  [This Week]  [Today]        │  ← tab bar (3 segments)
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  1 [crown] Player_Alpha    4,271  │  │  ← gold row
│  │  2 [medal] Player_Beta     3,892  │  │  ← silver row
│  │  3 [medal] Player_Gamma    3,554  │  │  ← bronze row
│  │  4         Player_Delta    3,201  │  │
│  │  5         Player_Epsilon  2,987  │  │
│  │  ...                              │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  42. You                    847   │  │  ← sticky bottom, highlighted
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

#### Leaderboard Row

- Height: 48px
- Rank: `text.h3`, 32px width, right-aligned
- Icon: Crown (gold) for #1, medal (silver) for #2, medal (bronze) for #3
- Name: `text.body`, truncated with ellipsis at 160px
- Score: `text.h3`, right-aligned, gold for top 3
- Player's own row: `color.accent.blue` background at 15%, sticky at bottom of viewport

#### Tab Bar

- 3 segments: "All Time", "This Week", "Today"
- Active: `color.accent.orange` underline (3px), white text
- Inactive: `color.text.secondary`, no underline
- Tap: Crossfade list content (200ms)

---

### 4.18 My Games

**Entry**: Hub → "My Games" tile.

#### Layout

```
┌──────────────────────────────────────────┐
│  [←]      "My Games"        [cube] 142   │  ← TopBar
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Game #1 (Active)                 │  │  ← green border = active
│  │  Level 14 — Score 847             │  │
│  │  ★★☆  [Combo][Score][Harvest]     │  │
│  │              [ Continue → ]       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Game #2 (Completed)              │  │
│  │  Level 50 — Score 4,271           │  │
│  │  ★★★ 142                         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Game #3 (Game Over)              │  │
│  │  Level 22 — Score 1,203           │  │
│  │  ★★☆ 34 earned                   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [... more game cards ...]               │
│                                          │
└──────────────────────────────────────────┘
```

**Game Card**: Shows token ID, final state (active/completed/over), level reached, score, star summary, cubes earned. Active game has green border and "Continue" button.

---

### 4.19 Tutorial

**Entry**: Hub → ? icon.

#### Layout

Same as Onboarding (4.1) steps 1-3, but accessible at any time. No "Sign In" — ends with "Got it!" button that dismisses back to Hub.

Additional tutorial steps for experienced players:
- Step 4: "Bonuses" — Shows 5 bonus types with descriptions
- Step 5: "The Shop" — Permanent upgrades and in-game shop
- Step 6: "Daily Quests" — How to earn daily cubes

---

## 6. Modal Specifications

### 6.1 Menu Modal (In-Game)

**Trigger**: Tap ≡ button during gameplay.

```
┌──────────────────────────────┐
│         "Paused"             │  ← text.h2
│                              │
│      [ Resume ]              │  ← primary button, lg (full width)
│                              │
│  🔊 Music  ────○────         │  ← inline slider
│  🔊 Effects ──────○──        │  ← inline slider
│                              │
│     [ Surrender ]            │  ← danger button, md
│                              │
└──────────────────────────────┘
```

- Backdrop: 60% black
- "Resume": Dismisses modal, game continues
- "Surrender": Opens Surrender Confirm sub-modal
- Volume sliders: Same behavior as Settings

### 6.2 Surrender Confirm Modal

**Trigger**: Tap "Surrender" in Menu.

```
┌──────────────────────────────┐
│     "Abandon Run?"           │  ← text.h2, danger color
│                              │
│  You'll keep cubes earned    │  ← text.body, secondary
│  so far (+34 cubes).         │
│                              │
│    [ Cancel ]  [ Surrender ] │  ← ghost + danger buttons
│                              │
└──────────────────────────────┘
```

- "Cancel": Returns to Menu modal
- "Surrender": Calls `systems.surrender()` → Game Over screen

### 6.3 Allocate Charges Modal

**Trigger**: Tap [+] in action bar (when `unallocatedCharges > 0`), or after buying Bonus Charge in shop.

```
┌──────────────────────────────┐
│   "Allocate Charges"         │  ← text.h2
│   Charges to assign: 3       │  ← text.body, gold
│                              │
│  ┌────────────────────────┐  │
│  │ [icon] Combo   ×3 [+] │  │  ← bonus row + add button
│  │ [icon] Score   ×5 [+] │  │
│  │ [icon] Harvest ×2 [+] │  │
│  └────────────────────────┘  │
│                              │
│         [ Done ]             │  ← primary button, md
│                              │
└──────────────────────────────┘
```

- Each [+] button: Increments that bonus's charge count by 1, decrements unallocated by 1
- When unallocated reaches 0: Auto-dismiss or "Done" button
- Animation: Each [+] tap → charge number pops (scale 1→1.2→1, 200ms)
- Only shows the 3 equipped bonuses (not all 5)

### 6.4 Bonus Targeting Modal (Harvest / Wave)

**Trigger**: Tap Harvest or Wave bonus in action bar.

**Not a traditional modal** — overlay on the grid itself:

- Grid darkens slightly (20% overlay)
- Valid targets highlight with pulsing glow
  - **Harvest**: All blocks of each size highlight in groups. Tap a block to select that size.
  - **Wave**: Row indicators appear on left side of grid. Tap a row number to clear that row.
- Cancel: Tap outside grid, or tap the bonus slot again
- Confirm: Tap on target → `systems.applyBonus(bonusType, target)` → animation plays

### 6.5 Swap Bonus Modal

**Trigger**: After purchasing "Swap Bonus" in In-Game Shop.

```
┌──────────────────────────────┐
│   "Swap a Bonus"             │
│                              │
│   Select bonus to remove:    │
│   [Combo II]  [Score I]  [Harvest I]  │  ← current 3
│                              │
│   Select replacement:        │
│   [Wave I]  [Supply I]       │  ← non-equipped available
│                              │
│   [ Confirm Swap ]           │  ← confirm button, disabled until both selected
│                              │
└──────────────────────────────┘
```

- Step 1: Tap equipped bonus to remove (highlight with red border)
- Step 2: Tap replacement bonus (highlight with green border)
- Confirm: Swaps the two, updates run_data

### 6.6 Transaction Loading Overlay

**Trigger**: Any blockchain transaction in progress.

```
┌──────────────────────────────────────────┐
│                                          │
│   [semi-transparent overlay, 40%]        │
│                                          │
│          [spinning loader]               │  ← 32px, white, rotating
│          "Processing..."                 │  ← text.body, white
│                                          │
└──────────────────────────────────────────┘
```

- Blocks all interaction
- Auto-dismiss on tx success
- After 10s: "Taking longer than expected..." + "Retry" button
- After tx failure: Red toast: "Something went wrong. Tap to retry."

---

## 7. Animation & Effects System

### 7.1 Line Clear Sequence

**Duration**: 500ms total

| Time | Action | Visual |
|------|--------|--------|
| 0ms | Line detected | Completed row flashes white (alpha overlay 0→0.8, 100ms) |
| 100ms | Sweep | White sweep travels left→right across the row (200ms) |
| 300ms | Blocks dissolve | Each block in the row: `scale 1→0.3`, `alpha 1→0`, staggered 20ms per block left-to-right |
| 300ms | Particles | Per-block burst: 6-8 particles in block's color, radial spread, 500ms lifetime |
| 350ms | Score popup | "+5" text rises from row center, `scale 0→1`, drift up 40px, fade out over 400ms |
| 500ms | Collapse | Blocks above fall down (GRAVITY state, 300ms, `easeOutBounce`) |

**Multi-line clear**: Each line's sweep starts 50ms after the previous. Score popup shows total ("+15" for 3 lines).

### 7.2 Combo Celebration Tiers

| Combo | Screen Shake | Particles | Text | Sound |
|-------|-------------|-----------|------|-------|
| 2-3 | None | 20 gold sparks | "×2 COMBO" yellow 40px | `break.mp3` |
| 4-5 | 4px, 200ms | 40 sparks + 10 stars | "×4 COMBO!" orange 52px | `explode.mp3` |
| 6-7 | 8px, 300ms | 60 sparks + 20 stars + rings | "INCREDIBLE!" purple 56px | `explode.mp3` (louder) |
| 8+ | 12px, 400ms | 100+ confetti + shockwave ring | "LEGENDARY!" 64px cycling | `victory.mp3` (snippet) |

**Screen shake**: Dampening sine wave on container position. `amplitude × sin(t × freq) × (1 - t/duration)`.

```typescript
// Screen shake implementation
function shake(container: Container, amplitude: number, duration: number) {
  const freq = 30; // Hz
  const startTime = performance.now();
  const ticker = (dt: number) => {
    const elapsed = performance.now() - startTime;
    const t = elapsed / duration;
    if (t >= 1) { container.position.set(0, 0); return; }
    const decay = 1 - t;
    container.x = amplitude * Math.sin(t * freq) * decay;
    container.y = (amplitude * 0.5) * Math.sin(t * freq * 0.7) * decay;
  };
  app.ticker.add(ticker);
}
```

### 7.3 Boss Intro Animation

| Time | Action |
|------|--------|
| 0ms | Screen fades to 80% dark (500ms) |
| 500ms | Boss portrait slides in from right, `easeOutCubic` (400ms) |
| 900ms | Boss name text fades in, letter by letter (30ms per char) |
| 1200ms | Constraints badges pop in sequentially (200ms each, `easeOutBack`) |
| 1600ms | CUBE bonus text fades in (gold glow) |
| 1800ms | "Fight!" button slides up from bottom (300ms) |

**Boss BGM**: Crossfade from level BGM to boss BGM starting at 0ms (1s crossfade).

### 7.4 Boss Defeat Animation

| Time | Action |
|------|--------|
| 0ms | Grid freezes. Last line clear plays normally. |
| 500ms | Grid blocks shatter outward (physics sim: random velocity, gravity, rotation, 800ms) |
| 500ms | Boss portrait cracks (fracture shader or pre-rendered frames, 500ms) |
| 1000ms | White flash (100ms, alpha 0→0.6→0) |
| 1100ms | Boss portrait fragments fall away |
| 1300ms | "+X CUBE" gold text center, scale 0→1.5→1 (400ms, `easeOutBack`) |
| 1500ms | Cube icon flies to CubeBalance (600ms arc) |
| 2100ms | Transition to Level-Up Selection |

### 7.5 Level Transition

| Time | Action |
|------|--------|
| 0ms | Current grid fades out (200ms, `alpha 1→0`) |
| 200ms | Level number in HUD animates: old number slides up + fades, new slides up from below (300ms) |
| 300ms | New grid fades in (200ms, `alpha 0→1`) |
| 500ms | New constraint badges pop in |
| 600ms | WAITING state — player can interact |

### 7.6 Cube Earning Animation

**Trigger**: Any cube reward (level clear, combo bonus, quest claim, boss bonus).

```
Source position → Arc path → CubeBalance position

Path: Bezier curve
  start: source (e.g., score popup position)
  control: midpoint + 60px above
  end: CubeBalance icon in top bar

Duration: 600ms
Easing: easeInCubic (accelerates toward target)
Scale: 1.0 → 0.5 (shrinks as it approaches)
On arrival: CubeBalance number does count-up tween (300ms) + subtle gold pulse
```

Multiple cubes: Stagger 50ms apart, max 10 visible. If > 10, show batch (single large cube icon + "+47").

### 7.7 Star Rating Animation

**At level complete**:

```
Star 1: delay 400ms → scale 0→1.3→1.0 (400ms, easeOutBack) + star.mp3
Star 2: delay 600ms → same + star.mp3 (slightly higher pitch)
Star 3: delay 800ms → same + star.mp3 (highest pitch) + gold particle burst (20 particles)

Empty star: scale 0→1.0 (200ms, easeOutCubic) — no sound, muted color
```

### 7.8 Particle System Specs

#### Particle Types

| Type | Count | Size | Lifetime | Velocity | Gravity | Colors |
|------|-------|------|----------|----------|---------|--------|
| **Line clear** | 6-8 per block | 4-8px | 500ms | 60-120 px/s radial | 0 | Block's theme colors |
| **Combo sparks** | 20-100 | 3-6px | 600ms | 80-200 px/s radial | 50 px/s² | Gold, white, accent |
| **Star burst** | 12 | 8-12px | 400ms | 100-150 px/s | 0 | Gold |
| **Confetti** | 100-200 | 6-10px | 2000ms | 50-150 px/s | 80 px/s² | Random from theme palette |
| **Coin trail** | 4 per coin | 3px | 300ms | 0 (follows coin) | 0 | Gold, alpha fade |
| **Boss shatter** | 50+ | 8-20px | 800ms | 150-300 px/s | 120 px/s² | Theme colors |

#### Particle Behavior

- All particles: `alpha` fades from 1→0 over lifetime
- All particles: `scale` shrinks from 1→0.3 over lifetime
- Rotation: Random initial rotation + rotational velocity (0-360°/s)
- Shape: Squares (4px) for sparks, circles (3px) for trails, rectangles (6×10px) for confetti
- Rendering: `ParticleContainer` for performance (batch rendering)
- Max total particles: 500 across all systems. Oldest particles culled when exceeded.

---

## 8. Responsive Behavior

### 8.1 Scaling Strategy

**Base**: 375px width (iPhone SE / iPhone 13 mini).

```typescript
const uiScale = Math.max(0.8, Math.min(screenWidth / 375, 1.5));
```

All token values (spacing, font sizes, component dimensions) are multiplied by `uiScale`.

### 8.2 Breakpoints

| Breakpoint | Width Range | Behavior |
|------------|-------------|----------|
| **Compact** | < 360px | `uiScale` = 0.8. Hub tiles 2-column only. Reduce hero card height. |
| **Standard** | 360-414px | `uiScale` = 0.96-1.1. Default layouts. |
| **Large** | 414-480px | `uiScale` = 1.1-1.28. Comfortable spacing. Grid cells slightly larger. |
| **Tablet** | > 480px | `uiScale` = 1.28-1.5. Max content width 480px, centered. Side padding grows. |

### 8.3 Grid Scaling

```typescript
// Grid always fills 65% of viewport height
const gridHeight = screenHeight * 0.65;
const cellSize = Math.floor(gridHeight / 11.5); // 10 rows + 1 preview + 0.5 score bar
const gridWidth = cellSize * 8;

// Ensure grid doesn't exceed content column width
const maxGridWidth = columnWidth;
if (gridWidth > maxGridWidth) {
  cellSize = Math.floor(maxGridWidth / 8);
}
```

### 8.4 Orientation

**Supported**: Portrait only.

- Lock orientation via Capacitor config (`"orientation": "portrait"`)
- Web fallback: If `window.innerWidth > window.innerHeight`, show overlay: "Please rotate your device" with rotate icon
- Grid and gameplay are designed exclusively for portrait. No landscape variant.

### 8.5 Safe Areas

```typescript
// From useFullscreenLayout()
const safeTop = window.safeAreaInsets?.top ?? 0;
const safeBottom = window.safeAreaInsets?.bottom ?? 0;

// TopBar starts at safeTop
// Action bar bottom padding = safeBottom + space.md
// All content within safe area bounds
```

### 8.6 Per-Screen Responsive Notes

| Screen | Compact (<360) | Standard (360-414) | Large (>414) |
|--------|---------------|--------------------|--------------------|
| Home Hub | 2-col tiles only, no hero illustration | 3+2 tile layout, hero card | Same + more breathing room |
| Loadout | Bonus cards 2×3 grid | 3+2 grid | 3+2 with larger cards |
| Map | Tighter S-curve, smaller nodes | Standard S-curve | Wider amplitude |
| Play | Cells may be < 30px | Cells ~36-42px | Cells ~42-48px |
| Shop | Single column, full-width cards | Same | Same, wider cards |

---

## 9. Asset Generation System

### 9.1 Theme Architecture

10 cultural themes, each providing a complete visual skin:

| Theme | Cultural Ref | Color Palette | Mood |
|-------|-------------|---------------|------|
| Tiki | Polynesian tiki masks | Warm browns, jade green, coral | Tropical, mysterious |
| Cosmic | Space/nebula | Deep purple, electric blue, silver | Ethereal, vast |
| Easter Island | Moai, Rapa Nui | Stone gray, ocean blue, sunset orange | Ancient, monumental |
| Maya | Mesoamerican | Gold, turquoise, jungle green | Rich, ceremonial |
| Cyberpunk | Neon cityscape | Hot pink, cyan, dark gray | Electric, gritty |
| Medieval | Castles, knights | Royal blue, burgundy, gold | Noble, structured |
| Egypt | Pharaohs, pyramids | Sand gold, lapis blue, obsidian | Majestic, eternal |
| Volcano | Lava, obsidian | Lava red, charcoal, ember orange | Intense, powerful |
| Tribal | African patterns | Earth tones, crimson, ivory | Rhythmic, grounded |
| Arctic | Ice, aurora | Ice blue, white, aurora green | Crisp, serene |

### 9.2 Per-Theme Asset Manifest

Each theme requires these assets in `/assets/{theme}/`:

```
{theme}/
├── backgrounds/
│   ├── main.png          # Hub/non-gameplay bg (1080×1920)
│   ├── level.png         # Gameplay bg (1080×1920)
│   ├── boss.png          # Boss level bg (1080×1920)
│   └── map.png           # Campaign map bg (1080×1920)
├── blocks/
│   ├── block_1.png       # Size 1 block (64×64)
│   ├── block_2.png       # Size 2 block (64×64)
│   ├── block_3.png       # Size 3 block (64×64)
│   └── block_4.png       # Size 4 block (64×64)
├── boss/
│   ├── portrait.png      # Boss portrait (256×256)
│   ├── portrait_mini.png # Boss map node (64×64)
│   └── defeat.png        # Boss defeat frames (spritesheet)
├── ui/
│   ├── frame.png         # Grid frame 9-slice (96×96)
│   ├── panel-dark.9.png  # Dark card panel 9-slice (96×96)
│   ├── btn-orange.9.png  # Primary button 9-slice (96×48)
│   ├── btn-green.9.png   # Confirm button 9-slice
│   ├── btn-purple.9.png  # Secondary button 9-slice
│   ├── btn-red.9.png     # Danger button 9-slice
│   └── btn-icon.9.png    # Icon button 9-slice
├── map/
│   ├── node-cleared.png  # Map node: cleared (48×48)
│   ├── node-current.png  # Map node: current (48×48)
│   ├── node-locked.png   # Map node: locked (48×48)
│   ├── node-shop.png     # Map node: shop (48×48)
│   └── node-boss.png     # Map node: boss (64×64)
├── effects/
│   ├── particle.png      # Base particle (16×16, white)
│   ├── star.png          # Star particle (24×24, white)
│   └── confetti.png      # Confetti particle (12×20, white)
└── sounds/
    └── musics/
        ├── main.mp3      # Hub BGM
        ├── map.mp3       # Map BGM
        ├── level.mp3     # Gameplay BGM
        └── boss.mp3      # Boss BGM
```

### 9.3 Global Assets (theme-independent)

```
/assets/common/
├── icons/
│   ├── icon-home.png         # 48×48, white silhouette
│   ├── icon-arrow-left.png
│   ├── icon-arrow-right.png
│   ├── icon-close.png
│   ├── icon-menu.png
│   ├── icon-settings.png
│   ├── icon-moves.png
│   ├── icon-score.png
│   ├── icon-level.png
│   ├── icon-cube.png
│   ├── icon-star-filled.png
│   ├── icon-star-empty.png
│   ├── icon-crown.png
│   ├── icon-trophy.png
│   ├── icon-medal-gold.png
│   ├── icon-medal-silver.png
│   ├── icon-medal-bronze.png
│   ├── icon-lock.png
│   ├── icon-check.png
│   ├── icon-fire.png
│   ├── icon-skull.png
│   ├── icon-play.png
│   ├── icon-refresh.png
│   ├── icon-shop.png
│   ├── icon-scroll.png
│   ├── icon-gamepad.png
│   ├── icon-chart.png
│   ├── icon-lightning.png
│   ├── icon-music.png
│   ├── icon-sound.png
│   ├── icon-wheat.png        # Harvest bonus
│   ├── icon-package.png      # Supply bonus
│   ├── icon-bridge.png       # Bridging
│   └── icon-gesture.png      # Tutorial
├── bonuses/
│   ├── bonus-combo.png       # 64×64
│   ├── bonus-score.png
│   ├── bonus-harvest.png
│   ├── bonus-wave.png
│   └── bonus-supply.png
├── ui/
│   ├── loader.png            # Spinning loader (32×32 spritesheet)
│   ├── toggle-track.png      # Toggle switch track
│   ├── toggle-thumb.png      # Toggle switch thumb
│   ├── slider-track.png      # Slider track
│   └── slider-thumb.png      # Slider thumb
├── onboarding/
│   ├── step-1.png            # Tutorial visual 1 (or spritesheet)
│   ├── step-2.png
│   └── step-3.png
└── sounds/
    ├── click.mp3
    ├── move.mp3
    ├── break.mp3
    ├── explode.mp3
    ├── levelup.mp3
    ├── star.mp3
    ├── boss-intro.mp3
    ├── boss-defeat.mp3
    ├── victory.mp3
    ├── over.mp3
    ├── coin.mp3
    ├── claim.mp3
    ├── bonus-activate.mp3
    ├── shop-purchase.mp3
    ├── equip.mp3
    ├── unequip.mp3
    └── constraint-complete.mp3
```

### 9.4 Naming Convention

```
{category}-{name}[-{variant}][-{size}].{ext}

Examples:
  icon-home.png
  icon-star-filled.png
  block_1.png
  btn-orange.9.png      (9-slice indicator)
  boss-portrait.png
  bonus-combo.png
```

Rules:
- All lowercase, hyphens for words, underscores for numeric variants only
- `.9.png` suffix for 9-slice textures
- Spritesheet: `{name}-sheet.json` + `{name}-sheet.png`

### 9.5 Resolution Strategy

| Asset Type | Base Resolution | Retina (@2x) | Notes |
|------------|----------------|---------------|-------|
| Backgrounds | 1080×1920 | Not needed (scaled down) | JPEG, quality 85 |
| Block sprites | 64×64 | 128×128 | PNG-32, transparent |
| Icons | 48×48 | 96×96 | PNG-32, white silhouette |
| 9-slice panels | 96×96 | 192×192 | PNG-32 |
| Boss portraits | 256×256 | 512×512 | PNG-32 |
| Particles | 16×16 | 32×32 | PNG-32, white |
| Sounds | 128kbps MP3 | — | Mono for SFX, stereo for BGM |

**Default delivery**: @1x for all. Dynamically load @2x for `devicePixelRatio >= 2` if memory allows (< 150MB texture budget).

### 9.6 Texture Atlas Strategy

**Current**: Individual PNGs (no atlases).

**Recommended migration** (incremental):

| Atlas | Contains | Estimated Size |
|-------|----------|---------------|
| `atlas-icons.json` | All 30+ icons | ~200KB |
| `atlas-ui.json` | Buttons, panels, toggles, sliders | ~300KB |
| `atlas-blocks-{theme}.json` | 4 block sprites + effects per theme | ~100KB |
| `atlas-map-{theme}.json` | 5 map node types per theme | ~80KB |

Use PixiJS `Spritesheet` class. Single draw call per atlas = significant perf improvement.

### 9.7 AI Generation Pipeline (from ASSETS.md)

**Tool**: Gemini 2.0 Flash (or equivalent) with structured prompts.

**Workflow**:
1. Define theme tokens (color palette, cultural elements, mood)
2. Generate base assets via prompt templates
3. Post-process with `rembg` for transparent backgrounds
4. Resize to target resolutions
5. Validate: correct dimensions, transparent backgrounds, visual consistency
6. Export to `/assets/{theme}/` structure

**Prompt template for blocks**:
```
Create a {theme_name} themed game block, {cultural_ref} decorative patterns,
primary color {hex_color}, {mood} feeling. 64x64 pixels, centered, 
transparent background, flat design with subtle inner shadow, 
rounded corners (8px radius). No text.
```

### 9.8 Memory Budget

| Category | Budget | Notes |
|----------|--------|-------|
| **Current theme textures** | 40MB | Loaded at theme select |
| **Global assets** | 20MB | Loaded at app start |
| **Audio (loaded)** | 15MB | Current theme's 4 tracks + all SFX |
| **Runtime particles** | 5MB | Particle textures + GPU buffers |
| **Headroom** | 20MB | For PixiJS internals, JS heap, React |
| **Total** | ≤ 100MB | Target for 2GB RAM devices |

**Theme switching**: Unload previous theme textures before loading new. Show loading screen during swap (< 2s on WiFi, < 5s on 3G).

---

## 10. Contract → UI Mapping

Complete mapping from on-chain data to UI elements.

### 10.1 Game Model

```
Game {
  blocks: felt252      → Grid (8×10 block sprites)
  next_row: u32        → Next Row Preview (8 blocks, dimmed)
  combo_counter: u8    → Combo Display (text overlay)
  run_data: felt252    → (see 10.2)
  level_stars: felt252  → Campaign Map (star ratings per node)
  over: bool           → Game Over trigger, Hub "Continue Run" visibility
}
```

### 10.2 RunData (bit-packed felt252)

| Bits | Field | UI Element | Screen |
|------|-------|-----------|--------|
| 0-7 | `currentLevel` | HUD "L14", Map current node, Hub "Level 14" | Play, Map, Hub |
| 8-15 | `levelScore` | Score Progress Bar fill, "34/45" label | Play |
| 16-23 | `levelMoves` | HUD Moves counter (right side) | Play |
| 24-31 | `constraintProgress` | ConstraintBadge #1 ring + "2/5" | Play |
| 32-39 | `constraint2Progress` | ConstraintBadge #2 ring + "1/3" | Play |
| 40 | `bonusUsedThisLevel` | NoBonusUsed tracking (internal) | — |
| 41-48 | `comboCount` | BonusSlot Combo "×3" | Play, Action Bar |
| 49-56 | `scoreCount` | BonusSlot Score "×5" | Play, Action Bar |
| 57-64 | `harvestCount` | BonusSlot Harvest "×2" | Play, Action Bar |
| 65-72 | `waveCount` | BonusSlot Wave "×1" | Play, Action Bar |
| 73-80 | `supplyCount` | BonusSlot Supply "×4" | Play, Action Bar |
| 81-88 | `maxComboRun` | Run Summary "Best Combo: ×7" | Game Over, Victory |
| 89-104 | `cubesBrought` | In-Game Shop available balance | Shop |
| 105-120 | `cubesSpent` | In-Game Shop available balance | Shop |
| 121-136 | `totalCubes` | Run Summary "Cubes Earned: +34", CubeBalance on game end | Game Over, Victory |
| 137-152 | `totalScore` | Run Summary "Total Score: 2847" | Game Over, Victory |
| 153 | `runCompleted` | Victory screen trigger (Level 50 clear) | Victory |
| 154-162 | `selectedBonus1/2/3` | Action Bar slot icons + Loadout selection | Play, Hub |
| 163-168 | `bonus1/2/3Level` | BonusSlot level indicator (I/II/III) | Play, Level-Up |
| 169-171 | `freeMoves` | (Internal — moves that don't decrement counter) | — |
| 172-174 | `lastShopLevel` | In-Game Shop trigger (compare with currentLevel) | Shop flow |
| 175 | `noBonusConstraint` | Red slash overlay on bonus slots | Play |
| 176-183 | `constraint3Progress` | ConstraintBadge #3 ring | Play (boss levels) |
| 184-187 | `shopPurchases` | Bonus Charge cost escalation | In-Game Shop |
| 188-191 | `unallocatedCharges` | [+] button in action bar + Allocate modal | Play, Shop |
| 192 | `shopLevelUpBought` | "Already purchased ✓" in shop | In-Game Shop |
| 193 | `shopSwapBought` | "Already purchased ✓" in shop | In-Game Shop |
| 194 | `bossLevelUpPending` | Trigger Boss Level-Up Selection modal | Level-Up modal |

### 10.3 PlayerMeta Model

```
PlayerMeta {
  data: felt252 (86 bits) → Loadout (charges, levels, unlocks)
                           → Permanent Shop (current levels, costs)
                           → Hub (best_level display)
}
```

| Field | UI Element | Screen |
|-------|-----------|--------|
| Starting charges (per bonus type) | Loadout bonus card "×3" | Loadout |
| Bag size level | (Internal — limits total charges) | — |
| Bridging rank | Loadout cube slider max, Shop upgrade card | Loadout, Shop |
| Wave unlocked | Loadout Wave card (available vs locked) | Loadout |
| Supply unlocked | Loadout Supply card (available vs locked) | Loadout |
| Bonus levels | Loadout level indicator (I/II/III) | Loadout |
| Best level reached | Profile "Best: L34" | Profile |

### 10.4 GameSeed Model

```
GameSeed {
  seed: felt252 → Level generation (deterministic)
               → Boss identity (Poseidon hash)
               → Grid randomness
}
```

Used internally for `GameLevel` computation. Not directly displayed, but drives:
- Boss names and portraits on Campaign Map
- Level difficulty/constraints/targets displayed in LevelPreview
- Grid initial state

### 10.5 Transaction → UI Flow

| Transaction | System Call | UI Trigger | Success | Failure |
|-------------|-----------|------------|---------|---------|
| `freeMint()` | `cube_token.free_mint` | Onboarding "Setting up..." | Navigate to Hub | Retry toast |
| `create(token, bonuses, cubes)` | `game.create` | Loadout "Start Run" loading | Navigate to Map | Revert to Loadout |
| `create_with_cubes(token, bonuses, cubes)` | `game.create_with_cubes` | Same as above | Same | Same |
| `move(row, start, end)` | `game.move` | Grid drag release | Optimistic update confirmed | Revert grid + toast |
| `applyBonus(type, target)` | `game.apply_bonus` | Bonus tap/target | Charge decrements, effect plays | Revert charge + toast |
| `purchaseConsumable(type)` | `game.purchase_consumable` | Shop "Buy" tap | Card updates, cube deducted | Toast + revert |
| `surrender()` | `game.surrender` | Menu → Surrender confirm | Game Over screen | Retry toast |
| `shop.upgrade(type)` | `shop.upgrade_*` | Perm Shop "Upgrade" | Coin fly + card update | Toast |
| `quest.claim(id)` | `quest.claim` | Quest "Claim" tap | Coin fly + "Claimed ✓" | Toast |

---

## 11. Implementation Constraints

### 11.1 Contract Compatibility

The new UI MUST NOT require contract changes. All screens map to existing contract interfaces:

| Screen | Contract Dependency | Verified |
|--------|-------------------|----------|
| Onboarding | `freeMint()` on FullTokenContract | ✓ Existing |
| Loadout | `create()` / `create_with_cubes()` | ✓ Existing |
| Play | `move()`, `apply_bonus()` | ✓ Existing |
| In-Game Shop | `purchase_consumable()` | ✓ Existing |
| Level Complete | No tx (display only from state) | ✓ |
| Boss Level-Up | `purchase_consumable(LevelUp)` triggers selection | ✓ Existing |
| Permanent Shop | `shop.upgrade_*()` methods | ✓ Existing |
| Quests | `quest.claim()` | ✓ Existing |
| Daily Challenge | **NOT YET IN CONTRACT** | ✗ Future |

**Exception**: Daily Challenge (4.12) requires a new contract mechanism for daily seeds and separate leaderboard. This screen is designed for future implementation.

### 11.2 Existing Code Preservation

| Layer | Keep | Replace | Notes |
|-------|------|---------|-------|
| `dojo/systems.ts` | ✓ All | — | Transaction wrappers unchanged |
| `dojo/setup.ts` | ✓ All | — | Client initialization unchanged |
| `dojo/game/helpers/` | ✓ All | — | Bit-packing, level generation unchanged |
| `hooks/useGame.ts` | ✓ | — | Entity sync unchanged |
| `hooks/usePlayerMeta.ts` | ✓ | — | Player data unchanged |
| `hooks/useCubeBalance.ts` | ✓ | — | Balance query unchanged |
| `pixi/components/` | — | ✓ All | Complete UI rewrite |
| `pixi/hooks/` | Partial | Partial | Keep `useGameStateMachine`, `useFullscreenLayout`. Rewrite rendering hooks. |
| `pixi/utils/colors.ts` | ✓ | — | Theme colors unchanged |
| `pixi/assets/` | ✓ Catalog + Resolver | — | Asset pipeline unchanged, add new asset IDs |
| `pixi/audio/` | ✓ | — | Sound system unchanged |
| `ui/screens/Home.tsx` | — | ✓ | Thin React wrapper, rewrite for new structure |
| Providers | ✓ All | — | DojoProvider, ThemeProvider, QuestsProvider unchanged |
| Zustand stores | ✓ All | — | generalStore, moveTxStore unchanged |

### 11.3 Incremental Implementation Path

**Phase 1 — Core Loop** (P0 screens):
1. Home Hub (basic — no tiles, just Play button)
2. Loadout
3. Play Screen (grid + HUD + action bar)
4. Level Complete modal
5. Game Over screen

**Phase 2 — Progression**:
6. Campaign Map (5 zones, S-curve)
7. Boss Level variant (intro + defeat + level-up)
8. In-Game Shop
9. Run Complete (Victory)

**Phase 3 — Meta**:
10. Permanent Shop
11. Quest Screen
12. Profile & Achievements
13. Leaderboard
14. My Games

**Phase 4 — Polish**:
15. Onboarding flow
16. Tutorial
17. Settings modal (full)
18. All animations to spec
19. Particle system to spec
20. Sound design to spec

**Phase 5 — Future**:
21. Daily Challenge (requires contract work)

### 11.4 Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|---------------|
| First meaningful paint | < 2s | Essential asset bundle < 500KB. Lazy-load theme. |
| Grid drag response | < 16ms (60fps) | Block positions via direct property set, not React re-render |
| Move tx → visual | < 100ms | Optimistic update. Revert on fail. |
| Line clear animation | Locked 60fps | ParticleContainer. Pre-allocated particle pool. |
| Theme switch | < 3s | Async texture load + progress bar. Unload previous. |
| Memory (gameplay) | < 100MB | Texture budget (§9.8). Dispose unused textures. |
| Bundle size | < 2MB (gzip) | Tree-shake PixiJS. Code-split per page. |

### 11.5 Testing Strategy

| Test Type | Coverage | Tool |
|-----------|----------|------|
| Unit: Bit-packing | `runDataPacking.ts`, level generation | Vitest |
| Unit: Components | Each reusable component (BonusSlot, StarRating, etc.) | Vitest + @pixi/react testing |
| Integration: Game flow | Loadout → Play → Level Complete → Map | Playwright (web mode) |
| Visual regression | Key screens at 375px and 414px widths | Playwright screenshots |
| Performance | Grid drag FPS, particle count, memory | PixiJS DevTools + Chrome DevTools |
| Accessibility | Reduced motion toggle, color contrast | Manual audit |

### 11.6 Localization Readiness

While not implementing i18n now, prepare by:
- All user-visible strings in a single `strings.ts` file (not hardcoded in components)
- Text components accept string keys, not raw text
- No hardcoded text dimensions (text containers auto-size)
- Number formatting via `Intl.NumberFormat` (commas for thousands)
- Date formatting via `Intl.DateTimeFormat` (quest reset timers)

---

*End of zKube UI/UX Specification v3. This document is the single source of truth for all visual design and interaction decisions.*
