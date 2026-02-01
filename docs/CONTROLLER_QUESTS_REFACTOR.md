# Controller, Quests & Achievements Refactoring

This document outlines the refactoring of zkube's controller connection, quests display, and achievements to align with patterns from the nums and arcade codebases.

## Overview

| Area | Before | After |
|------|--------|-------|
| **Controllers** | Per-component `useControllerUsername` hook | Centralized `ControllersProvider` |
| **Quests Context** | Entity updates only | + Event subscriptions for toasts |
| **Quest UI** | Complex `QuestCard` component | Simple `Quest` component (nums style) |
| **Achievements** | Not exposed in UI | Button opens Controller leaderboard tab |

## Changes

### 1. ControllersProvider

**New file:** `client-budokan/src/contexts/controllers.tsx`

Creates a centralized context that:
- Fetches ALL controllers from Torii using `client.getControllers()`
- Stores controllers with O(1) lookup by address
- Provides `find(address)` function
- Auto-refreshes on client initialization

**Usage:**
```typescript
const { find } = useControllers();
const username = find(address)?.username;
```

### 2. Quest Event Subscriptions

**Modified:** `client-budokan/src/contexts/quests.tsx`

Adds separate event subscriptions for:
- `QuestUnlocked` - Toast: "New quest unlocked!"
- `QuestCompleted` - Toast: "Quest completed!"  
- `QuestClaimed` - Toast: "Quest claimed!"

Uses `onEventMessageUpdated` for event subscriptions (like nums pattern).

**New models in:** `client-budokan/src/dojo/models/quest.ts`
- `QuestUnlocked` event model
- `QuestCompleted` event model
- `QuestClaimed` event model

### 3. Quest UI (nums style)

**Rewritten:** `client-budokan/src/ui/components/Quest/QuestCard.tsx`

Simplified design matching nums:
- Clean card layout with title and task
- Horizontal progress bar with animation
- Count display: "X of Y" 
- Claim button states: Countdown | Claim | Claimed
- Removed complex state indicators

### 4. Achievements Button

**New:** Opens Cartridge Controller's leaderboard tab

The Cartridge Controller already handles achievement display via its leaderboard tab. We just need to trigger opening that tab:

```typescript
const connector = useAccount().connector as ControllerConnector;
connector.controller.openProfile("trophies");
```

## Files Changed

### New Files
- `client-budokan/src/contexts/controllers.tsx`

### Modified Files
- `client-budokan/src/main.tsx` - Add ControllersProvider
- `client-budokan/src/contexts/quests.tsx` - Add event subscriptions
- `client-budokan/src/dojo/models/quest.ts` - Add event models
- `client-budokan/src/ui/components/Quest/QuestCard.tsx` - Rewrite
- `client-budokan/src/ui/actions/PlayFreeGame.tsx` - Use ControllersProvider
- `client-budokan/src/ui/components/AccountDetails.tsx` - Use ControllersProvider
- `client-budokan/src/ui/screens/Home.tsx` - Add achievements button

### Deprecated Files
- `client-budokan/src/hooks/useControllerUsername.tsx` - Replaced by ControllersProvider

## Reference Implementations

- **nums:** `references/nums/client/src/context/controllers.tsx`
- **nums:** `references/nums/client/src/context/quests.tsx`
- **nums:** `references/nums/client/src/components/elements/quest.tsx`
- **arcade:** Uses Cartridge Controller's built-in leaderboard/trophies
