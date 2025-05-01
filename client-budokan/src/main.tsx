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
import cartridgeConnector from "./cartridgeConnector";

import "./index.css";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

function rpc() {
  return {
    nodeUrl: import.meta.env.VITE_PUBLIC_NODE_URL,
  };
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
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

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StarknetConfig
          autoConnect
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
