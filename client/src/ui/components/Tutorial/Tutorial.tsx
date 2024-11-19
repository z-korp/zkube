import React, { useState, useCallback, useMemo } from "react";
import GameBoard from "../GameBoard";
import { BonusType } from "@/dojo/game/types/bonus";
import { ModeType } from "@/dojo/game/types/mode";
import GameBoardTutorial from "./GameBoardTutorial";

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
        <div className="absolute z-50 flex flex-col items-center p-6 rounded-lg shadow-md top-1/3">
          <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
          <p className="mb-4">
            You have successfully completed Step {tutorialStep}.
          </p>
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Continue to Next Step
          </button>
        </div>
      )}

      <div className="text-center p-4 bg-blue-600 rounded-md mb-4 absolute mt-40 z-50 w-11/12 mx-auto">
        <h2>
          <TutorialMessage />
        </h2>
      </div>

      {tutorialStep === 5 && (
        <button
          onClick={endTutorial}
          className="absolute z-50 mt-4 bg-white text-black px-4 py-3 rounded-md"
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
