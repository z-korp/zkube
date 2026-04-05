import { Home, Gamepad2, User, Trophy } from "lucide-react";
import { useNavigationStore, FULLSCREEN_PAGES } from "@/stores/navigationStore";
import type { PageId } from "@/stores/navigationStore";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors } from "@/config/themes";
import { motion } from "motion/react";

const BottomNav = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);

  if (FULLSCREEN_PAGES.has(currentPage)) {
    return null;
  }

  const tabs: { id: PageId; icon: React.ElementType; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "mygames", icon: Gamepad2, label: "Games" },
    { id: "ranks", icon: Trophy, label: "Ranks" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex h-16 w-[90%] max-w-[380px] items-center justify-around rounded-full border border-white/[0.12] bg-black/60 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive = currentPage === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors"
            style={{ color: isActive ? colors.accent : "rgba(255, 255, 255, 0.4)" }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide font-sans">
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute -top-3 left-1/2 -translate-x-1/2 h-1 w-8 rounded-b-full shadow-[0_4px_12px_rgba(255,255,255,0.5)]"
                style={{ backgroundColor: colors.accent, boxShadow: `0 2px 8px ${colors.accent}` }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
