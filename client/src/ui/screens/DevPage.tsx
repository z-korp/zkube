import PasswordProtected from "../componentsDev/PasswordProtected";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useMediaQuery } from "react-responsive";
import BackGroundBoard from "../components/BackgroundBoard";

interface DevPageProps {
  onSkip: () => void;
}

const DevPage = ({ onSkip }: DevPageProps) => {
  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

  return (
    <PasswordProtected onSkip={onSkip}>
      <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
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
            <div></div>
          </BackGroundBoard>
        </BackGroundBoard>
      </div>
    </PasswordProtected>
  );
};

export default DevPage;
