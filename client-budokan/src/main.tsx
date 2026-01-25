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
import { StarknetConfig, jsonRpcProvider, voyager, MockConnector } from "@starknet-react/core";
import { sepolia, mainnet, type NativeCurrency } from "@starknet-react/chains";
import cartridgeConnector from "./cartridgeConnector";
import { MetagameProvider } from "./contexts/MetagameProvider";
import { createBurnerAccount } from "./connectors/BurnerConnector";

import "./index.css";
import { type BigNumberish, shortString } from "starknet";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_NODE_URL, VITE_PUBLIC_SLOT } = import.meta.env;

// Create burner connector for slot development
const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

const burnerAccount = isSlotMode && VITE_PUBLIC_NODE_URL && typeof window !== "undefined"
  ? createBurnerAccount(VITE_PUBLIC_NODE_URL)
  : null;

const burnerConnector = burnerAccount
  ? new MockConnector({
      accounts: {
        sepolia: [burnerAccount],
        mainnet: [burnerAccount],
      },
      options: {
        id: "burner",
        name: "Burner (Dev)",
      },
    })
  : null;

function rpc() {
  return {
    nodeUrl: VITE_PUBLIC_NODE_URL,
  };
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

export function Main() {
  // Include both Controller and Burner connectors when in slot mode
  const connectors = [
    cartridgeConnector,
    ...(burnerConnector ? [burnerConnector as any] : []),
  ];

  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  const loading = useMemo(() => !setupResult, [setupResult]);

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

  const chains = [
    mainnet,
    sepolia,
    ...(slotChain ? [slotChain] : []),
  ];

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StarknetConfig
          autoConnect
          chains={chains}
          connectors={connectors}
          defaultChainId={VITE_PUBLIC_DEPLOY_TYPE === sepolia ? sepolia.id : mainnet.id}
          explorer={voyager}
          provider={jsonRpcProvider({ rpc })}
        >
          <MusicPlayerProvider>
            <MetagameProvider>
              {!loading && setupResult ? (
                <DojoProvider value={setupResult}>
                  <SoundPlayerProvider>
                    <App />
                  </SoundPlayerProvider>
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
