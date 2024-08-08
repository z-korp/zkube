import { useCallback } from "react";
import { Account } from "@/ui/components/Account";
import { Separator } from "@/ui/elements/separator";
import { useNavigate } from "react-router-dom";
import { ModeToggle } from "@/ui/components/Theme";
import { useDojo } from "@/dojo/useDojo";
import { usePlayer } from "@/hooks/usePlayer";
import { useMediaQuery } from "react-responsive";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/ui/elements/drawer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faGear,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import Connect from "../components/Connect";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/ui/elements/dropdown-menu";
import { Button } from "../elements/button";
import { Leaderboard } from "../modules/Leaderboard";
import { Achievements } from "../modules/Achievements";
import { MusicPlayer } from "../modules/MusicPlayer";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
import Balance from "../components/Balance";
import { useAccount } from "@starknet-react/core";

export const Header = () => {
  const { account } = useAccount();

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const { player } = usePlayer({ playerId: account?.address });

  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate("", { replace: true });
  }, [navigate]);

  return isMdOrLarger ? (
    <div>
      <div className="flex justify-center items-center p-4 flex-wrap md:justify-between border-4">
        <div
          className="cursor-pointer flex gap-8 items-center"
          onClick={handleClick}
        >
          <p className="text-4xl font-bold">zKube</p>
          <Leaderboard />
          <Achievements />
        </div>
        <div className="flex flex-col gap-4 items-center md:flex-row">
          {!!player && (
            <p className="text-2xl max-w-44 truncate">{player.name}</p>
          )}
          <Connect />
          <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-4">
                  <FontAwesomeIcon icon={faGear} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={24}>
                <DropdownMenuLabel>Sound</DropdownMenuLabel>
                <DropdownMenuItem>
                  <MusicPlayer />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Burner Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Account />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ModeToggle />
          </div>
        </div>
      </div>
      <Separator />
    </div>
  ) : (
    <div>
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
              <div className="flex flex-col gap-2 items-center">
                <p className="self-start">Burner Account</p> <Account />
              </div>
              <div className="flex flex-col gap-2 items-center">
                <p className="self-start">Theme</p> <ModeToggle />
              </div>
              <div className="flex flex-col gap-2 items-center">
                <p className="self-start">Sound</p> <MusicPlayer />
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
          {!!player && account ? (
            <div className="flex gap-2 items-center">
              <p className="text-2xl max-w-44 truncate">{player.name}</p>
              <Balance
                address={account.address}
                token_address={KATANA_ETH_CONTRACT_ADDRESS}
              />
            </div>
          ) : (
            <Connect />
          )}
        </div>
      </div>
      <Separator />
    </div>
  );
};
