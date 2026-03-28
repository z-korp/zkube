# zKube UI/UX Layout Overhaul (Desktop + Mobile) Implementation Plan

## Overview
This plan restructures zKube’s post-redesign UI into a clear, polished, and responsive layout system while preserving existing art direction, gameplay flows, and feature scope. The focus is layout usability: stronger hierarchy, better space usage on desktop, improved clarity on mobile, and reduced friction in navigation-heavy screens (Home, My Games, Leaderboard, Map). The output is an implementable phased roadmap for React + TailwindCSS 4 using existing assets.

## Goals
- Make every primary screen instantly understandable on both desktop (1280+) and mobile (390 baseline).
- Fix wasted space, weak hierarchy, and readability issues without changing core game mechanics.
- Standardize a reusable page-shell + content-container system (glass cards + consistent spacing).
- Improve wayfinding by clarifying top bar icons, table semantics, map progression, and primary CTAs.
- Raise product polish from “prototype-like” to “release-ready”.

## Non-Goals
- No new gameplay features (no economy/system logic changes).
- No backend/onchain contract changes.
- No net-new art pipeline; reuse existing backgrounds/node assets and current visual theme.
- No IA expansion beyond existing pages/modes (Home, My Games, Leaderboard, Map, Settings).

## Assumptions and Constraints
- Stack remains React 19 + TailwindCSS 4 + Motion/GSAP.
- Existing Polynesian/Feudal/Persian art assets are final and should be emphasized, not replaced.
- Desktop and mobile both must be first-class (not just scaled versions).
- Existing routes remain; only layout, hierarchy, and presentation behaviors change.
- "T" metric exists in data model; label meaning must be clarified in UI copy/tooltips.

## Requirements

### Functional
- Deliver revised layouts for: Home (logged-out + logged-in), My Games, Leaderboard, and Map.
- Define desktop/mobile variants and breakpoint behavior for each page.
- Define reusable top bar with icon labels (or labeled hover/long-press affordances) and active states.
- Replace unreadable IDs with short display format while preserving full ID access (copy/reveal affordance).
- Introduce clearer map progression visualization (paths/edges + stronger node labeling) without changing progression logic.

### Non-Functional
- Maintain stable performance on low-mid mobile devices (avoid heavy continuous animations).
- Keep text contrast and touch target sizing accessibility-safe.
- Keep code maintainable via shared layout primitives and design tokens.
- Prevent regressions by adding viewport-based visual QA checklist (desktop and mobile).

## Technical Design

### Data Model
- No schema changes required.
- Optional view-model enrichments (frontend-only):
  - `displayGameId` (e.g., `#6150…3073`)
  - `fullGameId` for copy/action tooltip
  - `mapName` lookup attached to each game row/card
  - `metricLabelT` human-readable label in UI layer

### API Design
- No API contract changes required.
- Optional UI-only mapper functions:
  - `formatGameId(id: string): { short: string; full: string }`
  - `getMapLabel(mapId): string`
  - `getTMetricLabel(): string`

### Architecture
```text
Shared App Shell
  ├─ TopBar (desktop: labeled nav; mobile: compact + optional bottom nav)
  ├─ PageContainer (max-width + adaptive gutters)
  └─ GlassPanel primitives

Screens
  ├─ HomeScreen
  │   ├─ Hero block
  │   ├─ Map cards grid/list
  │   └─ Primary CTA stack (My Games / Daily / Leaderboard)
  ├─ MyGamesScreen
  │   └─ Adaptive table-to-cards list
  ├─ LeaderboardScreen
  │   └─ Adaptive ranked list with sticky header/footer indicators
  └─ MapScreen
      └─ Responsive map stage (desktop wide canvas, mobile tall canvas)
```

### UX Flow (if applicable)

#### Screen-by-screen audit + target layout

