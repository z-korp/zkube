# zKube Quest System Implementation Plan

## Overview

Daily quest system where players can farm CUBE tokens by completing gameplay objectives.

> **Note:** Frontend file paths below reference `client-budokan/` which is being dropped. The active frontend is `mobile-app/`.

**Reference:** `/home/djizus/zkube/references/nums/` - Cartridge arcade quest implementation

---

## Progress Tracker

### Phase 1: Contract Foundation ✅ COMPLETED
- [x] Add `quest` and `achievement` dependencies to Scarb.toml
- [x] Create `contracts/src/elements/tasks/` module
- [x] Create `contracts/src/elements/quests/` module  
- [x] Create `contracts/src/systems/quest.cairo`
- [x] Add quest initialization to dojo_init
- [x] Update lib.cairo with new modules
- [ ] Write unit tests (deferred to Phase 5)

### Phase 2: Game Integration ✅ COMPLETED
- [x] Add IQuestSystemDispatcher to game.cairo
- [x] Modify `create_with_cubes()` to track games started (Grinder task)
- [x] Modify `move()` to track lines cleared (LineClearer task) and combos (ComboThree/Five/Eight)
- [x] Update cube_token dojo_init to grant MINTER_ROLE to quest_system
- [ ] Write integration tests (deferred to Phase 5)

### Phase 3: Frontend - Data Layer ✅ COMPLETED
- [x] Create QuestsContext with Torii subscriptions
- [x] Create useQuests hook
- [x] Add quest models to TypeScript bindings
- [x] Implement quest claim transaction

### Phase 4: Frontend - UI ✅ COMPLETED
- [x] Create QuestsPanel component (QuestsDialog)
- [x] Create QuestCard component
- [x] Create QuestTimer countdown
- [x] Add to main game UI (QuestsButton in headers)
- [x] Mobile responsive styling

### Phase 5: Testing & Deployment
- [ ] End-to-end testing on slot
- [ ] Test daily reset mechanics
- [ ] Balance reward amounts
- [ ] Deploy to Sepolia

---

## Quest Design

### Daily Quests (10 total)

| Category | Quest ID | Name | Task | Threshold | Reward |
|----------|----------|------|------|-----------|--------|
| Player | `DAILY_PLAYER_ONE` | Warm-Up | Play 1 game | 1 | 3 CUBE |
| Player | `DAILY_PLAYER_TWO` | Getting Started | Play 3 games | 3 | 6 CUBE |
| Player | `DAILY_PLAYER_THREE` | Dedicated | Play 5 games | 5 | 12 CUBE |
| Clearer | `DAILY_CLEARER_ONE` | Line Breaker | Clear 10 lines | 10 | 3 CUBE |
| Clearer | `DAILY_CLEARER_TWO` | Line Crusher | Clear 30 lines | 30 | 6 CUBE |
| Clearer | `DAILY_CLEARER_THREE` | Line Master | Clear 50 lines | 50 | 12 CUBE |
| Combo | `DAILY_COMBO_ONE` | Combo Starter | Achieve 3+ combo | 1 | 5 CUBE |
| Combo | `DAILY_COMBO_TWO` | Combo Builder | Achieve 5+ combo | 1 | 10 CUBE |
| Combo | `DAILY_COMBO_THREE` | Combo Expert | Achieve 8+ combo | 1 | 20 CUBE |
| Finisher | `DAILY_FINISHER` | Daily Champion | Complete all 9 | 9 | 25 CUBE |

**Total Daily Rewards: 102 CUBE tokens**

### Quest Chain Dependencies

```
Player:   ONE ──► TWO ──► THREE
                              │
Clearer:  ONE ──► TWO ──► THREE ──┐
                                  │
Combo:    ONE ──► TWO ──► THREE ──┼──► FINISHER
                                  │
```

---

## Task Definitions

```cairo
pub enum Task {
    None,
    // Daily tasks
    Grinder,        // Games played (daily)
    LineClearer,    // Lines cleared (daily)
    ComboThree,     // 3+ line combos (daily)
    ComboFive,      // 5+ line combos (daily)
    ComboSeven,     // 7+ line combos (daily)
    DailyMaster,    // Daily quests completed
    
    // Achievement tasks (permanent)
    TotalGames,     // Lifetime games
    TotalLines,     // Lifetime lines
    TotalCubes,     // Lifetime cubes
    BestCombo,      // Best combo ever
    BestLevel,      // Best level reached
}
```

---

## File Structure

### Contracts (Cairo)

```
contracts/src/
├── elements/
│   ├── mod.cairo
│   ├── tasks/
│   │   ├── mod.cairo
│   │   ├── index.cairo      # Task enum
│   │   └── interface.cairo  # TaskTrait
│   └── quests/
│       ├── mod.cairo
│       ├── index.cairo      # QuestType enum, constants
│       ├── interface.cairo  # QuestTrait
│       ├── player.cairo     # DailyPlayerOne/Two/Three
│       ├── clearer.cairo    # DailyClearerOne/Two/Three
│       ├── combo.cairo      # DailyComboOne/Two/Three
│       └── finisher.cairo   # DailyFinisher
├── systems/
│   └── quest.cairo          # Quest system with QuestableComponent
└── lib.cairo                # Updated with new modules
```

