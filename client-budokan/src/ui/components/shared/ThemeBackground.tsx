import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

const ThemeBackground: React.FC = () => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <>
      <div className="fixed inset-0 -z-20">
        <img
          key={themeTemplate}
          src={imgAssets.imageBackground}
          alt=""
          className="w-full h-full object-cover"
          data-theme={themeTemplate}
          draggable={false}
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,8,18,0.4)_0%,rgba(4,8,18,0.28)_42%,rgba(4,8,18,0.78)_100%)] backdrop-blur-[0.5px]" />
    </>
  );
};

export default ThemeBackground;
