import useTemplateTheme from "@/hooks/useTemplateTheme";
import { Button } from "@/ui/elements/button";
import ImageAssets from "@/ui/theme/ImageAssets";

export const Loading = ({
  enter,
  setEnter,
}: {
  enter: boolean;
  setEnter: (state: boolean) => void;
}) => {
  //const { theme }: { theme: string } = useTheme() as { theme: string };
  const { themeTemplate } = useTemplateTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <div className="w-full h-screen flex justify-center items-center">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 animate-zoom-in-out"
          style={{ backgroundImage: `url('${imgAssets.background}')` }}
        />
      </div>

      {/* Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center w-full h-20">
        <img
          src={imgAssets.logo}
          alt="logo"
          className={`h-32 md:h-40  ${enter && "animate-load"}`}
        />
      </div>

      {/* Enter Button */}
      <div
        className={`absolute bottom-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center z-[2000] ${enter && "hidden"}`}
      >
        <Button
          onClick={() => setEnter(true)}
          className="text-2xl"
          variant="default"
        >
          Enter
        </Button>
      </div>
    </div>
  );
};
