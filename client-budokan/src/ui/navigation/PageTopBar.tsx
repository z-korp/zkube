import { ChevronLeft } from "lucide-react";

interface PageTopBarProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  cubeBalance?: bigint;
}

const PageTopBar: React.FC<PageTopBarProps> = ({
  title,
  subtitle,
  onBack,
  cubeBalance,
}) => {
  return (
    <div className="flex items-center justify-between px-2 md:px-4 h-12 md:h-13 lg:h-14 bg-slate-900/70 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center gap-1">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex flex-col">
          <span className="font-['Fredericka_the_Great'] text-white text-base md:text-lg leading-tight">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-400 leading-tight">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {cubeBalance !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🧊</span>
          <span className="font-['Bangers'] text-yellow-400 text-lg tracking-wide">
            {cubeBalance.toString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default PageTopBar;
