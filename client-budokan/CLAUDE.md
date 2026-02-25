# zKube Frontend (client-budokan)

## Overview

React 19.2.4 + TypeScript frontend for the zKube puzzle game. Uses Dojo SDK for blockchain interaction, Cartridge Controller for wallet management, and integrates with Starknet.

## Directory Structure

```
client-budokan/
├── src/
│   ├── main.tsx              # App entry, providers setup
│   ├── App.tsx               # Router configuration
│   ├── constants.ts          # Global constants (namespace)
│   ├── cartridgeConnector.tsx # Cartridge wallet connector
│   ├── dojo/                 # Dojo integration layer
│   │   ├── setup.ts          # Dojo client initialization
│   │   ├── context.tsx       # DojoProvider context
│   │   ├── useDojo.tsx       # Hook for accessing Dojo
│   │   ├── models.ts         # Client-side model wrappers
│   │   ├── systems.ts        # System call wrappers
│   │   ├── contractModels.ts # Generated model definitions
│   │   ├── contractSystems.ts# Generated system interfaces
│   │   ├── world.ts          # World configuration
│   │   └── game/             # Game-specific logic
│   │       ├── constants.ts  # Grid/packing constants
│   │       ├── models/game.ts # Game class with unpacking
│   │       ├── helpers/      # Helper utilities
│   │       │   ├── packer.ts
│   │       │   ├── runDataPacking.ts
│   │       │   ├── events.ts
│   │       │   └── components.ts
│   │       ├── types/        # Type definitions
│   │       │   ├── bonus.ts
│   │       │   ├── level.ts
│   │       │   ├── difficulty.ts
│   │       │   └── constraint.ts
│   │       └── elements/bonuses/ # Bonus implementations
│   ├── ui/                   # React components
│   │   ├── pages/            # Page components (11 pages)
│   │   │   ├── HomePage.tsx
│   │   │   ├── PlayScreen.tsx
│   │   │   ├── MapPage.tsx
│   │   │   ├── ShopPage.tsx
│   │   │   ├── InGameShopPage.tsx
│   │   │   ├── QuestsPage.tsx
│   │   │   ├── MyGamesPage.tsx
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── TutorialPage.tsx
│   │   ├── screens/          # Legacy screens
│   │   │   └── Loading.tsx   # Loading screen
│   │   ├── components/       # Reusable components (50+)
│   │   │   ├── GameBoard.tsx # Game board container
│   │   │   ├── Grid.tsx      # Grid renderer with drag/drop
│   │   │   ├── Block.tsx     # Individual block component
│   │   │   ├── NextLine.tsx  # Next line preview
│   │   │   ├── LevelHeader.tsx # Level progress header
│   │   │   ├── BonusButton.tsx # Bonus action buttons
│   │   │   ├── GameOverDialog.tsx
│   │   │   ├── VictoryDialog.tsx # Level 50 victory modal
│   │   │   ├── LevelCompleteDialog.tsx
│   │   │   ├── CubeBalance.tsx # CUBE token balance
│   │   │   ├── Connect.tsx   # Wallet connect button
│   │   │   ├── Shop/         # Shop components
│   │   │   │   ├── ShopDialog.tsx
│   │   │   │   ├── InGameShopDialog.tsx
│   │   │   │   ├── ShopButton.tsx
│   │   │   │   └── BringCubesDialog.tsx
│   │   │   ├── Quest/        # Quest components
│   │   │   │   ├── QuestsDialog.tsx
│   │   │   │   ├── QuestCard.tsx
│   │   │   │   ├── QuestsButton.tsx
│   │   │   │   └── QuestTimer.tsx
│   │   │   └── Tutorial/     # Tutorial components
│   │   ├── containers/       # Container components
│   │   │   ├── Header.tsx
│   │   │   └── GameBonus.tsx
│   │   ├── modules/          # Feature modules
│   │   │   └── MusicPlayer.tsx
│   │   ├── elements/         # Basic UI primitives (shadcn-based)
│   │   │   ├── button/
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── ...
│   │   ├── theme/            # Theme assets
│   │   └── actions/          # Action components
│   ├── hooks/                # Custom React hooks (19)
│   │   ├── useAccountCustom.tsx
│   │   ├── useControllerUsername.ts
│   │   ├── useCubeBalance.tsx   # ERC20 CUBE balance
│   │   ├── useDeepMemo.tsx
│   │   ├── useGame.tsx
│   │   ├── useGameLevel.tsx     # Level config from Torii
│   │   ├── useGameTokensSlot.ts
│   │   ├── useGetUsernames.ts
│   │   ├── useGrid.tsx
│   │   ├── useGridAnimations.ts
│   │   ├── useLeaderboardSlot.ts
│   │   ├── useLerpNumber.tsx
│   │   ├── useMapData.ts        # Map progression data
│   │   ├── useMapLayout.ts      # Map layout generation
│   │   ├── useNftBalance.ts
│   │   ├── usePlayerMeta.tsx
│   │   ├── useSettings.tsx
│   │   ├── useTransitionBlocks.ts
│   │   └── useViewport.tsx
│   ├── stores/               # Zustand state stores
│   │   ├── cubeBalanceStore.ts # CUBE balance cache
│   │   ├── generalStore.ts   # App-wide state
│   │   ├── moveTxStore.ts    # Move transaction state
│   │   └── navigationStore.ts # Navigation state
│   ├── contexts/             # React contexts
│   │   ├── controllers.tsx   # ControllersProvider
│   │   ├── gameEvents.tsx    # GameEventsProvider
│   │   ├── hooks.ts          # Context hooks
│   │   ├── MetagameProvider.tsx
│   │   ├── music.tsx         # MusicPlayerContext/Provider
│   │   ├── quests.tsx        # QuestsProvider
│   │   └── sound.tsx         # SoundPlayerContext/Provider
│   ├── config/               # Configuration
│   │   ├── manifest.ts       # Dojo world manifest
│   │   ├── manifest_slot.json
│   │   └── metagame.ts
│   ├── utils/                # Utility functions
│   │   ├── gridUtils.ts      # Grid manipulation
│   │   ├── gridPhysics.ts    # Physics calculations
│   │   ├── toast.ts          # Toast helpers
│   │   └── ...
│   ├── types/                # TypeScript types
│   └── enums/                # Enumerations
├── public/                   # Static assets
│   └── assets/               # Theme assets, sounds
├── dojo.config.ts            # Dojo configuration
├── vite.config.ts            # Vite build config
├── tailwind.config.js        # TailwindCSS config
├── package.json              # Dependencies
├── vercel.json               # Vercel deployment
└── .env.slot                 # Slot environment
```

