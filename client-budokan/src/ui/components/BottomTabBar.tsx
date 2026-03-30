import { Home, Gamepad2, Trophy, Settings, type LucideIcon } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import type { TabId } from "@/stores/navigationStore";

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "map", label: "Play", Icon: Gamepad2 },
  { id: "ranks", label: "Ranks", Icon: Trophy },
  { id: "settings", label: "Settings", Icon: Settings },
];

const BottomTabBar: React.FC = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <nav
      className="relative z-50 border-t border-white/10 bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <div className="flex h-16 items-stretch md:h-14">
        {TABS.map(({ id, label, Icon }) => {
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
                <span className="absolute -top-0.5 h-0.5 w-10 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              )}
              <div
                className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl transition-all ${
                  active ? "shadow-[0_0_16px_rgba(52,211,153,0.35)]" : ""
                }`}
              >
                <Icon
                  size={22}
                  className={`transition-all ${
                    active
                      ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "text-slate-400"
                  }`}
                />
                <span
                  className={`text-[9px] font-bold leading-none tracking-wider uppercase ${
                    active ? "text-emerald-300" : "text-slate-400"
                  }`}
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
