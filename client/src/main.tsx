import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setup, SetupResult } from "./dojo/setup.ts";
import { DojoProvider } from "./dojo/context.tsx";
import { dojoConfig } from "../dojo.config.ts";
import { Loading } from "@/ui/screens/Loading";
import { MusicPlayerProvider } from "./contexts/music.tsx";
import { SoundPlayerProvider } from "./contexts/sound.tsx";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

function Main() {
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

    console.log("Dojo config:");
    console.log(dojoConfig().stringverif);
    initialize();
  }, [enter]);

  useEffect(() => {
    if (!enter) return;
    setTimeout(() => setReady(true), 2000);
  }, [enter]);

  return (
    <React.StrictMode>
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
    </React.StrictMode>
  );
}
root.render(<Main />);
