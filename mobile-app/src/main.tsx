import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { setup } from "./dojo/setup.ts";
import type { SetupResult } from "./dojo/setup.ts";
import { DojoProvider } from "./dojo/context.tsx";
import { dojoConfig } from "../dojo.config.ts";
import { Loading } from "@/ui/screens/Loading";
import { MusicPlayerProvider } from "./contexts/music";
import { SoundPlayerProvider } from "./contexts/sound";
import { ThemeProvider } from "./ui/elements/theme-provider/index";
import { StarknetConfig, jsonRpcProvider, voyager } from "@starknet-react/core";
import { sepolia, mainnet, type NativeCurrency } from "@starknet-react/chains";
import cartridgeConnector from "./cartridgeConnector";
import { MetagameProvider } from "./contexts/MetagameProvider";
import { QuestsProvider } from "./contexts/quests";
import { ControllersProvider } from "./contexts/controllers";

// Initialize PixiJS components for @pixi/react - must be done before any pixi components render
import "./pixi/extend";

import "./index.css";
import { type BigNumberish, shortString, PaymasterRpc } from "starknet";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
import { Assets } from "pixi.js";
import { validateEnv } from "./config/env";
import { createLogger } from "./utils/logger";
import { getEssentialAssetPaths } from "./pixi/assets/manifest";

// Mock paymaster for slot mode - returns a dummy PaymasterRpc that won't be used
// Required because @starknet-react/core v5.x throws if paymasterProvider returns null
const slotPaymasterProvider = () => new PaymasterRpc({ nodeUrl: "http://localhost" });

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_NODE_URL, VITE_PUBLIC_SLOT } = import.meta.env;
const log = createLogger("main");
let pixiAssetsBootstrapped = false;

validateEnv();

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

  const essentials = getEssentialAssetPaths();
  for (const asset of essentials) {
    if (!Assets.cache.has(asset.alias)) {
      Assets.add(asset);
    }
  }

  Assets.backgroundLoad(essentials.map((a) => a.alias));
  pixiAssetsBootstrapped = true;
}

const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

function rpc() {
  return {
    nodeUrl: VITE_PUBLIC_NODE_URL,
  };
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

export function Main() {
  const connectors = [cartridgeConnector];

  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  const loading = useMemo(() => !setupResult, [setupResult]);

  useEffect(() => {
    async function initialize() {
      try {
        await bootstrapPixiAssets();
      } catch (error) {
        log.warn("Pixi asset bootstrap failed; continuing with lazy loads", error);
      }

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

  enum ChainId {
    SN_MAIN = "SN_MAIN",
    SN_SEPOLIA = "SN_SEPOLIA",
  }

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
              {!loading && setupResult ? (
                <DojoProvider value={setupResult}>
                  <ControllersProvider>
                    <QuestsProvider>
                      <SoundPlayerProvider>
                        <App />
                      </SoundPlayerProvider>
                    </QuestsProvider>
                  </ControllersProvider>
                </DojoProvider>
              ) : (
                <Loading />
              )}
            </MetagameProvider>
          </MusicPlayerProvider>
        </StarknetConfig>
      </ThemeProvider>
    </React.StrictMode>
  );
}

root.render(<Main />);
