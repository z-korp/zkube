import { AnimatePresence, motion } from "motion/react";
import { useNavigationStore } from "@/stores/navigationStore";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";

interface PageNavigatorProps {
  children: React.ReactNode;
}

const TRANSITION_DURATION = 0.15;
const EASE_OUT_CUBIC: [number, number, number, number] = [0.33, 1, 0.68, 1];

const PageNavigator: React.FC<PageNavigatorProps> = ({ children }) => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const transitionDirection = useNavigationStore((s) => s.transitionDirection);

  const isBack = transitionDirection === "back";

  return (
    <div className="fixed inset-0 overflow-hidden">
      <ThemeBackground />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentPage}
          initial={{ x: isBack ? "-100%" : "100%" }}
          animate={{ x: 0 }}
          exit={{ x: isBack ? "100%" : "-100%" }}
          transition={{ duration: TRANSITION_DURATION, ease: EASE_OUT_CUBIC }}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PageNavigator;
