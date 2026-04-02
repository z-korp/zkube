# PLAN: Adapt client-budokan to v2 Contracts

> **Goal**: Make `client-budokan/` (budokan base, great UI/UX) work with the current v2 contracts, porting useful new features from `new-client-budokan/` (reference only).
>
> **Constraints**: Contracts are READ-ONLY. `new-client-budokan/` is reference-only. All work happens IN `client-budokan/`.

---

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Full `number → bigint` migration for `gameId` | Contracts use `felt252`. Boundary-casting is fragile with large token IDs. New-client already did this. |
| D2 | Wire `apply_bonus` to `game_system` | v2 contracts moved `apply_bonus` to `game_system`. Budokan UI has bonus buttons. Core gameplay feature. |
| D3 | Include `create_run` entrypoint | Single system call wrapper, low effort, needed for re-runs after game over. |
| D4 | Replace old quest context with hook-based approach | Budokan's `contexts/quests.tsx` is 350+ lines of complex SDK model parsing. New-client uses simple RECS hooks. Much simpler. |
| D5 | CUBE token → zStar token | v2 replaces CUBE (ERC20 fungible) with zStar (soul-bound ERC20). All CUBE references become zStar. |
| D6 | Remove skill tree + draft systems entirely | v2 contracts have no `draft_system` or `skill_tree_system`. These are dead code. |

---

## Phase 0: Environment & Config

### 0.1 Update `.env.slot`
- **Target**: `client-budokan/.env.slot`
- **Source**: `new-client-budokan/.env.slot`
- **Changes**:
  - `VITE_PUBLIC_NAMESPACE`: `zkube_budo_v1_2_0` → `zkube_v2_1_0`
  - `VITE_PUBLIC_WORLD_ADDRESS`: old → `0x04b615220ebc7d2abf241adc90ede0885739cead167a36f7e94916d4577b493f`
  - `VITE_PUBLIC_GAME_TOKEN_ADDRESS`: old → `0x054b2962dfc4363d2140827e12bd29f936973f1b52f07f8362ca26a87c6f9aec`
  - `VITE_PUBLIC_MASTER_ADDRESS`: old → `0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec`
  - `VITE_PUBLIC_MASTER_PRIVATE_KEY`: old → `0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912`
  - REMOVE: `VITE_PUBLIC_CUBE_TOKEN_ADDRESS`
  - ADD: `VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS=0x06e5f1a7bf27f6075006ea9835d6614c7889779e9db19d5edf5c7e894c77868b`
- **Verification**: `grep NAMESPACE client-budokan/.env.slot` shows `zkube_v2_1_0`

### 0.2 Update `src/constants.ts`
- **Target**: `client-budokan/src/constants.ts`
- **Changes**:
  - Change namespace fallback: `"zkube_budo_v1_2_0"` → `"zkube_v2_1_0"`
  - REMOVE: `QUEST_REWARDS` object (old quest system)
  - REMOVE: `QUEST_FAMILIES` object (old quest system)
  - REMOVE: `QuestFamilyConfig` / `QuestFamilyId` import
  - Keep only: `export const NAMESPACE = import.meta.env.VITE_PUBLIC_NAMESPACE || "zkube_v2_1_0";`
- **Verification**: File is ~1 line. No old quest constants remain.

### 0.3 Copy manifest
- **Source**: `new-client-budokan/src/config/manifest_slot.json`
- **Target**: `client-budokan/src/config/manifest_slot.json`
- **Action**: Direct copy (manifest must match deployed contracts)
- **Verification**: `jq '.world.address' client-budokan/src/config/manifest_slot.json` matches `.env.slot` world address

### 0.4 Add new config files (copy from new-client)
- **Source → Target** (direct copy, no modifications needed):
  - `new-client-budokan/src/config/questDefs.ts` → `client-budokan/src/config/questDefs.ts`
  - `new-client-budokan/src/config/achievementDefs.ts` → `client-budokan/src/config/achievementDefs.ts`
  - `new-client-budokan/src/config/mutatorConfig.ts` → `client-budokan/src/config/mutatorConfig.ts`
  - `new-client-budokan/src/config/profileData.ts` → `client-budokan/src/config/profileData.ts`
  - `new-client-budokan/src/config/bossIdentities.ts` → `client-budokan/src/config/bossIdentities.ts`
- **Verification**: `ls client-budokan/src/config/` shows all 5 new files + manifest files + themes.ts + metagame.ts

### 0.5 Update `src/config/manifest.ts`
- **Target**: `client-budokan/src/config/manifest.ts`
- **Changes**: Ensure it imports the correct `manifest_slot.json` (likely already correct, but verify the import path)
- **Verification**: Build does not error on manifest import

**COMMIT**: `chore: update env, manifest, and config files for v2 contracts`

---

## Phase 1: Dojo Layer (Core Data Layer)

> This is the foundation. Everything else depends on these files being correct.

### 1.1 Replace `contractModels.ts`
- **Target**: `client-budokan/src/dojo/contractModels.ts`
- **Source**: `new-client-budokan/src/dojo/contractModels.ts`
- **Action**: Copy the ENTIRE file from new-client. It defines all v2 models.
- **Key differences from current budokan**:
  - REMOVES: `DraftState`, `PlayerSkillTree`
  - ADDS: `PlayerBestRun`, `MapEntitlement`, `DailyChallenge`, `DailyEntry`, `DailyLeaderboard`, `GameChallenge`, `QuestAdvancement`, `QuestCompletion`, `AchievementAdvancement`, `AchievementCompletion`
  - CHANGES `Game.game_id`: `RecsType.Number` → `RecsType.BigInt`
  - CHANGES `GameSettingsMetadata`: adds `theme_id`, `is_free`, `enabled`, `price`, `payment_token`, `star_cost`
  - CHANGES `GameSettings`: removes consumable costs (`hammer_cost`, `wave_cost`, `totem_cost`, `extra_moves_cost`, `cube_multiplier_x100`), adds `boss_upgrades_enabled`, `reroll_base_cost`, `starting_charges`
  - CHANGES `GameSeed`: adds `level_seed: RecsType.BigInt`
  - CHANGES `PlayerMeta`: adds `last_active: RecsType.Number`
  - ADDS `ARCADE_NAMESPACE` constant for quest/achievement models
