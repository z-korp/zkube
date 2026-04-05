import { motion } from "motion/react";

interface ModePillProps {
  selectedMode: number;
  onModeChange: (mode: number) => void;
}

const MODE_LABELS = ["Map Mode", "Endless"] as const;

const ModePill = ({ selectedMode, onModeChange }: ModePillProps) => {
  return (
    <div className="relative flex gap-1 rounded-full border border-white/[0.12] bg-black/40 p-1 backdrop-blur-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
      {MODE_LABELS.map((label, index) => {
        const isSelected = selectedMode === index;
        return (
          <button
            key={label}
            onClick={() => onModeChange(index)}
            className={`relative z-10 flex-1 whitespace-nowrap rounded-full px-3 py-1.5 font-sans text-[12px] font-bold uppercase tracking-wide transition-colors duration-200 ${
              isSelected
                ? "text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-0 bg-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/[0.08]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20 whitespace-nowrap drop-shadow-sm">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModePill;
