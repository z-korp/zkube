import { Button } from "@/ui/elements/button";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

export const Loading = () => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <div className="h-screen-viewport flex flex-col w-full justify-center items-center relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div
          className="absolute inset-0 bg-cover bg-center animate-zoom-in-out"
          style={{ backgroundImage: `url('${imgAssets.background}')` }}
        />
      </div>
      {/* Logo and Enter Button */}
      <div className="flex flex-col justify-center items-center w-full h-full z-30">
        <img
          src={imgAssets.logo}
          alt="logo"
          className={"h-32 md:h-40 animate-load"}
        />
      </div>
    </div>
  );
};
