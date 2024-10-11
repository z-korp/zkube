import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../elements/drawer";
import { Leaderboard } from "../modules/Leaderboard";
import { ProfilePage } from "../modules/ProfilePage";
import { MusicPlayer } from "../modules/MusicPlayer";
import AccountDetails from "./AccountDetails";
import { ModeToggle } from "./Theme";
import Connect from "./Connect";
import { usePlayer } from "@/hooks/usePlayer";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import HeaderBalance from "./HeaderBalance";
import { Button } from "../elements/button";
import CollectiveTreasureChest from "./TreasureChest";
import { useState } from "react";
import { Surrender } from "../actions/Surrender";

const MobileMenu = () => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="px-3 py-2 flex gap-3">
      <Drawer direction="left">
        <DrawerTrigger>
          <FontAwesomeIcon icon={faBars} size="xl" />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-2xl">zKube</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-5 p-4">
            {/* <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Theme</p> <ModeToggle />
            </div> */}
            {/* <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Sound</p> <MusicPlayer />
            </div> */}
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Account</p>
              <AccountDetails />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Menu</p>

              <Surrender red variant="outline" className="w-full text-sm" />
              <Leaderboard />
              <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="w-full"
              >
                Collective Chests
              </Button>
              <CollectiveTreasureChest isOpen={isOpen} onClose={onClose} />
            </div>

            {/*<div className="flex flex-col gap-2 items-center">
              <p className="self-start">Extras</p>
              <ContentTabs />
            </div>*/}
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Profile</p>
              <ProfilePage wfit={false} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <div className="w-full flex justify-between items-center">
        <p className="text-2xl font-bold">zKube</p>
        <div className="flex gap-2">
          {!!player && account ? (
            <div className="flex gap-3 items-center">
              <HeaderBalance />
              <ProfilePage wfit />
            </div>
          ) : (
            ACCOUNT_CONNECTOR === "controller" && <Connect />
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
