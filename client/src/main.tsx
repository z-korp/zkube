import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { setup, SetupResult } from "./dojo/setup.ts";
import { DojoProvider } from "./dojo/context.tsx";
import { dojoConfig } from "../dojo.config.ts";
import { Loading } from "@/ui/screens/Loading";
import { MusicPlayerProvider } from "./contexts/music";
import { SoundPlayerProvider } from "./contexts/sound";
import { ThemeProvider } from "./ui/elements/theme-provider/index";
import { StarknetConfig, jsonRpcProvider, voyager } from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { buildConnector } from "./cartridgeConnector";
import { defineContractComponents } from "./dojo/contractModels";
import { models } from "./dojo/models";
import { world } from "./dojo/world";

import "./index.css";

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_OFFCHAIN } = import.meta.env;

function rpc() {
  return {
    nodeUrl: import.meta.env.VITE_PUBLIC_NODE_URL,
  };
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

export function Main() {
  const offchain = String(VITE_PUBLIC_OFFCHAIN).toLowerCase() === "true";
  const connectors = offchain ? [] : [buildConnector()];
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  const loading = useMemo(() => !setupResult, [setupResult]);

  useEffect(() => {
    async function initialize() {
      try {
        const result = await setup(dojoConfig());
        setSetupResult(result);
      } catch (e) {
        console.error("setup failed, falling back to offchain stub:", e);
        const contractComponents = defineContractComponents(world);
        const clientModels = models({ contractComponents });
        const stub: SetupResult = {
          // @ts-expect-error offchain stub
          client: {},
          clientModels,
          contractComponents,
          // @ts-expect-error offchain stub
          systemCalls: {},
          config: dojoConfig(),
          world,
          // @ts-expect-error offchain stub
          rpcProvider: undefined,
          // @ts-expect-error offchain stub
          sync: undefined,
          // @ts-expect-error offchain stub
          toriiClient: undefined,
        } as any;
        setSetupResult(stub);
      }
    }
    initialize();
  }, []);

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StarknetConfig
          autoConnect={!offchain}
          chains={[VITE_PUBLIC_DEPLOY_TYPE === "mainnet" ? mainnet : sepolia]}
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
