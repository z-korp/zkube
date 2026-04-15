import { BookOpen, Infinity as InfinityIcon, Zap } from "lucide-react";
import { motion } from "motion/react";

interface ModePillProps {
  selectedMode: number;
  onModeChange: (mode: number) => void;
}

const MODE_LABELS = [
  { label: "Story", Icon: BookOpen },
  { label: "Endless", Icon: InfinityIcon },
] as const;

const ModePill = ({ selectedMode, onModeChange }: ModePillProps) => {
  return (
    <div className="relative flex gap-1 rounded-full border border-white/[0.12] bg-black/40 p-1 backdrop-blur-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
      {MODE_LABELS.map((mode, index) => {
        const isSelected = selectedMode === index;
        return (
          <button
            key={mode.label}
            onClick={() => onModeChange(index)}
            className={`relative z-10 flex-1 whitespace-nowrap rounded-full px-2 py-1.5 font-sans text-[12px] font-bold uppercase tracking-wide transition-colors duration-200 ${
              isSelected
                ? index === 1
                  ? "text-[#FFE0C1]"
                  : "text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-0 rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                style={{
                  background: index === 1 ? "linear-gradient(180deg, rgba(255,152,92,0.34), rgba(255,116,56,0.26))" : "rgba(255,255,255,0.2)",
                  borderColor: index === 1 ? "rgba(255,188,133,0.55)" : "rgba(255,255,255,0.08)",
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20 flex items-center justify-center gap-1.5 whitespace-nowrap drop-shadow-sm">
              <mode.Icon size={13} strokeWidth={2.5} />
              {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ModePill;
