import { useCallback } from "react";
import { Separator } from "@/ui/elements/separator";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/hooks/usePlayer";
import { useMediaQuery } from "react-responsive";
import { Leaderboard } from "../modules/Leaderboard";
import { ProfilePage } from "../modules/ProfilePage";
import Connect from "../components/Connect";
import { ModeType } from "@/dojo/game/types/mode";
import SettingsDropDown from "../components/SettingsDropDown";
import MobileMenu from "../components/MobileMenu";
import LevelIndicator from "../components/LevelIndicator";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import DailyGameStatus from "../components/DailyGameStatus";
import HeaderBalance from "../components/HeaderBalance";
import ContentTabs from "../components/ContentTabs";
import { TutorialComponent } from "../modules/TutorialComponent";
import { Button } from "../elements/button";


interface HeaderProps {
  onStartTutorial: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartTutorial }) => {
  const { account } = useAccountCustom();

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const { player } = usePlayer({ playerId: account?.address });

  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate("", { replace: true });
  }, [navigate]);

  return isMdOrLarger ? (
    <div>
      <div className="flex justify-center items-center p-4 flex-wrap md:justify-between">
        <div
          className="cursor-pointer flex gap-8 items-center"
          onClick={handleClick}
        >
          <p className="text-4xl font-bold">zKube</p>
          <Leaderboard />
          <ContentTabs />
          <Button variant="outline" onClick={onStartTutorial}>Tutorial</Button>
        </div>
        <div className="flex flex-col gap-4 items-center md:flex-row">
          {!!player && (
            <div className="flex gap-3">
              <ProfilePage />
              <LevelIndicator currentXP={player.points} />
              <DailyGameStatus />
              <HeaderBalance />
            </div>
          )}

          {ACCOUNT_CONNECTOR === "controller" && <Connect />}
          <div className="flex gap-4">
            <SettingsDropDown />
            {/*<ModeToggle />*/}
          </div>
        </div>
      </div>
      <Separator />
    </div>
  ) : (
    <div>
      <MobileMenu />
      <Separator />
    </div>
  );
};
