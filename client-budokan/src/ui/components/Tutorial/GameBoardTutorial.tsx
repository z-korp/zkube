import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useMediaQuery } from "react-responsive";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "../NextLine";
import type { Block } from "@/types/types";
import { BonusType } from "@/dojo/game/types/bonus";
import "../../../grid.css";
import TutorialGrid from "./TutorialGrid";
import BonusButton from "../BonusButton";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
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
  harvestCount,
  comboCount,
  scoreCount,
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

  const [isTxProcessing, setIsTxProcessing] = useState(false);
  // State that will allow us to hide or display the next line
  const [nextLineHasBeenConsumed] = useState(false);
  // Optimistic data (score, combo, maxcombo)
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticCombo, setOptimisticCombo] = useState(combo);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(maxCombo);
  
  // Check if current step is the constraint step
  const isConstraintStep = tutorialProps?.step === 8;
  const [bonusDescription, setBonusDescription] = useState("");
  const [disableScore, setDisableScore] = useState(false);
  const [highlightedScore, setHighlightedScore] = useState(false);
  const [disableWave, setDisableWave] = useState(false);
  const [highlightedWave, setHighlightedWave] = useState(false);
  const [disableCombo, setDisableCombo] = useState(false);
  const [highlightedCombo, setHighlightedCombo] = useState(false);

  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const updateValue = () => {
    onUpdateState(true);
  };

  useEffect(() => {
    // Every time the initial grid changes, we erase the optimistic data
    // and set the data to the one returned by the contract
    // just in case of discrepancies
    setOptimisticScore(score);
    setOptimisticCombo(combo);
    setOptimisticMaxCombo(maxCombo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGrid, score, combo, maxCombo]);
  const [bonus, setBonus] = useState<BonusType>(BonusType.None);

  const handleBonusWaveClick = () => {
    if (harvestCount === 0) return;
    if (bonus === BonusType.Harvest) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(BonusType.Harvest);
      setBonusDescription("Select a row to clear");
    }
  };

  const handleBonusScoreClick = () => {
    if (scoreCount === 0) return;
    if (bonus === BonusType.Score) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(BonusType.Score);
      setBonusDescription("Select a block size to harvest");
    }
  };

  const handleBonusComboClick = () => {
    if (comboCount === 0) return;
    if (bonus === BonusType.Combo) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(BonusType.Combo);
      setBonusDescription("Select a block for combo bonus");
    }
  };

  const handleBonusWaveTx = useCallback(async () => {
    setIsTxProcessing(true);
    try {
      // await applyBonus({
      //   account: account as Account,
      //   bonus: new Bonus(BonusType.Harvest).into(),
      //   row_index: ROWS - rowIndex - 1,
      //   block_index: 0,
      // });
    } finally {
      //setIsLoading(false);
    }
  }, []);

  const handleBonusComboTx = useCallback(async () => {
    setIsTxProcessing(true);
    try {
      // await applyBonus({
      //   account: account as Account,
      //   bonus: new Bonus(BonusType.Combo).into(),
      //   row_index: ROWS - rowIndex - 1,
      //   block_index: colIndex,
      // });
    } finally {
      //setIsLoading(false);
    }
  }, []);

  const handleBonusScoreTx = useCallback(async () => {
    setIsTxProcessing(true);
    try {
      // await applyBonus({
      //   account: account as Account,
      //   bonus: new Bonus(BonusType.Score).into(),
      //   row_index: ROWS - rowIndex - 1,
      //   block_index: colIndex,
      // });
    } finally {
      //setIsLoading(false);
    }
  }, []);

  const selectBlock = useCallback(
    async (block: Block) => {
      if (onBlockSelect) onBlockSelect(block);

      if (bonus === BonusType.Harvest) {
        handleBonusWaveTx();
      } else if (bonus === BonusType.Score) {
        handleBonusScoreTx();
      } else if (bonus === BonusType.Combo) {
        handleBonusComboTx();
      }
    },
    [bonus, handleBonusWaveTx, handleBonusScoreTx, handleBonusComboTx]
  );

  useEffect(() => {
    // Reset the isTxProcessing state and the bonus state when the grid changes
    // meaning the tx as been processed, and the client state updated
    setBonus(BonusType.None);
    setBonusDescription("");
  }, [initialGrid]);

  const memorizedInitialData = useMemo(() => {
    return transformDataContractIntoBlock(initialGrid);
  }, [initialGrid]);

  const memorizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
    // initialGrid on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGrid]);

  if (memorizedInitialData.length === 0) return null; // otherwise sometimes
  // the grid is not displayed in Grid because the data is not ready

  // Extract tutorial progress info
  const currentStep = tutorialProps?.step ?? 1;
  const totalSteps = tutorialProps?.totalSteps ?? 11;
  const onSkip = tutorialProps?.onSkip;

  return (
    <>
      <Card
        className={`relative p-3 md:pt-4 bg-secondary ${
          isTxProcessing && "cursor-wait"
        } pb-2 md:pb-3`}
      >
        {/* Tutorial Progress Header */}
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
          } mb-2 md:mb-3 flex justify-between px-1`}
        >
          <div className="w-5/12">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-start">
                <BonusButton
                  onClick={handleBonusComboClick}
                  urlImage={imgAssets.combo}
                  bonusCount={comboCount}
                  tooltipText="Add combo to next move"
                  bonusName={BonusType.Combo}
                  bonus={bonus}
                  disabled={disableCombo}
                  highlighted={highlightedCombo}
                />
              </div>
              <div className="flex flex-col items-center">
                <BonusButton
                  onClick={handleBonusWaveClick}
                  urlImage={imgAssets.harvest}
                  bonusCount={harvestCount}
                  tooltipText="Destroy all blocks of chosen size"
                  bonusName={BonusType.Harvest}
                  bonus={bonus}
                  disabled={disableWave}
                  highlighted={highlightedWave}
                />
              </div>
              <div className="flex flex-col w-full items-end">
                <BonusButton
                  onClick={handleBonusScoreClick}
                  urlImage={imgAssets.score}
                  bonusCount={scoreCount}
                  tooltipText="Add bonus score"
                  bonusName={BonusType.Score}
                  bonus={bonus}
                  disabled={disableScore}
                  highlighted={highlightedScore}
                />
              </div>
            </div>
          </div>
          
          {/* Tutorial Score Display */}
          <div className="flex items-center gap-4">
            {/* Score */}
            <div className="flex flex-col items-end">
              <span className={`text-slate-400 ${isMdOrLarger ? "text-xs" : "text-[10px]"}`}>
                Score
              </span>
              <span className={`font-bold text-blue-400 ${isMdOrLarger ? "text-xl" : "text-lg"}`}>
                {optimisticScore}
              </span>
            </div>
            
            {/* Combo indicator */}
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
            
            {/* Constraint indicator for step 8 */}
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

        <div
          className={`flex justify-center items-center ${
            !isTxProcessing && "cursor-move"
          }`}
        >
          <TutorialGrid
            initialData={memorizedInitialData}
            nextLineData={memorizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={bonus}
            account={null}
            tutorialStep={tutorialProps?.step ?? 0}
            intermission={tutorialProps?.isIntermission}
            tutorialTargetBlock={tutorialProps?.targetBlock ?? null}
            onUpdate={updateValue}
            ref={setBonus}
            setDisabledScore={setDisableScore}
            setHighlightedScore={setHighlightedScore}
            setDisabledWave={setDisableWave}
            setHighlightedWave={setHighlightedWave}
            setDisabledCombo={setDisableCombo}
            setHighlightedCombo={setHighlightedCombo}
          />
        </div>

        <div className="relative">
          <div className="absolute z-50 text-lg w-full flex justify-center items-center mt-2 md:mt-3 left-1/2 transform -translate-x-1/2">
            {bonus !== BonusType.None && (
              <h1
                className={`text-yellow-500 p-2 rounded font-bold ${
                  bonusDescription.length > 20 ? "text-sm" : "text-2xl"
                } md:text-lg bg-black bg-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis`}
              >
                {bonusDescription}
              </h1>
            )}
          </div>
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
