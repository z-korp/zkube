import { faBars, faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../elements/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../elements/dropdown-menu";

import { Leaderboard } from "../modules/Leaderboard";
import { ProfilePage } from "../modules/ProfilePage";
import AccountDetails from "./AccountDetails";
import Connect from "./Connect";
import { usePlayer } from "@/hooks/usePlayer";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import HeaderBalance from "./HeaderBalance";
import { Button } from "../elements/button";
import CollectiveTreasureChest from "./TreasureChest";
import { useState } from "react";
import { Surrender } from "../actions/Surrender";
import LevelIndicator from "./LevelIndicator";
import { Controller } from "./Controller";
import TutorialModal from "./Tutorial/TutorialModal";

interface MobileHeaderProps {
  onStartTutorial: () => void;
}

const MobileHeader = ({ onStartTutorial }: MobileHeaderProps) => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });

  const [isOpen, setIsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
  };

  const changeTutorialOpen = () => {
    setIsTutorialOpen(!isTutorialOpen);
    setIsDrawerOpen(false); // Close drawer when opening tutorial
  };

  const handleStartTutorial = () => {
    changeTutorialOpen();
    onStartTutorial();
  };

  return (
    <div className="px-3 py-2 flex gap-3">
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
              <Surrender red variant="outline" className="w-full text-sm" />
              <Leaderboard buttonType="outline" textSize="sm" inMenu={true} />
              <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="w-full"
              >
                Collective Chests
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsTutorialOpen(true)}
                className="w-full"
              >
                Tutorial
              </Button>
              <TutorialModal
                isOpen={isTutorialOpen}
                onClose={changeTutorialOpen}
                onStartTutorial={handleStartTutorial}
              />
              <CollectiveTreasureChest isOpen={isOpen} onClose={onClose} />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Profile</p>
              <ProfilePage wfit={false} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <div className="w-full flex justify-between items-center">
        <div className="flex w-full gap-2 justify-end">
          {!!player && account ? (
            <div className="flex gap-3 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"outline"}>
                    <FontAwesomeIcon icon={faCoins} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Assets</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <HeaderBalance />
                </DropdownMenuContent>
              </DropdownMenu>
              <ProfilePage wfit />
              <Controller />
              <LevelIndicator currentXP={player.points} />
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
