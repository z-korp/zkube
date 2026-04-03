import { AnimatePresence, motion } from "motion/react";
import { useNavigationStore } from "@/stores/navigationStore";
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="relative w-full h-full max-w-[430px] overflow-hidden">
        <ThemeBackground />
        <AnimatePresence initial={false}>
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: isBack ? "-30%" : "30%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isBack ? "30%" : "-30%" }}
            transition={SLIDE_TRANSITION}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <BottomNav />
      </div>
    </div>
  );
};

export default PageNavigator;
