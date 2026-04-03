import { ChevronLeft } from "lucide-react";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import useAccountCustom from "@/hooks/useAccountCustom";

interface PageTopBarProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
}

const PageTopBar: React.FC<PageTopBarProps> = ({
  title,
  subtitle,
  onBack,
  rightSlot,
}) => {
  const { account } = useAccountCustom();
  const { balance: zStarBalance } = useZStarBalance(account?.address);

  return (
    <div className="flex items-center justify-between px-2 md:px-4 h-12 md:h-13 lg:h-14 bg-black/40 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="flex items-center gap-1">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex flex-col text-left hover:opacity-80 transition-opacity"
        >
          <span className="font-display text-white text-base md:text-lg leading-tight">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-400 leading-tight">
              {subtitle}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {rightSlot}
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-lg">★</span>
          <span className="font-display text-yellow-400 text-lg tracking-wide">
            {zStarBalance.toString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageTopBar;
