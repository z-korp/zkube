import { Toaster } from "./ui/elements/sonner";
import { TooltipProvider } from "@/ui/elements/tooltip";
import PageNavigator from "@/ui/navigation/PageNavigator";
import { useNavigationStore } from "@/stores/navigationStore";
import type { PageId } from "@/stores/navigationStore";
import { getToastPlacement } from "@/utils/toast";
import { useAccount } from "@starknet-react/core";
import { Loading } from "@/ui/screens/Loading";
import HomePage from "@/ui/pages/HomePage";
import LoadoutPage from "@/ui/pages/LoadoutPage";
import PlayScreen from "@/ui/pages/PlayScreen";
import MapPage from "@/ui/pages/MapPage";
import ShopPage from "@/ui/pages/ShopPage";
import InGameShopPage from "@/ui/pages/InGameShopPage";
import QuestsPage from "@/ui/pages/QuestsPage";
import SettingsPage from "@/ui/pages/SettingsPage";
import MyGamesPage from "@/ui/pages/MyGamesPage";
import LeaderboardPage from "@/ui/pages/LeaderboardPage";
import TutorialPage from "@/ui/pages/TutorialPage";

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
  return <>{pageComponents[currentPage]}</>;
};

export default function App() {
  const { isReconnecting } = useAccount();

  if (isReconnecting) return <Loading />;

  return (
    <TooltipProvider>
      <PageNavigator>
        <CurrentPage />
      </PageNavigator>
      <Toaster position={getToastPlacement()} />
    </TooltipProvider>
  );
}
