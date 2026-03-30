interface ModePillProps {
  selectedMode: number;
  onModeChange: (mode: number) => void;
}

const MODE_LABELS = ["Map Mode", "Endless"] as const;

const ModePill = ({ selectedMode, onModeChange }: ModePillProps) => {
  return (
    <div className="flex bg-white/5 rounded-full p-1 gap-1">
      {MODE_LABELS.map((label, index) => (
        <button
          key={label}
          onClick={() => onModeChange(index)}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedMode === index
              ? "bg-white/15 text-white shadow-sm"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default ModePill;
