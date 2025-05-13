import { Header } from "@/ui/containers/Header";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { useMediaQuery } from "react-responsive";
import useViewport from "@/hooks/useViewport";
import HeaderBalance from "../components/HeaderBalance";
import { PlayFreeGame } from "../actions/PlayFreeGame";

export const Home = () => {
  useViewport();

  const [animationDone, setAnimationDone] = useState(false);

  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Define render functions
  const renderDesktopView = () => (
    <>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-8 items-center justify-center">
        <PlayFreeGame />
      </div>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-8 items-start justify-center">
        <Button
          variant="default"
          onClick={() => console.log("Play")}
          className="w-[150px]"
        >
          My Games
        </Button>
      </div>
    </>
  );

  const renderMobileView = () => (
    <div className="flex flex-col w-full gap-4 px-4 mt-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-primary text-white text-lg py-6 border-4 shadow-lg bg-sky-900 font-sans rounded-none"
            variant="brutal"
          >
            Play !
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95%]  flex flex-col justify-center p-8">
          <DialogHeader className="flex flex-row gap-3 items-center justify-center w-full space-y-0">
            <HeaderBalance />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
      <Header onStartTutorial={() => console.log("Start Tutorial")} />

      {/* Content Area */}
      <div className="flex flex-col flex-1 relative">
        {/* Main Content */}
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
            <div className="relative flex flex-col gap-4 sm:gap-8 flex-grow items-center justify-start overflow-auto h-full">
              {isMdOrLarger ? renderDesktopView() : renderMobileView()}
            </div>
            <AnimatePresence>
              {!animationDone && (
                <>
                  <PalmTree
                    image={imgAssets.palmRight}
                    initial="visibleRight"
                    animate="hiddenRight"
                    duration={3}
                    position="right"
                  />
                  <PalmTree
                    image={imgAssets.palmLeft}
                    initial="visibleLeft"
                    animate="hiddenLeft"
                    duration={3}
                    position="left"
                  />
                </>
              )}
            </AnimatePresence>
          </BackGroundBoard>
        </BackGroundBoard>
      </div>
    </div>
  );
};
