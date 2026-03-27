# zKube Cairo Contracts Assessment + Embeddable Standard Migration Plan

## Overview
This plan delivers a full assessment of zKube contracts against `cartridge-gg/nums` and `djizus/athanor@game-jam-viii`, then maps a migration path to the embeddable game standard used by Athanor on Sepolia. The assessment is intentionally blunt: zKube has strong game logic and packaging depth, but architecture cohesion and standard alignment are behind current reference practice.

## Goals
- Provide an evidence-based, no-sugarcoat comparative assessment (1–5 ratings) across structure, dependencies, Dojo patterns, Cairo practices, security, gas, tests, embeddable standard, and code quality.
- Define a concrete migration plan to adopt the embeddable game standard pattern proven in Athanor while preserving zKube game mechanics.
- Prioritize correctness/security fixes and reduce migration risk via phased serial+parallel execution.

## Non-Goals
- No code implementation in this phase.
- No frontend redesign scope beyond interface compatibility notes.
- No backward-compatible migration requirement (fresh world is accepted by decision).

## Assumptions and Constraints
- zKube current stack: Dojo `1.8.0`, Cairo `2.13.1` (`/home/djizus/projects/zkube/Scarb.toml:13,28`).
- Athanor reference uses Dojo `1.8.0`, Cairo `2.15.1`, and `game_components_embeddable_game_standard` (`/tmp/athanor/Scarb.toml`, `/tmp/athanor/contracts/Scarb.toml:14`).
- Existing zKube prod namespace is `zkube_budo_v1_2_0` (`/home/djizus/projects/zkube/dojo_sepolia.toml:16`).
- User decisions locked:
  - Breaking changes are allowed; fresh world migration is acceptable.
  - Execute deeper refactor first (security/gas/test quality), then embeddable migration.
  - Migration strictness requires explicit parity-vs-adaptation analysis (captured below).

## Requirements

### Functional
- Produce comparative ratings with concrete file/line evidence.
- Identify exact embeddable standard deltas between zKube and Athanor.
- Deliver phased migration plan with dependencies, outputs, validation, and rollback strategy.

### Non-Functional
- Security-first recommendations with explicit risk ranking.
- Migration must be incrementally testable on Slot and Sepolia.
- Plan must include executable verification commands and success criteria.

## Technical Design

### Data Model
Current zKube model landscape is rich but fragmented across many writer systems.

- zKube models include game runtime + meta + daily challenge models (`/home/djizus/projects/zkube/contracts/src/models/*.cairo`).
- Writer permissions are broad (e.g., `Game`, `GameLevel`, `DailyEntry` writable by multiple systems) (`/home/djizus/projects/zkube/dojo_sepolia.toml:28-30,74-75`).
- Athanor pattern centralizes mutable game state via typed `Store` and narrower contract responsibility (`/tmp/athanor/contracts/src/store.cairo`, `/tmp/athanor/dojo_sepolia.toml:15-20`).

Target direction:
- Preserve zKube domain models, but reduce write surface per model.
- Introduce stricter ownership boundaries aligned with embeddable minigame lifecycle hooks.

### API Design
Current zKube:
- `game_system` exposes gameplay core but does not uniformly wrap action lifecycle around an embeddable-standard pre/post adapter (`/home/djizus/projects/zkube/contracts/src/systems/game.cairo`).

Reference (Athanor):
- `Play` embeds `IMinigameTokenData` and wraps every action with `before()`/`after()` hooks (`/tmp/athanor/contracts/src/systems/play.cairo:107-140,142+`).
- `Setup` embeds settings extension interfaces (`IMinigameSettings`, `IMinigameSettingsDetails`) (`/tmp/athanor/contracts/src/systems/setup.cairo:18-23,120-177`).

Target direction:
- zKube game-facing APIs keep gameplay semantics but enforce standard lifecycle wrappers across all state-mutating entrypoints.

### Architecture

Comparative snapshot:

1) **Athanor (reference for embeddable standard)**
- `Play` contract embeds `MinigameComponent` + `SRC5` + gameplay component (`/tmp/athanor/contracts/src/systems/play.cairo:39-48`).
- `dojo_init` initializes embeddable metadata + settings linkage + token address (`/tmp/athanor/contracts/src/systems/play.cairo:71-105`).
- `Setup` contract embeds settings extension, owns settings lifecycle (`/tmp/athanor/contracts/src/systems/setup.cairo:37-43,63-118`).

2) **Nums (reference for productionized dependency hygiene + ecosystem integration)**
- Heavy external-contract/event/model registration and rich integration footprint (`/tmp/nums/contracts/Scarb.toml:13-46`).
- Strong multi-system deployment choreography (`/tmp/nums/dojo_sepolia.toml:16-27`).

