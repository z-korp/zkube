import { Moon, Sun } from "lucide-react";

import { Button } from "@/ui/elements/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/elements/dropdown-menu";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMediaQuery } from "react-responsive";

export function ModeToggle() {
  const { setTheme } = useTheme();

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  return isMdOrLarger ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={20}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="flex gap-2 w-full">
      <Button
        className="flex-grow"
        variant="outline"
        onClick={() => setTheme("light")}
      >
        Light
      </Button>
      <Button
        className="flex-grow"
        variant="outline"
        onClick={() => setTheme("dark")}
      >
        Dark
      </Button>
      <Button
        className="flex-grow"
        variant="outline"
        onClick={() => setTheme("system")}
      >
        System
      </Button>
    </div>
  );
}
