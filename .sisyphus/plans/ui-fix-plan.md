# UI Fix Plan — Make zKube Playable

> **Status:** Ready for implementation
> **Date:** 2026-03-29
> **Context:** Contracts ARE v1.3. No bonuses, no skills, no cubes. 10-level zones + endless. RunData has zone_id (reserved), endless_depth, zone_cleared, mutator_mask (reserved). LEVEL_CAP=50 is scaling cap, not zone cap.

## What's Actually Wrong

### Critical (game unplayable)
1. **Leaderboard tabs make no sense** — Zone/Endless/Daily are not separate things. A run IS a zone + endless. Single list ranked by depth-then-score.
2. **Retry button goes home** — doesn't start new game
3. **Theme hardcoded to theme-1** everywhere — MapPage, PlayScreen both ignore game settings
4. **Home page 70% dead space** — zone card is tiny, daily challenge barely visible, zone selector icons tiny and hard to see

### High (bad UX but technically works)
5. **Play screen may have broken level completion** — cascadeComplete flag dependency
6. **Victory detection uses zoneCleared** — which IS set by contracts (bit 80) when L10 boss beaten. This should work IF the game reaches L10.
7. **Map has TOTAL_LEVELS=10** — correct for v1.3, but the SVG viewport height (150vh) may be too tall for 10 nodes, creating massive spacing

### Medium (polish)
8. **Leaderboard uses useLeaderboardSlot** — all 3 tabs show same data
9. **DailyChallengePage references system calls** that may not be wired in systems.ts
10. **No star display** for current zone on home screen

## Fix Commits

### Commit 1: "fix(leaderboard): single ranked list, depth-then-score"
**File:** `client-budokan/src/ui/pages/LeaderboardPage.tsx`
**Change:** Remove Zone/Endless/Daily tabs. Single list. Use depth (endless_depth) as primary sort, score as secondary. Keep podium for top 3. Add "Your Rank" sticky row if account connected.

### Commit 2: "fix(gameover): retry creates new game"  
**Files:** 
- `client-budokan/src/ui/components/GameOverDialog.tsx` — Add `onRetry` prop separate from `onClose`
- `client-budokan/src/ui/pages/PlayScreen.tsx` — Pass `onRetry` that calls freeMint + create, then navigates to map with new gameId

### Commit 3: "fix(home): better layout, visible daily, usable zone selector"
**File:** `client-budokan/src/ui/pages/HomePage.tsx`
**Change:**
- Zone selector icons: bigger (w-12 h-12), always visible, with zone name label below each
- Zone card: taller, more padding, zone background as card header image (not just backdrop)
- Daily challenge: always visible, never hidden behind tab bar
- Less dead space: logo smaller, zone card takes 50%+ of screen height
- PLAY button: full width, prominent, with game-feel styling

### Commit 4: "fix(theme): derive from zone selection, not hardcoded"
**Files:**
- `client-budokan/src/ui/pages/PlayScreen.tsx` — Use theme from zone config instead of hardcoded "theme-1"
- `client-budokan/src/ui/pages/MapPage.tsx` — Same

### Commit 5: "fix(map): proper SVG height for 10 nodes, scroll to current"
**File:** `client-budokan/src/ui/pages/MapPage.tsx`
**Change:** Reduce SVG container height from 150vh to ~120vh for 10 nodes. Verify auto-scroll to current level works. Ensure all nodes are visible without excessive spacing.
