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
      initial={{ scale: 0, rotate: -20, opacity: 0 }}
      animate={{
        scale: [0, 1.4, 1.1, 1.1, 1.2, 0],
        rotate: [-20, 8, -3, 0, 5, 15],
        opacity: [0, 1, 1, 1, 1, 0],
      }}
      transition={{
        duration: 4.2,
        times: [0, 0.08, 0.16, 0.78, 0.9, 1],
        ease: [0.22, 1.2, 0.36, 1], // custom spring-like bezier
      }}
      onAnimationComplete={reset}
    >
      <motion.span
        className="inline-block text-5xl text-shine p-4 font-display font-black"
        animate={{ y: [0, -6, 0, -3, 0] }}
        transition={{ duration: 4.2, times: [0, 0.1, 0.3, 0.5, 0.75], ease: "easeInOut" }}
      >
        {textEnum}
      </motion.span>
    </motion.div>
  );
};

export default AnimatedText;