## Provider Hierarchy

```tsx
<React.StrictMode>
  <ThemeProvider>
    <StarknetConfig>           {/* Wallet connection */}
      <MusicPlayerProvider>    {/* Background music */}
        <MetagameProvider>     {/* Metagame SDK */}
          <DojoProvider>       {/* Dojo client */}
            <ControllersProvider> {/* Controller state */}
              <QuestsProvider>   {/* Quest state */}
                <GameEventsProvider> {/* Game events */}
                  <SoundPlayerProvider> {/* Sound effects */}
                    <App />
                  </SoundPlayerProvider>
                </GameEventsProvider>
              </QuestsProvider>
            </ControllersProvider>
          </DojoProvider>
        </MetagameProvider>
      </MusicPlayerProvider>
    </StarknetConfig>
  </ThemeProvider>
</React.StrictMode>
```

## Dojo Integration

### Setup (`dojo/setup.ts`)

Initializes:
1. Torii client for state sync
2. Contract components from manifest
3. Client models (wrappers around contract models)
4. Dojo provider for RPC calls
5. Entity sync subscription

```typescript
export async function setup(config: Config) {
  const toriiClient = await new torii.ToriiClient({...});
  const contractComponents = defineContractComponents(world);
  const clientModels = models({ contractComponents });
  const sync = await getSyncEntities(toriiClient, contractComponents, ...);
  const client = setupWorld(config);

  return { client, clientModels, contractComponents, systemCalls, sync, toriiClient };
}
```

