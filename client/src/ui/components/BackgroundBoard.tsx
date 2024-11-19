import { motion, MotionProps } from "framer-motion";

interface BackgroundImageProps {
  imageBackground: string;
  animate?: MotionProps["animate"];
  initial?: MotionProps["initial"];
  transition?: MotionProps["transition"];
}

const BackgroundBoard: React.FC<BackgroundImageProps> = ({
  imageBackground,
  animate,
  initial,
  transition,
}) => {
  return (
    <motion.div
      className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${imageBackground})` }}
      initial={initial || {}}
      animate={animate || {}}
      transition={transition || {}}
    />
  );
};

export default BackgroundBoard;
