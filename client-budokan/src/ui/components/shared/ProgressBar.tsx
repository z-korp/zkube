interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  height?: number;
  glow?: boolean;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color,
  height = 6,
  glow = false,
  showLabel = false,
}) => {
  const ratio = max <= 0 ? 0 : Math.min((value / max) * 100, 100);

  return (
    <div className="relative">
      <div
        style={{
          width: "100%",
          height,
          borderRadius: height / 2,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${ratio}%`,
            height: "100%",
            borderRadius: height / 2,
            background: `linear-gradient(90deg, ${color}CC, ${color})`,
            boxShadow: glow ? `0 0 12px ${color}60` : "none",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      {showLabel && (
        <div
          className="font-display"
          style={{
            position: "absolute",
            right: 0,
            top: -14,
            fontSize: 9,
            color: `${color}CC`,
            fontWeight: 700,
          }}
        >
          {value}/{max}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
