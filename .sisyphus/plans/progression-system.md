# zKube Progression System

> **STATUS: Contract Implementation Complete**
> All contract-side workstreams implemented and verified. CI green.
> Remaining: Client integration (Workstream D) not yet started.
>
> Commits on `djizus-sepolia-simplify`:
> - `438d31d4` Phase 0+1: Foundation (zStar token, model extensions, arcade deps, tasks)
> - `323ba9a9` XP reward wiring (zone clear +10k, welcome back +500)
> - `5e8cd78e` Daily challenge star rewards + permissionless settlement
> - `f9cc20e9` Quest + achievement system (arcade component embedding)
> - `35440bc5` Weekly endless leaderboard with permissionless settlement
> - `4fb8f4d8` Star-eligibility gate + delta star minting + first-clear-only ZoneComplete
> - `b7f2d21d` DailyQuestDone task separation + weekly quest param fixes
> - `8c8c83a1` CI formatting fix

## What Was Built

### Contracts (complete)
- **zStar Token**: Soul-bound ERC20 (DECIMALS: 0), AccessControl, transfer-blocking hook
- **12 Quests**: 9 daily rotating (3 slots x 3 variants) + 1 daily finisher + 2 weekly
- **24 Achievements**: 6 categories x 4 tiers (Grinder, Sweeper, Combo Master, Boss Slayer, Explorer, Challenger)
- **12 Task IDs**: LineClear, Combo3/4/5, BonusUsed, GameStart, LevelComplete, PerfectLevel, BossDefeat, ZoneComplete, DailyPlay, DailyQuestDone
- **Zone Unlock**: purchase_map (USDC with 90% cap discount) + unlock_with_stars (burn zStar)
- **Star Eligibility**: Whitelist in config_system, gating all progression rewards
- **Delta Star Minting**: finalize_level mints only improvement over previous best per level
- **Zone Clear Bonus**: +100 zStar + 10k XP on first boss defeat
- **Welcome Back**: +5 zStar + 500 XP after 7 days inactive
- **Daily Challenge Stars**: +3 on first submission + percentile leaderboard payouts
- **Weekly Endless Leaderboard**: Model + submission + permissionless settlement
- **Cosmetic Models**: CosmeticUnlock + CosmeticDef (future hook, no UI yet)
- **XP System**: lifetime_xp in PlayerMeta (monotonic, saturating)

### Client (not started)
- Workstream D: useZStarBalance, QuestsProvider, useAchievements, ProfilePage wiring, UnlockModal, HUD star counter, toast notifications

## Full Plan Details
See conversation context for the complete plan with user stories, star economy balance sheet, and design decisions.
