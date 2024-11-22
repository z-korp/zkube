import { Alert, AlertDescription, AlertTitle } from "@/ui/elements/alert";
import { motion } from "framer-motion";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import getElementStyle from "../theme/GetElementStyle";

const generateAchievementMessage = (
  type: "score" | "combo" | "level",
  threshold: number,
) => {
  switch (type) {
    case "score":
      return getScoreAchievementMessage(threshold);
    case "combo":
      return getComboAchievementMessage(threshold);
    case "level":
      return `Congratulations  ! You've reached level ${threshold}  !`;
    default:
      return `Achievement unlocked  ! You've reached ${threshold}  !`;
  }
};

const getScoreAchievementMessage = (threshold: number) => {
  switch (threshold) {
    case 100:
      return "Huzzah ! You've surpassed the 100 points milestone, a triumph most worthy !";
    case 200:
      return "Splendid ! You've broken the 200 points barrier, a noble feat indeed !";
    case 300:
      return "Impressive ! You've reached the 300 points landmark, a mark of true prowess !";
    case 400:
      return "Marvelous ! You've crossed the 400 points threshold, a testament to your skill !";
    case 500:
      return "Incredible ! You've smashed through the 500 points level, a heroic accomplishment !";
    default:
      return `Amazing ! You've reached ${threshold} points, a valorous achievement !`;
  }
};

const getComboAchievementMessage = (threshold: number) => {
  switch (threshold) {
    case 10:
      return "Combo Lord ! You've attained the 10-hit combo step, a feat of valor !";
    case 20:
      return "Unstoppable ! You've conquered the 20-hit combo step, a mighty blow indeed !";
    case 30:
      return "Legendary ! You've reached the 30-hit combo step, a streak most glorious !";
    case 40:
      return "Unbelievable ! You've crossed the 40-hit combo step, a deed of legend !";
    case 50:
      return "Phenomenal ! You've shattered the 50-hit combo step, a conquest most epic !";
    default:
      return `You're on fire ! ${threshold}-hit combo step achieved with unmatched bravery !`;
  }
};

export const AchievementAlert: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  step: number;
  type: "score" | "combo" | "level";
}> = ({ value, icon, step, type }) => {
  const { themeTemplate } = useTheme();
  const backgroundStyle = getElementStyle("stone3", themeTemplate);

  const threshold = type === "level" ? value : Math.floor(value / step) * step;
  const achievementMessage = generateAchievementMessage(type, threshold);

  return (
    <Alert className="bg-black">
      <motion.div
        initial={{ scale: 0.2, rotate: 0 }}
        animate={{
          scale: [0.2, 2, 1],
          rotate: [0, 15, -15, 15, -15, 0],
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ display: "inline-block" }}
      >
        {icon}
      </motion.div>
      <AlertTitle className="drop-shadow-lg text-white">
        Achievement Unlocked !
      </AlertTitle>
      <AlertDescription className="text-white">
        {achievementMessage}
      </AlertDescription>
    </Alert>
  );
};