| Screen | Current Friction (from screenshots) | Proposed Layout (Desktop) | Proposed Layout (Mobile) |
|---|---|---|---|
| Home (Logged Out) | Huge logo + tiny single CTA; weak hierarchy; unused lateral space | Centered hero in constrained content column (`max-w-[1100px]`) with logo + subtitle + clear “Log In” primary button and secondary “How it works”/“View leaderboard” text link | Keep moon/background composition but reduce logo footprint (`w-[200-240px]`); pin primary CTA within first viewport (no below-fold dependency) |
| Home (Logged In) | Narrow centered column; cards feel like text rows; CTA buttons below fold; top bar icons ambiguous | Two-column layout: left = map selection cards (visual thumbnails + status chips), right = quick actions panel (My Games/Daily/Leaderboard). Use 12-col grid to consume width | Single-column but reorder: top hero compact, then primary actions, then map cards. Keep all core actions above fold on 390×844 |
| My Games | 70+ char game IDs unreadable; “T” unclear; sparse table floating on background | Use panelized data area (`glass panel`) with sticky table header, row hover states, abbreviated IDs + copy icon, map badge column, explicit T label/tooltip | Switch to card list: each game card shows short ID, map, lvl/score/T chips, primary Play button. Keep table only >= md |
| Leaderboard | Sparse; only one highlighted row; “T” unclear; no scrolling/pagination cues | Ranked table with podium header (top 3 treatment), sticky column headers, right-aligned numeric columns, visible page/scroll state | Card/list ranking with rank medal, player, stats chips, and sticky filter/header. Explicit “showing X of Y” cue |
| Map | Desktop wastes width with mobile-like narrow path; tiny nodes and weak numbering; path continuity unclear | Dedicated wide map stage in centered frame (`max-w-[1440px]`), horizontal/diagonal path expansion, explicit connectors between nodes, larger node hitboxes/labels | Keep current mobile composition baseline but increase number legibility and connector contrast; preserve good viewport fill |

#### Detailed page proposals

1) **Home (Logged Out)**
- Keep cinematic background; add subtle dark gradient overlay under content for legibility.
- Content block:
  - Logo (`desktop: w-80`, `mobile: w-52`) + one-line value prop (“Onchain puzzle roguelike on Starknet”).
  - Primary CTA (“Log In”) high-contrast solid treatment.
  - Secondary low-emphasis links beneath CTA.
- Vertical rhythm: `pt-20 md:pt-28`, `space-y-6 md:space-y-8`.

2) **Home (Logged In)**
- Desktop (>=1280): `grid-cols-12`, `gap-6`, with `col-span-7` map cards and `col-span-5` quick actions/account summary.
- Map card redesign (no feature change):
  - Add map key art thumbnail strip (`h-24`) + name/status in footer.
  - Status chip styles: `FREE` (teal), `LOCKED` (slate), `OWNED` (gold outline if applicable).
  - Card affordance: hover lift + glow, clearer click target.
- Move quick actions above fold with consistent button heights.

3) **My Games**
- Replace raw table-first mentality with adaptive pattern:
  - `lg`: table with sticky header + row separators + action column.
  - `sm`: stacked cards, each with core stats and one primary action.
- Rename `T` header to explicit label (e.g., `Turns`, `Time`, or final domain term) + tooltip icon.
- Game ID strategy:
  - Show short ID by default (`#6150…3073`).
  - Provide copy button and optional expand-on-hover/press for full ID.
- Add map badge to each row/card (Polynesian/Feudal Japan/Ancient Persia).

4) **Leaderboard**
- Add richer hierarchy:
  - Podium segment for top 3 (desktop horizontal, mobile stacked).
  - Remaining ranks in list/table below.
- Improve scanability:
  - Strong row striping/hover states.
  - Numeric tabular figures (`font-variant-numeric: tabular-nums`).
  - Sticky header and visible list bounds.
- Clarify `T` metric label with tooltip.

5) **Map**
- Desktop-first map stage redesign:
  - Preserve current node art; increase node size (`w-20 h-20` unlocked, `w-24 h-24` active/boss).
  - Draw explicit connector paths between nodes (SVG or absolutely positioned strokes).
  - Distribute nodes across wider canvas to avoid narrow 9:16 look on 16:9 screens.
  - Surface level numbers as integrated badges with stronger contrast and larger size.
- Mobile refinements:
  - Keep current vertical map framing.
  - Increase number badge size and contrast.
  - Keep boss landmark prominence and locked/unlocked state clarity.

#### Shared responsive strategy

