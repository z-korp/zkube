import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { setup } from "./dojo/setup.ts";
import type { SetupResult } from "./dojo/setup.ts";
import { DojoProvider } from "./dojo/context.tsx";
import { dojoConfig } from "../dojo.config.ts";
import { Loading } from "@/ui/screens/Loading";
import { MusicPlayerProvider } from "./contexts/music";
import { ThemeProvider } from "./ui/elements/theme-provider/index";
import {
  StarknetConfig,
  jsonRpcProvider,
  voyager,
  useAccount,
  type Connector,
} from "@starknet-react/core";
import { sepolia, mainnet, type NativeCurrency } from "@starknet-react/chains";
import cartridgeConnector from "./cartridgeConnector";
import { MetagameProvider } from "./contexts/MetagameProvider";
import { ControllersProvider } from "./contexts/controllers";
import { GameEventsProvider } from "./contexts/gameEvents";
import { useControllerUsername } from "./hooks/useControllerUsername";
import { useNavigationStore } from "./stores/navigationStore";

import "./index.css";
import { type BigNumberish, shortString, PaymasterRpc } from "starknet";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";

// Mock paymaster for slot mode - returns a dummy PaymasterRpc that won't be used
// Required because @starknet-react/core v5.x throws if paymasterProvider returns null
const slotPaymasterProvider = () => new PaymasterRpc({ nodeUrl: "http://localhost" });

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_NODE_URL, VITE_PUBLIC_SLOT } = import.meta.env;

const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

function rpc() {
  return {
    nodeUrl: VITE_PUBLIC_NODE_URL,
  };
}

/**
 * Minimal deep-link support for Budokan launches like `/play/0xabc...`.
 * Parses the URL on startup and seeds the navigation store so PlayScreen
 * mounts with the right gameId. No react-router — in-app navigation keeps
 * running through Zustand (the URL bar won't update after this).
 */
function hydrateNavigationFromUrl() {
  try {
    const match = window.location.pathname.match(/^\/play\/(0x[0-9a-fA-F]+|\d+)\/?$/);
    if (!match?.[1]) return;
    const gameId = BigInt(match[1]);
    if (gameId === 0n) return;
    useNavigationStore.setState({
      currentPage: "play",
      gameId,
      pendingDeepLinkStart: true,
    });
  } catch (err) {
    console.warn("[main] failed to hydrate navigation from URL", err);
  }
}

hydrateNavigationFromUrl();

const root = createRoot(
  document.getElementById("root") as HTMLElement
);

/** Gates the app on Dojo setup + Cartridge reconnect + username resolution */
function AppGate({ setupResult }: { setupResult: SetupResult | null }) {
  const { account, isConnected } = useAccount();
  const { username } = useControllerUsername();
  const isDeepLinkEntry = useNavigationStore((s) => s.pendingDeepLinkStart);

  // Detect if there's a stored session that autoConnect will restore
  const [hadStoredSession] = useState(() => {
    try {
      return localStorage.getItem("lastUsedConnector") !== null;
    } catch {
      return false;
    }
  });

  // Fallback: don't block forever if reconnect or username fetch hangs
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Wait for: dojo setup + account object (not just isConnected) + username.
  // Deep-link entries (e.g. Budokan /play/{tokenId}) always wait for account so
  // we don't flash the Connect popup while auto-reconnect is still in flight —
  // Cartridge may restore a session even without `lastUsedConnector` in storage.
  const isReady = !!setupResult
    && (timedOut || (!hadStoredSession && !isDeepLinkEntry) || !!account)
    && (timedOut || !isConnected || !!username);


  // Conditionally mount App rather than hiding it with display:none — Radix
  // portals (e.g. PlayScreen's Connect dialog) render to document.body and
  // leak through a hidden parent. Keep the Dojo/Controllers/GameEvents
  // providers mounted so Torii sync and Cartridge reconnect run in parallel
  // with the Loading screen.
  return (
    <>
      {!isReady && <Loading />}
      {setupResult && (
        <DojoProvider value={setupResult}>
          <ControllersProvider>
            <GameEventsProvider>
              {isReady && <App />}
            </GameEventsProvider>
          </ControllersProvider>
        </DojoProvider>
      )}
    </>
  );
}

export function Main() {
  const connectors: Connector[] = cartridgeConnector ? [cartridgeConnector] : [];

  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  useEffect(() => {
    async function initialize() {
      const result = await setup(dojoConfig());
      setSetupResult(result);
    }
    initialize();
  }, []);

  //
  // supported chain ids
  //
  // Generate slot chain ID dynamically from slot name
  const slotChainId = VITE_PUBLIC_SLOT
    ? `WP_${VITE_PUBLIC_SLOT.toUpperCase().replace(/-/g, "_")}`
    : "WP_ZKUBE";

  //
  // currencies
  //
  const ETH_KATANA: NativeCurrency = {
    address: KATANA_ETH_CONTRACT_ADDRESS,
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  };

  //
  // explorers
  //
  type ChainExplorers = {
    [key: string]: string[];
  };
  const WORLD_EXPLORER: ChainExplorers = {
    worlds: ["https://worlds.dev"],
  };

  const stringToFelt = (v: string): BigNumberish =>
    v ? shortString.encodeShortString(v) : "0x0";

  // Build slot chain configuration dynamically
  const slotChain = VITE_PUBLIC_SLOT && VITE_PUBLIC_NODE_URL ? {
    id: BigInt(stringToFelt(slotChainId)),
    name: `zKube ${VITE_PUBLIC_SLOT}`,
    network: "katana",
    testnet: true,
    nativeCurrency: ETH_KATANA,
    rpcUrls: {
      default: { http: [VITE_PUBLIC_NODE_URL] },
      public: { http: [VITE_PUBLIC_NODE_URL] },
    },
    paymasterRpcUrls: {
      default: { http: [VITE_PUBLIC_NODE_URL] },
      public: { http: [VITE_PUBLIC_NODE_URL] },
    },
    explorers: WORLD_EXPLORER,
  } : null;

  // Order chains based on deploy type (default chain first)
  const chains = VITE_PUBLIC_DEPLOY_TYPE === "sepolia" 
    ? [sepolia, mainnet, ...(slotChain ? [slotChain] : [])]
    : VITE_PUBLIC_DEPLOY_TYPE === "slot" && slotChain
      ? [slotChain, sepolia, mainnet]
      : [mainnet, sepolia, ...(slotChain ? [slotChain] : [])];

  // Get default chain ID based on deploy type
  const getDefaultChainId = () => {
    switch (VITE_PUBLIC_DEPLOY_TYPE) {
      case "sepolia":
        return sepolia.id;
      case "slot":
        return slotChain?.id ?? sepolia.id;
      default:
        return mainnet.id;
    }
  };

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StarknetConfig
          autoConnect
          chains={chains}
          connectors={connectors}
          defaultChainId={getDefaultChainId()}
          explorer={voyager}
          provider={jsonRpcProvider({ rpc })}
          paymasterProvider={isSlotMode ? slotPaymasterProvider : undefined}
        >
          <MusicPlayerProvider>
            <MetagameProvider>
              <AppGate setupResult={setupResult} />
            </MetagameProvider>
          </MusicPlayerProvider>
        </StarknetConfig>
      </ThemeProvider>
    </React.StrictMode>
  );
}

root.render(<Main />);
