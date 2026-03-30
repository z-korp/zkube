import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "./ui/elements/sonner";
import { TooltipProvider } from "@/ui/elements/tooltip";
import { useNavigationStore, FULLSCREEN_PAGES } from "@/stores/navigationStore";
import type { PageId } from "@/stores/navigationStore";
import { getToastPlacement } from "@/utils/toast";
import { useAccount } from "@starknet-react/core";
import { Loading } from "@/ui/screens/Loading";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import BottomTabBar from "@/ui/components/BottomTabBar";
import PhoneFrame from "@/ui/components/shared/PhoneFrame";

import HomePage from "@/ui/pages/HomePage";
import PlayScreen from "@/ui/pages/PlayScreen";
import MapPage from "@/ui/pages/MapPage";
import SettingsPage from "@/ui/pages/SettingsPage";
import LeaderboardPage from "@/ui/pages/LeaderboardPage";
import DailyChallengePage from "@/ui/pages/DailyChallengePage";

const pageComponents: Record<PageId, React.ReactNode> = {
  home: <HomePage />,
  play: <PlayScreen />,
  map: <MapPage />,
  ranks: <LeaderboardPage />,
  settings: <SettingsPage />,
  daily: <DailyChallengePage />,
};

const TRANSITION_DURATION = 0.15;
const EASE_OUT_CUBIC: [number, number, number, number] = [0.33, 1, 0.68, 1];
const SLIDE_TRANSITION = {
  duration: TRANSITION_DURATION,
  ease: EASE_OUT_CUBIC,
};

const CurrentPage: React.FC = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const transitionDirection = useNavigationStore((s) => s.transitionDirection);
  const isBack = transitionDirection === "back";

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={currentPage}
        initial={{ x: isBack ? "-100%" : "100%" }}
        animate={{ x: 0 }}
        exit={{ x: isBack ? "100%" : "-100%" }}
        transition={SLIDE_TRANSITION}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
      >
        {pageComponents[currentPage]}
      </motion.div>
    </AnimatePresence>
  );
};

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
  const currentPage = useNavigationStore((s) => s.currentPage);
  const showTabBar = !FULLSCREEN_PAGES.has(currentPage);

  if (waitingForAutoConnect) return <Loading />;

  return (
    <TooltipProvider>
      <PhoneFrame>
        <div className="relative flex h-full flex-col">
          <ThemeBackground />
          <div
            className="relative flex-1 min-h-0 overflow-hidden"
            style={showTabBar ? { paddingBottom: 0 } : undefined}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={showTabBar ? { bottom: "4rem" } : undefined}
            >
              <CurrentPage />
            </div>
          </div>
          {showTabBar && <BottomTabBar />}
        </div>
      </PhoneFrame>
      <Toaster position={getToastPlacement()} />
    </TooltipProvider>
  );
}
