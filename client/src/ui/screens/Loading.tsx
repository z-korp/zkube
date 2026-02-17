import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { resolveImageAssetUrl } from "@/pixi/assets/resolver";
import { AssetId } from "@/pixi/assets/catalog";
import type { ThemeId } from "@/pixi/utils/colors";

export const Loading = () => {
  const { themeTemplate } = useTheme();
  const themeId = themeTemplate as ThemeId;
  const bgUrl = resolveImageAssetUrl(themeId, AssetId.Background);
  const logoUrl = resolveImageAssetUrl(themeId, AssetId.Logo);

  return (
    <div className="h-screen-viewport flex flex-col w-full justify-center items-center relative">
      <div className="absolute inset-0 overflow-hidden z-10">
        <div
          className="absolute inset-0 bg-cover bg-center animate-zoom-in-out"
          style={{ backgroundImage: `url('${bgUrl}')` }}
        />
      </div>
      <div className="flex flex-col justify-center items-center w-full h-full z-30">
        <img
          src={logoUrl}
          alt="logo"
          className="h-32 md:h-40 animate-load"
        />
      </div>
    </div>
  );
};
