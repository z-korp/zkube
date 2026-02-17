import ImageBlock from "@/ui/theme/ImageBlock";

const getElementStyle = (element: string, theme: string) => {
  const imgBlock = ImageBlock(theme);

  switch (element) {
    case "stone1":
      return {
        backgroundImage: `url(${imgBlock[1]})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone2":
      return {
        backgroundImage: `url(${imgBlock[2]})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone3":
      return {
        backgroundImage: `url(${imgBlock[3]})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone4":
      return {
        backgroundImage: `url(${imgBlock[4]})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    default:
      return {};
  }
};

export default getElementStyle;
