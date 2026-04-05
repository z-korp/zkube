import { getThemeColors, type ThemeId } from "@/config/themes";

interface PatternOverlayProps {
  themeId: ThemeId;
}

const PatternOverlay: React.FC<PatternOverlayProps> = ({ themeId }) => {
  const colors = getThemeColors(themeId);
  const patternId = `pattern-${themeId}`;

  const getPattern = () => {
    switch (themeId) {
      case "theme-1":
        return {
          width: 40,
          height: 40,
          nodes: (
            <>
              <path d="M20 0 L40 20 L20 40 L0 20Z" fill="none" stroke={colors.accent} strokeWidth="0.5" />
              <circle cx="20" cy="20" r="3" fill="none" stroke={colors.accent} strokeWidth="0.5" />
            </>
          ),
        };
      case "theme-2":
      case "theme-8":
        return {
          width: 44,
          height: 38,
          nodes: (
            <>
              <path d="M22 0 L44 38 L0 38Z" fill="none" stroke={colors.accent} strokeWidth="0.45" />
              <path d="M0 0 L22 38 L44 0Z" fill="none" stroke={colors.accent} strokeWidth="0.35" />
            </>
          ),
        };
      case "theme-3":
        return {
          width: 52,
          height: 45,
          nodes: (
            <path d="M13 0 H39 L52 22.5 L39 45 H13 L0 22.5Z" fill="none" stroke={colors.accent} strokeWidth="0.45" />
          ),
        };
      case "theme-4":
      case "theme-6":
        return {
          width: 64,
          height: 44,
          nodes: (
            <>
              <path d="M0 22 Q16 6 32 22 T64 22" fill="none" stroke={colors.accent} strokeWidth="0.4" />
              <path d="M0 34 Q16 18 32 34 T64 34" fill="none" stroke={colors.accent} strokeWidth="0.3" />
            </>
          ),
        };
      case "theme-5":
        return {
          width: 60,
          height: 60,
          nodes: (
            <>
              <circle cx="30" cy="30" r="28" fill="none" stroke={colors.accent} strokeWidth="0.5" />
              <line x1="0" y1="30" x2="60" y2="30" stroke={colors.accent} strokeWidth="0.3" />
              <line x1="30" y1="0" x2="30" y2="60" stroke={colors.accent} strokeWidth="0.3" />
            </>
          ),
        };
      case "theme-7":
        return {
          width: 50,
          height: 50,
          nodes: (
            <>
              <path d="M0 25 Q12.5 0 25 25 Q37.5 50 50 25" fill="none" stroke={colors.accent} strokeWidth="0.5" />
              <circle cx="25" cy="25" r="2" fill={colors.accent} fillOpacity="0.35" />
              <circle cx="6" cy="40" r="1.5" fill={colors.accent} fillOpacity="0.25" />
            </>
          ),
        };
      case "theme-9":
        return {
          width: 54,
          height: 54,
          nodes: (
            <>
              <circle cx="27" cy="27" r="14" fill="none" stroke={colors.accent} strokeWidth="0.45" />
              <circle cx="27" cy="27" r="3" fill={colors.accent} fillOpacity="0.35" />
              <circle cx="8" cy="8" r="1.5" fill={colors.accent} fillOpacity="0.35" />
              <circle cx="46" cy="46" r="1.5" fill={colors.accent} fillOpacity="0.35" />
            </>
          ),
        };
      case "theme-10":
      default:
        return {
          width: 48,
          height: 48,
          nodes: (
            <>
              <path d="M24 0 L48 24 L24 48 L0 24Z" fill="none" stroke={colors.accent} strokeWidth="0.45" />
              <path d="M24 8 L40 24 L24 40 L8 24Z" fill="none" stroke={colors.accent} strokeWidth="0.35" />
            </>
          ),
        };
    }
  };

  const pattern = getPattern();

  return (
    <svg className="fixed inset-0 -z-10 pointer-events-none w-full h-full" style={{ opacity: 0.04 }}>
      <defs>
        <pattern id={patternId} width={pattern.width} height={pattern.height} patternUnits="userSpaceOnUse">
          {pattern.nodes}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

export default PatternOverlay;
