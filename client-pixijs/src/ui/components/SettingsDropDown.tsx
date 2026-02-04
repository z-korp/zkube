import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../elements/button";
import { MusicPlayer } from "../modules/MusicPlayer";
import AccountDetails from "./AccountDetails";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../elements/dropdown-menu";

import { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import { useTheme } from "../elements/theme-provider/hooks";

export const SettingsDropDown = () => {
  const { themeTemplate, setThemeTemplate } = useTheme();

  const themes = [
    { id: "theme-1", name: "Tiki", icon: "🗿" },
    { id: "theme-neon", name: "Neon", icon: "⚡" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <FontAwesomeIcon icon={faGear} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={20}>
        <DropdownMenuLabel className="text-xl font-bold">
          Sound
        </DropdownMenuLabel>
        <DropdownMenuItem>
          <MusicPlayer />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xl font-bold">
          Grid Theme
        </DropdownMenuLabel>
        <div className="p-1 flex gap-2">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              variant={themeTemplate === theme.id ? "default" : "outline"}
              size="sm"
              onClick={() => setThemeTemplate(theme.id)}
              className="flex-1"
            >
              <span className="mr-1">{theme.icon}</span>
              {theme.name}
            </Button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xl font-bold">
          Account
        </DropdownMenuLabel>
        {ACCOUNT_CONNECTOR === "controller" && (
          <>
            <div className="p-1 flex flex-col gap-2">
              <AccountDetails />
            </div>
          </>
        )}
        {ACCOUNT_CONNECTOR === "burner" && (
          <>
            <Button variant={"destructive"}>
              {" "}
              !!!! Burner have been removed !!!!
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropDown;
