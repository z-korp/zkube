# zKube Frontend (client-budokan)

## Overview

React 18.3.1 + TypeScript frontend for the zKube puzzle game. Uses Dojo SDK for blockchain interaction and Cartridge Controller for wallet management.

## Directory Structure

```
client-budokan/
├── src/
│   ├── main.tsx              # App entry, providers setup
│   ├── App.tsx               # Router configuration
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
│   │       ├── models/       # Game model classes
│   │       ├── helpers/      # Helper functions
│   │       ├── elements/     # Bonus implementations
│   │       └── types/        # Type definitions
│   ├── ui/                   # React components
│   │   ├── screens/          # Page components
│   │   │   ├── Home.tsx      # Main menu
│   │   │   ├── Play.tsx      # Game screen
│   │   │   └── Loading.tsx   # Loading screen
│   │   ├── components/       # Reusable components (40+)
│   │   ├── modules/          # Feature modules
│   │   ├── containers/       # Container components
│   │   └── elements/         # Basic UI elements
│   ├── hooks/                # Custom React hooks
│   │   ├── useGame.tsx       # Game state hook
│   │   ├── useGrid.tsx       # Grid management
│   │   ├── useAccountCustom.tsx
│   │   ├── useDragHandlers.tsx
│   │   ├── useGridAnimations.ts
│   │   └── ...
│   ├── stores/               # Zustand state stores
│   │   ├── generalStore.ts   # General app state
│   │   └── moveTxStore.ts    # Transaction state
│   ├── contexts/             # React contexts
│   │   ├── music.tsx         # Music player context
│   │   ├── sound.tsx         # Sound effects context
│   │   └── MetagameProvider.tsx
│   ├── config/               # Configuration
│   │   ├── manifest.ts       # Dojo world manifest
│   │   └── metagame.ts       # Metagame config
│   ├── utils/                # Utility functions
│   ├── types/                # TypeScript types
│   └── enums/                # Enumerations
├── dojo.config.ts            # Dojo configuration
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
├── package.json              # Dependencies
└── vercel.json               # Deployment config
```

## Provider Hierarchy

```tsx
<React.StrictMode>
  <ThemeProvider>
    <StarknetConfig>           {/* Wallet connection */}
      <MusicPlayerProvider>    {/* Background music */}
        <MetagameProvider>     {/* Metagame SDK */}
          <DojoProvider>       {/* Dojo client */}
            <SoundPlayerProvider> {/* Sound effects */}
              <App />
            </SoundPlayerProvider>
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
  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl);
  const sync = await getSyncEntities(toriiClient, ...);
  const client = await setupWorld(dojoProvider, config);

  return { client, clientModels, contractComponents, ... };
}
```

### System Calls (`dojo/systems.ts`)

Wraps contract calls with transaction handling:

```typescript
export function systems({ client }: { client: IWorld }) {
  return {
    freeMint: async ({ account, settingsId }) => {...},
    create: async ({ account, gameId }) => {...},
    surrender: async ({ account, gameId }) => {...},
    move: async ({ account, gameId, rowIndex, startIndex, finalIndex }) => {...},
    applyBonus: async ({ account, gameId, bonus, rowIndex, lineIndex }) => {...},
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

### `useGame`
Retrieves and wraps the current game state:
```typescript
const { game, gameKey } = useGame({ gameId, shouldLog: false });
// game is a GameClass instance with helper methods
```

### `useGrid`
Manages the grid state with memoization:
```typescript
const blocks = useGrid({ gameId, shouldLog: false });
// blocks is a 2D array representing the grid
```

### `useDragHandlers`
Handles block dragging/swiping interactions for move input.

### `useGridAnimations`
Manages grid transition animations when blocks move/disappear.

### `useAccountCustom`
Custom account hook for Cartridge Controller integration.

## State Management

### Zustand Stores

**generalStore.ts:**
- App-wide state (settings, UI state)

**moveTxStore.ts:**
- Transaction state for move operations
- Tracks pending transactions
- Used to disable inputs during transactions

### RECS (Reactive ECS)

Game state synced via Dojo's RECS:
```typescript
import { useComponentValue } from "@dojoengine/react";
const component = useComponentValue(Game, gameKey);
```

## Grid Representation

Frontend unpacks the felt252 blocks into a 2D array:

```typescript
// From contract: felt252 (240 bits packed)
// To frontend: number[][] (10 rows × 8 columns)
const blocks: number[][] = [
  [1, 2, 0, 3, 1, 2, 1, 0],  // Row 0 (bottom)
  [2, 1, 3, 0, 2, 1, 3, 1],  // Row 1
  // ... 8 more rows
];
// Each number 0-7: 0 = empty, 1-7 = block colors
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
VITE_PUBLIC_NODE_URL=        # Starknet RPC URL
VITE_PUBLIC_TORII=           # Torii indexer URL
VITE_PUBLIC_MASTER_ADDRESS=  # Dev master address
VITE_PUBLIC_MASTER_PRIVATE_KEY= # Dev private key
VITE_PUBLIC_DEPLOY_TYPE=     # slot | sepolia | mainnet
```

## Build Modes

```bash
pnpm slot        # Local development (port 5125)
pnpm sepolia     # Sepolia testnet
pnpm mainnet     # Mainnet
pnpm build       # Production build
pnpm test        # Vitest tests
```

## UI Components

Located in `src/ui/components/`:
- Grid rendering components
- Block/cell components
- Animation components (BonusAnimation, etc.)
- Game UI (score, moves, bonuses display)
- Dialogs and modals

**Important:** Check existing components before creating new ones.

## Styling

- TailwindCSS for utility classes
- `src/index.css` - Global styles
- `src/grid.css` - Grid-specific styles
- Theme support via `next-themes`

## Audio

- **MusicPlayerProvider:** Background music management
- **SoundPlayerProvider:** Sound effects (use-sound library)
- Sounds stored in `assets/sounds/`

## Wallet Integration

Uses Cartridge Controller:

```typescript
import cartridgeConnector from "./cartridgeConnector";

// In StarknetConfig
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
  "@dojoengine/core": "^1.8.1",
  "@dojoengine/sdk": "^1.8.1",
  "@dojoengine/react": "^1.8.1",
  "@dojoengine/recs": "2.0.13",
  "@cartridge/controller": "^0.10.7",
  "@starknet-react/core": "^5.0.1",
  "starknet": "8.5.2",
  "react": "^18.3.1",
  "zustand": "^4.5.5",
  "framer-motion": "^11.2.10",
  "gsap": "^3.12.5"
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
// Torii stores:      "0x4533cf8322e4e8109cf9479dfb8d5425a5b33b2e8ea09b780760b6ebefaf1c"
// getEntityIdFromKeys: "0x004533cf8322e4e8109cf9479dfb8d5425a5b33b2e8ea09b780760b6ebefaf1c"
```

**Solution:** Normalize entity IDs before RECS lookups:

```typescript
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

const gameKey = useMemo(() => {
  const rawKey = getEntityIdFromKeys([BigInt(gameKeySource)]);
  return normalizeEntityId(rawKey);
}, [gameKeySource]);
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
