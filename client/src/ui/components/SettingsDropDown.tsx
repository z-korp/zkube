import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../elements/button";
import { MusicPlayer } from "../modules/MusicPlayer";
import AccountDetails from "./AccountDetails";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../elements/dropdown-menu";

export const SettingsDropDown = () => {
  const { username } = useControllerUsername();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <FontAwesomeIcon icon={faGear} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={20}>
        <DropdownMenuLabel>Sound</DropdownMenuLabel>
        <DropdownMenuItem>
          <MusicPlayer />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xl font-bold">
          Account
        </DropdownMenuLabel>
        <div className="p-1 flex flex-col gap-2">
          <div className="px-1">{username}</div>
          <AccountDetails />
        </div>
        {/*<DropdownMenuLabel>Burner Account</DropdownMenuLabel>
      <DropdownMenuItem>
        <BurnerAccount />
      </DropdownMenuItem>*/}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropDown;
