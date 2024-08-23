import { ModeType } from "@/dojo/game/types/mode";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
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
import { MusicPlayer } from "../modules/MusicPlayer";
import AccountDetails from "./AccountDetails";
import { ModeToggle } from "./Theme";
import Connect from "./Connect";
import { usePlayer } from "@/hooks/usePlayer";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import DisconnectButton from "./DisconnectButton";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import Balance from "./Balance";
import DailyGameStatus from "./DailyGameStatus";

const MobileMenu = () => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { username } = useControllerUsername();

  return (
    <div className="px-3 py-2 flex gap-5">
      <Drawer direction="left">
        <DrawerTrigger>
          <FontAwesomeIcon icon={faBars} size="xl" />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="mt-4">
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-5 p-4">
            {/*<div className="flex flex-col gap-2 items-center">
                <p className="self-start">Burner Account</p> <BurnerAccount />
              </div>*/}
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Theme</p> <ModeToggle />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Sound</p> <MusicPlayer />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Account</p>
              <div className="px-1">{username}</div>
              <AccountDetails />
              <DailyGameStatus />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <p className="self-start">Leaderboard</p>
              <Leaderboard />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <div className="w-full flex justify-between items-center">
        <p className="text-4xl font-bold">zKube</p>
        <div className="flex gap-2">
          <DailyGameStatus />
          {!!player && account ? (
            <div className="flex gap-3 items-center">
              <p className="text-2xl max-w-44 truncate">{player.name}</p>
              {ACCOUNT_CONNECTOR === "controller" && <DisconnectButton />}
            </div>
          ) : (
            <Connect />
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
