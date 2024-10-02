import { motion } from "framer-motion";
import "../../grid.css";

interface AnimatedTextProps {
  text: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text }) => {
  return (
    <motion.div
      animate={{
        scale: [1, 2, 2, 1, 1, 2, 2],
        rotate: [0, 0, 270, 270, 0],
        borderRadius: ["20%", "20%", "50%", "50%", "20%"],
      }}
      transition={{
        ease: "easeInOut",
        duration: 1.5,
      }}
    >
      <div className="text-4xl text-shine p-4">{text}</div>
    </motion.div>
  );
};

export default AnimatedText;
