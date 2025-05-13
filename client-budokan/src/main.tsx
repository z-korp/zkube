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

import "./index.css";
import { type BigNumberish, shortString } from "starknet";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";

//const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

function rpc() {
  return {
    nodeUrl: import.meta.env.VITE_PUBLIC_NODE_URL,
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
      const result = await setup(dojoConfig());
      setSetupResult(result);
    }
    initialize();
  }, []);

  //
  // supported chain ids
  //
  enum ChainId {
    SN_MAIN = "SN_MAIN",
    SN_SEPOLIA = "SN_SEPOLIA",
    SLOT = "WP_BUDOKAN_MATTH",
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

  const chains = [
    mainnet,
    sepolia,
    {
      id: BigInt(stringToFelt(ChainId.SLOT)),
      name: "Budokan Matth",
      network: "katana",
      testnet: true,
      nativeCurrency: ETH_KATANA,
      rpcUrls: {
        default: { http: ["https://api.cartridge.gg/x/budokan-matth/katana"] },
        public: { http: ["https://api.cartridge.gg/x/budokan-matth/katana"] },
      },
      explorers: WORLD_EXPLORER,
    },
  ];

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StarknetConfig
          autoConnect
          chains={chains}
          connectors={connectors}
          explorer={voyager}
          provider={jsonRpcProvider({ rpc })}
        >
          <MusicPlayerProvider>
            {!loading && setupResult ? (
              <DojoProvider value={setupResult}>
                <SoundPlayerProvider>
                  <App />
                </SoundPlayerProvider>
              </DojoProvider>
            ) : (
              <Loading />
            )}
          </MusicPlayerProvider>
        </StarknetConfig>
      </ThemeProvider>
    </React.StrictMode>
  );
}

root.render(<Main />);