### Frontend (TypeScript/React)

```
client-budokan/src/
├── contexts/
│   └── QuestsContext.tsx
├── hooks/
│   └── useQuests.ts
└── ui/components/
    ├── QuestsPanel.tsx
    ├── QuestCard.tsx
    └── QuestTimer.tsx
```

---

## Constants

```cairo
pub const QUEST_COUNT: u8 = 10;
pub const ONE_DAY: u64 = 86400;  // 24 * 60 * 60 seconds

// Quest rewards (in CUBE tokens)
pub const REWARD_PLAYER_ONE: u8 = 3;
pub const REWARD_PLAYER_TWO: u8 = 6;
pub const REWARD_PLAYER_THREE: u8 = 12;
pub const REWARD_CLEARER_ONE: u8 = 3;
pub const REWARD_CLEARER_TWO: u8 = 6;
pub const REWARD_CLEARER_THREE: u8 = 12;
pub const REWARD_COMBO_ONE: u8 = 5;
pub const REWARD_COMBO_TWO: u8 = 10;
pub const REWARD_COMBO_THREE: u8 = 20;
pub const REWARD_FINISHER: u8 = 25;
```

---

## Integration Points in game.cairo

| Function | Quest Progress |
|----------|---------------|
| `create_with_cubes()` | +1 Grinder (games played) |
| `move()` | +N LineClearer (lines cleared) |
| `move()` | +1 ComboThree/Five/Eight (if combo achieved) |
| `handle_game_over()` | Finalize run stats |

---

## Dependencies

Add to `contracts/Scarb.toml`:

```toml
[dependencies]
quest = { git = "https://github.com/cartridge-gg/arcade", rev = "1c66ba7" }
achievement = { git = "https://github.com/cartridge-gg/arcade", rev = "1c66ba7" }
```

Add to `build-external-contracts`:

```toml
# Quest models
"quest::models::index::m_QuestDefinition",
"quest::models::index::m_QuestCompletion", 
"quest::models::index::m_QuestAdvancement",
"quest::models::index::m_QuestAssociation",
"quest::models::index::m_QuestCondition",
# Quest events
"quest::events::index::e_QuestCreation",
"quest::events::index::e_QuestProgression",
"quest::events::index::e_QuestUnlocked",
"quest::events::index::e_QuestCompleted",
"quest::events::index::e_QuestClaimed",
```

---

## Notes

- Quests reset daily at midnight UTC
- Quest chains require completing previous tier first
- CUBE tokens are soulbound ERC1155 (cannot be transferred)
- Quest system needs MINTER_ROLE to award CUBE rewards
- Frontend uses Torii subscriptions for real-time progress updates

---

## Known Limitations

### Cartridge Controller Quest UI Claim Button Does Not Work

**Issue:** The Cartridge Controller's built-in profile quest UI (opened via `controller.openProfile()`) has a claim button that does not work. When clicked, it produces an `ENTRYPOINT_NOT_FOUND` error because the Controller tries to call a different contract than our quest_system.

**Error example:**
```
Contract address= 0x4364d8e9f994453f5d...
Nested error: ENTRYPOINT_NOT_FOUND
```

**Root cause:** The Cartridge Controller's built-in quest UI is designed for Cartridge's internal arcade infrastructure and calls a Cartridge-hosted quest claiming contract that either:
1. Doesn't exist on the network
2. Isn't configured for the zKube namespace

**Workaround:** Use the in-game QuestsDialog (opened via the Quests button) instead. This uses our custom claim implementation that calls the quest_system.claim() entrypoint correctly.

The custom claim works via:
1. `systemCalls.claimQuest()` in `client-budokan/src/dojo/systems.ts`
2. Which calls the `quest_system.claim()` entrypoint
3. Which uses the QuestableComponent from Cartridge's arcade package

---

## Quest Family UI (v1.2.1+)

Quests are displayed as **families with cumulative progress**:

### Families

| Family | Quests | Total Reward |
|--------|--------|--------------|
| Play Games | Tier 1 (1 game), Tier 2 (3 games), Tier 3 (5 games) | 21 CUBE |
| Clear Lines | Tier 1 (10 lines), Tier 2 (30 lines), Tier 3 (50 lines) | 21 CUBE |
| Achieve Combos | Tier 1 (3+ combo), Tier 2 (5+ combo), Tier 3 (8+ combo) | 35 CUBE |
| Daily Champion | Complete all 9 quests | 25 CUBE |

### Cumulative Progress

Progress is shared across tiers in a family. If you play 3 games:
- Tier 1 (1 game): ✓ Completed
- Tier 2 (3 games): ✓ Completed  
- Tier 3 (5 games): 3/5 in progress

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `QuestFamilyCard` | Shows a family with all tiers, progress bar, and claim button |
| `QuestsDialog` | Main dialog showing all families and Daily Champion |
| `constants.ts:QUEST_FAMILIES` | Configuration mapping families to quest IDs |
| `contexts/quests.tsx:questFamilies` | Computed family data from raw quests |
