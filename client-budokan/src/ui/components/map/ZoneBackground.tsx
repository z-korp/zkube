import {
  THEME_IDS,
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

export const ZoneBackground: React.FC<ZoneBackgroundProps> = ({ themeId }) => {
  const safeThemeId = toThemeId(themeId);
  const theme = getThemeColors(safeThemeId);
  const images = getThemeImages(safeThemeId);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: theme.background }}
    >
      <img
        src={images.mapBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        loading="eager"
      />

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 22% 88%, ${theme.blocks[1].glow}30 0%, transparent 38%), radial-gradient(circle at 78% 12%, ${theme.blocks[3].glow}28 0%, transparent 34%)`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(130% 95% at 50% 50%, transparent 38%, ${theme.background}cc 100%), linear-gradient(180deg, ${theme.background}cc 0%, ${theme.background}66 24%, ${theme.background}66 76%, ${theme.background}f0 100%)`,
        }}
      />

    </div>
  );
};

export default ZoneBackground;
