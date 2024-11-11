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
import { Controller } from "./Controller";

const DesktopHeader = () => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
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
