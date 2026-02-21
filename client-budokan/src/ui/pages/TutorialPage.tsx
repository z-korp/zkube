import { motion } from "motion/react";
import {
  ArrowLeftRight,
  BadgePlus,
  Bomb,
  Cuboid,
  Swords,
  Trophy,
} from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import GameButton from "@/ui/components/shared/GameButton";
import PageTopBar from "@/ui/navigation/PageTopBar";

const tutorialSteps = [
  {
    title: "Slide blocks",
    text: "Drag a block row left or right to line things up.",
    icon: ArrowLeftRight,
  },
  {
    title: "Clear lines",
    text: "Fill a full horizontal line to break it and gain points.",
    icon: Cuboid,
  },
  {
    title: "Build combos",
    text: "Clear multiple lines in one move to multiply rewards.",
    icon: BadgePlus,
  },
  {
    title: "Use bonuses",
    text: "Spend charges at the right time to save difficult boards.",
    icon: Bomb,
  },
  {
    title: "Beat levels",
    text: "Reach target score and constraints before you run out of moves.",
    icon: Swords,
  },
  {
    title: "Earn cubes",
    text: "Finished runs mint CUBEs you can spend on upgrades.",
    icon: Trophy,
  },
] as const;

const TutorialPage: React.FC = () => {
  const goBack = useNavigationStore((state) => state.goBack);

  const handleDone = () => {
    localStorage.setItem("tutorialSeen", "true");
    goBack();
  };

  return (
    <div className="h-screen-viewport flex flex-col">
      <ThemeBackground />

      <PageTopBar title="HOW TO PLAY" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[760px] mx-auto pb-8">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60"
          >
            <h2 className="font-['Fredericka_the_Great'] text-xl text-white mb-4">
              Quick Guide
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {tutorialSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.article
                    key={step.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-600/40"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-['Fredericka_the_Great'] text-cyan-200 text-lg tracking-wider">
                        {index + 1}
                      </span>
                      <Icon size={16} className="text-cyan-300" />
                      <h3 className="font-['Fredericka_the_Great'] text-white text-base">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{step.text}</p>
                  </motion.article>
                );
              })}
            </div>

            <GameButton label="GOT IT" variant="primary" onClick={handleDone} />
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
