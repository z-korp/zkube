import { motion } from "motion/react";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";

export const Loading = () => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#02050d]">
      <ThemeBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),rgba(0,0,0,0.2)_45%,rgba(0,0,0,0.65)_100%)]" />
      <div className="relative flex h-full w-full items-center justify-center p-0 md:p-5">
        <div className="relative flex h-full min-h-0 w-full flex-col items-center overflow-hidden md:max-w-[min(90vw,55vh,680px)] md:rounded-[34px] md:border md:border-white/[0.16] md:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
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
      </div>
    </div>
  );
};
