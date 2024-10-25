import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { setup, SetupResult } from "./dojo/setup.ts";
import { DojoProvider } from "./dojo/context.tsx";
import { dojoConfig } from "../dojo.config.ts";
import { Loading } from "@/ui/screens/Loading";
import { MusicPlayerProvider } from "./contexts/music.tsx";
import { SoundPlayerProvider } from "./contexts/sound.tsx";
import { ThemeProvider } from "./ui/elements/theme-provider.tsx";
import { StarknetConfig, jsonRpcProvider, voyager } from "@starknet-react/core";
import { sepolia } from "@starknet-react/chains";
import cartridgeConnector from "./cartridgeConnector.tsx";

import "./index.css";

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
  const [ready, setReady] = useState(false);
  const [enter, setEnter] = useState(false);

  const loading = useMemo(
    () => !enter || !setupResult || !ready,
    [enter, setupResult, ready],
  );

  useEffect(() => {
    async function initialize() {
      const result = await setup(dojoConfig());
      setSetupResult(result);
    }
    initialize();
  }, [enter]);

  useEffect(() => {
    if (!enter) return;
    setTimeout(() => setReady(true), 2000);
  }, [enter]);

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StarknetConfig
          autoConnect
          chains={[sepolia]}
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
              <Loading enter={enter} setEnter={setEnter} />
            )}
          </MusicPlayerProvider>
        </StarknetConfig>
      </ThemeProvider>
    </React.StrictMode>
  );
}

root.render(<Main />);
