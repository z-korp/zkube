import { motion } from "motion/react";
import "../../grid.css";
import { ComboMessages } from "@/enums/comboEnum";

interface AnimatedTextProps {
  textEnum: string;
  pointsEarned?: number;
  reset: () => void;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  textEnum,
  pointsEarned,
  reset,
}) => {
  if (textEnum === ComboMessages.None || textEnum === "None") return null;

  return (
    <motion.div
      key={textEnum + "-" + pointsEarned}
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
      <div className="text-4xl text-shine p-4 flex flex-col items-center gap-1">
        <span>{textEnum}</span>
        {!!pointsEarned && (
          <div className="text-lg flex items-center gap-2">
            <span className="text-blue-300">+{pointsEarned} pts</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnimatedText;
