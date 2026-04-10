import { motion } from "motion/react";
import "../../grid.css";
import { ComboMessages } from "@/enums/comboEnum";

interface AnimatedTextProps {
  textEnum: string;
  reset: () => void;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ textEnum, reset }) => {
  if (textEnum === ComboMessages.None || textEnum === "None") return null;

  return (
    <motion.div
      key={textEnum}
      animate={{
        scale: [1, 2, 2, 1, 1, 2, 2, 0, 0, 0, 0],
        rotate: [0, 0, 270, 270, 0, 0, 0, 0, 0, 0, 0],
      }}
      transition={{
        ease: "easeInOut",
        duration: 3,
      }}
      onAnimationComplete={reset}
    >
      <span className="text-4xl text-shine p-4 font-display font-black">{textEnum}</span>
    </motion.div>
  );
};

export default AnimatedText;
