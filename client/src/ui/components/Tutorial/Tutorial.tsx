import React, { useState, useCallback, useMemo } from "react";
import GameBoardTutorial from "./GameBoardTutorial";
import { Button } from "@/ui/elements/button";

interface TutorialProps {
  showGrid: boolean;
  endTutorial: () => void;
}

const tutorialInitialState = {
  hammerCount: 3,
  waveCount: 2,
  totemCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 2, 0, 0, 0, 0],
    [0, 1, 2, 3, 0],
    [2, 0, 0, 3, 2],
    [1, 0, 2, 2, 0, 0, 1, 1],
    [3, 0, 0, 1, 0, 0, 2],
  ],
  nextLine: [4, 0, 0, 0, 0, 1, 0, 0],
};

const Tutorial: React.FC<TutorialProps> = ({ showGrid, endTutorial }) => {
  const [tutorialStep, setTutorialStep] = useState(1);
  const [isIntermission, setIsIntermission] = useState(false);
  const [state, setState] = useState(tutorialInitialState);

  const handleBlockSelect = useCallback(
    async (block: any) => {
      // Logique spécifique au tutoriel selon l'étape
      switch (tutorialStep) {
        case 1:
          if (block.y === 8 && block.x === 2) {
            setState((prev) => ({ ...prev, score: prev.score + 100 }));
            setIsIntermission(true);
          }
          break;
        case 2:
          if (block.y === 9 && block.x === 6) {
            setState((prev) => ({
              ...prev,
              score: prev.score + 25,
              hammerCount: prev.hammerCount - 1,
            }));
            setIsIntermission(true);
          }
          break;
        // ... autres étapes
      }
    },
    [tutorialStep],
  );

  const handleUpdateState = (intermission: boolean) => {
    setIsIntermission(intermission);
  };

  const tutorialTargetBlock = useMemo(() => {
    switch (tutorialStep) {
      case 1:
        return { x: 2, y: 8, type: "block" };
      case 2:
        return { x: 6, y: 9, type: "block" };
      case 3:
        return { x: 0, y: 8, type: "row" };
      case 4:
        return { x: 0, y: 9, type: "block" };
      default:
        return null;
    }
  }, [tutorialStep]);

  const handleContinue = () => {
    if (tutorialStep >= 5) return;
    setIsIntermission(false);
    setTutorialStep((prev) => prev + 1);
  };

  const TutorialMessage = () => {
    switch (tutorialStep) {
      case 1:
        return "Step 1: Move the highlighted block two steps to the right.";
      case 2:
        return "Step 2: Use the hammer bonus on the highlighted block.";
      case 3:
        return "Step 3: Use the wave bonus on the highlighted row.";
      case 4:
        return "Step 4: Use the totem bonus on the highlighted block.";
      case 5:
        return "Tutorial complete! Click below to start playing.";
      default:
        return "";
    }
  };

  if (!showGrid) return null;

  return (
    <div className="flex flex-col items-center relative h-full mx-6">
      {isIntermission && (
        <div className="absolute bg-black/90  flex flex-col gap-12 items-center p-6 top-1/3 z-50">
          <h1 className="text-4xl">Congratulations!</h1>
          <p>You have successfully completed Step {tutorialStep}.</p>
          <Button onClick={handleContinue}>Continue to Next Step</Button>
        </div>
      )}

      {!isIntermission && (
        <div className="text-center p-4 bg-teal-600 rounded-md mb-4 absolute mt-40 z-50 w-11/12 mx-auto">
          <h2>
            <TutorialMessage />
          </h2>
        </div>
      )}

      {tutorialStep === 5 && (
        <button
          onClick={endTutorial}
          className="absolute z-50 mt-4 bg-white text-black px-4 py-3 top-1/2 rounded-md"
        >
          Exit Tutorial
        </button>
      )}

      <GameBoardTutorial
        {...state}
        account={null}
        onBlockSelect={handleBlockSelect}
        tutorialProps={{
          step: tutorialStep,
          targetBlock: tutorialTargetBlock,
          isIntermission,
        }}
        onUpdateState={handleUpdateState}
      />
    </div>
  );
};

export default Tutorial;
