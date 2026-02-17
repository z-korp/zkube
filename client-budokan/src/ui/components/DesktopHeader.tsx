import Connect from "./Connect";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import CubeBalance from "./CubeBalance";
import { useCallback, useState, useMemo } from "react";
import SettingsDialog from "./SettingsDialog";
import { useNavigate } from "react-router-dom";
import { Controller } from "./Controller";
import TutorialModal from "./Tutorial/TutorialModal";
import { Button } from "../elements/button";
import { HeaderLeaderboard } from "./HeaderLeaderboard";
import { ShopButton } from "./Shop/ShopButton";
import { QuestsButton } from "./Quest/QuestsButton";
import { AchievementsButton } from "./AchievementsButton";

const TUTORIAL_PROGRESS_KEY = "zkube_tutorial_step";

interface DesktopHeaderProps {
  onStartTutorial: () => void;
  showTutorial?: boolean;
}

const DesktopHeader = ({
  onStartTutorial,
  showTutorial = false,
}: DesktopHeaderProps) => {
  const { account } = useAccountCustom();

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

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
  };

  const handleTutorialButtonClick = () => {
    // If user has progress, skip modal and start directly
    if (hasTutorialProgress) {
      onStartTutorial();
    } else {
      changeTutorialOpen();
    }
  };

  const handleStartTutorial = () => {
    changeTutorialOpen();
    onStartTutorial();
  };

  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex w-full items-center justify-center p-4 md:justify-between rounded-3xl bg-gradient-to-b from-black/70 via-slate-900/70 to-black/80 shadow-2xl backdrop-blur-xl">
      <div
        className="cursor-pointer flex gap-8 items-center"
        onClick={handleClick}
      >
        <p className="text-4xl font-bold">zKube</p>
        {showTutorial && (
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleTutorialButtonClick();
            }}
          >
            Tutorial
          </Button>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <HeaderLeaderboard buttonType="outline" textSize="sm" />
        </div>
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={changeTutorialOpen}
          onStartTutorial={handleStartTutorial}
        />
      </div>
      <div className="flex flex-col gap-4 items-center md:flex-row">
        {account ? (
          <div className="flex gap-4 flex-1 justify-end items-center px-4">
            <CubeBalance />
            <QuestsButton />
            <AchievementsButton />
            <ShopButton />
            <Controller />
          </div>
        ) : (
          ACCOUNT_CONNECTOR === "controller" && <Connect />
        )}
        <div className="flex gap-4">
          <SettingsDialog />
        </div>
      </div>
    </div>
  );
};

export default DesktopHeader;
