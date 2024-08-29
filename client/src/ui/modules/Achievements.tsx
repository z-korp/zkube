import { Alert, AlertDescription, AlertTitle } from "@/ui/elements/alert";
import { Trophy, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Game } from "@/dojo/game/models/game";
import { useTheme } from "@/ui/elements/theme-provider";
import getElementStyle from "../theme/GetElementStyle";

interface AchievementsProps {
  gamesByThresholds: { threshold: number; games: Game[] }[];
  combosByThresholds: { threshold: number; games: Game[] }[];
}

const AchievementAlert: React.FC<{
  threshold: number;
  games: Game[];
  type: "score" | "combo";
}> = ({ threshold, type }) => {
  const { themeTemplate } = useTheme();
  const backgroundStyle = getElementStyle("stone3", themeTemplate);

  return (
    <Alert
      key={`${type}-${threshold}`}
      style={{
        ...backgroundStyle,
      }}
    >
      <div className="w-full h-full bg-black/70 px-4 py-3">
        <motion.div
          initial={{ scale: 0.2, rotate: 0 }}
          animate={{
            scale: [0.2, 2, 1],
            rotate: [0, 15, -15, 15, -15, 0],
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            display: "inline-block",
          }}
        >
          {type === "score" ? (
            <Trophy className="h-4 w-4 text-yellow-500" />
          ) : (
            <Star className="h-4 w-4 text-yellow-500" />
          )}
        </motion.div>
        <AlertTitle className="drop-shadow-lg text-white font-bold">
          {type === "score"
            ? "Achievement Unlocked !"
            : "Combo Achievement Unlocked !"}
        </AlertTitle>
        <span>
          <AlertDescription className="text-white font-bold">
            {type === "score"
              ? <>You reached a score of <span className="text-yellow-500">{threshold} </span> points !</>
              : <>You reached a combo of <span className="text-yellow-500">{threshold}</span> !</>}

          </AlertDescription>

        </span>
      </div>
    </Alert>
  );
};

export const Achievements: React.FC<AchievementsProps> = ({
  gamesByThresholds,
  combosByThresholds,
}) => (
    <main className="flex flex-col items-center justify-start p-6 space-y-6">
      {gamesByThresholds.map(
        ({ threshold, games }) =>
          games.length > 0 && (
            <AchievementAlert
              key={`score-${threshold}`}
              threshold={threshold}
              games={games}
              type="score"
            />
          ),
      )}
      {combosByThresholds.map(
        ({ threshold, games }) =>
          games.length > 0 && (
            <AchievementAlert
              key={`combo-${threshold}`}
              threshold={threshold}
              games={games}
              type="combo"
            />
          ),
      )}
    </main>
);