import { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";

interface BackgroundImageProps {
  children: ReactNode;
  imageBackground: string;
  animate?: MotionProps["animate"];
  initial?: MotionProps["initial"];
  transition?: MotionProps["transition"];
}

const BackgroundBoard: React.FC<BackgroundImageProps> = ({
  children,
  imageBackground,
  animate,
  initial,
  transition,
}) => {
  return (
    <div className="relative w-full grow h-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBackground})` }}
        initial={initial || {}}
        animate={animate || {}}
        transition={transition || {}}
      />
      {children}
    </div>
  );
};

export default BackgroundBoard;