### System Calls (`dojo/systems.ts`)

Wraps contract calls with transaction handling:

```typescript
export function systems({ client }: { client: IWorld }) {
  return {
    freeMint: async ({ account, settingsId }) => {...},
    create: async ({ account, gameId }) => {...},
    createWithCubes: async ({ account, gameId, cubesAmount }) => {...},
    surrender: async ({ account, gameId }) => {...},
    move: async ({ account, gameId, rowIndex, startIndex, finalIndex }) => {...},
    applyBonus: async ({ account, gameId, bonus, rowIndex, lineIndex }) => {...},
    purchaseConsumable: async ({ account, gameId, consumable }) => {...},
    upgradeStartingBonus: async ({ account, bonusType }) => {...},
    upgradeBagSize: async ({ account, bonusType }) => {...},
    upgradeBridgingRank: async ({ account }) => {...},
    claimQuest: async ({ account, questId, intervalId }) => {...},
  };
}
```

### Model Access

Use the `useDojo` hook to access:

```typescript
const {
  setup: {
    clientModels: {
      models: { Game },
      classes: { Game: GameClass }
    },
    systemCalls,
    client,
    toriiClient,
  },
} = useDojo();
```

## Key Hooks

### `useGame({ gameId, shouldLog })`
- Fetches game state from RECS
- Normalizes entity IDs for Torii format
- Returns `Game` class instance with helper methods
- Also fetches `GameSeed` for VRF seed

### `useGrid({ gameId, shouldLog })`
- Uses `useGame` internally
- Returns 2D array of blocks
- Handles game over state
- Uses deep memoization

### `useGridAnimations(lineExplodedCount)`
- Manages animation states: bounce, text, points, cubes
- Returns setters for triggering animations

### `useDragHandlers(handleDragMove)`
- Provides `handleMouseMove` and `handleTouchMove`
- Abstracts mouse vs touch input

### `useCubeBalance()`
- Fetches ERC20 CUBE balance via Torii
- Polls every 10 seconds
- Normalizes addresses for comparison

### `usePlayerMeta()`
- Fetches player progression data
- Unpacks packed `data` field into:
  - Starting bonuses (combo, score, harvest, wave, supply)
  - Bag sizes (combo, score, harvest, wave, supply)
  - Bridging rank
  - Total runs, total cubes earned

### `useSettings(settingsId)`
- Fetches GameSettings from RECS
- Parses packed constraint fields
- Returns typed GameSettings object

### `useGameTokensSlot({ owner, limit })`
- Slot-mode alternative to metagame-sdk
- Queries Game entities directly from RECS
- Extracts metadata from run_data

### `useDeepMemo(factory, deps)`
- Like useMemo but with deep comparison
- Prevents unnecessary re-renders

### `useGameLevel({ gameId })`
- Fetches GameLevel model from Torii
- Returns current level config (points, moves, constraints, thresholds)

### `useMapData()`
- Returns level progression data for map display
- Extracts star ratings from level_stars field

### `useMapLayout()`
- Generates map node layout from level data

## State Management

### RECS (Reactive ECS)
Primary state management for on-chain data:
```typescript
import { useComponentValue } from "@dojoengine/react";
const component = useComponentValue(Game, gameKey);
```

### Zustand Stores

**generalStore.ts:**
```typescript
interface GeneralState {
  isUnmounting: boolean;
  setIsUnmounting: (value: boolean) => void;
}
```

**moveTxStore.ts:**
```typescript
interface MoveState {
  isMoveComplete: boolean;
  setMoveComplete: (value: boolean) => void;
}
```

**navigationStore.ts:**
- Navigation state management

**cubeBalanceStore.ts:**
- CUBE balance caching and updates

### React Contexts

**QuestsProvider (`contexts/quests.tsx`):**
- Subscribes to quest models via Torii
- Provides quest progress and completion state
- Handles quest claiming

**MusicPlayerProvider (`contexts/music.tsx`):**
- Background music management
- Track cycling and volume controls

**SoundPlayerProvider (`contexts/sound.tsx`):**
- Game sound effects
- Triggered by game state changes

