# Dark Shuffle Architecture Patterns

This document captures architectural patterns from the Dark Shuffle codebase - a card-based strategy game built with Dojo.

## Overview

Dark Shuffle is a deck-building roguelike card game with draft mechanics, procedural maps, and turn-based combat. It demonstrates patterns for complex game state, batch actions, and effect systems.

## Project Structure

```
dark-shuffle/
├── contracts/src/
│   ├── models/           # ECS entities
│   │   ├── game.cairo    # Game state
│   │   ├── battle.cairo  # Combat state
│   │   ├── draft.cairo   # Deck building
│   │   └── card.cairo    # Card definitions
│   ├── systems/          # Game logic
│   │   ├── game.cairo    # Main loop
│   │   ├── battle.cairo  # Combat system
│   │   ├── draft.cairo   # Draft system
│   │   └── map.cairo     # Procedural maps
│   ├── utils/            # Reusable logic
│   │   ├── board.cairo   # Board state
│   │   ├── cards.cairo   # Card effects
│   │   ├── monsters.cairo # Enemy generation
│   │   └── random.cairo  # RNG utilities
│   └── constants.cairo
├── client/src/
│   ├── contexts/         # React state providers
│   ├── api/              # Indexer/blockchain
│   └── components/       # UI components
```

## Key Patterns

### 1. Batch Action Submission

**Pattern:** Submit all turn actions as a single array instead of individual transactions.

```cairo
// Single entry point for all battle decisions
fn battle_actions(
    game_id: u64,
    battle_id: u16,
    actions: Span<Span<u8>>  // Array of actions
)

// Action structure:
// [0] = play card at index
// [1] = end turn
// Actions always terminate with end_turn [1]
```

**Frontend implementation:**
```typescript
const submitActions = async (actions: number[][]) => {
    const txs = [];

    if (needsVRF) {
        txs.push({
            contractAddress: VRF_ADDRESS,
            entrypoint: 'request_random',
            calldata: [...]
        });
    }

    txs.push({
        contractAddress: GAME_ADDRESS,
        entrypoint: 'battle_actions',
        calldata: CallData.compile({ game_id, battle_id, actions })
    });

    // Single transaction with batched calls
    await account.execute(txs);
};
```

**Benefits:**
- Reduced transaction overhead
- Atomic turn execution
- Better UX (one confirmation per turn)

**zkube Application:** Could batch multiple block moves or swaps into a single "turn" transaction.

### 2. Nested Configuration Structs

**Pattern:** Group related settings into nested structs instead of flat configuration.

```cairo
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    pub starting_health: u8,
    pub persistent_health: bool,
    pub map: MapSettings,       // Nested
    pub battle: BattleSettings, // Nested
    pub draft: DraftSettings,   // Nested
}

pub struct MapSettings {
    pub level_count: u8,
    pub depth_per_level: u8,
    pub monster_scaling: u8,
}

pub struct BattleSettings {
    pub starting_energy: u8,
    pub max_hand_size: u8,
    pub draw_per_turn: u8,
}

pub struct DraftSettings {
    pub options_count: u8,
    pub picks_per_round: u8,
    pub total_rounds: u8,
}
```

**zkube Application:**
```cairo
pub struct GameSettings {
    pub grid: GridSettings,
    pub scoring: ScoringSettings,
    pub bonus: BonusSettings,
    pub difficulty: DifficultySettings,
}

pub struct GridSettings {
    pub width: u8,
    pub height: u8,
    pub colors_count: u8,
}

pub struct BonusSettings {
    pub hammer_unlock_score: u16,
    pub wave_unlock_score: u16,
    pub totem_unlock_combo: u8,
}
```

### 3. Effect System with Modifiers and Bonuses

**Pattern:** Dual-layer effect system with base modifier + conditional bonus.

```cairo
pub struct CardEffect {
    pub modifier: CardModifier,
    pub bonus: EffectBonus,     // Additional conditional bonus
}

pub struct CardModifier {
    pub _type: u8,              // Effect type (16+ types)
    pub value_type: u8,         // Fixed, PerAlly, etc.
    pub value: u8,
    pub requirement: u8,        // None, EnemyWeak, HasAlly, NoAlly
}

pub struct EffectBonus {
    pub _type: u8,
    pub value: u8,
    pub requirement: u8,
}
```

**Effect types include:**
- HeroHealth, HeroEnergy
- EnemyHealth, EnemyAttack
- AllyAttack, AllyHealth
- AllAttack (both sides)
- DrawCards, AddCardToHand

**Requirements:**
- None (always applies)
- EnemyWeak (enemy health below threshold)
- HasAlly (player has creatures on board)
- NoAlly (player has no creatures)

