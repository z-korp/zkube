import { useEffect, useState } from "react";
import { Toaster } from "./ui/elements/sonner";
import { TooltipProvider } from "@/ui/elements/tooltip";
import PageNavigator from "@/ui/navigation/PageNavigator";
import { useNavigationStore } from "@/stores/navigationStore";
import type { PageId } from "@/stores/navigationStore";
import { getToastPlacement } from "@/utils/toast";
import { useAccount } from "@starknet-react/core";
import { Loading } from "@/ui/screens/Loading";

import HomePage from "@/ui/pages/HomePage";
import PlayScreen from "@/ui/pages/PlayScreen";
import MapPage from "@/ui/pages/MapPage";
import SettingsPage from "@/ui/pages/SettingsPage";
import MyGamesPage from "@/ui/pages/MyGamesPage";
import LeaderboardPage from "@/ui/pages/LeaderboardPage";
import ProfilePage from "@/ui/pages/ProfilePage";
import DailyChallengePage from "@/ui/pages/DailyChallengePage";
import BossRevealPage from "@/ui/pages/BossRevealPage";
import MutatorRevealPage from "@/ui/pages/MutatorRevealPage";

const pageComponents: Partial<Record<PageId, React.ReactNode>> = {
  home: <HomePage />,
  play: <PlayScreen />,
  map: <MapPage />,
  ranks: <LeaderboardPage />,
  settings: <SettingsPage />,
  mygames: <MyGamesPage />,
  profile: <ProfilePage />,
  daily: <DailyChallengePage />,
  boss: <BossRevealPage />,
  mutator: <MutatorRevealPage />,
};

const CurrentPage: React.FC = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  return pageComponents[currentPage] ?? pageComponents.home;
};

// starknet-react's isReconnecting is never set to true — auto-connect is fire-and-forget.
// We gate on lastUsedConnector in localStorage to hold the loading screen until connected or timeout.
function useAutoConnectGate(): boolean {
  const { status } = useAccount();
  const [waiting, setWaiting] = useState(
    () => localStorage.getItem("lastUsedConnector") !== null,
  );

  useEffect(() => {
    if (!waiting) return;

    if (status === "connected") {
      setWaiting(false);
      return;
    }

    const timer = setTimeout(() => setWaiting(false), 3000);
    return () => clearTimeout(timer);
  }, [waiting, status]);

  return waiting;
}

export default function App() {
  const waitingForAutoConnect = useAutoConnectGate();

  if (waitingForAutoConnect) return <Loading />;

  return (
    <TooltipProvider>
      <PageNavigator>
        <CurrentPage />
      </PageNavigator>
      <Toaster position={getToastPlacement()} />
    </TooltipProvider>
  );
}