3) **zKube current**
- Feature-rich but highly coupled systems and broad writers config (`/home/djizus/projects/zkube/dojo_sepolia.toml:26-77`).
- Uses legacy `game_components_minigame` package path, not embeddable-standard package used by Athanor (`/home/djizus/projects/zkube/contracts/Scarb.toml:30` vs `/tmp/athanor/contracts/Scarb.toml:14`).

### Embeddable Strictness Analysis (Parity vs Adaptation)

#### Does embeddable standard conflict with CUBE token or quests?
Short answer: **no fundamental conflict**. The embeddable standard primarily governs game-session token lifecycle + settings interfaces. zKube’s CUBE and quest systems are orthogonal and can coexist.

Concrete evidence:
- CUBE minting is already gated by settings policy, not by minigame standard internals (`/home/djizus/projects/zkube/contracts/src/helpers/game_over.cairo:36-43`, `/home/djizus/projects/zkube/contracts/src/constants.cairo:55-62`).
- Quest progression is emitted from move/game flows and also gated by default settings (`/home/djizus/projects/zkube/contracts/src/systems/moves.cairo:85-163`, `/home/djizus/projects/zkube/contracts/src/helpers/game_libs.cairo:81-107`).
- Quest rewards mint CUBE via `cube_token` dispatcher (`/home/djizus/projects/zkube/contracts/src/systems/quest.cairo:125-131`).
- Cube minter authorization is role-based and independent from minigame settings extension (`/home/djizus/projects/zkube/contracts/src/systems/cube_token.cairo:72-155`).

What actually changes under embeddable migration:
- lifecycle wrappers become stricter and must be applied uniformly to mutating actions (Athanor-style `before/after`) (`/tmp/athanor/contracts/src/systems/play.cairo:142+`).
- settings extension implementation moves toward a dedicated Setup boundary (`/tmp/athanor/contracts/src/systems/setup.cairo:120-177`).

#### Option A — Strict Athanor-style parity

**What it entails**
- Mirror Athanor architecture: minimal Play + Setup with embeddable interfaces as first-class contract boundary.
- Keep side systems (cube/quest/achievement/daily) as auxiliary systems called from Play lifecycle-safe points.

**Pros**
- Fastest path to known-good embeddable shape (lower ambiguity).
- Cleaner integration surface for external tooling expecting embeddable conventions.
- Easier future onboarding: references map 1:1 to Athanor patterns.

**Cons**
- Forces zKube logic reshuffling that may feel artificial (zKube has materially more side systems).
- Higher short-term refactor churn in game flow modules.
- Potentially larger diff blast radius if done too aggressively.

**CUBE/Quest impact**
- No inherent breakage.
- Needed adaptations are operational: ensure CUBE mint/reward hooks execute in correct post-action lifecycle windows and preserve settings gating semantics.

#### Option B — Adapted embeddable compliance (recommended for zKube)

**What it entails**
- Implement required embeddable interfaces and lifecycle guarantees, but preserve zKube domain decomposition and side-system topology.
- Keep CUBE/quest gates as-is conceptually (default-settings-only), while moving lifecycle enforcement and setup ownership to embeddable-aligned modules.

**Pros**
- Lower gameplay regression risk for cube economy + quest progression.
- Preserves existing business logic where it is already correct.
- Better fit for zKube’s richer system graph (daily challenge + cube economy + achievements).

**Cons**
- Less “textbook parity”; maintainers must document where zKube intentionally diverges from Athanor structure.
- Requires stronger internal standards/testing to avoid architecture drift.

**CUBE/Quest impact**
- Minimal behavioral delta if tests lock current semantics:
  - default settings mint cubes and track quests,
  - daily challenge settings do not mint baseline cubes,
  - quest claims still mint CUBE rewards.

Conclusion: **No standard-level incompatibility with CUBE/quests**. Risk is implementation discipline, not conceptual conflict.

### UX Flow (if applicable)
Not in direct scope. Required compatibility note: frontend system calls will need entrypoint/path alignment once pre/post wrappers and setup split are finalized.

---

## Assessment Summary (Brutally Honest)

### Ratings (1 = poor, 5 = excellent)

