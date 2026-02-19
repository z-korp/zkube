import {
  THEME_IDS,
  THEME_META,
  getThemeColors,
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
  const meta = THEME_META[safeThemeId];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 22% 88%, ${theme.blocks[1].glow}40 0%, transparent 38%), radial-gradient(circle at 78% 12%, ${theme.blocks[3].glow}3a 0%, transparent 34%), linear-gradient(180deg, ${theme.backgroundGradientStart} 0%, ${theme.backgroundGradientEnd} 100%)`,
      }}
    >
      <div
        className="absolute left-[11%] top-[76%] h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: `${theme.blocks[2].glow}44` }}
      />
      <div
        className="absolute left-[68%] top-[20%] h-48 w-48 rounded-full blur-3xl"
        style={{ backgroundColor: `${theme.blocks[4].glow}40` }}
      />
      <div
        className="absolute left-[42%] top-[44%] h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: `${theme.accent}34` }}
      />

      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            "linear-gradient(108deg, rgba(255,255,255,0.1) 14%, transparent 14%, transparent 50%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.07) 64%, transparent 64%, transparent), linear-gradient(0deg, rgba(255,255,255,0.1) 0%, transparent 32%)",
          backgroundSize: "260px 260px, 100% 100%",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${theme.background}5c 84%, ${theme.background}b8 100%)`,
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
