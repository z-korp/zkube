import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMediaQuery } from "react-responsive";
import { Button } from "@/ui/elements/button";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import type { InfoStep, InfoItem } from "./tutorialSteps";
import CubeIcon from "@/ui/components/CubeIcon";

interface TutorialInfoStepProps {
  step: InfoStep;
  onContinue: () => void;
  onSkip?: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * Responsive info step component for tutorial
 * Displays information about game mechanics without requiring interaction with the grid
 */
const TutorialInfoStep: React.FC<TutorialInfoStepProps> = ({
  step,
  onContinue,
  onSkip,
  currentStep,
  totalSteps,
}) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const getIconForItem = (item: InfoItem): string => {
    if (item.icon === "wave") return imgAssets.wave;
    if (item.icon === "supply") return imgAssets.supply;
    if (item.icon === "bonus") return imgAssets.combo;
    if (item.icon === "levelup") return imgAssets.score;
    if (item.icon === "refill") return imgAssets.wave;
    return imgAssets.logo;
  };

  const renderBonusesInfo = () => (
    <div className="space-y-4">
      {step.items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.15 }}
          className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-700/50 rounded-lg">
            <img
              src={getIconForItem(item)}
              alt={item.name}
              className="w-8 h-8 opacity-60"
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-purple-400">{item.name}</div>
            <div className={`text-slate-400 ${isMdOrLarger ? "text-sm" : "text-xs"}`}>
              {item.desc}
            </div>
          </div>
          <div className="text-xs text-slate-500 px-2 py-1 bg-slate-900/50 rounded">
            Locked
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderCubesInfo = () => (
    <div className="space-y-3">
      {step.items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-2">
            {Array.from({ length: item.cubes || 1 }).map((_, i) => (
              <span key={i} className="text-xl">
                <CubeIcon size="lg" />
              </span>
            ))}
          </div>
          <div className={`text-slate-300 ${isMdOrLarger ? "text-sm" : "text-xs"} text-right`}>
            {item.condition}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderShopInfo = () => (
    <div className="space-y-3">
      {step.items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.12 }}
          className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-600/20 rounded-lg">
            <img
              src={getIconForItem(item)}
              alt={item.name}
              className="w-6 h-6"
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-emerald-400">{item.name}</div>
            <div className={`text-slate-400 ${isMdOrLarger ? "text-sm" : "text-xs"}`}>
              {item.desc}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderBossInfo = () => (
    <div className="space-y-4">
      {step.items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15 }}
          className="p-4 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg border border-red-700/50"
        >
          {item.level && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold px-2 py-1 rounded bg-gradient-to-r from-red-600 to-orange-500 text-white uppercase tracking-wide">
                Boss
              </span>
              <span className="text-white font-semibold">Levels {item.level}</span>
            </div>
          )}
          {item.reward && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎁</span>
              <span className="text-yellow-400 font-semibold">{item.reward}</span>
            </div>
          )}
          <div className={`text-slate-300 ${isMdOrLarger ? "text-sm" : "text-xs"}`}>
            {item.desc}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (step.infoType) {
      case "bonuses":
        return renderBonusesInfo();
      case "cubes":
        return renderCubesInfo();
      case "shop":
        return renderShopInfo();
      case "boss":
        return renderBossInfo();
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`relative w-full ${
            isMdOrLarger ? "max-w-lg" : "max-w-sm"
          } bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={imgAssets.logo} alt="zKube" className="w-8 h-8" />
                <div>
                  <h2 className={`font-bold text-white ${isMdOrLarger ? "text-xl" : "text-lg"}`}>
                    {step.title}
                  </h2>
                  <div className="text-xs text-slate-500">
                    Step {currentStep} of {totalSteps}
                  </div>
                </div>
              </div>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  Skip Tutorial
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Description */}
          <div className="px-4 pt-4 pb-2">
            <p className={`text-slate-300 ${isMdOrLarger ? "text-base" : "text-sm"}`}>
              {isMdOrLarger ? step.description : step.mobileDescription || step.description}
            </p>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">{renderContent()}</div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <div className={`text-center text-slate-500 ${isMdOrLarger ? "text-sm" : "text-xs"} mb-4`}>
              {step.footer}
            </div>
            <Button
              onClick={onContinue}
              variant="default"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
            >
              {step.isComplete ? "Start Playing!" : "Continue"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialInfoStep;