**Centralized resolution:**
```cairo
#[generate_trait]
pub impl CardUtilsImpl of CardUtilsTrait {
    fn apply_card_effect(
        card_type: u8,
        card_effect: CardEffect,
        ref creature: Creature,
        ref battle: Battle,
        ref board: Board,
        board_stats: BoardStats,
        on_board: bool
    ) {
        // Check requirement
        if !_is_requirement_met(card_effect.modifier.requirement, ...) {
            return;
        }

        // Apply base modifier
        _apply_modifier(card_effect.modifier, ...);

        // Apply conditional bonus if requirement met
        if _is_requirement_met(card_effect.bonus.requirement, ...) {
            _apply_bonus(card_effect.bonus, ...);
        }
    }
}
```

**zkube Application:** Bonuses could have conditional multipliers:
- Base hammer clears N blocks
- Bonus: If combo >= 3, clear extra row
- Bonus: If score >= threshold, earn extra hammer

### 4. Weighted Random Pools

**Pattern:** Instead of complex probability math, duplicate items in pool proportionally.

```cairo
fn get_weighted_draft_list(game_settings: GameSettings) -> Span<u8> {
    let mut pool: Array<u8> = array![];

    // Add cards based on rarity weight
    for card in all_cards {
        let weight = match card.rarity {
            Rarity::Common => 5,
            Rarity::Uncommon => 4,
            Rarity::Rare => 3,
            Rarity::Epic => 2,
            Rarity::Legendary => 1,
        };

        // Duplicate card ID in pool
        for _ in 0..weight {
            pool.append(card.id);
        }
    }

    pool.span()
}

fn get_draft_options(entropy: u128, pool: Span<u8>, count: u8) -> Span<u8> {
    let mut options: Array<u8> = array![];
    let mut used_indices: Array<u32> = array![];
    let mut seed = entropy;

    for _ in 0..count {
        // Get random index avoiding duplicates
        seed = LCG(seed);
        let index = (seed % pool.len()) as u32;

        // Skip if already used
        if !used_indices.contains(index) {
            used_indices.append(index);
            options.append(*pool.at(index));
        }
    }

    options.span()
}
```

**Benefits:**
- Simple to understand and debug
- Easy to adjust probabilities
- No floating-point math needed

**zkube Application:** Block color distribution by difficulty:
```cairo
fn get_color_pool(difficulty: Difficulty) -> Span<u8> {
    let mut pool: Array<u8> = array![];

    // Easy: More of same colors (clusters easier)
    // Hard: Even distribution (harder to match)
    let weights = match difficulty {
        Difficulty::Easy => [5, 5, 3, 2, 1],     // 5 colors, weighted
        Difficulty::Hard => [2, 2, 2, 2, 2, 2],  // 6 colors, even
    };

    for (color, weight) in weights {
        for _ in 0..weight {
            pool.append(color);
        }
    }

    pool.span()
}
```

### 5. Game State Machine

**Pattern:** Explicit state enum for game phases with clear transitions.

```cairo
pub enum GameState {
    Draft,    // Building deck
    Map,      // Choosing path
    Battle,   // Combat
    Over,     // Game ended
}

#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u64,
    pub state: u8,  // GameState as u8
    // ...
}

// State transitions are explicit
fn complete_draft(game_id: u64) {
    let mut game: Game = world.read_model(game_id);
    assert!(game.state == GameState::Draft.into(), "Not in draft");

    game.state = GameState::Map.into();
    world.write_model(@game);
}
```

**zkube Application:** Could add explicit phases:
```cairo
pub enum GamePhase {
    Created,   // Token minted, game not started
    Playing,   // Active gameplay
    Paused,    // If implementing pause
    Over,      // Game ended
}
```

### 6. Type-Based Game Design

**Pattern:** Three-way type affinity creates natural counter-play.

```cairo
pub enum CardType {
    Hunter,   // Beats Magical
    Brute,    // Beats Hunter
    Magical,  // Beats Brute
}

fn get_type_advantage(attacker: CardType, defender: CardType) -> bool {
    match (attacker, defender) {
        (Hunter, Magical) => true,
        (Magical, Brute) => true,
        (Brute, Hunter) => true,
        _ => false,
    }
}

// Board stats track type counts for synergies
pub struct BoardStats {
    pub hunter_count: u8,
    pub brute_count: u8,
    pub magical_count: u8,
}

// Cards can have bonuses based on ally types
// "If you have 2+ Hunters, gain +2 attack"
```

### 7. Procedural Generation with Deterministic Seeds

**Pattern:** Use seed + LCG iteration for reproducible "random" content.

```cairo
// Linear Congruential Generator
pub fn LCG(seed: u128) -> u128 {
    let a: u128 = 25214903917;
    let c: u128 = 11;
    let m: u128 = LCG_PRIME;
    (a * seed + c) % m
}

// Map generation uses deterministic iteration
fn generate_map_node(map_seed: u128, level: u8, depth: u8) -> MapNode {
    // Derive node-specific seed
    let node_seed = LCG(LCG(map_seed) + level.into() * 100 + depth.into());

    // Generate monster from seed
    let monster_id = (node_seed % MONSTER_COUNT).into();
    let monster_level = BASE_LEVEL + (node_seed / 1000 % 5).into();

    MapNode { monster_id, monster_level }
}
```

