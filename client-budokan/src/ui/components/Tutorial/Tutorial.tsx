import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import GameBoardTutorial from "./GameBoardTutorial";
import TutorialInfoStep from "./TutorialInfoStep";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { BonusType } from "@/dojo/game/types/bonus";
import type { Block } from "@/types/types";

// localStorage key for tutorial progress
const TUTORIAL_PROGRESS_KEY = "zkube_tutorial_step";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/elements/alert-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/ui/elements/button";
import { motion } from "framer-motion";

import {
  TUTORIAL_STEPS,
  TOTAL_TUTORIAL_STEPS,
  getGridForStep,
  getStepById,
  isInfoStep,
  isBonusStep,
  type TutorialStep,
  type MockGridState,
  type TutorialTarget,
} from "./tutorialSteps";

interface TutorialProps {
  showGrid: boolean;
  endTutorial: () => void;
}

// Load saved tutorial step from localStorage
const loadSavedStep = (): number => {
  try {
    const saved = localStorage.getItem(TUTORIAL_PROGRESS_KEY);
    if (saved) {
      const step = parseInt(saved, 10);
      if (step >= 1 && step <= TOTAL_TUTORIAL_STEPS) {
        return step;
      }
    }
  } catch (e) {
    console.warn("Failed to load tutorial progress:", e);
  }
  return 1;
};

// Save tutorial step to localStorage
const saveTutorialStep = (step: number) => {
  try {
    localStorage.setItem(TUTORIAL_PROGRESS_KEY, step.toString());
  } catch (e) {
    console.warn("Failed to save tutorial progress:", e);
  }
};

// Clear tutorial progress from localStorage
const clearTutorialProgress = () => {
  try {
    localStorage.removeItem(TUTORIAL_PROGRESS_KEY);
  } catch (e) {
    console.warn("Failed to clear tutorial progress:", e);
  }
};

