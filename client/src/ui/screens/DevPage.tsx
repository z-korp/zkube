import PasswordProtected from "../componentsDev/PasswordProtected";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useMediaQuery } from "react-responsive";
import BackGroundBoard from "../components/BackgroundBoard";
import DevBoard from "../componentsDev/DevBoard";
import { Avatar, AvatarFallback, AvatarImage } from "../elements/ui/avatar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoltLightning,
  faHeart,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import useBossStore from "@/stores/bossStore";
import { useEffect } from "react";

interface DevPageProps {
  onSkip: () => void;
}

interface BossStore {
  bossLifePoint: number;
  bossStamina: number;
  bossShield: number;
}

const DevPage = ({ onSkip }: DevPageProps) => {
  const { theme, themeTemplate } = useTheme();

  const { bossLifePoint, bossStamina, bossShield } =
    useBossStore() as BossStore;

  const imgAssets = ImageAssets(themeTemplate);
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

  const gridTest = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 3, 3, 3, 3, 3, 3],
    [4, 4, 4, 4, 0, 3, 3, 3],
    [2, 2, 0, 3, 3, 3, 2, 2],
    [4, 4, 4, 4, 2, 2, 0, 1],
  ];

  const nextRowTest = [0, 1, 1, 1, 1, 1, 1, 1];

  return (
    <PasswordProtected onSkip={onSkip}>
      <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
        <div className="flex flex-col flex-1 relative">
          <BackGroundBoard imageBackground={imgAssets.imageBackground}>
            <BackGroundBoard
              imageBackground={imageTotemTheme}
              initial={{ scale: 1 }}
              animate={isMdOrLarger ? { scale: [1, 0.995, 1] } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <div className="relative w-full mt-2">
                <div className="flex flex-col items-center game-container mb-2">
                  <div className="rounded-xl border text-card-foreground shadow relative p-3 md:pt-4 bg-secondary false pb-2 md:pb-3">
                    <div
                      className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-2 md:mb-3 flex justify-between gap-2 bg-secondary p-1 rounded-lg`}
                    >
                      <div className="w-full flex items-center border border-2 border-white rounded-lg p-1">
                        Hello
                      </div>
                      <div className="bg-secondary w-full flex flex-col items-center justify-center gap-2 text-xl">
                        <div className="flex items-center justify-end gap-2 w-full">
                          <span> {bossLifePoint}/100</span>
                          <FontAwesomeIcon icon={faHeart} color="red" />
                        </div>
                        <div className="flex items-center justify-end gap-2 w-full">
                          {bossShield}{" "}
                          <FontAwesomeIcon icon={faShield} color="blue" />
                        </div>
                        <div className="flex items-center justify-end gap-2 w-full">
                          <span> {bossStamina}/10</span>
                          <FontAwesomeIcon
                            icon={faBoltLightning}
                            color="gold"
                          />
                        </div>
                      </div>
                      <div className="justify-center items-center">
                        <Avatar>
                          <AvatarImage src="https://github.com/shadcn.png" />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center game-container">
                  <DevBoard
                    initialGrid={gridTest}
                    nextLine={nextRowTest}
                    score={0}
                    combo={0}
                    maxCombo={0}
                    hammerCount={1}
                    totemCount={1}
                    waveCount={1}
                  />
                </div>
              </div>
            </BackGroundBoard>
          </BackGroundBoard>
        </div>
      </div>
    </PasswordProtected>
  );
};

export default DevPage;