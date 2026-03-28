import { BookOpen, Trophy, Settings2, User } from "lucide-react";

interface TopBarProps {
  onTutorial: () => void;
  onTrophies: () => void;
  onSettings: () => void;
  onProfile: () => void;
  username?: string;
}

const TopBar: React.FC<TopBarProps> = ({
  onTutorial,
  onTrophies,
  onSettings,
  onProfile,
  username,
}) => {
  return (
    <div className="flex items-center justify-between px-3 md:px-4 h-12 md:h-13 lg:h-14 bg-slate-900/70 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center gap-1">
        <button
          onClick={onProfile}
          className="flex items-center gap-1.5 h-9 px-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <User size={18} />
          {username && (
            <span className="text-sm font-medium max-w-[100px] truncate">
              {username}
            </span>
          )}
        </button>
        <BarIconButton
          icon={<Settings2 size={18} />}
          label="Settings"
          onClick={onSettings}
        />
        <BarIconButton
          icon={<BookOpen size={18} />}
          label="Tutorial"
          onClick={onTutorial}
        />
        <BarIconButton
          icon={<Trophy size={18} />}
          label="Trophies"
          onClick={onTrophies}
        />
      </div>
    </div>
  );
};

const BarIconButton: React.FC<{
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    className="relative flex items-center gap-1.5 h-9 px-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
  >
    {icon}
    {label && <span className="hidden lg:inline text-sm font-medium">{label}</span>}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 shadow-md">
        {badge}
      </span>
    )}
  </button>
);

export default TopBar;
