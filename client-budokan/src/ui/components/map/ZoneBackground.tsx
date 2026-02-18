import {
  THEME_IDS,
  THEME_META,
  getThemeColors,
  getThemeImages,
  type ThemeId,
} from "@/config/themes";

export interface ZoneBackgroundProps {
  zone: number;
  themeId: string;
}

const DEFAULT_THEME: ThemeId = "theme-1";

const toThemeId = (themeId: string): ThemeId => {
  if (THEME_IDS.includes(themeId as ThemeId)) {
    return themeId as ThemeId;
  }
  return DEFAULT_THEME;
};

export const ZoneBackground: React.FC<ZoneBackgroundProps> = ({ zone, themeId }) => {
  const safeThemeId = toThemeId(themeId);
  const theme = getThemeColors(safeThemeId);
  const themeImages = getThemeImages(safeThemeId);
  const meta = THEME_META[safeThemeId];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${theme.backgroundGradientStart} 0%, ${theme.backgroundGradientEnd} 100%)`,
      }}
    >
      <img
        src={themeImages.map}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 84%, rgba(255,255,255,0.16), transparent 34%), radial-gradient(circle at 82% 14%, rgba(255,255,255,0.12), transparent 30%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.12) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.08) 25%, transparent 25%)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/25 px-4 py-1 text-center backdrop-blur-sm">
        <p className="font-['Fredericka_the_Great'] text-sm text-white/85">
          Zone {zone} - {meta.name}
        </p>
      </div>
    </div>
  );
};

export default ZoneBackground;
