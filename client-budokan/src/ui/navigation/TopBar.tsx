import { BookOpen, ScrollText, Trophy, Settings2, User } from "lucide-react";
import CubeIcon from "@/ui/components/CubeIcon";

interface TopBarProps {
  cubeBalance: bigint;
  onTutorial: () => void;
  onQuests: () => void;
  onTrophies: () => void;
  onSettings: () => void;
  onProfile: () => void;
  username?: string;
  claimableQuestCount?: number;
}

const TopBar: React.FC<TopBarProps> = ({
  cubeBalance,
  onTutorial,
  onQuests,
  onTrophies,
  onSettings,
  onProfile,
  username,
  claimableQuestCount,
}) => {
  return (
    <div className="flex items-center justify-between px-3 md:px-4 h-12 md:h-13 lg:h-14 bg-slate-900/90 backdrop-blur-sm border-b border-white/10">
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
        <BarIconButton icon={<Settings2 size={18} />} onClick={onSettings} />
        <BarIconButton icon={<BookOpen size={18} />} onClick={onTutorial} />
        <BarIconButton icon={<Trophy size={18} />} onClick={onTrophies} />
        <BarIconButton
          icon={<ScrollText size={18} />}
          onClick={onQuests}
          badge={claimableQuestCount}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <CubeIcon />
        <span className="font-['Fredericka_the_Great'] text-yellow-400 text-lg tracking-wide">
          {cubeBalance.toString()}
        </span>
      </div>
    </div>
  );
};

const BarIconButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
}> = ({ icon, onClick, badge }) => (
  <button
    onClick={onClick}
    className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
  >
    {icon}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 shadow-md">
        {badge}
      </span>
    )}
  </button>
);

export default TopBar;