- **Verification**: `pnpm tsc --noEmit` passes (no type errors from model changes)

### 1.2 Replace `contractSystems.ts`
- **Target**: `client-budokan/src/dojo/contractSystems.ts`
- **Source**: `new-client-budokan/src/dojo/contractSystems.ts` (base), then ADD bonus support
- **Action**:
  1. Copy new-client's file as base
  2. ADD `apply_bonus` support back on `game_system` (not separate `bonus_system`):
     - Add `BonusTx` interface: `{ game_id: BigNumberish, bonus: number, row_index: number, block_index: number }`
     - Add `bonus` function inside `game()` that calls `contract.address` (game_system) with entrypoint `"apply_bonus"` and calldata `[game_id, bonus, row_index, block_index]`
     - Add `bonus` to the `game()` return object
  3. REMOVE from budokan: `draft()`, `skill_tree()`, `bonus_system` contract lookup, `level_system` contract lookup
  4. KEEP from new-client: `configSystem()`, `daily_challenge()`
- **Key changes from budokan**:
  - `Create` interface: adds `mode: number`
  - `Surrender`, `Move`: `game_id` type `number` → `BigNumberish`
  - ADDS: `CreateRun`, `AddCustomGameSettings`, `PurchaseMap`, daily challenge interfaces
  - REMOVES: `DraftReroll`, `DraftSelect`, `SkillTreeUpgrade`, `SkillTreeChooseBranch`, `SkillTreeRespec`, `StartNextLevel`
  - `free_mint` calldata: changes to use `CairoOption.None` for optional params instead of literal `1` values
- **Verification**: TypeScript compiles. All system functions exist.

### 1.3 Replace `setup.ts`
- **Target**: `client-budokan/src/dojo/setup.ts`
- **Source**: `new-client-budokan/src/dojo/setup.ts`
- **Action**: Copy entire file from new-client.
- **Key changes**:
  - Namespace fallback: `"zkube_budo_v1_2_0"` → `"zkube_v2_1_0"`
  - ADD: `arcadeNamespace` constant = `"zkube_v2_1_0"`
  - `modelsToSync`: expand from 5 to 16 models:
    - REMOVE: `DraftState`, `PlayerSkillTree`
    - ADD: `GameSettings`, `PlayerMeta`, `PlayerBestRun`, `GameSettingsMetadata`, `MapEntitlement`, `DailyChallenge`, `DailyEntry`, `DailyLeaderboard`, `GameChallenge`
    - ADD arcade: `QuestAdvancement`, `QuestCompletion`, `AchievementAdvancement`, `AchievementCompletion`
  - `modelsToWatch`: same expansion
- **Verification**: App starts and Torii sync begins without errors in console.

### 1.4 Replace `systems.ts`
- **Target**: `client-budokan/src/dojo/systems.ts`
- **Source**: `new-client-budokan/src/dojo/systems.ts` (base), then ADD bonus support
- **Action**:
  1. Copy new-client's file as base
  2. ADD `applyBonus` wrapper (matches budokan pattern with `setMoveComplete` Zustand integration)
  3. ADD `applyBonus` to return object
  4. Key changes from budokan:
     - `freeMint` returns `{ game_id: bigint }` not `{ game_id: number }`
     - `create` logs `mode` parameter
     - REMOVES: `startNextLevel`, `claimQuest`, `rerollDraft`, `selectDraft`, `upgradeSkill`, `chooseBranch`, `respecBranch`
     - ADDS: `createRun`, `addCustomGameSettings`, `purchaseMap`, `createDailyChallenge`, `registerEntry`, `submitResult`, `settleChallenge`, `claimPrize`, `withdrawUnclaimed`
- **Verification**: `SystemCalls` type has all expected methods.

### 1.5 Replace `runDataPacking.ts`
- **Target**: `client-budokan/src/dojo/game/helpers/runDataPacking.ts`
- **Source**: `new-client-budokan/src/dojo/game/helpers/runDataPacking.ts`
- **Action**: Copy ENTIRE file from new-client. This is a COMPLETE replacement — the bit layout changed entirely.
- **Key changes**:
  - REMOVES all v1.2 fields: `constraint_3_progress`, `bonus_used_this_level`, `total_cubes`, `run_completed`, `free_moves`, `no_bonus_constraint`, `active_slot_count`, `slots`, `level_transition_pending`
  - REMOVES all skill slot types: `SkillSlot` interface, `unpackSlot()`, `getActiveSlots()`, `getBonusSlots()`, `getWorldEventSlots()`, `hasSkill()`, `getSlotBySkillId()`, `getRerollCost()`, `SKILL_TREE_COSTS`, `getSkillUpgradeCost()`, `getTotalCostToLevel()`, `SKILL_IDS`, `isBonusSkill()`, `isWorldEventSkill()`
  - ADDS v2 fields: `zoneCleared`, `currentDifficulty`, `zoneId`, `activeMutatorId`, `mode`, `bonusType`, `bonusCharges`, `levelLinesCleared`, `bonusSlot`
  - `totalScore`: 16-bit → 32-bit (position shift from 73 to 48)
  - RunData interface completely rewritten
