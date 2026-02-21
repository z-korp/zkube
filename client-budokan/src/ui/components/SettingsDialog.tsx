import { useState } from "react";
import { Settings, Volume2, VolumeX, Copy, LogOut } from "lucide-react";
import { Button } from "../elements/button";
import { Slider } from "../elements/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../elements/dialog";
import { useMusicPlayer } from "@/contexts/hooks";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useDisconnect } from "@starknet-react/core";
import {
  THEME_IDS,
  THEME_META,
  getThemeImages,
  type ThemeId,
} from "@/config/themes";

const shortAddress = (address: string, size = 4) => {
  return `${address.slice(0, size)}...${address.slice(-size)}`;
};

export const SettingsDialog = () => {
  const {
    musicVolume,
    effectsVolume,
    setMusicVolume,
    setEffectsVolume,
    isPlaying,
    playTheme,
    stopTheme,
  } = useMusicPlayer();

  const { themeTemplate, setThemeTemplate } = useTheme();
  const { account } = useAccountCustom();
  const { username } = useControllerUsername();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (account?.address) {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleMusic = () => {
    if (isPlaying) {
      stopTheme();
    } else {
      playTheme();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Audio
            </h3>
            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleToggleMusic}
                >
                  {isPlaying ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Music</span>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={(value) => setMusicVolume(value[0])}
                    max={1}
                    step={0.05}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Effects</span>
                  <Slider
                    value={[effectsVolume]}
                    onValueChange={(value) => setEffectsVolume(value[0])}
                    max={1}
                    step={0.05}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                  {Math.round(effectsVolume * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Theme
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {THEME_IDS.map((id) => {
                const meta = THEME_META[id];
                const images = getThemeImages(id);
                const isActive = themeTemplate === id;

                return (
                  <button
                    key={id}
                    onClick={() => setThemeTemplate(id as ThemeId)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                      <img
                        src={images.themeIcon}
                        alt={meta.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] font-medium leading-tight text-center truncate w-full">
                      {meta.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {account?.address && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Account
              </h3>
              <div className="flex flex-col gap-2 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0 rounded-md bg-secondary px-3 py-1.5">
                    <span className="text-sm font-medium truncate">
                      {username}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {shortAddress(account.address)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopy}
                    title={copied ? "Copied!" : "Copy address"}
                  >
                    <Copy
                      className={`h-3.5 w-3.5 ${copied ? "text-green-500" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => disconnect()}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
