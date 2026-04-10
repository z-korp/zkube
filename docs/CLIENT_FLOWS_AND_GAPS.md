# zkube Client Flows & Gap Analysis

Last updated: 2026-04-08 — audited against slot deployment (`zkube_v2_1_0`)

---

## User Stories & Flows

### US-1: New Player Onboarding
**As a** new player, **I want to** start playing quickly, **so that** I can experience the game.

**Current flow:**
1. Land on Home → see logo + "PLAY NOW" button
2. Click PLAY NOW → Cartridge Controller wallet popup
3. Approve → wallet connected → Home shows zone selection + daily challenge
4. Zone 1 (Polynesian) is free → click "Start Story" → game starts

**Status:** Working. No tutorial or onboarding guide exists.

**Gap:** No in-game tutorial. New players don't understand block mechanics, combos, or constraints.

---

### US-2: Story Mode — Play a Zone
**As a** player, **I want to** progress through zone levels, **so that** I can earn stars and unlock new zones.

**Current flow:**
1. Home → select zone → click "Start Story"
2. `start_story_attempt(zone_id)` → creates game → navigate to Map
3. Map shows 10 level nodes (locked/available/cleared/boss)
4. Click available level → LevelPreview → click Play → PlayScreen
5. Play game → complete level (score >= target + constraints) → LevelCompleteDialog
6. Dialog shows stars earned → Continue → back to Map with next level available
7. Level 10 = Boss → BossRevealPage shows constraints → Fight → PlayScreen
8. Beat boss → zone cleared → game over → VictoryDialog

**Status:** Working.

**Gaps:**
- No "zone clear" reward display (contract mints 100 zStar on first clear — user never sees this)
- No zone perfection claim UI (contract has `claim_zone_perfection` for 30-star bonus — no button exists)
- Stars earned from level completion (delta minting) not shown to user
- No indication of zStar earned during or after gameplay

---

### US-3: Story Mode — Replay a Level
**As a** player, **I want to** replay a previously completed level, **so that** I can earn more stars.

**Current flow:**
1. Map → click any cleared/available level → LevelPreview → Play
2. `replay_story_level(zone_id, level)` → new game → PlayScreen

**Status:** Working.

**Gap:** No clear indication that replaying improves stars. The delta-mint system (only mints improvement) is invisible to the user.

---

### US-4: Endless Mode
**As a** player, **I want to** play endless mode on a zone, **so that** I can compete on the weekly leaderboard.

**Current flow:**
1. Home → select zone → toggle to "Endless" mode → click "Play Endless"
2. `freeMint()` + `create(token_id, 1)` → creates game → MutatorRevealPage
3. See mutator roll + bonus assignment → click "START ENDLESS"
4. Play until game over → GameOverDialog → Home

**Prerequisites:** Must have cleared story zone boss (level 10) to unlock endless.

**Status:** Working.

