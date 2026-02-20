import { motion } from "motion/react";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

export const Loading = () => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <div className="h-screen-viewport flex flex-col w-full items-center relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div
          className="absolute inset-0 bg-cover bg-center animate-zoom-in-out"
          style={{ backgroundImage: `url('${imgAssets.loadingBackground}')` }}
        />
      </div>
      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 z-30">
        <motion.img
          src={imgAssets.logo}
          alt="logo"
          draggable={false}
          className="w-48 md:w-64 lg:w-80 max-w-[340px] drop-shadow-2xl"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
};
