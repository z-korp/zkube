import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors, type ThemeId } from "@/config/themes";
import PatternOverlay from "./PatternOverlay";

const ThemeBackground: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate as ThemeId);

  return (
    <>
      <div className="fixed inset-0 -z-20" style={{ background: colors.bgGradient }} />
      <PatternOverlay themeId={themeTemplate as ThemeId} />
    </>
  );
};

export default ThemeBackground;
