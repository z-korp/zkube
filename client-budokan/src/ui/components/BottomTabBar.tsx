import { useNavigationStore } from "@/stores/navigationStore";
import type { TabId } from "@/stores/navigationStore";

const ICON_BASE = "/assets/common/icons";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: `${ICON_BASE}/icon-cube.png` },
  { id: "map", label: "Map", icon: `${ICON_BASE}/icon-level.png` },
  { id: "ranks", label: "Ranks", icon: `${ICON_BASE}/icon-trophy.png` },
  { id: "settings", label: "Settings", icon: `${ICON_BASE}/icon-settings.png` },
];

const BottomTabBar: React.FC = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <nav
      className="relative z-50 border-t border-white/10 bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
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
                <span className="absolute -top-0.5 h-0.5 w-10 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              )}
              <div
                className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl transition-all ${
                  active ? "shadow-[0_0_16px_rgba(52,211,153,0.35)]" : ""
                }`}
              >
                <img
                  src={icon}
                  alt={label}
                  className={`h-6 w-6 object-contain transition-all ${
                    active
                      ? "drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] brightness-110"
                      : "brightness-75 saturate-50"
                  }`}
                  draggable={false}
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
