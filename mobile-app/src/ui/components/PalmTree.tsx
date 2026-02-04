import { motion } from "framer-motion";
import React from "react";

const palmVariants = {
  hiddenRight: { x: "34%" },
  hiddenLeft: { x: "-34%" },
  visibleLeft: { x: "100%" },
  visibleRight: { x: "-100%" },
};

interface PalmTreeProps {
  image: string;
  initial: string;
  animate: string;
  duration: number;
  position: string;
}

const PalmTree: React.FC<PalmTreeProps> = ({
  image,
  initial,
  animate,
  duration,
  position,
}) => {
  const classNamePos = position === "left" ? "-left-2/3" : "-right-2/3";

  return (
    <motion.div
      className={`absolute top-0 ${classNamePos} w-2/3 h-full bg-cover bg-center z-[1000]`}
      style={{ backgroundImage: `url(${image})` }}
      initial={initial}
      animate={animate}
      exit=""
      variants={palmVariants}
      transition={{ duration }}
    />
  );
};

export default PalmTree;
