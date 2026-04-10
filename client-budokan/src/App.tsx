import { Toaster } from "./ui/elements/sonner";
import { TooltipProvider } from "@/ui/elements/tooltip";
import PageNavigator from "@/ui/navigation/PageNavigator";
import { useNavigationStore } from "@/stores/navigationStore";
import type { PageId } from "@/stores/navigationStore";
import { getToastPlacement } from "@/utils/toast";
import HomePage from "@/ui/pages/HomePage";
import PlayScreen from "@/ui/pages/PlayScreen";
import MapPage from "@/ui/pages/MapPage";
import SettingsPage from "@/ui/pages/SettingsPage";
import RewardsPage from "@/ui/pages/RewardsPage";
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
  rewards: <RewardsPage />,
  profile: <ProfilePage />,
  daily: <DailyChallengePage />,
  boss: <BossRevealPage />,
  mutator: <MutatorRevealPage />,
};

export default function App() {
  const currentPage = useNavigationStore((s) => s.currentPage);

  return (
    <TooltipProvider>
      <PageNavigator>
        {pageComponents[currentPage] ?? pageComponents.home}
      </PageNavigator>
      <Toaster position={getToastPlacement()} />
    </TooltipProvider>
  );
}