| Dimension | zKube | Nums | Athanor | Honest Take |
|---|---:|---:|---:|---|
| 1. Project Structure & Organization | 3 | 4 | 4 | zKube is feature-rich but sprawling; Athanor is cleaner and easier to reason about. |
| 2. Scarb.toml & Dependency Hygiene | 3 | 4 | 4 | zKube works, but dependency strategy is less modern than Athanor embeddable path. |
| 3. Dojo Patterns | 3 | 4 | 5 | zKube uses Dojo correctly but with broad writers and less lifecycle discipline than Athanor. |
| 4. Cairo Best Practices | 3 | 4 | 4 | zKube has strong modeling + tests in places, but too many large files and brittle conversions. |
| 5. Security | 2 | 4 | 4 | zKube has avoidable risk: broad write surface + unwrap/expect patterns + config exposure. |
| 6. Gas Optimization | 4 | 4 | 4 | zKube bit-packing is strong; architecture-level savings still available. |
| 7. Test Coverage | 3 | 4 | 3 | zKube has many unit tests inline, but weak system-level integration harness structure. |
| 8. Embeddable Game Standard Alignment | 2 | 2 | 5 | zKube is not on the same standard as Athanor’s Sepolia pattern yet. |
| 9. Code Quality / Maintainability | 3 | 4 | 4 | zKube is capable but harder to maintain due to size/coupling hotspots. |

### Evidence by Dimension

1) **Project Structure & Organization (zKube = 3/5)**
- Strength: clear domain separation exists (`systems/`, `models/`, `helpers/`, `types/`, `elements/`).
- Weakness: oversized hotspots increase cognitive load (e.g., config + controller files are very large); operational complexity leaks into system files.
- Evidence: `game.cairo` integrates daily challenge, VRF/pseudo-random, lifecycle, quests, achievements in one path (`/home/djizus/projects/zkube/contracts/src/systems/game.cairo:167-260`).
- Better in Athanor: tighter split Play vs Setup (`/tmp/athanor/contracts/src/systems/play.cairo`, `/tmp/athanor/contracts/src/systems/setup.cairo`).

2) **Scarb.toml & Dependencies (zKube = 3/5)**
- Strength: workspace-managed versions and explicit dependency map (`/home/djizus/projects/zkube/Scarb.toml:15-57`).
- Weakness: still anchored to `game_components_minigame` instead of embeddable standard package used by Athanor (`/home/djizus/projects/zkube/contracts/Scarb.toml:30` vs `/tmp/athanor/contracts/Scarb.toml:14`).
- Additional risk: hardcoded machine-local script paths in contract scripts (`/home/djizus/projects/zkube/contracts/Scarb.toml:15-16`).

3) **Dojo Patterns (zKube = 3/5)**
- Strength: proper `#[dojo::contract]`, model storage, event emission.
- Weakness: writer permissions are too broad for core models/events, making state authority diffuse (`/home/djizus/projects/zkube/dojo_sepolia.toml:26-77`).
- Better in Athanor: namespace-level writer/owner discipline (`/tmp/athanor/dojo_sepolia.toml:15-20`).

4) **Cairo Best Practices (zKube = 3/5)**
- Strength: robust config model validation patterns and typed traits.
- Weakness: recurring `unwrap/expect` on infra-dependent lookups and conversions (e.g., DNS and conversion points) increases panic coupling.
- Evidence: DNS unwraps in init flows (`/home/djizus/projects/zkube/contracts/src/systems/game.cairo:106`, `/home/djizus/projects/zkube/contracts/src/systems/config.cairo:153`), daily challenge `expect` (`/home/djizus/projects/zkube/contracts/src/systems/game.cairo:185-187`).

5) **Security (zKube = 2/5)**
- Critical issue: secrets checked into env config (`/home/djizus/projects/zkube/dojo_sepolia.toml:20-21`, `/home/djizus/projects/zkube/dojo_slot.toml:20-21`).
- Risk issue: broad model writer matrix increases blast radius for logic bugs (`/home/djizus/projects/zkube/dojo_sepolia.toml:28-30,74-75`).
- Better in Athanor: narrower ownership/writer profile and cleaner trust boundaries (`/tmp/athanor/dojo_sepolia.toml:15-23`).

6) **Gas Optimization (zKube = 4/5)**
- Strong: aggressive bit-packing and compact game state are good optimization choices.
- Weakness: runtime architectural overhead from cross-system writes/dispatch can still be tightened.
- Comparative: Athanor also packs aggressively and centralizes store access, reducing repeated world access patterns (`/tmp/athanor/contracts/src/store.cairo`).

7) **Test Coverage (zKube = 3/5)**
- Fact check: zKube has substantial unit tests embedded in modules (`#[test]` across 17 files), but lacks a coherent dedicated integration test module structure under `contracts/src/tests/`.
- Evidence: no `src/tests` directory in current tree; tests are distributed inline.
- Better in refs: Nums includes explicit test module pathing + broader ecosystem contract validation pressure.

