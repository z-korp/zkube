import PasswordProtected from "../componentsDev/PasswordProtected";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useMediaQuery } from "react-responsive";
import BackGroundBoard from "../components/BackgroundBoard";
import DevBoard from "../componentsDev/DevBoard";

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
              <div className="relative w-full">
                <div className="flex flex-col items-center game-container">
                  <DevBoard
                    initialGrid={gridTest}
                    nextLine={nextRowTest}
                    score={10}
                    combo={4}
                    maxCombo={5}
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
