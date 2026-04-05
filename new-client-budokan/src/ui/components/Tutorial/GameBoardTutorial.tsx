import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useMediaQuery } from "react-responsive";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "../NextLine";
import type { Block } from "@/types/types";
import "../../../grid.css";
import TutorialGrid from "./TutorialGrid";
import { motion } from "motion/react";
import { Check, Flame } from "lucide-react";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  combo: number;
  maxCombo: number;
  comboCount: number;
  harvestCount: number;
  scoreCount: number;
  score: number;
  constraintSatisfied?: boolean;
  tutorialProps?: {
    step: number;
    totalSteps: number;
    targetBlock: { x: number; y: number; type: "block" | "row" }[] | null;
    isIntermission: boolean;
    onSkip?: () => void;
  };
  onBlockSelect?: (block: Block) => void;
  onUpdateState: (intermission: boolean) => void;
}

const GameBoardTutorial: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  combo,
  maxCombo,
  score,
  constraintSatisfied,
  tutorialProps,
  onBlockSelect,
  onUpdateState,
}) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const ROWS = 10;
  const COLS = 8;
  const GRID_SIZE = isMdOrLarger ? 50 : 40;

  const [isTxProcessing] = useState(false);
  const [nextLineHasBeenConsumed] = useState(false);
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticCombo, setOptimisticCombo] = useState(combo);

  const isConstraintStep = tutorialProps?.step === 5;

  const updateValue = () => {
    onUpdateState(true);
  };

  useEffect(() => {
    setOptimisticScore(score);
    setOptimisticCombo(combo);
  }, [initialGrid, score, combo, maxCombo]);

  const selectBlock = async (block: Block) => {
    if (onBlockSelect) onBlockSelect(block);
  };

  const memorizedInitialData = useMemo(() => {
    return transformDataContractIntoBlock(initialGrid);
  }, [initialGrid]);

  const memorizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
  }, [initialGrid]);

  if (memorizedInitialData.length === 0) return null;

  const currentStep = tutorialProps?.step ?? 1;
  const totalSteps = tutorialProps?.totalSteps ?? 8;
  const onSkip = tutorialProps?.onSkip;

  return (
    <>
      <Card
        className={`relative p-3 md:pt-4 bg-secondary ${
          isTxProcessing && "cursor-wait"
        } pb-2 md:pb-3`}
      >
        <div className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-3 px-1`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-slate-400 ${isMdOrLarger ? "text-sm" : "text-xs"} font-medium`}>
              Step {currentStep} of {totalSteps}
            </span>
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                Skip Tutorial
              </button>
            )}
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div
          className={`${
            isMdOrLarger ? "w-[420px]" : "w-[338px]"
          } mb-2 md:mb-3 flex justify-end px-1`}
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className={`text-slate-400 ${isMdOrLarger ? "text-xs" : "text-[10px]"}`}>
                Score
              </span>
              <span className={`font-bold text-blue-400 ${isMdOrLarger ? "text-xl" : "text-lg"}`}>
                {optimisticScore}
              </span>
            </div>

            {optimisticCombo > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded">
                <span className={`${isMdOrLarger ? "text-lg" : "text-base"} font-bold text-orange-400`}>
                  {optimisticCombo}
                </span>
                <Flame
                  className="text-orange-400"
                  size={isMdOrLarger ? 14 : 12}
                />
              </div>
            )}

            {isConstraintStep && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                constraintSatisfied
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-orange-500/20 border-orange-500/30"
              }`}>
                <span className={`${isMdOrLarger ? "text-xs" : "text-[10px]"} ${
                  constraintSatisfied ? "text-green-400" : "text-orange-400"
                } font-medium`}>
                  2+ lines
                </span>
                <Check
                  className={constraintSatisfied ? "text-green-400" : "text-slate-500"}
                  size={10}
                />
              </div>
            )}
          </div>
        </div>

        <div className={`${!isTxProcessing && "cursor-move"}`}>
          <TutorialGrid
            initialData={memorizedInitialData}
            nextLineData={memorizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            account={null}
            tutorialStep={tutorialProps?.step ?? 0}
            intermission={tutorialProps?.isIntermission}
            tutorialTargetBlock={tutorialProps?.targetBlock ?? null}
            onUpdate={updateValue}
          />
        </div>

        <div className="relative">
          <NextLine
            nextLineData={nextLineHasBeenConsumed ? [] : memorizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={1}
            gridWidth={COLS}
          />
        </div>
      </Card>
    </>
  );
};

export default GameBoardTutorial;