**Gaps:**
- No display of current difficulty tier or score multiplier during gameplay (fixed in earlier commit — GameHud now reads from settings)
- Weekly leaderboard reward cycle not communicated to user (when does week reset? what's the current week?)
- No "my best endless score" display on home page
- No post-game summary showing ranking improvement

---

### US-5: Daily Challenge
**As a** player, **I want to** play the daily challenge, **so that** I can compete for daily rewards.

**Current flow:**
1. Home → click "Daily Challenge" → DailyChallengePage
2. See zone, mutators, top 3, countdown timer
3. Click "PLAY DAILY" → `start_daily_game()` → PlayScreen
4. Play → game over → results auto-submitted
5. Return to Daily page → see updated rank and best score

**Status:** Partially working (daily_challenge_system is on slot manifest).

**Gaps:**
- **No reward display after settlement** — contract settles with zStar rewards but player never sees "You earned X zStar"
- **No claim button** — settlement is admin-triggered (oracle), not player-claimed
- **DailyEntry.star_reward** is set during settlement but not displayed prominently
- **No historical daily results** — only today's challenge visible
- First-time daily participation bonus (3 zStar + 30 XP) not communicated

---

### US-6: Weekly Endless Settlement & Rewards
**As a** player, **I want to** know what I earned from the weekly endless leaderboard.

**Current flow:** DOES NOT EXIST.

**Contract:** `settle_weekly_endless(week_id, settings_id, ranked_players)` distributes zStar rewards:
- Top 1%: 30 zStar
- Top 5%: 20 zStar
- Top 10%: 15 zStar
- Top 25%: 10 zStar
- Top 50%: 3 zStar

**Gaps:**
- **No weekly cycle indicator** (when does the week end?)
- **No settlement status display** (has this week been settled?)
- **No reward notification** after settlement
- **No historical weekly results**
- Settlement is admin-triggered — player has no visibility

---

### US-7: Zone Unlocking
**As a** player, **I want to** unlock new zones, **so that** I can access new content.

**Current flow:**
1. Profile → Overview tab → see locked zones with costs
2. Click unlock → UnlockModal → confirm
3. Two paths: `purchase_zone_access` (pay USDC/STRK) or `unlock_zone_with_stars` (burn zStar)
4. Hybrid payment: up to 50% zStar discount on USDC price

**Status:** UI exists in profile. UnlockModal handles both paths.

**Gaps:**
- Unlock option also exists on Home page zone cards but leads to same flow
- No confirmation of successful unlock (toast or animation)
- Hybrid payment calculation not shown to user before confirming

---

### US-8: Quest Completion & Claiming
**As a** player, **I want to** complete quests and claim rewards, **so that** I can earn zStar.

**Current flow:**
1. Profile → Quests tab → see active quests with progress
2. Quest auto-progresses from gameplay (LineClear, Combo, etc.)
3. When complete → "Claim" button appears
4. Click Claim → `quest_claim(player, quest_id, interval_id)` → mints zStar

**Quest types:**
- Daily (8 rotating): 1 zStar each
- Daily Finisher (complete 3): 2 zStar
- Weekly (2): 5 zStar each

**Status:** Working (progress_system on slot).

**Gaps:**
- No notification/badge on bottom nav when quests are claimable
- Quest progress not shown during gameplay
- Daily quest reset time not displayed

---

### US-9: Zone Perfection Claim
**As a** player who earned 3 stars on all 10 levels, **I want to** claim my perfection bonus.

**Contract:** `claim_zone_perfection(zone_id)` → 20 zStar + 700 XP (one-time per zone)

**Current flow:** DOES NOT EXIST in UI.

**Gap:** No "Claim Perfection" button anywhere. Contract entrypoint exists but has no UI.

---

### US-10: View Rewards History
**As a** player, **I want to** see how many zStar I've earned and from where.

**Current flow:** Profile shows total zStar balance. That's it.

**Gaps:**
- No reward breakdown (from quests vs daily vs weekly vs zone clears)
- No transaction history
- No "recently earned" notification

---

## Feature Coverage Matrix

| Contract Feature | Client UI | Status |
|---|---|---|
| **Story mode** (start/play/level-up/boss) | Home → Map → Play → Dialogs | Working |
| **Story replay** (replay_story_level) | Map → LevelPreview → Play | Working |
| **Endless mode** (create_run type=1) | Home → MutatorReveal → Play | Working |
| **Daily challenge** (start_daily_game) | Home → Daily → Play | Working |
| **Move & grid** (move, gravity, combos) | PlayScreen Grid | Working |
| **Bonus system** (apply_bonus) | PlayScreen action bar | Working |
| **Surrender** (surrender) | PlayScreen action bar | Working |
| **Zone purchase** (purchase_zone_access) | Profile → UnlockModal | Working |
| **Zone unlock with stars** (unlock_zone_with_stars) | Profile → UnlockModal | Working |
| **Quest claiming** (quest_claim) | Profile → Quests tab | Working |
| **Leaderboard — Endless** (PlayerBestRun) | Ranks → Endless tab (per-zone) | Working |
| **Leaderboard — Player** (PlayerMeta XP) | Ranks → Player tab | Working |
| **Leaderboard — Daily** (DailyEntry) | Ranks → Daily tab | Working (empty if no challenge) |
| **Zone perfection claim** (claim_zone_perfection) | **MISSING** | No UI |
| **Daily settlement rewards** (settle_challenge) | **MISSING** | Admin-side, no player visibility |
| **Weekly endless rewards** (settle_weekly_endless) | **MISSING** | Admin-side, no player visibility |
| **Reward notifications** (zStar earned) | **MISSING** | No toast/badge on earn |
| **Weekly cycle info** (week end, settlement) | **MISSING** | No UI |
| **Achievement claiming** | Profile → Achievements tab | Partial (display only?) |
| **Cosmetics** (CosmeticDef/CosmeticUnlock) | **MISSING** | Models exist, no system/UI |
| **Returner bonus** (5 zStar after 7d inactive) | **MISSING display** | Contract mints silently |
| **Star delta display** (improvement mint) | **MISSING** | LevelComplete dialog doesn't show zStar earned |

---

## Priority Gaps (Ordered by User Impact)

### P0 — Critical (Revenue/Engagement)
1. **Zone perfection claim button** — players earn 30 stars but can't claim 20 zStar bonus
2. **Post-settlement reward display** — daily/weekly rewards invisible to players
3. **zStar earned notifications** — no feedback when earning currency

### P1 — High (Retention/Understanding)
4. **Weekly cycle indicator on Endless leaderboard** — when does the week end?
5. **Daily reward tier display** — show what you'd earn at your current rank
6. **Level completion zStar display** — show star delta and zStar earned in LevelCompleteDialog
7. **Quest notification badge** — show count on Profile bottom nav tab

### P2 — Medium (Polish)
8. **Hybrid payment preview** — show zStar discount before zone purchase
9. **Historical daily/weekly results** — past challenge rankings
10. **Endless post-game ranking** — show leaderboard position after game over
11. **Returner bonus toast** — show "Welcome back! +5 zStar" on first game after absence

### P3 — Low (Nice-to-have)
12. **Tutorial/onboarding** — teach blocks, combos, constraints
13. **Cosmetics shop** — contract models exist but no system
14. **Transaction/reward history page**
15. **Achievement claiming** — verify it works end-to-end

---

## Settlement Architecture Note

Daily and weekly settlements are **admin-triggered** (off-chain oracle/keeper calls the contract after the period ends). Players do NOT trigger settlement themselves.

**Player-visible claim actions:**
- `quest_claim` — player triggers directly (**has UI**)
- `claim_zone_perfection` — player triggers directly (**NO UI**)

**Admin-triggered settlements (player receives rewards passively):**
- `settle_challenge` — admin provides ranked player list, contract mints zStar
- `settle_weekly_endless` — admin provides ranked player list per zone

**The "claim" the user wants to see** is really just a notification: "Your daily/weekly rank was X, you earned Y zStar." The zStar is already minted to them during settlement — they just need to know it happened.

Implementation options:
1. **Poll DailyEntry.star_reward** — if > 0 and was recently settled, show notification
2. **Subscribe to ZoneClearBonus events** — show zone clear reward toast
3. **Show reward in DailyChallengePage** — after settlement, display earned amount
4. **Add "Rewards" section to Profile** — aggregate all reward sources