const Tutorial: React.FC<TutorialProps> = ({ showGrid, endTutorial }) => {
  // Load initial step from localStorage
  const initialStep = useMemo(() => loadSavedStep(), []);
  
  const [tutorialStep, setTutorialStep] = useState(initialStep);
  const [isIntermission, setIsIntermission] = useState(false);
  const [gridState, setGridState] = useState<MockGridState>(getGridForStep(initialStep));

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  // Save progress whenever step changes
  useEffect(() => {
    saveTutorialStep(tutorialStep);
  }, [tutorialStep]);

  // Get current step configuration
  const currentStepConfig = useMemo(() => {
    return getStepById(tutorialStep);
  }, [tutorialStep]);

  // Check if current step is an info step
  const isCurrentStepInfo = useMemo(() => {
    return currentStepConfig ? isInfoStep(currentStepConfig) : false;
  }, [currentStepConfig]);

  // Get target blocks for current step
  const tutorialTargetBlock: TutorialTarget[] | null = useMemo(() => {
    if (!currentStepConfig) return null;
    
    if (isInfoStep(currentStepConfig)) return null;
    
    if (isBonusStep(currentStepConfig)) {
      return [currentStepConfig.targetBlock];
    }
    
    // Interactive step
    if ("targetBlock" in currentStepConfig && currentStepConfig.targetBlock) {
      return [currentStepConfig.targetBlock];
    }
    
    return null;
  }, [currentStepConfig]);

  // Handle block selection in tutorial
  const handleBlockSelect = useCallback(
    async (block: Block) => {
      if (!currentStepConfig) return;

      // For bonus steps (4, 5, 6) and interactive steps (1, 2, 3, 8)
      switch (tutorialStep) {
        case 1: // Move blocks
          if (block.y === 8) {
            setGridState((prev) => ({ ...prev, score: prev.score + 100 }));
            setIsIntermission(true);
          }
          break;
        case 2: // Clear lines
          // Any line clear triggers success
          setGridState((prev) => ({ ...prev, score: prev.score + 150 }));
          setIsIntermission(true);
          break;
        case 3: // Combos
          // Combo achieved
          setGridState((prev) => ({
            ...prev,
            score: prev.score + 300,
            combo: 2,
            maxCombo: 2,
          }));
          setIsIntermission(true);
          break;
        case 4: // Hammer
          if (block.y === 9 && block.x >= 6) {
            setGridState((prev) => ({
              ...prev,
              score: prev.score + 25,
              hammerCount: prev.hammerCount - 1,
            }));
            setIsIntermission(true);
          }
          break;
        case 5: // Wave
          if (block.y === 8) {
            setGridState((prev) => ({
              ...prev,
              score: prev.score + 200,
              waveCount: prev.waveCount - 1,
            }));
            setIsIntermission(true);
          }
          break;
        case 6: // Totem
          if (block.width === 3) {
            setGridState((prev) => ({
              ...prev,
              score: prev.score + 150,
              totemCount: prev.totemCount - 1,
            }));
            setIsIntermission(true);
          }
          break;
        case 8: // Constraints
          // Multi-line clear triggers constraint success
          setGridState((prev) => ({ 
            ...prev, 
            score: prev.score + 250,
            combo: 2,
            maxCombo: 2,
            constraintSatisfied: true,
          }));
          setIsIntermission(true);
          break;
        default:
          break;
      }
    },
    [tutorialStep, currentStepConfig],
  );

  // Handle state update from grid
  const handleUpdateState = (intermission: boolean) => {
    setIsIntermission(intermission);
  };

  // Handle continue to next step
  const handleContinue = useCallback(() => {
    const nextStep = tutorialStep + 1;
    
    if (nextStep > TOTAL_TUTORIAL_STEPS) {
      // Tutorial complete - clear progress
      clearTutorialProgress();
      endTutorial();
      return;
    }

    setIsIntermission(false);
    setTutorialStep(nextStep);
    
    // Load grid for next step if it's not an info step
    const nextStepConfig = getStepById(nextStep);
    if (nextStepConfig && !isInfoStep(nextStepConfig)) {
      setGridState(getGridForStep(nextStep));
    }
  }, [tutorialStep, endTutorial]);

  // Handle skip tutorial
  const handleSkipTutorial = useCallback(() => {
    clearTutorialProgress();
    endTutorial();
  }, [endTutorial]);

  // Get header and message for current step
  const TutorialHeader = () => {
    if (!currentStepConfig) return "";
    return `Step ${tutorialStep}: ${currentStepConfig.title}`;
  };

  const TutorialMessage = () => {
    if (!currentStepConfig) return "";
    return isMdOrLarger 
      ? currentStepConfig.description 
      : currentStepConfig.mobileDescription || currentStepConfig.description;
  };

  const TutorialImage = () => {
    if (!currentStepConfig) return null;
    
    if (isBonusStep(currentStepConfig)) {
      switch (currentStepConfig.bonusType) {
        case BonusType.Hammer:
          return <img className="w-8 h-8" src={imgAssets.hammer} alt="Hammer" />;
        case BonusType.Wave:
          return <img className="w-8 h-8" src={imgAssets.wave} alt="Wave" />;
        case BonusType.Totem:
          return <img className="w-8 h-8" src={imgAssets.tiki} alt="Totem" />;
        default:
          return null;
      }
    }
    
    return null;
  };

  if (!showGrid) return null;

  // Render info step
  if (isCurrentStepInfo && currentStepConfig && isInfoStep(currentStepConfig)) {
    return (
      <TutorialInfoStep
        step={currentStepConfig}
        onContinue={handleContinue}
        onSkip={handleSkipTutorial}
        currentStep={tutorialStep}
        totalSteps={TOTAL_TUTORIAL_STEPS}
      />
    );
  }

  // Render interactive/bonus step
  return (
    <div className="flex flex-col items-center relative h-full mx-6">
      {/* Intermission Dialog */}
      <AlertDialog open={isIntermission}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center justify-center gap-2 text-2xl">
                <img
                  className="w-12 h-12"
                  src={imgAssets.logo}
                  alt="zKube logo"
                />
                <h1>Congratulations!</h1>
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription></AlertDialogDescription>
            <div className="flex flex-col items-center justify-center gap-6 text-sm text-muted-foreground">
              <FontAwesomeIcon size="2x" icon={faTrophy} color="gold" />
              <p>You have successfully completed Step {tutorialStep}.</p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={handleContinue} variant="shimmer">
              Continue to Next Step
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tutorial Instruction Overlay */}
      {!isIntermission && (
        <div className="text-center p-4 bg-slate-700 rounded-md mb-4 absolute mt-52 z-50 w-11/12 mx-auto border border-2 border-white">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex gap-4 items-center">
              <img className="w-8 h-8" src={imgAssets.logo} alt="zKube" />
              <h1 className={`${isMdOrLarger ? "text-2xl" : "text-xl"}`}>
                <TutorialHeader />
              </h1>
            </div>
            <h2 className={`${isMdOrLarger ? "text-base" : "text-sm"} text-slate-300`}>
              <TutorialMessage />
            </h2>
            <TutorialImage />
          </div>
        </div>
      )}

      {/* Game Board */}
      <GameBoardTutorial
        {...gridState}
        onBlockSelect={handleBlockSelect}
        tutorialProps={{
          step: tutorialStep,
          totalSteps: TOTAL_TUTORIAL_STEPS,
          targetBlock: tutorialTargetBlock,
          isIntermission,
          onSkip: handleSkipTutorial,
        }}
        onUpdateState={handleUpdateState}
      />
    </div>
  );
};

export default Tutorial;
