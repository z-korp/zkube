import { Leaderboard } from "../modules/Leaderboard";
import { ProfilePage } from "../modules/ProfilePage";
import Connect from "./Connect";
import { usePlayer } from "@/hooks/usePlayer";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import HeaderBalance from "./HeaderBalance";
import { Button } from "../elements/button";
import CollectiveTreasureChest from "./TreasureChest";
import { useCallback, useState } from "react";
import LevelIndicator from "./LevelIndicator";
import SettingsDropDown from "./SettingsDropDown";
import { useNavigate } from "react-router-dom";
import TutorialModal from "./TutorialModal";
import { Controller } from "./Controller";



interface DesktopHeaderProps {
  onStartTutorial: () => void;
}
const DesktopHeader: React.FC<DesktopHeaderProps> = ({ onStartTutorial }) =>  {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });

  const [isOpen, setIsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showTutorialText, setShowTutorialText] = useState(true);


  const handleTutorialOpen = () => {
    setIsTutorialOpen(true);
  };

  const handleTutorialClose = () => {
    setIsTutorialOpen(false);
  };
  
  const onClose = () => {
    setIsOpen(false);
  };

  const handleStartTutorial = () => {
   handleTutorialClose();
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
        <Leaderboard buttonType="outline" textSize="sm" />
        {/*<ContentTabs />*/}
        <Button variant={"outline"} onClick={() => setIsOpen(true)}>
          Collective Chests
        </Button>
        <CollectiveTreasureChest isOpen={isOpen} onClose={onClose} />
        <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleTutorialOpen();
            }}
          >
            Tutorial
          </Button>
          <TutorialModal isOpen={isTutorialOpen} onClose={handleTutorialClose}  onStartTutorial={handleStartTutorial}/>
      </div>
      <div className="flex flex-col gap-4 items-center md:flex-row">
        {!!player && (
          <div className="flex gap-4 flex-1 justify-end px-4 w-2/4">
            {" "}
            <HeaderBalance />
            <ProfilePage wfit />
            <Controller />
            <LevelIndicator currentXP={player.points} />
          </div>
        )}

        {ACCOUNT_CONNECTOR === "controller" && <Connect />}
        <div className="flex gap-4">
          <SettingsDropDown />
          {/*<ModeToggle />*/}
        </div>
      </div>
    </div>
  );
};

export default DesktopHeader;