- **Approach:** mobile-first foundations with explicit desktop composition overrides.
- **Breakpoints (Tailwind):**
  - `sm` (>=640): compact tablet transitions
  - `md` (>=768): table/list hybrid enablement
  - `lg` (>=1024): multi-column layout starts
  - `xl` (>=1280): full desktop composition
  - optional `2xl` (>=1536): cap max-width, avoid over-stretch
- **Container system:**
  - `mx-auto w-full px-4 sm:px-6 lg:px-8`
  - `max-w-screen-2xl` for shell, per-page `max-w-[1100|1280|1440]`
- **Page sections:** enforce `gap-4 sm:gap-6 lg:gap-8`; avoid arbitrary one-off spacing.

#### Tailwind/CSS implementation recommendations

- Glass panel primitive:
  - `rounded-2xl border border-white/15 bg-slate-950/40 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.35)]`
- Readability overlay (background-heavy screens):
  - `before:absolute before:inset-0 before:bg-gradient-to-b before:from-slate-950/40 before:to-slate-950/65`
- CTA consistency:
  - Primary buttons min height `h-12` mobile, `h-14` desktop; avoid below-fold critical actions.
- Typography hierarchy:
  - Page title `text-2xl md:text-3xl`, section title `text-lg md:text-xl`, body `text-sm md:text-base`.
- Safe touch targets:
  - Icon buttons `min-w-10 min-h-10` (>=44px interactive area).
- Top bar labels:
  - Desktop inline text labels near icons; mobile keeps icon-only if space constrained but adds tooltip/long-press label.

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

These tasks create foundations that other work depends on. Complete in order.

#### Phase 0: UX Baseline, Metrics, and Shared Layout Primitives
**Prerequisite for:** All subsequent phases

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Audit current page components and identify exact files for Home/My Games/Leaderboard/Map + shared top bar/container | File-level implementation map |
| 0.2 | Define responsive layout tokens (spacing, max-widths, panel styles, typography scale) in Tailwind/theme layer | Reusable tokens + utility classes |
| 0.3 | Implement shared `PageContainer`, `GlassPanel`, `SectionHeader`, and upgraded `TopBar` primitives | Common UI foundation used by all pages |
| 0.4 | Establish viewport QA matrix (390x844, 768x1024, 1280x800, 1440x900) | Repeatable visual validation checklist |

---

### Parallel Workstreams

These workstreams can be executed independently after Phase 0.

#### Workstream A: Home Screen Layout Overhaul (Logged Out + Logged In)
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams B, C

| Task | Description | Output |
|------|-------------|--------|
| A.1 | Recompose logged-out hero hierarchy and CTA placement to fit first viewport on desktop/mobile | Clear entry experience with above-fold primary action |
| A.2 | Redesign logged-in desktop layout into 2-column map/actions composition | Better horizontal space usage, reduced scroll |
| A.3 | Upgrade map cards with themed thumbnails, stronger status chips, and improved affordances | Cards feel like game destinations, not plain rows |
| A.4 | Reorder mobile sections to prioritize actionable buttons before long list content | Reduced friction and faster task completion |

#### Workstream B: Data Screens (My Games + Leaderboard)
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, C

| Task | Description | Output |
|------|-------------|--------|
| B.1 | Replace raw IDs with short IDs + copy affordance + optional full reveal | Readable identity with full traceability |
| B.2 | Clarify ambiguous `T` metric label and add tooltip/context copy | Reduced semantic confusion |
| B.3 | Implement responsive table↔card pattern (desktop tables, mobile cards) | Strong readability across breakpoints |
| B.4 | Add map badges and richer row/card hierarchy (rank emphasis, sticky headers) | More informative and polished data views |

#### Workstream C: Map Screen Responsive Stage Redesign
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, B

| Task | Description | Output |
|------|-------------|--------|
| C.1 | Implement desktop map canvas constraints and node distribution that uses width effectively | Desktop map no longer narrow/phone-like |
| C.2 | Add visual connectors/edges between nodes and improve level number badge prominence | Clear progression path comprehension |
| C.3 | Tune node sizing, interaction states, and boss emphasis for both desktop/mobile | Better target size and visual hierarchy |
| C.4 | Keep mobile map strengths while improving readability/contrast of labels and badges | Mobile remains strong, with reduced ambiguity |

