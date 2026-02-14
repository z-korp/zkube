import { useEffect, useMemo, useState } from "react";
import App from "./App";
import type { SetupResult } from "./dojo/setup";
import { DojoProvider } from "./dojo/context";
import { Loading } from "@/ui/screens/Loading";
import { MusicPlayerProvider } from "./contexts/music";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { ThemeProvider } from "./ui/elements/theme-provider";
import { StarknetConfig, jsonRpcProvider, voyager } from "@starknet-react/core";
import { sepolia, mainnet, type NativeCurrency } from "@starknet-react/chains";
import { MetagameProvider } from "./contexts/MetagameProvider";
import { QuestsProvider } from "./contexts/quests";
import { type BigNumberish, shortString, PaymasterRpc } from "starknet";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
import { Assets } from "pixi.js";
import { Capacitor } from "@capacitor/core";
import { createLogger } from "./utils/logger";
import { preloadEssentials, preloadBundle } from "./pixi/assets/preloader";
import type { ThemeId } from "./pixi/utils/colors";
import { cartridgeConnector } from "./cartridgeConnector";

const slotPaymasterProvider = () => new PaymasterRpc({ nodeUrl: "http://localhost" });

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_NODE_URL, VITE_PUBLIC_SLOT } = import.meta.env;
const log = createLogger("AppRuntime");
let pixiAssetsBootstrapped = false;

function getStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem("vite-ui-theme-template");
    if (stored) return stored as ThemeId;
  } catch { /* noop */ }
  return "theme-1";
}

async function bootstrapPixiAssets() {
  if (pixiAssetsBootstrapped) return;

  await Assets.init({
    texturePreference: {
      format: ["webp", "png", "jpg"],
    },
    loadOptions: {
      strategy: "retry",
      retryCount: 2,
      retryDelay: 200,
    },
  });

  const themeId = getStoredTheme();
  await preloadEssentials(themeId);
  pixiAssetsBootstrapped = true;

  const scheduleIdle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
  scheduleIdle(() => {
    preloadBundle(themeId, 'gameplay').catch(() => {});
    preloadBundle(themeId, 'ui').catch(() => {});

    if (import.meta.env.DEV) {
      import("./pixi/assets/resolver").then(({ validateCatalog }) => {
        validateCatalog(themeId).then(({ missing }) => {
          if (missing.length > 0) {
            log.warn(`[AssetCatalog] ${missing.length} missing assets`, missing);
          }
        });
      }).catch(() => {});
    }
  });
}

const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

function rpc() {
  return {
    nodeUrl: VITE_PUBLIC_NODE_URL,
  };
}

export default function AppRuntime() {
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  const connectors = useMemo(
    () => (cartridgeConnector ? [cartridgeConnector] : []),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        await bootstrapPixiAssets();
      } catch (error) {
        log.warn("Pixi asset bootstrap failed; continuing with lazy loads", error);
      }

      const [{ setup }, { dojoConfig }] = await Promise.all([
        import("./dojo/setup"),
        import("../dojo.config"),
      ]);

      const result = await setup(dojoConfig());

      if (cancelled) return;
      setSetupResult(result);
    }

    initialize();

    return () => {
      cancelled = true;

      if (Capacitor.isNativePlatform()) {
        import("./dojo/connectorWrapper").then(({ default: Wrapper }) => {
          Wrapper.disposeAppStateListeners();
        }).catch(() => { /* not available */ });
      }
    };
  }, []);

  const slotChainId = VITE_PUBLIC_SLOT
    ? `WP_${VITE_PUBLIC_SLOT.toUpperCase().replace(/-/g, "_")}`
    : "WP_ZKUBE";

  const ETH_KATANA: NativeCurrency = {
    address: KATANA_ETH_CONTRACT_ADDRESS,
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  };

  type ChainExplorers = {
    [key: string]: string[];
  };
  const WORLD_EXPLORER: ChainExplorers = {
    worlds: ["https://worlds.dev"],
  };

  const stringToFelt = (v: string): BigNumberish =>
    v ? shortString.encodeShortString(v) : "0x0";

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
    explorers: WORLD_EXPLORER,
  } : null;

  const chains = VITE_PUBLIC_DEPLOY_TYPE === "sepolia"
    ? [sepolia, mainnet, ...(slotChain ? [slotChain] : [])]
    : VITE_PUBLIC_DEPLOY_TYPE === "slot" && slotChain
      ? [slotChain, sepolia, mainnet]
      : [mainnet, sepolia, ...(slotChain ? [slotChain] : [])];

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

  log.info("Network configuration", {
    VITE_PUBLIC_DEPLOY_TYPE,
    VITE_PUBLIC_NODE_URL,
    VITE_PUBLIC_SLOT,
    defaultChainId: getDefaultChainId()?.toString(16),
    chainIds: {
      mainnet: mainnet.id.toString(16),
      sepolia: sepolia.id.toString(16),
      slot: slotChain?.id?.toString(16),
    },
    chainsOrder: chains.map((c) => c.network || c.name),
  });

  return (
    <ErrorBoundary name="root">
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
              {setupResult ? (
                <ErrorBoundary name="dojo">
                  <DojoProvider value={setupResult}>
                    <ErrorBoundary name="quests">
                      <QuestsProvider>
                        <App />
                      </QuestsProvider>
                    </ErrorBoundary>
                  </DojoProvider>
                </ErrorBoundary>
              ) : (
                <Loading />
              )}
            </MetagameProvider>
          </MusicPlayerProvider>
        </StarknetConfig>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
