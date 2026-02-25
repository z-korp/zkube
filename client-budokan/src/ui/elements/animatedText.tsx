import { motion } from "motion/react";
import "../../grid.css";
import { ComboMessages } from "@/enums/comboEnum";
import CubeIcon from "@/ui/components/CubeIcon";

interface AnimatedTextProps {
  textEnum: string;
  pointsEarned?: number;
  cubesEarned?: number;
  reset: () => void;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  textEnum,
  pointsEarned,
  cubesEarned,
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
        {(!!pointsEarned || !!cubesEarned) && (
          <div className="text-lg flex items-center gap-2">
            {!!pointsEarned && (
              <span className="text-blue-300">+{pointsEarned} pts</span>
            )}
            {!!cubesEarned && (
              <span className="text-yellow-300 inline-flex items-center gap-1">+{cubesEarned} <CubeIcon size="sm" /></span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnimatedText;
