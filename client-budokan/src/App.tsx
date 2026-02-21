import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "./ui/elements/sonner";
import { TooltipProvider } from "@/ui/elements/tooltip";
import PageNavigator from "@/ui/navigation/PageNavigator";
import { useNavigationStore } from "@/stores/navigationStore";
import type { PageId } from "@/stores/navigationStore";
import { getToastPlacement } from "@/utils/toast";
import { useAccount } from "@starknet-react/core";
import { Loading } from "@/ui/screens/Loading";

const HomePage = lazy(() => import("@/ui/pages/HomePage"));
const LoadoutPage = lazy(() => import("@/ui/pages/LoadoutPage"));
const PlayScreen = lazy(() => import("@/ui/pages/PlayScreen"));
const MapPage = lazy(() => import("@/ui/pages/MapPage"));
const ShopPage = lazy(() => import("@/ui/pages/ShopPage"));
const InGameShopPage = lazy(() => import("@/ui/pages/InGameShopPage"));
const QuestsPage = lazy(() => import("@/ui/pages/QuestsPage"));
const SettingsPage = lazy(() => import("@/ui/pages/SettingsPage"));
const MyGamesPage = lazy(() => import("@/ui/pages/MyGamesPage"));
const LeaderboardPage = lazy(() => import("@/ui/pages/LeaderboardPage"));
const TutorialPage = lazy(() => import("@/ui/pages/TutorialPage"));

const pageComponents: Record<PageId, React.ReactNode> = {
  home: <HomePage />,
  loadout: <LoadoutPage />,
  play: <PlayScreen />,
  map: <MapPage />,
  shop: <ShopPage />,
  quests: <QuestsPage />,
  leaderboard: <LeaderboardPage />,
  settings: <SettingsPage />,
  mygames: <MyGamesPage />,
  tutorial: <TutorialPage />,
  ingameshop: <InGameShopPage />,
};

const CurrentPage: React.FC = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  return <Suspense fallback={<Loading />}>{pageComponents[currentPage]}</Suspense>;
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