**Benefits:**
- Identical seeds produce identical maps
- Enables replay/verification
- No need to store generated content

**zkube Application:** Already uses this for block generation, but could extend to:
- Bonus placement patterns
- Special block generation
- Challenge mode seeds

### 8. Overflow-Safe Arithmetic

**Pattern:** Use Cairo's OverflowingAdd/Sub for safe bounded values.

```cairo
use core::num::traits::{OverflowingAdd, OverflowingSub};

fn heal_hero(ref battle: Battle, amount: u8) {
    let (result, overflow) = OverflowingAdd::overflowing_add(
        battle.hero.health,
        amount
    );

    battle.hero.health = if overflow {
        U8_MAX  // Cap at max
    } else {
        min(result, battle.hero.max_health)
    };
}

fn damage_hero(ref battle: Battle, amount: u8) {
    let (result, underflow) = OverflowingSub::overflowing_sub(
        battle.hero.health,
        amount
    );

    battle.hero.health = if underflow {
        0  // Can't go negative
    } else {
        result
    };
}
```

### 9. Frontend Context Providers

**Pattern:** Separate concerns into specialized context providers.

```jsx
// Layered providers for different concerns
<DojoProvider>           {/* Blockchain connection */}
  <GameProvider>         {/* Game state sync */}
    <DraftProvider>      {/* Draft phase logic */}
      <BattleProvider>   {/* Battle phase logic */}
        <ReplayProvider> {/* Replay mechanism */}
          <App />
        </ReplayProvider>
      </BattleProvider>
    </DraftProvider>
  </GameProvider>
</DojoProvider>
```

**Each provider manages:**
- Phase-specific state
- Phase-specific actions
- Subscription to relevant models

### 10. Dynamic GraphQL Queries

**Pattern:** Build queries dynamically with namespace prefixes.

```typescript
const useIndexer = () => {
    const NS = currentNetworkConfig.namespace;
    const NS_SHORT = NS.replace('_', '');  // Torii naming convention
    const GQL_ENDPOINT = `${currentNetworkConfig.toriiUrl}/graphql`;

    const getGame = async (game_id: string) => {
        const query = gql`
            {
                ${NS_SHORT}GameModels(where: { game_id: "${game_id}" }) {
                    edges {
                        node {
                            game_id
                            state
                            hero_health
                            monsters_slain
                        }
                    }
                }
            }
        `;
        return request(GQL_ENDPOINT, query);
    };

    return { getGame, getBattle, getDraft, ... };
};
```

**Benefits:**
- Single source of truth for namespace
- Easy network/version switching
- Type-safe with generated types

## Testing Utilities

```cairo
// Centralized test setup in utils/testing/
use darkshuffle::utils::testing::general::{
    create_game,
    create_battle,
    mint_game_token
};
use darkshuffle::utils::testing::systems::{
    deploy_game_systems
};
use darkshuffle::utils::testing::world::{
    spawn_darkshuffle
};

fn setup() -> (WorldStorage, u64, IGameSystemsDispatcher) {
    let (mut world, game_systems) = spawn_darkshuffle();
    let game_id = mint_game_token(world, ...);
    (world, game_id, game_systems)
}

#[test]
fn test_game_flow() {
    let (mut world, game_id, systems) = setup();

    // Start game (enters Draft state)
    systems.start_game(game_id);
    let game: Game = world.read_model(game_id);
    assert!(game.state == GameState::Draft.into());

    // Complete draft (enters Map state)
    systems.pick_card(game_id, 0);
    // ... more picks ...

    let game: Game = world.read_model(game_id);
    assert!(game.state == GameState::Map.into());
}
```

## Summary: Patterns for zkube

### Applicable Patterns

| Pattern | Dark Shuffle Usage | zkube Application |
|---------|-------------------|-------------------|
| Nested Config | MapSettings, BattleSettings | GridSettings, BonusSettings, DifficultySettings |
| Weighted Pools | Card rarity in draft | Block color distribution by difficulty |
| State Machine | Draft → Map → Battle → Over | GamePhase: Created → Playing → Over |
| Overflow Safety | OverflowingAdd/Sub | Score and combo calculations |
| Centralized Utils | CardUtilsImpl for all effects | BonusUtils for all bonus calculations |
| Testing Utilities | utils/testing/ with setup helpers | Reusable test setup functions |
| Dynamic GraphQL | Namespace-prefixed queries | Configurable model queries |

### NOT Applicable

| Pattern | Why Not for zkube |
|---------|-------------------|
| Batch Actions | zkube moves are reactive - player needs to see result before next move |
| Turn-based phases | zkube is continuous gameplay, not discrete phases |
| Card effect system | No cards/abilities in zkube |
| Type Affinity | No block types that interact differently |
| Context Providers | zkube already has simpler state structure |

### Key Insight

Dark Shuffle's batch action pattern works because card games have discrete turns where all decisions are made upfront. zkube is fundamentally different - each move triggers gravity/line clearing/new row generation, and the player must see the result before deciding their next action. The game is reactive, not pre-planned.