**ControllersProvider (`contexts/controllers.tsx`):**
- Controller state management

**GameEventsProvider (`contexts/gameEvents.tsx`):**
- Game event subscriptions and handling

## Grid Representation

### Contract to Frontend

**Contract storage:** `blocks: felt252` - 240 bits packed (10 rows x 8 cols x 3 bits)

**Frontend unpacking:**
```typescript
// In Game class constructor
this.blocks = Packer.sized_unpack(
  BigInt(game.blocks),
  BigInt(ROW_BIT_COUNT),    // 24 bits per row
  DEFAULT_GRID_HEIGHT       // 10 rows
).map((row) =>
  Packer.sized_unpack(
    BigInt(row),
    BigInt(BLOCK_BIT_COUNT), // 3 bits per block
    DEFAULT_GRID_WIDTH       // 8 columns
  )
).reverse();
```

**Result:** `number[][]` - 2D array where each number is block width (0-4)

## Game State Machine

The `Grid.tsx` component implements a state machine:

```
WAITING
    ↓ (user drags)
DRAGGING
    ↓ (user releases)
GRAVITY → LINE_CLEAR → ADD_LINE → GRAVITY2 → LINE_CLEAR2 → UPDATE_AFTER_MOVE
    ↓ (if bonus used)
GRAVITY_BONUS → LINE_CLEAR_BONUS → UPDATE_AFTER_BONUS
    ↓
WAITING
```

## Routes

```typescript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="play/:gameId" element={<Play />} />
</Routes>
```

## Environment Variables

```env
VITE_PUBLIC_DEPLOY_TYPE=     # slot | sepolia | mainnet
VITE_PUBLIC_SLOT=            # Slot name (e.g. zkube-djizus)
VITE_PUBLIC_NAMESPACE=       # Dojo namespace (e.g. zkube_budo_v1_2_0)
VITE_PUBLIC_NODE_URL=        # Starknet RPC URL
VITE_PUBLIC_TORII=           # Torii indexer URL
VITE_PUBLIC_MASTER_ADDRESS=  # Dev master address
VITE_PUBLIC_MASTER_PRIVATE_KEY= # Dev private key
VITE_PUBLIC_WORLD_ADDRESS=   # Dojo world contract address
VITE_PUBLIC_GAME_TOKEN_ADDRESS= # FullTokenContract (ERC721) address
VITE_PUBLIC_CUBE_TOKEN_ADDRESS= # CubeToken (ERC20) address
```

## Build Modes

```bash
pnpm slot        # Local development (port 5125)
pnpm sepolia     # Sepolia testnet
pnpm mainnet     # Mainnet
pnpm build       # Production build
pnpm test        # Vitest tests
pnpm test:watch  # Watch mode tests
```

## UI Components

### Game Components (`src/ui/components/`)
- `GameBoard.tsx` - Main game container
- `Grid.tsx` - Grid renderer with drag/drop state machine
- `Block.tsx` - Individual block
- `NextLine.tsx` - Preview of next line
- `LevelHeader.tsx` - Level progress, score, combo
- `BonusButton.tsx` - Bonus action buttons
- `GameOverDialog.tsx` - End game modal
- `LevelCompleteDialog.tsx` - Level complete modal
- `CubeEarnedAnimation.tsx` - Cube reward animation
- `ConfettiExplosion.tsx` - Particle effects

### Shop Components (`src/ui/components/Shop/`)
- `ShopDialog.tsx` - Permanent upgrade shop
- `InGameShopDialog.tsx` - In-game consumable shop
- `ShopButton.tsx` - Shop trigger button
- `BringCubesDialog.tsx` - Cube bridging at game start

### Quest Components (`src/ui/components/Quest/`)
- `QuestsDialog.tsx` - Quest panel with all quests
- `QuestCard.tsx` - Individual quest card
- `QuestsButton.tsx` - Button to open quest panel
- `QuestTimer.tsx` - Daily reset countdown

### UI Primitives (`src/ui/elements/`)
Shadcn-based components:
- `button/` - Button with variants
- `dialog.tsx` - Modal/dialog
- `card.tsx` - Card container
- `progress.tsx` - Progress bar
- `tooltip.tsx` - Hover tooltips
- `sonner.tsx` - Toast notifications

