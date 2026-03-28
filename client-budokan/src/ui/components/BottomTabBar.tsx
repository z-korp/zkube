import { Home, Map, Trophy, Settings } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import type { TabId } from "@/stores/navigationStore";

const TABS: { id: TabId; label: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "map", label: "Map", Icon: Map },
  { id: "ranks", label: "Ranks", Icon: Trophy },
  { id: "settings", label: "Settings", Icon: Settings },
];

const BottomTabBar: React.FC = () => {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:h-14">
      {TABS.map(({ id, label, Icon }) => {
        const active = currentPage === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => navigate(id)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
              active ? "text-cyan-400" : "text-slate-500"
            }`}
          >
            {active && (
              <span className="absolute top-1 h-1 w-4 rounded-full bg-cyan-400" />
            )}
            <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
            <span className="text-[10px] font-medium leading-none">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
