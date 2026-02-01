import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../elements/drawer";
import AccountDetails from "./AccountDetails";
import Connect from "./Connect";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import { Button } from "../elements/button";
import { useState, useMemo } from "react";
import { Surrender } from "../actions/Surrender";
import { Controller } from "./Controller";
import TutorialModal from "./Tutorial/TutorialModal";
import { HeaderLeaderboard } from "./HeaderLeaderboard";
import CubeBalance from "./CubeBalance";
import { ShopButton } from "./Shop/ShopButton";
import { QuestsButton } from "./Quest/QuestsButton";
import { AchievementsButton } from "./AchievementsButton";

const TUTORIAL_PROGRESS_KEY = "zkube_tutorial_step";

interface MobileHeaderProps {
  onStartTutorial: () => void;
  showTutorial?: boolean;
}

const MobileHeader = ({
  onStartTutorial,
  showTutorial = false,
}: MobileHeaderProps) => {
  const { account } = useAccountCustom();

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check if user has existing tutorial progress
  const hasTutorialProgress = useMemo(() => {
    try {
      const saved = localStorage.getItem(TUTORIAL_PROGRESS_KEY);
      return saved !== null;
    } catch {
      return false;
    }
  }, []);

  const changeTutorialOpen = () => {
    setIsTutorialOpen(!isTutorialOpen);
    setIsDrawerOpen(false); // Close drawer when opening tutorial
  };

  const handleTutorialButtonClick = () => {
    // If user has progress, skip modal and start directly
    if (hasTutorialProgress) {
      setIsDrawerOpen(false);
      onStartTutorial();
    } else {
      setIsTutorialOpen(true);
    }
  };

  const handleStartTutorial = () => {
    changeTutorialOpen();
    onStartTutorial();
  };

  return (
    <div className="px-3 py-2 flex gap-3 bg-gradient-to-b from-black/70 via-slate-900/70 to-black/80 shadow-2xl backdrop-blur-xl">
      <Drawer
        direction="left"
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerTrigger>
          <FontAwesomeIcon icon={faBars} size="xl" />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-2xl">zKube</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-5 p-4 font-semibold md:font-normal">
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Account</p>
              <AccountDetails />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Menu</p>
              <Surrender
                gameId={0}
                red
                variant="outline"
                className="w-full text-sm"
              />
              {showTutorial && (
                <Button
                  variant="outline"
                  onClick={handleTutorialButtonClick}
                  className="w-full"
                >
                  Tutorial
                </Button>
              )}
              <HeaderLeaderboard buttonType="outline" textSize="md" />
              <TutorialModal
                isOpen={isTutorialOpen}
                onClose={changeTutorialOpen}
                onStartTutorial={handleStartTutorial}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <div className="w-full flex justify-between items-center">
        <div className="flex w-full gap-2 justify-end">
          {account ? (
            <div className="flex gap-3 items-center">
              <CubeBalance showLabel={false} />
              <QuestsButton />
              <AchievementsButton iconOnly />
              <ShopButton />
              <Controller />
            </div>
          ) : (
            ACCOUNT_CONNECTOR === "controller" && <Connect />
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
