import { useCallback } from "react";
import { Separator } from "@/ui/elements/separator";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/hooks/usePlayer";
import { useMediaQuery } from "react-responsive";
import { Leaderboard } from "../modules/Leaderboard";
import Connect from "../components/Connect";
import { ModeType } from "@/dojo/game/types/mode";
import SettingsDropDown from "../components/SettingsDropDown";
import MobileMenu from "../components/MobileMenu";
import LevelIndicator from "../components/LevelIndicator";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import DailyGameStatus from "../components/DailyGameStatus";
import HeaderBalance from "../components/HeaderBalance";
import ContentTabs from "../components/ContentTabs";

export const Header = () => {
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
        </div>
        <div className="flex item-center gap-4">
          <DailyGameStatus />
          <HeaderBalance />
        </div>
        <div className="flex flex-col gap-4 items-center md:flex-row">
          {!!player && (
            <div className="flex gap-3">
              <p className="text-2xl max-w-66 truncate">{player.name}</p>
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
      <Separator />
    </div>
  ) : (
    <div>
      <MobileMenu />
      <Separator />
    </div>
  );
};
