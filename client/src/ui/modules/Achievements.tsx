import { Medal, Trophy, Star } from "lucide-react";
import { AchievementAlert } from "./AchievementAlert";

interface AchievementsProps {
  level: number;
  highestCombo: number;
  highestScore: number;
}

// Displays highest score, highest combo (by 5), and player level.
export const Achievements: React.FC<AchievementsProps> = ({
  level,
  highestCombo,
  highestScore,
}) => (
  <main className="flex flex-col items-center justify-start p-6 space-y-6">
    <AchievementAlert
      label="Level Reached"
      value={level}
      icon={<Medal className="h-4 w-4 text-yellow-500" />}
      step={1}
      type="level"
    />
    <AchievementAlert
      label="Highest Combo"
      value={highestCombo}
      icon={<Star className="h-4 w-4 text-yellow-500" />}
      step={5} // Combo increments by 5
      type="combo"
    />
    <AchievementAlert
      label="Highest Score"
      value={highestScore}
      icon={<Trophy className="h-4 w-4 text-yellow-500" />}
      step={1} // Score steps are defined in level.ts
      type="score"
    />
  </main>
);
