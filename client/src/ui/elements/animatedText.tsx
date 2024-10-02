import { motion } from "framer-motion";
import "../../grid.css";
import { ComboMessages } from "@/enums/comboEnum";

interface AnimatedTextProps {
  textEnum: ComboMessages;
  reset: () => void;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ textEnum, reset }) => {
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
      <div className="text-4xl text-shine p-4">
        {textEnum != ComboMessages.None ? textEnum : ""}
      </div>
    </motion.div>
  );
};

export default AnimatedText;