- **Verification**: Unit test (added in 1.7)

### 1.6 Add new packing helpers
- **Source → Target** (direct copy):
  - `new-client-budokan/src/dojo/game/helpers/metaDataPacking.ts` → `client-budokan/src/dojo/game/helpers/metaDataPacking.ts`
  - `new-client-budokan/src/dojo/game/helpers/levelStarsPacking.ts` → `client-budokan/src/dojo/game/helpers/levelStarsPacking.ts`
- **Verification**: Files exist, imports resolve.

### 1.7 Add packing unit tests (TDD)
- **Source → Target** (direct copy):
  - `new-client-budokan/src/test/metaDataPacking.test.ts` → `client-budokan/src/test/metaDataPacking.test.ts`
  - `new-client-budokan/src/test/levelStarsPacking.test.ts` → `client-budokan/src/test/levelStarsPacking.test.ts`
- **ADD NEW**: `client-budokan/src/test/runDataPacking.test.ts` — write test for v2 layout covering:
  - Zero data unpacking
  - current_level in bits 0-7
  - total_score in bits 48-79 (32-bit)
  - zone_cleared at bit 80
  - mode at bit 101
  - bonus_type at bits 102-103
  - bonus_charges at bits 104-107
- **Verification**: `pnpm test` — all 3 test files pass.

### 1.8 Replace `game.ts` (Game class)
- **Target**: `client-budokan/src/dojo/game/models/game.ts`
- **Source**: `new-client-budokan/src/dojo/game/models/game.ts`
- **Action**: Copy ENTIRE file from new-client.
- **Key changes**:
  - `id` type: `number` → `bigint`
  - Constructor: `this.id = BigInt(game.game_id ?? 0)` instead of `this.id = game.game_id`
  - REMOVES getters: `bonusUsedThisLevel`, `totalCubes`, `freeMoves`, `activeSlotCount`, `slots`, `runCompleted`, `cubesAvailable`, `levelTransitionPending` (old packed bit)
  - REMOVES methods: `getTotalBonuses()`, `hasBonuses()`
  - ADDS getters: `zoneId`, `currentDifficulty`, `endlessDepth`, `zoneCleared`, `activeMutatorId`, `mutatorMask`, `bonusType`, `bonusCharges`, `bonusSlot`, `mode`
  - CHANGES `levelTransitionPending`: now `!this.over && this.blocksRaw === 0n` (derived, not packed)
  - REMOVES `SkillSlot` import
- **Verification**: TypeScript compiles. `Game` class has all v2 getters.

### 1.9 Update `constants.ts` (game constants)
- **Target**: `client-budokan/src/dojo/game/constants.ts`
- **Source**: `new-client-budokan/src/dojo/game/constants.ts`
- **Action**: Copy from new-client. Removes skill system constants.
- **REMOVES**: `MAX_LOADOUT_SLOTS`, `TOTAL_SKILLS`, `MAX_SKILL_LEVEL`, `BRANCH_POINT_LEVEL`, `BRANCH_SPLIT_LEVEL`
- **KEEPS**: grid constants, `LEVEL_CAP`, `BOSS_INTERVAL`, `BOSS_LEVELS`, `PRE_BOSS_LEVELS`
- **Verification**: No imports reference removed constants.

### 1.10 Add Torii token helper
- **Source**: `new-client-budokan/src/dojo/torii/tokens.ts`
- **Target**: `client-budokan/src/dojo/torii/tokens.ts` (new directory + file)
- **Action**: Create `client-budokan/src/dojo/torii/` directory, copy file.
- **Verification**: File exists at correct path.

**COMMIT**: `feat: replace dojo layer with v2 contract models, systems, and packing`

---

## Phase 2: Remove Dead v1.2 Code

### 2.1 Delete dead pages
- **DELETE**:
  - `client-budokan/src/ui/pages/DraftPage.tsx`
  - `client-budokan/src/ui/pages/SkillTreePage.tsx`
  - `client-budokan/src/ui/pages/InGameShopPage.tsx`
  - `client-budokan/src/ui/pages/QuestsPage.tsx`
  - `client-budokan/src/ui/pages/TutorialPage.tsx`
- **Verification**: Files no longer exist. Build may have import errors (fixed in Phase 6).

### 2.2 Delete dead hooks
- **DELETE**:
  - `client-budokan/src/hooks/useDraft.tsx`
  - `client-budokan/src/hooks/useSkillTree.tsx`
  - `client-budokan/src/hooks/useCubeBalance.tsx` (replaced by useZStarBalance)
- **Verification**: Files no longer exist.

### 2.3 Delete dead types
- **DELETE**:
  - `client-budokan/src/dojo/game/types/bonus.ts` (v1.2 5-bonus system, v2 uses 3 bonuses: Hammer/Totem/Wave)
  - `client-budokan/src/dojo/game/types/skillData.ts`
  - `client-budokan/src/dojo/game/types/skillEffects.ts`
  - `client-budokan/src/types/questFamily.ts`
- **Verification**: Files no longer exist.

### 2.4 Delete dead dojo models
- **DELETE**:
  - `client-budokan/src/dojo/models/quest.ts` (old arcade SDK quest model classes, 300+ lines)
- **Verification**: File no longer exists.