**Important:** Check existing components before creating new ones.

## Styling

- TailwindCSS for utility classes
- `src/index.css` - Global styles
- `src/grid.css` - Grid-specific styles
- Theme support via `next-themes`

## Audio

- **MusicPlayerProvider:** Background music management
- **SoundPlayerProvider:** Sound effects (Howler.js)
- Sounds in `public/assets/theme-1/sounds/`

## Wallet Integration

Uses Cartridge Controller:

```typescript
import cartridgeConnector from "./cartridgeConnector";

<StarknetConfig
  connectors={[cartridgeConnector]}
  // ...
>
```

## Testing

```bash
pnpm test        # Run all tests
pnpm test:watch  # Watch mode
```

Tests use Vitest + Testing Library, located in `src/test/`.

## Key Dependencies

```json
{
  "@dojoengine/core": "1.8.8",
  "@dojoengine/sdk": "1.9.0",
  "@dojoengine/react": "1.8.8",
  "@dojoengine/state": "1.8.8",
  "@dojoengine/torii-client": "1.8.8",
  "@cartridge/controller": "0.13.9",
  "@starknet-react/core": "5.0.1",
  "starknet": "8.5.2",
  "react": "19.2.4",
  "zustand": "5.0.11",
  "motion": "12.34.1",
  "gsap": "3.14.2",
  "howler": "2.2.4",
  "metagame-sdk": "0.1.22"
  }
```


## Important Patterns

1. **Game state is reactive:** Use `useComponentValue` for real-time updates
2. **Transactions are wrapped:** All contract calls go through `systems.ts`
3. **Memoization:** Use `useDeepMemo` for deep object comparisons
4. **Entity keys:** Convert game IDs to entity keys via `getEntityIdFromKeys`

## Critical: Entity ID Format Mismatch

**Problem:** Torii stores entity IDs without leading zeros, but `getEntityIdFromKeys` returns padded IDs.

```typescript
// Torii stores:      "0x4533cf..."
// getEntityIdFromKeys: "0x004533cf..."
```

**Solution:** Normalize entity IDs before RECS lookups:

```typescript
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};
```

This normalization is already implemented in `useGame.tsx`.

## Slot Mode Specifics

### Detecting Slot Mode
```typescript
const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";
```

### Game Token Queries
- **Mainnet/Sepolia:** Use `useGameTokens` from `metagame-sdk/sql`
- **Slot:** Use `useGameTokensSlot` hook (queries local RECS directly)

The metagame-sdk queries a relayer infrastructure that doesn't exist on slot.

### VRF Handling in contractSystems.ts
On slot, skip VRF request calls since VRF provider doesn't exist:
```typescript
if (isSlotMode) {
  // Skip VRF, contract uses pseudo-random
  return await account.execute([{
    contractAddress: contract.address,
    entrypoint: "create",
    calldata: [token_id],
  }]);
}
```

## ERC721 Event Parsing

When extracting token_id from mint events, use the Transfer event:

```typescript
// Transfer event has 5 keys: [selector, from, to, token_id_low, token_id_high]
const transferEvent = events.find(
  (event) => event.keys?.length === 5 && event.data?.length === 0
);

if (transferEvent) {
  const tokenIdLow = BigInt(transferEvent.keys[3] || "0");
  const tokenIdHigh = BigInt(transferEvent.keys[4] || "0");
  const game_id = Number(tokenIdLow + (tokenIdHigh << 128n));
}
```

## Play.tsx Game Creation Logic

The Play screen auto-creates games that haven't started. Key checks:

1. **Don't create if game already has blocks:** `game.blocksRaw !== 0n`
2. **Handle "already started" errors gracefully:** Don't reset retry flag
3. **Wait for Torii sync:** Game may exist but not be synced yet

```typescript
const gameHasBlocks = game !== null && game !== undefined && game.blocksRaw !== 0n;
if (gameHasBlocks) {
  // Game already started, don't call create()
  return;
}
```