---

### Merge Phase

After parallel workstreams complete, these tasks integrate the work.

#### Phase N: Integration, Consistency Pass, and UX QA
**Dependencies:** Workstreams A, B, C

| Task | Description | Output |
|------|-------------|--------|
| N.1 | Cross-page spacing/typography consistency sweep and token compliance cleanup | Cohesive visual language across routes |
| N.2 | Motion polish pass (entry transitions, hover/tap feedback) with perf caps | High polish without jank |
| N.3 | Run viewport QA matrix and adjust edge-case overflow/truncation issues | Verified responsive correctness |
| N.4 | Prepare before/after screenshot set for signoff | Objective UX improvement evidence |

---

## Testing and Validation

- **Manual UX checklist per screen:**
  - First action obvious within 2 seconds.
  - Primary CTA visible above fold on 390x844 and 1280x800.
  - No clipped text/labels or ambiguous icons.
  - IDs readable; full ID copy action works.
  - Map path visually understandable without guesswork.
- **Responsive validation:** test at 390x844, 768x1024, 1280x800, 1440x900.
- **Accessibility quick pass:** contrast checks, 44px touch targets, keyboard focus states on actionable controls.
- **Performance guardrail:** no heavy perpetual animation loops; verify smooth scroll and interaction on mobile.

## Rollout and Migration

- Roll out as a UI-only branch in phased PRs by workstream (A/B/C), then integration PR.
- Use feature toggles only if needed for high-risk map layout swap; otherwise direct replacement.
- Rollback strategy: revert offending workstream PR while preserving shared primitives from Phase 0.

## Verification Checklist

- `cd client-budokan && pnpm build`
- `cd client-budokan && pnpm test`
- Capture updated screenshots for the 8 audited states and compare against baseline:
  - `ux-desktop-home-loggedout.png`
  - `ux-desktop-home.png`
  - `ux-desktop-mygames.png`
  - `ux-desktop-leaderboard.png`
  - `ux-desktop-map.png`
  - `ux-mobile-home.png`
  - `ux-mobile-mygames.png`
  - `ux-mobile-map.png`
- Confirm all acceptance criteria:
  - Desktop width is meaningfully utilized on Home/Map.
  - Primary actions are above fold on mobile Home.
  - `T` column meaning is explicit.
  - Game IDs are readable and copyable.
  - Map connectors and node numbering are clear.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Over-stylizing harms readability on atmospheric background | Med | High | Enforce content overlays, contrast checks, and panel tokens |
| Desktop-first map adjustment breaks mobile map quality | Med | High | Keep separate layout constraints per breakpoint; validate mobile snapshots early |
| Inconsistent implementation across pages reintroduces drift | High | Med | Shared primitives/tokens in Phase 0 + merge consistency sweep |
| Ambiguous metric labeling remains unresolved (`T`) | Med | Med | Product confirmation + temporary tooltip fallback until final naming locked |
| Regression in navigation discoverability from icon-only controls | Med | Med | Add desktop labels and active states; test with first-time user heuristics |

## Open Questions

- [ ] Confirm canonical meaning of `T` (Turns, Time, or other) so label can be finalized consistently.
- [ ] On desktop, should top bar always show text labels next to icons, or only on hover/expanded mode?
- [ ] For paid maps, should locked cards prioritize purchase CTA visibility or remain minimal until selected?

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Keep existing art direction and focus on layout/system polish | User requested practical improvements without art redesign | Full visual rebrand (rejected: out of scope) |
| Introduce shared glass container primitives across all pages | Current screens lack structural containers over detailed backgrounds | Per-page ad hoc containers (rejected: inconsistent, hard to maintain) |
| Use adaptive table-on-desktop / cards-on-mobile for data-heavy pages | Current mobile table readability is poor | Force one table layout everywhere (rejected: cramped and unclear) |
| Preserve mobile map composition and redesign desktop map stage | Screenshot shows mobile map works better than desktop | Single universal 9:16 map stage (rejected: wastes desktop real estate) |
| Prioritize hierarchy and clarity before adding extra motion detail | User asked for flawless/easy to understand UX | Motion-first redesign (rejected: polish without structure fails usability) |
