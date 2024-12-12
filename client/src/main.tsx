// src/Main.tsx
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { StarknetConfig, jsonRpcProvider, voyager } from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import cartridgeConnector from "./cartridgeConnector.tsx";
import { setup, SetupResult } from "./dojo/setup.ts";
import { DojoProvider } from "./dojo/context.tsx";
import { dojoConfig } from "../dojo.config.ts";
import { MusicPlayerProvider } from "./contexts/music.tsx";
import { SoundPlayerProvider } from "./contexts/sound.tsx";
import { ThemeProvider } from "./ui/elements/theme-provider/index.tsx";
import DevPage from "./ui/screens/DevPage";
import App from "./App";

import "./index.css";
import { Loading } from "./ui/screens/Loading.tsx";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

function rpc() {
  return {
    nodeUrl: import.meta.env.VITE_PUBLIC_NODE_URL,
  };
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

function Main() {
  const connectors = [cartridgeConnector];
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [skipDevPage, setSkipDevPage] = useState(false);

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
        {import.meta.env.DEV &&
        window.location.pathname === "/dev" &&
        !skipDevPage ? (
          <DevPage onSkip={() => setSkipDevPage(true)} />
        ) : (
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
        )}
      </ThemeProvider>
    </React.StrictMode>
  );
}

root.render(<Main />);
