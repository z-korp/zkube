import ImageAssets from "./ImageAssets";

const ImageBlock = (theme: string) => {
  const imgAssets = ImageAssets(theme);
  return {
    1: imgAssets.stone1,
    2: imgAssets.stone2,
    3: imgAssets.stone3,
    4: imgAssets.stone4,
  };
};

export default ImageBlock;
