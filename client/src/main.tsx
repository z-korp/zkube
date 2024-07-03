import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setup, SetupResult } from './dojo/setup.ts';
import { DojoProvider } from './dojo/context.tsx';
import { dojoConfig } from '../dojo.config.ts';
import { Loading } from '@/ui/screens/Loading';
import { Home } from '@/ui/screens/Home';
import { MusicPlayerProvider } from './contexts/music.tsx';
import { SoundPlayerProvider } from './contexts/sound.tsx';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

function Main() {
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [ready, setReady] = useState(false);
  const [enter, setEnter] = useState(false);

  const loading = useMemo(() => !enter || !setupResult || !ready, [enter, setupResult, ready]);

  useEffect(() => {
    async function initialize() {
      // Simulons le chargement des données
      const result = await new Promise<SetupResult>((resolve) => setTimeout(() => resolve({} as SetupResult), 1000));
      setSetupResult(result);
      setReady(true);
    }

    if (enter) {
      initialize();
    }
  }, [enter]);

  return (
    <React.StrictMode>
      <MusicPlayerProvider>
        {enter && ready ? (
          //<DojoProvider value={setupResult}>
          //<SoundPlayerProvider>
          <App />
        ) : (
          //</SoundPlayerProvider>
          //</DojoProvider>
          <Loading enter={enter} setEnter={setEnter} />
        )}
      </MusicPlayerProvider>
    </React.StrictMode>
  );
}

root.render(<Main />);
