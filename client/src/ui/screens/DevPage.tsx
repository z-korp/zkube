import PasswordProtected from "../componentsDev/PasswordProtected";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useMediaQuery } from "react-responsive";
import BackGroundBoard from "../components/BackgroundBoard";
import DevBoard from "../componentsDev/DevBoard";
import { Avatar, AvatarFallback, AvatarImage } from "../elements/ui/avatar";

interface DevPageProps {
  onSkip: () => void;
}

const DevPage = ({ onSkip }: DevPageProps) => {
  const { theme, themeTemplate } = useTheme();
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
                      className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-2 md:mb-3 flex justify-between  gap-2 bg-secondary p-3 rounded-lg`}
                    >
                      <div className="bg-secondary w-full"> Hello</div>
                      <div className="bg-secondary w-full"> Cool</div>
                      <div className="justify-self-end items-center">
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
