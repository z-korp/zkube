import { Home, Gamepad2, User, Trophy, Settings } from "lucide-react";
import { useNavigationStore, FULLSCREEN_PAGES } from "@/stores/navigationStore";
import type { PageId } from "@/stores/navigationStore";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors } from "@/config/themes";

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
    { id: "profile", icon: User, label: "Profile" },
    { id: "ranks", icon: Trophy, label: "Leaderboard" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-white/[0.08] bg-black/60 px-2 backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive = currentPage === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors"
            style={{ color: isActive ? colors.accent : "rgba(255, 255, 255, 0.4)" }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide font-sans">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
