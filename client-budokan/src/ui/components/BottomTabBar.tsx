import { useNavigationStore } from "@/stores/navigationStore";
import type { TabId } from "@/stores/navigationStore";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors, type ThemeId } from "@/config/themes";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "home", icon: "⬡", label: "Home" },
  { id: "mygames", icon: "◈", label: "Games" },
  { id: "profile", icon: "◉", label: "Profile" },
  { id: "ranks", icon: "◆", label: "Ranks" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

const BottomTabBar: React.FC = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate as ThemeId);

  return (
    <nav
      className="relative z-50 border-t bg-black/60 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      style={{ borderColor: colors.border }}
    >
      <div className="flex h-16 items-stretch md:h-14">
        {TABS.map(({ id, label, icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`relative flex flex-1 items-center justify-center transition-all ${
                active ? "" : "opacity-50 hover:opacity-75"
              }`}
            >
              {active && (
                <span
                  className="absolute -top-0.5 h-0.5 w-10 rounded-full"
                  style={{
                    backgroundColor: colors.accent,
                    boxShadow: `0 0 8px ${colors.accent}`,
                  }}
                />
              )}
              <div
                className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl transition-all ${
                  active ? "" : ""
                }`}
                style={active ? { boxShadow: colors.glow } : undefined}
              >
                <span
                  className="text-xl leading-none transition-all"
                  style={{ color: active ? colors.accent : colors.textMuted }}
                >
                  {icon}
                </span>
                <span
                  className="text-[9px] font-bold leading-none tracking-wider uppercase"
                  style={{ color: active ? colors.accent : colors.textMuted }}
                >
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
