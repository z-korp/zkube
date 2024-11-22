import React, { useState, useCallback, useMemo } from "react";
import GameBoardTutorial from "./GameBoardTutorial";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/elements/alert-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
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
    [3, 3, 3, 2, 2, 0, 0, 0],
    [0, 1, 2, 2, 0, 0, 0, 0],
    [2, 2, 0, 0, 4, 4, 4, 4],
    [1, 0, 2, 2, 0, 0, 2, 2],
    [3, 3, 3, 1, 0, 0, 2, 2],
  ],
  nextLine: [4, 4, 4, 4, 0, 0, 0, 0],
};

const Tutorial: React.FC<TutorialProps> = ({ showGrid, endTutorial }) => {
  const [tutorialStep, setTutorialStep] = useState(1);
  const [isIntermission, setIsIntermission] = useState(false);
  const [state, setState] = useState(tutorialInitialState);

  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

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

  const tutorialTargetBlock:
    | {
        x: number;
        y: number;
        type: "block" | "row";
      }[]
    | null = useMemo(() => {
    switch (tutorialStep) {
      case 1:
        return [{ x: 2, y: 8, type: "block" }];
      case 2:
        return [{ x: 6, y: 9, type: "block" }];
      case 3:
        return [{ x: 0, y: 8, type: "row" }];
      case 4:
        return [
          { x: 0, y: 9, type: "block" },
          { x: 0, y: 8, type: "block" },
        ];
      default:
        return null;
    }
  }, [tutorialStep]);

  const handleContinue = () => {
    if (tutorialStep >= 5) return;
    setIsIntermission(false);
    setTutorialStep((prev) => prev + 1);
  };

  const TutorialHeader = () => {
    switch (tutorialStep) {
      case 1:
        return "Step 1 : Move";
      case 2:
        return "Step 2 : Hammer";
      case 3:
        return "Step 3 : Wave";
      case 4:
        return "Step 4 : Tiki";
      case 5:
        return "Tutorial complete!";
      default:
        return "";
    }
  };

  const TutorialMessage = () => {
    switch (tutorialStep) {
      case 1:
        return "Move the highlighted block two steps to the right.";
      case 2:
        return "Use the hammer bonus on the highlighted block.";
      case 3:
        return "Use the wave bonus on the highlighted row.";
      case 4:
        return "Use the totem bonus on the highlighted block.";
      case 5:
        return "Click below to start playing.";
      default:
        return "";
    }
  };

  const TutorialImage = () => {
    switch (tutorialStep) {
      case 1:
        return <></>;
      case 2:
        return <img className="w-8 h-8" src={imgAssets.hammer} />;
      case 3:
        return <img className="w-8 h-8" src={imgAssets.wave} />;
      case 4:
        return <img className="w-8 h-8" src={imgAssets.tiki} />;
      case 5:
        return <></>;
      default:
        return <></>;
    }
  };

  if (!showGrid) return null;

  return (
    <div className="flex flex-col items-center relative h-full mx-6">
      <AlertDialog open={isIntermission}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center justify-center gap-2 text-2xl">
                <img
                  className="w-12 h-12"
                  src={imgAssets.logo}
                  alt="tiki image"
                ></img>
                <h1> Congratulations !</h1>
              </div>
            </AlertDialogTitle>
            <br></br>
            <br></br>
            <AlertDialogDescription></AlertDialogDescription>
            <div className="flex flex-col items-center justify-center gap-6 text-sm text-muted-foreground">
              <FontAwesomeIcon size="2x" icon={faTrophy} color="gold" />
              <p>You have successfully completed Step {tutorialStep}.</p>
            </div>
          </AlertDialogHeader>
          <br></br>
          <AlertDialogFooter>
            <Button onClick={handleContinue} variant="shimmer">
              Continue to Next Step
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isIntermission && (
        <div className="text-center p-4 bg-slate-700 rounded-md mb-4 absolute mt-40 z-50 w-11/12 mx-auto border border-2 border-white">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex gap-4">
              <img className="w-8 h-8" src={imgAssets.logo} />
              <h1 className="text-2xl">
                <TutorialHeader />
              </h1>
            </div>
            <h2>
              <TutorialMessage />
            </h2>
            <TutorialImage />
          </div>
        </div>
      )}

      {tutorialStep === 5 && (
        <Button
          onClick={endTutorial}
          variant={"default"}
          className="absolute z-50 top-1/2 text-xl"
          size={"lg"}
        >
          Exit Tutorial
        </Button>
      )}

      <GameBoardTutorial
        {...state}
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
