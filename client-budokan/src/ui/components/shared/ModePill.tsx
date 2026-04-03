import { motion } from "motion/react";

interface ModePillProps {
  selectedMode: number;
  onModeChange: (mode: number) => void;
}

const MODE_LABELS = ["Map Mode", "Endless"] as const;

const ModePill = ({ selectedMode, onModeChange }: ModePillProps) => {
  return (
    <div className="flex bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-full p-1 gap-1 relative shadow-lg shadow-black/20">
      {MODE_LABELS.map((label, index) => {
        const isSelected = selectedMode === index;
        return (
          <button
            key={label}
            onClick={() => onModeChange(index)}
            className={`relative flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors duration-200 z-10 font-sans ${
              isSelected
                ? "text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-0 bg-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModePill;