8) **Embeddable Game Standard (zKube = 2/5)**
- zKube currently uses `game_components_minigame`, not embeddable-standard package.
- Athanor uses `game_components_embeddable_game_standard` and implements both token-data + settings extension interfaces directly in system contracts (`/tmp/athanor/contracts/src/systems/play.cairo:23-24,107-140`; `/tmp/athanor/contracts/src/systems/setup.cairo:18-23,120-177`).
- This is the biggest migration gap.

9) **Code Quality (zKube = 3/5)**
- High feature throughput, but maintainability suffers from coupled concerns and large module footprints.
- Multiple duplicated comments / config noise indicate hygiene debt (e.g., repeated comments in config interface parameters and env comment duplication).

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

These tasks create foundations that other work depends on. Complete in order.

#### Phase 0: Security + Baseline Lock
**Prerequisite for:** All subsequent phases

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Remove plaintext private keys/account secrets from `dojo_*.toml`; move to secure env/keystore references. | Secret-free deployment configs + rotation checklist |
| 0.2 | Freeze baseline: capture current system interfaces, model schemas, and world writer matrix snapshot. | Migration baseline artifact (`docs/migration/baseline.md`) |
| 0.3 | Enforce clean-break migration policy in deployment/runbook artifacts (fresh world). | Signed-off decision in Decision Log |
| 0.4 | Add migration test matrix (Slot + Sepolia) and pass/fail criteria before refactor. | `docs/migration/test-matrix.md` |

#### Phase 1: Deep Refactor Foundation (Security/Quality/Gas)
**Prerequisite for:** Phase 2 and all downstream workstreams

| Task | Description | Output |
|------|-------------|--------|
| 1.1 | Harden Dojo permissions: reduce model/event writer scope to least privilege before architecture changes. | Hardened `dojo_*.toml` writer matrix |
| 1.2 | Remove/replace panic-heavy `unwrap/expect` on DNS and migration-sensitive paths with explicit assertions and fallback handling. | Safer init/runtime error paths |
| 1.3 | Add dedicated system-level integration tests for run lifecycle + cube/quest/daily invariants. | New `contracts/src/tests/` suite |
| 1.4 | Apply low-risk gas/coupling cleanups (dispatcher reuse, redundant model read reductions, helper extraction). | Measurable gas/maintainability uplift |

#### Phase 2: Embeddable Standard Foundation
**Prerequisite for:** Workstreams A/B/C

| Task | Description | Output |
|------|-------------|--------|
| 2.1 | Introduce `game_components_embeddable_game_standard` dependency and update package graph. | Updated root/contracts `Scarb.toml` |
| 2.2 | Create/adjust zKube Setup-like system to own settings extension implementation (`IMinigameSettings`, details). | New/updated setup-config boundary |
| 2.3 | Define and document canonical lifecycle wrapper contract behavior (`pre_action`, ownership, `post_action`) for all gameplay writes. | Interface contract spec |
| 2.4 | Update Dojo init ordering and init args schema for Play/Setup relationship (Athanor pattern). | Updated `dojo_sepolia.toml` / `dojo_slot.toml` migration sections |

---

### Parallel Workstreams

These workstreams can be executed independently after Phase 2.

#### Workstream A: Play System Standardization
**Dependencies:** Phase 2
**Can parallelize with:** Workstreams B, C

| Task | Description | Output |
|------|-------------|--------|
| A.1 | Refactor `game_system` to embed/align with embeddable-standard minigame interfaces (token data compatibility). | Standardized Play contract surface |
| A.2 | Wrap every mutating gameplay entrypoint in unified before/after lifecycle guard. | Lifecycle wrapper coverage report |
| A.3 | Split non-core concerns (daily challenge, rewards side-effects) behind explicit internal adapters to reduce contract body coupling. | Smaller, focused gameplay modules |

#### Workstream B: Dojo Permissions + State Authority Hardening
**Dependencies:** Phase 2
**Can parallelize with:** Workstreams A, C

| Task | Description | Output |
|------|-------------|--------|
| B.1 | Reduce writer lists for `Game`, `GameLevel`, `DailyEntry`, `DailyLeaderboard` to least privilege. | Hardened `dojo_*.toml` writer matrix |
| B.2 | Replace panic-prone DNS `unwrap/expect` paths with explicit failures and migration-time assertions. | Deterministic error paths |
| B.3 | Add authorization invariants doc + tests for all privileged init/admin methods. | `docs/security/authz-matrix.md` + tests |

#### Workstream C: Testing + Correctness Uplift
**Dependencies:** Phase 2
**Can parallelize with:** Workstreams A, B