### 2.5 Replace old quests context
- **Target**: `client-budokan/src/contexts/quests.tsx`
- **Action**: Gut the 350+ line old SDK-based implementation. Replace with a thin stub that doesn't crash:
  ```typescript
  import type React from "react";
  import { createContext, useContext } from "react";
  interface QuestsContextType { status: "loading" | "success"; }
  const QuestsContext = createContext<QuestsContextType>({ status: "loading" });
  export function QuestsProvider({ children }: { children: React.ReactNode }) {
    return <QuestsContext.Provider value={{ status: "success" }}>{children}</QuestsContext.Provider>;
  }
  export function useQuestsContext() { return useContext(QuestsContext); }
  ```
- **Verification**: Build compiles. QuestsProvider still wraps children in `main.tsx`.

### 2.6 Delete dead store
- **DELETE**: `client-budokan/src/stores/cubeBalanceStore.ts` (replaced by zStar token balance via Torii subscription)
- **Verification**: File no longer exists.

### 2.7 Clean up dead component references
- **Action**: Search for and remove imports of deleted files in any remaining components:
  - `BringCubesDialog.tsx`, `ShopDialog.tsx`, `InGameShopDialog.tsx`, `ShopButton.tsx` — if these reference CUBE token, either delete or stub
  - Any `Quest/` components that reference old quest system
- **Verification**: `pnpm tsc --noEmit` passes with no unresolved imports.

**COMMIT**: `chore: remove dead v1.2 code (draft, skill tree, CUBE token, old quests)`

---

## Phase 3: Port New Hooks

### 3.1 Add `useTokenBalance` hook
- **Source**: `new-client-budokan/src/hooks/useTokenBalance.ts`
- **Target**: `client-budokan/src/hooks/useTokenBalance.ts`
- **Action**: Copy from new-client. This is the generic Torii token balance subscription hook.
- **Dependencies**: `src/dojo/torii/tokens.ts` (added in 1.10)
- **Verification**: Import resolves, TypeScript compiles.

### 3.2 Add `useZStarBalance` hook
- **Source**: `new-client-budokan/src/hooks/useZStarBalance.ts`
- **Target**: `client-budokan/src/hooks/useZStarBalance.ts`
- **Action**: Copy from new-client.
- **Dependencies**: `useTokenBalance`, `VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS` env var
- **Verification**: Hook returns `{ balance, isLoading }`.

### 3.3 Replace `useNftBalance` hook
- **Target**: `client-budokan/src/hooks/useNftBalance.ts`
- **Source**: `new-client-budokan/src/hooks/useNftBalance.ts`
- **Action**: Replace with new-client version (Torii subscription instead of RPC polling).
- **Key change**: `useReadContract` polling → `useTokenBalance` subscription
- **Note**: Verify env var name matches — new-client uses `VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS`; may need to align with `.env.slot` which has `VITE_PUBLIC_GAME_TOKEN_ADDRESS`
- **Verification**: NFT balance displays correctly.

### 3.4 Replace `usePlayerMeta` hook
- **Target**: `client-budokan/src/hooks/usePlayerMeta.tsx`
- **Source**: `new-client-budokan/src/hooks/usePlayerMeta.tsx`
- **Action**: Copy from new-client.
- **Key changes**:
  - Old interface `PlayerMetaData` with 14 fields (bonuses, bags, bridging, shrink, shuffle, cubes) → new simple `{ totalRuns, dailyStars, lifetimeXp }`
  - Uses `unpackMetaData` from new `metaDataPacking.ts` helper
  - Adds `lastActive` field from component
- **Dependencies**: `src/dojo/game/helpers/metaDataPacking.ts` (added in 1.6)
- **Verification**: Hook returns `{ playerMeta, isLoading }` with correct v2 fields.

### 3.5 Update `useGame` hook (gameId type)
- **Target**: `client-budokan/src/hooks/useGame.tsx`
- **Source**: `new-client-budokan/src/hooks/useGame.tsx`
- **Action**: Copy from new-client.
- **Key change**: `gameId: number | undefined` → `gameId: bigint | undefined`
- **Verification**: Hook accepts `bigint` gameId.

### 3.6 Add `usePlayerBestRun` hook
- **Source**: `new-client-budokan/src/hooks/usePlayerBestRun.ts`
- **Target**: `client-budokan/src/hooks/usePlayerBestRun.ts`
- **Action**: Copy from new-client.
- **Dependencies**: `levelStarsPacking.ts` (added in 1.6), `PlayerBestRun` component (added in 1.1)
- **Verification**: Import resolves.

### 3.7 Add `useZoneProgress` hook
- **Source**: `new-client-budokan/src/hooks/useZoneProgress.ts`
- **Target**: `client-budokan/src/hooks/useZoneProgress.ts`
- **Action**: Copy from new-client.
- **Dependencies**: `levelStarsPacking.ts`, `profileData.ts` (added in 0.4), `PlayerBestRun` + `MapEntitlement` + `GameSettingsMetadata` components
- **Verification**: Import resolves.

### 3.8 Add `useQuests` hook
- **Source**: `new-client-budokan/src/hooks/useQuests.ts`
- **Target**: `client-budokan/src/hooks/useQuests.ts`
- **Action**: Copy from new-client.
- **Dependencies**: `questDefs.ts` (added in 0.4), `QuestAdvancement` + `QuestCompletion` components (added in 1.1)
- **Verification**: Import resolves.

### 3.9 Add `useAchievements` hook
- **Source**: `new-client-budokan/src/hooks/useAchievements.ts`
- **Target**: `client-budokan/src/hooks/useAchievements.ts`
- **Action**: Copy from new-client.
- **Dependencies**: `achievementDefs.ts` (added in 0.4), `AchievementAdvancement` + `AchievementCompletion` components
- **Verification**: Import resolves.

