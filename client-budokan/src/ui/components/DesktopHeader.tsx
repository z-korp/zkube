import Connect from "./Connect";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
// import HeaderBalance from "./HeaderBalance";
import { useCallback, useState } from "react";
import SettingsDropDown from "./SettingsDropDown";
import { useNavigate } from "react-router-dom";
import { Controller } from "./Controller";
import TutorialModal from "./Tutorial/TutorialModal";
import { Button } from "../elements/button";
import { HeaderLeaderboard } from "./HeaderLeaderboard";

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

  const changeTutorialOpen = () => {
    setIsTutorialOpen(!isTutorialOpen);
  };

  const handleStartTutorial = () => {
    changeTutorialOpen();
    onStartTutorial();
  };

  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate("", { replace: true });
  }, [navigate]);

  return (
    <div className="flex justify-center items-center p-4 flex-wrap md:justify-between">
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
              changeTutorialOpen();
            }}
          >
            Tutorial
          </Button>
        )}
        <HeaderLeaderboard buttonType="outline" textSize="sm" />
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={changeTutorialOpen}
          onStartTutorial={handleStartTutorial}
        />
      </div>
      <div className="flex flex-col gap-4 items-center md:flex-row">
        {!!account && (
          <div className="flex gap-4 flex-1 justify-end px-4 w-2/4">
            {/* <HeaderBalance /> */}
            <Controller />
          </div>
        )}

        {ACCOUNT_CONNECTOR === "controller" && <Connect />}
        <div className="flex gap-4">
          <SettingsDropDown />
        </div>
      </div>
    </div>
  );
};

export default DesktopHeader;
