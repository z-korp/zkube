import { AnimatePresence, motion } from "motion/react";
import { FULLSCREEN_PAGES, useNavigationStore } from "@/stores/navigationStore";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import BottomNav from "@/ui/navigation/BottomNav";

interface PageNavigatorProps {
  children: React.ReactNode;
}

const TRANSITION_DURATION = 0.25;
const EASE_OUT_CUBIC: [number, number, number, number] = [0.32, 0.72, 0, 1];
const SLIDE_TRANSITION = { duration: TRANSITION_DURATION, ease: EASE_OUT_CUBIC };

const PageNavigator: React.FC<PageNavigatorProps> = ({ children }) => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const transitionDirection = useNavigationStore((s) => s.transitionDirection);

  const isBack = transitionDirection === "back";
  const isFullscreenPage = FULLSCREEN_PAGES.has(currentPage);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#02050d]">
      <ThemeBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),rgba(0,0,0,0.2)_45%,rgba(0,0,0,0.65)_100%)]" />
      <div className="relative flex h-full w-full items-center justify-center p-0 md:p-5">
        <div className="relative h-full min-h-0 w-full overflow-hidden md:max-w-[min(90vw,55vh,680px)] md:rounded-[34px] md:border md:border-white/[0.16] md:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: isBack ? "-30%" : "30%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isBack ? "30%" : "-30%" }}
              transition={SLIDE_TRANSITION}
              className={`absolute inset-0 h-full min-h-0 overflow-x-hidden ${isFullscreenPage ? "overflow-hidden" : "overflow-y-auto"}`}
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default PageNavigator;