### 3.10 Add daily challenge hooks
- **Source → Target** (direct copy):
  - `new-client-budokan/src/hooks/useCurrentChallenge.tsx` → `client-budokan/src/hooks/useCurrentChallenge.tsx`
  - `new-client-budokan/src/hooks/useDailyLeaderboard.tsx` → `client-budokan/src/hooks/useDailyLeaderboard.tsx`
  - `new-client-budokan/src/hooks/usePlayerEntry.tsx` → `client-budokan/src/hooks/usePlayerEntry.tsx`
- **Dependencies**: `DailyChallenge`, `DailyLeaderboard`, `DailyEntry` components (added in 1.1)
- **Verification**: All 3 hooks import correctly.

### 3.11 Update `useGrid` hook (gameId type propagation)
- **Target**: `client-budokan/src/hooks/useGrid.tsx`
- **Changes**: Update `gameId` parameter type from `number | undefined` to `bigint | undefined` to match updated `useGame`.
- **Verification**: TypeScript compiles, grid still renders.

### 3.12 Update `useGameLevel` hook (gameId type propagation)
- **Target**: `client-budokan/src/hooks/useGameLevel.tsx`
- **Changes**: Update `gameId` parameter type from `number | undefined` to `bigint | undefined`. Update `getEntityIdFromKeys` call to use bigint directly.
- **Verification**: TypeScript compiles.

### 3.13 Update `useGameTokensSlot` (gameId type + RunData fields)
- **Target**: `client-budokan/src/hooks/useGameTokensSlot.ts`
- **Changes**:
  - Game `game_id` is now `BigInt`, update extraction logic
  - RunData fields changed — update any references to old RunData fields (e.g., `totalCubes`, `runCompleted`, slot data)
  - Replace with v2 RunData fields (`zoneId`, `mode`, `bonusType`, etc.)
- **Verification**: TypeScript compiles.

**COMMIT**: `feat: port new hooks (token balance, zStar, quests, achievements, daily, zone progress)`

---

## Phase 4: Port New Pages (Stubs)

> These pages come from new-client but use budokan's UI patterns. Copy the LOGIC, adapt LAYOUT to budokan's design language.

### 4.1 Port `ProfilePage.tsx`
- **Source**: `new-client-budokan/src/ui/pages/ProfilePage.tsx`
- **Target**: `client-budokan/src/ui/pages/ProfilePage.tsx`
- **Action**: Copy from new-client. Uses `usePlayerMeta`, `useZStarBalance`, `useZoneProgress`, `useQuests`, `useAchievements`.
- **Dependencies**: All Phase 3 hooks, config files from Phase 0.
- **Note**: May need UI adaptation to budokan's styling. Copy as-is first, refine later.
- **Verification**: Page renders without crash when navigated to.

### 4.2 Port `DailyChallengePage.tsx`
- **Source**: `new-client-budokan/src/ui/pages/DailyChallengePage.tsx`
- **Target**: `client-budokan/src/ui/pages/DailyChallengePage.tsx`
- **Action**: Copy from new-client.
- **Dependencies**: `useCurrentChallenge`, `useDailyLeaderboard`, `usePlayerEntry` hooks.
- **Verification**: Page renders without crash.

### 4.3 Port `BossRevealPage.tsx`
- **Source**: `new-client-budokan/src/ui/pages/BossRevealPage.tsx`
- **Target**: `client-budokan/src/ui/pages/BossRevealPage.tsx`
- **Action**: Copy from new-client.
- **Dependencies**: `bossIdentities.ts` config.
- **Verification**: Page renders without crash.

### 4.4 Port `MutatorRevealPage.tsx`
- **Source**: `new-client-budokan/src/ui/pages/MutatorRevealPage.tsx`
- **Target**: `client-budokan/src/ui/pages/MutatorRevealPage.tsx`
- **Action**: Copy from new-client.
- **Dependencies**: `mutatorConfig.ts` config.
- **Verification**: Page renders without crash.

### 4.5 Port shared components (as needed by pages)
- **Action**: Check if new pages reference components that don't exist in budokan. If so, copy from new-client:
  - `new-client-budokan/src/ui/components/shared/ThemeBackground.tsx`
  - `new-client-budokan/src/ui/components/shared/PhoneFrame.tsx`
  - `new-client-budokan/src/ui/components/BottomTabBar.tsx`
  - Any profile tab components referenced by ProfilePage
- **Note**: Only copy what's needed. Don't port the entire `shared/` directory blindly.
- **Verification**: All new pages render without missing component errors.

**COMMIT**: `feat: add ProfilePage, DailyChallengePage, BossRevealPage, MutatorRevealPage`

---

## Phase 5: Update Existing Pages

### 5.1 Update `HomePage.tsx`
- **Target**: `client-budokan/src/ui/pages/HomePage.tsx`
- **Changes**:
  - Replace CUBE balance display with zStar balance (`useZStarBalance`)
  - Add mode selection (Map vs Endless) before game creation
  - Update `freeMint` call to use new `mint_game` calldata format
  - Update `create` call to pass `mode` parameter
  - `game_id` handling: `number` → `bigint` throughout
  - Remove any references to skill tree, draft, CUBE tokens
  - Add zone selection if multiple zones are unlocked (`useZoneProgress`)
- **Verification**: Home page loads, shows zStar balance, can start a game.

### 5.2 Update `PlayScreen.tsx`
- **Target**: `client-budokan/src/ui/pages/PlayScreen.tsx`
- **Changes**:
  - `gameId` type: `number` → `bigint` (from navigation store)
  - Update `create` call to pass `mode` parameter
  - Remove `startNextLevel` calls (auto-advance in move)
  - Remove draft event handling (`pendingDraftEvent`)
  - Remove skill tree references
  - Update bonus button to use v2 bonus system (Hammer/Totem/Wave from `game.bonusType`, charges from `game.bonusCharges`)
  - Remove CUBE earned animations (zStar is minted server-side, not earned per-move)
  - Update game over dialog to show v2 fields (zoneCleared, totalScore, etc.)
  - Update level complete dialog to show v2 fields
