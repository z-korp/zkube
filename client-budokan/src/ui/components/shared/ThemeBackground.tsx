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
          className="h-full w-full object-cover opacity-[0.82]"
          data-theme={themeTemplate}
          draggable={false}
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,8,18,0.78)_0%,rgba(4,8,18,0.62)_40%,rgba(4,8,18,0.92)_100%)]" />
    </>
  );
};

export default ThemeBackground;