| Task | Description | Output |
|------|-------------|--------|
| C.1 | Add dedicated integration test module tree (`contracts/src/tests/`) for full run lifecycle (create/move/bonus/surrender/daily challenge). | New integration test suite |
| C.2 | Add migration contract-compat tests validating token-data and settings interfaces expected by embeddable standard. | Compatibility test suite |
| C.3 | Add regression tests around daily challenge registration gating + game-challenge mapping. | Edge-case coverage for challenge mode |

---

### Merge Phase

After parallel workstreams complete, these tasks integrate the work.

#### Phase N: End-to-End Migration Integration
**Dependencies:** Workstreams A, B, C

| Task | Description | Output |
|------|-------------|--------|
| N.1 | Integrate refactored Play + Setup deployment order and init args in all active profiles (slot/sepolia/mainnet if applicable). | Unified migration config |
| N.2 | Run full build/test/deploy dry run on Slot; validate deterministic behavior and model/indexing health. | Slot validation report |
| N.3 | Execute Sepolia staging migration and compare runtime behavior vs baseline metrics. | Sepolia staging report |
| N.4 | Publish migration runbook (rollback and emergency switches). | `docs/migration/runbook.md` |

---

## Testing and Validation

- Unit: maintain current inline tests, plus add missing integration tests under `contracts/src/tests/`.
- Integration: run complete game lifecycle including daily challenge path.
- Standard compliance: verify token-data + settings extension behavior against Athanor-style contract expectations.
- Security tests: permissions, admin pathways, unauthorized caller attempts.

## Rollout and Migration

1. **Pre-migration hardening:** remove secrets from repo, reduce writer blast radius.
2. **Deep refactor release:** security/gas/testing improvements landed first.
3. **Foundation release:** dependency + interface alignment for embeddable standard.
4. **Behavior release:** lifecycle wrappers and system split for embeddable compliance.
5. **Staging:** Slot then Sepolia verification.
5. **Production rollout:** **clean-break fresh world migration** (decision locked).

Rollback:
- Keep previous deployment manifest and profile configs pinned.
- Revert to previous Play/Setup contracts and writer matrix if post-deploy checks fail.

## Verification Checklist

- [ ] `scarb build` passes at workspace root.
- [ ] `scarb test` passes including new integration tests.
- [ ] `sozo migrate -P slot` succeeds with updated init ordering.
- [ ] `sozo migrate -P sepolia` succeeds in staging environment.
- [ ] zKube Play contract exposes expected token-data interface outputs (score/game_over parity).
- [ ] settings extension methods (`settings_exist`, details) behave as expected after migration.
- [ ] writer permissions are least-privilege and do not block expected events/models.
- [ ] daily challenge flow still works under lifecycle wrappers.
- [ ] no credentials/private keys remain in tracked config files.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Embeddable standard package/API drift vs current zKube dependencies | Med | High | Pin exact versions, introduce compatibility shim layer during transition |
| Breaking world/schema changes during migration | Med | High | Decide policy upfront (compat vs clean break), run Slot + Sepolia rehearsals |
| State authority bugs from writer matrix reduction | Med | Med | Incremental permission tightening + integration tests per model/event |
| Daily challenge regressions after lifecycle refactor | Med | High | Dedicated challenge regression suite + staged rollout |
| Team velocity drop due to large refactor breadth | High | Med | Phase-gate workstreams; isolate security and standardization first |
| Secret exposure operational incident | High (current) | High | Immediate key rotation + repo scrub + secret scanning gate |

## Open Questions

- [ ] Do we choose strict Athanor parity architecture, or adapted embeddable compliance preserving more zKube decomposition? (Technical recommendation: adapted compliance)

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Use Athanor as canonical embeddable migration reference | It is actively using embeddable standard on Sepolia with clear Play/Setup split | Infer standard from docs only (rejected: too ambiguous) |
| Keep zKube gameplay domain models, refactor architecture around them | Preserves product mechanics while improving compliance/security | Full rewrite (rejected: unnecessary risk/time) |
| Prioritize security + deployment hygiene before interface refactor | Current checked-in secrets and broad writers are immediate risk | Interface-first (rejected: leaves avoidable operational risk) |
| Phase work into serial foundation + parallel streams | Reduces blocking and allows incremental validation | Big-bang refactor (rejected: high blast radius) |
| Backward compatibility policy = clean-break fresh world | User explicitly accepted breaking changes for cleaner architecture | Schema-preserving upgrade (deprioritized) |
| Execution order = deep refactor first, then embeddable migration | User priority and risk reduction for safer migration | Fastest-standardization-first (rejected) |