- **Verification**: Can play a game: drag blocks, bonuses work, level transitions work.

### 5.3 Update `MapPage.tsx`
- **Target**: `client-budokan/src/ui/pages/MapPage.tsx`
- **Changes**:
  - Use `usePlayerBestRun` for star display per level
  - Use `levelStarsPacking.ts` helper for unpacking
  - Level cap is now 10 per zone (not 50 global)
  - `gameId` type: `number` → `bigint`
  - Remove references to draft events
  - Update star display to use v2 `getLevelStars` (10 levels x 2 bits, not 50)
- **Verification**: Map shows 10 levels, star ratings from best run.

### 5.4 Update `LeaderboardPage.tsx`
- **Target**: `client-budokan/src/ui/pages/LeaderboardPage.tsx`
- **Changes**:
  - Update to show v2 leaderboard data
  - `gameId` type: `number` → `bigint` if used
  - Ensure `useLeaderboardSlot` works with new namespace
- **Verification**: Leaderboard page loads, shows rankings.

### 5.5 Update `MyGamesPage.tsx`
- **Target**: `client-budokan/src/ui/pages/MyGamesPage.tsx`
- **Changes**:
  - `gameId` type: `number` → `bigint` in game card data
  - Update RunData field references (mode, zoneId, etc.)
  - Remove CUBE balance references
- **Verification**: My games page loads, shows owned games.

### 5.6 Update `SettingsPage.tsx`
- **Target**: `client-budokan/src/ui/pages/SettingsPage.tsx`
- **Changes**: Minimal — mostly UI. Remove any CUBE references.
- **Verification**: Settings page loads.

**COMMIT**: `feat: update existing pages for v2 contracts (gameId bigint, v2 RunData, zStar)`

---

## Phase 6: Navigation & Routing

### 6.1 Update `navigationStore.ts`
- **Target**: `client-budokan/src/stores/navigationStore.ts`
- **Source**: `new-client-budokan/src/stores/navigationStore.ts`
- **Changes**:
  - `PageId` type: Replace `"quests" | "tutorial" | "draft" | "skilltree"` with `"profile" | "ranks" | "daily" | "boss" | "mutator"`
  - Add `TabId` and `OverlayId` types
  - Add `FULLSCREEN_PAGES` set
  - `gameId` type: `number | null` → `bigint | null`
  - Add `selectedMode: number` state + `setSelectedMode`
  - REMOVE: `pendingDraftEvent`, `PendingDraftEvent`, `DraftEventType`
  - UPDATE `PendingLevelCompletion`: remove `prevTotalCubes`, `totalCubes`
  - UPDATE `getBackTarget`: new routing (play→map, daily→home, boss→map, map→mygames, mutator→mygames)
- **Verification**: TypeScript compiles. Navigation functions work.

### 6.2 Update `App.tsx`
- **Target**: `client-budokan/src/App.tsx`
- **Source**: `new-client-budokan/src/App.tsx` (reference for structure)
- **Changes**:
  - REMOVE imports: `DraftPage`, `SkillTreePage`, `QuestsPage`, `TutorialPage`, `InGameShopPage`
  - ADD imports: `ProfilePage`, `DailyChallengePage`, `BossRevealPage`, `MutatorRevealPage`
  - UPDATE `pageComponents` record to match new `PageId`:
    - `home`, `play`, `map`, `mygames`, `mutator`, `profile`, `ranks`, `settings`, `daily`, `boss`
  - ADD: `AnimatePresence` slide transitions from new-client (optional, nice-to-have)
  - ADD: `BottomTabBar` and `FULLSCREEN_PAGES` logic for tab bar visibility
  - ADD: `ThemeBackground` and `PhoneFrame` components if ported in 4.5
- **Verification**: All pages reachable. No 404s or blank screens.

### 6.3 Update `main.tsx` if needed
- **Target**: `client-budokan/src/main.tsx`
- **Changes**: Remove any references to dead providers or imports. `QuestsProvider` should still wrap (using stub from 2.5).
- **Verification**: App starts without errors.

**COMMIT**: `feat: update navigation and routing for v2 pages`

---

## Phase 7: Build, Test, Verify

### 7.1 TypeScript compilation
- **Command**: `pnpm tsc --noEmit` (in `client-budokan/`)
- **Expected**: Zero errors
- **Fix strategy**: Address any remaining type errors from gameId migration, missing imports, etc.

### 7.2 Unit tests
- **Command**: `pnpm test` (in `client-budokan/`)
- **Expected**: All packing tests pass (metaDataPacking, levelStarsPacking, runDataPacking)

### 7.3 Development build
- **Command**: `pnpm slot` (in `client-budokan/`)
- **Expected**: Vite dev server starts on port 5125 without build errors

### 7.4 Smoke test (manual checklist for future Playwright)
- [ ] App loads at `https://localhost:5125`
- [ ] Home page renders with zStar balance (0 if no games)
- [ ] Can navigate to all pages via bottom tab bar
- [ ] Profile page shows quests/achievements (empty state OK)
- [ ] Settings page renders
- [ ] Leaderboard page renders
- [ ] Can mint a game (freeMint)
- [ ] Can create and play a game (drag blocks)
- [ ] Level transitions work (auto-advance)
- [ ] Bonus button appears when bonus_charges > 0
- [ ] Game over dialog shows correctly
- [ ] Map page shows 10 levels with star ratings
- [ ] Console has no critical errors

