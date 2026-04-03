import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

const ThemeBackground: React.FC = () => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <>
      <div className="fixed inset-0 -z-20">
        <img
          src={imgAssets.imageBackground}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/50 backdrop-blur-[2px]" />
    </>
  );
};

export default ThemeBackground;
