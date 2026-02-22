# zKube System Redesign Spec

> Status: active redesign
> Goal: replace shop/economy maintenance with structured draft decisions and run identity

---

## 1. Core Shift

### Remove
- In-game shop flow
- Buying charges/upgrades/relics during run
- Shop budget accounting in run progression

### Replace With
- Structured draft events as the only in-run build engine
- Performance-driven charges (not purchasable)
- Cubes reserved for meta progression and draft rerolls

### Design Principles
- Runs are shaped by decisions, not purchasing loops
- Power spikes come from drafts and bosses
- Risk is explicit and opt-in
- Mid-run identity evolves in discrete moments

---

## 2. Economy Model

### In-run Economy
- No in-run shop currency loop
- No buying charges
- No buying upgrades
- No buying relics

### Cube Usage
- Cubes are meta currency
- Cubes can be spent on:
  - Skill tree unlocks
  - Draft rerolls (per-choice reroll cost)

---

## 3. Zone Structure and Draft Timing

## Zone Definition
- Zone 1: levels 1-9, Boss 1: level 10
- Zone 2: levels 11-19, Boss 2: level 20
- Zone 3: levels 21-29, Boss 3: level 30
- Zone 4: levels 31-39, Boss 4: level 40
- Zone 5: levels 41-49, Boss 5: level 50

## Draft Timing
- After level 1 clear: Draft event (always)
- After each boss clear at 10/20/30/40: Draft event (always)
- One micro-draft per zone: exactly one random trigger level in local zone levels 2..8

Expected total draft events per full run: 6-7.

---

## 4. Draft Event Structure

Each draft event always presents exactly 3 cards with dedicated pool identity:
- Card 1: Bonus pool
- Card 2: Upgrade pool
- Card 3: World pool

Pool definitions:
- Bonus pool: new bonus offers only
- Upgrade pool: bonus upgrades and specialization offers
- World pool: zone modifiers, risk contracts, relics (rarity gated)

### Draft Flow
1. Draft opens at trigger point.
2. Player sees 3 choice cards.
3. Player can reroll any individual card for cube cost.
4. Player confirms one final choice.
5. Effect is applied and run continues.

---

## 5. Reroll Rules (Required)

## Hard Requirements
- Player can reroll each of the 3 choice slots independently.
- Reroll has cube cost.
- Reroll only replaces the targeted slot.
- Other slots remain unchanged.

## Recommended Cost Curve
- Base reroll cost: 5 cubes
- Per-slot reroll escalation:
  - 1st reroll on slot: 5
  - 2nd reroll on same slot: 8
  - 3rd reroll on same slot: 12

Alternate global curve can be evaluated later.

## Validation Rules
- Reroll denied when wallet balance is insufficient.
- Reroll increments only for the rerolled slot.
- Final selected draft choice cannot be rerolled after confirmation.

---

## 6. Charges in This Model

Charges remain performance-based.

No charge purchasing path exists.

Primary charge gain sources stay tied to skill events:
- High line clears
- Combo streak milestones
- Constraint completion rewards
- Boss rewards

---

## 7. Contract-Side Implementation Preparation

## New/Updated Models
- `DraftState` (new, per run)
  - `active: bool`
  - `draft_stage: u8` (post_level_1, post_boss_1..4, zone_micro)
  - `choice_1`, `choice_2`, `choice_3` (packed choice descriptors)
  - `reroll_count_1`, `reroll_count_2`, `reroll_count_3`
  - `resolved: bool`
- `Game`/`run_data`
  - Remove shop gating dependencies from progression logic
  - Keep only fields needed for gameplay and charge economy

## Systems
- `draft_system` (new)
  - `open_draft(game_id, stage)`
  - `reroll_draft_choice(game_id, slot_index)`
  - `select_draft_choice(game_id, slot_index)`
  - `get_draft_state(game_id)`

- `game_system` updates
  - Keep run creation clean (no draft at creation)

- `level_system` updates
  - Trigger drafts after level 1, after bosses 10/20/30/40, and once per zone on seeded random local level 2..8
  - Keep level 50 as terminal without post-victory draft

## Notes
- Shop system can remain deployed but must no longer be in active run path.
- Draft choice generation should be deterministic from seed + stage + reroll counter.

---

## 8. Frontend Implementation Preparation

## Current Direction
- Draft page is now the in-run decision gate.
- Draft events are opened by level-completion triggers.

## Required Frontend Behavior
- Show exactly 3 choice cards in draft UI.
- Per-card reroll button with displayed cube cost.
- Confirmation action to lock one choice and continue run.
- Trigger draft at:
  - After level 1 completion
  - After boss completions at 10/20/30/40
  - One seeded micro-draft per zone on local level 2..8

## Data Contracts Needed
- Draft choice payload type (kind, title, effect payload, rarity)
- Draft state payload (active stage, reroll counts, choices)

---

## 9. Implementation Plan

### Iteration A - Cleanup Foundation
- Remove in-run shop navigation and shop-gated progression from active flow.
- Keep only draft path for run decisions.
- Ensure run completion and boss progression still work.

### Iteration B - Draft MVP (Frontend + deterministic local generation)
- 3 draft choices UI
- Per-choice reroll with cube cost UX
- Route triggers for level 1, post-boss, and seeded micro-drafts
- Local deterministic generator wired to game seed/level

### Iteration C - Onchain Draft System
- Add `DraftState` model and `draft_system`
- Persist reroll counts and selected effects onchain
- Charge cube reroll cost via token flow
- Replace local generation with onchain state

### Iteration D - Micro-Draft + Balance
- Tune seeded micro-draft distribution across zones
- Tune pool weights, rarity, reroll cost curve
- Validate median and high-skill run outcomes

---

## 10. Open Questions

- Should reroll cost be per-slot or global across all slots in a draft?
- Should relic pool unlock at Boss 3+ or Boss 2+?
- Should draft choice generation avoid duplicate category cards in one event?
- Should draft events hard-block gameplay until resolved?

---

## 11. What Stays Unchanged

- Grid core: 8x10, gravity, line clears
- 50-level run with boss cadence at 10/20/30/40/50
- Constraint and difficulty framework
- Dojo world + Torii sync architecture