**COMMIT**: `fix: resolve build errors and ensure all tests pass`

---

## Commit Strategy (Atomic)

| # | Commit | Phase | Files Changed |
|---|--------|-------|---------------|
| 1 | `chore: update env, manifest, and config files for v2 contracts` | 0 | ~8 files |
| 2 | `feat: replace dojo layer with v2 contract models, systems, and packing` | 1 | ~12 files |
| 3 | `chore: remove dead v1.2 code (draft, skill tree, CUBE token, old quests)` | 2 | ~15 files deleted/gutted |
| 4 | `feat: port new hooks (token balance, zStar, quests, achievements, daily, zone progress)` | 3 | ~15 files |
| 5 | `feat: add ProfilePage, DailyChallengePage, BossRevealPage, MutatorRevealPage` | 4 | ~5-10 files |
| 6 | `feat: update existing pages for v2 contracts (gameId bigint, v2 RunData, zStar)` | 5 | ~6 files |
| 7 | `feat: update navigation and routing for v2 pages` | 6 | ~3 files |
| 8 | `fix: resolve build errors and ensure all tests pass` | 7 | variable |

---

## Dependency Graph

```
Phase 0 (config/env)
  └── Phase 1 (dojo layer) ←── CRITICAL PATH
        ├── Phase 2 (delete dead code)
        │     └── Phase 6 (navigation) ──→ Phase 7 (verify)
        └── Phase 3 (new hooks)
              ├── Phase 4 (new pages) ──→ Phase 6
              └── Phase 5 (update pages) ──→ Phase 6
```

Phases 2, 3 can run in PARALLEL after Phase 1.
Phases 4, 5 can run in PARALLEL after Phase 3.
Phase 6 depends on Phases 2 + 4 + 5.
Phase 7 is the final gate.

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| `gameId` number→bigint breaks many components silently | HIGH | Search all `gameId` references with grep, update systematically |
| RunData unpacking mismatch with contracts | HIGH | Unit tests against known packed values from contract tests |
| Torii sync doesn't find new models | MEDIUM | Verify namespace matches, check Torii logs for sync errors |
| Old quest context breaks provider tree | MEDIUM | Stub immediately in Phase 2, replace with hooks in Phase 3 |
| Bonus system not wired correctly | MEDIUM | Test apply_bonus manually after Phase 1, verify tx succeeds |
| Missing shared components in ported pages | LOW | Copy from new-client on demand, don't pre-copy |
| `manifest_slot.json` stale after redeploy | LOW | Re-run deploy script, copy fresh manifest |

---

## ADDENDUM: Phase 3 — gameId `number → bigint` Migration (Detailed)

> This was identified as a pervasive change across 13 files with 37 occurrences. Separated into its own phase for systematic execution.

### Scope: Complete file list with exact changes

**File 1: `src/dojo/contractSystems.ts`** (6 occurrences — handled in Phase 1.2)
- `Surrender.game_id: number` → `BigNumberish`
- `Create.token_id: number` → `BigNumberish`
- `Move.game_id: number` → `BigNumberish`
- `BonusTx.game_id: number` → `BigNumberish`
- `StartNextLevel.game_id: number` → REMOVED
- `DraftReroll.game_id: number` → REMOVED

**File 2: `src/dojo/systems.ts`** (1 occurrence — handled in Phase 1.4)
- `freeMint` return type: `Promise<{ game_id: number }>` → `Promise<{ game_id: bigint }>`

**File 3: `src/dojo/game/models/game.ts`** (handled in Phase 1.8)
- `Game.id: number` → `bigint`
- Constructor: `this.id = game.game_id` → `this.id = BigInt(game.game_id ?? 0)`

**File 4: `src/stores/navigationStore.ts`** (2 occurrences — handled in Phase 8.1)
- `gameId: number | null` → `bigint | null`
- `navigate: (page: PageId, gameId?: number)` → `navigate: (page: PageId, gameId?: bigint)`

**File 5: `src/stores/moveTxStore.ts`** (2 occurrences)
- `gameId: number` → `gameId: bigint`
- `clearQueueForGame: (gameId: number)` → `clearQueueForGame: (gameId: bigint)`

**File 6: `src/hooks/useGame.tsx`** (1 occurrence — handled in Phase 4.5)
- `gameId: number | undefined` → `bigint | undefined`

**File 7: `src/hooks/useGrid.tsx`** (1 occurrence)
- `gameId: number | undefined` → `bigint | undefined`

**File 8: `src/hooks/useGameLevel.tsx`** (2 occurrences)
- `gameId: number` → `bigint` (interface)
- `gameId: number | undefined` → `bigint | undefined` (hook param)

**File 9: `src/hooks/useLeaderboardSlot.ts`** (1 occurrence)
- `game_id: number` in leaderboard entry type → `game_id: bigint`

**File 10: `src/dojo/models/gameEvent.ts`** (12 occurrences)
- ALL `game_id: number` fields in StartGame, BonusUsed, MoveComplete, LevelCompleted, RunEnded, ConstraintProgress, GameOverEvent → `game_id: bigint`
- ALL constructors: `game_id: number` param → `game_id: bigint`

**File 11: `src/ui/components/Grid.tsx`** (1 occurrence)
- `gameId: number` prop → `gameId: bigint`

**File 12: `src/ui/components/map/LevelPreview.tsx`** (1 occurrence)
- `gameId: number | null` prop → `gameId: bigint | null`

**File 13: `src/ui/components/Shop/PendingLevelUpDialog.tsx`** (1 occurrence)
- `gameId: number` prop → `gameId: bigint`

