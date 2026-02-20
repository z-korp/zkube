import { BookOpen, ScrollText, Trophy, Settings2, User } from "lucide-react";

interface TopBarProps {
  cubeBalance: bigint;
  onTutorial: () => void;
  onQuests: () => void;
  onTrophies: () => void;
  onSettings: () => void;
  onProfile: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  cubeBalance,
  onTutorial,
  onQuests,
  onTrophies,
  onSettings,
  onProfile,
}) => {
  return (
    <div className="flex items-center justify-between px-3 md:px-4 h-12 md:h-13 lg:h-14 bg-slate-900/70 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center gap-1">
        <BarIconButton icon={<User size={18} />} onClick={onProfile} />
        <BarIconButton icon={<Settings2 size={18} />} onClick={onSettings} />
        <BarIconButton icon={<BookOpen size={18} />} onClick={onTutorial} />
        <BarIconButton icon={<Trophy size={18} />} onClick={onTrophies} />
        <BarIconButton icon={<ScrollText size={18} />} onClick={onQuests} />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-lg">🧊</span>
        <span className="font-['Tilt_Prism'] text-yellow-400 text-lg tracking-wide">
          {cubeBalance.toString()}
        </span>
      </div>
    </div>
  );
};

const BarIconButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
  >
    {icon}
  </button>
);

export default TopBar;