### Migration strategy
1. Update types FIRST (interfaces, stores, models)
2. Update hooks SECOND (they consume the types)
3. Update components LAST (they consume the hooks)
4. At each boundary, use `BigInt()` for conversion where raw numbers enter

### Verification
- `grep -rn 'gameId.*: number\|game_id.*: number' src/ --include='*.ts' --include='*.tsx'` returns 0 results (excluding test files)
- `pnpm tsc --noEmit` passes

---

## ADDENDUM: `level.ts` GameSettings Interface Update

> Discovered during deep comparison: the `GameSettings` interface in `src/dojo/game/types/level.ts` differs between clients.

### Changes (budokan → new-client):

**REMOVE from `GameSettings` interface and `DEFAULT_SETTINGS`:**
- `hammerCost: number` (was 5)
- `waveCost: number` (was 5)
- `totemCost: number` (was 5)
- `extraMovesCost: number` (was 10)

**ADD to `GameSettings` interface and `DEFAULT_SETTINGS`:**
- `bossUpgradesEnabled: boolean` (default `true`)
- `rerollBaseCost: number` (default `5`)
- `startingCharges: number` (default `1`)

**UPDATE `parseGameSettings()` function:**
- REMOVE: `hammerCost`, `waveCost`, `totemCost`, `extraMovesCost` parsing
- ADD: `bossUpgradesEnabled` parsing (from `raw.boss_upgrades_enabled`, same pattern as `constraintsEnabled`)
- ADD: `rerollBaseCost` parsing (from `raw.reroll_base_cost`)
- ADD: `startingCharges` parsing (from `raw.starting_charges`)

**Target**: `client-budokan/src/dojo/game/types/level.ts`
**Source**: `new-client-budokan/src/dojo/game/types/level.ts`
**Action**: Copy from new-client (files are 99% identical, only the interface + defaults + parser differ)
**Verification**: `parseGameSettings` handles all v2 fields. TypeScript compiles.

**This belongs in Phase 1 (Dojo Layer), task 1.11.**

---

## ADDENDUM: `useNftBalance` env var clarification

The budokan `useNftBalance.ts` reads from `VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS` (not in `.env.slot`).
The new-client `useNftBalance.ts` also reads from `VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS`.
But `.env.slot` has `VITE_PUBLIC_GAME_TOKEN_ADDRESS`.

**Resolution**: Either:
- (a) Add `VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS` to `.env.slot` pointing to the ERC721 game token, OR
- (b) Update `useNftBalance.ts` to read from `VITE_PUBLIC_GAME_TOKEN_ADDRESS`

The correct approach depends on whether there's a separate credits token. Since v2 uses ERC721 `FullTokenContract` for game NFTs, and the address in `.env.slot` is the game token, option (b) is cleaner: update the hook to use `VITE_PUBLIC_GAME_TOKEN_ADDRESS`.

**This belongs in Phase 4 (Port New Hooks), task 3.3.**

---

## Updated Phase Summary (10 Phases)

| Phase | Name | Tasks | Depends On |
|-------|------|-------|------------|
| 0 | Environment & Config | .env.slot, constants.ts, manifest | — |
| 1 | Dojo Layer | contractModels, contractSystems, setup, systems, runData, game.ts, level.ts, torii helper | Phase 0 |
| 2 | Remove Dead v1.2 Code | Delete 5 pages, 3 hooks, 4 types, quest model, quest context, cube store | Phase 1 |
| 3 | gameId number→bigint | 13 files, 37 occurrences (types→hooks→components) | Phase 1 |
| 4 | Port New Hooks | useTokenBalance, useZStarBalance, useNftBalance, usePlayerMeta, useGame, usePlayerBestRun, useZoneProgress, useQuests, useAchievements, daily hooks, useGrid, useGameLevel, useGameTokensSlot | Phase 1 |
| 5 | Port New Config Files | questDefs, achievementDefs, mutatorConfig, profileData, bossIdentities | Phase 0 |
| 6 | Port New Pages | ProfilePage, DailyChallengePage, BossRevealPage, MutatorRevealPage, shared components | Phases 4+5 |
| 7 | Update Existing Pages | HomePage, PlayScreen, MapPage, LeaderboardPage, MyGamesPage, SettingsPage | Phases 3+4 |
| 8 | Navigation & Routing | navigationStore, App.tsx, main.tsx | Phases 2+6+7 |
| 9 | Build, Test, Verify | tsc, vitest, dev server, smoke test | Phase 8 |

### Parallelism
- Phases 2, 3, 4, 5 can ALL run in parallel after Phase 1
- Phases 6, 7 can run in parallel after Phases 3+4+5
- Phase 8 depends on 2+6+7
- Phase 9 is sequential gate

### Commit Strategy (10 atomic commits)
1. `chore: update env, manifest, and config files for v2 contracts` (Phase 0+5)
2. `feat: replace dojo layer with v2 models, systems, packing, and game class` (Phase 1)
3. `chore: remove dead v1.2 code (draft, skill tree, CUBE, old quests)` (Phase 2)
4. `refactor: migrate gameId from number to bigint across 13 files` (Phase 3)
5. `feat: port new hooks (token balance, zStar, quests, achievements, daily, zone)` (Phase 4)
6. `feat: add ProfilePage, DailyChallengePage, BossRevealPage, MutatorRevealPage` (Phase 6)
7. `feat: update existing pages for v2 (mode selection, bonus system, zStar)` (Phase 7)
8. `feat: update navigation store and routing for v2 page structure` (Phase 8)
9. `fix: resolve build errors and type mismatches` (Phase 9)
10. `test: add runDataPacking tests and verify all packing tests pass` (Phase 9)
